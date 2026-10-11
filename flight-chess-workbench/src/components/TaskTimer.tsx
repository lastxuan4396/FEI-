import {BoardOnlineContext} from './BoardOnlineContext';
import {useEffect,useState,useContext} from 'react';
import {durationLabel} from '../core/taskTiming.js';
export function TaskTimer({duration,endsAt,pausedRemaining,onSet,onPause,onDuration,disabled=false}:{duration:number;endsAt?:number|null;pausedRemaining?:number;onSet:(now:number|null)=>void;onPause?:(now:number)=>void;onDuration?:(seconds:number)=>void;disabled?:boolean}){
 const online=useContext(BoardOnlineContext);
 const [now,setNow]=useState(Date.now),[draft,setDraft]=useState(duration);
 useEffect(()=>setDraft(duration),[duration]);
 useEffect(()=>{setNow(Date.now());if(endsAt==null)return;const id=window.setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(id);},[endsAt]);
 const running=endsAt!=null,paused=pausedRemaining!==undefined;
 const remaining=Math.max(0,Math.ceil((running?endsAt-now-(online?.serverOffset??0):pausedRemaining??duration*1000)/1000));
 const hours=Math.floor(remaining/3600),minutes=Math.floor(remaining%3600/60),seconds=remaining%60;
 const clock=hours?`${hours}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`:`${minutes}:${String(seconds).padStart(2,'0')}`;
 const expired=(running||paused)&&remaining===0;
 return <div className={`task-timer ${expired?'timer-expired':paused?'timer-paused':running?'timer-running':''}`} data-timer-duration={duration}>
  <div className="task-timer-heading"><span className="task-timer-clock" role="timer" aria-label="任务剩余时间" aria-live="off">{clock}</span><div className="task-timer-info"><b>任务时长 · {durationLabel(duration)}</b><p role="status" aria-live="polite">{expired?'时间到了 · 请确认完成或跳过':paused?'已暂停 · 剩余时间已保存':running?'正在计时 · 刷新后继续':'准备好后，点开始计时'}</p></div></div>
  <div className="task-timer-buttons">{(!running||expired)&&<button disabled={disabled||paused&&expired} onClick={()=>onSet(Date.now())}>{paused?'继续计时':expired?'重新计时':'开始计时'}</button>}{running&&!expired&&onPause&&<button disabled={disabled} onClick={()=>onPause(Date.now())}>暂停计时</button>}{(running||paused)&&<button disabled={disabled} onClick={()=>onSet(null)}>重置计时</button>}</div>
  {onDuration&&<details className="timer-duration-edit"><summary>调整任务时长</summary><label>秒数<input aria-label="计时秒数" type="number" min={1} max={86400} value={draft} onChange={ev=>setDraft(Number(ev.target.value))}/></label><button disabled={disabled||!Number.isInteger(draft)||draft<1||draft>86400} onClick={()=>onDuration(draft)}>应用时长</button><small>修改后计时归零，任务原文保留。</small></details>}
 </div>;
}
