import {useContext} from 'react';
import {BoardOnlineContext} from '../BoardOnlineContext';
import {TaskCountTracker} from '../TaskCountTracker';
import {ImageCrop} from '../ImageCrop';
import {imageTaskLevel} from '../../core/imageLevels.js';
import { useState, useEffect } from 'react';
import { TaskEventData } from '../../types';
import {ImageSourceNotes} from '../ImageSourceNotes';
import type {ImageRegion,ImageTileNote} from '../../core/types';
import {imageTask} from '../../core/imageTaskLibrary.js';
import { TaskTimer } from '../TaskTimer';
import { Heart, Lock, HandshakeIcon } from 'lucide-react';

interface TaskCardModalProps {taskCount?:number;onCountTask?:(delta:number)=>void;originalText?:string;onMapFullscreen?:()=>void;
  ongoing?:React.ReactNode;
  isOpen: boolean;
  taskData: TaskEventData | null;
  executorName?: string;
  sourceImage?:{randomized?:boolean;dataUrl:string;width:number;height:number;displayRotation?:0|90|180|270;region:ImageRegion;needsReview:boolean;notes?:ImageTileNote[]};
  imageLibraryTask?:boolean;
  duration?: number;
  taskFactor?:0.5|2;
  timerEndsAt?: number | null;
  pausedRemaining?:number;
  onPauseTimer?:(now:number)=>void;
  onSetTimer: (now: number | null) => void;
  onAccept: () => void;
  onReject: () => void;
  onChangeLanding?: () => Promise<unknown>;
}

const iconMap: Record<string, React.ReactNode> = {
  favorite: <Heart size={40} fill="currentColor" />,
  lock: <Lock size={40} />,
  handshake: <HandshakeIcon size={40} />
};

