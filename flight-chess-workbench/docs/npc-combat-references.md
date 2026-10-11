# 双人尖塔的机制参考

2026-10-04核查。用户提到《女忍者牡丹》及作者的其他作品。Steam明确列其开发者为Enokippu；《赤环的少女：奴隶斗技场》也列同一开发者。发行商目录可查看作品关联：

- [Kunoichi Botan](https://store.steampowered.com/app/986020/Kunoichi_Botan/)
- [Crimson Colosseum](https://store.steampowered.com/app/1187130/Crimson_Colosseum/?l=schinese)
- [Enokippu作品目录](https://www.kaguragames.com/product-category/developers/enokippu/)

以上官方资料用于确认作者、作品和角色扮演方向；没有足够资料证明这些作品采用下面每个具体数值或规则。以下是结合用户要求设计的原创双人机制：

|设计|当前实现|
|---|---|
|敌人有各自打法|巡逻者、蓄势兽、修复者、铁甲守卫、首领；预告与结算共用计算|
|行动付出任务代价|领取任务、完成确认才扣能量出牌；取消保留资源|
|敌人攻击造成应对任务|突破格挡／每次攻击／关闭三档，点名及双人队列、队友花能量援护|
|持续状态参与战术|共享弱点标记、压制、独立计时及计次任务|
|防守也能反击|新卡掩护反击：格挡5，架势上限6；按实际格挡再扣护甲，队友可补格挡；当轮到期|
|胜负有后续|反击击杀也让双方选新牌，选完继续路线或通关；失败可重试本层|

新局初始10张牌为4斩击、2守护、1掩护反击、1破阵、1补给、1策划。原有存档的牌组不自动替换；掩护反击也加入过关奖励池。未复制作品代码、角色、美术或剧情。

本次规则证据：tests/npc-riposte.test.js；实玩证据：work/adventure-check/riposte-ui.json（390／1280宽、同设备交接及独立双设备房间）；官方客户端证据：work/adventure-check/riposte-official/。这些是当前机制检查，不代表27张图片全量文字识别准确或所有长期需求已完成。
