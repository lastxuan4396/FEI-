import type {CoreConfig,EngineState} from './types';
export interface SharedTimer {duration:number;endsAt:number|null;pausedRemaining?:number;owner?:number|null}
export interface BoardRoomSnapshot {code:string;actor:number;revision:number;config:CoreConfig;state:EngineState;lastActor:number|null;draftActor:number|null;freeTimer:SharedTimer;present:boolean[];serverNow:number}
export function boardActionAllowed(room:Pick<BoardRoomSnapshot,'config'|'state'|'lastActor'|'draftActor'|'freeTimer'>,actor:number,type:string,action?:Record<string,unknown>):boolean;
