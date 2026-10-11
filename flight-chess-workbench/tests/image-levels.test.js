import test from 'node:test';import assert from 'node:assert/strict';
import {IMAGE_TASK_TEXTS} from '../src/core/imageTaskLibrary.js';import {imageTaskLevel,validateImageLevels} from '../src/core/imageLevels.js';
import {MODES,createMode} from '../src/core/modes.js';import {defaultWorkspace,workspaceForImageLevels,workspaceForMode,buildConfig,startWorkspace,parseWorkspace} from '../src/core/workspace.js';import {createGame,transition,validateState} from '../src/core/engine.js';
const combinations=[[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]];
test('each of the seven level selections keeps exactly the selected source tasks in all six modes',()=>{
 const counts=[1,2,3].map(level=>IMAGE_TASK_TEXTS.filter(t=>imageTaskLevel(t)===level).length);assert(counts.every(n=>n>6));
 for(const levels of combinations)for(const mode of MODES){const c=createMode(mode.id,{levels}),cards=Object.values(c.decks).flatMap(d=>d.cards),expected=IMAGE_TASK_TEXTS.filter(t=>levels.includes(imageTaskLevel(t)));assert.deepEqual(new Set(cards),new Set(expected));assert.equal(cards.length,expected.length);}
});
test('multi-level selections persist, filter old/full editable image themes, and do not alter an existing game',()=>{
 const active=startWorkspace(defaultWorkspace(),{seed:1}),snapshot=structuredClone(active.active);for(const levels of combinations){const next=workspaceForImageLevels(active,levels);assert.deepEqual(next.active,snapshot);assert.deepEqual(active.active,snapshot);assert.deepEqual(parseWorkspace(JSON.stringify(next)).imageLevels,levels);const idle=workspaceForMode(next,'classic'),c=buildConfig(idle);assert(Object.values(c.decks).flatMap(d=>d.cards).every(t=>levels.includes(imageTaskLevel(t))));assert.equal(idle.themes.reduce((n,t)=>n+t.tasks.length,0),IMAGE_TASK_TEXTS.length);}
});
test('random card draws use only chosen levels and serialize correctly; empty, duplicate and out-of-range selections fail',()=>{
 const c=createMode('classic',{levels:[1,2]});c.rules.launchOnSix=false;let s=createGame(c,{seed:51}),draws=0;for(let i=0;i<100&&s.phase!=='finished';i++){s=transition(s,c,s.phase==='task'?{type:'RESOLVE_TASK',result:'skip'}:{type:'ROLL'});validateState(JSON.parse(JSON.stringify(s)),c);if(s.pending){assert([1,2].includes(imageTaskLevel(s.pending.text)));draws++;}}assert(draws>2);assert.deepEqual(validateImageLevels([2,1]),[1,2]);for(const levels of [[],[0],[4],[1,1],['1'],null]){assert.throws(()=>validateImageLevels(levels));assert.throws(()=>createMode('classic',{levels}));}
});