export function TaskCardModal({ taskCount,onCountTask,originalText,onMapFullscreen,ongoing,isOpen, taskData, executorName, sourceImage, imageLibraryTask, duration, taskFactor, timerEndsAt, pausedRemaining, onPauseTimer, onSetTimer, onAccept, onReject, onChangeLanding }: TaskCardModalProps) {
  const online=useContext(BoardOnlineContext),blocked=!!online&&!online.allowed('RESOLVE_TASK');
  const [isFlipped, setIsFlipped] = useState(false);
  const revealed = isFlipped || (taskCount??0)>0 || timerEndsAt != null || pausedRemaining !== undefined;

  useEffect(() => {
    if (isOpen) {
      setIsFlipped(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && (timerEndsAt != null || pausedRemaining !== undefined)) setIsFlipped(true);
  }, [isOpen, timerEndsAt, pausedRemaining]);

  if (!isOpen || !taskData) return null;

  const rejectLabel = '跳过任务';
  const executorLabel = executorName ?? '当前玩家';
  const origin=imageLibraryTask?imageTask(originalText??taskData.task):undefined;
  const executorClassName = taskData.executorPlayerId === 0 ? 'text-[#0A84FF]' : 'text-[#FF375F]';
  const factorNote=taskFactor&&<p className="task-factor-note" data-task-factor={taskFactor}>本项任务{taskFactor===2?'翻倍':'减半'} · 原文保留{duration?'，计时已调整':'，请按倍率核对次数或时长'}。完成或跳过后恢复。</p>;

  if(sourceImage){const {region:r}=sourceImage;return <div className="image-rule-overlay" role="dialog" aria-modal="true" aria-label="原图任务确认"><section className="image-rule-card"><header><span>{taskData.subtitle}</span><h2>{sourceImage.randomized?'本局随机任务':'原图任务'}</h2><p>{executorLabel} · 可以完成或跳过</p>{sourceImage.notes?.length&&<p className="image-note-hint">另有{sourceImage.notes.length}条格外说明，请向下阅读。</p>}</header><div className="image-rule-content">{duration&&<TaskTimer duration={duration} endsAt={timerEndsAt} pausedRemaining={pausedRemaining} disabled={blocked} onPause={onPauseTimer} onSet={onSetTimer}/>}<ImageCrop image={sourceImage} region={r} label="任务格原图局部"/><p className="image-rule-verbatim">{taskData.task}</p>{originalText&&<details><summary>原图文字</summary><p>{originalText}</p></details>}{onCountTask&&<TaskCountTracker text={taskData.task} factor={taskFactor??1} progress={taskCount} disabled={blocked} onChange={onCountTask}/>}{ongoing}{factorNote}<ImageSourceNotes image={sourceImage} notes={sourceImage.notes}/>{sourceImage.needsReview&&<p className="image-rule-warning">这格的原文尚未完整核对或关联，请以原图为准。</p>}</div><footer>{onMapFullscreen&&<button onClick={onMapFullscreen}>全屏地图</button>}{onChangeLanding&&<button disabled={!!online&&!online.allowed('RESELECT_CELL')} onClick={()=>void onChangeLanding()}>重新选落点</button>}<button disabled={blocked} onClick={onReject}>跳过任务</button><button disabled={blocked} className="primary" onClick={onAccept}>完成了</button></footer></section></div>;}
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div className="relative w-full max-w-sm h-[min(560px,85dvh)] perspective-1000">
        <div className={`flip-card-inner ${revealed ? 'flipped' : ''}`}>
          <div
            className="flip-card-front bg-[#1C1C1E] border border-white/10 p-6 flex flex-col items-center justify-center shadow-2xl cursor-pointer"
            onClick={() => setIsFlipped(true)}
          >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
              <div className={taskData.color}>
                {iconMap[taskData.icon] || iconMap.favorite}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{taskData.title}</h3>
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-8">
              点击翻转查看任务
            </p>
           
          </div>

          <div className="flip-card-back native-task-back bg-[#1C1C1E] border border-white/10 p-6 shadow-2xl">
            <div className="native-task-scroll w-full">
              {duration && <TaskTimer duration={duration} endsAt={timerEndsAt} pausedRemaining={pausedRemaining} disabled={blocked} onPause={onPauseTimer} onSet={onSetTimer}/>}
              <div className={taskData.color}>
                {iconMap[taskData.icon] || iconMap.favorite}
              </div>
              <h3 className="text-xl font-bold text-white mb-6 mt-4">{taskData.title}</h3>
              <div className="text-xs text-gray-400 text-center leading-relaxed break-words mb-6">
                <div>{taskData.subtitle}</div>
                <div>
                  由 <span className={executorClassName}>{executorLabel}</span> 执行
                </div>
              </div>

              <div className="w-full bg-[#2C2C2E] rounded-xl p-6 min-h-[80px] flex items-center justify-center border border-white/5 mb-6">
                <p className="text-lg font-medium text-white text-center leading-relaxed break-words">
                  {taskData.task}
                </p>
              </div>
              {factorNote}
              {origin&&<p className="image-task-source" data-image-task-source={origin.image}>第{origin.image}张图片 · {origin.cell} · {imageTaskLevel(taskData.task)}级 · {origin.reviewed?'已整理原文':'自动识别 · 待核对'}<a href={`${import.meta.env.BASE_URL}api/reference-boards/${origin.image}/image`} target="_blank" rel="noreferrer">查看原图 ↗</a></p>}
              {originalText&&<details><summary>原图文字</summary><p>{originalText}</p></details>}{onCountTask&&<TaskCountTracker text={taskData.task} factor={taskFactor??1} progress={taskCount} disabled={blocked} onChange={onCountTask}/>}{ongoing}
            </div>
            {onMapFullscreen&&<button className="fullscreen-modal-link" onClick={onMapFullscreen}>全屏地图</button>}
            <div className="w-full flex gap-3 mt-auto">
              <button
                className="flex-1 h-12 rounded-full bg-[#3A3A3C] text-[#FF453A] font-bold text-sm ios-btn border border-transparent hover:border-[#FF453A]/30"
                disabled={blocked} onClick={onReject}
              >
                {rejectLabel}
              </button>
              <button
                className="flex-1 h-12 rounded-full bg-white text-black font-bold text-sm ios-btn shadow-lg"
                disabled={blocked} onClick={onAccept}
              >
                完成了
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
