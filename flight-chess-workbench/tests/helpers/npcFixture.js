import {createAdventure,adventureTransition as go,BATTLE_CARDS} from '../../src/core/adventure.js';
const card=id=>BATTLE_CARDS.find(c=>c.id===id),act=(s,a,p=s.turn)=>go(s,{...a,epoch:s.epoch},p);
export function earnedCoopFixture(){
 for(let seed=1;seed<=3000;seed++){
  let s=createAdventure({variant:'spire',players:['甲','乙'],pool:['观察10秒','重复5次'],settings:{floors:5,rounds:30,hp:100},seed});s=act(s,{type:'PATH',path:'normal'});
  for(let n=0;n<100&&s.phase==='battle';n++){if(s.pending?.kind==='npc'){s=act(s,{type:'COMPLETE',done:false,taskId:s.pending.id});continue;}const ix=s.hands[s.turn].findIndex(id=>card(id).attack>0&&card(id).cost<=s.energy[s.turn]);if(ix<0)s=act(s,{type:'END_TURN'});else{s=act(s,{type:'PLAY',index:ix});s=act(s,{type:'COMPLETE',done:true});}}
  if(s.phase!=='reward'||!['mark','dampen'].every(id=>s.battle.rewards.includes(id)))continue;
  const reward=structuredClone(s);s=act(s,{type:'REWARD',index:s.battle.rewards.indexOf('mark')},0);s=act(s,{type:'REWARD',index:s.battle.rewards.indexOf('dampen')},1);s=act(s,{type:'PATH',path:'normal'},0);
  if(['mark','strike','guard'].every(id=>s.hands[0].includes(id))&&s.hands[1].includes('dampen'))return {s,reward,seed};
 }
 throw Error('No earned synergy seed found');
}
