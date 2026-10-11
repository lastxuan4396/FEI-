import { ImageBoardArtwork } from './ImageBoardArtwork';
import { useId, type ReactNode } from 'react';
import type { CoreConfig } from '../core/types';
import type { Player } from '../types';
import { boardGeometry } from '../core/boardLayouts.js';
import {taskPreviewLines} from '../core/taskPreview.js';
import { tileLabel } from '../core/config.js';

interface Props { config: CoreConfig; players?: Player[]; currentTurn?: number; miniature?: boolean; routePreview?:boolean; fullscreenControls?:ReactNode;expandKey?:number;onExpandedChange?:(value:boolean)=>void;onMoveTo?:(position:number)=>void;moveKey?:number;onInspectTile?:(position:number)=>void }
const palette = ['#9dc6ea', '#ef9cc5', '#9dcda2', '#f4d760', '#baa8df', '#edb889'];
const special: Record<string,string> = { start:'#ecad71', finish:'#f3ca35', move:'#78c9e0', home:'#f09665', extra:'#c1db90', double:'#b0dba3', taskScale:'#b0dba3', skip:'#d5b8df', plain:'#fff8dc', choice:'#cab1ea', random:'#78cde1' };
const chunks = (text: string) => Array.from(text.replace(/[。，、！!]/g, '')).slice(0,12).join('').match(/.{1,4}/g) ?? [];
function Airport({ x, y, name }: { x:number; y:number; name:string }) {
  return <g transform={`translate(${x},${y})`} aria-hidden="true">{palette.map((color,i) => { const a=i*Math.PI/3-Math.PI/2,b=a+Math.PI/3; return <path key={i} d={`M0 0 L${68*Math.cos(a)} ${68*Math.sin(a)} A68 68 0 0 1 ${68*Math.cos(b)} ${68*Math.sin(b)} Z`} fill={color}/>; })}<circle r="30" fill="white"/><text textAnchor="middle" y="-2" fontSize="16" fontWeight="700" fill="#273745">✈</text><text textAnchor="middle" y="18" fontSize="10" fill="#273745">{name}</text>{palette.map((_,i) => <text key={i} x={49*Math.cos((i+.5)*Math.PI/3-Math.PI/2)} y={49*Math.sin((i+.5)*Math.PI/3-Math.PI/2)+4} textAnchor="middle" fontSize="11" fill="#273745">{i+1}</text>)}</g>;
}
export function BoardArtwork({config, players=[], currentTurn=0, miniature=false,routePreview=false,fullscreenControls,onExpandedChange,expandKey,onMoveTo,moveKey,onInspectTile}: Props) {
  const id=useId().replace(/:/g,'');
  if(config.layout.image) return <ImageBoardArtwork config={config} players={players} currentTurn={currentTurn} onMoveTo={onMoveTo} moveKey={moveKey} fullscreenControls={fullscreenControls} expandKey={expandKey} onExpandedChange={onExpandedChange}/>;
  const geometry=boardGeometry(config), {columns,rows,path,style}=geometry;
  const extended=['extended-reference','grid-snake','grid-spiral'].includes(config.layout.style??'');
  const cell=64, margin=32, width=columns*cell+margin*2,height=rows*cell+margin*2;
  const center=(i:number):[number,number] => { const [x,y]=path[i]; return [margin+(x+.5)*cell,margin+(y+.5)*cell+(style==='winding'?(i%3-1)*9:0)]; };
  const title=(x:number,y:number,main:string,sub:string) => {
    const half=Math.max(Array.from(main).length*29/2,Array.from(sub).length*12/2);
    const candidates=[0,-24,-48,24,48,-72,72,-96,96].flatMap(dy=>[0,-64,64,-128,128].map(dx=>[margin+x*cell+dx,margin+y*cell+dy]));
    const point=candidates.find(([cx,cy])=>cx-half>=0&&cx+half<=width&&cy-32>=0&&cy+42<=height&&path.every((_,j)=>{const[px,py]=center(j);return Math.abs(cx-px)>=half+30||cy+42<=py-42||cy-32>=py+30;}));
    if(!point)return null;const[cx,cy]=point;
    return <g aria-hidden="true" data-art-title><text x={cx} y={cy} textAnchor="middle" fontWeight="800" fontSize="29" fill="#c84457">{main}</text><text x={cx} y={cy+.4*cell} textAnchor="middle" fontSize="12" fill="#676773">{sub}</text></g>;
  };
  const singleTeam=config.rules.goal==='cooperative';
  const shownPlayers=singleTeam?players.slice(0,1):players;
  return <svg viewBox={`0 0 ${width} ${height}`} className="board-artwork" role={onInspectTile?"group":"img"} aria-label={`${config.title}棋盘`} data-board-style={style??'custom'}>
    <defs><marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#78929b"/></marker><marker id={`${id}-branch`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#9b6ec5"/></marker></defs>
    <rect width={width} height={height} rx="18" fill={style==='winding'?'#f6f2fb':'#fffdf8'}/>
    {style==='cross' && (extended?<>{[[.15,.15],[.85,.15],[.15,.85],[.85,.85]].map(([x,y],i)=><g key={i} transform={`translate(${margin+columns*x*cell},${margin+rows*y*cell}) scale(${Math.min(3,columns/12)})`}><Airport x={0} y={0} name={`起飞区 ${'ABCD'[i]}`}/></g>)}{title(columns/2,rows/2-2,'十字回环','沿箭头前进 · 到达中心')}</>:<><Airport x={margin+1.8*cell} y={margin+2.3*cell} name="起飞区 A"/><Airport x={margin+9.2*cell} y={margin+2.3*cell} name="起飞区 B"/><Airport x={margin+1.8*cell} y={margin+11*cell} name="起飞区 C"/><Airport x={margin+9.2*cell} y={margin+11*cell} name="起飞区 D"/>{title(2.2,8,'情侣飞行棋','双人互动版')}</>)}
    {style==='hollow-spiral' && (extended?<>{title(columns/2,3,'螺旋大冒险','留白回环 · 沿箭头前进')}</>:<>{title(5,2,'螺旋大冒险','从外圈走向中心 · 沿箭头行走')}{title(6.6,8,'一圈又一圈','加速 · 回退 · 共同挑战')}</>)}
    {style==='paper-spiral' && <>{title(5.3,3.45,'图片螺旋地图','51 个编号格 · 人工核对路线')}</>}
    {style==='dual-track' && (extended?<>{title(columns/2,3,'双人追逐','外圈 → 内圈 · 双人版')}</>:<>{title(7,2,'追逐游戏 ♡','外圈 → 内圈 · 双人版')}{title(8,6.4,'逃跑 / 追逐','领先 6 格 · 追上即获胜')}</>)}
    {path.slice(0,-1).map((_,i)=>{
      if(config.tiles[i].type==='choice' && style==='flowchart') return null;
      const [x,y]=center(i),[tx,ty]=center(i+1),distance=Math.hypot(tx-x,ty-y),ux=(tx-x)/distance,uy=(ty-y)/distance;
      if(style==='winding') return <g key={i}><path d={`M${x} ${y} C${(x+tx)/2} ${y},${(x+tx)/2} ${ty},${tx} ${ty}`} fill="none" stroke="#d5cde1" strokeWidth="22"/><line x1={(x+tx)/2-ux*7} y1={(y+ty)/2-uy*7} x2={(x+tx)/2+ux*7} y2={(y+ty)/2+uy*7} stroke="#78929b" strokeWidth="2" markerEnd={`url(#${id}-arrow)`}/></g>;
      return <line key={i} x1={x+ux*29} y1={y+uy*29} x2={tx-ux*32} y2={ty-uy*32} stroke="#78929b" strokeWidth="2.5" markerEnd={`url(#${id}-arrow)`}/>;
    })}
    {style==='flowchart' && config.tiles.flatMap((tile,i)=>tile.type==='choice'?(tile.options??[]).map((option,o)=>{
      const end=Math.max(0,Math.min(path.length-1,i+option.steps));const [x,y]=center(i),[tx,ty]=center(end),lift=o===0?-54:54;
      const candidates=[0,-24,24,-48,48,-72,72,-96,96].flatMap(dy=>[0,-40,40,-80,80].map(dx=>[(x+tx)/2+dx,(y+ty)/2+lift+dy]));
      const [labelX,labelY]=candidates.find(([lx,ly])=>lx>26&&lx<width-26&&ly>12&&ly<height-12&&path.every((_,j)=>{const[cx,cy]=center(j);return Math.abs(lx-cx)>=54||Math.abs(ly-cy)>=54;}))??candidates[0];
      return <g key={`${i}-${o}`} data-route-choice={`${i}-${o}`}><path d={`M${x} ${y+Math.sign(lift)*25} C${x} ${y+lift},${tx} ${ty+lift},${tx} ${ty+Math.sign(lift)*30}`} fill="none" stroke={o?'#9b6ec5':'#6a9c7b'} strokeWidth="3" markerEnd={`url(#${id}-branch)`}/><rect x={labelX-24} y={labelY-9} width="48" height="18" rx="9" fill="#fffdf8"/>{!miniature&&<text data-branch-label x={labelX} y={labelY+4} textAnchor="middle" fontSize="12" fill="#704e91">{o?'捷径':'稳步'} +{option.steps}</text>}</g>;
    }):[])}
    {config.tiles.map((tile,i)=>{
      const [x,y]=center(i),last=i===path.length-1;
      const actualText=tile.playerTexts?.[config.players[currentTurn]?.id]??tile.text;
      const actualTask=tile.type==='task'&&!!actualText;
      const taskName=actualTask?actualText!:tile.type==='task'?(config.decks[tile.deck??'']?.name??'互动任务'):tileLabel(tile,config);
      const label=actualTask?taskPreviewLines(taskName):tile.label?.match(/^退回第(\d+)格$/)?['退回',`第${tile.label.match(/^退回第(\d+)格$/)![1]}格`]:chunks(tile.label??taskName),fill=tile.color??(tile.type==='task'?(extended?palette[Math.floor(i/8)%palette.length]:style==='cross'?(i>=43||i<=7?'#99cbee':i>=33&&i<=38?'#f8d752':'#fffdf8'):palette[(i+Math.floor(i/8))%palette.length]):special[tile.type]??'#fffdf8');
      const square=style==='cross'||style==='hollow-spiral'||style==='dual-track'||style==='paper-spiral'||style==='grid-snake'||style==='grid-spiral';
      const fontSize=actualTask?12:tile.type==='finish'||tile.type==='start'?16:12;
      const leading=actualTask?12:14;
      return <g key={i} data-tile-index={i} data-tile-task={actualTask?actualText:undefined} role={onInspectTile?"button":undefined} tabIndex={onInspectTile?0:undefined} aria-label={onInspectTile?`查看第${i}格任务`:undefined} onClick={()=>onInspectTile?.(i)} onKeyDown={e=>{if(onInspectTile&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onInspectTile(i);}}} style={{cursor:onInspectTile?'pointer':undefined}}><title>{i}：{actualText??tileLabel(tile,config)}</title>{last&&style==='cross'?<circle cx={x} cy={y} r="30" fill="#e94b4b" stroke="#2b3034" strokeWidth="1.5"/>:<rect x={x-29} y={y-29} width="58" height="58" rx={extended?9:square?0:style==='winding'?19:7} fill={fill} stroke={extended?'#80928a':square?'#373b3d':'#fff'} strokeWidth={extended?1:square?1.3:2}/>}
        {!miniature&&<><text x={x-23} y={y-(actualTask?32:18)} fontSize="9" fill={last&&style==='cross'?'white':'#60636a'}>{i}</text><text data-task-preview={actualTask?i:undefined} x={x} y={y-(label.length-1)*leading/2+(actualTask?7:4)} textAnchor="middle" fontSize={fontSize} fontWeight={tile.type==='task'?500:700} fill={last&&style==='cross'?'white':'#283039'}>{label.map((line,j)=><tspan key={j} x={x} dy={j?leading:0}>{line}</tspan>)}</text>{tile.duration&&!actualTask&&<text x={x+23} y={y+24} textAnchor="end" fontSize="8" fill="#60636a">{tile.duration}s</text>}</>}
        {miniature&&routePreview&&<text x={x} y={y+5} textAnchor="middle" fontSize={tile.type==='start'||tile.type==='finish'?15:14} fontWeight="700" fill="#283039">{tile.type==='start'?'起点':tile.type==='finish'?'终点':i}</text>}
      </g>;
    })}
    {style==='dual-track' && !miniature && [0,6].map((i)=>{ const [x,y]=center(i);return <g key={i} data-start-caption><rect x={x-49.5} y={y-70} width="99" height="24" rx="12" fill={i?'#f9c4d8':'#c4deed'}/><text x={x} y={y-54} textAnchor="middle" fontSize="12" fill="#34435c">{i?'逃跑者起点':'追逐者起点'}</text></g>; })}
    {shownPlayers.map((p,index)=>{const [x,y]=center(Math.min(p.step,path.length-1)),distance=32+index*3;return <g key={p.id} transform={`translate(${x},${y})`} data-player-token={p.id}><path d={`M${-distance} ${-distance+9}v-9h9 M${distance-9} ${-distance}h9v9 M${distance} ${distance-9}v9h-9 M${-distance+9} ${distance}h-9v-9`} fill="none" stroke={p.color} strokeWidth={p.id===currentTurn?2.5:1.7} strokeLinecap="round"/></g>;})}
  </svg>;
}
