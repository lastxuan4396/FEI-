const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

const menuOverlay = document.getElementById("menu-overlay");
const finishOverlay = document.getElementById("finish-overlay");
const startButton = document.getElementById("start-btn");
const restartButton = document.getElementById("restart-btn");
const resultsList = document.getElementById("results-list");
const finishTitle = document.getElementById("finish-title");

const trackSelect = document.getElementById("track-select");
const weatherSelect = document.getElementById("weather-select");
const difficultySelect = document.getElementById("difficulty-select");
const lapsSelect = document.getElementById("laps-select");
const aiSelect = document.getElementById("ai-select");

const hud = document.getElementById("hud");
const leaderboard = document.getElementById("leaderboard");
const leaderList = document.getElementById("leader-list");
const statusBanner = document.getElementById("status-banner");

const hudLap = document.getElementById("hud-lap");
const hudTime = document.getElementById("hud-time");
const hudPosition = document.getElementById("hud-position");
const hudBest = document.getElementById("hud-best");
const hudSpeed = document.getElementById("hud-speed");
const hudDrs = document.getElementById("hud-drs");
const hudPit = document.getElementById("hud-pit");

const fuelBar = document.getElementById("fuel-bar");
const tyreBar = document.getElementById("tyre-bar");
const damageBar = document.getElementById("damage-bar");
const ersBar = document.getElementById("ers-bar");

const FIXED_DT = 1 / 120;
const OFFTRACK_RECOVER_WIDTH = 24;
const PIT_STOP_DURATION = 2.9;
const MAX_RAIN_DROPS = 150;

const TRACK_PRESETS = {
  azure: {
    name: "Azure Coast Circuit",
    width: 138,
    pitOffset: -86,
    pitEntryFraction: 0.74,
    pitExitFraction: 0.93,
    pitStopFraction: 0.84,
    drsFractions: [
      [0.07, 0.19],
      [0.46, 0.59],
    ],
    controlPoints: [
      [0, -520],
      [540, -470],
      [880, -160],
      [860, 220],
      [560, 480],
      [180, 560],
      [-260, 520],
      [-740, 350],
      [-900, -20],
      [-720, -360],
      [-300, -560],
    ],
  },
  ember: {
    name: "Ember Ring",
    width: 130,
    pitOffset: 88,
    pitEntryFraction: 0.66,
    pitExitFraction: 0.89,
    pitStopFraction: 0.77,
    drsFractions: [
      [0.0, 0.12],
      [0.37, 0.51],
    ],
    controlPoints: [
      [0, -580],
      [360, -560],
      [730, -350],
      [900, -40],
      [820, 250],
      [520, 470],
      [130, 520],
      [-250, 460],
      [-660, 280],
      [-880, -40],
      [-810, -380],
      [-420, -560],
    ],
  },
  storm: {
    name: "Storm Valley",
    width: 146,
    pitOffset: -95,
    pitEntryFraction: 0.70,
    pitExitFraction: 0.95,
    pitStopFraction: 0.82,
    drsFractions: [
      [0.11, 0.24],
      [0.54, 0.68],
    ],
    controlPoints: [
      [0, -560],
      [460, -520],
      [820, -290],
      [940, 20],
      [820, 300],
      [540, 470],
      [220, 580],
      [-120, 540],
      [-480, 420],
      [-840, 200],
      [-940, -160],
      [-700, -470],
      [-320, -590],
    ],
  },
};

const WEATHER_PRESETS = {
  sunny: {
    key: "sunny",
    label: "Sunny",
    grip: 1.0,
    rain: 0,
    wind: 0,
    skyTop: "#86c8ff",
    skyBottom: "#21496f",
  },
  mixed: {
    key: "mixed",
    label: "Mixed Clouds",
    grip: 0.94,
    rain: 0.2,
    wind: 24,
    skyTop: "#9fb7cf",
    skyBottom: "#334861",
  },
  rain: {
    key: "rain",
    label: "Rain",
    grip: 0.82,
    rain: 0.9,
    wind: 52,
    skyTop: "#607086",
    skyBottom: "#1f2f40",
  },
};

const DIFFICULTY_PRESETS = {
  rookie: {
    key: "rookie",
    maxSpeed: 91,
    accel: 45,
    brake: 62,
    aiPace: 0.89,
    aiConsistency: 0.84,
  },
  challenger: {
    key: "challenger",
    maxSpeed: 99,
    accel: 50,
    brake: 66,
    aiPace: 0.95,
    aiConsistency: 0.91,
  },
  pro: {
    key: "pro",
    maxSpeed: 106,
    accel: 54,
    brake: 70,
    aiPace: 1.0,
    aiConsistency: 0.97,
  },
};

const AI_NAMES = [
  "A. Novak",
  "J. Hart",
  "P. Ito",
  "M. Rossi",
  "L. Vega",
  "S. Khan",
  "R. Marin",
  "K. Blake",
  "T. Silva",
  "D. Costa",
  "N. Ivanov",
  "C. Grant",
  "E. Yamada",
  "B. Laurent",
  "F. Nolan",
  "Y. Sato",
  "Q. Boone",
  "I. Mercier",
];

const CAR_COLORS = [
  "#35d0ff",
  "#ff905e",
  "#7dff9c",
  "#ffd34f",
  "#ff6f8f",
  "#8fa8ff",
  "#66f3d1",
  "#ffc66b",
  "#ef9bff",
  "#f4ff73",
  "#7ad3ff",
  "#ffb3d6",
  "#6dffe1",
  "#ff8f7f",
  "#98f6b4",
];

