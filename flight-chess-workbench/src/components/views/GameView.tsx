import {useContext} from 'react';
import {BoardOnlineContext} from '../BoardOnlineContext';
import {MapActivitiesContext} from '../MapActivities';
import {OngoingEffects} from '../OngoingEffects';
import { useRef, useState } from 'react';
import { ArrowLeft, Undo2, RefreshCw } from 'lucide-react';
import { Player } from '../../types';
import { CoreConfig, EngineState, EngineAction } from '../../core/types';
import { GameBoard } from '../GameBoard';
import {MapGameControls} from '../MapGameControls';
import { Dice } from '../Dice';
interface Props { roomPanel?:React.ReactNode;players: Player[]; config: CoreConfig; game: EngineState; onAction: (action: EngineAction) => Promise<EngineState | null>; onBack: () => void; saveStatus: string;mapFullscreen:boolean;fullscreenRequest:number;onExpandedChange:(value:boolean)=>void;onShuffle:()=>Promise<boolean|null>;onShowResult:()=>void }
export function GameView({ roomPanel,players, config, game, onAction, onBack, saveStatus,mapFullscreen,fullscreenRequest,onExpandedChange,onShuffle,onShowResult }: Props) {
  const online=useContext(BoardOnlineContext);
  const [rolling, setRolling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const lock = useRef(false);
  const effectsRef = useRef<HTMLDivElement>(null);
  const roll = async () => {
    if (lock.current || game.phase !== 'ready'||online&&!online.allowed('ROLL')) return;
    lock.current = true; setRolling(true);
    try { await onAction({ type: 'ROLL' }); }
    finally { setRolling(false); lock.current = false; }
  };
  const refreshMap = async () => {
    if (lock.current) return null;
    lock.current = true; setRefreshing(true);
    try { return await onShuffle(); }
    finally { setRefreshing(false); lock.current = false; }
  };
  const ongoingPanel=<OngoingEffects taskPreferences={config.rules.taskParameters??{}} taskPool={[...new Set(config.layout.image?config.tiles.filter(t=>t.type==='task').flatMap(t=>t.text?[t.text]:[]):Object.values(config.decks).flatMap(d=>d.cards))]} dark draws={game.effectDraws} draft={game.effectDraft} effects={game.effects} counter={game.rounds} players={config.players} busy={rolling} finished={game.phase==='finished'} act={onAction} turnLabel="每完成一次掷骰回合算1回合，两人的两次行动算1轮。"/>;
  return <MapActivitiesContext.Provider value={ongoingPanel}><div className="fixed inset-0 z-50 bg-[#101116] text-white overflow-y-auto">
    <div className="game-layout mx-auto min-h-full flex flex-col px-4 py-3">
      <header className="flex items-center gap-3 mb-3">
        <button onClick={onBack} aria-label="保存并返回" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft size={20}/></button>
        <div className="flex-1"><h2 className="font-bold">{config.title}</h2><p className="text-xs text-gray-400">第 {game.rounds + 1} 回合 · {saveStatus}</p></div>
        <button disabled={!game.undo.length || rolling||!!online&&!online.allowed('UNDO')} onClick={() => onAction({ type: 'UNDO' })} className="text-xs text-gray-300 disabled:opacity-30 flex gap-1 items-center"><Undo2 size={16}/>撤销</button>
      </header>
      {roomPanel}
      <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: `repeat(${players.length},minmax(0,1fr))` }}>
        {players.map((p, i) => <div key={p.id} className="rounded-xl px-2 py-2 border text-center" style={{ borderColor: game.turn === i ? p.color : '#333', background: game.turn === i ? `${p.color}20` : '#1c1c1e' }}><div className="text-sm font-bold truncate" style={{ color: p.color }}>{p.name}</div><div className="text-xs text-gray-400">{game.finishOrder?.includes(game.players[i].id)?`第${game.finishOrder.indexOf(game.players[i].id)+1}位到达 · 等待`:`第 ${p.step} 格`}{game.players[i].taskFactor&&<span data-next-task-factor={game.players[i].taskFactor}> · 下项任务{game.players[i].taskFactor===2?'翻倍':'减半'}</span>}{config.rules.goal === 'chase' ? i === 0 ? ' · 逃跑' : ' · 追逐' : ''}</div></div>)}
      </div>
      <div className={`game-play-columns ${config.rules.navigation==='manual'?'manual-game':''}`}>
      <div className="min-w-0">
      <div className="game-map-refresh"><div><b>换一组格子任务</b><small>保留路线，按所选题库随机换题；刷新会重新开局。</small></div><button disabled={rolling||refreshing||!!online&&!online.allowed('SHUFFLE')} onClick={()=>void refreshMap()} aria-label="刷新地图 · 随机格子"><RefreshCw size={16}/>{refreshing?'正在刷新…':'刷新地图'}</button></div>
      <div className="game-board-frame mx-auto w-full"><GameBoard expandKey={fullscreenRequest} fullscreenControls={<MapGameControls key={game.id} config={config} game={game} rolling={rolling||refreshing} roll={roll} onAction={onAction} onShuffle={refreshMap}/>} onExpandedChange={onExpandedChange} config={config} players={players} currentTurn={game.turn} moveKey={game.phase==='move'?game.revision:undefined} onMoveTo={game.phase==='move'&&(!online||online.allowed('MOVE_TO_CELL'))?position=>{void onAction({type:'MOVE_TO_CELL',position});}:undefined}/></div>
      <p className="text-[11px] text-gray-400 mt-3 text-center">{config.rules.navigation==='manual'?'① 掷骰子 → ② 点落点 → ③ 确认移动。复杂条件按原图确认。':config.rules.goal === 'cooperative' ? '轮流移动共同棋子 · 全队到达终点即通关' : config.rules.goal === 'chase' ? '逃跑者到达终点获胜 · 追逐者追上或超过获胜' : '从起点按格子编号行走'} {config.rules.navigation!=='manual'&&<>· {config.rules.finish === 'bounce' ? '超过终点往回走' : config.rules.finish === 'exact' ? '须恰好到达终点' : '到达或超过终点即可获胜'}</>}</p>
      </div>
      <aside className="game-turn-panel min-w-0">
      {game.phase==='finished'&&<div className="rounded-2xl bg-[#c9dfb7]/10 border border-[#c9dfb7]/30 p-4 mt-3"><b>{game.limitReached?'已达到回合上限':game.winner==='team'?'全队通关':'本局已结束'}</b><p className="text-sm text-gray-300 mt-2 leading-relaxed">胜负已保存，计时和计次任务可以继续处理。</p><button onClick={onShowResult} className="mt-3 px-4 py-2 rounded-full border border-gray-500 text-sm">查看本局结算</button></div>}
      <section className="mt-5 rounded-3xl bg-white/5 p-4 flex flex-col items-center">
        <p className="text-sm mb-5" style={{ color: players[game.turn].color }}>{game.phase === 'finished' ? game.limitReached?'达到设定轮数，本局已结束':'本局已结束' : `${players[game.turn].name} 的回合`}</p>
        <button data-map-fullscreen={mapFullscreen} id="roll-btn" onClick={roll} disabled={rolling || refreshing || game.phase !== 'ready'||!!online&&!online.allowed('ROLL')} aria-label="掷骰子" className="disabled:opacity-50 pb-4"><Dice isRolling={rolling} result={game.lastMove?.dice ?? null}/><span className="roll-label">{rolling?'掷骰中…':game.phase==='ready'?'掷骰子':'本轮骰子'}</span></button>
        <span className="text-xs text-gray-400">{game.phase === 'move' ? `掷出${game.lastMove?.dice}点 · 请在原图点选落点` : game.phase === 'ready' ? config.rules.navigation==='manual'?'点击骰子，随后点选落点':'点击骰子前进' : game.phase === 'review' ? '请先阅读并确认原图格内容' : game.phase === 'task' ? '请确认当前任务' : game.phase === 'choice' ? '请先选择路线' : '可以返回主页开始新局'}</span>
      </section>
      {config.rules.finishAllPlayers&&game.finishOrder?.length===1&&<p className="mt-3 text-xs text-gray-300">一位已到达终点，另一位继续；两人确认完成后结束。</p>}
      <div className="game-secondary-controls">
        <button className="game-effects-link" onClick={()=>{effectsRef.current?.scrollIntoView({block:'start'});effectsRef.current?.focus({preventScroll:true});}}>持续卡{game.effectDraft?' · 有一组待选择':game.effects?.length?` · 已记录${game.effects.length}张`:''}</button>
        <details className="text-xs text-gray-400"><summary className="cursor-pointer">最近记录</summary><ol className="space-y-1">{game.log.slice(-5).map((entry, i) => <li key={`${entry.revision}-${i}`}>{entry.text}</li>)}</ol></details>
      </div>
      </aside>
      </div>
      <div ref={effectsRef} className="game-effects-area" tabIndex={-1} aria-label="持续卡管理">
        {ongoingPanel}
      </div>
    </div>
  </div></MapActivitiesContext.Provider>;
}
