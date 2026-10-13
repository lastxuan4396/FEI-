// Both the controls and room service use this policy. Rule validation stays in the engine.
const effectOperations=['EFFECT_ADD','EFFECT_END','EFFECT_TIMER','EFFECT_DRAW','EFFECT_CHOOSE','EFFECT_DISMISS','EFFECT_COUNT'];
const ownTargets=(targets,actor)=>Array.isArray(targets)&&targets.length===1&&targets[0]===String(actor);

export function arcadeActionAllowed(session,actor,type,action={},context={}){
 if(!session||![0,1].includes(actor)||typeof type!=='string')return false;
 const {config:c,state:s}=session;
 if(c.players.length!==2)return false;
 if(type==='UNDO')return false;
 if(s.phase==='finished'&&!['EFFECT_END','EFFECT_TIMER','EFFECT_COUNT'].includes(type))return false;
 if(type==='END')return actor===0;
 if(effectOperations.includes(type)){
  if(type==='EFFECT_DRAW')return !s.effectDraft&&context.draftActor==null;
  if(type==='EFFECT_DISMISS')return context.draftActor===actor;
  if(type==='EFFECT_CHOOSE')return context.draftActor===actor&&ownTargets(action.targets,actor);
  if(type==='EFFECT_ADD')return ownTargets(action.effect?.targets,actor);
  return !!s.effects?.some(e=>e.id===action.effectId&&e.targets.includes(String(actor)));
 }
 if(context.coopRequest){return type==='ACCEPT_COOP'&&actor===context.coopRequest.to;}
 if(type==='ACCEPT_COOP')return false;
 if(['RESOLVE','TIMER','TASK_COUNT','EDIT_TASK','CREATIVE_REDRAW','REDRAW_TASK'].includes(type)){
  if(s.phase!=='task'||!s.pending)return false;
  const actors=s.pending.creative?.actors??[s.turn,...(s.pending.estate?.partner!==undefined?[s.pending.estate.partner]:[])];
  return actors.includes(actor);
 }
 if(c.kind==='vote'){
  if(type==='VOTE')return s.phase==='ballot'&&!context.submitted?.[actor];
  if(type==='DRAW')return s.phase==='reveal'&&action.target===actor;
  if(type==='NEXT')return s.phase==='reveal';
 }
 if(c.kind==='estate'){
  if(type==='ACCEPT')return s.phase==='trade'&&s.trade?.buyer===actor;
  if(['BID','PASS_BID'].includes(type)){
   const auction=s.estate?.auction;
   return s.phase==='auction'&&auction?.activeBidderOrder[auction.activeBidderIndex]===actor&&action.target===actor;
  }
 }
 return actor===s.turn;
}

// A browser never receives the private snapshot used for transitions.
export function arcadeRoomView(session,actor,context={}){
 const view=structuredClone(session),{config:c,state:s}=view;
 s.undo=[];s.seed=1;s.bag=[];
 if(c.kind==='cards')s.players.forEach((p,i)=>{
  if(i!==actor)p.hand=p.hand.map((card,index)=>s.phase==='task'&&s.turn===i&&s.pending?.card===index?card:{type:'mission',text:'对方手牌保密'});
 });
 if(c.kind==='mystery')c.puzzles=c.puzzles.map(p=>({...p,answer:'答案保密'}));
 if(c.kind==='vote'&&s.phase==='ballot'){
  s.votes=[0,0];
  if(s.creative?.kind==='vote')s.creative.ballots=[-1,-1];
 }
 if(context.draftActor!=null&&context.draftActor!==actor)delete s.effectDraft;
 return view;
}
