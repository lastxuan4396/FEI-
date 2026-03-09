
      const APP_VERSION = "2.3.0";
      const SIZE = 980;
      const PATH_LEN = 44;
      const HOME_LEN = 3;
      const GOAL_STEP = PATH_LEN + HOME_LEN;
      const CELL_SIZE = 58;
      const CENTER = { x: SIZE / 2, y: SIZE / 2 };
      const ROOM_POLL_MS = 5000;
      const ROLE_RED = "red";
      const ROLE_BLUE = "blue";
      const TURN_TIMEOUT_SEC = 30;
      const RECONNECT_WINDOW_MS = 30 * 60 * 1000;
      const FALLBACK_BACKEND_ORIGIN = "https://flight-chess-room-v2.onrender.com";
      const MIRROR_HOSTS = new Set(["flight-chess-share-fei.onrender.com"]);
      const apiBaseFromQuery = (() => {
        try {
          const v = String(new URL(window.location.href).searchParams.get("apiBase") || "").trim();
          if (!v) return "";
          return new URL(v).origin;
        } catch (_err) {
          return "";
        }
      })();
      const API_BASE_ORIGIN = apiBaseFromQuery || (MIRROR_HOSTS.has(window.location.host) ? FALLBACK_BACKEND_ORIGIN : window.location.origin);
      const SHARE_BASE_ORIGIN = MIRROR_HOSTS.has(window.location.host) ? FALLBACK_BACKEND_ORIGIN : window.location.origin;

      const board = document.getElementById("board");
      const ctx = board.getContext("2d");

      const turnText = document.getElementById("turnText");
      const diceText = document.getElementById("diceText");
      const msgText = document.getElementById("msgText");
      const seatText = document.getElementById("seatText");
      const roomStatus = document.getElementById("roomStatus");
      const realtimeStatus = document.getElementById("realtimeStatus");
      const reconnectHint = document.getElementById("reconnectHint");
      const versionText = document.getElementById("versionText");
      const langSelect = document.getElementById("langSelect");
      const boardZoomRange = document.getElementById("boardZoomRange");
      const boardZoomText = document.getElementById("boardZoomText");
      const qrPreview = document.getElementById("qrPreview");

      const rollBtn = document.getElementById("rollBtn");
      const restartBtn = document.getElementById("restartBtn");
      const exportImageBtn = document.getElementById("exportImageBtn");
      const exportTextBtn = document.getElementById("exportTextBtn");
      const exportReportBtn = document.getElementById("exportReportBtn");
      const enableNotifyBtn = document.getElementById("enableNotifyBtn");
      const countdownText = document.getElementById("countdownText");
      const countdownBar = document.getElementById("countdownBar");

      const createRoomBtn = document.getElementById("createRoomBtn");
      const joinRoomBtn = document.getElementById("joinRoomBtn");
      const joinWatchBtn = document.getElementById("joinWatchBtn");
      const leaveRoomBtn = document.getElementById("leaveRoomBtn");
      const copyRoomLinkBtn = document.getElementById("copyRoomLinkBtn");
      const copyWatchLinkBtn = document.getElementById("copyWatchLinkBtn");
      const copyShortLinkBtn = document.getElementById("copyShortLinkBtn");
      const shareRoomBtn = document.getElementById("shareRoomBtn");
      const roomInput = document.getElementById("roomInput");
      const roomPasswordInput = document.getElementById("roomPasswordInput");
      const packSelect = document.getElementById("packSelect");
      const applyPackBtn = document.getElementById("applyPackBtn");

      const redPosText = document.getElementById("redPosText");
      const redCellText = document.getElementById("redCellText");
      const bluePosText = document.getElementById("bluePosText");
      const blueCellText = document.getElementById("blueCellText");
      const redProgress = document.getElementById("redProgress");
      const blueProgress = document.getElementById("blueProgress");

      const redDiceRow = document.getElementById("redDiceRow");
      const blueDiceRow = document.getElementById("blueDiceRow");

      const cellDetailTitle = document.getElementById("cellDetailTitle");
      const cellDetailBody = document.getElementById("cellDetailBody");
      const lastTriggerText = document.getElementById("lastTriggerText");
      const timelineList = document.getElementById("timelineList");
      const integrityBadge = document.getElementById("integrityBadge");
      const replayPrevBtn = document.getElementById("replayPrevBtn");
      const replayNextBtn = document.getElementById("replayNextBtn");
      const replayExitBtn = document.getElementById("replayExitBtn");
      const replayStatusText = document.getElementById("replayStatusText");
      const replayRange = document.getElementById("replayRange");
      const timelineFilterSelect = document.getElementById("timelineFilterSelect");
      const spectatorReplayBtn = document.getElementById("spectatorReplayBtn");
      const chatList = document.getElementById("chatList");
      const chatInput = document.getElementById("chatInput");
      const chatSendBtn = document.getElementById("chatSendBtn");
      const applyCustomPackBtn = document.getElementById("applyCustomPackBtn");
      const loadCurrentPackBtn = document.getElementById("loadCurrentPackBtn");
      const customPackTitleInput = document.getElementById("customPackTitleInput");
      const customPackSubtitleInput = document.getElementById("customPackSubtitleInput");
      const customPackCellsInput = document.getElementById("customPackCellsInput");
      const toggleDrawerBtn = document.getElementById("toggleDrawerBtn");
      const boardFullscreenBtn = document.getElementById("boardFullscreenBtn");
      const sidePanel = document.querySelector("aside.side");

      const vertices = [
        { x: 190, y: 50 },
        { x: 790, y: 50 },
        { x: 930, y: 190 },
        { x: 930, y: 790 },
        { x: 790, y: 930 },
        { x: 190, y: 930 },
        { x: 50, y: 790 },
        { x: 50, y: 190 },
      ];

      const fallbackRules = {
        version: "fallback",
        title: "情侣飞行棋 V2.3",
        subtitle: "联机双人版",
        wheelLabels: ["1 喝一口", "2 再掷", "3 亲吻", "4 喝一口", "5 亲吻", "6 入棋盘"],
        boardRules: [
          "1. 掷到 6 可起飞，且额外回合。",
          "2. 落在同一格会把对方撞回基地。",
          "3. 事件格按文字执行（后退、休息、返回起点等）。",
          "4. 必须刚好点数到达终点。",
        ],
        cells: [
          "掷骰子",
          "下一轮休息",
          "喝半杯",
          "口交至对方流水或坚持10秒",
          "舔对方耳根10秒",
          "用嘴喂对方喝一口酒",
          "为对方脱一件衣物",
          "手伸进对方内裤里随意发挥30秒",
          "吮吸对方脖子种一颗草莓",
          "后退3格并脱一件衣物",
          "为对方撸管或抠阴1分钟",
          "舔对方大腿内侧10秒，对方笑岔气则罚喝一杯",
          "女生停留此格进入",
          "与对方舌吻30秒",
          "喝一杯",
          "返回起点",
          "男生停留此格让女生咬自己乳头10秒方可飞跃",
          "后入抽插对方1分钟",
          "从背后抱住对方随意抚摸1分钟",
          "为对方口交3分钟",
          "让对方喝酒每喝一杯给对方转账5.2元",
          "揉对方乳头1分钟",
          "为对方口交3分钟",
          "自己喝酒每喝一杯对方给自己转账13.14元",
          "选择一个自己喜欢的姿势让对方插10下",
          "和对方用观音坐莲姿势自己动至少10下",
          "喂对方喝一口自己的口水",
          "女生停留此格进入",
          "后退6格并脱一件衣物",
          "打对方屁股3下",
          "自己脱一件衣物",
          "让对手从耳根开始舔到胸口",
          "男生停留此格进入",
          "女生停留此格与男生69式1分钟方可飞跃",
          "对方坐在自己脸上吸吮对方鸡鸡或阴蒂30秒",
          "喝半杯",
          "下一轮休息",
          "喝半杯",
          "掷骰子",
          "喝一杯",
          "再掷一次",
          "后退3格并脱一件衣物",
          "为对方脱一件衣物",
          "手伸进对方内裤里随意发挥30秒",
        ],
      };
      let rulesConfig = fallbackRules;
      let selectedPackId = "classic";
      let contentPacks = [];
      let autoJoinMode = null;

      function makeShortLabel(text) {
        const cleaned = String(text || "").replace(/\s+/g, "");
        if (!cleaned) return "";
        if (cleaned.includes("掷骰")) return "掷骰子";
        if (cleaned.includes("返回")) return "返回起点";
        if (cleaned.includes("再掷")) return "再掷一次";
        if (cleaned.includes("休息")) return "下轮休息";
        if (cleaned.includes("后退")) return cleaned.match(/后退\d+格/)?.[0] || "后退";
        const firstClause = cleaned.split(/[，。；：,.!！?？]/).find(Boolean) || cleaned;
        if (firstClause.length <= 10) return firstClause;
        return `${firstClause.slice(0, 8)}…`;
      }

      function colorByText(text, idx) {
        if (idx === 0 || text.includes("掷骰")) return "#9ae6b4";
        if (text.includes("返回")) return "#fca5a5";
        if (text.includes("再掷")) return "#86efac";
        if (text.includes("喝")) return "#fde047";
        if (text.includes("后退")) return "#fdba74";
        if (text.includes("休息")) return "#e5e7eb";
        if (text.includes("停留")) return "#93c5fd";
        if (text.includes("转账")) return "#f9a8d4";
        if (text.includes("脱一件衣物")) return "#bfdbfe";
        return "#f8fafc";
      }

      function buildCells(texts) {
        return texts.map((text, idx) => ({
          text,
          short: makeShortLabel(text),
          color: colorByText(text, idx),
        }));
      }

      let cells = buildCells((rulesConfig && rulesConfig.cells) || fallbackRules.cells);

      function samplePolyline(points, count) {
        const closed = [...points, points[0]];
        const segments = [];
        let total = 0;

        for (let i = 0; i < closed.length - 1; i += 1) {
          const a = closed[i];
          const b = closed[i + 1];
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          segments.push({ a, b, len, start: total });
          total += len;
        }

        const interval = total / count;
        const pointsOut = [];

        for (let i = 0; i < count; i += 1) {
          const dist = i * interval;
          const seg = segments.find((s, idx) => {
            if (idx === segments.length - 1) return true;
            return dist >= s.start && dist < s.start + s.len;
          });
          const t = seg.len === 0 ? 0 : (dist - seg.start) / seg.len;
          pointsOut.push({
            x: seg.a.x + (seg.b.x - seg.a.x) * t,
            y: seg.a.y + (seg.b.y - seg.a.y) * t,
          });
        }

        return pointsOut;
      }

      const pathPoints = samplePolyline(vertices, PATH_LEN);

      const players = [
        {
          role: ROLE_RED,
          name: "男方",
          short: "男",
          color: "#ef4444",
          dark: "#7f1d1d",
          startIndex: 0,
          base: { x: 130, y: 120 },
          step: -1,
          skip: 0,
        },
        {
          role: ROLE_BLUE,
          name: "女方",
          short: "女",
          color: "#3b82f6",
          dark: "#1e3a8a",
          startIndex: 22,
          base: { x: 850, y: 860 },
          step: -1,
          skip: 0,
        },
      ];

      const state = {
        current: 0,
        dice: null,
        lastRoll: null,
        gameOver: false,
        message: "点击掷骰子开始。",
        diceHistory: [],
        rollCount: 0,
        turnHistory: [],
        selectedCellIndex: null,
        lastTriggeredCell: null,
        replayMode: false,
        replayCursor: -1,
        replayBackup: null,
        turnDeadlineAt: 0,
        turnTickTimer: null,
        lastTurnRole: null,
        notifyEnabled: false,
        lang: "zh-CN",
      };

      const online = {
        enabled: false,
        roomId: "",
        role: null,
        mode: "player",
        token: "",
        version: 0,
        seats: { red: false, blue: false, spectators: 0 },
        pollTimer: null,
        applyingRemote: false,
        deployInfo: null,
        pendingOps: [],
        flushInFlight: false,
        logs: [],
        integrity: null,
        lastLogsTotal: 0,
        ws: null,
        wsConnected: false,
        lastWsAt: 0,
        wsHeartbeatTimer: null,
        chat: [],
        chatTotal: 0,
        lastChatId: "",
        spectatorReplayLock: false,
        eventPollCount: 0,
      };

      function formatTime(ts) {
        const d = new Date(ts);
        return d.toLocaleTimeString("zh-CN", { hour12: false });
      }

      function makeId() {
        return Math.random().toString(36).slice(2, 8).toUpperCase();
      }

      function makeActionId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      }

      function sanitizeRoomId(raw) {
        return String(raw || "")
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 8);
      }

      function roomLink(roomId = online.roomId, mode = "player") {
        const url = new URL("/", SHARE_BASE_ORIGIN);
        if (roomId) {
          url.searchParams.set("room", roomId);
        } else {
          url.searchParams.delete("room");
        }
        if (mode === "spectator") {
          url.searchParams.set("mode", "spectator");
        } else {
          url.searchParams.delete("mode");
        }
        return url.toString();
      }

      function wsLink(roomId = online.roomId, token = online.token) {
        const apiOrigin = new URL(API_BASE_ORIGIN);
        const protocol = apiOrigin.protocol === "https:" ? "wss" : "ws";
        const url = new URL(`${protocol}://${apiOrigin.host}/ws`);
        url.searchParams.set("room", roomId);
        url.searchParams.set("token", token);
        return url.toString();
      }

      function apiUrl(path) {
        const normalized = String(path || "/").startsWith("/") ? String(path || "/") : `/${String(path || "")}`;
        return new URL(normalized, `${API_BASE_ORIGIN}/`).toString();
      }

      async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          return;
        }
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      async function api(path, options = {}) {
        const mergedHeaders = { "Content-Type": "application/json", ...(options.headers || {}) };
        if (online.enabled && online.token && path.startsWith("/api/rooms/") && !mergedHeaders["x-room-token"]) {
          mergedHeaders["x-room-token"] = online.token;
        }
        const res = await fetch(apiUrl(path), {
          method: options.method || "GET",
          headers: mergedHeaders,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.error || `请求失败(${res.status})`);
        }

        return payload;
      }

      function toGlobalIndex(playerIdx, step) {
        return (players[playerIdx].startIndex + step) % PATH_LEN;
      }

      function stepToPoint(playerIdx, step) {
        if (step === -1) return players[playerIdx].base;

        if (step < PATH_LEN) {
          return pathPoints[toGlobalIndex(playerIdx, step)];
        }

        if (step < GOAL_STEP) {
          const lane = step - PATH_LEN + 1;
          const t = lane / (HOME_LEN + 1);
          const start = pathPoints[players[playerIdx].startIndex];
          return {
            x: start.x + (CENTER.x - start.x) * t,
            y: start.y + (CENTER.y - start.y) * t,
          };
        }

        return CENTER;
      }

      function describeStep(step) {
        if (step === -1) return "基地";
        if (step === GOAL_STEP) return "终点";
        if (step < PATH_LEN) return `环道${step + 1}`;
        return `冲刺${step - PATH_LEN + 1}`;
      }

      function getCellByStep(playerIdx, step) {
        if (step >= 0 && step < PATH_LEN) {
          const idx = toGlobalIndex(playerIdx, step);
          return { idx, cell: cells[idx] };
        }
        return null;
      }

      function getProgress(step) {
        if (step < 0) return 0;
        return Math.max(0, Math.min(100, (step / GOAL_STEP) * 100));
      }

      function syncCanvasResolution() {
        const rect = board.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const targetW = Math.round(rect.width * dpr);
        const targetH = Math.round(rect.height * dpr);
        if (board.width !== targetW || board.height !== targetH) {
          board.width = targetW;
          board.height = targetH;
        }
        ctx.setTransform(targetW / SIZE, 0, 0, targetH / SIZE, 0, 0);
      }

      function wrapText(text, x, y, maxWidth, lineHeight, maxLines = 3) {
        const chars = [...text];
        const lines = [];
        let line = "";

        chars.forEach((ch) => {
          const test = line + ch;
          if (ctx.measureText(test).width > maxWidth && line.length > 0) {
            lines.push(line);
            line = ch;
          } else {
            line = test;
          }
        });

        if (line) lines.push(line);
        const shown = lines.slice(0, maxLines);
        if (lines.length > maxLines && shown.length > 0) {
          shown[shown.length - 1] = `${shown[shown.length - 1].slice(0, -1)}…`;
        }

        const startY = y - ((shown.length - 1) * lineHeight) / 2;
        shown.forEach((ln, idx) => {
          ctx.fillText(ln, x, startY + idx * lineHeight);
        });
      }

      function applyBoardZoom(value) {
        const zoom = Math.max(80, Math.min(130, Number(value) || 100));
        document.documentElement.style.setProperty("--board-scale", String(zoom / 100));
        boardZoomRange.value = String(zoom);
        boardZoomText.textContent = `${zoom}%`;
        localStorage.setItem("flight_board_zoom", String(zoom));
      }

      function initBoardZoom() {
        const raw = Number(localStorage.getItem("flight_board_zoom") || "120");
        applyBoardZoom(Number.isFinite(raw) ? raw : 120);
      }

      function isMobileViewport() {
        return window.matchMedia("(max-width: 980px)").matches;
      }

      function syncDrawerUI() {
        if (!toggleDrawerBtn) return;
        const opened = document.body.classList.contains("drawer-open");
        toggleDrawerBtn.textContent = opened ? "关闭面板" : "打开面板";
      }

      function setDrawerOpen(opened) {
        if (!isMobileViewport()) {
          document.body.classList.remove("drawer-open");
          syncDrawerUI();
          return;
        }
        if (opened) {
          document.body.classList.add("drawer-open");
        } else {
          document.body.classList.remove("drawer-open");
        }
        syncDrawerUI();
      }

      function toggleDrawer() {
        setDrawerOpen(!document.body.classList.contains("drawer-open"));
      }

      async function toggleBoardFullscreen() {
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
            return;
          }
          const target = document.querySelector(".board-panel") || board;
          if (target && target.requestFullscreen) {
            await target.requestFullscreen();
          }
        } catch (_err) {
          setRoomHint("全屏切换失败，请手动使用浏览器全屏");
        }
      }

      function drawWheel(cx, cy, title) {
        const labels =
          (rulesConfig && Array.isArray(rulesConfig.wheelLabels) && rulesConfig.wheelLabels.length === 6
            ? rulesConfig.wheelLabels
            : fallbackRules.wheelLabels);
        const colors = ["#93c5fd", "#86efac", "#fdba74", "#fcd34d", "#fda4af", "#d1d5db"];
        const r = 95;
        const each = (Math.PI * 2) / labels.length;

        for (let i = 0; i < labels.length; i += 1) {
          const start = -Math.PI / 2 + i * each;
          const end = start + each;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, r, start, end);
          ctx.closePath();
          ctx.fillStyle = colors[i];
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();

          const mid = (start + end) / 2;
          const tx = cx + Math.cos(mid) * 57;
          const ty = cy + Math.sin(mid) * 57;
          ctx.fillStyle = "#1f2937";
          ctx.font = "600 12px Avenir Next, PingFang SC";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          wrapText(labels[i], tx, ty, 58, 12, 2);
        }

        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.strokeStyle = "#94a3b8";
        ctx.stroke();

        ctx.fillStyle = "#334155";
        ctx.font = "700 14px Avenir Next, PingFang SC";
        ctx.fillText("转盘", cx, cy + 0.5);

        ctx.font = "700 17px Avenir Next, PingFang SC";
        ctx.fillText(title, cx, cy - 118);
      }

      function drawBoard() {
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = "#f8f6f1";
        ctx.fillRect(0, 0, SIZE, SIZE);

        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i += 1) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.strokeStyle = "#1f2937";
        ctx.lineWidth = 3;
        ctx.stroke();

        pathPoints.forEach((pt, idx) => {
          ctx.fillStyle = cells[idx].color;
          ctx.fillRect(pt.x - CELL_SIZE / 2, pt.y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
          ctx.strokeStyle = "#1f2937";
          ctx.lineWidth = 1.4;
          ctx.strokeRect(pt.x - CELL_SIZE / 2, pt.y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);

          if (state.selectedCellIndex === idx) {
            ctx.strokeStyle = "#0f766e";
            ctx.lineWidth = 3;
            ctx.strokeRect(pt.x - CELL_SIZE / 2 + 2, pt.y - CELL_SIZE / 2 + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          }

          ctx.fillStyle = "#111827";
          ctx.font = "600 10px Avenir Next, PingFang SC";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          wrapText(cells[idx].short, pt.x, pt.y, CELL_SIZE - 8, 10, 3);
        });

        const boardTitle = (rulesConfig && rulesConfig.title) || fallbackRules.title;
        const boardSubtitle = (rulesConfig && rulesConfig.subtitle) || fallbackRules.subtitle;
        const boardRules =
          (rulesConfig && Array.isArray(rulesConfig.boardRules) && rulesConfig.boardRules.length
            ? rulesConfig.boardRules
            : fallbackRules.boardRules);

        ctx.fillStyle = "#be123c";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "700 54px Avenir Next, PingFang SC";
        ctx.fillText(boardTitle, CENTER.x, 248);
        ctx.font = "700 38px Avenir Next, PingFang SC";
        ctx.fillText(boardSubtitle, CENTER.x, 300);

        ctx.fillStyle = "#1f2937";
        ctx.font = "600 24px Avenir Next, PingFang SC";
        ctx.fillText("规则", CENTER.x, 700);

        ctx.font = "500 21px Avenir Next, PingFang SC";
        boardRules.forEach((line, i) => {
          ctx.fillText(line, CENTER.x, 736 + i * 32);
        });

        ctx.beginPath();
        ctx.arc(CENTER.x, CENTER.y, 78, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.fill();
        ctx.strokeStyle = "#7f1d1d";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = "700 46px Avenir Next, PingFang SC";
        ctx.fillText("终点", CENTER.x, CENTER.y - 6);
        ctx.font = "600 20px Avenir Next, PingFang SC";
        ctx.fillText("先到者胜", CENTER.x, CENTER.y + 30);

        drawWheel(165, 165, "男方转盘");
        drawWheel(815, 815, "女方转盘");
      }

      function drawTokens() {
        players.forEach((p, idx) => {
          if (p.step >= 0 && p.step < PATH_LEN) {
            const cell = pathPoints[toGlobalIndex(idx, p.step)];
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(cell.x - CELL_SIZE / 2 + 2, cell.y - CELL_SIZE / 2 + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          }

          let pt = stepToPoint(idx, p.step);
          let outerR = 14;
          let innerR = 10;

          if (p.step >= 0 && p.step < PATH_LEN) {
            const offset = idx === 0 ? { x: -16, y: -16 } : { x: 16, y: 16 };
            pt = { x: pt.x + offset.x, y: pt.y + offset.y };
            outerR = 11;
            innerR = 8;
          } else if (p.step >= PATH_LEN && p.step < GOAL_STEP) {
            const offset = idx === 0 ? { x: -12, y: -12 } : { x: 12, y: 12 };
            pt = { x: pt.x + offset.x, y: pt.y + offset.y };
          }

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, outerR, 0, Math.PI * 2);
          ctx.fillStyle = "#fff";
          ctx.fill();

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, innerR, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.strokeStyle = p.dark;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = innerR <= 8 ? "700 11px Avenir Next, PingFang SC" : "700 13px Avenir Next, PingFang SC";
          ctx.fillText(p.short, pt.x, pt.y + 0.5);
        });
      }

      function recordTurn(entry) {
        const item = {
          ...entry,
          signature: entry.signature || "",
          snapshot: entry.snapshot || snapshotGame(),
        };
        state.turnHistory.unshift(item);
        state.turnHistory = state.turnHistory.slice(0, 120);
      }

      function addDiceHistory(playerIdx, dice, fromStep, toStep) {
        state.rollCount += 1;
        state.lastRoll = { playerIdx, dice };
        state.diceHistory.unshift({ id: state.rollCount, playerIdx, dice, fromStep, toStep });
        state.diceHistory = state.diceHistory.slice(0, 80);
      }

      function setMessage(msg) {
        state.message = msg;
      }

      function canMove(player, dice) {
        if (player.step === -1) return dice === 6;
        return player.step + dice <= GOAL_STEP;
      }

      function handleCapture(playerIdx) {
        const me = players[playerIdx];
        const enemyIdx = playerIdx === 0 ? 1 : 0;
        const enemy = players[enemyIdx];

        if (me.step < 0 || me.step >= PATH_LEN || enemy.step < 0 || enemy.step >= PATH_LEN) {
          return "";
        }

        const meGlobal = toGlobalIndex(playerIdx, me.step);
        const enemyGlobal = toGlobalIndex(enemyIdx, enemy.step);
        if (meGlobal === enemyGlobal) {
          enemy.step = -1;
          return "撞机成功，对方回基地";
        }

        return "";
      }

      function applyCellEffect(playerIdx, text) {
        const me = players[playerIdx];
        const enemy = players[playerIdx === 0 ? 1 : 0];
        let extraTurn = false;
        let effect = `触发：${text}`;

        const moveMatch = text.match(/(前进|后退)(\d+)格/);
        if (moveMatch && me.step !== -1) {
          const sign = moveMatch[1] === "前进" ? 1 : -1;
          const n = Number(moveMatch[2]);
          const next = me.step + sign * n;
          if (next >= 0 && next <= GOAL_STEP) {
            me.step = next;
            effect += `，位置变为${describeStep(me.step)}`;
          }
        }

        if (text.includes("再掷一次") || text.includes("掷骰子")) {
          extraTurn = true;
          effect += "，获得额外回合";
        }

        if (text.includes("返回起点")) {
          me.step = -1;
          effect += "，回到基地";
        }

        if (text.includes("下一轮休息")) {
          me.skip += 1;
          effect += "，下回合休息";
        }

        if (text.includes("交换位置") && enemy.step >= 0) {
          const t = me.step;
          me.step = enemy.step;
          enemy.step = t;
          effect += "，与对方交换位置";
        }

        return { extraTurn, effect };
      }

      function endTurn(keepCurrent) {
        state.dice = null;
        if (!keepCurrent) {
          state.current = state.current === 0 ? 1 : 0;
        }
      }

      function snapshotGame() {
        const safeTurnHistory = state.turnHistory.slice(0, 80).map((t) => ({
          id: t.id,
          at: t.at,
          player: t.player,
          dice: t.dice,
          from: t.from,
          to: t.to,
          event: t.event,
          signature: t.signature || "",
        }));
        return {
          players: players.map((p) => ({ step: p.step, skip: p.skip })),
          game: {
            current: state.current,
            dice: state.dice,
            lastRoll: state.lastRoll,
            gameOver: state.gameOver,
            message: state.message,
            diceHistory: state.diceHistory.slice(0, 80),
            rollCount: state.rollCount,
            turnHistory: safeTurnHistory,
            selectedCellIndex: state.selectedCellIndex,
            lastTriggeredCell: state.lastTriggeredCell,
          },
        };
      }

      function applySnapshot(snapshot) {
        if (!snapshot || !snapshot.players || !snapshot.game) return;

        snapshot.players.forEach((p, idx) => {
          if (!players[idx]) return;
          players[idx].step = typeof p.step === "number" ? p.step : -1;
          players[idx].skip = typeof p.skip === "number" ? p.skip : 0;
        });

        state.current = snapshot.game.current ?? 0;
        state.dice = snapshot.game.dice ?? null;
        state.lastRoll = snapshot.game.lastRoll ?? null;
        state.gameOver = !!snapshot.game.gameOver;
        state.message = snapshot.game.message || "";
        state.diceHistory = Array.isArray(snapshot.game.diceHistory) ? snapshot.game.diceHistory : [];
        state.rollCount = Number.isFinite(snapshot.game.rollCount) ? snapshot.game.rollCount : 0;
        state.turnHistory = Array.isArray(snapshot.game.turnHistory) ? snapshot.game.turnHistory : [];
        state.selectedCellIndex =
          Number.isInteger(snapshot.game.selectedCellIndex) ? snapshot.game.selectedCellIndex : null;
        state.lastTriggeredCell = snapshot.game.lastTriggeredCell || null;
        maybeTurnNotify();
      }

      function allowLiveSnapshotApply() {
        if (state.replayMode) return false;
        if (online.role === "spectator" && online.spectatorReplayLock) return false;
        return true;
      }

      function hydrateTurnHistoryFromLogs(logs) {
        const source = Array.isArray(logs) ? logs : [];
        state.turnHistory = [...source]
          .reverse()
          .map((log, idx) => ({
            id: log.idx || idx + 1,
            at: log.at || Date.now(),
            player: log.role === ROLE_RED ? "男方" : log.role === ROLE_BLUE ? "女方" : "观战",
            dice: Number(log.snapshot?.game?.lastRoll?.dice || 0),
            from: "",
            to: "",
            event: log.summary || "同步",
            signature: log.digest || "",
            snapshot: log.snapshot || null,
          }));
      }

      function classifyTimelineEvent(eventText = "") {
        const text = String(eventText || "");
        const criticalKeys = ["抵达终点", "撞回基地", "返回起点", "切换文案包", "自定义文案包", "超时"];
        const isCritical = criticalKeys.some((k) => text.includes(k));
        const isTimeout = text.includes("超时");
        return { isCritical, isTimeout };
      }

      function roleByTurn() {
        return state.current === 0 ? ROLE_RED : ROLE_BLUE;
      }

      function onlineReady() {
        return online.seats.red && online.seats.blue;
      }

      function canCurrentClientAct() {
        if (state.replayMode) return false;
        if (!online.enabled) return true;
        if (online.role === "spectator") return false;
        if (!onlineReady()) return false;
        return online.role === roleByTurn();
      }

      function setRoomHint(msg) {
        roomStatus.textContent = state.lang === "en-US" ? `Status: ${msg}` : `状态：${msg}`;
      }

      function setRealtimeHint(msg) {
        realtimeStatus.textContent = state.lang === "en-US" ? `Realtime: ${msg}` : `实时通道：${msg}`;
      }

      function roleName(role) {
        if (role === ROLE_RED) return "男方";
        if (role === ROLE_BLUE) return "女方";
        if (role === "spectator") return "观战";
        return "-";
      }

      function nowTurnRole() {
        return state.current === 0 ? ROLE_RED : ROLE_BLUE;
      }

      function resetTurnTimer() {
        if (state.turnTickTimer) {
          clearInterval(state.turnTickTimer);
          state.turnTickTimer = null;
        }
        state.turnDeadlineAt = Date.now() + TURN_TIMEOUT_SEC * 1000;
        state.turnTickTimer = setInterval(() => {
          if (state.gameOver || state.replayMode) return;
          const remain = state.turnDeadlineAt - Date.now();
          if (remain <= 0) {
            clearInterval(state.turnTickTimer);
            state.turnTickTimer = null;
            handleTurnTimeout();
            return;
          }
          renderStatus();
        }, 250);
      }

      async function handleTurnTimeout() {
        if (state.gameOver || state.replayMode) return;
        const role = nowTurnRole();
        if (online.enabled) {
          if (!canCurrentClientAct()) {
            resetTurnTimer();
            return;
          }
          setMessage(`${roleName(role)} 超时，系统自动跳过。`);
          render();
          await requestOnlineAction("timeout_skip");
          await pullRoomLogs();
          render();
          resetTurnTimer();
          return;
        }

        const idx = state.current;
        const p = players[idx];
        recordTurn({
          id: state.rollCount + 1,
          at: Date.now(),
          player: p.name,
          dice: 0,
          from: describeStep(p.step),
          to: describeStep(p.step),
          event: "超时跳过",
        });
        setMessage(`${p.name} 超时，自动跳过回合。`);
        state.current = state.current === 0 ? 1 : 0;
        render();
        resetTurnTimer();
      }

      function beepOnce() {
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return;
          const ctxA = new AudioCtx();
          const osc = ctxA.createOscillator();
          const gain = ctxA.createGain();
          osc.type = "triangle";
          osc.frequency.value = 880;
          gain.gain.value = 0.04;
          osc.connect(gain);
          gain.connect(ctxA.destination);
          osc.start();
          osc.stop(ctxA.currentTime + 0.16);
        } catch (_err) {
          // ignore
        }
      }

      async function maybeTurnNotify() {
        if (state.replayMode) return;
        if (online.enabled && !onlineReady()) {
          if (state.turnTickTimer) {
            clearInterval(state.turnTickTimer);
            state.turnTickTimer = null;
          }
          return;
        }
        const role = nowTurnRole();
        if (state.lastTurnRole === role) return;
        state.lastTurnRole = role;
        resetTurnTimer();
        if (!online.enabled) return;
        if (!canCurrentClientAct()) return;
        if (!state.notifyEnabled) return;

        beepOnce();
        try {
          if (Notification.permission === "granted") {
            // eslint-disable-next-line no-new
            new Notification("轮到你了", {
              body: `房间 ${online.roomId}，请掷骰子`,
            });
          }
        } catch (_err) {
          // ignore
        }
      }

      async function enableTurnNotification() {
        if (!("Notification" in window)) {
          setRoomHint("当前浏览器不支持通知");
          return;
        }
        if (Notification.permission === "granted") {
          state.notifyEnabled = true;
          setRoomHint("到你提醒已开启");
          renderStatus();
          return;
        }
        const permission = await Notification.requestPermission();
        state.notifyEnabled = permission === "granted";
        setRoomHint(state.notifyEnabled ? "到你提醒已开启" : "通知权限未开启");
        renderStatus();
      }

      function saveRoomSession() {
        if (!online.enabled || !online.roomId || !online.token) return;
        localStorage.setItem(
          `flight_room_token_${online.roomId}`,
          JSON.stringify({
            token: online.token,
            mode: online.mode || "player",
            savedAt: Date.now(),
          }),
        );
      }

      function clearRoomSession(roomId = online.roomId) {
        if (!roomId) return;
        localStorage.removeItem(`flight_room_token_${roomId}`);
      }

      function readRoomSession(roomId) {
        if (!roomId) return null;
        const raw = localStorage.getItem(`flight_room_token_${roomId}`);
        if (!raw) return null;
        try {
          const parsed = JSON.parse(raw);
          if (!parsed || typeof parsed !== "object") return null;
          if (!parsed.token || !parsed.savedAt) return null;
          if (Date.now() - Number(parsed.savedAt) > RECONNECT_WINDOW_MS) return null;
          return parsed;
        } catch (_err) {
          return null;
        }
      }

      function shortInviteLink(roomId = online.roomId, mode = "player") {
        if (!roomId) return "";
        const url = new URL("/", SHARE_BASE_ORIGIN);
        url.pathname = `/i/${roomId}`;
        url.search = mode === "spectator" ? "?mode=spectator" : "";
        return url.toString();
      }

      function renderQr(link) {
        if (!link) {
          qrPreview.removeAttribute("src");
          return;
        }
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`;
        qrPreview.src = apiUrl;
      }

      function setRoomQuery(roomId, mode = "player") {
        const url = new URL(window.location.href);
        if (roomId) {
          url.searchParams.set("room", roomId);
        } else {
          url.searchParams.delete("room");
        }
        if (mode === "spectator") {
          url.searchParams.set("mode", "spectator");
        } else {
          url.searchParams.delete("mode");
        }
        window.history.replaceState({}, "", url.toString());
      }

      async function pullRoomState() {
        if (!online.enabled || !online.roomId) return;
        const payload = await api(`/api/rooms/${online.roomId}/state`);
        online.seats = payload.seats || online.seats;
        if (payload.packId && payload.packId !== selectedPackId) {
          await loadRules(payload.packId, true);
        }

        if (typeof payload.version === "number" && payload.version > online.version) {
          if (allowLiveSnapshotApply()) {
            online.applyingRemote = true;
            applySnapshot(payload.snapshot);
            online.version = payload.version;
            online.applyingRemote = false;
          } else {
            online.version = payload.version;
          }
        } else if (typeof payload.version === "number" && !online.pendingOps.length) {
          online.version = payload.version;
        }
      }

      async function pullRoomEvents() {
        if (!online.enabled || !online.roomId) return false;
        const payload = await api(`/api/rooms/${online.roomId}/events?afterVersion=${online.version}`);
        online.seats = payload.seats || online.seats;
        if (payload.packId && payload.packId !== selectedPackId) {
          await loadRules(payload.packId, true);
        }
        if (typeof payload.integrity === "boolean") {
          online.integrity = payload.integrity;
        }

        if (payload.unchanged) {
          return false;
        }

        if (typeof payload.toVersion === "number") {
          online.version = Math.max(online.version, payload.toVersion);
        }

        if (Array.isArray(payload.events) && payload.events.length) {
          if (payload.tooFarBehind) {
            online.logs = payload.events.slice(-240);
          } else {
            const merged = [...online.logs, ...payload.events];
            const dedup = [];
            const seen = new Set();
            for (let i = merged.length - 1; i >= 0; i -= 1) {
              const key = merged[i].digest || `${merged[i].idx}-${merged[i].actionId}`;
              if (seen.has(key)) continue;
              seen.add(key);
              dedup.unshift(merged[i]);
            }
            online.logs = dedup.slice(-240);
          }
          if (!state.replayMode) {
            hydrateTurnHistoryFromLogs(online.logs);
          }
        }

        if (allowLiveSnapshotApply() && payload.snapshot) {
          online.applyingRemote = true;
          applySnapshot(payload.snapshot);
          online.applyingRemote = false;
        }

        online.lastLogsTotal = Number(payload.totalLogs || online.logs.length);
        return true;
      }

      async function pullRoomLogs() {
        if (!online.enabled || !online.roomId) return;
        const payload = await api(`/api/rooms/${online.roomId}/logs?limit=160`);
        online.logs = Array.isArray(payload.logs) ? payload.logs : [];
        online.integrity = !!payload.integrity;
        online.lastLogsTotal = Number(payload.total || 0);
        if (payload.packId && payload.packId !== selectedPackId) {
          await loadRules(payload.packId, true);
        }

        if (!state.replayMode) {
          hydrateTurnHistoryFromLogs(online.logs);
        }
      }

      async function pullRoomChat({ incremental = false } = {}) {
        if (!online.enabled || !online.roomId) return;
        const query = new URLSearchParams();
        query.set("limit", "120");
        if (incremental && online.lastChatId) {
          query.set("afterId", online.lastChatId);
        }
        const payload = await api(`/api/rooms/${online.roomId}/chat?${query.toString()}`);
        const messages = Array.isArray(payload.messages) ? payload.messages : [];
        if (incremental && online.lastChatId) {
          const merged = [...(online.chat || []), ...messages];
          const dedup = [];
          const seen = new Set();
          for (let i = merged.length - 1; i >= 0; i -= 1) {
            const key = merged[i].id || `${merged[i].at}-${merged[i].text}`;
            if (seen.has(key)) continue;
            seen.add(key);
            dedup.unshift(merged[i]);
          }
          online.chat = dedup.slice(-200);
        } else {
          online.chat = messages;
        }
        online.chatTotal = Number(payload.total || 0);
        online.lastChatId = payload.newestId || online.chat[online.chat.length - 1]?.id || online.lastChatId;
      }

      async function sendChat(text) {
        if (!online.enabled || !online.roomId || !online.token) {
          setRoomHint("请先进入房间后再发送聊天");
          return;
        }
        const trimmed = String(text || "").trim();
        if (!trimmed) return;
        if (trimmed.length > 200) {
          setRoomHint("聊天消息最多 200 字");
          return;
        }
        try {
          await api(`/api/rooms/${online.roomId}/chat`, {
            method: "POST",
            body: {
              token: online.token,
              text: trimmed,
            },
          });
          chatInput.value = "";
          await pullRoomChat({ incremental: true });
          renderChat();
        } catch (err) {
          setRoomHint(`发送失败：${err.message}`);
        }
      }

      function renderChat() {
        chatList.innerHTML = "";
        if (!online.chat.length) {
          const li = document.createElement("li");
          li.textContent = "暂无聊天消息";
          chatList.appendChild(li);
          return;
        }
        online.chat.slice(-120).forEach((m) => {
          const li = document.createElement("li");
          const from =
            m.role === ROLE_RED ? "男方" : m.role === ROLE_BLUE ? "女方" : m.role === "spectator" ? "观战" : "系统";
          li.textContent = `${formatTime(m.at || Date.now())}｜${from}：${m.text || ""}`;
          chatList.appendChild(li);
        });
        chatList.scrollTop = chatList.scrollHeight;
      }

      function queueOperation(actionType) {
        if (!online.enabled || online.role === "spectator") return;
        const op = {
          actionId: makeActionId(),
          actionType,
          baseVersion: online.version + online.pendingOps.length,
        };
        online.pendingOps.push(op);
      }

      async function flushOperationQueue() {
        if (!online.enabled || online.flushInFlight || !online.pendingOps.length || online.role === "spectator") {
          return;
        }

        online.flushInFlight = true;
        try {
          while (online.pendingOps.length) {
            const op = online.pendingOps[0];
            const payload = await api(`/api/rooms/${online.roomId}/action`, {
              method: "POST",
              body: {
                role: online.role,
                token: online.token,
                actionId: op.actionId,
                actionType: op.actionType,
                baseVersion: op.baseVersion,
              },
            });
            online.version = Number(payload.version || online.version);
            online.seats = payload.seats || online.seats;
            if (payload.packId && payload.packId !== selectedPackId) {
              await loadRules(payload.packId, true);
            }
            if (allowLiveSnapshotApply() && payload.snapshot) {
              online.applyingRemote = true;
              applySnapshot(payload.snapshot);
              online.applyingRemote = false;
            }
            if (typeof payload.integrity === "boolean") {
              online.integrity = payload.integrity;
            }
            online.pendingOps.shift();
          }
        } catch (err) {
          if (String(err.message).includes("版本冲突")) {
            online.pendingOps = [];
            await pullRoomEvents();
            setMessage("检测到并发更新，已自动对齐到最新局面。");
            render();
            return;
          }
          setRoomHint(`同步失败：${err.message}（队列保留，将自动重试）`);
        } finally {
          online.flushInFlight = false;
        }
      }

      function disconnectRoomSocket() {
        if (online.wsHeartbeatTimer) {
          clearInterval(online.wsHeartbeatTimer);
          online.wsHeartbeatTimer = null;
        }
        if (online.ws) {
          try {
            online.ws.onclose = null;
            online.ws.close();
          } catch (_err) {
            // ignore
          }
        }
        online.ws = null;
        online.wsConnected = false;
        setRealtimeHint("未连接（使用轮询）");
      }

      function connectRoomSocket() {
        disconnectRoomSocket();
        if (!online.enabled || !online.roomId || !online.token) return;
        try {
          const ws = new WebSocket(wsLink(online.roomId, online.token));
          online.ws = ws;
          setRealtimeHint("连接中...");

          ws.onopen = () => {
            online.wsConnected = true;
            online.lastWsAt = Date.now();
            setRealtimeHint("已连接");
            if (online.wsHeartbeatTimer) clearInterval(online.wsHeartbeatTimer);
            online.wsHeartbeatTimer = setInterval(() => {
              if (!online.ws || online.ws.readyState !== WebSocket.OPEN) return;
              online.ws.send(JSON.stringify({ type: "ping", at: Date.now() }));
              if (Date.now() - online.lastWsAt > 15000) {
                setRealtimeHint("连接超时，等待重连");
              }
            }, 5000);
          };

          ws.onmessage = async (event) => {
            online.lastWsAt = Date.now();
            let data = null;
            try {
              data = JSON.parse(event.data);
            } catch (_err) {
              return;
            }

            if (!data || typeof data !== "object") return;

            if (data.type === "presence") {
              online.seats = data.seats || online.seats;
              if (data.packId && data.packId !== selectedPackId) {
                await loadRules(data.packId, true);
              }
              render();
              return;
            }

            if (data.type === "chat_message" && data.message) {
              const merged = [...(online.chat || []), data.message];
              const dedup = [];
              const seen = new Set();
              for (let i = merged.length - 1; i >= 0; i -= 1) {
                const key = merged[i].id || `${merged[i].at}-${merged[i].text}`;
                if (seen.has(key)) continue;
                seen.add(key);
                dedup.unshift(merged[i]);
              }
              online.chat = dedup.slice(-200);
              online.lastChatId = data.message.id || online.lastChatId;
              renderChat();
              return;
            }

            if (data.type === "room_update" || data.type === "welcome") {
              online.seats = data.seats || online.seats;
              if (typeof data.version === "number") {
                online.version = Math.max(online.version, data.version);
              }
              if (data.packId && data.packId !== selectedPackId) {
                await loadRules(data.packId, true);
              }
              if (allowLiveSnapshotApply() && data.snapshot) {
                online.applyingRemote = true;
                applySnapshot(data.snapshot);
                online.applyingRemote = false;
              }
              if (typeof data.integrity === "boolean") {
                online.integrity = data.integrity;
              }
              render();
            }
          };

          ws.onclose = () => {
            online.wsConnected = false;
            setRealtimeHint("已断开，自动重连中");
            if (online.enabled) {
              setTimeout(() => {
                if (online.enabled) connectRoomSocket();
              }, 1200);
            }
          };

          ws.onerror = () => {
            setRealtimeHint("连接异常，回退轮询");
          };
        } catch (_err) {
          setRealtimeHint("浏览器不支持 WebSocket");
        }
      }

      function startPollingRoom() {
        if (online.pollTimer) clearInterval(online.pollTimer);
        online.eventPollCount = 0;
        online.pollTimer = setInterval(async () => {
          try {
            online.eventPollCount += 1;
            const changed = await pullRoomEvents();
            if (!changed && online.eventPollCount % 6 === 0) {
              await pullRoomState();
            }
            await flushOperationQueue();
            if (!online.wsConnected || Date.now() - online.lastWsAt > ROOM_POLL_MS * 2) {
              await pullRoomChat({ incremental: true });
            }
            setRoomHint(
              `联机中 房间 ${online.roomId}｜身份 ${
                online.role === ROLE_RED ? "男方" : online.role === ROLE_BLUE ? "女方" : "观战"
              }｜${onlineReady() ? "双方在线" : "等待对方加入"}｜观战 ${online.seats.spectators || 0} 人`,
            );
            renderChat();
            render();
          } catch (err) {
            setRoomHint(`联机异常：${err.message}`);
          }
        }, ROOM_POLL_MS);
      }

      function stopPollingRoom() {
        if (online.pollTimer) {
          clearInterval(online.pollTimer);
          online.pollTimer = null;
        }
        disconnectRoomSocket();
      }

      async function requestOnlineAction(actionType) {
        if (!online.enabled || online.applyingRemote || !online.roomId || !online.token) return;
        queueOperation(actionType);
        await flushOperationQueue();
      }

      // v2.3 起联机同步改为服务端动作流，这里保留空实现兼容本地逻辑路径。
      async function pushRoomState() {}

      async function createRoom() {
        try {
          const payload = await api("/api/rooms", {
            method: "POST",
            body: {
              snapshot: snapshotGame(),
              password: roomPasswordInput.value || "",
              packId: selectedPackId,
            },
          });

          online.enabled = true;
          online.roomId = payload.roomId;
          online.role = payload.role;
          online.mode = payload.mode || "player";
          online.token = payload.token;
          online.version = payload.version || 0;
          online.seats = payload.seats || { red: true, blue: false, spectators: 0 };
          online.pendingOps = [];
          online.logs = [];
          online.integrity = null;
          online.chat = [];
          online.chatTotal = 0;
          online.lastChatId = "";
          online.spectatorReplayLock = false;
          online.eventPollCount = 0;
          if (payload.packId && payload.packId !== selectedPackId) {
            await loadRules(payload.packId, true);
          }

          roomInput.value = payload.roomId;
          saveRoomSession();
          setRoomQuery(payload.roomId, online.mode);
          renderQr(shortInviteLink(payload.roomId, "player"));
          setRoomHint(`已创建房间 ${payload.roomId}，等待对方加入`);
          connectRoomSocket();
          startPollingRoom();
          await pullRoomLogs();
          await pullRoomChat();
          renderChat();
          render();
        } catch (err) {
          setRoomHint(`创建失败：${err.message}`);
        }
      }

      async function joinRoom(mode = "player") {
        const roomId = sanitizeRoomId(roomInput.value || new URL(window.location.href).searchParams.get("room"));
        if (!roomId) {
          setRoomHint("请输入有效房间号");
          return;
        }

        try {
          const rememberedSession = readRoomSession(roomId);
          const remembered = rememberedSession?.token || "";
          const payload = await api(`/api/rooms/${roomId}/join`, {
            method: "POST",
            body: {
              token: remembered,
              snapshot: snapshotGame(),
              mode,
              password: roomPasswordInput.value || "",
            },
          });

          online.enabled = true;
          online.roomId = roomId;
          online.role = payload.role;
          online.mode = payload.mode || (payload.role === "spectator" ? "spectator" : "player");
          online.token = payload.token;
          online.version = payload.version || 0;
          online.seats = payload.seats || { red: true, blue: true, spectators: 0 };
          online.pendingOps = [];
          online.logs = [];
          online.integrity = null;
          online.chat = [];
          online.chatTotal = 0;
          online.lastChatId = "";
          online.spectatorReplayLock = mode === "spectator";
          online.eventPollCount = 0;
          if (payload.packId && payload.packId !== selectedPackId) {
            await loadRules(payload.packId, true);
          }

          applySnapshot(payload.snapshot);
          roomInput.value = roomId;
          saveRoomSession();
          setRoomQuery(roomId, online.mode);
          renderQr(shortInviteLink(roomId, "player"));
          setRoomHint(
            `已加入房间 ${roomId}，身份 ${
              online.role === ROLE_RED ? "男方" : online.role === ROLE_BLUE ? "女方" : "观战"
            }`,
          );
          connectRoomSocket();
          startPollingRoom();
          await pullRoomLogs();
          await pullRoomChat();
          renderChat();
          render();
        } catch (err) {
          setRoomHint(`加入失败：${err.message}`);
        }
      }

      async function leaveRoom() {
        await replayExit();
        if (!online.enabled || !online.roomId) {
          setRoomHint("当前未在联机房间");
          return;
        }

        const roomId = online.roomId;
        const token = online.token;

        try {
          await api(`/api/rooms/${roomId}/leave`, {
            method: "POST",
            body: { token },
          });
        } catch (_err) {
          // ignore
        }

        clearRoomSession(roomId);
        stopPollingRoom();
        online.enabled = false;
        online.roomId = "";
        online.role = null;
        online.mode = "player";
        online.token = "";
        online.version = 0;
        online.seats = { red: false, blue: false, spectators: 0 };
        online.pendingOps = [];
        online.logs = [];
        online.integrity = null;
        online.chat = [];
        online.chatTotal = 0;
        online.lastChatId = "";
        online.spectatorReplayLock = false;
        online.eventPollCount = 0;
        selectedPackId = packSelect.value || selectedPackId;
        setRoomQuery("");
        setRoomHint("已退出房间，当前为本地模式");
        setRealtimeHint("未连接");
        renderQr("");
        renderChat();
        render();
      }

      async function copyRoomLink() {
        if (!online.roomId) {
          setRoomHint("请先创建或加入房间");
          return;
        }
        try {
          const link = roomLink(online.roomId, "player");
          await copyText(link);
          renderQr(link);
          setRoomHint(`房间链接已复制：${link}`);
        } catch (_err) {
          setRoomHint("复制失败，请手动复制地址栏链接");
        }
      }

      async function copyWatchLink() {
        if (!online.roomId) {
          setRoomHint("请先创建或加入房间");
          return;
        }
        try {
          const link = roomLink(online.roomId, "spectator");
          await copyText(link);
          renderQr(link);
          setRoomHint(`观战链接已复制：${link}`);
        } catch (_err) {
          setRoomHint("复制失败，请手动复制地址栏链接");
        }
      }

      async function copyShortLink(mode = "player") {
        if (!online.roomId) {
          setRoomHint("请先创建或加入房间");
          return;
        }
        try {
          const link = shortInviteLink(online.roomId, mode);
          await copyText(link);
          renderQr(link);
          setRoomHint(`短链已复制：${link}`);
        } catch (_err) {
          setRoomHint("复制短链失败，请稍后重试");
        }
      }

      async function systemShareRoom() {
        if (!online.roomId) {
          setRoomHint("请先创建或加入房间");
          return;
        }
        const link = roomLink(online.roomId, online.role === "spectator" ? "spectator" : "player");
        if (!navigator.share) {
          setRoomHint("当前浏览器不支持系统分享，可使用复制链接");
          return;
        }
        try {
          await navigator.share({
            title: "情侣飞行棋 V2.3（联机）",
            text: "来加入我的房间，一起玩飞行棋。",
            url: link,
          });
        } catch (err) {
          if (!String(err).includes("AbortError")) {
            setRoomHint("系统分享失败，请改用复制链接");
          }
        }
      }

      function checkWin(playerIdx) {
        return players[playerIdx].step === GOAL_STEP;
      }

      async function rollDice() {
        if (online.enabled) {
          if (!canCurrentClientAct()) {
            setMessage("当前不是你的回合，或对方尚未加入。");
            render();
            return;
          }
          await requestOnlineAction("roll");
          await pullRoomLogs();
          render();
          return;
        }

        if (!canCurrentClientAct()) {
          setMessage(online.enabled ? "当前不是你的回合，或对方尚未加入。" : "暂不可操作。");
          render();
          return;
        }

        if (state.gameOver || state.dice !== null) return;

        const playerIdx = state.current;
        const player = players[playerIdx];

        if (player.skip > 0) {
          player.skip -= 1;
          const msg = `${player.name} 本回合休息。`;
          setMessage(msg);
          recordTurn({
            id: state.rollCount + 1,
            at: Date.now(),
            player: player.name,
            dice: 0,
            from: describeStep(player.step),
            to: describeStep(player.step),
            event: "休息回合",
          });
          endTurn(false);
          render();
          await pushRoomState(msg);
          return;
        }

        const dice = Math.floor(Math.random() * 6) + 1;
        state.dice = dice;
        const fromStep = player.step;

        if (!canMove(player, dice)) {
          addDiceHistory(playerIdx, dice, fromStep, fromStep);
          const msg = `${player.name} 掷出 ${dice}，点数无效，回合结束。`;
          setMessage(msg);
          recordTurn({
            id: state.rollCount,
            at: Date.now(),
            player: player.name,
            dice,
            from: describeStep(fromStep),
            to: describeStep(fromStep),
            event: "点数无效",
          });
          endTurn(false);
          render();
          await pushRoomState(msg);
          return;
        }

        player.step = player.step === -1 ? 0 : player.step + dice;
        let message = `${player.name} 掷出 ${dice}，移动到 ${describeStep(player.step)}。`;

        const cap1 = handleCapture(playerIdx);
        if (cap1) message += ` ${cap1}。`;

        if (checkWin(playerIdx)) {
          addDiceHistory(playerIdx, dice, fromStep, player.step);
          state.gameOver = true;
          message += ` ${player.name} 率先抵达终点，获胜！`;
          setMessage(message);
          recordTurn({
            id: state.rollCount,
            at: Date.now(),
            player: player.name,
            dice,
            from: describeStep(fromStep),
            to: describeStep(player.step),
            event: "到达终点并获胜",
          });
          render();
          await pushRoomState(message);
          return;
        }

        let extraTurn = dice === 6;
        let effectText = "";

        if (player.step >= 0 && player.step < PATH_LEN) {
          const cellIdx = toGlobalIndex(playerIdx, player.step);
          const cellText = cells[cellIdx].text;
          const effect = applyCellEffect(playerIdx, cellText);
          effectText = effect.effect;
          state.lastTriggeredCell = {
            player: player.name,
            index: cellIdx,
            text: cellText,
            at: Date.now(),
          };
          message += ` ${effectText}。`;
          extraTurn = extraTurn || effect.extraTurn;

          const cap2 = handleCapture(playerIdx);
          if (cap2) message += ` ${cap2}。`;
        }

        addDiceHistory(playerIdx, dice, fromStep, player.step);

        if (checkWin(playerIdx)) {
          state.gameOver = true;
          message += ` ${player.name} 率先抵达终点，获胜！`;
        }

        setMessage(message);

        recordTurn({
          id: state.rollCount,
          at: Date.now(),
          player: player.name,
          dice,
          from: describeStep(fromStep),
          to: describeStep(player.step),
          event: effectText || (extraTurn ? "额外回合" : "正常移动"),
        });

        if (!state.gameOver) {
          endTurn(extraTurn);
        }

        render();
        await pushRoomState(message);
      }

      async function restartGame() {
        await replayExit();
        if (online.enabled) {
          if (!canCurrentClientAct()) {
            setMessage("联机模式下请等待你的回合后再重开。");
            render();
            return;
          }
          await requestOnlineAction("restart");
          await pullRoomLogs();
          render();
          return;
        }

        players.forEach((p) => {
          p.step = -1;
          p.skip = 0;
        });

        state.current = 0;
        state.dice = null;
        state.lastRoll = null;
        state.gameOver = false;
        state.message = "点击掷骰子开始。";
        state.diceHistory = [];
        state.rollCount = 0;
        state.turnHistory = [];
        state.selectedCellIndex = null;
        state.lastTriggeredCell = null;

        render();
        await pushRoomState("重开对局");
      }

      function renderPositionCard(playerIdx, posEl, cellEl, progressEl) {
        const p = players[playerIdx];
        const remain = p.step < 0 ? GOAL_STEP : Math.max(0, GOAL_STEP - p.step);
        posEl.textContent = `位置：${describeStep(p.step)}｜距终点 ${remain} 步`;

        const cell = getCellByStep(playerIdx, p.step);
        if (!cell) {
          cellEl.textContent = p.step === GOAL_STEP ? "当前格：已到终点" : "当前格：未起飞（掷到6起飞）";
        } else {
          cellEl.textContent = `当前格：${cell.cell.text}`;
        }

        progressEl.style.width = `${getProgress(p.step).toFixed(1)}%`;
      }

      function renderDiceRow(playerIdx, rowEl, cls) {
        rowEl.innerHTML = "";
        const list = state.diceHistory.filter((h) => h.playerIdx === playerIdx).slice(0, 20);
        if (!list.length) {
          const s = document.createElement("span");
          s.className = `chip ${cls}`;
          s.textContent = "暂无";
          rowEl.appendChild(s);
          return;
        }

        list.forEach((h) => {
          const chip = document.createElement("span");
          chip.className = `chip ${cls}`;
          chip.textContent = `#${h.id}:${h.dice}`;
          chip.title = `从 ${describeStep(h.fromStep)} 到 ${describeStep(h.toStep)}`;
          rowEl.appendChild(chip);
        });
      }

      function renderDetail() {
        const activeIdx = state.current;
        const activeCell = getCellByStep(activeIdx, players[activeIdx].step);
        const selectedIdx = state.selectedCellIndex;

        if (Number.isInteger(selectedIdx)) {
          cellDetailTitle.textContent = `格子 #${selectedIdx + 1}｜${cells[selectedIdx].short}`;
          cellDetailBody.textContent = cells[selectedIdx].text;
        } else if (activeCell) {
          cellDetailTitle.textContent = `当前回合格子 #${activeCell.idx + 1}`;
          cellDetailBody.textContent = activeCell.cell.text;
        } else {
          cellDetailTitle.textContent = "未选择格子";
          cellDetailBody.textContent = "点击棋盘格子可查看完整文案。";
        }

        if (state.lastTriggeredCell) {
          lastTriggerText.textContent = `最近触发：${state.lastTriggeredCell.player} 在 #${
            state.lastTriggeredCell.index + 1
          } 触发“${state.lastTriggeredCell.text}”`; 
        } else {
          lastTriggerText.textContent = "最近触发：暂无";
        }
      }

      function renderTimeline() {
        timelineList.innerHTML = "";
        const filter = timelineFilterSelect.value || "all";
        const filtered = state.turnHistory
          .filter((t) => {
            if (filter === "all") return true;
            if (filter === "超时") return String(t.event || "").includes("超时");
            return t.player === filter;
          })
          .slice(0, 60);

        if (!filtered.length) {
          const li = document.createElement("li");
          li.textContent = "暂无回合记录（当前筛选无结果）";
          timelineList.appendChild(li);
          return;
        }

        filtered.forEach((t) => {
          const li = document.createElement("li");
          const sig = t.signature ? `｜sig ${String(t.signature).slice(0, 10)}` : "";
          const eventClass = classifyTimelineEvent(t.event || "");
          if (eventClass.isCritical) li.classList.add("critical");
          if (eventClass.isTimeout) li.classList.add("timeout");
          li.textContent = `${formatTime(t.at)}｜${t.player}｜点数 ${t.dice}｜${t.from} → ${t.to}｜${t.event}${sig}`;
          timelineList.appendChild(li);
        });
      }

      function enterReplayByCursor(cursor) {
        if (cursor < 0 || cursor >= state.turnHistory.length) return;
        const item = state.turnHistory[cursor];
        if (!item || !item.snapshot) return;

        if (!state.replayMode) {
          state.replayBackup = snapshotGame();
        }
        if (state.turnTickTimer) {
          clearInterval(state.turnTickTimer);
          state.turnTickTimer = null;
        }
        state.replayMode = true;
        state.replayCursor = cursor;
        applySnapshot(item.snapshot);
        setMessage(`回放中：第 ${item.id || cursor + 1} 手`);
        render();
      }

      function replayPrev() {
        if (!state.turnHistory.length) return;
        if (!state.replayMode) {
          enterReplayByCursor(0);
          return;
        }
        const nextCursor = Math.min(state.turnHistory.length - 1, state.replayCursor + 1);
        enterReplayByCursor(nextCursor);
      }

      function replayNext() {
        if (!state.replayMode) return;
        const nextCursor = Math.max(0, state.replayCursor - 1);
        enterReplayByCursor(nextCursor);
      }

      async function replayExit() {
        if (!state.replayMode) return;
        if (state.replayBackup) {
          applySnapshot(state.replayBackup);
        }
        state.replayMode = false;
        state.replayCursor = -1;
        state.replayBackup = null;
        if (online.enabled && !(online.role === "spectator" && online.spectatorReplayLock)) {
          try {
            await pullRoomState();
            await pullRoomLogs();
          } catch (_err) {
            // ignore
          }
        }
        state.lastTurnRole = null;
        resetTurnTimer();
        render();
      }

      async function toggleSpectatorReplayLock() {
        if (!online.enabled || online.role !== "spectator") {
          setRoomHint("仅观战身份可开启只读回放");
          return;
        }
        online.spectatorReplayLock = !online.spectatorReplayLock;
        if (online.spectatorReplayLock) {
          if (!state.turnHistory.length) {
            await pullRoomLogs();
          }
          if (state.turnHistory.length) {
            enterReplayByCursor(0);
          }
          setRoomHint("观战只读回放已开启，实时更新不会覆盖当前回放视图");
        } else {
          await replayExit();
          setRoomHint("已退出只读回放，恢复实时观战");
        }
        render();
      }

      function renderStatus() {
        if (state.gameOver && state.turnTickTimer) {
          clearInterval(state.turnTickTimer);
          state.turnTickTimer = null;
        }
        const turnName = players[state.current].name;
        turnText.textContent = state.gameOver ? "状态：游戏结束" : `当前回合：${turnName}`;
        diceText.textContent = state.lastRoll
          ? `上一掷：${players[state.lastRoll.playerIdx].name} 掷出 ${state.lastRoll.dice}`
          : "上一掷：-";
        msgText.textContent = `提示：${state.message}`;

        const seatState = online.enabled
          ? `座位：男方 ${online.seats.red ? "已占" : "空位"}｜女方 ${online.seats.blue ? "已占" : "空位"}｜观战 ${
              online.seats.spectators || 0
            }｜队列 ${online.pendingOps.length}｜通道 ${online.wsConnected ? "WS" : "轮询"}｜文案包 ${selectedPackId}${
              online.role === "spectator" ? `｜只读回放 ${online.spectatorReplayLock ? "开" : "关"}` : ""
            }`
          : "座位：本地模式";
        seatText.textContent = seatState;

        const remainMs = Math.max(0, state.turnDeadlineAt - Date.now());
        const remainSec = Math.ceil(remainMs / 1000);
        countdownText.textContent = state.gameOver
          ? "倒计时：-"
          : online.enabled && !onlineReady()
            ? "回合倒计时：等待双方就位"
            : `回合倒计时：${remainSec}s（超时自动跳过）`;
        const ratio =
          online.enabled && !onlineReady() ? 1 : Math.max(0, Math.min(1, remainMs / (TURN_TIMEOUT_SEC * 1000)));
        countdownBar.style.transform = `scaleX(${ratio || 0.001})`;

        renderPositionCard(0, redPosText, redCellText, redProgress);
        renderPositionCard(1, bluePosText, blueCellText, blueProgress);
        renderDiceRow(0, redDiceRow, "red");
        renderDiceRow(1, blueDiceRow, "blue");
        renderDetail();
        renderTimeline();

        if (online.enabled) {
          integrityBadge.textContent =
            online.integrity == null ? "日志签名：待校验" : online.integrity ? "日志签名：已验证" : "日志签名：校验失败";
          integrityBadge.className = `pill ${online.integrity ? "ok" : "warn"}`;
        } else {
          integrityBadge.textContent = "日志签名：本地模式";
          integrityBadge.className = "pill warn";
        }

        replayStatusText.textContent = state.replayMode
          ? `回放：第 ${state.turnHistory[state.replayCursor]?.id || state.replayCursor + 1} 手`
          : "回放：关闭";
        replayRange.max = String(Math.max(0, state.turnHistory.length - 1));
        replayRange.value = String(state.replayMode ? state.replayCursor : 0);
        replayPrevBtn.disabled = state.turnHistory.length === 0;
        replayNextBtn.disabled = !state.replayMode || state.replayCursor <= 0;
        replayExitBtn.disabled = !state.replayMode;
        spectatorReplayBtn.disabled = !(online.enabled && online.role === "spectator");
        spectatorReplayBtn.textContent =
          online.role === "spectator"
            ? `观战只读回放：${online.spectatorReplayLock ? "开" : "关"}`
            : "观战只读回放：仅观战可用";
        applyPackBtn.disabled = online.enabled && online.role === "spectator";
        chatSendBtn.disabled = !online.enabled;
        enableNotifyBtn.textContent = state.notifyEnabled ? "提醒已开启" : "开启到你提醒";

        rollBtn.disabled = state.gameOver || state.dice !== null || !canCurrentClientAct();
        restartBtn.disabled = online.enabled && !canCurrentClientAct();
      }

      function render() {
        syncCanvasResolution();
        drawBoard();
        drawTokens();
        renderStatus();
        maybeTurnNotify();
      }

      function pickCellByCanvasPoint(clientX, clientY) {
        const rect = board.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        const x = ((clientX - rect.left) / rect.width) * SIZE;
        const y = ((clientY - rect.top) / rect.height) * SIZE;

        let picked = null;
        let minDist = Number.POSITIVE_INFINITY;
        pathPoints.forEach((p, idx) => {
          const dist = Math.hypot(x - p.x, y - p.y);
          if (dist <= CELL_SIZE * 0.62 && dist < minDist) {
            minDist = dist;
            picked = idx;
          }
        });

        return picked;
      }

      function exportBoardImage() {
        const link = document.createElement("a");
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        link.href = board.toDataURL("image/png");
        link.download = `flight-chess-board-${ts}.png`;
        link.click();
      }

      function exportMatchReportImage() {
        const w = 1280;
        const h = 720;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const g = c.getContext("2d");
        g.fillStyle = "#f8f5ec";
        g.fillRect(0, 0, w, h);

        g.fillStyle = "#b91c1c";
        g.font = "bold 48px 'Avenir Next', 'PingFang SC', sans-serif";
        g.fillText("情侣飞行棋 V2.3 战报", 40, 72);

        g.fillStyle = "#334155";
        g.font = "24px 'Avenir Next', 'PingFang SC', sans-serif";
        g.fillText(`房间：${online.roomId || "本地模式"}  文案包：${selectedPackId}`, 40, 120);
        g.fillText(`总回合：${state.rollCount}  状态：${state.gameOver ? "已结束" : "进行中"}`, 40, 156);

        const left = 40;
        const top = 200;
        const lineH = 34;
        players.forEach((p, idx) => {
          const remain = p.step < 0 ? GOAL_STEP : Math.max(0, GOAL_STEP - p.step);
          g.fillStyle = idx === 0 ? "#dc2626" : "#2563eb";
          g.font = "bold 28px 'Avenir Next', 'PingFang SC', sans-serif";
          g.fillText(`${p.name}: ${describeStep(p.step)}（距终点 ${remain}）`, left, top + idx * lineH * 1.6);
        });

        g.fillStyle = "#0f172a";
        g.font = "bold 22px 'Avenir Next', 'PingFang SC', sans-serif";
        g.fillText("关键回合（最近 6 条）", 40, 350);
        g.font = "18px 'Avenir Next', 'PingFang SC', sans-serif";
        const rows = state.turnHistory.slice(0, 6);
        rows.forEach((t, i) => {
          g.fillText(
            `${i + 1}. ${formatTime(t.at)} ${t.player} 点数${t.dice} ${t.event}`,
            40,
            390 + i * 38,
          );
        });

        g.drawImage(board, 860, 60, 360, 360);

        const link = document.createElement("a");
        link.href = c.toDataURL("image/png");
        link.download = `flight-chess-report-${Date.now()}.png`;
        link.click();
      }

      async function exportTimelineText() {
        const header = [
          `情侣飞行棋 V2.3 复盘`,
          `时间：${new Date().toLocaleString()}`,
          `房间：${online.enabled ? online.roomId : "本地模式"}`,
          "",
        ];

        const lines = state.turnHistory.map(
          (t) =>
            `${formatTime(t.at)} | ${t.player} | 点数 ${t.dice} | ${t.from} -> ${t.to} | ${t.event} | sig:${String(
              t.signature || "",
            ).slice(0, 16)}`,
        );

        const content = [...header, ...lines].join("\n");

        try {
          await copyText(content);
          setMessage("复盘文本已复制到剪贴板。");
        } catch (_err) {
          // ignore clipboard failure
        }

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `flight-chess-replay-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        render();
      }

      async function loadVersionInfo() {
        try {
          const v = await api("/api/version");
          online.deployInfo = v;
          const apiHost = new URL(API_BASE_ORIGIN).host;
          versionText.textContent = `版本：${APP_VERSION}｜部署：${v.deployedAt || "-"}｜存储：${v.storeMode || "unknown"}｜服务：${apiHost}`;
        } catch (_err) {
          versionText.textContent = `版本：${APP_VERSION}｜部署：未知｜服务：${new URL(API_BASE_ORIGIN).host}`;
        }
      }

      function getCustomCellsText() {
        return (rulesConfig?.cells || []).map((v) => String(v || "")).join("\n");
      }

      function loadCurrentPackToEditor() {
        customPackTitleInput.value = String(rulesConfig?.title || "情侣飞行棋 自定义版");
        customPackSubtitleInput.value = String(rulesConfig?.subtitle || "联机双人版");
        customPackCellsInput.value = getCustomCellsText();
        setRoomHint("已载入当前文案到编辑器");
      }

      function buildCustomPackPayload() {
        const cells = String(customPackCellsInput.value || "")
          .split(/\r?\n/)
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
        if (cells.length !== PATH_LEN) {
          throw new Error(`文案行数必须为 ${PATH_LEN} 行，当前 ${cells.length} 行`);
        }
        return {
          version: `custom-${Date.now()}`,
          title: String(customPackTitleInput.value || "情侣飞行棋 自定义版").slice(0, 40),
          subtitle: String(customPackSubtitleInput.value || "联机双人版").slice(0, 40),
          boardRules: Array.isArray(rulesConfig?.boardRules) ? rulesConfig.boardRules : fallbackRules.boardRules,
          wheelLabels: Array.isArray(rulesConfig?.wheelLabels) ? rulesConfig.wheelLabels : fallbackRules.wheelLabels,
          cells,
        };
      }

      async function loadContentPacks() {
        try {
          const payload = await api("/api/content-packs");
          const packs = Array.isArray(payload.packs) ? payload.packs : [];
          contentPacks = [...packs, { id: "custom", name: "自定义文案包", description: "手动编辑 44 格并同步" }];
          const defaultPack = payload.defaultPackId || "classic";
          packSelect.innerHTML = "";
          contentPacks.forEach((pack) => {
            const opt = document.createElement("option");
            opt.value = pack.id;
            opt.textContent = `${pack.name}（${pack.id}）`;
            packSelect.appendChild(opt);
          });
          if (!packs.find((p) => p.id === selectedPackId)) {
            selectedPackId = defaultPack;
          }
          packSelect.value = selectedPackId;
        } catch (_err) {
          contentPacks = [{ id: "classic", name: "情侣飞行棋（原版）" }];
          packSelect.innerHTML = '<option value="classic">情侣飞行棋（原版）</option>';
          selectedPackId = "classic";
        }
      }

      async function loadRules(packId = selectedPackId, preferRoom = false) {
        try {
          const remote =
            preferRoom && online.enabled && online.roomId
              ? await api(`/api/rooms/${online.roomId}/rules`)
              : await api(`/api/rules?pack=${encodeURIComponent(packId || "classic")}`);
          if (remote && Array.isArray(remote.cells) && remote.cells.length === PATH_LEN) {
            rulesConfig = remote;
            cells = buildCells(remote.cells);
            selectedPackId = remote.packId || packId || selectedPackId;
            packSelect.value = selectedPackId;
            if (!customPackCellsInput.value.trim()) {
              loadCurrentPackToEditor();
            }
          }
        } catch (_err) {
          rulesConfig = fallbackRules;
          cells = buildCells(fallbackRules.cells);
        }
      }

      async function applyCustomPack() {
        let config;
        try {
          config = buildCustomPackPayload();
        } catch (err) {
          setRoomHint(err.message);
          return;
        }

        if (!online.enabled) {
          rulesConfig = { ...config, packId: "custom-local" };
          selectedPackId = "custom-local";
          cells = buildCells(config.cells);
          setRoomHint("已应用本地自定义文案包");
          render();
          return;
        }

        if (online.role === "spectator") {
          setRoomHint("观战身份不能修改文案包");
          return;
        }

        try {
          const payload = await api(`/api/rooms/${online.roomId}/custom-pack`, {
            method: "POST",
            body: {
              token: online.token,
              config,
            },
          });
          if (typeof payload.version === "number") {
            online.version = payload.version;
          }
          await loadRules("custom", true);
          if (payload.snapshot && !state.replayMode) {
            applySnapshot(payload.snapshot);
          }
          await pullRoomLogs();
          setRoomHint(payload.summary || "自定义文案包已同步");
          render();
        } catch (err) {
          setRoomHint(`自定义文案包保存失败：${err.message}`);
        }
      }

      async function applyPackChange() {
        const targetPack = String(packSelect.value || "").trim() || selectedPackId;
        if (!targetPack) return;
        if (targetPack === "custom") {
          await applyCustomPack();
          return;
        }

        if (!online.enabled) {
          await loadRules(targetPack);
          setRoomHint(`已切换本地文案包：${targetPack}`);
          render();
          return;
        }

        if (online.role === "spectator") {
          setRoomHint("观战身份不能切换文案包");
          packSelect.value = selectedPackId;
          return;
        }

        try {
          const payload = await api(`/api/rooms/${online.roomId}/content-pack`, {
            method: "POST",
            body: {
              token: online.token,
              packId: targetPack,
            },
          });
          if (payload.packId) {
            await loadRules(payload.packId, true);
          }
          if (payload.snapshot && !state.replayMode) {
            applySnapshot(payload.snapshot);
          }
          if (typeof payload.version === "number") {
            online.version = payload.version;
          }
          if (payload.seats) {
            online.seats = payload.seats;
          }
          if (typeof payload.integrity === "boolean") {
            online.integrity = payload.integrity;
          }
          await pullRoomLogs();
          setRoomHint(payload.summary || `文案包已切换为 ${targetPack}`);
          render();
        } catch (err) {
          packSelect.value = selectedPackId;
          setRoomHint(`切换失败：${err.message}`);
        }
      }

      function registerServiceWorker() {
        if (!("serviceWorker" in navigator)) return;
        const canRegister =
          window.location.protocol === "https:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";
        if (!canRegister) return;
        navigator.serviceWorker.register("/service-worker.js").catch(() => {
          // ignore registration errors
        });
      }

      function reportClientError(name, message, stack = "") {
        fetch("/api/client-error", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name,
            message,
            stack,
            roomId: online.roomId || "",
          }),
        }).catch(() => {});
      }

      function applyInitialRoomFromUrl() {
        const url = new URL(window.location.href);
        const room = sanitizeRoomId(url.searchParams.get("room"));
        const mode = url.searchParams.get("mode") === "spectator" ? "spectator" : "player";
        if (room) {
          roomInput.value = room;
          autoJoinMode = mode;
          const session = readRoomSession(room);
          if (session?.token) {
            setRoomHint(`检测到房间 ${room}，正在尝试自动重连...`);
          } else {
            setRoomHint(`检测到房间号 ${room}，点击“${mode === "spectator" ? "观战加入" : "加入房间"}”即可联机。`);
          }
        }
      }

      board.addEventListener("click", (e) => {
        const idx = pickCellByCanvasPoint(e.clientX, e.clientY);
        state.selectedCellIndex = idx;
        if (isMobileViewport()) {
          setDrawerOpen(false);
        }
        renderStatus();
      });

      document.addEventListener("click", (e) => {
        if (!isMobileViewport()) return;
        if (!document.body.classList.contains("drawer-open")) return;
        const target = e.target;
        if (sidePanel?.contains(target) || toggleDrawerBtn?.contains(target)) return;
        setDrawerOpen(false);
      });

      window.addEventListener("resize", () => {
        if (!isMobileViewport()) {
          setDrawerOpen(false);
        }
        syncDrawerUI();
        render();
      });
      window.addEventListener("online", () => setRoomHint("网络已恢复。"));
      window.addEventListener("offline", () => setRoomHint("当前网络离线，联机同步将暂停。"));
      window.addEventListener("error", (e) => {
        reportClientError("window.error", e.message || "unknown", e.error?.stack || "");
      });
      window.addEventListener("unhandledrejection", (e) => {
        reportClientError("unhandledrejection", String(e.reason || "unknown"), e.reason?.stack || "");
      });

      rollBtn.addEventListener("click", rollDice);
      restartBtn.addEventListener("click", restartGame);
      exportImageBtn.addEventListener("click", exportBoardImage);
      exportTextBtn.addEventListener("click", exportTimelineText);
      exportReportBtn.addEventListener("click", exportMatchReportImage);
      enableNotifyBtn.addEventListener("click", enableTurnNotification);

      createRoomBtn.addEventListener("click", async () => {
        if (online.enabled) {
          setRoomHint("已在房间中，先退出再创建。");
          return;
        }
        roomInput.value = sanitizeRoomId(roomInput.value) || makeId();
        await createRoom();
      });

      joinRoomBtn.addEventListener("click", async () => {
        if (online.enabled) {
          setRoomHint("已在房间中，先退出再加入新房间。");
          return;
        }
        roomInput.value = sanitizeRoomId(roomInput.value);
        await joinRoom("player");
      });

      joinWatchBtn.addEventListener("click", async () => {
        if (online.enabled) {
          setRoomHint("已在房间中，先退出再加入新房间。");
          return;
        }
        roomInput.value = sanitizeRoomId(roomInput.value);
        await joinRoom("spectator");
      });

      leaveRoomBtn.addEventListener("click", leaveRoom);
      copyRoomLinkBtn.addEventListener("click", copyRoomLink);
      copyWatchLinkBtn.addEventListener("click", copyWatchLink);
      copyShortLinkBtn.addEventListener("click", () => copyShortLink("player"));
      shareRoomBtn.addEventListener("click", systemShareRoom);
      packSelect.addEventListener("change", async () => {
        if (!online.enabled) {
          const target = packSelect.value || "classic";
          if (target === "custom") {
            setRoomHint("点击“应用自定义文案包”后生效");
            return;
          }
          await loadRules(target);
          render();
        }
      });
      applyPackBtn.addEventListener("click", applyPackChange);
      loadCurrentPackBtn.addEventListener("click", loadCurrentPackToEditor);
      applyCustomPackBtn.addEventListener("click", applyCustomPack);
      timelineFilterSelect.addEventListener("change", renderStatus);
      replayRange.addEventListener("input", (e) => {
        const v = Number(e.target.value || 0);
        if (!Number.isInteger(v) || v < 0) return;
        enterReplayByCursor(v);
      });
      chatSendBtn.addEventListener("click", () => {
        sendChat(chatInput.value);
      });
      chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          sendChat(chatInput.value);
        }
      });
      document.querySelectorAll("[data-emoji]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const emoji = btn.getAttribute("data-emoji") || "";
          if (!emoji) return;
          if (!chatInput.value.trim()) {
            chatInput.value = emoji;
          } else {
            chatInput.value = `${chatInput.value} ${emoji}`;
          }
          sendChat(chatInput.value);
        });
      });
      replayPrevBtn.addEventListener("click", replayPrev);
      replayNextBtn.addEventListener("click", replayNext);
      replayExitBtn.addEventListener("click", () => {
        replayExit();
      });
      spectatorReplayBtn.addEventListener("click", toggleSpectatorReplayLock);
      toggleDrawerBtn.addEventListener("click", toggleDrawer);
      boardFullscreenBtn.addEventListener("click", toggleBoardFullscreen);
      document.addEventListener("fullscreenchange", () => {
        boardFullscreenBtn.textContent = document.fullscreenElement ? "退出全屏" : "全屏棋盘";
      });

      langSelect.addEventListener("change", () => {
        state.lang = langSelect.value || "zh-CN";
        if (state.lang === "en-US") {
          reconnectHint.textContent = "Reconnect: resume your seat within 30 minutes";
          roomStatus.textContent = `Status: ${roomStatus.textContent.replace(/^状态：/, "")}`;
          realtimeStatus.textContent = `Realtime: ${realtimeStatus.textContent.replace(/^实时通道：/, "")}`;
        } else {
          reconnectHint.textContent = "断线重连：30 分钟内可自动恢复到原座位";
          if (!roomStatus.textContent.startsWith("状态：")) {
            roomStatus.textContent = `状态：${roomStatus.textContent.replace(/^Status:\s*/, "")}`;
          }
          if (!realtimeStatus.textContent.startsWith("实时通道：")) {
            realtimeStatus.textContent = `实时通道：${realtimeStatus.textContent.replace(/^Realtime:\s*/, "")}`;
          }
        }
      });
      boardZoomRange.addEventListener("input", () => {
        applyBoardZoom(boardZoomRange.value);
        render();
      });

      (async function bootstrap() {
        initBoardZoom();
        syncDrawerUI();
        applyInitialRoomFromUrl();
        if (API_BASE_ORIGIN !== window.location.origin) {
          setRoomHint(`已自动切换联机服务：${new URL(API_BASE_ORIGIN).host}`);
        }
        setRealtimeHint("未连接");
        await loadContentPacks();
        await loadRules(selectedPackId);
        loadCurrentPackToEditor();
        render();
        renderChat();
        await loadVersionInfo();
        registerServiceWorker();
        const room = sanitizeRoomId(new URL(window.location.href).searchParams.get("room"));
        if (room) {
          const session = readRoomSession(room);
          if (session?.token) {
            roomInput.value = room;
            await joinRoom(autoJoinMode || session.mode || "player");
          }
        }
      })();

      window.render_game_to_text = () =>
        JSON.stringify({
          coordinate: "origin:top-left,x:right,y:down",
          players: players.map((p) => ({ name: p.name, step: p.step, skip: p.skip })),
          game: {
            current: state.current,
            gameOver: state.gameOver,
            message: state.message,
            rollCount: state.rollCount,
            diceHistory: state.diceHistory.slice(0, 8),
          },
          online: {
            enabled: online.enabled,
            roomId: online.roomId,
            role: online.role,
            wsConnected: online.wsConnected,
            version: online.version,
            packId: selectedPackId,
            chatCount: online.chatTotal || online.chat.length,
            lang: state.lang,
            spectatorReplayLock: online.spectatorReplayLock,
          },
          timer: {
            remainMs: Math.max(0, state.turnDeadlineAt - Date.now()),
            timeoutSec: TURN_TIMEOUT_SEC,
          },
          ui: {
            drawerOpen: document.body.classList.contains("drawer-open"),
          },
        });

      window.advanceTime = (_ms = 0) => {
        render();
      };
    
