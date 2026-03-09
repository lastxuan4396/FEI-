import * as THREE from "./vendor/three.module.js";

const canvas = document.getElementById("game-canvas");

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
const sessionSelect = document.getElementById("session-select");

const hud = document.getElementById("hud");
const leaderboard = document.getElementById("leaderboard");
const leaderList = document.getElementById("leader-list");
const statusBanner = document.getElementById("status-banner");
const toastBanner = document.getElementById("toast-banner");
const cameraToggleButton = document.getElementById("camera-toggle");
const lightsToggleButton = document.getElementById("lights-toggle");
const musicToggleButton = document.getElementById("music-toggle");

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

const CAMERA_MODES = ["auto", "chase", "broadcast", "helmet"];
const AUTO_CAMERA_SEQUENCE = ["chase", "broadcast", "helmet", "chase"];
const SESSION_MODES = ["auto", "day", "sunset", "night"];
const BILLBOARD_SLOGANS = [
  "APEX ENERGY",
  "TURBO VISION",
  "STRAIGHTLINE",
  "VECTOR GP",
  "NIGHT CHARGE",
  "RACE CORE",
];

const SESSION_PROFILES = {
  day: {
    skyTop: 0x86c8ff,
    skyBottom: 0x21496f,
    fogNear: 260,
    fogFar: 2050,
    hemiIntensity: 1.08,
    sunIntensity: 1.12,
    roadBrightness: 1.0,
    trackLightIntensity: 0,
    headlightIntensity: 0,
    billboardGlow: 0.28,
  },
  sunset: {
    skyTop: 0xf5b27a,
    skyBottom: 0x2a3650,
    fogNear: 220,
    fogFar: 1750,
    hemiIntensity: 0.92,
    sunIntensity: 0.76,
    roadBrightness: 0.88,
    trackLightIntensity: 0.34,
    headlightIntensity: 0.12,
    billboardGlow: 0.4,
  },
  night: {
    skyTop: 0x0b1730,
    skyBottom: 0x030810,
    fogNear: 140,
    fogFar: 1200,
    hemiIntensity: 0.42,
    sunIntensity: 0.18,
    roadBrightness: 0.58,
    trackLightIntensity: 1.2,
    headlightIntensity: 1.5,
    billboardGlow: 0.75,
  },
};

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
  visual: {
    cameraMode: "auto",
    sessionMode: "auto",
    activeSession: "day",
  },
  rainDrops: [],
  temporaryMessage: "",
  temporaryMessageTimer: 0,
  audioEnabled: true,
};

