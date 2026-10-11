import test from'node:test';import assert from'node:assert/strict';import{taskDuration,legacyTaskDuration,reviewDuration}from'../src/core/taskTiming.js';import{createMode}from'../src/core/modes.js';import{createGame,transition}from'../src/core/engine.js';import{makeSave,parseSave}from'../src/core/storage.js';import{createArcade,arcadeTransition,parseArcade}from'../src/core/arcade.js';import{IMAGE_TASK_LIBRARY}from'../src/core/imageTaskLibrary.js';
test('separated quantities or pose numbers do not merge into the following literal time; compound units still add',()=>{
 for(const [text,n]of [['69 1分钟',60],['69\n20秒',20],['编号12 30秒',30],['动作3\t2min',120],['观察1 分钟30 秒',90],['一 分 半',90],['30个 10s',10]])assert.equal(taskDuration(text),n,text);
 assert.equal(legacyTaskDuration('69 1分钟'),41460);assert.equal(legacyTaskDuration('69 20秒'),6920);assert.equal(taskDuration('69 1分钟30秒'),90);
 for(const t of IMAGE_TASK_LIBRARY.filter(t=>/^69\s+\d/.test(t.text)))assert.equal(t.duration,taskDuration(t.text));
});
test('minimum maximum and approximate times are readable bounds rather than fixed whole-task clocks',()=>{
 for(const text of ['最少1分钟','最多30秒','大约2分钟','约30s','近5min','大概10秒','至少1分钟','不超过2分钟','1分钟以上','10秒左右'])assert.equal(taskDuration(text),undefined,text);
 assert.equal(taskDuration('休息1分钟'),60);assert.equal(legacyTaskDuration('最少1分钟'),60);assert.equal(reviewDuration('最少1分钟',{timerEndsAt:61000}),60);
});
test('generated two-player and card-mode tasks use correct short timers; old task deadlines still restore and undo',()=>{
 const c=createMode('classic');c.rules.launchOnSix=false;const deck=Object.keys(c.decks)[0];c.decks[deck]={name:'数字边界验证',cards:['69 1分钟']};c.tiles[1]={type:'task',text:'69 1分钟',deck,target:'self'};
 let s=transition(createGame(c),c,{type:'ROLL'},1);assert.equal(s.pending.duration,60);s=transition(s,c,{type:'SET_TIMER',now:1000});assert.equal(parseSave(JSON.stringify(makeSave(c,s))).state.pending.timerEndsAt,61000);const old=structuredClone(s);old.pending.duration=41460;old.pending.timerEndsAt=41461000;const restored=parseSave(JSON.stringify(makeSave(c,old)));assert.equal(restored.state.pending.timerEndsAt,41461000);s=transition(s,c,{type:'RESOLVE_TASK',result:'skip'});s=transition(s,c,{type:'UNDO'});assert.equal(s.pending.timerEndsAt,61000);
 let a=createArcade('coop',[{name:'A',color:'#e26b49'},{name:'B',color:'#497f88'}],{pool:['69 1分钟'],seed:3});a=arcadeTransition(a,{type:'DRAW'});assert.equal(a.state.pending.duration,60);a=arcadeTransition(a,{type:'TIMER',now:1000});assert.equal(parseArcade(JSON.stringify(a)).state.pending.endsAt,61000);
});
