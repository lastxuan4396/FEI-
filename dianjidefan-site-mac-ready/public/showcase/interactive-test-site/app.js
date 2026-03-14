const DIMENSION_META = {
  worldview: { label: "世界观", barClass: "bar-worldview" },
  lifeview: { label: "人生观", barClass: "bar-lifeview" },
  values: { label: "价值观", barClass: "bar-values" }
};

const PROFILE_META = {
  worldview: {
    title: "现实洞察型",
    subtitle: "你会先看事实结构和长期趋势，再做判断。",
    strength: "你擅长把复杂问题放进更大的环境里理解，不容易被一时情绪带偏，判断更稳。",
    tip: "分析力很强时，记得尽快把洞察转成行动，不要让“看得明白”停留在想法层面。"
  },
  lifeview: {
    title: "成长实践型",
    subtitle: "你相信人生意义来自体验、行动和持续进步。",
    strength: "你有较强复原力，能把挫折当作训练，愿意在真实生活里不断修正并前进。",
    tip: "行动节奏快时，也要定期停下来校准方向，确认自己不是只在忙，而是在成长。"
  },
  values: {
    title: "原则守正型",
    subtitle: "你做选择时更看重底线、责任和长期一致性。",
    strength: "你在关键选择上有稳定内核，别人会觉得你可靠、可信，适合做重要决策把关。",
    tip: "坚持原则的同时，可以让方法更灵活；在不破底线的前提下，给不同路径一点空间。"
  }
};

const QUESTIONS = [
  {
    text: "看到一条争议很大的社会新闻时，你更可能先做什么？",
    options: [
      { label: "找原始信息和多方来源，先核实事实", scores: { worldview: 3, values: 1 } },
      { label: "看背后的制度、利益和长期趋势", scores: { worldview: 3, lifeview: 1 } },
      { label: "思考这件事对自己生活有什么启发", scores: { lifeview: 3, worldview: 1 } },
      { label: "先判断有没有触碰底线，再决定立场", scores: { values: 3, worldview: 1 } }
    ]
  },
  {
    text: "面对一个不错但有风险的新机会，你主要看什么？",
    options: [
      { label: "所在行业的周期与大方向", scores: { worldview: 3, lifeview: 1 } },
      { label: "能否让我获得真正成长与体验", scores: { lifeview: 3, worldview: 1 } },
      { label: "是否符合我认同的做事原则", scores: { values: 3, lifeview: 1 } },
      { label: "平衡风险后先走一步，再边做边调", scores: { lifeview: 2, values: 2 } }
    ]
  },
  {
    text: "和朋友在核心观念上有分歧时，你通常会？",
    options: [
      { label: "先理解对方经历与立场形成原因", scores: { worldview: 2, lifeview: 2 } },
      { label: "明确表达我的边界与不能接受的点", scores: { values: 3, worldview: 1 } },
      { label: "求同存异，优先维护关系与沟通", scores: { lifeview: 3, values: 1 } },
      { label: "把讨论拉回证据与逻辑，不做情绪对抗", scores: { worldview: 3, values: 1 } }
    ]
  },
  {
    text: "你更认同哪种“成功”定义？",
    options: [
      { label: "看懂世界规则，并能创造真实影响", scores: { worldview: 3, values: 1 } },
      { label: "活成自己想要的人生状态", scores: { lifeview: 3, values: 1 } },
      { label: "在关键选择上始终不违背内心原则", scores: { values: 3, lifeview: 1 } },
      { label: "三者兼顾，且长期可持续", scores: { worldview: 1, lifeview: 2, values: 2 } }
    ]
  },
  {
    text: "当你经历一次明显失败后，第一步通常是？",
    options: [
      { label: "复盘外部环境和系统性原因", scores: { worldview: 3, lifeview: 1 } },
      { label: "接住情绪，再迅速进入下一次尝试", scores: { lifeview: 3, worldview: 1 } },
      { label: "检查自己有没有偏离底线和原则", scores: { values: 3, lifeview: 1 } },
      { label: "找案例和前辈经验，更新方法", scores: { worldview: 2, lifeview: 2 } }
    ]
  },
  {
    text: "关于“钱”这件事，你更接近哪种看法？",
    options: [
      { label: "钱是理解并参与世界规则的重要工具", scores: { worldview: 3, values: 1 } },
      { label: "钱是提升生活质量和选择自由的手段", scores: { lifeview: 3, values: 1 } },
      { label: "赚钱方式必须对得起自己的价值底线", scores: { values: 3, worldview: 1 } },
      { label: "先守住原则，再追求增长效率", scores: { values: 2, worldview: 1, lifeview: 1 } }
    ]
  },
  {
    text: "面对社会中的不公平现象，你更倾向于？",
    options: [
      { label: "先区分事实、观点和情绪，再判断", scores: { worldview: 3, values: 1 } },
      { label: "关注个体处境，先做力所能及的帮助", scores: { lifeview: 3, values: 1 } },
      { label: "坚持规则公平，明确哪些边界不能退", scores: { values: 3, worldview: 1 } },
      { label: "从身边的小行动做起，长期推动改变", scores: { lifeview: 2, values: 2 } }
    ]
  },
  {
    text: "做人生重大选择时，你最常问自己的问题是？",
    options: [
      { label: "这个选择在更大趋势下是否成立？", scores: { worldview: 3, lifeview: 1 } },
      { label: "十年后我会感谢现在的决定吗？", scores: { lifeview: 3, values: 1 } },
      { label: "它有没有触碰我绝不妥协的底线？", scores: { values: 3, lifeview: 1 } },
      { label: "它是否能兼顾个人发展与责任承担？", scores: { lifeview: 2, values: 2 } }
    ]
  },
  {
    text: "和观点差异很大的人合作时，你会先做什么？",
    options: [
      { label: "先建立共同事实基线，再谈方案", scores: { worldview: 3, lifeview: 1 } },
      { label: "先建立信任和沟通节奏", scores: { lifeview: 3, values: 1 } },
      { label: "先明确规则、边界和责任", scores: { values: 3, worldview: 1 } },
      { label: "允许差异，但底线与目标必须一致", scores: { values: 2, worldview: 1, lifeview: 1 } }
    ]
  },
  {
    text: "以下哪句话最像你当前的信念？",
    options: [
      { label: "看清世界运行逻辑，才有真正的自由。", scores: { worldview: 3 } },
      { label: "人生的意义，是在经历中不断成为更好的自己。", scores: { lifeview: 3 } },
      { label: "一个人的价值，体现在关键时刻的选择。", scores: { values: 3 } },
      { label: "三观会成长，但底线必须稳定。", scores: { worldview: 1, lifeview: 1, values: 2 } }
    ]
  }
];

