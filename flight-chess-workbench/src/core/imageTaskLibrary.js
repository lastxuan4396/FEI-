import {taskDuration} from './taskTiming.js';
import imageContent from './imageContent.json' with {type:'json'};
// Transcribed from the user's supplied boards. No inferred or invented card text.
// Navigation squares stay in the board rules, rather than becoming task cards.
const TRANSCRIBED_TASKS = Object.freeze([
 {image:10,cell:'内圈左侧·拥抱',text:'抱一抱'},
 {image:10,cell:'外圈右侧·接吻',text:'接吻5min',duration:300},
 {image:10,cell:'外圈右侧·姿势',text:'摆出你最喜欢的姿势'},
 {image:10,cell:'外圈右侧·亲吻',text:'亲吻私处并说情话'},
 {image:10,cell:'外圈左侧·手指',text:'跪下舔对方手指1min',duration:60},
 {image:10,cell:'外圈左侧·喂水',text:'用嘴喂对方喝水'},
 {image:10,cell:'外圈左侧·乳头',text:'舔对方乳头10s',duration:10},
 {image:10,cell:'外圈右侧·随身写字',text:'随身写字'},
 {image:10,cell:'内圈右侧·耳根',text:'舔耳根2min',duration:120},
 {image:10,cell:'内圈右侧·挑逗',text:'挑逗3min',duration:180},
 {image:10,cell:'内圈右侧·学习',text:'当场学习新姿势并试用2min',duration:120},
 {image:10,cell:'内圈右侧·包养',text:'包养一天'},
 {image:10,cell:'内圈左侧·全身',text:'舔遍全身'},
 {image:10,cell:'内圈上侧·合照',text:'拍一张裸体情侣照（不露脸）'},
 {image:10,cell:'内圈上侧·姿势',text:'保持69姿势1min',duration:60},
 {image:12,cell:'外圈上侧·情话',text:'亲吻对方私处并说一句情话'},
 {image:12,cell:'外圈上侧·接吻',text:'接吻10s',duration:10},
 {image:12,cell:'外圈上侧·姿势',text:'摆出你最喜欢的姿势'},
 {image:12,cell:'外圈上侧·按摩',text:'被她/他隔着内裤按摩10s',duration:10},
 {image:12,cell:'外圈右侧·手指',text:'像口爱一样吸允对方手指10s',duration:10},
 {image:12,cell:'内圈上侧·跪姿',text:'保持跪姿'},
 {image:12,cell:'内圈上侧·按摩',text:'被她/他任意地方按摩30s',duration:30},
 {image:12,cell:'内圈右侧·衣服',text:'为他/她脱衣服'},
 {image:12,cell:'内圈下侧·指定游戏',text:'指定对方任意游戏'},
 {image:12,cell:'外圈下侧·自慰',text:'自慰30s',duration:30},
 {image:24,cell:'1格',text:'和异性拥抱10秒',duration:10},
 {image:24,cell:'5格',text:'和异性舌吻10秒',duration:10},
 {image:24,cell:'9格',text:'被异性打屁股5次'},
 {image:24,cell:'17格',text:'被异性挑逗乳头30秒',duration:30},
 {image:24,cell:'19格',text:'舔异性大腿内侧10秒',duration:10},
 {image:24,cell:'20格',text:'挑逗异性下体30秒',duration:30},
 {image:24,cell:'28格',text:'舔异性大腿内侧30秒',duration:30},
 {image:24,cell:'33格',text:'为异性口交30秒',duration:30},
 {image:24,cell:'37格',text:'被异性口交30秒',duration:30},
 {image:24,cell:'45格',text:'被异性抚摸30秒',duration:30},
 {image:26,cell:'左侧上段·舌吻',text:'与对方舌吻30秒',duration:30},
 {image:26,cell:'左侧中段·照片',text:'女生拍一张性感照片'},
 {image:26,cell:'左侧中段·亲吻',text:'让对手从耳根开始舔到胸口'},
 {image:26,cell:'下侧·脚背',text:'从脖子到脚或者反过来舔对方'},
 {image:26,cell:'中央蓝色·脚',text:'为对方舔脚1分钟',duration:60},
 {image:26,cell:'中央蓝色·乳头',text:'舔对方乳头1分钟',duration:60},
 {image:26,cell:'中央黄色·口交',text:'为对方口交3分钟',duration:180},
 {image:26,cell:'右侧上段·草莓',text:'吮吸对方脖子种一颗草莓'},
 {image:26,cell:'右侧中段·喂水',text:'喂对方喝一口自己的口水'},
 {image:9,cell:'15格',text:'亲女方脖子20秒',duration:20},
 {image:9,cell:'16格',text:'舌吻20秒',duration:20},
 {image:9,cell:'5格',text:'全裸公主抱绕场地一圈'},
 {image:9,cell:'24格',text:'（福利）给女方按摩两分钟',duration:120},
 {image:9,cell:'34格',text:'给对方口交30秒',duration:30},
 {image:9,cell:'48格',text:'给对方口交60秒',duration:60}
].map(Object.freeze));
export const IMAGE_CONTENT = imageContent;
const normalized=text=>text.replace(/\s/g,'');
const seen=new Set(TRANSCRIBED_TASKS.map(t=>normalized(t.text)));
const candidates=[];
// Supplementary table tasks stay separate from physical route cells.
// Only individually reviewed, self-contained table entries join the mixed pool.
for(const board of imageContent.boards)for(const [position,cell] of [...board.cells,...(board.additionalTasks??[]).filter(t=>t.reviewed===true)].entries()){
 if(cell.type!=='task'||!cell.text.trim()||cell.text.length>1000||seen.has(normalized(cell.text)))continue;
 seen.add(normalized(cell.text));
 const duration=taskDuration(cell.text);
 candidates.push(Object.freeze({image:board.id,cell:cell.label??(position<board.cells.length?`程序第${position}格`:`格外题目 ${position-board.cells.length+1}`),text:cell.text,reviewed:cell.reviewed,...(duration?{duration}:{})}));
}
export const IMAGE_TASK_LIBRARY=Object.freeze([...TRANSCRIBED_TASKS.map(t=>Object.freeze({...t,reviewed:true})),...candidates]);
export const IMAGE_TASK_TEXTS=Object.freeze([...new Set(IMAGE_TASK_LIBRARY.map(t=>t.text))]);

