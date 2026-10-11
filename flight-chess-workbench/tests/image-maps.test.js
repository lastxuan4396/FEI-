import test from 'node:test';
import assert from 'node:assert/strict';
import {detectCells,buildImageBoard} from '../src/core/imageMaps.js';
import {createGame,transition} from '../src/core/engine.js';
import {validateConfig,parseConfigJSON} from '../src/core/config.js';
import {defaultWorkspace,workspaceForImageMap,startWorkspace,parseWorkspace} from '../src/core/workspace.js';
const image={dataUrl:'data:image/png;base64,AAAA',width:600,height:400};
const boxes=n=>Array.from({length:n},(_,i)=>({x:(i%16)/16,y:Math.floor(i/16)/16,width:.05,height:.05}));
test('图片实际格数 4–256 自动匹配引擎，起终点/移动/导出/刷新正确',()=>{
 for(const n of [4,12,49,123,256]){const c=buildImageBoard('照片地图',image,boxes(n),{1:{type:'move',steps:2}});assert.equal(c.tiles.length,n);assert.equal(c.layout.image.regions.length,n);assert.deepEqual(parseConfigJSON(JSON.stringify(c)),c);let s=transition(createGame(c),c,{type:'ROLL'},1);assert.equal(s.players[0].position,3);if(n===4)assert.equal(s.phase,'finished');const w=startWorkspace(workspaceForImageMap(defaultWorkspace(),c));assert.deepEqual(parseWorkspace(JSON.stringify(w)).active.config.layout.image,c.layout.image);}
});
test('图片地图导入保留已编辑题库和玩家，不改变旧快照',()=>{
 const w=startWorkspace(defaultWorkspace());w.themes[0].tasks[0]='我的编辑';const before=structuredClone(w),next=workspaceForImageMap(w,buildImageBoard('新图片',image,boxes(8)));assert.deepEqual(w,before);assert.equal(next.active,null);assert.equal(next.themes[0].tasks[0],'我的编辑');assert.deepEqual(next.players,w.players);assert.equal(next.taskMode,'tile');
});
test('拒绝图片脚本、外部网址、坏框/错数量和超大编码',()=>{
 for(const dataUrl of ['https://bad.test/p.png','data:image/svg+xml;base64,AAAA','data:image/png;base64,'+'A'.repeat(750001)])assert.throws(()=>buildImageBoard('坏图',{...image,dataUrl},boxes(4)));
 for(const bad of [{x:-.1,y:0,width:.1,height:.1},{x:.9,y:0,width:.2,height:.1},{x:0,y:0,width:NaN,height:.1}])assert.throws(()=>buildImageBoard('坏图',image,[bad,...boxes(3)]));const c=buildImageBoard('图',image,boxes(4));c.layout.image.regions.pop();assert.throws(()=>validateConfig(c));assert.throws(()=>buildImageBoard('少格',image,boxes(3)));
});
test('检测彩色/白色黑框格，排除整张背景；不猜测路线顺序',()=>{
 const width=240,height=180,p=new Uint8ClampedArray(width*height*4).fill(255);
 function rect(x,y,w,h,color){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){const k=(j*width+i)*4;p[k]=p[k+1]=p[k+2]=(i<x+3||i>=x+w-3||j<y+3||j>=y+h-3)?0:color;}}
 for(let y=0;y<3;y++)for(let x=0;x<4;x++)rect(10+x*55,10+y*53,43,40,180+x*15);
 const result=detectCells(p,width,height);assert.equal(result.length,12);assert.ok(result.every(b=>b.width<.2&&b.height<.25));assert.deepEqual(detectCells(new Uint8ClampedArray(width*height*4).fill(255),width,height),[]);
});
