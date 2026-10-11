import type {Workspace} from './workspace';
export interface TaskLibrary {edits:Record<string,{text:string|null;level?:number;original?:string}>;additions:{id:string;text:string;level:number;deleted?:boolean}[];selectedIds:string[];mode:'random'|'selected';reviewedOnly:boolean}
export interface LibraryRow {id:string;original:string;text:string;level:number;deleted:boolean;edited:boolean;reviewed:boolean;archived?:boolean;image?:number;cell?:string|number}
export type LibraryAction={type:'edit'|'add';id:string;text:string;level:number}|{type:'delete'|'restore';id:string}|{type:'select';ids:string[];mode?:'random'|'selected'}|{type:'mode';mode:'random'|'selected'}|{type:'reviewedOnly';value:boolean};
export function taskKey(text:string):string;
export function validateTaskLibrary(input?:unknown):TaskLibrary;
export function taskLibrarySettings(workspace:Workspace):TaskLibrary;
export function taskLibraryRows(workspace:Workspace):LibraryRow[];
export function selectedTaskRows(workspace:Workspace):LibraryRow[];
export function changeTaskLibrary(workspace:Workspace,action:LibraryAction):Workspace;