const graphics = {
  renderer: null,
  scene: null,
  camera: null,
  hemiLight: null,
  sunLight: null,
  worldGroup: null,
  trackGroup: null,
  carGroup: null,
  rainGroup: null,
  billboardGroup: null,
  lightGroup: null,
  roadMaterial: null,
  shoulderMaterial: null,
  terrainMaterial: null,
  rainGeometry: null,
  rainMaterial: null,
  rainPositions: null,
  carMeshes: new Map(),
  trackLights: [],
  headlightTargets: [],
  headlightLeft: null,
  headlightRight: null,
  cameraTarget: new THREE.Vector3(),
  cameraPos: new THREE.Vector3(),
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

function formatCameraLabel(mode) {
  if (mode === "auto") return "AUTO";
  if (mode === "chase") return "CHASE";
  if (mode === "broadcast") return "TV";
  if (mode === "helmet") return "HELMET";
  return mode.toUpperCase();
}

function formatSessionLabel(mode) {
  if (mode === "auto") return "AUTO";
  if (mode === "day") return "DAY";
  if (mode === "sunset") return "SUNSET";
  if (mode === "night") return "NIGHT";
  return mode.toUpperCase();
}

function getVisualClock() {
  const countdownProgress = state.mode === "countdown" ? Math.max(0, 3.8 - state.countdown) : 0;
  return state.raceTime + countdownProgress;
}

function resolveSessionMode() {
  if (state.visual.sessionMode !== "auto") {
    state.visual.activeSession = state.visual.sessionMode;
    return state.visual.activeSession;
  }

  const phase = (getVisualClock() % 165) / 165;
  if (phase < 0.44) {
    state.visual.activeSession = "day";
  } else if (phase < 0.72) {
    state.visual.activeSession = "sunset";
  } else {
    state.visual.activeSession = "night";
  }
  return state.visual.activeSession;
}

function resolveCameraMode() {
  if (state.visual.cameraMode !== "auto") {
    return state.visual.cameraMode;
  }
  const index = Math.floor((getVisualClock() % 36) / 9) % AUTO_CAMERA_SEQUENCE.length;
  return AUTO_CAMERA_SEQUENCE[index];
}

function midiToHz(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

class RaceAudio {
  constructor() {
    this.ctx = null;
    this.available = Boolean(window.AudioContext || window.webkitAudioContext);
    this.enabled = true;
    this.started = false;
    this.stepIndex = 0;
    this.nextStepTime = 0;
    this.tempo = 152;
    this.intensity = 0.2;
    this.noiseBuffer = null;
    this.masterGain = null;
    this.weatherFilter = null;
    this.drumsGain = null;
    this.bassGain = null;
    this.leadGain = null;
    this.engineGain = null;
    this.engineOscA = null;
    this.engineOscB = null;
    this.engineFilter = null;
  }

  isAvailable() {
    return this.available;
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.ctx || !this.masterGain) {
      return;
    }
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(this.enabled ? 0.24 : 0, now + 0.12);
  }

  toggleEnabled() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  startFromGesture() {
    if (!this.available) {
      return false;
    }
    this.ensureContext();
    if (!this.ctx) {
      return false;
    }
    void this.ctx.resume();
    if (!this.started) {
      this.started = true;
      this.stepIndex = 0;
      this.nextStepTime = this.ctx.currentTime + 0.05;
    }
    return true;
  }

  ensureContext() {
    if (this.ctx || !this.available) {
      return;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtor();

    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.002;
    compressor.release.value = 0.16;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;

    this.weatherFilter = this.ctx.createBiquadFilter();
    this.weatherFilter.type = "lowpass";
    this.weatherFilter.frequency.value = 5400;
    this.weatherFilter.Q.value = 0.7;

    this.drumsGain = this.ctx.createGain();
    this.bassGain = this.ctx.createGain();
    this.leadGain = this.ctx.createGain();
    this.engineGain = this.ctx.createGain();
    this.drumsGain.gain.value = 0.22;
    this.bassGain.gain.value = 0.15;
    this.leadGain.gain.value = 0.12;
    this.engineGain.gain.value = 0.03;

    this.drumsGain.connect(this.weatherFilter);
    this.bassGain.connect(this.weatherFilter);
    this.leadGain.connect(this.weatherFilter);
    this.engineGain.connect(this.weatherFilter);
    this.weatherFilter.connect(compressor);
    compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = "bandpass";
    this.engineFilter.frequency.value = 420;
    this.engineFilter.Q.value = 0.9;

    this.engineOscA = this.ctx.createOscillator();
    this.engineOscB = this.ctx.createOscillator();
    this.engineOscA.type = "sawtooth";
    this.engineOscB.type = "square";
    this.engineOscA.frequency.value = 90;
    this.engineOscB.frequency.value = 180;
    this.engineOscB.detune.value = 8;

    const engineBlend = this.ctx.createGain();
    engineBlend.gain.value = 0.5;
    this.engineOscA.connect(this.engineFilter);
    this.engineOscB.connect(engineBlend);
    engineBlend.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);

    const wobbleOsc = this.ctx.createOscillator();
    const wobbleGain = this.ctx.createGain();
    wobbleOsc.type = "sine";
    wobbleOsc.frequency.value = 7.5;
    wobbleGain.gain.value = 2.8;
    wobbleOsc.connect(wobbleGain);
    wobbleGain.connect(this.engineOscB.frequency);

    this.noiseBuffer = this.createNoiseBuffer();

    this.engineOscA.start();
    this.engineOscB.start();
    wobbleOsc.start();
  }

  createNoiseBuffer() {
    if (!this.ctx) {
      return null;
    }
    const length = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  update(gameState, dt) {
    if (!this.ctx || !this.started) {
      return;
    }

    const now = this.ctx.currentTime;
    const playerSpeed = gameState.player ? gameState.player.speed : 0;
    let targetIntensity = 0.14;

    if (gameState.mode === "countdown") {
      targetIntensity = 0.5;
    } else if (gameState.mode === "race") {
      targetIntensity = clamp(playerSpeed / 94, 0.26, 1);
    } else if (gameState.mode === "finished") {
      targetIntensity = 0.62;
    }

    if (gameState.paused) {
      targetIntensity *= 0.35;
    }
    targetIntensity *= 1 - (gameState.weather?.rain || 0) * 0.14;

    this.intensity = lerp(this.intensity, targetIntensity, 1 - Math.exp(-dt * 6));
    const targetTempo = 146 + this.intensity * 28;
    this.tempo = lerp(this.tempo, targetTempo, 1 - Math.exp(-dt * 5));

    const targetMaster = this.enabled ? (gameState.mode === "menu" ? 0.08 : 0.24) : 0;
    this.ramp(this.masterGain.gain, targetMaster, now, 0.12);
    this.ramp(this.weatherFilter.frequency, 5600 - (gameState.weather?.rain || 0) * 2400, now, 0.1);

    const rpmHz = 75 + playerSpeed * 2.9 + this.intensity * 65;
    this.ramp(this.engineOscA.frequency, rpmHz, now, 0.06);
    this.ramp(this.engineOscB.frequency, rpmHz * 2.02, now, 0.06);
    this.ramp(this.engineFilter.frequency, 290 + playerSpeed * 11 + this.intensity * 120, now, 0.08);
    const targetEngineGain = this.enabled ? (gameState.mode === "menu" ? 0.02 : 0.05 + this.intensity * 0.08) : 0;
    this.ramp(this.engineGain.gain, targetEngineGain, now, 0.1);

    if (!this.enabled || gameState.paused) {
      return;
    }

    if (gameState.mode === "countdown" || gameState.mode === "race" || gameState.mode === "finished") {
      this.scheduleUntil(now + 0.16, gameState);
    }
  }

  ramp(param, target, now, time) {
    param.cancelScheduledValues(now);
    param.linearRampToValueAtTime(target, now + time);
  }

  scheduleUntil(horizon, gameState) {
    while (this.nextStepTime < horizon) {
      this.scheduleStep(this.nextStepTime, this.stepIndex, gameState);
      const stepDuration = 60 / this.tempo / 4;
      this.nextStepTime += stepDuration;
      this.stepIndex = (this.stepIndex + 1) % 16;
    }
  }

  scheduleStep(time, step, gameState) {
    const kickSteps = step === 0 || step === 4 || step === 8 || step === 12 || (this.intensity > 0.72 && step === 14);
    if (kickSteps) {
      this.triggerKick(time, step === 0 ? 1 : 0.78 + this.intensity * 0.16);
    }

    if (step % 2 === 1) {
      this.triggerHat(time, 0.11 + this.intensity * 0.12);
    }

    const bassPattern = [40, null, 40, null, 43, null, 45, null, 38, null, 40, null, 43, null, 47, null];
    const bassNote = bassPattern[step];
    if (bassNote !== null) {
      this.triggerBass(time, bassNote, this.intensity);
    }

    const leadPattern = [null, 64, null, 67, null, 69, null, 71, null, 67, null, 69, null, 72, null, 74];
    const leadNote = leadPattern[step];
    if (leadNote !== null && this.intensity > 0.34) {
      const bonus = gameState.mode === "finished" ? 5 : 0;
      this.triggerLead(time, leadNote + bonus, this.intensity);
    }
  }

  triggerKick(time, velocity) {
    if (!this.ctx) {
      return;
    }
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.13);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.38 * velocity, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.drumsGain);
    osc.start(time);
    osc.stop(time + 0.17);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  triggerHat(time, velocity) {
    if (!this.ctx || !this.noiseBuffer) {
      return;
    }
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    source.buffer = this.noiseBuffer;
    filter.type = "highpass";
    filter.frequency.value = 6400;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(velocity, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumsGain);
    source.start(time);
    source.stop(time + 0.05);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  triggerBass(time, midi, intensity) {
    if (!this.ctx) {
      return;
    }
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(midiToHz(midi), time);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(210 + intensity * 220, time);
    filter.Q.value = 1.2;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.14 + intensity * 0.12, time + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bassGain);
    osc.start(time);
    osc.stop(time + 0.22);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  triggerLead(time, midi, intensity) {
    if (!this.ctx) {
      return;
    }
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(midiToHz(midi), time);
    osc.frequency.exponentialRampToValueAtTime(midiToHz(midi) * 0.996, time + 0.16);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200 + intensity * 900, time);
    filter.Q.value = 1.4;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.08 + intensity * 0.08, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.leadGain);
    osc.start(time);
    osc.stop(time + 0.2);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
}

const raceAudio = new RaceAudio();

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
  state.visual.sessionMode = SESSION_MODES.includes(config.session) ? config.session : state.visual.sessionMode;
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

  ensureGraphics();
  rebuildTrackMeshes();
  clearGroup(graphics.carGroup);
  graphics.carMeshes.clear();
  syncCarMeshes();
  graphics.cameraPos.set(0, 0, 0);
  graphics.cameraTarget.set(0, 0, 0);

  updateStandings();
  state.temporaryMessage = `Grid Locked · ${formatSessionLabel(state.visual.sessionMode)}`;
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
  const player = state.player;

  while (state.rainDrops.length < desiredCount) {
    state.rainDrops.push({
      x: (Math.random() - 0.5) * 620,
      y: 14 + Math.random() * 60,
      z: (Math.random() - 0.5) * 460,
      speed: 60 + Math.random() * 80,
    });
  }
  while (state.rainDrops.length > desiredCount) {
    state.rainDrops.pop();
  }

  for (const drop of state.rainDrops) {
    drop.y -= drop.speed * dt;
    drop.z += state.weather.wind * dt * 0.35;

    if (drop.y < -2) {
      drop.y = 12 + Math.random() * 58;
      drop.x = (Math.random() - 0.5) * 620;
      drop.z = (Math.random() - 0.5) * 460;
    } else if (player) {
      if (drop.x + player.worldX > player.worldX + 380 || drop.x + player.worldX < player.worldX - 380) {
        drop.x = (Math.random() - 0.5) * 620;
      }
      if (drop.z + player.worldY > player.worldY + 290 || drop.z + player.worldY < player.worldY - 290) {
        drop.z = (Math.random() - 0.5) * 460;
      }
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

  if (state.temporaryMessage) {
    toastBanner.textContent = state.temporaryMessage;
    toastBanner.classList.remove("hidden");
  } else {
    toastBanner.classList.add("hidden");
  }

  syncCameraToggleLabel();
  syncLightsToggleLabel();
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

function ensureGraphics() {
  if (graphics.renderer) {
    return;
  }

  graphics.renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  graphics.renderer.setPixelRatio(state.viewport.dpr);
  graphics.renderer.setSize(state.viewport.w, state.viewport.h, false);
  graphics.renderer.shadowMap.enabled = false;

  graphics.scene = new THREE.Scene();
  graphics.scene.background = new THREE.Color(state.weather.skyBottom);
  graphics.scene.fog = new THREE.Fog(state.weather.skyBottom, 260, 2050);

  graphics.camera = new THREE.PerspectiveCamera(62, state.viewport.w / state.viewport.h, 0.1, 8000);
  graphics.camera.position.set(0, 100, 180);

  graphics.hemiLight = new THREE.HemisphereLight(0xc9ecff, 0x203045, 1.12);
  graphics.sunLight = new THREE.DirectionalLight(0xfff4d8, 1.18);
  graphics.sunLight.position.set(560, 820, 320);
  graphics.scene.add(graphics.hemiLight, graphics.sunLight);

  graphics.worldGroup = new THREE.Group();
  graphics.trackGroup = new THREE.Group();
  graphics.carGroup = new THREE.Group();
  graphics.rainGroup = new THREE.Group();
  graphics.billboardGroup = new THREE.Group();
  graphics.lightGroup = new THREE.Group();
  graphics.worldGroup.add(graphics.trackGroup, graphics.carGroup, graphics.billboardGroup, graphics.lightGroup, graphics.rainGroup);
  graphics.scene.add(graphics.worldGroup);

  graphics.terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x264157, roughness: 0.98, metalness: 0 });
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(9000, 9000),
    graphics.terrainMaterial
  );
  ground.rotation.x = -Math.PI * 0.5;
  ground.position.y = -1.2;
  graphics.worldGroup.add(ground);

  const maxPoints = MAX_RAIN_DROPS;
  graphics.rainPositions = new Float32Array(maxPoints * 3);
  graphics.rainGeometry = new THREE.BufferGeometry();
  graphics.rainGeometry.setAttribute("position", new THREE.BufferAttribute(graphics.rainPositions, 3));
  graphics.rainMaterial = new THREE.PointsMaterial({
    color: 0xcbe8ff,
    size: 2.4,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const points = new THREE.Points(graphics.rainGeometry, graphics.rainMaterial);
  graphics.rainGroup.add(points);

  graphics.headlightLeft = new THREE.SpotLight(0xd8eeff, 0, 320, Math.PI / 7.5, 0.34, 1.5);
  graphics.headlightRight = new THREE.SpotLight(0xd8eeff, 0, 320, Math.PI / 7.5, 0.34, 1.5);
  const leftTarget = new THREE.Object3D();
  const rightTarget = new THREE.Object3D();
  graphics.headlightLeft.target = leftTarget;
  graphics.headlightRight.target = rightTarget;
  graphics.headlightTargets = [leftTarget, rightTarget];
  graphics.scene.add(graphics.headlightLeft, graphics.headlightRight, leftTarget, rightTarget);
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (Array.isArray(child.material)) {
      for (const m of child.material) {
        m.dispose?.();
      }
    } else {
      child.material?.dispose?.();
    }
    group.remove(child);
  }
}

function createRibbonGeometry(points, tangents, width, y = 0, closed = true) {
  const count = points.length;
  const vertexCount = count * 2;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const segmentCount = closed ? count : Math.max(0, count - 1);
  const indexArray = vertexCount > 65535 ? Uint32Array : Uint16Array;
  const indices = new indexArray(segmentCount * 6);

  let dist = 0;
  for (let i = 0; i < count; i += 1) {
    const p = points[i];
    const t = tangents[i];
    const nx = -t.y;
    const nz = t.x;
    const half = width * 0.5;

    const leftX = p.x + nx * half;
    const leftZ = p.y + nz * half;
    const rightX = p.x - nx * half;
    const rightZ = p.y - nz * half;

    const base = i * 6;
    positions[base] = leftX;
    positions[base + 1] = y;
    positions[base + 2] = leftZ;
    positions[base + 3] = rightX;
    positions[base + 4] = y;
    positions[base + 5] = rightZ;

    normals[base] = 0;
    normals[base + 1] = 1;
    normals[base + 2] = 0;
    normals[base + 3] = 0;
    normals[base + 4] = 1;
    normals[base + 5] = 0;

    if (i > 0) {
      dist += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }

    const uvBase = i * 4;
    uvs[uvBase] = 0;
    uvs[uvBase + 1] = dist / 72;
    uvs[uvBase + 2] = 1;
    uvs[uvBase + 3] = dist / 72;

    if (i < segmentCount) {
      const next = closed ? (i + 1) % count : i + 1;
      const a = i * 2;
      const b = i * 2 + 1;
      const c = next * 2;
      const d = next * 2 + 1;
      const idx = i * 6;
      indices[idx] = a;
      indices[idx + 1] = c;
      indices[idx + 2] = b;
      indices[idx + 3] = b;
      indices[idx + 4] = c;
      indices[idx + 5] = d;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function createBillboardTexture(text, fromColor, toColor) {
  const board = document.createElement("canvas");
  board.width = 512;
  board.height = 192;
  const bctx = board.getContext("2d");
  if (!bctx) {
    return null;
  }

  const grad = bctx.createLinearGradient(0, 0, board.width, board.height);
  grad.addColorStop(0, fromColor);
  grad.addColorStop(1, toColor);
  bctx.fillStyle = grad;
  bctx.fillRect(0, 0, board.width, board.height);

  bctx.strokeStyle = "rgba(255,255,255,0.45)";
  bctx.lineWidth = 8;
  bctx.strokeRect(8, 8, board.width - 16, board.height - 16);

  bctx.fillStyle = "rgba(255,255,255,0.92)";
  bctx.font = "700 54px 'Saira Condensed', 'Orbitron', sans-serif";
  bctx.textAlign = "center";
  bctx.textBaseline = "middle";
  bctx.fillText(text, board.width * 0.5, board.height * 0.5 - 8);

  bctx.font = "600 18px 'Saira Condensed', 'Orbitron', sans-serif";
  bctx.fillStyle = "rgba(220,243,255,0.85)";
  bctx.fillText("WORLD CHAMPIONSHIP", board.width * 0.5, board.height * 0.77);

  const texture = new THREE.CanvasTexture(board);
  texture.needsUpdate = true;
  texture.anisotropy = 4;
  return texture;
}

function rebuildBillboards() {
  if (!graphics.billboardGroup || !state.track) {
    return;
  }

  clearGroup(graphics.billboardGroup);

  const palettes = [
    ["#103b74", "#0aa5d7"],
    ["#2a245d", "#ca3db7"],
    ["#1a4f3d", "#27b97e"],
    ["#49231c", "#ef7e37"],
    ["#212d53", "#45c0ff"],
    ["#4d2a1a", "#d5c133"],
  ];

  const total = 12;
  for (let i = 0; i < total; i += 1) {
    const s = (i / total) * state.track.length + state.track.length * 0.03;
    const sample = sampleTrack(state.track, s);
    const side = i % 2 === 0 ? 1 : -1;
    const offset = state.track.halfWidth + 46 + (i % 3) * 6;
    const x = sample.x + sample.normalX * offset * side;
    const z = sample.y + sample.normalY * offset * side;
    const angle = Math.atan2(sample.tangentY, sample.tangentX) + (side > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);

    const slogan = BILLBOARD_SLOGANS[i % BILLBOARD_SLOGANS.length];
    const [fromColor, toColor] = palettes[i % palettes.length];
    const texture = createBillboardTexture(slogan, fromColor, toColor);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: texture,
      emissive: 0x2a7ec2,
      emissiveIntensity: 0.42,
      roughness: 0.48,
      metalness: 0.1,
    });

    const panel = new THREE.Mesh(new THREE.PlaneGeometry(52, 16), material);
    panel.userData.isBillboard = true;
    panel.position.set(x, 13, z);
    panel.rotation.y = -angle;
    graphics.billboardGroup.add(panel);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(54.5, 17.5, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x0f1727, roughness: 0.72, metalness: 0.22 })
    );
    frame.position.set(x, 13, z - 0.9 * side);
    frame.rotation.y = -angle;
    graphics.billboardGroup.add(frame);

    const leftPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x4f5b74, roughness: 0.82, metalness: 0.22 })
    );
    leftPole.position.set(x - Math.cos(angle) * 18, 6, z + Math.sin(angle) * 18);
    graphics.billboardGroup.add(leftPole);

    const rightPole = leftPole.clone();
    rightPole.position.set(x + Math.cos(angle) * 18, 6, z - Math.sin(angle) * 18);
    graphics.billboardGroup.add(rightPole);
  }
}

