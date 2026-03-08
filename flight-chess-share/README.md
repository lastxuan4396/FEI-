# 情侣飞行棋 V2.0（联机版）

入口文件：`index.html`  
后端服务：`server.js`（房间同步 API）  
Render 配置：`render.yaml`  
一键推送脚本：`deploy-github-render.sh`

## 能力

- 双人联机房间（创建 / 加入 / 退出）
- 两个角色实时位置与进度条
- 历史点数与回合时间线
- 一键导出棋盘图和复盘文本
- 版本号与部署时间显示
- 404 自动回退到 `index.html`

## 本地运行

```bash
cd /Users/xiaoxuan/Documents/Playground/flight-chess-share
npm install
npm start
```

打开：`http://localhost:10000`

## GitHub + Render

```bash
cd /Users/xiaoxuan/Documents/Playground/flight-chess-share
./deploy-github-render.sh https://github.com/<你的账号>/<你的仓库>.git main
```

然后在 Render：
1. `New +` -> `Blueprint`
2. 选择该仓库并应用 `render.yaml`
3. 部署完成后分享 `onrender.com` 链接
