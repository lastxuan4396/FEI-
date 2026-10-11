import test from 'node:test';import assert from 'node:assert/strict';
import {createAdventure,adventureTransition as go,adventureView,movesFor} from '../src/core/adventure.js';
const create=(variant,rounds)=>createAdventure({variant,players:['甲','乙'],pool:['观察300秒','记录3次','分享一件小事'],settings:{rounds},seed:17});
const act=(s,a,p=0)=>go(s,{...a,epoch:s.epoch},p);
const paid=(s,i,p)=>act(act(s,{type:'SELECT',index:i},p),{type:'COMPLETE',done:true},p);
test('E-card normalizes odd requested matches for both roles; 99 and 100 are valid, other games stay at 99',()=>{
 for(const n of [1,2,3,98,99,100])assert.equal(create('ecard',n).config.settings.rounds,Math.ceil(n/2)*2);
 for(const n of [0,101,NaN,2.5])assert.throws(()=>create('ecard',n));
 for(const v of ['rps','limited','numbers','charge','preference','spire']){assert.equal(create(v,99).config.settings.rounds,99);assert.throws(()=>create(v,100));}
});
test('A full 100-match E-card game handles all citizen ties, swaps roles, saves every match and finishes only at the limit',()=>{
 let s=create('ecard',99);s=act(s,{type:'EFFECT_ADD',now:1000,effect:{text:'观察300秒',targets:['0'],unit:'seconds',amount:300}});
 const deadline=s.effects[0].endsAt;let completed=0;
 while(s.phase!=='finished'){
  const before=s.match,identity=s.hands[0].at(-1);s=paid(s,0,0);s=paid(s,0,1);
  assert.equal(s.phase,'reveal');assert.equal(s.effects[0].endsAt,deadline);
  if(s.ecardContinue){assert.equal(s.match,before);assert(s.hands[0].length>0);}
  else{completed++;assert.equal(s.match,before+1);}
  s=act(s,{type:'NEXT'});s=JSON.parse(JSON.stringify(s));
  if(s.phase!=='finished')assert.equal(s.hands[0].at(-1),s.ecardContinue?identity:identity==='emperor'?'slave':'emperor');
 }
 assert.equal(completed,100);assert.equal(s.match,100);assert.equal(s.round,500);assert.deepEqual(s.score,[150,150]);assert.equal(s.effects[0].endsAt,deadline);
});
test('All duel modes and preference complete their configured matches with private submissions and retained independent tasks',()=>{
 for(const variant of ['rps','limited','numbers','charge','preference']){
  const rounds=variant==='limited'?10:variant==='numbers'?6:3;let s=create(variant,rounds);
  s=act(s,{type:'EFFECT_ADD',now:1000,effect:{text:'记录3次',targets:['0'],unit:'count',countUnit:'次',amount:3}});const id=s.effects[0].id;
  for(let r=0;r<rounds;r++){
   if(variant==='preference'){s=act(s,{type:'SELECT',favorite:0,guess:1});assert.equal(adventureView(s,1).secret[0],null);s=act(s,{type:'SELECT',favorite:2,guess:2},1);for(let p=0;p<2;p++)if(s.penalties[p])s=act(s,{type:'COMPLETE',done:r%2===0},p);}
   else{s=paid(s,0,0);assert.equal(adventureView(s,1).secret[0],null);assert(s.ready[0]);s=paid(s,movesFor(s,1).length-1,1);}
   assert.equal(s.round,r+1);s=act(s,{type:'NEXT'});s=JSON.parse(JSON.stringify(s));assert.equal(s.phase,r+1===rounds?'finished':'choose');assert.equal(s.effects[0].id,id);assert.equal(s.effects[0].progress,0);
  }
  s=act(s,{type:'EFFECT_COUNT',effectId:id,countDelta:1});assert.equal(s.effects[0].progress,1);
 }
});