function rebuildTrackLights() {
  if (!graphics.lightGroup || !state.track) {
    return;
  }

  clearGroup(graphics.lightGroup);
  graphics.trackLights = [];

  const total = 14;
  for (let i = 0; i < total; i += 1) {
    const s = (i / total) * state.track.length + 22;
    const sample = sampleTrack(state.track, s);
    const side = i % 2 === 0 ? 1 : -1;
    const offset = state.track.halfWidth + 36;
    const x = sample.x + sample.normalX * offset * side;
    const z = sample.y + sample.normalY * offset * side;

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.48, 24, 12),
      new THREE.MeshStandardMaterial({ color: 0x57617c, roughness: 0.88, metalness: 0.2 })
    );
    pole.position.set(x, 12, z);
    graphics.lightGroup.add(pole);

    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 10),
      new THREE.MeshStandardMaterial({
        color: 0xffe9ba,
        emissive: 0xffd28a,
        emissiveIntensity: 0.75,
        roughness: 0.24,
        metalness: 0.04,
      })
    );
    lamp.userData.isLamp = true;
    lamp.position.set(x, 24.6, z);
    graphics.lightGroup.add(lamp);

    const light = new THREE.PointLight(0xffe7bc, 0, 120, 2.1);
    light.position.set(x, 24.4, z);
    light.userData.baseIntensity = 1;
    graphics.trackLights.push(light);
    graphics.lightGroup.add(light);
  }
}

