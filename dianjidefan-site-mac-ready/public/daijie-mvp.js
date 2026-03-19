(function () {
  const bootstrapNode = document.getElementById("daijie-app-bootstrap");
  if (!bootstrapNode) return;

  const bootstrap = JSON.parse(bootstrapNode.textContent || "{}");
  const sampleCards = Array.isArray(bootstrap.demoCards) ? bootstrap.demoCards : [];
  const storageKey = typeof bootstrap.storageKey === "string" && bootstrap.storageKey
    ? bootstrap.storageKey
    : "daijie:mvp:v1";
  const copy = {
    sampleReady: "示例队列已经就绪。你也可以直接接入自己的真实来源。",
    sampleReloaded: "已重新载入示例队列。",
    restored: "已恢复你上一轮待结队列。你可以继续结账，或重新接入新的来源。",
    cleared: "本轮已经清空。你可以重新接入真实来源，或再载入一轮示例队列。",
    ...(bootstrap.copy && typeof bootstrap.copy === "object" ? bootstrap.copy : {})
  };

  const refs = {
    queueTitle: document.getElementById("mvp-queue-title"),
    index: document.getElementById("mvp-index"),
    total: document.getElementById("mvp-total"),
    kicker: document.getElementById("mvp-kicker"),
    title: document.getElementById("mvp-title"),
    meta: document.getElementById("mvp-meta"),
    message: document.getElementById("mvp-message"),
    tags: document.getElementById("mvp-tags"),
    reasons: document.getElementById("mvp-reasons"),
    processed: document.getElementById("mvp-processed"),
    released: document.getElementById("mvp-released"),
    lightness: document.getElementById("mvp-lightness"),
    remaining: document.getElementById("mvp-remaining"),
    receipts: document.getElementById("mvp-receipts"),
    feedback: document.getElementById("mvp-feedback"),
    undo: document.getElementById("mvp-undo"),
    card: document.getElementById("mvp-card"),
    primaryAction: document.getElementById("mvp-primary-action"),
    archiveAction: document.getElementById("mvp-archive-action"),
    dropAction: document.getElementById("mvp-drop-action"),
    actionButtons: document.querySelectorAll("[data-mvp-action]"),
    connectDownloads: document.getElementById("mvp-connect-downloads"),
    connectArchive: document.getElementById("mvp-connect-archive"),
    downloadsInput: document.getElementById("mvp-downloads-input"),
    bookmarksInput: document.getElementById("mvp-bookmarks-input"),
    downloadsStatus: document.getElementById("mvp-downloads-status"),
    bookmarksStatus: document.getElementById("mvp-bookmarks-status"),
    archiveStatus: document.getElementById("mvp-archive-status"),
    sessionMode: document.getElementById("mvp-session-mode"),
    privacyNote: document.getElementById("mvp-privacy-note"),
    loadedCount: document.getElementById("mvp-loaded-count"),
    sourceCount: document.getElementById("mvp-source-count"),
    loadSample: document.getElementById("mvp-load-sample"),
    clearSession: document.getElementById("mvp-clear-session"),
    exportDropList: document.getElementById("mvp-export-drop-list"),
    deferredCount: document.getElementById("mvp-deferred-count"),
    deferredList: document.getElementById("mvp-deferred-list"),
    resumeDeferred: document.getElementById("mvp-resume-deferred"),
    dropCount: document.getElementById("mvp-drop-count"),
    dropTotal: document.getElementById("mvp-drop-total"),
    dropReviewList: document.getElementById("mvp-drop-review-list"),
    restoreDropped: document.getElementById("mvp-restore-dropped")
  };

  if (!refs.queueTitle || !refs.card) return;

  const runtimeFiles = new Map();
  const demoBackgrounds = [
    "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(250,231,203,0.92))",
    "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(245,224,220,0.92))",
    "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(220,239,228,0.92))",
    "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(227,229,238,0.92))"
  ];

  const defaultStatuses = {
    downloads: refs.downloadsStatus?.textContent || "",
    bookmarks: refs.bookmarksStatus?.textContent || "",
    archive: refs.archiveStatus?.textContent || ""
  };

  const state = {
    mode: "sample",
    pending: [],
    processed: 0,
    released: 0,
    lightness: 0,
    receipts: [],
    deferred: [],
    dropped: [],
    history: [],
    sources: {
      downloads: 0,
      bookmarks: 0
    }
  };
  const runtime = {
    archiveHandle: null,
    archiveName: ""
  };

  const makeId = (prefix) => {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
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
  const formatTimestamp = (value) => new Date(value).toLocaleString("zh-CN", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  const getDaysSince = (timestamp) => {
    if (!timestamp) return 0;
    const delta = Date.now() - Number(timestamp);
    return clamp(Math.floor(delta / 86400000), 0, 3650);
  };

  const formatSizeMb = (mb) => `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;

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
      gif: "图片",
      pdf: "PDF",
      zip: "压缩包",
      rar: "压缩包",
      "7z": "压缩包",
      dmg: "安装包",
      pkg: "安装包",
      exe: "安装包",
      app: "应用包",
      mp4: "视频",
      mov: "视频",
      mp3: "音频",
      wav: "音频",
      txt: "文本",
      md: "文本",
      doc: "文档",
      docx: "文档",
      ppt: "演示文稿",
      pptx: "演示文稿",
      xls: "表格",
      xlsx: "表格"
    };

    if (mapping[extension]) return mapping[extension];
    if (mimeType?.startsWith("image/")) return "图片";
    if (mimeType?.startsWith("video/")) return "视频";
    if (mimeType?.startsWith("audio/")) return "音频";
    return extension ? extension.toUpperCase() : "文件";
  };

  const safeHostname = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "未知站点";
    }
  };

  const inferActionLabels = (item) => {
    if (item.kind === "bookmark") {
      return {
        process: "读 3 分钟",
        archive: "保留",
        drop: "丢弃",
        later: "稍后"
      };
    }

    return {
      process: "打开看",
      archive: "归档",
      drop: "待删",
      later: "稍后"
    };
  };

  const labelForAction = (action, item) => inferActionLabels(item)[action] || "处理";

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
      const item = document.createElement("li");
      item.textContent = reason;
      refs.reasons.appendChild(item);
    });
  };

  const renderReceipts = () => {
    if (!refs.receipts) return;
    refs.receipts.innerHTML = "";

    if (!state.receipts.length) {
      const item = document.createElement("li");
      item.textContent = "等待第一笔结账...";
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
    button.className = "review-action";
    button.textContent = label;
    button.dataset.reviewAction = action;
    button.dataset.reviewId = id;
    return button;
  };

  const renderReviewList = (container, items, emptyText, actionsBuilder, metaBuilder) => {
    if (!container) return;
    container.innerHTML = "";

    if (!items.length) {
      const item = document.createElement("li");
      item.className = "review-empty";
      item.textContent = emptyText;
      container.appendChild(item);
      return;
    }

    items
      .slice()
      .reverse()
      .forEach((item) => {
        const row = document.createElement("li");
        row.className = "review-item";

        const copyBlock = document.createElement("div");
        copyBlock.className = "review-copy";

        const title = document.createElement("strong");
        title.textContent = item.title;
        copyBlock.appendChild(title);

        const meta = document.createElement("span");
        meta.textContent = metaBuilder(item);
        copyBlock.appendChild(meta);

        const actions = document.createElement("div");
        actions.className = "review-item-actions";
        actionsBuilder(item).forEach((button) => actions.appendChild(button));

        row.appendChild(copyBlock);
        row.appendChild(actions);
        container.appendChild(row);
      });
  };

  const renderReviewQueues = () => {
    if (refs.deferredCount) refs.deferredCount.textContent = String(state.deferred.length);
    if (refs.dropCount) refs.dropCount.textContent = String(state.dropped.length);
    if (refs.dropTotal) {
      const total = state.dropped.reduce((sum, item) => sum + (Number(item.release) || 0), 0);
      refs.dropTotal.textContent = formatSizeMb(total);
    }
    if (refs.resumeDeferred) refs.resumeDeferred.disabled = state.deferred.length === 0;
    if (refs.restoreDropped) refs.restoreDropped.disabled = state.dropped.length === 0;

    renderReviewList(
      refs.deferredList,
      state.deferred,
      "还没有文件进入稍后区。现在不想决定的，先放这里就行。",
      (item) => [createReviewAction("回到队列", "resume-deferred", item.id)],
      (item) => [item.meta, item.deferredAt ? `稍后于 ${formatTimestamp(item.deferredAt)}` : ""].filter(Boolean).join(" · ")
    );

    renderReviewList(
      refs.dropReviewList,
      state.dropped,
      "待删清单还是空的。真正删之前，先把这里当成可复核区。",
      (item) => [
        createReviewAction("恢复到队列", "restore-drop", item.id),
        createReviewAction("移出清单", "forget-drop", item.id)
      ],
      (item) => [item.meta, item.droppedAt ? `标记于 ${formatTimestamp(item.droppedAt)}` : ""].filter(Boolean).join(" · ")
    );
  };

  const setFeedback = (message) => {
    if (refs.feedback) refs.feedback.textContent = message;
  };

  const setSessionMode = () => {
    const connectedSources = ["downloads", "bookmarks"].filter((key) => state.sources[key] > 0).length;

    if (!refs.sessionMode || !refs.privacyNote) return;

    if (connectedSources === 0) {
      refs.sessionMode.textContent = state.mode === "empty" ? "等待接入真实来源" : "示例队列已就绪";
      refs.privacyNote.textContent = "本地解析，本机自动保存";
      return;
    }

    refs.sessionMode.textContent = `已接入 ${connectedSources} 个真实来源`;
    refs.privacyNote.textContent = "不会上传数据，本机自动保存";
  };

  const updateSourceSummary = () => {
    if (refs.loadedCount) refs.loadedCount.textContent = String(state.pending.length + state.processed + state.deferred.length);
    if (refs.sourceCount) {
      refs.sourceCount.textContent = String(["downloads", "bookmarks"].filter((key) => state.sources[key] > 0).length);
    }
    if (refs.exportDropList) refs.exportDropList.disabled = state.dropped.length === 0;
    setSessionMode();
  };

  const updateSummary = () => {
    if (refs.processed) refs.processed.textContent = String(state.processed);
    if (refs.released) refs.released.textContent = formatSizeMb(state.released);
    if (refs.lightness) refs.lightness.textContent = String(state.lightness);
    if (refs.remaining) refs.remaining.textContent = String(state.pending.length);
    if (refs.total) refs.total.textContent = String(state.pending.length + state.processed + state.deferred.length);
    if (refs.undo) refs.undo.disabled = state.history.length === 0;
    updateSourceSummary();
    renderReviewQueues();
  };

  const toPendingItem = (item) => {
    const { deferredAt, droppedAt, savedAt, ...rest } = item;
    return {
      ...rest,
      restored: !item.sample && item.kind === "file" ? true : item.restored
    };
  };

  const snapshotState = () => ({
    mode: state.mode,
    pending: state.pending.slice(),
    processed: state.processed,
    released: state.released,
    lightness: state.lightness,
    receipts: state.receipts.slice(),
    deferred: state.deferred.slice(),
    dropped: state.dropped.slice(),
    sources: { ...state.sources }
  });

  const serializeState = () => ({
    mode: state.mode,
    pending: state.pending.slice(),
    processed: state.processed,
    released: state.released,
    lightness: state.lightness,
    receipts: state.receipts.slice(),
    deferred: state.deferred.slice(),
    dropped: state.dropped.slice(),
    sources: { ...state.sources },
    statuses: {
      downloads: refs.downloadsStatus?.textContent || defaultStatuses.downloads,
      bookmarks: refs.bookmarksStatus?.textContent || defaultStatuses.bookmarks,
      archive: refs.archiveStatus?.textContent || defaultStatuses.archive
    }
  });

  const persistState = () => {
    if (!hasLocalStorage) return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(serializeState()));
    } catch {
      // Ignore storage quota or private mode failures; the in-memory flow still works.
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
      state.pending = Array.isArray(saved.pending) ? saved.pending.map(toPendingItem) : [];
      state.processed = Number(saved.processed) || 0;
      state.released = Number(saved.released) || 0;
      state.lightness = Number(saved.lightness) || 0;
      state.receipts = Array.isArray(saved.receipts) ? saved.receipts.slice(0, 24) : [];
      state.deferred = Array.isArray(saved.deferred) ? saved.deferred.map(toPendingItem) : [];
      state.dropped = Array.isArray(saved.dropped) ? saved.dropped.slice(0, 200) : [];
      state.history = [];
      state.sources = {
        downloads: Number(saved.sources?.downloads) || 0,
        bookmarks: Number(saved.sources?.bookmarks) || 0
      };

      if (refs.downloadsStatus) {
        refs.downloadsStatus.textContent = state.sources.downloads > 0
          ? "已恢复上次文件队列。如需重新打开原文件，请再连接一次文件夹。"
          : saved.statuses?.downloads || defaultStatuses.downloads;
      }

      if (refs.bookmarksStatus) {
        refs.bookmarksStatus.textContent = saved.statuses?.bookmarks || defaultStatuses.bookmarks;
      }

      if (refs.archiveStatus) {
        refs.archiveStatus.textContent = saved.statuses?.archive?.includes("已连接归档文件夹")
          ? "上次连接过归档文件夹。刷新后请重新连接，归档动作才会真的写入目录。"
          : saved.statuses?.archive || defaultStatuses.archive;
      }

      return true;
    } catch {
      clearPersistedState();
      return false;
    }
  };

  const resetProgress = () => {
    state.processed = 0;
    state.released = 0;
    state.lightness = 0;
    state.receipts = [];
    state.deferred = [];
    state.dropped = [];
    state.history = [];
  };

  const clearAll = () => {
    runtimeFiles.clear();
    state.mode = "empty";
    state.pending = [];
    state.sources = { downloads: 0, bookmarks: 0 };
    resetProgress();
    if (refs.downloadsInput) refs.downloadsInput.value = "";
    if (refs.bookmarksInput) refs.bookmarksInput.value = "";
    if (refs.downloadsStatus) refs.downloadsStatus.textContent = defaultStatuses.downloads;
    if (refs.bookmarksStatus) refs.bookmarksStatus.textContent = defaultStatuses.bookmarks;
    if (refs.archiveStatus) refs.archiveStatus.textContent = defaultStatuses.archive;
    runtime.archiveHandle = null;
    runtime.archiveName = "";
  };

  const sortQueue = (items) =>
    items
      .slice()
      .sort((left, right) => right.priority - left.priority || right.release - left.release || left.title.localeCompare(right.title));

  const renderCard = () => {
    const card = state.pending[0];

    if (!card) {
      refs.queueTitle.textContent = state.processed > 0 ? "今日结清" : "待结收银台";
      if (refs.index) refs.index.textContent = String(state.processed);
      const hasDeferred = state.deferred.length > 0;
      refs.kicker.textContent = state.processed > 0 ? "Receipt" : "Ready";
      refs.title.textContent = hasDeferred
        ? `主队列先结完了，稍后区还有 ${state.deferred.length} 笔。`
        : state.processed > 0
          ? "这轮真实队列已经结完了。"
          : "先接入你的 Downloads 或收藏夹。";
      refs.meta.textContent = hasDeferred
        ? "你已经把难决定的先挪开了。今天不必全清，但它们也不会再继续卡住这一轮。"
        : state.processed > 0
          ? "你没有整理人生，只是放下了几笔一直挂着的小账。"
          : "支持连接本地文件夹或导入浏览器书签导出 HTML。";
      refs.message.textContent = hasDeferred
        ? "需要的话，可以把稍后区一键放回队列；不需要的话，就先停在这里。"
        : state.processed > 0
          ? "好的节奏不是一次性清空，而是明天还愿意继续回来。"
          : "如果你只想先感受节奏，也可以继续使用示例队列。";
      renderTags(hasDeferred
        ? ["主队列已清", "稍后区可回看", "继续也行"]
        : state.processed > 0
          ? ["今日完成", "可以明天再来", "轻一点"]
          : ["本地运行", "不上传数据", "先接来源"]);
      renderReasons(
        hasDeferred
          ? ["主队列已完成", "稍后区里的文件没有丢，只是被安全推迟", "你可以一键把它们放回队列"]
          : state.processed > 0
            ? ["本轮真实队列已完成", "用户获得轻松感而不是压力", "待删项目可导出清单，文件归档可接入归档文件夹"]
            : ["先接入真实来源", "Downloads 与收藏夹都支持", "待删只会进入清单，不会直接消失"]
      );

      refs.actionButtons.forEach((button) => {
        button.disabled = true;
      });
      return;
    }

    const labels = inferActionLabels(card);
    refs.queueTitle.textContent = card.queue;
    if (refs.index) refs.index.textContent = String(state.processed + 1);
    refs.kicker.textContent = card.kicker;
    refs.title.textContent = card.title;
    refs.meta.textContent = card.meta;
    refs.message.textContent = card.message;
    refs.primaryAction.textContent = labels.process;
    refs.archiveAction.textContent = labels.archive;
    refs.dropAction.textContent = labels.drop;
    renderTags(card.tags);
    renderReasons(card.reasons);
    refs.card.style.background = demoBackgrounds[state.processed % demoBackgrounds.length];
    refs.actionButtons.forEach((button) => {
      button.disabled = false;
    });
  };

  const ensureDirectory = async (rootHandle, segments) => {
    let cursor = rootHandle;
    for (const segment of segments) {
      cursor = await cursor.getDirectoryHandle(segment, { create: true });
    }
    return cursor;
  };

  const createUniqueArchiveHandle = async (directoryHandle, filename) => {
    const dotIndex = filename.lastIndexOf(".");
    const hasExtension = dotIndex > 0;
    const stem = hasExtension ? filename.slice(0, dotIndex) : filename;
    const extension = hasExtension ? filename.slice(dotIndex) : "";
    let candidate = filename;
    let suffix = 1;

    while (true) {
      try {
        await directoryHandle.getFileHandle(candidate);
        candidate = `${stem}-copy-${suffix}${extension}`;
        suffix += 1;
      } catch (error) {
        if (error && error.name === "NotFoundError") {
          const handle = await directoryHandle.getFileHandle(candidate, { create: true });
          return { handle, filename: candidate };
        }

        throw error;
      }
    }
  };

  const archiveFile = async (item) => {
    if (item.kind !== "file" || item.sample) {
      return { mode: "logical" };
    }

    if (!runtime.archiveHandle) {
      return { mode: "missing-archive" };
    }

    const runtimeEntry = runtimeFiles.get(item.id);
    if (!runtimeEntry) {
      return { mode: "missing-runtime" };
    }

    try {
      const file = runtimeEntry.handle ? await runtimeEntry.handle.getFile() : runtimeEntry.file;
      if (!file) return { mode: "missing-runtime" };

      const segments = (item.path || item.title).split("/").filter(Boolean);
      const originalFilename = segments.pop() || item.title;
      const targetDirectory = await ensureDirectory(runtime.archiveHandle, segments);
      const { handle: fileHandle, filename } = await createUniqueArchiveHandle(targetDirectory, originalFilename);
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      return {
        mode: "copied",
        destination: `${runtime.archiveName || "归档目录"}/${[...segments, filename].join("/")}`,
        renamed: filename !== originalFilename
      };
    } catch {
      return { mode: "archive-error" };
    }
  };

  const runAction = async (action, item) => {
    if (action === "process") {
      return { opened: await openItem(item) };
    }

    if (action === "archive") {
      return archiveFile(item);
    }

    return {};
  };

  const removeReceiptEntry = (action, item) => {
    const target = `${labelForAction(action, item)} · ${item.title}`;
    const index = state.receipts.lastIndexOf(target);
    if (index >= 0) state.receipts.splice(index, 1);
  };

  const pushDroppedItem = (item) => {
    state.dropped.push({
      ...item,
      droppedAt: new Date().toISOString()
    });
  };

  const buildDropListText = () => {
    const lines = [
      "待结 - 待删清单",
      `导出时间：${formatTimestamp(Date.now())}`,
      "",
      "这些条目是在待结里被标记为“待删 / 丢弃”的对象。",
      "MVP 不会直接替你永久删除；这份清单是给你手动复核和执行的。",
      ""
    ];

    state.dropped.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.title}`);
      lines.push(`   类型：${item.kind === "file" ? "文件" : "链接"}`);
      lines.push(`   来源：${item.queue}`);
      if (item.meta) lines.push(`   信息：${item.meta}`);
      if (item.path) lines.push(`   路径：${item.path}`);
      if (item.url) lines.push(`   URL：${item.url}`);
      lines.push(`   标记时间：${formatTimestamp(item.droppedAt || item.savedAt)}`);
      lines.push("");
    });

    return lines.join("\n");
  };

  const exportDropList = () => {
    if (!state.dropped.length) {
      setFeedback("待删清单还是空的。先标记几笔，再导出。");
      return;
    }

    const blob = new Blob([buildDropListText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `daijie-drop-list-${date}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback(`已导出 ${state.dropped.length} 条待删清单。删除这件事，先安全地做成可复核。`);
  };

  const resumeDeferredItems = (ids) => {
    const selectedIds = ids ? new Set(ids) : null;
    const selected = selectedIds
      ? state.deferred.filter((item) => selectedIds.has(item.id))
      : state.deferred.slice();
    if (!selected.length) return;

    state.history.push(snapshotState());
    state.deferred = selectedIds
      ? state.deferred.filter((item) => !selectedIds.has(item.id))
      : [];
    state.pending = sortQueue([...selected.map(toPendingItem), ...state.pending]);
    setFeedback(`已把 ${selected.length} 笔稍后文件放回队列。真正的稍后，不该等于消失。`);
    persistState();
    updateSummary();
    renderReceipts();
    renderCard();
  };

  const restoreDroppedItems = (ids) => {
    const selectedIds = ids ? new Set(ids) : null;
    const selected = selectedIds
      ? state.dropped.filter((item) => selectedIds.has(item.id))
      : state.dropped.slice();
    if (!selected.length) return;

    state.history.push(snapshotState());
    state.dropped = selectedIds
      ? state.dropped.filter((item) => !selectedIds.has(item.id))
      : [];
    state.pending = sortQueue([...selected.map(toPendingItem), ...state.pending]);
    state.processed = Math.max(0, state.processed - selected.length);
    state.released = Math.max(0, state.released - selected.reduce((sum, item) => sum + (Number(item.release) || 0), 0));
    state.lightness = Math.max(0, state.lightness - selected.length * 16);
    selected.forEach((item) => removeReceiptEntry("drop", item));
    setFeedback(`已把 ${selected.length} 笔待删文件恢复到队列。删之前先复核，才像真产品。`);
    persistState();
    updateSummary();
    renderReceipts();
    renderCard();
  };

  const forgetDroppedItems = (ids) => {
    const selectedIds = ids ? new Set(ids) : null;
    const countBefore = state.dropped.length;
    state.history.push(snapshotState());
    state.dropped = selectedIds
      ? state.dropped.filter((item) => !selectedIds.has(item.id))
      : [];
    const removedCount = countBefore - state.dropped.length;
    setFeedback(`已从待删清单移出 ${removedCount} 笔。适合你已经在别处手动处理完的文件。`);
    persistState();
    updateSummary();
    renderReceipts();
    renderCard();
  };

  const applyItemAction = async (action) => {
    const item = state.pending[0];
    if (!item) return;

    state.history.push(snapshotState());

    const result = await runAction(action, item);

    state.pending = state.pending.slice(1);
    if (action === "later") {
      state.deferred.push({
        ...item,
        deferredAt: new Date().toISOString()
      });
      state.lightness += 6;
      setFeedback(`已把「${item.title}」放进稍后区。它不会消失，但今天这轮也不用再卡在这里。`);
      persistState();
      updateSummary();
      renderReceipts();
      renderCard();
      return;
    }

    state.processed += 1;
    state.released += action === "drop" ? item.release : 0;
    state.lightness += action === "process" ? 18 : action === "drop" ? 16 : 14;
    state.receipts.push(`${labelForAction(action, item)} · ${item.title}`);
    if (action === "drop") pushDroppedItem(item);

    if (action === "archive" && item.kind === "file") {
      if (result.mode === "copied") {
        const renameNote = result.renamed ? " 目标目录里已有同名文件，这次自动补了后缀，避免静默覆盖。" : "";
        setFeedback(`已把「${item.title}」复制到归档目录。原文件还在原处，等你确认后再清理会更安全。${renameNote}`);
      } else if (result.mode === "missing-archive") {
        setFeedback(`已先把「${item.title}」标记为归档。连接归档文件夹后，下一笔就能直接落到归档目录。`);
      } else if (result.mode === "archive-error") {
        setFeedback(`已把「${item.title}」记为归档，但这次没能写入归档目录。可以重连归档文件夹再试。`);
      } else {
        setFeedback(`已把「${item.title}」记为归档。脑子里又少挂了一件事。`);
      }
    } else if (action === "drop") {
      setFeedback(`已把「${item.title}」加入待删清单。MVP 不会直接删，它会先让你安全复核。`);
    } else {
      const feedbackPrefix = action === "process"
        ? result.opened
          ? "已打开并处理"
          : item.sample
            ? "已在示例模式里处理"
            : item.kind === "file"
              ? item.restored
                ? "已先标记处理"
                : "已标记为看过"
              : "已标记处理"
        : labelForAction(action, item);

      setFeedback(`${feedbackPrefix}了「${item.title}」，脑子里又少挂了一件事。`);
    }
    persistState();
    updateSummary();
    renderReceipts();
    renderCard();
  };

  const undoLastAction = () => {
    const previous = state.history.pop();
    if (!previous) return;

    state.mode = previous.mode;
    state.pending = previous.pending.slice();
    state.processed = previous.processed;
    state.released = previous.released;
    state.lightness = previous.lightness;
    state.receipts = previous.receipts.slice();
    state.dropped = previous.dropped.slice();
    state.sources = { ...previous.sources };

    setFeedback("已撤回上一笔。做决定不该因为怕错而变慢。");
    persistState();
    updateSummary();
    renderReceipts();
    renderCard();
  };

  const ingestItems = (items, sourceKey, sourceLabel) => {
    if (!items.length) {
      if (sourceKey === "downloads" && refs.downloadsStatus) refs.downloadsStatus.textContent = `${sourceLabel} 里没有找到可处理的文件。`;
      if (sourceKey === "bookmarks" && refs.bookmarksStatus) refs.bookmarksStatus.textContent = "这个书签文件里没有解析到可用链接。";
      return;
    }

    const firstRealImport = state.mode !== "real";
    if (firstRealImport) {
      resetProgress();
      state.pending = [];
      state.sources = { downloads: 0, bookmarks: 0 };
    }

    state.mode = "real";
    state.pending = sortQueue([...state.pending, ...items]);
    state.sources[sourceKey] += items.length;
    setFeedback(`已从 ${sourceLabel} 生成 ${items.length} 张待结卡片。`);
    updateSummary();
    renderReceipts();
    renderCard();
  };

  const normalizeSampleCards = (cards) =>
    cards.map((card, index) => {
      const kind = card.queue === "信息账单" ? "bookmark" : "file";
      return {
        id: `sample-${index}`,
        kind,
        sample: true,
        queue: card.queue,
        kicker: card.kicker,
        title: card.title,
        path: card.title,
        meta: card.meta,
        message: card.message,
        tags: card.tags,
        reasons: card.reasons,
        release: card.release,
        priority: 100 - index * 5
      };
    });

  const loadSampleQueue = (feedback) => {
    clearAll();
    state.mode = "sample";
    state.pending = normalizeSampleCards(sampleCards);
    updateSummary();
    renderReceipts();
    renderCard();
    if (feedback) setFeedback(feedback);
    persistState();
  };

  const createFileItem = (file, descriptor) => {
    const extension = getExtension(file.name);
    const sizeMb = file.size / 1024 / 1024;
    const staleDays = getDaysSince(file.lastModified);
    const lowerName = file.name.toLowerCase();
    const isScreenshot = /screenshot|screen shot|屏幕快照|截屏|img[_-]?\d{3,}/i.test(lowerName);
    const isInstaller = ["dmg", "pkg", "zip", "rar", "7z", "iso", "exe"].includes(extension);
    const isTemp = /final|副本|copy|untitled|tmp|temp|新建|导出/i.test(lowerName);
    const reasons = [];
    const tags = [];

    if (staleDays >= 14) reasons.push(`${staleDays} 天没动，已经离开当时场景`);
    if (isScreenshot) reasons.push("看起来像临时截图，判断成本低");
    if (isInstaller) reasons.push("安装包通常只在某个时刻有用");
    if (isTemp) reasons.push("像过渡版本或临时导出文件");
    if (sizeMb >= 120) reasons.push("这一笔处理完，释放空间会很明显");
    if (!reasons.length) reasons.push("判断成本低，适合先结一笔");

    if (isScreenshot) tags.push("临时截图");
    if (isInstaller) tags.push("安装包");
    if (isTemp) tags.push("过渡文件");
    tags.push(staleDays >= 14 ? "拖了有一阵" : "可以快速判断");
    if (tags.length < 3) tags.push(sizeMb >= 80 ? "大文件" : "轻量处理");

    const typeLabel = describeFileType(extension, file.type);
    const meta = `${typeLabel} · ${Math.max(staleDays, 1)} 天没动 · ${formatSizeMb(sizeMb)}`;
    const message = isScreenshot
      ? "这类截图通常只在当下有用。现在看一眼，再决定是留、归档，还是直接删掉。"
      : isInstaller
        ? "安装包和压缩包很容易在 Downloads 里长期悬挂。确认还需不需要，比继续堆着更轻。"
        : "这类文件往往不是难处理，只是每次都不想重新打开。现在结掉一笔，比等整理日更实际。";

    return {
      id: makeId("file"),
      kind: "file",
      queue: "文件账单",
      kicker: descriptor.kicker || "Downloads",
      title: file.name,
      path: descriptor.path || file.name,
      meta,
      message,
      tags: tags.slice(0, 3),
      reasons: reasons.slice(0, 3),
      release: sizeMb,
      priority: (staleDays >= 30 ? 20 : staleDays >= 14 ? 14 : 8) + (isScreenshot ? 12 : 0) + (isInstaller ? 10 : 0) + (isTemp ? 7 : 0) + (sizeMb > 120 ? 6 : 0)
    };
  };

  const createBookmarkItem = (bookmark, domainCounts) => {
    const addDate = Number(bookmark.addDate || 0) * 1000 || null;
    const staleDays = addDate ? getDaysSince(addDate) : 0;
    const hostname = safeHostname(bookmark.url);
    const duplicateCount = domainCounts[hostname] || 1;
    const reasons = [];
    const tags = ["信息债"];

    if (duplicateCount >= 3) reasons.push(`同域内容存了 ${duplicateCount} 条，值得先精选一次`);
    if (staleDays >= 21) reasons.push(`${staleDays} 天前收藏，还没消化`);
    if (duplicateCount <= 1) reasons.push("这张卡的处理结果很明确");
    if (!reasons.length) reasons.push("比继续囤着更有价值的是做掉一个明确决定");

    if (duplicateCount >= 2) tags.push(`同域 ${duplicateCount} 条`);
    tags.push(staleDays >= 21 ? "拖了有一阵" : "现在就能处理");
    if (tags.length < 3) tags.push("适合精选");

    return {
      id: makeId("bookmark"),
      kind: "bookmark",
      queue: "信息账单",
      kicker: hostname,
      title: bookmark.title,
      meta: `收藏链接 · ${staleDays ? `${staleDays} 天前存入` : "刚刚导入"}${duplicateCount >= 2 ? ` · 同域 ${duplicateCount} 条` : ""}`,
      message: duplicateCount >= 2
        ? "你已经连续存过同类内容。比继续堆链接更有价值的是现在做掉一个明确决定。"
        : "不是所有收藏都要读完。给这条链接一个清楚结论，比让它继续挂着更轻。",
      tags: tags.slice(0, 3),
      reasons: reasons.slice(0, 3),
      release: 0,
      priority: (duplicateCount >= 3 ? 16 : duplicateCount === 2 ? 10 : 6) + Math.min(staleDays, 60) * 0.25,
      url: bookmark.url
    };
  };

  const openFile = async (item) => {
    const runtimeEntry = runtimeFiles.get(item.id);
    if (!runtimeEntry) return false;

    const file = runtimeEntry.handle ? await runtimeEntry.handle.getFile() : runtimeEntry.file;
    if (!file) return false;

    const objectUrl = URL.createObjectURL(file);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    return true;
  };

  const openItem = async (item) => {
    if (item.sample) return false;
    if (item.kind === "bookmark" && item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
      return true;
    }

    if (item.kind === "file") {
      return openFile(item);
    }

    return false;
  };

  const readDirectoryEntries = async (directoryHandle, options = {}) => {
    const limit = options.limit || 120;
    const maxDepth = options.maxDepth || 2;
    const collected = [];

    const walk = async (handle, trail, depth) => {
      for await (const entry of handle.values()) {
        if (collected.length >= limit) return;

        const nextTrail = trail ? `${trail}/${entry.name}` : entry.name;
        if (entry.kind === "file") {
          const file = await entry.getFile();
          collected.push({
            file,
            handle: entry,
            path: nextTrail
          });
          continue;
        }

        if (entry.kind === "directory" && depth < maxDepth) {
          await walk(entry, nextTrail, depth + 1);
        }
      }
    };

    await walk(directoryHandle, "", 0);
    return collected;
  };

  const importDownloadsFromFiles = async (files, sourceLabel) => {
    const queueItems = [];
    for (const entry of files.slice(0, 120)) {
      const item = createFileItem(entry.file, {
        kicker: sourceLabel,
        path: entry.path || entry.file.name
      });
      runtimeFiles.set(item.id, entry.handle ? { handle: entry.handle } : { file: entry.file });
      queueItems.push(item);
    }

    ingestItems(queueItems, "downloads", sourceLabel);
    if (refs.downloadsStatus) refs.downloadsStatus.textContent = `已从 ${sourceLabel} 载入 ${queueItems.length} 个文件。`;
    persistState();
  };

  const handleDownloadsPicker = async () => {
    if (!window.showDirectoryPicker) {
      refs.downloadsInput?.click();
      return;
    }

    try {
      const handle = await window.showDirectoryPicker({ mode: "read" });
      const files = await readDirectoryEntries(handle, { limit: 120, maxDepth: 2 });
      await importDownloadsFromFiles(files, handle.name || "Downloads");
    } catch (error) {
      if (error && error.name === "AbortError") return;
      if (refs.downloadsStatus) refs.downloadsStatus.textContent = "连接文件夹失败了，可以试试“选择文件夹”这个回退方式。";
    }
  };

  const handleArchivePicker = async () => {
    if (!window.showDirectoryPicker) {
      if (refs.archiveStatus) refs.archiveStatus.textContent = "当前浏览器不支持直接连接归档文件夹，建议在 Chrome / Edge 中使用。";
      return;
    }

    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      runtime.archiveHandle = handle;
      runtime.archiveName = handle.name || "归档目录";
      if (refs.archiveStatus) {
        refs.archiveStatus.textContent = `已连接归档文件夹：${runtime.archiveName}。之后“归档”会先复制进去，再由你决定是否清理原文件。`;
      }
      persistState();
    } catch (error) {
      if (error && error.name === "AbortError") return;
      if (refs.archiveStatus) refs.archiveStatus.textContent = "连接归档文件夹失败了，请确认浏览器支持并授予写入权限。";
    }
  };

  const handleDownloadsInput = async (event) => {
    const list = Array.from(event.target.files || []);
    const files = list.map((file) => ({
      file,
      path: file.webkitRelativePath || file.name
    }));

    await importDownloadsFromFiles(files, "选中的文件夹");
    event.target.value = "";
  };

  const extractBookmarks = (html) => {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(html, "text/html");
    const anchors = Array.from(documentNode.querySelectorAll("a[href]"))
      .map((anchor) => ({
        title: anchor.textContent.trim() || safeHostname(anchor.getAttribute("href") || ""),
        url: anchor.getAttribute("href") || "",
        addDate: anchor.getAttribute("add_date") || anchor.getAttribute("ADD_DATE") || ""
      }))
      .filter((item) => /^https?:\/\//i.test(item.url));

    const domainCounts = anchors.reduce((accumulator, item) => {
      const hostname = safeHostname(item.url);
      accumulator[hostname] = (accumulator[hostname] || 0) + 1;
      return accumulator;
    }, {});

    return anchors.slice(0, 160).map((item) => createBookmarkItem(item, domainCounts));
  };

  const handleBookmarksInput = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const html = await file.text();
      const bookmarks = extractBookmarks(html);
      ingestItems(bookmarks, "bookmarks", "收藏夹");
      if (refs.bookmarksStatus) refs.bookmarksStatus.textContent = `已导入 ${bookmarks.length} 条收藏链接。`;
      persistState();
      event.target.value = "";
    } catch {
      if (refs.bookmarksStatus) refs.bookmarksStatus.textContent = "这个文件解析失败了，建议重新导出书签 HTML 再试一次。";
    }
  };

  const handleReviewAction = (event) => {
    const button = event.target.closest("[data-review-action]");
    if (!button) return;

    const id = button.dataset.reviewId;
    const action = button.dataset.reviewAction;

    if (action === "resume-deferred" && id) {
      resumeDeferredItems([id]);
      return;
    }

    if (action === "restore-drop" && id) {
      restoreDroppedItems([id]);
      return;
    }

    if (action === "forget-drop" && id) {
      forgetDroppedItems([id]);
    }
  };

  refs.actionButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.mvpAction;
      await applyItemAction(action);
    });
  });

  refs.undo?.addEventListener("click", undoLastAction);
  refs.connectDownloads?.addEventListener("click", handleDownloadsPicker);
  refs.connectArchive?.addEventListener("click", handleArchivePicker);
  refs.downloadsInput?.addEventListener("change", handleDownloadsInput);
  refs.bookmarksInput?.addEventListener("change", handleBookmarksInput);
  refs.deferredList?.addEventListener("click", handleReviewAction);
  refs.dropReviewList?.addEventListener("click", handleReviewAction);
  refs.resumeDeferred?.addEventListener("click", () => resumeDeferredItems());
  refs.restoreDropped?.addEventListener("click", () => restoreDroppedItems());
  refs.exportDropList?.addEventListener("click", exportDropList);
  refs.loadSample?.addEventListener("click", () => {
    loadSampleQueue(copy.sampleReloaded);
    if (refs.downloadsStatus) refs.downloadsStatus.textContent = defaultStatuses.downloads;
    if (refs.bookmarksStatus) refs.bookmarksStatus.textContent = defaultStatuses.bookmarks;
    if (refs.archiveStatus) refs.archiveStatus.textContent = defaultStatuses.archive;
  });
  refs.clearSession?.addEventListener("click", () => {
    clearAll();
    updateSummary();
    renderReceipts();
    renderCard();
    setFeedback(copy.cleared);
    persistState();
  });

  if (restorePersistedState()) {
    updateSummary();
    renderReceipts();
    renderCard();
    setFeedback(copy.restored);
  } else {
    loadSampleQueue(copy.sampleReady);
  }
})();
