const MODES = {
  focus: {
    name: "单卡聚焦",
    badge: "1 张核心洞察",
    count: 1,
    labels: ["核心线索"],
    goal: "在复杂情绪里快速抓住一个最重要的信号，适合当下卡顿、决策前的自检。",
    description: "抽 1 张，先描述，再联想，最后把洞察落到一个行动。",
    when: "时间少、问题散、需要先看清当前关键点时。",
    steps: [
      "描述你最先看到的元素，不解释意义。",
      "联想这个画面与你最近的现实事件。",
      "探究这张牌在提醒你坚持什么、放下什么。"
    ]
  },
  timeline: {
    name: "时间线三张",
    badge: "过去 / 现在 / 未来",
    count: 3,
    labels: ["过去", "现在", "未来"],
    goal: "梳理事件发展脉络，看清模式如何形成、当下卡点是什么、下一步趋势可能去向哪里。",
    description: "3 张牌按时序解读，适合职业选择、关系变化、阶段复盘。",
    when: "需要理解“我是怎么走到这一步”的时候。",
    steps: [
      "过去位：识别曾经形成的习惯、信念或情境。",
      "现在位：指出当前最真实的处境与情绪。",
      "未来位：不是预言，而是当前路径延续下的可能方向。"
    ]
  },
  mirror: {
    name: "关系镜像",
    badge: "我 / 对方 / 连接",
    count: 3,
    labels: ["我", "对方", "连接桥梁"],
    goal: "帮助你看见关系里的双向投射，避免只站在单一视角理解冲突。",
    description: "从双方与关系本身三个角度看同一议题。",
    when: "沟通不顺、关系拉扯、想修复互动质量时。",
    steps: [
      "我位：我带着怎样的期待、担忧和防御。",
      "对方位：对方可能在保护什么、表达什么。",
      "桥梁位：关系需要建立什么新规则或新沟通方式。"
    ]
  },
  diamond: {
    name: "四维钻石",
    badge: "事实 / 感受 / 需求 / 行动",
    count: 4,
    labels: ["事实", "感受", "需求", "行动"],
    goal: "把模糊问题拆成可行动结构，避免一直停留在情绪旋涡。",
    description: "常用于高压情境、拖延循环、职业选择焦虑。",
    when: "你知道有问题，但不知道怎么落地解决时。",
    steps: [
      "事实位：确认客观发生了什么，不做评价。",
      "感受位：承认真实情绪，而不是压抑。",
      "需求位：厘清被忽略的核心需要。",
      "行动位：给出 72 小时内可执行的最小动作。"
    ]
  },
  strategy: {
    name: "五点策略阵",
    badge: "现状 / 资源 / 阻碍 / 突破 / 下一步",
    count: 5,
    labels: ["现状", "资源", "阻碍", "突破口", "下一步"],
    goal: "把问题从“我很乱”变成“我知道下一步怎么做”，适合目标推进和阶段规划。",
    description: "强调资源盘点与障碍转化，结果导向很强。",
    when: "你准备行动，需要具体策略地图时。",
    steps: [
      "现状位：定义你眼前的真实挑战。",
      "资源位：列出你已经拥有但未充分使用的支持。",
      "阻碍位：识别最关键的内外阻力。",
      "突破口位：找到可以撬动局面的杠杆点。",
      "下一步位：写下今天就能执行的动作。"
    ]
  }
};

const DECK_TYPES = {
  pair: {
    name: "图字配对",
    desc: "每个位置抽 1 张图卡 + 1 张字卡"
  },
  image: {
    name: "图卡模式",
    desc: "只抽图卡，强化画面联想"
  },
  word: {
    name: "字卡模式",
    desc: "只抽字卡，强化语义触发"
  }
};

const LAYOUT_DIRECTIONS = {
  up: {
    name: "上",
    desc: "整体 0°",
    rotationClass: "rot-0"
  },
  right: {
    name: "右",
    desc: "整体 90°",
    rotationClass: "rot-90"
  },
  down: {
    name: "下",
    desc: "整体 180°",
    rotationClass: "rot-180"
  },
  left: {
    name: "左",
    desc: "整体 270°",
    rotationClass: "rot-270"
  }
};

const SESSION_PRESETS = {
  warmup: {
    name: "暖场单卡",
    modeId: "focus",
    deckTypeId: "pair",
    layoutDirection: "up",
    note: "适合第一次开局，先看当下最核心信号。"
  },
  decision: {
    name: "决策拆解",
    modeId: "diamond",
    deckTypeId: "pair",
    layoutDirection: "up",
    note: "事实-感受-需求-行动四步，适合做选择前梳理。"
  },
  relation: {
    name: "关系对话",
    modeId: "mirror",
    deckTypeId: "pair",
    layoutDirection: "right",
    note: "看见我/对方/连接桥梁，适合双人关系议题。"
  },
  strategy: {
    name: "推进策略",
    modeId: "strategy",
    deckTypeId: "pair",
    layoutDirection: "left",
    note: "现状-资源-阻碍-突破-下一步，适合卡住时推进。"
  }
};

const FACILITATOR_STAGES = [
  {
    id: "description",
    name: "描述阶段",
    duration: "2-4 分钟",
    cue: "先说“看到什么”，不解释对错。把形状、动作、关系拆开说。"
  },
  {
    id: "association",
    name: "联想阶段",
    duration: "3-5 分钟",
    cue: "把牌面连接到现实事件，尽量说具体人、具体场景。"
  },
  {
    id: "inquiry",
    name: "探究阶段",
    duration: "3-5 分钟",
    cue: "辨认感受与需求，不急着得结论，先问“我现在最需要什么？”"
  },
  {
    id: "action",
    name: "行动阶段",
    duration: "2-3 分钟",
    cue: "收束为 72 小时内可执行的一步，越小越好，越具体越好。"
  }
];

const EMOTION_LABELS = {
  1: "1 · 很低",
  2: "2 · 偏低",
  3: "3 · 中等",
  4: "4 · 偏高",
  5: "5 · 很高"
};

const HIGH_RISK_PATTERN =
  /(自杀|自残|不想活|活不下去|伤害自己|伤害他人|绝望到极点|想结束生命|suicide|kill myself|harm myself|self-harm)/i;

const ROTATION_CLASSES = ["rot-0", "rot-90", "rot-180", "rot-270"];
const COMPOSITE_BASE_RATIO = 1045 / 1312;

const WORKFLOW_STEPS = [
  { id: "question", name: "设题" },
  { id: "draw", name: "抽卡" },
  { id: "guide", name: "引导" },
  { id: "note", name: "记录" },
  { id: "export", name: "导出" }
];

const PROMPT_LAYERS = [
  {
    id: "description",
    name: "描述性问题",
    hint: "先描述眼前画面，不急着解释含义。把“看到什么”与“它像什么”分开说。"
  },
  {
    id: "association",
    name: "联想性问题",
    hint: "把牌面连接到你的真实生活和成长经验，找到反复出现的场景模式。"
  },
  {
    id: "inquiry",
    name: "探究性问题",
    hint: "进入情绪和需求层面，找出你真正想改变的部分与行动方向。"
  }
];

const PROMPT_STYLES = {
  gentle: {
    name: "温和",
    hint: "降低压迫感，优先建立安全感。",
    extra: {
      description: ["如果你愿意，先说最容易开口的那一部分。"],
      association: ["先选一个最轻的现实片段来联想，不必一次说完整故事。"],
      inquiry: ["此刻你最需要被照顾的部分是什么？先从最小支持开始。"]
    }
  },
  balanced: {
    name: "平衡",
    hint: "兼顾看见事实、感受与行动。",
    extra: {
      description: ["把“看到什么”和“这意味着什么”分两句说，避免混在一起。"],
      association: ["这张牌和你本周哪个具体事件最像？"],
      inquiry: ["如果只做一件小事让今天更顺一点，你会选什么？"]
    }
  },
  deep: {
    name: "深挖",
    hint: "提高反思深度，适合已有准备时使用。",
    extra: {
      description: ["除了表层画面，你还忽略了哪个不舒服的细节？"],
      association: ["这个模式在你人生里重复了多少次？通常由什么触发？"],
      inquiry: ["这背后你最害怕失去什么？如果不再回避，你准备承担什么？"]
    }
  }
};

const PROMPT_POOL = {
  description: [
    "你看到了什么？",
    "看上去像什么？",
    "你认为这是什么？",
    "最先吸引你注意力的是哪个元素？",
    "如果用三个词描述这张牌，你会怎么说？"
  ],
  association: [
    "这使你想起什么？",
    "这是你生活里经常见过的场景吗？",
    "这在你成长经历中有类似的情境么？",
    "它像你最近哪个真实事件的缩影？",
    "这张牌让你想到哪段关系或角色？"
  ],
  inquiry: [
    "你的感觉是什么？",
    "在这个情境中你的感受是什么？",
    "你最想保护的需求是什么？",
    "如果这张牌在提醒你一件事，那会是什么？",
    "你愿意为改变做的第一个动作是什么？"
  ]
};

const DEFAULT_WORD_DECK = [
  { name: "钥匙", glyph: "✦", tone: "sand", keywords: ["开启", "机会", "方法"], cue: "眼前某扇门需要主动试探，而不是等待许可。" },
  { name: "桥", glyph: "▤", tone: "ocean", keywords: ["连接", "过渡", "对话"], cue: "两端都存在价值，重点是如何搭建可通行的路径。" },
  { name: "门", glyph: "▣", tone: "sand", keywords: ["边界", "进出", "抉择"], cue: "不是所有门都要进，关键是你要对入口负责。" },
  { name: "镜子", glyph: "◍", tone: "night", keywords: ["投射", "自我", "觉察"], cue: "你看到的他人反应，可能也在映照自己的状态。" },
  { name: "楼梯", glyph: "⋰", tone: "moss", keywords: ["进阶", "过程", "耐心"], cue: "真正的变化像爬楼梯，不是一次跃迁。" },
  { name: "迷宫", glyph: "⌘", tone: "night", keywords: ["复杂", "试错", "方向"], cue: "你不是没能力，而是需要新的观察路径。" },
  { name: "灯塔", glyph: "⚑", tone: "ocean", keywords: ["指引", "稳定", "信号"], cue: "你可以先做那个最稳定、最可见的动作。" },
  { name: "船", glyph: "⛵", tone: "ocean", keywords: ["旅程", "承载", "探索"], cue: "离岸是风险，也是成长必要阶段。" },
  { name: "雨伞", glyph: "☂", tone: "night", keywords: ["保护", "边界", "照顾"], cue: "请区分真实风险与想象中的灾难。" },
  { name: "风筝", glyph: "◬", tone: "fire", keywords: ["理想", "牵引", "平衡"], cue: "自由需要一条稳定的线来支撑高度。" },
  { name: "树", glyph: "✳", tone: "moss", keywords: ["扎根", "成长", "生命力"], cue: "先照顾根系，再谈枝叶的扩展。" },
  { name: "种子", glyph: "•", tone: "moss", keywords: ["起点", "潜力", "等待"], cue: "你正在做的事还在发芽期，不必急于结果。" },
  { name: "石头", glyph: "◼", tone: "night", keywords: ["现实", "重量", "沉着"], cue: "让你不舒服的限制，也可能是稳定支点。" },
  { name: "河流", glyph: "≈", tone: "ocean", keywords: ["流动", "顺势", "变化"], cue: "对抗流向会消耗，你可以找更顺势的走法。" },
  { name: "山峰", glyph: "▲", tone: "sand", keywords: ["目标", "挑战", "视野"], cue: "越接近目标越需要节奏，而不是蛮力。" },
  { name: "时钟", glyph: "◴", tone: "night", keywords: ["节奏", "期限", "优先级"], cue: "你要先决定什么重要，再安排时间。" },
  { name: "地图", glyph: "⌖", tone: "sand", keywords: ["路径", "定位", "决策"], cue: "先确认你在哪，再决定去哪里。" },
  { name: "背包", glyph: "▢", tone: "sand", keywords: ["资源", "准备", "负担"], cue: "不是带得越多越安全，轻装也能更远。" },
  { name: "猫", glyph: "◠", tone: "moss", keywords: ["直觉", "敏感", "独立"], cue: "信号很细微，但你的身体已经先感知到了。" },
  { name: "鸟", glyph: "⌯", tone: "ocean", keywords: ["视角", "自由", "迁移"], cue: "抬高视角后，困境会呈现不同结构。" },
  { name: "杯子", glyph: "◖", tone: "sand", keywords: ["容纳", "情绪", "关系"], cue: "先看容器是否够稳，再决定要装什么。" },
  { name: "锁", glyph: "⛒", tone: "night", keywords: ["限制", "安全", "秘密"], cue: "你在保护重要东西，同时也可能困住自己。" },
  { name: "火焰", glyph: "♨", tone: "fire", keywords: ["热情", "转化", "能量"], cue: "这股能量需要出口，否则会反噬。" },
  { name: "窗", glyph: "▦", tone: "ocean", keywords: ["观察", "机会", "边界"], cue: "你不必立刻跳出去，先看清外部环境。" },
  { name: "路标", glyph: "➤", tone: "sand", keywords: ["方向", "选择", "提示"], cue: "答案可能早就在路上，只是你没停下来读它。" },
  { name: "面具", glyph: "◑", tone: "night", keywords: ["角色", "防御", "真实"], cue: "你戴着的角色帮过你，也可能限制了你。" },
  { name: "沙漏", glyph: "⌛", tone: "sand", keywords: ["等待", "过程", "节律"], cue: "有些事不是拖延，而是还在沉淀周期里。" },
  { name: "剪刀", glyph: "✂", tone: "fire", keywords: ["切断", "聚焦", "取舍"], cue: "清晰来自删减，不来自叠加。" },
  { name: "线团", glyph: "∞", tone: "moss", keywords: ["纠缠", "线索", "梳理"], cue: "慢慢拉开线头，你会找到可解的起点。" },
  { name: "指南针", glyph: "✪", tone: "ocean", keywords: ["方向感", "价值", "校准"], cue: "先定义你的北方，再决定速度。" },
  { name: "锚", glyph: "⚓", tone: "night", keywords: ["稳定", "落地", "停靠"], cue: "你可以先让自己稳定，再处理外部波浪。" },
  { name: "隧道", glyph: "◍", tone: "night", keywords: ["未知", "过渡", "勇气"], cue: "黑暗阶段不等于走错，可能只是未见出口。" },
  { name: "花园", glyph: "✿", tone: "moss", keywords: ["滋养", "关系", "长期"], cue: "你投入在哪里，哪里就会慢慢繁盛。" },
  { name: "舞台", glyph: "▵", tone: "fire", keywords: ["表达", "看见", "影响"], cue: "被看见并不危险，压抑表达才会积压能量。" },
  { name: "信封", glyph: "✉", tone: "sand", keywords: ["消息", "沟通", "澄清"], cue: "把想法说清楚，比猜测更省力。" },
  { name: "电话", glyph: "☎", tone: "ocean", keywords: ["联系", "回应", "连接"], cue: "一通真实沟通可能比长时间内耗更有效。" },
  { name: "帆", glyph: "⧉", tone: "ocean", keywords: ["风向", "调整", "推进"], cue: "改变角度比硬顶风阻更有用。" },
  { name: "羽毛", glyph: "❧", tone: "moss", keywords: ["轻盈", "灵感", "感受"], cue: "不是每个决定都要沉重，你也可以轻一点。" },
  { name: "相机", glyph: "◉", tone: "night", keywords: ["聚焦", "叙事", "取景"], cue: "你选择看见什么，就会放大什么。" },
  { name: "火车", glyph: "▣", tone: "fire", keywords: ["轨道", "惯性", "时机"], cue: "先上车再微调路线，也是一种策略。" },
  { name: "轮盘", glyph: "◎", tone: "sand", keywords: ["循环", "概率", "选择"], cue: "重复不是命运，而是未更新的选择机制。" },
  { name: "云", glyph: "☁", tone: "ocean", keywords: ["情绪", "模糊", "变化"], cue: "不清楚不是错误，它提醒你先停下来感受。" },
  { name: "小路", glyph: "⤳", tone: "moss", keywords: ["探索", "试步", "弹性"], cue: "先走出一小步，路会边走边显现。" },
  { name: "灯", glyph: "✺", tone: "fire", keywords: ["看见", "清晰", "勇气"], cue: "当你照亮盲区，选择会自然变清晰。" },
  { name: "帘幕", glyph: "▧", tone: "night", keywords: ["遮蔽", "等待", "揭示"], cue: "此刻不必强行揭开一切，节奏同样重要。" },
  { name: "望远镜", glyph: "⎈", tone: "ocean", keywords: ["远景", "格局", "规划"], cue: "你需要看更远，才能理解当下动作的价值。" },
  { name: "画框", glyph: "▢", tone: "sand", keywords: ["边界", "定义", "意义"], cue: "改变框架，你对问题的解释会一起改变。" },
  { name: "琴弦", glyph: "𝄞", tone: "moss", keywords: ["张力", "共振", "调音"], cue: "不是越紧越好，合适张力才有好声音。" },
  { name: "拼图", glyph: "▱", tone: "sand", keywords: ["整合", "碎片", "全局"], cue: "缺失的一块会在行动中出现，不只在思考里出现。" },
  { name: "天秤", glyph: "⚖", tone: "night", keywords: ["平衡", "判断", "取舍"], cue: "你可以接受权衡，而不是追求完美兼得。" },
  { name: "钥匙孔", glyph: "◌", tone: "fire", keywords: ["入口", "视角", "专注"], cue: "先从一个小入口切入，局面就会开始松动。" }
].map((card) => normalizeWordCard(card));

const IMAGE_SCENE_POOL = [
  { name: "清晨窗台", tone: "sand", symbol: "□", colors: ["#efd8ad", "#f9f3e8", "#d69f64"], keywords: ["安静", "观察"], cue: "也许你只需要静下来观察，而不是立刻定论。" },
  { name: "雨中街口", tone: "ocean", symbol: "◇", colors: ["#87b7c5", "#d7ebf1", "#4f7994"], keywords: ["流动", "选择"], cue: "你站在岔路口，先判断方向再迈步会更稳。" },
  { name: "夜色楼梯", tone: "night", symbol: "△", colors: ["#7f879f", "#d7dae6", "#4e5568"], keywords: ["进阶", "过程"], cue: "黑暗里也有台阶，重点是一步一步向上。" },
  { name: "旧港船坞", tone: "ocean", symbol: "◌", colors: ["#82a7a3", "#d5ebe8", "#436d67"], keywords: ["停靠", "启航"], cue: "你可以先停靠整顿，再出发不迟。" },
  { name: "黄昏山坡", tone: "sand", symbol: "▲", colors: ["#e5b880", "#f7e2c7", "#ac7441"], keywords: ["视野", "目标"], cue: "把目光放远，眼前阻力就不再是全部。" },
  { name: "镜湖倒影", tone: "ocean", symbol: "◎", colors: ["#79adb5", "#def0f2", "#4f7f84"], keywords: ["投射", "自我"], cue: "你看到的画面，也许是内心的倒影。" },
  { name: "荒野灯塔", tone: "fire", symbol: "✶", colors: ["#edb180", "#ffe8d1", "#c37740"], keywords: ["信号", "方向"], cue: "先点亮一盏灯，你就有了方向锚点。" },
  { name: "古桥薄雾", tone: "night", symbol: "⊓", colors: ["#9b9fa9", "#e8eaef", "#6f7480"], keywords: ["连接", "过渡"], cue: "你正在过桥，别把雾当成终点。" },
  { name: "林间小径", tone: "moss", symbol: "≈", colors: ["#8ab082", "#e2f0de", "#5f8157"], keywords: ["探索", "弹性"], cue: "路未必一开始就清晰，走着走着才会显现。" },
  { name: "旧城广场", tone: "sand", symbol: "▦", colors: ["#d7b093", "#f7eadd", "#986e4e"], keywords: ["关系", "互动"], cue: "问题常发生在人与人的互动结构里。" },
  { name: "沙丘风线", tone: "sand", symbol: "⋯", colors: ["#ebc48f", "#fbeedb", "#bd8d4f"], keywords: ["时间", "痕迹"], cue: "时间会留下纹理，你需要读取这些变化。" },
  { name: "晨雾花园", tone: "moss", symbol: "✿", colors: ["#a4c895", "#edf5e8", "#6f9961"], keywords: ["滋养", "长期"], cue: "长期被滋养的关系，会慢慢开花。" },
  { name: "深夜车站", tone: "night", symbol: "⧉", colors: ["#8a93ac", "#e3e6f2", "#5b6177"], keywords: ["等待", "转场"], cue: "等待不是停滞，可能是在换乘。" },
  { name: "风中高塔", tone: "fire", symbol: "✧", colors: ["#e6aa75", "#fce8d6", "#af6734"], keywords: ["稳定", "适应"], cue: "稳定不是不动，而是能在风中调整。" },
  { name: "午后河岸", tone: "ocean", symbol: "∿", colors: ["#86b7b1", "#dff1ee", "#588b85"], keywords: ["顺势", "变化"], cue: "与其对抗流向，不如找到顺势路线。" },
  { name: "云上观景", tone: "ocean", symbol: "☁", colors: ["#98bed0", "#eaf3f9", "#5f87a4"], keywords: ["远景", "抽离"], cue: "拉高视角后，细节会重新排列。" },
  { name: "舞台幕布", tone: "fire", symbol: "▵", colors: ["#e89f82", "#fde7dd", "#bf6140"], keywords: ["表达", "看见"], cue: "你可以尝试更真实地表达，而不是只演角色。" },
  { name: "断崖回声", tone: "night", symbol: "◢", colors: ["#8e9099", "#e5e6ea", "#5f626d"], keywords: ["边界", "风险"], cue: "先确认边界，再做跃迁。" },
  { name: "曙光平原", tone: "moss", symbol: "✺", colors: ["#b3cb95", "#f0f7e7", "#7a9861"], keywords: ["希望", "起点"], cue: "再小的光，也可以成为重新开始的信号。" },
  { name: "旧书房间", tone: "sand", symbol: "▤", colors: ["#dcb28d", "#f8e8db", "#9e6f4f"], keywords: ["记忆", "整理"], cue: "过去的经验需要被重新整理，而不是堆积。" },
  { name: "海边栈桥", tone: "ocean", symbol: "⛶", colors: ["#78a8bf", "#dcebf3", "#4f7489"], keywords: ["连接", "选择"], cue: "选择不是对错，而是你愿意走哪段栈桥。" },
  { name: "森林转角", tone: "moss", symbol: "⤳", colors: ["#95bc8d", "#e7f2e3", "#678d5f"], keywords: ["线索", "转机"], cue: "转角处未必是终点，也可能是转机。" },
  { name: "微光隧道", tone: "night", symbol: "◉", colors: ["#8891ab", "#dfe2ee", "#5a6278"], keywords: ["未知", "勇气"], cue: "看不到全貌时，先走向微光。" },
  { name: "风筝草地", tone: "fire", symbol: "◬", colors: ["#e5b07f", "#fae8d8", "#b97943"], keywords: ["自由", "牵引"], cue: "自由和牵引不是对立，可以同时存在。" }
];

const DEFAULT_IMAGE_DECK = IMAGE_SCENE_POOL.map((scene) => normalizeImageCard({
  name: scene.name,
  tone: scene.tone,
  keywords: scene.keywords,
  cue: scene.cue,
  image: buildSceneImage(scene)
}));

const STORAGE_KEY = "oh-card-lab-history-v1";
const CUSTOM_DECK_STORAGE_KEY = "oh-card-custom-decks-v1";
const OVERLAY_TUNE_STORAGE_KEY = "oh-card-overlay-tune-v1";
const CURRENT_SESSION_STORAGE_KEY = "oh-card-current-session-v1";
const SLOT_TEMPLATE_STORAGE_KEY = "oh-card-slot-template-v1";
const UI_PREF_STORAGE_KEY = "oh-card-ui-pref-v1";
const CLOUD_SYNC_STORAGE_KEY = "oh-card-cloud-sync-v1";
const SESSION_PROTOCOL_STORAGE_KEY = "oh-card-session-protocol-v1";
const APP_ASSET_VERSION = "20260312-19";
const BUNDLED_IMAGE_DECK_PATH = `./data/oh-image-deck.json?rev=${APP_ASSET_VERSION}`;
const BUNDLED_WORD_DECK_PATH = `./data/oh-word-deck.json?rev=${APP_ASSET_VERSION}`;

const DEFAULT_OVERLAY_TUNE = {
  left: 11.8,
  right: 11.8,
  top: 12.6,
  bottom: 10.8
};