function rebuildTrackMeshes() {
  if (!graphics.trackGroup || !state.track) {
    return;
  }

  clearGroup(graphics.trackGroup);

  const bounds = getTrackBounds(state.track.points);
  graphics.terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x264157, roughness: 0.98, metalness: 0 });
  const terrain = new THREE.Mesh(
    new THREE.PlaneGeometry(bounds.maxX - bounds.minX + 1300, bounds.maxY - bounds.minY + 1300),
    graphics.terrainMaterial
  );
  terrain.rotation.x = -Math.PI * 0.5;
  terrain.position.set((bounds.minX + bounds.maxX) * 0.5, -0.3, (bounds.minY + bounds.maxY) * 0.5);
  graphics.trackGroup.add(terrain);

  const shoulderGeometry = createRibbonGeometry(state.track.points, state.track.tangents, state.track.width + 20, 0.02);
  graphics.shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0x131e2e, roughness: 0.9, metalness: 0.06 });
  const shoulder = new THREE.Mesh(
    shoulderGeometry,
    graphics.shoulderMaterial
  );
  graphics.trackGroup.add(shoulder);

  const roadGeometry = createRibbonGeometry(state.track.points, state.track.tangents, state.track.width, 0.06);
  graphics.roadMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3948, roughness: 0.78, metalness: 0.08 });
  const road = new THREE.Mesh(
    roadGeometry,
    graphics.roadMaterial
  );
  graphics.trackGroup.add(road);

  const centerPoints = state.track.points.map((p) => new THREE.Vector3(p.x, 0.12, p.y));
  const centerLineGeometry = new THREE.BufferGeometry().setFromPoints(centerPoints);
  const centerLineMaterial = new THREE.LineDashedMaterial({
    color: 0x899dbb,
    linewidth: 1,
    dashSize: 10,
    gapSize: 12,
    transparent: true,
    opacity: 0.7,
  });
  const centerLine = new THREE.LineLoop(centerLineGeometry, centerLineMaterial);
  centerLine.computeLineDistances();
  graphics.trackGroup.add(centerLine);

  if (state.track.pitPath.length > 1) {
    const pitPoints = state.track.pitPath;
    const pitTangents = [];
    for (let i = 0; i < pitPoints.length; i += 1) {
      const prev = pitPoints[(i - 1 + pitPoints.length) % pitPoints.length];
      const next = pitPoints[(i + 1) % pitPoints.length];
      pitTangents.push(normalize(next.x - prev.x, next.y - prev.y));
    }
    const pitGeometry = createRibbonGeometry(pitPoints, pitTangents, state.track.width * 0.36, 0.08, false);
    const pitRoad = new THREE.Mesh(
      pitGeometry,
      new THREE.MeshStandardMaterial({ color: 0x454f61, roughness: 0.82, metalness: 0.04 })
    );
    graphics.trackGroup.add(pitRoad);
  }

  const start = sampleTrack(state.track, 0);
  const startLine = new THREE.Mesh(
    new THREE.PlaneGeometry(9, state.track.width),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  startLine.rotation.x = -Math.PI * 0.5;
  startLine.rotation.z = Math.atan2(start.tangentY, start.tangentX);
  startLine.position.set(start.x, 0.14, start.y);
  graphics.trackGroup.add(startLine);

  rebuildBillboards();
  rebuildTrackLights();
}