const HISTORY_KEY = "interactive-test-sanguan-history-v1";

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const startBtn = document.getElementById("start-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const copyBtn = document.getElementById("copy-btn");
const restartBtn = document.getElementById("restart-btn");

const progressLabel = document.getElementById("progress-label");
const progressFill = document.getElementById("progress-fill");
const questionText = document.getElementById("question-text");
const optionsList = document.getElementById("options-list");

const resultTitle = document.getElementById("result-title");
const resultSubtitle = document.getElementById("result-subtitle");
const resultStrength = document.getElementById("result-strength");
const resultTip = document.getElementById("result-tip");
const scoreGrid = document.getElementById("score-grid");
const copyFeedback = document.getElementById("copy-feedback");

const historyBlock = document.getElementById("history-block");
const historyList = document.getElementById("history-list");

const state = {
  currentQuestion: 0,
  selected: new Array(QUESTIONS.length).fill(null),
  latestResult: null
};

function showScreen(target) {
  startScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  target.classList.remove("hidden");
}

function startQuiz() {
  state.currentQuestion = 0;
  state.selected = new Array(QUESTIONS.length).fill(null);
  state.latestResult = null;
  copyFeedback.textContent = "";
  showScreen(quizScreen);
  renderQuestion();
}

function renderQuestion() {
  const total = QUESTIONS.length;
  const index = state.currentQuestion;
  const item = QUESTIONS[index];

  progressLabel.textContent = `第 ${index + 1} / ${total} 题`;
  progressFill.style.width = `${((index + 1) / total) * 100}%`;
  questionText.textContent = item.text;

  optionsList.innerHTML = "";
  item.options.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-btn";
    button.style.animationDelay = `${optionIndex * 40}ms`;
    button.textContent = option.label;

    if (state.selected[index] === optionIndex) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      state.selected[index] = optionIndex;
      renderQuestion();
    });

    optionsList.appendChild(button);
  });

  prevBtn.disabled = index === 0;
  nextBtn.disabled = state.selected[index] === null;
  nextBtn.textContent = index === total - 1 ? "查看结果" : "下一题";
}

