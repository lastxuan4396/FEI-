import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultWorkspace,workspaceForTwoPlayers,startWorkspace,parseWorkspace,validateWorkspace} from '../src/core/workspace.js';
function fourPlayers(){
 const w=defaultWorkspace();
 for(let i=2;i<4;i++)w.players.push({...w.players[i%2],id:i,name:`玩家 ${i+1}`});
 w.baseBoard.players=w.players.map(p=>({id:`p${p.id}`,name:p.name,color:p.color,start:p.id}));
 w.baseBoard.rules={...w.baseBoard.rules,navigation:'manual',launchOnSix:false,chainEffects:false};
 w.baseBoard.layout.image={dataUrl:'data:image/png;base64,AAAA',width:600,height:600,regions:w.baseBoard.layout.path.map(([x,y])=>({x:x/15,y:y/15,width:1/15,height:1/15}))};
 w.baseBoard.tiles=w.baseBoard.tiles.map(t=>['start','finish','task','plain'].includes(t.type)?t:{type:'plain'});
 w.baseBoard.playerDecks=Object.fromEntries(w.baseBoard.players.map(p=>[p.id,Object.keys(w.baseBoard.decks)[0]]));
 return validateWorkspace(w);
}
test('new two-player setup keeps first two names, individual starts, image levels and decks without changing the source',()=>{
 const old=fourPlayers(),before=structuredClone(old),next=workspaceForTwoPlayers(old);
 assert.equal(next.players.length,2);assert.equal(next.baseBoard.players.length,2);
 assert.deepEqual(next.players,old.players.slice(0,2));assert.deepEqual(next.baseBoard.players.map(p=>p.start),[0,1]);
 assert.deepEqual(Object.keys(next.baseBoard.playerDecks),['p0','p1']);
 assert.deepEqual(next.imageLevels,old.imageLevels);assert.deepEqual(next.themes,old.themes);
 assert.equal(startWorkspace(next,{seed:1}).active.state.players.length,2);assert.deepEqual(old,before);
});
test('existing multiplayer active saves still restore exactly and cannot be silently truncated',()=>{
 const old=startWorkspace(fourPlayers(),{seed:1}),before=structuredClone(old);
 assert.deepEqual(parseWorkspace(JSON.stringify(old)),before);
 assert.throws(()=>workspaceForTwoPlayers(old),/结束当前局/);assert.deepEqual(old,before);
});
