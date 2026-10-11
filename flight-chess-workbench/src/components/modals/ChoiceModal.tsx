import {useContext} from 'react';
import {BoardOnlineContext} from '../BoardOnlineContext';
import type { EngineState } from '../../core/types';
export function ChoiceModal({ choice, playerName, onChoose,onMapFullscreen }: { onMapFullscreen?:()=>void;choice: NonNullable<EngineState['choice']>; playerName: string; onChoose: (index: number) => void }) {
  const online=useContext(BoardOnlineContext);
  return <div className="fixed inset-0 z-[110] bg-black/85 flex items-center justify-center p-6"><section role="dialog" aria-label="岔路选择" className="w-full max-w-sm bg-[#23232b] rounded-3xl p-6 border border-purple-400/30"><div className="text-4xl mb-4">↗</div><h2 className="text-2xl font-bold">岔路选择</h2><p className="text-sm text-gray-400 mt-2 mb-6">{playerName} 到达第 {choice.position} 格，选择接下来走哪条路线。</p>{onMapFullscreen&&<button className="fullscreen-modal-link" onClick={onMapFullscreen}>全屏地图</button>}<div className="space-y-3">{choice.options.map((option, i) => <button id={`choice-${i}`} key={i} disabled={!!online&&!online.allowed('CHOOSE_ROUTE')} onClick={() => onChoose(i)} className="w-full py-4 px-4 rounded-2xl bg-white/10 hover:bg-purple-400/20 text-left font-bold">{option.label}<span className="float-right">→</span></button>)}</div><p className="text-xs text-gray-500 mt-5">选择后立即移动并触发落点；可用撤销重新选择。</p></section></div>;
}
