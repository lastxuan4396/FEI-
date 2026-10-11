import type {ArcadeSession} from './arcade.js';
export const ESTATE_GROUPS:{name:string;color:string;lots:number[]}[];
export function estateGroup(lot:number,config?:ArcadeSession['config']):{name:string;color:string;lots:number[]}|undefined;
export function estateRent(session:ArcadeSession,lot:number):number;
export function buildReason(session:ArcadeSession,lot:number):string;
export function estatePublicDescription(config:ArcadeSession['config'],lot:number):string;
export function tradeReason(session:ArcadeSession,lot:number,buyer:number,offer:number):string;
export function estateTaskEffect(session:ArcadeSession):string;
