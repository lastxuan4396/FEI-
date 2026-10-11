import test from 'node:test';import assert from 'node:assert/strict';
import {createAdventure,adventureTransition as go,adventureView} from '../src/core/adventure.js';
import {EFFECT_CARDS,SPIRE_EFFECT_CARDS,ALL_EFFECT_CARDS,availableEffectCards} from '../src/core/effectCards.js';
import {spireEffectBonus} from '../src/core/spireEffects.js';
import {validateEffects,validateEffectDeck} from '../src/core/ongoingEffects.js';
const act=(s,a,p=s.pending?.actor??s.turn)=>go(s,{...a,epoch:s.epoch},p);
const fresh=(settings={})=>act(createAdventure({variant:'spire',players:['甲','乙'],pool:['观察30秒'],seed:1,settings:{floors:3,rounds:12,...settings}}),{type:'PATH',path:'normal'});
const add=(s,id,targets=['0','1'])=>act(s,{type:'EFFECT_ADD',now:1000,effect:{cardId:'spire-'+id,targets}});
const play=(s,id,done=true)=>{const i=s.hands[s.turn].indexOf(id);assert(i>=0);return act(act(s,{type:'PLAY',index:i}),{type:'COMPLETE',done});};
const attack=s=>act(act(s,{type:'END_TURN'},0),{type:'END_TURN'},1);
test('Spire extension keeps the original 50 and exposes five distinct cards only to the matching mode',()=>{
 assert.equal(EFFECT_CARDS.length,50);assert.equal(SPIRE_EFFECT_CARDS.length,5);assert.equal(new Set(ALL_EFFECT_CARDS.map(c=>c.id)).size,55);
 assert.equal(availableEffectCards('spire',true).length,15);for(const mode of ['native','cards','coop','estate'])assert(!availableEffectCards(mode,true,true).some(c=>c.kind==='spire'));
 let s=act(fresh(),{type:'EFFECT_DRAW',now:1000});assert(s.effectDraft.cards.some(id=>SPIRE_EFFECT_CARDS.find(c=>c.id===id&&c.mode==='automatic')));assert(s.effectDraft.cards.some(id=>SPIRE_EFFECT_CARDS.find(c=>c.id===id&&c.mode==='agreement')));
 const restored=JSON.parse(JSON.stringify(s));validateEffectDeck(restored,{kind:'spire',creative:true,counter:restored.effectTurns});s=act(restored,{type:'EFFECT_CHOOSE',index:0,targets:['0'],now:1000});validateEffects(s.effects,['0','1'],s.effectTurns,{kind:'spire',creative:true});assert.throws(()=>validateEffects(s.effects,['0','1'],s.effectTurns,{kind:'coop',creative:true}));
 const other=createAdventure({variant:'rps',players:['甲','乙'],pool:['观察30秒'],settings:{},seed:1});assert.throws(()=>add(other,'fortress'));
});
test('Paid block and healing cards apply their bonuses once after completion, preserve cancellation and cap shared HP',()=>{
 let s=add(add(fresh(),'fortress',['0']),'supply',['0']);const hand=s.hands[0].slice(),energy=s.energy[0];s=play(s,'guard',false);assert.deepEqual(s.hands[0],hand);assert.equal(s.energy[0],energy);assert.equal(s.battle.block,0);assert.equal(s.effectTurns,0);
 s=play(s,'guard');assert.equal(s.battle.block,9);assert.equal(s.energy[0],2);assert.equal(s.battle.discard[0].filter(id=>id==='guard').length,1);assert.equal(s.effectTurns,1);assert.throws(()=>act(s,{type:'COMPLETE',done:true}));
 s.battle.hp=20;s=play(s,'heal');assert.equal(s.battle.hp,26);assert.equal(s.energy[0],1);assert.equal(s.battle.block,9);assert.equal(s.effectTurns,2);
 s=add(fresh(),'supply');s.battle.hp=29;s=play(s,'heal');assert.equal(s.battle.hp,30);
 s=add(fresh(),'fortress',['1']);s=play(s,'guard');assert.equal(s.battle.block,7);
 s=add(fresh(),'fortress');s=play(s,'strike');assert.equal(s.battle.block,0);
});
test('Spire bonuses obey targets and the exact saved action boundary, including deferred/future cards and finished games',()=>{
 let s=add(fresh(),'fortress',['0']);assert.equal(spireEffectBonus(s,0).block,2);assert.equal(spireEffectBonus(s,1).block,0);s.effectTurns=5;assert.equal(spireEffectBonus(s,0).block,2);s.effectTurns=6;assert.equal(spireEffectBonus(s,0).block,0);s=play(s,'guard');assert.equal(s.battle.block,7);
 s=add(fresh(),'fortress');s.effects[0].startedCounter=1;assert.equal(spireEffectBonus(s,0).block,0);s.effectTurns=1;assert.equal(spireEffectBonus(s,0).block,2);s.phase='finished';assert.equal(spireEffectBonus(s,0).block,0);
});
test('Enemy-response bonus reduces real damage; skipped tasks and assistance use the actual responder and keep clocks',()=>{
 let s=attack(add(fresh(),'composure',['0']));assert.equal(s.pending.guardGain,2);s=act(s,{type:'COMPLETE',done:true,taskId:s.pending.id});assert.equal(s.battle.hp,29);assert.equal(s.battle.round,2);assert.equal(s.effectTurns,2);
 s=attack(add(fresh(),'composure'));s=act(s,{type:'COMPLETE',done:false,taskId:s.pending.id});assert.equal(s.battle.hp,26);
 for(const target of ['0','1']){s=attack(add(fresh(),'composure',[target]));const id=s.pending.id;s=act(s,{type:'TIMER',taskId:id,now:1000});const ends=s.pending.endsAt;s=act(s,{type:'ASSIST',taskId:id},1);assert.equal(s.energy[1],2);assert.equal(s.pending.endsAt,ends);assert.throws(()=>act(s,{type:'COMPLETE',done:true,taskId:id},0));s=act(JSON.parse(JSON.stringify(s)),{type:'COMPLETE',done:true,taskId:id},1);assert.equal(s.battle.hp,target==='1'?29:28);}
});
test('Multi-hit effects may expire between responders; saved role views share effects and retain all response tasks',()=>{
 let s=add(fresh({floors:1}),'composure');s.effectTurns=5;s=attack(s);assert.equal(s.battle.assault.total,2);const id=s.pending.id;s=act(s,{type:'COMPLETE',done:true,taskId:id});assert.equal(s.battle.block,3);assert.equal(s.effectTurns,6);assert.equal(spireEffectBonus(s,1).response,0);assert.equal(s.battle.hp,30);
 const restored=JSON.parse(JSON.stringify(s));for(const p of [0,1]){assert.equal(adventureView(restored,p).effects[0].cardId,'spire-composure');assert.equal(adventureView(restored,p).pending.actor,1);}s=act(restored,{type:'COMPLETE',done:true,taskId:restored.pending.id});assert.equal(s.battle.hp,27);assert.equal(s.battle.round,2);assert.equal(s.pending,undefined);
});
test('Agreement cards grant no automatic resources; duplicate rule cards remain enforced',()=>{
 let s=add(add(add(add(add(fresh(),'fortress'),'supply'),'composure'),'plan'),'markers');assert.equal(s.effects.length,5);assert.equal(s.energy[0],3);assert.equal(s.battle.block,0);assert.throws(()=>add(s,'fortress'));assert.equal(spireEffectBonus(s,0).block,2);validateEffects(s.effects,['0','1'],0,{kind:'spire',creative:true});
});
