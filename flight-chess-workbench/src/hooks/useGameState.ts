import {useBoardRoom,onlineId} from './useBoardRoom';
import { useEffect, useRef, useState } from 'react';
import type { Theme, Player, GameState } from '../types';
import type { CoreConfig, EngineAction, EngineState } from '../core/types';
import {needsImageModeUpdate,createMode,mapSizeOptions,MODES} from '../core/modes.js';
import { transition } from '../core/engine.js';
import { createTemplate } from '../core/config.js';
import { parseSave } from '../core/storage.js';
import {readTaskPreferences} from '../core/taskParameters.js';
import { createWorkspaceRepository, defaultWorkspace, parseWorkspace, startWorkspace, validateWorkspace, workspaceFromBoard, workspaceForMode, workspaceForTwoPlayers, workspaceForImageLevels, workspaceForMapSize, workspaceForTaskLibrary, workspaceForShuffledTasks, workspaceForImageMap, workspaceForPreparedBoard, WORKSPACE_KEY } from '../core/workspace.js';
import type {LibraryAction} from '../core/taskLibrary';
import type { Workspace } from '../core/workspace';

function getStorage(): { storage: Pick<Storage, 'getItem' | 'setItem'>; memory: boolean } {
  try { localStorage.getItem(WORKSPACE_KEY); return { storage: localStorage, memory: false }; }
  catch { const map = new Map<string, string>(); return { storage: { getItem: key => map.get(key) ?? null, setItem: (key, value) => { map.set(key, value); } }, memory: true }; }
}
const storageAccess = getStorage();
const repo = createWorkspaceRepository(storageAccess.storage);
const clone = <T,>(value: T): T => structuredClone(value);
const makeId = onlineId;
function withCurrentTaskParameters(workspace:Workspace):Workspace {
  // An imported board may carry its own parameters. Keep those until this
  // browser has explicitly saved shared settings; active saves never pass here.
  try { if(localStorage.getItem('flight-chess.task-parameters.v1')===null)return workspace; }
  catch { return workspace; }
  return {...workspace,baseBoard:{...workspace.baseBoard,rules:{...workspace.baseBoard.rules,taskParameters:readTaskPreferences()}}};
}