function createCarMesh(car) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: car.color,
    roughness: 0.24,
    metalness: 0.58,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
    reflectivity: 0.9,
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(8.4, 2.8, 16),
    bodyMaterial
  );
  body.position.y = 2;
  group.add(body);

  const cockpit = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 1.7, 6.2),
    new THREE.MeshStandardMaterial({ color: 0x182432, roughness: 0.32, metalness: 0.6 })
  );
  cockpit.position.set(0, 3.3, -1.8);
  group.add(cockpit);

  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 1.2, 4.4),
    bodyMaterial
  );
  nose.position.set(0, 2.2, 9.6);
  group.add(nose);

  const sideGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.34, 12.8),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(car.color),
      emissiveIntensity: 0.75,
      roughness: 0.2,
      metalness: 0.12,
    })
  );
  sideGlow.position.set(4.05, 2.7, 0.2);
  group.add(sideGlow);

  const sideGlow2 = sideGlow.clone();
  sideGlow2.position.x = -4.05;
  group.add(sideGlow2);

  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(10.2, 0.7, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x111a27, roughness: 0.7, metalness: 0.12 })
  );
  wing.position.set(0, 2.6, -8.2);
  group.add(wing);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.3, 0.24, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0x0f1722, roughness: 0.54, metalness: 0.35 })
  );
  halo.rotation.x = Math.PI * 0.5;
  halo.position.set(0, 3.6, -1.7);
  group.add(halo);

  if (car.isPlayer) {
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(4.6, 5.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x89f4ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    );
    marker.rotation.x = -Math.PI * 0.5;
    marker.position.y = 0.25;
    group.add(marker);
  }

  group.userData.bodyMaterial = bodyMaterial;
  group.userData.highlightMeshes = [sideGlow, sideGlow2];
  graphics.carGroup.add(group);
  graphics.carMeshes.set(car.id, group);
}

