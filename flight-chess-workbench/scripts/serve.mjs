import {networkInterfaces} from 'node:os';
import {createRooms} from './rooms.mjs';
import {createBoardRooms} from './board-rooms.mjs';
import {createFileRoomStore} from '../server/roomStore.js';
import {createArcadeHTTP} from '../server/arcadeHttp.js';
import {localVision,ocrAvailable,stopVision} from './ocr-bridge.mjs';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {referenceCatalog} from './reference-catalog.mjs';
import {requestOriginAllowed} from './request-origin.mjs';
const references=referenceCatalog();
const rooms=await createRooms({directory:process.env.PLAYTEST_ROOM_DIRECTORY});
const boardRooms=await createBoardRooms({directory:process.env.PLAYTEST_BOARD_ROOM_DIRECTORY});
const port=Number(process.env.PORT)||8766;
const arcadeStore=await createFileRoomStore(path.join(process.env.PLAYTEST_ARCADE_ROOM_DIRECTORY||fileURLToPath(new URL('../work/arcade-rooms/',import.meta.url)),'arcade.json'));
const arcadeRooms=createArcadeHTTP({store:arcadeStore,baseURL:process.env.PUBLIC_BASE_URL||`http://127.0.0.1:${port}/`});
const localHosts=['127.0.0.1','localhost',...Object.values(networkInterfaces()).flat().filter(n=>n?.family==='IPv4'&&!n.internal).map(n=>n.address)];
const allowedHosts=localHosts.map(host=>`${host}:${port}`);
const allowedOrigins=allowedHosts.map(host=>`http://${host}`);
const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Content-Type-Options','nosniff');
    if(pathname==='/healthz'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,service:'flight-chess'}));return;}
    if(await boardRooms(req,res,pathname))return;
    if(await arcadeRooms(req,res,pathname))return;
    if(await rooms(req,res,pathname))return;
    if(pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
    if(pathname==='/api/reference-boards'||pathname.startsWith('/api/reference-boards/')){
      const publicURL=process.env.PUBLIC_BASE_URL||process.env.RENDER_EXTERNAL_URL;
      const publicHost=publicURL?new URL(publicURL).host:null;
      if(req.method!=='GET'||!allowedHosts.includes(req.headers.host)&&req.headers.host!==publicHost||!requestOriginAllowed(req)){res.writeHead(403);res.end('Forbidden');return;}
      try{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
        if(pathname==='/api/reference-boards'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({boards:await references.list()}));return;}
        const match=pathname.match(/^\/api\/reference-boards\/([1-9]\d{0,2})\/(image|thumbnail|text|map)$/);if(!match){res.writeHead(404);res.end();return;}const id=Number(match[1]),kind=match[2];
        if(kind==='image'||kind==='thumbnail'){const result=await references.image(id,kind==='thumbnail');res.writeHead(200,{'Content-Type':result.type});res.end(result.body);return;}
        const data=kind==='text'?await references.text(id):await references.map(id);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(data));
      }catch{res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'原图或整理文件暂时无法读取，可以直接上传图片。'}));}return;
    }
    if(pathname==='/api/vision/status'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({available:ocrAvailable(),engine:'RapidOCR 3.9.2'}));return;}
    if(pathname==='/api/vision'){
      const origin=req.headers.origin;
      if(req.method!=='POST'||origin&&![...allowedOrigins,'http://127.0.0.1:8765','http://localhost:8765'].includes(origin)){res.writeHead(403);res.end('Forbidden');return;}
      try{let body='';for await(const chunk of req){body+=chunk;if(body.length>8_500_000)throw Error('图片过大');}const request=JSON.parse(body);const result=await localVision(request);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(result));}
      catch(error){res.writeHead(422,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}return;
    }
    const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!target.startsWith(root+path.sep)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] ?? 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, '0.0.0.0', () => console.log(`飞行棋试玩：http://127.0.0.1:${port}`));

process.on('SIGTERM',()=>{stopVision();server.close(()=>process.exit(0));});process.on('SIGINT',()=>{stopVision();server.close(()=>process.exit(0));});
