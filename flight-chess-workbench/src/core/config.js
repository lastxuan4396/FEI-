import {validateTaskPreferences} from './taskParameters.js';
import {validateImageTexts} from './imageText.js';
import { BOARD_STYLES } from './boardLayouts.js';
/** Configuration is data only. Never evaluate imported text or HTML. */
export const CONFIG_VERSION = 1;
export const TILE_TYPES = ['start', 'finish', 'plain', 'task', 'move', 'home', 'extra', 'skip', 'double', 'taskScale', 'choice', 'random'];
export const TARGETS = ['self', 'other', 'both'];
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const int = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const text = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.length <= max;
function require(condition, message) { if (!condition) throw new Error(message); }
function readingRegion(value,image){
  if(value===undefined)return undefined;
  require(image&&record(value)&&[value.x,value.y,value.width,value.height].every(Number.isFinite)&&value.x>=0&&value.y>=0&&value.width>0&&value.height>0&&value.x+value.width<=1.000001&&value.y+value.height<=1.000001,'格内阅读范围须在原图内');
  return {x:value.x,y:value.y,width:value.width,height:value.height};
}
function tileNotes(value, image) {
  if (value === undefined) return undefined;
  require(image && Array.isArray(value) && value.length > 0 && value.length <= 6, '格外说明须属于图片棋盘，每格最多6条');
  return value.map(note => {
    require(record(note) && text(note.text,1,1000) && typeof note.reviewed === 'boolean', '格外说明文字或核对状态不正确');
    const r=note.region;
    require(record(r) && [r.x,r.y,r.width,r.height].every(Number.isFinite) && r.x>=0 && r.y>=0 && r.width>0 && r.height>0 && r.x+r.width<=1.000001 && r.y+r.height<=1.000001, '格外说明原图范围不正确');
    return {text:note.text,reviewed:note.reviewed,region:{x:r.x,y:r.y,width:r.width,height:r.height}};
  });
}

