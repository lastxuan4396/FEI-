import type {ArcadeSession} from './arcade.js';
export type CreativeKind='spinner'|'cards'|'coop'|'story'|'bingo'|'vote'|'mystery';
export type CreativeState=
 {kind:'spinner';plan:'steady'|'risk'|'choice';tickets:number[];streaks:number[];candidates:string[]}|
 {kind:'cards';recycles:number[];streaks:number[]}|
 {kind:'coop';plan:'together'|'lead'|'relay';leader:number;step:number;relayActive:boolean;help:number}|
 {kind:'story';detours:string[];mementos:string[];journal:string[]}|
 {kind:'bingo';redraws:number[];jokerUsed:boolean[];goalLines:number}|
 {kind:'vote';ballots:number[];claimed:boolean;volunteer:number|null;agreements:number}|
 {kind:'mystery';hintCredits:number;levels:number[];earned:boolean[];tip:string};
export interface CreativeTask {kind:CreativeKind;style:'steady'|'risk'|'choice'|'together'|'lead'|'relay'|'detour'|'journey'|'hint';actors:number[];step?:number;stage?:number}
export const BINGO_LINES:number[][];
export const MEMENTOS:Record<string,string>;
export const CREATIVE_RULES:Record<CreativeKind,string>;
export function initialCreative(kind:CreativeKind,puzzleCount?:number,goalLines?:number):CreativeState;
export function lineCount(done:boolean[]):number;
export function creativeTaskEffect(session:ArcadeSession):string;
