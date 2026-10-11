export interface OngoingEffect {dice?:import('./diceFormula.js').DiceFormula & {value:number};original?:string;id:string;cardId?:string;lastUsedCounter?:number;lastUsedStage?:number;text:string;targets:string[];progress?:number;countUnit?:string;unit:'turn'|'round'|'seconds'|'game'|'count';amount:number;startedCounter:number;endsAt:number|null;pausedRemaining?:number;deferCurrent?:true}
export interface EffectSpec {diceFormula?:import('./diceFormula.js').DiceFormula;countUnit?:string;original?:string;cardId?:string;text?:string;targets:string[];unit?:OngoingEffect['unit'];amount?:number;randomTurns?:boolean;deferCurrent?:boolean}
export interface EffectAction {expectedRevision?:number;type:'EFFECT_ADD'|'EFFECT_END'|'EFFECT_TIMER'|'EFFECT_DRAW'|'EFFECT_CHOOSE'|'EFFECT_DISMISS'|'EFFECT_COUNT';countDelta?:number;index?:number;targets?:string[];effect?:EffectSpec;effectId?:string;now?:number|null;timerMode?:'pause'}
export function directTaskEligible(text:string):boolean;
export function isOngoingText(text:string):boolean;
export function validateEffects(effects:OngoingEffect[]|undefined,ids:string[],counter:number,context?:{kind?:string;creative?:boolean;estate?:boolean;puzzleCount?:number}):void;
export function effectRemaining(effect:OngoingEffect,counter:number,playerCount:number,now:number,finished?:boolean):number;
export function applyEffectAction(state:unknown,action:unknown,ids:string[],counter:number,rand:(n:number)=>number,context?:{kind?:string;creative?:boolean;estate?:boolean;puzzleCount?:number}):boolean;
export function completedEffectTurn(before:unknown,after:unknown,action:unknown,kind:string):boolean;

export interface EffectDraft {cards:string[]}
export function validateEffectDeck(state:unknown,context?:{kind?:string;creative?:boolean;estate?:boolean;counter?:number}):void;

export function ongoingTaskSpec(text:string):{unit:OngoingEffect['unit'];amount:number;randomTurns?:boolean;countUnit?:string;diceFormula?:import('./diceFormula.js').DiceFormula};
export type DirectTaskType='all'|'time'|'count'|'lasting';
export function directTaskChoices(pool:readonly string[],options:{preferences?:import('./taskParameters.js').TaskPreferences;originals?:Record<string,string>;effects?:OngoingEffect[];targets:string[];counter:number;playerCount:number;now:number;finished?:boolean;type?:DirectTaskType}):EffectSpec[];
