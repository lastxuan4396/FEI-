import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {buildImageBoard,parseImageRouteJSON} from '../src/core/imageMaps.js';
import {createGame,transition,validateState} from '../src/core/engine.js';
import {imageTaskLevel} from '../src/core/imageLevels.js';
import {parseConfigJSON} from '../src/core/config.js';
import {IMAGE_CONTENT,IMAGE_TASK_LIBRARY,IMAGE_TASK_TEXTS} from '../src/core/imageTaskLibrary.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE17} from '../src/core/imageDeckBaselinePreSource17.js';
import {defaultWorkspace,startWorkspace,workspaceFromBoard} from '../src/core/workspace.js';
const route=parseImageRouteJSON(fs.readFileSync(new URL('../public/route-presets/verified-source-17-image-route.json',import.meta.url),'utf8'));
const config=()=>buildImageBoard(route.title,{dataUrl:'data:image/jpeg;base64,AAAA',width:route.width,height:route.height},route.regions,Object.fromEntries(route.tiles.map((t,i)=>[i,t])),route);
const step=(s,c,a,dice)=>validateState(transition(s,c,a,dice),c);
test('source17 keeps frame geometry and raw OCR separate, with two starts and unreadable outside notes',()=>{
 const b=IMAGE_CONTENT.boards.find(b=>b.id===17);assert.equal(b.rawCells.length,74);assert.equal(b.lines.length,103);assert.equal(b.cells.length,43);assert(b.cells.every(c=>c.reviewed));assert.equal(route.width,513);assert.equal(route.height,680);assert.deepEqual(route.startingPositions,[0,1]);assert.equal(route.navigation,'manual');assert.equal(route.regions[0].x*513,399);assert.equal(route.regions[1].x*513,457);assert.equal(route.regions[42].y*680,306);assert.equal(route.tiles[0].text,'开始');assert.equal(route.tiles[1].text,'开始');assert.equal(route.tiles[42].text,'结束');assert.equal(b.reviewedNotes[0].reviewed,true);assert.equal(b.reviewedNotes[1].reviewed,false);assert.equal(b.reviewedNotes[2].reviewed,false);assert.equal(b.reviewStatus.unresolved.length,2);assert(b.lines[0].text.includes('农牛大冒险'));assert(!IMAGE_TASK_LIBRARY.some(t=>t.image===17&&/^后退|^回到|^开始|^结束/.test(t.text)));
});
test('source17 explicit duration, unspecified conditions and counts remain distinct and survive undo',()=>{
 const c=config();assert.deepEqual(createGame(c).players.map(p=>p.position),[0,1]);assert.equal(c.rules.finishAllPlayers,undefined);for(const [position,duration]of [[2,60],[8,30],[21,10],[27,600],[28,10],[30,10],[34,600],[36,10],[17,undefined],[31,undefined],[3,undefined],[24,undefined]]){let s=step(createGame(c),c,{type:'ROLL'},2);s=step(s,c,{type:'MOVE_TO_CELL',position});assert.equal(s.pending.duration,duration);assert.equal(s.pending.text,c.tiles[position].text);if(duration){s=step(s,c,{type:'SET_TIMER',now:1000});assert.equal(s.pending.timerEndsAt,1000+1000*duration);s=validateState(JSON.parse(JSON.stringify(s)),c);}s=step(s,c,{type:'RESOLVE_TASK',result:'skip'});assert.equal(s.turn,1);s=step(s,c,{type:'UNDO'});assert.equal(s.pending.text,c.tiles[position].text);}
 assert.deepEqual(parseConfigJSON(JSON.stringify(c)),c);let s=step(createGame(c),c,{type:'ROLL'},3);s=step(s,c,{type:'MOVE_TO_CELL',position:42});s=step(s,c,{type:'RESOLVE_REVIEW',result:'skip'});assert.equal(s.phase,'move');assert.equal(s.players[0].position,0);s=step(s,c,{type:'MOVE_TO_CELL',position:42});s=step(s,c,{type:'RESOLVE_REVIEW',result:'apply'});assert.equal(s.phase,'finished');assert.equal(s.winner,'a');
});
test('source17 start positions persist and only exact prior default decks refresh',()=>{
 const c=config(),w=startWorkspace(workspaceFromBoard(c));assert.equal(w.active.state.players.length,2);assert.deepEqual(w.active.state.players.map(p=>p.position),[0,1]);const old=defaultWorkspace();old.themes=Object.entries(IMAGE_DECK_BASELINE_PRE_SOURCE17).map(([id,d])=>({id,name:d.name,desc:'保留描述',audience:'common',tasks:[...d.cards]}));old.baseBoard.decks=structuredClone(IMAGE_DECK_BASELINE_PRE_SOURCE17);const updated=startWorkspace(old);assert.deepEqual(new Set(Object.values(updated.active.config.decks).flatMap(d=>d.cards)),new Set(IMAGE_TASK_TEXTS));assert.equal(updated.themes[0].desc,'保留描述');const changed=structuredClone(old);changed.themes[0].tasks[0]='用户自定义文字';assert.equal(startWorkspace(changed).themes[0].tasks[0],'用户自定义文字');
});

test('literal source spellings and unspecified control clauses do not slip into the basic random pool',()=>{
 for(const index of [2,3,10,12,28,33,34])assert.equal(imageTaskLevel(route.tiles[index].text),2);for(const index of [17,27,30,31,38,39,41])assert.equal(imageTaskLevel(route.tiles[index].text),3);
});