const refs = {
  sessionIntentInput: document.getElementById("sessionIntentInput"),
  consentCheckbox: document.getElementById("consentCheckbox"),
  pauseProtocolBtn: document.getElementById("pauseProtocolBtn"),
  emotionIntensityInput: document.getElementById("emotionIntensityInput"),
  emotionIntensityValue: document.getElementById("emotionIntensityValue"),
  safetyAlert: document.getElementById("safetyAlert"),
  groundingPanel: document.getElementById("groundingPanel"),
  groundingText: document.getElementById("groundingText"),
  groundingBreathBtn: document.getElementById("groundingBreathBtn"),
  groundingSenseBtn: document.getElementById("groundingSenseBtn"),
  groundingSupportBtn: document.getElementById("groundingSupportBtn"),
  questionInput: document.getElementById("questionInput"),
  modeBadge: document.getElementById("modeBadge"),
  modeSwitch: document.getElementById("modeSwitch"),
  presetSwitch: document.getElementById("presetSwitch"),
  workflowSteps: document.getElementById("workflowSteps"),
  deckTypeSwitch: document.getElementById("deckTypeSwitch"),
  layoutDirectionSwitch: document.getElementById("layoutDirectionSwitch"),
  deckStatus: document.getElementById("deckStatus"),
  overlayLeftInput: document.getElementById("overlayLeftInput"),
  overlayRightInput: document.getElementById("overlayRightInput"),
  overlayTopInput: document.getElementById("overlayTopInput"),
  overlayBottomInput: document.getElementById("overlayBottomInput"),
  overlayLeftValue: document.getElementById("overlayLeftValue"),
  overlayRightValue: document.getElementById("overlayRightValue"),
  overlayTopValue: document.getElementById("overlayTopValue"),
  overlayBottomValue: document.getElementById("overlayBottomValue"),
  resetOverlayBtn: document.getElementById("resetOverlayBtn"),
  importImageDeckBtn: document.getElementById("importImageDeckBtn"),
  importWordDeckBtn: document.getElementById("importWordDeckBtn"),
  importImageDeckInput: document.getElementById("importImageDeckInput"),
  importWordDeckInput: document.getElementById("importWordDeckInput"),
  deckValidationSummary: document.getElementById("deckValidationSummary"),
  deckValidationList: document.getElementById("deckValidationList"),
  resetDeckBtn: document.getElementById("resetDeckBtn"),
  avoidRecentCheckbox: document.getElementById("avoidRecentCheckbox"),
  drawBtn: document.getElementById("drawBtn"),
  reshuffleBtn: document.getElementById("reshuffleBtn"),
  immersiveBtn: document.getElementById("immersiveBtn"),
  deck: document.getElementById("deck"),
  spreadSummary: document.getElementById("spreadSummary"),
  spreadBoard: document.getElementById("spreadBoard"),
  modeGoal: document.getElementById("modeGoal"),
  modeSteps: document.getElementById("modeSteps"),
  promptTabs: document.getElementById("promptTabs"),
  promptStyleSwitch: document.getElementById("promptStyleSwitch"),
  promptHint: document.getElementById("promptHint"),
  promptList: document.getElementById("promptList"),
  facilitatorToggleBtn: document.getElementById("facilitatorToggleBtn"),
  facilitatorStatus: document.getElementById("facilitatorStatus"),
  facilitatorChecklist: document.getElementById("facilitatorChecklist"),
  facilitatorNextBtn: document.getElementById("facilitatorNextBtn"),
  regenPromptBtn: document.getElementById("regenPromptBtn"),
  copyReportBtn: document.getElementById("copyReportBtn"),
  noteInput: document.getElementById("noteInput"),
  saveNoteBtn: document.getElementById("saveNoteBtn"),
  clearNoteBtn: document.getElementById("clearNoteBtn"),
  exportPngBtn: document.getElementById("exportPngBtn"),
  exportPdfBtn: document.getElementById("exportPdfBtn"),
  exportA4Btn: document.getElementById("exportA4Btn"),
  exportPosterBtn: document.getElementById("exportPosterBtn"),
  regenActionPlanBtn: document.getElementById("regenActionPlanBtn"),
  autoSummaryText: document.getElementById("autoSummaryText"),
  actionChecklist: document.getElementById("actionChecklist"),
  actionStats: document.getElementById("actionStats"),
  generateClosureBtn: document.getElementById("generateClosureBtn"),
  copyClosureBtn: document.getElementById("copyClosureBtn"),
  closureSummary: document.getElementById("closureSummary"),
  closureAction: document.getElementById("closureAction"),
  closureSupport: document.getElementById("closureSupport"),
  historyList: document.getElementById("historyList"),
  historySearchInput: document.getElementById("historySearchInput"),
  historyTagFilter: document.getElementById("historyTagFilter"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  playbookGrid: document.getElementById("playbookGrid"),
  timerMinutes: document.getElementById("timerMinutes"),
  timerToggle: document.getElementById("timerToggle"),
  timerText: document.getElementById("timerText"),
  focusModeBtn: document.getElementById("focusModeBtn"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  shareReadonlyBtn: document.getElementById("shareReadonlyBtn"),
  readonlyBanner: document.getElementById("readonlyBanner"),
  exitReadonlyBtn: document.getElementById("exitReadonlyBtn"),
  toggleDualModeBtn: document.getElementById("toggleDualModeBtn"),
  dualModePanel: document.getElementById("dualModePanel"),
  dualNoteA: document.getElementById("dualNoteA"),
  dualNoteB: document.getElementById("dualNoteB"),
  exportConsultBtn: document.getElementById("exportConsultBtn"),
  exportHomeworkBtn: document.getElementById("exportHomeworkBtn"),
  slotEditorList: document.getElementById("slotEditorList"),
  saveSlotTemplateBtn: document.getElementById("saveSlotTemplateBtn"),
  resetSlotTemplateBtn: document.getElementById("resetSlotTemplateBtn"),
  cloudEndpointInput: document.getElementById("cloudEndpointInput"),
  cloudTokenInput: document.getElementById("cloudTokenInput"),
  cloudPushBtn: document.getElementById("cloudPushBtn"),
  cloudPullBtn: document.getElementById("cloudPullBtn"),
  syncCodeExportBtn: document.getElementById("syncCodeExportBtn"),
  syncCodeImportBtn: document.getElementById("syncCodeImportBtn"),
  cloudSyncStatus: document.getElementById("cloudSyncStatus"),
  analyticsSummary: document.getElementById("analyticsSummary"),
  analyticsTopWords: document.getElementById("analyticsTopWords"),
  analyticsEmotionTrend: document.getElementById("analyticsEmotionTrend"),
  analyticsActionRate: document.getElementById("analyticsActionRate"),
  analyticsSessionQuality: document.getElementById("analyticsSessionQuality"),
  imagePreviewModal: document.getElementById("imagePreviewModal"),
  previewCloseBtn: document.getElementById("previewCloseBtn"),
  previewImage: document.getElementById("previewImage"),
  previewPairWrap: document.getElementById("previewPairWrap"),
  previewPairViewport: document.getElementById("previewPairViewport"),
  previewPairComposite: document.getElementById("previewPairComposite"),
  previewPairImage: document.getElementById("previewPairImage"),
  previewPairWord: document.getElementById("previewPairWord"),
  previewPairTools: document.getElementById("previewPairTools"),
  previewFitToggleBtn: document.getElementById("previewFitToggleBtn"),
  previewRotateLeftBtn: document.getElementById("previewRotateLeftBtn"),
  previewRotateRightBtn: document.getElementById("previewRotateRightBtn"),
  previewSyncRotation: document.getElementById("previewSyncRotation"),
  previewTitle: document.getElementById("previewTitle"),
  deckBuildTarget: document.getElementById("deckBuildTarget"),
  deckBatchPrefix: document.getElementById("deckBatchPrefix"),
  deckDropzone: document.getElementById("deckDropzone"),
  selectDeckImagesBtn: document.getElementById("selectDeckImagesBtn"),
  deckImagesInput: document.getElementById("deckImagesInput"),
  batchRenameBtn: document.getElementById("batchRenameBtn"),
  fixRatioBtn: document.getElementById("fixRatioBtn")
};

const state = {
  modeId: "focus",
  deckTypeId: "pair",
  layoutDirection: "up",
  layerId: "description",
  focusView: false,
  dualMode: false,
  readonlyMode: false,
  customSlotLabels: loadCustomSlotLabels(),
  cloudSync: loadCloudSyncConfig(),
  protocol: loadSessionProtocol(),
  drawVersion: 0,
  isDrawing: false,
  avoidRecent: true,
  promptStyleId: "balanced",
  layerVisits: new Set(),
  facilitator: {
    enabled: false,
    stageIndex: 0
  },
  currentCards: [],
  currentSession: null,
  closure: {
    summary: "",
    action: "",
    support: ""
  },
  groundingTimerId: null,
  history: loadHistory(),
  wordDeck: cloneCards(DEFAULT_WORD_DECK),
  imageDeck: cloneCards(DEFAULT_IMAGE_DECK),
  deckSource: {
    word: "built-in",
    image: "built-in"
  },
  overlayTune: { ...DEFAULT_OVERLAY_TUNE },
  immersive: false,
  previewSourceViewport: null,
  previewFitMode: "fit",
  preloadedImageUrls: new Set(),
  preloadedImageTasks: new Map(),
  resolvedImageUrlCache: new Map(),
  resolvingImageUrlTasks: new Map(),
  thumbnailCache: new Map(),
  bundledWebpAvailable: false,
  viewportFitTick: 0,
  deckValidation: { summary: "等待导入卡包后校验。", items: [] },
  historyQuery: "",
  historyTag: "all",
  dragPanStates: new WeakMap(),
  cardSortDrag: null,
  timer: {
    duration: 180,
    remaining: 180,
    running: false,
    intervalId: null
  },
  imageFailureMap: new Map()
};

init();

function init() {
  hydrateCustomDecks();
  hydrateOverlayTune();
  hydrateUiPreference();
  hydrateCloudSyncInputs();
  renderSessionProtocol();
  renderGroundingPanel();
  renderPresetSwitch();
  renderModeSwitch();
  renderModeDetail();
  renderDeckTypeSwitch();
  renderLayoutDirectionSwitch();
  renderDeckStatus();
  renderOverlayTuneControls();
  renderPromptTabs();
  renderPromptStyleSwitch();
  renderFacilitatorPanel();
  renderPlaybook();
  renderHistory();
  refs.historySearchInput.value = state.historyQuery;
  refs.historyTagFilter.value = state.historyTag;
  renderWorkflowSteps();
  renderActionPlan();
  renderDeckValidation();
  renderSlotEditor();
  renderDualModePanel();
  renderFocusView();
  renderCloudSyncStatus();
  renderAnalytics();
  renderClosurePanel();
  detectSafetyRisk();
  applyOverlayTuneToElement(refs.previewPairComposite);
  setSummary("已启用图卡 + 字卡玩法。你可以直接抽，也可以先导入自己的卡组。", false);
  const hasReadonlyShared = hydrateReadonlySessionFromHash();
  if (!hasReadonlyShared) {
    hydrateCurrentSessionSnapshot();
  }
  bindEvents();
  updateTimerDisplay();
  autoLoadBundledDecks();
  setupPreviewPairGestures();
  setupPreviewPressZoom();
  warmupPreload();
  registerServiceWorker();
  window.addEventListener("resize", scheduleRefreshViewportFits);
}

function bindEvents() {
  refs.sessionIntentInput.addEventListener("input", () => {
    state.protocol.intent = refs.sessionIntentInput.value.trim();
    persistSessionProtocol();
    if (state.currentSession) {
      syncCurrentSessionToHistory();
    }
    renderClosurePanel();
  });
  refs.consentCheckbox.addEventListener("change", () => {
    state.protocol.consent = refs.consentCheckbox.checked;
    persistSessionProtocol();
    if (state.currentSession) {
      syncCurrentSessionToHistory();
    }
    renderSessionProtocol();
    renderWorkflowSteps();
  });
  refs.pauseProtocolBtn.addEventListener("click", () => {
    state.protocol.paused = !state.protocol.paused;
    persistSessionProtocol();
    renderSessionProtocol();
    setSummary(state.protocol.paused ? "已进入暂停模式。你可以先呼吸、喝水、稍后继续。" : "已恢复探索模式。", false);
  });
  refs.emotionIntensityInput.addEventListener("input", () => {
    state.protocol.emotion = Math.max(1, Math.min(5, Number(refs.emotionIntensityInput.value) || 3));
    persistSessionProtocol();
    if (state.currentSession) {
      syncCurrentSessionToHistory();
    }
    renderSessionProtocol();
    renderGroundingPanel();
    renderClosurePanel();
    detectSafetyRisk();
  });
  refs.groundingBreathBtn.addEventListener("click", runGroundingBreath);
  refs.groundingSenseBtn.addEventListener("click", runGroundingSense);
  refs.groundingSupportBtn.addEventListener("click", runGroundingSupport);

  refs.questionInput.addEventListener("input", () => {
    if (state.currentSession) {
      state.currentSession.question = refs.questionInput.value.trim();
      syncCurrentSessionToHistory();
    }
    persistCurrentSessionSnapshot();
    detectSafetyRisk();
    renderSessionProtocol();
    renderWorkflowSteps();
  });

  refs.modeSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mode]");
    if (!button) {
      return;
    }
    setMode(button.dataset.mode);
  });

  refs.presetSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-preset]");
    if (!button) {
      return;
    }
    applySessionPreset(button.dataset.preset);
  });

  refs.deckTypeSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-deck-type]");
    if (!button) {
      return;
    }
    setDeckType(button.dataset.deckType);
  });
  refs.avoidRecentCheckbox.addEventListener("change", () => {
    state.avoidRecent = refs.avoidRecentCheckbox.checked;
    persistUiPreference();
    setSummary(state.avoidRecent ? "已开启防重复抽卡。" : "已关闭防重复抽卡。", false);
  });

  refs.layoutDirectionSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-layout-direction]");
    if (!button) {
      return;
    }
    setLayoutDirection(button.dataset.layoutDirection);
  });

  refs.promptTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-layer]");
    if (!button) {
      return;
    }
    state.layerId = button.dataset.layer;
    markLayerVisited(state.layerId);
    syncFacilitatorStageByLayer(state.layerId);
    renderPromptTabs();
    renderFacilitatorPanel();
    renderClosurePanel();
    renderPrompts();
  });
  refs.promptStyleSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-prompt-style]");
    if (!button) {
      return;
    }
    setPromptStyle(button.dataset.promptStyle);
  });

  refs.drawBtn.addEventListener("click", runDraw);
  refs.reshuffleBtn.addEventListener("click", resetBoard);
  refs.regenPromptBtn.addEventListener("click", renderPrompts);
  refs.saveNoteBtn.addEventListener("click", saveCurrentNote);
  refs.clearNoteBtn.addEventListener("click", () => {
    refs.noteInput.value = "";
    renderWorkflowSteps();
  });
  refs.noteInput.addEventListener("input", () => {
    persistCurrentSessionSnapshot();
    detectSafetyRisk();
    renderClosurePanel();
    renderWorkflowSteps();
  });
  refs.exportPngBtn.addEventListener("click", () => exportSessionAsset("png"));
  refs.exportPdfBtn.addEventListener("click", () => exportSessionAsset("pdf"));
  refs.exportA4Btn.addEventListener("click", () => exportSessionAsset("a4pdf"));
  refs.exportPosterBtn.addEventListener("click", () => exportSessionAsset("poster"));
  refs.exportConsultBtn.addEventListener("click", () => exportSessionAsset("consult"));
  refs.exportHomeworkBtn.addEventListener("click", () => exportSessionAsset("homework"));
  refs.regenActionPlanBtn.addEventListener("click", regenerateActionPlan);
  refs.actionChecklist.addEventListener("change", handleActionChecklistChange);
  refs.generateClosureBtn.addEventListener("click", generateClosureIntegration);
  refs.copyClosureBtn.addEventListener("click", copyClosureIntegration);
  refs.copyReportBtn.addEventListener("click", copyCurrentReport);
  refs.clearHistoryBtn.addEventListener("click", clearHistory);
  refs.historyList.addEventListener("click", handleHistoryAction);
  refs.historySearchInput.addEventListener("input", () => {
    state.historyQuery = refs.historySearchInput.value.trim();
    renderHistory();
  });
  refs.historyTagFilter.addEventListener("change", () => {
    state.historyTag = refs.historyTagFilter.value;
    renderHistory();
  });
  refs.deck.addEventListener("click", runDraw);
  refs.spreadBoard.addEventListener("click", handlePreviewImageClick);
  refs.timerToggle.addEventListener("click", toggleTimer);
  refs.immersiveBtn.addEventListener("click", toggleImmersiveMode);
  refs.focusModeBtn.addEventListener("click", toggleFocusView);
  refs.fullscreenBtn.addEventListener("click", toggleFullscreenMode);
  refs.shareReadonlyBtn.addEventListener("click", shareReadonlyLink);
  refs.exitReadonlyBtn.addEventListener("click", exitReadonlyMode);
  refs.toggleDualModeBtn.addEventListener("click", toggleDualMode);
  refs.dualNoteA.addEventListener("input", syncDualNotesToSession);
  refs.dualNoteB.addEventListener("input", syncDualNotesToSession);

  refs.overlayLeftInput.addEventListener("input", () => updateOverlayTune("left", refs.overlayLeftInput.value));
  refs.overlayRightInput.addEventListener("input", () => updateOverlayTune("right", refs.overlayRightInput.value));
  refs.overlayTopInput.addEventListener("input", () => updateOverlayTune("top", refs.overlayTopInput.value));
  refs.overlayBottomInput.addEventListener("input", () => updateOverlayTune("bottom", refs.overlayBottomInput.value));
  refs.resetOverlayBtn.addEventListener("click", resetOverlayTuneToDefault);
  refs.saveSlotTemplateBtn.addEventListener("click", saveCurrentSlotTemplate);
  refs.resetSlotTemplateBtn.addEventListener("click", resetCurrentSlotTemplate);
  refs.slotEditorList.addEventListener("input", handleSlotEditorInput);
  refs.slotEditorList.addEventListener("click", handleSlotEditorAction);

  refs.importImageDeckBtn.addEventListener("click", () => {
    refs.importImageDeckInput.click();
  });
  refs.importWordDeckBtn.addEventListener("click", () => {
    refs.importWordDeckInput.click();
  });
  refs.importImageDeckInput.addEventListener("change", (event) => {
    importDeckFromFile(event.target.files[0], "image");
    event.target.value = "";
  });
  refs.importWordDeckInput.addEventListener("change", (event) => {
    importDeckFromFile(event.target.files[0], "word");
    event.target.value = "";
  });
  refs.resetDeckBtn.addEventListener("click", resetDecksToBuiltIn);
  refs.selectDeckImagesBtn.addEventListener("click", () => {
    refs.deckImagesInput.click();
  });
  refs.deckImagesInput.addEventListener("change", async (event) => {
    await buildDeckFromImageFiles(Array.from(event.target.files || []), refs.deckBuildTarget.value);
    event.target.value = "";
  });
  refs.batchRenameBtn.addEventListener("click", batchRenameCurrentDeck);
  refs.fixRatioBtn.addEventListener("click", () => {
    fixCurrentDeckImageRatio();
  });
  refs.cloudEndpointInput.addEventListener("input", persistCloudSyncConfigFromInputs);
  refs.cloudTokenInput.addEventListener("input", persistCloudSyncConfigFromInputs);
  refs.cloudPushBtn.addEventListener("click", pushCloudSync);
  refs.cloudPullBtn.addEventListener("click", pullCloudSync);
  refs.syncCodeExportBtn.addEventListener("click", exportSyncCode);
  refs.syncCodeImportBtn.addEventListener("click", importSyncCode);
  setupDeckDropzone();
  refs.facilitatorToggleBtn.addEventListener("click", () => {
    toggleFacilitatorMode();
  });
  refs.facilitatorNextBtn.addEventListener("click", () => {
    advanceFacilitatorStage();
  });

  refs.previewCloseBtn.addEventListener("click", closeImagePreview);
  refs.previewFitToggleBtn.addEventListener("click", () => {
    togglePreviewFitMode();
  });
  refs.previewRotateLeftBtn.addEventListener("click", () => rotatePreviewPair(-1));
  refs.previewRotateRightBtn.addEventListener("click", () => rotatePreviewPair(1));
  refs.imagePreviewModal.addEventListener("click", (event) => {
    if (event.target === refs.imagePreviewModal || event.target.dataset.action === "close") {
      closeImagePreview();
    }
  });

  document.addEventListener("keydown", (event) => {
    const activeTag = String(document.activeElement?.tagName || "").toLowerCase();
    const isTyping = ["input", "textarea", "select"].includes(activeTag);
    if (event.key === "Escape" && !refs.imagePreviewModal.hidden) {
      closeImagePreview();
    }
    if (event.key === "Escape" && state.immersive) {
      toggleImmersiveMode(false);
    }
    if (event.key === "Escape" && state.focusView) {
      toggleFocusView(false);
    }
    if (isTyping) {
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      runDraw();
      return;
    }
    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      rotateLayoutDirection(1);
      return;
    }
    if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      toggleFullscreenMode();
      return;
    }
    if (event.key.toLowerCase() === "c") {
      event.preventDefault();
      copyCurrentReport();
    }
  });

  window.addEventListener("hashchange", () => {
    if (!location.hash.includes("share=")) {
      return;
    }
    hydrateReadonlySessionFromHash();
  });
  document.addEventListener("fullscreenchange", () => {
    refs.fullscreenBtn.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
  });
}

function renderSessionProtocol() {
  refs.sessionIntentInput.value = state.protocol.intent || "";
  refs.consentCheckbox.checked = Boolean(state.protocol.consent);
  refs.emotionIntensityInput.value = String(state.protocol.emotion || 3);
  refs.emotionIntensityValue.textContent = EMOTION_LABELS[state.protocol.emotion] || EMOTION_LABELS[3];
  refs.pauseProtocolBtn.textContent = state.protocol.paused ? "恢复模式" : "暂停模式";
  refs.drawBtn.disabled = state.protocol.paused;
}

function renderGroundingPanel() {
  const shouldShow = Number(state.protocol.emotion || 3) >= 4 || state.protocol.paused;
  refs.groundingPanel.hidden = !shouldShow;
  if (!shouldShow) {
    clearGroundingTimer();
    refs.groundingText.textContent = "当前强度偏高，建议先做 60 秒稳定练习。";
  }
}

function clearGroundingTimer() {
  if (state.groundingTimerId) {
    clearInterval(state.groundingTimerId);
    state.groundingTimerId = null;
  }
}

function runGroundingBreath() {
  clearGroundingTimer();
  let left = 60;
  refs.groundingText.textContent = `呼吸练习中：${left}s（吸4秒-停4秒-呼6秒，循环）`;
  state.groundingTimerId = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      clearGroundingTimer();
      refs.groundingText.textContent = "已完成 60 秒稳定练习。现在再看看牌面，哪里变清晰了？";
      return;
    }
    refs.groundingText.textContent = `呼吸练习中：${left}s（吸4秒-停4秒-呼6秒，循环）`;
  }, 1000);
}

function runGroundingSense() {
  clearGroundingTimer();
  refs.groundingText.textContent = "五感落地：说出 5样看到的、4样触到的、3样听到的、2样闻到/尝到的、1个此刻最重要的支持来源。";
}

async function runGroundingSupport() {
  clearGroundingTimer();
  const pool = [
    "你不需要一次解决所有问题，先做下一步就够了。",
    "现在的感受是真实的，但它不会永远固定不变。",
    "先稳住身体，再处理问题；节奏比速度更重要。",
    "你可以求助，这不是软弱，而是对自己负责。"
  ];
  const line = pool[Math.floor(Math.random() * pool.length)];
  refs.groundingText.textContent = `支持语：${line}`;
  await copyText(line);
}

function detectSafetyRisk() {
  const text = `${refs.questionInput.value} ${refs.noteInput.value} ${state.protocol.intent || ""}`.trim();
  const highRiskByWords = HIGH_RISK_PATTERN.test(text);
  const highRiskByIntensity = Number(state.protocol.emotion || 3) >= 5;
  const isHighRisk = highRiskByWords || highRiskByIntensity;
  if (!isHighRisk) {
    refs.safetyAlert.hidden = true;
    refs.safetyAlert.textContent = "";
    return;
  }
  refs.safetyAlert.hidden = false;
  refs.safetyAlert.textContent =
    "当前议题强度较高。建议先暂停抽卡，做 3 次深呼吸；若出现伤害自己/他人的冲动，请立即联系当地急救电话或可信赖的专业支持。";
}

function renderPresetSwitch() {
  refs.presetSwitch.innerHTML = "";
  Object.entries(SESSION_PRESETS).forEach(([presetId, preset]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-btn";
    button.dataset.preset = presetId;
    button.innerHTML = `<strong>${preset.name}</strong><span>${preset.note}</span>`;
    refs.presetSwitch.appendChild(button);
  });
}

function renderPromptStyleSwitch() {
  refs.promptStyleSwitch.innerHTML = "";
  Object.entries(PROMPT_STYLES).forEach(([styleId, style]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `prompt-style-btn ${styleId === state.promptStyleId ? "active" : ""}`;
    button.dataset.promptStyle = styleId;
    button.innerHTML = `<strong>${style.name}</strong><span>${style.hint}</span>`;
    refs.promptStyleSwitch.appendChild(button);
  });
}

function setPromptStyle(styleId) {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能切换提问风格。", true);
    return;
  }
  if (!(styleId in PROMPT_STYLES)) {
    return;
  }
  state.promptStyleId = styleId;
  persistUiPreference();
  renderPromptStyleSwitch();
  renderPromptTabs();
  renderPrompts();
  setSummary(`提问风格已切换为：${PROMPT_STYLES[styleId].name}`, false);
}

function applySessionPreset(presetId) {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能切换预设。", true);
    return;
  }
  const preset = SESSION_PRESETS[presetId];
  if (!preset) {
    return;
  }
  state.modeId = preset.modeId;
  state.deckTypeId = preset.deckTypeId;
  state.layoutDirection = preset.layoutDirection;
  state.layerId = "description";
  resetLayerVisits();
  markLayerVisited("description");
  state.facilitator.stageIndex = 0;

  if (state.currentCards.length > 0) {
    state.currentCards = [];
    state.currentSession = null;
    refs.spreadBoard.className = "spread-board empty";
    refs.spreadBoard.innerHTML = '<p class="placeholder">预设已切换，请重新抽卡开始新一局。</p>';
    refs.promptList.innerHTML = "";
    const promptItem = document.createElement("li");
    promptItem.textContent = "已切换玩法预设，请重新抽卡。";
    refs.promptList.appendChild(promptItem);
    renderActionPlan();
  }

  renderModeSwitch();
  renderModeDetail();
  renderDeckTypeSwitch();
  renderLayoutDirectionSwitch();
  renderPromptTabs();
  renderSlotEditor();
  renderFacilitatorPanel();
  renderClosurePanel();
  renderWorkflowSteps();
  persistCurrentSessionSnapshot();
  setSummary(`已应用预设：${preset.name}`, false);
}

function getFacilitatorLayer(stage) {
  if (!stage) {
    return "description";
  }
  if (stage.id === "action") {
    return "inquiry";
  }
  return stage.id;
}

function getFacilitatorStageIndexByLayer(layerId) {
  const index = FACILITATOR_STAGES.findIndex((stage) => getFacilitatorLayer(stage) === layerId);
  return index >= 0 ? index : 0;
}

function syncFacilitatorStageByLayer(layerId) {
  const stageIndex = getFacilitatorStageIndexByLayer(layerId);
  if (stageIndex > state.facilitator.stageIndex) {
    state.facilitator.stageIndex = stageIndex;
  }
}

function toggleFacilitatorMode(force) {
  const next = typeof force === "boolean" ? force : !state.facilitator.enabled;
  state.facilitator.enabled = next;
  if (next) {
    state.facilitator.stageIndex = getFacilitatorStageIndexByLayer(state.layerId);
  }
  renderModeSwitch();
  renderFacilitatorPanel();
  setSummary(next ? "已开启主持人模式。建议按阶段推进，不急于下结论。" : "已关闭主持人模式。", false);
}

function advanceFacilitatorStage() {
  if (!state.facilitator.enabled) {
    toggleFacilitatorMode(true);
  }
  const current = Math.max(0, Math.min(FACILITATOR_STAGES.length - 1, state.facilitator.stageIndex));
  const next = Math.min(FACILITATOR_STAGES.length - 1, current + 1);
  state.facilitator.stageIndex = next;
  const stage = FACILITATOR_STAGES[next];
  const layerId = getFacilitatorLayer(stage);
  if (layerId in PROMPT_POOL) {
    state.layerId = layerId;
    markLayerVisited(layerId);
    renderPromptTabs();
    renderPrompts();
  }
  renderModeSwitch();
  renderFacilitatorPanel();
  renderClosurePanel();
  if (stage.id === "action") {
    generateClosureIntegration();
  }
  setSummary(`已进入：${stage.name}`, false);
}

function renderFacilitatorPanel() {
  refs.facilitatorToggleBtn.textContent = state.facilitator.enabled ? "关闭" : "开启";
  refs.facilitatorChecklist.innerHTML = "";
  FACILITATOR_STAGES.forEach((stage, index) => {
    const row = document.createElement("li");
    const isCurrent = state.facilitator.enabled && index === state.facilitator.stageIndex;
    const isDone = state.facilitator.enabled && index < state.facilitator.stageIndex;
    row.className = `facilitator-item${isCurrent ? " is-current" : ""}${isDone ? " is-done" : ""}`;
    row.innerHTML = `<strong>${stage.name}</strong><span>${stage.duration} · ${stage.cue}</span>`;
    refs.facilitatorChecklist.appendChild(row);
  });
  const stage = FACILITATOR_STAGES[state.facilitator.stageIndex] || FACILITATOR_STAGES[0];
  refs.facilitatorStatus.textContent = state.facilitator.enabled
    ? `当前阶段：${stage.name}（${stage.duration}）。提示：${stage.cue}`
    : "未开启。开启后会按「描述 -> 联想 -> 探究 -> 行动」分阶段推进。";
  const atLastStage = state.facilitator.stageIndex >= FACILITATOR_STAGES.length - 1;
  refs.facilitatorNextBtn.disabled = !state.facilitator.enabled;
  refs.facilitatorNextBtn.textContent = atLastStage ? "已到行动阶段" : "下一阶段";
}

function markLayerVisited(layerId) {
  if (!layerId) {
    return;
  }
  state.layerVisits.add(layerId);
  if (state.currentSession) {
    state.currentSession.layerVisits = Array.from(state.layerVisits);
    syncCurrentSessionToHistory();
  }
}

function resetLayerVisits() {
  state.layerVisits = new Set();
}

function getLayerVisitArray() {
  return Array.from(state.layerVisits);
}

