import type {CoreConfig, CoreTile, ImageRegion, MapImage} from './types';
export function detectCells(rgba: Uint8ClampedArray, width:number, height:number, threshold?:number):ImageRegion[];
export function buildImageBoard(title:string,image:Omit<MapImage,'regions'>,regions:ImageRegion[],overrides?:Record<number,CoreTile>,options?:{navigation?:'manual';startingPositions?:number[];finishAllPlayers?:boolean}):CoreConfig;

export function pointRegion(x:number,y:number,image:{width:number;height:number}):ImageRegion;
export function parseImageRouteJSON(source:string):{displayRotation?:0|90|180|270;width:number;height:number;title:string;regions:ImageRegion[];tiles:CoreTile[];navigation?:'manual';startingPositions?:number[];finishAllPlayers?:boolean};
