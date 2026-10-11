import type { CoreConfig, EngineState } from './types';
import type { Player, Theme } from '../types';
import type {TaskLibrary,LibraryAction} from './taskLibrary';
export interface Workspace { version: 2; revision: number; imageLevels?:number[]; taskLibrary?:TaskLibrary; taskMode: 'player' | 'tile'; view: 'home' | 'game' | 'themes'; baseBoard: CoreConfig; players: Player[]; themes: Theme[]; active: { config: CoreConfig; state: EngineState } | null }
export const WORKSPACE_KEY: string;
export const WORKSPACE_BACKUP_KEY: string;
export function defaultWorkspace(): Workspace;
export function validateWorkspace(value: unknown): Workspace;
export function parseWorkspace(source: string): Workspace;
export function buildConfig(workspace: Workspace): CoreConfig;
export function startWorkspace(workspace: Workspace, options?: { seed?: number; id?: string }): Workspace;
export function workspaceFromBoard(input: unknown, previous?: Workspace | null): Workspace;
export function createWorkspaceRepository(storage: Pick<Storage, 'getItem' | 'setItem'>): { load(): { value: Workspace | null; recovered: boolean; error: string | null }; save(value: Workspace): Workspace };

export function workspaceForMode(current: Workspace, id: string,options?:{size?:number;shape?:'reference'|'snake'|'spiral'}): Workspace;

export function workspaceForImageMap(current:Workspace,input:CoreConfig):Workspace;

export function workspaceForPreparedBoard(current:Workspace,input:CoreConfig):Workspace;

export function workspaceForImageLevels(current:Workspace,levels:number[]):Workspace;

export function workspaceForTwoPlayers(workspace: Workspace): Workspace;

export function workspaceForMapSize(current:Workspace,size:number,shape?:'reference'|'snake'|'spiral'):Workspace;
export function workspaceForTaskLibrary(current:Workspace,action:LibraryAction):Workspace;
export function workspaceForShuffledTasks(current:Workspace,seed?:number):Workspace;
