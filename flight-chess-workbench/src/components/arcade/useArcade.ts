import {useCallback,useEffect,useRef,useState} from 'react';
import {ArcadeAction,ArcadeKind,ArcadeSession,arcadeTransition} from '../../core/arcade.js';
import {loadArcadeGames,saveArcadeGame,StoredArcade} from '../../core/arcadeStorage';
export function useArcade(){
 const [games,setGames]=useState<Partial<Record<ArcadeKind,StoredArcade>>>({}),[invalid,setInvalid]=useState<Partial<Record<ArcadeKind,unknown>>>({});
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const records=useRef(games),lock=useRef(false),pendingReload=useRef(false),channel=useRef<BroadcastChannel>();
 const reload=useCallback(async()=>{if(lock.current){pendingReload.current=true;return;}try{const loaded=await loadArcadeGames();records.current=loaded.games;setGames(loaded.games);setInvalid(loaded.invalid);}catch(e){setError(e instanceof Error?e.message:'读取进度失败');}finally{setLoading(false);}},[]);
 useEffect(()=>{void reload();const bc=new BroadcastChannel('flight-chess-arcade-v1');channel.current=bc;bc.onmessage=()=>void reload();const focus=()=>void reload();window.addEventListener('focus',focus);return()=>{bc.close();window.removeEventListener('focus',focus);};},[reload]);
 const commit=async(kind:ArcadeKind,next:ArcadeSession|ArcadeAction,fresh=false,replaceInvalid=false)=>{
  if(lock.current)return false;lock.current=true;setBusy(true);setError('');
  try{const expected=records.current[kind];const session='format' in next?next:arcadeTransition(expected!.session,{...next,expectedRevision:expected!.session.state.revision});
   const result=await saveArcadeGame(session,expected,{fresh,replaceInvalid});records.current={...records.current,[kind]:result};setGames(records.current);setInvalid(prev=>{const value={...prev};delete value[kind];return value;});channel.current?.postMessage({kind,revision:session.state.revision});return true;
  }catch(e){setError(e instanceof Error?e.message:'保存失败');pendingReload.current=true;return false;}finally{lock.current=false;setBusy(false);if(pendingReload.current){pendingReload.current=false;void reload();}}
 };
 return {games,invalid,loading,busy,error,setError,commit};
}