function calculateResult() {
  const totals = { worldview: 0, lifeview: 0, values: 0 };

  QUESTIONS.forEach((question, index) => {
    const selectedIndex = state.selected[index];
    const selectedOption = question.options[selectedIndex];
    if (!selectedOption) {
      return;
    }

    Object.entries(selectedOption.scores).forEach(([key, value]) => {
      totals[key] += value;
    });
  });

  const ranking = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const [primaryKey, primaryScore] = ranking[0];
  const [secondaryKey, secondaryScore] = ranking[1];

  return {
    totals,
    ranking,
    primary: { key: primaryKey, score: primaryScore, ...PROFILE_META[primaryKey] },
    secondary: {
      key: secondaryKey,
      score: secondaryScore,
      label: DIMENSION_META[secondaryKey].label
    }
  };
}

function renderScoreGrid(totals) {
  const maxValue = Math.max(...Object.values(totals), 1);
  scoreGrid.innerHTML = "";

  Object.entries(totals).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "score-row";

    const label = document.createElement("span");
    label.textContent = DIMENSION_META[key].label;

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = `bar-fill ${DIMENSION_META[key].barClass}`;
    fill.style.width = `${Math.round((value / maxValue) * 100)}%`;
    track.appendChild(fill);

    const num = document.createElement("span");
    num.textContent = String(value);

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(num);
    scoreGrid.appendChild(row);
  });
}

function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_error) {
    return [];
  }
}

function saveHistory(record) {
  const history = getHistory();
  const nextHistory = [record, ...history].slice(0, 5);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
}

function renderHistory() {
  const history = getHistory();
  historyList.innerHTML = "";

  if (!history.length) {
    historyBlock.classList.add("hidden");
    return;
  }

  history.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.time} · ${item.type}（${item.primaryLabel} ${item.primaryScore}）`;
    historyList.appendChild(li);
  });

  historyBlock.classList.remove("hidden");
}

function toTimeString(date) {
  return new Date(date).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function showResult() {
  const result = calculateResult();
  state.latestResult = result;

  resultTitle.textContent = result.primary.title;
  resultSubtitle.textContent = `${result.primary.subtitle} 你的次高维度是「${result.secondary.label}」。`;
  resultStrength.textContent = result.primary.strength;
  resultTip.textContent = result.primary.tip;
  renderScoreGrid(result.totals);

  const record = {
    time: toTimeString(Date.now()),
    type: result.primary.title,
    primaryLabel: DIMENSION_META[result.primary.key].label,
    primaryScore: result.primary.score
  };
  saveHistory(record);
  renderHistory();

  copyFeedback.textContent = "";
  showScreen(resultScreen);
}

async function copyResult() {
  if (!state.latestResult) {
    return;
  }

  const text = [
    "我刚做了「三观认知测评」",
    `结果：${state.latestResult.primary.title}`,
    `主维度：${DIMENSION_META[state.latestResult.primary.key].label}（${state.latestResult.primary.score}）`,
    `次维度：${state.latestResult.secondary.label}（${state.latestResult.secondary.score}）`,
    `一句话总结：${state.latestResult.primary.subtitle}`
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    copyFeedback.textContent = "结果文案已复制，可以直接粘贴分享。";
  } catch (_error) {
    copyFeedback.textContent = "复制失败，请长按手动复制。";
  }
}

startBtn.addEventListener("click", startQuiz);

prevBtn.addEventListener("click", () => {
  if (state.currentQuestion > 0) {
    state.currentQuestion -= 1;
    renderQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  const selected = state.selected[state.currentQuestion];
  if (selected === null) {
    return;
  }

  if (state.currentQuestion === QUESTIONS.length - 1) {
    showResult();
    return;
  }

  state.currentQuestion += 1;
  renderQuestion();
});

copyBtn.addEventListener("click", copyResult);

restartBtn.addEventListener("click", startQuiz);

renderHistory();
