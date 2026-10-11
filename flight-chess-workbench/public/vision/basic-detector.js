// Reused local fallback algorithm from src/core/imageMaps.js; no OCR.
export function detectCells(rgba, width, height, threshold = 120) {
  const size=width*height, light=new Uint8Array(size),seen=new Uint8Array(size),queue=new Int32Array(size),boxes=[];
  for(let i=0;i<size;i++){const k=i*4;light[i]=rgba[k]*.299+rgba[k+1]*.587+rgba[k+2]*.114>threshold?1:0;}
  // Close tiny gaps in the dark outlines so adjacent cells remain separate.
  const mask=light.slice();
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const i=y*width+x;if(!light[i]){mask[i-1]=0;mask[i+1]=0;mask[i-width]=0;mask[i+width]=0;}}
  for(let start=0;start<size;start++){
    if(seen[start]||!mask[start])continue;
    let head=0,tail=1,minX=width,maxX=0,minY=height,maxY=0;queue[0]=start;seen[start]=1;
    while(head<tail){const i=queue[head++],x=i%width,y=Math.floor(i/width);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(const n of [x?i-1:-1,x<width-1?i+1:-1,y?i-width:-1,y<height-1?i+width:-1])if(n>=0&&!seen[n]&&mask[n]){seen[n]=1;queue[tail++]=n;}
    }
    const w=maxX-minX+1,h=maxY-minY+1,area=w*h;
    if(w>=10&&h>=10&&w<width*.27&&h<height*.27&&area>size*.0004&&area<size*.065&&w/h>.3&&w/h<3.5&&tail/area>.52)boxes.push({x:minX/width,y:minY/height,width:w/width,height:h/height});
  }
  if(!boxes.length)return [];
  // Discard small glyph holes using the area of the larger candidates.
  const areas=boxes.map(b=>b.width*b.height).sort((a,b)=>b-a),typical=areas[Math.floor(Math.min(areas.length-1,areas.length*.3))];
  return boxes.filter(b=>b.width*b.height>=typical*.25).sort((a,b)=>a.y-b.y||a.x-b.x).slice(0,256);
}
