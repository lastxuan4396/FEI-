import {taskParameters,applyTaskParameters,TASK_COUNT_UNITS} from './taskParameters.js';
import {taskDuration,taskNumber} from './taskTiming.js';
import {effectCard,effectCardText,availableEffectCards,canUseEffectCard} from './effectCards.js';
import {nextClock,validPause} from './taskClock.js';
import {diceFormulaAmount} from './diceFormula.js';
export const isOngoingText=text=>typeof text==='string'&&/([Xx×＊*]|[一二两三四五六七八九十百\d]+)(?:行动回合|回合|轮)|直到.*(?:终点|结束)|终点前|到终点前|下[一二三\d]*轮|持续.*(?:分钟|回合|轮)/.test(text.replace(/\s/g,''));
const assert=(v,m)=>{if(!v)throw Error(m);};
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const amountLimit=unit=>unit==='seconds'?86400:unit==='count'?9999:99;
const sameTargets=(a,b)=>a.length===b.length&&a.every(id=>b.includes(id));
function validFormula(f,unit){return f&&['turn','round','seconds','count'].includes(unit)&&integer(f.factor,1,86400)&&integer(f.offset,0,86400)&&(f.cap===undefined||integer(f.cap,1,amountLimit(unit)))&&[1,6].every(n=>integer(diceFormulaAmount(f,n),1,amountLimit(unit)));}
export function validateEffects(effects,ids,counter,context={}){
 if(effects===undefined)return;
 assert(Array.isArray(effects)&&effects.length<=12,'持续效果最多12项');const seen=new Set();
 for(const e of effects){assert(e&&typeof e.id==='string'&&e.id.length<=100&&!seen.has(e.id),'持续效果编号不正确');seen.add(e.id);
 assert(e.original===undefined||typeof e.original==='string'&&e.original.length<=1000,'持续卡原文不正确');assert(typeof e.text==='string'&&e.text.trim()&&e.text.length<=1000,'持续卡文字不正确');assert(Array.isArray(e.targets)&&e.targets.length>0&&e.targets.length<=ids.length&&new Set(e.targets).size===e.targets.length&&e.targets.every(id=>ids.includes(id)),'持续效果玩家不正确');
 assert(['turn','round','seconds','game','count'].includes(e.unit)&&integer(e.amount,1,e.unit==='seconds'?86400:e.unit==='count'?9999:99),'持续效果时长不正确');
 if(e.dice!==undefined)assert(e.cardId===undefined&&validFormula(e.dice,e.unit)&&integer(e.dice.value,1,6)&&e.amount===diceFormulaAmount(e.dice,e.dice.value),'持续效果骰点或倍率不正确');
 if(e.unit==='count')assert(integer(e.progress,0,e.amount)&&TASK_COUNT_UNITS.some(u=>u.toLowerCase()===e.countUnit?.toLowerCase()),'计次卡进度或单位不正确');else assert(e.progress===undefined&&e.countUnit===undefined,'非计次卡不能带计次进度');
 if(e.cardId!==undefined){const card=effectCard(e.cardId);assert(canUseEffectCard(card,context.kind,context.creative,context.estate)&&e.text===effectCardText(card)&&e.unit===card.unit&&e.amount===card.amount,'持续卡规则与本局不匹配');assert(e.lastUsedCounter===undefined||integer(e.lastUsedCounter,0,counter),'持续卡使用记录不正确');assert(e.lastUsedStage===undefined||integer(e.lastUsedStage,0,(context.puzzleCount??3)-1),'持续卡线索记录不正确');}else assert(e.lastUsedCounter===undefined&&e.lastUsedStage===undefined,'自定义卡不能带自动使用记录');
 assert(integer(e.startedCounter,0,counter+(e.deferCurrent===true?1:0))&&(e.deferCurrent===undefined||e.deferCurrent===true),'持续效果回合不正确');
 if(e.unit==='seconds')assert((e.endsAt===null||integer(e.endsAt,0,10_000_172_800_000))&&validPause(e.amount,e.endsAt,e.pausedRemaining),'持续效果计时不正确');else assert(e.endsAt===null&&e.pausedRemaining===undefined,'回合卡不能使用时间计时');
 }
}
export function effectRemaining(e,counter,playerCount,now,finished=false){
 if(e.unit==='count')return Math.max(0,e.amount-(e.progress??0));
 if(finished&&['turn','round','game'].includes(e.unit))return 0;
 if(e.unit==='game')return finished?0:1;
 if(e.unit==='seconds')return Math.max(0,Math.ceil((e.endsAt===null?e.pausedRemaining??e.amount*1000:e.endsAt-now)/1000));
 return Math.max(0,e.amount-Math.floor(Math.max(0,counter-e.startedCounter)/(e.unit==='round'?playerCount:1)));
}
export function applyEffectAction(state,action,ids,counter,rand,context={}){
 if(!['EFFECT_ADD','EFFECT_END','EFFECT_TIMER','EFFECT_DRAW','EFFECT_CHOOSE','EFFECT_DISMISS','EFFECT_COUNT'].includes(action.type))return false;
 state.effects??=[];
 if(action.type==='EFFECT_DRAW'){
  assert(state.phase!=='finished','本局已结束');assert(!state.effectDraft,'请先选择或放弃当前三张卡');
  assert((state.effectDraws??0)<1+Math.floor(counter/2),'再完成两次行动才能抽取下一组卡');
  const pool=availableEffectCards(context.kind,context.creative,context.estate).filter(c=>!state.effects.some(e=>e.cardId===c.id));
  assert(pool.length>=3,'可选卡不足三张，请先结束旧卡');const candidates=[];
  const take=predicate=>{const choices=pool.filter(predicate);if(choices.length){const card=choices[rand(choices.length)];candidates.push(card.id);pool.splice(pool.indexOf(card),1);}};
  take(c=>c.mode==='automatic');take(c=>c.kind===context.kind&&c.mode==='agreement');take(c=>c.kind==='common');
  while(candidates.length<3)candidates.push(pool.splice(rand(pool.length),1)[0].id);
  state.effectDraws=(state.effectDraws??0)+1;state.effectDraft={cards:candidates};return true;
 }
 if(action.type==='EFFECT_DISMISS'){assert(state.effectDraft,'当前没有待选卡');delete state.effectDraft;return true;}
 let spec=action.effect;
 if(action.type==='EFFECT_CHOOSE'){assert(state.effectDraft&&integer(action.index,0,2),'请选择一张有效的卡');spec={cardId:state.effectDraft.cards[action.index],targets:action.targets};}
 if(action.type==='EFFECT_ADD'||action.type==='EFFECT_CHOOSE'){
  assert(state.phase!=='finished','本局已结束');assert(state.effects.length<12,'请先结束一张旧卡，最多同时12张');
  assert(spec,'请选择持续卡');const card=spec.cardId===undefined?undefined:effectCard(spec.cardId);if(spec.cardId!==undefined){assert(canUseEffectCard(card,context.kind,context.creative,context.estate),'这张持续卡不适合当前玩法');assert(!state.effects.some(e=>e.cardId===card.id),'这张规则卡已经生效，不重复叠加');assert(ids.every(id=>!spec.targets?.includes(id)||state.effects.filter(e=>e.targets.includes(id)&&effectCard(e.cardId)?.mode==='automatic'&&effectRemaining(e,counter,ids.length,action.now)>0).length<3)||card.mode==='agreement','每人最多同时生效3张自动规则卡');spec={...spec,text:effectCardText(card),unit:card.unit,amount:card.amount,randomTurns:false,...(['task','review'].includes(state.phase)&&!['vote','mystery'].includes(context.kind)?{deferCurrent:true}:{})};}assert(typeof spec.text==='string','请选择持续卡');assert(integer(action.now,0,10_000_000_000_000),'持续卡开始时间不正确');
  assert(!spec.deferCurrent||['task','review'].includes(state.phase),'没有可延后结算的当前任务');
  assert(!spec.randomTurns||['turn','round'].includes(spec.unit),'掷骰只用于回合或轮数');
  assert(!spec.diceFormula||!card&&!spec.randomTurns&&validFormula(spec.diceFormula,spec.unit),'骰点公式不正确或超出范围');
  const value=spec.diceFormula?rand(6)+1:undefined;
  const amount=spec.diceFormula?diceFormulaAmount(spec.diceFormula,value):spec.randomTurns?rand(6)+1:spec.amount;
  const item={id:`effect-${state.revision}`,...(card?{cardId:card.id}:{}),text:spec.text.trim(),...(spec.unit==='count'?{progress:0,countUnit:spec.countUnit||'次'}:{}),...(spec.original?{original:spec.original}:{}),targets:spec.targets,unit:spec.unit,amount,startedCounter:counter+(spec.deferCurrent?1:0),...(spec.deferCurrent?{deferCurrent:true}:{}),endsAt:spec.unit==='seconds'?action.now+amount*1000:null};
  assert(!state.effects.some(e=>e.text===item.text&&sameTargets(e.targets,item.targets)&&effectRemaining(e,counter,ids.length,action.now)>0),'这张卡已经生效，可先结束旧卡');
  if(spec.diceFormula)item.dice={...spec.diceFormula,value};
  state.effects.push(item);if(action.type==='EFFECT_CHOOSE')delete state.effectDraft;
 }else{
  const e=state.effects.find(v=>v.id===action.effectId);assert(e,'持续卡不存在');
  if(action.type==='EFFECT_END')state.effects=state.effects.filter(v=>v.id!==e.id);
  else if(action.type==='EFFECT_COUNT'){assert(e.unit==='count'&&integer(action.countDelta,-9999,9999)&&action.countDelta!==0,'计次调整不正确');assert(integer(e.progress+action.countDelta,0,e.amount),'计次进度超出目标');e.progress+=action.countDelta;}
  else{assert(e.unit==='seconds','这张卡按回合结束');const clock=nextClock(e.amount,e.endsAt,e.pausedRemaining,action.now,action.timerMode);e.endsAt=clock.endsAt;delete e.pausedRemaining;if(clock.pausedRemaining!==undefined)e.pausedRemaining=clock.pausedRemaining;}
 }
 validateEffects(state.effects,ids,counter,context);return true;
}
export function completedEffectTurn(before,after,action,kind){
 if(kind==='vote')return action.type==='NEXT';
 if(kind==='mystery')return action.type==='ANSWER'&&after.stage>before.stage;
 if(kind==='coop')return action.type==='RESOLVE';
 if(kind==='story')return action.type==='RESOLVE'||action.type==='CHOOSE'&&after.phase!=='task';
 return after.moves>before.moves||action.type==='RESOLVE'&&after.phase==='finished';
}

