import test from 'node:test';
import assert from 'node:assert/strict';
import {MAP_SIZES,MODES,createMode,mapSizeOptions} from '../src/core/modes.js';
import {boardGeometry} from '../src/core/boardLayouts.js';
import {validateConfig} from '../src/core/config.js';
import {defaultWorkspace,workspaceForMode,workspaceForMapSize,workspaceForImageLevels,startWorkspace,parseWorkspace,validateWorkspace} from '../src/core/workspace.js';
import {transition} from '../src/core/engine.js';

test('all 144 length/shape/mode combinations keep exact legal route indices and compact non-overlapping drawing coordinates',()=>{
 for(const {id} of MODES)for(const size of MAP_SIZES)for(const shape of ['reference','snake','spiral']){
  const c=createMode(id,{size,shape,levels:[2]});assert.equal(c.tiles.length,size*size);assert.equal(new Set(c.layout.path.map(p=>p.join(','))).size,size*size);const drawing=boardGeometry(c);assert.equal(drawing.path.length,c.tiles.length);assert(drawing.columns*drawing.rows>c.tiles.length);assert.equal(new Set(drawing.path.map(p=>p.join(','))).size,c.tiles.length);for(let i=0;i<drawing.path.length;i++)for(let j=i+1;j<drawing.path.length;j++)assert(Math.max(Math.abs(drawing.path[i][0]-drawing.path[j][0]),Math.abs(drawing.path[i][1]-drawing.path[j][1]))>=1.18-1e-8,`${id}/${size}/${shape}: overlapping cards`);assert.deepEqual(mapSizeOptions(c),{size,shape});assert.equal(c.tiles[0].type,'start');assert.equal(c.tiles.at(-1).type,'finish');assert.equal(c.rules.goal,id==='cooperative'?'cooperative':id==='chase'?'chase':'race');assert.deepEqual(validateConfig(c),c);
  c.tiles.forEach((t,i)=>{if(t.type==='choice')t.options.forEach(o=>assert(i+o.steps<c.tiles.length-1));if(t.type==='task')assert(c.decks[t.deck].cards.length);});
 }
 assert.throws(()=>createMode('classic',{size:5}));assert.throws(()=>createMode('classic',{size:17}));assert.throws(()=>createMode('classic',{shape:'unknown'}));assert.equal(createMode('classic').layout.style,'cross');
});
test('size and shape survive switching modes, level filters, new game, save and restore; original layout and custom rules remain available',()=>{
 let w=defaultWorkspace();w=workspaceForMapSize(w,12,'spiral');w.baseBoard.rules.finish='exact';w=workspaceForMapSize(w,16,'snake');assert.equal(w.baseBoard.rules.finish,'exact');w=workspaceForMode(w,'cooperative');assert.equal(w.baseBoard.tiles.length,256);assert.equal(w.baseBoard.rules.goal,'cooperative');w=workspaceForImageLevels(w,[1,3]);assert.deepEqual(mapSizeOptions(w.baseBoard),{size:16,shape:'snake'});
 w=startWorkspace(w,{id:'large-map',seed:45});assert.equal(w.active.config.tiles.length,256);assert.equal(w.active.config.rules.goal,'cooperative');const before=structuredClone(w.active);const filtered=workspaceForImageLevels(w,[2]);assert.deepEqual(filtered.active,before);assert.deepEqual(parseWorkspace(JSON.stringify(w)),validateWorkspace(w));
 w=workspaceForMapSize(w,0,'snake');assert.equal(w.active,null);assert.equal(w.baseBoard.layout.style,'switchback');assert.equal(w.baseBoard.tiles.length,36);
 const custom=defaultWorkspace();custom.baseBoard.id='custom-board';custom.baseBoard.title='My board';const original=structuredClone(custom.baseBoard);assert.deepEqual(workspaceForMapSize(custom,0).baseBoard,original);
});
test('36 complete extended-route games retain legal moves, undo snapshots and persistent state',()=>{
 for(const {id} of MODES)for(const size of [10,16])for(const shape of ['reference','snake','spiral']){
  let w=workspaceForMode(defaultWorkspace(),id,{size,shape});w=startWorkspace(w,{id:'full-large-game',seed:71});const c=w.active.config;let s=w.active.state,steps=0;
  while(s.phase!=='finished'&&steps++<4000){const action=s.phase==='ready'?{type:'ROLL'}:s.phase==='task'?{type:'RESOLVE_TASK',result:'done'}:s.phase==='choice'?{type:'CHOOSE_ROUTE',index:0}:null;assert(action,s.phase);s=transition(s,c,{...action,expectedRevision:s.revision});assert(s.players.every(p=>p.position>=0&&p.position<c.tiles.length));if(steps%71===0){w.active.state=s;parseWorkspace(JSON.stringify(w));}}
  assert.equal(s.phase,'finished',`${id}/${size}/${shape}`);assert(s.winner);w.active.state=s;parseWorkspace(JSON.stringify(w));
 }
});
