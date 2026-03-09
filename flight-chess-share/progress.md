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
