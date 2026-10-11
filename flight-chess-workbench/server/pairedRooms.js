import {randomBytes,createHash} from 'node:crypto';
import {createAdventure,adventureTransition,adventureView} from '../src/core/adventure.js';
const lifetime=7*86400000;
const hash=text=>createHash('sha256').update(text).digest('hex');
const reply=(status,body)=>({status,body});
// Store transactions must isolate read -> transition -> durable write.
export function pairedRooms(store,{baseURL,now=Date.now}={}){
 return async ({path,method,token,body,origin,requestId})=>{
  if(origin&&origin!==new URL(baseURL).origin)return reply(403,{error:'请从本网站打开房间'});
  const urls=[baseURL];
  try{
   if(path==='/network'&&method==='GET')return reply(200,{urls,mode:'internet'});
   if(path===''&&method==='POST'){
    if(Buffer.byteLength(JSON.stringify(body))>800000)return reply(413,{error:'题库太大，请减少本局题目数量。'});
    const state=createAdventure(body),createId=requestId&&/^[\w-]{1,100}$/.test(requestId)?hash(requestId):null;
    return await store.transaction(async tx=>{
     const index=await tx.get('index')??{rooms:{},requests:{}};
     if(createId&&index.requests[createId]){const old=await tx.get(index.requests[createId]);if(old&&old.updated>now()-lifetime)return reply(201,{code:old.code,token:old.tokens[0],inviteToken:old.tokens[1],urls,state:adventureView(old.state,0),actor:0});}
     index.rooms=Object.fromEntries(Object.entries(index.rooms).filter(([,updated])=>updated>now()-lifetime));
     index.requests=Object.fromEntries(Object.entries(index.requests).filter(([,code])=>index.rooms[code]));
     if(Object.keys(index.rooms).length>=30)return reply(429,{error:'房间较多，请继续使用已有房间。'});
     let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(index.rooms[code]);
     const room={code,state,tokens:[randomBytes(24).toString('hex'),randomBytes(24).toString('hex')],seen:[[],[]],updated:now(),lastSeen:[now(),0]};
     index.rooms[code]=room.updated;if(createId)index.requests[createId]=code;
     tx.put(code,room);tx.put('index',index);
     return reply(201,{code,token:room.tokens[0],inviteToken:room.tokens[1],urls,state:adventureView(state,0),actor:0});
    });
   }
   const match=path.match(/^\/([A-F0-9]{6})(\/action)?$/);
   if(!match)return reply(404,{error:'房间不存在'});
   return await store.transaction(async tx=>{
    const room=await tx.get(match[1]),actor=room?.tokens.indexOf(token);
    if(!room||actor<0||actor===undefined||room.updated<=now()-lifetime)return reply(403,{error:'链接无效或房间已过期'});
    room.lastSeen??=[0,0];
    if(method==='POST'&&match[2]){
     if(!body||typeof body.requestId!=='string'||!body.requestId.length||body.requestId.length>100)return reply(422,{error:'操作编号不正确'});
     if(!room.seen[actor].includes(body.requestId)){
      const action={...body.action};if('now'in action&&action.now!==null)action.now=now();
      room.state=adventureTransition(room.state,action,actor);
      room.seen[actor]=[...room.seen[actor].slice(-99),body.requestId];room.updated=now();
      const index=await tx.get('index');if(index){index.rooms[room.code]=room.updated;tx.put('index',index);}
      room.lastSeen[actor]=now();tx.put(room.code,room);
     }
    }else if(method==='GET'&&!match[2]){
     if(now()-room.lastSeen[actor]>=20000){room.lastSeen[actor]=now();tx.put(room.code,room);}
    }else return reply(405,{error:'操作方式不正确'});
    return reply(200,{code:room.code,actor,urls,...(actor===0?{inviteToken:room.tokens[1]}:{}),state:adventureView(room.state,actor),presence:{joined:room.lastSeen.map(Boolean),online:room.lastSeen.map(t=>t>0&&now()-t<45000)}});
   });
  }catch(error){return reply(error.status??422,{error:error.status===503?'房间保存暂时失败，请稍后重连。':error.message||'操作失败'});}
 };
}
