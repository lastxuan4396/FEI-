import {taskDuration,durationLabel} from '../core/taskTiming.js';
import {isOngoingText} from '../core/ongoingEffects.js';
export function TaskDurationBadge({text}:{text:string}){const duration=taskDuration(text);return <small className="task-duration-badge">{isOngoingText(text)?'持续卡 · 可设回合或时间':duration?`时长 · ${durationLabel(duration)}`:'未标时长 · 领取后可设置'}</small>;}
