(function () {
  const bootstrapNode = document.getElementById("reset-antechamber-bootstrap");
  if (!bootstrapNode) return;

  const bootstrap = JSON.parse(bootstrapNode.textContent || "{}");
  const storageKey = typeof bootstrap.storageKey === "string" && bootstrap.storageKey
    ? bootstrap.storageKey
    : "reset-antechamber:v1";
  const presets = Array.isArray(bootstrap.presets) ? bootstrap.presets : [];

  const refs = {
    input: document.getElementById("reset-input"),
    generate: document.getElementById("reset-generate"),
    sample: document.getElementById("reset-load-sample"),
    clear: document.getElementById("reset-clear-session"),
    status: document.getElementById("reset-source-status"),
    sourceCount: document.getElementById("reset-source-count"),
    pendingCount: document.getElementById("reset-pending-count"),
    queueIndex: document.getElementById("reset-queue-index"),
    queueTotal: document.getElementById("reset-queue-total"),
    kicker: document.getElementById("reset-kicker"),
    title: document.getElementById("reset-title"),
    meta: document.getElementById("reset-meta"),
    message: document.getElementById("reset-message"),
    tags: document.getElementById("reset-tags"),
    reasons: document.getElementById("reset-reasons"),
    receipts: document.getElementById("reset-receipts"),
    followedCount: document.getElementById("reset-followed-count"),
    calmScore: document.getElementById("reset-calm-score"),
    laterCount: document.getElementById("reset-later-count"),
    remaining: document.getElementById("reset-remaining"),
    doneMirror: document.getElementById("reset-followed-count-mirror"),
    laterMirror: document.getElementById("reset-later-count-mirror"),
    doneList: document.getElementById("reset-done-list"),
    laterList: document.getElementById("reset-later-list"),
    feedback: document.getElementById("reset-feedback"),
    follow: document.getElementById("reset-follow"),
    lighter: document.getElementById("reset-lighter"),
    later: document.getElementById("reset-later"),
    undo: document.getElementById("reset-undo"),
    restoreLater: document.getElementById("reset-restore-later"),
    presetButtons: document.querySelectorAll("[data-reset-preset]")
  };

  if (!refs.input || !refs.generate || !refs.title) return;

  const state = {
    input: "",
    pending: [],
    done: [],
    later: [],
    receipts: [],
    calm: 0,
    sourceCount: 0,
    history: []
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

  const copy = {
    status: "输入现在最绷的地方，系统先给你一轮安抚卡，再把你送去今日复位。",
    ready: "复位前室已经就绪。先把自己接住，再谈后面的事。",
    restored: "已恢复上一轮前室状态。",
    cleared: "这一轮已经清空。你可以重新写一个状态，或先载入示例。",
    sample: "已载入前室示例。现在只需要先跟第一张卡。"
  };

  const makeId = (prefix) => {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  };

  const normalizeText = (value) => (value || "").trim().replace(/\s+/g, " ");
  const deepClone = (value) => JSON.parse(JSON.stringify(value));

  const persist = () => {
    if (!hasLocalStorage) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignore storage write failures.
    }
  };

  const restore = () => {
    if (!hasLocalStorage) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "null");
      if (!saved || typeof saved !== "object") return;
      state.input = typeof saved.input === "string" ? saved.input : "";
      state.pending = Array.isArray(saved.pending) ? saved.pending : [];
      state.done = Array.isArray(saved.done) ? saved.done : [];
      state.later = Array.isArray(saved.later) ? saved.later : [];
      state.receipts = Array.isArray(saved.receipts) ? saved.receipts : [];
      state.calm = Number.isFinite(saved.calm) ? saved.calm : 0;
      state.sourceCount = Number.isFinite(saved.sourceCount) ? saved.sourceCount : state.pending.length;
      state.history = Array.isArray(saved.history) ? saved.history : [];
      refs.input.value = state.input;
      if (state.pending.length || state.done.length || state.later.length) {
        refs.status.textContent = copy.restored;
      }
    } catch {
      // Ignore storage parse failures.
    }
  };

  const buildCards = (input) => {
    const context = normalizeText(input) || "今天整个人都有点绷";
    const lower = context.toLowerCase();
    const isPhone = /刷|手机|短视频|停不下来|小红书|b站|抖音/.test(lower);
    const isMessage = /消息|微信|邮件|回复|聊天/.test(lower);
    const isRoom = /房|桌|床|衣服|地上|乱/.test(lower);
    const isMental = /脑|焦虑|压|绷|累|烦|吵|散|慌/.test(lower);

    const sootheCard = {
      id: makeId("antechamber"),
      queue: "前室动作",
      kicker: "先安抚一下",
      title: isPhone
        ? "先把手机扣下 30 秒"
        : isMessage
          ? "先把聊天列表关掉，慢呼气 3 次"
          : "先放松肩膀和下巴，慢呼气 3 次",
      meta: `${context} · 先松一点 · 不急着处理`,
      message: "你现在不需要立刻变好，只要先让身体别继续往紧里走。",
      tags: ["先接住", "30 秒", "不要求振作"],
      reasons: [
        "身体先松一点，判断才不会继续变硬",
        "先让刺激停一下，比继续顶着更有用",
        "前室的第一步不是做事，是回场"
      ],
      variants: [
        {
          title: isPhone ? "先把手机扣下 30 秒" : isMessage ? "先把聊天列表关掉，慢呼气 3 次" : "先放松肩膀和下巴，慢呼气 3 次",
          message: "你现在不需要立刻变好，只要先让身体别继续往紧里走。"
        },
        {
          title: "先喝两口水，再回来",
          message: "不用激励自己，先给身体一个被照顾到的信号。"
        },
        {
          title: "先把手从屏幕 / 键盘上拿开",
          message: "先停 20 秒，让输入流断一下，你才接得住下一步。"
        }
      ],
      variantIndex: 0
    };

    const nameCard = {
      id: makeId("antechamber"),
      queue: "前室动作",
      kicker: "先承认现在",
      title: isMessage
        ? "先承认：我现在就是不想回"
        : isMental
          ? "先给现在的状态起个名字"
          : "先说出今天只想顾哪一小块",
      meta: `${context} · 命名一下 · 不急着解决`,
      message: "当前状态一旦有名字，就不再只是模糊的压迫感。",
      tags: ["先命名", "少一点雾", "不求解决"],
      reasons: [
        "被命名的东西，通常更不会压成一团",
        "先承认当前状态，比装作没事更容易回稳",
        "你不需要马上解决，只要先看清一点"
      ],
      variants: [
        {
          title: isMessage ? "先承认：我现在就是不想回" : isMental ? "先给现在的状态起个名字" : "先说出今天只想顾哪一小块",
          message: "当前状态一旦有名字，就不再只是模糊的压迫感。"
        },
        {
          title: "先写下最吵的 3 个词",
          message: "不是写计划，只是把最吵的东西从脑子里拿出来。"
        },
        {
          title: "先划掉今天明确不做的 1 件事",
          message: "把边界补出来，心里会空一点。"
        }
      ],
      variantIndex: 0
    };

    const handoffCard = {
      id: makeId("antechamber"),
      queue: "去今日复位",
      kicker: "轻轻过渡",
      title: isMessage
        ? "现在去回 1 条最容易结束的消息"
        : isRoom
          ? "现在只清 3 个最显眼的东西"
          : isMental
            ? "现在写下脑子里最吵的 3 件事"
            : "现在去做一笔最轻的今日复位",
      meta: `${context} · 过渡到复位 · 只走一小步`,
      message: "前室不是终点。它的作用，是把你轻轻送进今天真正能接住的那一笔。",
      tags: ["轻过渡", "去复位", "不突然加压"],
      reasons: [
        "现在不是直接冲执行，而是接一笔最轻的复位动作",
        "把跨度缩短，反而更容易继续",
        "前室成功的标志，是你愿意往复位走一步"
      ],
      variants: [
        {
          title: isMessage ? "现在去回 1 条最容易结束的消息" : isRoom ? "现在只清 3 个最显眼的东西" : isMental ? "现在写下脑子里最吵的 3 件事" : "现在去做一笔最轻的今日复位",
          message: "前室不是终点。它的作用，是把你轻轻送进今天真正能接住的那一笔。"
        },
        {
          title: "现在只做一个 10 秒决定",
          message: "找一件不需要组织太多意志力的事，让自己从静止转成轻推进。"
        },
        {
          title: "现在只清出一小块面",
          message: "先给眼前和脑子都留一点空白，别要求更大。"
        }
      ],
      variantIndex: 0
    };

    return [sootheCard, nameCard, handoffCard];
  };

  const getViewCard = (card) => {
    const variant = Array.isArray(card.variants) ? card.variants[card.variantIndex || 0] : null;
    if (!variant) return card;
    return {
      ...card,
      ...variant
    };
  };

  const setFeedback = (text) => {
    if (refs.feedback) refs.feedback.textContent = text;
  };

  const renderTags = (tags) => {
    if (!refs.tags) return;
    refs.tags.innerHTML = "";
    (tags || []).forEach((tag) => {
      const chip = document.createElement("span");
      chip.textContent = tag;
      refs.tags.appendChild(chip);
    });
  };

  const renderReasons = (items) => {
    if (!refs.reasons) return;
    refs.reasons.innerHTML = "";
    (items || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      refs.reasons.appendChild(li);
    });
  };

  const renderReceipts = () => {
    if (!refs.receipts) return;
    refs.receipts.innerHTML = "";
    if (!state.receipts.length) {
      const li = document.createElement("li");
      li.textContent = "先把自己接住，今天的前室收据就会开始长出来。";
      refs.receipts.appendChild(li);
      return;
    }
    state.receipts.slice().reverse().forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      refs.receipts.appendChild(li);
    });
  };

  const renderReviewList = (target, items, emptyText) => {
    if (!target) return;
    target.innerHTML = "";
    if (!items.length) {
      const li = document.createElement("li");
      li.className = "action-review-empty";
      li.textContent = emptyText;
      target.appendChild(li);
      return;
    }

    items.slice().reverse().forEach((item) => {
      const li = document.createElement("li");
      li.className = "action-review-item";
      const strong = document.createElement("strong");
      strong.textContent = item.title;
      const span = document.createElement("span");
      span.textContent = item.meta;
      li.append(strong, span);
      if (item.mode === "later") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "action-review-button";
        button.textContent = "放回队列";
        button.addEventListener("click", () => restoreLaterItem(item.id));
        li.appendChild(button);
      }
      target.appendChild(li);
    });
  };

  const snapshot = () => deepClone({
    input: state.input,
    pending: state.pending,
    done: state.done,
    later: state.later,
    receipts: state.receipts,
    calm: state.calm,
    sourceCount: state.sourceCount
  });

  const pushHistory = () => {
    state.history.push(snapshot());
    if (state.history.length > 20) state.history.shift();
  };

  const restoreSnapshot = (saved) => {
    state.input = saved.input || "";
    state.pending = Array.isArray(saved.pending) ? saved.pending : [];
    state.done = Array.isArray(saved.done) ? saved.done : [];
    state.later = Array.isArray(saved.later) ? saved.later : [];
    state.receipts = Array.isArray(saved.receipts) ? saved.receipts : [];
    state.calm = Number.isFinite(saved.calm) ? saved.calm : 0;
    state.sourceCount = Number.isFinite(saved.sourceCount) ? saved.sourceCount : state.pending.length;
    refs.input.value = state.input;
    persist();
    render();
  };

  const currentCard = () => state.pending[0] || null;

  const render = () => {
    const card = currentCard();
    const view = card ? getViewCard(card) : null;
    const remaining = state.pending.length;
    const total = state.sourceCount || remaining || 1;

    refs.sourceCount.textContent = `本轮 ${state.sourceCount}`;
    refs.pendingCount.textContent = `待排 ${remaining}`;
    refs.queueIndex.textContent = remaining ? String(state.sourceCount - remaining + 1) : "0";
    refs.queueTotal.textContent = String(total);
    refs.followedCount.textContent = String(state.done.length);
    refs.doneMirror.textContent = String(state.done.length);
    refs.laterCount.textContent = String(state.later.length);
    refs.laterMirror.textContent = String(state.later.length);
    refs.remaining.textContent = String(remaining);
    refs.calmScore.textContent = String(state.calm);
    refs.undo.disabled = state.history.length === 0;
    refs.restoreLater.disabled = state.later.length === 0;

    if (!view) {
      refs.kicker.textContent = "复位前室";
      refs.title.textContent = "先输入一句你现在乱在哪里。";
      refs.meta.textContent = "先安抚，再进入今日复位。";
      refs.message.textContent = "你不需要现在就变高效。先让自己回到能接住一件小事的状态。";
      renderTags(["先接住", "前室", "再复位"]);
      renderReasons([
        "状态太绷的时候，执行只会更像压力",
        "先回场，后面的复位才接得住",
        "今天先照顾自己也成立"
      ]);
      refs.follow.disabled = true;
      refs.lighter.disabled = true;
      refs.later.disabled = true;
    } else {
      refs.kicker.textContent = view.kicker;
      refs.title.textContent = view.title;
      refs.meta.textContent = view.meta;
      refs.message.textContent = view.message;
      renderTags(view.tags);
      renderReasons(view.reasons);
      refs.follow.disabled = false;
      refs.lighter.disabled = false;
      refs.later.disabled = false;
    }

    renderReceipts();
    renderReviewList(
      refs.doneList,
      state.done,
      "还没有动作进入“已跟做”。先跟第一张卡，身体和注意力会先松一点。"
    );
    renderReviewList(
      refs.laterList,
      state.later,
      "稍后区还是空的。现在不想跟的卡，可以先安全挪开。"
    );
    persist();
  };

  const generate = (input, forceSample = false) => {
    const finalInput = normalizeText(input) || (forceSample ? presets[0] || "" : "");
    if (!finalInput) {
      setFeedback(copy.status);
      return;
    }
    pushHistory();
    state.input = finalInput;
    refs.input.value = finalInput;
    state.pending = buildCards(finalInput);
    state.done = [];
    state.later = [];
    state.receipts = [];
    state.calm = 0;
    state.sourceCount = state.pending.length;
    setFeedback(forceSample ? copy.sample : `已把“${finalInput}”收成一轮前室动作。`);
    render();
  };

  const markDone = () => {
    const card = currentCard();
    if (!card) return;
    pushHistory();
    const view = getViewCard(card);
    state.pending.shift();
    state.done.push({ id: card.id, title: view.title, meta: view.meta });
    state.receipts.push(`跟做 · ${view.title}`);
    state.calm += 6;
    setFeedback(`先这样就够了：${view.title}`);
    render();
  };

  const makeLighter = () => {
    const card = currentCard();
    if (!card || !Array.isArray(card.variants) || card.variants.length < 2) return;
    pushHistory();
    card.variantIndex = ((card.variantIndex || 0) + 1) % card.variants.length;
    setFeedback("已经换成更轻的一版。");
    render();
  };

  const defer = () => {
    const card = currentCard();
    if (!card) return;
    pushHistory();
    const view = getViewCard(card);
    state.pending.shift();
    state.later.push({ id: card.id, title: view.title, meta: view.meta, mode: "later", card: deepClone(card) });
    state.receipts.push(`稍后 · ${view.title}`);
    setFeedback(`已先把这张挪开：${view.title}`);
    render();
  };

  const restoreLaterItem = (id) => {
    const index = state.later.findIndex((item) => item.id === id);
    if (index < 0) return;
    pushHistory();
    const [item] = state.later.splice(index, 1);
    if (item.card) state.pending.unshift(item.card);
    setFeedback(`已放回队列：${item.title}`);
    render();
  };

  const restoreAllLater = () => {
    if (!state.later.length) return;
    pushHistory();
    const recovered = state.later
      .map((item) => item.card)
      .filter(Boolean)
      .reverse();
    state.pending = recovered.concat(state.pending);
    state.later = [];
    setFeedback("已把稍后区全部放回队列。");
    render();
  };

  const undo = () => {
    const previous = state.history.pop();
    if (!previous) return;
    restoreSnapshot(previous);
    setFeedback("已撤回上一步。");
  };

  const clearAll = () => {
    pushHistory();
    state.input = "";
    refs.input.value = "";
    state.pending = [];
    state.done = [];
    state.later = [];
    state.receipts = [];
    state.calm = 0;
    state.sourceCount = 0;
    setFeedback(copy.cleared);
    render();
  };

  refs.generate.addEventListener("click", () => generate(refs.input.value, false));
  refs.sample.addEventListener("click", () => generate(presets[0] || "", true));
  refs.clear.addEventListener("click", clearAll);
  refs.follow.addEventListener("click", markDone);
  refs.lighter.addEventListener("click", makeLighter);
  refs.later.addEventListener("click", defer);
  refs.undo.addEventListener("click", undo);
  refs.restoreLater.addEventListener("click", restoreAllLater);

  refs.presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset.resetPreset || "";
      refs.input.value = value;
      setFeedback(`已填入示例：${value}`);
    });
  });

  restore();
  if (!refs.status.textContent) refs.status.textContent = copy.status;
  setFeedback(refs.feedback.textContent || copy.ready);
  render();
})();
