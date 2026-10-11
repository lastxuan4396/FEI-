import test from 'node:test';import assert from 'node:assert/strict';
import {bingoLines,bingoLineCount,bingoSide,bingoGoal} from '../src/core/bingo.js';
import {createArcade,arcadeTransition,parseArcade} from '../src/core/arcade.js';
const players=[{name:'甲',color:'#aabbcc'},{name:'乙',color:'#ccbbaa'}],pool=['观察一件物品10秒','说一句感谢','重复五次'];
const fresh=(kind,options={})=>createArcade(kind,players,{pool,creative:true,seed:19,...options});
const go=(s,a)=>arcadeTransition(s,a),reload=s=>parseArcade(JSON.stringify(s));
test('Three real grid sizes have rows, columns and two complete long diagonals',()=>{
 for(const side of [3,4,5]){const lines=bingoLines(side);assert.equal(lines.length,side*2+2);for(const line of lines){assert.equal(new Set(line).size,side);assert(line.every(i=>i>=0&&i<side*side));const done=Array(side*side).fill(false);line.forEach(i=>done[i]=true);assert.equal(bingoLineCount(done),1);}assert.equal(bingoLineCount(Array(side*side).fill(true)),side*2+2);}
 assert.throws(()=>bingoLines(2));
});
test('Both editions complete configured 9/16/25-cell games at each real line target, preserving reload and undo',()=>{
 for(const creative of [false,true])for(const size of [3,4,5])for(const goalLines of [1,2,3]){
  let s=fresh('bingo',{creative,bingo:{size,goalLines},rounds:99});assert.equal(s.state.players[0].bingo.length,size*size);assert.equal(s.state.players[1].done.length,size*size);
  for(let cell=0;cell<size*size&&s.state.phase!=='finished';cell++){s.state.turn=0;s=reload(go(s,{type:'CELL',index:cell}));assert.equal(s.state.pending.cell,cell);s=reload(go(s,{type:'RESOLVE',done:true}));if(bingoLineCount(s.state.players[0].done)<goalLines)assert.equal(s.state.phase,'ready');}
  assert.equal(s.state.phase,'finished');assert.deepEqual(s.state.winners,[0]);assert(bingoLineCount(s.state.players[0].done)>=goalLines);assert.match(s.state.ending,new RegExp(`${goalLines}条`));
  s=go(s,{type:'UNDO'});assert.equal(s.state.phase,'task');s=go(s,{type:'RESOLVE',done:false});assert.equal(s.state.phase,'ready');
 }
});
test('Last cell is playable, replaceable, and obeys the grid-dependent joker threshold and task clocks',()=>{
 for(const size of [3,4,5]){
  let s=fresh('bingo',{bingo:{size,goalLines:3},rounds:99});const last=size*size-1,old=s.state.players[0].bingo[last];s=go(s,{type:'BINGO_REDRAW',index:last});assert.notEqual(s.state.players[0].bingo[last],old);s=go(s,{type:'CELL',index:last});s=go(s,{type:'TIMER',now:1000});const clock=s.state.pending.endsAt;s=reload(s);assert.equal(s.state.pending.endsAt,clock);s=go(s,{type:'RESOLVE',done:false});assert.equal(s.state.players[0].done[last],false);s.state.turn=0;
  for(let row=0;row<size;row++){assert.throws(()=>go(s,{type:'BINGO_JOKER',index:last}));s=go(s,{type:'CELL',index:row*size});s=go(s,{type:'RESOLVE',done:true});s.state.turn=0;}
  s=go(s,{type:'BINGO_JOKER',index:last});assert.equal(s.state.players[0].score,size);assert.equal(s.state.players[0].done.filter(Boolean).length,size+1);s=reload(s);assert.throws(()=>go({...s,state:{...s.state,turn:0}},{type:'BINGO_JOKER',index:1}));
 }
});
test('Old nine-cell saves retain each edition target; invalid grid sizes, array lengths and out-of-range pending cells reject',()=>{
 for(const creative of [false,true]){const s=fresh('bingo',{creative});assert.equal(s.config.bingo,undefined);assert.equal(bingoSide(reload(s).config),3);assert.equal(bingoGoal(s.config),creative?2:1);}
 assert.throws(()=>fresh('bingo',{bingo:{size:6,goalLines:2}}));assert.throws(()=>fresh('bingo',{bingo:{size:5,goalLines:4}}));assert.throws(()=>fresh('coop',{bingo:{size:3,goalLines:2}}));
 const s=fresh('bingo',{bingo:{size:5,goalLines:3}});for(const mutate of [x=>x.state.players[0].done.pop(),x=>x.state.players[0].bingo.pop(),x=>x.state.creative.goalLines=2]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>reload(bad));}
 assert.throws(()=>go(s,{type:'CELL',index:25}));const pending=go(s,{type:'CELL',index:24});pending.state.pending.cell=25;assert.throws(()=>reload(pending));
});
test('Configured one-round large bingo stops after two actual actions and preserves a skipped square',()=>{
 let s=fresh('bingo',{bingo:{size:5,goalLines:3},rounds:1});s=go(s,{type:'CELL',index:24});s=go(s,{type:'RESOLVE',done:false});assert.equal(s.state.players[0].done[24],false);s=go(s,{type:'CELL',index:24});s=go(s,{type:'RESOLVE',done:true});assert.equal(s.state.phase,'finished');assert.deepEqual(s.state.winners,[1]);assert.match(s.state.ending,/设定回合/);
});
test('Six or more agreement rounds and long spinner streaks honor custom limits, not the original five-round caps',()=>{
 let v=fresh('vote',{rounds:12});for(let i=0;i<12;i++){v=go(v,{type:'VOTE',target:0});v=reload(go(v,{type:'VOTE',target:0}));assert.equal(v.state.creative.agreements,i+1);v=go(v,{type:'NEXT'});}assert.equal(v.state.phase,'finished');assert.match(v.state.ending,/12题/);
 let s=fresh('spinner',{rounds:15});for(let i=0;i<30;i++){s=go(s,{type:'SPIN'});s=reload(go(s,{type:'RESOLVE',done:true}));}assert.equal(s.state.phase,'finished');assert.deepEqual(s.state.creative.streaks,[15,15]);
});
test('Custom cooperative routes finish at the selected count, including relay after the original eight stages',()=>{
 for(const count of [1,8,12,20,99]){let s=fresh('coop',{rounds:count});s=go(s,{type:'COOP_PLAN',method:'relay',target:0});for(let i=0;i<count;i++){s=go(s,{type:'DRAW'});s=go(s,{type:'RESOLVE',done:true});assert.equal(s.state.stage,i);s=reload(go(s,{type:'RESOLVE',done:true}));assert.equal(s.state.stage,i+1);}assert.equal(s.state.phase,'finished');assert.match(s.state.ending,new RegExp(`${count}关`));}
});
