export type WorkCategory = "game" | "tool" | "story" | "special";

export interface ShowcaseWork {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  category: WorkCategory;
  categoryLabel: string;
  stack: string;
  origin: string;
  href?: string;
  repoUrl?: string;
  coverImage?: string;
  coverAlt?: string;
  createdAt?: string;
  updatedAt?: string;
  badges: string[];
  tone: "ember" | "lagoon" | "indigo" | "citrus" | "graphite";
  featured?: boolean;
  hidden?: boolean;
}

export interface RepoShelfItem {
  name: string;
  title: string;
  summary: string;
  url: string;
  tags: string[];
}

const withCover = (fileName: string, alt: string) => ({
  coverImage: `/assets/showcase-covers/${fileName}.png`,
  coverAlt: alt
});

const withTimeline = (createdAt: string, updatedAt: string) => ({
  createdAt,
  updatedAt
});

export const filterOptions = [
  { key: "all", label: "全部" },
  { key: "game", label: "游戏" },
  { key: "tool", label: "工具" },
  { key: "story", label: "关系 / 叙事" },
  { key: "special", label: "专题页" }
] as const;

const directWorksSeed: ShowcaseWork[] = [
  {
    slug: "oh-card-studio",
    title: "OH Card Studio",
    eyebrow: "Reflective playground",
    summary: "把抽卡、牌阵、关系镜像和修复流程揉成一个可独自使用也可双人共玩的网页工作台。",
    category: "story",
    categoryLabel: "关系 / 叙事",
    stack: "HTML / CSS / JavaScript",
    origin: "oh-card-web/",
    href: "/showcase/oh-card-studio/",
    repoUrl: "https://github.com/lastxuan4396/ohcard",
    ...withCover("oh-card-studio", "OH Card Studio 多玩法引导工作台截图"),
    ...withTimeline("2026-03-06", "2026-03-12"),
    badges: ["多牌阵", "可引导", "移动端"],
    tone: "citrus",
    featured: true
  },
  {
    slug: "lifeos-v13",
    title: "LifeOS v1.3",
    eyebrow: "Daily operating system",
    summary: "把日常执行系统做成单页引擎，围绕 DL-30、红灯逻辑和 A/B/C/D 输出组织一天。",
    category: "tool",
    categoryLabel: "工具",
    stack: "HTML / CSS / JavaScript",
    origin: "lifeos-v13/",
    href: "/showcase/lifeos-v13/",
    repoUrl: "https://github.com/lastxuan4396/lifeos-v13",
    ...withCover("lifeos-v13", "LifeOS v1.3 每日执行系统界面截图"),
    ...withTimeline("2026-03-09", "2026-03-12"),
    badges: ["执行系统", "流程化", "本地使用"],
    tone: "lagoon",
    featured: true
  },
  {
    slug: "eurotruck-gt5",
    title: "Euro Truck GT5 Fusion",
    eyebrow: "Driving prototype",
    summary: "把卡车操控、天气场景和赛车镜头感混在一起，做成一个能切视角的浏览器驾驶原型。",
    category: "game",
    categoryLabel: "游戏",
    stack: "Canvas / JavaScript",
    origin: "eurotruck-gt5/",
    href: "/showcase/eurotruck-gt5/",
    repoUrl: "https://github.com/lastxuan4396/eurotruck-gt5",
    ...withCover("eurotruck-gt5", "Euro Truck GT5 Fusion 驾驶游戏界面截图"),
    ...withTimeline("2026-03-11", "2026-03-11"),
    badges: ["三视角", "天气系统", "驾驶手感"],
    tone: "ember",
    featured: true
  },
  {
    slug: "velocity-apex-gp",
    title: "Velocity Apex GP",
    eyebrow: "Arcade racing",
    summary: "更偏街机和速度感的 F1 风赛车页，适合当成游戏感和视觉节奏的快速实验。",
    category: "game",
    categoryLabel: "游戏",
    stack: "Canvas / JavaScript",
    origin: "f1-game/",
    href: "/showcase/velocity-apex-gp/",
    ...withCover("velocity-apex-gp", "Velocity Apex GP 竞速游戏界面截图"),
    ...withTimeline("2026-03-08", "2026-03-09"),
    badges: ["竞速", "视觉冲击", "单页实验"],
    tone: "indigo"
  },
  {
    slug: "flight-chess-board",
    title: "飞行棋 - 棋盘版",
    eyebrow: "Board game remake",
    summary: "把飞行棋做成浏览器里的可玩棋盘，偏单机、规则清晰，适合快速开一局。",
    category: "game",
    categoryLabel: "游戏",
    stack: "Single-file HTML",
    origin: "flight-chess.html",
    href: "/showcase/flight-chess/",
    ...withCover("flight-chess-board", "飞行棋棋盘版游戏界面截图"),
    badges: ["棋盘玩法", "即开即玩", "轻量"],
    tone: "ember",
    hidden: true
  },
  {
    slug: "interactive-test-site",
    title: "互动测试站",
    eyebrow: "Quiz experience",
    summary: "一个带进度条、结果页和类型拆解的三观认知测评站，偏轻游戏化的互动问答体验。",
    category: "game",
    categoryLabel: "游戏",
    stack: "HTML / CSS / JavaScript",
    origin: "interactive-test-site/",
    href: "/showcase/interactive-test-site/",
    ...withCover("interactive-test-site", "互动测试站题目界面截图"),
    ...withTimeline("2026-03-09", "2026-03-09"),
    badges: ["测评", "结果页", "轻互动"],
    tone: "indigo"
  },
  {
    slug: "ability-tree",
    title: "能力树升级",
    eyebrow: "Growth tracker",
    summary: "把技能成长过程做成一张可以直观看进度的能力树，适合做个人升级面板。",
    category: "tool",
    categoryLabel: "工具",
    stack: "Static HTML",
    origin: "ability-tree-share/",
    href: "/showcase/ability-tree/",
    ...withCover("ability-tree", "能力树升级界面截图"),
    ...withTimeline("2026-03-07", "2026-03-07"),
    badges: ["成长面板", "可分享", "轻部署"],
    tone: "lagoon"
  },
  {
    slug: "attendance-checkin",
    title: "课堂签到工具",
    eyebrow: "Class utility",
    summary: "一个非常直接的签到工具页，目标就是少废话、快记录、现场能马上用。",
    category: "tool",
    categoryLabel: "工具",
    stack: "Single-file HTML",
    origin: "attendance-checkin.html",
    href: "/showcase/attendance-checkin/",
    ...withCover("attendance-checkin", "课堂签到工具界面截图"),
    ...withTimeline("2026-03-04", "2026-03-04"),
    badges: ["教学场景", "快速记录", "单文件"],
    tone: "graphite"
  },
  {
    slug: "habit-blindbox",
    title: "习惯盲盒",
    eyebrow: "Micro habit prompt",
    summary: "用盲盒机制给日常习惯一点随机奖励感，让重复动作更像一场轻量抽卡。",
    category: "tool",
    categoryLabel: "工具",
    stack: "Single-file HTML",
    origin: "habit-blindbox.html",
    href: "/showcase/habit-blindbox/",
    ...withCover("habit-blindbox", "习惯盲盒界面截图"),
    ...withTimeline("2026-03-06", "2026-03-06"),
    badges: ["习惯系统", "抽卡感", "轻交互"],
    tone: "citrus"
  },
  {
    slug: "fitness-engine",
    title: "Personal Fitness Engine",
    eyebrow: "Training dashboard",
    summary: "把 12 周训练计划、打卡和身体数据追踪放进一个页面里，偏个人化健康管理工具。",
    category: "tool",
    categoryLabel: "工具",
    stack: "HTML / CSS / JavaScript",
    origin: "fitness-plan-v1/",
    href: "/showcase/personal-fitness-engine/",
    ...withCover("fitness-engine", "Personal Fitness Engine 健身仪表板截图"),
    ...withTimeline("2026-03-11", "2026-03-11"),
    badges: ["12 周计划", "数据追踪", "自我管理"],
    tone: "lagoon"
  },
  {
    slug: "four-factors-lab",
    title: "四因素训练舱",
    eyebrow: "Mindset practice lab",
    summary: "把自我批评、好奇心、专注、毅力拆成每日训练卡，配专注计时、本地存档和七日回看。",
    category: "tool",
    categoryLabel: "工具",
    stack: "HTML / CSS / JavaScript",
    origin: "four-factors-lab/",
    href: "/showcase/four-factors-lab/index.html",
    ...withCover("four-factors-lab", "四因素训练舱首页截图"),
    ...withTimeline("2026-03-14", "2026-03-14"),
    badges: ["四因素训练", "专注计时", "本地存档"],
    tone: "citrus"
  },
  {
    slug: "ims-dashboard",
    title: "IMS 小组项目作战面板",
    eyebrow: "Project board",
    summary: "一个把小组协作状态可视化的仪表板页面，适合压缩项目信息、统一节奏。",
    category: "tool",
    categoryLabel: "工具",
    stack: "Single-file HTML",
    origin: "ims-group-project-dashboard.html",
    href: "/showcase/ims-dashboard/",
    repoUrl: "https://github.com/lastxuan4396/ims-group-dashboard-web",
    ...withCover("ims-dashboard", "IMS 小组项目作战面板截图"),
    ...withTimeline("2026-03-09", "2026-03-09"),
    badges: ["项目管理", "信息压缩", "看板感"],
    tone: "graphite"
  },
  {
    slug: "shapebro",
    title: "形状哥检测器",
    eyebrow: "Fun detector",
    summary: "一个更偏趣味和梗感的轻工具页，用网页形式把玩笑设定做成能点开的互动对象。",
    category: "tool",
    categoryLabel: "工具",
    stack: "Single-file HTML",
    origin: "shapebro.html",
    href: "/showcase/shapebro/",
    ...withCover("shapebro", "形状哥检测器界面截图"),
    badges: ["趣味工具", "单页", "轻实验"],
    tone: "graphite",
    hidden: true
  },
  {
    slug: "nvc-couple",
    title: "非暴力沟通练习板",
    eyebrow: "Conversation aid",
    summary: "围绕观察、感受、需要、请求四步，把情绪表达流程做成一个可使用的练习板。",
    category: "story",
    categoryLabel: "关系 / 叙事",
    stack: "Single-file HTML",
    origin: "nvc-couple.html",
    href: "/showcase/nvc-couple/",
    repoUrl: "https://github.com/lastxuan4396/NO-",
    ...withCover("nvc-couple", "非暴力沟通练习板界面截图"),
    ...withTimeline("2026-03-07", "2026-03-07"),
    badges: ["NVC", "双人沟通", "结构化表达"],
    tone: "citrus"
  },
  {
    slug: "repair-12min",
    title: "12分钟和好",
    eyebrow: "Repair ritual",
    summary: "把冲突修复拆成有节奏的 12 分钟流程，强调降温、改写和低风险表达。",
    category: "story",
    categoryLabel: "关系 / 叙事",
    stack: "HTML / CSS / JavaScript",
    origin: "repair-12min-render/",
    href: "/showcase/repair-12min/",
    repoUrl: "https://github.com/lastxuan4396/12-",
    ...withCover("repair-12min", "12分钟和好流程界面截图"),
    ...withTimeline("2026-03-07", "2026-03-09"),
    badges: ["修复流程", "降温分流", "双人使用"],
    tone: "ember"
  },
  {
    slug: "birthday-qujiawei",
    title: "曲家崴 · 生日快乐",
    eyebrow: "Mobile microsite",
    summary: "一个手机优先的生日祝福微站，气氛比信息密度更重要，强调情绪和分享感。",
    category: "special",
    categoryLabel: "专题页",
    stack: "Static microsite",
    origin: "birthday-qujiawei/",
    href: "/showcase/birthday-qujiawei/",
    repoUrl: "https://github.com/lastxuan4396/qujiawei-birthday-share",
    ...withCover("birthday-qujiawei", "曲家崴生日快乐微站截图"),
    badges: ["手机优先", "祝福页", "分享入口"],
    tone: "ember",
    hidden: true
  },
  {
    slug: "apple-inspired-lab",
    title: "Apple Style Lab",
    eyebrow: "Visual study",
    summary: "偏视觉语言研究的页面实验，重点在版式、留白和苹果式氛围的网页转译。",
    category: "special",
    categoryLabel: "专题页",
    stack: "HTML / CSS / JavaScript",
    origin: "apple-inspired-lab/",
    href: "/showcase/apple-inspired-lab/",
    ...withCover("apple-inspired-lab", "Apple Style Lab 页面截图"),
    ...withTimeline("2026-03-11", "2026-03-11"),
    badges: ["视觉研究", "版式实验", "质感导向"],
    tone: "graphite"
  }
];

