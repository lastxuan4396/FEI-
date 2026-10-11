// A recognition window changes processing, never the source artwork or saved cells.
export function validateRecognitionArea(area) {
 if(area===undefined)return undefined;
 if(!area||[area.x,area.y,area.width,area.height].some(n=>!Number.isFinite(n))||area.x<0||area.y<0||area.width<=0||area.height<=0||area.x+area.width>1.000001||area.y+area.height>1.000001)throw Error('识别区域不正确');
 return {x:area.x,y:area.y,width:area.width,height:area.height};
}
export function pixelWindow(width,height,area) {
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1)throw Error('图片尺寸不正确');
 const a=validateRecognitionArea(area)??{x:0,y:0,width:1,height:1};
 const x=Math.min(width-1,Math.floor(a.x*width)),y=Math.min(height-1,Math.floor(a.y*height));
 const w=Math.max(1,Math.min(width,Math.ceil((a.x+a.width)*width))-x),h=Math.max(1,Math.min(height,Math.ceil((a.y+a.height)*height))-y);
 return {x,y,width:w,height:h,area:{x:x/width,y:y/height,width:w/width,height:h/height}};
}
export function remapScopedRegions(regions,area) {
 const a=validateRecognitionArea(area);if(!a)return regions;
 return regions.map(b=>({...b,x:a.x+b.x*a.width,y:a.y+b.y*a.height,width:b.width*a.width,height:b.height*a.height}));
}
export function insideRecognitionArea(region,area) {
 if(!area)return true;const x=region.x+region.width/2,y=region.y+region.height/2;
 return x>=area.x&&x<=area.x+area.width&&y>=area.y&&y<=area.y+area.height;
}
