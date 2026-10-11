import {recoverGridCells} from './grid-recovery.js';
// Browser port of the line morphology/contour strategy in eihli/image-table-ocr.
// MIT, Copyright (c) 2020 Eric Ihli. Attribution and license shipped alongside.
// Multi-thresholds, grid-size adaptation, quadrilateral filters and NMS are local additions.
export function detectOpenCVCells(cv,rgba,width,height,sensitivity=120,mode='lines',scoped=false) {
 if(width<20||height<20||rgba.length!==width*height*4)throw Error('识别图像尺寸不正确');
 const resources=[],keep=m=>(resources.push(m),m),area=width*height,boxes=[];
 try {
 const src=keep(cv.matFromArray(height,width,cv.CV_8UC4,rgba)),gray=keep(new cv.Mat());cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY);
 const bin=keep(new cv.Mat()),h=keep(new cv.Mat()),v=keep(new cv.Mat()),mask=keep(new cv.Mat());
 const hk=keep(cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(Math.max(12,Math.round(width*.022)),1))),vk=keep(cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(1,Math.max(12,Math.round(height*.022))))),gap=keep(cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(3,3)));
 for(const threshold of (mode==='edges'?['edge']: [Math.max(50,sensitivity-40),sensitivity,Math.min(220,sensitivity+60),null])) {
 if(threshold==='edge')cv.Canny(gray,bin,Math.max(20,sensitivity/2),sensitivity*1.8);else if(threshold===null)cv.adaptiveThreshold(gray,bin,255,cv.ADAPTIVE_THRESH_GAUSSIAN_C,cv.THRESH_BINARY_INV,31,10);else cv.threshold(gray,bin,threshold,255,cv.THRESH_BINARY_INV);
 cv.morphologyEx(bin,h,cv.MORPH_OPEN,hk);cv.morphologyEx(bin,v,cv.MORPH_OPEN,vk);cv.bitwise_or(h,v,mask);cv.morphologyEx(mask,mask,cv.MORPH_CLOSE,gap);
 cv.rectangle(mask,new cv.Point(0,0),new cv.Point(width-1,height-1),new cv.Scalar(255),2);cv.rectangle(bin,new cv.Point(0,0),new cv.Point(width-1,height-1),new cv.Scalar(255),2);
 // Also inspect the raw threshold for inclined rectangular borders.
 for(const source of [mask,bin]) {
 const contours=new cv.MatVector(),hierarchy=new cv.Mat();
 try{cv.findContours(source,contours,hierarchy,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
 for(let i=0;i<contours.size();i++) {const contour=contours.get(i),approx=new cv.Mat();try {
 const r=cv.boundingRect(contour),a=r.width*r.height;
 if(r.width<14||r.height<14||a<area*.0007||a>area*(scoped?.25:.05)||r.width>width*(scoped?.8:.3)||r.height>height*(scoped?.8:.3)||r.width/r.height<.35||r.width/r.height>3)continue;
 cv.approxPolyDP(contour,approx,cv.arcLength(contour,true)*.025,true);
 const fill=Math.abs(cv.contourArea(contour))/a;
 if(fill<.68||approx.rows<4||approx.rows>12||(approx.rows!==4&&fill<.78))continue;
 boxes.push({x:r.x/width,y:r.y/height,width:r.width/width,height:r.height/height});
 }finally{contour.delete();approx.delete();}}
 }finally{contours.delete();hierarchy.delete();}}
 }
 if(mode!=='edges'){
 const edge=keep(new cv.Mat()),longH=keep(new cv.Mat()),longV=keep(new cv.Mat());
 const longHK=keep(cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(Math.max(18,Math.round(width*.04)),1))),longVK=keep(cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(1,Math.max(18,Math.round(height*.04)))));
 cv.Canny(gray,edge,20,60);cv.rectangle(edge,new cv.Point(0,0),new cv.Point(width-1,height-1),new cv.Scalar(255),1);cv.morphologyEx(edge,edge,cv.MORPH_CLOSE,gap);cv.morphologyEx(edge,longH,cv.MORPH_OPEN,longHK);cv.morphologyEx(edge,longV,cv.MORPH_OPEN,longVK);
 const seeds=filterCellBoxes(boxes);
 const recovered=recoverGridCells(longH.data,longV.data,width,height,seeds).filter(b=>{
 const overlap=seeds.filter(a=>{const inter=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));return inter/Math.min(a.width*a.height,b.width*b.height)>.72;});
 if(!overlap.length)return true;
 // Do not merge established cells or cut a deliberate tall cell with text-line edges.
 if(overlap.some(a=>b.width*b.height>=a.width*a.height*.65))return false;
 return overlap.some(a=>backgroundDifference(rgba,width,height,a)>24);
 });boxes.push(...recovered);
 }
 return filterCellBoxes(boxes);
 }finally{for(const m of resources.reverse())m.delete();}
}
export function filterCellBoxes(boxes){
 if(!boxes.length)return [];
 // Favor dominant cell sizes; discard text loops and larger enclosing regions.
 const areas=boxes.map(b=>b.width*b.height).sort((a,b)=>a-b),typical=areas[Math.floor(areas.length*.65)];
 const result=[];
 for(const b of boxes.filter(b=>b.width*b.height>typical*.40&&b.width*b.height<typical*2.6).sort((a,b)=>(b._score??0)-(a._score??0)||Math.abs(Math.log(a.width*a.height/typical))-Math.abs(Math.log(b.width*b.height/typical)))){
 const duplicate=result.some(a=>{const intersect=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));return intersect/Math.min(a.width*a.height,b.width*b.height)>.75;});
 if(!duplicate)result.push(b);
 }
 return result.sort((a,b)=>a.y-b.y||a.x-b.x).slice(0,256);
}

function backgroundDifference(rgba,width,height,b){
 const median=(cx,cy)=>[0,1,2].map(channel=>{const values=[];for(let yy=-4;yy<=4;yy++)for(let xx=-4;xx<=4;xx++){const x=Math.max(0,Math.min(width-1,Math.round(cx*width)+xx)),y=Math.max(0,Math.min(height-1,Math.round(cy*height)+yy));values.push(rgba[(y*width+x)*4+channel]);}values.sort((a,b)=>a-b);return values[40];});
 const a=median(b.x+b.width*.13,b.y+b.height*.24),c=median(b.x+b.width*.13,b.y+b.height*.76);return Math.max(...a.map((v,i)=>Math.abs(v-c[i])));
}
