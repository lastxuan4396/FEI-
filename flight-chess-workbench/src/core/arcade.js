import {changeTaskCount,validTaskCount} from './taskCount.js';
import {LEGACY_STORY as STORY,storyMap,storyEntry} from './storyMaps.js';
import {BINGO_SIZES,bingoSide,bingoGoal,bingoLineCount} from './bingo.js';
import {beforeEffectRules,afterEffectRules} from './effectCardRules.js';
import {applyEffectAction,validateEffects,validateEffectDeck,completedEffectTurn} from './ongoingEffects.js';
import {nextClock,validPause} from './taskClock.js';
import {estateMap,ESTATE_MAP_SIZES,ORIGINAL_LOTS} from './estateMaps.js';
import {initialCreative,handleCreative,validateCreative,recordJourney} from './arcadeCreative.js';
import {taskDuration} from './taskTiming.js';
import {readStoryStep,verifyStorySave} from './storyRuntime.js';
import {IMAGE_TASK_TEXTS,imageTask} from './imageTaskLibrary.js';
import {estateGroup,estateRent,buildReason,tradeReason} from './estate.js';
import {bidBlockedReason,appendAuctionEntry,openingLedgerEntry,nextActiveBidderIndex} from './vendor/monopolyAuction.js';
// Local turn-based games. Imported tasks and clues are plain text only.
export const ARCADE_MODES = [
 {id:'spinner',name:'转盘抽卡',icon:'🎡',tag:'轻松开场',desc:'稳步、冒险或二选一，用连胜赚取换题机会。',rules:'轮流转盘，完成加分，跳过不加分。10次转盘后按积分结算。'},
 {id:'cards',name:'卡牌对战',icon:'🃏',tag:'策略竞争',desc:'稳步与冒险任务，搭配加倍、保护和换牌组合。',rules:'每回合出一张牌。任务完成得2分；加倍使下次任务多得2分；保护挡一次交换。先到8分获胜，16轮后按分数结算。'},
 {id:'coop',name:'合作闯关',icon:'🤝',tag:'一起推进',desc:'共同完成、一人领航、双人接力，逐关点亮路线。',rules:'关卡数可设置，完成才解锁下一关；换题保留当前关。'},
 {id:'story',name:'分支剧情',icon:'🌿',tag:'选择与结局',desc:'自定义章节，选择沿途分支，收集纪念，走向四种结局。',rules:'设置1至20章和支线数量，轮流选择路线并领取沿途任务。完成任务增加默契，收藏写进结局；最多轮数可独立设置。旧存档沿用原路线。'},
 {id:'bingo',name:'任务宾果',icon:'🎯',tag:'自由选格',desc:'选择9、16或25格，规划连线，用换格和万能标记争取胜利。',rules:'轮流选自己的未完成格子，完成任务才点亮。横、竖、两条长对角线都算；地图格数、获胜连线数和最多轮数可设置。'},
 {id:'vote',name:'默契抉择',icon:'🗳️',tag:'双人互动',desc:'秘密选择、同时揭晓，默契得分与自愿任务。',rules:'每题每人投一票，可选自己。提交期间不显示票数；全员投完才揭晓，最高票者各得1分。5题后结算。使用图片题库时，可由最高票玩家领取本轮任务，也可跳过。'},
 {id:'mystery',name:'图片解谜',icon:'🔎',tag:'点击探索',desc:'双人找线索，分层提示，也可做图片任务换补给。',rules:'点击场景线索，按顺序解开3道谜题。可请求提示；图片、线索和答案可自定义。'},
 {id:'estate',name:'街区大富翁',icon:'🏠',tag:'资源经营',desc:'买地建造、集齐街区；图片任务带来奖励与租金选择。',rules:'120金币开局，经过起点得30。买地、均匀建造、收租与交易；同色街区未建造地块租金翻倍。可选图片任务联动、仅事件任务或纯经营；目标资产与轮数可设置。旧局沿用原规则。'}
];
export const SECTORS=['真心话','默契','动作','夸夸','合作','惊喜'];
export const LOTS=ORIGINAL_LOTS;
export {LEGACY_STORY as STORY} from './storyMaps.js';
export const DEFAULT_PUZZLES=[
 {label:'书桌',x:.23,y:.73,clue:'桌上的物品可以打开藏宝盒。找到的物品是什么？',answer:'钥匙'},
 {label:'藏宝盒',x:.70,y:.66,clue:'纸条写着：按“窗户 → 画作 → 灯”读出三个数字。密码是什么？',answer:'314'},
 {label:'出口',x:.93,y:.60,clue:'藏宝盒里最后留下的是一张路线图。带什么离开房间？',answer:'地图'}
];
const DEFAULT_TASKS=['分享一件今天值得开心的小事。','说出对方的两个优点。','一起给一张照片起名字。','各用三个词形容理想周末。','一起哼十秒喜欢的旋律。','接龙说出六个旅行地点。','模仿一个动作，让另一人猜。','画一个小图案，让大家猜含义。','轮流续写三句话的小故事。','一起设计一个一分钟庆祝动作。','分享一个想学会的小技能。','说一个最近感谢对方的时刻。'];
const VOTES=['谁最会发现生活里的小惊喜？','谁最适合当旅行规划师？','谁最有可能记住所有人的生日？','谁最会讲故事？','谁最适合主持下一场聚会？','谁最会给大家挑礼物？'];
const ensure=(yes,message)=>{if(!yes)throw Error(message);};
const num=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const str=(s,max=1000)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
const clone=v=>structuredClone(v);
function rand(s,n){let x=s.seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.seed=x>>>0;return Math.floor(s.seed/4294967296*n);}
function draw(s,c){if(!s.bag.length){s.bag=c.pool.map((_,i)=>i);for(let i=s.bag.length-1;i>0;i--){const j=rand(s,i+1);[s.bag[i],s.bag[j]]=[s.bag[j],s.bag[i]];}}return c.pool[s.bag.pop()];}
function previewContract(s,c){const tasks=[draw(s,c)];if(new Set(c.pool).size>1){let next=draw(s,c);while(next===tasks[0])next=draw(s,c);tasks.push(next);}s.estate.contract={tasks,selected:0};}
function newCard(s,c){const r=rand(s,10),type=r<6?'mission':r<8?'boost':r===8?'shield':'swap';return {type,text:type==='mission'?draw(s,c):type==='boost'?'下次完成任务多得2分':type==='shield'?(c.creative?'抵挡一次交换或冒险扣分':'抵挡下一次手牌交换'):'与指定玩家随机交换一张手牌'};}
function note(s,text){s.message=text;s.log=[...s.log.slice(-29),text];}
export function wealth(s,index){return s.players[index].cash+s.owners.reduce((n,owner,i)=>n+(owner===index?price(i)+s.levels[i]*20-(s.estate?.mortgaged?.[i]?Math.floor(price(i)/2):0):0),0);}
export function price(i){return 40+(i%3)*20;}
function finish(s,text,winners=[]){if(s.creative?.kind==='spinner')s.creative.candidates=[];if(s.creative?.kind==='coop'){s.creative.relayActive=false;s.creative.step=0;}if(s.estate){s.estate.rent=null;s.estate.reward=null;s.estate.auction=null;if(s.estate.contract!==undefined)s.estate.contract=null;}s.phase='finished';s.pending=null;s.trade=null;s.winners=winners;s.ending=text;note(s,text);}
function leaders(s,estate=false){const values=s.players.map((p,i)=>estate&&s.estate?.bankrupt[i]?-1:estate?wealth(s,i):p.score),max=Math.max(...values);return values.flatMap((v,i)=>v===max?[i]:[]);}
function advance(s,c){s.moves++;do{s.turn=(s.turn+1)%s.players.length;}while(s.estate?.bankrupt[s.turn]);s.phase='ready';s.pending=null;if(s.estate?.contract!==undefined)s.estate.contract=null;if((c.kind==='spinner'&&s.moves>=(c.rounds??5)*s.players.length)||(c.kind==='cards'||c.kind==='estate')&&s.moves>=(c.kind==='estate'?c.estate?.rounds??16:c.rounds??16)*s.players.length)finish(s,'本局结束，按成绩结算。',leaders(s,c.kind==='estate'));}
function task(s,c,text,points=1,extra={}){const original=c.sourceTexts?.[text]??text;const source=imageTask(original);s.phase='task';s.pending={text,...(original!==text?{original}:{}),points,duration:taskDuration(text)??(original===text?source?.duration:undefined)??60,endsAt:null,...extra,...(source?{source:{image:source.image,cell:source.cell,reviewed:source.reviewed}}:{})};}
function payEstateRent(s,c,amount){const r=s.estate.rent,p=s.players[s.turn];ensure(r&&p.cash>=amount,'金币不足，请先出售资产或选择其他结算方式');p.cash-=amount;s.players[r.owner].cash+=amount;s.estate.rent=null;note(s,`向${c.players[r.owner].name}支付${amount}金币租金。`);advance(s,c);}
function storyEnter(s,c,index){const result=readStoryStep(s.storySave,index,c);s.node=result.node;s.storySave=result.saved;s.pending=null;recordJourney(s,s.node);const n=storyMap(c)[s.node];if(n.ending){finish(s,`${n.ending} ${s.trust>=3?'你们还解锁了“默契同行”纪念。':'下次旅程还有新的可能。'}${s.creative?.kind==='story'?` 收藏纪念：${s.creative.mementos.join('、')||'这段共同旅程'}。`:''}`);return;}if(n.task)task(s,c,c.customPool||c.library==='image'?draw(s,c):n.text,0,{next:n.to,...(c.creative?{creative:{kind:'story',style:'journey',actors:[s.turn]}}:{})});else s.phase='choice';}
export function createArcade(kind,players,options={}){
 ensure(ARCADE_MODES.some(m=>m.id===kind),'玩法不存在');ensure(options.creative===undefined||typeof options.creative==='boolean','创意版设置不正确');
 ensure(options.bingo===undefined||kind==='bingo'&&BINGO_SIZES.includes(options.bingo.size)&&num(options.bingo.goalLines,1,3),'宾果地图或连线目标不正确');
 ensure(options.story===undefined||kind==='story'&&num(options.story.chapters,1,20)&&num(options.story.detours,0,options.story.chapters),'剧情章节或支线数量不正确');
 const library=options.pool?.length?'custom':options.library??(kind==='mystery'&&!options.creative?'recommended':'image');
 ensure(['custom','recommended','image'].includes(library),'题库类型不正确');
 const c={kind,library,...(options.story?{story:clone(options.story)}:{}),...(options.bingo?{bingo:clone(options.bingo)}:{}),...(options.poolName?{poolName:options.poolName}:{}),players:players.map(p=>({name:p.name,color:p.color})),pool:options.pool?.length?[...new Set(options.pool)]:library==='image'?[...IMAGE_TASK_TEXTS]:kind==='vote'?VOTES:DEFAULT_TASKS,customPool:!!options.pool?.length,puzzles:clone(options.puzzles??DEFAULT_PUZZLES),...(options.rounds!==undefined?{rounds:options.rounds}:{}),...(options.sourceTexts?{sourceTexts:clone(options.sourceTexts)}:{}),...(options.scene?{scene:options.scene}:{}),...(kind==='estate'&&options.estate?{estate:clone(options.estate)}:{}),...(options.creative?{creative:true}:{})};
 const map=estateMap(c),bingoCells=kind==='bingo'?bingoSide(c)**2:9;
 const s={revision:0,seed:(options.seed??20261002)||1,turn:0,phase:kind==='story'?'choice':kind==='vote'?'ballot':'ready',moves:0,players:c.players.map(()=>({score:0,cash:120,position:0,boost:0,shield:false,hand:kind==='cards'?Array.from({length:3},()=>({type:'mission',text:c.pool[0]})):[],bingo:kind==='bingo'?Array(bingoCells).fill(c.pool[0]):[],done:Array(bingoCells).fill(false)})),bag:[],pending:null,sector:0,stage:0,node:kind==='story'?storyEntry(c):'start',storySave:'',trust:1,votes:Array(players.length).fill(0),voter:0,round:0,question:'',owners:Array(map.size).fill(-1),levels:Array(map.size).fill(0),trade:null,dice:0,hints:0,winners:[],ending:'',message:'准备好了就开始吧。',log:[],undo:[]};
 if(c.creative)s.creative=initialCreative(kind,c.puzzles.length,bingoGoal(c));
 if(c.estate){s.estate={rent:null,reward:null,auction:null,contract:null,mortgaged:Array(map.size).fill(false),redraws:Array(players.length).fill(0),passes:Array(players.length).fill(0),bankrupt:Array(players.length).fill(false),boundTasks:Array(map.size).fill(null)};if(c.estate.taskMode==='linked')s.estate.boundTasks=s.estate.boundTasks.map((_,i)=>estateGroup(i,c)?draw(s,c):null);}
 if(kind==='story')storyEnter(s,c);
 validateArcade({format:'interactive-game-save',version:1,config:c,state:s});
 if(kind==='cards')s.players.forEach(p=>{p.hand=Array.from({length:3},()=>newCard(s,c));});
 if(kind==='bingo')s.players.forEach(p=>{p.bingo=Array.from({length:bingoCells},()=>draw(s,c));});
 if(kind==='vote'){s.phase='ballot';s.question=draw(s,c);}
 return validateArcade({format:'interactive-game-save',version:1,config:c,state:s});
}
export function arcadeTransition(input,a){
 validateArcade(input);ensure(a&&typeof a.type==='string','操作不正确');const c=input.config,s=clone(input.state),map=estateMap(c),lotNames=map.tiles.map(t=>t.name);ensure(a.expectedRevision===undefined||a.expectedRevision===s.revision,'对局已更新，请重新操作');
 if(a.type==='UNDO'){ensure(s.undo.length,'没有可撤销的操作');const old=s.undo.pop();return validateArcade({...input,state:{...old,revision:s.revision+1,undo:s.undo}});}
 ensure(s.phase!=='finished'||['EFFECT_END','EFFECT_TIMER','EFFECT_DISMISS','EFFECT_COUNT'].includes(a.type),'本局已结束');const old=clone(s);delete old.undo;s.undo=[...s.undo.slice(-11),old];s.revision++;
 const p=s.players[s.turn];const effectContext={kind:c.kind,creative:!!c.creative,estate:!!c.estate,puzzleCount:c.puzzles.length};const ruleLabels=beforeEffectRules(s,c,a,input.state);
 if(applyEffectAction(s,a,c.players.map((_,i)=>String(i)),s.effectTurns??0,n=>rand(s,n),effectContext)){}
 else if(c.creative&&handleCreative(s,c,a,{draw:()=>draw(s,c),rand:n=>rand(s,n),task:(text,points,extra)=>task(s,c,text,points,extra),note:text=>note(s,text),advance:()=>advance(s,c),finish:(text,winners)=>finish(s,text,winners),newCard:()=>newCard(s,c),storyEnter:index=>storyEnter(s,c,index),leaders:()=>leaders(s),sectors:SECTORS})){}
 else if(a.type==='END'){finish(s,'已结束本局，保留当前成绩。',c.kind==='coop'||c.kind==='story'||c.kind==='mystery'?[]:leaders(s,c.kind==='estate'));}
 else if(a.type==='TASK_COUNT'){ensure(s.phase==='task'&&s.pending,'当前没有可计次任务');changeTaskCount(s.pending,a.countDelta);}
 else if(a.type==='EDIT_TASK'){ensure(s.phase==='task'&&s.pending&&str(a.text)&&num(a.duration,1,86400),'任务文字或时长不正确');const textChanged=s.pending.text!==a.text.trim();s.pending.text=a.text.trim();s.pending.duration=a.duration;s.pending.endsAt=null;delete s.pending.pausedRemaining;if(textChanged){delete s.pending.source;delete s.pending.taskCount;}s.pending.edited=true;if(c.kind==='cards')p.hand[s.pending.card].text=s.pending.text;if(c.kind==='bingo')p.bingo[s.pending.cell]=s.pending.text;if(c.kind==='vote')s.question=s.pending.text;note(s,'本次任务设置已修改。');}
 else if(a.type==='TIMER'){ensure(s.phase==='task'&&s.pending,'当前没有任务');ensure(a.now===null||num(a.now,0,10_000_000_000_000),'时间不正确');const clock=nextClock(s.pending.duration,s.pending.endsAt,s.pending.pausedRemaining,a.now,a.timerMode);s.pending.endsAt=clock.endsAt;delete s.pending.pausedRemaining;if(clock.pausedRemaining!==undefined)s.pending.pausedRemaining=clock.pausedRemaining;}
 else if(a.type==='RESOLVE'){
  ensure(s.phase==='task'&&s.pending&&typeof a.done==='boolean','请先抽取任务');const t=s.pending;note(s,a.done?'任务已完成。':'已跳过任务。');
  if(c.kind==='vote'){s.pending=null;s.phase='reveal';}
  else if(c.kind==='coop'){if(a.done)s.stage++;s.pending=null;if(s.stage>=(c.rounds??8))finish(s,`${c.rounds??8}关全部点亮，合作通关！`);else s.phase='ready';}
  else if(c.kind==='story'){s.moves++;if(a.done)s.trust+=2;s.turn=(s.turn+1)%s.players.length;storyEnter(s,c,0);}
  else if(c.kind==='bingo'){if(a.done){p.done[t.cell]=true;p.score++;}if(bingoLineCount(p.done)>=bingoGoal(c))finish(s,`宾果！完成${bingoGoal(c)}条连线。`,[s.turn]);else advance(s,c);}
  else if(c.kind==='estate'&&t.estate){if(t.estate.kind==='penalty'){if(!a.done)p.cash=Math.max(0,p.cash-10);note(s,a.done?'惩罚任务已完成，无额外奖励。':'已跳过惩罚，支付10金币（最多扣至0）。');advance(s,c);}else if(t.estate.kind==='rent'){const r=s.estate.rent;if(a.done)payEstateRent(s,c,Math.ceil(r.amount/2));else if(p.cash>=r.amount)payEstateRent(s,c,r.amount);else{s.pending=null;s.phase='rent';r.tried=true;note(s,'任务已跳过，原租金仍待支付；可出售资产或使用免租券。');}}else{if(a.done){if(t.estate.reward==='pass'&&s.estate.passes[s.turn]<3)s.estate.passes[s.turn]++;else if(t.estate.reward==='redraw'&&s.estate.redraws[s.turn]<3)s.estate.redraws[s.turn]++;else p.cash+=t.estate.cash;if(t.estate.partner!==undefined)s.players[t.estate.partner].cash+=10;}else if(t.estate.risk)p.cash=Math.max(0,p.cash-10);note(s,a.done?'合约任务完成，奖励已发放。':t.estate.risk?'风险合约未完成，支付10金币（最多扣至0）。':'已放弃合约任务，无奖励。');advance(s,c);}}
  else{if(a.done){if(c.kind==='estate')p.cash+=15;else p.score+=t.points+(c.kind==='cards'?p.boost:0);}if(c.kind==='cards'){p.boost=0;p.hand[t.card]=newCard(s,c);}if(c.kind==='cards'&&p.score>=8)finish(s,'率先获得8分，卡牌对战获胜！',[s.turn]);else{if(c.kind==='estate'&&wealth(s,s.turn)>=(c.estate?.target??300))finish(s,`净资产达到${c.estate?.target??300}，经营成功！`,[s.turn]);else advance(s,c);}}
 }
 else if(c.kind==='spinner'&&a.type==='SPIN'){ensure(s.phase==='ready','请先处理当前卡片');s.sector=rand(s,6);task(s,c,draw(s,c),[1,2,1,2,3,1][s.sector],{category:SECTORS[s.sector]});note(s,`转到${SECTORS[s.sector]}。`);}
 else if(c.kind==='coop'&&a.type==='DRAW'){ensure(s.phase==='ready','请先处理当前关卡');task(s,c,draw(s,c),0);}
 else if(c.kind==='bingo'&&a.type==='CELL'){ensure(s.phase==='ready'&&num(a.index,0,bingoSide(c)**2-1)&&!p.done[a.index],'请选择未完成的格子');task(s,c,p.bingo[a.index],1,{cell:a.index});}
 else if(c.kind==='story'&&a.type==='CHOOSE'){const n=storyMap(c)[s.node];s.moves++;ensure(s.phase==='choice'&&n.options&&num(a.index,0,n.options.length-1),'请选择有效剧情分支');note(s,n.options[a.index].label);s.turn=(s.turn+1)%s.players.length;storyEnter(s,c,a.index);}
 else if(c.kind==='cards'&&a.type==='PLAY'){
  ensure(s.phase==='ready'&&num(a.index,0,2),'请选择手牌');const card=p.hand[a.index];
  if(card.type==='mission')task(s,c,card.text,2,{card:a.index});
  else{if(card.type==='boost'){p.boost=2;note(s,'已加倍，下次完成任务多得2分。');}if(card.type==='shield'){p.shield=true;note(s,'已保护，抵挡下一次交换。');}if(card.type==='swap'){ensure(num(a.target,0,s.players.length-1)&&a.target!==s.turn,'请选择另一位玩家');const other=s.players[a.target];if(other.shield){other.shield=false;note(s,'对方的保护抵挡了本次交换。');}else{const own=rand(s,2),ownIndex=[0,1,2].filter(i=>i!==a.index)[own],theirs=rand(s,3);[p.hand[ownIndex],other.hand[theirs]]=[other.hand[theirs],p.hand[ownIndex]];note(s,'随机交换了双方一张手牌。');}}p.hand[a.index]=newCard(s,c);advance(s,c);}
 }
 else if(c.kind==='vote'&&a.type==='VOTE'){ensure(s.phase==='ballot'&&num(a.target,0,s.players.length-1),'请选择投票对象');s.votes[a.target]++;s.voter++;note(s,'已记录一票。');if(s.voter===s.players.length){const highest=Math.max(...s.votes);s.votes.forEach((v,i)=>{if(v===highest)s.players[i].score++;});s.phase='reveal';}else s.turn=s.voter;}
 else if(c.kind==='vote'&&a.type==='DRAW'){ensure(s.phase==='reveal'&&c.library==='image'&&num(a.target,0,s.players.length-1)&&s.votes[a.target]===Math.max(...s.votes),'请选择最高票玩家');s.turn=a.target;task(s,c,s.question,0);note(s,`由${c.players[a.target].name}领取本轮任务。`);}
 else if(c.kind==='vote'&&a.type==='NEXT'){ensure(s.phase==='reveal','所有人提交后才能继续');s.round++;if(s.round>=(c.rounds??5))finish(s,'五轮投票结束。',leaders(s));else{s.votes.fill(0);s.voter=0;s.turn=0;s.question=draw(s,c);s.phase='ballot';}}
 else if(c.kind==='mystery'&&a.type==='ANSWER'){ensure(s.phase==='ready'&&a.index===s.stage&&typeof a.answer==='string'&&a.answer.length<=100,'请解开当前线索');if(a.answer.trim().toLowerCase()===c.puzzles[s.stage].answer.trim().toLowerCase()){s.stage++;note(s,'线索解开了！');if(s.stage===c.puzzles.length)finish(s,`成功离开房间，使用了${s.hints}次提示。`);}else note(s,'答案还不对，再看看场景和线索。');}
 else if(c.kind==='mystery'&&a.type==='HINT'){ensure(s.phase==='ready','当前没有谜题');s.hints++;note(s,`提示：答案是“${c.puzzles[s.stage].answer}”。`);}
 else if(c.kind==='estate'&&a.type==='ROLL'){
  ensure(s.phase==='ready','请先处理地块或交易');s.dice=rand(s,6)+1;const raw=p.position+s.dice;p.position=raw%map.size;if(raw>=map.size)p.cash+=30;const i=p.position,owner=s.owners[i];note(s,`掷出${s.dice}点，到达${lotNames[i]}。`);
  if(['penalty','reward','contract'].includes(map.tiles[i].kind)){
   if(c.estate&&c.estate.taskMode!=='off'){
    if(map.tiles[i].kind==='penalty')task(s,c,draw(s,c),0,{category:'惩罚格',estate:{kind:'penalty',fine:10}});
    else if(map.tiles[i].kind==='reward'){s.estate.reward={type:['cash','pass','redraw'][rand(s,3)],cash:20};s.phase='reward';note(s,'到达奖励格，直接领取奖励。');}
    else{s.phase='contract';previewContract(s,c);note(s,'到达合约格，先选择任务，再决定接受哪种回报。');}
   }else{const event=rand(s,c.estate?.taskMode==='off'?2:3);if(event===0){p.cash+=15;note(s,'街区活动奖励15金币。');advance(s,c);}else if(event===1){p.cash=Math.max(0,p.cash-10);note(s,'维护开支10金币。');advance(s,c);}else task(s,c,draw(s,c),0);}
  }
  else if(i===0)advance(s,c);
  else if(owner===-1||owner===s.turn)s.phase='offer';
  else if(c.estate&&s.estate.mortgaged?.[i]){note(s,'这块地已抵押，本次无需付租。');advance(s,c);}
  else if(c.estate){s.estate.rent={lot:i,owner,amount:estateRent({config:c,state:s},i),tried:false};s.phase='rent';note(s,`到达${c.players[owner].name}的地块，租金${s.estate.rent.amount}金币待结算。`);}
  else{const rent=Math.min(p.cash,10+s.levels[i]*5);p.cash-=rent;s.players[owner].cash+=rent;note(s,`支付租金${rent}金币。`);advance(s,c);}
 }
 else if(c.kind==='estate'&&c.estate&&a.type==='BUY'&&a.yes===false&&s.owners[p.position]===-1){ensure(s.phase==='offer','当前没有地块可处理');const bidders=c.players.flatMap((_,i)=>s.estate.bankrupt[(s.turn+i)%c.players.length]?[]:[(s.turn+i)%c.players.length]);s.estate.auction={lot:p.position,activeBidderOrder:bidders,activeBidderIndex:0,passedPlayerIds:[],highestBid:0,highestBidderId:null,startPrice:10,minIncrement:5,ledger:[openingLedgerEntry(10)]};s.phase='auction';note(s,'放弃原价购买，地块进入公开竞拍；每位玩家均可出价。');}
 else if(c.kind==='estate'&&a.type==='BUY'){ensure(s.phase==='offer','当前没有地块可处理');const i=p.position;ensure(typeof a.yes==='boolean','请选择购买或跳过');if(a.yes){const own=s.owners[i]===s.turn,cost=own?20:price(i);if(own)ensure(!buildReason({config:c,state:s},i),buildReason({config:c,state:s},i));ensure(p.cash>=cost&&(!own||s.levels[i]<3),'金币不足或已达最高等级');p.cash-=cost;if(own)s.levels[i]++;else s.owners[i]=s.turn;note(s,own?'地块升级。':'购入地块。');}if(wealth(s,s.turn)>=(c.estate?.target??300))finish(s,`净资产达到${c.estate?.target??300}，经营成功！`,[s.turn]);else advance(s,c);}
 else if(c.kind==='estate'&&c.estate&&['BID','PASS_BID'].includes(a.type)){
  ensure(s.phase==='auction'&&s.estate.auction,'当前没有竞拍');const auction=s.estate.auction,bidder=auction.activeBidderOrder[auction.activeBidderIndex];ensure(a.target===bidder&&!auction.passedPlayerIds.includes(bidder),'请由当前竞拍人操作');
  if(a.type==='BID'){ensure(num(a.price,1,1000000),'出价必须为整数');const reason=bidBlockedReason(auction,s.players[bidder].cash,a.price);ensure(!reason,reason);auction.highestBid=a.price;auction.highestBidderId=bidder;auction.ledger=appendAuctionEntry(auction,{kind:'bid',playerId:bidder,amount:a.price});note(s,`${c.players[bidder].name}出价${a.price}金币。`);}
  else{auction.passedPlayerIds.push(bidder);auction.ledger=appendAuctionEntry(auction,{kind:'pass',playerId:bidder,amount:0});note(s,`${c.players[bidder].name}退出本次竞拍。`);}
  const remaining=auction.activeBidderOrder.filter(i=>!auction.passedPlayerIds.includes(i));
  if(!remaining.length||remaining.length===1&&auction.highestBidderId!==null){const winner=auction.highestBidderId;if(winner!==null){s.players[winner].cash-=auction.highestBid;s.owners[auction.lot]=winner;note(s,`${c.players[winner].name}以${auction.highestBid}金币竞得${lotNames[auction.lot]}。`);}else note(s,'所有人放弃竞拍，地块仍归银行。');s.estate.auction=null;advance(s,c);}
  else auction.activeBidderIndex=nextActiveBidderIndex(auction);
 }
 else if(c.kind==='estate'&&c.estate&&a.type==='CLAIM_REWARD'){ensure(s.phase==='reward'&&s.estate.reward,'当前没有奖励');const reward=s.estate.reward;if(reward.type==='pass'&&s.estate.passes[s.turn]<3)s.estate.passes[s.turn]++;else if(reward.type==='redraw'&&s.estate.redraws[s.turn]<3)s.estate.redraws[s.turn]++;else p.cash+=reward.cash;s.estate.reward=null;note(s,'奖励已领取。');advance(s,c);}
 else if(c.kind==='estate'&&c.estate&&a.type==='PREVIEW_CONTRACT'){
  ensure(s.phase==='contract'&&!s.estate.contract,'本次合约已展示任务，不能重新抽取');previewContract(s,c);note(s,'本次可选任务已展示；尚未接受合约，也未扣款。');
 }
 else if(c.kind==='estate'&&c.estate&&a.type==='SELECT_CONTRACT_TASK'){
  ensure(s.phase==='contract'&&s.estate.contract&&num(a.index,0,s.estate.contract.tasks.length-1),'请选择本次展示的合约任务');s.estate.contract.selected=a.index;note(s,`已选择任务${a.index+1}；确认回报后才接受合约。`);
 }
 else if(c.kind==='estate'&&c.estate&&a.type==='CONTRACT'){
  ensure(s.phase==='contract'&&['cash','pass','redraw','coop','risk','skip'].includes(a.method),'请选择合约');
  if(a.method==='skip'){note(s,'本轮不接受合约。');advance(s,c);}
  else{if(a.method==='coop')ensure(num(a.target,0,c.players.length-1)&&a.target!==s.turn&&!s.estate.bankrupt[a.target]&&a.partnerAccepted===true,'合作需要另一位玩家明确同意');const contract={kind:'event',reward:['pass','redraw'].includes(a.method)?a.method:'cash',cash:a.method==='risk'?30:a.method==='coop'?10:15,...(a.method==='risk'?{risk:true}:{}),...(a.method==='coop'?{partner:a.target}:{})};const text=s.estate.contract?s.estate.contract.tasks[s.estate.contract.selected]:draw(s,c);if(s.estate.contract!==undefined)s.estate.contract=null;task(s,c,text,0,{category:a.method==='coop'?'合作委托':a.method==='risk'?'风险合约':'选择合约',estate:contract});}
 }
 else if(c.kind==='estate'&&c.estate&&a.type==='REDRAW_TASK'){
  ensure(s.phase==='task'&&s.pending?.estate&&s.estate.redraws[s.turn]>0,'当前不能使用换题券');const t=s.pending;s.estate.redraws[s.turn]--;task(s,c,draw(s,c),0,{category:t.category,estate:clone(t.estate)});note(s,'使用换题券，任务已更换；本次合约结算方式保留。');
 }
 else if(c.kind==='estate'&&c.estate&&a.type==='RENT'){
  ensure(s.phase==='rent'&&s.estate.rent,'当前没有待付租金');const r=s.estate.rent;
  if(a.method==='pay')payEstateRent(s,c,r.amount);
  else if(a.method==='pass'){ensure(s.estate.passes[s.turn]>0,'没有免租券');s.estate.passes[s.turn]--;s.estate.rent=null;note(s,'使用免租券，本次租金免除。');advance(s,c);}
  else if(a.method==='task'){ensure(c.estate.taskMode==='linked'&&!r.tried&&p.cash>=Math.ceil(r.amount/2),'本次不能再领取减租任务或金币不足');r.tried=true;task(s,c,s.estate.boundTasks[r.lot],0,{category:`${lotNames[r.lot]} · 减租任务`,estate:{kind:'rent'}});}
  else throw Error('请选择付租、任务或免租券');
 }
 else if(c.kind==='estate'&&c.estate&&['MORTGAGE','REDEEM'].includes(a.type)){ensure(['ready','rent','offer'].includes(s.phase)&&num(a.lot,1,map.size-1)&&s.owners[a.lot]===s.turn,'只能处理自己的经营地块');const g=estateGroup(a.lot,c);ensure(g&&g.lots.every(i=>s.levels[i]===0),'先出售同色街区全部建筑');s.estate.mortgaged??=Array(map.size).fill(false);const principal=Math.floor(price(a.lot)/2);if(a.type==='MORTGAGE'){ensure(!s.estate.mortgaged[a.lot],'已经抵押');s.estate.mortgaged[a.lot]=true;p.cash+=principal;note(s,`地块抵押，获得${principal}金币；暂停收租。`);}else{const cost=Math.ceil(principal*1.1);ensure(s.estate.mortgaged[a.lot]&&p.cash>=cost,'未抵押或赎回金币不足');p.cash-=cost;s.estate.mortgaged[a.lot]=false;note(s,`支付${cost}金币赎回地块，恢复收租。`);}}
 else if(c.kind==='estate'&&c.estate&&a.type==='BUILD'){ensure(s.phase==='ready'&&num(a.lot,1,map.size-1),'请在掷骰前建造');const reason=buildReason({config:c,state:s},a.lot);ensure(!reason,reason);p.cash-=20;s.levels[a.lot]++;note(s,`${lotNames[a.lot]}已建造，当前Lv${s.levels[a.lot]}。`);}
 else if(c.kind==='estate'&&c.estate&&['SELL_BUILDING','SELL_LOT'].includes(a.type)){
  ensure(['ready','rent','offer'].includes(s.phase)&&num(a.lot,1,map.size-1)&&s.owners[a.lot]===s.turn,'只能出售自己的资产');const g=estateGroup(a.lot,c);ensure(g,'请选择可经营地块');
  if(a.type==='SELL_BUILDING'){ensure(s.levels[a.lot]>0&&s.levels[a.lot]===Math.max(...g.lots.map(i=>s.levels[i])),'请先出售该街区较高等级的建筑');s.levels[a.lot]--;p.cash+=10;note(s,`出售${lotNames[a.lot]}一级建筑，收回10金币。`);}
  else{ensure(g.lots.every(i=>s.levels[i]===0),'请先售出同色街区的全部建筑');const value=s.estate.mortgaged?.[a.lot]?0:Math.floor(price(a.lot)/2);p.cash+=value;s.owners[a.lot]=-1;if(s.estate.mortgaged)s.estate.mortgaged[a.lot]=false;note(s,`${lotNames[a.lot]}售回银行，收回${value}金币。`);}
 }
 else if(c.kind==='estate'&&c.estate&&a.type==='BIND_TASK'){ensure(c.estate.taskMode==='linked'&&s.phase==='ready'&&num(a.lot,1,map.size-1)&&s.owners[a.lot]===s.turn&&num(a.index,0,c.pool.length-1),'请为自己的地块选择题库中的任务');s.estate.boundTasks[a.lot]=c.pool[a.index];note(s,`${lotNames[a.lot]}的地块任务已更新。`);}
 else if(c.kind==='estate'&&c.estate&&a.type==='BANKRUPT'){
  ensure(s.phase==='rent'&&s.estate.rent&&p.cash<s.estate.rent.amount,'只有无法支付租金时才能退出结算');const owner=s.estate.rent.owner;
  s.players[owner].cash+=p.cash;s.owners.forEach((v,i)=>{if(v===s.turn){s.players[owner].cash+=s.levels[i]*10;s.levels[i]=0;s.owners[i]=owner;}});p.cash=0;s.estate.passes[s.turn]=0;s.estate.redraws[s.turn]=0;s.estate.bankrupt[s.turn]=true;s.estate.rent=null;const remaining=s.estate.bankrupt.flatMap((v,i)=>v?[]:[i]);if(remaining.length===1)finish(s,'其他玩家退出经营，最后一位玩家获胜。',remaining);else{note(s,`${c.players[s.turn].name}退出经营，剩余资产交付债权人。`);advance(s,c);}
 }
 else if(c.kind==='estate'&&a.type==='TRADE'){const reason=tradeReason({config:c,state:s},a.lot,a.target,a.price);ensure(!reason,reason);s.trade={seller:s.turn,buyer:a.target,lot:a.lot,price:a.price};s.phase='trade';note(s,'等待买方确认交易。');}
 else if(c.kind==='estate'&&a.type==='ACCEPT'){ensure(s.phase==='trade'&&s.trade&&typeof a.yes==='boolean','当前没有交易');const t=s.trade;if(a.yes){ensure(s.players[t.buyer].cash>=t.price&&s.owners[t.lot]===t.seller,'资产状态已改变');s.players[t.buyer].cash-=t.price;s.players[t.seller].cash+=t.price;s.owners[t.lot]=t.buyer;note(s,'交易完成。');}else note(s,'买方拒绝交易。');s.trade=null;s.phase='ready';const won=s.players.map((_,i)=>i).filter(i=>wealth(s,i)>=(c.estate?.target??300));if(won.length)finish(s,`净资产达到${c.estate?.target??300}，经营成功！`,won);}
 else throw Error('当前玩法不支持这项操作');
 if(c.kind==='mystery'&&a.type==='ANSWER'&&c.rounds)s.moves=input.state.moves+1;
 afterEffectRules(s,c,a,input.state,ruleLabels);
 if(c.kind==='estate'&&s.phase==='finished'&&s.ending==='本局结束，按成绩结算。')s.winners=leaders(s,true);
 if(c.kind==='estate'&&s.phase!=='finished'&&!s.pending){const winners=s.players.flatMap((_,i)=>wealth(s,i)>=(c.estate?.target??300)?[i]:[]);if(winners.length)finish(s,`净资产达到${c.estate?.target??300}，经营成功！`,winners);}
 if(s.effects!==undefined&&completedEffectTurn(input.state,s,a,c.kind))s.effectTurns=(s.effectTurns??0)+1;
 if(c.rounds&&['story','bingo','mystery'].includes(c.kind)&&s.moves>=c.rounds*c.players.length&&s.phase!=='finished')finish(s,c.kind==='mystery'?'达到设定答题轮数，本局结束。':'达到设定回合数，本局结束。',c.kind==='bingo'?leaders(s):[]);
 return validateArcade({...input,state:s});
}
export function validateArcade(v){
 ensure(v&&v.format==='interactive-game-save'&&v.version===1,'互动游戏存档版本不正确');const c=v.config,s=v.state;ensure(c&&ARCADE_MODES.some(m=>m.id===c.kind),'玩法不正确');ensure(Array.isArray(c.players)&&num(c.players.length,2,4)&&c.players.every(p=>str(p.name,24)&&/^#[0-9a-f]{6}$/i.test(p.color)),'玩家设置不正确');ensure(Array.isArray(c.pool)&&num(c.pool.length,1,2000)&&c.pool.every(t=>str(t,1000))&&c.pool.reduce((n,t)=>n+t.length,0)<=400000&&typeof c.customPool==='boolean','题库不正确');ensure(Array.isArray(c.puzzles)&&num(c.puzzles.length,1,20)&&c.puzzles.every(p=>str(p.label,40)&&str(p.clue,500)&&str(p.answer,100)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1),'场景线索不正确');ensure(c.scene===undefined||typeof c.scene==='string'&&c.scene.length<=750000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(c.scene),'场景图片不正确');
 ensure(c.poolName===undefined||str(c.poolName,100),'题库名称不正确');
 ensure(c.library===undefined||['image','recommended','custom'].includes(c.library),'题库类型不正确');
 if(c.estate!==undefined)ensure(c.kind==='estate'&&['linked','events','off'].includes(c.estate.taskMode)&&num(c.estate.target,300,1000)&&num(c.estate.rounds,1,99)&&(c.estate.mapSize===undefined||ESTATE_MAP_SIZES.includes(c.estate.mapSize)),'街区规则不正确');
 ensure(c.sourceTexts===undefined||c.sourceTexts&&typeof c.sourceTexts==='object'&&!Array.isArray(c.sourceTexts)&&Object.keys(c.sourceTexts).length<=2000&&Object.entries(c.sourceTexts).every(([text,original])=>c.pool.includes(text)&&str(original)),'任务原文关联不正确');
 ensure(c.story===undefined||c.kind==='story'&&num(c.story.chapters,1,20)&&num(c.story.detours,0,c.story.chapters),'剧情地图参数不正确');
 ensure(c.rounds===undefined||num(c.rounds,1,99),'回合参数不正确');
 ensure(c.bingo===undefined||c.kind==='bingo'&&BINGO_SIZES.includes(c.bingo.size)&&num(c.bingo.goalLines,1,3),'宾果地图或连线目标不正确');
 ensure(c.creative===undefined||c.creative===true&&c.kind!=='estate'&&c.players.length===2,'创意玩法设置不正确');
 const map=estateMap(c),bingoCells=c.kind==='bingo'?bingoSide(c)**2:9;
 const phases={spinner:['ready','task',...(c.creative?['pick']:[])],cards:['ready','task'],coop:['ready','task'],story:['choice','task'],bingo:['ready','task'],vote:['ballot','reveal','task'],mystery:['ready',...(c.creative?['task']:[])],estate:['ready','task','offer','trade',...(c.estate?['rent','reward','contract','auction']:[])]};
 function check(st,nested=false){ensure(st&&num(st.revision,0,1e9)&&num(st.seed,1,0xffffffff)&&num(st.turn,0,c.players.length-1)&&[...phases[c.kind],'finished'].includes(st.phase)&&num(st.moves,0,1e6),'对局状态不正确');ensure(st.effectTurns===undefined||num(st.effectTurns,0,1e9),'持续卡行动计数不正确');validateEffects(st.effects,c.players.map((_,i)=>String(i)),st.effectTurns??0,{kind:c.kind,creative:!!c.creative,estate:!!c.estate,puzzleCount:c.puzzles.length});validateEffectDeck(st,{kind:c.kind,creative:!!c.creative,estate:!!c.estate,counter:st.effectTurns??0});ensure(Array.isArray(st.players)&&st.players.length===c.players.length,'玩家数量不一致');st.players.forEach(p=>{ensure(num(p.score,0,1e6)&&num(p.cash,0,1e6)&&num(p.position,0,map.size-1)&&[0,2].includes(p.boost)&&typeof p.shield==='boolean','玩家成绩不正确');ensure(Array.isArray(p.hand)&&p.hand.length<=3&&p.hand.every(h=>['mission','boost','shield','swap'].includes(h.type)&&str(h.text))&&Array.isArray(p.bingo)&&p.bingo.length<=bingoCells&&p.bingo.every(t=>str(t))&&Array.isArray(p.done)&&p.done.length===bingoCells&&p.done.every(b=>typeof b==='boolean'),'手牌或宾果数据不正确');ensure(c.kind!=='cards'||p.hand.length===3,'手牌数量不正确');ensure(c.kind!=='bingo'||p.bingo.length===bingoCells,'宾果格数不正确');});
 ensure(typeof st.storySave==='string'&&(c.kind==='story'||st.storySave===''),'剧情存档不正确');if(c.kind==='story')verifyStorySave(st.storySave,st.node,storyMap(c)[st.node]?.options?.map(o=>o.label)??(storyMap(c)[st.node]?.task?['继续旅程']:[]),c);ensure(Array.isArray(st.bag)&&new Set(st.bag).size===st.bag.length&&st.bag.every(i=>num(i,0,c.pool.length-1)),'抽取记录不正确');ensure(num(st.stage,0,c.kind==='mystery'?c.puzzles.length:c.kind==='coop'?c.rounds??8:8)&&num(st.sector,0,5)&&Object.hasOwn(c.kind==='story'?storyMap(c):STORY,st.node)&&num(st.trust,0,1e6)&&num(st.round,0,c.rounds??5)&&num(st.voter,0,c.players.length)&&num(st.hints,0,1e6)&&num(st.dice,0,6),'玩法进度不正确');ensure(Array.isArray(st.votes)&&st.votes.length===c.players.length&&st.votes.every(n=>num(n,0,c.players.length))&&st.votes.reduce((a,b)=>a+b,0)===st.voter,'投票数据不正确');if(c.kind==='vote'){ensure(st.phase!=='ballot'||st.voter<c.players.length&&st.turn===st.voter,'投票回合不正确');ensure(st.phase!=='reveal'||st.voter===c.players.length,'投票尚未完成');}
 if(st.phase!=='finished'){if(c.kind==='mystery')ensure(st.stage<c.puzzles.length,'解谜已经结束');if(c.kind==='coop')ensure(st.stage<(c.rounds??8),'合作闯关已经结束');if(c.kind==='vote')ensure(st.round<(c.rounds??5),'投票已经结束');if(c.kind==='story'&&st.phase==='choice')ensure(storyMap(c)[st.node]?.options,'剧情没有可选分支');}
 ensure(Array.isArray(st.owners)&&st.owners.length===map.size&&st.owners.every(n=>num(n,-1,c.players.length-1))&&map.tiles.every((t,i)=>t.kind==='property'||st.owners[i]===-1)&&Array.isArray(st.levels)&&st.levels.length===map.size&&st.levels.every(n=>num(n,0,3)),'地块数据不正确');
 ensure(st.owners.every((owner,i)=>owner>=0||st.levels[i]===0),'未购地块不能升级');if(st.phase==='offer')ensure(c.kind==='estate'&&map.tiles[st.players[st.turn].position].kind==='property'&&[-1,st.turn].includes(st.owners[st.players[st.turn].position]),'地块不能购买或升级');
 if(c.estate){const e=st.estate;ensure(e?.mortgaged===undefined||Array.isArray(e.mortgaged)&&e.mortgaged.length===map.size&&e.mortgaged.every((v,i)=>typeof v==='boolean'&&(!v||st.owners[i]>=0&&estateGroup(i,c)?.lots.every(j=>st.levels[j]===0))),'抵押状态不正确');ensure(e&&Array.isArray(e.passes)&&e.passes.length===c.players.length&&e.passes.every(v=>num(v,0,3))&&Array.isArray(e.redraws)&&e.redraws.length===c.players.length&&e.redraws.every(v=>num(v,0,3))&&Array.isArray(e.bankrupt)&&e.bankrupt.length===c.players.length&&e.bankrupt.every(v=>typeof v==='boolean')&&e.bankrupt.some(v=>!v),'经营状态不正确');ensure(st.phase==='finished'||!e.bankrupt[st.turn],'已退出的玩家不能继续行动');ensure(Array.isArray(e.boundTasks)&&e.boundTasks.length===map.size&&e.boundTasks.every((t,i)=>c.estate.taskMode==='linked'&&estateGroup(i,c)?str(t)&&c.pool.includes(t):t===null),'地块任务不正确');ensure(e.bankrupt.every((v,i)=>!v||st.players[i].cash===0&&e.passes[i]===0&&e.redraws[i]===0&&!st.owners.includes(i)),'退出玩家资产未结算');for(const g of map.groups){const hasBuildings=g.lots.some(i=>st.levels[i]>0);ensure(!hasBuildings||g.lots.every(i=>st.owners[i]===st.owners[g.lots[0]]&&st.owners[i]>=0)&&Math.abs(st.levels[g.lots[0]]-st.levels[g.lots[1]])<=1,'建筑必须属于完整街区并均匀建造');}
  if(e.auction!==null){const a=e.auction;ensure(st.phase==='auction'&&num(a.lot,1,map.size-1)&&estateGroup(a.lot,c)&&a.lot===st.players[st.turn].position&&st.owners[a.lot]===-1&&a.startPrice===10&&a.minIncrement===5&&num(a.highestBid,0,1000000)&&Array.isArray(a.activeBidderOrder)&&num(a.activeBidderOrder.length,1,c.players.length)&&new Set(a.activeBidderOrder).size===a.activeBidderOrder.length&&a.activeBidderOrder.every(i=>num(i,0,c.players.length-1)&&!e.bankrupt[i])&&num(a.activeBidderIndex,0,a.activeBidderOrder.length-1)&&Array.isArray(a.passedPlayerIds)&&new Set(a.passedPlayerIds).size===a.passedPlayerIds.length&&a.passedPlayerIds.every(i=>a.activeBidderOrder.includes(i))&&!a.passedPlayerIds.includes(a.activeBidderOrder[a.activeBidderIndex]),'竞拍状态不正确');ensure(a.highestBidderId===null?a.highestBid===0:a.activeBidderOrder.includes(a.highestBidderId)&&!a.passedPlayerIds.includes(a.highestBidderId)&&a.highestBid>=a.startPrice&&a.highestBid<=st.players[a.highestBidderId].cash,'竞拍最高出价不正确');ensure(Array.isArray(a.ledger)&&num(a.ledger.length,1,30)&&a.ledger.every(v=>['start','bid','pass'].includes(v.kind)&&(v.playerId===null?v.kind==='start':a.activeBidderOrder.includes(v.playerId))&&num(v.amount,0,1000000)),'竞拍记录不正确');}else ensure(st.phase!=='auction','缺少竞拍');
  if(st.phase==='contract')ensure(c.estate.taskMode!=='off'&&map.tiles[st.players[st.turn].position].kind==='contract','合约落点不正确');
  if(e.contract!==undefined&&e.contract!==null){const preview=e.contract;ensure(st.phase==='contract'&&Array.isArray(preview.tasks)&&preview.tasks.length===Math.min(2,new Set(c.pool).size)&&new Set(preview.tasks).size===preview.tasks.length&&preview.tasks.every(t=>c.pool.includes(t))&&num(preview.selected,0,preview.tasks.length-1),'合约任务预览不正确');}
  if(e.reward!==null){ensure(st.phase==='reward'&&c.estate.taskMode!=='off'&&map.tiles[st.players[st.turn].position].kind==='reward'&&['cash','pass','redraw'].includes(e.reward.type)&&e.reward.cash===20,'奖励状态不正确');}else ensure(st.phase!=='reward','缺少奖励');
  if(e.rent!==null){const r=e.rent;ensure(['rent','task'].includes(st.phase)&&num(r.lot,1,map.size-1)&&r.lot===st.players[st.turn].position&&num(r.owner,0,c.players.length-1)&&r.owner!==st.turn&&st.owners[r.lot]===r.owner&&!e.bankrupt[r.owner]&&num(r.amount,1,100)&&r.amount===estateRent({config:c,state:st},r.lot)&&typeof r.tried==='boolean','租金账单不正确');ensure(st.phase!=='task'||st.pending?.estate?.kind==='rent','租金任务不一致');}else ensure(st.phase!=='rent'&&st.pending?.estate?.kind!=='rent','缺少租金账单');
 }else ensure(st.estate===undefined,'旧局不能混入新经营状态');
 validateCreative(c,st);
 ensure(Array.isArray(st.winners)&&new Set(st.winners).size===st.winners.length&&st.winners.every(i=>num(i,0,c.players.length-1))&&typeof st.ending==='string'&&st.ending.length<=1000&&(st.phase==='finished'||st.winners.length===0),'结算不正确');ensure(typeof st.message==='string'&&st.message.length<=1000&&typeof st.question==='string'&&st.question.length<=1000&&Array.isArray(st.log)&&st.log.length<=30&&st.log.every(t=>str(t)),'消息记录不正确');
 if(st.phase==='task'){const t=st.pending;ensure(t&&str(t.text)&&num(t.points,0,3)&&num(t.duration,1,86400)&&(t.endsAt===null||num(t.endsAt,0,10_000_000_100_000)),'任务不正确');ensure(validTaskCount(t),'任务计次不正确');ensure(validPause(t.duration,t.endsAt,t.pausedRemaining),'暂停计时不正确');if(t.estate!==undefined){ensure(c.estate&&['rent','event','penalty'].includes(t.estate.kind),'经营任务不正确');if(t.estate.kind==='rent')ensure(c.estate.taskMode==='linked'&&st.estate.rent?.tried&&st.players[st.turn].cash>=Math.ceil(st.estate.rent.amount/2),'减租任务条件不正确');else if(t.estate.kind==='penalty')ensure(c.estate.taskMode!=='off'&&map.tiles[st.players[st.turn].position].kind==='penalty'&&t.estate.fine===10,'惩罚结算不正确');else ensure(c.estate.taskMode!=='off'&&map.tiles[st.players[st.turn].position].kind==='contract'&&['cash','pass','redraw'].includes(t.estate.reward)&&num(t.estate.cash,10,30)&&(t.estate.risk===undefined||t.estate.risk===true)&&((t.estate.risk===true&&t.estate.reward==='cash'&&t.estate.cash===30&&t.estate.partner===undefined)||(t.estate.partner!==undefined&&num(t.estate.partner,0,c.players.length-1)&&t.estate.partner!==st.turn&&!st.estate.bankrupt[t.estate.partner]&&t.estate.cash===10&&t.estate.reward==='cash'&&t.estate.risk===undefined)||(t.estate.partner===undefined&&t.estate.risk===undefined&&t.estate.cash===15)),'事件奖励不正确');}else ensure(!c.estate,'缺少经营任务结算');ensure(t.edited===undefined||typeof t.edited==='boolean','任务修改状态不正确');if(t.source!==undefined)ensure(num(t.source.image,1,27)&&str(t.source.cell,100)&&(t.source.reviewed===undefined||typeof t.source.reviewed==='boolean'),'任务来源不正确');if(c.kind==='vote')ensure((c.creative||c.library==='image')&&st.voter===c.players.length&&st.votes[st.turn]===Math.max(...st.votes)&&t.text===st.question,'投票任务不一致');if(c.kind==='bingo')ensure(num(t.cell,0,bingoCells-1)&&!st.players[st.turn].done[t.cell]&&t.text===st.players[st.turn].bingo[t.cell],'宾果任务不一致');if(c.kind==='cards')ensure(num(t.card,0,2)&&st.players[st.turn].hand[t.card].type==='mission'&&t.text===st.players[st.turn].hand[t.card].text,'任务牌不一致');if(c.kind==='story')ensure(c.creative&&t.creative?.style==='detour'?!!storyMap(c)[st.node].options&&t.next===undefined:storyMap(c)[st.node].task&&t.next===storyMap(c)[st.node].to,'剧情任务不一致');}else ensure(st.pending===null,'任务与阶段不一致');
 if(st.phase==='trade'){const t=st.trade;ensure(c.kind==='estate'&&t&&t.seller===st.turn&&num(t.buyer,0,c.players.length-1)&&t.buyer!==t.seller&&num(t.lot,1,map.size-1)&&st.owners[t.lot]===t.seller&&num(t.price,1,300)&&st.players[t.buyer].cash>=t.price&&!st.estate?.bankrupt[t.buyer]&&!st.estate?.mortgaged?.[t.lot]&&(!c.estate||estateGroup(t.lot,c)?.lots.every(i=>st.levels[i]===0)),'交易不正确');}else ensure(st.trade===null,'交易与阶段不一致');
 if(!nested){ensure(Array.isArray(st.undo)&&st.undo.length<=12,'撤销记录不正确');st.undo.forEach(u=>{ensure(!Object.hasOwn(u,'undo'),'撤销不能嵌套');check(u,true);});}}
 check(s);return clone(v);
}
export function parseArcade(source){ensure(typeof source==='string'&&source.length<=2_000_000,'存档最多2MB');let v;try{v=JSON.parse(source);}catch{throw Error('存档JSON格式不正确');}return validateArcade(v);}
