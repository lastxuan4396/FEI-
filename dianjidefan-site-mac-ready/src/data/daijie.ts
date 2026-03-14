export const pageMeta = {
  title: "待结 | 把挂着的小事，一张张结掉",
  description:
    "把这次关于“我也可以做软件”的对话，整理成一个真正能浏览的产品页面：从 12 个创意方向，到人生待处理收银台，再到待结的定义、队列、MVP 和节奏。",
  pitch:
    "待结是一台人生待处理收银台。它把下载文件、收藏链接、没回的消息和零散念头排成队，让你每天只花几分钟，结掉一点，轻一点。",
  heroNote:
    "起点不是“做一个没人做过的产品”，而是看见成熟产品背后的共同结构：把复杂判断压缩成很小的动作，让人持续往前。"
} as const;

export const distilledInsights = [
  {
    title: "复杂判断压缩成小动作",
    body: "真正有力量的不是“功能更多”，而是把留不留、做不做、回不回这种判断压到一秒内能做掉。"
  },
  {
    title: "软件价值来自交互节奏",
    body: "用户被卡住时，不需要新的体系。他更需要被轻轻推进下一步，而且不会因为做错而付出大代价。"
  },
  {
    title: "高频小阻力，比低频大问题更适合产品化",
    body: "下载区、收藏夹、消息、灵感、想买的东西，都不是大难题，但会反复占用注意力。"
  },
  {
    title: "先做窄场景，后做母产品",
    body: "从一个来源切进去更容易起步，但真正有潜力的是背后的“去留/推进/选择”决策引擎。"
  }
] as const;

export const ideaFamilies = [
  {
    key: "clean",
    label: "清理型",
    summary: "解决“堆着不想碰”的账，先把环境和信息债清轻。"
  },
  {
    key: "progress",
    label: "推进型",
    summary: "解决“明明知道该做，但总是起不来”的账。"
  },
  {
    key: "choice",
    label: "选择型",
    summary: "解决“犹豫太久”的账，把悬空决策收束掉。"
  }
] as const;

export const ideaCards = [
  {
    family: "clean",
    title: "下载区去留器",
    oneLiner: "把 Downloads 里的文件变成一张张卡片，归档、删除、稍后，像刷短视频一样做决定。",
    whyItWorks: "用户不是不会整理，而是一打开文件夹就累。"
  },
  {
    family: "clean",
    title: "收藏夹消化器",
    oneLiner: "把收藏链接拆成每日 10 张卡，只允许现在读、归档精选、丢弃、稍后。",
    whyItWorks: "真正的痛点不是保存，而是信息债越来越厚。"
  },
  {
    family: "progress",
    title: "任务破冰器",
    oneLiner: "用户只输入一个大任务，产品逼出“下一刀动作”，而不是复杂计划。",
    whyItWorks: "人通常不是不想做，而是不知道从哪一刀下手。"
  },
  {
    family: "progress",
    title: "消息回复推进器",
    oneLiner: "把未回消息一条条弹出来，只提供“回一句 / 晚点提醒 / 不回也行”。",
    whyItWorks: "消息压力往往不是量大，而是每条都要重新做心理建设。"
  },
  {
    family: "clean",
    title: "衣柜去留器",
    oneLiner: "一件衣服一张卡，保留、捐掉、改造、今年再看一次。",
    whyItWorks: "去留问题比收纳问题更早，更适合被游戏化。"
  },
  {
    family: "clean",
    title: "相册故事提炼器",
    oneLiner: "不是删照片，而是从海量照片里快速挑出“值得留下来讲故事的 5 张”。",
    whyItWorks: "它解决的不是空间，而是记忆被淹没。"
  },
  {
    family: "choice",
    title: "冲动消费冷静器",
    oneLiner: "把想买的东西先扔进冷静队列，24 小时后再刷一次：买、延后、不买。",
    whyItWorks: "很多消费判断不需要更多信息，需要的是延迟冲动。"
  },
  {
    family: "progress",
    title: "社交关系轻维护器",
    oneLiner: "每天只给你 3 个人，发一句、点个赞、约一下、今天先不管。",
    whyItWorks: "维系关系的阻力常常来自启动，不来自操作本身。"
  },
  {
    family: "clean",
    title: "学习材料筛选器",
    oneLiner: "课程、论文、网课视频被拆成卡，只做精读、略过、以后再看。",
    whyItWorks: "进入学习前的筛选成本，常常比学习本身更高。"
  },
  {
    family: "progress",
    title: "房间复位器",
    oneLiner: "拍一下房间，系统只给当前状态下最小动作，比如“先把桌上 3 个杯子拿走”。",
    whyItWorks: "产品不做清洁计划，只负责让用户开始动第一下。"
  },
  {
    family: "progress",
    title: "灵感落地器",
    oneLiner: "零散点子进入后，只判断它是项目、句子、任务，还是该归档掉。",
    whyItWorks: "灵感最容易悬空，久了会变成认知噪音。"
  },
  {
    family: "choice",
    title: "周末去处决策器",
    oneLiner: "根据预算、天气和体力二选一，不给太多选项，最后自动收敛成一个计划。",
    whyItWorks: "用户缺的不是推荐，而是停止犹豫的机制。"
  }
] as const;

