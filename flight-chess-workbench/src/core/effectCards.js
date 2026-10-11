// Original game modifiers and non-graphic shared challenges. Image task prose is kept separately.
const names={native:'飞行棋／原图棋盘',spinner:'转盘抽卡',cards:'卡牌对战',coop:'合作闯关',story:'分支剧情',bingo:'任务宾果',vote:'默契抉择',mystery:'图片解谜',estate:'街区大富翁',spire:'双人尖塔'};
export const EFFECT_GAME_NAMES=names;
const common=(id,title,description,unit,amount,tag='互动')=>({id,title,description,unit,amount,kind:'common',mode:'agreement',tag});
const local=(kind,id,title,description,amount,rule,tag)=>({id:`${kind}-${id}`,title,description,unit:'turn',amount,kind,mode:rule?'automatic':'agreement',tag:tag??(rule?'收益':'互动'),...(rule?{rule}:{})});
export const EFFECT_CARDS=[
 common('common-narrator','轮流主持','持续2轮。每轮轮换一位主持人，负责读出任务、核对生效卡和提醒结束；游戏的行动顺序保持原样。','round',2),
 common('common-gear','道具轮换','持续2轮。选一件双方同意的普通小道具作为回合标记；每轮换一件，完成行动后把标记交给下一人。','round',2,'道具'),
 common('common-reader','搭档读题','持续3回合。自己的任务由搭档朗读，自己复述关键要求后再决定接受或跳过。','turn',3),
 common('common-password','默契口令','持续3回合。共同选一句简短口令，每次开始行动时一起说出；不影响原任务和拒绝权。','turn',3),
 common('common-colour','颜色标记','持续2轮。各选一种颜色的小物标记自己的生效卡，每轮结束一起核对剩余次数。','round',2,'道具'),
 common('common-timer','计时搭档','持续3回合。任务执行者负责行动，搭档负责操作计时器、提醒暂停与结束。','turn',3,'计时'),
 common('common-recap','一句话回顾','持续3回合。每次行动结束，用一句话说出刚才最有趣的地方，再交给下一人。','turn',3),
 common('common-emblem','角色徽章','持续2轮。各挑一个小物作角色徽章，并给角色起名字；读题时使用角色名，规则保持原样。','round',2,'道具'),
 common('common-break','短暂停靠','持续2分钟。共同暂停操作和任务计时器，整理手边道具并确认当前卡；持续卡自己的倒计时继续。','seconds',120,'休息'),
 common('common-review','共同复盘','直到本局结束。每当一张持续卡到期，双方各说一句是否愿意下一局继续使用，再确认解除。','game',1),
 local('spinner','salary','稳步加薪','持续3回合。生效对象每次完成转盘任务，额外获得1分；原有奖励照常结算。',3,'score','收益'),
 local('spinner','insurance','冒险保险','持续2回合。生效对象的冒险任务未完成时，免除本次1分损失；任务奖励与连胜仍按原规则。',2,'riskGuard','保护'),
 local('spinner','supply','换题补给','持续3回合。生效对象每次完成任务，多获得1张换题券；仍最多持有3张。',3,'spinnerTicket','资源'),
 local('spinner','preview','二选一讨论','持续2回合。选择二选一模式时，双方先各说一个选择理由，再由当前玩家决定；不强制改变转盘模式。',2),
 local('spinner','ritual','开场动作','持续3回合。每次转盘前，生效对象用一个简短手势示意准备好了，再开始转盘。',3),
 local('cards','bonus','任务赞助','持续3回合。生效对象完成任务牌时额外获得1分，计入本次胜利判定。',3,'score','收益'),
 local('cards','guard','风险缓冲','持续2回合。生效对象的冒险任务未完成时，免除本次1分损失；原有保护牌仍按原规则消耗。',2,'riskGuard','保护'),
 local('cards','supply','换牌储备','持续3回合。生效对象完成任务牌后，多获得1张换牌券；仍最多持有3张。',3,'cardRecycle','资源'),
 local('cards','planner','策略讲解','持续2回合。生效对象出牌前，用一句话解释这张牌的打算；可以说“先试试看”，不必公开后续计划。',2),
 local('cards','tokens','手牌标记','持续2回合。用三件小物对应三张手牌，出牌时移动对应标记；只作提示，不增减手牌。',2,undefined,'道具'),
 local('coop','supply','关卡补给','持续4回合。生效对象完成任务并点亮新关卡后，额外获得1次共享援助；最多3次。',4,'coopStage','资源'),
 local('coop','cushion','重试准备','持续2回合。生效对象暂不完成当前任务时，获得1次共享援助；关卡仍不点亮，最多3次援助。',2,'coopSkip','保护'),
 local('coop','relay','接力支援','持续4回合。生效对象完成接力第一棒后，额外获得1次共享援助，供第二棒使用；最多3次。',4,'coopRelay','资源'),
 local('coop','captain','轮换领航','持续2回合。每关开始前轮换一次讨论主持人，再由双方选择共同完成、一人领航或接力；不自动改变分工。',2),
 local('coop','checkpoint','关卡纪念','持续4回合。每点亮一关，用一件小物作为共同纪念并摆到一边；任务跳过不摆纪念。',4,undefined,'道具'),
 local('story','trust','同行鼓励','持续3回合。生效对象每次完成剧情任务，额外增加1点共同默契，计入结局。',3,'storyDone','收益'),
 local('story','path','探索心情','持续3回合。生效对象每次确认主线分支，额外增加1点共同默契；不改变路线和支线资格。',3,'storyChoice','收益'),
 local('story','recovery','宽容同行','持续2回合。生效对象跳过剧情任务时，额外增加1点共同默契；仍按原路线继续。',2,'storySkip','保护'),
 local('story','actor','角色叙述','持续3回合。生效对象用角色口吻读出当前位置和自己的选择，内容可以简短；不改原图任务文字。',3),
 local('story','souvenir','旅行小物','持续3回合。每进入一个新地点，为一件小物起一个与地点有关的名字，作为本局纪念；不增加系统收藏数量。',3,undefined,'道具'),
 local('bingo','supply','完成补格','持续3回合。生效对象亲自完成一格后，额外获得1次换格机会；最多2次，不增加万能标记或完成分。',3,'bingoDone','资源'),
 local('bingo','coupon','换格优惠','持续3回合。生效对象每个行动回合第一次换格，返还1次换格机会；必须先有可用机会，最多2次。',3,'bingoRefund','资源'),
 local('bingo','time','从容选格','持续3回合。生效对象领取宾果任务时，计时增加30秒；正文、点亮条件和连线胜利规则保持原样。',3,'bingoTime','计时'),
 local('bingo','line','连线宣言','持续2回合。选格前说出希望完成的一条横线、竖线或斜线；可以中途改计划，不提前点亮格子。',2),
 local('bingo','marker','实体格标','持续3回合。使用九件小物对应九宫格，只在亲自完成或正式使用万能标记后移动小物，避免漏记。',3,undefined,'道具'),
 local('vote','volunteer','自愿加奖','持续2回合。生效对象完成自愿任务后额外获得1分；仍需本人确认接受，每题只能领取一次。',2,'score','收益'),
 local('vote','agreement','默契回响','持续2回合。双方本题选择一致时，生效对象各额外获得1分；只有全员提交后才结算和显示。',2,'voteSame','收益'),
 local('vote','difference','不同也好','持续2回合。双方本题选择不同时，生效对象各获得1分；不改变票数、自愿执行者或任务资格。',2,'voteDifferent','收益'),
 local('vote','reason','揭晓理由','持续2回合。双方选择揭晓后，各说一句理由；提交前不公开选择，不要求说服对方。',2),
 local('vote','host','交接仪式','持续2回合。每次把设备交给另一人时，递交一个回合标记并转过屏幕；仍由本人秘密选择。',2,undefined,'道具'),
 local('mystery','coupon','提示优惠','持续2回合。生效对象每条线索第一次请求提示时，返还1枚提示币；需先有币，仍最多6枚且不跳过提示层级。',2,'mysteryRefund','资源'),
 local('mystery','insight','发现奖励','持续2回合。生效对象解开一条线索后，额外获得1枚共享提示币；最多6枚，正确答案和解锁顺序保持原样。',2,'mysteryAnswer','资源'),
 local('mystery','supply','补给加成','持续2回合。生效对象完成图片补给任务后，额外获得1枚共享提示币；每条线索仍只能领取一次补给，最多6枚。',2,'mysteryTask','资源'),
 local('mystery','notes','线索记录员','持续2回合。选一人记录已公开的线索，另一人先提出猜测；只记录公开信息，不提前查看答案。',2),
 local('mystery','lens','观察小物','持续2回合。用一个小物作探索标记，指出当前讨论的场景位置，再点击查看线索；不影响解锁顺序。',2,undefined,'道具'),
 local('estate','dividend','合约分红','持续4回合。生效对象完成合约任务后，额外获得5金币；惩罚任务和减租任务不产生这笔分红。',4,'estateTask','收益'),
 local('estate','start','起点津贴','持续4回合。生效对象掷骰经过起点时，除原有奖励外再获得10金币；停留起点或接受移动说明不另发津贴。',4,'estatePass','收益'),
 local('estate','build','建造返现','持续4回合。生效对象每次按规则建造或升级后，返还5金币；需先付足20金币并满足完整街区、均匀建造条件。',4,'estateBuild','资源'),
 local('estate','mayor','街区命名','持续2回合。生效对象为自己的地块起一个口头昵称，交易时同时说出地块原名；系统名称、价格和租金保持原样。',2),
 local('estate','ledger','金币小账本','持续4回合。用小物或纸笔记录每次收支，双方轮流核对；网站账目是结算依据，不增加额外金币。',4,undefined,'道具')
];
// The original requested 50 remain intact; new combat modes get their own extension.
export const SPIRE_EFFECT_CARDS=[
 local('spire','fortress','守护阵线','持续6次行动。生效对象成功打出带格挡的牌时，额外获得2点共享格挡；取消出牌不生效。',6,'spireBlock','保护'),
 local('spire','supply','治疗补给','持续6次行动。生效对象成功打出治疗牌时，额外恢复1点队伍生命，不超过生命上限。',6,'spireHeal','收益'),
 local('spire','composure','沉着应对','持续6次行动。生效对象完成敌人攻击任务时，额外获得1点共享格挡；跳过不生效，代做按实际承担者计算。',6,'spireResponse','保护'),
 local('spire','plan','预告讨论','持续4次行动。生效对象行动前，与队友各说一句进攻或防守计划，再选择出牌；不额外扣能量。',4,undefined,'互动'),
 local('spire','markers','战斗标记','持续4次行动。用双方选定的小物标记能量和共享格挡，每次结算后核对；以网页显示为准，不额外增加资源。',4,undefined,'道具')
];
export const ALL_EFFECT_CARDS=[...EFFECT_CARDS,...SPIRE_EFFECT_CARDS];
export const effectCard=id=>ALL_EFFECT_CARDS.find(c=>c.id===id);
export const effectCardText=c=>`${c.title}：${c.description}`;
export function availableEffectCards(kind='native',creative=false,estate=false){return ALL_EFFECT_CARDS.filter(c=>c.kind==='common'||c.kind===kind&&(c.mode==='agreement'||(kind==='estate'?estate:creative)));}
export function canUseEffectCard(c,kind='native',creative=false,estate=false){return !!c&&availableEffectCards(kind,creative,estate).some(v=>v.id===c.id);}
