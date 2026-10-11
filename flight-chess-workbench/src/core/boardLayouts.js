// Board coordinates describe the route; empty cells are deliberately kept empty.
export const BOARD_STYLES = ['cross', 'hollow-spiral', 'flowchart', 'switchback', 'dual-track', 'winding', 'paper-spiral', 'grid-snake', 'grid-spiral', 'extended-reference'];
const lines = vertices => {
  const points = [[...vertices[0]]];
  for (let i = 1; i < vertices.length; i++) {
    let [x, y] = points.at(-1); const [tx, ty] = vertices[i];
    const dx = Math.sign(tx - x), dy = Math.sign(ty - y);
    while (x !== tx || y !== ty) { x += dx; y += dy; points.push([x, y]); }
  }
  return points;
};
const spacedSnake = (columns, rows) => Array.from({ length: rows }, (_, y) => Array.from({ length: columns }, (_, x) => [2 * (y % 2 ? columns - x - 1 : x), y * 3])).flat();
export function referenceLayout(id) {
  if (id === 'classic') return { style: 'cross', columns: 11, rows: 13, path: lines([[4,12],[4,9],[0,9],[0,6],[4,6],[4,0],[7,0],[7,6],[10,6],[10,9],[7,9],[7,12],[5,12],[5,7]]) };
  if (id === 'spiral') return { style: 'hollow-spiral', columns: 10, rows: 10, path: lines([[0,9],[0,0],[9,0],[9,9],[3,9],[3,3],[6,3],[6,6],[4,6],[4,5]]) };
  if (id === 'chase') return { style: 'dual-track', columns: 13, rows: 10, path: lines([[0,9],[0,0],[12,0],[12,9],[3,9],[3,3],[5,3],[5,4]]) };
  if (id === 'cooperative') return { style: 'switchback', columns: 11, rows: 16, path: spacedSnake(6,6) };
  // Flowchart uses wide, staggered nodes and explicit directed choice connectors.
  if (id === 'choice') return { style: 'flowchart', columns: 16, rows: 13, path: Array.from({length:49}, (_, i) => { const row = Math.floor(i / 8), col = i % 8; return [2 * (row % 2 ? 7 - col : col) + (row % 2 ? 1 : 0), row * 2]; }) };
  return { style: 'winding', columns: 15, rows: 13, path: Array.from({length:49}, (_, i) => { const row = Math.floor(i / 7), col = i % 7; return [2 * (row % 2 ? 6 - col : col) + (row % 2 ? 1 : 0), row * 2]; }) };
}
// Display coordinates are independent of saved route indices. Lengthen a source
// silhouette without packing every position into the logical n-by-n grid.
function spacedPolyline(vertices,count,style){
  vertices=vertices.filter((p,i)=>i===0||Math.hypot(p[0]-vertices[i-1][0],p[1]-vertices[i-1][1])>1e-7);
  const segments=vertices.slice(1).map((p,i)=>({from:vertices[i],to:p,length:Math.hypot(p[0]-vertices[i][0],p[1]-vertices[i][1])}));
  const total=segments.reduce((n,s)=>n+s.length,0),extra=count-1-segments.length;
  const slots=segments.map(s=>1+Math.floor(extra*s.length/total));
  let left=count-1-slots.reduce((n,k)=>n+k,0);
  const order=segments.map((s,i)=>({i,f:extra*s.length/total%1})).sort((a,b)=>b.f-a.f);
  for(let i=0;left>0;i++,left--)slots[order[i%order.length].i]++;
  const path=[[...vertices[0]]];
  segments.forEach((s,i)=>{for(let j=1;j<=slots[i];j++)path.push([s.from[0]+(s.to[0]-s.from[0])*j/slots[i],s.from[1]+(s.to[1]-s.from[1])*j/slots[i]]);});
  let closest=Infinity;
  for(let i=0;i<path.length;i++)for(let j=i+1;j<path.length;j++)closest=Math.min(closest,Math.max(Math.abs(path[i][0]-path[j][0]),Math.abs(path[i][1]-path[j][1])));
  if(closest<1e-7)throw Error('Expanded drawing overlaps itself');
  // A card spans 58/64 units; 1.18 keeps both its border and the two
  // outside player brackets clear while spending less space on connectors.
  const scale=1.18/closest,minX=Math.min(...path.map(p=>p[0])),minY=Math.min(...path.map(p=>p[1]));
  const placed=path.map(([x,y])=>[(x-minX)*scale+.5,(y-minY)*scale+.5]);
  return {style,columns:Math.ceil(Math.max(...placed.map(p=>p[0]))+1),rows:Math.ceil(Math.max(...placed.map(p=>p[1]))+1),path:placed};
}
function openSpiral(count,wide=false){
  const side=7.6*Math.max(1,Math.floor(Math.sqrt(count)/4))+6.4;
  let left=0,top=0,right=side*(wide?1.2:1),bottom=side;
  const vertices=[[left,bottom]];
  while(right-left>8&&bottom-top>8){
    vertices.push([left,top],[right,top],[right,bottom]);left+=3.8;
    vertices.push([left,bottom]);top+=3.8;right-=3.8;bottom-=3.8;
  }
  vertices.push([left,top],[(left+right)/2,top],[(left+right)/2,(top+bottom)/2]);
  return spacedPolyline(vertices,count,wide?'dual-track':'hollow-spiral');
}
function openCross(count){
  const rings=count>=100?2:1,e=count/(rings*8+1)*1.55+3,a=e*.4,vertices=[];
  for(let i=0;i<rings;i++){
    const extent=e-i*5,arm=a-i*2.5;
    if(i)vertices.push([-arm,e]);
    vertices.push([-arm,extent],[-arm,arm],[-extent,arm],[-extent,-arm],[-arm,-arm],[-arm,-extent],[arm,-extent],[arm,-arm],[extent,-arm],[extent,arm],[arm,arm],[arm,extent]);
  }
  const last=vertices.at(-1);vertices.push([0,last[1]],[0,0]);
  return spacedPolyline(vertices,count,'cross');
}
export function extendedLayout(id,count,shape='reference'){
  if(shape==='spiral'||shape==='reference'&&id==='spiral')return openSpiral(count);
  if(shape==='reference'&&id==='classic')return openCross(count);
  if(shape==='reference'&&id==='chase')return openSpiral(count,true);
  const style=shape==='snake'?'switchback':id==='choice'?'flowchart':id==='events'?'winding':'switchback';
  const across=Math.max(6,Math.ceil(Math.sqrt(count)*1.15)),rowGap=style==='flowchart'?2.7:style==='winding'?2:1.85,path=Array.from({length:count},(_,i)=>{const row=Math.floor(i/across),col=i%across;return [(row%2?across-1-col:col)*1.22+.5+(style==='winding'?row%2*.2:0),row*rowGap+.5];});
  return {style,columns:Math.ceil(Math.max(...path.map(p=>p[0]))+1),rows:Math.ceil(Math.max(...path.map(p=>p[1]))+1),path};
}
export function boardGeometry(config) {
  if(!config.layout.image&&['extended-reference','grid-snake','grid-spiral'].includes(config.layout.style))return extendedLayout(config.id.replace('mode-',''),config.layout.path.length,config.layout.style==='grid-snake'?'snake':config.layout.style==='grid-spiral'?'spiral':'reference');
  if (config.layout.image || config.layout.style) return config.layout;
  // Previous built-in saves retain their exact rules/indices while gaining the new drawing.
  if (config.id.startsWith('mode-')) {
    const id = config.id.slice(5);
    if (['classic','spiral','choice','cooperative','chase','events'].includes(id)) {
      const next = referenceLayout(id);
      if (next.path.length === config.layout.path.length) return next;
    }
  }
  return config.layout;
}
