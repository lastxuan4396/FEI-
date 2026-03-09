# 情侣飞行棋 V2.3（联机增强版）

入口文件：`index.html`  
前端脚本：`app/main.js`  
前端样式：`styles/main.css`  
后端服务：`server.js`（房间同步 + WebSocket + 权威动作 API）  
Render 配置：`render.yaml`  
一键推送脚本：`deploy-github-render.sh`

## 能力

- 双人联机房间（创建 / 加入 / 退出 / 观战）
- WebSocket 实时同步（断开自动重连，轮询兜底）
- 增量同步（`/events?afterVersion=`）降低轮询开销
- 服务端权威动作（`roll` / `restart` / `timeout_skip`）
- 房间聊天（HTTP + WS 广播，支持 `afterId` 增量拉取）
- 会话续期与断线恢复（默认 30 分钟）
- 两个角色实时位置、进度条、回合倒计时
- 历史点数、回合时间线、回放滑杆与筛选
- 关键事件高亮（超时/返回起点/抵达终点等）
- 观战只读回放模式（实时更新不覆盖当前回放视图）
- 移动端抽屉面板 + 棋盘全屏按钮
- 棋盘/复盘/战报图片导出
- 分享链接、短链（`/i/:room`）与二维码
- 内容包切换（`classic` / `lite` / `custom`）
- 自定义文案包编辑器（44 格在线同步）
- 日志签名校验（链路完整性）
- 客户端错误上报与服务端最近错误查看
- Redis 持久化（`REDIS_URL` 配置后启用）
- 健康检查与监控指标（`/api/healthz`、`/api/metrics`）

## 接口速览

- `GET /api/content-packs`：内容包列表
- `GET /api/rules?pack=classic|lite`：读取全局规则
- `GET /api/rooms/:id/state`：房间状态（需 token）
- `GET /api/rooms/:id/events?afterVersion=12`：增量事件流（需 token）
- `GET /api/rooms/:id/rules`：房间规则（需 token）
- `POST /api/rooms/:id/action`：联机动作（`roll` / `restart` / `timeout_skip`）
- `POST /api/rooms/:id/content-pack`：切换预置文案包
- `POST /api/rooms/:id/custom-pack`：上传自定义文案包
- `GET/POST /api/rooms/:id/chat`：房间聊天（需 token，GET 支持 `afterId`）
- `GET /api/rooms/:id/logs`：签名日志（需 token）
- `POST /api/client-error`：客户端错误上报
- `GET /api/errors`：最近错误列表
- `WS /ws?room=<id>&token=<token>`：实时状态/聊天推送
- `GET /i/:room`：短链跳转到房间

## 本地运行

```bash
cd /Users/xiaoxuan/Documents/Playground/flight-chess-share
npm install
npm start
```

打开：`http://localhost:10000`

## 测试

```bash
cd /Users/xiaoxuan/Documents/Playground/flight-chess-share
npm run test:all
```

## 运维脚本

```bash
cd /Users/xiaoxuan/Documents/Playground/flight-chess-share
npm run verify:logs -- --base https://your-domain --room ABC123 --token <room-token>
npm run backup:redis -- --url redis://localhost:6379 --prefix flightchess
npm run monitor:check -- --base https://your-domain
npm run security:scan
```

### 可选环境变量

- `REDIS_URL`：Redis 连接地址（用于房间持久化）
- `REDIS_PREFIX`：Redis key 前缀（默认 `flightchess`）
- `LOG_SIGNING_SECRET`：日志签名密钥（不设则启动时随机生成）
- `APP_VERSION`：覆盖页面展示版本号
- `DEFAULT_RULE_PACK`：默认内容包（`classic` 或 `lite`）
- `SESSION_TTL_MS`：会话续期时长（毫秒，默认 30 分钟）
- `CORS_ALLOW_ORIGINS`：逗号分隔白名单域名
- `CORS_ALLOW_ALL=1`：开发调试时放开跨域（生产不建议）

## GitHub + Render

```bash
cd /Users/xiaoxuan/Documents/Playground/flight-chess-share
./deploy-github-render.sh https://github.com/<你的账号>/<你的仓库>.git main
```

然后在 Render：
1. `New +` -> `Blueprint`
2. 选择该仓库并应用 `render.yaml`
3. `render.yaml` 会同时创建 Redis 并把 `REDIS_URL` 注入 web 服务
4. 部署完成后分享 `onrender.com` 链接

### 域名切换说明

- 主服务建议使用：`https://flight-chess-room-v2.onrender.com`
- 如果从旧域名 `https://flight-chess-share-fei.onrender.com` 打开页面，前端会自动把 API/WS 切换到主服务域名。

## CI

仓库根目录新增 GitHub Actions：`.github/workflows/flight-chess-ci.yml`  
当 `flight-chess-share/**` 变更时自动执行：

1. `npm ci`
2. `node --check server.js`
3. `npm run test:all`
4. `npm run security:scan`

监控工作流：`.github/workflows/flight-chess-monitor.yml`（每 30 分钟）  
通过仓库 Secrets 提供 `FLIGHT_CHESS_BASE_URL`，超阈值时会让 workflow 失败用于告警集成。

## 安全

- 如曾暴露任何 GitHub/Render/API token，请先撤销并重建，再继续部署。
- 参考 [SECURITY.md](./SECURITY.md) 进行密钥轮换与安全基线设置。