export const bestFirstMoves = [
  {
    title: "下载区去留器",
    reason: "技术最容易起步，价值立刻可感知，做出来马上能让人觉得轻。"
  },
  {
    title: "收藏夹消化器",
    reason: "信息债是非常普遍的痛点，连续使用感强，也最容易形成日常习惯。"
  },
  {
    title: "任务破冰器",
    reason: "情绪价值最大，但更难做准；如果做对，产品潜力会很高。"
  }
] as const;

export const convergencePath = [
  {
    step: "01",
    title: "看见成熟产品背后的结构",
    body: "不是去复制“滚雪球”或“去留照片”，而是看见它们共同解决的事：让人从卡住，变成继续。"
  },
  {
    step: "02",
    title: "从很多点子，收敛到一个母题",
    body: "喜欢的方向越多，越说明你抓到的不是单个功能，而是一种软件母题：降低决策阻力。"
  },
  {
    step: "03",
    title: "把母题收束成产品隐喻",
    body: "“人生待处理收银台”成立，因为大家都懂什么叫悬账、结账、清掉一笔。"
  },
  {
    step: "04",
    title: "把概念变成可介绍、可上手的产品",
    body: "于是它从概念名继续收敛成产品名：待结。更短，也更像一个会被真正打开的应用。"
  }
] as const;

export const queueTypes = [
  {
    name: "文件账单",
    items: "Downloads、桌面截图、临时文档",
    actions: "打开看 / 归档 / 删除 / 稍后"
  },
  {
    name: "信息账单",
    items: "收藏链接、稍后读、重复保存内容",
    actions: "现在读 3 分钟 / 保留精选 / 丢弃 / 稍后"
  },
  {
    name: "关系账单",
    items: "没回的消息、该联系的人、没结尾的对话",
    actions: "回一句 / 设提醒 / 不回也行"
  },
  {
    name: "念头账单",
    items: "灵感、购物冲动、一直挂着的小念头",
    actions: "变成任务 / 延迟决定 / 归档灵感 / 放弃"
  }
] as const;

export const productAngles = [
  {
    label: "一句话定义",
    value: "把生活里所有悬而未决的小事，变成一张张可以快速结账的卡片。"
  },
  {
    label: "目标用户",
    value: "生活里总有很多小尾巴，脑子一直被占着，但又不想建一个巨大系统的人。"
  },
  {
    label: "核心体验",
    value: "一次只看 1 张卡，每张只做 1 个小决定，处理完立刻进入下一张。"
  },
  {
    label: "真正的灵魂",
    value: "不是整合多少来源，而是决定“下一张是谁”，以及让用户每做一笔都轻一点。"
  }
] as const;

