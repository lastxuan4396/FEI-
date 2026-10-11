interface WinModalProps {
  isOpen: boolean;limited?:boolean;
  winnerName: string;
  arrivalNames?:string[];
  onRestart?: () => void;
  onUndo?: () => void;
  onContinue: () => void;
  effectCount?: number;
}

export function WinModal({ isOpen, limited,winnerName, arrivalNames, onRestart, onUndo, onContinue, effectCount=0 }: WinModalProps) {
  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="本局结算" className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 overflow-y-auto py-5">
      <div className="text-center px-5 max-w-lg max-h-[90dvh] overflow-y-auto">
        <div className="text-7xl mb-6">👑</div>
        <h2 className="text-5xl font-bold text-white mb-2">{limited?'本局已结束':winnerName}</h2>
        <p className="text-gray-400 mb-10">{limited?'达到设定轮数，地图进度已保留':'今晚你是赢家'}</p>
        {arrivalNames?.length===2&&<p className="text-sm text-gray-300 mb-6">先到：{arrivalNames[0]} · 后到：{arrivalNames[1]}<br/>两人已确认完成，先后任务按原图共同核对。</p>}
        {!!effectCount&&<p className="text-sm text-gray-300 mb-5 leading-relaxed">保留了{effectCount}张持续卡。计时、计次任务可以继续处理，胜负和地图进度保留。</p>}
        <button className="block mx-auto mb-4 px-8 py-3 rounded-full bg-[#c9dfb7] text-[#203628] font-bold ios-btn" onClick={onContinue}>返回地图与持续任务</button>
        <button
          className="px-10 py-4 bg-white text-black font-bold text-lg rounded-full ios-btn"
          onClick={onRestart}
          disabled={!onRestart}
        >
          {onRestart?'再来一局':'等待房主开始下一局'}
        </button>
        {onUndo&&<button className="block mx-auto mt-5 px-5 py-3 text-sm text-gray-200 rounded-full border border-gray-600 ios-btn" onClick={onUndo}>撤销结束，返回上一操作</button>}
      </div>
    </div>
  );
}
