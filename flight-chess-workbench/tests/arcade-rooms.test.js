import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createArcade,arcadeTransition,validateArcade} from '../src/core/arcade.js';
import {arcadeActionAllowed,arcadeRoomView} from '../src/core/arcadeRoomPolicy.js';
import {arcadeRooms} from '../server/arcadeRooms.js';
import {createFileRoomStore} from '../server/roomStore.js';

const people=[{name:'测试甲',color:'#cf765b'},{name:'测试乙',color:'#548e95'}];
const pool=['阅读卡片90秒','整理桌面5次','画一个圆','分享一句想法'];
function memoryStore(){
 let records={},queue=Promise.resolve();
 return {transaction(fn){const job=queue.catch(()=>{}).then(async()=>{const draft=structuredClone(records),result=await fn({get:async key=>structuredClone(draft[key]??null),put:(key,value)=>{draft[key]=structuredClone(value);}});records=draft;return result;});queue=job.then(()=>{},()=>{});return job;},entries:async()=>Object.entries(structuredClone(records))};
}
function session(kind,options={}){return createArcade(kind,people,{pool,seed:20261002,rounds:4,...(kind==='estate'?{estate:{taskMode:'linked',target:500,rounds:12,mapSize:20}}:{creative:true}),...options});}
function fixture(store=memoryStore()){
 let clock=1_900_000_000_000,sequence=0;
 const handler=arcadeRooms(store,{baseURL:'https://game.invalid/',now:()=>clock,randomSeed:()=>1});
 return {store,handler,setNow:v=>{clock=v;},create:async(kind,options={},id='create-'+(++sequence))=>handler({path:'',method:'POST',requestId:id,body:{session:session(kind,options)}}),read:(room,actor=0)=>handler({path:`/${room.code}`,method:'GET',token:actor?room.inviteToken:room.token}),act:(room,actor,action,id='op-'+(++sequence))=>handler({path:`/${room.code}/action`,method:'POST',token:actor?room.inviteToken:room.token,body:{requestId:id,action}})};
}
const body=result=>{assert.ok(result.status>=200&&result.status<300,result.body.error);return result.body;};
async function editRoom(f,room,mutate){await f.store.transaction(async tx=>{const saved=await tx.get(room.code);mutate(saved);validateArcade(saved.session);tx.put(room.code,saved);});}

for(const kind of ['spinner','cards','coop','story','bingo','vote','mystery','estate'])test(`Arcade online creates a fresh two-player ${kind} with the chosen configuration`,async()=>{
 const f=fixture(),options=kind==='story'?{story:{chapters:5,detours:2}}:kind==='bingo'?{bingo:{size:5,goalLines:3}}:{};
 const created=body(await f.create(kind,options));
 assert.equal(created.session.config.kind,kind);assert.equal(created.actor,0);assert.equal(created.revision,0);
 assert.deepEqual(created.session.config.pool,pool);assert.equal(created.session.config.rounds,4);validateArcade(created.session);
 const guest=body(await f.read(created,1));assert.equal(guest.actor,1);assert.equal(guest.inviteToken,undefined);assert.equal(guest.token,undefined);
 assert.equal(guest.session.state.seed,1);assert.deepEqual(guest.session.state.bag,[]);assert.deepEqual(guest.session.state.undo,[]);
 if(kind==='estate')assert.equal(guest.session.config.estate.mapSize,20);
 if(kind==='bingo')assert.equal(guest.session.state.players[0].bingo.length,25);
 if(kind==='story')assert.equal(guest.session.config.story.chapters,5);
 if(kind==='mystery')assert.ok(guest.session.config.puzzles.every(p=>p.answer==='答案保密'));
});

test('Arcade create is idempotent, ignores forged initial assets and rejects old/oversized snapshots',async()=>{
 const f=fixture(),original=session('estate');original.state.players[0].cash=999;
 const args={path:'',method:'POST',requestId:'same-create',body:{session:original}};
 const first=body(await f.handler(args)),repeat=body(await f.handler(args));
 assert.equal(first.code,repeat.code);assert.equal(first.token,repeat.token);assert.equal(first.session.state.players[0].cash,120);
 assert.equal((await f.handler({...args,body:{session:session('spinner')}})).status,409);
 const old=arcadeTransition(session('spinner'),{type:'SPIN'});
 assert.equal((await f.handler({...args,requestId:'old-create',body:{session:old}})).status,422);
 assert.equal((await f.handler({...args,requestId:'big-create',body:{session:original,padding:'x'.repeat(2_000_000)}})).status,413);
 const three=createArcade('spinner',[...people,{name:'测试丙',color:'#9887b8'}],{pool});
 assert.equal((await f.handler({...args,requestId:'three-create',body:{session:three}})).status,422);
});

