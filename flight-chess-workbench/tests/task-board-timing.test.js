import test from 'node:test';import assert from 'node:assert/strict';
import {taskDuration,durationLabel} from '../src/core/taskTiming.js';
import {defaultWorkspace,startWorkspace,workspaceForMode,parseWorkspace} from '../src/core/workspace.js';
import {MODES} from '../src/core/modes.js';import {validateConfig,parseConfigJSON} from '../src/core/config.js';
import {createGame,transition,validateState} from '../src/core/engine.js';
import {createArcade,arcadeTransition,parseArcade} from '../src/core/arcade.js';
test('literal seconds and minutes include Chinese numbers, fractions and adjacent compound units, but bounds/ranges/separate stages are not guessed',()=>{
 for(const [text,seconds] of [['休息5秒',5],['保持30秒',30],['站2分钟',120],['一分钟三十秒',90],['一分半',90],['两分钟',120],['0.5min',30],['2MIN',120],['1min30s',90],['一百二十秒',120],['一小时二分钟三秒',3723]])assert.equal(taskDuration(text),seconds,text);
 for(const text of ['大于10秒','>10s','至少十秒','10秒以上','1-2分钟','1/2分钟','做1分钟，然后休息30秒','每少完成一项，则休息10秒','若答错，则休息10秒','如果完成不了，休息两分钟','掷3次','一万分钟'])assert.equal(taskDuration(text),undefined,text);
 assert.equal(durationLabel(150),'2分钟30秒');
});
test('all six own boards have deterministic actual per-cell tasks, save/reload keeps them, different seeds change them, literal image maps stay untouched',()=>{
 for(const mode of MODES){const w=workspaceForMode(defaultWorkspace(),mode.id),before=structuredClone(w),a=startWorkspace(w,{seed:11}),b=startWorkspace(w,{seed:12});
  const cells=a.active.config.tiles.filter(t=>t.type==='task');assert(cells.length>0);assert(cells.every(t=>a.active.config.decks[t.deck].cards.includes(t.text)));
  assert.deepEqual(startWorkspace(w,{seed:11}).active.config.tiles,a.active.config.tiles);assert.notDeepEqual(a.active.config.tiles,b.active.config.tiles);assert.deepEqual(w,before);
  assert.deepEqual(parseWorkspace(JSON.stringify(a)).active,a.active);
 }
});
test('per-player task banks stay distinct: printed task for each turn matches pending text, duration and selected target deck',()=>{
 const w=defaultWorkspace();w.taskMode='player';w.themes=[{id:'first',name:'第一套',desc:'',audience:'common',tasks:['第一套2分钟']},{id:'second',name:'第二套',desc:'',audience:'common',tasks:['第二套5秒']}];w.players[0].themeId='first';w.players[1].themeId='second';
 const c=startWorkspace(w,{seed:1}).active.config;assert.deepEqual(parseConfigJSON(JSON.stringify(c)),c);
 for(const turn of [0,1]){let s=createGame(c,{seed:1});s.turn=turn;s=transition(s,c,{type:'ROLL'},1);assert.equal(s.pending.text,c.tiles[1].playerTexts[c.players[turn].id]);assert.equal(s.pending.duration,taskDuration(s.pending.text));validateState(s,c);}
 const invalid=structuredClone(c);delete invalid.tiles[1].playerTexts.p1;assert.throws(()=>validateConfig(invalid));
});
test('inferred 5-second and 2-minute task timers persist through start/reset/undo/save, while expired clocks require explicit completion',()=>{
 const w=defaultWorkspace();w.baseBoard.tiles[1]={type:'task',deck:Object.keys(w.baseBoard.decks)[0],target:'self',text:'保持2分钟'};const c=w.baseBoard;let s=transition(createGame(c),c,{type:'ROLL'},1);assert.equal(s.pending.duration,120);
 s=transition(s,c,{type:'SET_TIMER',now:1000});assert.equal(s.pending.timerEndsAt,121000);s=transition(s,c,{type:'SET_TIMER',now:null});s=transition(s,c,{type:'UNDO'});assert.equal(s.pending.timerEndsAt,121000);validateState(s,c);
 const old=structuredClone(s);delete old.pending.duration;delete old.pending.timerEndsAt;validateState(old,c); // legacy untimed snapshot remains readable
 const people=[{name:'A',color:'#e26b49'},{name:'B',color:'#497f88'}];let a=createArcade('coop',people,{pool:['保持5秒'],seed:1});a=arcadeTransition(a,{type:'DRAW'});assert.equal(a.state.pending.duration,5);a=arcadeTransition(a,{type:'TIMER',now:1000});assert.equal(parseArcade(JSON.stringify(a)).state.pending.endsAt,6000);
});
