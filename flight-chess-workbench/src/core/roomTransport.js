// One durable pending action per player. Retries keep its id, including after reload.
export class RoomAPIError extends Error {
 constructor(message,status=0){super(message);this.status=status;}
}
export async function roomRequest(path,options={},fetcher=fetch){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetcher(`/api/rooms${path}`,{...options,signal:controller.signal,cache:'no-store'});
  let data;try{data=await response.json();}catch{throw new RoomAPIError('房间服务暂时不可用，请稍后重连。',response.status);}
  if(!response.ok)throw new RoomAPIError(data.error||'房间连接失败',response.status);
  return data;
 }finally{clearTimeout(timeout);}
}
export function roomOperationId(){return globalThis.crypto?.randomUUID?.()??Array.from(globalThis.crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,'0')).join('');}
export function createRoomTransport(connection,{storage=localStorage,fetcher=fetch,id=roomOperationId}={}){
 const key=`flight-chess.room-pending.${connection.code}.${connection.token.slice(0,12)}`;
 let pending;try{pending=JSON.parse(storage.getItem(key)||'null');}catch{pending=null;}
 let flight=null;
 const headers={'Content-Type':'application/json',Authorization:`Bearer ${connection.token}`};
 async function flush(){
  if(!pending)return null;
  if(flight)return flight;
  const operation=pending;
  flight=(async()=>{
   try{
    const data=await roomRequest(`/${connection.code}/action`,{method:'POST',headers,body:JSON.stringify(operation)},fetcher);
    storage.removeItem(key);pending=null;return data;
   }catch(error){
    // Definitive rejection must not be replayed forever; network/5xx remain pending.
    if(error instanceof RoomAPIError&&error.status>=400&&error.status<500&&error.status!==429){storage.removeItem(key);pending=null;}
    throw error;
   }finally{flight=null;}
  })();return flight;
 }
 return {
  hasPending:()=>!!pending,
  async send(action){
   if(pending)throw new RoomAPIError('上一项操作正在重连确认，请稍候。');
   pending={requestId:id(),action};
   try{storage.setItem(key,JSON.stringify(pending));}catch{pending=null;throw new RoomAPIError('无法保存待发送操作，请检查浏览器存储空间。');}
   return flush();
  },
  flush,
  read:()=>roomRequest(`/${connection.code}`,{headers:{Authorization:headers.Authorization}},fetcher)
 };
}