export function validateConfig(input) {
  require(record(input), '棋盘必须是 JSON 对象');
  require(input.version === CONFIG_VERSION, '不支持这个棋盘格式版本');
  require(text(input.id, 1, 80) && /^[a-zA-Z0-9_-]+$/.test(input.id), '棋盘 ID 只能包含字母、数字、下划线和短横线');
  require(text(input.title, 1, 60), '棋盘名称须为 1–60 字');
  require(typeof input.description === 'string' && input.description.length <= 300, '棋盘简介过长');
  require(record(input.layout), '缺少棋盘布局');
  const { columns, rows, path } = input.layout;
  require(input.layout.style === undefined || BOARD_STYLES.includes(input.layout.style), '棋盘外观类型不正确');
  require(int(columns, 2, 16) && int(rows, 2, 16), '棋盘行列数须为 2–16');
  require(Array.isArray(path) && path.length >= 4 && path.length <= 256, '路线须包含 4–256 格');
  const seen = new Set();
  for (const point of path) {
    require(Array.isArray(point) && point.length === 2 && int(point[0], 0, columns - 1) && int(point[1], 0, rows - 1), '路线坐标超出棋盘');
    const key = point.join(',');
    require(!seen.has(key), '路线不能重复经过同一个格子');
    seen.add(key);
  }
  if(input.layout.image !== undefined) {
    const image=input.layout.image;
    require(record(image) && typeof image.dataUrl==='string' && image.dataUrl.length<=750000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image.dataUrl), '图片须为本地 PNG/JPEG/WebP，最多 750 KB 编码');
    require(image.sourceDataUrl===undefined||typeof image.sourceDataUrl==='string'&&image.sourceDataUrl.length<=750000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image.sourceDataUrl),'原图备份格式不正确');
    validateImageTexts(image.texts);
    require(image.displayRotation===undefined||[0,90,180,270].includes(image.displayRotation), '图片显示转向只能为0/90/180/270度');
    require(int(image.width,1,4096) && int(image.height,1,4096), '图片尺寸不正确');
    require(Array.isArray(image.regions) && image.regions.length===path.length, '图片标记数量须与路线一致');
    for(const b of image.regions) require(record(b) && [b.x,b.y,b.width,b.height].every(Number.isFinite) && b.x>=0 && b.y>=0 && b.width>0 && b.height>0 && b.x+b.width<=1.000001 && b.y+b.height<=1.000001,'图片格框超出图片边界');
  }
  require(record(input.rules), '缺少规则设置');
  require(typeof input.rules.launchOnSix === 'boolean', '起飞规则须为布尔值');
  require(['bounce', 'stop', 'exact'].includes(input.rules.finish), '终点规则不正确');
  require(typeof input.rules.chainEffects === 'boolean', '连续特殊格规则须为布尔值');
  validateTaskPreferences(input.rules.taskParameters??{});
  require(input.rules.maxRounds===undefined||int(input.rules.maxRounds,1,999),'最多轮数须为1至999');
  require(int(input.rules.maxChain, 1, 32), '特殊格连续触发上限须为 1–32');
  require(input.rules.goal === undefined || ['race', 'cooperative', 'chase'].includes(input.rules.goal), '胜利目标不正确');
  require(Array.isArray(input.players) && input.players.length >= 2 && input.players.length <= 4, '支持 2–4 位玩家');
  require(input.rules.goal !== 'chase' || path.length >= 8, '追逐路线至少包含 8 格');
  require(input.rules.goal !== 'chase' || input.players.length === 2, '追逐模式限两位玩家');
  const manual = input.rules.navigation === 'manual';
  require(input.rules.navigation === undefined || manual, '行走方式不正确');
  require(input.rules.finishAllPlayers === undefined || typeof input.rules.finishAllPlayers === 'boolean', '全部到达规则须为布尔值');
  require(!input.rules.finishAllPlayers || manual, '全部到达规则仅用于原图手动棋盘');
  require(!input.rules.finishAllPlayers || input.players.length===2, '全部到达规则限两位玩家');
  require(!manual || input.layout.image && !input.rules.launchOnSix && !input.rules.chainEffects && (!input.rules.goal || input.rules.goal==='race'), '自由棋盘须使用原图、关闭自动起飞及连锁，并由玩家按原图判定');
  const ids = new Set();
  for (const player of input.players) {
    require(record(player) && text(player.id, 1, 40) && /^[a-zA-Z0-9_-]+$/.test(player.id), '玩家 ID 不正确');
    require(!ids.has(player.id), '玩家 ID 不能重复'); ids.add(player.id);
    require(text(player.name, 1, 24), '玩家名称须为 1–24 字');
    require(/^#[0-9a-fA-F]{6}$/.test(player.color), '玩家颜色须使用六位十六进制色值');
    require(player.start===undefined || manual && int(player.start,0,path.length-2), '玩家起点须为自由棋盘中的实际格，不能设在终点');
  }
  require(record(input.decks) && Object.keys(input.decks).length >= 1 && Object.keys(input.decks).length <= 20, '须包含 1–20 套任务库');
  let cardCount = 0;
  for (const [key, deck] of Object.entries(input.decks)) {
    require(/^[a-zA-Z0-9_-]{1,40}$/.test(key) && !['__proto__', 'constructor', 'prototype'].includes(key) && record(deck), '任务库 ID 不正确');
    require(text(deck.name, 1, 40), '任务库名称不正确');
    require(Array.isArray(deck.cards) && deck.cards.length > 0, '任务库不能是空的');
    require(deck.cards.every(card => text(card, 1, 1000)), '每条任务须为 1–1000 字的文本');
    cardCount += deck.cards.length;
  }
  require(cardCount <= 5000, '最多支持 5000 条任务');
  if (input.playerDecks !== undefined) {
    require(record(input.playerDecks), '玩家任务库设置不正确');
    for (const [id, deck] of Object.entries(input.playerDecks)) require(ids.has(id) && typeof deck === 'string' && Object.hasOwn(input.decks, deck), '玩家任务库引用不正确');
  }
  require(Array.isArray(input.tiles) && input.tiles.length === path.length, '格子数量须与路线一致');
  require(input.tiles[0]?.type === 'start' && input.tiles.at(-1)?.type === 'finish', '路线首尾须为起点和终点');
  input.tiles.forEach((tile, index) => {
    require(!manual || ['start','finish','task','plain'].includes(tile.type), '自由棋盘不自动执行移动或持续规则，请保留原文并手动裁定');
    require(record(tile) && TILE_TYPES.includes(tile.type), `第 ${index} 格类型不正确`);
    require(index === 0 || tile.type !== 'start', '只能有一个起点');
    require(index === path.length - 1 || tile.type !== 'finish', '只能有一个终点');
    require(tile.color === undefined || (typeof tile.color==='string' && /^#[0-9a-fA-F]{6}$/.test(tile.color)), `第 ${index} 格颜色不正确`);
    require(tile.text===undefined||text(tile.text,1,1000),`第 ${index} 格文字不正确`);
    require(tile.originalText===undefined||input.layout.image&&tile.type==='task'&&text(tile.originalText,1,1000),'随机图片格的原文备份不正确');
    require(tile.label === undefined || text(tile.label, 1, 40), `第 ${index} 格名称不正确`);
    tileNotes(tile.notes, input.layout.image);
    readingRegion(tile.readingRegion,input.layout.image);
    if(tile.playerTexts!==undefined) require(tile.type==='task'&&record(tile.playerTexts)&&Object.keys(tile.playerTexts).length===input.players.length&&input.players.every(p=>text(tile.playerTexts[p.id],1,1000)), '每位玩家的格内任务不正确');
    if (tile.type === 'task') {
      require(Object.hasOwn(input.decks, tile.deck), `第 ${index} 格引用了不存在的任务库`);
      require(tile.duration === undefined || int(tile.duration, 1, 86400), '任务时长须为 1–86400 秒');
      require(TARGETS.includes(tile.target), `第 ${index} 格任务对象不正确`);
    }
    if (tile.type === 'choice') {
      require(Array.isArray(tile.options) && tile.options.length >= 2 && tile.options.length <= 4, '岔路须有 2–4 个选项');
      tile.options.forEach(option => require(record(option) && text(option.label, 1, 40) && int(option.steps, -256, 256) && option.steps !== 0, '岔路选项不正确'));
    }
    if (tile.type === 'move') { require(tile.stepsFromDice === undefined || typeof tile.stepsFromDice === 'boolean', `第 ${index} 格点数移动方式不正确`); const limit=tile.stepsFromDice?85:256; require(int(tile.steps, -limit, limit) && tile.steps !== 0, `第 ${index} 格移动步数不正确`); }
    if (tile.type === 'taskScale') require([0.5, 2].includes(tile.factor), '下项任务倍率只支持减半或翻倍');
  });
  // Whitelist fields to avoid saving arbitrary extra data from imports.
  return {
    version: CONFIG_VERSION, id: input.id, title: input.title.trim(), description: input.description,
    layout: { columns, rows, path: path.map(point => [...point]), ...(input.layout.style ? { style: input.layout.style } : {}), ...(input.layout.image ? { image: { dataUrl:input.layout.image.dataUrl, ...(input.layout.image.displayRotation?{displayRotation:input.layout.image.displayRotation}:{}), width:input.layout.image.width, height:input.layout.image.height, regions:input.layout.image.regions.map(({x,y,width,height})=>({x,y,width,height})), ...(input.layout.image.sourceDataUrl?{sourceDataUrl:input.layout.image.sourceDataUrl}:{}), ...(input.layout.image.texts?{texts:validateImageTexts(input.layout.image.texts)}:{}) } } : {}) },
    rules: { launchOnSix: input.rules.launchOnSix, finish: input.rules.finish, chainEffects: input.rules.chainEffects, maxChain: input.rules.maxChain,...(input.rules.taskParameters?{taskParameters:structuredClone(input.rules.taskParameters)}:{}),...(input.rules.maxRounds?{maxRounds:input.rules.maxRounds}:{}), ...(input.rules.goal ? { goal: input.rules.goal } : {}), ...(manual?{navigation:'manual'}:{}), ...(input.rules.finishAllPlayers?{finishAllPlayers:true}:{}) },
    players: input.players.map(({ id, name, color, start }) => ({ id, name: name.trim(), color, ...(start!==undefined?{start}:{}) })),
    decks: Object.fromEntries(Object.entries(input.decks).map(([key, deck]) => [key, { name: deck.name.trim(), cards: deck.cards.map(card => card.trim()) }])),
    tiles: input.tiles.map(tile => ({ type: tile.type, ...(tile.text?{text:tile.text}:{}), ...(tile.originalText?{originalText:tile.originalText}:{}), ...(tile.readingRegion?{readingRegion:readingRegion(tile.readingRegion,input.layout.image)}:{}), ...(tile.notes?{notes:tileNotes(tile.notes,input.layout.image)}:{}), ...(tile.playerTexts?{playerTexts:{...tile.playerTexts}}:{}), ...(tile.color ? {color:tile.color} : {}), ...(tile.label ? { label: tile.label } : {}), ...(tile.type === 'task' ? { deck: tile.deck, target: tile.target, ...(tile.duration ? { duration: tile.duration } : {}) } : {}), ...(tile.type === 'move' ? { steps: tile.steps, ...(tile.stepsFromDice?{stepsFromDice:true}:{}) } : {}), ...(tile.type === 'taskScale' ? {factor:tile.factor} : {}), ...(tile.type === 'choice' ? { options: tile.options.map(({ label, steps }) => ({ label, steps })) } : {}) })),
    ...(input.playerDecks ? { playerDecks: { ...input.playerDecks } } : {})
  };
}

export function parseConfigJSON(source) {
  if (typeof source !== 'string' || source.length > 2_000_000) throw new Error('棋盘文件过大，最多支持 2 MB 文本');
  let data;
  try { data = JSON.parse(source); } catch { throw new Error('JSON 格式不正确，请检查逗号和引号'); }
  return validateConfig(data);
}

export function snakePath(columns, rows) {
  return Array.from({ length: rows }, (_, y) => Array.from({ length: columns }, (_, i) => [y % 2 ? columns - 1 - i : i, y])).flat();
}

export function createTemplate(size = 6) {
  const path = snakePath(size, size);
  const tiles = path.map((_, index) => index === 0 ? { type: 'start' } : index === path.length - 1 ? { type: 'finish' } : { type: 'task', deck: index % 3 === 0 ? 'play' : 'talk', target: index % 4 === 0 ? 'both' : 'self' });
  const specials = { 5: { type: 'move', steps: 2 }, 9: { type: 'extra' }, 13: { type: 'move', steps: -2 }, 17: { type: 'double' }, 21: { type: 'skip' }, 26: { type: 'home' }, 30: { type: 'plain' } };
  for (const [index, tile] of Object.entries(specials)) if (+index < path.length - 1) tiles[index] = tile;
  return validateConfig({
    version: CONFIG_VERSION, id: `demo-${size}`, title: size === 6 ? '轻松双人局' : '长线探索局',
    description: '轮流走棋，聊聊彼此。每项任务都可以选择完成或跳过。',
    layout: { columns: size, rows: size, path },
    rules: { launchOnSix: false, finish: 'bounce', chainEffects: true, maxChain: 12 },
    players: [{ id: 'a', name: '玩家 A', color: '#e26b49' }, { id: 'b', name: '玩家 B', color: '#497f88' }],
    decks: {
      talk: { name: '聊聊彼此', cards: ['分享最近一件让你开心的小事。', '说出对方的三个优点。', '聊聊你最想一起去的一个地方。', '各说一个想尝试的新爱好。', '描述一次印象深刻的旅行。', '说说今天最值得感谢的一件事。', '分享一个童年趣事。', '一起计划下一次休息日。'] },
      play: { name: '默契挑战', cards: ['不出声，用动作表演一种动物，让对方猜。', '各自在心里选一种颜色，再同时说出来。', '用手指在对方手心写一个字，让对方猜。', '石头剪刀布，三局两胜。', '轮流接龙说水果名称，持续 30 秒。', '各自猜对方此刻最想吃的食物。', '用三个词描述你们的共同回忆。', '一起拍一张笑脸合照，也可以用画画代替。'] }
    }, tiles
  });
}

export function tileLabel(tile, config) {
  if (tile.label) return tile.label;
  return ({ start: '起点', finish: '终点', plain: '休息一下', task: config.decks[tile.deck]?.name, move: tile.stepsFromDice ? `${tile.steps>0?'前进':'后退'}点数${Math.abs(tile.steps)===1?'':`×${Math.abs(tile.steps)}`}` : tile.steps > 0 ? `前进 ${tile.steps}` : `后退 ${-tile.steps}`, home: '返回起点', extra: '再掷一次', skip: '暂停一轮', double: '下次翻倍', taskScale:tile.factor===2?'下项任务翻倍':'下项任务减半', choice: '岔路选择', random: '随机事件' })[tile.type];
}
