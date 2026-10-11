import {TaskParameterSettings} from '../arcade/TaskParameterSettings';
import {readTaskPreferences} from '../../core/taskParameters.js';
import { useState } from 'react';
import {MAP_SIZES} from '../../core/modes.js';
import type { Player } from '../../types';
import type { Workspace } from '../../core/workspace';
import type { CoreConfig } from '../../core/types';
interface Props { workspace: Workspace; onClose: () => void; onApply: (players: Player[], rules: CoreConfig['rules'], size: number, taskMode: Workspace['taskMode']) => Promise<unknown> }
export function SettingsModal({ workspace, onClose, onApply }: Props) {
  const [players, setPlayers] = useState(workspace.players.slice(0, 2));
  const [rules, setRules] = useState(workspace.baseBoard.rules);
  const [size, setSize] = useState(0);
  const [taskMode, setTaskMode] = useState(workspace.taskMode);
  const [busy, setBusy] = useState(false);
  const patchPlayer = (index: number, patch: Partial<Player>) => setPlayers(prev => prev.map((p, i) => i === index ? { ...p, ...patch } : p));
  return <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4 text-white"><section className="w-full max-w-md bg-[#1c1c1e] rounded-3xl p-6 max-h-[90dvh] overflow-y-auto">
    <h2 className="text-xl font-bold mb-4">玩家与规则</h2>
    <p className="text-sm mb-4">双人游戏 · 两人轮流操作</p>
    <div className="space-y-3 mb-4">{players.map((p, i) => <div key={p.id} className="flex gap-2"><input aria-label={`玩家 ${i + 1} 名称`} maxLength={24} className="input-field min-w-0 flex-1" value={p.name} onChange={e => patchPlayer(i, { name: e.target.value })}/><input aria-label={`玩家 ${i + 1} 颜色`} type="color" value={p.color} onChange={e => patchPlayer(i, { color: e.target.value })}/><select aria-label={`玩家 ${i + 1} 题库筛选`} className="input-field" value={p.role} onChange={e => patchPlayer(i, { role: e.target.value as Player['role'], themeId: workspace.themes.find(t => t.audience === 'common' || t.audience === e.target.value)?.id ?? null })}><option value="male">男方库</option><option value="female">女方库</option></select></div>)}</div>
    <label className="block text-sm mb-4">棋盘大小<select aria-label="棋盘大小" className="input-field ml-3" value={size} onChange={e => setSize(+e.target.value)}><option value={0}>保留当前布局</option>{MAP_SIZES.map(n=><option key={n} disabled={!!workspace.baseBoard.layout.image} value={n}>{n} × {n} · {n*n}格</option>)}</select></label>
    <label className="block text-sm mb-4">最多轮数（留空不限制）<input aria-label="原图玩法最多轮数" className="input-field" type="number" min={1} max={999} value={rules.maxRounds??''} onChange={e=>setRules(r=>({...r,maxRounds:e.target.value?Number(e.target.value):undefined}))}/></label><label className="block text-sm mb-4">任务抽取<select aria-label="任务抽取" className="input-field ml-3" value={taskMode} onChange={e => setTaskMode(e.target.value as Workspace['taskMode'])}><option value="player">按玩家选择的题库</option><option value="tile">按每个格子配置的题库</option></select></label>
    <label className="block text-sm mb-4">终点规则<select disabled={rules.navigation==='manual'} aria-label="终点规则" className="input-field ml-3" value={rules.finish} onChange={e => setRules(r => ({ ...r, finish: e.target.value as CoreConfig['rules']['finish'] }))}><option value="bounce">超过后折返</option><option value="stop">超过即可获胜</option><option value="exact">须恰好到达</option></select></label>
    <label className="block text-sm mb-3"><input disabled={rules.navigation==='manual'} type="checkbox" checked={rules.launchOnSix} onChange={e => setRules(r => ({ ...r, launchOnSix: e.target.checked }))}/> 掷出 6 才起飞（起飞后再掷一次）</label>
    <label className="block text-sm mb-4"><input disabled={rules.navigation==='manual'} type="checkbox" checked={rules.chainEffects} onChange={e => setRules(r => ({ ...r, chainEffects: e.target.checked }))}/> 移动后继续触发特殊格</label>
    <p className="text-xs text-gray-400 mb-5">{rules.navigation==='manual'?'自由棋盘的起点在图片编辑器设置；移动和终点条件由玩家按原图确认。应用会结束当前局。':'应用设置会结束当前对局，题库保留。'}</p>
    <TaskParameterSettings workspace={workspace}/><div className="flex gap-3"><button className="flex-1 rounded-full bg-white/10 py-3" onClick={onClose}>取消</button><button className="flex-1 rounded-full bg-white text-black py-3 font-bold disabled:opacity-40" disabled={busy || players.some(p => !p.name.trim())} onClick={async () => { setBusy(true); const result = await onApply(players, {...rules,taskParameters:readTaskPreferences()}, size, taskMode); setBusy(false); if (result) onClose(); }}>应用设置</button></div>
  </section></div>;
}
