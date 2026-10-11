import {changeTaskCount} from './taskCount.js';
import {spireEffectBonus} from './spireEffects.js';
import {createNPC,nextNPCIntent,resolveNPCAction,resolveBattleCard,npcAttackTasks} from './npc.js';
import {applyTaskParameters,validateTaskPreferences} from './taskParameters.js';
import {taskDuration} from './taskTiming.js';
import {nextClock} from './taskClock.js';
import {applyEffectAction,directTaskEligible} from './ongoingEffects.js';
// Rules inspired by deckbuilding games; no upstream code or art is copied.
export const VERSIONS=[
 {id:'rps',name:'任务石头剪刀布',kind:'cards',rules:'石头胜剪刀、剪刀胜布、布胜石头。先做选中牌的任务再锁定，两人锁定后揭晓。'},
 {id:'limited',name:'限量猜拳',kind:'cards',rules:'每人石头、剪刀、布各3张；任务完成后消耗一张，九次打完补牌。'},
 {id:'ecard',name:'E卡对决',kind:'cards',rules:'皇帝胜平民、平民胜奴隶、奴隶胜皇帝。双方各4张平民和1张身份牌；平民平局继续。同一场不补牌，下一场交换身份；皇帝胜1分，奴隶胜3分。'},
 {id:'numbers',name:'数字博弈',kind:'cards',rules:'每人1至5各一张，大数得1分；1能胜5。相同平局，五次后补牌。每张牌都有任务代价。'},
 {id:'charge',name:'蓄力攻防',kind:'cards',rules:'蓄力加1能量；攻击花1能量，强攻花2能量。防守挡普通攻击，强攻破防；双方同攻互相抵消。命中得1分，每个动作先完成任务。'},
 {id:'preference',name:'三选一 · 猜最喜欢',kind:'vote',rules:'秘密选自己最喜欢的任务，再猜对方最喜欢哪一个。两人提交后揭晓：猜对得1分，猜错执行自己猜中的那张任务。'},
 {id:'spire',name:'双人尖塔 · 任务出牌',kind:'coop',rules:'两人共享生命和格挡，轮流抽5张牌、每回合3能量。先完成图片任务才能出牌；伤害、格挡、治疗随后结算。两人结束回合后敌人行动；未被格挡的攻击会点名下发任务，先处理才能进入下一轮。完成任务能抵消一半未格挡伤害，队友可花1能量代做；跳过则承受原攻击。过关选新牌加入牌组，选择普通、精英或休息路线。观察敌人预告，一人标记弱点、另一人进攻，或一起格挡压制。'}
];
export const BATTLE_CARDS=[
 {id:'strike',name:'斩击',cost:1,attack:6,block:0,heal:0,draw:0,desc:'造成6伤害'},
 {id:'guard',name:'守护',cost:1,attack:0,block:7,heal:0,draw:0,desc:'获得7点共享格挡'},
 {id:'heavy',name:'破阵',cost:2,attack:14,block:0,heal:0,draw:0,desc:'造成14伤害'},
 {id:'heal',name:'补给',cost:1,attack:0,block:0,heal:5,draw:0,desc:'恢复5点共享生命'},
 {id:'focus',name:'策划',cost:1,attack:0,block:3,heal:0,draw:2,desc:'获得3格挡，抽2张牌'},
 {id:'rally',name:'协同',cost:1,attack:4,block:4,heal:0,draw:0,desc:'造成4伤害，获得4格挡'},
 {id:'burst',name:'冲锋',cost:2,attack:10,block:6,heal:0,draw:0,desc:'造成10伤害，获得6格挡'},
 {id:'renew',name:'重整',cost:2,attack:0,block:5,heal:8,draw:0,desc:'恢复8生命，获得5格挡'},
 {id:'mark',name:'弱点标记',cost:1,attack:2,block:0,heal:0,draw:0,mark:2,desc:'造成2伤害；本轮接下来2张攻击牌各+3伤害，两人共用，敌人行动后清除'},
 {id:'riposte',name:'掩护反击',cost:1,attack:0,block:5,heal:0,draw:0,riposte:6,desc:'获得5共享格挡；本轮敌人行动时按实际格挡反击，最多6伤害并扣护甲，不叠加。队友的格挡也能配合'},
 {id:'dampen',name:'压制',cost:1,attack:2,block:0,heal:0,draw:0,weaken:4,desc:'造成2伤害；敌人本轮总攻击减少4，最多减少8，敌人行动后清除'}
];
const ensure=(v,m)=>{if(!v)throw Error(m);};
const int=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
export function random(s,n){let x=s.seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.seed=x>>>0;return Math.floor(s.seed/4294967296*n);}
function shuffle(s,a){const result=[...a];for(let i=result.length-1;i>0;i--){const j=random(s,i+1);[result[i],result[j]]=[result[j],result[i]];}return result;}
function task(s){if(!s.bag.length)s.bag=shuffle(s,s.config.pool.map((_,i)=>i));return s.config.pool[s.bag.pop()];}
function mission(s,text){const applied=applyTaskParameters(text,s.config.parameters);return {id:`task-${s.revision}-${random(s,1000000)}`,text:applied.text,original:s.config.sourceTexts?.[text]??text,duration:applied.duration??60,explicit:applied.duration!==undefined,endsAt:null};}
function claimMission(s,m){return {...structuredClone(m),id:`${m.id}-claim-${s.revision}`};}
function hand(s,actor){switch(s.config.variant){case 'ecard':return ['citizen','citizen','citizen','citizen',actor===s.match%2?'emperor':'slave'];case 'numbers':return ['1','2','3','4','5'];case 'limited':return ['rock','rock','rock','scissors','scissors','scissors','paper','paper','paper'];default:return ['rock','scissors','paper'];}}
function nextDeal(s){s.secret=[null,null];s.ready=[false,false];s.costs=s.hands.map((h,i)=>(s.config.variant==='charge'?movesFor(s,i):h).map(()=>mission(s,task(s))));s.options=s.config.variant==='preference'?shuffle(s,[...new Set(s.config.pool)]).slice(0,3):[];s.penalties=[null,null];s.phase='choose';s.result='';s.epoch++;}
export function createAdventure(config){
 ensure(config&&VERSIONS.some(v=>v.id===config.variant),'没有这个游戏版本');ensure(Array.isArray(config.players)&&config.players.length===2&&config.players.every(p=>typeof p==='string'&&p.trim()&&p.length<=24)&&config.players[0]!==config.players[1],'请输入两个不同的名字');ensure(Array.isArray(config.pool)&&config.pool.length>=1&&config.pool.length<=2000&&config.pool.every(t=>typeof t==='string'&&t.trim()&&t.length<=1000)&&config.pool.join('').length<=400000,'题库需要1至2000条任务');
 ensure(config.variant!=='preference'||new Set(config.pool).size>=3,'三选一需要至少3条不同题目');
 ensure(config.poolName===undefined||typeof config.poolName==='string'&&config.poolName.trim()&&config.poolName.length<=100,'题库名称不正确');
 ensure(config.sourceTexts===undefined||config.sourceTexts&&typeof config.sourceTexts==='object'&&!Array.isArray(config.sourceTexts)&&Object.keys(config.sourceTexts).length<=2000&&Object.entries(config.sourceTexts).every(([text,original])=>config.pool.includes(text)&&typeof original==='string'&&original.trim()&&original.length<=1000),'题目来源记录不正确');
 validateTaskPreferences(config.parameters??{});
 const settings={rounds:5,floors:5,difficulty:1,hp:30,enemyPatterns:'varied',enemyTasks:'on-hit',...config.settings};ensure(int(settings.rounds,1,config.variant==='ecard'?100:99)&&int(settings.floors,1,20)&&int(settings.difficulty,1,3)&&int(settings.hp,12,100),'开局参数超出范围');ensure(['varied','classic'].includes(settings.enemyPatterns),'请选择敌人打法');ensure(['on-hit','always','off'].includes(settings.enemyTasks),'请选择敌人任务规则');
 if(config.variant==='ecard'&&settings.rounds%2)settings.rounds++;
 const s={format:'paired-adventure',version:1,config:structuredClone({...config,settings}),revision:0,epoch:0,seed:config.seed>>>0||1973,phase:'choose',round:0,match:0,score:[0,0],energy:[0,0],hands:[[],[]],costs:[[],[]],secret:[null,null],ready:[false,false],options:[],penalties:[null,null],bag:[],effects:[],effectTurns:0,turn:0,result:'',log:[]};
 if(config.variant==='spire'){
  const starter=['strike','strike','strike','strike','guard','guard','riposte','heavy','heal','focus'];
  s.battle={hp:settings.hp,maxHp:settings.hp,block:0,floor:0,deck:[starter.slice(),starter.slice()],draw:[[],[]],discard:[[],[]],enemy:null,round:1,rewards:[],rewardActor:0,path:[],checkpoint:null,power:0,marked:0,weakened:0};s.phase='map';
 }else{s.hands=[hand(s,0),hand(s,1)];nextDeal(s);}return s;
}
export function cardName(id){return {rock:'石头',scissors:'剪刀',paper:'布',citizen:'平民',emperor:'皇帝',slave:'奴隶',charge:'蓄力',attack:'攻击',guard:'防守',heavy:'强攻'}[id]??BATTLE_CARDS.find(c=>c.id===id)?.name??id;}
export function movesFor(s,actor){if(s.config.variant==='charge')return ['charge','guard',...(s.energy[actor]>=1?['attack']:[]),...(s.energy[actor]>=2?['heavy']:[])];return s.hands[actor];}
function duel(s){const [a,b]=s.secret.map(v=>v.choice),variant=s.config.variant;let winner=-1;
 if(variant==='charge'){const before=s.energy.slice();for(let i=0;i<2;i++)s.energy[i]+=s.secret[i].choice==='charge'?1:s.secret[i].choice==='attack'?-1:s.secret[i].choice==='heavy'?-2:0;const hit=(own,other)=>['attack','heavy'].includes(own)&&!['attack','heavy'].includes(other)&&(other!=='guard'||own==='heavy');if(hit(a,b))winner=0;if(hit(b,a))winner=1;s.result=`${cardName(a)} 对 ${cardName(b)} · 能量 ${before.join('/')} → ${s.energy.join('/')}`;
 }else if(a!==b){if(variant==='ecard')winner=({emperor:'citizen',citizen:'slave',slave:'emperor'}[a]===b)?0:1;else if(variant==='numbers')winner=a==='1'&&b==='5'?0:b==='1'&&a==='5'?1:Number(a)>Number(b)?0:1;else winner=({rock:'scissors',scissors:'paper',paper:'rock'}[a]===b)?0:1;}
 if(variant==='ecard'||variant==='limited'||variant==='numbers')s.secret.forEach((v,i)=>s.hands[i].splice(v.index,1));
 const special=variant==='ecard'&&!(a==='citizen'&&b==='citizen');
 if(winner>=0)s.score[winner]+=variant==='ecard'&&s.secret[winner].choice==='slave'?3:1;
 s.result=`${s.result||`${cardName(a)} 对 ${cardName(b)}`} · ${winner<0?'平局':`${s.config.players[winner]}获胜`}`;s.round++;if(special)s.match++;
 s.phase='reveal';s.ecardContinue=variant==='ecard'&&!special;
}
function drawBattle(s,actor,count=5){const b=s.battle;s.hands[actor]=s.hands[actor]??[];for(let n=0;n<count;n++){if(!b.draw[actor].length){b.draw[actor]=shuffle(s,b.discard[actor]);b.discard[actor]=[];}if(b.draw[actor].length)s.hands[actor].push(b.draw[actor].pop());}s.costs[actor]=s.hands[actor].map((_,i)=>s.costs[actor][i]??mission(s,task(s)));}
function startFight(s,type){const b=s.battle;b.checkpoint={hp:b.hp,path:b.path.slice(),floor:b.floor};b.path.push(type);b.floor++;b.round=1;b.block=0;b.marked=0;b.weakened=0;b.riposte=0;delete b.assault;delete s.pending;s.turn=0;s.phase='battle';s.epoch++;
 b.enemy=createNPC(b.floor,s.config.settings.floors,type,s.config.settings.difficulty,s.config.settings.enemyPatterns??'classic');
 b.draw=b.deck.map(d=>shuffle(s,d));b.discard=[[],[]];s.hands=[[],[]];s.costs=[[],[]];s.energy=[3,3];drawBattle(s,0);drawBattle(s,1);s.result=`进入第${b.floor}层，遭遇${b.enemy.name}；由${s.config.players[0]}先行动。`;}
