import test from 'node:test';import assert from 'node:assert/strict';
import {directTaskEligible,ongoingTaskSpec,effectRemaining,validateEffects} from '../src/core/ongoingEffects.js';
import {taskDuration} from '../src/core/taskTiming.js';import {applyTaskParameters,taskParameters} from '../src/core/taskParameters.js';
import {createArcade,arcadeTransition,parseArcade} from '../src/core/arcade.js';
import {createMode} from '../src/core/modes.js';import {createGame,transition} from '../src/core/engine.js';import {makeSave,parseSave} from '../src/core/storage.js';
import {createAdventure,adventureTransition,adventureView} from '../src/core/adventure.js';
const people=[{name:'甲',color:'#739aa5'},{name:'乙',color:'#ce765f'}];
const add={type:'EFFECT_ADD',now:1000,effect:{text:'重复五次',targets:['0','1'],...ongoingTaskSpec('重复五次')}};
const plus=id=>({type:'EFFECT_COUNT',effectId:id,countDelta:1});
test('Direct draws recognize definite count units and adjusted targets, without guessing ambiguous multiple parameters',()=>{
 for(const [text,amount,countUnit]of [['重复五次',5,'次'],['绕场两圈',2,'圈'],['观察三张卡',3,'张'],['整理2组',2,'组'],['拍手10下',10,'下'],['工具20',20,'次']]){assert(directTaskEligible(text));assert.deepEqual(ongoingTaskSpec(text),{unit:'count',amount,countUnit});}
 for(const text of ['如果失败重复5次','至少重复5次','重复5次每次20秒','选2张卡做5次','序号20'])assert(!directTaskEligible(text),text);
 assert(directTaskEligible('重复X次'));assert.deepEqual(ongoingTaskSpec('重复X次'),{unit:'count',amount:1,countUnit:'次',diceFormula:{factor:1,offset:0}});
 const key=taskParameters('重复5次').key,adjusted=applyTaskParameters('重复5次',{[key]:[9]}).text;assert.equal(ongoingTaskSpec(adjusted).amount,9);
});
test('Outer turn/game duration outranks per-round clocks, and per-repeat clocks are not total clocks',()=>{
 assert.deepEqual(ongoingTaskSpec('持续3回合，每回合30秒'),{unit:'turn',amount:3,randomTurns:false});assert.deepEqual(ongoingTaskSpec('直到本局结束，每轮20秒'),{unit:'game',amount:1});
 for(const text of ['重复5次，每次20秒','持续3回合，每回合30秒','每轮10秒','每组20秒'])assert.equal(taskDuration(text),undefined,text);
 assert.equal(taskDuration('观察30秒'),30);
});
test('All eight arcade modes save count progress, undo the increment and leave turn, score and phase untouched',()=>{
 for(const kind of ['spinner','cards','coop','story','bingo','vote','mystery','estate']){let s=createArcade(kind,people,{pool:['重复五次','观察30秒']});const before=structuredClone(s.state);s=arcadeTransition(s,add);const id=s.state.effects[0].id;s=arcadeTransition(s,plus(id));assert.equal(s.state.effects[0].progress,1);assert.equal(s.state.phase,before.phase);assert.deepEqual(s.state.players,before.players);assert.equal(s.state.effectTurns??0,before.effectTurns??0);s=parseArcade(JSON.stringify(s));assert.equal(effectRemaining(s.state.effects[0],900,2,999999,true),4);s=arcadeTransition(s,{type:'UNDO'});assert.equal(s.state.effects[0].progress,0);s=arcadeTransition(s,{...plus(id),countDelta:5});assert.equal(effectRemaining(s.state.effects[0],0,2,1000),0);assert.throws(()=>arcadeTransition(s,plus(id)));s=arcadeTransition(s,{...plus(id),countDelta:-1});assert.equal(s.state.effects[0].progress,4);assert.throws(()=>arcadeTransition(s,{type:'EFFECT_TIMER',effectId:id,now:1000}));s=arcadeTransition(s,{type:'EFFECT_END',effectId:id});assert.equal(s.state.effects.length,0);}
});
test('All six board modes retain manual count progress in native saves and undo',()=>{
 for(const kind of ['classic','spiral','choice','cooperative','chase','events']){const c=createMode(kind);let s=createGame(c);const action={...add,effect:{...add.effect,targets:c.players.map(p=>p.id)}};s=transition(s,c,action);const id=s.effects[0].id;s=transition(s,c,plus(id));s=parseSave(JSON.stringify(makeSave(c,s))).state;assert.equal(s.effects[0].progress,1);s=transition(s,c,{type:'UNDO'});assert.equal(s.effects[0].progress,0);assert.equal(s.rounds,0);}
});
test('Seven adventure games share count recording, persistence and unchanged card payment gates',()=>{
 for(const variant of ['rps','limited','ecard','numbers','charge','preference','spire']){let s=createAdventure({variant,players:['甲','乙'],pool:['重复五次','观察30秒','说一句感谢'],seed:1});const phase=s.phase,energy=s.energy.slice();s=adventureTransition(s,{...add,epoch:s.epoch},0);const id=s.effects[0].id;s=adventureTransition(s,{...plus(id),epoch:s.epoch},1);s=JSON.parse(JSON.stringify(s));validateEffects(s.effects,['0','1'],s.effectTurns);assert(adventureView(s,1).config.directPool.includes('重复五次'));assert.equal(s.effects[0].progress,1);assert.equal(s.phase,phase);assert.deepEqual(s.energy,energy);assert.deepEqual(s.ready,[false,false]);}
});
test('Count saves reject forged progress, unsupported units and count-only data on timer cards',()=>{
 const e={id:'count',text:'重复五次',targets:['0'],unit:'count',amount:5,progress:0,countUnit:'次',startedCounter:0,endsAt:null};validateEffects([e],['0','1'],0);
 for(const patch of [{progress:-1},{progress:6},{progress:1.5},{countUnit:'小时'},{progress:undefined},{endsAt:1000},{unit:'seconds',amount:30,endsAt:31000}])assert.throws(()=>validateEffects([{...e,...patch}],['0','1'],0));
 let s=arcadeTransition(createArcade('spinner',people,{pool:['重复五次']}),add);const id=s.state.effects[0].id;for(const countDelta of [-1,0,1.5,99999])assert.throws(()=>arcadeTransition(s,{...plus(id),countDelta}));s=arcadeTransition(s,{type:'END'});s=arcadeTransition(s,plus(id));assert.equal(s.state.effects[0].progress,1);
});
