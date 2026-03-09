# 三观认知测评站

一个纯前端的互动测评页面（无依赖），主题为“三观认知”，包含：

- 开始页
- 10 题测试流程（进度条 + 上一题/下一题）
- 结果页（主类型 + 次类型 + 维度条形图）
- 复制分享文案
- 本地历史记录（最近 5 条）

## 本地运行

在目录里启动静态服务即可：

```bash
cd /Users/xiaoxuan/Documents/Playground/interactive-test-site
python3 -m http.server 8097
```

然后打开 `http://localhost:8097`。

## 自定义题目

编辑 `app.js` 里的 `QUESTIONS`，每个选项通过 `scores` 给三个维度打分：

- `worldview` 世界观
- `lifeview` 人生观
- `values` 价值观
