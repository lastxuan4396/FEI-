import {EditableTaskLibrary} from '../EditableTaskLibrary';
import {selectedTaskRows,taskLibrarySettings,type LibraryAction} from '../../core/taskLibrary.js';
import {IMAGE_TASK_TEXTS} from '../../core/imageTaskLibrary.js';
import type {Workspace} from '../../core/workspace';
import './task-pool.css';
export type LibraryControls={workspace:Workspace;onLevels:(levels:number[])=>Promise<boolean|null>;onChange:(action:LibraryAction)=>Promise<boolean|null>};
export function GameTaskPoolPicker({library,value,onChange,recommended=false,minimum=1}:{library:LibraryControls;value:string;onChange:(value:string)=>void;recommended?:boolean;minimum?:number}){
 const {workspace}=library,pool=selectedTaskRows(workspace),settings=taskLibrarySettings(workspace);
 const count=value==='@personal'?new Set(pool.map(t=>t.text)).size:value==='@images'?IMAGE_TASK_TEXTS.length:workspace.themes.find(t=>t.id===value)?.tasks.length;
 return <section className="game-task-pool" aria-label="本局题库设置"><label>使用题库<select aria-label="使用题库" value={value} onChange={e=>onChange(e.target.value)}><option value="@personal">我的图片题库（{pool.length}条可抽）</option><option value="@images">全部原图任务（{IMAGE_TASK_TEXTS.length}条 · 含待核对）</option>{recommended&&<option value="@recommended">原玩法推荐内容</option>}{workspace.themes.map(t=><option value={t.id} key={t.id}>{t.name}（{t.tasks.length}条）</option>)}</select></label>
 {value==='@personal'?<p>共用题库 · {(workspace.imageLevels??[1,2,3]).join('＋')}级 · {settings.mode==='selected'?'只抽自选':'随机混抽'}{settings.reviewedOnly?' · 只用已整理':''}。修改、删除和自选会用于新开局；当前对局保留开局时的题目。</p>:<p>{value==='@images'?'这一项使用未经个人修改的原图内容，含待核对题目。':'使用所选题库开局，进行中的题目不会随编辑改变。'}</p>}
 {count!==undefined&&count<minimum&&<p className="arc-error" role="status">{minimum===3?'三选一需要至少3条不同题目。':'当前没有可抽题目。'}请在下面选题或添加题目。</p>}
 <details><summary>编辑共用题库 · 选题／删改／添加</summary><EditableTaskLibrary workspace={workspace} onLevels={library.onLevels} onChange={library.onChange}/></details></section>;
}
