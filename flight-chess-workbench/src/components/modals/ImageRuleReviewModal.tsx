import {useContext} from 'react';
import {BoardOnlineContext} from '../BoardOnlineContext';
import {TaskCountTracker} from '../TaskCountTracker';
import {applyTaskParameters} from '../../core/taskParameters.js';
import {ImageCrop} from '../ImageCrop';
import {TaskTimer} from '../TaskTimer';
import {reviewDuration} from '../../core/taskTiming.js';
import {useState,useRef,useEffect} from 'react';
import type {CoreConfig,EngineState} from '../../core/types';
import {ImageSourceNotes} from '../ImageSourceNotes';
import {textForRegion} from '../../core/imageText.js';
import {ruleDescription} from '../../core/imageRuleReview.js';
interface Props {onCountTask?:(delta:number)=>Promise<unknown>;onMapFullscreen?:()=>void;ongoing?:React.ReactNode;config:CoreConfig;game:EngineState;onApply:()=>Promise<unknown>;onSkip:()=>Promise<unknown>;onChangeLanding?:()=>Promise<unknown>;onSetTimer:(now:number|null)=>Promise<unknown>;onPauseTimer:(now:number)=>Promise<unknown>}
export function ImageRuleReviewModal({onCountTask,onMapFullscreen,ongoing,config,game,onApply,onSkip,onChangeLanding,onSetTimer,onPauseTimer}:Props){
 const online=useContext(BoardOnlineContext),blocked=!!online&&!online.allowed('RESOLVE_REVIEW');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),card=useRef<HTMLElement>(null);
 useEffect(()=>{card.current?.focus();},[game.review?.position]);
 async function run(action:()=>Promise<unknown>){if(busy)return;setBusy(true);setError('');try{const result=await action();if(result===null)setError('未能保存操作，请查看页面提示后重试。');}catch(e){setError(e instanceof Error?e.message:'操作失败，请重试。');}finally{setBusy(false);}}
 const image=config.layout.image,review=game.review;if(!image||game.phase!=='review'||!review)return null;
 const manualFinish=config.rules.navigation==='manual'&&review.position===config.tiles.length-1;
 const firstArrival=manualFinish&&config.rules.finishAllPlayers&&!game.finishOrder?.length;
 const tile=config.tiles[review.position],region=tile.readingRegion??image.regions[review.position],execution=applyTaskParameters(tile.text??'',config.rules.taskParameters).text,duration=reviewDuration(execution,review),unreviewed=textForRegion(image.texts,region).filter(l=>!l.reviewed).length;
 return <div className="image-rule-overlay" role="dialog" aria-modal="true" aria-label="原图格内容确认"><section ref={card} tabIndex={-1} className="image-rule-card"><header><span>第{review.position}格 · 原图内容</span><h2>{manualFinish?'请先按原图核对终点条件':'先看完整原文，再应用规则'}</h2><p>{config.players[game.turn].name} · 确认前保持当前位置</p></header><div className="image-rule-content">{duration&&<TaskTimer duration={duration} endsAt={review.timerEndsAt} pausedRemaining={review.pausedRemaining} onPause={now=>void run(()=>onPauseTimer(now))} disabled={busy||blocked} onSet={now=>void run(()=>onSetTimer(now))}/>}{duration&&execution.includes('〔')&&<p className="image-rule-warning">计时来自原图可读时长，正文缺字仍需核对。</p>}<ImageCrop image={image} region={region} label={`第${review.position}格原图局部`}/><p className="image-rule-verbatim">{tile.text}</p>{execution!==tile.text&&<p className="image-rule-verbatim">本局自定义执行版：{execution}</p>}{onCountTask&&<TaskCountTracker text={execution} progress={review.taskCount} disabled={busy||blocked} onChange={delta=>void run(()=>onCountTask(delta))}/>}{ongoing}<ImageSourceNotes image={image} notes={tile.notes}/>{unreviewed>0&&<p className="image-rule-warning">本格有{unreviewed}行文字尚未核对，请以左侧原图为准。</p>}<div className="image-rule-effect"><b>{firstArrival?'确认到达后，另一位继续':manualFinish?'确认后结束本局':'确认后自动执行'}</b><p>{firstArrival?'保留你的先到顺序，不再安排你的掷骰回合；另一位继续完成原图。':ruleDescription(tile,review.dice??game.lastMove?.dice)}</p><small>仅执行已配置规则；原文的其他内容由玩家共同确认，可以跳过。</small></div>{error&&<p role="alert" className="image-rule-warning">{error}</p>}</div><footer>{onMapFullscreen&&<button onClick={onMapFullscreen}>全屏地图</button>}{onChangeLanding&&!manualFinish&&<button disabled={busy||!!online&&!online.allowed('RESELECT_CELL')} onClick={()=>void onChangeLanding()}>重新选落点</button>}<button disabled={busy||blocked} onClick={()=>void run(onSkip)}>{manualFinish?'条件未满足，重新选落点':tile.type==='finish'?'跳过原文并结束':'跳过本格内容'}</button><button disabled={busy||blocked} className="primary" onClick={()=>void run(onApply)}>{busy?'保存中…':firstArrival?'确认到达，另一位继续':manualFinish?'按原图确认结束':'确认并应用规则'}</button></footer></section></div>;
}
