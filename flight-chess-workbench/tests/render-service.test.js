import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {once} from 'node:events';import net from 'node:net';import {mkdtemp,rm,access} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createTemplate} from '../src/core/config.js';
test('Render proxy accepts same-site HTTPS room actions, advertises public invitations and serves bundled boards',async t=>{
 // Source-only CI has not built dist yet; APIs must work independently of it.
 const socket=net.createServer();socket.listen(0,'127.0.0.1');await once(socket,'listening');const port=socket.address().port;await new Promise(r=>socket.close(r));
 const dir=await mkdtemp(join(tmpdir(),'render-room-'));const child=spawn(process.execPath,['scripts/serve.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port),PUBLIC_BASE_URL:'https://chess.example.test',PLAYTEST_ROOM_DIRECTORY:join(dir,'paired'),PLAYTEST_BOARD_ROOM_DIRECTORY:join(dir,'boards')},stdio:['ignore','pipe','pipe']});
 t.after(async()=>{child.kill('SIGTERM');await once(child,'exit');await rm(dir,{recursive:true,force:true});});
 await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Service exited before listening');})]);const base=`http://127.0.0.1:${port}`;
 const headers={Origin:'https://chess.example.test','X-Forwarded-Proto':'https',Host:'chess.example.test','Content-Type':'application/json'};
 const post=(path,body)=>fetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});
 assert.equal((await fetch(base+'/healthz')).status,200);
 const network=await(await fetch(base+'/api/rooms/network',{headers})).json();assert.deepEqual(network.urls,['https://chess.example.test/']);
 const paired=await post('/api/rooms',{variant:'preference',players:['甲','乙'],pool:['观察窗外10秒','伸展5次','休息20秒'],settings:{rounds:2}});assert.equal(paired.status,201);
 const board=await post('/api/board-rooms',{config:createTemplate(6)});assert.equal(board.status,201);const room=await board.json();
 const read=await fetch(base+'/api/board-rooms/'+room.code,{headers:{...headers,Authorization:`Bearer ${room.inviteToken}`}});assert.equal(read.status,200);
 const crossed=await fetch(base+'/api/board-rooms/'+room.code,{headers:{...headers,Origin:'https://other.example.test',Authorization:`Bearer ${room.inviteToken}`}});assert.equal(crossed.status,403);
 const listed=await(await fetch(base+'/api/reference-boards',{headers})).json();assert.equal(listed.boards.length,27);assert(listed.boards.every(b=>b.preparedCells>=4));
 const map=await(await fetch(base+'/api/reference-boards/11/map',{headers})).json();assert(map.layout.image.dataUrl.startsWith('data:image/'));assert.equal(map.tiles.length,56);
 const photo=await fetch(base+'/api/reference-boards/11/thumbnail',{headers});assert.equal(photo.status,200);assert.equal(photo.headers.get('Content-Type'),'image/jpeg');
 try{await access(new URL('../dist/index.html',import.meta.url));}catch{return;}
 const page=await fetch(base+'/');assert.equal(page.status,200);assert.equal(page.headers.get('Referrer-Policy'),'no-referrer');const html=await page.text();const asset=html.match(/src="([^"]+\.js)"/)[1];assert.equal((await fetch(base+asset)).status,200);
});
