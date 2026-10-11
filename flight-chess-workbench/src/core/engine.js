import {changeTaskCount,validTaskCount} from './taskCount.js';
import {applyTaskParameters} from './taskParameters.js';
import {applyEffectAction,validateEffects,validateEffectDeck} from './ongoingEffects.js';
import {nextClock,validPause} from './taskClock.js';
/** Pure rules engine: no DOM, timers, storage, network or global randomness. */
import {taskDuration,legacyTaskDuration,reviewDuration} from './taskTiming.js';
export const STATE_VERSION = 1;
const MAX_UNDO = 12;
const MAX_LOG = 80;
const clone = value => structuredClone(value);
function ensure(condition, message) { if (!condition) throw new Error(message); }

function random(state, length) {
  let x = state.seed >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.seed = x >>> 0;
  return Math.floor(state.seed / 4294967296 * length);
}
function log(state, text) {
  state.log.push({ revision: state.revision, text });
  state.log = state.log.slice(-MAX_LOG);
}
function snapshot(state) { const { undo, ...rest } = state; return clone(rest); }

export function createGame(config, { seed = 20261002, id = 'local-game' } = {}) {
  ensure(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff, '随机种子不正确');
  return {
    version: STATE_VERSION, id, revision: 0, seed: seed || 1, turn: 0, phase: 'ready', winner: null,
    ...(config.rules.finishAllPlayers ? { finishOrder: [] } : {}),
    players: config.players.map(player => ({ id: player.id, position: player.start ?? (config.rules.goal === 'chase' && player.id === config.players[0].id ? 6 : 0), launched: !config.rules.launchOnSix, skips: 0, multiplier: 1 })),
    pending: null, choice: null, review: null, bags: {}, lastMove: null, rounds: 0, log: [{ revision: 0, text: `${config.players[0].name} 先开始。` }], undo: []
  };
}

/** Calculate every step once. The UI plays this path without changing game state. */
export function movement(position, steps, finish, mode = 'bounce') {
  ensure(Number.isInteger(finish) && finish >= 1 && Number.isInteger(position) && position >= 0 && position <= finish, '棋子位置不正确');
  ensure(Number.isInteger(steps) && Math.abs(steps) <= 512, '移动步数不正确');
  ensure(['bounce', 'stop', 'exact'].includes(mode), '终点规则不正确');
  if (mode === 'exact' && steps > 0 && position + steps > finish) return { position, path: [] };
  const path = [];
  let direction = Math.sign(steps);
  for (let n = 0; n < Math.abs(steps); n++) {
    if (direction < 0 && position === 0) {
      if (steps < 0) break;
      direction = 1;
    }
    if (direction > 0 && position === finish) {
      if (mode !== 'bounce') break;
      direction = -1;
    }
    position += direction;
    path.push(position);
  }
  return { position, path };
}

function advanceTurn(state, config, extra = false) {
  if (state.phase === 'finished') return;
  state.pending = null; state.choice = null; state.review = null; state.phase = 'ready'; state.rounds++;
  if(config.rules.maxRounds&&state.rounds>=config.rules.maxRounds*state.players.length){state.phase='finished';state.limitReached=true;state.winner=null;log(state,'达到设定轮数，本局结束，保留地图进度。');return;}
  if (extra) { log(state, `${config.players[state.turn].name} 再掷一次。`); return; }
  for (let n = 0; n <= state.players.length; n++) {
    state.turn = (state.turn + 1) % state.players.length;
    const next = state.players[state.turn];
    if (state.finishOrder?.includes(next.id)) continue;
    if (!next.skips) return;
    next.skips--; log(state, `${config.players[state.turn].name} 暂停一轮。`);
  }
  throw new Error('回合无法推进');
}

