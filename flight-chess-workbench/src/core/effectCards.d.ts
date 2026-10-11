export interface EffectCard {id:string;title:string;description:string;unit:'turn'|'round'|'seconds'|'game';amount:number;kind:string;mode:'automatic'|'agreement';tag:string;rule?:string}
export const EFFECT_GAME_NAMES:Record<string,string>;
export const EFFECT_CARDS:EffectCard[];
export const SPIRE_EFFECT_CARDS:EffectCard[];
export const ALL_EFFECT_CARDS:EffectCard[];
export function effectCard(id:string):EffectCard|undefined;
export function effectCardText(card:EffectCard):string;
export function availableEffectCards(kind?:string,creative?:boolean,estate?:boolean):EffectCard[];
export function canUseEffectCard(card:EffectCard|undefined,kind?:string,creative?:boolean,estate?:boolean):boolean;
