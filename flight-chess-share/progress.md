Original prompt: 都做

## 2026-03-08 progress
- 升级后端到 v2.2：新增 WebSocket `/ws`、服务端动作接口 `/api/rooms/:id/action`（roll/restart）、内容包接口、`/api/healthz`、`/api/metrics`。
- 增加内容包体系：`classic` + `lite`，新增 `rules-lite.json`。
- 前端改造进行中：已接入 WebSocket 连接、房间页新增文案包选择与切换按钮、联机动作改为走服务端 action。
- 新增 PWA 基础文件：`manifest.webmanifest`、`service-worker.js`。
- 新增自动化冒烟测试：`tests/smoke.mjs`。

## TODO
- 完成前端收尾并修正潜在 JS 报错（联机动作与回放、文案包切换、房间退出状态）。
- 跑完整本地测试（语法+smoke+浏览器可视回归）。
- 更新 README 说明 v2.2 新能力。
- 提交、推送并触发 Render 部署，验证线上可用。

## 2026-03-08 validation updates
- 已完成 `npm test`（`tests/smoke.mjs`）并通过：覆盖内容包、创建/加入房间、WebSocket welcome、权威动作、日志完整性、健康检查。
- 使用 `develop-web-game` Playwright 客户端进行了页面渲染检查，生成了 `output/web-game-flight/shot-0.png`、`shot-1.png` 与对应 text state。
- 发现 Node 24 + 依赖冷启动慢（约 20-35 秒），测试脚本已改为更鲁棒的等待策略与无 pipe 启动，避免误判失败。

## 2026-03-09 startup optimization
- 后端从 Express 迁移到原生 Node HTTP 路由，保留全部 API/WS 协议不变。
- 冷启动从约 20-35 秒降到约 1 秒（本地 `healthz` 实测）。
- 重新执行 `npm test`（smoke）通过。
- 重新执行 Playwright 可视回归并检查截图：`output/web-game-flight-v22/shot-1.png`。

## 2026-03-09 v2.3 feature pass
- 前端清晰度增强：新增棋盘缩放滑杆（80%-130%），默认读取本地缓存；棋盘格文案缩略策略改为保留更多语义，提升可读性。
- 视觉输出升级：版本统一到 v2.3（页面标题、OG、manifest、导出复盘标题）。
- 新增运维脚本：`scripts/backup-redis-rooms.mjs`，支持按 Redis 前缀导出房间快照 JSON 备份。
- 新增 CI：仓库根目录 `.github/workflows/flight-chess-ci.yml`，在 `flight-chess-share/**` 变更时自动跑语法检查 + `test:all`。
- 稳定性增强：WebSocket 连接和心跳会刷新会话有效期，降低长局误判离线丢座位的概率。
- 修复回归：`tests/dual-clients.mjs` 监听时机竞态导致的偶发超时已修复。

## TODO
- 推送到远端后观察 Render 新版本启动日志，确认线上 `v2.3.0` 与 `/api/version` 一致。
- 在线上房间实测一次：短链、二维码、聊天、超时自动跳过、自定义文案包同步。

## 2026-03-09 validation
- `node --check server.js` 通过。
- `npm run test:all` 通过（smoke + dual clients）。
- Playwright 可视检查：`output/web-game-v23-local/shot-0.png`，棋盘主标题已更新为 `V2.3`。

## 2026-03-09 domain switch
- 旧域名 `flight-chess-share-fei.onrender.com` 页面已支持自动切换到主后端 `flight-chess-room-v2.onrender.com`（API + WS）。
- 后端新增 CORS 与 OPTIONS 预检支持，允许旧域名前端跨域访问房间 API。
- `dual-clients` 测试补充节流等待，避免偶发触发操作频率限制。
