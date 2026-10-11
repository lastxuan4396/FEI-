import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
const ttl=7*86400;
function unavailable(error){const failure=new Error('Room storage unavailable',{cause:error});failure.status=503;return failure;}
function snapshot(data){let dirty=false;return {tx:{async get(key){return structuredClone(data[key]??null);},put(key,value){data[key]=structuredClone(value);dirty=true;}},dirty:()=>dirty};}
// Serialize whole transactions, not only writes. Failed saves never replace the last good snapshot.
export async function createFileRoomStore(file){
 await mkdir(path.dirname(file),{recursive:true});let data={};
 try{data=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 let queue=Promise.resolve();
 return {async entries(){await queue;return Object.entries(structuredClone(data));},transaction(fn){
  const job=queue.catch(()=>{}).then(async()=>{const draft=structuredClone(data),view=snapshot(draft),result=await fn(view.tx);
   if(view.dirty()){try{await writeFile(file+'.tmp',JSON.stringify(draft),{mode:0o600});await rename(file+'.tmp',file);}catch(e){throw unavailable(e);}data=draft;}return result;});
  queue=job.then(()=>{},()=>{});return job;
 },close:async()=>{await queue;}};
}
// One watched key per isolated game family, with bounded size and no silent memory fallback.
export async function createRedisRoomStore(url,key){
 const {createClient,WatchError}=await import('redis');
 const client=createClient({url,disableOfflineQueue:true,socket:{connectTimeout:10000,reconnectStrategy:retries=>Math.min(1000*retries,10000)}});
 client.on('error',()=>{});await client.connect();let queue=Promise.resolve();
 return {async entries(){await queue;try{return Object.entries(JSON.parse(await client.get(key)||'{}'));}catch(e){throw unavailable(e);}},transaction(fn){
  const job=queue.catch(()=>{}).then(async()=>{
   for(let attempt=0;attempt<5;attempt++){
    let data;try{await client.watch(key);data=JSON.parse(await client.get(key)||'{}');}catch(e){throw unavailable(e);}
    const view=snapshot(data);let result;
    try{result=await fn(view.tx);}catch(e){await client.unwatch();throw e;}
    if(!view.dirty()){await client.unwatch();return result;}
    // Keep the free datastore bounded. Existing rooms stay available when a new save is too large.
    for(const [id,value]of Object.entries(data))if(id!=='index'&&value.updated<Date.now()-ttl*1000)delete data[id];
    const json=JSON.stringify(data);if(Buffer.byteLength(json)>22000000){await client.unwatch();const e=Error('房间容量已满，请缩小图片或题库。');e.status=413;throw e;}
    try{await client.multi().set(key,json,{EX:ttl}).exec();return result;}catch(e){if(e instanceof WatchError)continue;throw unavailable(e);}
   }throw unavailable(Error('Concurrent save conflict'));
  });queue=job.then(()=>{},()=>{});return job;
 },close:async()=>{await queue;await client.quit();}};
}
