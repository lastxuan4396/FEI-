export function taskDuration(text:string):number|undefined;
export function legacyTaskDuration(text:string):number|undefined;
export function reviewDuration(text:string,review?:{timerEndsAt?:number|null;pausedRemaining?:number}):number|undefined;
export function durationLabel(seconds:number):string;

export function taskNumber(text:string):number;
