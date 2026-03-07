# 情侣飞行棋（GitHub + Render 分享版）

入口文件：`index.html`  
Render 蓝图：`render.yaml`  
一键推送脚本：`deploy-github-render.sh`

## 1. 推到 GitHub

在当前目录执行：

```bash
cd /Users/xiaoxuan/Documents/Playground/flight-chess-share
./deploy-github-render.sh https://github.com/<你的账号>/<你的仓库>.git main
```

## 2. 在 Render 部署

1. 打开 Render 控制台，点击 `New +` -> `Blueprint`。
2. 选择上一步的 GitHub 仓库。
3. Render 会自动识别 `render.yaml`，确认后点击 `Apply`。
4. 首次部署完成后会得到一个 `onrender.com` 公网地址，直接分享这个地址。

## 本地预览

```bash
cd /Users/xiaoxuan/Documents/Playground/flight-chess-share
python3 -m http.server 8080
```

浏览器打开：`http://localhost:8080`
