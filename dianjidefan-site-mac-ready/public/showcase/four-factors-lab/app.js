const STORAGE_KEY = "four_factors_lab_v1";
const MODULE_META = [
  {
    key: "self",
    label: "自我批评",
    description: "找出今天最失真的判断，并把它修到可执行。"
  },
  {
    key: "curiosity",
    label: "好奇心",
    description: "提出一个更锋利的问题，而不是假装自己已经懂了。"
  },
  {
    key: "focus",
    label: "专注",
    description: "只做一件事，并给它一整段没有分岔的时间。"
  },
  {
    key: "perseverance",
    label: "毅力",
    description: "提前设计回路，在阻力里继续向前。"
  }
];

const PROMPTS = [
  "如果你现在最确定的一件事其实是错的，最可能错在哪一层？",
  "你今天最想逃开的任务，真正难的是动作本身，还是它会暴露某种不足？",
  "如果把今天的卡顿当实验，最值得先改的变量是什么？",
  "你反复重复的解释里，哪一句最像自动播放，而不是事实？",
  "要是只能问一个问题让今天推进 20%，那个问题该问谁？",
  "你最近认定“我就是这样”的地方，是否只是一个暂时策略？",
  "现在看上去最麻烦的环节，是否其实藏着最关键信息？",
  "如果你必须把今天的问题讲给 14 岁的自己听，哪个术语最该被拆掉？",
  "你最常用来拖延的理由，哪一部分是真的，哪一部分只是缓冲？",
  "你已经默认不可能的那件事，需要什么最小证据才会开始松动？",
  "如果把今天最重要的事只保留一个标准，什么叫“完成”就已经够了？",
  "你现在想做的优化，是否在偷换成“重新开始”，以逃避真正的推进？"
];

const state = loadState();

const timer = {
  remainingSeconds: 45 * 60,
  intervalId: null,
  running: false
};

const el = {
  todayDate: document.getElementById("todayDate"),
  todayScore: document.getElementById("todayScore"),
  activeStreak: document.getElementById("activeStreak"),
  focusMinutes7d: document.getElementById("focusMinutes7d"),
  moduleStatus: document.getElementById("moduleStatus"),
  northStarForm: document.getElementById("northStarForm"),
  northStar: document.getElementById("northStar"),
  todayIntent: document.getElementById("todayIntent"),
  heroNarrative: document.getElementById("heroNarrative"),
  saveStateText: document.getElementById("saveStateText"),
  seedToday: document.getElementById("seedToday"),

  selfForm: document.getElementById("selfForm"),
  blindSpot: document.getElementById("blindSpot"),
  evidence: document.getElementById("evidence"),
  adjustment: document.getElementById("adjustment"),

  curiosityPrompt: document.getElementById("curiosityPrompt"),
  regenPrompt: document.getElementById("regenPrompt"),
  curiosityForm: document.getElementById("curiosityForm"),
  curiosityAngle: document.getElementById("curiosityAngle"),
  curiosityDiscovery: document.getElementById("curiosityDiscovery"),
  curiosityNext: document.getElementById("curiosityNext"),

  focusForm: document.getElementById("focusForm"),
  focusTask: document.getElementById("focusTask"),
  focusPreset: document.getElementById("focusPreset"),
  focusCommitment: document.getElementById("focusCommitment"),
  timerDisplay: document.getElementById("timerDisplay"),
  startTimer: document.getElementById("startTimer"),
  pauseTimer: document.getElementById("pauseTimer"),
  resetTimer: document.getElementById("resetTimer"),
  logRound: document.getElementById("logRound"),
  markDistraction: document.getElementById("markDistraction"),
  focusLedger: document.getElementById("focusLedger"),
  focusNote: document.getElementById("focusNote"),

  perseveranceForm: document.getElementById("perseveranceForm"),
  resistance: document.getElementById("resistance"),
  minimumMove: document.getElementById("minimumMove"),
  rescuePlan: document.getElementById("rescuePlan"),
  followThrough: document.getElementById("followThrough"),

  weekMetrics: document.getElementById("weekMetrics"),
  weekBars: document.getElementById("weekBars"),
  historyList: document.getElementById("historyList"),
  exportData: document.getElementById("exportData"),
  resetDay: document.getElementById("resetDay")
};