function drawTask(state, config, key) {
  if (!state.bags[key]?.length) {
    const bag = config.decks[key].cards.map((_, index) => index);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = random(state, i + 1); [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    state.bags[key] = bag;
  }
  const card = state.bags[key].pop();
  return { card, text: config.decks[key].cards[card] };
}

// A half-second is exact at the stored millisecond deadline; a doubled 24h task is 48h.
function scaledDuration(duration, factor) {
  const result = duration * factor;
  return Number.isInteger(result * 2) && result >= 0.5 && result <= 172800 ? result : undefined;
}

function win(state, config) {
  if (config.rules.finishAllPlayers) {
    const player=state.players[state.turn];
    ensure(!state.finishOrder.includes(player.id), '该玩家已确认到达终点');
    state.finishOrder.push(player.id);
    log(state, `${config.players[state.turn].name} 第${state.finishOrder.length}位到达终点。`);
    if(state.finishOrder.length<state.players.length){advanceTurn(state,config);return;}
    state.winner=state.finishOrder[0];state.phase='finished';state.pending=null;state.review=null;
    log(state,'两位玩家均已确认完成，原图的先后顺序已保留。');return;
  }
  state.winner = config.rules.goal === 'cooperative' ? 'team' : state.players[state.turn].id; state.phase = 'finished'; state.pending = null; state.review = null;
  log(state, config.rules.goal === 'cooperative' ? '共同到达终点，全队完成闯关！' : `${config.players[state.turn].name} 到达终点！`);
}

function syncTeam(state, config) {
  if (config.rules.goal === 'cooperative') {
    const p = state.players.find(p => p.id === state.lastMove?.playerId) ?? state.players[state.turn];
    state.players.forEach(other => { other.position = p.position; });
  }
}
function capture(state, config) {
  if (state.phase === 'review') return false;
  if (config.rules.goal !== 'chase' || state.players[1].position < state.players[0].position) return false;
  state.winner = state.players[1].id; state.phase = 'finished'; state.pending = null; state.choice = null; state.review = null;
  log(state, `${config.players[1].name} 追上 ${config.players[0].name}，追逐结束！`); return true;
}
const EVENTS = [{ type: 'move', steps: 3, label: '顺风前进 3 格' }, { type: 'move', steps: -2, label: '逆风后退 2 格' }, { type: 'extra', label: '幸运加赛，再掷一次' }, { type: 'double', label: '蓄力，下次翻倍' }, { type: 'plain', label: '安静休息一回合' }];

function land(state, config, move, continuation = {}) {
  const player = state.players[state.turn];
  const finish = config.tiles.length - 1;
  const visited = new Set(continuation.visited ?? []);
  for (let count = continuation.count ?? 0; count < config.rules.maxChain; count++) {
    const position = player.position;
    if (visited.has(position)) { log(state, '特殊格形成循环，已停止连续触发。'); advanceTurn(state, config); return; }
    let tile = config.tiles[position];
    // Source-image prose can contain an additional human task next to a move.
    // Show it before executing the configured effect; never infer hidden effects.
    if (config.layout.image && (tile.text || config.rules.navigation==='manual' && tile.type==='finish') && (tile.type!=='task' && (tile.type!=='start'||config.rules.navigation==='manual')) && continuation.confirmed !== position) {
      state.phase = 'review'; state.pending = null; state.choice = null;
      state.review = { position, count, visited: [...visited], dice:move.dice };
      log(state, `第 ${position} 格：请阅读原图内容并确认规则。`); return;
    }
    continuation.confirmed = undefined;
    state.review = null;
    if (capture(state, config)) return;
    if (position === finish) { win(state, config); return; }
    visited.add(position);
    if (tile.type === 'random') { tile = EVENTS[random(state, EVENTS.length)]; log(state, `随机事件：${tile.label}。`); }
    if (tile.type === 'choice') { state.phase = 'choice'; state.pending = null; state.choice = { position, options: clone(tile.options) }; log(state, `第 ${position} 格：请选择路线。`); return; }
    if (tile.type === 'task') {
      const deckPlayer = state.players[tile.target === 'other' ? (state.turn + 1) % state.players.length : state.turn].id;
      const deck = config.playerDecks?.[deckPlayer] ?? tile.deck;
      const selected = drawTask(state, config, deck);
      const targets = tile.target === 'both' ? state.players.map(p => p.id) : [state.players[tile.target === 'other' ? (state.turn + 1) % state.players.length : state.turn].id];
      const original=tile.playerTexts?.[state.players[state.turn].id]??tile.text??selected.text;const text=applyTaskParameters(original,config.rules.taskParameters).text;
      const taskFactor=player.taskFactor??1;
      const duration=scaledDuration(original!==text?(taskDuration(text)??tile.duration):(tile.duration??taskDuration(text)),taskFactor);
      state.pending = { position, deck, card: selected.card, text,...(original!==text?{original}:{}), targets, ...(taskFactor!==1?{taskFactor}:{}), ...(duration ? { duration } : {}) };
      state.phase = 'task'; log(state, `落在第 ${position} 格，等待任务确认。`); return;
    }
    if (tile.type === 'extra') { advanceTurn(state, config, true); return; }
    if (tile.type === 'double') { player.multiplier = 2; log(state, '下次掷骰点数翻倍。'); advanceTurn(state, config); return; }
    if (tile.type === 'taskScale') { player.taskFactor=tile.factor; log(state, `下一项本人的任务${tile.factor===2?'翻倍':'减半'}，骰子点数不变；完成或跳过后清除。`); advanceTurn(state,config); return; }
    if (tile.type === 'skip') { player.skips = 1; advanceTurn(state, config); return; }
    if (tile.type === 'home') {
      const result = movement(position, -position, finish, 'stop');
      player.position = 0; player.launched = !config.rules.launchOnSix; player.multiplier = 1;
      move.path.push(...result.path); log(state, '已返回起点。'); advanceTurn(state, config); return;
    }
    if (tile.type !== 'move') { advanceTurn(state, config); return; }
    const steps=tile.steps*(tile.stepsFromDice?move.dice:1);
    const result = movement(position, steps, finish, config.rules.finish);
    player.position = result.position; move.path.push(...result.path);
    log(state, `特殊格${steps > 0 ? '前进' : '后退'} ${Math.abs(steps)} 格${tile.stepsFromDice?`（骰子${move.dice}点）`:''}，抵达第 ${player.position} 格。`);
    if (player.position === finish) {
      if (config.layout.image && config.tiles[finish].text) {state.phase='review';state.review={position:finish,count:0,visited:[],dice:move.dice};state.pending=null;state.choice=null;log(state, '到达终点，请阅读原图终点内容。');return;}
      if (capture(state, config)) return;
      win(state, config); return;
    }
    if (capture(state, config)) return;
    if (!config.rules.chainEffects) { advanceTurn(state, config); return; }
  }
  log(state, '已达到特殊格触发上限，结束本次移动。'); advanceTurn(state, config);
}

/** Optional dice is only for deterministic testing and integrations. */
export function transition(input, config, action, dice) {
  ensure(action && ['ROLL', 'RESOLVE_TASK', 'RESOLVE_REVIEW', 'UNDO', 'CHOOSE_ROUTE', 'SET_TIMER', 'TASK_COUNT', 'MOVE_TO_CELL', 'RESELECT_CELL','EFFECT_ADD','EFFECT_END','EFFECT_TIMER','EFFECT_DRAW','EFFECT_CHOOSE','EFFECT_DISMISS','EFFECT_COUNT'].includes(action.type), '未知操作');
  if (action.expectedRevision !== undefined) ensure(action.expectedRevision === input.revision, '对局已更新，请重新操作');
  if (action.type === 'UNDO') {
    ensure(input.undo.length > 0, '没有可撤销的操作');
    const restored = clone(input.undo.at(-1));
    restored.undo = clone(input.undo.slice(0, -1)); restored.revision = input.revision + 1; restored.lastMove = config.rules.navigation==='manual'?restored.lastMove:null;
    log(restored, '已撤销上一次操作。'); return restored;
  }
  if (action.type === 'ROLL') ensure(input.phase === 'ready', input.phase==='move'?'请先在原图点选落点':input.phase === 'review' ? '请先确认或跳过本格原图内容' : input.phase === 'task' ? '请先完成或跳过当前任务' : input.phase === 'choice' ? '请先选择路线' : '本局已经结束');
  if (action.type === 'RESOLVE_TASK') {
    ensure(input.phase === 'task' && input.pending, '当前没有待确认任务');
    ensure(['done', 'skip'].includes(action.result), '任务结果不正确');
  }
  if (action.type === 'RESOLVE_REVIEW') {
    ensure(input.phase === 'review' && input.review, '当前没有待确认原图内容');
    ensure(['apply', 'skip'].includes(action.result), '原图确认结果不正确');
  }
  if (action.type === 'CHOOSE_ROUTE') {
    ensure(input.phase === 'choice' && input.choice, '当前没有路线选择');
    ensure(Number.isInteger(action.index) && action.index >= 0 && action.index < input.choice.options.length, '路线选项不正确');
  }
  if(action.type==='TASK_COUNT')ensure(input.phase==='task'&&input.pending||input.phase==='review'&&input.review,'当前没有可计次任务');
  if (action.type === 'SET_TIMER') {
    ensure(input.phase === 'task' && input.pending?.duration || input.phase === 'review' && input.review && reviewDuration(applyTaskParameters(config.tiles[input.review.position].text??'',config.rules.taskParameters).text,input.review), '当前内容没有明确计时');
    ensure(action.now === null || Number.isSafeInteger(action.now) && action.now >= 0 && action.now <= 10_000_000_000_000, '计时开始时间不正确');
  }
  if(action.type==='RESELECT_CELL')ensure(config.rules.navigation==='manual'&&['task','review'].includes(input.phase)&&input.lastMove&&input.lastMove.playerId===input.players[input.turn].id,'当前没有可重选的自由棋盘落点');
  if(action.type==='MOVE_TO_CELL'){
    ensure(config.rules.navigation==='manual' && input.phase==='move', '请先在自由棋盘掷骰，再点选落点');
    ensure(Number.isInteger(action.position) && action.position>=0 && action.position<config.tiles.length, '落点超出图片格框');
  }
  const state = clone(input); state.revision++;
  state.undo = [...state.undo, snapshot(input)].slice(-MAX_UNDO);
  if(applyEffectAction(state,action,config.players.map(p=>p.id),state.rounds,n=>random(state,n)))return state;
  if(action.type==='RESELECT_CELL'){const player=state.players[state.turn],from=state.lastMove.from;player.position=from;state.lastMove={...state.lastMove,to:from,path:[]};state.pending=null;state.review=null;state.choice=null;state.phase='move';log(state,'已取消本次落点，请按原图重新点选；骰子点数保留。');return state;}
  if(action.type==='MOVE_TO_CELL'){
    const player=state.players[state.turn],move={playerId:player.id,from:player.position,to:action.position,dice:state.lastMove.dice,multiplier:1,path:[action.position]};
    player.position=action.position;state.lastMove=move;state.phase='ready';
    log(state, `按原图确认落点：第 ${action.position} 格。`);
    land(state,config,move);return state;
  }
  if(action.type==='TASK_COUNT'){const target=state.phase==='review'?state.review:state.pending,text=state.phase==='review'?applyTaskParameters(config.tiles[state.review.position].text??'',config.rules.taskParameters).text:target.text;changeTaskCount(target,action.countDelta,text,target.taskFactor??1);return state;}
  if (action.type === 'SET_TIMER') {
    const target = state.phase === 'review' ? state.review : state.pending;
    const duration = state.phase === 'review' ? reviewDuration(applyTaskParameters(config.tiles[state.review.position].text??'',config.rules.taskParameters).text,state.review) : state.pending.duration;
    const clock=nextClock(duration,target.timerEndsAt,target.pausedRemaining,action.now,action.timerMode);target.timerEndsAt=clock.endsAt;delete target.pausedRemaining;if(clock.pausedRemaining!==undefined)target.pausedRemaining=clock.pausedRemaining;return state;
  }
  if (action.type === 'RESOLVE_REVIEW') {
    const review = state.review, player = state.players[state.turn];
    state.review = null; state.phase = 'ready';
    log(state, action.result === 'apply' ? '已确认原文，应用配置规则。' : '已跳过本格原文与配置规则。');
    if (action.result === 'skip') {
      if(config.rules.navigation==='manual' && player.position===config.tiles.length-1){const from=state.lastMove.from;player.position=from;state.lastMove={...state.lastMove,to:from,path:[]};state.phase='move';log(state,'终点条件尚未满足，请重新选择实际落点。');return state;}
      state.lastMove = null;
      if (capture(state, config)) return state;
      if (player.position === config.tiles.length - 1) win(state, config); else advanceTurn(state, config);
    } else {
      const move = state.lastMove ?? { playerId: player.id, from: player.position, to: player.position, dice: review.dice ?? 1, multiplier: 1, path: [] };
      state.lastMove = move;
      land(state, config, move, { ...review, confirmed: review.position });
      if (state.phase !== 'finished') capture(state, config);
      syncTeam(state, config); move.to = player.position;
    }
    return state;
  }
  if (action.type === 'CHOOSE_ROUTE') {
    const option = state.choice.options[action.index], player = state.players[state.turn];
    const result = movement(player.position, option.steps, config.tiles.length - 1, config.rules.finish);
    const move = { playerId: player.id, from: player.position, to: result.position, dice: state.lastMove?.dice ?? 1, multiplier: 1, path: result.path };
    state.lastMove = move; state.choice = null; state.phase = 'ready'; player.position = result.position;
    log(state, `选择「${option.label}」，到达第 ${player.position} 格。`);
    if (!result.path.length) advanceTurn(state, config); else land(state, config, move);
    if (state.phase !== 'finished') capture(state, config);
    syncTeam(state, config); move.to = player.position; return state;
  }
  if (action.type === 'RESOLVE_TASK') {
    log(state, action.result === 'done' ? '任务已完成。' : '已跳过任务。');
    delete state.players[state.turn].taskFactor;
    state.lastMove = null; advanceTurn(state, config); return state;
  }
  const rolled = dice ?? random(state, 6) + 1;
  ensure(Number.isInteger(rolled) && rolled >= 1 && rolled <= 6, '骰子点数须为 1–6');
  const player = state.players[state.turn];
  const move = { playerId: player.id, from: player.position, to: player.position, dice: rolled, multiplier: player.multiplier, path: [] };
  state.lastMove = move;
  log(state, `${config.players[state.turn].name} 掷出 ${rolled} 点${player.multiplier === 2 ? '，本次翻倍' : ''}。`);
  if (!player.launched) {
    if (rolled === 6) { player.launched = true; log(state, '已准备起飞，再掷一次开始移动。'); }
    else advanceTurn(state, config);
    return state;
  }
  if(config.rules.navigation==='manual'){state.phase='move';log(state, '请按原图路线与条件点选落点，格号只标识位置。');return state;}
  const result = movement(player.position, rolled * player.multiplier, config.tiles.length - 1, config.rules.finish);
  player.multiplier = 1; player.position = result.position; move.path = result.path;
  if (!result.path.length) { log(state, '点数超过终点，本次停留原格。'); advanceTurn(state, config); }
  else land(state, config, move);
  if (state.phase !== 'finished') capture(state, config);
    syncTeam(state, config); move.to = player.position;
  return state;
}

export function validateState(state, config, withUndo = true) {
  ensure(state && typeof state === 'object' && state.version === STATE_VERSION, '存档版本不正确');
  ensure(typeof state.id === 'string' && state.id.length > 0 && state.id.length <= 100, '存档 ID 不正确');
  ensure(Number.isSafeInteger(state.revision) && state.revision >= 0, '存档修订号不正确');
  ensure(Number.isInteger(state.seed) && state.seed > 0 && state.seed <= 0xffffffff, '存档随机种子不正确');
  ensure(Number.isInteger(state.turn) && state.turn >= 0 && state.turn < config.players.length, '存档回合不正确');
  ensure(['ready', 'task', 'choice', 'review', 'move', 'finished'].includes(state.phase), '存档阶段不正确');
  ensure(Number.isSafeInteger(state.rounds) && state.rounds >= 0, '存档回合计数不正确');
  validateEffects(state.effects,config.players.map(p=>p.id),state.rounds);validateEffectDeck(state,{counter:state.rounds});
  const finish = config.tiles.length - 1;
  ensure(Array.isArray(state.players) && state.players.length === config.players.length, '存档玩家数量不一致');
  state.players.forEach((player, index) => {
    ensure(player.id === config.players[index].id && Number.isInteger(player.position) && player.position >= 0 && player.position <= finish, '存档棋子位置不正确');
    ensure(typeof player.launched === 'boolean' && [0, 1].includes(player.skips) && [1, 2].includes(player.multiplier), '存档玩家状态不正确');
    ensure(player.taskFactor===undefined || [0.5,2].includes(player.taskFactor)&&config.tiles.some(t=>t.type==='taskScale'&&t.factor===player.taskFactor), '存档任务倍率不正确');
    if(config.rules.navigation==='manual')ensure(player.launched&&player.skips===0&&player.multiplier===1,'自由棋盘不自动执行起飞、暂停或翻倍');
  });
  if(config.rules.finishAllPlayers){
    ensure(Array.isArray(state.finishOrder)&&state.finishOrder.length<=state.players.length&&new Set(state.finishOrder).size===state.finishOrder.length&&state.finishOrder.every(id=>state.players.some(p=>p.id===id&&p.position===finish)), '存档到达顺序不正确');
    ensure(state.phase==='finished'||state.finishOrder.length<state.players.length&&!state.finishOrder.includes(state.players[state.turn].id), '已到达玩家不能继续掷骰');
  }else ensure(state.finishOrder===undefined,'存档到达顺序与规则不一致');
  ensure(state.bags && typeof state.bags === 'object' && !Array.isArray(state.bags), '存档任务抽取记录不正确');
  for (const [key, bag] of Object.entries(state.bags)) {
    ensure(Object.hasOwn(config.decks, key) && Array.isArray(bag) && new Set(bag).size === bag.length && bag.every(index => Number.isInteger(index) && index >= 0 && index < config.decks[key].cards.length), '存档任务序号不正确');
  }
  if(config.rules.navigation==='manual'&&state.phase==='review')ensure(state.lastMove&&state.lastMove.playerId===state.players[state.turn].id&&state.lastMove.to===state.review?.position,'自由棋盘确认缺少实际落点记录');
  if(state.phase==='move')ensure(config.rules.navigation==='manual' && state.lastMove && state.lastMove.playerId===state.players[state.turn].id && state.lastMove.from===state.players[state.turn].position && state.lastMove.to===state.players[state.turn].position && state.lastMove.path.length===0, '存档待选落点与掷骰记录不一致');
  if (config.rules.goal === 'cooperative') ensure(state.players.every(p => p.position === state.players[0].position), '合作棋子位置不一致');
  if (state.phase === 'choice') {
    const c = state.choice; ensure(c && c.position === state.players[state.turn].position && config.tiles[c.position].type === 'choice' && JSON.stringify(c.options) === JSON.stringify(config.tiles[c.position].options), '存档路线选择不正确');
  } else ensure(state.choice == null, '存档路线选择与阶段不一致');
  if (state.phase === 'review') {
    const r = state.review;
    ensure(r && Number.isInteger(r.position) && r.position === state.players[state.turn].position && config.layout.image && (config.tiles[r.position].text || config.rules.navigation==='manual' && r.position===finish) && config.tiles[r.position].type!=='task' && (config.tiles[r.position].type!=='start'||config.rules.navigation==='manual'), '存档原图确认落点不正确');
    ensure(r.dice === undefined || Number.isInteger(r.dice) && r.dice>=1 && r.dice<=6 && (state.lastMove==null || state.lastMove.dice===r.dice), '存档原图确认点数不正确');
    ensure(validTaskCount(r,applyTaskParameters(config.tiles[r.position].text??'',config.rules.taskParameters).text),'存档原图计次不正确');
    ensure(r.timerEndsAt === undefined || reviewDuration(applyTaskParameters(config.tiles[r.position].text??'',config.rules.taskParameters).text,r) && (r.timerEndsAt === null || Number.isSafeInteger(r.timerEndsAt) && r.timerEndsAt >= 0 && r.timerEndsAt <= 10_000_172_800_000), '存档原图确认计时不正确');ensure(validPause(reviewDuration(applyTaskParameters(config.tiles[r.position].text??'',config.rules.taskParameters).text,r),r.timerEndsAt,r.pausedRemaining),'存档暂停计时不正确');
    ensure(!config.tiles[r.position].stepsFromDice || r.dice !== undefined || state.lastMove != null, '存档点数移动缺少骰子记录');
    ensure(Number.isInteger(r.count) && r.count >= 0 && r.count < config.rules.maxChain && Array.isArray(r.visited) && r.count === r.visited.length && new Set(r.visited).size === r.visited.length && r.visited.every(p => Number.isInteger(p) && p >= 0 && p < finish && p !== r.position), '存档原图连续确认记录不正确');
  } else ensure(state.review == null, '存档原图确认与阶段不一致');
  if (state.phase === 'task') {
    const task = state.pending;
    ensure(task && Number.isInteger(task.position) && task.position === state.players[state.turn].position, '存档任务落点不正确');
    const tile = config.tiles[task.position];
    const deckPlayer = state.players[tile.target === 'other' ? (state.turn + 1) % state.players.length : state.turn].id;
    const expectedDeck = config.playerDecks?.[deckPlayer] ?? tile.deck;
    ensure(tile.type === 'task' && expectedDeck === task.deck && Object.hasOwn(config.decks, task.deck), '存档任务库不正确');
    ensure(Number.isInteger(task.card) && task.card >= 0 && task.card < config.decks[task.deck].cards.length && task.text === applyTaskParameters(tile.playerTexts?.[state.players[state.turn].id] ?? tile.text ?? config.decks[task.deck].cards[task.card],config.rules.taskParameters).text, '存档任务内容不一致');
    const expected = tile.target === 'both' ? state.players.map(p => p.id) : [state.players[tile.target === 'other' ? (state.turn + 1) % state.players.length : state.turn].id];
    const originalText=tile.playerTexts?.[state.players[state.turn].id] ?? tile.text ?? config.decks[task.deck].cards[task.card];ensure(task.original===undefined||task.original===originalText,'存档原文来源不一致');
    ensure(JSON.stringify(task.targets) === JSON.stringify(expected), '存档任务对象不正确');
    ensure(task.taskFactor === state.players[state.turn].taskFactor, '存档任务倍率与玩家不一致');
    const duration=scaledDuration(originalText!==task.text?(taskDuration(task.text)??tile.duration):(tile.duration??taskDuration(task.text)),task.taskFactor??1);
    const legacyDuration=task.duration!==duration?scaledDuration(legacyTaskDuration(task.text),task.taskFactor??1):undefined;
    ensure(task.duration===duration || legacyDuration!==undefined&&task.duration===legacyDuration || task.taskFactor===undefined&&task.duration===undefined&&tile.duration===undefined, '存档任务时长不正确');
    ensure(validTaskCount(task,task.text,task.taskFactor??1),'存档任务计次不正确');
    ensure(task.timerEndsAt == null || task.duration && Number.isSafeInteger(task.timerEndsAt) && task.timerEndsAt >= 0 && task.timerEndsAt <= 10_000_172_800_000, '存档任务计时不正确');ensure(validPause(task.duration,task.timerEndsAt,task.pausedRemaining),'存档暂停计时不正确');
  } else ensure(state.pending === null, '存档待办任务与阶段不一致');
  if (state.phase === 'finished') {
    const validWin = config.rules.finishAllPlayers ? state.finishOrder.length===state.players.length&&state.winner===state.finishOrder[0]&&state.finishOrder.at(-1)===state.players[state.turn].id : config.rules.goal === 'cooperative' ? state.winner === 'team' && state.players.every(p => p.position === finish) : config.rules.goal === 'chase' ? state.winner === state.players[1].id && state.players[1].position >= state.players[0].position || state.winner === state.players[0].id && state.players[0].position === finish : state.winner === state.players[state.turn].id && state.players[state.turn].position === finish;
    ensure(validWin||state.limitReached===true&&config.rules.maxRounds&&state.rounds>=config.rules.maxRounds*state.players.length&&state.winner===null, '存档胜负状态不正确');
  }
  else ensure(state.limitReached===undefined&&state.winner === null && (config.rules.finishAllPlayers?state.players.every(player=>player.position!==finish || state.finishOrder.includes(player.id) || state.phase==='review'&&state.review.position===finish&&player.id===state.players[state.turn].id):!state.players.some(player=>player.position===finish)||state.phase==='review'&&state.review.position===finish) && (config.rules.goal !== 'chase' || state.players[1].position < state.players[0].position || state.phase === 'review'), '存档终点状态不一致');
  ensure(Array.isArray(state.log) && state.log.length <= MAX_LOG && state.log.every(entry => entry && Number.isSafeInteger(entry.revision) && entry.revision >= 0 && entry.revision <= state.revision && typeof entry.text === 'string' && entry.text.length <= 1200), '存档日志不正确');
  if (state.lastMove !== null) {
    const move = state.lastMove;
    ensure(move && state.players.some(player => player.id === move.playerId) && Number.isInteger(move.dice) && move.dice >= 1 && move.dice <= 6 && [1, 2].includes(move.multiplier), '存档骰子记录不正确');
    ensure([move.from, move.to].every(index => Number.isInteger(index) && index >= 0 && index <= finish) && Array.isArray(move.path) && move.path.length <= 16396 && move.path.every(index => Number.isInteger(index) && index >= 0 && index <= finish), '存档移动路线不正确');
  }
  if (withUndo) {
    ensure(Array.isArray(state.undo) && state.undo.length <= MAX_UNDO, '存档撤销记录不正确');
    state.undo.forEach(previous => { ensure(!Object.hasOwn(previous, 'undo'), '存档撤销记录不能嵌套'); validateState(previous, config, false); });
  }
  return clone(state);
}
