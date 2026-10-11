import type {ImageRegion} from './types';
export function validateRecognitionArea(area?:ImageRegion):ImageRegion|undefined;
export function pixelWindow(width:number,height:number,area?:ImageRegion):ImageRegion&{area:ImageRegion};
export function remapScopedRegions<T extends ImageRegion>(regions:T[],area?:ImageRegion):T[];
export function insideRecognitionArea(region:ImageRegion,area?:ImageRegion):boolean;
