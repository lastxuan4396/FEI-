import test from'node:test';import assert from'node:assert/strict';import{imageDisplay,imageTaskOverlay}from'../src/core/imageDisplay.js';import{taskPreviewLines}from'../src/core/taskPreview.js';
test('all quarter-turn cell overlays retain the source cell footprint and a horizontal reading baseline',()=>{
 const r={x:.18,y:.24,width:.13,height:.21};for(const rotation of [0,90,180,270]){const image={width:675,height:900,displayRotation:rotation},o=imageTaskOverlay(image,r),display=imageDisplay(image,r);assert.equal(o.width,display.crop.width);assert.equal(o.height,display.crop.height);assert(Math.abs(o.x+o.width/2-(r.x+r.width/2)*image.width)<1e-9);assert(Math.abs(o.y+o.height/2-(r.y+r.height/2)*image.height)<1e-9);assert.equal(o.transform,rotation?`rotate(${-rotation},${(r.x+r.width/2)*image.width},${(r.y+r.height/2)*image.height})`:undefined);}
});
test('cell previews preserve separated time numbers and complete Unicode symbols; long text has an explicit cue without changing the source',()=>{
 assert.equal(taskPreviewLines('69 1分钟').join(''),'69 1分钟');assert.equal(taskPreviewLines('69\n20秒').join(''),'69 20秒');assert.equal(taskPreviewLines(' 🧭 与 👋 ').join(''),'🧭 与 👋');
 const text='检查原图和文字的位置，然后朗读完整说明内容';const a=taskPreviewLines(text);assert.equal(a.length,4);assert(a[3].endsWith('…'));assert(a.every(x=>Array.from(x).length<=4));assert.equal(text,'检查原图和文字的位置，然后朗读完整说明内容');
});