init();

function init() {
  ensureToday();
  saveSilently();
  bindEvents();
  syncForms();
  syncTimerToPreset();
  renderAll();
}

function bindEvents() {
  el.northStarForm.addEventListener("submit", onSaveNorthStar);
  el.seedToday.addEventListener("click", onSeedToday);

  el.selfForm.addEventListener("submit", onSaveSelf);

  el.regenPrompt.addEventListener("click", onRefreshCuriosityPrompt);
  el.curiosityForm.addEventListener("submit", onSaveCuriosity);

  el.focusPreset.addEventListener("change", onFocusPresetChange);
  el.startTimer.addEventListener("click", onStartTimer);
  el.pauseTimer.addEventListener("click", onPauseTimer);
  el.resetTimer.addEventListener("click", onResetTimer);
  el.logRound.addEventListener("click", onManualRound);
  el.markDistraction.addEventListener("click", onMarkDistraction);
  el.focusForm.addEventListener("submit", onSaveFocus);

  el.perseveranceForm.addEventListener("submit", onSavePerseverance);

  el.exportData.addEventListener("click", onExportData);
  el.resetDay.addEventListener("click", onResetDay);
}

function onSaveNorthStar(event) {
  event.preventDefault();
  const day = getToday();
  day.northStar = trimValue(el.northStar.value);
  day.todayIntent = trimValue(el.todayIntent.value);
  persist("已保存今日主线");
  renderAll();
}

function onSeedToday() {
  stopTimer();
  const day = getToday();
  day.curiosity.prompt = pickPrompt(day.curiosity.prompt);
  if (!day.todayIntent) {
    day.todayIntent = "今天至少完成 1 轮完整训练，不跳步骤。";
  }
  persist("已生成新的今日题目");
  el.todayIntent.value = day.todayIntent;
  renderAll();
}

function onSaveSelf(event) {
  event.preventDefault();
  const day = getToday();
  day.self.blindSpot = trimValue(el.blindSpot.value);
  day.self.evidence = trimValue(el.evidence.value);
  day.self.adjustment = trimValue(el.adjustment.value);
  persist("已保存自我批评记录");
  renderAll();
}

function onRefreshCuriosityPrompt() {
  const day = getToday();
  day.curiosity.prompt = pickPrompt(day.curiosity.prompt);
  persist("已换一题");
  renderAll();
}

function onSaveCuriosity(event) {
  event.preventDefault();
  const day = getToday();
  day.curiosity.angle = trimValue(el.curiosityAngle.value);
  day.curiosity.discovery = trimValue(el.curiosityDiscovery.value);
  day.curiosity.next = trimValue(el.curiosityNext.value);
  persist("已保存好奇心记录");
  renderAll();
}

function onFocusPresetChange() {
  const day = getToday();
  day.focus.preset = Number(el.focusPreset.value) || 45;
  persist("已更新专注时长");
  syncTimerToPreset();
  renderAll();
}

function onStartTimer() {
  if (timer.running) {
    return;
  }

  if (timer.remainingSeconds <= 0) {
    syncTimerToPreset();
  }

  timer.running = true;
  timer.intervalId = window.setInterval(() => {
    timer.remainingSeconds -= 1;
    if (timer.remainingSeconds <= 0) {
      timer.remainingSeconds = 0;
      stopTimer();
      awardFocusRound("计时结束，已记 1 轮完成");
    }
    renderTimer();
  }, 1000);
  renderTimer();
}

function onPauseTimer() {
  stopTimer();
  renderTimer();
}

function onResetTimer() {
  stopTimer();
  syncTimerToPreset();
  renderTimer();
}

