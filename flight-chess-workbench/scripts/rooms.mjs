import {randomBytes} from 'node:crypto';
import {networkInterfaces} from 'node:os';
import {mkdir,readFile,writeFile,rename,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {requestOriginAllowed} from './request-origin.mjs';
import {createAdventure,adventureTransition,adventureView} from '../src/core/adventure.js';
const defaultDirectory=fileURLToPath(new URL('../work/paired-rooms/',import.meta.url));
export async function createRooms({directory=defaultDirectory}={}){
 await mkdir(directory,{recursive:true});const rooms=new Map();let writeQueue=Promise.resolve();
 for(const name of (await readdir(directory)).filter(n=>/^[A-F0-9]{6}\.json$/.test(n)).slice(-30)){try{const room=JSON.parse(await readFile(`${directory}/${name}`,'utf8'));if(room.updated>Date.now()-7*86400000&&room.tokens?.length===2&&room.state?.format==='paired-adventure')rooms.set(room.code,room);}catch{/* A damaged file is not exposed as a live room. */}}
 const save=room=>{const body=JSON.stringify(room);writeQueue=writeQueue.catch(()=>{}).then(async()=>{await writeFile(`${directory}/${room.code}.tmp`,body,{mode:0o600});await rename(`${directory}/${room.code}.tmp`,`${directory}/${room.code}.json`);});return writeQueue;};
 return async function handle(req,res,pathname){
  if(!pathname.startsWith('/api/rooms'))return false;
  const respond=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  if(!requestOriginAllowed(req)){respond(403,{error:'请从本网站打开房间'});return true;}
  try{
   let urls=Object.values(networkInterfaces()).flat().filter(n=>n&&n.family==='IPv4'&&!n.internal&&/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address)).map(n=>`http://${n.address}:${req.socket.localPort}/`);
   const publicURL=process.env.PUBLIC_BASE_URL||process.env.RENDER_EXTERNAL_URL;if(publicURL)urls=[new URL('/',publicURL).toString()];
   try{const publicUrl=(await readFile(new URL('../work/service/public-url.txt',import.meta.url),'utf8')).trim();if(/^https:\/\/[a-z0-9-]+\.trycloudflare\.com\/\?access=[a-f0-9]{48}$/.test(publicUrl))urls=[publicUrl,...urls];}catch{/* Local network is still available. */}
   if(pathname==='/api/rooms/network'&&req.method==='GET'){respond(200,{urls});return true;}
   async function body(){let value='';for await(const chunk of req){value+=chunk;if(Buffer.byteLength(value)>1_000_000)throw Error('请求过大');}return JSON.parse(value);}
   if(pathname==='/api/rooms'&&req.method==='POST'){
    for(const [code,room] of rooms)if(room.updated<Date.now()-7*86400000)rooms.delete(code);
    if(rooms.size>=30)throw Error('房间较多，请继续使用已有房间');const config=await body(),state=createAdventure(config);let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));const room={code,state,tokens:[randomBytes(24).toString('hex'),randomBytes(24).toString('hex')],updated:Date.now(),seen:[[],[]]};await save(room);rooms.set(code,room);respond(201,{code,token:room.tokens[0],inviteToken:room.tokens[1],urls,state:adventureView(state,0),actor:0});return true;
   }
   const match=pathname.match(/^\/api\/rooms\/([A-F0-9]{6})(?:\/(action))?$/);if(!match){respond(404,{error:'房间不存在'});return true;}const room=rooms.get(match[1]),token=req.headers.authorization?.replace(/^Bearer /,'');const actor=room?.tokens.indexOf(token);if(!room||actor<0||actor===undefined){respond(403,{error:'链接无效或房间已过期'});return true;}
   if(req.method==='GET'&&!match[2]){respond(200,{code:room.code,actor,state:adventureView(room.state,actor)});return true;}
   if(req.method==='POST'&&match[2]){
    const {action,requestId}=await body();if(typeof requestId!=='string'||requestId.length>100||!requestId.length)throw Error('操作编号不正确');
    if(!room.seen[actor].includes(requestId)){room.state=adventureTransition(room.state,action,actor);room.seen[actor]=[...room.seen[actor].slice(-49),requestId];room.updated=Date.now();await save(room);}respond(200,{actor,state:adventureView(room.state,actor)});return true;
   }respond(405,{error:'操作方式不正确'});
  }catch(e){respond(422,{error:e.message||'操作失败'});}return true;
 };
}
