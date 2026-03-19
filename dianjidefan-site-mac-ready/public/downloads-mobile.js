(function () {
  const bootstrapNode = document.getElementById("downloads-mobile-bootstrap");
  if (!bootstrapNode) return;

  const bootstrap = JSON.parse(bootstrapNode.textContent || "{}");
  const sampleCards = Array.isArray(bootstrap.demoCards) ? bootstrap.demoCards : [];
  const storageKey = typeof bootstrap.storageKey === "string" && bootstrap.storageKey
    ? bootstrap.storageKey
    : "downloads-checkout:mobile:v1";
  const copy = {
    sampleReady: "手机版示例队列已经就绪。你也可以直接从文件 App 选一批最近下载。",
    sampleReloaded: "已重新载入手机版示例队列。",
    restored: "已恢复你上一轮手机文件账单。",
    cleared: "这一轮已经清空。可以重新选文件，或再载入一轮示例。",
    ...(bootstrap.copy && typeof bootstrap.copy === "object" ? bootstrap.copy : {})
  };

  const refs = {
    queueTitle: document.getElementById("mobile-queue-title"),
    index: document.getElementById("mobile-index"),
    total: document.getElementById("mobile-total"),
    kicker: document.getElementById("mobile-kicker"),
    title: document.getElementById("mobile-title"),
    meta: document.getElementById("mobile-meta"),
    message: document.getElementById("mobile-message"),
    tags: document.getElementById("mobile-tags"),
    reasons: document.getElementById("mobile-reasons"),
    feedback: document.getElementById("mobile-feedback"),
    processed: document.getElementById("mobile-processed"),
    released: document.getElementById("mobile-released"),
    lightness: document.getElementById("mobile-lightness"),
    remaining: document.getElementById("mobile-remaining"),
    receipts: document.getElementById("mobile-receipts"),
    fileInput: document.getElementById("mobile-file-input"),
    importFiles: document.getElementById("mobile-import-files"),
    sourceStatus: document.getElementById("mobile-source-status"),
    loadSample: document.getElementById("mobile-load-sample"),
    clearSession: document.getElementById("mobile-clear-session"),
    undo: document.getElementById("mobile-undo"),
    actionButtons: document.querySelectorAll("[data-mobile-action]"),
    sourceCount: document.getElementById("mobile-source-count"),
    loadedCount: document.getElementById("mobile-loaded-count"),
    archivedCount: document.getElementById("mobile-archived-count"),
    archivedList: document.getElementById("mobile-archived-list"),
    restoreArchived: document.getElementById("mobile-restore-archived"),
    deferredCount: document.getElementById("mobile-deferred-count"),
    deferredList: document.getElementById("mobile-deferred-list"),
    resumeDeferred: document.getElementById("mobile-resume-deferred"),
    dropCount: document.getElementById("mobile-drop-count"),
    dropTotal: document.getElementById("mobile-drop-total"),
    dropList: document.getElementById("mobile-drop-list"),
    restoreDropped: document.getElementById("mobile-restore-dropped"),
    exportDrops: document.getElementById("mobile-export-drops"),
    installApp: document.getElementById("mobile-install-app"),
    installNote: document.getElementById("mobile-install-note"),
    previewLayer: document.getElementById("mobile-preview-layer"),
    previewBackdrop: document.getElementById("mobile-preview-backdrop"),
    previewClose: document.getElementById("mobile-preview-close"),
    previewTitle: document.getElementById("mobile-preview-title"),
    previewMeta: document.getElementById("mobile-preview-meta"),
    previewStatus: document.getElementById("mobile-preview-status"),
    previewImage: document.getElementById("mobile-preview-image"),
    previewFrame: document.getElementById("mobile-preview-frame"),
    previewVideo: document.getElementById("mobile-preview-video"),
    previewAudio: document.getElementById("mobile-preview-audio"),
    previewText: document.getElementById("mobile-preview-text"),
    previewEmpty: document.getElementById("mobile-preview-empty")
  };

  if (!refs.queueTitle || !refs.title) return;

  const runtimeFiles = new Map();
  let deferredInstallPrompt = null;
  let previewUrl = "";
  const cardBackgrounds = [
    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(254,242,224,0.96))",
    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,255,0.96))",
    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,238,255,0.96))",
    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(236,248,241,0.96))"
  ];
  const defaultStatus = refs.sourceStatus?.textContent || "";
  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const isIosSafari = () => {
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    return isIos && isSafari;
  };

  const state = {
    mode: "sample",
    pending: [],
    processed: 0,
    released: 0,
    lightness: 0,
    receipts: [],
    archived: [],
    deferred: [],
    dropped: [],
    history: [],
    sources: 0
  };

  const hasIndexedDb = typeof window !== "undefined" && "indexedDB" in window;
  const runtimeDbName = "downloads-checkout-mobile-runtime";
  const runtimeStoreName = "selected-files";
  const runtimeNamespace = `${storageKey}:runtime:`;
  let runtimeDbPromise = null;

  const runtimeKeyFor = (id) => `${runtimeNamespace}${id}`;

  const hoistPreviewLayer = () => {
    if (!refs.previewLayer || refs.previewLayer.parentElement === document.body) return;
    document.body.appendChild(refs.previewLayer);
  };

  const requestToPromise = (request) =>
    new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
    });

  const transactionToPromise = (transaction) =>
    new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted"));
      transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed"));
    });

  const openRuntimeDb = () => {
    if (!hasIndexedDb) return Promise.resolve(null);
    if (runtimeDbPromise) return runtimeDbPromise;

    runtimeDbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(runtimeDbName, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(runtimeStoreName)) {
            db.createObjectStore(runtimeStoreName, { keyPath: "key" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    return runtimeDbPromise;
  };

  const clearStoredFiles = async () => {
    const db = await openRuntimeDb();
    if (!db) return;

    try {
      const transaction = db.transaction(runtimeStoreName, "readwrite");
      const store = transaction.objectStore(runtimeStoreName);
      const keys = await requestToPromise(store.getAllKeys());
      keys
        .filter((key) => typeof key === "string" && key.startsWith(runtimeNamespace))
        .forEach((key) => store.delete(key));
      await transactionToPromise(transaction);
    } catch {
      // Ignore cache cleanup failures.
    }
  };

  const deleteStoredFiles = async (ids) => {
    if (!ids.length) return;

    const db = await openRuntimeDb();
    if (!db) return;

    try {
      const transaction = db.transaction(runtimeStoreName, "readwrite");
      const store = transaction.objectStore(runtimeStoreName);
      ids.forEach((id) => store.delete(runtimeKeyFor(id)));
      await transactionToPromise(transaction);
    } catch {
      // Ignore cache cleanup failures.
    }
  };

  const storeRuntimeFiles = async (cards, files) => {
    if (!cards.length || !files.length) return 0;

    const db = await openRuntimeDb();
    if (!db) return 0;

    try {
      const transaction = db.transaction(runtimeStoreName, "readwrite");
      const store = transaction.objectStore(runtimeStoreName);

      cards.forEach((card, index) => {
        const file = files[index];
        if (!card?.id || !(file instanceof Blob)) return;

        store.put({
          key: runtimeKeyFor(card.id),
          file,
          updatedAt: Date.now()
        });
      });

      await transactionToPromise(transaction);
      return cards.length;
    } catch {
      return 0;
    }
  };

  const getStoredFile = async (id) => {
    if (!id) return null;
    if (runtimeFiles.has(id)) return runtimeFiles.get(id);

    const db = await openRuntimeDb();
    if (!db) return null;

    try {
      const transaction = db.transaction(runtimeStoreName, "readonly");
      const store = transaction.objectStore(runtimeStoreName);
      const entry = await requestToPromise(store.get(runtimeKeyFor(id)));
      await transactionToPromise(transaction);

      if (entry?.file instanceof Blob) {
        runtimeFiles.set(id, entry.file);
        return entry.file;
      }

      return null;
    } catch {
      return null;
    }
  };

  const setInstallUi = ({ enabled = false, label = "安装到主屏幕", note = "PWA 正在准备安装能力。支持的浏览器里会出现安装入口。" } = {}) => {
    if (refs.installApp) {
      refs.installApp.disabled = !enabled;
      refs.installApp.textContent = label;
    }

    if (refs.installNote) {
      refs.installNote.textContent = note;
    }
  };

  const registerServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
      setInstallUi({
        enabled: false,
        label: "当前浏览器不支持安装",
        note: "这个浏览器不支持 service worker，所以当前页还不能以 PWA 方式安装。"
      });
      return;
    }

    try {
      await navigator.serviceWorker.register("/downloads-checkout/mobile/sw.js");
    } catch {
      setInstallUi({
        enabled: false,
        label: "安装准备失败",
        note: "service worker 注册失败了，先按网页继续用；PWA 安装能力稍后再试。"
      });
    }
  };

  const hasLocalStorage = (() => {
    try {
      const probeKey = `${storageKey}:probe`;
      window.localStorage.setItem(probeKey, "1");
      window.localStorage.removeItem(probeKey);
      return true;
    } catch {
      return false;
    }
  })();

  const makeId = (prefix) => {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  };

  const formatSizeMb = (mb) => `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;

  const formatTimestamp = (value) => new Date(value).toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  const getExtension = (filename) => {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  };

  const describeFileType = (extension, mimeType) => {
    const mapping = {
      png: "图片",
      jpg: "图片",
      jpeg: "图片",
      webp: "图片",
      heic: "图片",
      pdf: "PDF",
      zip: "压缩包",
      rar: "压缩包",
      "7z": "压缩包",
      doc: "文档",
      docx: "文档",
      xls: "表格",
      xlsx: "表格",
      ppt: "演示文稿",
      pptx: "演示文稿",
      mp4: "视频",
      mov: "视频"
    };

    if (mapping[extension]) return mapping[extension];
    if (mimeType?.startsWith("image/")) return "图片";
    if (mimeType?.startsWith("video/")) return "视频";
    if (mimeType?.startsWith("audio/")) return "音频";
    return extension ? extension.toUpperCase() : "文件";
  };

  const isPreviewableText = (extension, mimeType) => {
    if (mimeType?.startsWith("text/")) return true;
    return ["txt", "md", "json", "csv", "log", "xml", "html", "css", "js", "ts"].includes(extension);
  };

  const inferPriority = (name, extension, sizeMb) => {
    const lowerName = name.toLowerCase();
    let score = 20;

    if (["zip", "rar", "7z"].includes(extension)) score += 34;
    if (["png", "jpg", "jpeg", "webp", "heic"].includes(extension)) score += 14;
    if (["pdf", "doc", "docx"].includes(extension)) score += 10;
    if (lowerName.includes("final") || lowerName.includes("copy")) score += 10;
    if (lowerName.includes("export") || lowerName.includes("invoice")) score += 8;
    if (sizeMb > 30) score += 18;
    if (sizeMb > 120) score += 20;

    return score;
  };

  const toCardFromFile = (file) => {
    const sizeMb = file.size / (1024 * 1024);
    const extension = getExtension(file.name);
    const fileType = describeFileType(extension, file.type);
    const priority = inferPriority(file.name, extension, sizeMb);
    const sampleTags = [];

    if (["zip", "rar", "7z"].includes(extension)) sampleTags.push("压缩包");
    if (["png", "jpg", "jpeg", "webp", "heic"].includes(extension)) sampleTags.push("临时图片");
    if (["pdf", "doc", "docx"].includes(extension)) sampleTags.push("文档");
    if (sizeMb > 30) sampleTags.push("占空间");

    return {
      id: makeId("mobile-file"),
      kind: "file",
      queue: "手机文件账单",
      kicker: "系统文件选择器",
      title: file.name,
      meta: `${fileType} · ${formatSizeMb(sizeMb)}`,
      message: "这笔文件账已经进来了。现在就做决定，比继续挂在最近下载里更轻。",
      tags: sampleTags.length ? sampleTags.slice(0, 3) : ["手机文件", "刚接进来", "可以先结"],
      reasons: [
        "手机里的文件更容易长期悬着",
        "现在已经在队列里，不必回到文件 App 继续找",
        "做一个小决定，比留着不管更轻"
      ],
      release: Number(sizeMb.toFixed(1)),
      priority,
      fileType
    };
  };

  const sortQueue = (items) =>
    items
      .slice()
      .sort((left, right) => (right.priority || 0) - (left.priority || 0) || (right.release || 0) - (left.release || 0));

  const renderTags = (tags) => {
    if (!refs.tags) return;
    refs.tags.innerHTML = "";
    tags.forEach((tag) => {
      const node = document.createElement("span");
      node.textContent = tag;
      refs.tags.appendChild(node);
    });
  };

  const renderReasons = (reasons) => {
    if (!refs.reasons) return;
    refs.reasons.innerHTML = "";
    reasons.forEach((reason) => {
      const node = document.createElement("li");
      node.textContent = reason;
      refs.reasons.appendChild(node);
    });
  };

  const revokePreviewUrl = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = "";
    }
  };

  const clearPreviewNodes = () => {
    revokePreviewUrl();

    [
      refs.previewImage,
      refs.previewFrame,
      refs.previewVideo,
      refs.previewAudio,
      refs.previewText,
      refs.previewEmpty
    ].forEach((node) => {
      if (!node) return;
      node.hidden = true;
    });

    if (refs.previewImage) {
      refs.previewImage.removeAttribute("src");
      refs.previewImage.alt = "";
    }
    if (refs.previewFrame) refs.previewFrame.removeAttribute("src");
    if (refs.previewVideo) {
      refs.previewVideo.pause();
      refs.previewVideo.removeAttribute("src");
      refs.previewVideo.load();
    }
    if (refs.previewAudio) {
      refs.previewAudio.pause();
      refs.previewAudio.removeAttribute("src");
      refs.previewAudio.load();
    }
    if (refs.previewText) refs.previewText.textContent = "";
  };

  const closePreview = () => {
    if (!refs.previewLayer || refs.previewLayer.hidden) return;
    refs.previewLayer.hidden = true;
    document.body.classList.remove("preview-open");
    clearPreviewNodes();
  };

  const openPreviewLayer = () => {
    if (!refs.previewLayer) return;
    refs.previewLayer.hidden = false;
    document.body.classList.add("preview-open");
  };

  const setPreviewHeader = (item, status) => {
    if (refs.previewTitle) refs.previewTitle.textContent = item?.title || "文件预览";
    if (refs.previewMeta) refs.previewMeta.textContent = item?.meta || "";
    if (refs.previewStatus) refs.previewStatus.textContent = status;
  };

  const renderReceipts = () => {
    if (!refs.receipts) return;
    refs.receipts.innerHTML = "";

    if (!state.receipts.length) {
      const item = document.createElement("li");
      item.textContent = "今天的第一笔文件账，还在等你。";
      refs.receipts.appendChild(item);
      return;
    }

    state.receipts
      .slice()
      .reverse()
      .forEach((receipt) => {
        const item = document.createElement("li");
        item.textContent = receipt;
        refs.receipts.appendChild(item);
      });
  };

  const createReviewAction = (label, action, id) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mobile-review-action";
    button.textContent = label;
    button.dataset.mobileReviewAction = action;
    button.dataset.mobileReviewId = id;
    return button;
  };

  const renderReviewList = (container, items, emptyText, metaBuilder, actionsBuilder) => {
    if (!container) return;
    container.innerHTML = "";

    if (!items.length) {
      const item = document.createElement("li");
      item.className = "mobile-review-empty";
      item.textContent = emptyText;
      container.appendChild(item);
      return;
    }

    items
      .slice()
      .reverse()
      .forEach((item) => {
        const row = document.createElement("li");
        row.className = "mobile-review-item";

        const copyBlock = document.createElement("div");
        copyBlock.className = "mobile-review-copy";

        const title = document.createElement("strong");
        title.textContent = item.title;
        copyBlock.appendChild(title);

        const meta = document.createElement("span");
        meta.textContent = metaBuilder(item);
        copyBlock.appendChild(meta);

        const actions = document.createElement("div");
        actions.className = "mobile-review-item-actions";
        actionsBuilder(item).forEach((button) => actions.appendChild(button));

        row.appendChild(copyBlock);
        row.appendChild(actions);
        container.appendChild(row);
      });
  };

  const setFeedback = (message) => {
    if (refs.feedback) refs.feedback.textContent = message;
  };

  const snapshotState = () => ({
    mode: state.mode,
    pending: state.pending.slice(),
    processed: state.processed,
    released: state.released,
    lightness: state.lightness,
    receipts: state.receipts.slice(),
    archived: state.archived.slice(),
    deferred: state.deferred.slice(),
    dropped: state.dropped.slice(),
    sources: state.sources
  });

  const persistState = () => {
    if (!hasLocalStorage) return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify({
        mode: state.mode,
        pending: state.pending.slice(),
        processed: state.processed,
        released: state.released,
        lightness: state.lightness,
        receipts: state.receipts.slice(),
        archived: state.archived.slice(),
        deferred: state.deferred.slice(),
        dropped: state.dropped.slice(),
        sources: state.sources,
        sourceStatus: refs.sourceStatus?.textContent || defaultStatus
      }));
    } catch {
      // Ignore storage failures.
    }
  };

  const clearPersistedState = () => {
    if (!hasLocalStorage) return;
    window.localStorage.removeItem(storageKey);
  };

  const restorePersistedState = () => {
    if (!hasLocalStorage) return false;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return false;

      state.mode = ["sample", "real", "empty"].includes(saved.mode) ? saved.mode : "sample";
      state.pending = Array.isArray(saved.pending) ? saved.pending.slice() : [];
      state.processed = Number(saved.processed) || 0;
      state.released = Number(saved.released) || 0;
      state.lightness = Number(saved.lightness) || 0;
      state.receipts = Array.isArray(saved.receipts) ? saved.receipts.slice(0, 24) : [];
      state.archived = Array.isArray(saved.archived) ? saved.archived.slice(0, 100) : [];
      state.deferred = Array.isArray(saved.deferred) ? saved.deferred.slice(0, 100) : [];
      state.dropped = Array.isArray(saved.dropped) ? saved.dropped.slice(0, 100) : [];
      state.history = [];
      state.sources = Number(saved.sources) || 0;

      if (refs.sourceStatus) {
        refs.sourceStatus.textContent = saved.sourceStatus || defaultStatus;
      }

      return true;
    } catch {
      clearPersistedState();
      return false;
    }
  };

  const updateReviewQueues = () => {
    if (refs.archivedCount) refs.archivedCount.textContent = String(state.archived.length);
    if (refs.deferredCount) refs.deferredCount.textContent = String(state.deferred.length);
    if (refs.dropCount) refs.dropCount.textContent = String(state.dropped.length);
    if (refs.dropTotal) {
      const total = state.dropped.reduce((sum, item) => sum + (Number(item.release) || 0), 0);
      refs.dropTotal.textContent = formatSizeMb(total);
    }
    if (refs.restoreArchived) refs.restoreArchived.disabled = state.archived.length === 0;
    if (refs.resumeDeferred) refs.resumeDeferred.disabled = state.deferred.length === 0;
    if (refs.restoreDropped) refs.restoreDropped.disabled = state.dropped.length === 0;
    if (refs.exportDrops) refs.exportDrops.disabled = state.dropped.length === 0;

    renderReviewList(
      refs.archivedList,
      state.archived,
      "收纳盒还是空的。适合留下但不想继续挂着的文件，先放这里。",
      (item) => [item.meta, item.archivedAt ? `收纳于 ${formatTimestamp(item.archivedAt)}` : ""].filter(Boolean).join(" · "),
      (item) => [createReviewAction("放回队列", "restore-archive", item.id)]
    );

    renderReviewList(
      refs.deferredList,
      state.deferred,
      "还没有文件进入稍后区。现在不想决定的，先放这里。",
      (item) => [item.meta, item.deferredAt ? `稍后于 ${formatTimestamp(item.deferredAt)}` : ""].filter(Boolean).join(" · "),
      (item) => [createReviewAction("放回队列", "resume-deferred", item.id)]
    );

    renderReviewList(
      refs.dropList,
      state.dropped,
      "待删复核区还是空的。删之前，先让它们在这里待命。",
      (item) => [item.meta, item.droppedAt ? `标记于 ${formatTimestamp(item.droppedAt)}` : ""].filter(Boolean).join(" · "),
      (item) => [
        createReviewAction("恢复", "restore-drop", item.id),
        createReviewAction("移出", "forget-drop", item.id)
      ]
    );
  };

  const updateSummary = () => {
    if (refs.processed) refs.processed.textContent = String(state.processed);
    if (refs.released) refs.released.textContent = formatSizeMb(state.released);
    if (refs.lightness) refs.lightness.textContent = String(state.lightness);
    if (refs.remaining) refs.remaining.textContent = String(state.pending.length);
    if (refs.loadedCount) refs.loadedCount.textContent = String(state.pending.length + state.processed + state.archived.length + state.deferred.length);
    if (refs.sourceCount) refs.sourceCount.textContent = String(state.sources);
    if (refs.total) refs.total.textContent = String(state.pending.length + state.processed + state.archived.length + state.deferred.length);
    if (refs.undo) refs.undo.disabled = state.history.length === 0;
    updateReviewQueues();
    renderReceipts();
  };

  const renderCard = () => {
    const card = state.pending[0];

    if (!card) {
      const hasDeferred = state.deferred.length > 0;
      refs.queueTitle.textContent = state.processed > 0 ? "今日轻下来了" : "手机收银台";
      if (refs.index) refs.index.textContent = String(state.processed);
      refs.kicker.textContent = hasDeferred ? "Later" : "Ready";
      refs.title.textContent = hasDeferred
        ? `主队列先结完了，稍后区还有 ${state.deferred.length} 笔。`
        : state.processed > 0
          ? "这一轮手机文件账已经结完。"
          : "先从文件 App 选几笔最近下载。";
      refs.meta.textContent = hasDeferred
        ? "今天先把最碍眼的结掉就够了，难决定的已经安全挪开。"
        : state.processed > 0
          ? "手机版的目标不是清空，而是今天先轻一点。"
          : "浏览器版先走系统文件选择器。App 版再接聊天分享。";
      refs.message.textContent = hasDeferred
        ? "你可以把稍后区重新放回队列，也可以先停在这里。"
        : state.processed > 0
          ? "好的手机减法，不是一次做完，而是明天还愿意继续回来。"
          : "如果你现在只想感受节奏，也可以先载入示例队列。";
      renderTags(hasDeferred ? ["主队列已清", "稍后区还在", "不用强行清空"] : ["系统选择器", "分享优先", "本地运行"]);
      renderReasons(
        hasDeferred
          ? ["稍后区没有消失", "删之前仍然会复核", "今天先停在这里也成立"]
          : state.processed > 0
            ? ["你不是整理整个手机，只是放下了几笔文件账", "真正的减法反馈已经出现", "明天还能继续回来"]
            : ["先选几笔最近下载", "不需要整机大权限", "浏览器版先验证手机节奏"]
      );
      refs.actionButtons.forEach((button) => {
        button.disabled = true;
      });
      return;
    }

    refs.queueTitle.textContent = card.queue;
    if (refs.index) refs.index.textContent = String(state.processed + 1);
    refs.kicker.textContent = card.kicker;
    refs.title.textContent = card.title;
    refs.meta.textContent = card.meta;
    refs.message.textContent = card.message;
    renderTags(card.tags || []);
    renderReasons(card.reasons || []);
    if (refs.title.parentElement) {
      refs.title.parentElement.style.background = cardBackgrounds[state.processed % cardBackgrounds.length];
    }
    refs.actionButtons.forEach((button) => {
      button.disabled = false;
    });
  };

  const pushHistory = () => {
    state.history.push(snapshotState());
    if (state.history.length > 40) state.history.shift();
  };

  const sync = () => {
    updateSummary();
    renderCard();
    persistState();
  };

  const resetProgress = () => {
    state.processed = 0;
    state.released = 0;
    state.lightness = 0;
    state.receipts = [];
    state.archived = [];
    state.deferred = [];
    state.dropped = [];
    state.history = [];
  };

  const loadSampleQueue = ({ restored = false } = {}) => {
    closePreview();
    runtimeFiles.clear();
    void clearStoredFiles();
    state.mode = "sample";
    state.pending = sampleCards.map((card, index) => ({
      id: card.id || makeId("mobile-sample"),
      kind: "file",
      priority: 100 - index,
      ...card
    }));
    state.sources = 0;
    resetProgress();
    if (refs.fileInput) refs.fileInput.value = "";
    if (refs.sourceStatus) refs.sourceStatus.textContent = "还没接入真实文件。浏览器版先用系统选择器；以后再接聊天分享。";
    setFeedback(restored ? copy.restored : copy.sampleReady);
    sync();
  };

  const clearAll = () => {
    closePreview();
    runtimeFiles.clear();
    void clearStoredFiles();
    state.mode = "empty";
    state.pending = [];
    state.sources = 0;
    resetProgress();
    if (refs.fileInput) refs.fileInput.value = "";
    if (refs.sourceStatus) refs.sourceStatus.textContent = defaultStatus;
    setFeedback(copy.cleared);
    sync();
  };

  const loadFiles = (files) => {
    closePreview();
    const list = Array.from(files || []).filter((file) => file && typeof file.name === "string");
    if (!list.length) {
      setFeedback("这次没有选到文件。");
      return;
    }

    runtimeFiles.clear();

    const cards = sortQueue(list.map((file) => {
      const card = toCardFromFile(file);
      runtimeFiles.set(card.id, file);
      return card;
    }));

    state.mode = "real";
    state.pending = cards;
    state.sources = 1;
    resetProgress();

    if (refs.sourceStatus) {
      refs.sourceStatus.textContent = `已接入 ${cards.length} 个手机文件。现在可以开始一张张结账；这一轮会尽量保留在本机里，刷新后也能继续预览。`;
    }

    setFeedback(`已把 ${cards.length} 个文件排进手机版收银台，并写入本机缓存。`);
    sync();
    void (async () => {
      await clearStoredFiles();
      await storeRuntimeFiles(cards, list);
    })();
  };

  const removeReceiptEntry = (matcher) => {
    const index = state.receipts.findIndex(matcher);
    if (index >= 0) state.receipts.splice(index, 1);
  };

  const restoreItemsToQueue = (sourceKey, ids, message) => {
    const source = state[sourceKey];
    if (!Array.isArray(source) || !ids.length) return;
    pushHistory();
    const returning = source.filter((item) => ids.includes(item.id)).map((item) => {
      const { archivedAt, deferredAt, droppedAt, ...rest } = item;
      return rest;
    });
    state[sourceKey] = source.filter((item) => !ids.includes(item.id));
    state.pending = sortQueue([...returning, ...state.pending]);
    if (sourceKey !== "deferred") {
      state.processed = Math.max(0, state.processed - returning.length);
    }
    if (sourceKey === "dropped") {
      const releasedDelta = returning.reduce((sum, item) => sum + (Number(item.release) || 0), 0);
      state.released = Math.max(0, state.released - releasedDelta);
      returning.forEach((item) => removeReceiptEntry((entry) => entry.includes(`待删 · ${item.title}`)));
    }
    if (sourceKey === "archived") {
      returning.forEach((item) => removeReceiptEntry((entry) => entry.includes(`收纳盒 · ${item.title}`)));
    }
    setFeedback(message);
    sync();
  };

  const exportDropList = () => {
    if (!state.dropped.length) {
      setFeedback("待删复核区还是空的，没有可导出的清单。");
      return;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      itemCount: state.dropped.length,
      totalReleaseMb: Number(state.dropped.reduce((sum, item) => sum + (Number(item.release) || 0), 0).toFixed(1)),
      items: state.dropped.map((item) => ({
        title: item.title,
        meta: item.meta,
        droppedAt: item.droppedAt || null
      }))
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `downloads-mobile-drop-list-${Date.now()}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback(`已导出 ${state.dropped.length} 笔待删清单。`);
  };

  const previewSampleCard = (item) => {
    clearPreviewNodes();
    setPreviewHeader(item, "这是一张示例卡，所以只演示预览层，不会打开真实文件。");
    if (refs.previewEmpty) {
      refs.previewEmpty.hidden = false;
      refs.previewEmpty.textContent = `${item.message} 真实文件接入后，这里会直接在页内预览，而不是再下载一遍。`;
    }
    openPreviewLayer();
    setFeedback("示例卡已经在页内预览层打开。");
  };

  const previewMissingRuntime = (item) => {
    clearPreviewNodes();
    setPreviewHeader(item, "这笔文件来自上次保存的队列，浏览器手里已经没有原文件了。");
    if (refs.previewEmpty) {
      refs.previewEmpty.hidden = false;
      refs.previewEmpty.textContent = "如果你想真实预览它，请重新从文件 App 里选一次这批文件。这样预览就不会再走“重新下载”那条路。";
    }
    openPreviewLayer();
    setFeedback("这笔文件需要重新选择后才能真实预览。");
  };

  const openFile = async (item) => {
    if (!item) return;

    if (item.kind !== "file") {
      return;
    }

    if (item.sample) {
      previewSampleCard(item);
      return;
    }

    let file = runtimeFiles.get(item.id);
    if (!file) {
      file = await getStoredFile(item.id);
    }
    if (!file) {
      previewMissingRuntime(item);
      return;
    }

    clearPreviewNodes();
    setPreviewHeader(item, "现在直接在当前页面里预览，不再额外下载一遍。");
    openPreviewLayer();

    const extension = getExtension(file.name);
    const mimeType = file.type || "";

    try {
      if (mimeType.startsWith("image/") && refs.previewImage) {
        previewUrl = URL.createObjectURL(file);
        refs.previewImage.src = previewUrl;
        refs.previewImage.alt = item.title;
        refs.previewImage.hidden = false;
        setFeedback(`已在页内预览 ${item.title}。`);
        return;
      }

      if (mimeType === "application/pdf" && refs.previewFrame) {
        previewUrl = URL.createObjectURL(file);
        refs.previewFrame.src = previewUrl;
        refs.previewFrame.hidden = false;
        setFeedback(`已在页内预览 ${item.title}。`);
        return;
      }

      if (mimeType.startsWith("video/") && refs.previewVideo) {
        previewUrl = URL.createObjectURL(file);
        refs.previewVideo.src = previewUrl;
        refs.previewVideo.hidden = false;
        setFeedback(`已在页内预览 ${item.title}。`);
        return;
      }

      if (mimeType.startsWith("audio/") && refs.previewAudio) {
        previewUrl = URL.createObjectURL(file);
        refs.previewAudio.src = previewUrl;
        refs.previewAudio.hidden = false;
        setFeedback(`已在页内预览 ${item.title}。`);
        return;
      }

      if (isPreviewableText(extension, mimeType) && refs.previewText) {
        refs.previewText.textContent = await file.text();
        refs.previewText.hidden = false;
        setFeedback(`已在页内预览 ${item.title}。`);
        return;
      }

      if (refs.previewEmpty) {
        refs.previewEmpty.hidden = false;
        refs.previewEmpty.textContent = "这个格式暂时还不能在页内直接预览。好消息是，这张卡还留在原位；你看完之后，再决定收纳、稍后还是待删。";
      }
      setFeedback(`这个格式暂时还不能页内预览，但已经避免了自动重新下载。`);
    } catch {
      if (refs.previewEmpty) {
        refs.previewEmpty.hidden = false;
        refs.previewEmpty.textContent = "这次预览没有成功。文件没有丢，也没有被重复下载；你可以重新试一次，或者直接做后续决定。";
      }
      setFeedback("这次预览没有成功，但已经留在当前页里了。");
    }
  };

  const applyAction = (action) => {
    const item = state.pending[0];
    if (!item) return;

    if (action === "process") {
      openFile(item);
      return;
    }

    pushHistory();
    state.pending.shift();

    if (action === "archive") {
      state.processed += 1;
      state.lightness += 9;
      state.archived.push({
        ...item,
        archivedAt: Date.now()
      });
      state.receipts.push(`收纳盒 · ${item.title}`);
      setFeedback(`已把 ${item.title} 收进收纳盒。浏览器版先做逻辑收纳，App 版再做真实移动。`);
      sync();
      return;
    }

    if (action === "later") {
      state.lightness += 2;
      state.deferred.push({
        ...item,
        deferredAt: Date.now()
      });
      setFeedback(`已把 ${item.title} 放进稍后区。今天先不逼自己现在决定。`);
      sync();
      return;
    }

    if (action === "drop") {
      state.processed += 1;
      state.released += Number(item.release) || 0;
      state.lightness += 12;
      state.dropped.push({
        ...item,
        droppedAt: Date.now()
      });
      state.receipts.push(`待删 · ${item.title}`);
      setFeedback(`已把 ${item.title} 放进待删复核区。删之前，你还可以恢复。`);
      sync();
    }
  };

  const undo = () => {
    const snapshot = state.history.pop();
    if (!snapshot) return;

    state.mode = snapshot.mode;
    state.pending = snapshot.pending.slice();
    state.processed = snapshot.processed;
    state.released = snapshot.released;
    state.lightness = snapshot.lightness;
    state.receipts = snapshot.receipts.slice();
    state.archived = snapshot.archived.slice();
    state.deferred = snapshot.deferred.slice();
    state.dropped = snapshot.dropped.slice();
    state.sources = snapshot.sources;
    setFeedback("已撤回上一笔。");
    sync();
  };

  const handleReviewAction = (event) => {
    const button = event.target.closest("[data-mobile-review-action]");
    if (!button) return;

    const { mobileReviewAction: action, mobileReviewId: id } = button.dataset;
    if (!action || !id) return;

    if (action === "restore-archive") {
      restoreItemsToQueue("archived", [id], "已把 1 笔收纳盒文件放回队列。");
      return;
    }

    if (action === "resume-deferred") {
      restoreItemsToQueue("deferred", [id], "已把 1 笔稍后文件放回队列。");
      return;
    }

    if (action === "restore-drop") {
      restoreItemsToQueue("dropped", [id], "已把 1 笔待删文件恢复到队列。");
      return;
    }

    if (action === "forget-drop") {
      pushHistory();
      const dropItem = state.dropped.find((item) => item.id === id);
      state.dropped = state.dropped.filter((item) => item.id !== id);
      runtimeFiles.delete(id);
      void deleteStoredFiles([id]);
      if (dropItem) {
        state.released = Math.max(0, state.released - (Number(dropItem.release) || 0));
        removeReceiptEntry((entry) => entry.includes(`待删 · ${dropItem.title}`));
      }
      setFeedback("已把这笔文件从待删复核区移出，不再计入待删空间。");
      sync();
    }
  };

  refs.actionButtons.forEach((button) => {
    button.addEventListener("click", () => applyAction(button.dataset.mobileAction));
  });

  refs.importFiles?.addEventListener("click", () => refs.fileInput?.click());
  refs.fileInput?.addEventListener("change", (event) => loadFiles(event.currentTarget.files));
  refs.loadSample?.addEventListener("click", () => {
    loadSampleQueue();
    setFeedback(copy.sampleReloaded);
  });
  refs.clearSession?.addEventListener("click", clearAll);
  refs.undo?.addEventListener("click", undo);
  refs.restoreArchived?.addEventListener("click", () =>
    restoreItemsToQueue("archived", state.archived.map((item) => item.id), `已把 ${state.archived.length} 笔收纳盒文件放回队列。`)
  );
  refs.resumeDeferred?.addEventListener("click", () =>
    restoreItemsToQueue("deferred", state.deferred.map((item) => item.id), `已把 ${state.deferred.length} 笔稍后文件放回队列。`)
  );
  refs.restoreDropped?.addEventListener("click", () =>
    restoreItemsToQueue("dropped", state.dropped.map((item) => item.id), `已把 ${state.dropped.length} 笔待删文件恢复到队列。`)
  );
  refs.exportDrops?.addEventListener("click", exportDropList);
  refs.archivedList?.addEventListener("click", handleReviewAction);
  refs.deferredList?.addEventListener("click", handleReviewAction);
  refs.dropList?.addEventListener("click", handleReviewAction);
  refs.previewBackdrop?.addEventListener("click", closePreview);
  refs.previewClose?.addEventListener("click", closePreview);
  refs.installApp?.addEventListener("click", async () => {
    if (isStandalone()) {
      setInstallUi({
        enabled: false,
        label: "已安装",
        note: "你已经是用主屏幕安装版打开它了。"
      });
      return;
    }

    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      setInstallUi({
        enabled: false,
        label: choice?.outcome === "accepted" ? "安装中" : "安装到主屏幕",
        note: choice?.outcome === "accepted"
          ? "安装提示已经发出。安装完成后，下次可以直接从主屏幕打开。"
          : "你这次先跳过了安装。之后仍然可以再装。"
      });
      return;
    }

    if (isIosSafari()) {
      setInstallUi({
        enabled: false,
        label: "去 Safari 安装",
        note: "在 iPhone 上，请点 Safari 的分享按钮，再选“添加到主屏幕”。"
      });
      return;
    }

    setInstallUi({
      enabled: false,
      label: "等待浏览器支持",
      note: "这个环境还没给出安装提示。你可以先正常使用，等支持时再安装。"
    });
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    setInstallUi({
      enabled: true,
      label: "安装到主屏幕",
      note: "这个浏览器已经允许安装了。点上面的按钮，就能把它放到主屏幕。"
    });
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    setInstallUi({
      enabled: false,
      label: "已安装",
      note: "主屏安装已完成。下次可以像普通 App 一样直接打开。"
    });
  });

  if (isStandalone()) {
    setInstallUi({
      enabled: false,
      label: "已安装",
      note: "你现在已经是用主屏幕安装版打开它了。"
    });
  } else if (isIosSafari()) {
    setInstallUi({
      enabled: false,
      label: "去 Safari 安装",
      note: "iPhone 上请用 Safari 打开，然后点分享按钮里的“添加到主屏幕”。"
    });
  }

  hoistPreviewLayer();
  registerServiceWorker();
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePreview();
  });

  const restored = restorePersistedState();
  if (restored && (state.pending.length || state.archived.length || state.deferred.length || state.dropped.length)) {
    setFeedback(copy.restored);
    sync();
    return;
  }

  loadSampleQueue();
})();
