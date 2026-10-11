import {taskCountSpec} from '../core/taskCount.js';
export function TaskCountTracker({text,progress=0,factor=1,disabled=false,onChange}:{text:string;progress?:number;factor?:number;disabled?:boolean;onChange:(delta:number)=>void}){
 const spec=taskCountSpec(text,factor);if(!spec)return null;
 return <section className="task-count-tracker effect-count-tracker" aria-label="当前任务计次">
  <b>任务进度 · {spec.amount} {spec.unit}</b><progress aria-label="任务完成比例" value={progress} max={spec.amount}/>
  <div><button aria-label="任务减少一次" disabled={disabled||progress<=0} onClick={()=>onChange(-1)}>−1 {spec.unit}</button><strong aria-live="polite">{progress} / {spec.amount} {spec.unit}</strong><button aria-label="任务记录一次" disabled={disabled||progress>=spec.amount} onClick={()=>onChange(1)}>+1 {spec.unit}</button></div>
  <small>{progress>=spec.amount?'目标次数已记录，请确认完成或跳过。':'记录次数会自动保存；完成或跳过仍由你们确认。'}</small>
 </section>;
}
