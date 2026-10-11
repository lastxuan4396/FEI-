import type {ReactNode} from 'react';
export function OptionalTaskTimer({optional,running,children}:{optional:boolean;running:boolean;children:ReactNode}){
 return optional?<details className="task-optional-timer" open={running}><summary>额外计时（可选）</summary><small>这个任务按次数确认；需要额外限时时再开始计时。</small>{children}</details>:<>{children}</>;
}
