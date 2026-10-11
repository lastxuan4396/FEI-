import test from 'node:test';import assert from 'node:assert/strict';
import {MODES,createMode,IMAGE_MODE_DECKS,needsImageModeUpdate} from '../src/core/modes.js';
import {IMAGE_TASK_TEXTS,imageTask} from '../src/core/imageTaskLibrary.js';
import {defaultWorkspace,workspaceForMode,startWorkspace,validateWorkspace,buildConfig} from '../src/core/workspace.js';
import {createTemplate,validateConfig} from '../src/core/config.js';
test('six board modes use only the complete supplied image pool, split into mixed decks, with every deck reachable',()=>{
 for(const mode of MODES){const c=createMode(mode.id),cards=Object.values(c.decks).flatMap(d=>d.cards);assert.deepEqual(new Set(cards),new Set(IMAGE_TASK_TEXTS));assert.equal(cards.length,IMAGE_TASK_TEXTS.length);assert.deepEqual(new Set(c.tiles.filter(t=>t.type==='task').map(t=>t.deck)),new Set(Object.keys(IMAGE_MODE_DECKS)));for(const d of Object.values(c.decks))assert(new Set(d.cards.map(t=>imageTask(t).image)).size>1);assert.equal(needsImageModeUpdate(c),false);}
});
test('mode switching retains custom tasks and existing snapshot but starts from image decks instead of legacy player selection',()=>{
 const w=defaultWorkspace();w.themes.push({id:'my_library',name:'我的题库',desc:'自己编辑',audience:'common',tasks:['独立保存的文字']});w.players[0].themeId='my_library';w.taskMode='player';const old=startWorkspace(w),before=structuredClone(old);for(const mode of MODES){const updated=workspaceForMode(old,mode.id);assert.equal(updated.taskMode,'tile');assert.deepEqual(updated.themes.find(t=>t.id==='my_library').tasks,['独立保存的文字']);assert.deepEqual(new Set(Object.values(buildConfig(updated).decks).flatMap(d=>d.cards)),new Set(IMAGE_TASK_TEXTS));assert.deepEqual(old,before);assert.equal(updated.active,null);}
});
test('old idle mode can be detected without treating a custom or original-image board as a preset; 1099 tasks serialize within storage limits',()=>{
 const legacy=createTemplate();legacy.id='mode-classic';assert(needsImageModeUpdate(legacy));legacy.id='my_board';assert.equal(needsImageModeUpdate(legacy),false);const w=defaultWorkspace();assert.equal(validateWorkspace(JSON.parse(JSON.stringify(w))).themes.reduce((n,t)=>n+t.tasks.length,0),IMAGE_TASK_TEXTS.length);assert(JSON.stringify(w).length<3000000);const c=createMode('classic');c.decks.image_mix_1.cards=Array.from({length:5001},()=> '边界任务');assert.throws(()=>validateConfig(c),/5000/);
});
