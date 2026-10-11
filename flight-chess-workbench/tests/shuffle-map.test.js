import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaultWorkspace,workspaceForMode,workspaceForTaskLibrary,workspaceForPreparedBoard,workspaceForShuffledTasks,startWorkspace,parseWorkspace} from '../src/core/workspace.js';
import {validateConfig} from '../src/core/config.js';
function selection(w){for(const [i,text]of ['观察桌上物品30秒','说一个词1分钟','画一个圆10秒'].entries())w=workspaceForTaskLibrary(w,{type:'add',id:`user-shuffle-${i}`,text,level:2});w=workspaceForTaskLibrary(w,{type:'select',ids:['user-shuffle-0','user-shuffle-1','user-shuffle-2'],mode:'selected'});w.imageLevels=[2];return w;}
test('refresh draws only selected edited nondeleted tasks, retains layout and special mechanics, and clears the old game atomically',()=>{
 const w=startWorkspace(selection(workspaceForMode(defaultWorkspace(),'choice',{size:12,shape:'reference'})),{seed:23,id:'before-shuffle'}),before=structuredClone(w);
 const a=workspaceForShuffledTasks(w,10),b=workspaceForShuffledTasks(w,21);
 assert.deepEqual(a.baseBoard.layout,w.baseBoard.layout);assert.deepEqual(a.baseBoard.rules,w.baseBoard.rules);assert.equal(a.active,null);assert.deepEqual(w,before);
 a.baseBoard.tiles.forEach((t,i)=>{if(t.type!=='task')assert.deepEqual(t,w.baseBoard.tiles[i]);else{assert(['观察桌上物品30秒','说一个词1分钟','画一个圆10秒'].includes(t.text));assert([30,60,10].includes(t.duration));}});
 assert.notDeepEqual(a.baseBoard.tiles.filter(t=>t.type==='task').map(t=>t.text),b.baseBoard.tiles.filter(t=>t.type==='task').map(t=>t.text));
 const started=startWorkspace(a,{id:'after-shuffle',seed:10});assert.deepEqual(started.active.config.tiles.map(t=>t.text),a.baseBoard.tiles.map(t=>t.text));parseWorkspace(JSON.stringify(started));
 const deleted=workspaceForTaskLibrary(w,{type:'delete',id:'user-shuffle-1'});assert(workspaceForShuffledTasks(deleted,10).baseBoard.tiles.every(t=>t.text!=='说一个词1分钟'));
});
test('picture shuffling keeps original bytes, clickable regions and source text backups through repeated refresh and save/reload',()=>{
 const source=JSON.parse(fs.readFileSync(new URL('../resources/prepared-maps/reviewed-source-1-original-map.json',import.meta.url),'utf8'));
 const w=selection(workspaceForPreparedBoard(defaultWorkspace(),source)),a=workspaceForShuffledTasks(w,10),b=workspaceForShuffledTasks(a,11);
 assert.deepEqual(a.baseBoard.layout,w.baseBoard.layout);assert.deepEqual(b.baseBoard.layout,w.baseBoard.layout);
 for(const [i,t]of a.baseBoard.tiles.entries()){if(t.type==='task'){assert.equal(t.originalText,w.baseBoard.tiles[i].text);assert.equal(b.baseBoard.tiles[i].originalText,t.originalText);}else assert.deepEqual(t,w.baseBoard.tiles[i]);}
 const recovered=parseWorkspace(JSON.stringify(startWorkspace(b,{id:'image-shuffle',seed:11})));assert.deepEqual(recovered.active.config.tiles.map(t=>t.originalText),b.baseBoard.tiles.map(t=>t.originalText));
 const invalid=structuredClone(b.baseBoard);invalid.tiles[0].originalText='not a task';assert.throws(()=>validateConfig(invalid));
});
test('empty selections cannot discard an active game during refresh',()=>{const w=workspaceForTaskLibrary(startWorkspace(defaultWorkspace(),{seed:11}),{type:'select',ids:[],mode:'selected'});const before=structuredClone(w);assert.throws(()=>workspaceForShuffledTasks(w,10));assert.deepEqual(w,before);});
test('all seven level combinations refresh from exactly those levels and retain selected-only filtering',()=>{
 let w=defaultWorkspace();const texts=['观察物品10秒','观察物品20秒','观察物品30秒'];
 for(const[i,text]of texts.entries())w=workspaceForTaskLibrary(w,{type:'add',id:`user-level-${i+1}`,text,level:i+1});
 w=workspaceForTaskLibrary(w,{type:'select',ids:[1,2,3].map(n=>`user-level-${n}`),mode:'selected'});
 for(const levels of [[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]){const next=workspaceForShuffledTasks({...w,imageLevels:levels},74);const drawn=next.baseBoard.tiles.filter(t=>t.type==='task').map(t=>t.text);assert(drawn.every(t=>levels.some(n=>texts[n-1]===t)));assert(levels.every(n=>drawn.includes(texts[n-1])));parseWorkspace(JSON.stringify(startWorkspace(next,{seed:74,id:'tier-refresh'})));}
});