export function imageTask(text){return IMAGE_TASK_LIBRARY.find(t=>t.text===text);}

// Older readings list per-cell issues; newer readings also record note/table
// uncertainty separately. Keep both shapes readable without changing source data.
export function imageReviewIssues(board) {
 const unresolved=board?.reviewStatus?.unresolved;
 const validPosition=p=>Number.isInteger(p)&&p>=0&&p<(board?.cells?.length??0);
 if(Array.isArray(unresolved))return unresolved.filter(i=>i&&typeof i.reason==='string'&&(validPosition(i.position)||(typeof i.area==='string'&&i.area.trim()))).map(i=>({...validPosition(i.position)?{position:i.position}:{area:i.area},reason:i.reason}));
 if(!Array.isArray(unresolved?.bodyPositions))return [];
 const reason='原图小字尚未可靠确认，保留可读片段；请对照原图或跳过。';
 const body=[...new Set(unresolved.bodyPositions.filter(validPosition))].map(position=>({position,reason}));
 const notes=[...new Set((unresolved.notes??[]).filter(i=>Number.isInteger(i)&&i>=0&&i<(board.reviewedNotes?.length??0)))].map(i=>({area:`格外说明 ${i+1}`,reason}));
 const tasks=[...new Set((unresolved.additionalTasks??[]).filter(t=>typeof t==='string'&&t.trim()))].map(area=>({area,reason}));
 return [...body,...notes,...tasks];
}