function onManualRound() {
  awardFocusRound("已手动记录 1 轮专注");
}

function onMarkDistraction() {
  const day = getToday();
  syncFocusDraft(day);
  day.focus.distractionCount += 1;
  persist("已记一次分心");
  renderAll();
}

function onSaveFocus(event) {
  event.preventDefault();
  const day = getToday();
  syncFocusDraft(day);
  persist("已保存专注记录");
  renderAll();
}

function onSavePerseverance(event) {
  event.preventDefault();
  const day = getToday();
  day.perseverance.resistance = trimValue(el.resistance.value);
  day.perseverance.minimumMove = trimValue(el.minimumMove.value);
  day.perseverance.rescuePlan = trimValue(el.rescuePlan.value);
  day.perseverance.followThrough = trimValue(el.followThrough.value);
  persist("已保存毅力记录");
  renderAll();
}

function onExportData() {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `four-factors-lab-${getTodayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  updateSaveText("已导出 JSON");
}

function onResetDay() {
  const confirmed = window.confirm("只清空今天的记录，最近历史会保留。确定继续吗？");
  if (!confirmed) {
    return;
  }

  stopTimer();
  state.days[getTodayKey()] = createEmptyDay();
  persist("今天已清空");
  syncForms();
  syncTimerToPreset();
  renderAll();
}

function awardFocusRound(message) {
  const day = getToday();
  syncFocusDraft(day);
  day.focus.sessionsCompleted += 1;
  day.focus.minutesCompleted += day.focus.preset;
  persist(message);
  syncTimerToPreset();
  renderAll();
}

function stopTimer() {
  if (timer.intervalId !== null) {
    window.clearInterval(timer.intervalId);
    timer.intervalId = null;
  }
  timer.running = false;
}

function syncTimerToPreset() {
  const day = getToday();
  timer.remainingSeconds = (day.focus.preset || 45) * 60;
  renderTimer();
}

function renderTimer() {
  el.timerDisplay.textContent = formatTimer(timer.remainingSeconds);
  el.startTimer.textContent = timer.running ? "进行中" : "开始";
}

function syncForms() {
  const day = getToday();

  el.northStar.value = day.northStar;
  el.todayIntent.value = day.todayIntent;

  el.blindSpot.value = day.self.blindSpot;
  el.evidence.value = day.self.evidence;
  el.adjustment.value = day.self.adjustment;

  el.curiosityAngle.value = day.curiosity.angle;
  el.curiosityDiscovery.value = day.curiosity.discovery;
  el.curiosityNext.value = day.curiosity.next;

  el.focusTask.value = day.focus.task;
  el.focusPreset.value = String(day.focus.preset);
  el.focusCommitment.value = day.focus.commitment;
  el.focusNote.value = day.focus.note;

  el.resistance.value = day.perseverance.resistance;
  el.minimumMove.value = day.perseverance.minimumMove;
  el.rescuePlan.value = day.perseverance.rescuePlan;
  el.followThrough.value = day.perseverance.followThrough;
}

function syncFocusDraft(day) {
  day.focus.task = trimValue(el.focusTask.value);
  day.focus.preset = Number(el.focusPreset.value) || 45;
  day.focus.commitment = trimValue(el.focusCommitment.value);
  day.focus.note = trimValue(el.focusNote.value);
}

function renderAll() {
  const day = getToday();
  const todayStatus = getModuleStatus(day);
  const completeCount = Object.values(todayStatus).filter(Boolean).length;
  const recentDays = getRecentDays(7);
  const focusMinutes = recentDays.reduce((sum, item) => sum + item.focus.minutesCompleted, 0);

  el.todayDate.textContent = formatDisplayDate(getTodayKey());
  el.todayScore.textContent = `${completeCount} / 4`;
  el.activeStreak.textContent = `${getActiveStreak()} 天`;
  el.focusMinutes7d.textContent = `${focusMinutes} 分钟`;
  el.curiosityPrompt.textContent = day.curiosity.prompt;
  el.focusLedger.textContent = `已完成 ${day.focus.sessionsCompleted} 轮 / 分心 ${day.focus.distractionCount} 次`;

  renderHeroNarrative(day, completeCount);
  renderModuleStatus(todayStatus);
  renderWeeklyMetrics(recentDays);
  renderHistory();
}

function renderHeroNarrative(day, completeCount) {
  const northStar = day.northStar || "先把今天的四件事讲清楚";
  const intent = day.todayIntent || "还没写今天的实验";
  const focusLine = day.focus.task ? `当前唯一任务：${day.focus.task}` : "你还没给今天指定唯一任务。";
  el.heroNarrative.textContent = `主线：${northStar}。实验：${intent}。今天已完成 ${completeCount}/4。${focusLine}`;
}

function renderModuleStatus(status) {
  el.moduleStatus.innerHTML = MODULE_META.map((item) => {
    const done = Boolean(status[item.key]);
    return `
      <article class="module-pill">
        <header>
          <h3>${escapeHtml(item.label)}</h3>
          <span class="pill-state ${done ? "done" : "todo"}">${done ? "已完成" : "待训练"}</span>
        </header>
        <p>${escapeHtml(item.description)}</p>
      </article>
    `;
  }).join("");
}

function renderWeeklyMetrics(days) {
  const fullDays = days.filter((day) => Object.values(getModuleStatus(day)).every(Boolean)).length;
  const activeDays = days.filter(hasActivity).length;
  const focusMinutes = days.reduce((sum, day) => sum + day.focus.minutesCompleted, 0);
  const rescueDays = days.filter((day) => Boolean(day.perseverance.followThrough)).length;

  const metrics = [
    { label: "活跃天数", value: `${activeDays} / 7` },
    { label: "四项齐全", value: `${fullDays} 天` },
    { label: "专注总时长", value: `${focusMinutes} 分钟` },
    { label: "顶住阻力", value: `${rescueDays} 天` }
  ];

  el.weekMetrics.innerHTML = metrics.map((item) => `
    <article class="metric-card">
      <span class="value">${escapeHtml(item.value)}</span>
      <span class="label">${escapeHtml(item.label)}</span>
    </article>
  `).join("");

  el.weekBars.innerHTML = days.map((day) => {
    const score = Object.values(getModuleStatus(day)).filter(Boolean).length;
    const percent = Math.round((score / 4) * 100);
    return `
      <div class="week-bar-row">
        <span>${escapeHtml(day.date.slice(5))}</span>
        <div class="week-bar-track">
          <div class="week-bar-fill" style="width:${percent}%"></div>
        </div>
        <strong>${score}/4</strong>
      </div>
    `;
  }).join("");
}

function renderHistory() {
  const history = Object.entries(state.days)
    .map(([date, day]) => ({ date, ...day }))
    .filter((item) => hasActivity(item))
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 8);

  if (history.length === 0) {
    el.historyList.innerHTML = `<p class="empty-state">还没有留下训练痕迹。先完成今天的一张卡，再回来这里看。</p>`;
    return;
  }

  el.historyList.innerHTML = history.map((item) => {
    const status = getModuleStatus(item);
    const chips = MODULE_META
      .filter((module) => status[module.key])
      .map((module) => `<span class="chip">${escapeHtml(module.label)}</span>`)
      .join("");
    const summary = pickHistorySummary(item);
    return `
      <article class="history-card">
        <div class="history-meta">
          <span class="history-date">${escapeHtml(formatDisplayDate(item.date))}</span>
          <span class="chip highlight">${item.focus.minutesCompleted} 分钟专注</span>
          ${chips}
        </div>
        <p class="history-summary">${escapeHtml(summary)}</p>
      </article>
    `;
  }).join("");
}

function pickHistorySummary(day) {
  if (day.self.adjustment) {
    return `修正动作：${day.self.adjustment}`;
  }
  if (day.curiosity.discovery) {
    return `新发现：${day.curiosity.discovery}`;
  }
  if (day.perseverance.followThrough) {
    return `坚持结果：${day.perseverance.followThrough}`;
  }
  if (day.focus.note) {
    return `专注复盘：${day.focus.note}`;
  }
  return "这一天有训练，但还没留下总结。";
}

function getRecentDays(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - index - 1));
    const key = localDateISO(date);
    const day = state.days[key] ? normalizeDay(state.days[key]) : createEmptyDay();
    return {
      date: key,
      ...day
    };
  });
}

function getActiveStreak() {
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = localDateISO(cursor);
    const day = state.days[key];
    if (!day || !hasActivity(day)) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getModuleStatus(day) {
  return {
    self: Boolean(day.self.blindSpot && day.self.adjustment),
    curiosity: Boolean(day.curiosity.angle && day.curiosity.discovery),
    focus: day.focus.minutesCompleted > 0 && Boolean(day.focus.task),
    perseverance: Boolean(day.perseverance.resistance && day.perseverance.minimumMove && day.perseverance.followThrough)
  };
}

function hasActivity(day) {
  return Boolean(
    day.northStar ||
      day.todayIntent ||
      day.self.blindSpot ||
      day.curiosity.angle ||
      day.focus.task ||
      day.focus.minutesCompleted ||
      day.perseverance.resistance
  );
}

function persist(message) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateSaveText(message);
}

function updateSaveText(message) {
  el.saveStateText.textContent = message;
  window.clearTimeout(updateSaveText.timeoutId);
  updateSaveText.timeoutId = window.setTimeout(() => {
    el.saveStateText.textContent = "本地自动保存";
  }, 1800);
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { days: {} };
    }
    const parsed = JSON.parse(raw);
    return {
      days: parsed.days ?? {}
    };
  } catch (error) {
    return { days: {} };
  }
}

function ensureToday() {
  ensureDay(getTodayKey());
}

function ensureDay(key) {
  if (!state.days[key]) {
    state.days[key] = createEmptyDay();
  }
  state.days[key] = normalizeDay(state.days[key]);
  return state.days[key];
}

function getToday() {
  return ensureDay(getTodayKey());
}

function getTodayKey() {
  return localDateISO(new Date());
}

function createEmptyDay() {
  return {
    northStar: "",
    todayIntent: "",
    self: {
      blindSpot: "",
      evidence: "",
      adjustment: ""
    },
    curiosity: {
      prompt: pickPrompt(),
      angle: "",
      discovery: "",
      next: ""
    },
    focus: {
      task: "",
      preset: 45,
      commitment: "",
      sessionsCompleted: 0,
      minutesCompleted: 0,
      distractionCount: 0,
      note: ""
    },
    perseverance: {
      resistance: "",
      minimumMove: "",
      rescuePlan: "",
      followThrough: ""
    }
  };
}

function normalizeDay(day) {
  const defaults = createEmptyDay();
  const normalized = {
    northStar: day.northStar ?? defaults.northStar,
    todayIntent: day.todayIntent ?? defaults.todayIntent,
    self: { ...defaults.self, ...day.self },
    curiosity: { ...defaults.curiosity, ...day.curiosity },
    focus: { ...defaults.focus, ...day.focus },
    perseverance: { ...defaults.perseverance, ...day.perseverance }
  };
  if (!normalized.curiosity.prompt) {
    normalized.curiosity.prompt = pickPrompt();
  }
  return normalized;
}

function saveSilently() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pickPrompt(previousPrompt = "") {
  const candidates = PROMPTS.filter((prompt) => prompt !== previousPrompt);
  const pool = candidates.length > 0 ? candidates : PROMPTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function formatDisplayDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric"
  }).format(date);
}

function formatTimer(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function localDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function trimValue(value) {
  return value.trim();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
