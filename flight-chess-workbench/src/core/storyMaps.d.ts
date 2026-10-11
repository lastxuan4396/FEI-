import type {ArcadeSession} from './arcade';
export interface StoryNode {title:string;text?:string;options?:{label:string;to:string}[];task?:boolean;to?:string;ending?:string;chapter?:number;memento?:string}
export const LEGACY_STORY:Record<string,StoryNode>;
export function storyMap(config:Pick<ArcadeSession['config'],'story'>):Record<string,StoryNode>;
export function storyMemento(config:Pick<ArcadeSession['config'],'story'>,node:string):string|undefined;
export function storyDetourLimit(config:Pick<ArcadeSession['config'],'story'>):number;
export function storyEntry(config:Pick<ArcadeSession['config'],'story'>):string;
