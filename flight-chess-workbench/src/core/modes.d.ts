import type { CoreConfig } from './types';
export const MODES: { id: string; name: string; tag: string; description: string; detail: string; color: string }[];
export const EXTRA_DECKS: CoreConfig['decks'];
export function spiralPath(size: number): [number, number][];
export function createMode(id: string,options?:{levels?:number[];size?:number;shape?:'reference'|'snake'|'spiral'}): CoreConfig;

export const IMAGE_MODE_DECKS: CoreConfig['decks'];
export function needsImageModeUpdate(board:CoreConfig):boolean;

export const MAP_SIZES:number[];
export function mapSizeOptions(board:CoreConfig):{size:number;shape:'reference'|'snake'|'spiral'};