function renderModeSwitch() {
  refs.modeSwitch.innerHTML = "";
  Object.entries(MODES).forEach(([modeId, mode]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mode-btn ${modeId === state.modeId ? "active" : ""}`;
    button.dataset.mode = modeId;
    button.innerHTML = `<strong>${mode.name}</strong><span>${mode.description}</span>`;
    refs.modeSwitch.appendChild(button);
  });
  const stage = state.facilitator.enabled ? FACILITATOR_STAGES[state.facilitator.stageIndex]?.name || "主持中" : "自由探索";
  refs.modeBadge.textContent = `${MODES[state.modeId].badge} / ${DECK_TYPES[state.deckTypeId].name} / ${LAYOUT_DIRECTIONS[state.layoutDirection].name} / ${stage}`;
}

function renderDeckTypeSwitch() {
  refs.deckTypeSwitch.innerHTML = "";
  Object.entries(DECK_TYPES).forEach(([deckTypeId, deckType]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `deck-type-btn ${deckTypeId === state.deckTypeId ? "active" : ""}`;
    button.dataset.deckType = deckTypeId;
    button.innerHTML = `<strong>${deckType.name}</strong><span>${deckType.desc}</span>`;
    refs.deckTypeSwitch.appendChild(button);
  });
}

function renderLayoutDirectionSwitch() {
  refs.layoutDirectionSwitch.innerHTML = "";
  Object.entries(LAYOUT_DIRECTIONS).forEach(([directionId, direction]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `direction-btn ${directionId === state.layoutDirection ? "active" : ""}`;
    button.dataset.layoutDirection = directionId;
    button.innerHTML = `<strong>${direction.name}</strong><span>${direction.desc}</span>`;
    refs.layoutDirectionSwitch.appendChild(button);
  });
}

function renderDeckStatus() {
  const sourceLabel = {
    custom: "已导入",
    bundled: "实卡包",
    "built-in": "内置"
  };
  const wordSource = sourceLabel[state.deckSource.word] || "内置";
  const imageSource = sourceLabel[state.deckSource.image] || "内置";
  refs.deckStatus.textContent = `字卡 ${state.wordDeck.length} 张（${wordSource}） / 图卡 ${state.imageDeck.length} 张（${imageSource}）`;
  refs.avoidRecentCheckbox.checked = Boolean(state.avoidRecent);
}

function renderWorkflowSteps() {
  refs.workflowSteps.innerHTML = "";
  const hasQuestion = refs.questionInput.value.trim().length > 0 && Boolean(state.protocol.consent);
  const hasDraw = state.currentCards.length > 0;
  const hasGuide = hasDraw && refs.promptList.querySelector("li");
  const hasMainNote = refs.noteInput.value.trim().length > 0 || Boolean(state.currentSession?.note);
  const hasDualNote = !state.dualMode || refs.dualNoteA.value.trim().length > 0 || refs.dualNoteB.value.trim().length > 0;
  const hasNote = hasMainNote || hasDualNote;
  const hasExport = Boolean(state.currentSession?.lastExportAt);
  const flags = {
    question: hasQuestion,
    draw: hasDraw,
    guide: hasGuide,
    note: hasNote,
    export: hasExport
  };
  const activeIndex = WORKFLOW_STEPS.findIndex((step) => !flags[step.id]);
  const fallbackIndex = WORKFLOW_STEPS.length - 1;
  const highlightIndex = activeIndex === -1 ? fallbackIndex : activeIndex;

  WORKFLOW_STEPS.forEach((step, index) => {
    const card = document.createElement("article");
    card.className = "workflow-step";
    if (flags[step.id]) {
      card.classList.add("is-complete");
    } else if (index === highlightIndex) {
      card.classList.add("is-active");
    }
    card.innerHTML = `<span class="workflow-step-index">${flags[step.id] ? "✓" : index + 1}</span><span class="workflow-step-name">${step.name}</span>`;
    refs.workflowSteps.appendChild(card);
  });
}

function renderActionPlan() {
  refs.actionChecklist.innerHTML = "";
  if (!state.currentSession || state.currentCards.length === 0) {
    refs.autoSummaryText.textContent = "抽卡后自动生成总结与行动建议。";
    refs.actionStats.textContent = "完成率：0%（0/3）";
    return;
  }

  const plan = normalizeActionPlan(
    state.currentSession.actionPlan ||
      buildActionPlan(state.currentCards, refs.questionInput.value.trim(), refs.noteInput.value.trim(), MODES[state.modeId])
  );
  state.currentSession.actionPlan = plan;
  syncCurrentSessionToHistory();
  refs.autoSummaryText.textContent = plan.summary;
  plan.actions.forEach((action, index) => {
    const row = document.createElement("li");
    if (action.done) {
      row.classList.add("done");
    }
    const main = document.createElement("div");
    main.className = "action-main";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(action.done);
    checkbox.disabled = state.readonlyMode;
    checkbox.dataset.actionIndex = String(index);
    checkbox.dataset.field = "done";
    const text = document.createElement("span");
    text.textContent = action.text;
    main.append(checkbox, text);

    const meta = document.createElement("div");
    meta.className = "action-meta";
    const due = document.createElement("input");
    due.type = "date";
    due.value = action.dueDate || "";
    due.disabled = state.readonlyMode;
    due.dataset.actionIndex = String(index);
    due.dataset.field = "dueDate";
    const remind = document.createElement("select");
    remind.dataset.actionIndex = String(index);
    remind.dataset.field = "reminder";
    remind.innerHTML = `
      <option value="none">不提醒</option>
      <option value="same-day">当天提醒</option>
      <option value="1-day">提前 1 天</option>
      <option value="3-day">提前 3 天</option>
    `;
    remind.value = action.reminder || "none";
    remind.disabled = state.readonlyMode;
    meta.append(due, remind);
    row.append(main, meta);
    refs.actionChecklist.appendChild(row);
  });
  updateActionStats(plan);
}

function handleActionChecklistChange(event) {
  if (state.readonlyMode) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement) || !state.currentSession?.actionPlan) {
    return;
  }
  const index = Number(target.dataset.actionIndex);
  if (!Number.isInteger(index) || index < 0) {
    return;
  }
  const actions = state.currentSession.actionPlan.actions || [];
  if (!actions[index]) {
    return;
  }
  const field = target.dataset.field;
  if (field === "done" && target instanceof HTMLInputElement) {
    actions[index].done = target.checked;
  } else if (field === "dueDate" && target instanceof HTMLInputElement) {
    actions[index].dueDate = target.value || "";
  } else if (field === "reminder") {
    actions[index].reminder = target.value || "none";
  }
  syncCurrentSessionToHistory();
  renderActionPlan();
  generateClosureIntegration(true);
}

function regenerateActionPlan() {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能生成行动建议。", true);
    return;
  }
  if (state.currentCards.length === 0 || !state.currentSession) {
    setSummary("请先抽卡，再生成行动建议。", true);
    return;
  }
  state.currentSession.actionPlan = normalizeActionPlan(
    buildActionPlan(state.currentCards, refs.questionInput.value.trim(), refs.noteInput.value.trim(), MODES[state.modeId])
  );
  syncCurrentSessionToHistory();
  renderActionPlan();
  generateClosureIntegration(true);
  setSummary("已重新生成复盘总结与行动建议。", false);
}

function normalizeActionPlan(plan) {
  const fallback = {
    summary: "请先描述你看到的画面，再把联想到的现实议题写下来。",
    actions: [
      { text: "写下今天最想解决的 1 个问题，限定在一句话内。", done: false, dueDate: "", reminder: "none" },
      { text: "选 1 位可对话对象，约一个 15 分钟沟通时段。", done: false, dueDate: "", reminder: "none" },
      { text: "72 小时后复盘：记录这次行动带来的变化。", done: false, dueDate: "", reminder: "none" }
    ]
  };
  if (!plan || typeof plan !== "object") {
    return fallback;
  }
  const summary = typeof plan.summary === "string" && plan.summary.trim() ? plan.summary.trim() : fallback.summary;
  const sourceActions = Array.isArray(plan.actions) ? plan.actions : [];
  const actions = sourceActions
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const text = typeof item.text === "string" ? item.text.trim() : "";
      if (!text) {
        return null;
      }
      return {
        text,
        done: Boolean(item.done),
        dueDate: typeof item.dueDate === "string" ? item.dueDate : "",
        reminder: normalizeReminder(item.reminder)
      };
    })
    .filter(Boolean)
    .slice(0, 3);

  if (actions.length < 3) {
    fallback.actions.forEach((item) => {
      if (actions.length < 3) {
        actions.push({ ...item });
      }
    });
  }

  return { summary, actions };
}

function normalizeReminder(value) {
  const valid = new Set(["none", "same-day", "1-day", "3-day"]);
  return valid.has(value) ? value : "none";
}

function reminderLabel(reminder) {
  const map = {
    none: "不提醒",
    "same-day": "当天提醒",
    "1-day": "提前 1 天",
    "3-day": "提前 3 天"
  };
  return map[normalizeReminder(reminder)] || "不提醒";
}

function updateActionStats(plan) {
  const total = plan.actions.length || 1;
  const doneCount = plan.actions.filter((item) => item.done).length;
  const ratio = Math.round((doneCount / total) * 100);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const overdue = plan.actions.filter((item) => !item.done && item.dueDate && new Date(item.dueDate).getTime() < now.getTime()).length;
  const upcoming = plan.actions.filter((item) => !item.done && item.dueDate && new Date(item.dueDate).getTime() >= now.getTime()).length;
  const remindNow = plan.actions.filter((item) => shouldRemindToday(item, now)).length;
  refs.actionStats.textContent = `完成率：${ratio}%（${doneCount}/${total}） · 逾期 ${overdue} · 待办 ${upcoming} · 今日提醒 ${remindNow}`;
}

function shouldRemindToday(action, nowDate) {
  if (action.done || !action.dueDate || normalizeReminder(action.reminder) === "none") {
    return false;
  }
  const due = new Date(action.dueDate);
  due.setHours(0, 0, 0, 0);
  if (Number.isNaN(due.getTime())) {
    return false;
  }
  const offsetMap = {
    "same-day": 0,
    "1-day": 1,
    "3-day": 3
  };
  const offset = offsetMap[normalizeReminder(action.reminder)] ?? 0;
  const remind = new Date(due);
  remind.setDate(remind.getDate() - offset);
  return remind.getTime() <= nowDate.getTime() && due.getTime() >= nowDate.getTime();
}

function buildActionPlan(cards, question, note, mode) {
  const modeName = mode?.name || MODES[state.modeId]?.name || "当前玩法";
  const leadCards = cards.slice(0, 3).map((card) => getCardShortName(card));
  const primaryKeywords = uniqueValues(
    cards
      .flatMap((card) => {
        const kind = getCardKind(card);
        if (kind === "pair") {
          return [...(card.imageCard?.keywords || []), ...(card.wordCard?.keywords || [])];
        }
        return card.keywords || [];
      })
      .slice(0, 12)
  ).slice(0, 3);
  const questionText = question || "当前议题";
  const noteHint = note ? `你在记录里提到“${note.slice(0, 20)}${note.length > 20 ? "..." : ""}”，` : "";
  const summary = `在「${modeName}」中，牌面 ${leadCards.join(" / ")} 指向了「${primaryKeywords.join("、") || "看见-联想-行动"}」这条主线。${noteHint}建议先把「${questionText}」收敛成一个可执行小目标。`;
  const day1 = offsetDateString(1);
  const day3 = offsetDateString(3);
  const day7 = offsetDateString(7);

  return {
    summary,
    actions: [
      {
        text: `今天 10 分钟：围绕「${questionText}」写下 3 个你能控制的动作，只保留最小的一步。`,
        done: false,
        dueDate: day1,
        reminder: "same-day"
      },
      {
        text: `24 小时内：把牌面里最触动你的词（如「${primaryKeywords[0] || "核心线索"}」）转成一条现实沟通或尝试。`,
        done: false,
        dueDate: day3,
        reminder: "1-day"
      },
      {
        text: "72 小时复盘：检查这一步是否降低了内耗，并决定是继续、调整还是停止。",
        done: false,
        dueDate: day7,
        reminder: "3-day"
      }
    ]
  };
}

function generateClosureIntegration(silent = false) {
  if (state.currentCards.length === 0) {
    if (!silent) {
      setSummary("请先抽卡，再生成结束整合。", true);
    }
    return;
  }
  const mode = MODES[state.modeId];
  const question = refs.questionInput.value.trim();
  const note = refs.noteInput.value.trim();
  const names = state.currentCards.slice(0, 3).map((card) => getCardShortName(card));
  const anchor = names[0] || "当前牌面";
  const intent = state.protocol.intent ? `围绕“${state.protocol.intent}”` : "围绕当前议题";
  const summary = `${intent}，你在「${mode.name}」里看到「${names.join(" / ")}」，本轮最值得保留的核心线索是「${anchor}」。`;
  const plan = normalizeActionPlan(state.currentSession?.actionPlan);
  const nextAction = plan.actions.find((item) => !item.done) || plan.actions[0];
  const action = nextAction
    ? `72 小时行动：${nextAction.text}${nextAction.dueDate ? `（截止 ${nextAction.dueDate}）` : ""}`
    : "72 小时行动：选择一个最小动作，并在今天写下具体时间点。";
  const highRisk = HIGH_RISK_PATTERN.test(`${question} ${note} ${state.protocol.intent || ""}`) || Number(state.protocol.emotion || 3) >= 5;
  const support = highRisk
    ? "支持提醒：当前强度较高，请优先稳定身心；若出现伤害自己/他人的冲动，请立即联系当地急救或专业支持。"
    : "支持提醒：如果执行动作时卡住，先降低目标难度，再约一位可信赖的人做外部见证。";
  state.closure = { summary, action, support };
  if (state.currentSession) {
    state.currentSession.closure = { ...state.closure };
    syncCurrentSessionToHistory();
  }
  renderClosurePanel();
  if (!silent) {
    setSummary("已生成结束整合。", false);
  }
}

function renderClosurePanel() {
  const quality = computeSessionQuality();
  refs.closureSummary.textContent = state.closure.summary || "完成抽卡后可生成一句话整合，帮助你收束本次探索。";
  refs.closureAction.textContent = state.closure.action || "72 小时行动将从你的牌面与记录自动提炼。";
  refs.closureSupport.textContent = `${state.closure.support || "支持提醒：高压状态下优先休息、联系可信赖的人或专业支持。"}（会话质量分：${quality}）`;
}

async function copyClosureIntegration() {
  if (!state.closure.summary && !state.closure.action) {
    generateClosureIntegration(true);
  }
  const payload = [state.closure.summary, state.closure.action, state.closure.support].filter(Boolean).join("\n");
  if (!payload.trim()) {
    setSummary("请先抽卡，再复制结束整合。", true);
    return;
  }
  const copied = await copyText(payload);
  setSummary(copied ? "已复制结束整合。" : "复制失败，请手动复制。", !copied);
}

function computeSessionQuality(session = null) {
  const targetSession = session || state.currentSession || null;
  const question = (targetSession?.question ?? refs.questionInput.value ?? "").trim();
  const note = (targetSession?.note ?? refs.noteInput.value ?? "").trim();
  const cards = Array.isArray(targetSession?.cards) ? targetSession.cards : state.currentCards;
  const actionPlan = normalizeActionPlan(targetSession?.actionPlan);
  const visitedLayers = Array.isArray(targetSession?.layerVisits)
    ? targetSession.layerVisits
    : getLayerVisitArray();
  const layerSet = new Set((visitedLayers || []).filter((layer) => ["description", "association", "inquiry"].includes(layer)));
  const doneCount = actionPlan.actions.filter((item) => item.done).length;
  const hasDualNote = session
    ? Boolean(targetSession?.dualNotes?.a || targetSession?.dualNotes?.b)
    : Boolean(refs.dualNoteA.value.trim() || refs.dualNoteB.value.trim() || targetSession?.dualNotes?.a || targetSession?.dualNotes?.b);
  const consentFlag = session
    ? Boolean(targetSession?.protocol?.consent)
    : Boolean(state.protocol.consent || targetSession?.protocol?.consent);
  let score = 0;
  if (consentFlag) {
    score += 10;
  }
  if (question) {
    score += 15;
  }
  if (Array.isArray(cards) && cards.length > 0) {
    score += 20;
  }
  score += Math.min(3, layerSet.size) * 10;
  if (note || hasDualNote) {
    score += 15;
  }
  if (actionPlan.actions.length > 0) {
    score += 10 + Math.round((doneCount / actionPlan.actions.length) * 10);
  }
  return Math.max(0, Math.min(100, score));
}

function offsetDateString(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function renderDeckValidation() {
  refs.deckValidationSummary.textContent = state.deckValidation.summary || "等待导入卡包后校验。";
  refs.deckValidationList.innerHTML = "";
  const items = Array.isArray(state.deckValidation.items) ? state.deckValidation.items : [];
  if (items.length === 0) {
    const row = document.createElement("li");
    row.textContent = "暂无异常。";
    refs.deckValidationList.appendChild(row);
    return;
  }
  items.slice(0, 12).forEach((item) => {
    const row = document.createElement("li");
    row.textContent = item.text;
    if (item.level === "warn") {
      row.classList.add("warn");
    } else if (item.level === "error") {
      row.classList.add("error");
    }
    refs.deckValidationList.appendChild(row);
  });
}

function renderOverlayTuneControls() {
  refs.overlayLeftInput.value = String(state.overlayTune.left);
  refs.overlayRightInput.value = String(state.overlayTune.right);
  refs.overlayTopInput.value = String(state.overlayTune.top);
  refs.overlayBottomInput.value = String(state.overlayTune.bottom);
  refs.overlayLeftValue.textContent = `${state.overlayTune.left.toFixed(1)}%`;
  refs.overlayRightValue.textContent = `${state.overlayTune.right.toFixed(1)}%`;
  refs.overlayTopValue.textContent = `${state.overlayTune.top.toFixed(1)}%`;
  refs.overlayBottomValue.textContent = `${state.overlayTune.bottom.toFixed(1)}%`;
}

function updateOverlayTune(key, value) {
  if (!(key in state.overlayTune)) {
    return;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return;
  }
  state.overlayTune[key] = Math.round(numeric * 10) / 10;
  renderOverlayTuneControls();
  persistOverlayTune();
  refreshOverlayTuneStyles();
}

function resetOverlayTuneToDefault() {
  state.overlayTune = { ...DEFAULT_OVERLAY_TUNE };
  renderOverlayTuneControls();
  persistOverlayTune();
  refreshOverlayTuneStyles();
  setSummary("已恢复图三复刻默认比例。", false);
}

function applyOverlayTuneToElement(element) {
  if (!element) {
    return;
  }
  element.style.setProperty("--overlay-left", `${state.overlayTune.left}%`);
  element.style.setProperty("--overlay-right", `${state.overlayTune.right}%`);
  element.style.setProperty("--overlay-top", `${state.overlayTune.top}%`);
  element.style.setProperty("--overlay-bottom", `${state.overlayTune.bottom}%`);
}

function refreshOverlayTuneStyles() {
  document.querySelectorAll(".pair-composite").forEach((element) => {
    applyOverlayTuneToElement(element);
    const image = element.querySelector(".pair-image-overlay img");
    updateCompositeSafeImageFit(element, image);
  });
  applyOverlayTuneToElement(refs.previewPairComposite);
  updateCompositeSafeImageFit(refs.previewPairComposite, refs.previewPairImage);
  scheduleRefreshViewportFits();
}

function renderModeDetail() {
  const mode = MODES[state.modeId];
  refs.modeGoal.textContent = mode.goal;
  refs.modeSteps.innerHTML = "";
  mode.steps.forEach((stepText) => {
    const item = document.createElement("li");
    item.textContent = stepText;
    refs.modeSteps.appendChild(item);
  });
}

function getModeLabels(modeId, count = 0) {
  const mode = MODES[modeId] || MODES.focus;
  const baseLabels = Array.isArray(mode.labels) ? mode.labels : [];
  const customLabels = Array.isArray(state.customSlotLabels?.[modeId]) ? state.customSlotLabels[modeId] : [];
  const size = Math.max(count, mode.count || 0, baseLabels.length);
  const result = [];
  for (let i = 0; i < size; i += 1) {
    const custom = typeof customLabels[i] === "string" ? customLabels[i].trim() : "";
    result.push(custom || baseLabels[i] || `位置 ${i + 1}`);
  }
  return result;
}

function renderPromptTabs() {
  refs.promptTabs.innerHTML = "";
  PROMPT_LAYERS.forEach((layer) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `prompt-tab ${layer.id === state.layerId ? "active" : ""}`;
    button.dataset.layer = layer.id;
    button.textContent = layer.name;
    refs.promptTabs.appendChild(button);
  });
  const layer = PROMPT_LAYERS.find((entry) => entry.id === state.layerId);
  const style = PROMPT_STYLES[state.promptStyleId] || PROMPT_STYLES.balanced;
  refs.promptHint.textContent = layer ? `${layer.hint} 当前风格：${style.name}（${style.hint}）` : "";
}

function renderPlaybook() {
  refs.playbookGrid.innerHTML = "";
  Object.entries(MODES).forEach(([modeId, mode]) => {
    const box = document.createElement("article");
    box.className = "playbook-item";
    const title = document.createElement("h3");
    title.textContent = `${mode.name} (${mode.count} 张)`;
    const when = document.createElement("p");
    when.textContent = `适用场景：${mode.when}`;
    const labels = document.createElement("p");
    labels.textContent = `位置定义：${getModeLabels(modeId, mode.count).join(" / ")}`;
    const steps = document.createElement("ol");
    mode.steps.forEach((step) => {
      const item = document.createElement("li");
      item.textContent = step;
      steps.appendChild(item);
    });
    box.append(title, when, labels, steps);
    refs.playbookGrid.appendChild(box);
  });
}

function runDraw() {
  if (state.readonlyMode) {
    setSummary("当前是只读分享模式，不能直接抽卡。请先退出只读模式。", true);
    return;
  }
  if (state.protocol.paused) {
    setSummary("当前处于暂停模式。点击“恢复模式”后再抽卡。", true);
    return;
  }
  if (!state.protocol.consent) {
    setSummary("请先在「开场协议」勾选探索同意项，再开始抽卡。", true);
    return;
  }
  if (state.isDrawing) {
    return;
  }

  const mode = MODES[state.modeId];
  const slotLabels = getModeLabels(state.modeId, mode.count);
  if (!ensureDeckReady(mode.count)) {
    return;
  }

  const cards = drawCards(mode.count);
  resetLayerVisits();
  markLayerVisited("description");
  state.facilitator.stageIndex = 0;
  const drawToken = Date.now();
  state.drawVersion = drawToken;
  state.isDrawing = true;

  refs.drawBtn.disabled = true;
  refs.deck.classList.remove("shuffling");
  void refs.deck.offsetWidth;
  refs.deck.classList.add("shuffling");

  setTimeout(() => {
    if (state.drawVersion !== drawToken) {
      return;
    }
    refs.deck.classList.remove("shuffling");
    state.currentCards = cards;
    state.layerId = "description";
    renderPromptTabs();
    renderSpread(cards, slotLabels);
    renderPrompts(slotLabels);

    const session = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      time: new Date().toISOString(),
      modeId: state.modeId,
      deckTypeId: state.deckTypeId,
      layoutDirection: state.layoutDirection,
      question: refs.questionInput.value.trim(),
      cards,
      slotLabels,
      note: "",
      dualMode: state.dualMode,
      dualNotes: {
        a: refs.dualNoteA.value.trim(),
        b: refs.dualNoteB.value.trim()
      },
      lastExportAt: "",
      actionPlan: normalizeActionPlan(buildActionPlan(cards, refs.questionInput.value.trim(), refs.noteInput.value.trim(), mode)),
      tags: inferSessionTags(refs.questionInput.value.trim(), "", cards),
      protocol: {
        intent: state.protocol.intent || "",
        consent: Boolean(state.protocol.consent),
        emotion: Number(state.protocol.emotion || 3)
      },
      layerVisits: getLayerVisitArray()
    };

    state.currentSession = session;
    refs.noteInput.value = "";
    prependHistory(session);
    setSummary(
      `已完成「${mode.name} / ${DECK_TYPES[state.deckTypeId].name}」抽卡。先描述看到的内容，再做联想与探究。`,
      false
    );
    renderActionPlan();
    generateClosureIntegration(true);
    renderWorkflowSteps();
    persistCurrentSessionSnapshot();
    renderAnalytics();
    renderFacilitatorPanel();
    preloadCards(cards);
    preloadNextRoundCandidates(mode.count);
    refs.drawBtn.disabled = false;
    state.isDrawing = false;
  }, 860);
}

function ensureDeckReady(count) {
  if (state.deckTypeId === "pair") {
    if (state.wordDeck.length < count || state.imageDeck.length < count) {
      setSummary(`当前玩法需要至少 ${count} 张图卡和 ${count} 张字卡，请先导入卡组或切换卡组模式。`, true);
      return false;
    }
    return true;
  }
  if (state.deckTypeId === "image" && state.imageDeck.length < count) {
    setSummary(`当前玩法需要至少 ${count} 张图卡，当前只有 ${state.imageDeck.length} 张。`, true);
    return false;
  }
  if (state.deckTypeId === "word" && state.wordDeck.length < count) {
    setSummary(`当前玩法需要至少 ${count} 张字卡，当前只有 ${state.wordDeck.length} 张。`, true);
    return false;
  }
  return true;
}

function drawCards(count) {
  const avoidWordNames = state.avoidRecent ? getRecentCardNameSet("word") : new Set();
  const avoidImageNames = state.avoidRecent ? getRecentCardNameSet("image") : new Set();
  if (state.deckTypeId === "pair") {
    const words = pickUnique(state.wordDeck, count, avoidWordNames);
    const images = pickUnique(state.imageDeck, count, avoidImageNames);
    return words.map((wordCard, index) => {
      const imageCard = images[index];
      return {
        kind: "pair",
        name: `${wordCard.name} × ${imageCard.name}`,
        tone: normalizeTone(imageCard.tone || wordCard.tone),
        keywords: uniqueValues([...(wordCard.keywords || []), ...(imageCard.keywords || [])]),
        cue: [imageCard.cue, wordCard.cue].filter(Boolean).join(" "),
        imageCard: { ...imageCard, kind: "image" },
        wordCard: { ...wordCard, kind: "word" }
      };
    });
  }

  if (state.deckTypeId === "image") {
    return pickUnique(state.imageDeck, count, avoidImageNames).map((card) => ({ ...card, kind: "image" }));
  }

  return pickUnique(state.wordDeck, count, avoidWordNames).map((card) => ({ ...card, kind: "word" }));
}

function renderSpread(cards, slotLabels) {
  refs.spreadBoard.className = "spread-board";
  const cols = Math.min(cards.length, 5);
  refs.spreadBoard.classList.add(`cols-${cols}`);
  refs.spreadBoard.innerHTML = "";

  cards.forEach((card, index) => {
    const tile = document.createElement("article");
    tile.className = `card-tile ${getCardKind(card)}-card`;
    tile.dataset.cardIndex = String(index);
    tile.style.setProperty("--delay", `${index * 120}ms`);

    const back = document.createElement("div");
    back.className = "card-face card-back";
    const backLabel = document.createElement("span");
    backLabel.textContent = state.deckTypeId === "pair" ? "OH+" : "OH";
    back.appendChild(backLabel);

    const front = document.createElement("div");
    front.className = `card-face card-front ${normalizeTone(card.tone)} ${getCardKind(card)}-front`;

    fillCardFront(front, card, slotLabels[index] || `位置 ${index + 1}`);
    const sortHandle = front.querySelector(".slot-label");
    if (sortHandle) {
      bindCardSortHandle(tile, sortHandle, index);
    }

    tile.append(back, front);
    refs.spreadBoard.appendChild(tile);

    setTimeout(() => {
      tile.classList.add("revealed");
    }, 80 + index * 120);
  });
  scheduleRefreshViewportFits();
}

function fillCardFront(front, card, slotLabel) {
  const slot = document.createElement("p");
  slot.className = "slot-label";
  slot.textContent = `${slotLabel} / ${getCardKindName(card)}`;
  front.appendChild(slot);

  if (getCardKind(card) === "pair") {
    front.classList.add("pair-front");

    const pairViewport = document.createElement("div");
    pairViewport.className = "pair-viewport";
    applyPairRotation(pairViewport, directionToQuarter(state.layoutDirection));

    const pairComposite = document.createElement("div");
    pairComposite.className = "pair-composite";
    applyOverlayTuneToElement(pairComposite);

    const wordBase = document.createElement("div");
    wordBase.className = "pair-word-base";
    if (card.wordCard.image) {
      const wordImage = document.createElement("img");
      wordImage.alt = card.wordCard.name;
      wordImage.loading = "eager";
      wordImage.decoding = "async";
      applySmartImageSource(wordImage, card.wordCard.image, { suppressFailureUi: true });
      wordBase.appendChild(wordImage);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "pair-word-fallback";
      fallback.textContent = card.wordCard.name;
      wordBase.appendChild(fallback);
    }

    const imageOverlay = document.createElement("div");
    imageOverlay.className = "pair-image-overlay";
    const image = document.createElement("img");
    image.alt = card.imageCard.name;
    image.loading = "eager";
    image.decoding = "async";
    applySmartImageSource(image, card.imageCard.image, { suppressFailureUi: true });
    imageOverlay.appendChild(image);

    pairComposite.append(wordBase, imageOverlay);
    pairComposite.dataset.imageSrc = card.imageCard.image || "";
    pairViewport.appendChild(pairComposite);

    const rotateControls = document.createElement("div");
    rotateControls.className = "pair-rotate-controls";

    const rotateLeftBtn = document.createElement("button");
    rotateLeftBtn.type = "button";
    rotateLeftBtn.className = "pair-rotate-btn";
    rotateLeftBtn.textContent = "↶";
    rotateLeftBtn.title = "逆时针旋转";
    rotateLeftBtn.addEventListener("click", () => {
      rotatePairViewport(pairViewport, -1);
    });

    const rotateRightBtn = document.createElement("button");
    rotateRightBtn.type = "button";
    rotateRightBtn.className = "pair-rotate-btn";
    rotateRightBtn.textContent = "↷";
    rotateRightBtn.title = "顺时针旋转";
    rotateRightBtn.addEventListener("click", () => {
      rotatePairViewport(pairViewport, 1);
    });

    rotateControls.append(rotateLeftBtn, rotateRightBtn);

    const pairInteractive = document.createElement("div");
    pairInteractive.className = "pair-interactive";
    pairInteractive.dataset.previewImageSrc = card.imageCard.image || "";
    pairInteractive.dataset.previewWordSrc = card.wordCard.image || "";
    pairInteractive.dataset.previewTitle = `${card.imageCard.name} + ${card.wordCard.name}`;
    pairInteractive.append(pairViewport, rotateControls);
    setupPairViewportGestures(pairViewport);
    updateCompositeSafeImageFit(pairComposite, image);
    scheduleRefreshViewportFits();

    front.append(pairInteractive);
    return;
  }

  if (getCardKind(card) === "image") {
    const imageBlock = document.createElement("div");
    imageBlock.className = "image-block";
    const image = document.createElement("img");
    image.alt = card.name;
    image.loading = "eager";
    image.decoding = "async";
    applySmartImageSource(image, card.image);
    makePreviewableImage(image, `${card.name}（图卡）`);
    imageBlock.appendChild(image);

    front.append(imageBlock);
    return;
  }

  if (card.image) {
    const wordImageBlock = document.createElement("div");
    wordImageBlock.className = "image-block word-image-block";
    const image = document.createElement("img");
    image.alt = card.name;
    image.loading = "eager";
    image.decoding = "async";
    applySmartImageSource(image, card.image);
    makePreviewableImage(image, `${card.name}（字卡）`);
    wordImageBlock.appendChild(image);

    front.append(wordImageBlock);
    return;
  }

  const title = document.createElement("h3");
  title.className = "card-title";
  const glyph = card.glyph ? `${card.glyph} ` : "";
  title.textContent = `${glyph}${card.name}`;

  front.append(title);
}

function renderPrompts(slotLabels = null) {
  refs.promptList.innerHTML = "";
  if (state.currentCards.length === 0) {
    const item = document.createElement("li");
    item.textContent = "你还没有抽卡，先抽卡后系统会生成分层引导问题。";
    refs.promptList.appendChild(item);
    return;
  }

  const mode = MODES[state.modeId];
  const labels = Array.isArray(slotLabels) && slotLabels.length ? slotLabels : getActiveSlotLabels(mode);
  const layerPrompts = buildPrompts(state.layerId, state.currentCards, mode, labels);

  layerPrompts.forEach((prompt) => {
    const item = document.createElement("li");
    item.textContent = prompt;
    refs.promptList.appendChild(item);
  });
}

function getActiveSlotLabels(mode) {
  if (Array.isArray(state.currentSession?.slotLabels) && state.currentSession.slotLabels.length) {
    return state.currentSession.slotLabels;
  }
  return getModeLabels(state.modeId, mode?.count || 0);
}

function buildPrompts(layerId, cards, mode, slotLabels) {
  const base = shuffle(PROMPT_POOL[layerId]).slice(0, 3);
  const style = PROMPT_STYLES[state.promptStyleId] || PROMPT_STYLES.balanced;
  const styleExtraPool = Array.isArray(style.extra?.[layerId]) ? style.extra[layerId] : [];
  const styleExtra = shuffle(styleExtraPool).slice(0, 1);

  const cardPrompts = cards.map((card, index) => {
    const slot = slotLabels[index] || `位置 ${index + 1}`;

    if (layerId === "description") {
      if (getCardKind(card) === "pair") {
        return `在「${slot}」里，先分别描述图卡和字卡，不解释对错；你最先注意到的是什么？`;
      }
      return `在「${slot}」里，你最先注意到的是形状、动作还是关系？`;
    }

    if (layerId === "association") {
      return `「${slot}」让你想到最近哪个具体事件或人物？`;
    }

    return `如果把「${slot}」看作一条行动提醒，你今天愿意做什么最小动作？`;
  });

  const relationPrompt =
    cards.length > 1
      ? layerId === "description"
      ? `把这 ${cards.length} 张牌放在一起看，哪两张最像同一条故事线？`
      : layerId === "association"
      ? `这组牌最像你人生里哪个重复循环？它通常在什么情境出现？`
      : "这组牌共同指向的核心冲突是什么？你准备如何改写它？"
      : layerId === "description"
      ? "请把这张牌描述成一个场景：地点、人物、动作分别是什么？"
      : layerId === "association"
      ? "这张牌像你哪段记忆？那段记忆与你当前问题有什么联系？"
      : "这张牌触发了你什么感受？你需要被满足的核心需求是什么？";

  const dualPrompts = state.dualMode
    ? [
        "A 方：你最先被哪一部分触动？这说明你在保护什么？",
        "B 方：你最先忽略了哪一部分？这背后可能有什么担心？"
      ]
    : [];
  const deepExtra =
    state.promptStyleId === "deep" && layerId === "inquiry"
      ? ["如果把这次卡住定义为一个旧模式，你愿意从哪一刻开始打断它？"]
      : [];
  return [...base, ...shuffle(cardPrompts).slice(0, 2), relationPrompt, ...dualPrompts, ...styleExtra, ...deepExtra];
}

function prependHistory(session) {
  state.history = [session, ...state.history].slice(0, 30);
  persistHistory();
  renderHistory();
  renderAnalytics();
  persistCurrentSessionSnapshot();
}

function syncCurrentSessionToHistory() {
  if (!state.currentSession) {
    return;
  }
  state.currentSession.cards = state.currentCards.slice();
  state.currentSession.layerVisits = getLayerVisitArray();
  state.currentSession.closure = { ...state.closure };
  state.currentSession.protocol = {
    intent: state.protocol.intent || "",
    consent: Boolean(state.protocol.consent),
    emotion: Number(state.protocol.emotion || 3)
  };
  state.history = state.history.map((entry) => {
    if (entry.id !== state.currentSession.id) {
      return entry;
    }
    return {
      ...entry,
      question: refs.questionInput.value.trim(),
      note: refs.noteInput.value.trim(),
      cards: state.currentCards.slice(),
      modeId: state.modeId,
      deckTypeId: state.deckTypeId,
      layoutDirection: state.layoutDirection,
      slotLabels: getActiveSlotLabels(MODES[state.modeId]),
      dualMode: Boolean(state.dualMode),
      dualNotes: {
        a: refs.dualNoteA.value.trim(),
        b: refs.dualNoteB.value.trim()
      },
      actionPlan: normalizeActionPlan(state.currentSession.actionPlan),
      closure: { ...state.closure },
      layerVisits: getLayerVisitArray(),
      protocol: {
        intent: state.protocol.intent || "",
        consent: Boolean(state.protocol.consent),
        emotion: Number(state.protocol.emotion || 3)
      },
      lastExportAt: state.currentSession.lastExportAt || "",
      tags: inferSessionTags(refs.questionInput.value.trim(), refs.noteInput.value.trim(), state.currentCards)
    };
  });
  persistHistory();
  renderAnalytics();
  persistCurrentSessionSnapshot();
}

function renderHistory() {
  refs.historyList.innerHTML = "";
  if (state.history.length === 0) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "还没有历史记录。每次抽卡后会自动保存在本机浏览器。";
    refs.historyList.appendChild(empty);
    return;
  }

  const filteredHistory = getFilteredHistory();
  if (filteredHistory.length === 0) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "当前筛选下没有记录。你可以清空搜索词或切换标签。";
    refs.historyList.appendChild(empty);
    return;
  }

  filteredHistory.forEach((session) => {
    const item = document.createElement("article");
    item.className = "history-item";
    const mode = MODES[session.modeId];
    const deckType = DECK_TYPES[session.deckTypeId] || DECK_TYPES[inferDeckTypeFromCards(session.cards)] || DECK_TYPES.word;
    const layoutDirection = LAYOUT_DIRECTIONS[session.layoutDirection] || LAYOUT_DIRECTIONS.up;
    const actionPlan = normalizeActionPlan(session.actionPlan);
    const doneCount = actionPlan.actions.filter((item) => item.done).length;
    const quality = computeSessionQuality(session);
    const tags = Array.isArray(session.tags) ? session.tags : [];
    const tagHtml = tags.map((tag) => `<span>${escapeHTML(tagLabel(tag))}</span>`).join("");

    const time = new Date(session.time);
    const localTime = `${time.getFullYear()}-${pad2(time.getMonth() + 1)}-${pad2(time.getDate())} ${pad2(
      time.getHours()
    )}:${pad2(time.getMinutes())}`;

    item.innerHTML = `
      <strong>${escapeHTML(mode ? mode.name : "未知玩法")} · ${escapeHTML(deckType.name)} · ${escapeHTML(layoutDirection.name)} · ${escapeHTML(localTime)}</strong>
      <p>问题：${escapeHTML(session.question || "（未填写）")}</p>
      <p>牌面：${escapeHTML((session.cards || []).map((card) => getCardShortName(card)).join(" / "))}</p>
      <p>笔记：${escapeHTML(session.note || "（未记录）")}</p>
      <p>双人模式：${session.dualMode ? "开启" : "关闭"}</p>
      <p>行动进度：${doneCount}/3</p>
      <p>质量分：${quality}</p>
      <p class="history-tag">${tagHtml || "<span>未分类</span>"}</p>
      <div class="actions compact">
        <button class="btn btn-ghost" data-action="replay" data-id="${escapeHTML(session.id)}">回看此局</button>
        <button class="btn btn-danger" data-action="remove" data-id="${escapeHTML(session.id)}">删除</button>
      </div>
    `;
    refs.historyList.appendChild(item);
  });
}

function getFilteredHistory() {
  return state.history.filter((session) => {
    const tags = Array.isArray(session.tags) ? session.tags : inferSessionTags(session.question || "", session.note || "", session.cards || []);
    if (state.historyTag !== "all" && !tags.includes(state.historyTag)) {
      return false;
    }
    if (!state.historyQuery) {
      return true;
    }
    const query = state.historyQuery.toLowerCase();
    const bag = [
      session.question || "",
      session.note || "",
      (session.cards || []).map((card) => getCardShortName(card)).join(" "),
      tags.map((tag) => tagLabel(tag)).join(" ")
    ]
      .join(" ")
      .toLowerCase();
    return bag.includes(query);
  });
}

function handleHistoryAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  const { action, id } = button.dataset;
  if (action === "remove") {
    if (state.readonlyMode) {
      setSummary("只读分享模式下不能删除历史。", true);
      return;
    }
    state.history = state.history.filter((entry) => entry.id !== id);
    if (state.currentSession && state.currentSession.id === id) {
      state.currentSession = null;
      state.currentCards = [];
      state.closure = { summary: "", action: "", support: "" };
      resetLayerVisits();
      renderActionPlan();
      renderClosurePanel();
    }
    persistHistory();
    renderHistory();
    renderAnalytics();
    renderWorkflowSteps();
    persistCurrentSessionSnapshot();
    return;
  }
  if (action === "replay") {
    const session = state.history.find((entry) => entry.id === id);
    if (!session) {
      return;
    }
    state.modeId = session.modeId in MODES ? session.modeId : "focus";
    state.deckTypeId = session.deckTypeId in DECK_TYPES ? session.deckTypeId : inferDeckTypeFromCards(session.cards);
    state.layoutDirection = session.layoutDirection in LAYOUT_DIRECTIONS ? session.layoutDirection : "up";
    if (!session.actionPlan) {
      session.actionPlan = normalizeActionPlan(
        buildActionPlan(session.cards || [], session.question || "", session.note || "", MODES[session.modeId] || MODES.focus)
      );
    } else {
      session.actionPlan = normalizeActionPlan(session.actionPlan);
    }
    session.tags = Array.isArray(session.tags) && session.tags.length
      ? session.tags
      : inferSessionTags(session.question || "", session.note || "", session.cards || []);
    session.slotLabels = Array.isArray(session.slotLabels) && session.slotLabels.length
      ? session.slotLabels
      : getModeLabels(state.modeId, MODES[state.modeId].count);
    session.dualMode = Boolean(session.dualMode);
    session.dualNotes = session.dualNotes && typeof session.dualNotes === "object"
      ? {
          a: typeof session.dualNotes.a === "string" ? session.dualNotes.a : "",
          b: typeof session.dualNotes.b === "string" ? session.dualNotes.b : ""
        }
      : { a: "", b: "" };
    state.currentSession = session;
    state.currentCards = session.cards || [];
    if (session.protocol && typeof session.protocol === "object") {
      state.protocol = {
        intent: typeof session.protocol.intent === "string" ? session.protocol.intent : state.protocol.intent,
        consent: Boolean(session.protocol.consent),
        emotion: Math.max(1, Math.min(5, Number(session.protocol.emotion) || 3)),
        paused: false
      };
    }
    state.closure = session.closure && typeof session.closure === "object"
      ? {
          summary: typeof session.closure.summary === "string" ? session.closure.summary : "",
          action: typeof session.closure.action === "string" ? session.closure.action : "",
          support: typeof session.closure.support === "string" ? session.closure.support : ""
        }
      : { summary: "", action: "", support: "" };
    state.layerVisits = new Set(Array.isArray(session.layerVisits) ? session.layerVisits : []);
    state.layerId = "description";
    state.facilitator.stageIndex = getFacilitatorStageIndexByLayer(state.layerId);
    refs.questionInput.value = session.question || "";
    refs.noteInput.value = session.note || "";
    state.dualMode = session.dualMode;
    refs.dualNoteA.value = session.dualNotes.a;
    refs.dualNoteB.value = session.dualNotes.b;
    renderSessionProtocol();
    renderModeSwitch();
    renderModeDetail();
    renderDualModePanel();
    renderSlotEditor();
    renderDeckTypeSwitch();
    renderLayoutDirectionSwitch();
    renderPromptTabs();
    renderSpread(state.currentCards, session.slotLabels);
    renderPrompts(session.slotLabels);
    renderActionPlan();
    renderClosurePanel();
    renderWorkflowSteps();
    persistCurrentSessionSnapshot();
    setSummary(
      `已回看历史：${MODES[state.modeId].name} / ${DECK_TYPES[state.deckTypeId].name} / ${LAYOUT_DIRECTIONS[state.layoutDirection].name}`,
      false
    );
  }
}

function saveCurrentNote() {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能保存笔记。", true);
    return;
  }
  if (!state.currentSession) {
    setSummary("请先完成一次抽卡，再保存本次洞察记录。", true);
    return;
  }
  const noteText = refs.noteInput.value.trim();
  state.currentSession.note = noteText;
  syncCurrentSessionToHistory();
  renderHistory();
  generateClosureIntegration(true);
  renderWorkflowSteps();
  setSummary("本次记录已保存到浏览器本地。", false);
}

async function copyCurrentReport() {
  if (state.currentCards.length === 0) {
    setSummary("请先抽卡，再复制引导文本。", true);
    return;
  }
  const mode = MODES[state.modeId];
  const promptItems = Array.from(refs.promptList.querySelectorAll("li")).map((item) => item.textContent || "");
  const actionPlan = normalizeActionPlan(state.currentSession?.actionPlan);
  generateClosureIntegration(true);
  const report = [
    "【OH 卡引导记录】",
    `开场意图：${state.protocol.intent || "（未填写）"}`,
    `探索同意：${state.protocol.consent ? "已确认" : "未确认"}`,
    `情绪强度：${EMOTION_LABELS[state.protocol.emotion] || "3 · 中等"}`,
    `问题：${refs.questionInput.value.trim() || "（未填写）"}`,
    `玩法：${mode.name}`,
    `卡组：${DECK_TYPES[state.deckTypeId].name}`,
    `方向：${LAYOUT_DIRECTIONS[state.layoutDirection].name}`,
    `提问风格：${PROMPT_STYLES[state.promptStyleId]?.name || "平衡"}`,
    `抽卡防重复：${state.avoidRecent ? "开启" : "关闭"}`,
    "牌面：",
    ...state.currentCards.map((card, index) => formatCardLineForReport(card, getActiveSlotLabels(mode)[index] || `位置 ${index + 1}`)),
    `当前提问层：${PROMPT_LAYERS.find((layer) => layer.id === state.layerId)?.name || ""}`,
    "引导问题：",
    ...promptItems.map((line) => `- ${line}`),
    "复盘总结：",
    `- ${actionPlan.summary}`,
    "行动建议：",
    ...actionPlan.actions.map((item, index) => {
      const duePart = item.dueDate ? `（截止 ${item.dueDate} / ${reminderLabel(item.reminder)}）` : "";
      return `- [${item.done ? "x" : " "}] ${index + 1}. ${item.text}${duePart}`;
    }),
    "结束整合：",
    state.closure.summary || "（未生成）",
    state.closure.action || "（未生成）",
    state.closure.support || "（未生成）",
    `会话质量分：${computeSessionQuality()}`,
    `笔记：${refs.noteInput.value.trim() || "（未填写）"}`,
    ...(state.dualMode
      ? [`A 方记录：${refs.dualNoteA.value.trim() || "（未填写）"}`, `B 方记录：${refs.dualNoteB.value.trim() || "（未填写）"}`]
      : [])
  ].join("\n");

  const copied = await copyText(report);
  setSummary(copied ? "本次引导文本已复制，可直接粘贴到笔记工具。" : "复制失败，请手动复制页面内容。", !copied);
}

function buildConsultReportText() {
  const mode = MODES[state.modeId];
  const labels = getActiveSlotLabels(mode);
  const prompts = Array.from(refs.promptList.querySelectorAll("li")).map((item) => item.textContent || "");
  const actionPlan = normalizeActionPlan(state.currentSession?.actionPlan);
  const lines = [
    "# OH 咨询报告版",
    "",
    `- 时间：${new Date().toLocaleString()}`,
    `- 开场意图：${state.protocol.intent || "（未填写）"}`,
    `- 情绪强度：${EMOTION_LABELS[state.protocol.emotion] || "3 · 中等"}`,
    `- 议题：${refs.questionInput.value.trim() || "（未填写）"}`,
    `- 玩法：${mode.name} / ${DECK_TYPES[state.deckTypeId].name}`,
    `- 提问风格：${PROMPT_STYLES[state.promptStyleId]?.name || "平衡"}`,
    `- 抽卡防重复：${state.avoidRecent ? "开启" : "关闭"}`,
    "",
    "## 牌面",
    ...state.currentCards.map((card, index) => formatCardLineForReport(card, labels[index] || `位置 ${index + 1}`)),
    "",
    "## 引导问题",
    ...prompts.map((line, index) => `${index + 1}. ${line}`),
    "",
    "## 结论与行动",
    `- 总结：${actionPlan.summary}`,
    ...actionPlan.actions.map((item, index) => `- ${index + 1}. ${item.text}（${item.dueDate || "未设截止"} / ${reminderLabel(item.reminder)}）`),
    "",
    "## 结束整合",
    state.closure.summary || "（未生成）",
    state.closure.action || "（未生成）",
    state.closure.support || "（未生成）",
    "",
    "## 记录",
    refs.noteInput.value.trim() || "（未填写）"
  ];
  if (state.dualMode) {
    lines.push("", "## 双人记录", `- A 方：${refs.dualNoteA.value.trim() || "（未填写）"}`, `- B 方：${refs.dualNoteB.value.trim() || "（未填写）"}`);
  }
  return lines.join("\n");
}

function buildHomeworkSheetText() {
  const actionPlan = normalizeActionPlan(state.currentSession?.actionPlan);
  const lines = [
    "# OH 作业版",
    "",
    `- 议题：${refs.questionInput.value.trim() || "（未填写）"}`,
    `- 牌面：${state.currentCards.map((card) => getCardShortName(card)).join(" / ")}`,
    "",
    "## 本周练习",
    ...actionPlan.actions.map((item, index) => `- [ ] ${index + 1}. ${item.text}（截止 ${item.dueDate || "未设"}）`),
    "",
    "## 自我追问",
    "1. 我最明显的变化是什么？",
    "2. 哪个动作最难执行？为什么？",
    "3. 下一周要保留/调整哪一步？",
    "",
    "## 反馈记录",
    "（请在这里填写）"
  ];
  return lines.join("\n");
}

function formatCardLineForReport(card, slot) {
  const kind = getCardKind(card);
  if (kind === "pair") {
    return `- ${slot}: 图卡「${card.imageCard.name}」 + 字卡「${card.wordCard.name}」`;
  }
  if (kind === "image") {
    return `- ${slot}: 图卡「${card.name}」`;
  }
  return `- ${slot}: 字卡「${card.name}」`;
}

function resetBoard() {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能重置。", true);
    return;
  }
  state.currentCards = [];
  state.currentSession = null;
  clearGroundingTimer();
  state.closure = { summary: "", action: "", support: "" };
  resetLayerVisits();
  state.facilitator.stageIndex = 0;
  refs.noteInput.value = "";
  refs.dualNoteA.value = "";
  refs.dualNoteB.value = "";
  refs.spreadBoard.className = "spread-board empty";
  refs.spreadBoard.innerHTML = '<p class="placeholder">牌面已重置。点击“开始抽卡”开始新一局。</p>';
  refs.promptList.innerHTML = "";
  const promptItem = document.createElement("li");
  promptItem.textContent = "你已重置牌面。可先输入问题，再开始抽卡。";
  refs.promptList.appendChild(promptItem);
  renderActionPlan();
  renderFacilitatorPanel();
  renderClosurePanel();
  renderWorkflowSteps();
  detectSafetyRisk();
  persistCurrentSessionSnapshot();
  setSummary("牌组已重置，准备开始新一局。", false);
}

function clearHistory() {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能清空历史。", true);
    return;
  }
  state.history = [];
  persistHistory();
  renderHistory();
  renderAnalytics();
  renderWorkflowSteps();
  setSummary("历史记录已清空。", false);
}

function setMode(modeId) {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能切换玩法。", true);
    return;
  }
  if (!(modeId in MODES)) {
    return;
  }
  state.modeId = modeId;
  renderModeSwitch();
  renderModeDetail();
  renderSlotEditor();
  if (state.currentCards.length > 0 && state.currentCards.length === MODES[modeId].count) {
    const slotLabels = getModeLabels(modeId, MODES[modeId].count);
    if (state.currentSession) {
      state.currentSession.slotLabels = slotLabels.slice();
    }
    renderSpread(state.currentCards, slotLabels);
    renderPrompts(slotLabels);
  } else if (state.currentCards.length > 0) {
    state.currentCards = [];
    state.currentSession = null;
    state.closure = { summary: "", action: "", support: "" };
    resetLayerVisits();
    refs.spreadBoard.className = "spread-board empty";
    refs.spreadBoard.innerHTML = '<p class="placeholder">玩法已切换，请重新抽卡以匹配新的牌阵结构。</p>';
    refs.promptList.innerHTML = "";
    const promptItem = document.createElement("li");
    promptItem.textContent = "当前玩法结构已更新，请抽卡后再进行引导提问。";
    refs.promptList.appendChild(promptItem);
    renderActionPlan();
  }
  syncFacilitatorStageByLayer(state.layerId);
  renderFacilitatorPanel();
  renderClosurePanel();
  renderWorkflowSteps();
  persistCurrentSessionSnapshot();
  setSummary(`已切换玩法：${MODES[modeId].name}`, false);
}

function setDeckType(deckTypeId) {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能切换卡组。", true);
    return;
  }
  if (!(deckTypeId in DECK_TYPES)) {
    return;
  }
  state.deckTypeId = deckTypeId;
  renderDeckTypeSwitch();
  renderModeSwitch();

  if (state.currentCards.length > 0) {
    state.currentCards = [];
    state.currentSession = null;
    state.closure = { summary: "", action: "", support: "" };
    resetLayerVisits();
    refs.spreadBoard.className = "spread-board empty";
    refs.spreadBoard.innerHTML = '<p class="placeholder">卡组模式已切换，请重新抽卡。</p>';
    refs.promptList.innerHTML = "";
    const promptItem = document.createElement("li");
    promptItem.textContent = "卡组模式变化后需要重新抽卡，才能得到正确引导。";
    refs.promptList.appendChild(promptItem);
    renderActionPlan();
  }

  renderFacilitatorPanel();
  renderClosurePanel();
  renderWorkflowSteps();
  persistCurrentSessionSnapshot();
  setSummary(`已切换卡组：${DECK_TYPES[deckTypeId].name}`, false);
}

function setLayoutDirection(directionId) {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能旋转方向。", true);
    return;
  }
  if (!(directionId in LAYOUT_DIRECTIONS)) {
    return;
  }
  state.layoutDirection = directionId;
  renderModeSwitch();
  renderLayoutDirectionSwitch();

  if (state.currentSession) {
    state.currentSession.layoutDirection = directionId;
    state.history = state.history.map((entry) => {
      if (entry.id === state.currentSession.id) {
        return { ...entry, layoutDirection: directionId };
      }
      return entry;
    });
    persistHistory();
    renderHistory();
  }

  if (state.currentCards.length > 0) {
    const slotLabels = getModeLabels(state.modeId, MODES[state.modeId].count);
    if (state.currentSession) {
      state.currentSession.slotLabels = slotLabels.slice();
    }
    renderSpread(state.currentCards, slotLabels);
    renderPrompts(slotLabels);
  }

  renderFacilitatorPanel();
  renderClosurePanel();
  renderWorkflowSteps();
  persistCurrentSessionSnapshot();
  setSummary(`已切换方向：${LAYOUT_DIRECTIONS[directionId].name}`, false);
}

function renderSlotEditor() {
  refs.slotEditorList.innerHTML = "";
  const mode = MODES[state.modeId];
  const labels = getModeLabels(state.modeId, mode.count);
  labels.forEach((label, index) => {
    const row = document.createElement("div");
    row.className = "slot-editor-row";
    row.innerHTML = `
      <span class="slot-editor-index">${index + 1}</span>
      <input type="text" data-slot-index="${index}" value="${escapeHTML(label)}" />
      <button type="button" class="btn btn-ghost btn-small" data-slot-move="up" data-slot-index="${index}">上移</button>
      <button type="button" class="btn btn-ghost btn-small" data-slot-move="down" data-slot-index="${index}">下移</button>
    `;
    refs.slotEditorList.appendChild(row);
  });
}

function handleSlotEditorInput(event) {
  const input = event.target.closest("input[data-slot-index]");
  if (!input || state.readonlyMode) {
    return;
  }
  const index = Number(input.dataset.slotIndex);
  const labels = getModeLabels(state.modeId, MODES[state.modeId].count);
  labels[index] = input.value.trim() || `位置 ${index + 1}`;
  state.customSlotLabels[state.modeId] = labels;
  persistCustomSlotLabels();
  if (state.currentSession && state.currentCards.length > 0) {
    state.currentSession.slotLabels = labels.slice();
    renderSpread(state.currentCards, labels);
    renderPrompts(labels);
    syncCurrentSessionToHistory();
  }
}

function handleSlotEditorAction(event) {
  const button = event.target.closest("button[data-slot-move]");
  if (!button || state.readonlyMode) {
    return;
  }
  const action = button.dataset.slotMove;
  const index = Number(button.dataset.slotIndex);
  const labels = getModeLabels(state.modeId, MODES[state.modeId].count);
  const swapIndex = action === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= labels.length) {
    return;
  }
  [labels[index], labels[swapIndex]] = [labels[swapIndex], labels[index]];
  state.customSlotLabels[state.modeId] = labels;
  persistCustomSlotLabels();
  renderSlotEditor();
  if (state.currentSession && state.currentCards.length > 0) {
    state.currentSession.slotLabels = labels.slice();
    renderSpread(state.currentCards, labels);
    renderPrompts(labels);
    syncCurrentSessionToHistory();
  }
}

function saveCurrentSlotTemplate() {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能保存模板。", true);
    return;
  }
  const labels = getModeLabels(state.modeId, MODES[state.modeId].count);
  state.customSlotLabels[state.modeId] = labels;
  persistCustomSlotLabels();
  setSummary(`已保存「${MODES[state.modeId].name}」的位置模板。`, false);
}

function resetCurrentSlotTemplate() {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能重置模板。", true);
    return;
  }
  delete state.customSlotLabels[state.modeId];
  persistCustomSlotLabels();
  renderSlotEditor();
  const labels = getModeLabels(state.modeId, MODES[state.modeId].count);
  if (state.currentSession && state.currentCards.length > 0) {
    state.currentSession.slotLabels = labels.slice();
    renderSpread(state.currentCards, labels);
    renderPrompts(labels);
    syncCurrentSessionToHistory();
  }
  setSummary("已恢复默认位置名称。", false);
}

async function importDeckFromFile(file, type) {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能导入卡组。", true);
    return;
  }
  if (!file) {
    return;
  }
  try {
    const text = await file.text();
    const raw = JSON.parse(text);
    if (!Array.isArray(raw)) {
      throw new Error("JSON 顶层必须是数组。");
    }

    const parsed =
      type === "word"
        ? raw.map((entry) => normalizeWordCard(entry)).filter(Boolean)
        : raw.map((entry) => normalizeImageCard(entry)).filter(Boolean);
    const validation = await buildDeckValidationReport(raw, parsed, type);
    state.deckValidation = validation;
    renderDeckValidation();

    if (type === "word") {
      if (parsed.length < 5) {
        throw new Error("字卡数量太少，至少需要 5 张。");
      }
      state.wordDeck = parsed;
      state.deckSource.word = "custom";
      setSummary(`已导入字卡 ${parsed.length} 张。`, false);
    } else {
      if (parsed.length < 5) {
        throw new Error("图卡数量太少，至少需要 5 张。");
      }
      state.imageDeck = parsed;
      state.deckSource.image = "custom";
      setSummary(`已导入图卡 ${parsed.length} 张。`, false);
    }

    persistCustomDecks();
    renderDeckStatus();
    renderWorkflowSteps();
    warmupPreload();
  } catch (error) {
    console.error("import deck failed", error);
    setSummary(`导入失败：${error.message || "请检查 JSON 格式"}`, true);
  }
}

async function buildDeckValidationReport(rawEntries, parsedCards, type) {
  const items = [];
  const seenName = new Map();
  let missingNameCount = 0;
  let missingImageCount = 0;

  rawEntries.forEach((entry, index) => {
    const name = typeof entry?.name === "string" ? entry.name.trim() : "";
    if (!name) {
      missingNameCount += 1;
    } else {
      const existing = seenName.get(name) || [];
      existing.push(index + 1);
      seenName.set(name, existing);
    }
    const image = typeof entry?.image === "string" ? entry.image.trim() : "";
    if (!image) {
      missingImageCount += 1;
    }
  });

  if (missingNameCount > 0) {
    items.push({ level: "error", text: `发现 ${missingNameCount} 条缺少 name，已被忽略。` });
  }
  if (missingImageCount > 0) {
    items.push({
      level: type === "image" ? "error" : "warn",
      text: `发现 ${missingImageCount} 条缺少 image，${type === "image" ? "图卡会影响展示。" : "字卡会回退为文本样式。"}`
    });
  }

  const duplicates = Array.from(seenName.entries()).filter(([, indexes]) => indexes.length > 1);
  duplicates.slice(0, 6).forEach(([name, indexes]) => {
    items.push({ level: "warn", text: `重名卡片「${name}」出现在第 ${indexes.join(" / ")} 条。` });
  });
  if (duplicates.length > 6) {
    items.push({ level: "warn", text: `还有 ${duplicates.length - 6} 组重名未展开。` });
  }

  const sizeWarnings = await inspectDeckImageDimensions(parsedCards, type);
  items.push(...sizeWarnings);

  const errorCount = items.filter((item) => item.level === "error").length;
  const warnCount = items.filter((item) => item.level === "warn").length;
  const summary = `已校验 ${rawEntries.length} 条，成功解析 ${parsedCards.length} 条；异常 ${errorCount}，提醒 ${warnCount}。`;
  return { summary, items };
}

async function inspectDeckImageDimensions(cards, type) {
  const issues = [];
  const candidates = cards.filter((card) => card?.image).slice(0, 24);
  const minRatio = type === "word" ? 0.56 : 0.5;
  const maxRatio = type === "word" ? 1.02 : 1.1;

  for (const card of candidates) {
    const meta = await loadImageMeta(card.image);
    if (!meta) {
      continue;
    }
    if (meta.width < 420 || meta.height < 540) {
      issues.push({ level: "warn", text: `「${card.name}」分辨率偏低（${meta.width}x${meta.height}）。` });
    }
    const ratio = meta.width / meta.height;
    if (ratio < minRatio || ratio > maxRatio) {
      issues.push({ level: "warn", text: `「${card.name}」比例异常（${ratio.toFixed(2)}），可能导致叠卡留白或裁切。` });
    }
    if (issues.length >= 8) {
      break;
    }
  }
  return issues;
}

async function loadImageMeta(url) {
  if (!url) {
    return null;
  }
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function setupDeckDropzone() {
  const zone = refs.deckDropzone;
  if (!zone || zone.dataset.bound === "1") {
    return;
  }
  zone.dataset.bound = "1";
  const enter = (event) => {
    event.preventDefault();
    zone.classList.add("is-dragover");
  };
  const leave = () => {
    zone.classList.remove("is-dragover");
  };
  zone.addEventListener("dragenter", enter);
  zone.addEventListener("dragover", enter);
  zone.addEventListener("dragleave", leave);
  zone.addEventListener("drop", async (event) => {
    event.preventDefault();
    leave();
    const files = Array.from(event.dataTransfer?.files || []);
    await buildDeckFromImageFiles(files, refs.deckBuildTarget.value);
  });
}

async function buildDeckFromImageFiles(files, targetType) {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能生成卡包。", true);
    return;
  }
  const images = files.filter((file) => file.type.startsWith("image/"));
  if (images.length < 5) {
    setSummary("至少选择 5 张图片才能生成卡包。", true);
    return;
  }
  const sorted = images.slice().sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN", { numeric: true }));
  const raw = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const file = sorted[i];
    const base = normalizeFileBaseName(file.name);
    const dataUrl = await fileToDataUrl(file);
    if (targetType === "word") {
      raw.push({
        name: base || `字卡${String(i + 1).padStart(3, "0")}`,
        image: dataUrl,
        cue: ""
      });
    } else {
      raw.push({
        name: base || `图卡${String(i + 1).padStart(3, "0")}`,
        image: dataUrl,
        cue: ""
      });
    }
  }

  const parsed =
    targetType === "word"
      ? raw.map((entry) => normalizeWordCard(entry)).filter(Boolean)
      : raw.map((entry) => normalizeImageCard(entry)).filter(Boolean);
  const validation = await buildDeckValidationReport(raw, parsed, targetType);
  state.deckValidation = validation;
  renderDeckValidation();

  if (targetType === "word") {
    state.wordDeck = parsed;
    state.deckSource.word = "custom";
  } else {
    state.imageDeck = parsed;
    state.deckSource.image = "custom";
  }
  persistCustomDecks();
  renderDeckStatus();
  renderWorkflowSteps();
  warmupPreload();
  downloadJsonFile(parsed, `oh-${targetType}-deck-auto.json`);
  setSummary(`已从 ${sorted.length} 张图片生成${targetType === "word" ? "字卡" : "图卡"}卡包。`, false);
}

function normalizeFileBaseName(name) {
  return String(name || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

function downloadJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, filename);
}

function batchRenameCurrentDeck() {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能重命名卡组。", true);
    return;
  }
  const target = refs.deckBuildTarget.value;
  const prefix = refs.deckBatchPrefix.value.trim() || (target === "word" ? "字卡" : "图卡");
  const source = target === "word" ? state.wordDeck : state.imageDeck;
  if (!Array.isArray(source) || source.length === 0) {
    setSummary("当前卡组为空，无法批量重命名。", true);
    return;
  }
  const renamed = source.map((card, index) => ({ ...card, name: `${prefix}${String(index + 1).padStart(3, "0")}` }));
  if (target === "word") {
    state.wordDeck = renamed;
    state.deckSource.word = "custom";
  } else {
    state.imageDeck = renamed;
    state.deckSource.image = "custom";
  }
  persistCustomDecks();
  renderDeckStatus();
  state.deckValidation = {
    summary: `已完成${target === "word" ? "字卡" : "图卡"}批量重命名，建议再次校验后抽卡。`,
    items: []
  };
  renderDeckValidation();
  if (state.currentCards.length > 0) {
    renderSpread(state.currentCards, getModeLabels(state.modeId, MODES[state.modeId].count));
  }
  setSummary(`已将${target === "word" ? "字卡" : "图卡"}批量重命名为「${prefix}001...」。`, false);
}

async function fixCurrentDeckImageRatio() {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能修复卡图比例。", true);
    return;
  }
  const target = refs.deckBuildTarget.value;
  const source = target === "word" ? state.wordDeck : state.imageDeck;
  if (!Array.isArray(source) || source.length === 0) {
    setSummary("当前卡组为空，无法修复比例。", true);
    return;
  }
  setSummary("正在修复图片比例，请稍候...", false);
  const fixed = [];
  for (const card of source) {
    const image = card.image ? await fitImageToRatio(card.image, COMPOSITE_BASE_RATIO) : "";
    fixed.push({ ...card, image: image || card.image });
  }
  if (target === "word") {
    state.wordDeck = fixed;
    state.deckSource.word = "custom";
  } else {
    state.imageDeck = fixed;
    state.deckSource.image = "custom";
  }
  persistCustomDecks();
  renderDeckStatus();
  warmupPreload();
  const raw = fixed.map((card) => ({ name: card.name, image: card.image }));
  state.deckValidation = await buildDeckValidationReport(raw, fixed, target);
  renderDeckValidation();
  if (state.currentCards.length > 0) {
    const slotLabels = getModeLabels(state.modeId, MODES[state.modeId].count);
    if (state.currentSession) {
      state.currentSession.slotLabels = slotLabels.slice();
    }
    renderSpread(state.currentCards, slotLabels);
    renderPrompts(slotLabels);
  }
  setSummary(`已完成${target === "word" ? "字卡" : "图卡"}比例修复。`, false);
}

async function fitImageToRatio(src, targetRatio) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const imgRatio = image.naturalWidth / image.naturalHeight;
      let canvasWidth = image.naturalWidth;
      let canvasHeight = image.naturalHeight;
      if (imgRatio > targetRatio) {
        canvasHeight = Math.round(canvasWidth / targetRatio);
      } else {
        canvasWidth = Math.round(canvasHeight * targetRatio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const drawW = imgRatio > targetRatio ? canvasWidth : Math.round(canvasHeight * imgRatio);
      const drawH = imgRatio > targetRatio ? Math.round(canvasWidth / imgRatio) : canvasHeight;
      const dx = Math.round((canvasWidth - drawW) / 2);
      const dy = Math.round((canvasHeight - drawH) / 2);
      ctx.drawImage(image, dx, dy, drawW, drawH);
      try {
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch (error) {
        resolve(src);
      }
    };
    image.onerror = () => resolve(src);
    image.src = src;
  });
}

function resetDecksToBuiltIn() {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能恢复卡组。", true);
    return;
  }
  state.wordDeck = cloneCards(DEFAULT_WORD_DECK);
  state.imageDeck = cloneCards(DEFAULT_IMAGE_DECK);
  state.deckSource.word = "built-in";
  state.deckSource.image = "built-in";
  state.deckValidation = {
    summary: "已切回内置卡组。你也可以重新导入自定义卡包并查看校验结果。",
    items: []
  };
  persistCustomDecks();
  renderDeckStatus();
  renderDeckValidation();
  setSummary("已恢复内置图卡和字卡，正在尝试自动加载实卡素材。", false);
  autoLoadBundledDecks();
}

function hydrateCustomDecks() {
  try {
    const raw = localStorage.getItem(CUSTOM_DECK_STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return;
    }

    if (Array.isArray(parsed.wordDeck)) {
      const wordDeck = parsed.wordDeck.map((entry) => normalizeWordCard(entry)).filter(Boolean);
      if (wordDeck.length >= 5) {
        state.wordDeck = wordDeck;
        state.deckSource.word = "custom";
      }
    }

    if (Array.isArray(parsed.imageDeck)) {
      const imageDeck = parsed.imageDeck.map((entry) => normalizeImageCard(entry)).filter(Boolean);
      if (imageDeck.length >= 5) {
        state.imageDeck = imageDeck;
        state.deckSource.image = "custom";
      }
    }
  } catch (error) {
    console.error("hydrate custom decks failed", error);
  }
}

async function autoLoadBundledDecks() {
  const hasCustomWordImages =
    state.deckSource.word === "custom" && state.wordDeck.filter((card) => card && card.image).length >= 5;
  const hasCustomImageCards =
    state.deckSource.image === "custom" && state.imageDeck.filter((card) => card && card.image).length >= 5;

  if (hasCustomWordImages && hasCustomImageCards) {
    return;
  }

  try {
    const [imageRes, wordRes] = await Promise.all([fetch(BUNDLED_IMAGE_DECK_PATH), fetch(BUNDLED_WORD_DECK_PATH)]);
    if (!imageRes.ok || !wordRes.ok) {
      return;
    }

    const [imageRaw, wordRaw] = await Promise.all([imageRes.json(), wordRes.json()]);
    let imageDeck = Array.isArray(imageRaw) ? imageRaw.map((entry) => normalizeImageCard(entry)).filter(Boolean) : [];
    let wordDeck = Array.isArray(wordRaw) ? wordRaw.map((entry) => normalizeWordCard(entry)).filter(Boolean) : [];

    let changed = false;

    if (imageDeck.length >= 5 && !hasCustomImageCards) {
      state.imageDeck = imageDeck;
      state.deckSource.image = "bundled";
      changed = true;
    }

    if (wordDeck.length >= 5 && !hasCustomWordImages) {
      state.wordDeck = wordDeck;
      state.deckSource.word = "bundled";
      changed = true;
    }

    if (!changed) {
      return;
    }

    state.deckValidation = {
      summary: "已加载实卡包。建议抽几局确认你的卡图比例是否符合预期。",
      items: []
    };
    renderDeckStatus();
    renderDeckValidation();
    warmupPreload();
    setSummary(`已自动加载实卡素材：图卡 ${state.imageDeck.length} 张 / 字卡 ${state.wordDeck.length} 张。`, false);
  } catch (error) {
    console.warn("autoLoadBundledDecks failed", error);
  }
}

function persistCustomDecks() {
  localStorage.setItem(
    CUSTOM_DECK_STORAGE_KEY,
    JSON.stringify({
      wordDeck: state.deckSource.word === "custom" ? state.wordDeck : null,
      imageDeck: state.deckSource.image === "custom" ? state.imageDeck : null
    })
  );
}

function normalizeWordCard(input) {
  if (!input || typeof input !== "object") {
    return null;
  }
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) {
    return null;
  }
  return {
    name,
    glyph: typeof input.glyph === "string" ? input.glyph.trim().slice(0, 4) : "",
    image: typeof input.image === "string" ? input.image.trim() : "",
    tone: normalizeTone(input.tone),
    keywords: normalizeKeywords(input.keywords, ["联想"]),
    cue: typeof input.cue === "string" ? input.cue.trim() : ""
  };
}

function normalizeImageCard(input) {
  if (!input || typeof input !== "object") {
    return null;
  }
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) {
    return null;
  }

  const tone = normalizeTone(input.tone);
  const keywords = normalizeKeywords(input.keywords, ["画面", "情境"]);
  const cue = typeof input.cue === "string" ? input.cue.trim() : "";

  let image = typeof input.image === "string" ? input.image.trim() : "";
  if (!image) {
    image = buildSceneImage({
      name,
      tone,
      symbol: "◌",
      colors: toneColors(tone),
      keywords,
      cue
    });
  }

  return {
    name,
    image,
    tone,
    keywords,
    cue
  };
}

function normalizeKeywords(value, fallback) {
  if (Array.isArray(value)) {
    const result = value.map((item) => String(item).trim()).filter(Boolean).slice(0, 6);
    if (result.length > 0) {
      return result;
    }
  }
  if (typeof value === "string") {
    const result = value
      .split(/[、,，/|]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6);
    if (result.length > 0) {
      return result;
    }
  }
  return fallback;
}

function normalizeTone(value) {
  const tone = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (["sand", "moss", "ocean", "fire", "night"].includes(tone)) {
    return tone;
  }
  return "sand";
}

function toneColors(tone) {
  if (tone === "moss") {
    return ["#9dc08f", "#edf6e7", "#648a56"];
  }
  if (tone === "ocean") {
    return ["#86b8c8", "#e7f2f8", "#557d96"];
  }
  if (tone === "fire") {
    return ["#e2a377", "#fbe8d9", "#b56e3d"];
  }
  if (tone === "night") {
    return ["#8d95ae", "#e6e9f3", "#5b637b"];
  }
  return ["#e7bb89", "#fceeda", "#b48350"];
}

function buildSceneImage(scene) {
  const [c1, c2, c3] = Array.isArray(scene.colors) && scene.colors.length >= 3 ? scene.colors : toneColors(scene.tone || "sand");
  const symbol = scene.symbol || "◌";
  const name = scene.name || "图卡";
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="55%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="360" fill="url(#g)"/>
  <circle cx="510" cy="72" r="52" fill="rgba(255,255,255,0.25)"/>
  <path d="M0 300 C 110 260 220 320 300 286 C 375 252 475 268 600 236 L600 360 L0 360Z" fill="rgba(255,255,255,0.28)"/>
  <path d="M0 260 C 90 228 188 286 278 252 C 360 220 460 238 600 194" stroke="rgba(255,255,255,0.36)" stroke-width="4" fill="none"/>
  <text x="54" y="96" font-size="72" fill="rgba(35,32,28,0.52)" font-family="serif">${escapeSVG(symbol)}</text>
  <text x="36" y="332" font-size="36" fill="rgba(34,30,26,0.72)" font-family="serif">${escapeSVG(name)}</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildImageFallbackData(labelText) {
  const label = String(labelText || "卡牌").slice(0, 20);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 960">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5efe4"/>
      <stop offset="100%" stop-color="#ece4d7"/>
    </linearGradient>
  </defs>
  <rect width="720" height="960" fill="url(#bg)"/>
  <rect x="36" y="36" width="648" height="888" rx="24" fill="none" stroke="#d7c9b2" stroke-width="3" stroke-dasharray="8 6"/>
  <text x="50%" y="48%" text-anchor="middle" font-size="42" fill="#7c6a57" font-family="serif">图片暂不可用</text>
  <text x="50%" y="56%" text-anchor="middle" font-size="30" fill="#9c8873" font-family="serif">${escapeSVG(label)}</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSVG(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pickUnique(deck, count, avoidNameSet = new Set()) {
  return pickUniqueWithAvoid(deck, count, avoidNameSet);
}

function pickUniqueWithAvoid(deck, count, avoidNameSet) {
  const avoid = avoidNameSet instanceof Set ? avoidNameSet : new Set();
  const preferred = shuffle(deck.filter((card) => !avoid.has(card?.name)));
  const fallback = shuffle(deck.filter((card) => avoid.has(card?.name)));
  const selected = preferred.slice(0, count);
  if (selected.length < count) {
    selected.push(...fallback.slice(0, count - selected.length));
  }
  return selected.map((card) => ({ ...card }));
}

function getRecentCardNameSet(kind) {
  const set = new Set();
  const recent = (state.history || []).slice(0, 3);
  recent.forEach((session) => {
    (session.cards || []).forEach((card) => {
      const cardKind = getCardKind(card);
      if (kind === "word") {
        if (cardKind === "pair") {
          if (card.wordCard?.name) {
            set.add(card.wordCard.name);
          }
        } else if (cardKind === "word" && card.name) {
          set.add(card.name);
        }
      }
      if (kind === "image") {
        if (cardKind === "pair") {
          if (card.imageCard?.name) {
            set.add(card.imageCard.name);
          }
        } else if (cardKind === "image" && card.name) {
          set.add(card.name);
        }
      }
    });
  });
  return set;
}

function shuffle(list) {
  const clone = list.slice();
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function setSummary(text, isError) {
  refs.spreadSummary.textContent = text;
  refs.spreadSummary.style.color = isError ? "#9f3326" : "";
}

function getCardKind(card) {
  if (!card || typeof card !== "object") {
    return "word";
  }
  if (card.kind === "pair" || (card.imageCard && card.wordCard)) {
    return "pair";
  }
  if (card.kind === "image" || card.image) {
    return "image";
  }
  return "word";
}

function getCardKindName(card) {
  const kind = getCardKind(card);
  if (kind === "pair") {
    return "图字配对";
  }
  if (kind === "image") {
    return "图卡";
  }
  return "字卡";
}

function getCardPromptName(card) {
  const kind = getCardKind(card);
  if (kind === "pair") {
    return `${card.imageCard.name} + ${card.wordCard.name}`;
  }
  if (kind === "image") {
    return `${card.name}(图卡)`;
  }
  return `${card.name}(字卡)`;
}

function getCardShortName(card) {
  const kind = getCardKind(card);
  if (kind === "pair") {
    return `${card.imageCard.name}+${card.wordCard.name}`;
  }
  return card.name;
}

function inferSessionTags(question, note, cards) {
  const text = `${question || ""} ${note || ""} ${(cards || []).map((card) => getCardShortName(card)).join(" ")}`.toLowerCase();
  const tags = [];
  if (/(工作|职业|项目|老板|上司|同事|转型|收入|面试|职场)/.test(text)) {
    tags.push("work");
  }
  if (/(关系|亲密|伴侣|婚姻|家人|朋友|沟通|冲突|父母)/.test(text)) {
    tags.push("relationship");
  }
  if (/(情绪|焦虑|压力|恐惧|悲伤|愤怒|开心|抑郁|内耗)/.test(text)) {
    tags.push("emotion");
  }
  if (/(选择|决策|决定|方向|下一步|怎么做|计划|策略)/.test(text)) {
    tags.push("decision");
  }
  if (tags.length === 0) {
    tags.push("decision");
  }
  return uniqueValues(tags);
}

function tagLabel(tag) {
  const labels = {
    work: "工作",
    relationship: "关系",
    emotion: "情绪",
    decision: "决策"
  };
  return labels[tag] || "未分类";
}

function inferDeckTypeFromCards(cards) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return "word";
  }
  const kind = getCardKind(cards[0]);
  if (kind === "pair") {
    return "pair";
  }
  if (kind === "image") {
    return "image";
  }
  return "word";
}

function directionToQuarter(directionId) {
  if (directionId === "right") {
    return 1;
  }
  if (directionId === "down") {
    return 2;
  }
  if (directionId === "left") {
    return 3;
  }
  return 0;
}

function normalizeQuarter(value) {
  return ((Number(value) % 4) + 4) % 4;
}

function applyPairRotation(viewport, quarter) {
  const normalized = normalizeQuarter(quarter);
  viewport.dataset.rotationQuarter = String(normalized);
  viewport.classList.remove(...ROTATION_CLASSES);
  viewport.classList.add(ROTATION_CLASSES[normalized]);
  refreshPairViewportFit(viewport);
  const composite = viewport.querySelector(".pair-composite");
  if (composite) {
    clampCompositePan(viewport, composite, true);
  }
}

function rotatePairViewport(viewport, deltaQuarter) {
  const current = Number(viewport.dataset.rotationQuarter || 0);
  const delta = Number(deltaQuarter || 0);
  applyPairRotation(viewport, current + delta);
  if (!refs.previewPairWrap.hidden && refs.previewSyncRotation.checked && state.previewSourceViewport === viewport) {
    applyPreviewPairRotation(Number(refs.previewPairComposite.dataset.rotationQuarter || 0) + delta);
  }
}

function togglePreviewFitMode(forceMode) {
  if (refs.previewPairWrap.hidden) {
    return;
  }
  const mode = forceMode === "fit" || forceMode === "full" ? forceMode : state.previewFitMode === "fit" ? "full" : "fit";
  state.previewFitMode = mode;
  updatePreviewFitToggle();
  refreshPreviewViewportFit();
}

function updatePreviewFitToggle() {
  const isFull = state.previewFitMode === "full";
  refs.previewFitToggleBtn.classList.toggle("is-active", isFull);
  refs.previewFitToggleBtn.textContent = isFull ? "适配" : "全图";
}

function makePreviewableImage(imageElement, titleText) {
  if (!imageElement) {
    return;
  }
  imageElement.classList.add("previewable-image");
  imageElement.dataset.previewSrc = imageElement.dataset.fullSrc || imageElement.currentSrc || imageElement.src || "";
  imageElement.dataset.previewTitle = titleText || imageElement.alt || "";
}

function handlePreviewImageClick(event) {
  if (event.target.closest(".pair-rotate-btn")) {
    return;
  }

  const pairInteractive = event.target.closest(".pair-interactive");
  if (pairInteractive) {
    const imageElement = pairInteractive.querySelector(".pair-image-overlay img");
    const wordElement = pairInteractive.querySelector(".pair-word-base img");
    const displayImageSrc = imageElement?.currentSrc || imageElement?.src || "";
    const displayWordSrc = wordElement?.currentSrc || wordElement?.src || "";
    const imageSrc =
      pairInteractive.dataset.previewImageSrc ||
      imageElement?.dataset.requestedSrc ||
      imageElement?.dataset.fullSrc ||
      imageElement?.currentSrc ||
      imageElement?.src ||
      "";
    const wordSrc =
      pairInteractive.dataset.previewWordSrc ||
      wordElement?.dataset.requestedSrc ||
      wordElement?.dataset.fullSrc ||
      wordElement?.currentSrc ||
      wordElement?.src ||
      "";
    const title = pairInteractive.dataset.previewTitle || "";
    const viewport = pairInteractive.querySelector(".pair-viewport");
    const quarter = normalizeQuarter(Number(viewport?.dataset.rotationQuarter || 0));
    if (imageSrc && wordSrc) {
      openPairPreview(imageSrc, wordSrc, title, quarter, viewport || null, {
        displayImageSrc,
        displayWordSrc
      });
      return;
    }
  }

  const image = event.target.closest("img.previewable-image");
  if (!image) {
    return;
  }
  openImagePreview(
    image.dataset.previewSrc || image.currentSrc || image.src,
    image.dataset.previewTitle || image.alt || "",
    image.currentSrc || image.src || ""
  );
}

function setPreviewMode(mode) {
  const isPair = mode === "pair";
  refs.previewImage.hidden = isPair;
  refs.previewPairWrap.hidden = !isPair;
  refs.previewPairTools.hidden = !isPair;
  if (!isPair) {
    refs.previewFitToggleBtn.classList.remove("is-active");
  }
}

function upgradePreviewImageSource(element, requestedUrl) {
  if (!element || !requestedUrl) {
    return;
  }
  const taskId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  element.dataset.previewUpgradeTaskId = taskId;
  preloadImageUrl(requestedUrl).then((resolvedUrl) => {
    if (element.dataset.previewUpgradeTaskId !== taskId) {
      return;
    }
    if (!resolvedUrl) {
      return;
    }
    element.dataset.fullSrc = resolvedUrl;
    element.dataset.previewSrc = resolvedUrl;
    if (!element.currentSrc || element.currentSrc !== resolvedUrl) {
      element.src = resolvedUrl;
    }
  });
}

function openImagePreview(src, title, displaySrc = "") {
  if (!src) {
    return;
  }
  setPreviewMode("single");
  refs.previewFitToggleBtn.classList.remove("is-active");
  refs.previewFitToggleBtn.textContent = "全图";
  refs.previewImage.dataset.requestedSrc = src;
  refs.previewImage.dataset.fullSrc = src;
  refs.previewImage.dataset.previewSrc = src;
  refs.previewImage.src = displaySrc || src;
  refs.previewImage.classList.remove("smart-thumb-loading");
  hideImageFailureUi(refs.previewImage);
  upgradePreviewImageSource(refs.previewImage, src);
  refs.previewImage.alt = title || "卡牌放大预览";
  refs.previewTitle.textContent = "";
  refs.imagePreviewModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function openPairPreview(imageSrc, wordSrc, title, quarter, sourceViewport = null, sourceDisplay = null) {
  if (!imageSrc || !wordSrc) {
    openImagePreview(imageSrc || wordSrc, title, sourceDisplay?.displayImageSrc || sourceDisplay?.displayWordSrc || "");
    return;
  }
  setPreviewMode("pair");
  state.previewSourceViewport = sourceViewport;
  state.previewFitMode = "fit";
  const displayImageSrc = sourceDisplay?.displayImageSrc || "";
  const displayWordSrc = sourceDisplay?.displayWordSrc || "";
  const initialImageSrc = displayImageSrc || imageSrc;
  const initialWordSrc = displayWordSrc || wordSrc;

  refs.previewPairImage.dataset.requestedSrc = imageSrc;
  refs.previewPairImage.dataset.fullSrc = imageSrc;
  refs.previewPairImage.dataset.previewSrc = imageSrc;
  refs.previewPairImage.src = initialImageSrc;
  refs.previewPairImage.classList.remove("smart-thumb-loading");
  hideImageFailureUi(refs.previewPairImage);

  refs.previewPairWord.dataset.requestedSrc = wordSrc;
  refs.previewPairWord.dataset.fullSrc = wordSrc;
  refs.previewPairWord.dataset.previewSrc = wordSrc;
  refs.previewPairWord.src = initialWordSrc;
  refs.previewPairWord.classList.remove("smart-thumb-loading");
  hideImageFailureUi(refs.previewPairWord);

  upgradePreviewImageSource(refs.previewPairImage, imageSrc);
  upgradePreviewImageSource(refs.previewPairWord, wordSrc);

  updateCompositeSafeImageFit(refs.previewPairComposite, refs.previewPairImage);
  applyOverlayTuneToElement(refs.previewPairComposite);
  applyPreviewPairRotation(quarter);
  updatePreviewFitToggle();
  setCompositeGestureScale(refs.previewPairComposite, 1);
  setCompositePan(refs.previewPairComposite, 0, 0);
  refs.previewTitle.textContent = "";
  refs.imagePreviewModal.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => {
    refreshPreviewViewportFit();
  });
}

function applyPreviewPairRotation(quarter) {
  const normalized = normalizeQuarter(quarter);
  refs.previewPairComposite.dataset.rotationQuarter = String(normalized);
  refs.previewPairComposite.classList.remove(...ROTATION_CLASSES);
  refs.previewPairComposite.classList.add(ROTATION_CLASSES[normalized]);
  refreshPreviewViewportFit();
}

function rotatePreviewPair(deltaQuarter) {
  if (refs.previewPairWrap.hidden) {
    return;
  }
  const current = Number(refs.previewPairComposite.dataset.rotationQuarter || 0);
  const normalizedDelta = Number(deltaQuarter) || 0;
  applyPreviewPairRotation(current + normalizedDelta);
  if (refs.previewSyncRotation.checked && state.previewSourceViewport) {
    rotatePairViewport(state.previewSourceViewport, normalizedDelta);
  }
}

function closeImagePreview() {
  refs.imagePreviewModal.hidden = true;
  setPreviewMode("single");
  state.previewSourceViewport = null;
  state.previewFitMode = "fit";
  updatePreviewFitToggle();
  refs.previewImage.src = "";
  refs.previewImage.classList.remove("smart-thumb-loading");
  delete refs.previewImage.dataset.previewUpgradeTaskId;
  refs.previewPairImage.src = "";
  refs.previewPairImage.classList.remove("smart-thumb-loading");
  delete refs.previewPairImage.dataset.previewUpgradeTaskId;
  refs.previewPairWord.src = "";
  refs.previewPairWord.classList.remove("smart-thumb-loading");
  delete refs.previewPairWord.dataset.previewUpgradeTaskId;
  applyPreviewPairRotation(0);
  setCompositeGestureScale(refs.previewPairComposite, 1);
  setCompositePan(refs.previewPairComposite, 0, 0);
  refs.previewTitle.textContent = "";
  document.body.style.overflow = "";
}

function bindCardSortHandle(tile, handle, index) {
  if (!tile || !handle || state.currentCards.length < 2 || state.readonlyMode) {
    return;
  }
  tile.classList.add("is-sortable");
  handle.classList.add("slot-label--draggable");
  handle.title = "拖拽调整卡牌顺序";
  handle.addEventListener("pointerdown", (event) => {
    startCardSortDrag(event, tile, index);
  });
}

function startCardSortDrag(event, tile, index) {
  if (!tile || state.currentCards.length < 2) {
    return;
  }
  if (event.button !== undefined && event.button !== 0) {
    return;
  }
  const pointerId = event.pointerId;
  const rect = tile.getBoundingClientRect();
  state.cardSortDrag = {
    pointerId,
    sourceIndex: index,
    targetIndex: index,
    tile,
    startCenterX: rect.left + rect.width / 2,
    startCenterY: rect.top + rect.height / 2
  };
  tile.classList.add("is-sorting");
  document.body.classList.add("card-sort-active");
  event.currentTarget?.setPointerCapture?.(pointerId);
  event.preventDefault();
  document.addEventListener("pointermove", handleCardSortMove);
  document.addEventListener("pointerup", handleCardSortEnd);
  document.addEventListener("pointercancel", handleCardSortEnd);
}

function handleCardSortMove(event) {
  const drag = state.cardSortDrag;
  if (!drag || event.pointerId !== drag.pointerId || !drag.tile) {
    return;
  }
  event.preventDefault();
  const dx = event.clientX - drag.startCenterX;
  const dy = event.clientY - drag.startCenterY;
  drag.tile.style.transform = `translate(${dx}px, ${dy}px) rotate(1.5deg) scale(1.02)`;

  document.querySelectorAll(".card-tile.is-drop-target").forEach((element) => {
    element.classList.remove("is-drop-target");
  });

  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".card-tile");
  if (!target || target === drag.tile || !refs.spreadBoard.contains(target)) {
    drag.targetIndex = drag.sourceIndex;
    return;
  }
  target.classList.add("is-drop-target");
  drag.targetIndex = Number(target.dataset.cardIndex || drag.sourceIndex);
}

function handleCardSortEnd(event) {
  const drag = state.cardSortDrag;
  if (!drag || event.pointerId !== drag.pointerId) {
    return;
  }
  document.removeEventListener("pointermove", handleCardSortMove);
  document.removeEventListener("pointerup", handleCardSortEnd);
  document.removeEventListener("pointercancel", handleCardSortEnd);
  document.body.classList.remove("card-sort-active");
  document.querySelectorAll(".card-tile.is-drop-target").forEach((element) => {
    element.classList.remove("is-drop-target");
  });
  if (drag.tile) {
    drag.tile.classList.remove("is-sorting");
    drag.tile.style.transform = "";
  }
  const fromIndex = drag.sourceIndex;
  const toIndex = drag.targetIndex;
  state.cardSortDrag = null;
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex === toIndex) {
    return;
  }
  reorderCurrentCards(fromIndex, toIndex);
}

function reorderCurrentCards(fromIndex, toIndex) {
  if (state.currentCards.length < 2) {
    return;
  }
  const nextCards = state.currentCards.slice();
  const [moved] = nextCards.splice(fromIndex, 1);
  if (!moved) {
    return;
  }
  nextCards.splice(toIndex, 0, moved);
  state.currentCards = nextCards;
  if (state.currentSession) {
    state.currentSession.cards = nextCards.slice();
  }
  const slotLabels = getActiveSlotLabels(MODES[state.modeId]);
  renderSpread(nextCards, slotLabels);
  renderPrompts(slotLabels);
  syncCurrentSessionToHistory();
  persistCurrentSessionSnapshot();
  setSummary("已调整卡牌顺序。", false);
}

function setCompositeGestureScale(element, scale) {
  if (!element) {
    return;
  }
  const clamped = Math.max(0.75, Math.min(2.6, Number(scale) || 1));
  element.dataset.gestureScale = String(clamped);
  element.style.setProperty("--gesture-scale", String(clamped));
  const pairViewport = element.closest(".pair-viewport");
  if (pairViewport) {
    refreshPairViewportFit(pairViewport);
    clampCompositePan(pairViewport, element, true);
    return;
  }
  if (element === refs.previewPairComposite) {
    refreshPreviewViewportFit();
    clampCompositePan(refs.previewPairViewport, refs.previewPairComposite, true);
  }
}

function setCompositePan(element, x, y) {
  if (!element) {
    return;
  }
  element.dataset.panX = String(x);
  element.dataset.panY = String(y);
  element.style.setProperty("--pan-x", `${x.toFixed(2)}px`);
  element.style.setProperty("--pan-y", `${y.toFixed(2)}px`);
}

function getCompositePan(element) {
  if (!element) {
    return { x: 0, y: 0 };
  }
  const x = Number(element.dataset.panX || "0");
  const y = Number(element.dataset.panY || "0");
  return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
}

function clampCompositePan(viewport, composite, animate) {
  if (!viewport || !composite) {
    return;
  }
  const { x, y } = getCompositePan(composite);
  const bounds = computePanBounds(viewport, composite);
  const nx = Math.max(-bounds.maxX, Math.min(bounds.maxX, x));
  const ny = Math.max(-bounds.maxY, Math.min(bounds.maxY, y));
  if (animate) {
    composite.style.transition = "transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1.05)";
    requestAnimationFrame(() => {
      setCompositePan(composite, nx, ny);
      setTimeout(() => {
        composite.style.transition = "";
      }, 240);
    });
  } else {
    setCompositePan(composite, nx, ny);
  }
}

function computePanBounds(viewport, composite) {
  if (!viewport || !composite) {
    return { maxX: 0, maxY: 0 };
  }
  const viewportRect = viewport.getBoundingClientRect();
  const style = getComputedStyle(viewport);
  const paddingX = parseFloat(style.paddingLeft || "0") + parseFloat(style.paddingRight || "0");
  const paddingY = parseFloat(style.paddingTop || "0") + parseFloat(style.paddingBottom || "0");
  const availableW = Math.max(120, viewportRect.width - paddingX);
  const availableH = Math.max(120, viewportRect.height - paddingY);
  const quarter = normalizeQuarter(Number(viewport.dataset.rotationQuarter || composite.dataset.rotationQuarter || 0));
  const baseWidth = composite.offsetWidth || Math.min(availableW, 560);
  const baseHeight = composite.offsetHeight || baseWidth / COMPOSITE_BASE_RATIO;
  const rotatedWidth = quarter % 2 === 0 ? baseWidth : baseHeight;
  const rotatedHeight = quarter % 2 === 0 ? baseHeight : baseWidth;
  const effectiveScale = getCompositeScaleMultiplier(composite);
  const drawnW = rotatedWidth * effectiveScale;
  const drawnH = rotatedHeight * effectiveScale;
  return {
    maxX: Math.max(0, (drawnW - availableW) / 2),
    maxY: Math.max(0, (drawnH - availableH) / 2)
  };
}

function getCompositeScaleMultiplier(composite) {
  if (!composite) {
    return 1;
  }
  const style = getComputedStyle(composite);
  const fitScale = Number(style.getPropertyValue("--fit-scale") || "1");
  const gestureScale = Number(style.getPropertyValue("--gesture-scale") || "1");
  const previewZoom = Number(style.getPropertyValue("--preview-zoom") || "1");
  const pressScale = Number(style.getPropertyValue("--press-scale") || "1");
  const focusScale = Number(style.getPropertyValue("--focus-scale") || "1");
  return fitScale * gestureScale * previewZoom * pressScale * focusScale;
}

function toggleTapZoomAtPoint(viewport, composite, clientX, clientY) {
  if (!viewport || !composite) {
    return;
  }
  const currentScale = Number(composite.dataset.gestureScale || 1);
  if (currentScale > 1.18) {
    setCompositeGestureScale(composite, 1);
    setCompositePan(composite, 0, 0);
    return;
  }
  const rect = viewport.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const offsetX = clientX - centerX;
  const offsetY = clientY - centerY;
  const targetScale = 1.85;
  setCompositeGestureScale(composite, targetScale);
  setCompositePan(composite, -offsetX * 0.74, -offsetY * 0.74);
  clampCompositePan(viewport, composite, true);
}

function setupDragPhysics(viewport, composite) {
  if (!viewport || !composite || viewport.dataset.dragPhysicsBound === "1") {
    return;
  }
  viewport.dataset.dragPhysicsBound = "1";
  const stateBag = {
    pointerId: null,
    isDragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    velocityX: 0,
    velocityY: 0,
    lastX: 0,
    lastY: 0,
    lastTs: 0,
    raf: 0
  };
  state.dragPanStates.set(viewport, stateBag);

  const stopInertia = () => {
    if (stateBag.raf) {
      cancelAnimationFrame(stateBag.raf);
      stateBag.raf = 0;
    }
  };

  const onPointerDown = (event) => {
    if (event.button !== 0 || refs.imagePreviewModal.hidden && viewport === refs.previewPairViewport) {
      return;
    }
    stopInertia();
    stateBag.pointerId = event.pointerId;
    stateBag.isDragging = true;
    const pan = getCompositePan(composite);
    stateBag.startPanX = pan.x;
    stateBag.startPanY = pan.y;
    stateBag.startX = event.clientX;
    stateBag.startY = event.clientY;
    stateBag.lastX = event.clientX;
    stateBag.lastY = event.clientY;
    stateBag.lastTs = performance.now();
    stateBag.velocityX = 0;
    stateBag.velocityY = 0;
    viewport.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!stateBag.isDragging || stateBag.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - stateBag.startX;
    const dy = event.clientY - stateBag.startY;
    const bounds = computePanBounds(viewport, composite);
    const limitX = bounds.maxX + 80;
    const limitY = bounds.maxY + 80;
    const nx = Math.max(-limitX, Math.min(limitX, stateBag.startPanX + dx));
    const ny = Math.max(-limitY, Math.min(limitY, stateBag.startPanY + dy));
    setCompositePan(composite, nx, ny);
    const now = performance.now();
    const dt = Math.max(1, now - stateBag.lastTs);
    stateBag.velocityX = (event.clientX - stateBag.lastX) / dt;
    stateBag.velocityY = (event.clientY - stateBag.lastY) / dt;
    stateBag.lastX = event.clientX;
    stateBag.lastY = event.clientY;
    stateBag.lastTs = now;
  };

  const onPointerUp = (event) => {
    if (!stateBag.isDragging || stateBag.pointerId !== event.pointerId) {
      return;
    }
    stateBag.isDragging = false;
    viewport.releasePointerCapture?.(event.pointerId);
    const decay = 0.92;
    const spring = () => {
      const pan = getCompositePan(composite);
      let vx = stateBag.velocityX * 16;
      let vy = stateBag.velocityY * 16;
      let x = pan.x + vx;
      let y = pan.y + vy;
      stateBag.velocityX *= decay;
      stateBag.velocityY *= decay;
      const bounds = computePanBounds(viewport, composite);
      if (x < -bounds.maxX || x > bounds.maxX) {
        x = x < -bounds.maxX ? (x + -bounds.maxX) / 2 : (x + bounds.maxX) / 2;
        stateBag.velocityX *= 0.55;
      }
      if (y < -bounds.maxY || y > bounds.maxY) {
        y = y < -bounds.maxY ? (y + -bounds.maxY) / 2 : (y + bounds.maxY) / 2;
        stateBag.velocityY *= 0.55;
      }
      setCompositePan(composite, x, y);
      if (Math.abs(stateBag.velocityX) < 0.01 && Math.abs(stateBag.velocityY) < 0.01) {
        clampCompositePan(viewport, composite, true);
        stateBag.raf = 0;
        return;
      }
      stateBag.raf = requestAnimationFrame(spring);
    };
    stateBag.raf = requestAnimationFrame(spring);
  };

  viewport.addEventListener("pointerdown", onPointerDown);
  viewport.addEventListener("pointermove", onPointerMove);
  viewport.addEventListener("pointerup", onPointerUp);
  viewport.addEventListener("pointercancel", onPointerUp);
  viewport.addEventListener("dblclick", (event) => {
    toggleTapZoomAtPoint(viewport, composite, event.clientX, event.clientY);
  });
}

function setupPairViewportGestures(viewport) {
  if (!viewport || viewport.dataset.gestureBound === "1") {
    return;
  }
  viewport.dataset.gestureBound = "1";
  const composite = viewport.querySelector(".pair-composite");
  setupDragPhysics(viewport, composite);
  attachTouchGestures(viewport, {
    onScale: (scale) => {
      setCompositeGestureScale(composite, scale);
    },
    onSwipe: (direction) => {
      rotatePairViewport(viewport, direction > 0 ? 1 : -1);
    },
    onDoubleTap: (x, y) => {
      toggleTapZoomAtPoint(viewport, composite, x, y);
    },
    onReset: (x, y) => {
      toggleTapZoomAtPoint(viewport, composite, x, y);
    },
    getScale: () => {
      return Number(composite?.dataset.gestureScale || 1);
    }
  });
}

function setupPreviewPairGestures() {
  setupDragPhysics(refs.previewPairViewport, refs.previewPairComposite);
  attachTouchGestures(refs.previewPairViewport, {
    onScale: (scale) => {
      setCompositeGestureScale(refs.previewPairComposite, scale);
    },
    onSwipe: (direction) => {
      rotatePreviewPair(direction > 0 ? 1 : -1);
    },
    onDoubleTap: (x, y) => {
      toggleTapZoomAtPoint(refs.previewPairViewport, refs.previewPairComposite, x, y);
    },
    onReset: (x, y) => {
      toggleTapZoomAtPoint(refs.previewPairViewport, refs.previewPairComposite, x, y);
    },
    getScale: () => Number(refs.previewPairComposite.dataset.gestureScale || 1)
  });
}

function attachTouchGestures(target, options) {
  if (!target || target.dataset.touchGestureBound === "1") {
    return;
  }
  target.dataset.touchGestureBound = "1";
  let pinchStartDistance = 0;
  let pinchStartScale = 1;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let lastTapTime = 0;
  let moved = false;

  target.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length === 2) {
        pinchStartDistance = touchDistance(event.touches[0], event.touches[1]);
        pinchStartScale = Number(options.getScale?.() || 1);
        moved = true;
        return;
      }
      if (event.touches.length !== 1) {
        return;
      }
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      moved = false;
    },
    { passive: true }
  );

  target.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length === 2 && pinchStartDistance > 0) {
        event.preventDefault();
        const currentDistance = touchDistance(event.touches[0], event.touches[1]);
        if (currentDistance <= 0) {
          return;
        }
        const nextScale = pinchStartScale * (currentDistance / pinchStartDistance);
        options.onScale?.(nextScale);
        return;
      }
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        const dx = Math.abs(touch.clientX - touchStartX);
        const dy = Math.abs(touch.clientY - touchStartY);
        moved = moved || dx > 8 || dy > 8;
      }
    },
    { passive: false }
  );

  target.addEventListener(
    "touchend",
    (event) => {
      if (pinchStartDistance > 0 && event.touches.length < 2) {
        pinchStartDistance = 0;
      }
      const changed = event.changedTouches[0];
      if (!changed) {
        return;
      }
      const duration = Date.now() - touchStartTime;
      const dx = changed.clientX - touchStartX;
      const dy = changed.clientY - touchStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (!moved && duration < 260) {
        const now = Date.now();
        if (now - lastTapTime < 280) {
          options.onDoubleTap?.(changed.clientX, changed.clientY);
          if (!options.onDoubleTap) {
            options.onReset?.(changed.clientX, changed.clientY);
          }
          lastTapTime = 0;
        } else {
          lastTapTime = now;
        }
      }

      if (duration < 480 && absX > 64 && absX > absY * 1.2) {
        options.onSwipe?.(dx > 0 ? 1 : -1);
      }
    },
    { passive: true }
  );
}

function touchDistance(touchA, touchB) {
  const dx = touchA.clientX - touchB.clientX;
  const dy = touchA.clientY - touchB.clientY;
  return Math.hypot(dx, dy);
}

function refreshPairViewportFit(viewport) {
  if (!viewport) {
    return;
  }
  const composite = viewport.querySelector(".pair-composite");
  if (!composite) {
    return;
  }
  const quarter = normalizeQuarter(Number(viewport.dataset.rotationQuarter || 0));
  const scale = computeViewportFitScale(viewport, composite, quarter, "fit");
  composite.style.setProperty("--fit-scale", String(scale));
  clampCompositePan(viewport, composite, false);
}

function refreshPreviewViewportFit() {
  const quarter = normalizeQuarter(Number(refs.previewPairComposite.dataset.rotationQuarter || 0));
  const scale = computeViewportFitScale(refs.previewPairViewport, refs.previewPairComposite, quarter, state.previewFitMode);
  refs.previewPairComposite.style.setProperty("--fit-scale", String(scale));
  refs.previewPairComposite.style.setProperty("--preview-zoom", state.previewFitMode === "full" ? "1.12" : "1");
  clampCompositePan(refs.previewPairViewport, refs.previewPairComposite, false);
}

function scheduleRefreshViewportFits() {
  if (state.viewportFitTick) {
    cancelAnimationFrame(state.viewportFitTick);
  }
  state.viewportFitTick = requestAnimationFrame(() => {
    state.viewportFitTick = 0;
    document.querySelectorAll(".pair-viewport").forEach((viewport) => {
      refreshPairViewportFit(viewport);
    });
    if (!refs.previewPairWrap.hidden) {
      refreshPreviewViewportFit();
    }
  });
}

function computeViewportFitScale(viewport, composite, quarter, mode) {
  if (!viewport || !composite) {
    return 1;
  }
  const viewportRect = viewport.getBoundingClientRect();
  const style = getComputedStyle(viewport);
  const paddingX = parseFloat(style.paddingLeft || "0") + parseFloat(style.paddingRight || "0");
  const paddingY = parseFloat(style.paddingTop || "0") + parseFloat(style.paddingBottom || "0");
  const availableW = Math.max(120, viewportRect.width - paddingX);
  const availableH = Math.max(120, viewportRect.height - paddingY);

  const baseWidth = composite.offsetWidth || Math.min(availableW, 560);
  const baseHeight = composite.offsetHeight || baseWidth / COMPOSITE_BASE_RATIO;
  const rotatedWidth = quarter % 2 === 0 ? baseWidth : baseHeight;
  const rotatedHeight = quarter % 2 === 0 ? baseHeight : baseWidth;
  const fitScale = Math.min(availableW / rotatedWidth, availableH / rotatedHeight);
  const normalized = Math.max(0.42, Math.min(1.35, fitScale * 0.985));
  if (mode === "full") {
    return Math.max(0.42, Math.min(1.4, normalized * 1.08));
  }
  return normalized;
}

function computeOverlayAspectRatio() {
  const widthFactor = 1 - (state.overlayTune.left + state.overlayTune.right) / 100;
  const heightFactor = 1 - (state.overlayTune.top + state.overlayTune.bottom) / 100;
  const safeWidth = Math.max(0.2, widthFactor);
  const safeHeight = Math.max(0.2, heightFactor);
  return COMPOSITE_BASE_RATIO * (safeWidth / safeHeight);
}

function updateCompositeSafeImageFit(composite, imageElement) {
  if (!composite || !imageElement) {
    return;
  }
  const applyFit = () => {
    const naturalW = imageElement.naturalWidth;
    const naturalH = imageElement.naturalHeight;
    if (!naturalW || !naturalH) {
      return;
    }
    const imageRatio = naturalW / naturalH;
    const overlayRatio = computeOverlayAspectRatio();
    const drift = imageRatio / overlayRatio;
    const fitMode = drift > 1.36 || drift < 0.68 ? "contain" : "cover";
    composite.style.setProperty("--pair-image-fit", fitMode);
    composite.style.setProperty("--pair-image-bg", fitMode === "contain" ? "rgba(245,245,245,0.95)" : "#ffffff");
  };
  if (imageElement.complete && imageElement.naturalWidth > 0) {
    applyFit();
  } else {
    imageElement.addEventListener("load", applyFit, { once: true });
  }
}

function setupPreviewPressZoom() {
  const target = refs.previewPairViewport;
  if (!target || target.dataset.pressZoomBound === "1") {
    return;
  }
  target.dataset.pressZoomBound = "1";
  let timer = null;
  let pressing = false;

  const clear = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pressing = false;
    refs.previewPairComposite.classList.remove("is-press-zoom");
  };

  target.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || refs.previewPairWrap.hidden) {
      return;
    }
    clear();
    pressing = true;
    timer = setTimeout(() => {
      if (pressing && !refs.previewPairWrap.hidden) {
        refs.previewPairComposite.classList.add("is-press-zoom");
      }
    }, 280);
  });

  target.addEventListener("pointerup", clear);
  target.addEventListener("pointerleave", clear);
  target.addEventListener("pointercancel", clear);
}

function rotateLayoutDirection(deltaQuarter) {
  const order = ["up", "right", "down", "left"];
  const currentIndex = order.indexOf(state.layoutDirection);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const delta = Number(deltaQuarter) || 1;
  const nextIndex = (safeIndex + delta + order.length) % order.length;
  setLayoutDirection(order[nextIndex]);
}

function renderFocusView() {
  document.body.classList.toggle("focus-mode", state.focusView);
  refs.focusModeBtn.textContent = state.focusView ? "退出专注" : "专注视图";
}

function toggleFocusView(force) {
  const next = typeof force === "boolean" ? force : !state.focusView;
  state.focusView = next;
  renderFocusView();
  persistUiPreference();
  setSummary(next ? "已进入专注视图。按 Esc 可退出。" : "已退出专注视图。", false);
}

async function toggleFullscreenMode() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      refs.fullscreenBtn.textContent = "退出全屏";
      return;
    }
    await document.exitFullscreen();
    refs.fullscreenBtn.textContent = "全屏";
  } catch (error) {
    setSummary("当前浏览器不支持全屏或被拦截。", true);
  }
}

function renderDualModePanel() {
  refs.dualModePanel.hidden = !state.dualMode;
  refs.toggleDualModeBtn.textContent = state.dualMode ? "关闭双人模式" : "开启双人模式";
}

function toggleDualMode(force) {
  if (state.readonlyMode) {
    setSummary("只读分享模式下不能切换双人模式。", true);
    return;
  }
  const next = typeof force === "boolean" ? force : !state.dualMode;
  state.dualMode = next;
  renderDualModePanel();
  if (state.currentSession) {
    state.currentSession.dualMode = next;
    syncDualNotesToSession();
  }
  persistUiPreference();
  persistCurrentSessionSnapshot();
}

function syncDualNotesToSession() {
  renderWorkflowSteps();
  if (!state.currentSession) {
    persistCurrentSessionSnapshot();
    return;
  }
  state.currentSession.dualMode = Boolean(state.dualMode);
  state.currentSession.dualNotes = {
    a: refs.dualNoteA.value.trim(),
    b: refs.dualNoteB.value.trim()
  };
  syncCurrentSessionToHistory();
  persistCurrentSessionSnapshot();
}

function toggleImmersiveMode(force) {
  const next = typeof force === "boolean" ? force : !state.immersive;
  state.immersive = next;
  document.body.classList.toggle("immersive-mode", next);
  refs.immersiveBtn.textContent = next ? "退出沉浸" : "沉浸模式";
  setSummary(next ? "已进入沉浸模式（Esc 可退出）。" : "已退出沉浸模式。", false);
}

function persistOverlayTune() {
  localStorage.setItem(OVERLAY_TUNE_STORAGE_KEY, JSON.stringify(state.overlayTune));
}

function hydrateOverlayTune() {
  try {
    const raw = localStorage.getItem(OVERLAY_TUNE_STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return;
    }
    state.overlayTune = {
      left: normalizeOverlayValue(parsed.left, DEFAULT_OVERLAY_TUNE.left),
      right: normalizeOverlayValue(parsed.right, DEFAULT_OVERLAY_TUNE.right),
      top: normalizeOverlayValue(parsed.top, DEFAULT_OVERLAY_TUNE.top),
      bottom: normalizeOverlayValue(parsed.bottom, DEFAULT_OVERLAY_TUNE.bottom)
    };
  } catch (error) {
    console.warn("hydrateOverlayTune failed", error);
  }
}

function normalizeOverlayValue(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(6, Math.min(24, Math.round(numeric * 10) / 10));
}

function isLocalCardsAsset(url) {
  if (typeof url !== "string") {
    return false;
  }
  const source = url.trim();
  if (!source || source.startsWith("data:")) {
    return false;
  }
  if (/^(?:\.?\/)?cards\//i.test(source)) {
    return true;
  }
  try {
    const parsed = new URL(source, window.location.href);
    return parsed.origin === window.location.origin && parsed.pathname.startsWith("/cards/");
  } catch (error) {
    return false;
  }
}

function withCacheBust(url) {
  if (!isLocalCardsAsset(url)) {
    return url;
  }
  const marker = `rev=${APP_ASSET_VERSION}`;
  if (url.includes(marker)) {
    return url;
  }
  return `${url}${url.includes("?") ? "&" : "?"}${marker}`;
}

function getImageUrlCandidates(url) {
  if (typeof url !== "string" || !url.trim()) {
    return [];
  }
  const source = url.trim();
  const match = source.match(/^(.*)\.(webp|jpe?g|png)(\?.*)?$/i);
  if (!match) {
    return [source];
  }
  const [, base, extRaw, query = ""] = match;
  const ext = extRaw.toLowerCase();
  const candidates = [source];
  if (ext === "webp") {
    candidates.push(`${base}.jpg${query}`, `${base}.jpeg${query}`, `${base}.png${query}`);
  } else {
    candidates.push(`${base}.webp${query}`);
  }
  const busted = candidates.map((candidate) => withCacheBust(candidate));
  return Array.from(new Set([...candidates, ...busted]));
}

function loadImageElement(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.loading = "eager";
    image.onload = () => resolve({ url, image });
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

async function tryLoadImageViaFetch(url) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return null;
    }
    const blob = await response.blob();
    if (!blob || blob.size <= 0) {
      return null;
    }
    const objectUrl = URL.createObjectURL(blob);
    const loaded = await loadImageElement(objectUrl);
    if (!loaded) {
      URL.revokeObjectURL(objectUrl);
      return null;
    }
    return loaded;
  } catch (error) {
    return null;
  }
}

async function tryLoadImageCandidate(url) {
  const direct = await loadImageElement(url);
  if (direct) {
    return direct;
  }
  return await tryLoadImageViaFetch(url);
}

function cacheResolvedImage(originalUrl, resolvedUrl, image) {
  if (!originalUrl || !resolvedUrl || !image) {
    return;
  }
  state.preloadedImageUrls.add(originalUrl);
  state.preloadedImageUrls.add(resolvedUrl);
  state.resolvedImageUrlCache.set(originalUrl, resolvedUrl);
  if (!state.thumbnailCache.has(originalUrl) || !state.thumbnailCache.has(resolvedUrl)) {
    const thumb = createThumbnailData(image);
    if (thumb) {
      state.thumbnailCache.set(originalUrl, thumb);
      state.thumbnailCache.set(resolvedUrl, thumb);
    }
  }
}

function resolveImageUrl(url) {
  if (!url) {
    return Promise.resolve(null);
  }
  if (state.resolvedImageUrlCache.has(url) && state.resolvedImageUrlCache.get(url)) {
    return Promise.resolve(state.resolvedImageUrlCache.get(url));
  }
  if (state.resolvingImageUrlTasks.has(url)) {
    return state.resolvingImageUrlTasks.get(url);
  }
  const task = (async () => {
    const candidates = getImageUrlCandidates(url);
    for (const candidate of candidates) {
      const loaded = await tryLoadImageCandidate(candidate);
      if (!loaded) {
        continue;
      }
      cacheResolvedImage(url, loaded.url, loaded.image);
      return loaded.url;
    }
    return null;
  })();
  state.resolvingImageUrlTasks.set(url, task);
  task.finally(() => {
    state.resolvingImageUrlTasks.delete(url);
  });
  return task;
}

function preloadImageUrl(url) {
  if (!url) {
    return Promise.resolve(null);
  }
  if (state.preloadedImageTasks.has(url)) {
    return state.preloadedImageTasks.get(url);
  }
  const task = resolveImageUrl(url).then((resolved) => {
    if (!resolved) {
      state.preloadedImageTasks.delete(url);
    }
    return resolved;
  });
  state.preloadedImageTasks.set(url, task);
  return task;
}

function createThumbnailData(image) {
  try {
    const maxHeight = 120;
    const ratio = maxHeight / Math.max(1, image.naturalHeight);
    const width = Math.max(28, Math.round(image.naturalWidth * ratio));
    const height = Math.max(36, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return "";
    }
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.5);
  } catch (error) {
    return "";
  }
}

function deriveImageCardLabel(url) {
  if (!url) {
    return "未知卡牌";
  }
  try {
    const clean = String(url).split("?")[0];
    const file = clean.split("/").pop() || clean;
    const noExt = file.replace(/\.(webp|jpe?g|png)$/i, "");
    return decodeURIComponent(noExt);
  } catch (error) {
    return "未知卡牌";
  }
}

function ensureImageFailureUi(element) {
  const host = element?.parentElement;
  if (!host) {
    return null;
  }
  if (host.dataset.imageHostChecked !== "1") {
    host.dataset.imageHostChecked = "1";
    const computedPosition = window.getComputedStyle(host).position;
    if (!computedPosition || computedPosition === "static") {
      host.style.position = "relative";
    }
  }
  let panel = host.querySelector(".image-fail-ui");
  if (panel) {
    return panel;
  }
  panel = document.createElement("div");
  panel.className = "image-fail-ui";
  panel.hidden = true;
  panel.innerHTML = `
    <p class="image-fail-title">图片加载失败</p>
    <p class="image-fail-code"></p>
    <button class="btn btn-ghost btn-small image-fail-retry" type="button">重试</button>
  `;
  const retryBtn = panel.querySelector(".image-fail-retry");
  retryBtn?.addEventListener("click", () => {
    const target = panel.__targetElement;
    const requested = target?.dataset.requestedSrc || target?.dataset.fullSrc || "";
    if (!target || !requested) {
      return;
    }
    state.resolvedImageUrlCache.delete(requested);
    state.preloadedImageTasks.delete(requested);
    state.resolvingImageUrlTasks.delete(requested);
    applySmartImageSource(target, requested);
  });
  host.appendChild(panel);
  return panel;
}

function shouldSuppressFailureUiByContext(element) {
  const host = element?.parentElement;
  if (!host) {
    return false;
  }
  return (
    host.classList.contains("pair-image-overlay") ||
    host.classList.contains("pair-word-base") ||
    host.classList.contains("preview-image-overlay") ||
    host.classList.contains("preview-word-base")
  );
}

function bindSmartImageLifecycle(element) {
  if (!element || element.dataset.smartLifecycleBound === "1") {
    return;
  }
  element.dataset.smartLifecycleBound = "1";
  element.addEventListener("load", () => {
    element.classList.remove("smart-thumb-loading");
    hideImageFailureUi(element);
    const current = element.currentSrc || element.src;
    if (current) {
      element.dataset.lastGoodSrc = current;
      element.dataset.fullSrc = current;
      element.dataset.previewSrc = current;
    }
  });
  element.addEventListener("error", () => {
    const requested = element.dataset.requestedSrc || element.dataset.fullSrc || "";
    if (!requested || requested.startsWith("data:")) {
      return;
    }
    if (element.dataset.domErrorRetryOnce !== "1") {
      element.dataset.domErrorRetryOnce = "1";
      state.resolvedImageUrlCache.delete(requested);
      state.preloadedImageTasks.delete(requested);
      state.resolvingImageUrlTasks.delete(requested);
      setTimeout(() => {
        if (element.dataset.requestedSrc !== requested) {
          return;
        }
        applySmartImageSource(element, requested, {
          suppressFailureUi: shouldSuppressFailureUiByContext(element)
        });
      }, 180);
      return;
    }
    delete element.dataset.domErrorRetryOnce;
    showImageFailureUi(element, requested);
  });
}

function showImageFailureUi(element, requestedUrl) {
  const lastGoodSrc = element?.dataset?.lastGoodSrc || "";
  if (lastGoodSrc) {
    if ((element.currentSrc || element.src) !== lastGoodSrc) {
      element.src = lastGoodSrc;
    }
    element.dataset.fullSrc = lastGoodSrc;
    element.dataset.previewSrc = lastGoodSrc;
    hideImageFailureUi(element);
    return;
  }
  const fallback = buildImageFallbackData(deriveImageCardLabel(requestedUrl));
  element.src = fallback;
  element.dataset.fullSrc = fallback;
  element.dataset.previewSrc = fallback;
  hideImageFailureUi(element);
}

function hideImageFailureUi(element) {
  const panel = ensureImageFailureUi(element);
  if (!panel) {
    return;
  }
  panel.hidden = true;
  element.classList.remove("image-load-failed");
}

function applySmartImageSource(element, url, options = {}) {
  if (!element || !url) {
    return;
  }
  element.loading = "eager";
  element.decoding = "async";
  bindSmartImageLifecycle(element);
  const suppressFailureUi = Boolean(options?.suppressFailureUi);
  hideImageFailureUi(element);
  element.dataset.requestedSrc = url;
  const cachedResolvedUrl = state.resolvedImageUrlCache.get(url);
  if (cachedResolvedUrl) {
    element.dataset.fullSrc = cachedResolvedUrl;
    element.dataset.previewSrc = cachedResolvedUrl;
  } else {
    element.dataset.fullSrc = url;
    element.dataset.previewSrc = url;
  }
  const thumb = state.thumbnailCache.get(url) || (cachedResolvedUrl ? state.thumbnailCache.get(cachedResolvedUrl) : "");
  if (thumb) {
    element.src = thumb;
    element.classList.add("smart-thumb-loading");
  } else if (cachedResolvedUrl) {
    element.src = cachedResolvedUrl;
  } else {
    element.src = url;
  }
  preloadImageUrl(url).then((resolvedUrl) => {
    if (element.dataset.requestedSrc !== url) {
      return;
    }
    if (!resolvedUrl) {
      if (element.dataset.retryingImageOnce !== "1") {
        element.dataset.retryingImageOnce = "1";
        setTimeout(() => {
          if (element.dataset.requestedSrc === url) {
            applySmartImageSource(element, url, options);
          }
        }, 360);
        return;
      }
      delete element.dataset.retryingImageOnce;
      element.classList.remove("smart-thumb-loading");
      const lastGoodSrc = element.dataset.lastGoodSrc || "";
      if (lastGoodSrc) {
        if ((element.currentSrc || element.src) !== lastGoodSrc) {
          element.src = lastGoodSrc;
        }
        element.dataset.fullSrc = lastGoodSrc;
        element.dataset.previewSrc = lastGoodSrc;
        hideImageFailureUi(element);
        return;
      }
      if (suppressFailureUi && (element.currentSrc || element.src)) {
        hideImageFailureUi(element);
        return;
      }
      if (element.complete && Number(element.naturalWidth || 0) > 0) {
        hideImageFailureUi(element);
        return;
      }
      showImageFailureUi(element, url);
      return;
    }
    delete element.dataset.retryingImageOnce;
    element.dataset.fullSrc = resolvedUrl;
    element.dataset.previewSrc = resolvedUrl;
    if (element.src !== resolvedUrl) {
      element.src = resolvedUrl;
    }
    element.classList.remove("smart-thumb-loading");
    hideImageFailureUi(element);
  });
}

function preloadCards(cards) {
  (cards || []).forEach((card) => {
    const kind = getCardKind(card);
    if (kind === "pair") {
      preloadImageUrl(card.imageCard?.image);
      preloadImageUrl(card.wordCard?.image);
      return;
    }
    preloadImageUrl(card.image);
  });
}

function preloadNextRoundCandidates(count) {
  try {
    const nextCards = drawCards(Math.max(1, count));
    preloadCards(nextCards);
  } catch (error) {
    console.warn("preloadNextRoundCandidates failed", error);
  }
}

function warmupPreload() {
  const imageWarmup = state.imageDeck.slice(0, 18).map((card) => ({ ...card, kind: "image" }));
  const wordWarmup = state.wordDeck.slice(0, 18).map((card) => ({ ...card, kind: "word" }));
  preloadCards([...imageWarmup, ...wordWarmup]);
}

function toWebpPath(url) {
  if (typeof url !== "string") {
    return "";
  }
  return url.replace(/\.(jpg|jpeg|png)(\?.*)?$/i, ".webp$2");
}

function shouldProbeWebp(url) {
  return typeof url === "string" && /^\.\/cards\//.test(url) && /\.(jpg|jpeg|png)(\?.*)?$/i.test(url);
}

async function probeBundledWebp(imageDeck, wordDeck) {
  if (state.bundledWebpAvailable) {
    return true;
  }
  const sampleImage = imageDeck.find((card) => shouldProbeWebp(card.image))?.image;
  const sampleWord = wordDeck.find((card) => shouldProbeWebp(card.image))?.image;
  if (!sampleImage || !sampleWord) {
    return false;
  }
  try {
    const [imageRes, wordRes] = await Promise.all([
      fetch(toWebpPath(sampleImage), { cache: "no-store" }),
      fetch(toWebpPath(sampleWord), { cache: "no-store" })
    ]);
    state.bundledWebpAvailable = imageRes.ok && wordRes.ok;
  } catch (error) {
    state.bundledWebpAvailable = false;
  }
  return state.bundledWebpAvailable;
}

function applyWebpDeck(deck) {
  return deck.map((card) => {
    if (!shouldProbeWebp(card.image)) {
      return card;
    }
    return { ...card, image: toWebpPath(card.image) };
  });
}

async function exportSessionAsset(type) {
  if (state.currentCards.length === 0) {
    setSummary("请先抽卡，再导出复盘。", true);
    return;
  }
  try {
    if (type === "consult") {
      const text = buildConsultReportText();
      downloadBlob(new Blob([text], { type: "text/markdown;charset=utf-8" }), buildExportFilename("md").replace("oh-report", "oh-consult-report"));
      markExportCompleted();
      setSummary("已导出咨询报告版（Markdown）。", false);
      return;
    }

    if (type === "homework") {
      const text = buildHomeworkSheetText();
      downloadBlob(new Blob([text], { type: "text/markdown;charset=utf-8" }), buildExportFilename("md").replace("oh-report", "oh-homework-sheet"));
      markExportCompleted();
      setSummary("已导出作业版（Markdown）。", false);
      return;
    }

    if (type === "poster") {
      const posterCanvas = await buildPosterCanvas();
      posterCanvas.toBlob((blob) => {
        if (!blob) {
          setSummary("导出海报失败。", true);
          return;
        }
        downloadBlob(blob, buildExportFilename("png").replace("oh-report", "oh-poster"));
        markExportCompleted();
        setSummary("已导出卡面海报 PNG。", false);
      }, "image/png");
      return;
    }

    if (type === "a4pdf") {
      const canvas = await buildSessionCanvas();
      const PdfClass = window.jspdf?.jsPDF;
      if (!PdfClass) {
        setSummary("PDF 组件未加载，无法导出 A4。", true);
        return;
      }
      const pdf = new PdfClass({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 10;
      const availableW = pageW - margin * 2;
      const availableH = pageH - margin * 2;
      const imageRatio = canvas.width / canvas.height;
      const boxRatio = availableW / availableH;
      let drawW = availableW;
      let drawH = availableH;
      if (imageRatio > boxRatio) {
        drawH = drawW / imageRatio;
      } else {
        drawW = drawH * imageRatio;
      }
      const x = (pageW - drawW) / 2;
      const y = margin + (availableH - drawH) / 2;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, drawW, drawH);
      pdf.save(buildExportFilename("pdf").replace("oh-report", "oh-a4-report"));
      markExportCompleted();
      setSummary("已导出可打印 A4 PDF。", false);
      return;
    }

    const canvas = await buildSessionCanvas();
    if (type === "png") {
      canvas.toBlob((blob) => {
        if (!blob) {
          setSummary("导出 PNG 失败。", true);
          return;
        }
        downloadBlob(blob, buildExportFilename("png"));
        markExportCompleted();
        setSummary("已导出复盘 PNG。", false);
      }, "image/png");
      return;
    }
    const PdfClass = window.jspdf?.jsPDF;
    if (!PdfClass) {
      setSummary("PDF 组件未加载，已建议先导出 PNG。", true);
      return;
    }
    const pdf = new PdfClass({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(buildExportFilename("pdf"));
    markExportCompleted();
    setSummary("已导出复盘 PDF。", false);
  } catch (error) {
    console.error("exportSessionAsset failed", error);
    setSummary(`导出失败：${error.message || "未知错误"}`, true);
  }
}

function markExportCompleted() {
  if (!state.currentSession) {
    return;
  }
  const exportTime = new Date().toISOString();
  state.currentSession.lastExportAt = exportTime;
  syncCurrentSessionToHistory();
  renderWorkflowSteps();
}

function buildExportFilename(ext) {
  const stamp = new Date();
  const time = `${stamp.getFullYear()}${pad2(stamp.getMonth() + 1)}${pad2(stamp.getDate())}-${pad2(stamp.getHours())}${pad2(
    stamp.getMinutes()
  )}`;
  return `oh-report-${time}.${ext}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function buildPosterCanvas() {
  const cards = state.currentCards.slice(0, 5);
  const columns = cards.length >= 4 ? 2 : cards.length;
  const rows = Math.ceil(cards.length / columns);
  const cardWidth = 560;
  const cardHeight = Math.round((cardWidth * 1312) / 1045);
  const gap = 28;
  const padding = 42;
  const canvasWidth = padding * 2 + columns * cardWidth + (columns - 1) * gap;
  const canvasHeight = padding * 2 + rows * cardHeight + (rows - 1) * gap + 88;
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("海报画布初始化失败");
  }
  ctx.fillStyle = "#f8f3ea";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2d261f";
  ctx.font = "700 42px 'Noto Serif SC', serif";
  ctx.fillText("OH Card Poster", padding, 58);
  ctx.font = "400 18px 'Noto Serif SC', serif";
  ctx.fillStyle = "#655444";
  ctx.fillText(new Date().toLocaleString(), padding, 84);

  for (let index = 0; index < cards.length; index += 1) {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const x = padding + col * (cardWidth + gap);
    const y = padding + 92 + row * (cardHeight + gap);
    await drawExportCard(ctx, cards[index], x, y, cardWidth, cardHeight);
  }

  return canvas;
}

async function buildSessionCanvas() {
  const cards = state.currentCards.slice();
  const mode = MODES[state.modeId];
  const prompts = Array.from(refs.promptList.querySelectorAll("li")).map((item) => item.textContent || "");
  const questionText = refs.questionInput.value.trim() || "（未填写）";
  const noteText = refs.noteInput.value.trim() || "（未填写）";
  const cardCount = cards.length;

  const cardWidth = 320;
  const cardHeight = Math.round((cardWidth * 1312) / 1045);
  const cardGap = 24;
  const boardCols = Math.max(1, Math.min(3, cardCount));
  const boardWidth = boardCols * cardWidth + (boardCols - 1) * cardGap;
  const canvasWidth = Math.max(1300, boardWidth + 120);

  const baseLines = [
    "【OH 卡复盘】",
    `问题：${questionText}`,
    `玩法：${mode.name} / ${DECK_TYPES[state.deckTypeId].name} / ${LAYOUT_DIRECTIONS[state.layoutDirection].name}`,
    `牌面：${cards.map((card) => getCardShortName(card)).join(" / ")}`
  ];
  const promptLines = prompts.map((line, index) => `${index + 1}. ${line}`);
  const noteLines = wrapTextLines(noteText, 52);
  const textLineCount = baseLines.length + promptLines.length + noteLines.length + 4;
  const textHeight = textLineCount * 26;
  const canvasHeight = 120 + cardHeight + 40 + textHeight + 80;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("画布上下文创建失败");
  }

  ctx.fillStyle = "#fbf8f1";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#2b241d";
  ctx.font = "700 34px 'Noto Serif SC', serif";
  ctx.fillText("OH 卡复盘导出", 44, 56);
  ctx.font = "400 18px 'Noto Serif SC', serif";
  ctx.fillStyle = "#5a4b3f";
  ctx.fillText(new Date().toLocaleString(), 44, 86);

  const boardX = Math.floor((canvas.width - boardWidth) / 2);
  const boardY = 120;
  for (let i = 0; i < cards.length; i += 1) {
    const card = cards[i];
    const x = boardX + i * (cardWidth + cardGap);
    const y = boardY;
    await drawExportCard(ctx, card, x, y, cardWidth, cardHeight);
    ctx.fillStyle = "#3e3228";
    ctx.font = "600 17px 'Noto Serif SC', serif";
    ctx.fillText(getActiveSlotLabels(mode)[i] || `位置 ${i + 1}`, x, y - 10);
  }

  let textY = boardY + cardHeight + 38;
  ctx.font = "500 20px 'Noto Serif SC', serif";
  ctx.fillStyle = "#2f261f";
  baseLines.forEach((line) => {
    ctx.fillText(line, 44, textY);
    textY += 30;
  });
  ctx.fillText("引导问题：", 44, textY);
  textY += 30;
  ctx.font = "400 18px 'Noto Serif SC', serif";
  promptLines.forEach((line) => {
    ctx.fillText(line, 60, textY);
    textY += 26;
  });
  ctx.font = "600 20px 'Noto Serif SC', serif";
  ctx.fillText("行动笔记：", 44, textY);
  textY += 30;
  ctx.font = "400 18px 'Noto Serif SC', serif";
  noteLines.forEach((line) => {
    ctx.fillText(line, 60, textY);
    textY += 26;
  });

  return canvas;
}

async function drawExportCard(ctx, card, x, y, width, height) {
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "rgba(126, 98, 69, 0.35)";
  ctx.lineWidth = 2;
  roundedRectPath(ctx, x, y, width, height, 16);
  ctx.fill();
  ctx.stroke();

  const kind = getCardKind(card);
  if (kind === "pair") {
    const wordImage = await loadImageForCanvas(card.wordCard.image);
    if (wordImage) {
      drawImageContain(ctx, wordImage, x, y, width, height);
    }
    const overlayX = x + (state.overlayTune.left / 100) * width;
    const overlayY = y + (state.overlayTune.top / 100) * height;
    const overlayW = width - ((state.overlayTune.left + state.overlayTune.right) / 100) * width;
    const overlayH = height - ((state.overlayTune.top + state.overlayTune.bottom) / 100) * height;
    const image = await loadImageForCanvas(card.imageCard.image);
    if (image) {
      roundedClip(ctx, overlayX, overlayY, overlayW, overlayH, 10);
      drawImageCover(ctx, image, overlayX, overlayY, overlayW, overlayH);
      ctx.restore();
    }
    return;
  }
  if (card.image) {
    const image = await loadImageForCanvas(card.image);
    if (image) {
      drawImageContain(ctx, image, x, y, width, height);
    }
  }
}

const exportImageCache = new Map();

async function loadImageForCanvas(url) {
  if (!url) {
    return null;
  }
  if (exportImageCache.has(url)) {
    return exportImageCache.get(url);
  }
  const promise = (async () => {
    const resolvedUrl = (await resolveImageUrl(url)) || url;
    return await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = resolvedUrl;
    });
  })();
  exportImageCache.set(url, promise);
  return promise;
}

