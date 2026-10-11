import type {ArcadeSession} from './arcade.js';
export const ESTATE_MAP_SIZES:(12|20|28)[];
export const ORIGINAL_LOTS:string[];
export interface EstateMap {size:number;side:number;tiles:{name:string;kind:'start'|'property'|'penalty'|'reward'|'contract'}[];groups:{name:string;color:string;lots:number[]}[];positions:number[][]}
export function estateMap(config?:Pick<ArcadeSession['config'],'estate'>):EstateMap;
