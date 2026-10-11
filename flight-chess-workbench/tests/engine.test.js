import test from 'node:test';
import assert from 'node:assert/strict';
import { createTemplate, validateConfig, parseConfigJSON, snakePath } from '../src/core/config.js';
import { createGame, movement, transition, validateState } from '../src/core/engine.js';
import { makeSave, parseSave, createRepository, SAVE_KEY, BACKUP_KEY } from '../src/core/storage.js';
import { defaultWorkspace, startWorkspace, buildConfig, validateWorkspace, workspaceFromBoard, createWorkspaceRepository, WORKSPACE_KEY, WORKSPACE_BACKUP_KEY } from '../src/core/workspace.js';
const copy = v => structuredClone(v);
function plain(size = 7) { const c = createTemplate(size); c.tiles = c.tiles.map((t, i) => i === 0 || i === c.tiles.length - 1 ? t : { type: 'plain' }); return c; }
function roll(s, c, dice) { return transition(s, c, { type: 'ROLL', expectedRevision: s.revision }, dice); }
function memory() { const map = new Map(); return { map, getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }; }

test('原项目终点回弹回归：47 + 6 -> 43，路径与结果一致', () => {
  const c = plain(); const s = createGame(c); s.players[0].position = 47;
  const n = roll(s, c, 6);
  assert.deepEqual(n.lastMove.path, [48,47,46,45,44,43]); assert.equal(n.players[0].position, 43); assert.equal(n.lastMove.to, 43); validateState(n, c);
});
test('所有短棋盘折返组合符合镜像数学公式，逐步坐标始终相邻', () => {
  for (let finish = 3; finish <= 48; finish++) for (let p = 0; p < finish; p++) for (let steps = 1; steps <= 12; steps++) {
    const m = movement(p, steps, finish), folded = (p + steps) % (2 * finish);
    assert.equal(m.position, folded <= finish ? folded : 2 * finish - folded);
    assert.equal(m.path.length, steps); let previous = p;
    for (const point of m.path) { assert.ok(point >= 0 && point <= finish); assert.equal(Math.abs(point - previous), 1); previous = point; }
  }
});
test('终点 stop / exact 与负移动边界', () => {
  assert.deepEqual(movement(47,6,48,'stop'), { position:48,path:[48] });
  assert.deepEqual(movement(47,6,48,'exact'), { position:47,path:[] });
  assert.deepEqual(movement(2,-6,48), { position:0,path:[1,0] });
  assert.throws(() => movement(0,513,48));
});
test('状态不可变、修订号防旧操作、未知动作拒绝', () => {
  const c = plain(), s = createGame(c), before = copy(s); const n = roll(s,c,2);
  assert.deepEqual(s,before); assert.equal(n.revision,1); assert.equal(n.turn,1);
  assert.throws(() => transition(n,c,{ type:'ROLL',expectedRevision:0 })); assert.throws(() => transition(n,c,{ type:'BOGUS' }));
});
test('任务抽取、确认门禁、刷新存档完全保留 pending', () => {
  const c = createTemplate(), s = roll(createGame(c),c,1);
  assert.equal(s.phase,'task'); assert.throws(() => roll(s,c,1));
  const loaded = parseSave(JSON.stringify(makeSave(c,s))); assert.deepEqual(loaded.state,s);
  const n = transition(loaded.state,c,{type:'RESOLVE_TASK',result:'skip'}); assert.equal(n.phase,'ready'); assert.equal(n.turn,1); assert.equal(n.pending,null);
});
test('同一任务包抽完前不重复，并能补充下一轮抽取袋', () => {
  const c = createTemplate(); c.decks.talk.cards = ['一','二','三']; c.tiles[1] = { type:'task',deck:'talk',target:'self' };
  let s = createGame(c), seen = [];
  for (let i = 0; i < 6; i++) { s.turn = 0; s.players[0].position = 0; s = roll(s,c,1); seen.push(s.pending.card); s = transition(s,c,{type:'RESOLVE_TASK',result:'done'}); validateState(s,c); }
  assert.equal(new Set(seen.slice(0,3)).size,3); assert.equal(new Set(seen.slice(3)).size,3);
});
test('特殊格连锁正确，循环可终止', () => {
  const c = plain(); c.tiles[2] = {type:'move',steps:2}; c.tiles[4] = {type:'move',steps:-2};
  const s = roll(createGame(c),c,2); assert.equal(s.phase,'ready'); assert.equal(s.turn,1); assert.deepEqual(s.lastMove.path,[1,2,3,4,3,2]); assert.ok(s.log.some(x=>x.text.includes('循环')));
  c.rules.chainEffects = false; const n = roll(createGame(c),c,2); assert.equal(n.players[0].position,4); assert.equal(n.lastMove.path.length,4);
});
test('再掷、翻倍、暂停和返回起点', () => {
  const c = plain(); c.tiles[1] = {type:'extra'}; c.tiles[2] = {type:'double'}; c.tiles[4] = {type:'skip'}; c.tiles[8] = {type:'home'};
  let s = roll(createGame(c),c,1); assert.equal(s.turn,0);
  s = roll(s,c,1); assert.equal(s.players[0].multiplier,2); assert.equal(s.turn,1);
  s = roll(s,c,4); assert.equal(s.turn,0); assert.equal(s.players[1].skips,1);
  s = roll(s,c,3); assert.equal(s.players[0].position,0); assert.equal(s.players[0].multiplier,1); assert.equal(s.turn,0); assert.equal(s.players[1].skips,0); validateState(s,c);
});
test('起飞点数和胜者 0 号正常', () => {
  const c = plain(); c.rules.launchOnSix = true; c.rules.finish = 'stop';
  let s = roll(createGame(c),c,2); assert.equal(s.players[0].launched,false); assert.equal(s.turn,1);
  s = roll(s,c,6); assert.equal(s.players[1].launched,true); assert.equal(s.players[1].position,0); assert.equal(s.turn,1);
  s.turn = 0; s.players[0].launched = true; s.players[0].position = 47; s = roll(s,c,6);
  assert.equal(s.winner,c.players[0].id); assert.equal(s.phase,'finished'); assert.throws(()=>roll(s,c,1)); validateState(s,c);
});
test('3 / 4 玩家回合和共同任务对象', () => {
  for (const count of [3,4]) {
    const c = plain(); while (c.players.length < count) c.players.push({id:`p${c.players.length}`,name:'新玩家',color:'#abcdef'});
    let s = createGame(c); for(let i=0;i<count;i++) { s = roll(s,c,1); assert.equal(s.turn,(i+1)%count); }
    c.tiles[2]={type:'task',deck:'talk',target:'both'}; s=roll(s,c,1); assert.deepEqual(s.pending.targets,c.players.map(p=>p.id)); validateState(s,c);
  }
});
test('撤销恢复随机种子、抽取袋和任务，修订号单调增长', () => {
  const c = createTemplate(), s=createGame(c), n=roll(s,c,1), undone=transition(n,c,{type:'UNDO'});
  assert.equal(undone.revision,2); assert.equal(undone.seed,s.seed); assert.deepEqual(undone.bags,s.bags); assert.deepEqual(undone.players,s.players);
  assert.deepEqual(roll(undone,c,1).pending,n.pending); assert.throws(()=>transition(s,c,{type:'UNDO'}));
});
test('任意长期对局每一步都可校验和序列化，撤销长度有上限', () => {
  for (const mode of ['bounce','exact','stop']) for(const count of [2,3,4]) {
    const c=createTemplate(); c.rules.finish=mode; while(c.players.length<count)c.players.push({id:`p${c.players.length}`,name:'玩家',color:'#123456'});
    let s=createGame(c,{seed:count}); for(let i=0;i<400 && s.phase!=='finished';i++){ s=transition(s,c,s.phase==='task'?{type:'RESOLVE_TASK',result:'done'}:{type:'ROLL'}); assert.deepEqual(validateState(s,c),s); assert.deepEqual(parseSave(JSON.stringify(makeSave(c,s))).state,s); assert.ok(s.undo.length<=12); }
  }
});
test('导入拒绝坏坐标、丢失题库、负任务序号和过大文本', () => {
  let c = createTemplate(); c.layout.path[1]=c.layout.path[0]; assert.throws(()=>validateConfig(c));
  c = createTemplate(); c.tiles[1].deck='missing'; assert.throws(()=>validateConfig(c));
  c = createTemplate(); const s=roll(createGame(c),c,1); s.pending.card=-1; assert.throws(()=>validateState(s,c));
  assert.throws(()=>parseConfigJSON('x'.repeat(256001))); assert.throws(()=>parseSave('{}'));
  c = createTemplate(); c.decks.__proto__ = null; // inherited properties never become cards
  assert.ok(validateConfig(c));
  c=JSON.parse(JSON.stringify(createTemplate())); Object.defineProperty(c.decks,'__proto__',{value:{name:'坏',cards:['坏']},enumerable:true}); assert.throws(()=>validateConfig(c));
});
test('持久化主存档损坏时恢复备份，写入失败可观察', () => {
  const storage=memory(), repo=createRepository(storage), c=plain(), s=createGame(c);
  repo.save(c,s); repo.save(c,roll(s,c,2)); storage.setItem(SAVE_KEY,'broken'); const loaded=repo.load(); assert.equal(loaded.recovered,true); assert.deepEqual(loaded.payload.state,s);
  storage.setItem(BACKUP_KEY,'broken'); assert.ok(repo.load().error); assert.equal(storage.getItem(SAVE_KEY),'broken');
  const failing=createRepository({getItem:()=>null,setItem:()=>{throw Error('quota')}}); assert.throws(()=>failing.save(c,s),/quota/);
});
test('工作区保留每人独立题库，当前局快照不受之后修改影响', () => {
  const w=defaultWorkspace();w.taskMode='player';const active=startWorkspace(w,{seed:1}); const c=active.active.config;
  active.themes[0].tasks[0]='新任务'; assert.notEqual(c.decks.theme_0.cards[0],'新任务');
  const s=roll(active.active.state,c,1); assert.equal(s.pending.deck,c.playerDecks.p0);
  c.tiles[1].target='other'; const other=roll(createGame(c),c,1); assert.equal(other.pending.deck,c.playerDecks.p1);
  assert.deepEqual(validateWorkspace(active),active); assert.ok(buildConfig(w));
});
test('工作区备份恢复、导入棋盘和版本校验', () => {
  const m=memory(),repo=createWorkspaceRepository(m),w=defaultWorkspace(); repo.save(w); const n=startWorkspace(w); n.revision=1; repo.save(n);
  m.setItem(WORKSPACE_KEY,'{'); assert.equal(repo.load().recovered,true); assert.equal(repo.load().value.active,null);
  m.setItem(WORKSPACE_BACKUP_KEY,'{'); assert.ok(repo.load().error);
  assert.ok(workspaceFromBoard(createTemplate())); assert.throws(()=>validateWorkspace({...w,version:3}));
  const bad=startWorkspace(w); bad.players.pop(); assert.throws(()=>validateWorkspace(bad));
});
test('自定义稀疏与矩形路线可导入，未知字段不保留', () => {
  const c=plain(); c.layout={columns:4,rows:2,path:snakePath(4,2)}; c.tiles=c.tiles.slice(0,8); c.tiles[7]={type:'finish'}; c.extra='unused';
  const valid=validateConfig(c); assert.equal(valid.tiles.length,8); assert.equal(valid.extra,undefined); assert.equal(workspaceFromBoard(valid).baseBoard.layout.rows,2);
});

test('自定义棋盘导入保持逐格题库引用，不被玩家题库覆盖', () => {
  const c=createTemplate(); const w=workspaceFromBoard(c); assert.equal(w.taskMode,'tile');
  w.themes.find(t=>t.id==='play').tasks=['导入后编辑的挑战'];
  const built=buildConfig(w); assert.equal(built.playerDecks,undefined); assert.equal(built.tiles[3].deck,'play');
  const s=roll(createGame(built),built,3); assert.equal(s.pending.deck,'play'); assert.equal(s.pending.text,'导入后编辑的挑战');
});