export const directWorks: ShowcaseWork[] = directWorksSeed.filter((work) => !work.hidden);

export const serviceWorks: ShowcaseWork[] = [
  {
    slug: "tree-platform",
    title: "TREE - 能力树升级（可分享版）",
    eyebrow: "Full-stack growth system",
    summary: "这是能力树的完整版仓库，带云同步、只读分享链接、提醒调度、Web Push 和成长机制扩展。",
    category: "tool",
    categoryLabel: "工具",
    stack: "Node / Postgres / PWA",
    origin: "TREE/",
    repoUrl: "https://github.com/lastxuan4396/TREE",
    badges: ["云同步", "分享页", "提醒系统"],
    tone: "lagoon"
  },
  {
    slug: "checkin-blindbox-share",
    title: "签到 + 习惯盲盒 v5.0",
    eyebrow: "Teacher flow with backend",
    summary: "老师输入名单后生成学生签到链接与教师统计链接，完整流程依赖服务端存储和同步。",
    category: "tool",
    categoryLabel: "工具",
    stack: "Node / SQLite / Static frontend",
    origin: "checkin-blindbox-share/",
    repoUrl: "https://github.com/lastxuan4396/checkin-blindbox-share-Public",
    badges: ["多人流程", "实时统计", "教师场景"],
    tone: "lagoon"
  },
  {
    slug: "flight-chess-share",
    title: "情侣飞行棋 V2.3（联机分享版）",
    eyebrow: "Realtime room play",
    summary: "带房间同步、WebSocket 和权威动作 API 的联机版本，比单机棋盘版更像完整产品。",
    category: "game",
    categoryLabel: "游戏",
    stack: "Node / WebSocket / Frontend app",
    origin: "flight-chess-share/",
    badges: ["房间同步", "联机", "完整规则"],
    tone: "indigo"
  },
  {
    slug: "nvc-couple-share",
    title: "非暴力沟通练习板 Share",
    eyebrow: "Shared link workflow",
    summary: "在练习板之外补上短链分享、过期策略和双人协作流程，适合异地共同填写。",
    category: "story",
    categoryLabel: "关系 / 叙事",
    stack: "Node / Short link / Frontend app",
    origin: "nvc-couple-share/",
    repoUrl: "https://github.com/lastxuan4396/NO-",
    badges: ["短链分享", "异地协作", "流程化"],
    tone: "citrus"
  }
];