function battleWin(s){const b=s.battle;b.riposte=0;b.rewards=shuffle(s,BATTLE_CARDS.map(c=>c.id)).slice(0,3);b.rewardActor=0;s.phase='reward';s.result=`击败${b.enemy.name}，双方各选一张加入自己的牌组。`;}
function finishNPC(s,entries){const b=s.battle;s.result=resolveNPCAction(b);b.round++;s.effectTurns++;delete b.assault;delete s.pending;if(b.hp>0&&b.enemy.hp===0){entries.push(s.result);battleWin(s);}else if(b.hp===0||b.round>s.config.settings.rounds){entries.push(s.result);s.phase='defeat';s.result=b.hp===0?'队伍生命归零，可重试本层。':'本层回合上限已到，可重试或新开调整上限。';}else{s.turn=0;s.energy=[3,3];drawBattle(s,0);drawBattle(s,1);b.enemy.intent=nextNPCIntent(b.enemy,b.floor,b.round,s.config.settings.difficulty);}}
function nextAttackMission(s){const b=s.battle,m=b.assault.remaining.shift();s.pending={...m,targetActor:m.actor,kind:'npc',card:'npc',index:b.assault.completed};s.turn=m.actor;}
function beginNPC(s,entries){const b=s.battle,plan=npcAttackTasks(b,s.config.settings.enemyTasks??'off');if(!plan.length){finishNPC(s,entries);return;}b.assault={remaining:plan.map(p=>({...claimMission(s,mission(s,task(s))),...p})),completed:0,total:plan.length};nextAttackMission(s);s.result=`${b.enemy.name}发动${plan.length>1?'连击，双方分别':'点名攻击，'}需要应对任务。处理完全部攻击任务后才结算伤害并进入下一轮。`;}
export function adventureTransition(input,a,actor){
 ensure(int(actor,0,1)&&a&&typeof a.type==='string','操作不正确');ensure(a.epoch===undefined||a.epoch===input.epoch,'本题已更新，请刷新后重新操作');const s=structuredClone(input);s.revision++;
 const context={kind:s.config.variant==='spire'?'spire':VERSIONS.find(v=>v.id===s.config.variant).kind,creative:s.config.variant==='spire',estate:false};
 if(applyEffectAction(s,a,['0','1'],s.effectTurns,n=>random(s,n),context))return s;
 ensure(s.phase!=='finished','本局已结束');
 if(a.type==='TIMER'||a.type==='TASK_COUNT'){
  const m=s.config.variant==='spire'?(s.phase==='battle'&&s.pending?.actor===actor?s.pending:null):s.phase==='choose'&&!s.ready[actor]?s.secret[actor]?.task:s.phase==='reveal'?s.penalties[actor]:null;
  ensure(m,'只能操作自己当前待完成的任务');
  ensure(m.kind==='npc'||a.type==='TASK_COUNT'?a.taskId===m.id:a.taskId===undefined||a.taskId===m.id,'任务已更新，请查看当前任务');
  if(a.type==='TASK_COUNT'){changeTaskCount(m,a.countDelta);return s;}
  const clock=nextClock(m.duration,m.endsAt,m.pausedRemaining,a.now,a.timerMode);Object.assign(m,clock);if(clock.pausedRemaining===undefined)delete m.pausedRemaining;return s;
 }
 if(a.type==='COMPLETE'&&a.taskId!==undefined){
  const m=s.config.variant==='spire'?s.pending:s.phase==='choose'?s.secret[actor]?.task:s.penalties[actor];
  ensure(m&&a.taskId===m.id,'任务已更新，请查看当前任务');
 }
 // Only this action's outcomes enter the journal. Clock/effect operations above
 // preserve the last result; private decisions below never reveal a card early.
 s.result='';const entries=[];
 if(s.config.variant==='spire'){
  const b=s.battle;
  if(a.type==='PATH'){ensure(a.epoch!==undefined,'请选择当前层路线');ensure(s.phase==='map'&&['normal','elite','rest'].includes(a.path),'请选择下一层路线');if(a.path==='rest'&&b.floor<s.config.settings.floors-1){b.path.push('rest');b.floor++;s.epoch++;b.hp=Math.min(b.maxHp,b.hp+Math.ceil(b.maxHp/3));s.result='休息恢复生命，没有选牌奖励。';if(b.floor>=s.config.settings.floors)s.phase='finished';}else startFight(s,a.path==='rest'?'normal':a.path);}
  else if(a.type==='PLAY'){ensure(s.phase==='battle'&&actor===s.turn&&!s.pending&&int(a.index,0,s.hands[actor].length-1),'请由当前玩家选择手牌');const card=BATTLE_CARDS.find(c=>c.id===s.hands[actor][a.index]);ensure(s.energy[actor]>=card.cost,'能量不足');s.pending={...claimMission(s,s.costs[actor][a.index]),actor,index:a.index,card:card.id};s.result=`${s.config.players[actor]}领取${card.name}的代价任务；完成确认后才扣能量并出牌。`;}
  else if(a.type==='ASSIST'){ensure(s.phase==='battle'&&s.pending?.kind==='npc'&&s.pending.actor===s.pending.targetActor&&actor!==s.pending.actor,'当前没有可以援护的敌人任务');ensure(a.taskId===s.pending.id,'任务已更新，请查看当前任务');ensure(s.energy[actor]>=1,'援护需要1能量');s.energy[actor]--;s.pending.actor=actor;s.turn=actor;s.result=`${s.config.players[actor]}消耗1能量，替${s.config.players[s.pending.targetActor]}承担本次攻击任务。完成后获得相同格挡；任务和计时保持。`;}
  else if(a.type==='COMPLETE'&&s.pending?.kind==='npc'){ensure(s.phase==='battle'&&s.pending.actor===actor&&typeof a.done==='boolean','请由当前攻击任务的承担者确认');ensure(a.taskId===s.pending.id,'任务已更新，请查看当前任务');const m=s.pending,bonus=spireEffectBonus(s,actor),guard=m.guardGain+bonus.response;if(a.done)b.block+=guard;s.effectTurns++;b.assault.completed++;s.result=`${s.config.players[actor]}${a.done?`完成攻击任务，额外格挡${guard}${bonus.response?'（含持续卡+'+bonus.response+'）':''}`:'跳过攻击任务，本项不增加格挡'}。`;if(b.assault.remaining.length){nextAttackMission(s);s.result+=`轮到${s.config.players[s.pending.actor]}处理下一项。`;}else{entries.push(s.result);finishNPC(s,entries);}}
  else if(a.type==='COMPLETE'){ensure(s.phase==='battle'&&s.pending?.actor===actor&&typeof a.done==='boolean','没有待完成的出牌任务');const m=s.pending;delete s.pending;if(a.done){const card=BATTLE_CARDS.find(c=>c.id===m.card);s.energy[actor]-=card.cost;const hp=b.hp,block=b.block,bonus=spireEffectBonus(s,actor),damage=resolveBattleCard(b,card);if(card.block>0)b.block+=bonus.block;if(card.heal>0)b.hp=Math.min(b.maxHp,b.hp+bonus.heal);b.discard[actor].push(s.hands[actor].splice(m.index,1)[0]);s.costs[actor].splice(m.index,1);if(card.draw)drawBattle(s,actor,card.draw);s.effectTurns++;s.result=`${s.config.players[actor]}完成代价，打出${card.name}：消耗${card.cost}能量，造成${damage}伤害，获得${b.block-block}格挡，恢复${b.hp-hp}生命。`;if(b.enemy.hp===0){entries.push(s.result);battleWin(s);}}else s.result=`${s.config.players[actor]}取消出牌；这张牌和能量保留。`;}
  else if(a.type==='END_TURN'){ensure(s.phase==='battle'&&actor===s.turn&&!s.pending,'先处理当前任务才能结束回合');b.discard[actor].push(...s.hands[actor]);s.hands[actor]=[];s.costs[actor]=[];if(actor===0){s.turn=1;s.result=`${s.config.players[0]}结束回合，轮到${s.config.players[1]}；共享格挡保留，敌人暂不行动。`;}else beginNPC(s,entries);}
  else if(a.type==='REWARD'){ensure(s.phase==='reward'&&actor===b.rewardActor&&int(a.index,0,2),'轮到另一人选牌');const reward=BATTLE_CARDS.find(c=>c.id===b.rewards[a.index]);b.deck[actor].push(reward.id);s.result=`${s.config.players[actor]}将${reward.name}加入牌组`;if(actor===0){b.rewardActor=1;s.result+=`；轮到${s.config.players[1]}选牌。`;}else{const hp=b.hp,power=b.power??0;b.hp=Math.min(b.maxHp,b.hp+3);if(b.enemy.elite)b.power=Math.min(3,power+1);s.result+=`；队伍恢复${b.hp-hp}生命${b.power>power?`，永久攻击强化+${b.power-power}`:''}。`;s.phase=b.floor>=s.config.settings.floors?'finished':'map';if(s.phase==='finished'){entries.push(s.result);s.result='双人尖塔通关！牌组、路线与成绩已保存。';}else s.result+='可选择下一层路线。';}}
  else if(a.type==='RETRY'){ensure(s.phase==='defeat'&&b.checkpoint,'当前不能重试');const type=b.path.at(-1);b.hp=b.checkpoint.hp;b.floor=b.checkpoint.floor;b.path=b.checkpoint.path.slice();startFight(s,type);s.result=`重试第${b.floor}层，恢复进入本层时的生命；遭遇${b.enemy.name}。`;}
  else if(a.type==='END'){s.phase='finished';delete s.pending;delete b.assault;s.result='已结束本局。';}
  else throw Error('当前不能执行这个操作');
 }else if(a.type==='SELECT'){
  ensure(s.phase==='choose'&&!s.ready[actor],'已经锁定或还没有开始本题');if(s.config.variant==='preference'){ensure(int(a.favorite,0,2)&&int(a.guess,0,2),'请选择自己的最爱和对方的最爱');s.secret[actor]={favorite:a.favorite,guess:a.guess};s.ready[actor]=true;s.result=`${s.config.players[actor]}已秘密提交，等待对方选择。`;if(s.ready.every(Boolean)){s.phase='reveal';s.secret.forEach((v,i)=>{if(v.guess===s.secret[1-i].favorite)s.score[i]++;else s.penalties[i]=mission(s,s.options[v.guess]);});s.round++;s.result='选择已揭晓，猜错者领取自己猜中的那张任务。';}}
  else{const moves=movesFor(s,actor);ensure(int(a.index,0,moves.length-1),'请选择可用的牌');s.secret[actor]={choice:moves[a.index],index:a.index,task:claimMission(s,s.costs[actor][a.index])};s.result=`${s.config.players[actor]}领取出牌代价任务，完成后才锁定。`;}
 }else if(a.type==='COMPLETE'){
  ensure(typeof a.done==='boolean','请选择完成或取消');if(s.phase==='choose'){ensure(s.secret[actor]?.task&&!s.ready[actor],'没有待完成的出牌任务');if(a.done){s.ready[actor]=true;s.effectTurns++;s.result=`${s.config.players[actor]}完成代价并秘密锁定，等待对方。`;if(s.ready.every(Boolean)){s.result='';duel(s);}}else{s.secret[actor]=null;s.result='已取消，这张牌没有锁定。';}}
  else{ensure(s.phase==='reveal'&&s.penalties[actor],'当前没有待处理惩罚');s.penalties[actor]=null;s.effectTurns++;s.result=a.done?'任务完成。':'已记录本题任务跳过。';}
 }else if(a.type==='NEXT'){
  ensure(a.epoch!==undefined,'下一题需要当前题号');
  ensure(s.phase==='reveal'&&s.penalties.every(p=>p===null),'先处理本题待执行的任务');const finished=s.config.variant==='ecard'?s.match>=s.config.settings.rounds:s.round>=s.config.settings.rounds;
  if(finished){s.phase='finished';s.result=`本局结束 · ${s.score[0]===s.score[1]?'平局':`${s.config.players[s.score[0]>s.score[1]?0:1]}获胜`}`;}else{if(s.config.variant==='ecard'&&!s.ecardContinue||['limited','numbers'].includes(s.config.variant)&&s.hands[0].length===0)s.hands=[hand(s,0),hand(s,1)];nextDeal(s);s.result='已开始下一题，双方重新秘密选择。';}
 }else if(a.type==='END'){s.phase='finished';s.result='已结束本局，保留成绩。';}else throw Error('当前不能执行这个操作');
 if(s.result)entries.push(s.result);s.log=[...s.log,...entries].slice(-30);return s;
}
// Server snapshots are role filtered. Never ship the peer's private decision in polling JSON.
export function adventureView(s,actor){const view=structuredClone(s);delete view.bag;delete view.seed;view.config={...view.config,poolSize:s.config.pool.length,directPool:s.config.pool.filter(text=>directTaskEligible(applyTaskParameters(text,s.config.parameters).text)),pool:[]};if(s.phase==='choose'){view.secret[1-actor]=null;view.costs[1-actor]=[];}return view;}
