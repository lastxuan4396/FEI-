import {useEffect,useRef,useState} from 'react';
import type {CoreConfig} from '../core/types';
import {parseConfigJSON} from '../core/config.js';
import type {ReferenceBoard} from './modals/ReferenceBoardsPanel';

export function QuickMapPicker({active,onStart}:{active:boolean;onStart:(board:CoreConfig)=>Promise<boolean|null>}){
 const [boards,setBoards]=useState<ReferenceBoard[]>([]),[busy,setBusy]=useState<number|null>(null),[error,setError]=useState('');
 const lock=useRef(false),request=useRef<AbortController|null>(null);
 useEffect(()=>{const controller=new AbortController();void fetch(`${import.meta.env.BASE_URL}api/reference-boards`,{signal:controller.signal}).then(async r=>{if(!r.ok)return;const data=await r.json();if(Array.isArray(data.boards))setBoards(data.boards.filter((b:ReferenceBoard)=>Number.isSafeInteger(b.id)&&b.id>0&&b.preparedCells));}).catch(()=>{});return()=>{controller.abort();request.current?.abort();};},[]);
 async function start(board:ReferenceBoard){
  if(lock.current)return;
  if(active&&!confirm('更换棋盘会结束当前局。要开始这张棋盘吗？'))return;
  lock.current=true;setBusy(board.id);setError('');const controller=new AbortController();request.current=controller;
  try{const response=await fetch(`${import.meta.env.BASE_URL}api/reference-boards/${board.id}/map`,{signal:controller.signal});if(!response.ok)throw Error('这张地图暂时读不到，请稍后重试。');const source=await response.text();if(controller.signal.aborted)return;const config=parseConfigJSON(source);if(!config.layout.image||config.tiles.length!==board.preparedCells)throw Error('地图信息已变化，请刷新后重试。');if(!await onStart(config))setError('未能开始，请查看保存提示后重试。');}
  catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'地图加载失败，请重试。');}
  finally{lock.current=false;if(!controller.signal.aborted)setBusy(null);}
 }
 if(!boards.length)return null;
 return <section className="quick-map-picker" aria-label="选择棋盘直接开始"><div className="quick-map-heading"><h2>{active?'换一张棋盘':'选棋盘，直接开始'}</h2><span>点击即可开局</span></div><p>保留原图。复杂条件由玩家按图确认。</p><div className="quick-map-grid">{boards.map(board=><button key={board.id} disabled={busy!==null} onClick={()=>void start(board)} aria-label={`开始第${board.id}张棋盘`}><img src={`${import.meta.env.BASE_URL}api/reference-boards/${board.id}/thumbnail`} alt={`第${board.id}张棋盘预览`} loading="lazy"/><div><b>第{board.id}张棋盘</b><span>{busy===board.id?'正在打开…':`${board.preparedCells} 格 · 开始 →`}</span></div></button>)}</div>{error&&<p role="alert">{error}</p>}</section>;
}
