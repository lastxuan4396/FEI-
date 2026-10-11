import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultWorkspace} from '../src/core/workspace.js';
import {changeTaskLibrary,taskLibraryRows} from '../src/core/taskLibrary.js';
import {gameTaskPool} from '../src/core/gameTaskPool.js';
import {taskParameters} from '../src/core/taskParameters.js';
import {ARCADE_MODES,createArcade,arcadeTransition,parseArcade} from '../src/core/arcade.js';
import {VERSIONS,createAdventure,adventureTransition,adventureView} from '../src/core/adventure.js';
const people=[{name:'甲',color:'#aabbcc'},{name:'乙',color:'#ccbbaa'}];
function ownPool(){let w=defaultWorkspace();for(const [i,text]of ['观察物品10秒','重复动作五次','保持标记三轮'].entries())w=changeTaskLibrary(w,{type:'add',id:`user-sample${i}`,text,level:1});w=changeTaskLibrary(w,{type:'select',ids:['user-sample0','user-sample1','user-sample2'],mode:'selected'});w.imageLevels=[1];return w;}
test('All extension games snapshot the same eligible edited library and retain it after deletion and level changes',()=>{
 let w=ownPool();const snap=gameTaskPool(w);assert.deepEqual(snap.pool,['观察物品10秒','重复动作五次','保持标记三轮']);
 const arcade=ARCADE_MODES.map(m=>createArcade(m.id,people,{pool:snap.pool,sourceTexts:snap.sourceTexts,poolName:snap.name,creative:m.id!=='estate',...(m.id==='estate'?{estate:{taskMode:'linked',target:500,rounds:24}}:{})}));
 const adventures=VERSIONS.map(v=>createAdventure({variant:v.id,players:people.map(p=>p.name),...snap,poolName:snap.name}));
 w=changeTaskLibrary(w,{type:'delete',id:'user-sample0'});w.imageLevels=[3];assert.throws(()=>gameTaskPool(w),/没有可抽/);
 for(const s of arcade){assert.deepEqual(parseArcade(JSON.stringify(s)).config.pool,snap.pool);assert.equal(s.config.poolName,'我的图片题库');}
 for(const s of adventures){assert.deepEqual(s.config.pool,snap.pool);for(const m of s.costs.flat())assert(snap.pool.includes(m.text));}
 arcade[0]=arcadeTransition(arcade[0],{type:'SPIN'});assert(snap.pool.includes(arcade[0].state.pending.text));
});
test('Edits and duration/count settings retain source wording while direct execution uses the actual edited text',()=>{
 let w=defaultWorkspace();const row=taskLibraryRows(w).find(r=>!r.deleted&&r.image);w=changeTaskLibrary(w,{type:'edit',id:row.id,text:'观察物品10秒，重复五次',level:1});w=changeTaskLibrary(w,{type:'select',ids:[row.id],mode:'selected'});w.imageLevels=[1];
 const preferences={[taskParameters('观察物品10秒，重复五次').key]:[7,2]},snap=gameTaskPool(w,'@personal',preferences);assert.deepEqual(snap.pool,['观察物品7秒，重复2次']);assert.equal(snap.sourceTexts[snap.pool[0]],row.original);
 let s=createAdventure({variant:'rps',players:['甲','乙'],pool:snap.pool,sourceTexts:snap.sourceTexts,parameters:preferences});assert.equal(s.costs[0][0].duration,7);assert.equal(s.costs[0][0].original,row.original);s=adventureTransition(s,{type:'SELECT',index:0},0);assert.equal(s.secret[0].task.text,snap.pool[0]);
 let a=createArcade('spinner',people,{...snap,poolName:snap.name,creative:true});a=arcadeTransition(a,{type:'SPIN'});assert.equal(a.state.pending.text,snap.pool[0]);assert.equal(a.state.pending.duration,7);assert.equal(a.state.pending.original,row.original);
});
test('Three preference options stay distinct across deals and reject insufficient unique choices; other variants permit one task',()=>{
 assert.throws(()=>createAdventure({variant:'preference',players:['甲','乙'],pool:['一个','一个','另一个']}),/至少3条不同/);
 for(const variant of VERSIONS.filter(v=>v.id!=='preference').map(v=>v.id))assert(createAdventure({variant,players:['甲','乙'],pool:['同一任务']}));
 let s=createAdventure({variant:'preference',players:['甲','乙'],pool:['甲题','乙题','丙题'],settings:{rounds:99}});
 for(let i=0;i<50;i++){assert.equal(new Set(s.options).size,3);s=adventureTransition(s,{type:'SELECT',favorite:0,guess:0},0);s=adventureTransition(s,{type:'SELECT',favorite:0,guess:0},1);s=adventureTransition(s,{type:'NEXT',epoch:s.epoch},0);}
});
test('Theme choice, source provenance validation and external mutations cannot silently change an active hand',()=>{
 const w=ownPool();w.themes.push({id:'user-custom',name:'自建示例',audience:'common',desc:'',tasks:['自己的任务']});assert.deepEqual(gameTaskPool(w,'user-custom').pool,['自己的任务']);assert.throws(()=>gameTaskPool(w,'missing'),/找不到/);
 const config={variant:'rps',players:['甲','乙'],pool:['任务甲'],sourceTexts:{任务甲:'来源甲'},poolName:'自己的题库'};const s=createAdventure(config);config.pool[0]='突然改变';config.sourceTexts.任务甲='突然改变';assert.deepEqual(s.config.pool,['任务甲']);assert.equal(s.costs[0][0].original,'来源甲');
 assert.throws(()=>createAdventure({...s.config,sourceTexts:{不在池中:'来源'}}),/来源记录/);assert.throws(()=>createArcade('spinner',people,{pool:['任务'],poolName:'x'.repeat(101)}),/题库名称/);
});
test('Room views expose only the host snapshot continuous pool and count, while peer decisions remain private',()=>{
 let s=createAdventure({variant:'preference',players:['甲','乙'],pool:['观察标记7秒','重复标记两次','状态标记三轮'],poolName:'我的图片题库'});
 s=adventureTransition(s,{type:'SELECT',favorite:1,guess:2},0);const v=adventureView(s,1);
 assert.equal(v.config.poolSize,3);assert.deepEqual(v.config.pool,[]);assert.deepEqual(v.config.directPool,['观察标记7秒','重复标记两次','状态标记三轮']);assert.equal(v.secret[0],null);assert.deepEqual(v.costs[0],[]);assert.equal(new Set(v.options).size,3);assert.equal(v.config.poolName,'我的图片题库');
});

test('Both room actors see the same host parameter snapshot, including variable counters made definite',()=>{
 const pool=['观察10秒','重复X次','保持2回合'],parameters=Object.fromEntries(pool.map(text=>[taskParameters(text).key,[7]]));const s=createAdventure({variant:'rps',players:['甲','乙'],pool,parameters});
 for(const actor of [0,1]){const v=adventureView(s,actor);assert.deepEqual(v.config.parameters,parameters);assert.deepEqual(v.config.directPool,pool);assert(s.costs[actor].every(m=>/7/.test(m.text)));}
 parameters[taskParameters(pool[1]).key][0]=91;assert.equal(adventureView(s,1).config.parameters[taskParameters(pool[1]).key][0],7);
});
