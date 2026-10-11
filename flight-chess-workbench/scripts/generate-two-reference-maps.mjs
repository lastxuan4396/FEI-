import fs from 'node:fs';
import {createTemplate,validateConfig} from '../src/core/config.js';
import {referenceLayout} from '../src/core/boardLayouts.js';
const deck={reference:{name:'图片互动占位',cards:['共同确认一项非露骨互动，也可以选择跳过。']}};
const tiles=path=>path.map((_,i)=>i===0?{type:'start',label:'起点',color:'#ebbd82'}:i===path.length-1?{type:'finish',label:'终点',color:'#a6d45d'}:{type:'task',deck:'reference',target:'self',label:'互动占位',color:'#e6e6e6'});
// Numbered image: 0 is the printed start; 1–44 remain unchanged.
const p=[[7,9]];for(let y=8;y>=0;y--)p.push([7,y]);for(let x=6;x>=0;x--)p.push([x,0]);for(let y=1;y<=9;y++)p.push([0,y]);for(let x=1;x<=5;x++)p.push([x,9]);for(let y=8;y>=2;y--)p.push([5,y]);for(let x=4;x>=2;x--)p.push([x,2]);for(let y=3;y<=5;y++)p.push([2,y]);p.push([3,5],[3,4]);
let c=createTemplate();c.id='verified-spiral-44';c.title='编号 1–44 · 内圈螺旋地图';c.description='核对原图0起点及1–44编号，另加45终点，共46格。保留可确定的前退格和回起点；露骨任务与不支持的持续状态用占位，14格只保留后退2格，未配置附加翻倍。';c.layout={columns:8,rows:10,path:p};c.rules={launchOnSix:false,finish:'stop',chainEffects:false,maxChain:12,goal:'race'};c.decks=deck;c.tiles=tiles(p);
for(const [i,steps] of [[4,-3],[7,3],[14,-2],[29,-5],[34,4],[36,3],[40,-5]])c.tiles[i]={type:'move',steps,label:`${steps>0?'前进':'后退'}${Math.abs(steps)}格`,color:'#aad5e6'};
for(const i of [9,25])c.tiles[i]={type:'home',label:'回到起点',color:'#edb69c'};
for(const i of [20,22,30])c.tiles[i]={type:'plain',label:'状态占位',color:'#d4c6e8'};
fs.writeFileSync('examples/verified-spiral-44.json',JSON.stringify(validateConfig(c),null,2)+'\n');
// The small unnumbered reference does not resolve all original cells/branches.
// Deliver an explicitly marked playable approximation, not a claimed exact copy.
c=createTemplate();c.id='reference-four-cross-adapted';c.title='四人十字棋盘 · 共享路线改编';c.description='参考第一张十字外形制作的可玩改编：四人共享路线，共49格。原图文字及格线过小，格数未逐格确认；未实现四条独立终点航线、四起点、碰撞退回与追赶规则。露骨任务用占位。';c.layout=referenceLayout('classic');c.rules={launchOnSix:true,finish:'stop',chainEffects:false,maxChain:12,goal:'race'};c.decks=deck;c.players=['A','B','C','D'].map((v,i)=>({id:`p${i}`,name:`玩家 ${v}`,color:['#e26b49','#497f88','#78a052','#a67db5'][i]}));c.tiles=tiles(c.layout.path).map((t,i)=>t.type==='task'?{...t,color:i>=43?'#9bc9ef':'#fffdf8'}:t);
fs.writeFileSync('examples/reference-four-cross-adapted.json',JSON.stringify(validateConfig(c),null,2)+'\n');
console.log('created',p.length,'spiral cells and',c.tiles.length,'adapted cross cells');
