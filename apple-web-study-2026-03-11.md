# Apple 网页设计与交互学习笔记（2026-03-11）

## 学习范围
- https://www.apple.com/
- https://www.apple.com/macbook-pro/
- https://www.apple.com/store
- https://www.apple.com/iphone/

## 全站共同 DNA（可直接作为设计系统起点）
- 字体栈：`"SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif`
- 主导航高度：`44px`
- 主按钮（实心蓝）
  - `font-size: 17px`
  - `line-height: 20px`
  - `border-radius: 980px`
  - `padding: 11px 21px`
  - `background: rgb(0, 113, 227)`
  - `color: #fff`
- 次按钮（描边）
  - `font-size: 17px`
  - `border-radius: 980px`
  - `padding: 11px 21px`
  - `border: 1px solid rgb(0, 102, 204)`
  - `color: rgb(0, 102, 204)`

## 各页面关键特征

### 1) 首页（apple.com）
- Hero 标题：`56px / 600 / line-height 60px / letter-spacing -0.28px`
- Hero 副标题：`28px / 400 / line-height 32px`
- 导航背景：`rgba(255,255,255,0.8)` + `backdrop-filter: saturate(1.8) blur(20px)`
- 结构重点：大留白 + 大图 + 双 CTA（Learn more / Buy）

### 2) MacBook Pro（滚动叙事最强）
- 页面主背景为深色区段，文字高反差（浅色字）
- Local Nav：`52px`（在全局导航下方）
- Hero 文案尺度明显更激进
  - 标题（产品名）：`28px`
  - 大文案：`64px / 600 / line-height 68px`
- 交互强度（DOM 信号）
  - `video: 13`
  - `sticky elements: 17`
  - `fixed elements: 16`
  - `transitioned elements: 814`
- 结论：这是 Apple「滚动驱动叙事」模板页

### 3) Store（信息密度与卡片系统）
- 页面底色：`rgb(245,245,247)`（浅灰底）
- Store 大标题：`80px / 600 / line-height 84px / letter-spacing -1.2px`
- 产品入口文案：`14px / 600`
- 卡片系统（核心）
  - 类名：`.rf-ccard-content.rf-ccard-content-withfullimg`
  - 尺寸：`400 x 500`
  - 圆角：`18px`
  - 阴影：`rgba(0,0,0,0.08) 2px 4px 12px`
  - 背景：白/黑两种主题卡片混排
- 交互形态：大量横向滑动区（carousel/scroller）

### 4) iPhone（产品矩阵页）
- 页标题：`80px / 600 / line-height 84px`
- “Explore the lineup” 标题：`56px / 600 / line-height 60px`
- 家族导航（iPhone family）高度较大：约 `241px`
- CTA 仍是统一胶囊按钮体系（与首页一致）
- 交互强度（DOM 信号）
  - `video: 1`
  - `sticky elements: 26`
  - `fixed elements: 28`
- 结论：偏“产品矩阵 + 信息分段”，不是纯展示页

## 交互模型总结（你真正要学的是这个）
- 不是靠炫技动画，而是靠“滚动节奏”组织信息
- 常见模式
  - 固定或粘性导航（全局 + 局部）
  - 大段落分屏与高密度留白
  - 横向卡片轨道（Store）
  - 图文分层推进（MacBook Pro）
- 动画策略
  - 以 `transform/opacity` 为主
  - 触发点与滚动强绑定
  - 统一按钮与字体，保证再复杂也不“花”

## 实战实现模板（可直接复用到你后续项目）

### A) Store 卡片轨道（Apple Store 风格）
- 布局结构
  - 外层：`store-rail-frame`（进度条 + dots）
  - 内层：`store-rail`（横向 `overflow-x: auto` + `scroll-snap-type: x mandatory`）
  - 卡片：`store-card`（统一圆角、阴影、亮暗主题混排）
- 动效算法（重点）
  - 用“卡片中心点到轨道视口中心”的距离计算 `focus`
  - 把 `focus` 映射成 CSS 变量：`--scale --lift --alpha --sat --bright`
  - 结果：中心卡片更亮、更大、更靠前；两侧卡片自然退场
- 交互控制
  - `Prev/Next` 按钮控制 `scrollBy({behavior:'smooth'})`
  - 进度条 = `scrollLeft / (scrollWidth - clientWidth)`
  - dots 激活项 = 当前最近中心卡片
- 推荐参数
  - 卡片宽度：`clamp(300px, 32vw, 430px)`
  - 缩放区间：`0.92 -> 1.02`
  - 垂向位移：`0px -> 18px`
  - 不透明度：`0.52 -> 1`

### B) 滚动叙事（MacBook Pro 风格）
- 布局结构
  - 左侧 `story-panel` 固定（sticky）作为视觉与文案舞台
  - 右侧 `story-step` 长区块按章节推进
  - 每个 step 写 `data-title/data-copy/data-theme/data-metric`
- 触发机制
  - 离散切换：`IntersectionObserver` 判断当前主章节
  - 连续进度：用滚动位置计算 `ratio`，驱动 panel 进度条和微变形
- 为什么有效
  - 用户视线停在同一视觉锚点，不用反复找焦点
  - 信息按“承诺 -> 证据 -> 体验 -> CTA”顺序递进
- 推荐参数
  - `rootMargin: "-28% 0px -28% 0px"`
  - `threshold: [0.2, 0.45, 0.7, 1]`
  - 章节高度：桌面 `~68vh`，移动端 `~56vh`

### C) Apple 风格不是“动画多”，而是“节奏对”
- 规则 1：一个屏幕只突出一个信息目标
- 规则 2：强对比（黑/白）与留白交替，形成呼吸感
- 规则 3：动画只服务信息切换，不做无意义花活
- 规则 4：所有过渡都尽量走 `transform/opacity`，避免布局抖动

## 调试检查清单（上线前必看）
- 卡片轨道
  - 焦点卡片、进度条、dots 是否同步
  - 轨道在宽屏/窄屏是否都保留可滚动余量
- 滚动叙事
  - 每一章节激活时 panel 文案/主题是否同步
  - 进度条是否随章节逐步增长，而不是提前到 100%
- 可访问性与性能
  - `prefers-reduced-motion` 是否降级
  - 控制台无报错，滚动时无明显掉帧

## 最高效复刻顺序（建议）
1. 先做设计 Token（字体/字号/间距/按钮/阴影）
2. 复刻全局导航（44px + 毛玻璃）
3. 复刻首页 Hero（标题/副标题/双 CTA）
4. 复刻 Store 卡片系统（18px 圆角 + 轻阴影 + 横向滚动）
5. 最后做 MacBook Pro 的滚动叙事（sticky + section timeline）

## 不建议做的事
- 不要整站下载后“照抄脚本”
- 不要先上复杂动画再补版式
- 不要忽略移动端断点（Apple 视觉在移动端同样严格）

## 一句话结论
你要学的不是 Apple 的“某个页面代码”，而是 Apple 的“统一视觉系统 + 滚动叙事框架 + 组件复用策略”。