export const mvpFeatures = [
  "接入 Downloads 文件队列",
  "导入浏览器收藏夹或手动贴链接",
  "自动生成今日 10 张结账卡",
  "文件卡支持打开看、归档、删除、稍后",
  "收藏卡支持读 3 分钟、保留、丢弃、稍后",
  "支持撤回上一笔",
  "结算页展示处理数量、释放空间、今日轻松感"
] as const;

export const nonGoals = [
  "先不要接未回消息、全平台同步、复杂标签体系",
  "先不要做聊天式 AI 陪伴，AI 只负责排序和轻提示",
  "先不要试图“整理人生”，第一版只要把两类账单结顺"
] as const;

export const dailyRhythm = [
  {
    stage: "早上",
    title: "先给 3 笔最轻的",
    body: "不抢认知资源，先让用户快速赢几笔，建立继续处理的手感。"
  },
  {
    stage: "下午",
    title: "混入 1 笔真正该收尾的",
    body: "在已经进入状态时推一张需要明确决定的卡，而不是一上来就给重活。"
  },
  {
    stage: "晚上",
    title: "结算，不审判",
    body: "今天结了 7 笔就够了。产品给的是轻松感，不是新的绩效压力。"
  }
] as const;

export const roadmap = [
  {
    phase: "Phase 1",
    title: "先做窄而真的 MVP",
    body: "用 Downloads + 收藏夹跑通待结最核心的节奏和撤回机制。"
  },
  {
    phase: "Phase 2",
    title: "把排序做聪明",
    body: "引入“成本低先来、重复内容先来、拖太久的再出现”的队列调度。"
  },
  {
    phase: "Phase 3",
    title: "再慢慢长成母产品",
    body: "消息、购物冲动、灵感、关系维护再接进来，形成真正的生活悬账中心。"
  }
] as const;

export const quotes = [
  "不是“整理人生”，而是结掉一笔小账。",
  "不是最重要的先来，而是最容易继续的先来。",
  "用户需要的不是更多体系，而是更低的启动阻力。",
  "真正好的节奏不是一次性清空，而是明天还愿意回来。"
] as const;

export const demoCards = [
  {
    queue: "文件账单",
    kicker: "Downloads",
    title: "IMG_8473.PNG",
    meta: "截屏 · 14 天没打开 · 24.8 MB",
    message: "这类临时截图通常只在当下有用。现在看一眼，决定它还值不值得继续占空间。",
    tags: ["临时文件", "处理成本低", "适合先结"],
    reasons: ["久未处理，但判断成本低", "不会牵出新的复杂步骤", "先赢一笔，更容易继续"],
    release: 24.8
  },
  {
    queue: "信息账单",
    kicker: "Saved Link",
    title: "如何搭建第二大脑系统",
    meta: "收藏链接 · 已存 21 天 · 重复主题 3 次",
    message: "你已经连着存过几篇同类内容。比继续囤，更有价值的是现在做掉一个明确决定。",
    tags: ["信息债", "重复内容", "适合精选"],
    reasons: ["同主题重复保存", "继续拖延只会变重", "处理结果很明确"],
    release: 0
  },
  {
    queue: "关系账单",
    kicker: "Message Queue",
    title: "妈妈：上周发来的语音",
    meta: "待回复 · 已拖 3 天 · 42 秒",
    message: "很多关系账单不需要长回复，回一句“我刚听了，晚点给你打电话”已经算结清一半。",
    tags: ["轻回复", "关系维护", "情绪负担高"],
    reasons: ["拖越久心理负担越高", "一句短回复就能降压", "现在处理比以后更轻"],
    release: 0
  },
  {
    queue: "念头账单",
    kicker: "Idea Shelf",
    title: "做一个旅行路线生成器",
    meta: "灵感卡片 · 9 天前记下 · 未形成下一步",
    message: "不是每个想法都要立刻开做，但每个想法都值得被分类：项目、归档，或放弃。",
    tags: ["灵感分类", "避免悬空", "适合收尾"],
    reasons: ["长期悬空会持续占注意力", "现在需要的是归类，不是展开", "动作可以非常小"],
    release: 0
  }
] as const;
