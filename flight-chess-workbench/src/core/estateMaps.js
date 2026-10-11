export const ESTATE_MAP_SIZES=[12,20,28];
export const ORIGINAL_LOTS=['起点','花园','事件','书屋','咖啡馆','画室','事件','影院','露台','小屋','事件','广场'];
const extraNames=['河岸','集市','事件','音乐屋','花店','工坊','事件','码头','公园','茶室','事件','展馆','旅店','天台','事件','灯塔'];
const groupNames=['林间街区','文艺街区','光影街区','生活街区','河畔街区','音乐街区','港湾街区','花园街区','旅居街区','远景街区'];
const colors=['#8ca77b','#ca9b7c','#a395be','#78a6ad','#87a5bf','#c9ad6d','#ae8eae','#88b3a3','#bf9682','#9ba6cb'];
function makeMap(size){
 const side=size/4+1,tiles=[...ORIGINAL_LOTS,...extraNames].slice(0,size).map((name,i)=>({name,kind:i===0?'start':i%4===2?['penalty','reward','contract'][Math.floor((i-2)/4)%3]:'property'}));
 const properties=tiles.flatMap((t,i)=>t.kind==='property'?[i]:[]);
 const groups=Array.from({length:properties.length/2},(_,i)=>({name:groupNames[i],color:colors[i],lots:properties.slice(i*2,i*2+2)}));
 const positions=[];
 for(let x=side-1;x>=0;x--)positions.push([x,side-1]);
 for(let y=side-2;y>=0;y--)positions.push([0,y]);
 for(let x=1;x<side;x++)positions.push([x,0]);
 for(let y=1;y<side-1;y++)positions.push([side-1,y]);
 return {size,side,tiles,groups,positions};
}
const maps=Object.fromEntries(ESTATE_MAP_SIZES.map(n=>[n,makeMap(n)]));
// Missing size is the original 12-lot map, including old saves.
export function estateMap(config){return maps[config?.estate?.mapSize??12];}
