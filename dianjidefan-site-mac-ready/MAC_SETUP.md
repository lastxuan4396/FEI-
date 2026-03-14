# Mac 运行说明

## 1. 环境要求

建议先确认这些版本：

```bash
node -v
npm -v
```

推荐：

- Node.js 20+
- npm 10+

如果没有 Node，可以在 Mac 上安装：

```bash
brew install node
```

## 2. 进入项目目录

```bash
cd dianjidefan-site-mac-ready
```

如果你改了文件夹名，就进入你自己的项目目录。

## 3. 安装依赖

```bash
npm install
```

## 4. 配置环境变量

复制模板：

```bash
cp .env.example .env
```

然后编辑 `.env`，至少补这几个：

```env
SITE_URL=https://your-domain.com
PUBLIC_SITE_URL=https://your-domain.com
RESEND_API_KEY=
FORM_FROM_EMAIL=hello@your-domain.com
FORM_NOTIFY_TO=1750429451@qq.com
```

如果暂时不接统计，可以先留空：

- `PUBLIC_PLAUSIBLE_DOMAIN`
- `PUBLIC_GA_MEASUREMENT_ID`

## 5. 本地运行

```bash
npm run dev
```

浏览器打开：

```text
http://localhost:4321
```

## 6. 检查项目状态

```bash
npm run check
npm run build
```

## 7. 重要说明

- 页面内容来自 `src/content/` 下的 Markdown 文件
- 联系和订阅接口来自根目录 `api/`
- 如果没配 `RESEND_API_KEY`，表单会返回配置未完成提示，这是正常的
- `dist/`、`.astro/`、`node_modules/` 都不用手动带到 Mac，重新生成就行