function drawImageContain(ctx, image, x, y, width, height) {
  const ratio = Math.min(width / image.width, height / image.height);
  const drawW = image.width * ratio;
  const drawH = image.height * ratio;
  const dx = x + (width - drawW) / 2;
  const dy = y + (height - drawH) / 2;
  ctx.drawImage(image, dx, dy, drawW, drawH);
}

function drawImageCover(ctx, image, x, y, width, height) {
  const ratio = Math.max(width / image.width, height / image.height);
  const drawW = image.width * ratio;
  const drawH = image.height * ratio;
  const dx = x + (width - drawW) / 2;
  const dy = y + (height - drawH) / 2;
  ctx.drawImage(image, dx, dy, drawW, drawH);
}

function wrapTextLines(text, maxChars) {
  const lines = [];
  const paragraphs = String(text || "").split(/\n+/);
  paragraphs.forEach((paragraph) => {
    let cursor = paragraph.trim();
    if (!cursor) {
      lines.push("");
      return;
    }
    while (cursor.length > maxChars) {
      lines.push(cursor.slice(0, maxChars));
      cursor = cursor.slice(maxChars);
    }
    lines.push(cursor);
  });
  return lines.length ? lines : ["（未填写）"];
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function roundedClip(ctx, x, y, width, height, radius) {
  ctx.save();
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.clip();
}

function uniqueValues(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

function cloneCards(cards) {
  return cards.map((card) => ({ ...card, keywords: Array.isArray(card.keywords) ? card.keywords.slice() : [] }));
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function normalizeHistoryEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries
    .filter((entry) => entry && Array.isArray(entry.cards) && typeof entry.id === "string")
    .map((entry) => {
      const question = typeof entry.question === "string" ? entry.question : "";
      const note = typeof entry.note === "string" ? entry.note : "";
      const modeId = entry.modeId in MODES ? entry.modeId : "focus";
      return {
        ...entry,
        modeId,
        deckTypeId: entry.deckTypeId in DECK_TYPES ? entry.deckTypeId : inferDeckTypeFromCards(entry.cards || []),
        layoutDirection: entry.layoutDirection in LAYOUT_DIRECTIONS ? entry.layoutDirection : "up",
        question,
        note,
        slotLabels: Array.isArray(entry.slotLabels) && entry.slotLabels.length
          ? entry.slotLabels.filter((item) => typeof item === "string")
          : getModeLabels(modeId, MODES[modeId].count),
        dualMode: Boolean(entry.dualMode),
        dualNotes: entry.dualNotes && typeof entry.dualNotes === "object"
          ? {
              a: typeof entry.dualNotes.a === "string" ? entry.dualNotes.a : "",
              b: typeof entry.dualNotes.b === "string" ? entry.dualNotes.b : ""
            }
          : { a: "", b: "" },
        actionPlan: normalizeActionPlan(entry.actionPlan),
        closure: entry.closure && typeof entry.closure === "object"
          ? {
              summary: typeof entry.closure.summary === "string" ? entry.closure.summary : "",
              action: typeof entry.closure.action === "string" ? entry.closure.action : "",
              support: typeof entry.closure.support === "string" ? entry.closure.support : ""
            }
          : { summary: "", action: "", support: "" },
        layerVisits: Array.isArray(entry.layerVisits)
          ? entry.layerVisits.filter((layer) => ["description", "association", "inquiry"].includes(layer))
          : [],
        protocol: entry.protocol && typeof entry.protocol === "object"
          ? {
              intent: typeof entry.protocol.intent === "string" ? entry.protocol.intent : "",
              consent: Boolean(entry.protocol.consent),
              emotion: Math.max(1, Math.min(5, Number(entry.protocol.emotion) || 3))
            }
          : { intent: "", consent: false, emotion: 3 },
        tags: Array.isArray(entry.tags) ? entry.tags : inferSessionTags(question, note, entry.cards || []),
        lastExportAt: typeof entry.lastExportAt === "string" ? entry.lastExportAt : ""
      };
    });
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return normalizeHistoryEntries(parsed);
  } catch (error) {
    console.error("loadHistory failed", error);
    return [];
  }
}

function persistHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
}

