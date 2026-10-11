import {taskParameters} from './taskParameters.js';
// A counter is only inferred for one definite quantity. Conditional, repeated,
// mixed and unresolved dice instructions continue to use their original text.
export function taskCountSpec(text,factor=1){
 if(typeof text!=='string'||!text.trim()||![0.5,1,2].includes(factor))return undefined;
 const {parts}=taskParameters(text);if(parts.length!==1)return undefined;
 const p=parts[0],amount=Math.ceil(p.value*factor);
 if(p.unit==='格'||/再[掷投扔]|(?:掷|摇|投|扔)骰|回到起点/.test(text)||p.kind!=='count'||p.diceFormula||!Number.isInteger(p.value)||!Number.isSafeInteger(amount)||amount<1||amount>9999||/如果|如若|否则|若.*(?:则|就)|每|分别|至少|至多|以上|以下|不少于|不超过/.test(text))return undefined;
 return {amount,unit:p.unit||'次'};
}
export function validTaskCount(task,text=task?.text,factor=1){
 if(task?.taskCount===undefined)return true;
 const spec=taskCountSpec(text,factor);return !!spec&&Number.isSafeInteger(task.taskCount)&&task.taskCount>=0&&task.taskCount<=spec.amount;
}
export function changeTaskCount(task,delta,text=task?.text,factor=1){
 const spec=taskCountSpec(text,factor);
 if(!spec||![-1,1].includes(delta)||!validTaskCount(task,text,factor))throw Error('当前任务没有可记录的明确次数');
 const next=(task.taskCount??0)+delta;if(next<0||next>spec.amount)throw Error('任务计次超出目标');task.taskCount=next;
}
