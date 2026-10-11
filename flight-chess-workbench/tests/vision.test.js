import test from 'node:test';import assert from 'node:assert/strict';
import {filterCellBoxes} from '../public/vision/cell-detector.js';
test('OpenCV多阈值重复轮廓合并，文字孔洞不成为额外格子',()=>{
 const cells=Array.from({length:16},(_,i)=>({x:(i%4)*.2,y:Math.floor(i/4)*.2,width:.18,height:.18}));
 const nested=cells.map(b=>({...b,x:b.x+.003,y:b.y+.003,width:.174,height:.174}));
 const glyphs=cells.map(b=>({...b,x:b.x+.07,y:b.y+.07,width:.025,height:.025}));
 const result=filterCellBoxes([...cells,...nested,...glyphs]);assert.equal(result.length,16);assert.deepEqual(result.map(b=>[b.x.toFixed(2),b.y.toFixed(2)]),cells.map(b=>[(b.x+.003).toFixed(2),(b.y+.003).toFixed(2)]));assert.deepEqual(filterCellBoxes([]),[]);
});

import {normalizeLowContrast} from '../public/vision/contrast.js';
test('灰雾低对比亮度归一化，清晰图和空白图保持原像素',()=>{const clear=new Uint8ClampedArray([0,0,0,255,255,255,255,255]),blank=new Uint8ClampedArray([240,240,240,255]);assert.equal(normalizeLowContrast(clear),clear);assert.equal(normalizeLowContrast(blank),blank);const low=new Uint8ClampedArray([190,190,190,255,230,230,230,255]);const r=normalizeLowContrast(low);assert.equal(r[0],0);assert.equal(r[4],255);assert.equal(r[3],255);assert.equal(low[0],190);});
