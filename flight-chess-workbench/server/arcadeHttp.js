import {arcadeRooms} from './arcadeRooms.js';
import {requestOriginAllowed} from '../scripts/request-origin.mjs';

export function createArcadeHTTP({store,baseURL}) {
 const rooms=arcadeRooms(store,{baseURL});
 const send=(res,status,body)=>{
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(body));
 };
 return async(req,res,pathname)=>{
  const prefix='/api/arcade-rooms';
  if(pathname!==prefix&&!pathname.startsWith(prefix+'/'))return false;
  if(!requestOriginAllowed(req)){send(res,403,{error:'请从本网站打开房间'});return true;}
  let body;
  if(req.method==='POST'){
   let size=0;const chunks=[];
   for await(const chunk of req){
    size+=Buffer.byteLength(chunk);
    if(size>2_000_000){send(res,413,{error:'本局设置太大，请缩小场景图片或题库后重试。'});return true;}
    chunks.push(chunk);
   }
   try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}
   catch{send(res,400,{error:'请求格式不正确'});return true;}
  }
  const result=await rooms({path:pathname.slice(prefix.length),method:req.method,body,
   token:req.headers.authorization?.replace(/^Bearer /,''),requestId:req.headers['x-request-id']});
  send(res,result.status,result.body);return true;
 };
}
