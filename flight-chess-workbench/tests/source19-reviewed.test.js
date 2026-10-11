import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {parseConfigJSON} from '../src/core/config.js';import {parseImageRouteJSON} from '../src/core/imageMaps.js';import {IMAGE_CONTENT,IMAGE_TASK_TEXTS} from '../src/core/imageTaskLibrary.js';import {createGame,transition,validateState} from '../src/core/engine.js';import {makeSave,parseSave} from '../src/core/storage.js';import {defaultWorkspace,startWorkspace,parseWorkspace} from '../src/core/workspace.js';import {IMAGE_MODE_DECKS} from '../src/core/modes.js';import {IMAGE_DECK_BASELINE_PRE_SOURCE19} from '../src/core/imageDeckBaselinePreSource19.js';
const c=parseConfigJSON(fs.readFileSync(new URL('../resources/prepared-maps/reviewed-source-19-original-map.json',import.meta.url),'utf8'));
const route=parseImageRouteJSON(fs.readFileSync(new URL('../public/route-presets/verified-source-19-image-route.json',import.meta.url),'utf8'));
const act=(s,a,n)=>validateState(transition(s,c,a,n),c);
test('source19 retains original bytes, all 240 OCR lines and 61 old candidates; 73 actual regions do not overlap and unknown bodies stay out of random cards',()=>{
 const b=IMAGE_CONTENT.boards.find(b=>b.id===19);assert.equal(b.lines.length,240);assert.equal(b.rawCells.length,61);assert.equal(b.cells.length,73);assert.equal(b.cells.filter(x=>x.reviewed).length,61);assert.deepEqual(b.cells.filter(x=>!x.reviewed).map(x=>x.index),[13,17,36,39,49,62,63,64,65,68,69,72]);
 assert.equal(createHash('sha256').update(Buffer.from(c.layout.image.dataUrl.split(',')[1],'base64')).digest('hex'),'4b318ffd147fcc7652117ffc664c59640bdd11c017b6c9255eccc159b2c08137');
 assert.equal(c.layout.image.texts.filter(x=>x.id.startsWith('source19-raw-')&&x.excluded).length,240);assert.deepEqual(c.layout.image.regions,route.regions);assert.deepEqual(c.players.map(p=>p.start),[0,1]);assert.equal(c.rules.navigation,'manual');
 for(let i=0;i<73;i++){const a=route.regions[i];for(const d of route.regions.slice(i+1))assert(!(Math.min(a.x+a.width,d.x+d.width)-Math.max(a.x,d.x)>1e-8&&Math.min(a.y+a.height,d.y+d.height)-Math.max(a.y,d.y)>1e-8));}
 for(const x of b.cells.filter(x=>!x.reviewed))assert(!IMAGE_TASK_TEXTS.includes(x.text));assert.notEqual(c.tiles[24].text,c.tiles[27].text);assert(c.tiles[24].text.includes('手拉手'));assert.equal(c.tiles[45].text,'后退3格并脱掉一件衣服');
});
test('source19 clocks, conditional clauses and manual end selection preserve save/undo and remain two-player',()=>{
 for(const [position,seconds] of [[53,30],[59,60],[60,120],[67,300]]){let s=act(createGame(c),{type:'ROLL'},3);s=act(s,{type:'MOVE_TO_CELL',position});assert.equal(s.phase,'task');assert.equal(s.pending.duration,seconds);s=act(s,{type:'SET_TIMER',now:1000});assert.equal(s.pending.timerEndsAt,1000+seconds*1000);s=parseSave(JSON.stringify(makeSave(c,s))).state;s=act(s,{type:'RESOLVE_TASK',result:'skip'});assert.equal(s.turn,1);s=act(s,{type:'UNDO'});assert.equal(s.pending.timerEndsAt,1000+seconds*1000);}
 for(const position of [54,58,70]){let s=act(createGame(c),{type:'ROLL'},3);s=act(s,{type:'MOVE_TO_CELL',position});assert.equal(s.phase,'review');assert.throws(()=>act(s,{type:'SET_TIMER',now:1000}),/没有明确计时/);}
 let s=act(createGame(c),{type:'ROLL'},3);s=act(s,{type:'MOVE_TO_CELL',position:72});assert.equal(s.phase,'review');s=act(s,{type:'RESELECT_CELL'});assert.equal(s.phase,'move');s=act(s,{type:'MOVE_TO_CELL',position:72});s=act(s,{type:'RESOLVE_REVIEW',result:'apply'});assert.equal(s.phase,'finished');s=act(s,{type:'UNDO'});assert.equal(s.phase,'review');assert.equal(s.players.length,2);
});
test('source19 carries all eight external clauses, full centre and covered inner crops without guessing missing text or enforcing source penalties',()=>{
 const b=IMAGE_CONTENT.boards.find(b=>b.id===19);assert.equal(b.reviewedNotes.length,15);assert.equal(b.reviewedNotes.filter(n=>!n.reviewed).length,3);for(let i=1;i<=8;i++)assert(b.reviewedNotes.some(n=>n.text.startsWith(`${i}.`)));
 for(const i of [56,61,66,71])assert(c.tiles[i].notes.some(n=>n.text===c.tiles[i].text&&(n.region.width>route.regions[i].width||n.region.height>route.regions[i].height)));
 assert(c.tiles[72].notes.some(n=>n.region.width>route.regions[72].width&&n.text.includes('末两行文字不清')));assert(c.tiles.every(t=>['start','finish','task','plain'].includes(t.type)));assert(c.tiles[0].notes.some(n=>n.text.includes('四人版')));
});
test('source19 exact prior defaults update only new games; customized themes and active snapshots stay intact',()=>{
 const w=defaultWorkspace();w.themes=Object.entries(IMAGE_DECK_BASELINE_PRE_SOURCE19).map(([id,d])=>({id,name:d.name,desc:'保留备注',audience:'common',tasks:[...d.cards]}));w.baseBoard.decks=structuredClone(IMAGE_DECK_BASELINE_PRE_SOURCE19);const before=structuredClone(w),next=startWorkspace(w,{seed:1});assert.deepEqual(w,before);for(const t of next.themes)assert.deepEqual(t.tasks,IMAGE_MODE_DECKS[t.id].cards);assert.deepEqual(parseWorkspace(JSON.stringify(next)).active,next.active);
 const edited=structuredClone(w);edited.themes[0].tasks.push('自定内容');const custom=startWorkspace(edited,{seed:2});assert.deepEqual(custom.themes[0],edited.themes[0]);
});
