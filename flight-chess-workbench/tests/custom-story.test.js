import test from 'node:test';import assert from 'node:assert/strict';
import {createArcade,arcadeTransition as go,parseArcade,validateArcade} from '../src/core/arcade.js';
import {creativeTaskEffect} from '../src/core/arcadeCreative.js';
import {storyMap,storyMemento} from '../src/core/storyMaps.js';
const people=[{name:'甲',color:'#739aa5'},{name:'乙',color:'#ce765f'}],pool=['观察一件物品10秒','说一句感谢'];
const fresh=(chapters,creative=true,detours=chapters,rounds=99)=>createArcade('story',people,{creative,pool,story:{chapters,detours},rounds});
const reload=s=>parseArcade(JSON.stringify(s));
test('configurable Ink journeys complete exact chapter counts through every ending in both editions',()=>{
 for(const chapters of [1,4,10,20])for(const creative of [false,true])for(const ending of [0,1,2,3]){
  let s=fresh(chapters,creative);let resolved=0;
  for(let i=0;i<chapters;i++){
   assert.equal(s.state.node,`chapter${i+1}`);s=go(s,{type:'CHOOSE',index:i%2});assert.equal(s.state.phase,'task');assert(pool.includes(s.state.pending.text));assert.equal(s.state.pending.duration,s.state.pending.text.includes('10秒')?10:60);
   s=reload(s);s=go(s,{type:'RESOLVE',done:i%3!==0});resolved++;
  }
  assert.equal(s.state.node,'finale');assert.equal(resolved,chapters);s=go(s,{type:'CHOOSE',index:ending});assert.equal(s.state.phase,'finished');assert.equal(s.state.node,['stars','home','letter','show'][ending]);assert.equal(s.state.moves,chapters*2+1);assert.deepEqual(reload(s),s);if(creative)assert.equal(s.state.creative.journal.length,chapters*2+2);
 }
});
test('per-chapter detours return to the same Ink choices, respect configured cap and retain unique mementos',()=>{
 let s=fresh(4,true,2);s=go(s,{type:'STORY_DETOUR'});assert(creativeTaskEffect(s).includes('旅途印记'));s=go(s,{type:'TIMER',now:1000});const save=s.state.storySave;s=reload(s);s=go(s,{type:'RESOLVE',done:true});assert.equal(s.state.storySave,save);assert.equal(s.state.node,'chapter1');assert.equal(s.state.creative.mementos[0],storyMemento(s.config,'chapter1'));assert.throws(()=>go(s,{type:'STORY_DETOUR'}));s=go(s,{type:'CHOOSE',index:1});s=go(s,{type:'RESOLVE',done:false});s=go(s,{type:'STORY_DETOUR'});s=go(s,{type:'RESOLVE',done:false});assert.equal(s.state.creative.mementos.length,1);s=go(s,{type:'CHOOSE',index:0});s=go(s,{type:'RESOLVE',done:true});assert.throws(()=>go(s,{type:'STORY_DETOUR'}));assert.deepEqual(reload(s),s);assert.throws(()=>go(fresh(2,true,0),{type:'STORY_DETOUR'}));
});
test('twenty chapters support twenty unique collections and long saved logs',()=>{
 let s=fresh(20);for(let i=0;i<20;i++){s=go(s,{type:'STORY_DETOUR'});s=go(s,{type:'RESOLVE',done:true});s=go(s,{type:'CHOOSE',index:i%2});s=go(s,{type:'RESOLVE',done:true});s=reload(s);}s=go(s,{type:'CHOOSE',index:2});assert.equal(s.state.creative.mementos.length,20);assert.equal(new Set(s.state.creative.mementos).size,20);assert(s.state.ending.includes('第20章'));assert.equal(s.state.trust,61);assert.deepEqual(reload(s),s);
});
test('chapter route can undo choice, timed task edit, chapter transition and finale; round cap remains independent',()=>{
 let s=fresh(4);const opening=s.state.storySave;s=go(s,{type:'CHOOSE',index:1});s=go(s,{type:'UNDO'});assert.equal(s.state.storySave,opening);s=go(s,{type:'CHOOSE',index:0});s=go(s,{type:'EDIT_TASK',text:'观察20秒',duration:20});s=go(s,{type:'TIMER',now:1000});s=reload(s);assert.equal(s.state.pending.endsAt,21000);s=go(s,{type:'RESOLVE',done:true});assert.equal(s.state.node,'chapter2');s=go(s,{type:'UNDO'});assert.equal(s.state.node,'chapter1_0');assert.equal(s.state.pending.text,'观察20秒');let capped=fresh(20,true,0,1);capped=go(capped,{type:'CHOOSE',index:0});capped=go(capped,{type:'RESOLVE',done:true});assert.equal(capped.state.phase,'finished');assert.match(capped.state.ending,/设定回合数/);assert.equal(capped.state.moves,2);
 let end=fresh(1);end=go(end,{type:'CHOOSE',index:0});end=go(end,{type:'RESOLVE',done:true});end=go(end,{type:'CHOOSE',index:3});end=go(end,{type:'UNDO'});assert.equal(end.state.node,'finale');assert.equal(end.state.phase,'choice');
});
test('old Ink saves retain original choices and new maps reject mismatched count, forged node and out-of-range configuration',()=>{
 let old=createArcade('story',people,{creative:true,pool});assert.equal(old.state.node,'start');old=go(old,{type:'CHOOSE',index:1});assert.equal(reload(old).state.node,'city');assert.equal(storyMap(old.config).city.options.length,2);
 for(const rules of [{chapters:0,detours:0},{chapters:21,detours:0},{chapters:2,detours:3},{chapters:2,detours:-1}])assert.throws(()=>createArcade('story',people,{story:rules}));assert.throws(()=>createArcade('coop',people,{story:{chapters:2,detours:1}}));
 for(const mutate of [s=>s.config.story.chapters=3,s=>s.state.node='chapter2',s=>s.state.creative.journal=['chapter2','chapter1'],s=>s.state.storySave='{}']){const s=fresh(4);mutate(s);assert.throws(()=>validateArcade(s));}
});

test('long story supports persistent card bonuses beyond the old short-route trust cap',()=>{
 let s=fresh(20);for(let i=0;i<20;i++){
  for(const cardId of ['story-trust','story-path'])s=go(s,{type:'EFFECT_ADD',now:1000,effect:{cardId,targets:['0','1']}});
  s=go(s,{type:'STORY_DETOUR'});s=go(s,{type:'RESOLVE',done:true});s=go(s,{type:'CHOOSE',index:0});s=go(s,{type:'RESOLVE',done:true});
  for(const effect of [...s.state.effects])s=go(s,{type:'EFFECT_END',effectId:effect.id});s=reload(s);
 }assert(s.state.trust>100);assert.equal(s.state.creative.mementos.length,20);s=go(s,{type:'CHOOSE',index:0});assert.equal(s.state.phase,'finished');assert.deepEqual(reload(s),s);
});
