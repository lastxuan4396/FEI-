import {ArcadeKind, ArcadeSession, validateArcade} from './arcade.js';
export interface StoredArcade {kind:ArcadeKind;token:string;updatedAt:number;session:ArcadeSession}
const dbName='flight-chess-arcade-v1';
let opening:Promise<IDBDatabase>|undefined;
function db(){
 if(!opening)opening=new Promise<IDBDatabase>((resolve,reject)=>{
  const request=indexedDB.open(dbName,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('games',{keyPath:'kind'});
  request.onsuccess=()=>{const result=request.result;result.onversionchange=()=>{result.close();opening=undefined;};resolve(result);};
  request.onerror=()=>{opening=undefined;reject(request.error??Error('无法打开进度库'));};
 });
 return opening;
}
function checked(raw:unknown):StoredArcade {
 const record=raw as StoredArcade;
 if(!record||typeof record.token!=='string'||record.token.length>100||!Number.isFinite(record.updatedAt))throw Error('进度记录不正确');
 const session=validateArcade(record.session);
 if(record.kind!==session.config.kind)throw Error('进度与玩法不一致');
 return {...record,session};
}
export async function loadArcadeGames(){
 const database=await db();
 return new Promise<{games:Partial<Record<ArcadeKind,StoredArcade>>;invalid:Partial<Record<ArcadeKind,unknown>>}>((resolve,reject)=>{
  const transaction=database.transaction('games','readonly'),request=transaction.objectStore('games').getAll();
  request.onsuccess=()=>{const games:Partial<Record<ArcadeKind,StoredArcade>>={},invalid:Partial<Record<ArcadeKind,unknown>>={};
   for(const item of request.result){if(String(item.kind).startsWith('backup-'))continue;try{const result=checked(item);games[result.kind]=result;}catch{invalid[item.kind as ArcadeKind]=item;}}
   transaction.oncomplete=()=>resolve({games,invalid});
  };
  transaction.onerror=()=>reject(transaction.error??Error('读取进度失败'));
 });
}
// One read/write transaction serializes comparison and commit across tabs.
export async function saveArcadeGame(session:ArcadeSession,expected:StoredArcade|undefined,options:{fresh?:boolean;replaceInvalid?:boolean}={}){
 const verified=validateArcade(session),database=await db();
 return new Promise<StoredArcade>((resolve,reject)=>{
  const transaction=database.transaction('games','readwrite'),store=transaction.objectStore('games'),request=store.get(verified.config.kind);
  let error:Error|undefined,result:StoredArcade;
  request.onsuccess=()=>{try{
   const raw=request.result;let existing:StoredArcade|undefined;
   if(raw){try{existing=checked(raw);}catch{
    if(!options.replaceInvalid)throw Error('旧进度损坏，先备份后重新开局');
    store.put({...raw,kind:`backup-${verified.config.kind}-${crypto.randomUUID()}`});
   }}
   if(existing&&(!expected||existing.token!==expected.token||existing.session.state.revision!==expected.session.state.revision)||!existing&&expected)throw Error('另一个窗口已更新此局，进度已重新读取，请再操作');
   result={kind:verified.config.kind,session:verified,token:options.fresh||!existing?crypto.randomUUID():existing.token,updatedAt:Date.now()};
   store.put(result);
  }catch(e){error=e instanceof Error?e:Error('保存失败');transaction.abort();}};
  transaction.oncomplete=()=>resolve(result);
  transaction.onabort=()=>reject(error??transaction.error??Error('保存失败，当前进度未改动'));
  transaction.onerror=()=>{error=error??transaction.error??Error('保存失败，当前进度未改动');};
 });
}
