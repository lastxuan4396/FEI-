import type {ImageText,ImageRegion,CoreTile} from './types';
export function validateImageTexts(input:unknown):ImageText[]|undefined;
export function textForRegion(texts:ImageText[]|undefined,region:ImageRegion):ImageText[];
export function proposeRule(source:string):{tile:CoreTile;reason:string}|null;
export function numberedRoute(boxes:(ImageRegion&{id:string})[],texts:ImageText[]):{route:string[];numbers:number[];duplicates:number[];missing:number[];unassigned:number};

export function mergeImageTexts(old:ImageText[],next:ImageText[]):ImageText[];
export function chooseImageReading(line:ImageText,text:string):ImageText;

export function overlappingReadings(lines:ImageText[]):boolean;

export function crossingReadings(texts:ImageText[],regions:ImageRegion[]):ImageText[];

export function splitCrossingReadings(texts:ImageText[],regions:ImageRegion[]):{lines:ImageText[];split:number};

export function replaceRegionReadings(old:ImageText[],next:ImageText[],regions:ImageRegion[]):ImageText[];