function loadCustomSlotLabels() {
  try {
    const raw = localStorage.getItem(SLOT_TEMPLATE_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    const output = {};
    Object.keys(MODES).forEach((modeId) => {
      if (!Array.isArray(parsed[modeId])) {
        return;
      }
      output[modeId] = parsed[modeId]
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, MODES[modeId].count);
    });
    return output;
  } catch (error) {
    return {};
  }
}

function persistCustomSlotLabels() {
  localStorage.setItem(SLOT_TEMPLATE_STORAGE_KEY, JSON.stringify(state.customSlotLabels || {}));
}

function loadCloudSyncConfig() {
  try {
    const raw = localStorage.getItem(CLOUD_SYNC_STORAGE_KEY);
    if (!raw) {
      return { endpoint: "", token: "" };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { endpoint: "", token: "" };
    }
    return {
      endpoint: typeof parsed.endpoint === "string" ? parsed.endpoint.trim() : "",
      token: typeof parsed.token === "string" ? parsed.token.trim() : ""
    };
  } catch (error) {
    return { endpoint: "", token: "" };
  }
}

function loadSessionProtocol() {
  try {
    const raw = localStorage.getItem(SESSION_PROTOCOL_STORAGE_KEY);
    if (!raw) {
      return { intent: "", consent: false, emotion: 3, paused: false };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { intent: "", consent: false, emotion: 3, paused: false };
    }
    return {
      intent: typeof parsed.intent === "string" ? parsed.intent.trim() : "",
      consent: Boolean(parsed.consent),
      emotion: Math.max(1, Math.min(5, Number(parsed.emotion) || 3)),
      paused: Boolean(parsed.paused)
    };
  } catch (error) {
    return { intent: "", consent: false, emotion: 3, paused: false };
  }
}

