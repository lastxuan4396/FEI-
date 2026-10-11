import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {pairedRooms} from '../server/pairedRooms.js';import {createFileRoomStore} from '../server/roomStore.js';import {createRoomTransport,RoomAPIError} from '../src/core/roomTransport.js';
const config=variant=>({variant,players:['甲','乙'],pool:['任务一30秒','任务二5次','任务三'],settings:{rounds:2,floors:2,hp:100},seed:1});
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
async function fixture(fn){const directory=await mkdtemp(join(tmpdir(),'paired-durable-'));try{const file=join(directory,'rooms.json'),store=await createFileRoomStore(file);await fn({file,store,handle:pairedRooms(store,{baseURL:'https://game.example/',now:()=>100000000})});}finally{await rm(directory,{recursive:true,force:true});}}
const call=(handle,path,token,body,requestId)=>handle({path,token,body,method:body?'POST':'GET',requestId});
const fetcher=(handle,lose)=>async(url,opts)=>{const result=await handle({path:url.replace('/api/rooms',''),method:opts.method??'GET',token:opts.headers.Authorization?.slice(7),body:opts.body?JSON.parse(opts.body):undefined});if(lose?.()){throw TypeError('Response lost after durable server save');}return {ok:result.status<400,status:result.status,json:async()=>result.body};};
test('Lost response and browser reload retry exactly the same operation once',()=>fixture(async({file,handle})=>{
 const {body:room}=await call(handle,'',null,config('rps'),'create-rps');const cache=storage();let first=true;
 const t=createRoomTransport({code:room.code,token:room.token},{storage:cache,id:()=> 'stable-operation',fetcher:fetcher(handle,()=>{const value=first;first=false;return value;})});
 await assert.rejects(t.send({type:'SELECT',index:0,epoch:room.state.epoch}));assert.ok(t.hasPending());
 const restarted=pairedRooms(await createFileRoomStore(file),{baseURL:'https://game.example/',now:()=>100000000});
 const t2=createRoomTransport({code:room.code,token:room.token},{storage:cache,fetcher:fetcher(restarted)});
 const ack=await t2.flush();assert.equal(ack.state.revision,1);assert.equal(t2.hasPending(),false);assert.ok(ack.state.secret[0]?.task);
 assert.equal((await call(restarted,'/'+room.code,room.inviteToken)).body.state.secret[0],null);
}));
test('Concurrent preference choices serialize and reveal only after both submit; durable invitation recovers',()=>fixture(async({file,handle})=>{
 const {body:r}=await call(handle,'',null,config('preference'),'create-one');const again=await call(handle,'',null,config('preference'),'create-one');assert.equal(again.body.code,r.code);
 const post=(token,id,favorite,guess)=>call(handle,'/'+r.code+'/action',token,{requestId:id,action:{type:'SELECT',favorite,guess,epoch:r.state.epoch}});
 const result=await Promise.all([post(r.token,'a',0,1),post(r.inviteToken,'b',1,0)]);assert.ok(result.every(r=>r.status===200));
 const restored=pairedRooms(await createFileRoomStore(file),{baseURL:'https://game.example/',now:()=>100000000});
 const read=await call(restored,'/'+r.code,r.token);assert.equal(read.body.state.phase,'reveal');assert.equal(read.body.state.revision,2);assert.equal(read.body.inviteToken,r.inviteToken);
 const peer=await call(restored,'/'+r.code,r.inviteToken);assert.equal(peer.body.actor,1);assert.equal(peer.body.inviteToken,undefined);assert.equal(peer.body.state.config.pool.length,0);assert.ok(peer.body.presence.online.every(Boolean));
 assert.equal((await call(restored,'/'+r.code,'fake')).status,403);
}));
test('Definitive rejection clears pending; overload keeps pending and never changes request id',async()=>{
 const cache=storage();let status=429,ids=[];const t=createRoomTransport({code:'ABCDEF',token:'private-player-token'},{storage:cache,id:()=> 'id-one',fetcher:async(_url,o)=>{ids.push(JSON.parse(o.body).requestId);return {status,ok:false,json:async()=>({error:'Rejected'})};}});
 await assert.rejects(t.send({type:'NEXT'}),RoomAPIError);assert.ok(t.hasPending());status=422;await assert.rejects(t.flush());assert.equal(t.hasPending(),false);assert.deepEqual(ids,['id-one','id-one']);
 const other=createRoomTransport({code:'ABCDEF',token:'different-player-token'},{storage:cache});assert.equal(other.hasPending(),false);
});
test('Unwritable browser storage does not send an action',async()=>{let calls=0;const t=createRoomTransport({code:'ABCDEF',token:'token'},{id:()=> 'id',storage:{getItem:()=>null,setItem:()=>{throw Error('full');}},fetcher:async()=>{calls++;}});await assert.rejects(t.send({type:'NEXT'}));assert.equal(calls,0);assert.equal(t.hasPending(),false);});
test('Persistent transaction failures return retryable status; foreign origins and expired rooms reject',()=>fixture(async({store,handle})=>{
 const failing=pairedRooms({transaction:async()=>{const e=Error('storage failed');e.status=503;throw e;}},{baseURL:'https://game.example/'});
 assert.equal((await call(failing,'',null,config('rps'))).status,503);
 assert.equal((await handle({path:'',method:'POST',body:config('rps'),origin:'https://evil.example'})).status,403);
 const {body:r}=await call(handle,'',null,config('rps'));const expired=pairedRooms(store,{baseURL:'https://game.example/',now:()=>100000000+8*86400000});assert.equal((await call(expired,'/'+r.code,r.token)).status,403);
}));
test('All seven variants accept authoritative roles, action replay, clock correction and restart',()=>fixture(async({file,handle})=>{
 for(const variant of ['rps','limited','ecard','numbers','charge','preference','spire']){
  const {status,body:r}=await call(handle,'',null,config(variant));assert.equal(status,201);const action=variant==='spire'?{type:'PATH',path:'normal'}:variant==='preference'?{type:'SELECT',favorite:0,guess:1}:{type:'SELECT',index:0};action.epoch=r.state.epoch;
  const request={requestId:variant+'-one',action},a=await call(handle,'/'+r.code+'/action',r.token,request);assert.equal(a.status,200,variant);const duplicate=await call(handle,'/'+r.code+'/action',r.token,request);assert.equal(duplicate.body.state.revision,a.body.state.revision);
  if(variant!=='preference'){
   if(variant==='spire')await call(handle,'/'+r.code+'/action',r.token,{requestId:'play',action:{type:'PLAY',index:0,epoch:a.body.state.epoch}});
   const timer=await call(handle,'/'+r.code+'/action',r.token,{requestId:'timer',action:{type:'TIMER',now:1,epoch:a.body.state.epoch}});assert.equal(timer.status,200);const mission=variant==='spire'?timer.body.state.pending:timer.body.state.secret[0].task;assert.ok(mission.endsAt>=100000000);
  }
  const restored=pairedRooms(await createFileRoomStore(file),{baseURL:'https://game.example/',now:()=>100000000});const peer=await call(restored,'/'+r.code,r.inviteToken);assert.equal(peer.status,200);assert.equal(peer.body.actor,1);if(variant!=='spire')assert.equal(peer.body.state.secret[0],null);
 }
}));
