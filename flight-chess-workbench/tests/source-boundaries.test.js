import test from 'node:test';
import assert from 'node:assert/strict';
import {IMAGE_CONTENT,IMAGE_TASK_LIBRARY,IMAGE_TASK_TEXTS,imageTask} from '../src/core/imageTaskLibrary.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE_BOUNDARIES} from '../src/core/imageDeckBaselinePreSourceBoundaries.js';
import {IMAGE_MODE_DECKS} from '../src/core/modes.js';
import {defaultWorkspace,startWorkspace,parseWorkspace} from '../src/core/workspace.js';
import {taskKey,taskLibraryRows,selectedTaskRows} from '../src/core/taskLibrary.js';
const boundaryPositions={18:[0,45],23:[0,64],25:[0,48]};
test('source starts and finish annotations stay verbatim but never join the default random task bank',()=>{
 for(const [id,positions]of Object.entries(boundaryPositions)){const board=IMAGE_CONTENT.boards.find(b=>b.id===+id);for(const position of positions){const c=board.cells[position];assert.equal(c.type,'label');assert(c.reviewed);assert(!IMAGE_TASK_TEXTS.includes(c.text));assert.equal(imageTask(c.text),undefined);for(const deck of Object.values(IMAGE_MODE_DECKS))assert(!deck.cards.includes(c.text));}}
 const source=IMAGE_CONTENT.boards.find(b=>b.id===18);assert.equal(source.cells.length,46);assert.equal(source.rawCells.length,46);assert.equal(source.reviewedNotes[0].reviewed,true);assert.equal(source.cells[16].printedNumber,16);assert.equal(imageTask(source.cells[16].text).cell,'印刷16格');
});
test('legacy one-based OCR record indices no longer shift displayed program-cell provenance',()=>{
 const library=IMAGE_TASK_LIBRARY.filter(t=>/^程序第\d+格$/.test(t.cell));assert(library.length>100);
 for(const item of library){const board=IMAGE_CONTENT.boards.find(b=>b.id===item.image),position=Number(item.cell.match(/\d+/)[0]);assert.equal(board.cells[position].text,item.text);assert.equal(board.cells[position].type,'task');}
});
function prior(){const w=defaultWorkspace();w.themes=Object.entries(IMAGE_DECK_BASELINE_PRE_SOURCE_BOUNDARIES).map(([id,d])=>({id,name:d.name,desc:'个人描述',audience:'common',tasks:[...d.cards]}));w.baseBoard.decks=structuredClone(IMAGE_DECK_BASELINE_PRE_SOURCE_BOUNDARIES);return w;}
test('only untouched old defaults migrate; custom decks, archived personal edits and existing snapshots remain usable',()=>{
 const old=prior(),before=structuredClone(old),current=startWorkspace(old,{seed:5});assert.deepEqual(old,before);for(const t of current.themes){assert.deepEqual(t.tasks,IMAGE_MODE_DECKS[t.id].cards);assert.equal(t.desc,'个人描述');}
 const persisted=structuredClone(current);persisted.active.config.decks=structuredClone(IMAGE_DECK_BASELINE_PRE_SOURCE_BOUNDARIES);assert.deepEqual(parseWorkspace(JSON.stringify(persisted)).active,persisted.active);
 for(const edit of ['add','remove','reorder','rename']){const custom=prior(),t=custom.themes[0];if(edit==='add')t.tasks.push('个人题目');if(edit==='remove')t.tasks.shift();if(edit==='reorder')t.tasks.reverse();if(edit==='rename')t.name='自己的题库';assert.deepEqual(startWorkspace(custom,{seed:1}).themes[0],t);}
 const original=IMAGE_CONTENT.boards.find(b=>b.id===18).cells[0].text,id=taskKey(original),custom=defaultWorkspace();custom.imageLevels=[1];custom.taskLibrary={edits:{[id]:{original,text:'我保留的个人题目',level:1}},additions:[],selectedIds:[id],mode:'selected',reviewedOnly:false};const row=taskLibraryRows(custom).find(t=>t.id===id);assert.equal(row.archived,true);assert.equal(row.text,'我保留的个人题目');assert.deepEqual(selectedTaskRows(custom).map(t=>t.text),['我保留的个人题目']);assert.deepEqual(parseWorkspace(JSON.stringify(custom)).taskLibrary,custom.taskLibrary);
});
