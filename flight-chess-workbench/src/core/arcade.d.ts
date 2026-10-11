import type {BingoRules} from './bingo.js';
import type {OngoingEffect,EffectSpec} from './ongoingEffects.js';
import type {CreativeState,CreativeTask} from './arcadeCreative.js';
import type {EstateAuction} from './vendor/monopolyAuction.js';
export type ArcadeKind='spinner'|'cards'|'coop'|'story'|'bingo'|'vote'|'mystery'|'estate';
export interface Puzzle {label:string;x:number;y:number;clue:string;answer:string}
export interface StoryRules {chapters:number;detours:number}
export interface EstateRules {taskMode:'linked'|'events'|'off';target:number;rounds:number;mapSize?:12|20|28}
export interface EstateState {contract?:{tasks:string[];selected:number}|null;mortgaged?:boolean[];auction:EstateAuction|null;boundTasks:(string|null)[];passes:number[];redraws:number[];bankrupt:boolean[];rent:{lot:number;owner:number;amount:number;tried:boolean}|null;reward:{type:'cash'|'pass'|'redraw';cash:number}|null}
export type EstateTask={kind:'rent'}|{kind:'penalty';fine:10}|{kind:'event';reward:'cash'|'pass'|'redraw';cash:number;risk?:true;partner?:number};
export interface ArcadePlayerState {score:number;cash:number;position:number;boost:number;shield:boolean;hand:{type:'mission'|'boost'|'shield'|'swap';text:string}[];bingo:string[];done:boolean[]}
export interface ArcadeState {effectDraws?:number;effectDraft?:{cards:string[]};effects?:OngoingEffect[];effectTurns?:number;revision:number;seed:number;turn:number;creative?:CreativeState;phase:'pick'|'ready'|'rent'|'reward'|'contract'|'auction'|'task'|'choice'|'ballot'|'reveal'|'offer'|'trade'|'finished';moves:number;players:ArcadePlayerState[];bag:number[];pending:{taskCount?:number;original?:string;text:string;points:number;duration:number;endsAt:number|null;pausedRemaining?:number;category?:string;card?:number;cell?:number;next?:string;edited?:boolean;source?:{image:number;cell:string;reviewed?:boolean};estate?:EstateTask;creative?:CreativeTask}|null;estate?:EstateState;sector:number;stage:number;node:string;storySave:string;trust:number;votes:number[];voter:number;round:number;question:string;owners:number[];levels:number[];trade:{seller:number;buyer:number;lot:number;price:number}|null;dice:number;hints:number;winners:number[];ending:string;message:string;log:string[];undo:Omit<ArcadeState,'undo'>[]}
export interface ArcadeSession {format:'interactive-game-save';version:1;config:{story?:StoryRules;bingo?:BingoRules;poolName?:string;sourceTexts?:Record<string,string>;rounds?:number;kind:ArcadeKind;library?:'image'|'recommended'|'custom';players:{name:string;color:string}[];pool:string[];customPool:boolean;puzzles:Puzzle[];scene?:string;estate?:EstateRules;creative?:true};state:ArcadeState}
export interface ArcadeAction {countDelta?:number;effect?:EffectSpec;effectId?:string;targets?:string[];type:string;method?:'pay'|'task'|'pass'|'cash'|'redraw'|'coop'|'risk'|'skip'|'steady'|'choice'|'together'|'lead'|'relay';partnerAccepted?:boolean;index?:number;target?:number;answer?:string;done?:boolean;yes?:boolean;lot?:number;price?:number;text?:string;duration?:number;now?:number|null;timerMode?:'pause';expectedRevision?:number}
export const ARCADE_MODES:{id:ArcadeKind;name:string;icon:string;tag:string;desc:string;rules:string}[];
export const SECTORS:string[];export const LOTS:string[];export const DEFAULT_PUZZLES:Puzzle[];
export const STORY:Record<string,{title:string;text?:string;options?:{label:string;to:string}[];task?:boolean;to?:string;ending?:string}>;
export function createArcade(kind:ArcadeKind,players:{name:string;color:string}[],options?:{story?:StoryRules;bingo?:BingoRules;poolName?:string;sourceTexts?:Record<string,string>;rounds?:number;library?:'image'|'recommended';pool?:string[];seed?:number;puzzles?:Puzzle[];scene?:string;estate?:EstateRules;creative?:boolean}):ArcadeSession;
export function arcadeTransition(input:ArcadeSession,action:ArcadeAction):ArcadeSession;
export function validateArcade(input:unknown):ArcadeSession;export function parseArcade(source:string):ArcadeSession;
export function price(index:number):number;export function wealth(state:ArcadeState,index:number):number;
