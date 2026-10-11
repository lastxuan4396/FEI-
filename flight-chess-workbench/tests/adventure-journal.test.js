import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdventure,adventureTransition as go,adventureView,BATTLE_CARDS} from '../src/core/adventure.js';
import {earnedCoopFixture} from './helpers/npcFixture.js';
const make=(variant='spire',settings={})=>createAdventure({variant,players:['甲','乙'],pool:['观察10秒','重复5次','分享愿望'],settings:{hp:100,...settings},seed:25});
const act=(s,a,actor=s.turn)=>go(s,{...a,epoch:s.epoch},actor);
const roundtrip=s=>JSON.parse(JSON.stringify(s));
test('Spire journal follows paid actions and records actual damage, block, healing, handoff and enemy outcome',()=>{
 let {s}=earnedCoopFixture();const index=s.hands[0].indexOf('strike'),card=BATTLE_CARDS.find(c=>c.id==='strike');
 const before=structuredClone(s),n=s.log.length;s=act(s,{type:'PLAY',index});assert.equal(s.log.length,n+1);assert.match(s.log.at(-1),/甲领取斩击.*完成确认后/);assert.deepEqual(s.energy,before.energy);assert.equal(s.battle.enemy.hp,before.battle.enemy.hp);
 const log=s.log.slice();s=act(s,{type:'TIMER',now:1000});assert.deepEqual(s.log,log);s=roundtrip(s);s=act(s,{type:'COMPLETE',done:false});assert.match(s.log.at(-1),/甲取消出牌/);assert.deepEqual(s.energy,before.energy);
 s=act(s,{type:'PLAY',index});const hp=s.battle.enemy.hp;s=act(s,{type:'COMPLETE',done:true});assert.match(s.log.at(-1),new RegExp(`消耗${card.cost}能量，造成${hp-s.battle.enemy.hp}伤害`));
 const guard=s.hands[0].indexOf('guard');s=act(s,{type:'PLAY',index:guard});s=act(s,{type:'COMPLETE',done:true});assert.match(s.log.at(-1),/造成0伤害，获得7格挡，恢复0生命/);
 const block=s.battle.block,enemyHp=s.battle.enemy.hp,energy=s.energy.slice();s=act(s,{type:'END_TURN'});assert.match(s.log.at(-1),/甲结束回合，轮到乙.*敌人暂不行动/);assert.equal(s.battle.block,block);assert.equal(s.battle.enemy.hp,enemyHp);assert.deepEqual(s.energy,energy);s=act(s,{type:'END_TURN'},1);assert.match(s.log.at(-1),/敌人蓄力/);assert.equal(s.log.filter(line=>line.includes('甲完成代价，打出斩击')).length,before.log.filter(line=>line.includes('甲完成代价，打出斩击')).length+1);
});
test('Victory preserves final card and both actual reward selections; finishing does not overwrite them',()=>{
 let s=make('spire',{floors:1,rounds:30});s=act(s,{type:'PATH',path:'normal'});assert.match(s.result,/进入第1层/);
 for(let n=0;n<100&&s.phase==='battle';n++){
 if(s.pending?.kind==='npc'){s=act(s,{type:'COMPLETE',done:false,taskId:s.pending.id});continue;}const i=s.hands[s.turn].findIndex(id=>{const c=BATTLE_CARDS.find(c=>c.id===id);return c.attack>0&&c.cost<=s.energy[s.turn];});if(i<0)s=act(s,{type:'END_TURN'});else{s=act(s,{type:'PLAY',index:i});s=act(s,{type:'COMPLETE',done:true});}
 }
 assert.equal(s.phase,'reward');assert.match(s.log.at(-2),/完成代价，打出/);assert.match(s.log.at(-1),/击败/);const names=s.battle.rewards.map(id=>BATTLE_CARDS.find(c=>c.id===id).name);
 s=act(roundtrip(s),{type:'REWARD',index:0},0);assert.match(s.result,new RegExp(`甲将${names[0]}加入牌组；轮到乙`));const hp=s.battle.hp;s=act(s,{type:'REWARD',index:1},1);assert.equal(s.phase,'finished');assert.match(s.log.at(-2),new RegExp(`乙将${names[1]}加入牌组；队伍恢复${s.battle.hp-hp}生命`));assert.match(s.log.at(-1),/通关/);assert.equal(s.log.filter(line=>line.includes('击败')).length,1);assert.deepEqual(roundtrip(s).log,s.log);
});
test('Defeat retains the attack and limit outcome; retry and rest describe current stage without replaying old outcomes',()=>{
 let s=make('spire',{floors:3,rounds:1});s=act(s,{type:'PATH',path:'rest'});assert.match(s.result,/休息/);s=act(s,{type:'PATH',path:'normal'});assert.match(s.result,/进入第2层.*蓄势兽/);s=act(s,{type:'END_TURN'},0);s=act(s,{type:'END_TURN'},1);assert.equal(s.phase,'defeat');assert.match(s.log.at(-2),/敌人蓄力/);assert.match(s.log.at(-1),/回合上限/);s=act(roundtrip(s),{type:'RETRY'},0);assert.match(s.result,/重试第2层/);assert.equal(s.log.filter(line=>line.includes('回合上限')).length,1);
});
test('Secret choices do not leak through journal, cancellation cannot taint duel results and journal remains capped',()=>{
 for(const variant of ['rps','limited','ecard','numbers','charge']){
 let s=make(variant,{rounds:99});s=act(s,{type:'SELECT',index:0},0);s=act(s,{type:'COMPLETE',done:false},0);s=act(s,{type:'SELECT',index:0},0);s=act(s,{type:'COMPLETE',done:true},0);
 const peer=adventureView(s,1);assert.equal(peer.secret[0],null);assert.doesNotMatch(peer.result,/石头|平民|蓄力/);assert.doesNotMatch(peer.log.join(''),/石头|平民|蓄力|观察10秒|分享愿望/);s=act(s,{type:'SELECT',index:0},1);s=act(s,{type:'COMPLETE',done:true},1);assert.match(s.result,/对.*平局/);assert.doesNotMatch(s.result,/取消|等待/);s=act(s,{type:'NEXT'},0);assert.match(s.result,/下一题/);
 for(let n=0;n<20;n++){s=act(s,{type:'SELECT',index:0},0);s=act(s,{type:'COMPLETE',done:false},0);}assert.equal(s.log.length,30);assert.equal(s.log.at(-1),s.result);
 }
 let s=make('preference');s=act(s,{type:'SELECT',favorite:2,guess:1},0);const v=adventureView(s,1);assert.equal(v.secret[0],null);assert.doesNotMatch(v.log.join(''),/选项|愿望|重复|观察/);s=act(s,{type:'SELECT',favorite:0,guess:2},1);assert.match(s.result,/揭晓/);
});
