export function taskCountSpec(text:string,factor?:number):{amount:number;unit:string}|undefined;
export function validTaskCount(task:{taskCount?:number;text?:string}|undefined|null,text?:string,factor?:number):boolean;
export function changeTaskCount(task:{taskCount?:number;text?:string},delta:number,text?:string,factor?:number):void;
