import {IMAGE_TASK_TEXTS} from '../src/core/imageTaskLibrary.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { MODES, createMode, spiralPath } from '../src/core/modes.js';
import { createGame, transition, validateState } from '../src/core/engine.js';
import { validateConfig } from '../src/core/config.js';
import { parseSave, makeSave } from '../src/core/storage.js';
import { defaultWorkspace, validateWorkspace } from '../src/core/workspace.js';
const roll=(s,c,d)=>transition(s,c,{type:'ROLL'},d);

test('六种模式都可创建、序列化和长期运行',()=>{
  assert.equal(MODES.length,6);
  for(const mode of MODES) for(let seed=1;seed<=8;seed++){
    const c=createMode(mode.id); let s=createGame(c,{seed});
    assert.deepEqual(validateConfig(c),c);
    for(let i=0;i<300 && s.phase!=='finished';i++){
      s=transition(s,c,s.phase==='task'?{type:'RESOLVE_TASK',result:i%3?'done':'skip'}:s.phase==='choice'?{type:'CHOOSE_ROUTE',index:i%2}:{type:'ROLL'});
      assert.deepEqual(validateState(s,c),s); assert.deepEqual(parseSave(JSON.stringify(makeSave(c,s))).state,s);
    }
    assert.equal(s.phase,'finished',`${mode.id}, seed ${seed} 应完成整局`);
  }
});
test('螺旋从外向内，奇偶尺寸覆盖全部唯一且相邻坐标',()=>{
  for(const size of [2,3,6,7,8]){const p=spiralPath(size);assert.equal(p.length,size*size);assert.equal(new Set(p.map(x=>x.join(','))).size,p.length);for(let i=1;i<p.length;i++)assert.equal(Math.abs(p[i][0]-p[i-1][0])+Math.abs(p[i][1]-p[i-1][1]),1);}
  assert.deepEqual(spiralPath(7).at(-1),[3,3]);
});
test('岔路门禁、选项校验、选后触发挑战并可撤销/刷新',()=>{
  const c=createMode('choice'); let s=roll(createGame(c),c,4);assert.equal(s.phase,'choice');assert.throws(()=>roll(s,c,1));assert.throws(()=>transition(s,c,{type:'CHOOSE_ROUTE',index:9}));
  const saved=parseSave(JSON.stringify(makeSave(c,s))).state;assert.deepEqual(saved.choice,s.choice);
  let n=transition(saved,c,{type:'CHOOSE_ROUTE',index:1});assert.equal(n.players[0].position,9);assert.equal(n.phase,'task');assert.equal(n.pending.duration,30);assert.equal(n.pending.targets.length,2);
  const undone=transition(n,c,{type:'UNDO'});assert.deepEqual(undone.choice,s.choice);assert.equal(undone.phase,'choice');
  n=transition(undone,c,{type:'CHOOSE_ROUTE',index:0});assert.equal(n.players[0].position,6);assert.equal(n.phase,'ready');assert.equal(n.turn,1);validateState(n,c);
});
test('合作共享位置、特殊移动、共同任务和全队获胜',()=>{
  const c=createMode('cooperative');let s=roll(createGame(c),c,5);assert.ok(s.players.every(p=>p.position===8));validateState(s,c);
  if(s.phase==='task')s=transition(s,c,{type:'RESOLVE_TASK',result:'done'});
  s=roll(s,c,1);assert.equal(s.phase,'task');assert.equal(s.pending.targets.length,2);assert.ok(s.players.every(p=>p.position===9));
  s=transition(s,c,{type:'RESOLVE_TASK',result:'done'});s.players.forEach(p=>p.position=34);s=roll(s,c,1);assert.equal(s.winner,'team');assert.ok(s.players.every(p=>p.position===35));validateState(s,c);
});
test('追逐者起点落后，超过也算追上；逃跑者终点获胜',()=>{
  const c=createMode('chase');let s=createGame(c);assert.equal(s.players[0].position,6);assert.equal(s.players[1].position,0);
  s.turn=1;s.players[1].position=4;s=roll(s,c,3);assert.equal(s.winner,c.players[1].id);assert.equal(s.phase,'finished');validateState(s,c);
  s=createGame(c);s.players[0].position=47;s=roll(s,c,3);assert.equal(s.winner,c.players[0].id);validateState(s,c);
  assert.throws(()=>validateConfig({...c,players:[...c.players,{id:'c',name:'C',color:'#123456'}]}));
});
test('追逐中返回起点会当场被追上',()=>{
  const c=createMode('chase');c.tiles[7]={type:'home'};const s=roll(createGame(c),c,1);assert.equal(s.winner,c.players[1].id);validateState(s,c);
});
test('随机事件可重复回放，撤销恢复 RNG，日志保留效果',()=>{
  const c=createMode('events'),start=createGame(c,{seed:2}),s=roll(start,c,2);assert.ok(s.log.some(e=>e.text.includes('随机事件')));
  const restored=transition(s,c,{type:'UNDO'}),replayed=roll(restored,c,2);assert.deepEqual(replayed.players,s.players);assert.equal(replayed.seed,s.seed);assert.deepEqual(replayed.pending,s.pending);
});
test('计时启动、刷新、重置、撤销全部保留正确时间，不自动完成任务',()=>{
  const c=createMode('choice');let s=transition(roll(createGame(c),c,4),c,{type:'CHOOSE_ROUTE',index:1});
  s=transition(s,c,{type:'SET_TIMER',now:100000});assert.equal(s.pending.timerEndsAt,130000);const loaded=parseSave(JSON.stringify(makeSave(c,s))).state;assert.equal(loaded.pending.timerEndsAt,130000);assert.equal(loaded.phase,'task');
  s=transition(loaded,c,{type:'SET_TIMER',now:null});assert.equal(s.pending.timerEndsAt,null);s=transition(s,c,{type:'UNDO'});assert.equal(s.pending.timerEndsAt,130000);
  assert.throws(()=>transition(s,c,{type:'SET_TIMER',now:-1}));assert.throws(()=>transition(createGame(c),c,{type:'SET_TIMER',now:0}));validateState(s,c);
});
test('坏选项、被篡改路线、时长和合作位置都拒绝导入',()=>{
  const c=createMode('choice');c.tiles[4].options[0].steps=0;assert.throws(()=>validateConfig(c));c.tiles[4].options[0].steps=2;
  let s=roll(createGame(c),c,4);s.choice.options[0].steps=99;assert.throws(()=>validateState(s,c));
  s=transition(roll(createGame(c),c,4),c,{type:'CHOOSE_ROUTE',index:1});s.pending.duration=99;assert.throws(()=>validateState(s,c));
  const coop=createMode('cooperative'),state=createGame(coop);state.players[1].position=1;assert.throws(()=>validateState(state,coop));
});
test('旧版无 goal/choice 存档可继续，默认混合题库覆盖全部图片任务',()=>{
  const w=defaultWorkspace();assert.equal(w.themes.reduce((n,t)=>n+t.tasks.length,0),IMAGE_TASK_TEXTS.length);
  const c=createMode('classic');delete c.rules.goal;const s=createGame(c);delete s.choice;assert.deepEqual(validateState(s,c),s);assert.doesNotThrow(()=>roll(s,c,1));assert.ok(validateWorkspace(w));
});

test('切换模式保留编辑题库和玩家，追逐自动缩为两人，旧对局快照不动',async()=>{
  const {workspaceForMode,startWorkspace}=await import('../src/core/workspace.js');
  const w=defaultWorkspace();w.themes[0].tasks[0]='编辑后的内容';
  const old=startWorkspace(w),before=structuredClone(old);
  const selected=workspaceForMode(old,'choice');assert.equal(selected.active,null);assert.equal(selected.themes[0].tasks[0],'编辑后的内容');assert.deepEqual(old,before);
  const chase=workspaceForMode(selected,'chase');assert.equal(chase.players.length,2);assert.equal(chase.taskMode,'tile');assert.equal(chase.baseBoard.rules.goal,'chase');
});
