import {createTemplate,validateConfig} from './config.js';
// Manually verified geometry from the supplied numbered board. No task OCR.
export function createReference51(){
 const path=[[10,8]];
 for(let y=7;y>=0;y--)path.push([10,y]); // 1–8, right edge upward
 for(let x=9;x>=0;x--)path.push([x,0]); // 9–18, top leftward
 for(let y=1;y<=7;y++)path.push([0,y]); // 19–25, left downward
 for(let x=1;x<=8;x++)path.push([x,7]); // 26–33, bottom rightward
 for(let y=6;y>=2;y--)path.push([8,y]); // 34–38, inner edge upward
 for(let x=7;x>=2;x--)path.push([x,2]); // 39–44, inner top leftward
 for(let y=3;y<=5;y++)path.push([2,y]); // 45–47, inner left downward
 for(let x=3;x<=6;x++)path.push([x,5]); // 48–51, inner bottom rightward
 path.push([6,4]); // 52, center finish
 const c=createTemplate();c.id='verified-spiral-51';c.title='图片螺旋地图 · 51 个编号格';c.description='人工核对原图 1–51 格路线，另补起点 0 与终点 52。移动规则保留；露骨任务替换为可编辑占位。移动后不连锁触发。';
 c.layout={columns:11,rows:9,path,style:'paper-spiral'};c.rules={launchOnSix:false,finish:'stop',chainEffects:false,maxChain:12,goal:'race'};
 c.decks={reference51:{name:'示例互动占位',cards:['由玩家共同确认一项可接受的非露骨互动任务，也可以跳过。']}};
 const times={2:10,7:120,9:10,10:10,12:20,14:20,15:20,16:20,17:30,19:20,20:10,21:20,23:20,24:120,26:20,27:20,28:30,30:20,32:120,34:30,35:30,36:30,37:120,40:30,43:30,45:30,48:60,49:60};
 const forward=new Set([8,18,25,33,38,44]),back={4:-2,13:-2,22:-2,29:-2,47:-5,51:-3,41:-22,50:-19};
 c.tiles=path.map((_,i)=>{
  if(i===0)return {type:'start',label:'起点',color:'#edab79'};
  if(i===52)return {type:'finish',label:'终点',color:'#f6d05c'};
  if(forward.has(i))return {type:'move',steps:2,label:'前进2格',color:'#fff0a9'};
  if(back[i])return {type:'move',steps:back[i],label:i===41?'退回第19格':i===50?'退回第31格':`后退${-back[i]}格`,color:'#ed5345'};
  if(i===1)return {type:'plain',label:'准备确认',color:'#fffdf8'};
  return {type:'task',deck:'reference51',target:'self',label:'互动占位',...(times[i]?{duration:times[i]}:{}),color:[7,17,24,32,37].includes(i)?'#c58acf':[3,6,21,28].includes(i)?'#a6d291':[9,14,20,31,36,43].includes(i)?'#78b4de':'#c9d7e4'};
 });return validateConfig(c);
}
