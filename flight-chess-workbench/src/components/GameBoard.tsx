import { useEffect, useRef, useState, type ReactNode } from 'react';
import {MapViewport} from './MapViewport';
import {boardGeometry} from '../core/boardLayouts.js';
import { Player } from '../types';
import { CoreConfig } from '../core/types';
import { BoardArtwork } from './BoardArtwork';
import {imageTask} from '../core/imageTaskLibrary.js';
import {tileLabel} from '../core/config.js';
import {taskDuration,durationLabel} from '../core/taskTiming.js';
interface Props { config: CoreConfig; players: Player[]; currentTurn: number;onMoveTo?:(position:number)=>void;moveKey?:number;fullscreenControls?:ReactNode;expandKey?:number;onExpandedChange?:(value:boolean)=>void }
export function GameBoard(props: Props) {
  const [selected,setSelected]=useState<number|null>(null);
  const readerRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(selected!==null)readerRef.current?.scrollIntoView({block:'nearest'});},[selected]);
  const own=!props.config.layout.image,tile=selected===null?undefined:props.config.tiles[selected];
  const text=tile&&(tile.playerTexts?.[props.config.players[props.currentTurn]?.id]??tile.text??tileLabel(tile,props.config));
  const origin=text?imageTask(text):undefined;
  const duration=text?tile?.duration??taskDuration(text):undefined;
  const inspect=own?(position:number)=>setSelected(position):undefined;
  const reader=tile&&<div className="task-cell-reader" ref={readerRef} data-task-reader={selected}><small>第{selected}格 · {tile.type==='task'?'本局实际任务':'格内规则'}</small><p>{text}</p>{origin&&<small>图片{origin.image} · {origin.reviewed?'已整理':'识别文字待核对'} · <a href={`/api/reference-boards/${origin.image}/image`} target="_blank" rel="noreferrer">对照原图</a><br/></small>}{duration&&<small>计时 {durationLabel(duration)} · 落到这格后可开始</small>}</div>;
  return <div className="w-full" aria-label="飞行棋棋盘">{own?<MapViewport defaultSize="comfortable" preferenceKey="flight-chess.generated-map-display.v3" controls={props.fullscreenControls} expandKey={props.expandKey} onExpandedChange={props.onExpandedChange} naturalWidth={Math.max(840,boardGeometry(props.config).columns*80+80)} focusKey={props.players[props.currentTurn]?.step} focusSelector={`[data-player-token="${props.players[props.config.rules.goal==='cooperative'?0:props.currentTurn]?.id}"]`} footer={reader}><BoardArtwork {...props} onInspectTile={inspect}/></MapViewport>:<BoardArtwork {...props}/>}
    {own&&<div className="own-board-player-legend">{props.players.map((p,i)=><button key={p.id} onClick={()=>setSelected(p.step)} style={{borderColor:p.color}}><span style={{color:p.color}}>●</span> {p.name} · 第{p.step}格{i===props.currentTurn?' · 当前回合':''}</button>)}</div>}
    {own&&reader}
  </div>;
}
