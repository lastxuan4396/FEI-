import test from 'node:test';import assert from 'node:assert/strict';
import {taskLibraryRows,taskLibrarySettings,selectedTaskRows,taskKey,validateTaskLibrary} from '../src/core/taskLibrary.js';
import {defaultWorkspace,workspaceForTaskLibrary,workspaceForImageLevels,workspaceForMode,startWorkspace,parseWorkspace,buildConfig,workspaceForPreparedBoard} from '../src/core/workspace.js';
import {IMAGE_TASK_TEXTS} from '../src/core/imageTaskLibrary.js';
import {boardGeometry,referenceLayout} from '../src/core/boardLayouts.js';
import {playerCoordinates} from '../src/core/playerCoordinates.js';
import {MODES} from '../src/core/modes.js';
test('every literal image task has a stable unique editable row; all three tiers and seven combinations have real content',()=>{
 let w=defaultWorkspace();const rows=taskLibraryRows(w);assert.equal(rows.length,IMAGE_TASK_TEXTS.length);assert.equal(new Set(rows.map(t=>t.id)).size,rows.length);for(const t of rows)assert.equal(t.id,taskKey(t.original));
 for(const levels of [[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]){w=workspaceForImageLevels(w,levels);assert(selectedTaskRows(w).length);assert(selectedTaskRows(w).every(t=>levels.includes(t.level)));}
});
test('edit, tier change, delete, restore, custom additions, self-selection and filtering survive reload and all six new-game pools',()=>{
 let w=defaultWorkspace(),rows=taskLibraryRows(w);const original=rows[0],remove=rows[1];
 w=workspaceForTaskLibrary(w,{type:'edit',id:original.id,text:'观察桌上物品30秒',level:2});w=workspaceForTaskLibrary(w,{type:'delete',id:remove.id});w=workspaceForTaskLibrary(w,{type:'add',id:'user-test',text:'说一个词1分钟',level:1});w=workspaceForTaskLibrary(w,{type:'select',ids:[original.id,'user-test'],mode:'selected'});w=parseWorkspace(JSON.stringify(w));
 assert(taskLibraryRows(w).find(t=>t.id===remove.id).deleted);assert.equal(taskLibraryRows(w).find(t=>t.id===original.id).level,2);assert.equal(selectedTaskRows(w).length,2);assert.equal(taskLibrarySettings(w).mode,'selected');
 for(const {id}of MODES){let next=workspaceForMode(w,id,{size:14,shape:'reference'});next=startWorkspace(next,{seed:25});const c=next.active.config,tasks=c.tiles.filter(t=>t.type==='task');assert(tasks.length);assert(tasks.every(t=>['观察桌上物品30秒','说一个词1分钟'].includes(t.text)));assert(tasks.every(t=>[30,60].includes(t.duration)));assert.equal(boardGeometry(c).style,referenceLayout(id).style);assert.deepEqual(playerCoordinates(c,next.active.state.players).map(p=>p.coordinate),[boardGeometry(c).path[id==='chase'?6:0],boardGeometry(c).path[0]]);parseWorkspace(JSON.stringify(next));}
 const filtered=workspaceForImageLevels(w,[2]);assert.deepEqual(selectedTaskRows(filtered).map(t=>t.text),['观察桌上物品30秒']);const reset=workspaceForTaskLibrary(w,{type:'restore',id:remove.id});assert(!taskLibraryRows(reset).find(t=>t.id===remove.id).deleted);
});
test('library changes retain active boards verbatim; zero eligible choices are explicit and image originals keep their own content',()=>{
 let w=startWorkspace(defaultWorkspace(),{seed:1}),active=structuredClone(w.active);w=workspaceForTaskLibrary(w,{type:'mode',mode:'selected'});assert.deepEqual(w.active,active);assert.throws(()=>buildConfig(w),/所选范围没有题目/);assert.deepEqual(parseWorkspace(JSON.stringify(w)).active,active);
 const original=taskLibraryRows(w)[0];w=workspaceForTaskLibrary(w,{type:'select',ids:[original.id]});w=workspaceForTaskLibrary(w,{type:'delete',id:original.id});assert.throws(()=>buildConfig(w),/所选范围没有题目/);w=workspaceForTaskLibrary(w,{type:'restore',id:original.id});assert.equal(selectedTaskRows(w).length,1);
 const imported=structuredClone(active.config);imported.id='custom-literal-board';const next=workspaceForPreparedBoard(w,imported);assert.deepEqual(next.baseBoard.tiles,imported.tiles);
});
test('legacy edited mixed themes seed deletion/addition records rather than resurrecting removed text',()=>{
 const w=defaultWorkspace(),original=w.themes[0].tasks.shift();w.themes[0].tasks.push('自己的旧题目');assert(taskLibraryRows(w).find(t=>t.original===original).deleted);assert(selectedTaskRows(w).some(t=>t.text==='自己的旧题目'));const next=workspaceForTaskLibrary(w,{type:'mode',mode:'random'});assert(taskLibraryRows(next).find(t=>t.original===original).deleted);assert(selectedTaskRows(next).some(t=>t.text==='自己的旧题目'));
 assert.throws(()=>validateTaskLibrary({mode:'unknown'}));assert.throws(()=>validateTaskLibrary({additions:[{id:'user-a',text:' ',level:4}]}));assert.throws(()=>validateTaskLibrary({edits:{bad:{text:'t'}}}));
});
test('source wording updates retain personal edits, selected IDs and deletion backups instead of losing their rows',()=>{
 const previous='修订前的中性题目',id=taskKey(previous),legacyId=taskKey('没有原文备份的旧版中性题目');
 let w=defaultWorkspace();w.taskLibrary=validateTaskLibrary({edits:{[id]:{original:previous,text:'我自己的题目30秒',level:2},[legacyId]:{text:'旧版自改题目1分钟',level:1}},mode:'selected',selectedIds:[id,legacyId]});
 w=parseWorkspace(JSON.stringify(w));assert.deepEqual(selectedTaskRows(w).map(t=>t.text),['我自己的题目30秒','旧版自改题目1分钟']);assert(taskLibraryRows(w).find(t=>t.id===id).archived);
 const active=startWorkspace(w,{seed:3});assert(active.active.config.tiles.filter(t=>t.type==='task').every(t=>['我自己的题目30秒','旧版自改题目1分钟'].includes(t.text)));
 w=workspaceForTaskLibrary(w,{type:'delete',id});assert(taskLibraryRows(w).find(t=>t.id===id).deleted);w=parseWorkspace(JSON.stringify(w));w=workspaceForTaskLibrary(w,{type:'restore',id});assert.equal(taskLibraryRows(w).find(t=>t.id===id).text,previous);
 const sourceRow=taskLibraryRows(defaultWorkspace())[0];let next=workspaceForTaskLibrary(defaultWorkspace(),{type:'delete',id:sourceRow.id});assert.equal(next.taskLibrary.edits[sourceRow.id].original,sourceRow.original);
 assert.throws(()=>validateTaskLibrary({edits:{[id]:{text:'题目',original:'不同的原文'}}}),/原文备份/);
});
test('deleted personal questions remain recoverable after reload and do not enter any new-game pool',()=>{
 let w=defaultWorkspace();
 w=workspaceForTaskLibrary(w,{type:'add',id:'user-recoverable',text:'说一个城市名30秒',level:2});
 w=workspaceForTaskLibrary(w,{type:'select',ids:['user-recoverable'],mode:'selected'});
 const active=startWorkspace(w,{seed:7}).active;
 w={...w,active};
 w=workspaceForTaskLibrary(w,{type:'delete',id:'user-recoverable'});
 w=parseWorkspace(JSON.stringify(w));
 assert.equal(selectedTaskRows(w).length,0);
 assert.equal(taskLibraryRows(w).find(t=>t.id==='user-recoverable').deleted,true);
 assert.throws(()=>buildConfig(w),/所选范围没有题目/);
 assert.deepEqual(w.active,active);
 w=workspaceForTaskLibrary(w,{type:'restore',id:'user-recoverable'});
 assert.deepEqual(selectedTaskRows(w).map(t=>t.text),['说一个城市名30秒']);
 w=workspaceForTaskLibrary(w,{type:'edit',id:'user-recoverable',text:'说一个词10秒',level:1});
 assert.equal(selectedTaskRows(w)[0].level,1);
 assert.deepEqual(parseWorkspace(JSON.stringify(w)).active,active);
 assert.throws(()=>validateTaskLibrary({additions:[{id:'user-bad',text:'观察物品',level:1,deleted:'yes'}]}),/新增题目/);
});
