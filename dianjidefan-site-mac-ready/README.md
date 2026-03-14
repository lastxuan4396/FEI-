# 垫饥的饭 - Astro 内容站

这是一个用 Astro + Markdown 搭建的个人内容站，用来持续发布想法、网页作品和小游戏日志。

## 技术栈

- Astro
- Markdown Content Collections
- Vercel Serverless Functions（根目录 `api/`）
- Resend 表单邮件通知
- Plausible 或 GA4 统计（按环境变量启用）

## 本地开发

```bash
npm install
npm run dev
```

默认开发地址通常是 `http://localhost:4321`。

## 目录结构

```text
api/
  contact.js
  subscribe.js
public/
  assets/
src/
  config/
  content/
    posts/
    projects/
    games/
  layouts/
  pages/
```

## 内容管理

以后新增内容，不需要手改首页结构，只需要往这些目录继续加 Markdown：

- `src/content/posts/`
- `src/content/projects/`
- `src/content/games/`

每篇内容都用 frontmatter 控制标题、摘要、日期、标签和 SEO。

## 环境变量

复制 `.env.example` 为 `.env`，然后配置：

- `SITE_URL`：正式域名
- `PUBLIC_SITE_URL`：前端公开站点地址
- `PUBLIC_PLAUSIBLE_DOMAIN`：Plausible 统计域名（可选）
- `PUBLIC_GA_MEASUREMENT_ID`：GA4 统计 ID（可选）
- `RESEND_API_KEY`：Resend API Key
- `FORM_FROM_EMAIL`：Resend 发件地址
- `FORM_NOTIFY_TO`：接收订阅和合作表单的邮箱

## 验证命令

```bash
npm run check
npm run build
npm run preview
```

## 固定域名

部署完成后，把 `SITE_URL` 和 `PUBLIC_SITE_URL` 改成你的正式域名，再在托管平台里绑定域名即可。

## 备注

项目根目录里仍保留了一些更早期的静态版文件，它们不是当前 Astro 版本运行所必需。Mac 交接包里已经只保留当前版本需要的文件。