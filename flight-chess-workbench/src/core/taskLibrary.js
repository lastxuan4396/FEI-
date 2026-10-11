import {refreshUntouchedImageThemes} from './imageThemeDefaults.js';
import {IMAGE_TASK_TEXTS,imageTask} from './imageTaskLibrary.js';
import {imageTaskLevel,validateImageLevels} from './imageLevels.js';
const check=(v,m)=>{if(!v)throw Error(m);};
export function taskKey(text){let a=2166136261,b=5381;for(const c of text){const k=c.codePointAt(0);a=Math.imul(a^k,16777619);b=Math.imul(b,33)^k;}return `img-${(a>>>0).toString(36)}-${(b>>>0).toString(36)}`;}
export function validateTaskLibrary(input={}){
 const edits=input.edits??{},additions=input.additions??[],selectedIds=input.selectedIds??[],mode=input.mode??'random',reviewedOnly=input.reviewedOnly??false;
 check(edits&&typeof edits==='object'&&!Array.isArray(edits)&&Object.keys(edits).length<=2000,'题目修改记录不正确');
 for(const [id,p]of Object.entries(edits)){check(/^img-[a-z0-9]+-[a-z0-9]+$/.test(id)&&p&&typeof p==='object','题目修改编号不正确');check(p.text===null||typeof p.text==='string'&&p.text.trim().length>0&&p.text.length<=1000,'题目内容不正确');check(p.level===undefined||[1,2,3].includes(p.level),'题目等级不正确');check(p.original===undefined||typeof p.original==='string'&&p.original.trim().length>0&&p.original.length<=1000&&taskKey(p.original)===id,'题目原文备份不正确');}
 check(Array.isArray(additions)&&additions.length<=2000&&new Set(additions.map(t=>t.id)).size===additions.length,'新增题目不正确');
 for(const t of additions)check(/^user-[a-zA-Z0-9_-]{1,80}$/.test(t.id)&&typeof t.text==='string'&&t.text.trim().length>0&&t.text.length<=1000&&[1,2,3].includes(t.level)&&(t.deleted===undefined||typeof t.deleted==='boolean'),'新增题目内容或等级不正确');
 check(Array.isArray(selectedIds)&&selectedIds.length<=4000&&new Set(selectedIds).size===selectedIds.length&&selectedIds.every(id=>typeof id==='string'&&/^(img-[a-z0-9]+-[a-z0-9]+|user-[a-zA-Z0-9_-]{1,80})$/.test(id)),'自选题目编号不正确');
 check(['random','selected'].includes(mode)&&typeof reviewedOnly==='boolean','题目抽取设置不正确');
 return {edits:structuredClone(edits),additions:structuredClone(additions),selectedIds:[...selectedIds],mode,reviewedOnly};
}
function legacyLibrary(workspace){
 const bank=validateTaskLibrary(workspace.taskLibrary),themes=refreshUntouchedImageThemes(workspace.themes).filter(t=>/^image_mix_[1-6]$/.test(t.id));
 if(workspace.taskLibrary||themes.length!==6)return bank;
 const present=new Set(themes.flatMap(t=>t.tasks));
 for(const text of IMAGE_TASK_TEXTS)if(!present.has(text))bank.edits[taskKey(text)]={text:null};
 for(const text of present)if(!IMAGE_TASK_TEXTS.includes(text))bank.additions.push({id:`user-legacy-${taskKey(text).slice(4)}`,text,level:imageTaskLevel(text)});
 return bank;
}
export function taskLibrarySettings(workspace){return legacyLibrary(workspace);}
export function taskLibraryRows(workspace){
 const library=legacyLibrary(workspace);
 const originals=IMAGE_TASK_TEXTS.map(original=>{const id=taskKey(original),edit=library.edits[id],source=imageTask(original);return {id,original,text:edit?.text??original,level:edit?.level??imageTaskLevel(edit?.text??original),deleted:edit?.text===null,edited:!!edit,reviewed:source?.reviewed??false,...(source?{image:source.image,cell:source.cell}:{})};});
 // Proofreading can replace source wording and therefore its content-derived
 // ID. Keep personal edits and deletion backups visible across that update.
 const currentIds=new Set(originals.map(t=>t.id));
 const archived=Object.entries(library.edits).filter(([id,edit])=>!currentIds.has(id)&&(edit.text!==null||edit.original)).map(([id,edit])=>({id,original:edit.original??edit.text,text:edit.text??edit.original,level:edit.level??imageTaskLevel(edit.text??edit.original),deleted:edit.text===null,edited:true,reviewed:false,archived:true}));
 return [...originals,...archived,...library.additions.map(t=>({...t,original:t.text,deleted:t.deleted===true,edited:true,reviewed:true}))];
}
export function selectedTaskRows(workspace){
 const library=legacyLibrary(workspace),levels=validateImageLevels(workspace.imageLevels),ids=new Set(library.selectedIds);
 return taskLibraryRows(workspace).filter(t=>!t.deleted&&levels.includes(t.level)&&(!library.reviewedOnly||t.reviewed)&&(library.mode==='random'||ids.has(t.id)));
}
export function changeTaskLibrary(workspace,action){
 const library=legacyLibrary(workspace),rows=taskLibraryRows(workspace),row=rows.find(t=>t.id===action.id);
 if(['edit','delete','restore'].includes(action.type)){
  check(row,'找不到这条题目');
  if(row.id.startsWith('user-'))library.additions=library.additions.map(t=>t.id!==row.id?t:action.type==='edit'?{...t,text:action.text.trim(),level:action.level}:{...t,deleted:action.type==='delete'});
  else if(action.type==='restore'){if(row.archived)library.edits[row.id]={...library.edits[row.id],text:row.original};else delete library.edits[row.id];}
  else library.edits[row.id]={...library.edits[row.id],...(!row.archived?{original:row.original}:{}),text:action.type==='delete'?null:action.text.trim(),level:action.level??row.level};
 }else if(action.type==='add')library.additions.push({id:action.id,text:action.text.trim(),level:action.level});
 else if(action.type==='select'){library.selectedIds=[...new Set(action.ids)];if(action.mode)library.mode=action.mode;}
 else if(action.type==='mode')library.mode=action.mode;
 else if(action.type==='reviewedOnly')library.reviewedOnly=action.value;
 else throw Error('题库操作不正确');
 return {...workspace,taskLibrary:validateTaskLibrary(library)};
}