export function validateEffectDeck(state,context={}){
 const counter=context.counter??0;
 assert(state.effectDraws===undefined||integer(state.effectDraws,0,1+Math.floor(counter/2)),'持续卡抽取次数不正确');
 if(state.effectDraft!==undefined){const d=state.effectDraft;assert(state.effectDraws>0&&d&&Array.isArray(d.cards)&&d.cards.length===3&&new Set(d.cards).size===3&&d.cards.every(id=>canUseEffectCard(effectCard(id),context.kind,context.creative,context.estate)),'持续卡候选不正确');}
 const typed=(state.effects??[]).filter(e=>e.cardId!==undefined);assert(new Set(typed.map(e=>e.cardId)).size===typed.length,'规则卡不能重复生效');
}

function definiteCount(text){
 const parsed=taskParameters(text);if(parsed.parts.length!==1)return undefined;const p=parsed.parts[0];
 if(p.kind!=='count'||!p.diceFormula&&(!Number.isInteger(p.value)||p.value<1||p.value>9999))return undefined;
 const prefix=text.slice(0,p.start).replace(/\s/g,'');if(/如果|如若|否则|若.*(?:则|就)|至少|至多|以上|以下|不少于|不超过/.test(prefix))return undefined;
 if(p.diceFormula&&!validFormula(p.diceFormula,'count'))return undefined;
 return {unit:'count',amount:p.diceFormula?diceFormulaAmount(p.diceFormula,1):p.value,countUnit:p.unit||'次',...(p.diceFormula?{diceFormula:p.diceFormula}:{})};
}
function definiteFormulaTime(text){
 const parts=taskParameters(text).parts;if(parts.length!==1)return undefined;const p=parts[0];
 if(p.kind!=='time'||!p.diceFormula||!validFormula(p.diceFormula,'seconds'))return undefined;
 if(/如果|如若|否则|至少|至多|以上|以下|不少于|不超过|每|分别|依次/.test(text.slice(0,p.start)))return undefined;
 return {unit:'seconds',amount:diceFormulaAmount(p.diceFormula,1),diceFormula:p.diceFormula};
}
export function directTaskEligible(text){return isOngoingText(text)&&(/直到|终点前|结束前/.test(text)||taskParameters(text.replace(/下一轮|下轮/g,'1轮')).parts.some(p=>p.kind==='turn'))||taskDuration(text)!==undefined||!!definiteCount(text)||!!definiteFormulaTime(text);}
export function ongoingTaskSpec(text){
 const clean=text.replace(/\s/g,'');
 if(/直到|终点前|结束前/.test(clean))return {unit:'game',amount:1};
 const turn=taskParameters(clean.replace(/下一轮|下轮/g,'1轮')).parts.find(p=>p.kind==='turn');
 if(turn){const unit=turn.unit==='轮'?'round':'turn';if(turn.diceFormula){const cap=clean.slice(turn.end).match(/^[（(](?:最多(?:为)?|至多)([\d一二两三四五六七八九十]+)[）)]/);const formula={...turn.diceFormula,...(cap?{cap:taskNumber(cap[1])}:{})};if(validFormula(formula,unit)){if(formula.factor===1&&formula.offset===0&&formula.cap===undefined)return {unit,amount:2,randomTurns:true};return {unit,amount:diceFormulaAmount(formula,1),diceFormula:formula};}return {unit,amount:2};}if(Number.isInteger(turn.value)&&turn.value>0)return {unit,amount:Math.min(99,turn.value),randomTurns:false};}
 const seconds=taskDuration(text);if(seconds)return {unit:'seconds',amount:seconds};
 return definiteFormulaTime(text)??definiteCount(text)??{unit:'turn',amount:2};
}

export function directTaskChoices(pool,{preferences={},originals={},effects=[],targets,counter,playerCount,now,finished=false,type='all'}){
 if(finished)return [];
 const choices=[],seen=new Set();
 for(const raw of pool){
  const text=applyTaskParameters(raw,preferences).text.trim();
  if(seen.has(text)||!directTaskEligible(text))continue;
  seen.add(text);const spec=ongoingTaskSpec(text),category=spec.unit==='seconds'?'time':spec.unit==='count'?'count':'lasting';
  if(type!=='all'&&type!==category)continue;
  if(effects.some(e=>e.text===text&&sameTargets(e.targets,targets)&&effectRemaining(e,counter,playerCount,now)>0))continue;
  choices.push({text,original:originals[raw]??raw,targets:[...targets],...spec});
 }
 return choices;
}
