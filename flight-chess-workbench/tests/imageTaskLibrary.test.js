import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IMAGE_CONTENT,IMAGE_TASK_LIBRARY,IMAGE_TASK_TEXTS} from '../src/core/imageTaskLibrary.js';
import {createArcade,arcadeTransition as go,parseArcade,validateArcade} from '../src/core/arcade.js';
const people=[{name:'甲',color:'#ce765f'},{name:'乙',color:'#739aa5'}];
test('all 27 supplied images retain every raw reading; defaults include complete tasks from every image and no inferred rule effects',()=>{
 assert.equal(IMAGE_CONTENT.boards.length,27);
 assert.deepEqual(IMAGE_CONTENT.boards.map(b=>b.id),Array.from({length:27},(_,i)=>i+1));
 assert.equal(IMAGE_CONTENT.boards.reduce((n,b)=>n+b.lines.length,0),5218);
 assert.deepEqual(JSON.parse(readFileSync('public/arcade/image-content.json','utf8')),IMAGE_CONTENT);
 assert.equal(new Set(IMAGE_TASK_TEXTS).size,IMAGE_TASK_TEXTS.length);
 assert.equal(new Set(IMAGE_TASK_LIBRARY.map(t=>t.image)).size,27);
 for(const t of IMAGE_TASK_LIBRARY){assert(t.text.trim());if(!t.reviewed){const b=IMAGE_CONTENT.boards.find(b=>b.id===t.image);assert(b.cells.some(c=>c.text===t.text&&c.type==='task'));}}
});
test('six task games and voting default to the complete image pool; recommended/custom and legacy snapshots remain supported',()=>{
 for(const kind of ['spinner','cards','coop','story','bingo','vote','estate']){const a=createArcade(kind,people);assert.equal(a.config.library,'image');assert.deepEqual(a.config.pool,IMAGE_TASK_TEXTS);assert.deepEqual(parseArcade(JSON.stringify(a)),a);}
 assert.equal(createArcade('mystery',people).config.library,'recommended');
 const original=createArcade('spinner',people,{library:'recommended'});assert(original.config.pool.length<IMAGE_TASK_TEXTS.length);delete original.config.library;const old=go(original,{type:'SPIN'});assert.equal(old.config.library,undefined);assert(old.config.pool.length<20);
 const custom=createArcade('coop',people,{pool:['自己的任务']});assert.deepEqual(go(custom,{type:'DRAW'}).state.pending.text,'自己的任务');
});
test('transcribed duration, pending source, timer and user correction survive import/reload and undo',()=>{
 let s=createArcade('coop',people,{pool:['亲女方脖子20秒'],seed:1});s=go(s,{type:'DRAW'});assert.equal(s.state.pending.duration,20);assert.equal(s.state.pending.source.image,9);assert.equal(s.state.pending.source.reviewed,true);
 s=go(s,{type:'TIMER',now:1000});assert.equal(s.state.pending.endsAt,21000);
 const before=structuredClone(s);s=go(s,{type:'EDIT_TASK',text:'核对后的任务',duration:90});assert.equal(s.state.pending.source,undefined);assert.equal(s.state.pending.endsAt,null);assert.equal(s.state.pending.edited,true);assert.equal(parseArcade(JSON.stringify(s)).state.pending.text,'核对后的任务');
 s=go(s,{type:'UNDO'});assert.deepEqual(s.state.pending,before.state.pending);
 assert.throws(()=>go(s,{type:'EDIT_TASK',text:'',duration:90}));assert.throws(()=>go(s,{type:'EDIT_TASK',text:'任务',duration:0}));
 const forged=structuredClone(before);forged.state.pending.source.image=999;assert.throws(()=>validateArcade(forged));
});
test('completed catalog excludes unreadable fragments while legacy candidate snapshots and card/bingo/story corrections remain readable',()=>{
 assert(IMAGE_TASK_LIBRARY.every(t=>t.reviewed));for(const board of IMAGE_CONTENT.boards)for(const cell of board.cells.filter(c=>!c.reviewed))assert(!IMAGE_TASK_LIBRARY.some(t=>t.image===board.id&&t.cell===cell.label&&t.text===cell.text));
 const raw=IMAGE_CONTENT.boards.find(b=>b.id===2).rawCells.find(c=>c.type==='task');const item={text:raw.text};let coop=createArcade('coop',people,{pool:[item.text]});coop=go(coop,{type:'DRAW'});coop.state.pending.source={image:2,cell:'旧自动分格',reviewed:false};coop=parseArcade(JSON.stringify(coop));assert.equal(coop.state.pending.source.reviewed,false);
 for(const kind of ['cards','bingo','story']){let a=createArcade(kind,people,{pool:[item.text],seed:5});if(kind==='cards'){a.state.players[0].hand[0]={type:'mission',text:item.text};a=go(a,{type:'PLAY',index:0});}if(kind==='bingo')a=go(a,{type:'CELL',index:0});if(kind==='story'){a=go(a,{type:'CHOOSE',index:0});a=go(a,{type:'CHOOSE',index:0});}
 a=go(a,{type:'EDIT_TASK',text:'修正后的完整任务',duration:30});a=parseArcade(JSON.stringify(a));assert.equal(a.state.pending.text,'修正后的完整任务');a=go(a,{type:'RESOLVE',done:true});assert.notEqual(a.state.phase,'task');}
});
test('vote uses image task as the ballot topic, only highest-vote players may take it and resolution adds no second award',()=>{
 let s=createArcade('vote',people,{seed:5});s=go(s,{type:'VOTE',target:1});s=go(s,{type:'VOTE',target:1});assert.throws(()=>go(s,{type:'DRAW',target:0}));const points=s.state.players[1].score;
 s=go(s,{type:'DRAW',target:1});assert.equal(s.state.pending.text,s.state.question);s=go(s,{type:'EDIT_TASK',text:'核对后的本轮任务',duration:60});s=parseArcade(JSON.stringify(s));assert.equal(s.state.question,s.state.pending.text);s=go(s,{type:'RESOLVE',done:false});assert.equal(s.state.phase,'reveal');assert.equal(s.state.players[1].score,points);s=go(s,{type:'NEXT'});assert.equal(s.state.phase,'ballot');assert.equal(s.state.round,1);
});
