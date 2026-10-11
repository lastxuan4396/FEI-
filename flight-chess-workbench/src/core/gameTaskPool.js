import {selectedTaskRows} from './taskLibrary.js';
import {IMAGE_TASK_TEXTS} from './imageTaskLibrary.js';
import {applyTaskParameters} from './taskParameters.js';
// Freeze exactly the user's eligible tasks for a new game. Active games never
// read back into the editable library when dealing their next hand.
export function gameTaskPool(workspace,choice='@personal',parameters={}){
 let rows,name;
 if(choice==='@personal'){rows=selectedTaskRows(workspace);name='我的图片题库';}
 else if(choice==='@images'){rows=IMAGE_TASK_TEXTS.map(text=>({text,original:text}));name='全部原图任务';}
 else {const theme=workspace.themes.find(t=>t.id===choice);if(!theme)throw Error('找不到所选题库，请重新选择');rows=theme.tasks.map(text=>({text,original:text}));name=theme.name;}
 if(!rows.length)throw Error('所选题库没有可抽题目，请先选题或调整等级');
 const pool=[],sourceTexts={};
 for(const row of rows){const text=applyTaskParameters(row.text,parameters).text;if(pool.includes(text))continue;pool.push(text);if(text!==row.original)sourceTexts[text]=row.original;}
 if(pool.length>2000||pool.join('').length>400000)throw Error('本局题库过大，请缩小等级或自选范围');
 return {pool,sourceTexts,name};
}
