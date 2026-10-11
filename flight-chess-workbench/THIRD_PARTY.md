# 上游来源

本项目直接基于 https://github.com/woniu9524/couple-flying-chess 的源码快照修改。

- 分支：master
- 核对版本：1b8a45d13341c7c0bc0bd26afb39147877bc2bca
- 固定版本链接：https://github.com/woniu9524/couple-flying-chess/tree/1b8a45d13341c7c0bc0bd26afb39147877bc2bca
- 作者/仓库所有者：woniu9524；上游各贡献者的权利保留。
- 上游 README 声明 MIT License；所取得的源码快照未含独立 LICENSE 文件。本项目保留原 README 为 UPSTREAM-README.md，不另行推定上游版权年份或新增授权条款。

保留的主要组件：React/Vite/Tailwind 工程，Dice，ThemesView，BottomNav，ThemeCreateModal，ThemeSelectorModal，ThemeEditorModal，AiImportModal，TaskCardModal，WinModal。部分组件修改了文案、异步接入和布局。

重做部分：App 组合、HomeView 接入、GameView、GameBoard、useGameState；新增纯规则模块、配置模式、持久化工作区、设置弹窗、JSON 示例、测试及运行文档。上游旧 gameLogic/localStorage 工具已移出运行源码，避免误用两套规则。

本项目没有复制 LibreLudo 的代码；该项目仅用于研究架构。其 AGPL 授权不用于本项目代码。

1.1.0 新增模式预设、螺旋路线、岔路选择、合作目标、追逐判定、随机事件和任务计时器，均为本项目新增实现。

## OpenCV 格线识别（新增）

- 来源：https://github.com/eihli/image-table-ocr ，`table_ocr/extract_cells/__init__.py` 横竖线形态学与轮廓检测方案，MIT，Copyright (c) 2020 Eric Ihli。移植为浏览器 OpenCV 处理，修改核尺寸、阈值、多候选合并及矩形/尺寸过滤。未引入其文字 OCR。
- 运行库：https://github.com/TechStark/opencv-js ，通过 npm 下载锁定 `@techstark/opencv-js@5.0.0-release.1`，13.3 MB 本地运行库，Apache-2.0；原样复制 `dist/opencv.js`。许可证、版本、包哈希和修改说明见 `public/vision/`。
- 下载 GitHub 仓库时连接中断，最终通过 GitHub 读取检测代码，通过其发布的 npm 包获取 OpenCV 运行库。未宣称完成仓库 clone。
- 新增边缘分支参考：https://github.com/tony-xlh/opencvjs-document-scanner ，Canny + 轮廓策略，MIT，Copyright (c) 2024 Tony；许可证 `public/vision/document-scanner-LICENSE`。改为筛选全部格子，不使用其整张文档单轮廓输出；透视矫正功能未移植。


## 1.6.0 本地中文OCR与图片处理

- [RapidAI/RapidOCR](https://github.com/RapidAI/RapidOCR)，安装锁定rapidocr3.9.2，Apache-2.0；许可证保存在public/vision/RapidOCR-LICENSE（官方main版本，下载于2026-10-02）。本项目新增本地JSON行协议、API、分格放大、坐标归一化、复核与持久化；未修改RapidOCR模型代码。
- 本地已核对包内使用PP-OCRv6_det_small.onnx、PP-OCRv6_rec_small.onnx、ch_ppocr_mobile_v2.0_cls_mobile.onnx，ONNX Runtime1.30.0。模型权重源自官方PaddleOCR、权利归上游权利人；RapidOCR官方README说明模型及转换版适用Apache-2.0，模型来源与归属见其[MODEL_LICENSES.md](https://github.com/RapidAI/RapidOCR/blob/main/MODEL_LICENSES.md)。包中不重新分发模型和Python虚拟环境，安装由pip获取固定版本。
- opencv-python5.0.0.93、numpy2.5.3用于CLAHE、锐化、旋转与透视变换；Python环境只在本机使用。方法参照[OpenCV CLAHE文档](https://docs.opencv.org/3.4.16/d6/db6/classcv_1_1CLAHE.html)与[横竖线形态学](https://docs.opencv.org/4.11.0/dd/dd7/tutorial_morph_lines_detection.html)，不是调用外部图像生成器。增强不推断缺失内容。

## 1.7.0新增玩法组件

实际使用 spin-wheel 5.0.2（转盘）、inkjs 2.4.0（剧情运行及存档）、react-zoom-pan-pinch 3.7.0（图片与标记同步缩放）。版本与完整许可文本见 [arcade/THIRD_PARTY.md](public/arcade/THIRD_PARTY.md)。卡牌、合作、宾果、投票和经营规则与界面为本工作台新实现；其余调研仓库没有复制代码或素材。

## 1.7.4 双人大富翁：实际复用拍卖规则

- 仓库：[Amankori2307/monopoly](https://github.com/Amankori2307/monopoly)，固定提交 `dce7eef4d0d8857d4e12982faf13cf7e00e473cd`。
- MIT，Copyright (c) 2021 Aman kori；完整许可见 `licenses/monopoly-amankori-MIT.txt`。
- 实际移植 `src/domain/rules/auctionBids.utils.ts` 的最低出价/金币校验，以及 `src/domain/rules/engine/auction.utils.ts` 的竞拍人轮转/记录辅助方法，到 `src/core/vendor/monopolyAuction.js`。
- 改为 JavaScript、数字玩家编号、中文提示、最多30条记录。竞拍阶段、持久化、结算与任务联动为本项目适配实现。没有接入其完整引擎、棋盘素材、联机系统。
- 同色街区、均匀建造、半价出售建筑、放弃购买转竞拍等参考 [Hasbro Monopoly 规则](https://www.hasbro.com/common/instruct/Monopoly.pdf)，金币和12格地图为本项目简化设计，不宣称完整复刻标准40格大富翁。

## 1.8.0 七种双人创意玩法

转盘选择/换题券、卡牌冒险与回收、合作接力、剧情支线收藏、两条线宾果、双人默契委托和分层提示补给的规则及界面由本项目新增，见 `src/core/arcadeCreative.js` 和 `src/components/arcade/CreativeGamePanels.tsx`。继续调用上述 spin-wheel、inkjs 与 react-zoom-pan-pinch，不包含新第三方引擎或外部素材。图片任务来自用户已授权的既有内容库，保留来源与核对状态。
