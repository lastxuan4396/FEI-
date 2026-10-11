// Shared by the UI and server; the server remains the authority.
export function boardActionAllowed(room,actor,type,action={}){
 const {state,config}=room;
 if(![0,1].includes(actor))return false;
 if(type==='SHUFFLE')return actor===0;
 if(type==='UNDO')return room.lastActor===actor;
 if(type==='FREE_TIMER')return room.freeTimer?.owner==null||room.freeTimer.owner===actor;
 if(type==='EFFECT_DRAW'||type==='EFFECT_ADD')return (action.targets??action.effect?.targets??[]).every(id=>id===config.players[actor].id)&&(!(type==='EFFECT_DRAW')||!state.effectDraft);
 if(['EFFECT_CHOOSE','EFFECT_DISMISS'].includes(type))return room.draftActor===actor;
 if(type.startsWith('EFFECT_'))return !!state.effects?.find(e=>e.id===action.effectId&&e.targets.includes(config.players[actor].id));
 if(['RESOLVE_TASK','SET_TIMER','TASK_COUNT'].includes(type)&&state.phase==='task')return !!state.pending?.targets.includes(config.players[actor].id);
 return actor===state.turn;
}
