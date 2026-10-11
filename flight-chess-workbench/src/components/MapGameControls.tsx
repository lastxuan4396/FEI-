import {useContext} from 'react';
import {BoardOnlineContext} from './BoardOnlineContext';
import {TaskCountTracker} from './TaskCountTracker';
import {useEffect,useRef,useState} from 'react';
import type {CoreConfig,EngineState,EngineAction} from '../core/types';
import {TaskTimer} from './TaskTimer';
import {reviewDuration} from '../core/taskTiming.js';
import {applyTaskParameters} from '../core/taskParameters.js';
import {ruleDescription} from '../core/imageRuleReview.js';
import {OngoingEffects} from './OngoingEffects';
import {isOngoingText} from '../core/ongoingEffects.js';

type FreeTimer={duration:number;endsAt:number|null;pausedRemaining?:number};
function loadTimer(key:string):FreeTimer{try{const v=JSON.parse(localStorage.getItem(key)??'null');if(v&&Number.isInteger(v.duration)&&v.duration>=1&&v.duration<=86400&&(v.endsAt===null||Number.isFinite(v.endsAt))&&(v.pausedRemaining===undefined||Number.isFinite(v.pausedRemaining)&&v.pausedRemaining>=0))return v;}catch{/* Use a fresh timer. */}return {duration:60,endsAt:null};}
export function MapGameControls({config,game,rolling,roll,onAction,onShuffle}:{config:CoreConfig;game:EngineState;rolling:boolean;roll:()=>Promise<void>;onAction:(a:EngineAction)=>Promise<EngineState|null>;onShuffle:()=>Promise<boolean|null>}){
 const online=useContext(BoardOnlineContext);
 const [busy,setBusy]=useState(false),lock=useRef(false),key=`flight-chess.free-timer.${game.id}`;
 const [timer,setTimer]=useState(()=>loadTimer(key));
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(timer));}catch{/* Timer still works this visit. */}},[timer,key]);
 const run=async(a:EngineAction)=>{if(lock.current)return;lock.current=true;setBusy(true);try{await onAction(a);}finally{lock.current=false;setBusy(false);}};
 const displayedTimer=online?.freeTimer??timer;
 const review=game.review,position=game.pending?.position??review?.position,tile=position===undefined?undefined:config.tiles[position];
 const text=game.pending?.text??(tile?applyTaskParameters(tile.text??'',config.rules.taskParameters).text:'');
 const duration=game.pending?.duration??(review?reviewDuration(text,review):undefined),clock=game.pending??review;
 const finish=game.phase==='review'&&config.rules.navigation==='manual'&&position===config.tiles.length-1;
 return <section className="fullscreen-game-controls" aria-label="全屏基础操作">
  <div className="fullscreen-game-bar"><b style={{color:config.players[game.turn].color}}>{config.players[game.turn].name} · {game.phase==='finished'?'本局结束':`第${game.players[game.turn].position}格`}</b>
   <button className="primary" disabled={rolling||busy||game.phase!=='ready'||!!online&&!online.allowed('ROLL')} onClick={()=>void roll()} aria-label="全屏掷骰子">{rolling?'掷骰中…':`掷骰子${game.lastMove?.dice?` · ${game.lastMove.dice}点`:''}`}</button>
   <button disabled={busy||rolling||!game.undo.length||!!online&&!online.allowed('UNDO')} onClick={()=>void run({type:'UNDO'})}>撤销</button>
   <button disabled={busy||rolling||!!online&&!online.allowed('SHUFFLE')} title="保留路线，按所选题库随机换题并重新开局" onClick={()=>void onShuffle()}>刷新地图 · 重开</button>
  </div>
  {game.phase==='move'&&<p>掷出{game.lastMove?.dice}点 · 点击地图落点，再确认移动。</p>}
  {(game.phase==='task'||game.phase==='review')&&<div className="fullscreen-current-task"><small>第{position}格 · {game.phase==='task'?'当前任务':'按原图确认'}</small><p>{text||'请对照原图局部，确认本格内容。'}</p>
   {clock&&<TaskCountTracker text={text} factor={game.pending?.taskFactor??1} progress={clock.taskCount} disabled={busy||!!online&&!online.allowed('TASK_COUNT')} onChange={countDelta=>void run({type:'TASK_COUNT',countDelta})}/>}
   {duration&&clock&&<TaskTimer duration={duration} endsAt={clock.timerEndsAt} pausedRemaining={clock.pausedRemaining} disabled={busy||!!online&&!online.allowed('SET_TIMER')} onSet={now=>void run({type:'SET_TIMER',now})} onPause={now=>void run({type:'SET_TIMER',now,timerMode:'pause'})}/>}
   {duration&&text.includes('〔')&&<small>计时来自原图可读时长，正文缺字仍需核对。</small>}
   {isOngoingText(text)&&<OngoingEffects compact deferCurrent currentText={text} effects={game.effects} counter={game.rounds} players={config.players} act={onAction}/>}
   {game.phase==='review'&&tile&&<small>{finish?'终点条件满足后再确认；未满足可重新选择落点。':`确认后：${ruleDescription(tile,review?.dice??game.lastMove?.dice)}`}</small>}
   <div className="fullscreen-task-actions">{config.rules.navigation==='manual'&&!finish&&<button disabled={busy||!!online&&!online.allowed('RESELECT_CELL')} onClick={()=>void run({type:'RESELECT_CELL'})}>重新选落点</button>}
    <button disabled={busy||!!online&&!online.allowed(game.phase==='task'?'RESOLVE_TASK':'RESOLVE_REVIEW')} onClick={()=>void run(game.phase==='task'?{type:'RESOLVE_TASK',result:'skip'}:{type:'RESOLVE_REVIEW',result:'skip'})}>{finish?'条件未满足':'跳过'}</button>
    <button className="primary" disabled={busy||!!online&&!online.allowed(game.phase==='task'?'RESOLVE_TASK':'RESOLVE_REVIEW')} onClick={()=>void run(game.phase==='task'?{type:'RESOLVE_TASK',result:'done'}:{type:'RESOLVE_REVIEW',result:'apply'})}>{game.phase==='task'?'完成任务':finish?'按原图确认结束':'确认并应用规则'}</button>
   </div>
  </div>}
  {game.phase==='choice'&&<div className="fullscreen-task-actions">{game.choice?.options.map((o,i)=><button key={i} disabled={busy||!!online&&!online.allowed('CHOOSE_ROUTE')} onClick={()=>void run({type:'CHOOSE_ROUTE',index:i})}>{o.label}</button>)}</div>}
  {game.phase==='finished'&&<p>{game.winner==='team'?'全队通关':`${config.players.find(p=>p.id===game.winner)?.name??'本局'}完成对局`} · 可以撤销或随机格子重开。</p>}
  <details className="fullscreen-free-timer"><summary>自定惩罚计时{online?' · 双端同步':''}</summary><TaskTimer duration={displayedTimer.duration} endsAt={displayedTimer.endsAt} pausedRemaining={displayedTimer.pausedRemaining} disabled={!!online&&!online.allowed('FREE_TIMER')} onSet={now=>online?online.timerAction?.(now===null?'reset':'start'):setTimer(now===null?{duration:timer.duration,endsAt:null}:{duration:timer.duration,endsAt:now+(timer.pausedRemaining??timer.duration*1000)})} onPause={now=>online?online.timerAction?.('pause'):setTimer({duration:timer.duration,endsAt:null,pausedRemaining:Math.max(0,(timer.endsAt??now)-now)})} onDuration={duration=>online?online.timerAction?.('duration',duration):setTimer({duration,endsAt:null})}/></details>
 </section>;
}
