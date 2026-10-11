import type {Workspace} from './workspace';
export function gameTaskPool(workspace:Workspace,choice?:string,parameters?:Record<string,(number|null)[]>):{pool:string[];sourceTexts:Record<string,string>;name:string};
