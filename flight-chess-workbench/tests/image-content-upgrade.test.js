import test from 'node:test';
import assert from 'node:assert/strict';
import {IMAGE_CONTENT,IMAGE_TASK_TEXTS,imageTask} from '../src/core/imageTaskLibrary.js';
import {IMAGE_DECK_BASELINE_173} from '../src/core/imageDeckBaseline173.js';
import {IMAGE_MODE_DECKS} from '../src/core/modes.js';
import {defaultWorkspace,startWorkspace,workspaceForMode,parseWorkspace} from '../src/core/workspace.js';

test('source24 corrections retain original OCR and candidate boxes, identify unresolved spans and remove printed IDs from tasks',()=>{
 const board=IMAGE_CONTENT.boards.find(b=>b.id===24);
 assert.equal(board.lines.length,163);assert.equal(board.rawCells.length,53);
 assert.equal(board.cells.length,53);assert.equal(board.cells.filter(c=>c.reviewed).length,51);
 assert.deepEqual(board.cells.filter(c=>!c.reviewed).map(c=>c.index),[15,39]);
 assert.equal(board.cells[51].text,'好事多磨～退回到40格');assert.equal(board.cells[51].type,'rule');
 assert.equal(board.cells[12].text,board.cells[1].text);
 assert(board.rawCells.some(c=>c.text.includes('拥胞')));
 assert(!board.cells.some(c=>c.text.includes('拥胞')));
 for(const c of board.cells.filter(c=>c.type==='task'))assert(!/\n\d+$/.test(c.text));
 assert(board.reviewedNotes.some(n=>n.text.includes('各执一枚棋子')));
 assert.equal(board.cells[15].type,'unreadable');assert.equal(board.cells[39].type,'unreadable');
 assert.equal(imageTask(board.cells[15].text),undefined);
 assert.equal(imageTask(board.cells[39].text),undefined);
 assert(!IMAGE_TASK_TEXTS.includes(board.cells[51].text));
});

function oldWorkspace(){const w=defaultWorkspace();w.themes=Object.entries(IMAGE_DECK_BASELINE_173).map(([id,deck])=>({id,name:deck.name,desc:'用户自己的描述',audience:'common',tasks:[...deck.cards]}));w.baseBoard.decks=structuredClone(IMAGE_DECK_BASELINE_173);return w;}
test('untouched old image defaults gain corrected readings only on new setup/start; active snapshots, edits and metadata survive',()=>{
 const old=oldWorkspace(),saved=structuredClone(old);
 const started=startWorkspace(old,{seed:1});assert.deepEqual(old,saved);
 for(const theme of started.themes){assert.deepEqual(theme.tasks,IMAGE_MODE_DECKS[theme.id].cards);assert.equal(theme.desc,'用户自己的描述');}
 const active=parseWorkspace(JSON.stringify({...old,view:'game',active:started.active}));
 assert.deepEqual(active.active,started.active);
 for(const edit of ['add','remove','reorder','rename']){
  const custom=oldWorkspace(),theme=custom.themes[0];
  if(edit==='add')theme.tasks.push('独立添加的文字');
  if(edit==='remove')theme.tasks.shift();
  if(edit==='reorder')theme.tasks.reverse();
  if(edit==='rename')theme.name='自己改过的题库';
  const before=structuredClone(theme),next=workspaceForMode(custom,'spiral');
  assert.deepEqual(next.themes[0],before);
  assert.deepEqual(next.themes[1].tasks,IMAGE_MODE_DECKS[next.themes[1].id].cards);
 }
});