export function useGameState() {
  const online=useBoardRoom();
  const initial = useRef(repo.load());
  const [workspace, setWorkspace] = useState<Workspace>(() => initial.current.value ?? defaultWorkspace());
  const ref = useRef(workspace);
  const [notice, setNotice] = useState(initial.current.error ?? (initial.current.recovered ? '已恢复上一份可用备份' : ''));
  const [saveStatus, setSaveStatus] = useState(storageAccess.memory ? '仅本次有效，请导出保存' : initial.current.error ? '旧存档未覆盖' : '已自动保存');
  const adopt = (value: Workspace) => { ref.current = value; setWorkspace(value); };

  async function commit<T>(change: (current: Workspace) => { value: Workspace; result: T }): Promise<T | null> {
    const expected = ref.current.revision;
    const run = () => {
      const latest = repo.load().value;
      if (latest && latest.revision > expected) { adopt(latest); throw new Error('另一窗口更新了对局，已同步。请重新操作。'); }
      const { value, result } = change(clone(ref.current));
      value.revision = ref.current.revision + 1;
      const valid = validateWorkspace(value);
      adopt(valid);
      try { repo.save(valid); setSaveStatus(storageAccess.memory ? '仅本次有效，请导出保存' : '已自动保存'); }
      catch { setSaveStatus('保存失败，请导出当前对局'); setNotice('浏览器未能保存最新进度，可以导出当前对局保留。'); }
      return result;
    };
    try { return navigator.locks?.request ? await navigator.locks.request('flight-chess-workspace', run) : run(); }
    catch (error) { setNotice(error instanceof Error ? error.message : '操作失败'); return null; }
  }

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== WORKSPACE_KEY || !event.newValue) return;
      try {
        const next = parseWorkspace(event.newValue);
        if (next.revision <= ref.current.revision) return;
        adopt(next); setSaveStatus('已同步另一窗口'); setNotice('另一窗口更新了对局，已同步。');
      } catch { setNotice('另一窗口的存档无法读取，当前对局保持不变。'); }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const active = online.room ? (online.snapshot?{config:online.snapshot.config,state:online.snapshot.state}:null) : workspace.active;
  const shownPlayers: Player[] = active ? workspace.players.map((player, index) => ({ ...player, name: active.config.players[index]?.name ?? player.name, color: active.config.players[index]?.color ?? player.color, step: active.state.players[index]?.position ?? 0 })) : workspace.players;
  const board = active?.config ?? workspace.baseBoard;
  const state: GameState = {
    view: online.room ? 'game' : workspace.view, turn: active?.state.turn ?? 0, players: shownPlayers, themes: workspace.themes,
    boardMap: board.tiles.map(tile => tile.type === 'task' ? tile.target === 'other' ? 'lucky' : 'trap' : 'blank'),
    pathCoords: board.layout.path.map(([c, r]) => ({ c, r })), isRolling: false
  };

  const switchLocalView = (view: GameState['view']) => commit(current => ({ value: { ...current, view }, result: true }));
  const selectTheme = (playerId: number, themeId: string) => commit(current => ({ value: { ...current, players: current.players.map(player => player.id === playerId ? { ...player, themeId } : player) }, result: true }));
  const createTheme = (input: { name: string; desc?: string; audience: Theme['audience'] }) => {
    const id = `user_${makeId()}`;
    return commit(current => ({ value: { ...current, themes: [...current.themes, { id, name: input.name.trim(), desc: input.desc?.trim() ?? '', audience: input.audience, tasks: [] }] }, result: id }));
  };
  const updateThemeMeta = (id: string, patch: Partial<Pick<Theme, 'name' | 'desc' | 'audience'>>) => commit(current => ({ value: { ...current, themes: current.themes.map(theme => theme.id === id ? { ...theme, ...patch } : theme) }, result: true }));
  const addThemeTask = (id: string, text: string) => commit(current => {
    const task = text.trim();
    return { value: { ...current, themes: current.themes.map(theme => theme.id === id && task && !theme.tasks.includes(task) ? { ...theme, tasks: [...theme.tasks, task] } : theme) }, result: true };
  });
  const removeThemeTask = (id: string, index: number) => commit(current => ({ value: { ...current, themes: current.themes.map(theme => theme.id === id ? { ...theme, tasks: theme.tasks.filter((_, i) => i !== index) } : theme) }, result: true }));
  const importThemeTasks = (id: string, tasks: string[], mode: 'append' | 'replace') => commit(current => ({
    value: { ...current, themes: current.themes.map(theme => theme.id === id ? { ...theme, tasks: [...new Set([...(mode === 'append' ? theme.tasks : []), ...tasks.map(task => task.trim()).filter(Boolean)])] } : theme) }, result: true
  }));
  const startGame = () => commit(current => ({ value: current.active ? { ...current, view: 'game' } : startWorkspace(withCurrentTaskParameters(workspaceForTwoPlayers(needsImageModeUpdate(current.baseBoard)?workspaceForMode(current,current.baseBoard.id.slice(5)):current)), { id: makeId(), seed: crypto.getRandomValues(new Uint32Array(1))[0] || 1 }), result: true }));
  const resetGame = () => commit(current => ({ value: { ...current, active: null, view: 'home' }, result: true }));
  const dispatchLocalGame = (action: EngineAction): Promise<EngineState | null> => commit(current => {
    if (!current.active) throw new Error('当前没有对局');
    const game = transition(current.active.state, current.active.config, { ...action, expectedRevision: current.active.state.revision });
    return { value: { ...current, active: { ...current.active, state: game } }, result: game };
  });
  const importPreparedMap = (board: CoreConfig) => commit(current => ({value:workspaceForTwoPlayers(workspaceForPreparedBoard(current,board)),result:true}));
  const startPreparedMap = (board: CoreConfig, expectedWorkspaceRevision:number) => commit(current => {
    if(current.revision!==expectedWorkspaceRevision)throw Error('设置或对局已变化，请重新选择棋盘。');
    return {value:startWorkspace(withCurrentTaskParameters(workspaceForTwoPlayers(workspaceForPreparedBoard(current,board))),{id:makeId(),seed:crypto.getRandomValues(new Uint32Array(1))[0]||1}),result:true};
  });
  const importImageMap = (board: CoreConfig) => commit(current => ({value:workspaceForTwoPlayers(workspaceForImageMap(current,board)),result:true}));
  const editTaskLibrary=(action:LibraryAction)=>commit(current=>({value:workspaceForTaskLibrary(current,action),result:true}));
  const setImageLevels=(levels:number[])=>commit(current=>({value:workspaceForImageLevels(current,levels),result:true}));
  const selectMode = (id: string, options?: {size:number;shape:'reference'|'snake'|'spiral'}) => commit(current => ({ value: workspaceForTwoPlayers(workspaceForMode(current, id,options)), result: true }));
  const shuffleLocalMap=(options?:{size:number;shape:'reference'|'snake'|'spiral'})=>commit(current=>{const seed=crypto.getRandomValues(new Uint32Array(1))[0]||1;const next=workspaceForShuffledTasks(withCurrentTaskParameters(options?workspaceForMapSize(current,options.size,options.shape):current),seed);return {value:current.active?startWorkspace(next,{id:makeId(),seed}):next,result:true};});
  const setMapSize=(size:number,shape:'reference'|'snake'|'spiral')=>commit(current=>({value:workspaceForTwoPlayers(workspaceForMapSize(current,size,shape)),result:true}));
  const applySettings = (players: Player[], rules: CoreConfig['rules'], size: number, taskMode: Workspace['taskMode']) => commit(current => {
    const mode=MODES.find(m=>current.baseBoard.id===`mode-${m.id}`);
    const base = size === 0 ? current.baseBoard : mode?createMode(mode.id,{levels:current.imageLevels,size,shape:mapSizeOptions(current.baseBoard).shape}):createTemplate(size);
    const board = { ...base }; delete board.playerDecks;
    return { value: { ...current, view: 'home', active: null, players, taskMode, baseBoard: { ...board, rules:size?{...rules,navigation:undefined}:rules, players: players.map((player,i) => ({ id: `p${player.id}`, name: player.name, color: player.color,...(!size&&rules.navigation==='manual'?{start:base.players[i]?.start??0}:{}) })) } }, result: true };
  });
  const importData = (source: string) => commit(current => {
    let parsed: unknown;
    try { parsed = JSON.parse(source); } catch { throw new Error('JSON 格式不正确'); }
    let next: Workspace;
    if (parsed && typeof parsed === 'object' && 'format' in parsed && parsed.format === 'flight-chess-save') {
      const save = parseSave(source); next = workspaceFromBoard(save.config, current); next.active = { config: save.config, state: { ...save.state, id: makeId() } }; next.view = 'game';
    } else if (parsed && typeof parsed === 'object' && 'version' in parsed && parsed.version === 2) next = parseWorkspace(source);
    else next = workspaceFromBoard(parsed, current);
    return { value: next.active ? next : workspaceForTwoPlayers(next), result: true };
  });
  const createOnlineRoom=async()=>{const current=ref.current;const prepared=current.active??startWorkspace(withCurrentTaskParameters(workspaceForTwoPlayers(current)),{id:makeId(),seed:crypto.getRandomValues(new Uint32Array(1))[0]||1}).active!;return online.create(prepared.config,prepared.state);};
  const dispatchGame=async(action:EngineAction)=>online.room?(await online.send(action))?.state??null:dispatchLocalGame(action);
  const shuffleMap=async(options?:{size:number;shape:'reference'|'snake'|'spiral'})=>online.room?!!await online.send({type:'SHUFFLE'}):shuffleLocalMap(options);
  const switchView=(view:GameState['view'])=>online.room?Promise.resolve(null):switchLocalView(view);
  return {online,createOnlineRoom,state, workspace, active, saveStatus:online.room?online.status:saveStatus, notice:online.error||notice, dismissNotice: () => setNotice(''), importImageMap, importPreparedMap, startPreparedMap, setImageLevels, editTaskLibrary, switchView, selectTheme, createTheme, updateThemeMeta, addThemeTask, removeThemeTask, importThemeTasks, startGame, resetGame, dispatchGame, selectMode, setMapSize, shuffleMap, applySettings, importData };
}
