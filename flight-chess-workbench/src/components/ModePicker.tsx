import {useEffect,useState} from 'react';
import {IMAGE_LEVEL_LABELS} from '../core/imageLevels.js';
import { BoardArtwork } from './BoardArtwork';
import { createMode,MAP_SIZES,mapSizeOptions } from '../core/modes.js';
import type {CoreConfig} from '../core/types';
import { MODES } from '../core/modes.js';
interface Props { selected: string; board:CoreConfig; active: boolean; onSelect: (id: string,options?:{size:number;shape:'reference'|'snake'|'spiral'}) => void; levels:number[]; onLevels:(levels:number[])=>Promise<boolean|null> }
export function ModePicker({ selected,board, active, onSelect, levels, onLevels }: Props) {
  const [selectedLevels,setSelectedLevels]=useState(levels),[applying,setApplying]=useState(false);
  useEffect(()=>setSelectedLevels(levels),[levels]);
  async function chooseLevels(next:number[]){if(applying)return;setSelectedLevels(next);setApplying(true);try{if(!await onLevels(next))setSelectedLevels(levels);}finally{setApplying(false);}}
  const modeId = selected.startsWith('demo-') ? 'classic' : selected.replace('mode-', '');
  const mode = MODES.find(m => m.id === modeId);
  const [lengths,setLengths]=useState<Record<string,number>>({});
  return <section className="mb-6" aria-label="游戏模式">
    <div className="flex items-center justify-between mb-3"><h2 className="font-bold">选择玩法</h2><span className="text-[10px] text-gray-500">6 个模式 · 图片混合题库</span></div>
    <p className="text-xs text-gray-400 mb-3">每种棋盘都有原版与八种延伸长度。先选格数，再使用喜欢的形状；题库在“题库”页删改和自选。</p><fieldset className="image-level-picker"><legend>题库等级 · 可多选混合</legend><div>{IMAGE_LEVEL_LABELS.map(level=><label key={level.id}><input type="checkbox" aria-label={`${level.id}级 ${level.name}`} checked={selectedLevels.includes(level.id)} disabled={applying||selectedLevels.length===1&&selectedLevels.includes(level.id)} onChange={()=>void chooseLevels(selectedLevels.includes(level.id)?selectedLevels.filter(n=>n!==level.id):[...selectedLevels,level.id].sort())}/><span>{level.id}级 · {level.name}</span></label>)}</div><p>从勾选等级中随机抽题。分级为初步标注，请按原图核对。{active&&'当前局保持原题库，筛选用于新局。'}</p></fieldset><div className="mode-catalog">{MODES.map(m => {const size=lengths[m.id]??mapSizeOptions(board).size;return <article key={m.id} className={`mode-card ${modeId===m.id?'selected':''}`} style={{borderColor:modeId===m.id?m.color:undefined}}><button disabled={applying} data-mode={m.id} aria-pressed={modeId===m.id} onClick={()=>onSelect(m.id,{size,shape:'reference'})}><div className="mode-card-heading"><b style={{color:m.color}}>{m.name}</b><small>{m.tag}</small></div><div className="mode-preview"><BoardArtwork config={createMode(m.id,{size,shape:'reference'})} miniature/></div><p>{m.description}</p></button><div className="mode-card-length"><label>路线长度<select aria-label={`${m.name}路线长度`} value={size} disabled={applying} onChange={e=>setLengths(v=>({...v,[m.id]:Number(e.target.value)}))}><option value={0}>原版 · {createMode(m.id).tiles.length}格</option>{MAP_SIZES.map(n=><option key={n} value={n}>{n*n}格 · {n<=7?'轻松':n<=10?'长线':'超长'}</option>)}</select></label><button disabled={applying} onClick={()=>onSelect(m.id,{size,shape:'reference'})}>使用此棋盘</button></div></article>;})}</div>
    <p className="text-xs text-gray-400 leading-relaxed mt-3">{mode?.detail ?? '当前使用导入的地图；点选预设可切换。'}{active && ' 切换模式会结束当前局。'}</p>
  </section>;
}
