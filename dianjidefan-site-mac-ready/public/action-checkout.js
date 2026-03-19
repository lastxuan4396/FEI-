(function () {
  const bootstrapNode = document.getElementById("action-checkout-bootstrap");
  if (!bootstrapNode) return;

  const bootstrap = JSON.parse(bootstrapNode.textContent || "{}");
  const storageKey = typeof bootstrap.storageKey === "string" && bootstrap.storageKey
    ? bootstrap.storageKey
    : "action-checkout:v1";
  const presets = bootstrap.presets || {};

  const refs = {
    modeButtons: document.querySelectorAll("[data-action-mode]"),
    taskInput: document.getElementById("action-input"),
    generate: document.getElementById("action-generate"),
    loadSample: document.getElementById("action-load-sample"),
    clear: document.getElementById("action-clear-session"),
    status: document.getElementById("action-source-status"),
    sourceCount: document.getElementById("action-source-count"),
    pendingCount: document.getElementById("action-pending-count"),
    engineBadge: document.getElementById("action-engine-badge"),
    engineRoute: document.getElementById("action-engine-route"),
    engineStage: document.getElementById("action-engine-stage"),
    engineCost: document.getElementById("action-engine-cost"),
    engineNote: document.getElementById("action-engine-note"),
    queueTitle: document.getElementById("action-queue-title"),
    queueIndex: document.getElementById("action-queue-index"),
    queueTotal: document.getElementById("action-queue-total"),
    kicker: document.getElementById("action-kicker"),
    title: document.getElementById("action-title"),
    meta: document.getElementById("action-meta"),
    message: document.getElementById("action-message"),
    tags: document.getElementById("action-tags"),
    reasons: document.getElementById("action-reasons"),
    feedback: document.getElementById("action-feedback"),
    momentum: document.getElementById("action-momentum"),
    doneCount: document.getElementById("action-done-count"),
    doneCountMirror: document.getElementById("action-done-count-mirror"),
    deferredCount: document.getElementById("action-deferred-count"),
    deferredCountMirror: document.getElementById("action-deferred-count-mirror"),
    remaining: document.getElementById("action-remaining"),
    receipts: document.getElementById("action-receipts"),
    doneList: document.getElementById("action-done-list"),
    deferredList: document.getElementById("action-deferred-list"),
    restoreDeferred: document.getElementById("action-restore-deferred"),
    undo: document.getElementById("action-undo"),
    start: document.getElementById("action-start"),
    later: document.getElementById("action-later"),
    swap: document.getElementById("action-swap"),
    presetButtons: document.querySelectorAll("[data-action-preset]")
  };

  if (!refs.title || !refs.generate || !refs.taskInput) return;

  const state = {
    mode: "task",
    input: "",
    pending: [],
    done: [],
    deferred: [],
    receipts: [],
    momentum: 0,
    history: [],
    sourceCount: 0
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
    taskPlaceholder: "比如：做一份给导师看的汇报 PPT",
    resetPlaceholder: "比如：微信里有几条消息一直不想回，今天只想先复位一点点",
    taskStatus: "输入一句现在卡住的事，系统会把它压成几张可以立即开工的小动作卡。",
    resetStatus: "输入你现在乱在哪里。今日复位不会让你大扫除，只会先把你拉回可开始区。",
    ready: "行动收银台已经就绪。输入一句任务，或直接载入一轮示例。",
    restored: "已恢复你上一轮行动账单。",
    cleared: "这一轮已经清空。你可以重新输入一件事，或先载入一轮示例。",
    sample: "已载入示例队列。现在只需要先做第一刀。"
  };

  const makeId = (prefix) => {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  };

  const deepClone = (value) => JSON.parse(JSON.stringify(value));

  const normalizeText = (value) => (value || "").trim().replace(/\s+/g, " ");

  const engineStageProfile = [
    {
      label: "规则起手",
      cost: "低成本",
      note: "先走规则归类，判断它更像哪种场景，不让系统每次都从零理解。"
    },
    {
      label: "模板重写",
      cost: "低成本",
      note: "当前已经进入模板重写层，会在同一类场景里换一张更顺手的动作卡。"
    },
    {
      label: "升级求精",
      cost: "按需升级",
      note: "只有继续换刀时才进入更深一层求精。贵推理应该只用在这里，不该每次都烧。"
    }
  ];

  const attachEngineMeta = (card, routeLabel, stageNotes) => ({
    ...card,
    routeLabel,
    stageNotes: Array.isArray(stageNotes) && stageNotes.length
      ? stageNotes
      : engineStageProfile.map((item) => item.note),
    variantIndex: Number(card.variantIndex) || 0
  });

  const detectTaskKind = (input) => {
    const value = input.toLowerCase();
    if (/ppt|汇报|演示|slides|deck/.test(value)) return "deck";
    if (/简历|resume|cv/.test(value)) return "resume";
    if (/邮件|email|mail|回信/.test(value)) return "email";
    if (/文章|文案|写作|稿子|写/.test(value)) return "writing";
    if (/学习|课程|视频|复习|论文|读/.test(value)) return "study";
    return "generic";
  };

  const buildTaskCards = (input) => {
    const task = normalizeText(input) || "把你卡住的那件事先撬开";
    const kind = detectTaskKind(task);
    const subjectMeta = {
      deck: {
        label: "汇报任务",
        engineRoute: "任务识别 · 汇报 / PPT",
        third: {
          title: "先写封面标题",
          message: "先把标题、对象和日期落下去。封面有了，任务就不再是空气。",
          variants: [
            {
              title: "先写封面标题",
              message: "先把标题、对象和日期落下去。封面有了，任务就不再是空气。"
            },
            {
              title: "先列 3 个要讲的点",
              message: "不要想完整页数，先只写 3 个核心点，顺序晚点再调。"
            },
            {
              title: "先建一个空白 deck",
              message: "只先把承载物建起来，别在开始前做结构焦虑。"
            }
          ]
        }
      },
      resume: {
        label: "简历任务",
        engineRoute: "任务识别 · 简历",
        third: {
          title: "先改目标岗位标题",
          message: "先把简历最上面的目标岗位改掉，让这份简历真正开始服务一个方向。",
          variants: [
            {
              title: "先改目标岗位标题",
              message: "先把简历最上面的目标岗位改掉，让这份简历真正开始服务一个方向。"
            },
            {
              title: "先重写 1 句个人摘要",
              message: "不用全改，先把最上面的一句换成更像目标岗位的说法。"
            },
            {
              title: "先删掉最弱的一条经历",
              message: "减法比加法更容易起步。先删一条最不相关的内容。"
            }
          ]
        }
      },
      email: {
        label: "回复任务",
        engineRoute: "任务识别 · 邮件 / 回复",
        third: {
          title: "先写主题和称呼",
          message: "回邮件最难的常常不是内容，而是打开草稿。先写主题和开头就够了。",
          variants: [
            {
              title: "先写主题和称呼",
              message: "回邮件最难的常常不是内容，而是打开草稿。先写主题和开头就够了。"
            },
            {
              title: "先写第一句结论",
              message: "直接写“这件事我建议……”，不要先想整封信怎么漂亮。"
            },
            {
              title: "先列 2 个要回的点",
              message: "把你真正需要回应的 2 个点列出来，正文可以后面再长。"
            }
          ]
        }
      },
      writing: {
        label: "写作任务",
        engineRoute: "任务识别 · 写作",
        third: {
          title: "先写开头一句",
          message: "不要先想完整结构。先写一句能让你继续下去的开头。"
        }
      },
      study: {
        label: "学习任务",
        engineRoute: "任务识别 · 学习 / 资料",
        third: {
          title: "先打开材料并写 1 个问题",
          message: "学习最好的起手不是刷更多资料，而是先让注意力落到一个问题上。"
        }
      },
      generic: {
        label: "任务破冰",
        engineRoute: "任务识别 · 泛任务",
        third: {
          title: "先列 3 个最小子步",
          message: "不要规划完整路径，只写 3 个能真的动起来的小动作。"
        }
      }
    };

    const meta = subjectMeta[kind];
    const commonReasons = [
      "这刀足够小，不需要重新组织人生",
      "动作一旦落地，任务就从空气变成对象",
      "先有推进，再谈完整方案"
    ];

    return [
      {
        id: makeId("action-task"),
        queue: "行动账单",
        kicker: meta.label,
        title: "先开一个承载物",
        meta: `${task} · 第一刀 · 0 到 1`,
        message: "先建一个文档、便签、文件或草稿框。先有容器，才有下一步。",
        tags: ["零门槛", "先落地", "不用规划"],
        reasons: commonReasons,
        variants: [
          { title: "先开一个承载物", message: "先建一个文档、便签、文件或草稿框。先有容器，才有下一步。" },
          { title: "先把任务名字写下来", message: "只写出任务名称，让它从脑子里落到屏幕上。" },
          { title: "先把相关文件聚到一个地方", message: "先收拢，而不是先整理。先让这件事有边界。" }
        ],
        variantIndex: 0
      },
      {
        id: makeId("action-task"),
        queue: "行动账单",
        kicker: meta.label,
        title: "写一句“做完会长什么样”",
        meta: `${task} · 完成定义 · 只写一句`,
        message: "把“做完”写成一句看得见的话。这样后面的动作才不会一直发散。",
        tags: ["完成定义", "收束", "一句就够"],
        reasons: commonReasons,
        variants: [
          { title: "写一句“做完会长什么样”", message: "把“做完”写成一句看得见的话。这样后面的动作才不会一直发散。" },
          { title: "写一句“这次不追求什么”", message: "把这次不追求完美写下来，能直接降低启动压力。" },
          { title: "只写今天要推进到哪", message: "目标不用写整件事，只写今天能推进到哪一步。" }
        ],
        variantIndex: 0
      },
      {
        id: makeId("action-task"),
        queue: "行动账单",
        kicker: meta.label,
        title: meta.third.title,
        meta: `${task} · 内容起手 · 别先做全`,
        message: meta.third.message,
        tags: ["内容起手", "只做一刀", "防拖延"],
        reasons: commonReasons,
        variants: meta.third.variants || [
          {
            title: meta.third.title,
            message: meta.third.message
          },
          {
            title: "先列 3 个最小子步",
            message: "如果这一刀还是偏大，就继续切成 3 个能立刻做的动作。"
          },
          {
            title: "只补第一屏 / 第一段 / 第一项",
            message: "不要想着整个作品，先只做最前面的那一块。"
          }
        ],
        variantIndex: 0
      },
      {
        id: makeId("action-task"),
        queue: "行动账单",
        kicker: meta.label,
        title: "只做 3 分钟，不许扩张",
        meta: `${task} · 行动护栏 · 防止又变大`,
        message: "给这刀一个很短的时间边界。不是做完，而是让身体先进去。",
        tags: ["时间护栏", "先进去", "不扩张"],
        reasons: [
          "时间越短，越不需要重新调动意志力",
          "先让身体进去，比再想一轮更值钱",
          "做完 3 分钟以后，是否继续再决定"
        ],
        variants: [
          { title: "只做 3 分钟，不许扩张", message: "给这刀一个很短的时间边界。不是做完，而是让身体先进去。" },
          { title: "先开一个 5 分钟计时器", message: "开计时器本身就是动作，不要先等状态完整。" },
          { title: "现在只做最前面 1 小块", message: "只要求推进一厘米，不要求一口气跑完整段路。" }
        ],
        variantIndex: 0
      }
    ].map((card) =>
      attachEngineMeta(card, meta.engineRoute, [
        "先用规则把输入归到当前任务类型，再给一张足够小的起手卡。",
        "你点了“换一刀”以后，系统会在当前任务类型里换更贴合的模板。",
        "如果还继续换，这一刀就进入升级求精层。后面更应该靠反馈来缩，而不是每次从零重算。"
      ])
    );
  };

  const buildResetCards = (input) => {
    const context = normalizeText(input) || "今天先复位一点点";
    const lower = context.toLowerCase();
    const isDesk = /桌|desk|工位|电脑/.test(lower);
    const isRoom = /房|room|床|衣服|地上/.test(lower);
    const isMessage = /消息|微信|回复|邮件|聊天/.test(lower);
    const isMental = /散|乱|脑|焦虑|卡住|心烦/.test(lower);
    const routeLabel = isMessage
      ? "状态识别 · 消息拖延"
      : isMental
        ? "状态识别 · 脑内过载"
        : isDesk || isRoom
          ? "状态识别 · 空间失序"
          : "状态识别 · 通用复位";

    const buildVisualCard = () => ({
      id: makeId("action-reset"),
      queue: "今日复位",
      kicker: "视觉复位",
      title: isDesk
        ? "先清出键盘前这一小块空白"
        : isRoom
          ? "先只收床边 / 桌边这一小块"
          : "先清掉眼前 3 个最显眼的东西",
      meta: `${context} · 视觉复位 · 先见效`,
      message: "复位的第一刀不是重构系统，而是先让眼前一轻，身体才更容易回来。",
      tags: ["先见效", "视觉减负", "马上能做"],
      reasons: [
        "眼前一轻，后面才容易继续",
        "范围小到不需要重新调动意志力",
        "复位先做减法，再谈整理"
      ],
      variants: [
        {
          title: isDesk
            ? "先清出键盘前这一小块空白"
            : isRoom
              ? "先只收床边 / 桌边这一小块"
              : "先清掉眼前 3 个最显眼的东西",
          message: "复位的第一刀不是重构系统，而是先让眼前一轻，身体才更容易回来。"
        },
        { title: "先把“明显不该在这”的东西归位", message: "不用整理全部，只处理那些一眼就知道放错地方的东西。" },
        { title: "先清出一小块空白面", message: "先做出一块可以呼吸的空白，比整间都动更容易开始。" }
      ],
      variantIndex: 0
    });

    const buildTailCard = () => ({
      id: makeId("action-reset"),
      queue: "今日复位",
      kicker: isMessage ? "关系轻推" : "悬账复位",
      title: isMessage ? "先回 1 条最容易结束的消息" : "先结掉 1 条最容易的小尾巴",
      meta: `${context} · 轻推进 · 不做大清算`,
      message: isMessage
        ? "不是把所有未回消息都清空，只先回掉那条最容易结束的。"
        : "你不需要把所有小尾巴都结完，只先让一笔离开脑子。",
      tags: ["轻推进", "结束一笔", "不求清空"],
      reasons: [
        "先结束一笔，比同时惦记十笔更有用",
        "最容易的那笔通常最适合重新启动节奏",
        "复位不是清空，而是少挂一点"
      ],
      variants: [
        {
          title: isMessage ? "先回 1 条最容易结束的消息" : "先结掉 1 条最容易的小尾巴",
          message: isMessage ? "不是把所有未回消息都清空，只先回掉那条最容易结束的。" : "你不需要把所有小尾巴都结完，只先让一笔离开脑子。"
        },
        { title: "先做一个 10 秒决定", message: "找一件可以 10 秒内做决定的事，让推进重新发生。" },
        { title: "先把 1 个悬着的对象归位", message: "不用整理系统，只让一个具体对象回到它该去的地方。" }
      ],
      variantIndex: 0
    });

    const buildFocusCard = () => ({
      id: makeId("action-reset"),
      queue: "今日复位",
      kicker: isMental ? "脑内复位" : "收束注意力",
      title: isMental ? "先写下脑子里最吵的 3 件事" : isRoom ? "先只收一小块，不收整间" : "先关掉 3 个无关窗口 / 页面",
      meta: `${context} · 收束注意力 · 只缩一圈`,
      message: isMental
        ? "脑子很吵时先别追求解决，先把最吵的 3 件事写出来，注意力就会有边界。"
        : "目标不是大扫除，而是把范围缩成你现在能接住的一小圈。",
      tags: ["缩范围", "降噪", "先收束"],
      reasons: [
        "注意力先有边界，行动才会回来",
        "范围缩小以后，开始的门槛就会下降",
        "复位不是奋起，是收束"
      ],
      variants: [
        {
          title: isMental ? "先写下脑子里最吵的 3 件事" : isRoom ? "先只收一小块，不收整间" : "先关掉 3 个无关窗口 / 页面",
          message: isMental ? "脑子很吵时先别追求解决，先把最吵的 3 件事写出来，注意力就会有边界。" : "目标不是大扫除，而是把范围缩成你现在能接住的一小圈。"
        },
        { title: "先把现在不做的事划出去", message: "把今天不做的内容明确掉，复位感会来得更快。" },
        { title: "先只保留一个工作面", message: "不让自己同时面对太多对象，先留一个能开始的面。" }
      ],
      variantIndex: 0
    });

    const order = (() => {
      if (isMental && !isDesk && !isRoom && !isMessage) return ["focus", "tail", "visual"];
      if (isMessage && !isDesk && !isRoom) return ["tail", "focus", "visual"];
      if (isDesk || isRoom) return ["visual", "focus", "tail"];
      return ["visual", "tail", "focus"];
    })();

    const builders = {
      visual: buildVisualCard,
      tail: buildTailCard,
      focus: buildFocusCard
    };

    return order
      .map((key) => builders[key]())
      .map((card) =>
        attachEngineMeta(card, routeLabel, [
          "先用规则判断你现在更像消息挂着、脑内过载还是空间太乱，再决定哪张卡该先出来。",
          "你继续换刀时，系统会在同一条复位轨道里改写动作，不会突然跳成另一类建议。",
          "只有继续觉得不贴合时，这一刀才升级到更深一层求精。复位产品不该默认每次都重推理。"
        ])
      );
  };

  const getViewCard = (card) => {
    const variant = Array.isArray(card.variants) ? card.variants[card.variantIndex || 0] : null;
    if (!variant) return card;
    return {
      ...card,
      ...variant,
      tags: variant.tags || card.tags,
      reasons: variant.reasons || card.reasons,
      kicker: variant.kicker || card.kicker,
      meta: variant.meta || card.meta
    };
  };

  const renderTags = (tags) => {
    if (!refs.tags) return;
    refs.tags.innerHTML = "";
    tags.forEach((tag) => {
      const chip = document.createElement("span");
      chip.textContent = tag;
      refs.tags.appendChild(chip);
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

  const renderEngine = (card) => {
    if (!refs.engineBadge || !refs.engineRoute || !refs.engineStage || !refs.engineCost || !refs.engineNote) return;

    if (!card) {
      refs.engineBadge.textContent = state.done.length > 0 ? "本轮收尾" : "规则起手";
      refs.engineRoute.textContent = state.done.length > 0 ? "这一轮已完成" : "待识别";
      refs.engineStage.textContent = state.done.length > 0 ? "已开过一刀" : "规则起手";
      refs.engineCost.textContent = state.done.length > 0 ? "已结算" : "低成本";
      refs.engineNote.textContent = state.done.length > 0
        ? "这一轮已经不需要继续求精了。今天真正值钱的是你已经动过。"
        : "这一版先走规则归类和模板派发。只有继续点“换一刀”时，才会往更深一层求精。";
      return;
    }

    const depth = Math.min(card.variantIndex || 0, engineStageProfile.length - 1);
    const stage = engineStageProfile[depth];
    refs.engineBadge.textContent = stage.label;
    refs.engineRoute.textContent = card.routeLabel || (state.mode === "reset" ? "状态识别" : "任务识别");
    refs.engineStage.textContent = stage.label;
    refs.engineCost.textContent = stage.cost;
    refs.engineNote.textContent = Array.isArray(card.stageNotes) && card.stageNotes[depth]
      ? card.stageNotes[depth]
      : stage.note;
  };

  const renderReceipts = () => {
    if (!refs.receipts) return;
    refs.receipts.innerHTML = "";

    if (!state.receipts.length) {
      const item = document.createElement("li");
      item.textContent = "今天的第一刀还没落下。";
      refs.receipts.appendChild(item);
      return;
    }

    state.receipts
      .slice()
      .reverse()
      .forEach((entry) => {
        const item = document.createElement("li");
        item.textContent = entry;
        refs.receipts.appendChild(item);
      });
  };

  const renderReviewList = (container, items, emptyText, actionLabel, actionName) => {
    if (!container) return;
    container.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "action-review-empty";
      empty.textContent = emptyText;
      container.appendChild(empty);
      return;
    }

    items
      .slice()
      .reverse()
      .forEach((card) => {
        const viewCard = getViewCard(card);
        const item = document.createElement("li");
        item.className = "action-review-item";

        const copy = document.createElement("div");
        copy.className = "action-review-copy";
        const title = document.createElement("strong");
        title.textContent = viewCard.title;
        const meta = document.createElement("span");
        meta.textContent = `${viewCard.meta}${card.doneAt ? ` · ${new Date(card.doneAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}` : ""}`;
        copy.appendChild(title);
        copy.appendChild(meta);

        item.appendChild(copy);

        if (actionLabel && actionName) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "action-review-button";
          button.textContent = actionLabel;
          button.dataset.reviewAction = actionName;
          button.dataset.reviewId = card.id;
          item.appendChild(button);
        }

        container.appendChild(item);
      });
  };

  const setFeedback = (message) => {
    if (refs.feedback) refs.feedback.textContent = message;
  };

  const snapshotState = () => deepClone({
    mode: state.mode,
    input: state.input,
    pending: state.pending,
    done: state.done,
    deferred: state.deferred,
    receipts: state.receipts,
    momentum: state.momentum,
    sourceCount: state.sourceCount
  });

  const persistState = () => {
    if (!hasLocalStorage) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(snapshotState()));
    } catch {
      // ignore persistence failures
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

      state.mode = saved.mode === "reset" ? "reset" : "task";
      state.input = typeof saved.input === "string" ? saved.input : "";
      state.pending = Array.isArray(saved.pending) ? saved.pending : [];
      state.done = Array.isArray(saved.done) ? saved.done : [];
      state.deferred = Array.isArray(saved.deferred) ? saved.deferred : [];
      state.receipts = Array.isArray(saved.receipts) ? saved.receipts.slice(0, 24) : [];
      state.momentum = Number(saved.momentum) || 0;
      state.history = [];
      state.sourceCount = Number(saved.sourceCount) || 0;
      return true;
    } catch {
      clearPersistedState();
      return false;
    }
  };

  const setMode = (mode, { updateStatus = true } = {}) => {
    state.mode = mode === "reset" ? "reset" : "task";

    refs.modeButtons.forEach((button) => {
      const active = button.dataset.actionMode === state.mode;
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.classList.toggle("is-active", active);
    });

    refs.taskInput.placeholder = state.mode === "task" ? copy.taskPlaceholder : copy.resetPlaceholder;

    if (updateStatus && refs.status) {
      refs.status.textContent = state.mode === "task" ? copy.taskStatus : copy.resetStatus;
    }
  };

  const pushHistory = () => {
    state.history.push(snapshotState());
    if (state.history.length > 40) state.history.shift();
  };

  const updateSummary = () => {
    if (refs.momentum) refs.momentum.textContent = String(state.momentum);
    if (refs.doneCount) refs.doneCount.textContent = String(state.done.length);
    if (refs.doneCountMirror) refs.doneCountMirror.textContent = String(state.done.length);
    if (refs.deferredCount) refs.deferredCount.textContent = String(state.deferred.length);
    if (refs.deferredCountMirror) refs.deferredCountMirror.textContent = String(state.deferred.length);
    if (refs.remaining) refs.remaining.textContent = String(state.pending.length);
    if (refs.queueTotal) refs.queueTotal.textContent = String(Math.max(state.pending.length + state.done.length, state.pending.length || 1));
    if (refs.sourceCount) refs.sourceCount.textContent = `本轮 ${state.sourceCount}`;
    if (refs.pendingCount) refs.pendingCount.textContent = `待排 ${state.pending.length}`;
    if (refs.restoreDeferred) refs.restoreDeferred.disabled = state.deferred.length === 0;
    if (refs.undo) refs.undo.disabled = state.history.length === 0;

    renderReceipts();
    renderReviewList(refs.doneList, state.done, "还没有动作进入“已推进”。先做一刀，收据就会开始长出来。", "", "");
    renderReviewList(refs.deferredList, state.deferred, "稍后区还是空的。今天不想现在做的动作，可以先安全挪开。", "放回队列", "restore");
  };

  const renderCard = () => {
    const card = state.pending[0];

    if (!card) {
      if (refs.queueTitle) refs.queueTitle.textContent = "今天的行动账单";
      if (refs.queueIndex) refs.queueIndex.textContent = String(state.done.length);
      refs.kicker.textContent = state.done.length > 0 ? "今日收尾" : "行动收银台";
      refs.title.textContent = state.done.length > 0 ? "这一轮已经开过刀了。" : "先输入一句卡住的事。";
      refs.meta.textContent = state.done.length > 0 ? "今天不是没动，你已经推进过。" : "系统不会让你先做复杂规划。";
      refs.message.textContent = state.done.length > 0
        ? "如果还想继续，可以再输入一件事，或者把稍后区放回队列。"
        : "可以先输一个大任务，或者直接载入一轮示例。";
      renderTags(state.done.length > 0 ? ["已推进", "可以收尾", "也可以继续"] : ["任务破冰", "今日复位", "先做一刀"]);
      renderReasons(
        state.done.length > 0
          ? ["开始本身已经发生了", "今天不用证明自己很强，只要证明自己动过", "下一轮什么时候开始都行"]
          : ["别先组织完整人生", "先给出一张足够小的动作卡", "开始以后再看后面"]
      );

      [refs.start, refs.later, refs.swap].forEach((button) => {
        if (button) button.disabled = true;
      });
      renderEngine(null);
      return;
    }

    const viewCard = getViewCard(card);
    if (refs.queueTitle) refs.queueTitle.textContent = viewCard.queue;
    if (refs.queueIndex) refs.queueIndex.textContent = String(state.done.length + 1);
    refs.kicker.textContent = viewCard.kicker;
    refs.title.textContent = viewCard.title;
    refs.meta.textContent = viewCard.meta;
    refs.message.textContent = viewCard.message;
    renderTags(viewCard.tags || []);
    renderReasons(viewCard.reasons || []);
    renderEngine(card);
    [refs.start, refs.later, refs.swap].forEach((button) => {
      if (button) button.disabled = false;
    });
  };

  const sync = () => {
    updateSummary();
    renderCard();
    persistState();
  };

  const loadQueue = (mode, input, cards, feedback) => {
    state.mode = mode;
    state.input = input;
    state.pending = cards;
    state.done = [];
    state.deferred = [];
    state.receipts = [];
    state.momentum = 0;
    state.history = [];
    state.sourceCount = cards.length;
    refs.taskInput.value = input;
    setMode(mode);
    setFeedback(feedback);
    sync();
  };

  const buildQueue = (mode, input, forceSample = false) => {
    if (mode === "reset") {
      const value = normalizeText(input) || (forceSample ? (presets.reset?.[0] || "") : "");
      return buildResetCards(value);
    }

    const value = normalizeText(input) || (forceSample ? (presets.task?.[0] || "") : "");
    return buildTaskCards(value);
  };

  const generateFromInput = ({ sample = false } = {}) => {
    const input = normalizeText(refs.taskInput.value);
    const fallbackInput = sample
      ? (state.mode === "task" ? presets.task?.[0] : presets.reset?.[0]) || ""
      : input;
    const cards = buildQueue(state.mode, fallbackInput, sample);
    const finalInput = normalizeText(fallbackInput);

    loadQueue(
      state.mode,
      finalInput,
      cards,
      sample
        ? copy.sample
        : state.mode === "task"
          ? `已把“${finalInput || "这件事"}”先经规则归类，再压成一轮可执行动作。`
          : `已把“${finalInput || "今天先复位一点点"}”先经状态识别，再压成一轮今日复位动作。`
    );
  };

  const startCurrent = () => {
    const current = state.pending[0];
    if (!current) return;
    const viewCard = getViewCard(current);
    pushHistory();
    state.pending.shift();
    state.done.push({
      ...current,
      doneAt: Date.now()
    });
    state.receipts.push(`开工 · ${viewCard.title}`);
    state.momentum += 12;
    setFeedback(`先做这一刀就够了：${viewCard.title}`);
    sync();
  };

  const deferCurrent = () => {
    const current = state.pending[0];
    if (!current) return;
    const viewCard = getViewCard(current);
    pushHistory();
    state.pending.shift();
    state.deferred.push({
      ...current,
      deferredAt: Date.now()
    });
    state.receipts.push(`稍后 · ${viewCard.title}`);
    state.momentum += 2;
    setFeedback(`已把这刀放进稍后区：${viewCard.title}`);
    sync();
  };

  const swapCurrent = () => {
    const current = state.pending[0];
    if (!current) return;
    if (!Array.isArray(current.variants) || current.variants.length < 2) {
      setFeedback("这一刀已经够小了，可以直接先做。");
      return;
    }

    const nextIndex = (current.variantIndex || 0) + 1;
    if (nextIndex >= current.variants.length) {
      setFeedback("这一刀已经到当前最深的一层了。与其继续重算，不如先做 3 分钟。");
      return;
    }

    pushHistory();
    current.variantIndex = nextIndex;
    const viewCard = getViewCard(current);
    state.receipts.push(`换刀 · ${viewCard.title}`);
    if (state.receipts.length > 24) state.receipts.shift();
    setFeedback(
      current.variantIndex === 1
        ? `已从规则起手进入模板重写：${viewCard.title}`
        : `已把这一刀升级到更深一层求精：${viewCard.title}`
    );
    sync();
  };

  const restoreDeferred = (id) => {
    const returning = state.deferred.filter((item) => item.id === id);
    if (!returning.length) return;
    pushHistory();
    state.deferred = state.deferred.filter((item) => item.id !== id);
    state.pending = [...returning, ...state.pending];
    setFeedback(`已把 1 笔稍后动作放回队列。`);
    sync();
  };

  const restoreAllDeferred = () => {
    if (!state.deferred.length) return;
    pushHistory();
    state.pending = [...state.deferred, ...state.pending];
    state.deferred = [];
    setFeedback("已把稍后区全部放回队列。");
    sync();
  };

  const undo = () => {
    const snapshot = state.history.pop();
    if (!snapshot) return;
    state.mode = snapshot.mode;
    state.input = snapshot.input;
    state.pending = snapshot.pending;
    state.done = snapshot.done;
    state.deferred = snapshot.deferred;
    state.receipts = snapshot.receipts;
    state.momentum = snapshot.momentum;
    state.sourceCount = snapshot.sourceCount;
    refs.taskInput.value = state.input;
    setMode(state.mode);
    setFeedback("已撤回上一笔动作。");
    sync();
  };

  const clearAll = () => {
    state.mode = "task";
    state.input = "";
    state.pending = [];
    state.done = [];
    state.deferred = [];
    state.receipts = [];
    state.momentum = 0;
    state.history = [];
    state.sourceCount = 0;
    refs.taskInput.value = "";
    setMode("task");
    clearPersistedState();
    setFeedback(copy.cleared);
    sync();
  };

  refs.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.actionMode === "reset" ? "reset" : "task";
      setMode(mode);
      setFeedback(mode === "task" ? copy.taskStatus : copy.resetStatus);
      persistState();
    });
  });

  refs.presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.actionMode === "reset" ? "reset" : "task";
      const value = button.dataset.actionPreset || "";
      refs.taskInput.value = value;
      setMode(mode);
      setFeedback(`已填入示例：${value}`);
      persistState();
    });
  });

  refs.generate.addEventListener("click", () => generateFromInput());
  refs.loadSample?.addEventListener("click", () => generateFromInput({ sample: true }));
  refs.clear?.addEventListener("click", clearAll);
  refs.start?.addEventListener("click", startCurrent);
  refs.later?.addEventListener("click", deferCurrent);
  refs.swap?.addEventListener("click", swapCurrent);
  refs.restoreDeferred?.addEventListener("click", restoreAllDeferred);
  refs.undo?.addEventListener("click", undo);

  refs.deferredList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-review-action='restore']");
    if (!button) return;
    restoreDeferred(button.dataset.reviewId);
  });

  refs.taskInput.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      generateFromInput();
    }
  });

  const restored = restorePersistedState();
  if (restored) {
    refs.taskInput.value = state.input;
    setMode(state.mode);
    setFeedback(copy.restored);
    sync();
    return;
  }

  setMode("task");
  setFeedback(copy.ready);
  sync();
})();
