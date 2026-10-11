import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdventure,adventureTransition as go,BATTLE_CARDS} from '../src/core/adventure.js';
import {createNPC,previewNPCAction,resolveNPCAction,resolveBattleCard} from '../src/core/npc.js';
const act=(s,a,p=s.turn)=>go(s,{...a,epoch:s.epoch},p);
const card=BATTLE_CARDS.find(c=>c.id==='riposte');
function fixture(settings={}){
 for(let seed=1;seed<100;seed++){
  let s=createAdventure({variant:'spire',players:['甲','乙'],pool:['观察30秒'],settings:{floors:1,hp:100,rounds:10,enemyTasks:'always',...settings},seed});
  s=act(s,{type:'PATH',path:'normal'});
  if(s.hands[0].includes('riposte')&&s.hands[1].includes('guard'))return s;
 }
 throw Error('No starter fixture');
}
test('Counter stance requires a paid card, survives reload and uses the partner’s shared guard exactly once',()=>{
 let s=fixture(),hp=s.battle.enemy.hp;
 s=act(s,{type:'PLAY',index:s.hands[0].indexOf('riposte')});assert.equal(s.battle.riposte,0);assert.equal(s.battle.block,0);
 s=act(s,{type:'COMPLETE',done:false});assert.equal(s.energy[0],3);assert(s.hands[0].includes('riposte'));
 s=act(s,{type:'PLAY',index:s.hands[0].indexOf('riposte')});s=act(s,{type:'COMPLETE',done:true});assert.equal(s.energy[0],2);assert.equal(s.battle.riposte,6);assert.equal(s.battle.block,5);assert.equal(s.battle.enemy.hp,hp);
 s=act(JSON.parse(JSON.stringify(s)),{type:'END_TURN'});s=act(s,{type:'PLAY',index:s.hands[1].indexOf('guard')});s=act(s,{type:'COMPLETE',done:true});
 assert.equal(previewNPCAction(s.battle).retaliation,4);s=act(s,{type:'END_TURN'});assert.equal(s.pending.kind,'npc');assert.equal(s.battle.enemy.hp,hp);
 while(s.pending)s=act(s,{type:'COMPLETE',done:true,taskId:s.pending.id});
 assert.equal(s.battle.hp,100);assert.equal(s.battle.enemy.hp,hp-4);assert.equal(s.battle.riposte,0);assert.equal(s.battle.round,2);
 s=act(s,{type:'END_TURN'},0);s=act(s,{type:'END_TURN'},1);while(s.pending)s=act(s,{type:'COMPLETE',done:false,taskId:s.pending.id});assert.equal(s.battle.enemy.hp,hp); // drain heals the previous loss, without a second counter.
});
test('Counter preview caps by actual blocking, armor and HP; charge/heal and lethal hits cannot trigger it',()=>{
 for(const [intent,hp,block,armor,expected] of [
  [{type:'attack',amount:8},30,12,2,4], [{type:'attack',amount:8},30,3,2,1],
  [{type:'attack',amount:8},30,0,0,0], [{type:'attack',amount:8},1,2,0,0],
  [{type:'charge',amount:0},30,10,0,0], [{type:'heal',amount:4},30,10,0,0],
  [{type:'drain',amount:8,heal:4},30,5,2,3]
 ]){
  const enemy=createNPC(1,1,'normal',1,'varied');enemy.hp=10;enemy.armor=armor;enemy.intent=intent;
  const b={enemy,hp,maxHp:30,block,riposte:6,marked:2,weakened:0};const p=previewNPCAction(b),before=enemy.hp;
  assert.equal(p.retaliation,expected);resolveNPCAction(b);assert.equal(enemy.hp,before+p.healed-expected);assert.equal(b.riposte,0);
 }
 const b={enemy:createNPC(1,1,'normal',1),hp:30,maxHp:30,block:0};resolveBattleCard(b,card);resolveBattleCard(b,card);assert.equal(b.riposte,6);assert.equal(b.block,10);
});
test('A counter kill on the last permitted round awards both players and finishes the boss; retry clears stance',()=>{
 let s=fixture({rounds:1});s.battle.enemy.hp=2;
 s=act(s,{type:'PLAY',index:s.hands[0].indexOf('riposte')});s=act(s,{type:'COMPLETE',done:true});s=act(s,{type:'END_TURN'});s=act(s,{type:'PLAY',index:s.hands[1].indexOf('guard')});s=act(s,{type:'COMPLETE',done:true});s=act(s,{type:'END_TURN'});
 while(s.pending)s=act(s,{type:'COMPLETE',done:true,taskId:s.pending.id});
 assert.equal(s.phase,'reward');assert.equal(s.battle.enemy.hp,0);assert.equal(s.battle.riposte,0);assert(s.log.some(line=>line.includes('掩护反击造成2伤害')));
 s=act(s,{type:'REWARD',index:0},0);s=act(s,{type:'REWARD',index:1},1);assert.equal(s.phase,'finished');assert.deepEqual(s.battle.deck.map(d=>d.length),[11,11]);
 s=fixture({rounds:1,enemyTasks:'off'});s=act(s,{type:'PLAY',index:s.hands[0].indexOf('riposte')});s=act(s,{type:'COMPLETE',done:true});s=act(s,{type:'END_TURN'});s=act(s,{type:'END_TURN'});assert.equal(s.phase,'defeat');s=act(s,{type:'RETRY'});assert.equal(s.battle.riposte,0);assert.equal(s.battle.block,0);
});
