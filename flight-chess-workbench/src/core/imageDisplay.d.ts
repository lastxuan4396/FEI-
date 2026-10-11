import type {ImageRegion} from './types';
export function imageDisplay(image:{width:number;height:number;displayRotation?:0|90|180|270},region?:ImageRegion):{width:number;height:number;transform?:string;crop?:ImageRegion};
export function imageTaskOverlay(image:{width:number;height:number;displayRotation?:0|90|180|270},region:ImageRegion):{x:number;y:number;width:number;height:number;transform?:string};
