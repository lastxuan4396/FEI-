import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createArcade} from '../src/core/arcade.js';

const people=[{name:'联机测试甲',color:'#cf765b'},{name:'联机测试乙',color:'#548e95'}];
const fresh=(kind,extra={})=>createArcade(kind,people,{pool:['阅读卡片90秒','整理桌面5次','画一个圆'],creative:true,rounds:3,...extra});
async function availablePort(){const server=http.createServer();server.listen(0,'127.0.0.1');await once(server,'listening');const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;}
async function startServer(directory){
 const port=await availablePort(),base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['scripts/serve-online.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:String(port),ROOM_DIRECTORY:directory,PUBLIC_BASE_URL:base+'/',REDIS_URL:'',RENDER:'',RENDER_EXTERNAL_URL:''},stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',v=>{output+=v.toString();});child.stderr.on('data',v=>{output+=v.toString();});
 try{
  await new Promise((resolve,reject)=>{const deadline=setTimeout(()=>{cleanup();reject(Error('Online test server did not start: '+output));},10000),ready=()=>{if(output.includes('Online workbench listening')){cleanup();resolve();}},failed=code=>{cleanup();reject(Error(`Online test server exited ${code}: ${output}`));};function cleanup(){clearTimeout(deadline);child.stdout.off('data',ready);child.off('exit',failed);child.off('error',failed);}child.stdout.on('data',ready);child.once('exit',failed);child.once('error',failed);ready();});
 }catch(error){child.kill('SIGKILL');throw error;}
 return {base,child,stop:async()=>{if(child.exitCode!==null)return;const exited=once(child,'exit');child.kill('SIGTERM');const force=setTimeout(()=>child.kill('SIGKILL'),5000);try{await exited;}finally{clearTimeout(force);}}};
}
async function request(base,path,{token,body,origin,id,raw,headers={}}={}){
 const response=await fetch(base+path,{method:body!==undefined||raw!==undefined?'POST':'GET',headers:{...headers,...(origin?{Origin:origin}:{}),...(token?{Authorization:`Bearer ${token}`} :{}),...(body!==undefined||raw!==undefined?{'Content-Type':'application/json'}:{}),...(id?{'X-Request-ID':id}:{})},...(body!==undefined||raw!==undefined?{body:raw??JSON.stringify(body)}:{}),signal:AbortSignal.timeout(5000)});
 return {status:response.status,cache:response.headers.get('cache-control'),data:await response.json()};
}
const okay=result=>{assert.ok(result.status>=200&&result.status<300,result.data.error);return result.data;};

test('The online HTTP server isolates arcade routes, keeps old paired rooms and persists choices across restart',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'flight-arcade-http-'));let service;
 try{
  service=await startServer(directory);let base=service.base;
  const health=await request(base,'/healthz');assert.equal(health.status,200);assert.equal(health.data.storage,'local-file');assert.equal(health.cache,'no-store');
  const paired=okay(await request(base,'/api/rooms',{body:{variant:'rps',players:['配对测试甲','配对测试乙'],pool:['阅读10秒','画一个圆'],settings:{rounds:3}}}));
  const vote=okay(await request(base,'/api/arcade-rooms',{body:{session:fresh('vote')},origin:base,id:'http-create-vote'}));
  assert.equal(vote.actor,0);assert.equal(vote.revision,0);assert.ok(vote.inviteToken);
  const repeated=okay(await request(base,'/api/arcade-rooms',{body:{session:fresh('vote')},origin:base,id:'http-create-vote'}));assert.equal(repeated.code,vote.code);
  const guest=okay(await request(base,`/api/arcade-rooms/${vote.code}`,{token:vote.inviteToken,origin:base}));assert.equal(guest.actor,1);assert.equal(guest.inviteToken,undefined);
  const action={type:'VOTE',target:1,expectedRevision:0};
  const submitted=okay(await request(base,`/api/arcade-rooms/${vote.code}/action`,{token:vote.inviteToken,origin:base,body:{requestId:'http-guest-choice',action}}));assert.deepEqual(submitted.submitted,[false,true]);
  const hidden=okay(await request(base,`/api/arcade-rooms/${vote.code}`,{token:vote.token}));assert.deepEqual(hidden.session.state.creative.ballots,[-1,-1]);assert.deepEqual(hidden.session.state.undo,[]);assert.equal(hidden.ownBallot,null);
  const pairedStill=okay(await request(base,`/api/rooms/${paired.code}`,{token:paired.token}));assert.equal(pairedStill.actor,0);assert.equal(pairedStill.state.config.variant,'rps');
  assert.equal((await request(base,'/api/arcade-rooms-not-a-route')).status,404);
  assert.equal((await request(base,`/api/arcade-rooms/${vote.code}`,{token:vote.token,origin:'https://foreign.invalid'})).status,403);
  assert.equal((await request(base,`/api/arcade-rooms/${vote.code}`,{token:vote.token,headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
  assert.equal((await request(base,'/api/arcade-rooms',{raw:'{bad json'})).status,400);
  assert.equal((await request(base,'/api/arcade-rooms',{body:{session:fresh('spinner'),padding:'x'.repeat(2_000_000)}})).status,413);
  const scene='data:image/png;base64,'+'A'.repeat(600000);
  const mystery=okay(await request(base,'/api/arcade-rooms',{body:{session:fresh('mystery',{scene,puzzles:[{label:'线索一',x:.2,y:.3,clue:'选择正确方向',answer:'向前'}]})},id:'http-mystery-scene'}));assert.equal(mystery.session.config.scene,scene);assert.equal(mystery.session.config.puzzles[0].answer,'答案保密');
  await service.stop();service=null;
  const arcadeFile=JSON.parse(await readFile(join(directory,'arcade.json'),'utf8')),pairedFile=JSON.parse(await readFile(join(directory,'paired.json'),'utf8'));
  assert.ok(arcadeFile[vote.code]);assert.ok(arcadeFile[mystery.code]);assert.ok(!arcadeFile[paired.code]);assert.ok(pairedFile[paired.code]);assert.ok(!pairedFile[vote.code]);
  service=await startServer(directory);base=service.base;
  const restored=okay(await request(base,`/api/arcade-rooms/${vote.code}`,{token:vote.inviteToken}));assert.equal(restored.actor,1);assert.equal(restored.revision,submitted.revision);assert.equal(restored.ownBallot,1);assert.deepEqual(restored.submitted,[false,true]);
  const retry=okay(await request(base,`/api/arcade-rooms/${vote.code}/action`,{token:vote.inviteToken,body:{requestId:'http-guest-choice',action}}));assert.equal(retry.revision,submitted.revision);
  const revealed=okay(await request(base,`/api/arcade-rooms/${vote.code}/action`,{token:vote.token,body:{requestId:'http-host-choice',action:{type:'VOTE',target:1,expectedRevision:restored.revision}}}));assert.equal(revealed.session.state.phase,'reveal');assert.deepEqual(revealed.session.state.creative.ballots,[1,1]);
  const imageAfter=okay(await request(base,`/api/arcade-rooms/${mystery.code}`,{token:mystery.inviteToken}));assert.equal(imageAfter.session.config.scene,scene);
  assert.equal((await request(base,`/api/rooms/${paired.code}`,{token:paired.inviteToken})).status,200);
 }finally{await service?.stop();await rm(directory,{recursive:true,force:true});}
});
