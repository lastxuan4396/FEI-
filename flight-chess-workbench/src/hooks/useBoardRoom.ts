import {useCallback,useEffect,useRef,useState} from 'react';
import type {CoreConfig,EngineAction,EngineState} from '../core/types';
import {boardActionAllowed,type BoardRoomSnapshot} from '../core/boardRoomPolicy.js';
export const onlineId=()=>crypto.randomUUID?.()??`${Date.now()}-${Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-')}`;
type Connection={code:string;token:string;inviteToken?:string;origin?:string};
const key='flight-chess.board-room.v1';
function connection():Connection|null{const u=new URL(location.href),code=u.searchParams.get('boardRoom'),token=u.searchParams.get('boardToken');if(code&&token)return {code,token};try{return JSON.parse(sessionStorage.getItem(key)??'null');}catch{return null;}}
function pendingKey(r:Connection){return `flight-chess.board-pending.${r.code}.${r.token.slice(0,12)}`;}
async function request(r:Connection,operation:unknown){const response=await fetch(`/api/board-rooms/${r.code}/action`,{method:'POST',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json',Authorization:`Bearer ${r.token}`},body:JSON.stringify(operation)});const data=await response.json();return {response,data};}
function inviteOrigin(urls:string[]){if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname))return urls[0]??location.origin;const u=new URL('.',location.href);const access=new URL(location.href).searchParams.get('access');if(access)u.searchParams.set('access',access);return u.toString();}
export function useBoardRoom(){
 const [room,setRoom]=useState<Connection|null>(connection),[snapshot,setSnapshot]=useState<BoardRoomSnapshot|null>(null),[status,setStatus]=useState('正在连接房间…'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const current=useRef(snapshot),connectionRef=useRef(room),locked=useRef(false),pending=useRef<unknown>(null),offset=useRef(0);
 current.current=snapshot;connectionRef.current=room;
 const adopt=useCallback((data:BoardRoomSnapshot)=>{offset.current=data.serverNow-Date.now();if(!current.current||data.code!==current.current.code||data.revision>=current.current.revision){current.current=data;setSnapshot(data);}setStatus(data.present[1-data.actor]?'双方在线 · 已同步':'等待对方加入／重连');setError('');},[]);
 useEffect(()=>{
  if(!room)return;sessionStorage.setItem(key,JSON.stringify(room));try{pending.current=JSON.parse(sessionStorage.getItem(pendingKey(room))??'null');}catch{pending.current=null;}let stopped=false;const controller=new AbortController();
  const poll=async()=>{try{if(pending.current&&!locked.current){locked.current=true;try{const {response,data}=await request(room,pending.current);if(stopped)return;if(response.ok||response.status>=400&&response.status<500&&response.status!==429){pending.current=null;sessionStorage.removeItem(pendingKey(room));}if(data.state)adopt(data);if(!response.ok)throw Error(data.error);}finally{locked.current=false;}}const res=await fetch(`/api/board-rooms/${room.code}?since=${current.current?.revision??-1}`,{headers:{Authorization:`Bearer ${room.token}`},signal:AbortSignal.any([controller.signal,AbortSignal.timeout(12000)])});const data=await res.json();if(stopped)return;if(!res.ok)throw Error(data.error);if(data.unchanged){offset.current=data.serverNow-Date.now();setStatus(data.present[1-data.actor]?'双方在线 · 已同步':'等待对方加入／重连');setError('');}else adopt(data);}catch(e){if(stopped)return;setStatus('连接中断 · 自动重连');setError(e instanceof Error?e.message:'连接失败');}finally{if(!stopped)timer=window.setTimeout(poll,800);}};
  let timer=0;void poll();return()=>{stopped=true;controller.abort();clearTimeout(timer);};
 },[room,adopt]);
 const create=async(config:CoreConfig,state?:EngineState)=>{if(locked.current)return false;locked.current=true;setBusy(true);setError('');try{
  const res=await fetch('/api/board-rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({config,state})});const data=await res.json();if(!res.ok)throw Error(data.error??'建房失败');
  let urls:string[]=[];try{urls=(await(await fetch('/api/rooms/network')).json()).urls??[];}catch{/* Current origin still works remotely. */}
  const next={code:data.code,token:data.token,inviteToken:data.inviteToken,origin:inviteOrigin(urls)};setRoom(next);adopt(data);
  const u=new URL(location.href);u.searchParams.set('boardRoom',next.code);u.searchParams.set('boardToken',next.token);u.hash='';history.replaceState(null,'',u);return true;
 }catch(e){setError(e instanceof Error?e.message:'建房失败');return false;}finally{setBusy(false);locked.current=false;}};
 const send=async(action:EngineAction|{type:'SHUFFLE'}|{type:'FREE_TIMER';mode:string;duration?:number})=>{
  const r=connectionRef.current,s=current.current;if(!r||!s||locked.current||pending.current)return null;
  locked.current=true;setBusy(true);setError('');
  const operation={requestId:onlineId(),revision:s.revision,action};
  try{sessionStorage.setItem(pendingKey(r),JSON.stringify(operation));pending.current=operation;let response:Response|undefined;
   // Retry transport failures with the same ID; never repeat a committed action.
   for(let attempt=0;attempt<2;attempt++){try{response=await fetch(`/api/board-rooms/${r.code}/action`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${r.token}`},body:JSON.stringify(operation),signal:AbortSignal.timeout(12000)});break;}catch(e){if(attempt===1)throw e;}}
   const data=await response!.json();if(response!.ok||response!.status>=400&&response!.status<500&&response!.status!==429){pending.current=null;sessionStorage.removeItem(pendingKey(r));}if(data.state)adopt(data);if(!response!.ok)throw Error(data.error);return data as BoardRoomSnapshot;
  }catch(e){setError(e instanceof Error?e.message:'操作失败，请检查连接');return null;}finally{locked.current=false;setBusy(false);}
 };
 const leave=()=>{connectionRef.current=null;current.current=null;setRoom(null);setSnapshot(null);setError('');sessionStorage.removeItem(key);const u=new URL(location.href);u.searchParams.delete('boardRoom');u.searchParams.delete('boardToken');history.replaceState(null,'',u);};
 const invite=new URL(room?.origin??location.origin);if(room){invite.searchParams.set('boardRoom',room.code);invite.searchParams.set('boardToken',room.inviteToken??'');}const invitation=room?.inviteToken?invite.toString():'';
 const allowed=(type:string,action:Record<string,unknown>={})=>!room||!!snapshot&&!busy&&!pending.current&&!error&&boardActionAllowed(snapshot,snapshot.actor,type,action);
 return {room,snapshot,status,error,busy,create,send,leave,invitation,allowed,serverOffset:offset.current};
}