function persistSessionProtocol() {
  localStorage.setItem(
    SESSION_PROTOCOL_STORAGE_KEY,
    JSON.stringify({
      intent: state.protocol.intent || "",
      consent: Boolean(state.protocol.consent),
      emotion: Math.max(1, Math.min(5, Number(state.protocol.emotion) || 3)),
      paused: Boolean(state.protocol.paused)
    })
  );
}

function hydrateCloudSyncInputs() {
  refs.cloudEndpointInput.value = state.cloudSync.endpoint || "";
  refs.cloudTokenInput.value = state.cloudSync.token || "";
}

function persistCloudSyncConfigFromInputs() {
  state.cloudSync = {
    endpoint: refs.cloudEndpointInput.value.trim(),
    token: refs.cloudTokenInput.value.trim()
  };
  localStorage.setItem(CLOUD_SYNC_STORAGE_KEY, JSON.stringify(state.cloudSync));
  renderCloudSyncStatus("云同步配置已更新。");
}

function renderCloudSyncStatus(message = "") {
  const endpoint = state.cloudSync.endpoint ? "已配置 API" : "未配置 API";
  refs.cloudSyncStatus.textContent = message || `云同步状态：${endpoint}`;
}

function persistUiPreference() {
  const payload = {
    focusView: Boolean(state.focusView),
    dualMode: Boolean(state.dualMode),
    avoidRecent: Boolean(state.avoidRecent),
    promptStyleId: state.promptStyleId in PROMPT_STYLES ? state.promptStyleId : "balanced"
  };
  localStorage.setItem(UI_PREF_STORAGE_KEY, JSON.stringify(payload));
}