function syncCarMeshes() {
  if (!graphics.carGroup) {
    return;
  }

  for (const car of state.cars) {
    if (!graphics.carMeshes.has(car.id)) {
      createCarMesh(car);
    }
  }

  for (const [carId, mesh] of graphics.carMeshes.entries()) {
    if (!state.cars.find((car) => car.id === carId)) {
      graphics.carGroup.remove(mesh);
      graphics.carMeshes.delete(carId);
    }
  }
}

function updateRainMesh() {
  if (!graphics.rainGeometry || !graphics.rainPositions) {
    return;
  }

  const active = state.rainDrops.length;
  const playerX = state.player ? state.player.worldX : 0;
  const playerZ = state.player ? state.player.worldY : 0;

  for (let i = 0; i < MAX_RAIN_DROPS; i += 1) {
    const idx = i * 3;
    if (i < active) {
      const drop = state.rainDrops[i];
      graphics.rainPositions[idx] = playerX + drop.x;
      graphics.rainPositions[idx + 1] = drop.y;
      graphics.rainPositions[idx + 2] = playerZ + drop.z;
    } else {
      graphics.rainPositions[idx] = 0;
      graphics.rainPositions[idx + 1] = -999;
      graphics.rainPositions[idx + 2] = 0;
    }
  }

  graphics.rainGeometry.attributes.position.needsUpdate = true;
  graphics.rainMaterial.opacity = 0.18 + state.weather.rain * 0.34;
}