export const archiveWorks: ShowcaseWork[] = [
  {
    slug: "checkin-share",
    title: "签到 + 习惯盲盒 v3.0",
    eyebrow: "Earlier branch",
    summary: "签到工具的较早版本分支，保留了功能演进前的轻量流程。",
    category: "tool",
    categoryLabel: "工具",
    stack: "Node / Static frontend",
    origin: "checkin-share/",
    repoUrl: "https://github.com/lastxuan4396/checkin-share",
    badges: ["旧版", "版本迭代", "归档"],
    tone: "graphite"
  },
  {
    slug: "ohcard-main-deploy",
    title: "OH Card Studio Main Deploy",
    eyebrow: "Alternate deploy branch",
    summary: "OH Card Studio 的部署分支，保留了一套独立发布时的文件组织方式。",
    category: "story",
    categoryLabel: "关系 / 叙事",
    stack: "Static deploy branch",
    origin: "ohcard-main-deploy/",
    badges: ["分支版", "部署稿", "归档"],
    tone: "graphite"
  }
];

export const githubShelf: RepoShelfItem[] = [
  {
    name: "lastxuan4396/lastxuan4396",
    title: "GitHub 个人入口页",
    summary: "作为仓库门面使用的 profile repo，适合放这组作品的总入口和自我介绍脉络。",
    url: "https://github.com/lastxuan4396/lastxuan4396",
    tags: ["Profile", "入口", "总览"]
  },
  {
    name: "lastxuan4396/rainy-heartbeat-text-adventure",
    title: "Rainy Heartbeat Text Adventure",
    summary: "一个带雨夜气氛、分支叙事和音效氛围的文字冒险仓库，目前不在本地工作区，但很适合挂进作品墙。",
    url: "https://github.com/lastxuan4396/rainy-heartbeat-text-adventure",
    tags: ["文字冒险", "叙事", "GitHub only"]
  },
  {
    name: "lastxuan4396/FEI-",
    title: "FEI- 互动网站仓库",
    summary: "偏个人站和互动网页方向的实验集合，适合作为你 GitHub 上的另一个风格分支入口。",
    url: "https://github.com/lastxuan4396/FEI-",
    tags: ["互动网站", "实验集", "分支"]
  }
];