function hydrateUiPreference() {
  try {
    const raw = localStorage.getItem(UI_PREF_STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return;
    }
    state.focusView = Boolean(parsed.focusView);
    state.dualMode = Boolean(parsed.dualMode);
    state.avoidRecent = parsed.avoidRecent !== false;
    state.promptStyleId = parsed.promptStyleId in PROMPT_STYLES ? parsed.promptStyleId : "balanced";
  } catch (error) {
    console.warn("hydrateUiPreference failed", error);
  }
}

function buildCurrentSessionSnapshot() {
  if (!state.currentSession || state.currentCards.length === 0) {
    return null;
  }
  return {
    modeId: state.modeId,
    deckTypeId: state.deckTypeId,
    layoutDirection: state.layoutDirection,
    layerId: state.layerId,
    promptStyleId: state.promptStyleId,
    avoidRecent: Boolean(state.avoidRecent),
    question: refs.questionInput.value.trim(),
    note: refs.noteInput.value.trim(),
    dualMode: Boolean(state.dualMode),
    dualNotes: {
      a: refs.dualNoteA.value.trim(),
      b: refs.dualNoteB.value.trim()
    },
    protocol: {
      intent: state.protocol.intent || "",
      consent: Boolean(state.protocol.consent),
      emotion: Number(state.protocol.emotion || 3),
      paused: Boolean(state.protocol.paused)
    },
    currentCards: state.currentCards,
    currentSession: {
      ...state.currentSession,
      slotLabels: getActiveSlotLabels(MODES[state.modeId]),
      layerVisits: getLayerVisitArray(),
      closure: { ...state.closure },
      protocol: {
        intent: state.protocol.intent || "",
        consent: Boolean(state.protocol.consent),
        emotion: Number(state.protocol.emotion || 3)
      },
      dualMode: Boolean(state.dualMode),
      dualNotes: {
        a: refs.dualNoteA.value.trim(),
        b: refs.dualNoteB.value.trim()
      }
    },
    time: new Date().toISOString()
  };
}

