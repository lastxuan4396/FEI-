const STORAGE_KEY = "fitness_plan_v1_data";
const TOTAL_WEEKS = 12;

const PHASES = [
  {
    id: 1,
    name: "Phase 1 适应与动作重建",
    weekStart: 1,
    weekEnd: 4,
    targetSessions: 4,
    targetSteps: 7000,
    targetSleep: 7,
    focus: "动作标准化 + 建立频率，不追求大重量",
    plan: [
      {
        key: "p1-a",
        day: "周一 全身A",
        type: "力量",
        exercises: [
          "高脚杯深蹲 3x10",
          "哑铃卧推 3x10",
          "坐姿划船 3x12",
          "平板支撑 3x40秒"
        ]
      },
      {
        key: "p1-zone2-1",
        day: "周二 Zone2",
        type: "有氧",
        exercises: ["坡走或自行车 25-35 分钟（心率区间2）"]
      },
      {
        key: "p1-b",
        day: "周三 全身B",
        type: "力量",
        exercises: [
          "罗马尼亚硬拉 3x10",
          "哑铃肩推 3x10",
          "高位下拉 3x12",
          "农夫行走 3x40米"
        ]
      },
      {
        key: "p1-zone2-2",
        day: "周五 Zone2",
        type: "有氧",
        exercises: ["快走/椭圆机 20-30 分钟"]
      },
      {
        key: "p1-c",
        day: "周六 全身C",
        type: "力量",
        exercises: [
          "腿举 3x12",
          "上斜卧推 3x10",
          "胸托划船 3x12",
          "死虫 3x10/侧"
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Phase 2 增肌减脂并行",
    weekStart: 5,
    weekEnd: 8,
    targetSessions: 5,
    targetSteps: 8500,
    targetSleep: 7,
    focus: "上/下肢拆分，开始小幅渐进过载",
    plan: [
      {
        key: "p2-upper-1",
        day: "周一 上肢A",
        type: "力量",
        exercises: [
          "卧推 4x6-8",
          "俯身划船 4x8",
          "上斜哑铃卧推 3x10",
          "面拉 3x15"
        ]
      },
      {
        key: "p2-lower-1",
        day: "周二 下肢A",
        type: "力量",
        exercises: [
          "深蹲 4x6-8",
          "罗马尼亚硬拉 3x8-10",
          "弓步蹲 3x10/侧",
          "提踵 3x15"
        ]
      },
      {
        key: "p2-zone2-1",
        day: "周三 Zone2",
        type: "有氧",
        exercises: ["Zone2 30-40 分钟 + 拉伸 10 分钟"]
      },
      {
        key: "p2-upper-2",
        day: "周四 上肢B",
        type: "力量",
        exercises: [
          "哑铃肩推 4x8",
          "引体/下拉 4x8-10",
          "双杠臂屈伸 3x8-10",
          "二头+三头超级组 3 轮"
        ]
      },
      {
        key: "p2-lower-2",
        day: "周六 下肢B",
        type: "力量",
        exercises: [
          "硬拉 3x5",
          "腿举 3x12",
          "臀桥 3x10",
          "核心滚轮 3x8"
        ]
      }
    ]
  },
  {
    id: 3,
    name: "Phase 3 强化与塑形",
    weekStart: 9,
    weekEnd: 12,
    targetSessions: 6,
    targetSteps: 10000,
    targetSleep: 7,
    focus: "维持力量的同时提高训练密度和代谢压力",
    plan: [
      {
        key: "p3-push",
        day: "周一 Push",
        type: "力量",
        exercises: [
          "卧推 4x5",
          "肩推 4x6",
          "上斜哑铃卧推 3x10",
          "绳索下压 3x12"
        ]
      },
      {
        key: "p3-pull",
        day: "周二 Pull",
        type: "力量",
        exercises: [
          "硬拉 3x4-5",
          "划船 4x8",
          "高位下拉 3x10",
          "二头弯举 3x12"
        ]
      },
      {
        key: "p3-zone2-1",
        day: "周三 Zone2",
        type: "有氧",
        exercises: ["Zone2 35-45 分钟"]
      },
      {
        key: "p3-legs",
        day: "周四 Legs",
        type: "力量",
        exercises: [
          "深蹲 4x5-6",
          "腿举 3x12",
          "罗马尼亚硬拉 3x8",
          "提踵 4x12"
        ]
      },
      {
        key: "p3-upper-density",
        day: "周六 上肢密度",
        type: "力量",
        exercises: [
          "卧推+划船 交替 5 轮",
          "侧平举 4x15",
          "俯卧撑 3 组力竭前2次停止",
          "核心回路 10 分钟"
        ]
      },
      {
        key: "p3-zone2-2",
        day: "周日 Zone2",
        type: "有氧",
        exercises: ["低冲击有氧 30 分钟 + 轻拉伸"]
      }
    ]
  }
];

const state = {
  data: loadData()
};

const el = {
  profileForm: document.getElementById("profileForm"),
  heightCm: document.getElementById("heightCm"),
  startWeightKg: document.getElementById("startWeightKg"),
  goalWeightKg: document.getElementById("goalWeightKg"),
  planStartDate: document.getElementById("planStartDate"),
  profileSummary: document.getElementById("profileSummary"),
  phaseStatus: document.getElementById("phaseStatus"),
  phaseProgress: document.getElementById("phaseProgress"),
  progressText: document.getElementById("progressText"),
  weeklyScore: document.getElementById("weeklyScore"),

  logForm: document.getElementById("logForm"),
  logDate: document.getElementById("logDate"),
  weightKg: document.getElementById("weightKg"),
  waistCm: document.getElementById("waistCm"),
  restingHr: document.getElementById("restingHr"),
  sleepHours: document.getElementById("sleepHours"),
  steps: document.getElementById("steps"),
  trainingMinutes: document.getElementById("trainingMinutes"),
  workoutSlot: document.getElementById("workoutSlot"),
  rpe: document.getElementById("rpe"),
  soreness: document.getElementById("soreness"),
  activeCalories: document.getElementById("activeCalories"),
  distanceKm: document.getElementById("distanceKm"),
  notes: document.getElementById("notes"),
  checklist: document.getElementById("exerciseChecklist"),
  quickCardio: document.getElementById("quickCardio"),

  phasePlan: document.getElementById("phasePlan"),
  trendCards: document.getElementById("trendCards"),
  historyRows: document.getElementById("historyRows"),
  generateAdvice: document.getElementById("generateAdvice"),
  adviceOutput: document.getElementById("adviceOutput"),
  exportJson: document.getElementById("exportJson"),
  importJson: document.getElementById("importJson"),
  syncStatus: document.getElementById("syncStatus")
};

init();

function init() {
  hydrateProfileForm();
  el.logDate.value = localDateISO(new Date());
  bindEvents();
  renderAll();
  hydrateLogFormByDate(el.logDate.value);
}

function bindEvents() {
  el.profileForm.addEventListener("submit", onSaveProfile);
  el.logForm.addEventListener("submit", onSaveLog);
  el.logDate.addEventListener("change", () => hydrateLogFormByDate(el.logDate.value));
  el.workoutSlot.addEventListener("change", () => renderChecklistByWorkoutSlot(el.workoutSlot.value));
  el.quickCardio.addEventListener("click", onQuickCardio);
  el.generateAdvice.addEventListener("click", renderAdvice);
  el.exportJson.addEventListener("click", onExportJson);
  el.importJson.addEventListener("change", onImportJson);
}

function onSaveProfile(event) {
  event.preventDefault();
  state.data.profile.heightCm = toNumber(el.heightCm.value) || 184;
  state.data.profile.startWeightKg = toNumber(el.startWeightKg.value) || 90;
  state.data.profile.goalWeightKg = toNumber(el.goalWeightKg.value) || 82;
  state.data.profile.planStartDate = el.planStartDate.value || localDateISO(new Date());
  saveData(state.data);
  renderAll();
}

function onSaveLog(event) {
  event.preventDefault();
  const entry = buildLogEntryFromForm();
  upsertEntryByDate(entry);
  saveData(state.data);
  renderAll();
  hydrateLogFormByDate(entry.date);
}

function onQuickCardio() {
  const date = el.logDate.value || localDateISO(new Date());
  const card = {
    date,
    weightKg: toNumber(el.weightKg.value),
    waistCm: toNumber(el.waistCm.value),
    restingHr: toNumber(el.restingHr.value),
    sleepHours: toNumber(el.sleepHours.value),
    steps: toNumber(el.steps.value),
    trainingMinutes: 10,
    workoutSlot: "quick-cardio",
    completedExercises: ["2分钟热身", "8分钟爬坡有氧"],
    rpe: 6,
    soreness: toNumber(el.soreness.value),
    activeCalories: toNumber(el.activeCalories.value),
    distanceKm: toNumber(el.distanceKm.value),
    notes: "快速启动版完成",
    createdAt: new Date().toISOString()
  };

  upsertEntryByDate(card);
  saveData(state.data);
  renderAll();
  hydrateLogFormByDate(date);
}

function onExportJson() {
  const payload = JSON.stringify(state.data, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `fitness-plan-data-${localDateISO(new Date())}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  el.syncStatus.textContent = `已导出：${anchor.download}`;
}

async function onImportJson(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    state.data = sanitizeData(parsed);
    saveData(state.data);
    hydrateProfileForm();
    hydrateLogFormByDate(el.logDate.value);
    renderAll();
    el.syncStatus.textContent = `导入成功：${file.name}`;
  } catch {
    el.syncStatus.textContent = "导入失败：文件格式不正确";
  } finally {
    event.target.value = "";
  }
}

function buildLogEntryFromForm() {
  const completedExercises = Array.from(el.checklist.querySelectorAll("input[type='checkbox']:checked"))
    .map((item) => item.value);

  return {
    date: el.logDate.value,
    weightKg: toNumber(el.weightKg.value),
    waistCm: toNumber(el.waistCm.value),
    restingHr: toNumber(el.restingHr.value),
    sleepHours: toNumber(el.sleepHours.value),
    steps: toNumber(el.steps.value),
    trainingMinutes: toNumber(el.trainingMinutes.value),
    workoutSlot: el.workoutSlot.value,
    completedExercises,
    rpe: toNumber(el.rpe.value),
    soreness: toNumber(el.soreness.value),
    activeCalories: toNumber(el.activeCalories.value),
    distanceKm: toNumber(el.distanceKm.value),
    notes: String(el.notes.value || "").trim(),
    createdAt: new Date().toISOString()
  };
}

function hydrateLogFormByDate(date) {
  const entry = state.data.entries.find((item) => item.date === date);

  if (!entry) {
    setInput(el.weightKg, null);
    setInput(el.waistCm, null);
    setInput(el.restingHr, null);
    setInput(el.sleepHours, null);
    setInput(el.steps, null);
    setInput(el.trainingMinutes, null);
    setInput(el.rpe, null);
    setInput(el.soreness, null);
    setInput(el.activeCalories, null);
    setInput(el.distanceKm, null);
    el.notes.value = "";
    renderWorkoutSlotOptions();
    return;
  }

  setInput(el.weightKg, entry.weightKg);
  setInput(el.waistCm, entry.waistCm);
  setInput(el.restingHr, entry.restingHr);
  setInput(el.sleepHours, entry.sleepHours);
  setInput(el.steps, entry.steps);
  setInput(el.trainingMinutes, entry.trainingMinutes);
  setInput(el.rpe, entry.rpe);
  setInput(el.soreness, entry.soreness);
  setInput(el.activeCalories, entry.activeCalories);
  setInput(el.distanceKm, entry.distanceKm);
  el.notes.value = entry.notes || "";

  renderWorkoutSlotOptions();
  if (entry.workoutSlot) {
    el.workoutSlot.value = entry.workoutSlot;
    renderChecklistByWorkoutSlot(entry.workoutSlot);
  }

  const done = new Set(Array.isArray(entry.completedExercises) ? entry.completedExercises : []);
  el.checklist.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = done.has(input.value);
  });
}

function setInput(element, value) {
  element.value = isFiniteNumber(value) ? String(value) : "";
}

function upsertEntryByDate(entry) {
  const list = state.data.entries;
  const index = list.findIndex((item) => item.date === entry.date);
  if (index >= 0) {
    list[index] = { ...list[index], ...entry, createdAt: new Date().toISOString() };
  } else {
    list.push(entry);
  }

  list.sort((a, b) => {
    if (a.date === b.date) {
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    }
    return b.date.localeCompare(a.date);
  });
}

function renderAll() {
  renderProfileSummary();
  renderPhaseStatus();
  renderWorkoutSlotOptions();
  renderPhasePlan();
  renderTrendCards();
  renderHistoryTable();
  renderAdvice();
}

function renderProfileSummary() {
  const p = state.data.profile;
  const bmi = p.startWeightKg / ((p.heightCm / 100) ** 2);
  const targetDelta = p.startWeightKg - p.goalWeightKg;

  el.profileSummary.innerHTML = "";
  el.profileSummary.append(
    createKpi("BMI（初始）", bmi.toFixed(1)),
    createKpi("目标减重", `${targetDelta.toFixed(1)} kg`),
    createKpi("当前记录天数", `${state.data.entries.length} 天`)
  );
}

function renderPhaseStatus() {
  const week = getCurrentWeek();
  const phase = getPhaseByWeek(week);

  const html = [
    `<span class="phase-tag">${phase.name}</span>`,
    `<div><strong>周区间：</strong>第 ${phase.weekStart} - ${phase.weekEnd} 周</div>`,
    `<div><strong>阶段焦点：</strong>${phase.focus}</div>`,
    `<div><strong>周目标：</strong>${phase.targetSessions} 次训练，日均 ${phase.targetSteps} 步，睡眠 >= ${phase.targetSleep}h</div>`
  ].join("");

  el.phaseStatus.innerHTML = html;

  const progress = Math.max(0, Math.min(100, (week / TOTAL_WEEKS) * 100));
  el.phaseProgress.style.width = `${progress}%`;
  el.progressText.textContent = `第 ${week} / ${TOTAL_WEEKS} 周`;

  const score = getCurrentWeekScore();
  el.weeklyScore.innerHTML = "";
  el.weeklyScore.append(
    createKpi("训练完成率", `${score.sessions}/${phase.targetSessions}`),
    createKpi("睡眠达标天数", `${score.sleepDays}/7`),
    createKpi("步数达标天数", `${score.stepDays}/7`)
  );
}

function renderWorkoutSlotOptions() {
  const week = getCurrentWeek();
  const phase = getPhaseByWeek(week);

  const selected = el.workoutSlot.value;
  const options = [
    `<option value="" disabled ${selected ? "" : "selected"}>请选择今天训练类型</option>`
  ];

  phase.plan.forEach((item) => {
    options.push(`<option value="${item.key}" ${selected === item.key ? "selected" : ""}>${item.day}</option>`);
  });

  options.push(`<option value="rest" ${selected === "rest" ? "selected" : ""}>恢复/休息日</option>`);
  options.push(`<option value="quick-cardio" ${selected === "quick-cardio" ? "selected" : ""}>10分钟启动有氧</option>`);

  el.workoutSlot.innerHTML = options.join("");
  renderChecklistByWorkoutSlot(el.workoutSlot.value || phase.plan[0].key);
}

function renderChecklistByWorkoutSlot(slotKey) {
  const phase = getPhaseByWeek(getCurrentWeek());
  const template = phase.plan.find((x) => x.key === slotKey);

  if (slotKey === "rest") {
    el.checklist.innerHTML = `<p class="muted">恢复日无需动作打卡。建议：步行20分钟 + 拉伸10分钟。</p>`;
    return;
  }

  if (slotKey === "quick-cardio") {
    el.checklist.innerHTML = [
      `<label class="check-item"><input type="checkbox" value="2分钟热身">2分钟热身</label>`,
      `<label class="check-item"><input type="checkbox" value="8分钟爬坡有氧">8分钟爬坡有氧</label>`
    ].join("");
    return;
  }

  if (!template) {
    el.checklist.innerHTML = `<p class="muted">先选择训练类型。</p>`;
    return;
  }

  el.checklist.innerHTML = template.exercises
    .map((exercise) => `<label class="check-item"><input type="checkbox" value="${escapeHtml(exercise)}">${escapeHtml(exercise)}</label>`)
    .join("");
}

function renderPhasePlan() {
  const phase = getPhaseByWeek(getCurrentWeek());
  el.phasePlan.innerHTML = phase.plan.map((item) => {
    const list = item.exercises.map((ex) => `<li>${escapeHtml(ex)}</li>`).join("");
    return `
      <article class="plan-card">
        <div class="plan-day">${escapeHtml(item.day)} · ${escapeHtml(item.type)}</div>
        <ul>${list}</ul>
      </article>
    `;
  }).join("");
}

function renderTrendCards() {
  const entries = state.data.entries.slice().sort((a, b) => a.date.localeCompare(b.date));
  const recent14 = entries.slice(-14);
  const recent7 = entries.slice(-7);
  const prev7 = entries.slice(-14, -7);

  const avgWeight7 = avg(recent7.map((e) => e.weightKg));
  const avgWeightPrev = avg(prev7.map((e) => e.weightKg));
  const weightDelta = isFiniteNumber(avgWeight7) && isFiniteNumber(avgWeightPrev)
    ? (avgWeight7 - avgWeightPrev)
    : null;

  const sleepAvg = avg(recent7.map((e) => e.sleepHours));
  const stepsAvg = avg(recent7.map((e) => e.steps));
  const trainMinTotal = sum(recent7.map((e) => e.trainingMinutes));

  el.trendCards.innerHTML = "";
  el.trendCards.append(
    createKpi("近7天均重", formatNum(avgWeight7, "kg")),
    createKpi("体重周变化", weightDelta === null ? "-" : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(2)} kg`),
    createKpi("近7天平均睡眠", formatNum(sleepAvg, "h")),
    createKpi("近7天平均步数", formatNum(stepsAvg, "步")),
    createKpi("近7天训练总时长", formatNum(trainMinTotal, "min")),
    createKpi("14天记录覆盖", `${recent14.length}/14`)
  );
}

function renderHistoryTable() {
  const list = state.data.entries.slice(0, 20);
  if (list.length === 0) {
    el.historyRows.innerHTML = `<tr><td colspan="6" class="muted">暂无记录</td></tr>`;
    return;
  }

  el.historyRows.innerHTML = list.map((item) => {
    const doneCount = Array.isArray(item.completedExercises) ? item.completedExercises.length : 0;
    return `
      <tr>
        <td>${item.date}</td>
        <td>${item.weightKg ?? "-"}</td>
        <td>${item.sleepHours ?? "-"}</td>
        <td>${item.steps ?? "-"}</td>
        <td>${item.trainingMinutes ?? 0} min</td>
        <td>${doneCount}</td>
      </tr>
    `;
  }).join("");
}

function renderAdvice() {
  const week = getCurrentWeek();
  const phase = getPhaseByWeek(week);
  const score = getCurrentWeekScore();
  const entries = getLastDaysEntries(14);
  const recent7 = entries.slice(-7);
  const prev7 = entries.slice(-14, -7);

  const adherence = phase.targetSessions > 0 ? score.sessions / phase.targetSessions : 0;
  const sleepAvg = avg(recent7.map((e) => e.sleepHours));
  const rpeAvg = avg(recent7.map((e) => e.rpe));
  const sorenessAvg = avg(recent7.map((e) => e.soreness));
  const wNow = avg(recent7.map((e) => e.weightKg));
  const wPrev = avg(prev7.map((e) => e.weightKg));
  const wDelta = isFiniteNumber(wNow) && isFiniteNumber(wPrev) ? wNow - wPrev : null;

  const lines = [];
  lines.push(`阶段：${phase.name}（第${phase.weekStart}-${phase.weekEnd}周）`);
  lines.push(`训练完成：${score.sessions}/${phase.targetSessions}，睡眠均值：${formatNum(sleepAvg, "h")}，RPE均值：${formatNum(rpeAvg, "")}`);

  if (adherence < 0.6) {
    lines.push("建议等级：重启周");
    lines.push("- 下周每次只做“前2个主动作 + 10分钟有氧启动”。");
    lines.push("- 本周目标只设为达到 " + Math.max(3, Math.ceil(phase.targetSessions * 0.7)) + " 次训练，先稳住频率。");
  } else if ((isFiniteNumber(sleepAvg) && sleepAvg < 6.5) || (isFiniteNumber(sorenessAvg) && sorenessAvg >= 8)) {
    lines.push("建议等级：恢复优先");
    lines.push("- 下周主动作总量减 15%（每个动作少1组或降5-10%重量）。");
    lines.push("- 维持步数，不做高冲击追加。连续2天睡眠 >=7h 后再恢复满量。");
  } else if (adherence >= 0.85 && (!isFiniteNumber(rpeAvg) || rpeAvg <= 7.5) && (!isFiniteNumber(sorenessAvg) || sorenessAvg <= 6.5)) {
    lines.push("建议等级：可渐进升级");
    lines.push("- 下周主力动作每项 +2.5kg 或每组 +1 次（二选一）。");
    lines.push("- 有氧每次 +5 分钟，维持心率区间2。");
  } else {
    lines.push("建议等级：稳态推进");
    lines.push("- 维持当前计划不加项目，先把完成率稳定在 80% 以上。");
    lines.push("- 每次训练结束补 1 句记录：最卡动作和下次改法。");
  }

  if (wDelta !== null) {
    lines.push("体重趋势判断：");
    if (wDelta > 0.3) {
      lines.push("- 近7天体重上行较快，建议减少液体热量和夜宵频次。\n");
    } else if (wDelta < -0.8) {
      lines.push("- 下降过快，建议训练日增加 20-30g 碳水，防止恢复受损。\n");
    } else {
      lines.push("- 体重变化在合理区间，继续按当前节奏推进。\n");
    }
  }

  lines.push("下周执行硬门槛：");
  lines.push("1. 先启动10分钟，再考虑加量。");
  lines.push("2. 睡眠 < 6.5h 当天只做恢复版。\n");

  el.adviceOutput.textContent = lines.join("\n");
  el.adviceOutput.classList.remove("empty");
}

function getCurrentWeek() {
  const start = new Date(`${state.data.profile.planStartDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    return 1;
  }
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const week = Math.floor(diffMs / (7 * 24 * 3600 * 1000)) + 1;
  return Math.max(1, Math.min(TOTAL_WEEKS, week));
}

function getPhaseByWeek(week) {
  return PHASES.find((p) => week >= p.weekStart && week <= p.weekEnd) || PHASES[PHASES.length - 1];
}

function getCurrentWeekScore() {
  const phase = getPhaseByWeek(getCurrentWeek());
  const recent = getLastDaysEntries(7);

  const sessions = recent.filter((e) => isWorkoutCompleted(e)).length;
  const sleepDays = recent.filter((e) => isFiniteNumber(e.sleepHours) && e.sleepHours >= phase.targetSleep).length;
  const stepDays = recent.filter((e) => isFiniteNumber(e.steps) && e.steps >= phase.targetSteps).length;

  return { sessions, sleepDays, stepDays };
}

function isWorkoutCompleted(entry) {
  if (!entry) {
    return false;
  }
  if (entry.workoutSlot === "rest") {
    return false;
  }
  if (Array.isArray(entry.completedExercises) && entry.completedExercises.length > 0) {
    return true;
  }
  return isFiniteNumber(entry.trainingMinutes) && entry.trainingMinutes >= 10;
}

function getLastDaysEntries(days) {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startIso = localDateISO(start);

  return state.data.entries
    .filter((item) => item.date >= startIso)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}

function hydrateProfileForm() {
  const p = state.data.profile;
  el.heightCm.value = p.heightCm;
  el.startWeightKg.value = p.startWeightKg;
  el.goalWeightKg.value = p.goalWeightKg;
  el.planStartDate.value = p.planStartDate || localDateISO(new Date());
}

function createKpi(label, value) {
  const node = document.createElement("div");
  node.className = "kpi";
  node.innerHTML = `<div class="k">${escapeHtml(label)}</div><div class="v">${escapeHtml(String(value))}</div>`;
  return node;
}

function loadData() {
  const fallback = {
    profile: {
      heightCm: 184,
      startWeightKg: 90,
      goalWeightKg: 82,
      planStartDate: localDateISO(new Date())
    },
    entries: []
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return sanitizeData(parsed);
  } catch {
    return fallback;
  }
}

function sanitizeData(raw) {
  const fallback = {
    profile: {
      heightCm: 184,
      startWeightKg: 90,
      goalWeightKg: 82,
      planStartDate: localDateISO(new Date())
    },
    entries: []
  };

  const profile = {
    ...fallback.profile,
    ...(raw?.profile || {})
  };

  const entries = Array.isArray(raw?.entries)
    ? raw.entries
        .filter((item) => typeof item?.date === "string" && item.date)
        .map((item) => ({
          ...item,
          completedExercises: Array.isArray(item.completedExercises) ? item.completedExercises : []
        }))
    : [];

  return { profile, entries };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function toNumber(value) {
  if (value === null || value === "" || value === undefined) {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sum(values) {
  return values.reduce((acc, n) => (isFiniteNumber(n) ? acc + n : acc), 0);
}

function avg(values) {
  const valid = values.filter((n) => isFiniteNumber(n));
  if (valid.length === 0) {
    return null;
  }
  return sum(valid) / valid.length;
}

function isFiniteNumber(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }
  return Number.isFinite(Number(value));
}

function formatNum(value, suffix) {
  if (!isFiniteNumber(value)) {
    return "-";
  }
  const n = Number(value);
  const text = Math.abs(n) >= 100 ? Math.round(n).toString() : n.toFixed(1);
  return suffix ? `${text} ${suffix}` : text;
}

function localDateISO(date) {
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
