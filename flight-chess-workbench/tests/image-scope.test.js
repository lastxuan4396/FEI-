import test from 'node:test';import assert from 'node:assert/strict';
import {validateRecognitionArea,pixelWindow,remapScopedRegions,insideRecognitionArea} from '../src/core/imageScope.js';
import {backgroundPalette,refineCellsByColor} from '../public/vision/color-detector.js';
import {readFileSync} from 'node:fs';
import {parseImageRouteJSON} from '../src/core/imageMaps.js';
test('局部识别用真实像素窗口映射回整图，最右下与非整数尺寸不越界',()=>{
 const a={x:.211,y:.107,width:.511,height:.329},p=pixelWindow(913,721,a);
 assert.equal(p.x,192);assert.equal(p.width,468);
 const b=remapScopedRegions([{id:'cell',x:0,y:0,width:1,height:1}],p.area)[0];
 assert.equal(b.id,'cell');assert.ok(Math.abs(b.width*913-468)<1e-9);
 assert.ok(b.x+b.width<=1);assert.deepEqual(pixelWindow(3,3,{x:.9,y:.9,width:.1,height:.1}),{x:2,y:2,width:1,height:1,area:{x:2/3,y:2/3,width:1/3,height:1/3}});
 assert.deepEqual(remapScopedRegions([{x:.1,y:.2,width:.3,height:.4}],undefined),[{x:.1,y:.2,width:.3,height:.4}]);
});
test('局部识别草稿拒绝越界、零尺寸和无效数值，不改变区域外格子',()=>{
 for(const a of [null,{x:-1,y:0,width:1,height:1},{x:0,y:0,width:0,height:1},{x:0,y:0,width:NaN,height:1},{x:.9,y:0,width:.2,height:1}])assert.throws(()=>validateRecognitionArea(a));
 assert.equal(validateRecognitionArea(undefined),undefined);assert.throws(()=>pixelWindow(0,42));
 const area={x:.2,y:.3,width:.3,height:.2};assert.equal(insideRecognitionArea({x:.24,y:.32,width:.1,height:.1},area),true);assert.equal(insideRecognitionArea({x:.7,y:.8,width:.1,height:.1},area),false);
});
test('底色采样包含彩色与黑色实心格，纸张与稀疏彩字不成为背景调色板',()=>{
 const w=128,h=128,p=new Uint8ClampedArray(w*h*4).fill(255);
 for(let y=8;y<64;y++)for(let x=8;x<64;x++){let i=(y*w+x)*4;p[i]=210;p[i+1]=145;p[i+2]=190;}
 for(let y=72;y<120;y++)for(let x=72;x<120;x++){let i=(y*w+x)*4;p[i]=10;p[i+1]=10;p[i+2]=10;}
 p[0]=255;p[1]=0;p[2]=0;const palette=backgroundPalette(p,w,h);
 assert.equal(palette.length,2);assert.deepEqual(palette[0],[210,145,190]);assert.deepEqual(palette[1],[10,10,10]);
});
test('两种格框方法几乎全数一对一吻合才去掉标题误框，漏检白格与相邻格合并不会删格',()=>{
 const cells=Array.from({length:20},(_,i)=>({x:(i%5)*.18,y:Math.floor(i/5)*.18,width:.16,height:.16}));
 const extra={x:.91,y:.01,width:.04,height:.04},all=[...cells,extra],colors=cells.map(c=>({...c,x:c.x+.003,y:c.y+.003,width:c.width-.006,height:c.height-.006}));
 assert.deepEqual(refineCellsByColor(all,colors),cells);
 assert.equal(refineCellsByColor(all,colors.slice(0,17)),all);
 assert.equal(refineCellsByColor(all,[...colors.slice(0,19),{x:0,y:0,width:.34,height:.16}]),all);
 assert.equal(refineCellsByColor(all,[]),all);
});
test('新增编号图坐标模板可直接导入；63编号图使用原图手动落子保留复杂条件边界',()=>{
 const a=parseImageRouteJSON(readFileSync(new URL('../public/route-presets/verified-source-23-image-route.json',import.meta.url),'utf8'));
 assert.equal(a.regions.length,65);assert.equal(a.navigation,'manual');assert.deepEqual(a.startingPositions,[0,0]);
 const b=parseImageRouteJSON(readFileSync(new URL('../public/route-presets/verified-source-24-image-route.json',import.meta.url),'utf8'));
 assert.equal(b.regions.length,53);assert.equal(b.navigation,undefined);
 assert.ok(b.regions[1].y<b.regions[0].y);assert.ok(b.regions[20].y>b.regions[19].y);
 assert.equal(b.tiles[0].type,'start');assert.equal(b.tiles.at(-1).type,'finish');
});
