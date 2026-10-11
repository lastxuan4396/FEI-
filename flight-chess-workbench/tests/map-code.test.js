import test from 'node:test';
import assert from 'node:assert/strict';
import {createReference51} from '../src/core/reference51.js';
import {validateConfig,parseConfigJSON} from '../src/core/config.js';
import {createGame,transition} from '../src/core/engine.js';
import {defaultWorkspace,startWorkspace,workspaceForPreparedBoard,buildConfig} from '../src/core/workspace.js';

test('人工图片地图保留编号1–51与螺旋转角，额外起终点共53格',()=>{
 const c=createReference51();assert.equal(c.tiles.length,53);assert.equal(new Set(c.layout.path.map(p=>p.join(','))).size,53);
 for(const [i,p] of [[0,[10,8]],[1,[10,7]],[8,[10,0]],[18,[0,0]],[25,[0,7]],[33,[8,7]],[38,[8,2]],[44,[2,2]],[47,[2,5]],[51,[6,5]],[52,[6,4]]])assert.deepEqual(c.layout.path[i],p);
 assert.equal(c.tiles.filter(t=>t.type==='move').length,14);
 assert.deepEqual(parseConfigJSON(JSON.stringify(c)),c);
 c.tiles[2].color='url(javascript:bad)';assert.throws(()=>validateConfig(c));
});
test('图片指定返回41→19、50→31及退格不连锁触发，前进与终点正确',()=>{
 const c=createReference51();
 for(const [from,to] of [[40,19],[49,31],[46,42],[50,48],[7,10],[51,52]]){
  const s=createGame(c);s.players[0].position=from;
  const n=transition(s,c,{type:'ROLL',expectedRevision:0},1);
  assert.equal(n.players[0].position,to);assert.equal(n.pending,null);
 }
});
test('代码导入保留编辑题库与旧局快照，冲突引用改名且重复导入不累积',()=>{
 let w=startWorkspace(defaultWorkspace());w.themes.unshift({id:'talk',name:'旧题库',desc:'导入冲突测试',audience:'common',tasks:['我编辑的题库']});const old=structuredClone(w);
 let c=createReference51();c.decks.talk=c.decks.reference51;delete c.decks.reference51;c.tiles=c.tiles.map(t=>t.type==='task'?{...t,deck:'talk'}:t);
 const next=workspaceForPreparedBoard(w,c);assert.deepEqual(w,old);assert.deepEqual(next.themes[0].tasks,['我编辑的题库']);assert.equal(next.active,null);
 assert.equal(next.baseBoard.tiles[2].deck,'talk_import1');assert.equal(buildConfig(next).decks.talk_import1.cards.length,1);
 const again=workspaceForPreparedBoard(next,c);assert.equal(again.themes.length,next.themes.length);
});
