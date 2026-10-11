import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {buildImageBoard,parseImageRouteJSON} from '../src/core/imageMaps.js';
import {createGame,transition,validateState} from '../src/core/engine.js';
import {validateConfig,parseConfigJSON} from '../src/core/config.js';
import {IMAGE_CONTENT,IMAGE_TASK_LIBRARY,IMAGE_TASK_TEXTS} from '../src/core/imageTaskLibrary.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE16} from '../src/core/imageDeckBaselinePreSource16.js';
import {defaultWorkspace,startWorkspace,workspaceFromBoard} from '../src/core/workspace.js';
const route=parseImageRouteJSON(fs.readFileSync(new URL('../public/route-presets/verified-source-16-image-route.json',import.meta.url),'utf8'));
const config=()=>buildImageBoard(route.title,{dataUrl:'data:image/jpeg;base64,AAAA',width:route.width,height:route.height},route.regions,Object.fromEntries(route.tiles.map((t,i)=>[i,t])),route);
const step=(s,c,a,dice)=>validateState(transition(s,c,a,dice),c);
const arrive=(s,c)=>step(step(s,c,{type:'ROLL'},3),c,{type:'MOVE_TO_CELL',position:48});
test('source16 preserves 93 raw OCR lines, adds 4 missed cells, distinguishes labels and retains literal odd words',()=>{
 const b=IMAGE_CONTENT.boards.find(b=>b.id===16);assert.equal(b.rawCells.length,45);assert.equal(b.lines.length,93);assert.equal(b.cells.length,49);assert(b.cells.every(c=>c.reviewed));assert.equal(b.reviewedNotes.length,6);assert.equal(b.reviewStatus.comparedPositions,49);assert.equal(route.tiles[25].text,'后退四\n个字');assert.equal(route.tiles[9].text,'五张发\n骚狗姿');assert(route.tiles[4].text.includes('〔鸡图案〕'));assert(route.tiles[10].text.includes('〔鸡图案〕'));assert.equal(route.tiles[22].text,'展示菊\n花');assert.equal(route.tiles[20].text,'鸡吧挂\n物');assert.equal(route.tiles[34].text,'菊花夹内\n裤甩鸡吧');assert(route.tiles[48].notes[0].text.includes('最后一个'));assert(b.reviewStatus.unresolved.length===2);assert(!IMAGE_TASK_LIBRARY.some(t=>t.image===16&&t.text==='后退四\n个字'));
});
test('source16 timers use independently read color legends, unknown blue/lavender remain unset and counts never become seconds',()=>{
 const c=config();for(const [position,seconds] of [[6,60],[7,90],[14,30],[26,60],[8,undefined],[11,undefined],[9,undefined]]){let s=step(createGame(c),c,{type:'ROLL'},3);s=step(s,c,{type:'MOVE_TO_CELL',position});assert.equal(s.pending.duration,seconds);assert.equal(s.pending.text,c.tiles[position].text);if(seconds){s=step(s,c,{type:'SET_TIMER',now:1000});assert.equal(s.pending.timerEndsAt,1000+seconds*1000);}}
 assert.equal(c.tiles[8].notes[0].reviewed,false);assert(c.tiles[8].notes[0].text.includes('数字不清'));assert.deepEqual(parseConfigJSON(JSON.stringify(c)),c);
});
test('two arrivals record first order, keep unfinished player active, persist, reject premature finish and restore by undo',()=>{
 const c=config();let s=arrive(createGame(c),c);assert.equal(s.phase,'review');assert.deepEqual(s.finishOrder,[]);s=step(s,c,{type:'RESOLVE_REVIEW',result:'skip'});assert.equal(s.phase,'move');assert.equal(s.players[0].position,0);s=step(s,c,{type:'MOVE_TO_CELL',position:48});s=step(s,c,{type:'RESOLVE_REVIEW',result:'apply'});assert.equal(s.phase,'ready');assert.equal(s.turn,1);assert.equal(s.winner,null);assert.deepEqual(s.finishOrder,['a']);s=validateState(JSON.parse(JSON.stringify(s)),c);
 s=step(s,c,{type:'ROLL'},1);s=step(s,c,{type:'MOVE_TO_CELL',position:7});s=step(s,c,{type:'RESOLVE_TASK',result:'skip'});assert.equal(s.turn,1);assert.deepEqual(s.finishOrder,['a']);s=arrive(s,c);s=step(s,c,{type:'RESOLVE_REVIEW',result:'apply'});assert.equal(s.phase,'finished');assert.equal(s.winner,'a');assert.equal(s.turn,1);assert.deepEqual(s.finishOrder,['a','b']);assert.throws(()=>transition(s,c,{type:'ROLL'}));s=step(s,c,{type:'UNDO'});assert.equal(s.phase,'review');assert.deepEqual(s.finishOrder,['a']);s=step(s,c,{type:'RESOLVE_REVIEW',result:'skip'});assert.equal(s.phase,'move');assert.equal(s.players[1].position,7);s=step(s,c,{type:'MOVE_TO_CELL',position:14});assert.equal(s.pending.duration,30);
});
test('finish order rejects duplicates, invalid player, misplaced arrival, completed current turn and wrong winner; old first-arrival boards retain behavior',()=>{
 const c=config();let s=step(arrive(createGame(c),c),c,{type:'RESOLVE_REVIEW',result:'apply'});for(const patch of [{finishOrder:['a','a']},{finishOrder:['bogus']},{finishOrder:['b']},{turn:0},{winner:'a'},{finishOrder:undefined}])assert.throws(()=>validateState({...s,...patch},c));
 s=step(arrive(s,c),c,{type:'RESOLVE_REVIEW',result:'apply'});assert.throws(()=>validateState({...s,winner:'b'},c));
 const old=config();delete old.rules.finishAllPlayers;let legacy=step(arrive(createGame(old),old),old,{type:'RESOLVE_REVIEW',result:'apply'});assert.equal(legacy.phase,'finished');assert.equal(legacy.winner,'a');assert.equal(legacy.finishOrder,undefined);
 assert.throws(()=>validateConfig({...c,rules:{...c.rules,navigation:undefined}}));assert.throws(()=>validateConfig({...c,rules:{...c.rules,finishAllPlayers:'all'}}));assert.throws(()=>validateConfig({...c,players:[...c.players,{id:'p2',name:'第三位',color:'#112233'}]}));
});
test('either player can finish first; separate start0/start5 and exact previous defaults are preserved through imports',()=>{
 const c=config();c.players[1].start=5;let s=createGame(c);assert.deepEqual(s.players.map(p=>p.position),[0,5]);s=step(s,c,{type:'ROLL'},2);s=step(s,c,{type:'MOVE_TO_CELL',position:7});s=step(s,c,{type:'RESOLVE_TASK',result:'done'});s=step(arrive(s,c),c,{type:'RESOLVE_REVIEW',result:'apply'});assert.equal(s.turn,0);assert.deepEqual(s.finishOrder,['b']);s=step(arrive(s,c),c,{type:'RESOLVE_REVIEW',result:'apply'});assert.equal(s.winner,'b');assert.deepEqual(s.finishOrder,['b','a']);
 const w=startWorkspace(workspaceFromBoard(c));assert.deepEqual(w.active.state.players.map(p=>p.position),[0,5]);assert.deepEqual(w.active.state.finishOrder,[]);
 const old=defaultWorkspace();old.themes=Object.entries(IMAGE_DECK_BASELINE_PRE_SOURCE16).map(([id,d])=>({id,name:d.name,desc:'保留描述',audience:'common',tasks:[...d.cards]}));old.baseBoard.decks=structuredClone(IMAGE_DECK_BASELINE_PRE_SOURCE16);const started=startWorkspace(old);assert.deepEqual(new Set(Object.values(started.active.config.decks).flatMap(d=>d.cards)),new Set(IMAGE_TASK_TEXTS));assert.equal(started.themes[0].desc,'保留描述');
});
