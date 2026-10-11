import {earnedCoopFixture} from './helpers/npcFixture.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {createNPC,nextNPCIntent,previewNPCAction,resolveNPCAction,battleCardDamage,resolveBattleCard} from '../src/core/npc.js';
import {createAdventure,adventureTransition as go,BATTLE_CARDS} from '../src/core/adventure.js';
const card=id=>BATTLE_CARDS.find(c=>c.id===id),act=(s,a,p=s.turn)=>go(s,{...a,epoch:s.epoch},p);
const battle=(enemy,extra={})=>({enemy,hp:100,maxHp:100,block:0,marked:0,weakened:0,...extra});
test('NPCs have distinct advertised sequences; new games vary and legacy games keep their old intent',()=>{
 const kinds=[[1,'normal','patrol',['attack','attack','attack']],[2,'normal','charger',['charge','heavy','attack']],[3,'normal','mender',['attack','heal','attack']],[4,'elite','sentinel',['fortify','attack','heavy']],[5,'normal','boss',['attack','drain','heavy']]];
 for(const [floor,path,kind,sequence]of kinds){const e=createNPC(floor,5,path,1,'varied');assert.equal(e.archetype,kind);assert.deepEqual([1,2,3].map(r=>nextNPCIntent(e,floor,r,1).type),sequence);}
 const patrol=createNPC(1,5,'normal',1,'varied');assert.equal(nextNPCIntent(patrol,1,2,1).hits,2);
 const old={name:'旧敌人',armor:2,intent:{type:'attack',amount:4}};assert.deepEqual([1,2,3,4].map(r=>nextNPCIntent(old,3,r,1)),[{type:'attack',amount:5},{type:'heal',amount:4},{type:'heavy',amount:9},{type:'heal',amount:4}]);
 assert.equal(createAdventure({variant:'spire',players:['甲','乙'],pool:['任务']}).config.settings.enemyPatterns,'varied');assert.throws(()=>createAdventure({variant:'spire',players:['甲','乙'],pool:['任务'],settings:{enemyPatterns:'unknown'}}));
});
test('Preview matches actual damage and healing across floors, difficulty, blocking and weakening',()=>{
 for(let floor=1;floor<=20;floor++)for(const difficulty of [1,2,3])for(const path of ['normal','elite'])for(let round=1;round<=6;round++){
  const enemy=createNPC(floor,20,path,difficulty,'varied');enemy.hp-=Math.min(10,enemy.hp-1);enemy.intent=nextNPCIntent(enemy,floor,round,difficulty);const b=battle(enemy,{hp:20,block:7,weakened:4,marked:2}),before={hp:b.hp,enemyHp:enemy.hp},preview=previewNPCAction(b);resolveNPCAction(b);assert.equal(before.hp-b.hp,preview.damage);assert.equal(b.enemy.hp-before.enemyHp,preview.healed);assert(b.hp>=0&&b.enemy.hp<=b.enemy.maxHp);assert.equal(b.block,0);assert.equal(b.marked,0);assert.equal(b.weakened,0);
 }
});
test('Drain heals only actual unblocked HP damage, temporary armor expires and healing is capped',()=>{
 const e=createNPC(5,5,'normal',1,'varied');e.hp-=10;e.intent={type:'drain',amount:10,heal:4};let b=battle(structuredClone(e),{block:7,weakened:2});assert.equal(previewNPCAction(b).damage,1);resolveNPCAction(b);assert.equal(b.hp,99);assert.equal(b.enemy.hp,e.hp+1);
 b=battle(structuredClone(e),{block:10});resolveNPCAction(b);assert.equal(b.enemy.hp,e.hp);b=battle(structuredClone(e),{hp:1});resolveNPCAction(b);assert.equal(b.enemy.hp,e.hp+1);
 b=battle(createNPC(4,5,'elite',1,'varied'));resolveNPCAction(b);assert.equal(b.enemy.armor,5);b.enemy.intent=nextNPCIntent(b.enemy,4,2,1);resolveNPCAction(b);assert.equal(b.enemy.armor,2);
 b=battle(createNPC(3,5,'normal',1,'varied'));b.enemy.hp-=2;b.enemy.intent=nextNPCIntent(b.enemy,3,2,1);resolveNPCAction(b);assert.equal(b.enemy.hp,b.enemy.maxHp);
});
test('Earned cooperation cards wait for paid task, benefit the partner and expire after enemy action',()=>{
 let {s}=earnedCoopFixture();const hp=s.battle.enemy.hp,energy=s.energy[0];s=act(s,{type:'PLAY',index:s.hands[0].indexOf('mark')});assert.equal(s.battle.marked,0);assert.equal(s.battle.enemy.hp,hp);s=act(s,{type:'COMPLETE',done:false});assert.equal(s.energy[0],energy);assert.equal(s.battle.marked,0);
 s=act(s,{type:'PLAY',index:s.hands[0].indexOf('mark')});s=act(s,{type:'COMPLETE',done:true});assert.equal(s.battle.marked,2);s=act(s,{type:'PLAY',index:s.hands[0].indexOf('guard')});s=act(s,{type:'COMPLETE',done:true});assert.equal(s.battle.marked,2);s=act(s,{type:'PLAY',index:s.hands[0].indexOf('strike')});assert.equal(battleCardDamage(s.battle,card('strike')),9);s=act(s,{type:'COMPLETE',done:true});assert.equal(s.battle.marked,1);s=act(s,{type:'END_TURN'});
 const before=s.battle.enemy.hp;s=act(s,{type:'PLAY',index:s.hands[1].indexOf('dampen')});assert.equal(s.battle.weakened,0);s=act(s,{type:'COMPLETE',done:true});assert.equal(s.battle.enemy.hp,before-5);assert.equal(s.battle.marked,0);assert.equal(s.battle.weakened,4);s=act(JSON.parse(JSON.stringify(s)),{type:'END_TURN'});assert.equal(s.battle.enemy.intent.type,'heavy');assert.equal(s.battle.weakened,0);assert.equal(s.battle.marked,0);
});
test('Weakening caps at 8 total damage and retry clears all transient battle effects',()=>{
 const b=battle(createNPC(5,5,'normal',1,'varied'));for(let n=0;n<3;n++)resolveBattleCard(b,card('dampen'));assert.equal(b.weakened,8);assert.equal(previewNPCAction(b).incoming,4);
 let s=createAdventure({variant:'spire',players:['甲','乙'],pool:['任务'],settings:{rounds:1}});s=act(s,{type:'PATH',path:'elite'});s=act(s,{type:'END_TURN'},0);s=act(s,{type:'END_TURN'},1);assert.equal(s.phase,'defeat');assert.equal(s.battle.enemy.armor,5);s=act(s,{type:'RETRY'});assert.equal(s.battle.enemy.armor,2);assert.equal(s.battle.weakened,0);assert.equal(s.battle.marked,0);assert.equal(s.battle.round,1);
});
test('Card preview shows actual HP loss, and a defensive card does not consume a shared attack mark',()=>{
 const b=battle(createNPC(5,5,'normal',1,'varied'),{marked:2});b.enemy.hp=3;assert.equal(battleCardDamage(b,card('heavy')),3);resolveBattleCard(b,card('guard'));assert.equal(b.marked,2);assert.equal(b.enemy.hp,3);resolveBattleCard(b,card('heavy'));assert.equal(b.enemy.hp,0);assert.equal(b.marked,1);
});
