import type {ArcadeSession,ArcadeAction} from './arcade.js';
export interface ArcadeRoomContext {draftActor?:number|null;lastActor?:number|null;submitted?:boolean[];coopRequest?:{from:number;to:number}|null}
export interface ArcadeRoomSnapshot extends ArcadeRoomContext {code:string;actor:number;session:ArcadeSession;revision:number;serverNow:number;urls:string[];inviteToken?:string;presence:{joined:boolean[];online:boolean[]};submitted:boolean[];ownBallot:number|null;draftActor:number|null;lastActor:number|null;coopRequest:{from:number;to:number}|null}
export function arcadeActionAllowed(session:ArcadeSession,actor:number,type:string,action?:ArcadeAction|Record<string,unknown>,context?:ArcadeRoomContext):boolean;
export function arcadeRoomView(session:ArcadeSession,actor:number,context?:ArcadeRoomContext):ArcadeSession;
