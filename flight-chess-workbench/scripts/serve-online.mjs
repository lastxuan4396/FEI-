import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pairedRooms} from '../server/pairedRooms.js';
import {createArcadeHTTP} from '../server/arcadeHttp.js';
import {createFileRoomStore,createRedisRoomStore} from '../server/roomStore.js';
import {createBoardRooms} from './board-rooms.mjs';
import {referenceCatalog} from './reference-catalog.mjs';
import {requestOriginAllowed} from './request-origin.mjs';
const port=Number(process.env.PORT)||8877;
const baseURL=process.env.PUBLIC_BASE_URL||process.env.RENDER_EXTERNAL_URL||`http://127.0.0.1:${port}/`;
if(process.env.RENDER&&!process.env.REDIS_URL)throw Error('REDIS_URL is required on Render; refusing ephemeral room storage.');
const directory=process.env.ROOM_DIRECTORY||fileURLToPath(new URL('../work/online-rooms/',import.meta.url));
const prefix=process.env.REDIS_PREFIX||'paired-workbench-v1';
const store=process.env.REDIS_URL?await createRedisRoomStore(process.env.REDIS_URL,prefix+':paired'):await createFileRoomStore(path.join(directory,'paired.json'));
const boardStore=process.env.REDIS_URL?await createRedisRoomStore(process.env.REDIS_URL,prefix+':board'):await createFileRoomStore(path.join(directory,'board.json'));
const arcadeStore=process.env.REDIS_URL?await createRedisRoomStore(process.env.REDIS_URL,prefix+':arcade'):await createFileRoomStore(path.join(directory,'arcade.json'));
const paired=pairedRooms(store,{baseURL}),boards=await createBoardRooms({store:boardStore}),references=referenceCatalog();
const arcade=createArcadeHTTP({store:arcadeStore,baseURL});
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.wasm':'application/wasm'};
const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
const server=http.createServer(async(req,res)=>{
 res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
  if(pathname==='/healthz'){json(res,200,{ok:true,service:'paired-workbench',storage:process.env.REDIS_URL?'redis':'local-file'});return;}
  if(await boards(req,res,pathname))return;
  if(await arcade(req,res,pathname))return;
  if(pathname==='/api/rooms'||pathname.startsWith('/api/rooms/')){
   if(!requestOriginAllowed(req)){json(res,403,{error:'请从本网站打开房间'});return;}
   let body;if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>800000){json(res,413,{error:'题库太大，请减少本局题目数量。'});return;}}try{body=JSON.parse(raw);}catch{json(res,400,{error:'请求格式不正确'});return;}}
   const result=await paired({path:pathname.slice('/api/rooms'.length),method:req.method,body,token:req.headers.authorization?.replace(/^Bearer /,''),requestId:req.headers['x-request-id']});
   json(res,result.status,result.body);return;
  }
  if(pathname==='/api/vision/status'){json(res,200,{available:false});return;}
  if(pathname==='/api/vision'){json(res,501,{error:'图片文字识别需使用本机工作台；线上可导入已经整理的地图。'});return;}
  if(pathname==='/api/reference-boards'){json(res,200,{boards:await references.list()});return;}
  const reference=pathname.match(/^\/api\/reference-boards\/([1-9]\d{0,2})\/(image|thumbnail|text|map)$/);
  if(reference){const [,id,kind]=reference;if(kind==='image'||kind==='thumbnail'){const image=await references.image(Number(id),kind==='thumbnail');res.writeHead(200,{'Content-Type':image.type});res.end(image.body);}else json(res,200,kind==='map'?await references.map(Number(id)):await references.text(Number(id)));return;}
  if(pathname.startsWith('/api/')){json(res,404,{error:'接口不存在'});return;}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const data=await readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache'});res.end(req.method==='HEAD'?undefined:data);
 }catch(e){json(res,e.status||404,{error:e.status===503?'房间保存暂时失败，请稍后重连。':'内容暂时无法读取。'});}
});
server.listen(port,'0.0.0.0',()=>console.log(`Online workbench listening on ${port}`));
const stop=()=>server.close(async()=>{await Promise.all([store.close(),boardStore.close(),arcadeStore.close()]);process.exit(0);});process.on('SIGTERM',stop);process.on('SIGINT',stop);
