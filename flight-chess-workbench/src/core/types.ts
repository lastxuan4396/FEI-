import type {OngoingEffect,EffectAction} from './ongoingEffects.js';
export interface ImageRegion { x:number; y:number; width:number; height:number }
export interface ImageTileNote {text:string;reviewed:boolean;region:ImageRegion}
export interface ImageTextAlternative {text:string;confidence:number;source?:'whole'|'crop'|'comparison'|'manual'}
export interface ImageTextWord extends ImageRegion {text:string;confidence:number}
export interface ImageText extends ImageRegion {id:string;text:string;originalText?:string;graphic?:'up'|'down'|'left'|'right';confidence:number;reviewed:boolean;source?:'whole'|'crop'|'comparison'|'manual';alternatives?:ImageTextAlternative[];edited?:boolean;excluded?:boolean;words?:ImageTextWord[]}
export interface MapImage { displayRotation?:0|90|180|270; dataUrl:string; width:number; height:number; regions:ImageRegion[]; sourceDataUrl?:string; texts?:ImageText[] }
export type CoreTile = { type: 'start' | 'finish' | 'plain' | 'task' | 'move' | 'home' | 'extra' | 'skip' | 'double' | 'taskScale' | 'choice' | 'random'; factor?:0.5|2; color?: string; label?: string; text?: string; originalText?:string; notes?:ImageTileNote[]; readingRegion?:ImageRegion; playerTexts?: Record<string,string>; deck?: string; target?: 'self' | 'other' | 'both'; steps?: number; stepsFromDice?:boolean; duration?: number; options?: { label: string; steps: number }[] };
export interface CoreConfig {
  version: 1; id: string; title: string; description: string;
  layout: { columns: number; rows: number; path: [number, number][]; image?: MapImage; style?: 'cross' | 'hollow-spiral' | 'flowchart' | 'switchback' | 'dual-track' | 'winding' | 'paper-spiral' | 'grid-snake' | 'grid-spiral' | 'extended-reference' };
  rules: { launchOnSix: boolean; finish: 'bounce' | 'stop' | 'exact'; chainEffects: boolean; maxChain: number; maxRounds?:number;taskParameters?:Record<string,(number|null)[]>; goal?: 'race' | 'cooperative' | 'chase'; navigation?:'manual'; finishAllPlayers?:boolean };
  players: { id: string; name: string; color: string; start?:number }[];
  decks: Record<string, { name: string; cards: string[] }>;
  tiles: CoreTile[]; playerDecks?: Record<string, string>;
}
export interface EngineState {limitReached?:true;
  effectDraws?:number;effectDraft?:{cards:string[]};effects?:OngoingEffect[];
  version: 1; id: string; revision: number; seed: number; turn: number; phase: 'ready' | 'task' | 'choice' | 'review' | 'move' | 'finished'; winner: string | null;
  players: { id: string; position: number; launched: boolean; skips: number; multiplier: number; taskFactor?:0.5|2 }[];
  finishOrder?:string[];
  pending: { taskCount?:number;position: number; deck: string; card: number; text: string;original?:string; targets: string[]; duration?: number; timerEndsAt?: number | null; pausedRemaining?:number; taskFactor?:0.5|2 } | null;
  review?: {taskCount?:number;position:number;count:number;visited:number[];dice?:number;timerEndsAt?:number|null;pausedRemaining?:number} | null;
  choice?: { position: number; options: { label: string; steps: number }[] } | null;
  bags: Record<string, number[]>;
  lastMove: { playerId: string; from: number; to: number; dice: number; multiplier: number; path: number[] } | null;
  rounds: number; log: { revision: number; text: string }[]; undo: Omit<EngineState, 'undo'>[];
}
export type EngineAction = EffectAction | {type:'TASK_COUNT';countDelta:number;expectedRevision?:number} | {type:'MOVE_TO_CELL';position:number;expectedRevision?:number} | { type: 'ROLL' | 'UNDO' | 'RESELECT_CELL'; expectedRevision?: number } | { type: 'RESOLVE_TASK'; result: 'done' | 'skip'; expectedRevision?: number } | { type: 'RESOLVE_REVIEW'; result:'apply'|'skip'; expectedRevision?:number } | { type: 'CHOOSE_ROUTE'; index: number; expectedRevision?: number } | { type: 'SET_TIMER'; now: number | null; timerMode?:'pause'; expectedRevision?: number };
export interface CoreSave { format: 'flight-chess-save'; version: 1; savedAt: string; config: CoreConfig; state: EngineState }
