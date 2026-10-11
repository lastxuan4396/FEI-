import {BoardOnlineContext} from './components/BoardOnlineContext';
import {BoardRoomPanel} from './components/BoardRoomPanel';
import {OngoingEffects} from './components/OngoingEffects';
import {isOngoingText} from './core/ongoingEffects.js';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Github, Dice5, ArrowUpRight, ImagePlus, FileInput } from 'lucide-react';
import { useGameState } from './hooks/useGameState';
import { TaskEventData } from './types';
import { HomeView } from './components/views/HomeView';
import { GameView } from './components/views/GameView';
import { ThemesView } from './components/views/ThemesView';
import { ThemeSelectorModal } from './components/modals/ThemeSelectorModal';
import { TaskCardModal } from './components/modals/TaskCardModal';
import { WinModal } from './components/modals/WinModal';
import { BottomNav } from './components/BottomNav';
import { ThemeCreateModal } from './components/modals/ThemeCreateModal';
import { ThemeEditorModal } from './components/modals/ThemeEditorModal';
import { AiImportModal } from './components/modals/AiImportModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { MapCodeModal } from './components/modals/MapCodeModal';
import { ImageRuleReviewModal } from './components/modals/ImageRuleReviewModal';
import { ImageMapModal } from './components/modals/ImageMapModal';
import { ModePicker } from './components/ModePicker';
import { QuickMapPicker } from './components/QuickMapPicker';
import {MapSizePicker} from './components/MapSizePicker';
import { ChoiceModal } from './components/modals/ChoiceModal';
import {textForRegion} from './core/imageText.js';
import { boardGeometry } from './core/boardLayouts.js';
import {playerCoordinates} from './core/playerCoordinates.js';
import {imageDisplay} from './core/imageDisplay.js';
import { buildConfig } from './core/workspace.js';

const ArcadeView=lazy(()=>import('./components/arcade/ArcadeView').then(m=>({default:m.ArcadeView})));

