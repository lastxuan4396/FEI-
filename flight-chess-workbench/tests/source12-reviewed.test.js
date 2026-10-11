import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {IMAGE_CONTENT,imageTask} from '../src/core/imageTaskLibrary.js';
import {IMAGE_DECK_BASELINE_174} from '../src/core/imageDeckBaseline174.js';
import {IMAGE_MODE_DECKS} from '../src/core/modes.js';
import {defaultWorkspace,startWorkspace} from '../src/core/workspace.js';
import {buildImageBoard,parseImageRouteJSON} from '../src/core/imageMaps.js';
import {createGame,transition} from '../src/core/engine.js';
const route=parseImageRouteJSON(fs.readFileSync(new URL('../public/route-presets/verified-source-12-image-route.json',import.meta.url),'utf8'));
function config(){const c=buildImageBoard(route.title,{dataUrl:'data:image/jpeg;base64,AAAA',width:route.width,height:route.height},route.regions,Object.fromEntries(route.tiles.map((t,i)=>[i,t])));c.rules.chainEffects=false;return c;}
test('source12 recovers three physically missing squares, preserves old candidates and raw text, and keeps blank rules explicit',()=>{
 const b=IMAGE_CONTENT.boards.find(b=>b.id===12);assert.equal(b.rawCells.length,49);assert.equal(b.cells.length,52);assert.equal(b.cells.filter(c=>c.reviewed).length,52);
 assert.equal(route.regions.length,52);assert.equal(b.cells[0].text,'预热准备\n洗手消毒\n毛巾空调');assert.equal(b.cells[51].text,'决定最终姿势');
 for(const i of [5,23,32])assert(!b.rawCells.some(c=>Math.abs(c.x-b.cells[i].x)<.01&&Math.abs(c.y-b.cells[i].y)<.01));
 assert.equal(b.cells[5].text,'互相舔乳头10s');assert.equal(b.cells[32].text,'前进2格');
 assert(b.reviewedNotes.some(n=>n.text.includes('2.〔原图空白〕')));assert.deepEqual(b.reviewedNotes.filter(n=>n.graphic).map(n=>n.graphic).sort(),['down','left','right','up']);
 assert(b.lines.some(l=>l.text.includes('1')));assert.equal(b.reviewStatus.missedOriginalCells,3);
});
test('source12 literal greater-than timing is not collapsed into an exact timer in either map or random library',()=>{
 for(const i of [1,33]){assert(route.tiles[i].text.includes('>10s'));assert.equal(route.tiles[i].duration,undefined);assert.equal(imageTask(route.tiles[i].text).duration,undefined);}
 assert.equal(route.tiles[8].duration,10);assert.equal(route.tiles[30].duration,30);
});
test('all ten source12 arrows move the correct distance only after original-text review; undo, skip and final confirmation work',()=>{
 const c=config();const at=i=>{const state=createGame(c,{seed:1});state.players[0].position=i-1;return transition(state,c,{type:'ROLL'},1);};
 const moves=c.tiles.flatMap((tile,i)=>tile.type==='move'?[{tile,i}]:[]);assert.equal(moves.length,10);
 for(const {tile,i} of moves){const reviewed=at(i);assert.equal(reviewed.phase,'review');assert.equal(c.tiles[reviewed.review.position].text,tile.text);assert.equal(reviewed.players[0].position,i);
  const applied=transition(reviewed,c,{type:'RESOLVE_REVIEW',result:'apply'});assert.equal(applied.players[0].position,i+tile.steps);
  const undone=transition(applied,c,{type:'UNDO'});assert.equal(undone.phase,'review');assert.equal(undone.players[0].position,i);
  const skipped=transition(reviewed,c,{type:'RESOLVE_REVIEW',result:'skip'});assert.equal(skipped.players[0].position,i);assert.equal(skipped.phase,'ready');
 }
 const finish=at(51);assert.equal(finish.phase,'review');assert.equal(transition(finish,c,{type:'RESOLVE_REVIEW',result:'apply'}).phase,'finished');
});
test('exact pre-source12 defaults refresh, while user edits and active saves stay as saved',()=>{
 const w=defaultWorkspace();w.themes=Object.entries(IMAGE_DECK_BASELINE_174).map(([id,d])=>({id,name:d.name,desc:'自定说明',audience:'common',tasks:[...d.cards]}));w.baseBoard.decks=structuredClone(IMAGE_DECK_BASELINE_174);
 const before=structuredClone(w),started=startWorkspace(w,{seed:1});assert.deepEqual(w,before);
 for(const t of started.themes){assert.deepEqual(t.tasks,IMAGE_MODE_DECKS[t.id].cards);assert.equal(t.desc,'自定说明');}
 const edited=structuredClone(w);edited.themes[0].tasks.push('用户自定题目');const result=startWorkspace(edited,{seed:1});assert.deepEqual(result.themes[0].tasks,edited.themes[0].tasks);
});
