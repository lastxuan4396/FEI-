import type { CoreConfig, EngineState, EngineAction } from './types';
export function createGame(config: CoreConfig, options?: { seed?: number; id?: string }): EngineState;
export function transition(input: EngineState, config: CoreConfig, action: EngineAction, dice?: number): EngineState;
export function movement(position: number, steps: number, finish: number, mode?: string): { position: number; path: number[] };
export function validateState(state: unknown, config: CoreConfig, withUndo?: boolean): EngineState;
