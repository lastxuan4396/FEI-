import {filterCellBoxes} from './cell-detector.js';

function overlap(a,b){const inter=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));return inter/(a.width*a.height+b.width*b.height-inter);}
export function refineCellsByColor(cells,colors){
 // Only remove isolated contour noise when two independent methods agree on
 // almost the entire board. Never let partial color coverage erase white tiles.
 if(colors.length<12||colors.length>cells.length||colors.length<cells.length*.90)return cells;
 const pairs=[];for(let i=0;i<colors.length;i++)for(let j=0;j<cells.length;j++){const score=overlap(colors[i],cells[j]);if(score>=.65)pairs.push({i,j,score});}
 pairs.sort((a,b)=>b.score-a.score);const used=new Set(),matched=new Set();
 for(const p of pairs)if(!used.has(p.j)&&!matched.has(p.i)){used.add(p.j);matched.add(p.i);}
 if(matched.size!==colors.length)return cells;
 return cells.filter((_,i)=>used.has(i));
}

// Palette masks keep neighboring pastel tiles separate even without dark grid lines.
// Only solid background colors are candidates; text content never defines a route.
export function backgroundPalette(rgba,width,height) {
 const bins=new Map();
 for(let y=0;y<height;y+=4)for(let x=0;x<width;x+=4){const i=(y*width+x)*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2],v=Math.max(r,g,b),s=v?255*(v-Math.min(r,g,b))/v:0;
  if(v>=75&&s<35||v>=50&&v<75)continue;
  const key=`${Math.floor(r/24)},${Math.floor(g/24)},${Math.floor(b/24)}`;
  let bin=bins.get(key);if(!bin){bin={count:0,r:0,g:0,b:0};bins.set(key,bin);}bin.count++;bin.r+=r;bin.g+=g;bin.b+=b;
 }
 return [...bins.values()].sort((a,b)=>b.count-a.count).slice(0,32).filter(c=>c.count>=Math.max(8,width*height/16000)).map(c=>[c.r/c.count,c.g/c.count,c.b/c.count]);
}
export function detectColorCells(cv,rgba,width,height,scoped=false) {
 if(width<20||height<20||rgba.length!==width*height*4)throw Error('识别图像尺寸不正确');
 const palette=backgroundPalette(rgba,width,height),boxes=[],resources=[],keep=m=>(resources.push(m),m);
 try{
  const src=keep(cv.matFromArray(height,width,cv.CV_8UC4,rgba)),mask=keep(new cv.Mat()),kernel=keep(cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(5,5)));
  for(const color of palette){
   const lower=keep(new cv.Mat(height,width,cv.CV_8UC4,new cv.Scalar(...color.map(v=>Math.max(0,v-18)),0)));
   const upper=keep(new cv.Mat(height,width,cv.CV_8UC4,new cv.Scalar(...color.map(v=>Math.min(255,v+18)),255)));
   cv.inRange(src,lower,upper,mask);cv.morphologyEx(mask,mask,cv.MORPH_CLOSE,kernel);cv.morphologyEx(mask,mask,cv.MORPH_OPEN,kernel);
   const contours=new cv.MatVector(),hierarchy=new cv.Mat();
   try{cv.findContours(mask,contours,hierarchy,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);
    for(let i=0;i<contours.size();i++){const c=contours.get(i);try{const r=cv.boundingRect(c),area=r.width*r.height;
     if(r.width<20||r.height<20||area<width*height*.0015||area>width*height*(scoped?.25:.05)||r.width/r.height<.35||r.width/r.height>3||Math.abs(cv.contourArea(c))/area<.60)continue;
     boxes.push({x:r.x/width,y:r.y/height,width:r.width/width,height:r.height/height});
    }finally{c.delete();}}
   }finally{contours.delete();hierarchy.delete();}
   // Release full-size bounds immediately, rather than retaining 64 extra images.
   resources.pop().delete();resources.pop().delete();
  }
  return filterCellBoxes(boxes);
 }finally{for(const m of resources.reverse())m.delete();}
}
