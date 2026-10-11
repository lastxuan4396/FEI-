import { createTemplate, validateConfig, snakePath } from './config.js';
// Local, deterministic detection of enclosed light/colored cell interiors. No OCR/network.
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
export function buildImageBoard(title, image, regions, overrides = {}, options = {}) {
  if(options.navigation!==undefined&&options.navigation!=='manual')throw Error('行走方式不正确');
  const c=createTemplate();
  c.id=`image-${Date.now().toString(36)}`;c.title=title.trim()||'我的图片地图';c.description='按图片上的编号路线行走，任务由玩家共同确认。';
  const columns=Math.min(16,Math.max(2,Math.ceil(Math.sqrt(regions.length)))),rows=Math.max(2,Math.ceil(regions.length/columns));
  c.layout={columns,rows,path:snakePath(columns,rows).slice(0,regions.length),image:{...image,regions:regions.map(b=>({...b}))}};
  c.rules={...c.rules,finish:'stop',launchOnSix:false,goal:'race',...(options.finishAllPlayers!==undefined?{finishAllPlayers:options.finishAllPlayers}:{})};
  c.decks={image_map:{name:'图片地图任务',cards:['查看当前格，大家共同确认一个可接受的互动任务；也可以跳过。']}};
  c.tiles=regions.map((_,i)=>i===0?{...overrides[i],type:'start'}:i===regions.length-1?{...overrides[i],type:'finish'}:overrides[i]??{type:'task',deck:'image_map',target:'self'});
  if(options.navigation==='manual'){c.description='在原图掷骰后点选实际落点；位置编号不代表行走顺序，复杂条件由玩家按原图共同核对。';c.rules={...c.rules,navigation:'manual',chainEffects:false};c.tiles=c.tiles.map(t=>['start','finish','task','plain'].includes(t.type)?t:{type:'plain',...(t.text?{text:t.text}:{}),...(t.notes?{notes:t.notes}:{})});const starts=options.startingPositions??[0,0];if(!Array.isArray(starts)||starts.length<2||starts.length>4)throw Error('请选择2–4位玩家起点');c.players=starts.map((start,i)=>({...(c.players[i]??{id:`p${i}`,name:`玩家 ${i+1}`,color:['#e26b49','#497f88','#8d70be','#b7943e'][i]}),start}));}
  return validateConfig(c);
}

export function pointRegion(x,y,image){
 const width=.045,height=Math.min(.12,width*image.width/image.height);
 return {x:Math.max(0,Math.min(1-width,x-width/2)),y:Math.max(0,Math.min(1-height,y-height/2)),width,height};
}
export function parseImageRouteJSON(source){
 if(typeof source!=='string'||source.length>1000000)throw Error('路线标记文件过大');
 let p;try{p=JSON.parse(source);}catch{throw Error('路线标记JSON不正确');}
 if(p?.version!==1||p.type!=='image-route'||!Number.isInteger(p.width)||!Number.isInteger(p.height)||p.width<1||p.width>4096||p.height<1||p.height>4096)throw Error('路线标记版本或图片尺寸不正确');
 if(!Array.isArray(p.regions)||p.regions.length<4||p.regions.length>256||!Array.isArray(p.tiles)||p.tiles.length!==p.regions.length)throw Error('路线标记格数不正确');
 const overrides=Object.fromEntries(p.tiles.map((t,i)=>[i,t.type==='task'?{...t,deck:'image_map'}:t]));
 const c=buildImageBoard(p.title??'预设图片路线',{dataUrl:'data:image/png;base64,AAAA',width:p.width,height:p.height,...(p.displayRotation!==undefined?{displayRotation:p.displayRotation}:{})},p.regions,overrides,{navigation:p.navigation,startingPositions:p.startingPositions,finishAllPlayers:p.finishAllPlayers});
 return {width:p.width,height:p.height,...(c.layout.image.displayRotation?{displayRotation:c.layout.image.displayRotation}:{}),title:c.title,regions:c.layout.image.regions,tiles:c.tiles,...(c.rules.navigation?{navigation:c.rules.navigation,startingPositions:c.players.map(p=>p.start??0),...(c.rules.finishAllPlayers?{finishAllPlayers:true}:{})}:{})};
}