const state = {
  mode: "menu",
  paused: false,
  raceTime: 0,
  finishHold: 0,
  countdown: 3.8,
  totalLaps: 8,
  config: null,
  track: null,
  weather: WEATHER_PRESETS.sunny,
  difficulty: DIFFICULTY_PRESETS.pro,
  cars: [],
  sortedCars: [],
  player: null,
  lastFrameTs: 0,
  accumulator: 0,
  viewport: {
    w: window.innerWidth,
    h: window.innerHeight,
    dpr: Math.min(2, window.devicePixelRatio || 1),
  },
  camera: {
    x: 0,
    y: 0,
    zoom: 0.7,
  },
  keys: Object.create(null),
  commands: {
    requestPit: false,
    requestDrs: false,
  },
  rainDrops: [],
  temporaryMessage: "",
  temporaryMessageTimer: 0,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function wrap(value, max) {
  const result = value % max;
  return result < 0 ? result + max : result;
}

function wrapSigned(delta, max) {
  let value = ((delta + max * 0.5) % max + max) % max;
  value -= max * 0.5;
  return value;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "--:--.---";
  }
  const mins = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);
  return `${String(mins).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      ((2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      ((2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

function normalize(x, y) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

function buildTrack(preset) {
  const base = preset.controlPoints.map(([x, y]) => ({ x, y }));
  const points = [];
  const subdivisions = 22;

  for (let i = 0; i < base.length; i += 1) {
    const p0 = base[(i - 1 + base.length) % base.length];
    const p1 = base[i];
    const p2 = base[(i + 1) % base.length];
    const p3 = base[(i + 2) % base.length];
    for (let s = 0; s < subdivisions; s += 1) {
      const t = s / subdivisions;
      points.push(catmullRom(p0, p1, p2, p3, t));
    }
  }

  const cumulative = [0];
  const segmentLengths = [];
  let length = 0;

  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const segment = Math.hypot(b.x - a.x, b.y - a.y);
    segmentLengths.push(segment);
    length += segment;
    cumulative.push(length);
  }

  const tangents = [];
  const curvatures = [];

  for (let i = 0; i < points.length; i += 1) {
    const prev = points[(i - 1 + points.length) % points.length];
    const next = points[(i + 1) % points.length];
    const tan = normalize(next.x - prev.x, next.y - prev.y);
    tangents.push(tan);
  }

  for (let i = 0; i < points.length; i += 1) {
    const prev = tangents[(i - 1 + points.length) % points.length];
    const next = tangents[(i + 1) % points.length];
    const cross = prev.x * next.y - prev.y * next.x;
    const scale = Math.max(5, segmentLengths[i]);
    curvatures.push(cross / scale);
  }

  const pitEntryS = preset.pitEntryFraction * length;
  const pitExitS = preset.pitExitFraction * length;
  const pitStopS = preset.pitStopFraction * length;

  const drsZones = preset.drsFractions.map(([start, end]) => ({
    start: start * length,
    end: end * length,
  }));

  const pitPath = buildPitPath(
    {
      points,
      tangents,
      curvatures,
      cumulative,
      segmentLengths,
      length,
    },
    pitEntryS,
    pitExitS,
    preset.pitOffset
  );

  return {
    name: preset.name,
    points,
    tangents,
    curvatures,
    cumulative,
    segmentLengths,
    length,
    width: preset.width,
    halfWidth: preset.width * 0.5,
    pitOffset: preset.pitOffset,
    pitEntryS,
    pitExitS,
    pitStopS,
    pitSpeedLimit: 27,
    drsZones,
    pitPath,
  };
}

function buildPitPath(trackCore, entryS, exitS, pitOffset) {
  const path = [];
  const step = 22;
  let s = entryS;
  const maxPoints = Math.ceil(trackCore.length / step) + 8;

  for (let i = 0; i < maxPoints; i += 1) {
    const sample = sampleTrackRaw(trackCore, s);
    path.push({
      x: sample.x + sample.normalX * pitOffset,
      y: sample.y + sample.normalY * pitOffset,
    });

    if (isInWindow(s, entryS, exitS, trackCore.length) && isInWindow(wrap(s + step, trackCore.length), entryS, exitS, trackCore.length) === false) {
      const endSample = sampleTrackRaw(trackCore, exitS);
      path.push({
        x: endSample.x + endSample.normalX * pitOffset,
        y: endSample.y + endSample.normalY * pitOffset,
      });
      break;
    }

    s = wrap(s + step, trackCore.length);
  }

  return path;
}

function sampleTrackRaw(track, s) {
  const wrapped = wrap(s, track.length);
  let low = 0;
  let high = track.segmentLengths.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (track.cumulative[mid + 1] <= wrapped) {
      low = mid + 1;
    } else if (track.cumulative[mid] > wrapped) {
      high = mid - 1;
    } else {
      low = mid;
      break;
    }
  }

  const index = clamp(low, 0, track.segmentLengths.length - 1);
  const startS = track.cumulative[index];
  const segLength = track.segmentLengths[index] || 1;
  const t = clamp((wrapped - startS) / segLength, 0, 1);

  const a = track.points[index];
  const b = track.points[(index + 1) % track.points.length];
  const tanA = track.tangents[index];
  const tanB = track.tangents[(index + 1) % track.tangents.length];
  const curvature = lerp(track.curvatures[index], track.curvatures[(index + 1) % track.curvatures.length], t);

  const tangent = normalize(lerp(tanA.x, tanB.x, t), lerp(tanA.y, tanB.y, t));

  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    tangentX: tangent.x,
    tangentY: tangent.y,
    normalX: -tangent.y,
    normalY: tangent.x,
    curvature,
  };
}

function sampleTrack(track, s) {
  return sampleTrackRaw(track, s);
}

function isInWindow(s, start, end, length) {
  if (start <= end) {
    return s >= start && s <= end;
  }
  return s >= start || s <= end;
}

function passesMarker(prevS, nextS, marker, length) {
  if (prevS <= nextS) {
    return prevS < marker && nextS >= marker;
  }
  return prevS < marker || nextS >= marker;
}

function createCar(options) {
  return {
    id: options.id,
    name: options.name,
    color: options.color,
    isPlayer: options.isPlayer,
    skill: options.skill,
    s: options.startS,
    offset: options.startOffset,
    offsetVel: 0,
    heading: 0,
    worldX: 0,
    worldY: 0,
    speed: 0,
    throttle: 0,
    brake: 0,
    steer: 0,
    lap: 1,
    lapStartTime: 0,
    bestLap: 0,
    lastLap: 0,
    sectorMask: 0,
    finished: false,
    retired: false,
    finishTime: 0,
    penaltyTime: 0,
    gapToLeader: 0,
    position: 1,
    fuel: 1,
    tyre: 1,
    damage: 0,
    ers: 1,
    ersActive: false,
    drsTimer: 0,
    drsCooldown: 0,
    pitPlan: false,
    inPit: false,
    pitTimer: 0,
    pitServiced: false,
    cutTimer: 0,
    cutPenaltyArmed: false,
    desiredOffset: options.startOffset,
    laneChangeTimer: 0,
  };
}

function setupRace(config) {
  state.config = config;
  state.track = buildTrack(TRACK_PRESETS[config.track]);
  state.weather = WEATHER_PRESETS[config.weather];
  state.difficulty = DIFFICULTY_PRESETS[config.difficulty];
  state.totalLaps = config.laps;

  state.raceTime = 0;
  state.finishHold = 0;
  state.countdown = 3.8;
  state.mode = "countdown";
  state.paused = false;

  state.cars = [];
  const totalCars = config.aiCount + 1;
  const trackLength = state.track.length;
  const gridStart = 260;

  const player = createCar({
    id: 0,
    name: "You",
    color: "#7ff0ff",
    isPlayer: true,
    skill: 1,
    startS: gridStart,
    startOffset: -14,
  });
  state.cars.push(player);
  state.player = player;

  for (let i = 1; i < totalCars; i += 1) {
    const row = Math.floor(i / 2);
    const left = i % 2 === 0;
    const skillVariance = 0.85 + Math.random() * 0.22;
    const ai = createCar({
      id: i,
      name: AI_NAMES[(i - 1) % AI_NAMES.length],
      color: CAR_COLORS[(i - 1) % CAR_COLORS.length],
      isPlayer: false,
      skill: skillVariance,
      startS: wrap(gridStart - row * 28 - 18, trackLength),
      startOffset: left ? -20 : 20,
    });
    ai.speed = 1;
    state.cars.push(ai);
  }

  for (const car of state.cars) {
    refreshCarPose(car);
  }

  updateStandings();
  state.temporaryMessage = "Grid Locked";
  state.temporaryMessageTimer = 1.2;

  menuOverlay.classList.remove("visible");
  finishOverlay.classList.remove("visible");
  hud.classList.remove("hidden");
  leaderboard.classList.remove("hidden");
  statusBanner.classList.add("hidden");
  renderResults([]);
}

function refreshCarPose(car) {
  const sample = sampleTrack(state.track, car.s);
  car.heading = Math.atan2(sample.tangentY, sample.tangentX) + car.offsetVel * 0.0045;
  car.worldX = sample.x + sample.normalX * car.offset;
  car.worldY = sample.y + sample.normalY * car.offset;
  car.curvature = sample.curvature;
}

function controlPlayer(car) {
  const left = state.keys.ArrowLeft || state.keys.KeyA;
  const right = state.keys.ArrowRight || state.keys.KeyD;
  const throttle = state.keys.ArrowUp || state.keys.KeyW;
  const brake = state.keys.ArrowDown || state.keys.KeyS;

  car.throttle = throttle ? 1 : 0;
  car.brake = brake ? 1 : 0;
  car.steer = (left ? -1 : 0) + (right ? 1 : 0);

  if (state.commands.requestPit && isInWindow(car.s, state.track.pitEntryS, state.track.pitExitS, state.track.length)) {
    car.pitPlan = true;
    car.inPit = true;
    state.temporaryMessage = "Pit Entry Armed";
    state.temporaryMessageTimer = 1.5;
  }

  if (state.commands.requestDrs && canUseDrs(car)) {
    car.drsTimer = 4;
    car.drsCooldown = 12;
    state.temporaryMessage = "DRS Open";
    state.temporaryMessageTimer = 0.8;
  }

  car.ersActive = Boolean(state.keys.ShiftLeft || state.keys.ShiftRight) && car.ers > 0.02;
}

function controlAi(car, dt) {
  const track = state.track;
  car.laneChangeTimer -= dt;

  const lookAhead = sampleTrack(track, car.s + 34 + car.speed * 0.35);
  const curve = Math.abs(lookAhead.curvature);

  let targetSpeed = state.difficulty.maxSpeed * state.difficulty.aiPace * car.skill;
  targetSpeed -= curve * 820;
  targetSpeed *= 0.84 + car.tyre * 0.18;
  targetSpeed *= 1 - state.weather.rain * 0.16;

  if (car.fuel < 0.12) {
    targetSpeed *= 0.82;
  }
  if (car.damage > 0.45) {
    targetSpeed *= 0.8;
  }
  if (car.inPit) {
    targetSpeed = Math.min(targetSpeed, state.track.pitSpeedLimit * 0.95);
  }

  if (car.laneChangeTimer <= 0) {
    const laneBias = (Math.random() - 0.5) * state.track.halfWidth * 0.48;
    car.desiredOffset = clamp(laneBias, -state.track.halfWidth * 0.62, state.track.halfWidth * 0.62);
    car.laneChangeTimer = 1.2 + Math.random() * 2.4;
  }

  const nearbyAhead = findCarAhead(car);
  if (nearbyAhead) {
    const gap = forwardDistance(car.s, nearbyAhead.s, state.track.length);
    const lateralGap = Math.abs(car.offset - nearbyAhead.offset);
    if (gap < 70 && lateralGap < 18) {
      car.desiredOffset += car.offset <= nearbyAhead.offset ? -18 : 18;
      targetSpeed *= 0.92;
    }
    if (gap < 36 && lateralGap < 10) {
      targetSpeed *= 0.8;
    }
  }

  if (!car.pitPlan) {
    const lifeThreshold = 0.24 + (1 - state.difficulty.aiConsistency) * 0.16;
    if (car.tyre < lifeThreshold || car.fuel < 0.15 || car.damage > 0.62) {
      car.pitPlan = true;
    }
  }

  if (car.pitPlan && isInWindow(car.s, track.pitEntryS, track.pitExitS, track.length)) {
    car.inPit = true;
  }

  if (car.inPit) {
    car.desiredOffset = track.pitOffset;
  }

  car.throttle = targetSpeed > car.speed ? clamp((targetSpeed - car.speed) / 36, 0, 1) : 0;
  car.brake = targetSpeed < car.speed ? clamp((car.speed - targetSpeed) / 28, 0, 1) : 0;

  const steerError = car.desiredOffset - car.offset;
  car.steer = clamp(steerError * 0.055 - car.offsetVel * 0.042, -1, 1);

  const aiDrsReady = !car.inPit && car.drsCooldown <= 0 && car.ers > 0.3;
  if (aiDrsReady && inDrsZone(car.s) && nearbyAhead) {
    const gap = estimateGapSeconds(car, nearbyAhead);
    if (gap < 1.45 && gap > 0.03 && Math.random() > 0.92) {
      car.drsTimer = 3.2;
      car.drsCooldown = 11;
    }
  }

  car.ersActive = !car.inPit && car.ers > 0.2 && curve < 0.00075 && car.speed > 58;
}

function findCarAhead(car) {
  let best = null;
  let bestGap = Infinity;
  for (const candidate of state.cars) {
    if (candidate.id === car.id || candidate.finished) {
      continue;
    }
    const gap = forwardDistance(car.s, candidate.s, state.track.length);
    if (gap > 0 && gap < bestGap && gap < 120) {
      bestGap = gap;
      best = candidate;
    }
  }
  return best;
}

function forwardDistance(fromS, toS, length) {
  let d = toS - fromS;
  if (d < 0) {
    d += length;
  }
  return d;
}

function estimateGapSeconds(chaser, target) {
  const distance = forwardDistance(chaser.s, target.s, state.track.length);
  const speed = Math.max((chaser.speed + target.speed) * 0.5, 28);
  return distance / speed;
}

function canUseDrs(car) {
  if (state.weather.rain > 0.45 || car.drsCooldown > 0 || car.drsTimer > 0 || car.finished) {
    return false;
  }
  if (!inDrsZone(car.s)) {
    return false;
  }
  const ahead = state.sortedCars[car.position - 2];
  if (!ahead) {
    return false;
  }
  const gap = estimateGapSeconds(car, ahead);
  return gap > 0.05 && gap <= 1.2;
}

function inDrsZone(s) {
  for (const zone of state.track.drsZones) {
    if (isInWindow(s, zone.start, zone.end, state.track.length)) {
      return true;
    }
  }
  return false;
}

function simulateCar(car, dt) {
  if (car.finished) {
    return;
  }

  car.drsTimer = Math.max(0, car.drsTimer - dt);
  car.drsCooldown = Math.max(0, car.drsCooldown - dt);

  const sample = sampleTrack(state.track, car.s);
  const grip = state.weather.grip * (0.52 + car.tyre * 0.48) * (1 - car.damage * 0.34);
  const speedCeilingBase = state.difficulty.maxSpeed * (0.92 + car.skill * 0.14);

  let maxSpeed = speedCeilingBase * (1 - car.damage * 0.4);
  if (car.drsTimer > 0) {
    maxSpeed *= 1.08;
  }
  if (car.ersActive) {
    maxSpeed *= 1.07;
  }
  if (car.fuel < 0.08) {
    maxSpeed *= 0.78;
  }

  if (car.inPit) {
    maxSpeed = Math.min(maxSpeed, state.track.pitSpeedLimit);
  }

  const accelBase = state.difficulty.accel * (1 - car.damage * 0.32);
  let accel = car.throttle * accelBase * (1.08 - car.speed / Math.max(maxSpeed, 1));
  accel -= car.brake * state.difficulty.brake;
  accel -= 0.0033 * car.speed * car.speed * (car.drsTimer > 0 ? 0.84 : 1);

  if (Math.abs(car.offset) > state.track.halfWidth - 8) {
    accel -= 13;
  }

  if (car.fuel <= 0.001) {
    accel -= 22;
  }

  car.speed = clamp(car.speed + accel * dt, 0, Math.max(20, maxSpeed));

  const steerStrength = 85 * grip * (0.28 + car.speed / Math.max(speedCeilingBase, 1));
  car.offsetVel += car.steer * steerStrength * dt;

  const cornerPush = sample.curvature * car.speed * car.speed;
  car.offsetVel += cornerPush * dt * (1.08 - grip);

  if (car.inPit) {
    car.offsetVel += (state.track.pitOffset - car.offset) * dt * 2.2;
  }

  car.offsetVel *= Math.exp(-dt * (5.2 + grip * 2.8));
  car.offset += car.offsetVel * dt;

  const legalOffset = state.track.halfWidth - 8;
  const spill = Math.abs(car.offset) - legalOffset;

  if (spill > 0) {
    car.speed = Math.max(0, car.speed - spill * 2.3 * dt - 8.5 * dt);
    car.damage = clamp(car.damage + spill * 0.0012 * dt * (0.6 + car.speed / 85), 0, 1);
    car.cutTimer += dt;

    if (Math.abs(car.offset) > state.track.halfWidth + OFFTRACK_RECOVER_WIDTH) {
      car.offset = Math.sign(car.offset) * (state.track.halfWidth + OFFTRACK_RECOVER_WIDTH);
      car.offsetVel *= -0.4;
      car.speed *= 0.72;
    }
  } else {
    car.cutTimer = Math.max(0, car.cutTimer - dt * 0.9);
  }

  if (car.cutTimer > 1.75 && !car.cutPenaltyArmed) {
    car.penaltyTime += 2;
    car.cutPenaltyArmed = true;
    if (car.isPlayer) {
      state.temporaryMessage = "Track Limit +2s";
      state.temporaryMessageTimer = 1.2;
    }
  }

  if (car.cutTimer < 0.2) {
    car.cutPenaltyArmed = false;
  }

  const travel = car.speed * dt;
  const prevS = car.s;
  let nextS = prevS + travel;

  if (nextS < state.track.length) {
    applySectorMarkers(car, prevS, nextS);
    car.s = nextS;
  } else {
    applySectorMarkers(car, prevS, state.track.length - 0.0001);

    if ((car.sectorMask & 0b11) !== 0b11) {
      car.penaltyTime += 4;
    }

    car.sectorMask = 0;
    nextS -= state.track.length;
    car.s = nextS;
    applySectorMarkers(car, 0, car.s);

    const lapTime = state.raceTime - car.lapStartTime;
    car.lastLap = lapTime;
    if (car.bestLap === 0 || lapTime < car.bestLap) {
      car.bestLap = lapTime;
    }
    car.lapStartTime = state.raceTime;
    car.lap += 1;

    if (car.lap > state.totalLaps) {
      car.finished = true;
      car.finishTime = state.raceTime + car.penaltyTime;
      car.speed *= 0.65;
      if (car.isPlayer) {
        state.temporaryMessage = "Chequered Flag";
        state.temporaryMessageTimer = 1.4;
      }
    }
  }

  const tyreWearRate =
    (0.00105 + car.speed * 0.000018 + Math.abs(car.offsetVel) * 0.00024 + Math.abs(car.steer) * 0.0002) *
    (1 + state.weather.rain * 0.7);
  car.tyre = clamp(car.tyre - tyreWearRate * dt, 0.03, 1);

  const fuelBurnRate = 0.0024 + car.speed * 0.000034;
  car.fuel = clamp(car.fuel - fuelBurnRate * dt, 0, 1);

  if (car.ersActive && car.speed > 34 && car.ers > 0) {
    car.ers = clamp(car.ers - 0.16 * dt, 0, 1);
    car.speed = Math.min(car.speed + 7 * dt, maxSpeed + 10);
  } else {
    car.ers = clamp(car.ers + 0.07 * dt, 0, 1);
  }

  updatePitStop(car, dt, prevS);

  refreshCarPose(car);
}

function applySectorMarkers(car, prevS, nextS) {
  const first = state.track.length / 3;
  const second = (state.track.length * 2) / 3;

  if (passesMarker(prevS, nextS, first, state.track.length)) {
    car.sectorMask |= 0b01;
  }
  if (passesMarker(prevS, nextS, second, state.track.length)) {
    car.sectorMask |= 0b10;
  }
}

function updatePitStop(car, dt, prevS) {
  const track = state.track;

  if (car.pitPlan && isInWindow(car.s, track.pitEntryS, track.pitExitS, track.length)) {
    car.inPit = true;
  }

  if (car.inPit) {
    const deltaToStop = wrapSigned(track.pitStopS - car.s, track.length);
    if (Math.abs(deltaToStop) < 17) {
      car.brake = Math.max(car.brake, 0.85);
      if (car.speed < 7) {
        car.pitTimer += dt;
      }

      if (car.pitTimer >= PIT_STOP_DURATION && !car.pitServiced) {
        car.pitServiced = true;
        car.fuel = 1;
        car.tyre = 1;
        car.damage = Math.max(0, car.damage - 0.36);
        car.ers = 1;
        car.penaltyTime += 0;
        if (car.isPlayer) {
          state.temporaryMessage = "Pit Service Complete";
          state.temporaryMessageTimer = 1.5;
        }
      }
    }
  } else {
    car.pitTimer = 0;
  }

  const inWindowNow = isInWindow(car.s, track.pitEntryS, track.pitExitS, track.length);
  const inWindowBefore = isInWindow(prevS, track.pitEntryS, track.pitExitS, track.length);

  if (car.inPit && inWindowBefore && !inWindowNow) {
    car.inPit = false;
    car.pitPlan = false;
    car.pitServiced = false;
    car.pitTimer = 0;
  }
}

function applyCarContacts() {
  for (let i = 0; i < state.cars.length; i += 1) {
    for (let j = i + 1; j < state.cars.length; j += 1) {
      const a = state.cars[i];
      const b = state.cars[j];

      if (a.finished && b.finished) {
        continue;
      }

      const dx = a.worldX - b.worldX;
      const dy = a.worldY - b.worldY;
      const dist = Math.hypot(dx, dy);

      if (dist < 18) {
        const impact = clamp((18 - dist) / 18, 0, 1);
        a.speed *= 1 - impact * 0.14;
        b.speed *= 1 - impact * 0.14;
        a.damage = clamp(a.damage + impact * 0.0011, 0, 1);
        b.damage = clamp(b.damage + impact * 0.0011, 0, 1);

        const lateralDiff = a.offset - b.offset;
        if (Math.abs(lateralDiff) < 9) {
          const push = (9 - Math.abs(lateralDiff)) * 0.7;
          const direction = lateralDiff === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(lateralDiff);
          a.offset += push * direction;
          b.offset -= push * direction;
        }
      }
    }
  }
}

function updateStandings() {
  const list = [...state.cars].sort((a, b) => {
    if (a.retired !== b.retired) {
      return a.retired ? 1 : -1;
    }

    if (a.finished || b.finished) {
      if (a.finished && b.finished) {
        return a.finishTime - b.finishTime;
      }
      return a.finished ? -1 : 1;
    }

    if (a.lap !== b.lap) {
      return b.lap - a.lap;
    }

    return b.s - a.s;
  });

  state.sortedCars = list;

  for (let i = 0; i < list.length; i += 1) {
    list[i].position = i + 1;
  }

  const leader = list[0];
  if (!leader) {
    return;
  }

  for (let i = 0; i < list.length; i += 1) {
    const car = list[i];
    if (i === 0) {
      car.gapToLeader = 0;
      continue;
    }

    if (leader.finished && car.finished) {
      car.gapToLeader = Math.max(0, car.finishTime - leader.finishTime);
      continue;
    }

    const lapGap = leader.lap - car.lap;
    let distanceGap = lapGap * state.track.length + (leader.s - car.s);
    if (distanceGap < 0) {
      distanceGap += state.track.length;
    }

    const avgSpeed = Math.max((leader.speed + car.speed) * 0.5, 30);
    car.gapToLeader = distanceGap / avgSpeed + car.penaltyTime;
  }
}

function updateRace(dt) {
  if (state.mode === "countdown") {
    state.countdown -= dt;
    if (state.countdown <= 0) {
      state.mode = "race";
      state.countdown = 0;
      state.temporaryMessage = "Green Flag";
      state.temporaryMessageTimer = 0.9;
    }
  } else if (state.mode === "race") {
    state.raceTime += dt;
  }

  if (state.mode === "countdown" || state.mode === "race") {
    for (const car of state.cars) {
      if (car.isPlayer) {
        controlPlayer(car);
      } else {
        controlAi(car, dt);
      }
    }

    for (const car of state.cars) {
      simulateCar(car, dt);
    }

    applyCarContacts();
    updateStandings();

    if (state.player.finished) {
      state.finishHold += dt;
      const everyoneDone = state.cars.every((car) => car.finished);
      if (state.finishHold > 4 || everyoneDone) {
        state.mode = "finished";
        showFinish();
      }
    }
  }

  updateCamera(dt);
  updateHud();
  updateRain(dt);

  if (state.temporaryMessageTimer > 0) {
    state.temporaryMessageTimer -= dt;
    if (state.temporaryMessageTimer <= 0) {
      state.temporaryMessage = "";
    }
  }

  state.commands.requestPit = false;
  state.commands.requestDrs = false;
}

function updateCamera(dt) {
  if (!state.player) {
    return;
  }
  const targetZoom = clamp(Math.min(state.viewport.w / 1900, state.viewport.h / 1020), 0.38, 0.82);
  state.camera.zoom = lerp(state.camera.zoom, targetZoom, 1 - Math.exp(-dt * 4));

  state.camera.x = lerp(state.camera.x, state.player.worldX, 1 - Math.exp(-dt * 7));
  state.camera.y = lerp(state.camera.y, state.player.worldY, 1 - Math.exp(-dt * 7));
}

function updateRain(dt) {
  const rainLevel = state.weather.rain;
  const desiredCount = Math.floor(MAX_RAIN_DROPS * rainLevel);

  while (state.rainDrops.length < desiredCount) {
    state.rainDrops.push({
      x: Math.random() * state.viewport.w,
      y: Math.random() * state.viewport.h,
      speed: 240 + Math.random() * 460,
      length: 10 + Math.random() * 14,
    });
  }
  while (state.rainDrops.length > desiredCount) {
    state.rainDrops.pop();
  }

  for (const drop of state.rainDrops) {
    drop.x += state.weather.wind * dt * 0.2;
    drop.y += drop.speed * dt;

    if (drop.y > state.viewport.h + 30) {
      drop.y = -20;
      drop.x = Math.random() * state.viewport.w;
    }
    if (drop.x > state.viewport.w + 20) {
      drop.x = -20;
    }
    if (drop.x < -20) {
      drop.x = state.viewport.w + 20;
    }
  }
}

function updateHud() {
  if (!state.player) {
    return;
  }

  const player = state.player;
  const totalCars = state.cars.length;

  hudLap.textContent = `Lap ${Math.min(player.lap, state.totalLaps)} / ${state.totalLaps}`;
  hudTime.textContent = `Race ${formatTime(state.raceTime)}`;
  hudPosition.textContent = `P${player.position} / ${totalCars}`;
  hudBest.textContent = `Best ${formatTime(player.bestLap)}`;
  hudSpeed.textContent = String(Math.round(player.speed * 3.6));

  const drsReady = canUseDrs(player);
  hudDrs.textContent = player.drsTimer > 0 ? "DRS OPEN" : drsReady ? "DRS READY" : "DRS LOCKED";
  hudDrs.classList.toggle("ready", player.drsTimer > 0 || drsReady);
  hudDrs.classList.toggle("hot", false);

  const inPitWindow = isInWindow(player.s, state.track.pitEntryS, state.track.pitExitS, state.track.length);
  if (player.inPit) {
    hudPit.textContent = "PIT LANE";
    hudPit.classList.add("ready");
    hudPit.classList.remove("hot");
  } else if (inPitWindow) {
    hudPit.textContent = "PIT OPEN";
    hudPit.classList.add("hot");
    hudPit.classList.remove("ready");
  } else {
    hudPit.textContent = "PIT CLOSED";
    hudPit.classList.remove("ready", "hot");
  }

  fuelBar.style.width = `${Math.round(player.fuel * 100)}%`;
  tyreBar.style.width = `${Math.round(player.tyre * 100)}%`;
  damageBar.style.width = `${Math.round(player.damage * 100)}%`;
  ersBar.style.width = `${Math.round(player.ers * 100)}%`;

  renderLeaderboard();

  if (state.paused) {
    statusBanner.textContent = "PAUSED";
    statusBanner.classList.remove("hidden");
  } else if (state.mode === "countdown") {
    statusBanner.textContent = `START IN ${Math.max(1, Math.ceil(state.countdown))}`;
    statusBanner.classList.remove("hidden");
  } else {
    statusBanner.classList.add("hidden");
  }
}

function renderLeaderboard() {
  const leader = state.sortedCars[0];
  leaderList.innerHTML = "";

  for (const car of state.sortedCars.slice(0, 10)) {
    const li = document.createElement("li");
    const left = document.createElement("span");
    const right = document.createElement("span");

    left.textContent = `${car.position}. ${car.name}`;

    if (car.position === 1) {
      right.textContent = "Leader";
    } else if (leader && leader.finished && car.finished) {
      right.textContent = `+${formatTime(Math.max(0, car.finishTime - leader.finishTime))}`;
    } else {
      right.textContent = `+${car.gapToLeader.toFixed(1)}s`;
    }

    li.append(left, right);
    if (car.isPlayer) {
      li.style.color = "#8cf4ff";
      li.style.fontWeight = "700";
    }
    leaderList.append(li);
  }
}

function showFinish() {
  const sorted = [...state.sortedCars];
  const player = state.player;

  finishTitle.textContent = player.position === 1 ? "Victory" : `Finished P${player.position}`;

  const output = sorted.slice(0, 12).map((car) => {
    if (car.retired) {
      return { name: car.name, time: "DNF" };
    }

    if (car.position === 1) {
      return { name: car.name, time: formatTime(car.finishTime) };
    }

    const leader = sorted[0];
    if (leader && leader.finished) {
      return { name: car.name, time: `+${formatTime(Math.max(0, car.finishTime - leader.finishTime))}` };
    }

    return { name: car.name, time: `+${car.gapToLeader.toFixed(1)}s` };
  });

  renderResults(output);
  finishOverlay.classList.add("visible");
}

function renderResults(rows) {
  resultsList.innerHTML = "";

  for (const row of rows) {
    const item = document.createElement("li");
    const left = document.createElement("span");
    const right = document.createElement("span");
    left.textContent = row.name;
    right.textContent = row.time;
    item.append(left, right);
    resultsList.append(item);
  }
}

function drawWorld() {
  if (!state.track) {
    return;
  }

  ctx.save();
  ctx.translate(state.viewport.w * 0.5, state.viewport.h * 0.5);
  ctx.scale(state.camera.zoom, state.camera.zoom);
  ctx.translate(-state.camera.x, -state.camera.y);

  drawTrack();
  drawCars();

  ctx.restore();

  drawMiniMap();
}

function traceLoopPath(points) {
  if (!points.length) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
}

function drawTrack() {
  const track = state.track;
  const points = track.points;

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.strokeStyle = "#051018";
  ctx.lineWidth = track.width + 26;
  traceLoopPath(points);
  ctx.stroke();

  ctx.strokeStyle = "#2a3440";
  ctx.lineWidth = track.width;
  traceLoopPath(points);
  ctx.stroke();

  ctx.strokeStyle = "rgba(226,236,255,0.15)";
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 18]);
  traceLoopPath(points);
  ctx.stroke();
  ctx.setLineDash([]);

  if (track.pitPath.length > 1) {
    ctx.strokeStyle = "#515f78";
    ctx.lineWidth = track.width * 0.38;
    ctx.beginPath();
    ctx.moveTo(track.pitPath[0].x, track.pitPath[0].y);
    for (let i = 1; i < track.pitPath.length; i += 1) {
      ctx.lineTo(track.pitPath[i].x, track.pitPath[i].y);
    }
    ctx.stroke();
  }

  const start = sampleTrack(track, 0);
  ctx.save();
  ctx.translate(start.x, start.y);
  ctx.rotate(Math.atan2(start.tangentY, start.tangentX));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-4, -track.halfWidth, 8, track.width);
  ctx.restore();
}

function drawCars() {
  const drawList = [...state.cars].sort((a, b) => a.worldY - b.worldY);

  for (const car of drawList) {
    ctx.save();
    ctx.translate(car.worldX, car.worldY);
    ctx.rotate(car.heading);

    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(-13, -5, 26, 10);

    ctx.fillStyle = car.color;
    ctx.fillRect(-14, -6, 28, 12);

    ctx.fillStyle = "#182432";
    ctx.fillRect(-7, -4, 14, 8);

    ctx.fillStyle = "#dfefff";
    ctx.fillRect(-4, -2, 8, 4);

    if (car.isPlayer) {
      ctx.strokeStyle = "#86f8ff";
      ctx.lineWidth = 2;
      ctx.strokeRect(-16, -8, 32, 16);
    }

    if (car.drsTimer > 0) {
      ctx.fillStyle = "#7ef37d";
      ctx.fillRect(-13, -9.5, 26, 2.5);
    }

    if (car.inPit) {
      ctx.fillStyle = "#ffd562";
      ctx.fillRect(-2, -12, 4, 2);
    }

    ctx.restore();
  }
}

function drawMiniMap() {
  if (!state.track || !state.player) {
    return;
  }

  const width = Math.min(220, state.viewport.w * 0.28);
  const height = Math.min(150, state.viewport.h * 0.2);
  const x = 10;
  const y = state.viewport.h - height - 10;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "rgba(8, 16, 26, 0.74)";
  ctx.strokeStyle = "rgba(255,255,255,0.17)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, 10);
  ctx.fill();
  ctx.stroke();

  const bounds = getTrackBounds(state.track.points);
  const margin = 14;
  const scaleX = (width - margin * 2) / (bounds.maxX - bounds.minX);
  const scaleY = (height - margin * 2) / (bounds.maxY - bounds.minY);
  const scale = Math.min(scaleX, scaleY);

  const offsetX = margin + (width - margin * 2 - (bounds.maxX - bounds.minX) * scale) * 0.5;
  const offsetY = margin + (height - margin * 2 - (bounds.maxY - bounds.minY) * scale) * 0.5;

  const tx = (worldX) => offsetX + (worldX - bounds.minX) * scale;
  const ty = (worldY) => offsetY + (worldY - bounds.minY) * scale;

  ctx.strokeStyle = "rgba(182,199,226,0.48)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx(state.track.points[0].x), ty(state.track.points[0].y));
  for (let i = 1; i < state.track.points.length; i += 1) {
    ctx.lineTo(tx(state.track.points[i].x), ty(state.track.points[i].y));
  }
  ctx.closePath();
  ctx.stroke();

  for (const car of state.cars) {
    ctx.fillStyle = car.isPlayer ? "#84f8ff" : car.color;
    const radius = car.isPlayer ? 3 : 2;
    ctx.beginPath();
    ctx.arc(tx(car.worldX), ty(car.worldY), radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function getTrackBounds(points) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, maxX, minY, maxY };
}

function drawWeatherLayer() {
  if (state.weather.rain <= 0.05) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = `rgba(190,220,255,${0.12 + state.weather.rain * 0.25})`;
  ctx.lineWidth = 1.2;

  for (const drop of state.rainDrops) {
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x + state.weather.wind * 0.03, drop.y + drop.length);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, state.viewport.h);
  gradient.addColorStop(0, state.weather.skyTop);
  gradient.addColorStop(1, state.weather.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.viewport.w, state.viewport.h);

  ctx.save();
  ctx.globalAlpha = 0.08;
  const stripe = 38;
  for (let y = -stripe; y < state.viewport.h + stripe; y += stripe) {
    ctx.fillStyle = y % (stripe * 2) === 0 ? "#ffffff" : "#0a1726";
    ctx.fillRect(0, y + Math.sin((state.raceTime + y) * 0.01) * 2, state.viewport.w, stripe * 0.5);
  }
  ctx.restore();
}

function drawCenterMessages() {
  if (state.mode === "countdown") {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "700 92px 'Saira Condensed', 'Orbitron', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const text = String(Math.max(1, Math.ceil(state.countdown)));
    ctx.fillText(text, state.viewport.w * 0.5, state.viewport.h * 0.5);
    ctx.restore();
  }

  if (state.temporaryMessage) {
    ctx.save();
    ctx.fillStyle = "rgba(8,17,28,0.78)";
    const w = Math.min(420, state.viewport.w - 40);
    const h = 40;
    const x = state.viewport.w * 0.5 - w * 0.5;
    const y = state.viewport.h - 90;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.stroke();

    ctx.fillStyle = "#e9f4ff";
    ctx.font = "600 24px 'Saira Condensed', 'Orbitron', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(state.temporaryMessage, state.viewport.w * 0.5, y + h * 0.52);
    ctx.restore();
  }
}

function render() {
  ctx.setTransform(state.viewport.dpr, 0, 0, state.viewport.dpr, 0, 0);
  drawBackground();
  drawWorld();
  drawWeatherLayer();
  drawCenterMessages();
}

function updateFrame(timestamp) {
  if (!state.lastFrameTs) {
    state.lastFrameTs = timestamp;
  }

  let frameDt = (timestamp - state.lastFrameTs) / 1000;
  state.lastFrameTs = timestamp;
  frameDt = clamp(frameDt, 0, 0.05);

  if (!state.paused && state.mode !== "menu" && state.mode !== "finished") {
    state.accumulator += frameDt;
    while (state.accumulator >= FIXED_DT) {
      updateRace(FIXED_DT);
      state.accumulator -= FIXED_DT;
    }
  }

  render();
  requestAnimationFrame(updateFrame);
}

function resizeCanvas() {
  state.viewport.w = window.innerWidth;
  state.viewport.h = window.innerHeight;
  state.viewport.dpr = Math.min(2, window.devicePixelRatio || 1);

  canvas.width = Math.floor(state.viewport.w * state.viewport.dpr);
  canvas.height = Math.floor(state.viewport.h * state.viewport.dpr);
  canvas.style.width = `${state.viewport.w}px`;
  canvas.style.height = `${state.viewport.h}px`;

  ctx.setTransform(state.viewport.dpr, 0, 0, state.viewport.dpr, 0, 0);
}

function togglePause() {
  if (state.mode !== "race" && state.mode !== "countdown") {
    return;
  }
  state.paused = !state.paused;
  if (!state.paused) {
    state.lastFrameTs = performance.now();
  }
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen().catch(() => {});
  } else {
    await document.exitFullscreen().catch(() => {});
  }
}

function handleKeyDown(event) {
  state.keys[event.code] = true;

  if (event.code === "KeyF") {
    event.preventDefault();
    void toggleFullscreen();
  }

  if (event.code === "Escape") {
    event.preventDefault();
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      togglePause();
    }
  }

  if (event.code === "KeyP") {
    state.commands.requestPit = true;
  }

  if (event.code === "KeyD") {
    state.commands.requestDrs = true;
  }
}

function handleKeyUp(event) {
  state.keys[event.code] = false;
}

function handleStartButton() {
  const config = {
    track: trackSelect.value,
    weather: weatherSelect.value,
    difficulty: difficultySelect.value,
    laps: parseInt(lapsSelect.value, 10),
    aiCount: parseInt(aiSelect.value, 10),
  };
  setupRace(config);
}

function resetToMenu() {
  state.mode = "menu";
  state.paused = false;
  state.cars = [];
  state.sortedCars = [];
  state.player = null;
  state.track = null;
  state.raceTime = 0;
  state.finishHold = 0;
  state.temporaryMessage = "";
  state.temporaryMessageTimer = 0;

  menuOverlay.classList.add("visible");
  finishOverlay.classList.remove("visible");
  hud.classList.add("hidden");
  leaderboard.classList.add("hidden");
  statusBanner.classList.add("hidden");
}

function initialize() {
  resizeCanvas();
  resetToMenu();

  startButton.addEventListener("click", handleStartButton);
  restartButton.addEventListener("click", resetToMenu);

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  requestAnimationFrame(updateFrame);
}

function getTextState() {
  const player = state.player;
  const top = state.sortedCars.slice(0, 8).map((car) => ({
    name: car.name,
    position: car.position,
    lap: Math.min(car.lap, state.totalLaps),
    gapToLeaderSec: Number(car.gapToLeader.toFixed(2)),
    speedKph: Math.round(car.speed * 3.6),
    inPit: car.inPit,
    finished: car.finished,
  }));

  const nearby = player
    ? state.cars
        .filter((car) => car.id !== player.id)
        .sort((a, b) => Math.abs(wrapSigned(player.s - a.s, state.track?.length || 1)) - Math.abs(wrapSigned(player.s - b.s, state.track?.length || 1)))
        .slice(0, 6)
        .map((car) => ({
          name: car.name,
          dx: Number((car.worldX - player.worldX).toFixed(1)),
          dy: Number((car.worldY - player.worldY).toFixed(1)),
          speedKph: Math.round(car.speed * 3.6),
        }))
    : [];

  return {
    mode: state.mode,
    coordinateSystem: "origin=(0,0) at top-left in world plane, +x right, +y down",
    track: state.track
      ? {
          name: state.track.name,
          length: Number(state.track.length.toFixed(1)),
          width: state.track.width,
        }
      : null,
    weather: state.weather.key,
    raceTimeSec: Number(state.raceTime.toFixed(2)),
    totalLaps: state.totalLaps,
    player: player
      ? {
          lap: Math.min(player.lap, state.totalLaps),
          position: player.position,
          x: Number(player.worldX.toFixed(1)),
          y: Number(player.worldY.toFixed(1)),
          headingRad: Number(player.heading.toFixed(3)),
          speedKph: Math.round(player.speed * 3.6),
          offsetFromCenter: Number(player.offset.toFixed(2)),
          fuel: Number(player.fuel.toFixed(3)),
          tyre: Number(player.tyre.toFixed(3)),
          damage: Number(player.damage.toFixed(3)),
          ers: Number(player.ers.toFixed(3)),
          drsActive: player.drsTimer > 0,
          inPit: player.inPit,
          penaltiesSec: Number(player.penaltyTime.toFixed(2)),
        }
      : null,
    standings: top,
    nearbyCars: nearby,
  };
}

window.render_game_to_text = () => JSON.stringify(getTextState());

window.advanceTime = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) {
    return Promise.resolve();
  }
  const total = ms / 1000;
  const steps = Math.max(1, Math.round(total / FIXED_DT));
  for (let i = 0; i < steps; i += 1) {
    if (!state.paused && state.mode !== "menu" && state.mode !== "finished") {
      updateRace(FIXED_DT);
    }
  }
  render();
  return Promise.resolve();
};

initialize();
