export const pageMeta = {
  title: "下载区去留器 | 把最乱的 Downloads，一张张结掉",
  description:
    "一个专门处理 Downloads 文件夹的减法产品页面：把截图、安装包、临时 PDF 和 final-final 文件做成卡片，用最轻的动作完成归档、待删和稍后决策。",
  pitch:
    "下载区去留器不是文件管理器，也不是整理大师。它只做一件事：把最乱、最不想打开的 Downloads，变成一个可以快速结账的收银台。"
} as const;

export const hardBenefits = [
  {
    value: "真减空间",
    body: "安装包、压缩包、临时截图和过时导出文件，本来就最适合做减法。"
  },
  {
    value: "真减混乱",
    body: "Downloads 不是知识库，它更像数字杂物堆。少一点，就立刻更顺眼。"
  },
  {
    value: "真减拖欠感",
    body: "不是等一个“整理日”，而是今天只结 10 张，脑子就能轻下来。"
  },
  {
    value: "对手更弱",
    body: "不是跟平台抢入口，而是在系统文件夹这个没人做顺的地方，把体验做对。"
  }
] as const;

export const promiseCards = [
  {
    title: "你不用整理整个文件夹",
    body: "产品不要求你进入 Finder 或资源管理器做大扫除，只要求你一次处理一张。"
  },
  {
    title: "先处理最容易继续的文件",
    body: "排序逻辑不是最重要优先，而是截图、安装包、久未打开的大文件先来。"
  },
  {
    title: "安全优先，不做假自动化",
    body: "待删先进入清单，归档先走复制路径。产品不会替你偷偷做不可逆动作。"
  },
  {
    title: "这是待结的第一刀",
    body: "下载区去留器是一个独立产品，也是“待结”母产品里最硬、最先成立的入口。"
  }
] as const;

export const workflowSteps = [
  {
    title: "扫描 Downloads",
    body: "把截图、安装包、过渡版本、临时导出、久未打开的大文件先挑出来。"
  },
  {
    title: "一张一张决定",
    body: "每张文件卡只允许你打开看、归档、待删或稍后，不逼你进入复杂目录结构。"
  },
  {
    title: "先走安全路径",
    body: "连接归档目录时会先复制进去；待删项目进入清单，由你稍后确认。"
  },
  {
    title: "结算今天轻了多少",
    body: "已处理数量、待删空间、收据和剩余悬账，会让减法结果立刻可见。"
  }
] as const;

export const fileBuckets = [
  {
    title: "临时截图",
    body: "最适合先结。它们通常只在某个瞬间有用，判断成本低，清完立刻轻。 "
  },
  {
    title: "安装包与压缩包",
    body: "下载时有用，之后最容易长期挂着。它们往往既占空间，也最少被再次打开。 "
  },
  {
    title: "final-final 文件",
    body: "名字像临时导出、过渡版本、复制件，本质上是在等待一个明确归宿。 "
  },
  {
    title: "久未处理的大文件",
    body: "它们不一定该删，但一定值得先看一眼，因为收益够硬。 "
  }
] as const;

export const trustRules = [
  "待删不会直接永久删除，只会进入可导出的待删清单。",
  "归档默认先复制到归档文件夹，避免误操作导致原文件直接丢失。",
  "归档时如果目标目录里已有同名文件，会自动补后缀，避免静默覆盖。",
  "所有分析只在本机浏览器完成，不上传文件内容。",
  "刷新后会恢复队列，避免用户因为中断而重新开始。"
] as const;

export const roadmap = [
  {
    phase: "现在",
    title: "浏览器端 MVP",
    body: "接入 Downloads、卡片式处理、归档目录、待删清单和本地保存。"
  },
  {
    phase: "下一步",
    title: "批量动作与冲突处理",
    body: "支持相似文件批量结账、归档命名冲突提示、按类型筛一轮。"
  },
  {
    phase: "更后面",
    title: "长成待结的文件账单模块",
    body: "下载区先打穿，再决定桌面、聊天接收文件和其他账单要不要接进来。"
  }
] as const;

export const faqItems = [
  {
    question: "为什么先做 Downloads，不先做收藏夹？",
    answer: "因为 Downloads 的减法收益更硬：真减空间、真减混乱、真能立刻感到轻。而且对手只是系统文件夹，不是强平台。"
  },
  {
    question: "它和普通文件管理器有什么不同？",
    answer: "文件管理器给你完整权限和完整复杂度；下载区去留器只给你最小决策动作，让你敢开始。"
  },
  {
    question: "会不会自动删我文件？",
    answer: "不会。MVP 的原则是安全优先：待删先进入清单，归档先复制，所有不可逆动作都留给你确认。"
  },
  {
    question: "它和待结是什么关系？",
    answer: "待结是母产品，下载区去留器是第一个切得最硬的入口。它先把文件账单跑顺，再考虑别的悬账类型。"
  }
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
    queue: "文件账单",
    kicker: "Downloads",
    title: "Notion-export-final-v3.zip",
    meta: "压缩包 · 63 天没打开 · 812 MB",
    message: "压缩包和安装包很容易在 Downloads 里长期悬挂。确认还需不需要，比继续堆着更轻。",
    tags: ["安装/压缩包", "大文件", "拖了有一阵"],
    reasons: ["占空间非常明显", "下载时有用，之后常被遗忘", "处理结果通常很明确"],
    release: 812
  },
  {
    queue: "文件账单",
    kicker: "Downloads",
    title: "offer-letter-copy-2.pdf",
    meta: "PDF · 27 天没打开 · 3.4 MB",
    message: "像这样名字里带 copy、final、导出的文件，往往不是难处理，只是一直没被下最后决定。",
    tags: ["过渡文件", "轻量处理", "适合归档"],
    reasons: ["像过渡版本或复制件", "判断成本低", "可以直接归档到明确位置"],
    release: 3.4
  },
  {
    queue: "文件账单",
    kicker: "Downloads",
    title: "FigmaSetup.dmg",
    meta: "安装包 · 91 天没打开 · 164 MB",
    message: "安装包通常只在某个时刻有用。确认是否还会重装，比继续放着更值。",
    tags: ["安装包", "大文件", "适合先结"],
    reasons: ["久未处理且占空间", "很可能已经完成使命", "删或归档都不会牵出复杂后续"],
    release: 164
  }
] as const;