test('Secret votes accept either device first, concurrent revisions and reveal only after both submissions',async()=>{
 const f=fixture(),room=body(await f.create('vote'));
 const first=body(await f.act(room,1,{type:'VOTE',target:0,expectedRevision:0},'guest-secret'));
 assert.deepEqual(first.submitted,[false,true]);assert.equal(first.ownBallot,0);assert.equal(first.session.state.phase,'ballot');
 const host=body(await f.read(room));assert.equal(host.ownBallot,null);assert.deepEqual(host.session.state.votes,[0,0]);assert.deepEqual(host.session.state.creative.ballots,[-1,-1]);assert.deepEqual(host.session.state.undo,[]);validateArcade(host.session);
 assert.equal((await f.act(room,1,{type:'VOTE',target:1,expectedRevision:1},'double-vote')).status,403);
 const second=body(await f.act(room,0,{type:'VOTE',target:0,expectedRevision:0},'host-secret'));
 assert.equal(second.session.state.phase,'reveal');assert.deepEqual(second.session.state.votes,[2,0]);assert.deepEqual(second.session.state.creative.ballots,[0,0]);
 const retry=body(await f.act(room,1,{type:'VOTE',target:0,expectedRevision:0},'guest-secret'));assert.equal(retry.revision,second.revision);
 const next=body(await f.act(room,0,{type:'NEXT',expectedRevision:second.revision}));assert.deepEqual(next.submitted,[false,false]);assert.equal(next.session.state.round,1);
 const oldRetry=body(await f.act(room,1,{type:'VOTE',target:0,expectedRevision:0},'guest-secret'));assert.equal(oldRetry.revision,next.revision);assert.deepEqual(oldRetry.submitted,[false,false]);assert.equal(oldRetry.session.state.round,1);
 assert.equal((await f.act(room,1,{type:'VOTE',target:1,expectedRevision:0},'past-question')).status,409);
 assert.equal((await f.act(room,0,{type:'DRAW',target:1,yes:true,expectedRevision:next.revision})).status,403);
});

test('Only a selected volunteer can claim a revealed vote task',async()=>{
 const f=fixture(),room=body(await f.create('vote'));
 let current=body(await f.act(room,0,{type:'VOTE',target:1,expectedRevision:0}));
 current=body(await f.act(room,1,{type:'VOTE',target:1,expectedRevision:current.revision}));
 assert.equal((await f.act(room,0,{type:'DRAW',target:1,yes:true,expectedRevision:current.revision})).status,403);
 current=body(await f.act(room,1,{type:'DRAW',target:1,yes:true,expectedRevision:current.revision}));
 assert.equal(current.session.state.turn,1);assert.equal(current.session.state.phase,'task');
 assert.equal((await f.act(room,0,{type:'RESOLVE',done:true,expectedRevision:current.revision})).status,403);
});

