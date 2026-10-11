import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';
import {taskDuration,legacyTaskDuration,reviewDuration} from '../src/core/taskTiming.js';
import {createMode} from '../src/core/modes.js';import {createGame,transition,validateState} from '../src/core/engine.js';import {makeSave,parseSave} from '../src/core/storage.js';
test('per-person and per-step times do not invent a total; adjacent compound units and single action clocks still work',()=>{
 for(const text of ['观察物品每个姿势各1分钟','每个动作30秒','每人观察物品1分钟','左右分别20秒','左右各30秒'])assert.equal(taskDuration(text),undefined);
 for(const [text,seconds]of [['观察物品1分钟',60],['观察物品1分钟30秒',90],['保持姿势1min',60]])assert.equal(taskDuration(text),seconds);
 assert.equal(legacyTaskDuration('每个动作30秒'),30);assert.equal(reviewDuration('每个动作30秒',{}),undefined);assert.equal(reviewDuration('每个动作30秒',{timerEndsAt:31000}),30);
});
test('legacy per-step task and manual review clocks survive save reload; new untimed tasks do not gain a deadline',()=>{
 const c=createMode('classic');c.rules.launchOnSix=false;const deck=Object.keys(c.decks)[0];c.decks[deck]={name:'中性计时验证',cards:['每个动作30秒']};c.tiles[1]={type:'task',deck,target:'self',text:'每个动作30秒'};
 let s=transition(createGame(c),c,{type:'ROLL'},1);assert.equal(s.pending.duration,undefined);s.pending.duration=30;s.pending.timerEndsAt=31000;s=validateState(s,c);assert.equal(parseSave(JSON.stringify(makeSave(c,s))).state.pending.timerEndsAt,31000);
});
test('source8 new preset leaves a conditional clock unset while existing explicit timer snapshots still reload',()=>{
 const c=JSON.parse(fs.readFileSync(new URL('../resources/prepared-maps/reviewed-source-8-original-map.json',import.meta.url),'utf8'));
 const route=JSON.parse(fs.readFileSync(new URL('../public/route-presets/verified-source-8-image-route.json',import.meta.url),'utf8'));
 assert.equal(c.tiles[56].duration,undefined);assert.equal(route.tiles[56].duration,undefined);assert.equal(taskDuration(c.tiles[56].text),undefined);
 let s=createGame(c);s.players[0].position=55;s=transition(s,c,{type:'ROLL'},1);assert.equal(s.pending.duration,undefined);
 const old=structuredClone(c);old.tiles[56].duration=60;let saved=createGame(old);saved.players[0].position=55;saved=transition(saved,old,{type:'ROLL'},1);saved=transition(saved,old,{type:'SET_TIMER',now:1000});const restored=parseSave(JSON.stringify(makeSave(old,saved)));assert.equal(restored.state.pending.timerEndsAt,61000);assert.equal(restored.config.tiles[56].duration,60);
});
