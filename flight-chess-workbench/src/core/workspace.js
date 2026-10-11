import {refreshUntouchedImageThemes} from './imageThemeDefaults.js';
import {imageTaskLevel,validateImageLevels} from './imageLevels.js';
import { validateConfig } from './config.js';
import { createMode,IMAGE_MODE_DECKS,MODES,mapSizeOptions } from './modes.js';
import {fillOwnBoardTasks} from './boardTasks.js';
import {taskDuration} from './taskTiming.js';
import {validateTaskLibrary,selectedTaskRows,changeTaskLibrary} from './taskLibrary.js';
import { createGame, validateState } from './engine.js';
export const WORKSPACE_KEY = 'flight-chess.workspace.v2';
export const WORKSPACE_BACKUP_KEY = 'flight-chess.workspace-backup.v2';
const clone = value => structuredClone(value);
const ensure = (condition, message) => { if (!condition) throw new Error(message); };


export function defaultWorkspace() {
  const baseBoard = createMode('classic');
  return {
    version: 2, revision: 0, view: 'home', taskMode: 'tile', imageLevels:[1,2,3], baseBoard,
    players: baseBoard.players.map((player, index) => ({ id: index, name: player.name, color: player.color, role: index % 2 ? 'female' : 'male', step: 0, themeId: Object.keys(baseBoard.decks)[index%Object.keys(baseBoard.decks).length] })),
    themes: Object.entries(baseBoard.decks).map(([id, deck]) => ({ id, name: deck.name, desc: '混合你发过的27张图片内容，原文保留；自动识别内容仍需核对', audience: 'common', tasks: [...deck.cards] })),
    active: null
  };
}

