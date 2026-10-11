import type {Adventure,AdventureAction} from './adventure.js';
export interface RoomReply {state:Adventure;actor:number;code?:string;token?:string;inviteToken?:string;urls?:string[];presence?:{joined:boolean[];online:boolean[]};error?:string}
export class RoomAPIError extends Error {status:number;constructor(message:string,status?:number)}
export function roomOperationId():string;
export function roomRequest(path:string,options?:RequestInit,fetcher?:typeof fetch):Promise<RoomReply>;
export interface RoomTransport {hasPending():boolean;send(action:AdventureAction):Promise<RoomReply>;flush():Promise<RoomReply|null>;read():Promise<RoomReply>}
export function createRoomTransport(connection:{code:string;token:string},options?:{storage?:Storage;fetcher?:typeof fetch;id?:()=>string}):RoomTransport;