test('Server clocks, task ownership, replay receipts and stale revisions keep timed tasks stable',async()=>{
 const f=fixture(),room=body(await f.create('spinner',{pool:['阅读卡片90秒']}));
 assert.equal((await f.act(room,1,{type:'SPIN',expectedRevision:0})).status,403);
 let current=body(await f.act(room,0,{type:'SPIN',expectedRevision:0},'spin'));
 current=body(await f.act(room,0,{type:'TIMER',now:1,expectedRevision:current.revision},'clock'));
 assert.equal(current.session.state.pending.endsAt,1_900_000_090_000);
 assert.equal((await f.act(room,1,{type:'TIMER',now:1,expectedRevision:current.revision})).status,403);
 f.setNow(1_900_000_012_000);
 const retry=body(await f.act(room,0,{type:'TIMER',now:1,expectedRevision:1},'clock'));
 assert.equal(retry.revision,current.revision);assert.equal(retry.session.state.pending.endsAt,current.session.state.pending.endsAt);
 assert.equal((await f.act(room,0,{type:'TIMER',now:2,expectedRevision:1},'clock')).status,409);
 assert.equal((await f.act(room,0,{type:'RESOLVE',done:true,expectedRevision:1})).status,409);
 current=body(await f.act(room,0,{type:'TIMER',now:2,timerMode:'pause',expectedRevision:current.revision}));
 assert.equal(current.session.state.pending.pausedRemaining,78000);
 current=body(await f.act(room,0,{type:'TIMER',now:3,expectedRevision:current.revision}));
 assert.equal(current.session.state.pending.endsAt,1_900_000_090_000);
 current=body(await f.act(room,0,{type:'TIMER',now:null,expectedRevision:current.revision}));assert.equal(current.session.state.pending.endsAt,null);
 assert.equal((await f.act(room,0,{type:'UNDO',expectedRevision:current.revision})).status,403);
 current=body(await f.act(room,0,{type:'RESOLVE',done:true,expectedRevision:current.revision}));assert.equal(current.session.state.turn,1);
});

test('Persistent cards allow only their target to control clocks/counts while play continues',async()=>{
 const f=fixture(),room=body(await f.create('spinner'));
 let current=body(await f.act(room,1,{type:'EFFECT_ADD',effect:{text:'阅读90秒',unit:'seconds',amount:90,targets:['1']},now:1,expectedRevision:0}));
 assert.equal(current.session.state.effects[0].endsAt,1_900_000_090_000);
 assert.equal((await f.act(room,0,{type:'EFFECT_END',effectId:current.session.state.effects[0].id,expectedRevision:current.revision})).status,403);
 assert.equal((await f.act(room,0,{type:'EFFECT_ADD',effect:{text:'强加给对方',unit:'count',amount:5,targets:['1']},expectedRevision:current.revision})).status,403);
 current=body(await f.act(room,0,{type:'SPIN',expectedRevision:current.revision}));assert.equal(current.session.state.phase,'task');assert.equal(current.session.state.effects.length,1);
 current=body(await f.act(room,1,{type:'EFFECT_ADD',effect:{text:'整理5次',unit:'count',amount:5,countUnit:'次',targets:['1']},now:1,expectedRevision:current.revision}));
 const counter=current.session.state.effects[1].id;
 current=body(await f.act(room,1,{type:'EFFECT_COUNT',effectId:counter,countDelta:1,expectedRevision:current.revision},'count-once'));
 assert.equal(current.session.state.effects[1].progress,1);
 const retry=body(await f.act(room,1,{type:'EFFECT_COUNT',effectId:counter,countDelta:1,expectedRevision:current.revision-1},'count-once'));assert.equal(retry.session.state.effects[1].progress,1);
 const reloaded=body(await f.read(room,1));assert.equal(reloaded.session.state.effects[0].endsAt,1_900_000_090_000);assert.equal(reloaded.session.state.effects[1].progress,1);
 const timed=current.session.state.effects[0].id;
 current=body(await f.act(room,1,{type:'EFFECT_TIMER',effectId:timed,now:null,expectedRevision:current.revision}));assert.equal(current.session.state.effects[0].endsAt,null);assert.equal(current.session.state.effects[1].progress,1);
 f.setNow(1_900_000_020_000);current=body(await f.act(room,1,{type:'EFFECT_TIMER',effectId:timed,now:1,expectedRevision:current.revision}));assert.equal(current.session.state.effects[0].endsAt,1_900_000_110_000);
});

test('Persistent-card drafting belongs to the drawing player and keeps their choices private',async()=>{
 const f=fixture(),room=body(await f.create('spinner'));
 let current=body(await f.act(room,1,{type:'EFFECT_DRAW',expectedRevision:0}));assert.equal(current.draftActor,1);assert.equal(current.session.state.effectDraft.cards.length,3);
 const host=body(await f.read(room));assert.equal(host.session.state.effectDraft,undefined);assert.equal(host.draftActor,1);
 assert.equal((await f.act(room,0,{type:'EFFECT_DRAW',expectedRevision:current.revision})).status,403);
 assert.equal((await f.act(room,0,{type:'EFFECT_DISMISS',expectedRevision:current.revision})).status,403);
 current=body(await f.act(room,1,{type:'EFFECT_CHOOSE',index:0,targets:['1'],now:1,expectedRevision:current.revision}));
 assert.equal(current.draftActor,null);assert.equal(current.session.state.effects.length,1);assert.deepEqual(current.session.state.effects[0].targets,['1']);
});