export function validateWorkspace(value) {
  ensure(value && value.version === 2, '工作区存档版本不正确');
  ensure(Number.isSafeInteger(value.revision) && value.revision >= 0, '工作区修订号不正确');
  ensure(['home', 'themes', 'game'].includes(value.view), '工作区页面不正确');
  const taskMode = value.taskMode ?? 'player';
  const imageLevels=value.imageLevels===undefined?undefined:validateImageLevels(value.imageLevels);
  const taskLibrary=value.taskLibrary===undefined?undefined:validateTaskLibrary(value.taskLibrary);
  ensure(['player', 'tile'].includes(taskMode), '任务抽取方式不正确');
  const baseBoard = validateConfig(value.baseBoard);
  ensure(Array.isArray(value.themes) && value.themes.length > 0 && value.themes.length <= 20, '须保留 1–20 套任务库');
  const ids = new Set(); let total = 0;
  for (const theme of value.themes) {
    ensure(theme && typeof theme.id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(theme.id) && !ids.has(theme.id), '任务库 ID 不正确'); ids.add(theme.id);
    ensure(typeof theme.name === 'string' && theme.name.trim().length > 0 && theme.name.length <= 40 && typeof theme.desc === 'string' && theme.desc.length <= 300, '任务库名称或描述不正确');
    ensure(['common', 'male', 'female'].includes(theme.audience), '任务库适用对象不正确');
    ensure(Array.isArray(theme.tasks) && theme.tasks.every(task => typeof task === 'string' && task.trim().length > 0 && task.length <= 1000), '任务内容不正确');
    total += theme.tasks.length;
  }
  ensure(total <= 5000, '最多支持 5000 条任务');
  ensure(Array.isArray(value.players) && value.players.length === baseBoard.players.length, '玩家数量与棋盘不一致');
  value.players.forEach((player, index) => {
    ensure(player && player.id === index && typeof player.name === 'string' && player.name.trim().length > 0 && player.name.length <= 24 && /^#[0-9a-fA-F]{6}$/.test(player.color), '玩家信息不正确');
    ensure(['male', 'female'].includes(player.role) && (player.themeId === null || ids.has(player.themeId)), '玩家题库设置不正确');
  });
  let active = null;
  if (value.active !== null) {
    const config = validateConfig(value.active?.config);
    ensure(config.players.length === value.players.length, '对局与设置玩家数量不一致');
    const state = validateState(value.active?.state, config);
    active = { config, state };
  }
  ensure(value.view !== 'game' || active, '游戏页缺少对局');
  return { version: 2, revision: value.revision, view: value.view, taskMode,...(imageLevels?{imageLevels}:{}),...(taskLibrary?{taskLibrary}:{}), baseBoard, players: clone(value.players), themes: clone(value.themes), active };
}

export function parseWorkspace(source) {
  ensure(typeof source === 'string' && source.length <= 3_000_000, '工作区文件过大');
  let value;
  try { value = JSON.parse(source); } catch { throw new Error('工作区 JSON 不正确'); }
  return validateWorkspace(value);
}


function boardPlayers(players,board){return players.map((p,i)=>({id:`p${p.id}`,name:p.name,color:p.color,...(board.rules.navigation==='manual'?{start:board.players[i]?.start??0}:{})}));}
function importedPlayers(current,board){
 if(board.rules.navigation!=='manual')return clone(current.players);
 return board.players.map((p,i)=>current.players[i]?clone(current.players[i]):{id:i,name:p.name,color:p.color,role:i%2?'female':'male',step:0,themeId:current.themes.find(t=>t.audience==='common')?.id??null});
}

// New UI games use two participants. Existing active saves are never truncated.
export function workspaceForTwoPlayers(workspace) {
  ensure(!workspace.active, '请先结束当前局再设置双人游戏');
  const next = clone(workspace);
  next.players = next.players.slice(0, 2);
  next.baseBoard.players = next.baseBoard.players.slice(0, 2);
  if (next.baseBoard.playerDecks) {
    const ids = new Set(next.baseBoard.players.map(player => player.id));
    next.baseBoard.playerDecks = Object.fromEntries(Object.entries(next.baseBoard.playerDecks).filter(([id]) => ids.has(id)));
  }
  return validateWorkspace(next);
}

export function buildConfig(workspace) {
  const imageLevels=validateImageLevels(workspace.imageLevels);
  if (workspace.taskMode === 'tile') {
    const config = clone(workspace.baseBoard); delete config.playerDecks;
    config.players = boardPlayers(workspace.players,workspace.baseBoard);
    if(workspace.taskLibrary&&!config.layout.image&&MODES.some(m=>config.id===`mode-${m.id}`)){
      const rows=selectedTaskRows(workspace);ensure(rows.length,'所选范围没有题目，请勾选题目、增加等级或恢复已删除内容');
      const count=Math.min(6,rows.length),keys=Array.from({length:count},(_,i)=>`image_mix_${i+1}`);
      config.decks=Object.fromEntries(keys.map((key,i)=>[key,{name:`图片混合题库 ${i+1}`,cards:rows.filter((_,j)=>j%count===i).map(t=>t.text)}]));
      let at=0;config.tiles=config.tiles.map(t=>t.type==='task'?{...t,deck:keys[at++%keys.length]}:t);
      return validateConfig(config);
    }
    for (const [key, deck] of Object.entries(config.decks)) {
      const theme = workspace.themes.find(item => item.id === key);
      if (theme) { const cards=key.startsWith('image_mix_')?theme.tasks.filter(text=>imageLevels.includes(imageTaskLevel(text))):[...theme.tasks];ensure(cards.length > 0, `任务库 ${theme.name} 在所选等级下没有题目，请增加等级或调整题库`); config.decks[key] = { name: theme.name, cards }; }
      else config.decks[key] = deck;
    }
    return validateConfig(config);
  }
  const selected = workspace.players.map(player => {
    const theme = workspace.themes.find(theme => theme.id === player.themeId);
    ensure(theme && theme.tasks.length > 0, '请为每位玩家选择非空任务库');
    ensure(theme.audience === 'common' || theme.audience === player.role, '任务库不适用于当前玩家');
    return theme;
  });
  const config = clone(workspace.baseBoard);
  config.players = boardPlayers(workspace.players,workspace.baseBoard);
  config.decks = {};
  const deckKey = theme => `theme_${workspace.themes.findIndex(item => item.id === theme.id)}`;
  for (const theme of selected){const cards=theme.id.startsWith('image_mix_')?theme.tasks.filter(text=>imageLevels.includes(imageTaskLevel(text))):[...theme.tasks];ensure(cards.length>0,'所选图片题库在这些等级下没有题目');config.decks[deckKey(theme)] = { name: theme.name, cards };}
  config.playerDecks = Object.fromEntries(selected.map((theme, index) => [`p${index}`, deckKey(theme)]));
  config.tiles = config.tiles.map(tile => tile.type === 'task' ? { ...tile, deck: deckKey(selected[0]) } : tile);
  return validateConfig(config);
}

export function workspaceForPreparedBoard(current, input) {
  const board=validateConfig(input),players=input.rules?.goal==='chase'?clone(current.players.slice(0,2)):importedPlayers(current,board),themes=clone(current.themes);
  const aliases={};
  for(const [key,deck] of Object.entries(board.decks)) {
    const matching=themes.find(t=>t.id===key);
    let id=key;
    if(matching && (matching.name!==deck.name || JSON.stringify(matching.tasks)!==JSON.stringify(deck.cards))) {
      const prefix=key.slice(0,28);let n=1;
      const same=themes.find(t=>t.id.startsWith(`${prefix}_import`) && t.name===deck.name && JSON.stringify(t.tasks)===JSON.stringify(deck.cards));
      if(same) id=same.id;
      else {while(themes.some(t=>t.id===`${prefix}_import${n}`))n++;id=`${prefix}_import${n}`;}
    }
    aliases[key]=id;
    if(!themes.some(t=>t.id===id))themes.push({id,name:deck.name,desc:'从地图代码导入',audience:'common',tasks:[...deck.cards]});
  }
  board.decks=Object.fromEntries(Object.entries(board.decks).map(([key,deck])=>[aliases[key],deck]));
  board.tiles=board.tiles.map(t=>t.type==='task'?{...t,deck:aliases[t.deck]}:t);
  if(board.playerDecks) delete board.playerDecks;
  board.players=boardPlayers(players,board);
  return validateWorkspace({...current,view:'home',active:null,taskMode:'tile',players,themes,baseBoard:board});
}

export function workspaceForImageMap(current, input) {
  const board=validateConfig(input);ensure(board.layout.image,'请选择图片地图');
  const players=importedPlayers(current,board),themes=clone(current.themes);
  for(const [id,deck] of Object.entries(board.decks)) if(!themes.some(t=>t.id===id)) themes.push({id,name:deck.name,desc:'图片地图任务',audience:'common',tasks:[...deck.cards]});
  board.players=boardPlayers(players,board);
  return validateWorkspace({...current,view:'home',active:null,taskMode:'tile',players,themes,baseBoard:board});
}

export function workspaceForMode(current, id,options=mapSizeOptions(current.baseBoard)) {
  const board = createMode(id,{levels:current.imageLevels,...options});
  const players = clone(id === 'chase' ? current.players.slice(0, 2) : current.players);
  board.players = players.map(p => ({ id: `p${p.id}`, name: p.name, color: p.color }));
  const themes = refreshUntouchedImageThemes(clone(current.themes));
  for (const [key, deck] of Object.entries(board.decks)) if (!themes.some(t => t.id === key)) themes.push({ id: key, name: deck.name, desc: '模式内置任务，可自由编辑', audience: 'common', tasks: [...(IMAGE_MODE_DECKS[key]?.cards??deck.cards)] });
  return validateWorkspace({ ...current, active: null, view: 'home', baseBoard: board, players, themes, taskMode: 'tile' });
}

export function workspaceForMapSize(current,size,shape='reference'){
 ensure(!current.baseBoard.layout.image,'原图保持原来的格数；请先选择一种预设玩法');
 const mode=MODES.find(m=>current.baseBoard.id===`mode-${m.id}`);
 if(!mode&&size===0)return validateWorkspace({...clone(current),active:null,view:'home'});
 const id=mode?.id??'classic';
 const next=workspaceForMode(current,id,{size,shape});
 if(current.baseBoard.id===next.baseBoard.id)next.baseBoard.rules=clone(current.baseBoard.rules);
 return validateWorkspace(next);
}
export function workspaceForImageLevels(current,levels){
 const selected=validateImageLevels(levels),mode=MODES.find(m=>current.baseBoard.id===`mode-${m.id}`&&!current.baseBoard.layout.image);
 const next={...current,imageLevels:selected};
 if(!mode)return validateWorkspace(next);
 const prepared=workspaceForMode(next,mode.id);
 return validateWorkspace({...prepared,view:current.view,active:current.active});
}
export function workspaceForTaskLibrary(current,action){return validateWorkspace(changeTaskLibrary(current,action));}
// Refresh contents, never the route or image. Explicitly starting a new game
// keeps old pending tasks/timers from being paired with a different board.
export function workspaceForShuffledTasks(current,seed=20261003){
  const rows=selectedTaskRows(current);ensure(rows.length,'所选题库没有可用题目，请增加等级或勾选题目');
  const board=clone(current.baseBoard),cards=[...new Set(rows.map(r=>r.text))];
  ensure(board.tiles.some(t=>t.type==='task'),'这张地图没有任务格，请先在地图编辑器设置任务格');
  let rng=seed>>>0||1,bag=[];
  const draw=()=>{if(!bag.length)bag=cards.map((_,i)=>i);rng^=rng<<13;rng^=rng>>>17;rng^=rng<<5;rng>>>=0;return cards[bag.splice(Math.floor(rng/4294967296*bag.length),1)[0]];};
  board.decks={shuffle_pool:{name:'本局随机题库',cards}};delete board.playerDecks;
  board.tiles=board.tiles.map(tile=>{
    if(tile.type!=='task')return tile;
    const next={...tile,text:draw(),deck:'shuffle_pool'};delete next.playerTexts;delete next.duration;
    if(board.layout.image)next.originalText=tile.originalText??tile.text;
    const duration=taskDuration(next.text);if(duration)next.duration=duration;
    return next;
  });
  return validateWorkspace({...current,baseBoard:board,active:null,taskMode:'tile',view:'home'});
}
export function startWorkspace(workspace, options) {
  const updated = { ...workspace, themes: refreshUntouchedImageThemes(workspace.themes) };
  const config = validateConfig(fillOwnBoardTasks(buildConfig(updated),options?.seed));
  return { ...clone(updated), view: 'game', active: { config, state: createGame(config, options) } };
}

export function workspaceFromBoard(input, previous = null) {
  const board = validateConfig(input);
  const themes = Object.entries(board.decks).map(([id, deck]) => ({ id, name: deck.name, desc: '从棋盘配置导入', audience: 'common', tasks: [...deck.cards] }));
  return validateWorkspace({
    version: 2, revision: previous?.revision ?? 0,...(previous?.imageLevels?{imageLevels:previous.imageLevels}:{}), view: 'home', taskMode: board.playerDecks ? 'player' : 'tile', baseBoard: board, active: null, themes,
    players: board.players.map((player, index) => ({ id: index, name: player.name, color: player.color, role: index % 2 ? 'female' : 'male', step: 0, themeId: board.playerDecks?.[player.id] ?? themes[0].id }))
  });
}

export function createWorkspaceRepository(storage) {
  return {
    load() {
      let hadError = false;
      for (const key of [WORKSPACE_KEY, WORKSPACE_BACKUP_KEY]) {
        try { const raw = storage.getItem(key); if (raw) return { value: parseWorkspace(raw), recovered: key === WORKSPACE_BACKUP_KEY, error: null }; }
        catch { hadError = true; }
      }
      return { value: null, recovered: false, error: hadError ? '存档无法读取，旧数据暂未覆盖' : null };
    },
    save(value) {
      const valid = validateWorkspace(value);
      const source = JSON.stringify(valid); ensure(source.length <= 3_000_000, '工作区存档过大');
      const old = storage.getItem(WORKSPACE_KEY);
      if (old) { try { parseWorkspace(old); storage.setItem(WORKSPACE_BACKUP_KEY, old); } catch { /* Keep usable backup. */ } }
      storage.setItem(WORKSPACE_KEY, source); return valid;
    }
  };
}
