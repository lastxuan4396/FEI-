import type { CoreConfig, CoreTile } from './types';
export function validateConfig(input: unknown): CoreConfig;
export function parseConfigJSON(source: string): CoreConfig;
export function createTemplate(size?: number): CoreConfig;
export function snakePath(columns: number, rows: number): [number, number][];
export function tileLabel(tile: CoreTile, config: CoreConfig): string;