function update3DScene() {
  ensureGraphics();

  if (!graphics.renderer || !graphics.scene || !graphics.camera) {
    return;
  }

  const sessionKey = resolveSessionMode();
  const profile = SESSION_PROFILES[sessionKey];
  const rain = state.weather.rain;

  graphics.scene.background.setHex(profile.skyBottom);
  graphics.scene.fog.color.setHex(profile.skyBottom);
  graphics.scene.fog.near = profile.fogNear;
  graphics.scene.fog.far = profile.fogFar;
  graphics.hemiLight.color.setHex(profile.skyTop);
  graphics.hemiLight.groundColor.set(0x223444);
  graphics.hemiLight.intensity = profile.hemiIntensity - rain * 0.12;
  graphics.sunLight.intensity = profile.sunIntensity - rain * 0.24;

  if (graphics.roadMaterial) {
    graphics.roadMaterial.color.setHSL(0.6, 0.16, 0.2 * profile.roadBrightness);
  }
  if (graphics.shoulderMaterial) {
    graphics.shoulderMaterial.color.setHSL(0.61, 0.2, 0.12 * profile.roadBrightness);
  }
  if (graphics.terrainMaterial) {
    graphics.terrainMaterial.color.setHSL(0.58, 0.34, 0.22 * profile.roadBrightness);
  }

  const lightPulse = 0.86 + 0.14 * Math.sin(getVisualClock() * 1.8);
  for (let i = 0; i < graphics.trackLights.length; i += 1) {
    const light = graphics.trackLights[i];
    const wobble = 0.9 + 0.1 * Math.sin(getVisualClock() * 2.4 + i * 0.5);
    light.intensity = profile.trackLightIntensity * lightPulse * wobble * (1 + rain * 0.08);
  }

  if (graphics.lightGroup) {
    for (const child of graphics.lightGroup.children) {
      if (child.userData?.isLamp && child.material) {
        child.material.emissiveIntensity = 0.45 + profile.trackLightIntensity * 0.55;
      }
    }
  }

  if (graphics.billboardGroup) {
    for (const child of graphics.billboardGroup.children) {
      if (child.userData?.isBillboard && child.material) {
        child.material.emissiveIntensity = profile.billboardGlow;
      }
    }
  }

  if (state.track && graphics.trackGroup.children.length === 0) {
    rebuildTrackMeshes();
  }

  syncCarMeshes();
  for (const car of state.cars) {
    const mesh = graphics.carMeshes.get(car.id);
    if (!mesh) {
      continue;
    }
    mesh.visible = !car.retired;
    mesh.position.set(car.worldX, 0.35, car.worldY);
    mesh.rotation.y = -car.heading + Math.PI * 0.5;
    mesh.position.y = car.inPit ? 0.42 : 0.35;

    if (mesh.userData?.bodyMaterial) {
      mesh.userData.bodyMaterial.clearcoatRoughness = clamp(0.06 + car.damage * 0.45, 0.06, 0.45);
      mesh.userData.bodyMaterial.metalness = clamp(0.62 - car.damage * 0.2, 0.35, 0.62);
    }
    if (mesh.userData?.highlightMeshes) {
      const active = car.drsTimer > 0 || car.ersActive;
      const emission = active ? 1.15 : 0.7;
      for (const h of mesh.userData.highlightMeshes) {
        if (h.material) {
          h.material.emissiveIntensity = emission;
        }
      }
    }
  }

  if (state.player) {
    const heading = state.player.heading;
    const forwardX = Math.cos(heading);
    const forwardZ = Math.sin(heading);
    const rightX = -forwardZ;
    const rightZ = forwardX;
    const activeCameraMode = resolveCameraMode();
    const tvOrbit = Math.sin(getVisualClock() * 0.42);

    let desiredCamera = new THREE.Vector3(state.player.worldX - forwardX * 74, 42, state.player.worldY - forwardZ * 74);
    let lookTarget = new THREE.Vector3(state.player.worldX + forwardX * 26, 6.5, state.player.worldY + forwardZ * 26);

    if (activeCameraMode === "broadcast") {
      desiredCamera = new THREE.Vector3(
        state.player.worldX - forwardX * 14 + rightX * (46 + tvOrbit * 30),
        68 + Math.abs(tvOrbit) * 16,
        state.player.worldY - forwardZ * 14 + rightZ * (46 + tvOrbit * 30)
      );
      lookTarget = new THREE.Vector3(
        state.player.worldX + forwardX * 26,
        2.4,
        state.player.worldY + forwardZ * 26
      );
    } else if (activeCameraMode === "helmet") {
      desiredCamera = new THREE.Vector3(
        state.player.worldX + forwardX * 4 - rightX * 0.8,
        3.7,
        state.player.worldY + forwardZ * 4 - rightZ * 0.8
      );
      lookTarget = new THREE.Vector3(
        state.player.worldX + forwardX * 54,
        3.4,
        state.player.worldY + forwardZ * 54
      );
    }

    if (graphics.cameraPos.lengthSq() < 0.01) {
      graphics.cameraPos.copy(desiredCamera);
    } else {
      const smoothing = activeCameraMode === "helmet" ? 0.2 : 0.1;
      graphics.cameraPos.lerp(desiredCamera, smoothing);
    }
    graphics.cameraTarget.lerp(lookTarget, activeCameraMode === "helmet" ? 0.2 : 0.14);
    graphics.camera.position.copy(graphics.cameraPos);
    graphics.camera.lookAt(graphics.cameraTarget);

    const headlightStrength = profile.headlightIntensity * (0.72 + (state.player.speed / Math.max(40, state.difficulty.maxSpeed)) * 0.58);
    if (graphics.headlightLeft && graphics.headlightRight && graphics.headlightTargets.length === 2) {
      graphics.headlightLeft.intensity = headlightStrength;
      graphics.headlightRight.intensity = headlightStrength;
      graphics.headlightLeft.position.set(
        state.player.worldX + forwardX * 6.2 + rightX * 1.8,
        1.9,
        state.player.worldY + forwardZ * 6.2 + rightZ * 1.8
      );
      graphics.headlightRight.position.set(
        state.player.worldX + forwardX * 6.2 - rightX * 1.8,
        1.9,
        state.player.worldY + forwardZ * 6.2 - rightZ * 1.8
      );
      graphics.headlightTargets[0].position.set(
        state.player.worldX + forwardX * 52 + rightX * 4,
        0.2,
        state.player.worldY + forwardZ * 52 + rightZ * 4
      );
      graphics.headlightTargets[1].position.set(
        state.player.worldX + forwardX * 52 - rightX * 4,
        0.2,
        state.player.worldY + forwardZ * 52 - rightZ * 4
      );
    }
  } else if (state.track) {
    const bounds = getTrackBounds(state.track.points);
    const cx = (bounds.minX + bounds.maxX) * 0.5;
    const cz = (bounds.minY + bounds.maxY) * 0.5;
    graphics.camera.position.set(cx, 500, cz + 540);
    graphics.camera.lookAt(cx, 0, cz);
    if (graphics.headlightLeft && graphics.headlightRight) {
      graphics.headlightLeft.intensity = 0;
      graphics.headlightRight.intensity = 0;
    }
  }

  updateRainMesh();
}