function persistCurrentSessionSnapshot() {
  if (state.readonlyMode) {
    return;
  }
  const snapshot = buildCurrentSessionSnapshot();
  if (!snapshot) {
    localStorage.removeItem(CURRENT_SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(CURRENT_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
}

function hydrateCurrentSessionSnapshot() {
  try {
    const raw = localStorage.getItem(CURRENT_SESSION_STORAGE_KEY);
    if (!raw) {
      return false;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.currentCards) || parsed.currentCards.length === 0) {
      return false;
    }
    state.modeId = parsed.modeId in MODES ? parsed.modeId : "focus";
    state.deckTypeId = parsed.deckTypeId in DECK_TYPES ? parsed.deckTypeId : inferDeckTypeFromCards(parsed.currentCards || []);
    state.layoutDirection = parsed.layoutDirection in LAYOUT_DIRECTIONS ? parsed.layoutDirection : "up";
    state.layerId = parsed.layerId && parsed.layerId in PROMPT_POOL ? parsed.layerId : "description";
    state.promptStyleId = parsed.promptStyleId in PROMPT_STYLES ? parsed.promptStyleId : state.promptStyleId;
    state.avoidRecent = parsed.avoidRecent !== false;
    if (parsed.protocol && typeof parsed.protocol === "object") {
      state.protocol = {
        intent: typeof parsed.protocol.intent === "string" ? parsed.protocol.intent : state.protocol.intent,
        consent: Boolean(parsed.protocol.consent),
        emotion: Math.max(1, Math.min(5, Number(parsed.protocol.emotion) || 3)),
        paused: Boolean(parsed.protocol.paused)
      };
    }
    state.currentCards = parsed.currentCards;
    state.currentSession = parsed.currentSession && typeof parsed.currentSession === "object"
      ? {
          ...parsed.currentSession,
          slotLabels: Array.isArray(parsed.currentSession.slotLabels) && parsed.currentSession.slotLabels.length
            ? parsed.currentSession.slotLabels
            : getModeLabels(state.modeId, MODES[state.modeId].count),
          dualMode: Boolean(parsed.currentSession.dualMode),
          dualNotes: parsed.currentSession.dualNotes && typeof parsed.currentSession.dualNotes === "object"
            ? {
                a: typeof parsed.currentSession.dualNotes.a === "string" ? parsed.currentSession.dualNotes.a : "",
                b: typeof parsed.currentSession.dualNotes.b === "string" ? parsed.currentSession.dualNotes.b : ""
              }
            : { a: "", b: "" },
          actionPlan: normalizeActionPlan(parsed.currentSession.actionPlan),
          closure: parsed.currentSession.closure && typeof parsed.currentSession.closure === "object"
            ? {
                summary: typeof parsed.currentSession.closure.summary === "string" ? parsed.currentSession.closure.summary : "",
                action: typeof parsed.currentSession.closure.action === "string" ? parsed.currentSession.closure.action : "",
                support: typeof parsed.currentSession.closure.support === "string" ? parsed.currentSession.closure.support : ""
              }
            : { summary: "", action: "", support: "" },
          layerVisits: Array.isArray(parsed.currentSession.layerVisits)
            ? parsed.currentSession.layerVisits.filter((layer) => ["description", "association", "inquiry"].includes(layer))
            : []
        }
      : null;
    refs.questionInput.value = typeof parsed.question === "string" ? parsed.question : "";
    refs.noteInput.value = typeof parsed.note === "string" ? parsed.note : "";
    state.dualMode = Boolean(parsed.dualMode);
    refs.dualNoteA.value = typeof parsed.dualNotes?.a === "string" ? parsed.dualNotes.a : "";
    refs.dualNoteB.value = typeof parsed.dualNotes?.b === "string" ? parsed.dualNotes.b : "";
    state.layerVisits = new Set(state.currentSession?.layerVisits || []);
    state.closure = state.currentSession?.closure || { summary: "", action: "", support: "" };
    state.facilitator.stageIndex = getFacilitatorStageIndexByLayer(state.layerId);
    renderSessionProtocol();
    renderModeSwitch();
    renderModeDetail();
    renderDeckTypeSwitch();
    renderLayoutDirectionSwitch();
    renderPromptTabs();
    renderPromptStyleSwitch();
    renderDualModePanel();
    renderSlotEditor();
    renderSpread(state.currentCards, state.currentSession?.slotLabels || getModeLabels(state.modeId, MODES[state.modeId].count));
    renderPrompts(state.currentSession?.slotLabels);
    renderActionPlan();
    renderFacilitatorPanel();
    renderClosurePanel();
    renderWorkflowSteps();
    setSummary("已恢复上次未完成局面。", false);
    return true;
  } catch (error) {
    console.warn("hydrateCurrentSessionSnapshot failed", error);
    return false;
  }
}

function encodeBase64UrlFromObject(obj) {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64UrlToObject(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}

function buildSyncPayload() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    history: state.history,
    customDecks: {
      wordDeck: state.deckSource.word === "custom" ? state.wordDeck : null,
      imageDeck: state.deckSource.image === "custom" ? state.imageDeck : null
    },
    overlayTune: state.overlayTune,
    customSlotLabels: state.customSlotLabels,
    sessionProtocol: {
      intent: state.protocol.intent || "",
      consent: Boolean(state.protocol.consent),
      emotion: Number(state.protocol.emotion || 3),
      paused: false
    },
    uiPreference: {
      dualMode: state.dualMode,
      focusView: state.focusView,
      avoidRecent: Boolean(state.avoidRecent),
      promptStyleId: state.promptStyleId
    },
    currentSnapshot: buildCurrentSessionSnapshot()
  };
}

function applySyncPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("同步数据为空");
  }
  if (Array.isArray(payload.history)) {
    state.history = normalizeHistoryEntries(payload.history);
    persistHistory();
  }
  if (payload.customDecks && typeof payload.customDecks === "object") {
    if (Array.isArray(payload.customDecks.wordDeck) && payload.customDecks.wordDeck.length >= 5) {
      state.wordDeck = payload.customDecks.wordDeck.map((entry) => normalizeWordCard(entry)).filter(Boolean);
      state.deckSource.word = "custom";
    }
    if (Array.isArray(payload.customDecks.imageDeck) && payload.customDecks.imageDeck.length >= 5) {
      state.imageDeck = payload.customDecks.imageDeck.map((entry) => normalizeImageCard(entry)).filter(Boolean);
      state.deckSource.image = "custom";
    }
    persistCustomDecks();
    renderDeckStatus();
  }
  if (payload.overlayTune && typeof payload.overlayTune === "object") {
    state.overlayTune = {
      left: normalizeOverlayValue(payload.overlayTune.left, DEFAULT_OVERLAY_TUNE.left),
      right: normalizeOverlayValue(payload.overlayTune.right, DEFAULT_OVERLAY_TUNE.right),
      top: normalizeOverlayValue(payload.overlayTune.top, DEFAULT_OVERLAY_TUNE.top),
      bottom: normalizeOverlayValue(payload.overlayTune.bottom, DEFAULT_OVERLAY_TUNE.bottom)
    };
    persistOverlayTune();
    renderOverlayTuneControls();
  }
  if (payload.customSlotLabels && typeof payload.customSlotLabels === "object") {
    state.customSlotLabels = payload.customSlotLabels;
    persistCustomSlotLabels();
  }
  if (payload.sessionProtocol && typeof payload.sessionProtocol === "object") {
    state.protocol = {
      intent: typeof payload.sessionProtocol.intent === "string" ? payload.sessionProtocol.intent.trim() : state.protocol.intent,
      consent: Boolean(payload.sessionProtocol.consent),
      emotion: Math.max(1, Math.min(5, Number(payload.sessionProtocol.emotion) || 3)),
      paused: false
    };
    persistSessionProtocol();
    renderSessionProtocol();
    detectSafetyRisk();
  }
  if (payload.uiPreference && typeof payload.uiPreference === "object") {
    state.dualMode = Boolean(payload.uiPreference.dualMode);
    state.focusView = Boolean(payload.uiPreference.focusView);
    state.avoidRecent = payload.uiPreference.avoidRecent !== false;
    state.promptStyleId = payload.uiPreference.promptStyleId in PROMPT_STYLES ? payload.uiPreference.promptStyleId : state.promptStyleId;
    persistUiPreference();
  }
  if (payload.currentSnapshot && typeof payload.currentSnapshot === "object") {
    localStorage.setItem(CURRENT_SESSION_STORAGE_KEY, JSON.stringify(payload.currentSnapshot));
    hydrateCurrentSessionSnapshot();
  }
  renderHistory();
  renderAnalytics();
  renderDeckStatus();
  renderSlotEditor();
  renderDualModePanel();
  renderFocusView();
  renderPromptStyleSwitch();
  renderFacilitatorPanel();
  renderClosurePanel();
}

async function pushCloudSync() {
  const endpoint = state.cloudSync.endpoint;
  if (!endpoint) {
    setSummary("请先填写 Cloud API URL。", true);
    return;
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(state.cloudSync.token ? { Authorization: `Bearer ${state.cloudSync.token}` } : {})
      },
      body: JSON.stringify(buildSyncPayload())
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    renderCloudSyncStatus("云端推送成功。");
    setSummary("已推送到云端。", false);
  } catch (error) {
    renderCloudSyncStatus(`云端推送失败：${error.message || "网络异常"}`);
    setSummary(`云端推送失败：${error.message || "网络异常"}`, true);
  }
}

async function pullCloudSync() {
  const endpoint = state.cloudSync.endpoint;
  if (!endpoint) {
    setSummary("请先填写 Cloud API URL。", true);
    return;
  }
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        ...(state.cloudSync.token ? { Authorization: `Bearer ${state.cloudSync.token}` } : {})
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    applySyncPayload(payload);
    renderCloudSyncStatus("云端拉取成功。");
    setSummary("已从云端拉取并应用。", false);
  } catch (error) {
    renderCloudSyncStatus(`云端拉取失败：${error.message || "网络异常"}`);
    setSummary(`云端拉取失败：${error.message || "网络异常"}`, true);
  }
}

async function exportSyncCode() {
  const code = `OHSYNC:${encodeBase64UrlFromObject(buildSyncPayload())}`;
  const copied = await copyText(code);
  if (!copied) {
    window.prompt("复制同步码", code);
  }
  setSummary("已生成同步码，可在另一台设备导入。", false);
}

function importSyncCode() {
  const raw = window.prompt("粘贴同步码");
  if (!raw) {
    return;
  }
  try {
    const code = raw.trim().replace(/^OHSYNC:/i, "");
    const payload = decodeBase64UrlToObject(code);
    applySyncPayload(payload);
    setSummary("同步码导入成功。", false);
  } catch (error) {
    setSummary("同步码无效，请检查后重试。", true);
  }
}

function buildReadonlySharePayload() {
  if (!state.currentSession || state.currentCards.length === 0) {
    return null;
  }
  return {
    version: 1,
    modeId: state.modeId,
    deckTypeId: state.deckTypeId,
    layoutDirection: state.layoutDirection,
    layerId: state.layerId,
    promptStyleId: state.promptStyleId,
    avoidRecent: Boolean(state.avoidRecent),
    protocol: {
      intent: state.protocol.intent || "",
      consent: Boolean(state.protocol.consent),
      emotion: Number(state.protocol.emotion || 3)
    },
    question: refs.questionInput.value.trim(),
    note: refs.noteInput.value.trim(),
    cards: state.currentCards,
    prompts: Array.from(refs.promptList.querySelectorAll("li")).map((item) => item.textContent || ""),
    slotLabels: getActiveSlotLabels(MODES[state.modeId]),
    layerVisits: getLayerVisitArray(),
    closure: { ...state.closure },
    dualMode: Boolean(state.dualMode),
    dualNotes: {
      a: refs.dualNoteA.value.trim(),
      b: refs.dualNoteB.value.trim()
    },
    time: new Date().toISOString()
  };
}

async function shareReadonlyLink() {
  const payload = buildReadonlySharePayload();
  if (!payload) {
    setSummary("请先抽卡后再分享。", true);
    return;
  }
  const encoded = encodeBase64UrlFromObject(payload);
  const link = `${location.origin}${location.pathname}#share=${encoded}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "OH Card Readonly", text: "查看本局 OH 卡解读", url: link });
      setSummary("已发起系统分享。", false);
      return;
    } catch (error) {
      // fallback to clipboard below
    }
  }
  const copied = await copyText(link);
  setSummary(copied ? "已复制只读分享链接。" : "复制失败，请手动复制地址栏链接。", !copied);
}

function hydrateReadonlySessionFromHash() {
  const hash = String(location.hash || "");
  if (!hash.startsWith("#share=")) {
    state.readonlyMode = false;
    applyReadonlyModeState();
    return false;
  }
  try {
    const encoded = hash.replace(/^#share=/, "");
    const payload = decodeBase64UrlToObject(encoded);
    if (!payload || !Array.isArray(payload.cards) || payload.cards.length === 0) {
      return false;
    }
    state.readonlyMode = true;
    state.modeId = payload.modeId in MODES ? payload.modeId : "focus";
    state.deckTypeId = payload.deckTypeId in DECK_TYPES ? payload.deckTypeId : inferDeckTypeFromCards(payload.cards || []);
    state.layoutDirection = payload.layoutDirection in LAYOUT_DIRECTIONS ? payload.layoutDirection : "up";
    state.layerId = payload.layerId in PROMPT_POOL ? payload.layerId : "description";
    state.promptStyleId = payload.promptStyleId in PROMPT_STYLES ? payload.promptStyleId : state.promptStyleId;
    state.avoidRecent = payload.avoidRecent !== false;
    if (payload.protocol && typeof payload.protocol === "object") {
      state.protocol = {
        intent: typeof payload.protocol.intent === "string" ? payload.protocol.intent : "",
        consent: Boolean(payload.protocol.consent),
        emotion: Math.max(1, Math.min(5, Number(payload.protocol.emotion) || 3)),
        paused: false
      };
    }
    resetLayerVisits();
    (Array.isArray(payload.layerVisits) ? payload.layerVisits : [state.layerId]).forEach((layer) => {
      if (layer in PROMPT_POOL) {
        markLayerVisited(layer);
      }
    });
    state.currentCards = payload.cards;
    state.dualMode = Boolean(payload.dualMode);
    refs.questionInput.value = typeof payload.question === "string" ? payload.question : "";
    refs.noteInput.value = typeof payload.note === "string" ? payload.note : "";
    refs.dualNoteA.value = typeof payload.dualNotes?.a === "string" ? payload.dualNotes.a : "";
    refs.dualNoteB.value = typeof payload.dualNotes?.b === "string" ? payload.dualNotes.b : "";
    state.currentSession = {
      id: `share-${Date.now()}`,
      time: typeof payload.time === "string" ? payload.time : new Date().toISOString(),
      modeId: state.modeId,
      deckTypeId: state.deckTypeId,
      layoutDirection: state.layoutDirection,
      question: refs.questionInput.value.trim(),
      cards: state.currentCards,
      slotLabels: Array.isArray(payload.slotLabels) && payload.slotLabels.length ? payload.slotLabels : getModeLabels(state.modeId, MODES[state.modeId].count),
      note: refs.noteInput.value.trim(),
      dualMode: state.dualMode,
      dualNotes: {
        a: refs.dualNoteA.value.trim(),
        b: refs.dualNoteB.value.trim()
      },
      lastExportAt: "",
      actionPlan: normalizeActionPlan(buildActionPlan(state.currentCards, refs.questionInput.value.trim(), refs.noteInput.value.trim(), MODES[state.modeId])),
      tags: inferSessionTags(refs.questionInput.value.trim(), refs.noteInput.value.trim(), state.currentCards),
      layerVisits: getLayerVisitArray(),
      closure: payload.closure && typeof payload.closure === "object"
        ? {
            summary: typeof payload.closure.summary === "string" ? payload.closure.summary : "",
            action: typeof payload.closure.action === "string" ? payload.closure.action : "",
            support: typeof payload.closure.support === "string" ? payload.closure.support : ""
          }
        : { summary: "", action: "", support: "" },
      protocol: {
        intent: state.protocol.intent || "",
        consent: Boolean(state.protocol.consent),
        emotion: Number(state.protocol.emotion || 3)
      }
    };
    if (state.currentSession.closure.summary || state.currentSession.closure.action || state.currentSession.closure.support) {
      state.closure = { ...state.currentSession.closure };
    } else {
      generateClosureIntegration(true);
    }
    state.facilitator.stageIndex = getFacilitatorStageIndexByLayer(state.layerId);
    renderSessionProtocol();
    renderModeSwitch();
    renderModeDetail();
    renderDeckTypeSwitch();
    renderLayoutDirectionSwitch();
    renderPromptTabs();
    renderPromptStyleSwitch();
    renderDualModePanel();
    renderSlotEditor();
    renderSpread(state.currentCards, state.currentSession.slotLabels);
    if (Array.isArray(payload.prompts) && payload.prompts.length) {
      refs.promptList.innerHTML = "";
      payload.prompts.forEach((line) => {
        const item = document.createElement("li");
        item.textContent = line;
        refs.promptList.appendChild(item);
      });
    } else {
      renderPrompts(state.currentSession.slotLabels);
    }
    renderActionPlan();
    renderFacilitatorPanel();
    renderClosurePanel();
    renderWorkflowSteps();
    applyReadonlyModeState();
    setSummary("已进入只读分享模式。", false);
    return true;
  } catch (error) {
    state.readonlyMode = false;
    applyReadonlyModeState();
    console.warn("hydrateReadonlySessionFromHash failed", error);
    return false;
  }
}

function applyReadonlyModeState() {
  document.body.classList.toggle("readonly-mode", state.readonlyMode);
  refs.readonlyBanner.hidden = !state.readonlyMode;
  const lockElements = [
    refs.sessionIntentInput,
    refs.consentCheckbox,
    refs.pauseProtocolBtn,
    refs.emotionIntensityInput,
    refs.groundingBreathBtn,
    refs.groundingSenseBtn,
    refs.groundingSupportBtn,
    refs.facilitatorToggleBtn,
    refs.facilitatorNextBtn,
    refs.avoidRecentCheckbox,
    refs.questionInput,
    refs.noteInput,
    refs.dualNoteA,
    refs.dualNoteB,
    refs.drawBtn,
    refs.reshuffleBtn,
    refs.importImageDeckBtn,
    refs.importWordDeckBtn,
    refs.resetDeckBtn,
    refs.generateClosureBtn,
    refs.saveNoteBtn,
    refs.clearHistoryBtn
  ];
  lockElements.forEach((el) => {
    if (!el) {
      return;
    }
    el.disabled = Boolean(state.readonlyMode);
  });
}

function exitReadonlyMode() {
  state.readonlyMode = false;
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  applyReadonlyModeState();
  const restored = hydrateCurrentSessionSnapshot();
  if (!restored) {
    resetBoard();
  }
  renderSessionProtocol();
  renderFacilitatorPanel();
  renderClosurePanel();
  setSummary("已退出只读分享模式。", false);
}

function renderAnalytics() {
  const entries = Array.isArray(state.history) ? state.history : [];
  if (!entries.length) {
    refs.analyticsSummary.textContent = "暂无历史数据。完成几局后会自动形成趋势统计。";
    refs.analyticsTopWords.innerHTML = "<span>暂无</span>";
    refs.analyticsEmotionTrend.innerHTML = "<span>暂无</span>";
    refs.analyticsActionRate.textContent = "0%";
    refs.analyticsSessionQuality.textContent = "0";
    return;
  }
  const wordCount = new Map();
  const emotionCount = new Map();
  let doneTotal = 0;
  let actionTotal = 0;
  let qualityTotal = 0;
  const emotionTerms = ["开心", "焦虑", "生气", "害怕", "难过", "轻松", "压力", "期待", "孤独", "感情"];

  entries.forEach((session) => {
    (session.cards || []).forEach((card) => {
      const short = getCardShortName(card);
      wordCount.set(short, (wordCount.get(short) || 0) + 1);
    });
    const bag = `${session.question || ""} ${session.note || ""} ${(session.cards || []).map((card) => getCardShortName(card)).join(" ")}`;
    emotionTerms.forEach((term) => {
      if (bag.includes(term)) {
        emotionCount.set(term, (emotionCount.get(term) || 0) + 1);
      }
    });
    const actions = normalizeActionPlan(session.actionPlan).actions;
    actionTotal += actions.length;
    doneTotal += actions.filter((item) => item.done).length;
    qualityTotal += computeSessionQuality(session);
  });

  const topWords = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const topEmotions = Array.from(emotionCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  refs.analyticsTopWords.innerHTML = topWords.length
    ? topWords.map(([word, count]) => `<span>${escapeHTML(word)} ${count}</span>`).join("")
    : "<span>暂无</span>";
  refs.analyticsEmotionTrend.innerHTML = topEmotions.length
    ? topEmotions.map(([word, count]) => `<span>${escapeHTML(word)} ${count}</span>`).join("")
    : "<span>暂无明显情绪词</span>";
  const rate = actionTotal > 0 ? Math.round((doneTotal / actionTotal) * 100) : 0;
  const qualityAvg = Math.round(qualityTotal / Math.max(1, entries.length));
  refs.analyticsActionRate.textContent = `${rate}%`;
  refs.analyticsSessionQuality.textContent = `${qualityAvg}`;
  refs.analyticsSummary.textContent = `共统计 ${entries.length} 局，识别出 ${topWords.length} 个高频牌面词，平均会话质量分 ${qualityAvg}。`;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`./sw.js?rev=${APP_ASSET_VERSION}`)
      .then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        registration.addEventListener("updatefound", () => {
          const nextWorker = registration.installing;
          if (!nextWorker) {
            return;
          }
          nextWorker.addEventListener("statechange", () => {
            if (nextWorker.state === "installed" && navigator.serviceWorker.controller) {
              nextWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
        registration.update().catch(() => {});
      })
      .catch(() => {});

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (window.__ohSwReloading) {
        return;
      }
      window.__ohSwReloading = true;
      window.location.reload();
    });
  });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    const hidden = document.createElement("textarea");
    hidden.value = text;
    hidden.setAttribute("readonly", "");
    hidden.style.position = "absolute";
    hidden.style.left = "-9999px";
    document.body.appendChild(hidden);
    hidden.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(hidden);
    return copied;
  }
}

function toggleTimer() {
  if (state.timer.running) {
    stopTimer("继续");
    return;
  }
  if (state.timer.remaining <= 0 || state.timer.remaining === state.timer.duration) {
    const minutes = Math.max(1, Math.min(20, Number(refs.timerMinutes.value) || 3));
    state.timer.duration = minutes * 60;
    state.timer.remaining = state.timer.duration;
  }
  state.timer.running = true;
  refs.timerToggle.textContent = "暂停";
  state.timer.intervalId = setInterval(() => {
    state.timer.remaining -= 1;
    updateTimerDisplay();
    if (state.timer.remaining <= 0) {
      stopTimer("开始");
      refs.timerText.textContent = "00:00";
      setSummary("计时结束。请回看你的牌面洞察并写下行动。", false);
    }
  }, 1000);
}

function stopTimer(buttonText) {
  state.timer.running = false;
  if (state.timer.intervalId) {
    clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
  }
  refs.timerToggle.textContent = buttonText;
}

function updateTimerDisplay() {
  const remaining = Math.max(0, state.timer.remaining);
  const minute = Math.floor(remaining / 60);
  const second = remaining % 60;
  refs.timerText.textContent = `${pad2(minute)}:${pad2(second)}`;
}
