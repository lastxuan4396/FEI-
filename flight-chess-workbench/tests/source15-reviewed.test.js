import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {IMAGE_CONTENT,IMAGE_TASK_LIBRARY} from '../src/core/imageTaskLibrary.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE15} from '../src/core/imageDeckBaselinePreSource15.js';
import {IMAGE_MODE_DECKS} from '../src/core/modes.js';
import {defaultWorkspace,startWorkspace} from '../src/core/workspace.js';
import {buildImageBoard,parseImageRouteJSON} from '../src/core/imageMaps.js';
import {validateConfig,parseConfigJSON} from '../src/core/config.js';
import {createGame,transition,validateState} from '../src/core/engine.js';
const source=JSON.parse(fs.readFileSync(new URL('../public/route-presets/verified-source-15-image-route.json',import.meta.url),'utf8'));
const route=parseImageRouteJSON(JSON.stringify(source));
function config(){return buildImageBoard(route.title,{dataUrl:'data:image/jpeg;base64,AAAA',width:route.width,height:route.height},route.regions,Object.fromEntries(route.tiles.map((t,i)=>[i,t])),{navigation:route.navigation,startingPositions:route.startingPositions});}
test('source15 combines one physical finish, records all59 positions, and keeps partial unreadable text separate from raw OCR',()=>{
 const b=IMAGE_CONTENT.boards.find(b=>b.id===15);assert.equal(b.rawCells.length,60);assert.equal(b.cells.length,59);assert.equal(b.cells.filter(c=>c.reviewed).length,56);assert.equal(b.lines.length,207);assert.equal(b.reviewedNotes.length,11);assert.equal(b.reviewStatus.comparedPositions,59);
 assert.deepEqual(b.reviewStatus.mergedCandidates,[{position:58,sourceCandidates:[24,26]}]);assert.deepEqual(b.reviewStatus.unresolved.map(i=>i.position),[31,50,58]);assert(b.cells[58].text.includes('2〔小字不清〕'));assert(b.cells[58].height>.3);
 assert.equal(b.cells[1].text,'平趴\n皮带\n30');assert.equal(b.cells[21].text,'跪趴\n粗藤条具\n点数×10');assert.equal(b.cells[22].text,'跪姿\n散鞭\n点数×20');assert.equal(b.cells[11].text,'跪姿\n散鞭\n50');
 assert(!IMAGE_TASK_LIBRARY.some(t=>t.image===15&&['自动分格 26','原图连续格框第31格','原图连续格框第50格'].includes(t.cell)));
});
test('source15 keeps external notes and numbers as text, not inferred seconds or automatic dice multipliers',()=>{
 const c=config();assert.equal(c.rules.navigation,'manual');assert.equal(c.players.length,2);assert(c.tiles.every(t=>['start','finish','task'].includes(t.type)));assert.deepEqual(c.tiles.flatMap((t,i)=>t.duration?[{position:i,seconds:t.duration}]:[]),[{position:19,seconds:300}]);
 assert.equal(c.tiles[19].notes[0].text,'休息\n冰敷五分钟');assert.equal(c.tiles[29].notes[0].text,'后退点数X2');assert.equal(c.tiles[47].notes[0].text,'下两回合\n点数减半');assert.equal(c.tiles[50].notes[0].text,'下两回合\n点数减半');assert(!c.tiles[50].notes[1].reviewed);
 assert.deepEqual(parseConfigJSON(JSON.stringify(c)),c);assert.deepEqual(route.tiles.map(t=>t.notes),source.tiles.map(t=>t.notes));
});
test('note imports validate image association, bounds, review flags and count, copy values and discard arbitrary extra fields',()=>{
 const c=config();const n=c.tiles[19].notes[0];n.region.extra='discard';n.extra='discard';const validated=validateConfig(c);assert.equal(validated.tiles[19].notes[0].extra,undefined);assert.equal(validated.tiles[19].notes[0].region.extra,undefined);n.region.x=.1;assert.notEqual(validated.tiles[19].notes[0].region.x,n.region.x);
 for(const note of [{...n,region:{...n.region,x:-1}},{...n,region:{...n.region,width:1}},{...n,reviewed:'yes'},{...n,text:''}]){const bad=config();bad.tiles[19].notes=[note];assert.throws(()=>validateConfig(bad));}
 const tooMany=config();tooMany.tiles[19].notes=Array.from({length:7},()=>structuredClone(n));assert.throws(()=>validateConfig(tooMany));const nonImage=config();delete nonImage.layout.image;delete nonImage.rules.navigation;assert.throws(()=>validateConfig(nonImage));
 const older=config();older.tiles.forEach(t=>delete t.notes);assert.deepEqual(validateConfig(older),older);
});
test('source15 manual play supports note-bearing tasks, reload and undo without guessing persistent mechanics; finish requires confirmation',()=>{
 const c=config();let s=createGame(c,{seed:88});s=transition(s,c,{type:'ROLL'},3);assert.equal(s.phase,'move');s=transition(s,c,{type:'MOVE_TO_CELL',position:47});assert.equal(s.phase,'task');assert.equal(s.pending.text,c.tiles[47].text);assert.equal(s.pending.duration,undefined);assert.equal(s.players[0].multiplier,1);assert.deepEqual(validateState(JSON.parse(JSON.stringify(s)),c),s);
 const done=transition(s,c,{type:'RESOLVE_TASK',result:'done'});assert.equal(done.turn,1);assert.equal(done.players[0].multiplier,1);assert.deepEqual(transition(done,c,{type:'UNDO'}).pending,s.pending);
 let finish=createGame(c,{seed:1});finish=transition(finish,c,{type:'ROLL'},1);finish=transition(finish,c,{type:'MOVE_TO_CELL',position:58});assert.equal(finish.phase,'review');assert.equal(finish.winner,null);assert(!c.tiles[58].notes[0].reviewed);assert.equal(transition(finish,c,{type:'RESOLVE_REVIEW',result:'apply'}).phase,'finished');assert.equal(transition(finish,c,{type:'RESOLVE_REVIEW',result:'skip'}).phase,'move');
});
test('exact pre-source15 defaults upgrade for new games, preserving user edits and previous live saves',()=>{
 const w=defaultWorkspace();w.themes=Object.entries(IMAGE_DECK_BASELINE_PRE_SOURCE15).map(([id,d])=>({id,name:d.name,desc:'我的说明',audience:'common',tasks:[...d.cards]}));w.baseBoard.decks=structuredClone(IMAGE_DECK_BASELINE_PRE_SOURCE15);const before=structuredClone(w),started=startWorkspace(w,{seed:1});assert.deepEqual(w,before);for(const t of started.themes){assert.deepEqual(t.tasks,IMAGE_MODE_DECKS[t.id].cards);assert.equal(t.desc,'我的说明');}
 const edited=structuredClone(w);edited.themes[0].tasks.push('用户自定题目');assert.deepEqual(startWorkspace(edited,{seed:1}).themes[0].tasks,edited.themes[0].tasks);
});