function render() {
  ensureGraphics();
  update3DScene();
  graphics.renderer.render(graphics.scene, graphics.camera);
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

  raceAudio.update(state, frameDt);
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

  if (graphics.renderer) {
    graphics.renderer.setPixelRatio(state.viewport.dpr);
    graphics.renderer.setSize(state.viewport.w, state.viewport.h, false);
  }
  if (graphics.camera) {
    graphics.camera.aspect = state.viewport.w / Math.max(1, state.viewport.h);
    graphics.camera.updateProjectionMatrix();
  }
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

function syncMusicToggleLabel() {
  if (!musicToggleButton) {
    return;
  }

  if (!raceAudio.isAvailable()) {
    musicToggleButton.textContent = "Music: N/A";
    musicToggleButton.disabled = true;
    musicToggleButton.classList.add("off");
    musicToggleButton.setAttribute("aria-pressed", "false");
    return;
  }

  musicToggleButton.disabled = false;
  musicToggleButton.textContent = state.audioEnabled ? "Music: ON" : "Music: OFF";
  musicToggleButton.classList.toggle("off", !state.audioEnabled);
  musicToggleButton.setAttribute("aria-pressed", String(state.audioEnabled));
}

function syncCameraToggleLabel() {
  if (!cameraToggleButton) {
    return;
  }
  const selected = formatCameraLabel(state.visual.cameraMode);
  if (state.visual.cameraMode === "auto") {
    cameraToggleButton.textContent = `Cam: ${selected} (${formatCameraLabel(resolveCameraMode())})`;
  } else {
    cameraToggleButton.textContent = `Cam: ${selected}`;
  }
}

function syncLightsToggleLabel() {
  if (!lightsToggleButton) {
    return;
  }
  const selected = formatSessionLabel(state.visual.sessionMode);
  if (state.visual.sessionMode === "auto") {
    lightsToggleButton.textContent = `Lights: ${selected} (${formatSessionLabel(resolveSessionMode())})`;
  } else {
    lightsToggleButton.textContent = `Lights: ${selected}`;
  }
}

function toggleMusic() {
  if (!raceAudio.isAvailable()) {
    return;
  }

  raceAudio.startFromGesture();
  state.audioEnabled = raceAudio.toggleEnabled();
  syncMusicToggleLabel();
  state.temporaryMessage = state.audioEnabled ? "Music On" : "Music Off";
  state.temporaryMessageTimer = 0.9;
}

function cycleCameraMode() {
  const currentIndex = CAMERA_MODES.indexOf(state.visual.cameraMode);
  const nextMode = CAMERA_MODES[(currentIndex + 1) % CAMERA_MODES.length];
  state.visual.cameraMode = nextMode;
  syncCameraToggleLabel();
  state.temporaryMessage = `Camera ${formatCameraLabel(nextMode)}`;
  state.temporaryMessageTimer = 1.1;
}

function cycleSessionMode() {
  const currentIndex = SESSION_MODES.indexOf(state.visual.sessionMode);
  const nextMode = SESSION_MODES[(currentIndex + 1) % SESSION_MODES.length];
  state.visual.sessionMode = nextMode;
  if (sessionSelect) {
    sessionSelect.value = nextMode;
  }
  syncLightsToggleLabel();
  state.temporaryMessage = `Session ${formatSessionLabel(nextMode)}`;
  state.temporaryMessageTimer = 1.1;
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

  if (event.code === "KeyM") {
    event.preventDefault();
    toggleMusic();
  }

  if (event.code === "KeyC") {
    event.preventDefault();
    cycleCameraMode();
  }

  if (event.code === "KeyN") {
    event.preventDefault();
    cycleSessionMode();
  }
}

function handleKeyUp(event) {
  state.keys[event.code] = false;
}

function handleStartButton() {
  raceAudio.startFromGesture();
  raceAudio.setEnabled(state.audioEnabled);
  const config = {
    track: trackSelect.value,
    weather: weatherSelect.value,
    difficulty: difficultySelect.value,
    laps: parseInt(lapsSelect.value, 10),
    aiCount: parseInt(aiSelect.value, 10),
    session: sessionSelect.value,
  };
  setupRace(config);
  syncCameraToggleLabel();
  syncLightsToggleLabel();
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

  if (graphics.trackGroup) {
    clearGroup(graphics.trackGroup);
  }
  if (graphics.carGroup) {
    clearGroup(graphics.carGroup);
    graphics.carMeshes.clear();
  }
  if (toastBanner) {
    toastBanner.classList.add("hidden");
  }
  if (sessionSelect) {
    sessionSelect.value = state.visual.sessionMode;
  }

  menuOverlay.classList.add("visible");
  finishOverlay.classList.remove("visible");
  hud.classList.add("hidden");
  leaderboard.classList.add("hidden");
  statusBanner.classList.add("hidden");
}

function initialize() {
  ensureGraphics();
  resizeCanvas();
  resetToMenu();
  raceAudio.setEnabled(state.audioEnabled);
  syncMusicToggleLabel();
  syncCameraToggleLabel();
  syncLightsToggleLabel();

  startButton.addEventListener("click", handleStartButton);
  restartButton.addEventListener("click", resetToMenu);
  cameraToggleButton.addEventListener("click", cycleCameraMode);
  lightsToggleButton.addEventListener("click", cycleSessionMode);
  musicToggleButton.addEventListener("click", toggleMusic);
  sessionSelect.addEventListener("change", () => {
    state.visual.sessionMode = sessionSelect.value;
    syncLightsToggleLabel();
  });

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
    renderMode: "3d",
    coordinateSystem: "track plane with origin=(0,0), +x right, +y (legacy field) maps forward/down-track",
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
    audio: {
      available: raceAudio.isAvailable(),
      enabled: state.audioEnabled,
    },
    visual: {
      cameraMode: state.visual.cameraMode,
      activeCamera: resolveCameraMode(),
      sessionMode: state.visual.sessionMode,
      activeSession: resolveSessionMode(),
    },
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
  raceAudio.update(state, total);
  render();
  return Promise.resolve();
};

initialize();
