import {imageTaskLevel,validateImageLevels} from './imageLevels.js';
import {IMAGE_TASK_TEXTS} from './imageTaskLibrary.js';
import { referenceLayout } from './boardLayouts.js';
import { createTemplate, validateConfig } from './config.js';
export const MODES = [
  { id: 'classic', name: '经典互动', tag: '双人', description: '十字棋盘、四角起飞区，先到中心获胜。', detail: '参考十字飞行棋。每人一个棋子，共用一条路线；四角起飞区为布局标记。可配置起飞、终点折返及特殊格连锁。', color: '#e26b49' },
  { id: 'spiral', name: '螺旋竞速', tag: '双人', description: '从外圈向中心前进，穿插加速与回退。', detail: '空心螺旋路线，外圈逐步进入内圈。到达或超过中心终点即可获胜，适合一局轻松竞速。', color: '#6c9cce' },
  { id: 'choice', name: '岔路探险', tag: '双人', description: '选择稳步前进或捷径挑战，决定自己的路线。', detail: '到岔路格先选路线。稳步前进 2 格至休息格；挑战前进 5 格至限时共同任务。', color: '#a589d5' },
  { id: 'cooperative', name: '合作闯关', tag: '双人', description: '共用一枚棋子，轮流操作，一起到达终点。', detail: '折返长路线，全队位置同步。任务由所有人共同完成，到达终点时全队获胜。', color: '#6bb49c' },
  { id: 'chase', name: '双人追逐', tag: '仅 2 人', description: '逃跑者领先 6 格；追上获胜，逃到终点获胜。', detail: '外圈转入内圈，双起点标记。玩家 1 是逃跑者，玩家 2 是追逐者。追逐者最终位置达到或超过逃跑者就获胜。', color: '#d29b51' },
  { id: 'events', name: '随机事件', tag: '双人', description: '频繁抽取前进、后退、再掷和翻倍事件。', detail: '弯曲路线，蓝色事件格即时抽取效果。掷骰和事件使用同一可恢复随机种子，撤销可复现。', color: '#da789d' }
];
export const EXTRA_DECKS = {
  creative: { name: '创意表演', cards: ['用三个动作演出一部电影，让大家猜。','各画一个表情，交换后编一段对白。','用桌上一个物品编一段广告。','模仿一种天气，让其他人猜。','轮流用一个词讲完一个小故事。','为今天的游戏起一个电影片名。','用不超过十个字介绍自己。','即兴给一个普通物品起新名字。'] },
  memory: { name: '回忆与计划', cards: ['分享最近学到的一件新事。','回忆一次大家都笑起来的时刻。','各推荐一本书、电影或一首歌。','说一个今年想完成的小目标。','一起选出下一次聚会的主题。','描述一个你喜欢的季节。','分享一件生活中的小习惯。','说一个未来想一起尝试的活动。'] },
  team: { name: '共同挑战', cards: ['所有人同时说一种动物，试试能否一致。','轮流说一种水果，不能重复。','一起编一个包含三个随机词的小故事。','各画一笔，共同完成一幅画。','每人说对下一位玩家的一个感谢。','一起规划一份简单的周末菜单。','两人比划，其他人猜一个成语。','全队依次说数字，遇到三的倍数拍手。'] },
  quick: { name: '限时小挑战', cards: ['在计时结束前轮流说城市名称。','在计时结束前找出五件相同颜色的物品。','用五个词描述一个地方，让大家猜。','轮流说带有同一个字的词语。','给一个普通物品想出三种新用途。','用手势表达一句常用的话。','一起给下一局设计一个任务。','每人用一句话讲一个轻松的小笑话。'] }
};
export function spiralPath(size) {
  const result = []; let left = 0, right = size - 1, top = 0, bottom = size - 1;
  while (left <= right && top <= bottom) {
    for (let x = left; x <= right; x++) result.push([x, top]); top++;
    for (let y = top; y <= bottom; y++) result.push([right, y]); right--;
    if (top <= bottom) { for (let x = right; x >= left; x--) result.push([x, bottom]); bottom--; }
    if (left <= right) { for (let y = bottom; y >= top; y--) result.push([left, y]); left++; }
  }
  return result;
}
// Distribute the entire supplied image pool across mixed decks, without repeating
// it six times. Each deck blends images; the task's original provenance stays in
// imageTaskLibrary and is shown when the exact source text is drawn.
export const IMAGE_MODE_DECKS=Object.fromEntries(Array.from({length:6},(_,i)=>[`image_mix_${i+1}`,{name:`图片混合题库 ${i+1}`,cards:IMAGE_TASK_TEXTS.filter((_,n)=>n%6===i)}]));
export function needsImageModeUpdate(board){return !board.layout.image&&MODES.some(m=>board.id===`mode-${m.id}`)&&!Object.keys(board.decks).some(key=>key.startsWith('image_mix_'));}
export const MAP_SIZES=[6,7,8,9,10,12,14,16];
export function mapSizeOptions(board){const l=board.layout;return !l.image&&['grid-snake','grid-spiral','extended-reference'].includes(l.style)?{size:l.columns,shape:l.style==='grid-spiral'?'spiral':l.style==='grid-snake'?'snake':'reference'}:{size:0,shape:'reference'};}
export function createMode(id,options={}) {
  const size=options.size??0,shape=options.shape??'reference';
  if(size!==0&&!MAP_SIZES.includes(size)||!['reference','snake','spiral'].includes(shape))throw Error('请选择提供的地图尺寸与路线');
  const levels=validateImageLevels(options.levels);
  const mode = MODES.find(m => m.id === id); if (!mode) throw new Error('未知游戏模式');
  const config = createTemplate(size|| (id === 'cooperative' ? 6 : 7));
  config.id = `mode-${id}`; config.title = mode.name; config.description = mode.detail;
  config.decks = { ...config.decks, ...structuredClone(EXTRA_DECKS) };
  config.rules.goal = id === 'cooperative' ? 'cooperative' : id === 'chase' ? 'chase' : 'race';
  if (id !== 'classic') {
    config.rules.finish = 'stop';
    
    const keys = ['talk', 'play', 'creative', 'memory', 'team', 'quick'];
    config.tiles = config.layout.path.map((_, i) => i === 0 ? { type: 'start' } : i === config.layout.path.length - 1 ? { type: 'finish' } : i % 4 === 0 ? { type: 'plain' } : { type: 'task', deck: keys[i % keys.length], target: id === 'cooperative' ? 'both' : i % 5 === 0 ? 'other' : 'self', ...(i % 3 === 0 ? { duration: 30 } : {}) });
    for (const [index, tile] of Object.entries({ 5: { type: 'move', steps: 3 }, 12: { type: 'move', steps: -2 }, 20: { type: 'extra' }, 28: { type: 'double' } })) if (+index < config.tiles.length - 1) config.tiles[index] = tile;
  }
  config.layout = size?{columns:size,rows:size,path:shape==='spiral'?spiralPath(size):config.layout.path,style:shape==='reference'?'extended-reference':shape==='spiral'?'grid-spiral':'grid-snake'}:referenceLayout(id);
  if(size){config.title+=` · ${size*size}格`;config.description+=` ${shape==='reference'?'沿参考棋盘形状延伸':shape==='spiral'?'留白螺旋':'舒展折线'}，共${size*size}格（含起终点）。`;}
  if (id === 'choice') for (let i=4;i+5<config.tiles.length-1;i+=10) {
    config.tiles[i] = { type: 'choice', options: [{ label: '稳步前进 2 格', steps: 2 }, { label: '捷径挑战 +5 格', steps: 5 }] };
    config.tiles[i + 2] = { type: 'plain', label: '稳步休息站' };
    config.tiles[i + 5] = { type: 'task', deck: 'quick', target: 'both', duration: 30, label: '捷径挑战站' };
  }
  if (id === 'events') for (let i = 2; i < config.tiles.length - 1; i += 3) config.tiles[i] = { type: 'random' };
  const selectedDecks=Object.fromEntries(Object.entries(IMAGE_MODE_DECKS).map(([key,deck])=>[key,{name:deck.name,cards:deck.cards.filter(text=>levels.includes(imageTaskLevel(text)))}]).filter(([,deck])=>deck.cards.length));
  const imageKeys=Object.keys(selectedDecks);let taskIndex=0;
  config.tiles=config.tiles.map(tile=>tile.type==='task'?{...tile,deck:imageKeys[taskIndex++%imageKeys.length]}:tile);
  config.decks=structuredClone(selectedDecks);
  return validateConfig(config);
}
