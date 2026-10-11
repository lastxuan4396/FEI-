import {effectCard} from './effectCards.js';
import {effectRemaining} from './ongoingEffects.js';
const active=(before,c)=> (before.effects??[]).filter(e=>e.cardId&&e.targets.includes(String(before.turn))&&(before.effectTurns??0)>=e.startedCounter&&effectRemaining(e,before.effectTurns??0,c.players.length,0)>0);
const notice=(s,labels)=>{if(!labels.length)return;const text=`持续卡生效：${[...new Set(labels)].join('、')}。`;s.message=`${s.message} ${text}`.slice(0,1000);s.log=[...s.log.slice(-29),text];};
// Positive score/trust modifiers run before the original victory checks.
export function beforeEffectRules(s,c,a,before){
 const labels=[],p=s.players[before.turn],t=before.pending;
 for(const e of active(before,c)){const card=effectCard(e.cardId),rule=card?.rule;if(!rule)continue;
  if(rule==='riskGuard'&&a.type==='RESOLVE'&&!a.done&&t?.creative?.style==='risk'){if(c.kind==='spinner'||!before.players[before.turn].shield)p.score++;labels.push(`${card.title}（本次不扣分）`);}
  if(rule==='score'&&a.type==='RESOLVE'&&a.done&&t){p.score++;labels.push(card.title);}
  if(rule==='storyDone'&&a.type==='RESOLVE'&&a.done&&t||rule==='storySkip'&&a.type==='RESOLVE'&&!a.done&&t||rule==='storyChoice'&&a.type==='CHOOSE'&&before.phase==='choice'){s.trust++;labels.push(card.title);}
  if(rule==='estateTask'&&a.type==='RESOLVE'&&a.done&&t?.estate?.kind==='event'){p.cash+=5;labels.push(card.title);}
 }
 return labels;
}
export function taskEffectCards({config:c,state:s}){
 const t=s.pending;if(!t)return [];
 return active(s,c).map(e=>effectCard(e.cardId)).filter(card=>{
  const r=card?.rule;
  if(['score','spinnerTicket','cardRecycle','coopSkip','storyDone','storySkip','bingoDone','bingoTime','mysteryTask'].includes(r))return true;
  if(r==='riskGuard')return t.creative?.style==='risk';
  if(r==='coopStage')return t.creative?.style!=='relay'||t.creative.step===1;
  if(r==='coopRelay')return t.creative?.style==='relay'&&t.creative.step===0;
  return r==='estateTask'&&t.estate?.kind==='event';
 });
}
export function afterEffectRules(s,c,a,before,labels=[]){
 const actor=before.turn,p=s.players[actor],t=before.pending;
 for(const prior of active(before,c)){const e=s.effects.find(v=>v.id===prior.id),card=effectCard(prior.cardId),rule=card?.rule;let hit=false;if(!rule)continue;
  if(rule==='spinnerTicket'&&a.type==='RESOLVE'&&a.done){s.creative.tickets[actor]=Math.min(3,s.creative.tickets[actor]+1);hit=true;}
  if(rule==='cardRecycle'&&a.type==='RESOLVE'&&a.done){s.creative.recycles[actor]=Math.min(3,s.creative.recycles[actor]+1);hit=true;}
  if(rule==='coopStage'&&a.type==='RESOLVE'&&a.done&&s.stage>before.stage||rule==='coopSkip'&&a.type==='RESOLVE'&&!a.done||rule==='coopRelay'&&a.type==='RESOLVE'&&a.done&&t?.creative?.style==='relay'&&t.creative.step===0){s.creative.help=Math.min(3,s.creative.help+1);hit=true;}
  if(rule==='bingoDone'&&a.type==='RESOLVE'&&a.done){s.creative.redraws[actor]=Math.min(2,s.creative.redraws[actor]+1);hit=true;}
  if(rule==='bingoRefund'&&a.type==='BINGO_REDRAW'&&e.lastUsedCounter!==(before.effectTurns??0)){s.creative.redraws[actor]=Math.min(2,s.creative.redraws[actor]+1);e.lastUsedCounter=before.effectTurns??0;hit=true;}
  if(rule==='bingoTime'&&a.type==='CELL'&&s.pending){s.pending.duration=Math.min(86400,s.pending.duration+30);hit=true;}
  if(rule==='mysteryRefund'&&a.type==='HINT'&&e.lastUsedStage!==before.stage){s.creative.hintCredits=Math.min(6,s.creative.hintCredits+1);e.lastUsedStage=before.stage;hit=true;}
  if(rule==='mysteryAnswer'&&a.type==='ANSWER'&&s.stage>before.stage||rule==='mysteryTask'&&a.type==='RESOLVE'&&a.done){s.creative.hintCredits=Math.min(6,s.creative.hintCredits+1);hit=true;}
  if(rule==='estatePass'&&a.type==='ROLL'&&before.players[actor].position+s.dice>=(c.estate?.mapSize??12)){p.cash+=10;hit=true;}
  if(rule==='estateBuild'&&(a.type==='BUILD'||a.type==='BUY'&&a.yes&&before.owners[before.players[actor].position]===actor)){p.cash+=5;hit=true;}
  if(hit)labels.push(card.title);
 }
 // Vote rewards follow the reveal, keeping both ballots hidden until the second submission.
 if(a.type==='VOTE'&&before.voter===1&&s.phase==='reveal')for(const e of before.effects??[]){const card=effectCard(e.cardId);if(!['voteSame','voteDifferent'].includes(card?.rule)||(before.effectTurns??0)<e.startedCounter||effectRemaining(e,before.effectTurns??0,c.players.length,0)<=0)continue;const same=s.creative.ballots[0]===s.creative.ballots[1];if(card.rule==='voteSame'?same:!same){e.targets.forEach(id=>s.players[Number(id)].score++);labels.push(card.title);}}
 notice(s,labels);
}
