import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {IMAGE_CONTENT} from '../src/core/imageTaskLibrary.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE10} from '../src/core/imageDeckBaselinePreSource10.js';
import {IMAGE_MODE_DECKS} from '../src/core/modes.js';
import {defaultWorkspace,startWorkspace} from '../src/core/workspace.js';
import {buildImageBoard,parseImageRouteJSON} from '../src/core/imageMaps.js';
import {validateConfig} from '../src/core/config.js';import {createGame,transition,validateState} from '../src/core/engine.js';
import {proposeRule} from '../src/core/imageText.js';
import {makeSave,parseSave} from '../src/core/storage.js';import {ruleDescription} from '../src/core/imageRuleReview.js';
const route=parseImageRouteJSON(fs.readFileSync(new URL('../public/route-presets/verified-source-10-image-route.json',import.meta.url),'utf8'));
function config(){const c=buildImageBoard(route.title,{dataUrl:'data:image/jpeg;base64,AAAA',width:route.width,height:route.height},route.regions,Object.fromEntries(route.tiles.map((t,i)=>[i,t])));c.rules.chainEffects=false;return c;}
const land=(c,i,s=createGame(c,{seed:1}))=>{s=structuredClone(s);s.turn=0;s.players[0].position=i-1;return transition(s,c,{type:'ROLL'},1);};
test('source10 preserves all 63 original physical positions, old OCR and blank rule, with no task placeholders',()=>{
 const b=IMAGE_CONTENT.boards.find(b=>b.id===10);assert.equal(b.rawCells.length,63);assert.equal(b.cells.length,63);assert.equal(b.lines.length,121);assert(b.cells.every(c=>c.reviewed));assert.equal(route.tiles[0].text,'起点');assert.equal(route.tiles[62].text,'决定最终姿势');
 assert.equal(route.tiles[12].text,'后退5部');assert.equal(route.tiles[12].steps,-5);assert(b.reviewedNotes.some(n=>n.text.includes('则〔原图空白〕')));assert(b.reviewedNotes.some(n=>n.text.includes('无道具版本')));assert(b.reviewedNotes.some(n=>n.text.includes('@是花椒妹丫_')));
 assert.equal(route.tiles[57].text,'互换身份1day');assert.equal(route.tiles[57].duration,undefined);
 assert.equal(route.tiles[7].duration,300);assert.equal(route.tiles[50].duration,30);assert.equal(route.tiles[15].duration,120);
 for(const t of route.tiles)assert(t.text);
});
test('all source10 moves await original review, skip does not move, and finish can be reviewed and undone',()=>{
 const c=config();for(const i of [12,13,43]){const s=land(c,i);assert.equal(s.phase,'review');validateState(s,c);const applied=transition(s,c,{type:'RESOLVE_REVIEW',result:'apply'});assert.equal(applied.players[0].position,i+c.tiles[i].steps);validateState(applied,c);const undo=transition(applied,c,{type:'UNDO'});assert.equal(undo.phase,'review');const skipped=transition(undo,c,{type:'RESOLVE_REVIEW',result:'skip'});assert.equal(skipped.players[0].position,i);validateState(skipped,c);}
 let s=land(c,62);assert.equal(s.phase,'review');s=transition(s,c,{type:'RESOLVE_REVIEW',result:'apply'});assert.equal(s.phase,'finished');s=transition(s,c,{type:'UNDO'});assert.equal(s.phase,'review');validateState(s,c);
});
test('next task scale differs from dice double and survives other turns, rule skip, task skip, clocks, reload and undo',()=>{
 const c=config();let s=land(c,42);assert.equal(s.phase,'review');assert.equal(transition(s,c,{type:'RESOLVE_REVIEW',result:'skip'}).players[0].taskFactor,undefined);
 s=transition(s,c,{type:'RESOLVE_REVIEW',result:'apply'});assert.equal(s.players[0].taskFactor,2);assert.equal(s.players[0].multiplier,1);assert.equal(s.turn,1);validateState(s,c);
 s=transition(s,c,{type:'ROLL'},1);assert.equal(s.pending.taskFactor,undefined);s=transition(s,c,{type:'RESOLVE_TASK',result:'skip'});assert.equal(s.players[0].taskFactor,2);
 s=transition(s,c,{type:'ROLL'},1);assert.equal(s.players[0].position,43);s=transition(s,c,{type:'RESOLVE_REVIEW',result:'skip'});assert.equal(s.players[0].taskFactor,2);
 s=transition(s,c,{type:'ROLL'},1);s=transition(s,c,{type:'RESOLVE_TASK',result:'done'});s=transition(s,c,{type:'ROLL'},1);assert.equal(s.pending.text,'当场学习新姿势并试用2min');assert.equal(s.pending.duration,240);assert.equal(s.pending.taskFactor,2);assert.equal(s.lastMove.multiplier,1);
 s=transition(s,c,{type:'SET_TIMER',now:1000});assert.equal(s.pending.timerEndsAt,241000);s=parseSave(JSON.stringify(makeSave(c,s))).state;validateState(s,c);
 const altered=structuredClone(s);altered.pending.duration=120;assert.throws(()=>validateState(altered,c));
 const mismatched=structuredClone(s);delete mismatched.players[0].taskFactor;assert.throws(()=>validateState(mismatched,c));
 let resolved=transition(s,c,{type:'RESOLVE_TASK',result:'skip'});assert.equal(resolved.players[0].taskFactor,undefined);resolved=transition(resolved,c,{type:'UNDO'});assert.equal(resolved.pending.taskFactor,2);assert.equal(resolved.pending.timerEndsAt,241000);validateState(resolved,c);
 resolved=transition(resolved,c,{type:'RESOLVE_TASK',result:'done'});assert.equal(resolved.players[0].taskFactor,undefined);
 assert(ruleDescription(c.tiles[42]).includes('骰子点数不变'));
});
test('scale replaces instead of compounding, halves odd seconds exactly, supports maximum deadline and rejects malformed/new fields in manual maps',()=>{
 const c=config();c.tiles[42].factor=.5;c.tiles[44].text='保持5秒';c.tiles[44].duration=5;validateConfig(c);
 let s=land(c,42);s.players[0].taskFactor=.5;s=transition(s,c,{type:'RESOLVE_REVIEW',result:'apply'});assert.equal(s.players[0].taskFactor,.5);
 s=land(c,44,s);assert.equal(s.pending.duration,2.5);s=transition(s,c,{type:'SET_TIMER',now:1000});assert.equal(s.pending.timerEndsAt,3500);validateState(s,c);parseSave(JSON.stringify(makeSave(c,s)));
 const bad=structuredClone(s);bad.pending.taskFactor=3;assert.throws(()=>validateState(bad,c));const malformed=structuredClone(c);malformed.tiles[42].factor=4;assert.throws(()=>validateConfig(malformed));
 const manual=structuredClone(c);manual.rules.navigation='manual';assert.throws(()=>validateConfig(manual));
 c.tiles[42].factor=2;c.tiles[44].text='保持24小时';c.tiles[44].duration=86400;s=land(c,42);s=transition(s,c,{type:'RESOLVE_REVIEW',result:'apply'});s=land(c,44,s);assert.equal(s.pending.duration,172800);s=transition(s,c,{type:'SET_TIMER',now:10_000_000_000_000});validateState(s,c);
 const legacy=config();delete legacy.tiles[7].duration;const legacyState=land(legacy,7);delete legacyState.pending.duration;validateState(legacyState,legacy);
});
test('source11 now uses independent next-task scale rather than changing its dice or rewriting original text',()=>{
 const r=parseImageRouteJSON(fs.readFileSync(new URL('../public/route-presets/verified-source-11-image-route.json',import.meta.url),'utf8'));assert.deepEqual(r.tiles[24],{type:'taskScale',factor:.5,text:'下个减半',label:'下个减半'});assert.equal(r.tiles[33].factor,2);assert.equal(r.tiles[33].text,'下个翻倍');
});
test('only exact pre-source10 default decks upgrade, preserving active saves and custom edits',()=>{
 const w=defaultWorkspace();w.themes=Object.entries(IMAGE_DECK_BASELINE_PRE_SOURCE10).map(([id,d])=>({id,name:d.name,desc:'自定说明',audience:'common',tasks:[...d.cards]}));w.baseBoard.decks=structuredClone(IMAGE_DECK_BASELINE_PRE_SOURCE10);const result=startWorkspace(w,{seed:1});for(const t of result.themes){assert.deepEqual(t.tasks,IMAGE_MODE_DECKS[t.id].cards);assert.equal(t.desc,'自定说明');}
 const edited=structuredClone(w);edited.themes[0].tasks.push('玩家新增题目');assert.deepEqual(startWorkspace(edited,{seed:1}).themes[0].tasks,edited.themes[0].tasks);
 const active=JSON.stringify(result.active);const cloned=structuredClone(result);assert.equal(JSON.stringify(cloned.active),active);
});

test('import rule suggestions distinguish next item from dice and require explicit confirmation for exact prose',()=>{
 for(const t of ['下一项翻倍','下个翻倍','下一个任务双倍'])assert.deepEqual(proposeRule(t).tile,{type:'taskScale',factor:2});
 assert.deepEqual(proposeRule('下个减半').tile,{type:'taskScale',factor:.5});assert.equal(proposeRule('下次点数翻倍').tile.type,'double');
 assert.equal(proposeRule('如果下个任务完成则翻倍'),null);assert.equal(proposeRule('下个减半并前进两格'),null);
});
