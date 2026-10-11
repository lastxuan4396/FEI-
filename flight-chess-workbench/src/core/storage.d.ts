import type { CoreConfig, EngineState, CoreSave } from './types';
export const SAVE_KEY: string;
export const BACKUP_KEY: string;
export function makeSave(config: CoreConfig, state: EngineState): CoreSave;
export function parseSave(source: string): CoreSave;
export function createRepository(storage: Pick<Storage, 'getItem' | 'setItem'>): { load(): { payload: CoreSave | null; recovered: boolean; error: string | null }; save(config: CoreConfig, state: EngineState): CoreSave };