test('Monopoly auction bidder and transaction buyer are enforced independently of the map turn',async()=>{
 const f=fixture(),room=body(await f.create('estate'));
 let current=body(await f.act(room,0,{type:'ROLL',dice:6,seed:999,expectedRevision:0}));assert.equal(current.session.state.dice,1);assert.equal(current.session.state.phase,'offer');
 current=body(await f.act(room,0,{type:'BUY',yes:false,expectedRevision:current.revision}));assert.equal(current.session.state.phase,'auction');
 assert.equal((await f.act(room,1,{type:'BID',target:0,price:10,expectedRevision:current.revision})).status,403);
 current=body(await f.act(room,0,{type:'BID',target:0,price:10,expectedRevision:current.revision}));assert.equal(current.session.state.estate.auction.activeBidderOrder[current.session.state.estate.auction.activeBidderIndex],1);
 assert.equal((await f.act(room,0,{type:'PASS_BID',target:1,expectedRevision:current.revision})).status,403);
 current=body(await f.act(room,1,{type:'PASS_BID',target:1,expectedRevision:current.revision}));assert.equal(current.session.state.owners[1],0);assert.equal(current.session.state.players[0].cash,110);assert.equal(current.session.state.turn,1);
 await editRoom(f,room,saved=>{saved.session.state.turn=0;});
 current=body(await f.read(room));current=body(await f.act(room,0,{type:'TRADE',lot:1,target:1,price:20,expectedRevision:current.revision}));
 assert.equal((await f.act(room,0,{type:'ACCEPT',yes:true,expectedRevision:current.revision})).status,403);
 current=body(await f.act(room,1,{type:'ACCEPT',yes:true,expectedRevision:current.revision}));assert.equal(current.session.state.owners[1],1);assert.equal(current.session.state.players[1].cash,100);assert.equal(current.session.state.players[0].cash,130);
});

test('Monopoly joint contracts require consent from the invited device',async()=>{
 const f=fixture(),room=body(await f.create('estate'));
 await editRoom(f,room,saved=>{const s=saved.session.state;s.players[0].position=10;s.phase='contract';s.estate.contract={tasks:[pool[0],pool[1]],selected:0};});
 let current=body(await f.read(room));
 current=body(await f.act(room,0,{type:'CONTRACT',method:'coop',target:1,partnerAccepted:true,expectedRevision:current.revision}));
 assert.deepEqual(current.coopRequest,{from:0,to:1});assert.equal(current.session.state.phase,'contract');assert.equal(current.session.state.pending,null);
 assert.equal((await f.act(room,0,{type:'ACCEPT_COOP',yes:true,expectedRevision:current.revision})).status,403);
 assert.equal((await f.act(room,0,{type:'CONTRACT',method:'cash',expectedRevision:current.revision})).status,403);
 current=body(await f.act(room,1,{type:'ACCEPT_COOP',yes:false,expectedRevision:current.revision}));assert.equal(current.coopRequest,null);assert.equal(current.session.state.pending,null);
 current=body(await f.act(room,0,{type:'CONTRACT',method:'coop',target:1,expectedRevision:current.revision}));
 current=body(await f.act(room,1,{type:'ACCEPT_COOP',yes:true,expectedRevision:current.revision}));assert.equal(current.coopRequest,null);assert.equal(current.session.state.phase,'task');assert.equal(current.session.state.pending.estate.partner,1);
 current=body(await f.act(room,1,{type:'TIMER',now:1,expectedRevision:current.revision}));assert.equal(current.session.state.pending.endsAt,1_900_000_090_000);
 current=body(await f.act(room,1,{type:'RESOLVE',done:true,expectedRevision:current.revision}));assert.equal(current.session.state.players[0].cash,130);assert.equal(current.session.state.players[1].cash,130);
});

