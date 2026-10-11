import type {EffectAction,OngoingEffect,EffectDraft} from './ongoingEffects.js';
export type AdventureVariant='rps'|'limited'|'ecard'|'numbers'|'charge'|'preference'|'spire';
export interface AdventureSettings {enemyTasks?:'on-hit'|'always'|'off';rounds:number;floors:number;difficulty:number;hp:number;enemyPatterns?:'varied'|'classic'}
export interface AdventureConfig {poolSize?:number;directPool?:string[];poolName?:string;sourceTexts?:Record<string,string>;parameters?:Record<string,(number|null)[]>;variant:AdventureVariant;players:string[];pool:string[];settings?:Partial<AdventureSettings>;seed?:number}
export interface Mission {taskCount?:number;original?:string;id:string;text:string;duration:number;explicit:boolean;endsAt:number|null;pausedRemaining?:number}
export interface Secret {choice?:string;index?:number;task?:Mission;favorite?:number;guess?:number}
export interface BattleCard {id:string;name:string;cost:number;attack:number;block:number;heal:number;draw:number;desc:string;mark?:number;weaken?:number;riposte?:number}
export interface Enemy {name:string;hp:number;maxHp:number;armor:number;baseArmor?:number;archetype?:string;trait?:string;elite:boolean;intent:{type:string;amount:number;hits?:number;heal?:number}}
export interface Battle {assault?:{remaining:(Mission & {actor:number;guardGain:number})[];completed:number;total:number};power?:number;riposte?:number;marked?:number;weakened?:number;hp:number;maxHp:number;block:number;floor:number;deck:string[][];draw:string[][];discard:string[][];enemy:Enemy|null;round:number;rewards:string[];rewardActor:number;path:string[];checkpoint:{hp:number;floor:number;path:string[]}|null}
export interface Adventure {format:'paired-adventure';version:1;config:AdventureConfig&{settings:AdventureSettings};revision:number;epoch:number;seed?:number;phase:'choose'|'reveal'|'finished'|'map'|'battle'|'reward'|'defeat';round:number;match:number;score:number[];energy:number[];hands:string[][];costs:Mission[][];secret:(Secret|null)[];ready:boolean[];options:string[];penalties:(Mission|null)[];bag?:number[];effects:OngoingEffect[];effectTurns:number;effectDraws?:number;effectDraft?:EffectDraft;turn:number;result:string;log:string[];ecardContinue?:boolean;battle?:Battle;pending?:Mission&{actor:number;index:number;card:string;kind?:'npc';targetActor?:number;guardGain?:number}}
export type AdventureAction=EffectAction|{type:string;countDelta?:number;epoch?:number;taskId?:string;index?:number;favorite?:number;guess?:number;done?:boolean;path?:string;now?:number|null;timerMode?:'pause'};
export const VERSIONS:{id:AdventureVariant;name:string;kind:string;rules:string}[];
export const BATTLE_CARDS:BattleCard[];
export function createAdventure(config:AdventureConfig):Adventure;
export function adventureTransition(s:Adventure,a:AdventureAction,actor:number):Adventure;
export function adventureView(s:Adventure,actor:number):Adventure;
export function cardName(id:string):string;
export function movesFor(s:Adventure,actor:number):string[];