function download(value: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function App() {
  const api = useGameState();
  const { state, active, workspace, notice, saveStatus } = api;
  const [arcadeOpen,setArcadeOpen]=useState(()=>(!location.search.includes('boardRoom=')&&!!sessionStorage.getItem('flight-chess.arcade.open'))||(location.hash==='#games'&&!location.search.includes('boardRoom=')));
  const [themePlayer, setThemePlayer] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingTheme, setEditingTheme] = useState<string | null>(null);
  const [importTheme, setImportTheme] = useState<string | null>(null);
  const [codeImport,setCodeImport]=useState(false);
  const [imageImport,setImageImport]=useState(false);
  const [mapFullscreen,setMapFullscreen]=useState(false);
  const [dismissedResult,setDismissedResult]=useState<string|null>(null);
  useEffect(()=>{if(active?.state.phase!=='finished')setDismissedResult(null);},[active?.state.phase,active?.state.id]);
  const [fullscreenRequest,setFullscreenRequest]=useState(0);
  const requestFullscreen=()=>setFullscreenRequest(n=>n+1);
  useEffect(()=>{if(state.view!=='game'){setFullscreenRequest(0);setMapFullscreen(false);}},[state.view]);
  const [settings, setSettings] = useState(false);
  const [exportError, setExportError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const pending = active?.state.pending;
  const taskData: TaskEventData | null = pending && active ? {
    type: 'trap', initiatorPlayerId: active.state.turn, executorPlayerId: active.config.players.findIndex(p => p.id === pending.targets[0]),
    title: '任务卡', subtitle: `第 ${pending.position} 格 · ${active.config.decks[pending.deck].name}`, icon: 'handshake', color: 'text-[#BF5AF2]', task: pending.text, taskSourceId: pending.deck
  } : null;
  const taskImage=active?.config.layout.image;
  const taskRegion=taskImage&&pending?active!.config.tiles[pending.position].readingRegion??taskImage.regions[pending.position]:undefined;
  const taskReadings=taskImage&&taskRegion?textForRegion(taskImage.texts,taskRegion):[];
  const sourceImage=taskImage&&pending&&taskRegion?{dataUrl:taskImage.dataUrl,width:taskImage.width,height:taskImage.height,displayRotation:taskImage.displayRotation,region:taskRegion,notes:active!.config.tiles[pending.position].notes,randomized:!!active!.config.tiles[pending.position].originalText,needsReview:!active!.config.tiles[pending.position].text||!taskReadings.length||taskReadings.some(l=>!l.reviewed)}:undefined;
  const executorName = pending && active ? pending.targets.map(id => active.config.players.find(p => p.id === id)?.name).join('、') : '';
  const selectedPlayer = workspace.players[themePlayer ?? 0] ?? workspace.players[0];
  useEffect(() => {
    if(arcadeOpen)return;
    const hooks = window as unknown as { render_game_to_text?: () => string; advanceTime?: (ms: number) => void };
    hooks.render_game_to_text = () => JSON.stringify({ view: state.view, coordinateSystem: active?.config.layout.image?'显示图片左上为原点，单位为图片像素，x 向右，y 向下；coordinate为转向后的格中心，sourceCoordinate为原图格中心；位置编号仅标识图片格':'左上为原点，x 向右，y 向下；棋子按路线编号移动', saveStatus, game: active ? { mapSize:{columns:active.config.layout.columns,rows:active.config.layout.rows,cells:active.config.tiles.length,style:active.config.layout.style}, ...(active.config.layout.image?{imageSize:imageDisplay(active.config.layout.image),displayRotation:active.config.layout.image.displayRotation??0}:{}), effectDraws:active.state.effectDraws,effectDraft:active.state.effectDraft,effects:active.state.effects,effectTurns:active.state.rounds,revision: active.state.revision, phase: active.state.phase, turn: active.state.turn, players: active.state.players, pending: active.state.pending, choice: active.state.choice, review: active.state.review, goal: active.config.rules.goal ?? 'race',navigation:active.config.rules.navigation??'route', boardStyle: active.config.layout.image?'image':boardGeometry(active.config).style ?? 'custom', positions: playerCoordinates(active.config,active.state.players), winner: active.state.winner, finishOrder:active.state.finishOrder, lastMove: active.state.lastMove } : null });
    hooks.advanceTime = () => { /* Turn-based: rules commit once, animations do not advance rules. */ };
    return () => { delete hooks.render_game_to_text; delete hooks.advanceTime; };
  }, [active, state.view, saveStatus, arcadeOpen]);

  return <BoardOnlineContext.Provider value={api.online.room?{allowed:api.online.allowed,freeTimer:api.online.snapshot?.freeTimer,serverOffset:api.online.serverOffset,timerAction:(mode,duration)=>{void api.online.send({type:'FREE_TIMER',mode,duration});}}:null}><div className="workbench-app h-[100dvh] w-full flex justify-center bg-[#101116] text-white">
    <div className="workbench-panel w-full max-w-[520px] h-full flex flex-col">
      <header className="workbench-header pt-6 pb-3 px-6 shrink-0 flex justify-between items-center"><div className="workbench-brand"><Dice5 size={29}/><div><p className="text-[10px] text-gray-500 tracking-widest">FLIGHT CHESS · 可编辑任务</p><h1 className="text-2xl font-bold mt-1">飞行棋工作台</h1></div></div><a href="https://github.com/woniu9524/couple-flying-chess" target="_blank" rel="noreferrer" title="上游开源项目" className="text-gray-500"><Github size={22}/></a></header>
      <main className="workbench-main flex-1 min-h-0 px-6 overflow-y-auto pb-4">
        {state.view === 'home' && <>
          <section className="workbench-intro"><p>从一张棋盘，开始一段好时光</p><h2>今晚，开一局吧。</h2><span>选择原图棋盘，或试试八种轻松的新玩法。</span></section>
          <button id="arcade-btn" className="workbench-arcade-link" onClick={()=>{sessionStorage.setItem('flight-chess.arcade.open','lobby');setArcadeOpen(true);}}><span><Dice5 size={24}/><b>探索八种新玩法</b></span><p className="text-xs text-gray-300 mt-1">转盘 · 卡牌 · 合作 · 剧情 · 宾果 · 投票 · 解谜 · 经营</p><ArrowUpRight size={21}/></button>
          <div className="home-edit-actions"><button onClick={()=>setImageImport(true)} aria-label="＋ 导入图片地图"><ImagePlus size={17}/>{workspace.baseBoard.layout.image?'编辑 / 上传地图图片':'上传地图图片'}</button><button onClick={()=>setCodeImport(true)} aria-label="粘贴地图代码 · 一键导入"><FileInput size={17}/>导入地图文件或代码</button></div>
          <button className="board-online-start" disabled={api.online.busy} onClick={()=>{setArcadeOpen(false);void api.createOnlineRoom();}}>{api.online.busy?'正在建房…':'双人联机 · 用当前地图建房'}</button><p className="board-online-help">建房后复制邀请链接；地图、题库和进度会自动同步。</p>
          <MapSizePicker board={workspace.baseBoard} active={!!active} onApply={api.setMapSize} onShuffle={(size,shape)=>api.shuffleMap(size===undefined?undefined:{size,shape:shape??'reference'})}/>
          <QuickMapPicker active={!!active} onStart={board=>api.startPreparedMap(board,workspace.revision)}/>
          {workspace.baseBoard.layout.image&&<p className="home-current-map">当前：{workspace.baseBoard.title} · {workspace.baseBoard.tiles.length} 格</p>}
          <details className="home-more"><summary>其他玩法</summary><ModePicker board={workspace.baseBoard} levels={workspace.imageLevels??[1,2,3]} onLevels={api.setImageLevels} selected={workspace.baseBoard.id} active={!!active} onSelect={(id,options) => { if (!active || confirm('切换模式会结束当前局，任务库会保留。是否切换？')) void api.selectMode(id,options); }}/></details>
          <details className="home-more"><summary>玩家与设置</summary><HomeView players={workspace.players} themes={state.themes} onSelectTheme={setThemePlayer} hasActive={!!active} useTileDecks={workspace.taskMode === 'tile'} onSettings={() => setSettings(true)} onNewGame={() => { if (confirm('结束当前对局？任务库和设置会保留。')) void api.resetGame(); }}/></details>
          <div className="text-xs text-gray-400 text-center mb-4">{saveStatus}</div>
          <details className="home-more"><summary>备份与导出</summary><div className="flex flex-wrap gap-2 text-xs"><button className="utility-btn" onClick={() => download(workspace, 'flight-chess-workspace.json')}>导出全部</button><button className="utility-btn" onClick={() => { try { download(buildConfig(workspace), 'flight-chess-board.json'); setExportError(''); } catch (e) { setExportError(e instanceof Error ? e.message : '导出失败'); } }}>导出棋盘</button><button className="utility-btn" onClick={() => fileInput.current?.click()}>导入文件</button></div>
          <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">任务库可分别编辑。棋盘 JSON 可调整每个格子和路线；导入会替换当前设置和对局。导出全部可备份任务库与进度。</p>
          {exportError && <p role="alert" className="text-sm text-red-300 mt-2">{exportError}</p>}</details>
        </>}
        {state.view === 'themes' && <ThemesView workspace={workspace} onLevels={api.setImageLevels} onLibraryChange={api.editTaskLibrary} themes={state.themes} onCreateTheme={() => setCreating(true)} onEditTheme={setEditingTheme}/>}
      </main>
      {api.online.room&&!active&&<section className="board-room-panel"><b>{api.online.status}</b><p>{api.online.error}</p><button onClick={api.online.leave}>离开房间</button></section>}
      {state.view === 'home' && <div className="workbench-start px-6 py-3 border-t border-white/5"><button id="start-btn" onClick={() => { void api.startGame(); }} className="w-full py-3 rounded-full bg-white text-black font-bold">{active ? '继续当前局' : `开始 · ${workspace.baseBoard.title}`}</button></div>}
      <BottomNav activeView={state.view} onNavigate={view => { void api.switchView(view); }}/>
    </div>
    <input hidden ref={fileInput} type="file" accept=".json,application/json" aria-label="导入棋盘或存档" onChange={async e => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; if (file.size > 3_000_000) { setExportError('文件太大，最多 3 MB'); return; } try { const source = await file.text(); await api.importData(source); } catch { setExportError('文件读取失败'); } }}/>
    <ThemeSelectorModal isOpen={themePlayer !== null} themes={state.themes.filter(t => t.audience === 'common' || t.audience === selectedPlayer.role)} selectedThemeId={selectedPlayer.themeId} onSelect={id => { if (themePlayer !== null) void api.selectTheme(themePlayer, id); }} onClose={() => setThemePlayer(null)}/>
    <ThemeCreateModal isOpen={creating} onClose={() => setCreating(false)} onCreate={async input => { const id = await api.createTheme(input); if (id) { setCreating(false); setEditingTheme(id); } }}/>
    <ThemeEditorModal isOpen={!!editingTheme} theme={state.themes.find(t => t.id === editingTheme) ?? null} onClose={() => { setEditingTheme(null); setImportTheme(null); }} onSaveMeta={api.updateThemeMeta} onAddTask={api.addThemeTask} onRemoveTask={api.removeThemeTask} onOpenAiImport={setImportTheme}/>
    <AiImportModal isOpen={!!importTheme} themeName={state.themes.find(t => t.id === importTheme)?.name ?? ''} onClose={() => setImportTheme(null)} onImport={(tasks, mode) => { if (importTheme) void api.importThemeTasks(importTheme, tasks, mode); }}/>
    {codeImport&&<MapCodeModal active={!!active} onClose={()=>setCodeImport(false)} onImport={api.importPreparedMap}/>}
    {imageImport&&<ImageMapModal existing={workspace.baseBoard.layout.image?workspace.baseBoard:undefined} active={!!active} onClose={()=>setImageImport(false)} onImport={api.importImageMap} onStart={board=>api.startPreparedMap(board,workspace.revision)}/>}
    {settings && <SettingsModal workspace={workspace} onClose={() => setSettings(false)} onApply={api.applySettings}/>}
    {state.view === 'game' && active && <GameView players={state.players} config={active.config} game={active.state} onAction={api.dispatchGame} onBack={() => { if(api.online.room)api.online.leave();else void api.switchView('home'); }} roomPanel={api.online.room&&<BoardRoomPanel code={api.online.room.code} name={active.config.players[api.online.snapshot?.actor??0].name} status={api.online.status} error={api.online.error} invitation={api.online.invitation} onLeave={api.online.leave}/>} saveStatus={saveStatus} mapFullscreen={mapFullscreen} fullscreenRequest={fullscreenRequest} onExpandedChange={setMapFullscreen} onShuffle={api.shuffleMap} onShowResult={()=>setDismissedResult(null)}/>}
    {state.view==='game'&&!mapFullscreen&&active?.state.phase==='review'&&<ImageRuleReviewModal onCountTask={countDelta=>api.dispatchGame({type:'TASK_COUNT',countDelta})} onMapFullscreen={requestFullscreen} ongoing={isOngoingText(active.config.tiles[active.state.review!.position].text??'')?<OngoingEffects compact deferCurrent currentText={active.config.tiles[active.state.review!.position].text!} effects={active.state.effects} counter={active.state.rounds} players={active.config.players} act={api.dispatchGame}/>:undefined} config={active.config} game={active.state} onPauseTimer={now=>api.dispatchGame({type:'SET_TIMER',now,timerMode:'pause'})} onSetTimer={now=>api.dispatchGame({type:'SET_TIMER',now})} onApply={()=>api.dispatchGame({type:'RESOLVE_REVIEW',result:'apply'})} onSkip={()=>api.dispatchGame({type:'RESOLVE_REVIEW',result:'skip'})} onChangeLanding={active.config.rules.navigation==='manual'?()=>api.dispatchGame({type:'RESELECT_CELL'}):undefined}/>}
    <TaskCardModal taskCount={pending?.taskCount} onCountTask={countDelta=>void api.dispatchGame({type:'TASK_COUNT',countDelta})} onMapFullscreen={requestFullscreen} originalText={pending?.original??(pending&&active?active.config.tiles[pending.position].originalText:undefined)} ongoing={pending&&active&&isOngoingText(pending.text)?<OngoingEffects compact deferCurrent currentText={pending.text} effects={active.state.effects?.filter(e=>e.text===pending.text)} counter={active.state.rounds} players={active.config.players} act={api.dispatchGame}/>:undefined} onChangeLanding={active?.config.rules.navigation==='manual'?()=>api.dispatchGame({type:'RESELECT_CELL'}):undefined} isOpen={state.view === 'game' && !mapFullscreen && active?.state.phase === 'task'} taskData={taskData} imageLibraryTask={!!pending&&!!active&&!active.config.layout.image&&active.config.decks[pending.deck]?.name.startsWith('图片混合题库')} sourceImage={sourceImage} executorName={executorName} duration={pending?.duration} taskFactor={pending?.taskFactor} timerEndsAt={pending?.timerEndsAt} pausedRemaining={pending?.pausedRemaining} onPauseTimer={now=>void api.dispatchGame({type:'SET_TIMER',now,timerMode:'pause'})} onSetTimer={now => { void api.dispatchGame({ type: 'SET_TIMER', now }); }} onAccept={() => { void api.dispatchGame({ type: 'RESOLVE_TASK', result: 'done' }); }} onReject={() => { void api.dispatchGame({ type: 'RESOLVE_TASK', result: 'skip' }); }}/>
    {state.view === 'game' && !mapFullscreen && active?.state.phase === 'choice' && active.state.choice && <ChoiceModal onMapFullscreen={requestFullscreen} choice={active.state.choice} playerName={state.players[active.state.turn].name} onChoose={index => { void api.dispatchGame({ type: 'CHOOSE_ROUTE', index }); }}/> }
    <WinModal limited={!!active?.state.limitReached} isOpen={state.view === 'game' && !mapFullscreen && active?.state.phase === 'finished' && dismissedResult!==active.state.id} onContinue={()=>setDismissedResult(active?.state.id??null)} effectCount={active?.state.effects?.length??0} winnerName={active?.config.rules.goal === 'cooperative' && active.state.winner === 'team' ? '全队通关' : active?.config.players.find(p => p.id === active.state.winner)?.name ?? ''} arrivalNames={active?.state.finishOrder?.map(id=>active.config.players.find(p=>p.id===id)?.name??id)} onUndo={active?.state.undo.length&&api.online.allowed('UNDO')?()=>{void api.dispatchGame({type:'UNDO'});}:undefined} onRestart={api.online.allowed('SHUFFLE')?() => { if(api.online.room)void api.shuffleMap();else void api.resetGame(); }:undefined}/>
    {arcadeOpen&&<Suspense fallback={<div className="fixed inset-0 z-[150] bg-[#f6f3eb] text-[#293d3a] p-10">正在打开玩法大厅…</div>}><ArcadeView library={{workspace,onLevels:api.setImageLevels,onChange:api.editTaskLibrary}} players={workspace.players} onClose={()=>setArcadeOpen(false)}/></Suspense>}
    {notice && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md rounded-2xl bg-[#403b29] border border-yellow-600 p-4 text-sm" role="alert"><p>{notice}</p><button className="mt-2 underline" onClick={api.dismissNotice}>知道了</button></div>}
  </div></BoardOnlineContext.Provider>;
}
export default App;