test('Shared tasks allow involved players while relay tasks stay with their assigned player',async()=>{
 const f=fixture(),room=body(await f.create('coop'));
 let current=body(await f.act(room,0,{type:'DRAW',expectedRevision:0}));assert.deepEqual(current.session.state.pending.creative.actors,[0,1]);
 current=body(await f.act(room,1,{type:'RESOLVE',done:true,expectedRevision:current.revision}));assert.equal(current.session.state.stage,1);
 current=body(await f.act(room,1,{type:'COOP_PLAN',method:'relay',target:1,expectedRevision:current.revision}));
 current=body(await f.act(room,1,{type:'DRAW',expectedRevision:current.revision}));
 assert.equal((await f.act(room,0,{type:'RESOLVE',done:true,expectedRevision:current.revision})).status,403);
 current=body(await f.act(room,1,{type:'RESOLVE',done:true,expectedRevision:current.revision}));assert.equal(current.session.state.turn,0);assert.deepEqual(current.session.state.pending.creative.actors,[0]);
 current=body(await f.act(room,0,{type:'RESOLVE',done:true,expectedRevision:current.revision}));assert.equal(current.session.state.stage,2);
});

test('Secret views are valid snapshots without future dice, previous votes, other hands or puzzle answers',()=>{
 const cards=session('cards');cards.state.players[1].hand=[{type:'mission',text:'隐藏任务A'},{type:'boost',text:'隐藏类型B'},{type:'shield',text:'隐藏类型C'}];
 const cardView=arcadeRoomView(cards,0);assert.ok(cardView.state.players[1].hand.every(c=>c.text==='对方手牌保密'));validateArcade(cardView);
 const vote=arcadeTransition(session('vote'),{type:'VOTE',target:1});const view=arcadeRoomView(vote,1);assert.deepEqual(view.state.undo,[]);assert.deepEqual(view.state.votes,[0,0]);assert.deepEqual(view.state.creative.ballots,[-1,-1]);
 const mystery=arcadeRoomView(session('mystery'),1);assert.ok(!JSON.stringify(mystery).includes('314'));validateArcade(mystery);
 assert.equal(arcadeActionAllowed(cards,1,'PLAY',{index:0}),false);assert.equal(arcadeActionAllowed(cards,0,'PLAY',{index:0}),true);
});

test('Room restart preserves roles, secret submissions and accepted request receipts',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'arcade-room-test-')),file=join(directory,'rooms.json');
 try{
  let store=await createFileRoomStore(file),f=fixture(store);const room=body(await f.create('vote'));
  const action={type:'VOTE',target:1,expectedRevision:0};const first=body(await f.act(room,1,action,'durable-secret'));await store.close();
  store=await createFileRoomStore(file);f=fixture(store);
  const restored=body(await f.read(room,1));assert.equal(restored.actor,1);assert.equal(restored.revision,first.revision);assert.equal(restored.ownBallot,1);assert.deepEqual(restored.submitted,[false,true]);
  const retry=body(await f.act(room,1,action,'durable-secret'));assert.equal(retry.revision,first.revision);
  const host=body(await f.read(room));assert.equal(host.inviteToken,room.inviteToken);assert.equal(host.ownBallot,null);await store.close();
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('Foreign origin, invalid credentials, expiry, capacity and storage errors fail clearly',async()=>{
 const f=fixture(),room=body(await f.create('spinner'));
 assert.equal((await f.handler({path:`/${room.code}`,method:'GET',token:'bad'})).status,403);
 assert.equal((await f.handler({path:`/${room.code}`,method:'GET',token:room.token,origin:'https://foreign.invalid'})).status,403);
 assert.equal((await f.handler({path:`/${room.code}`,method:'DELETE',token:room.token})).status,405);
 f.setNow(1_900_000_000_000+7*86400000);assert.equal((await f.read(room)).status,403);
 const one=arcadeRooms(memoryStore(),{baseURL:'https://game.invalid',maxRooms:1});
 assert.equal((await one({path:'',method:'POST',body:{session:session('spinner')}})).status,201);assert.equal((await one({path:'',method:'POST',body:{session:session('cards')}})).status,429);
 const unavailable=arcadeRooms({transaction:async()=>{const error=Error('private store detail');error.status=503;throw error;}},{baseURL:'https://game.invalid'});
 const failed=await unavailable({path:'',method:'POST',body:{session:session('spinner')}});assert.equal(failed.status,503);assert.ok(!failed.body.error.includes('private'));
});
