export interface TaskParameter {token:string;start:number;end:number;kind:'time'|'turn'|'count';unit:string;value:number|null;diceFormula?:import('./diceFormula.js').DiceFormula}
export type TaskPreferences=Record<string,(number|null)[]>;
export const TASK_COUNT_UNITS:string[];
export function taskParameters(text:string):{key:string;template:string;parts:TaskParameter[]};
export function taskParameterAliases(text:string):{key:string;total:number;slots:number[]}[];
export function taskParameterValues(text:string,preferences?:TaskPreferences):(number|null)[]|undefined;
export function taskParameterGroups(texts:readonly string[]):{key:string;template:string;parts:TaskParameter[];originals:string[]}[];
export function taskParameterDetails(group:{parts:TaskParameter[];originals:string[]}):{label:string;units:string[];tokens:string[];mixedUnits:boolean}[];
export function taskParameterMatches(group:{parts:TaskParameter[];originals?:string[]},type:string):boolean;
export function applyTaskParameters(text:string,preferences?:TaskPreferences):{text:string;original:string;duration?:number};
export function readTaskPreferences():TaskPreferences;
export function validateTaskPreferences(value:unknown):TaskPreferences;
