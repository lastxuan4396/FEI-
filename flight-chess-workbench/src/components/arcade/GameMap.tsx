import {storyMap} from '../../core/storyMaps.js';
import {bingoSide} from '../../core/bingo.js';
import {useState,type ReactNode,type CSSProperties} from 'react';
import {MapViewport} from '../MapViewport';
import {ArcadeSession,STORY} from '../../core/arcade.js';

export function GameMap({session,children}:{session:ArcadeSession;children:ReactNode}){
 const s=session.state,k=session.config.kind;
 const [large,setLarge]=useState(()=>{try{return localStorage.getItem('flight-chess.reading-size')==='large';}catch{return false;}});
 const journey=k==='coop'||k==='story';
 return <div className={`game-surface game-surface-${k} readable-surface ${large?'large-reading':''}`} data-game-map={k}>
  <div className="reading-controls" aria-label="文字显示大小"><span>文字大小</span>{[{value:false,label:'标准字'},{value:true,label:'大字'}].map(v=><button key={v.label} aria-pressed={large===v.value} onClick={()=>{setLarge(v.value);try{localStorage.setItem('flight-chess.reading-size',v.value?'large':'normal');}catch{/* Reading still works without storage. */}}}>{v.label}</button>)}</div>
  {k==='vote'&&<JourneyMap session={session}/>}
  {k==='coop'&&<p className="journey-current">当前第 {Math.min(s.stage+1,session.config.rounds??8)} 关 · 已完成 {s.stage} / {session.config.rounds??8} 关</p>}
  <MapViewport naturalWidth={k==='bingo'?Math.max(900,bingoSide(session.config)*220):900} focusSelector={k==='bingo'?'[aria-pressed="true"][data-cell]':undefined} focusKey={s.turn} locateLabel="定位选中格" tone="light" title="游戏区域" preferenceKey={`flight-chess.${k}.surface-display`} scaleContent>{children}</MapViewport>
  {journey&&<details className="journey-details"><summary>{k==='story'?'查看完整剧情地图':`查看${session.config.rounds??8}关合作路线`}</summary><MapViewport naturalWidth={960} defaultSize="fit" tone="light" title="路线图" preferenceKey={`flight-chess.${k}-route-display`} focusSelector="[data-current-stop]" focusKey={k==='coop'?s.stage:s.stage*100+s.turn} locateLabel="定位当前地点"><JourneyMap session={session}/></MapViewport></details>}

 </div>;
}

function JourneyMap({session}:{session:ArcadeSession}){
 const s=session.state,k=session.config.kind;
 if(k==='coop'){
  const count=session.config.rounds??8,columns=Math.min(4,count),mobileColumns=Math.min(2,count);
  const position=(index:number,cols:number)=>{const row=Math.floor(index/cols),offset=index%cols;return {row:row+1,column:row%2?cols-offset:offset+1,arrow:index===count-1?'none':offset===cols-1?'↓':row%2?'←':'→'};};
  return <div className="journey-coop" data-long-route={count>8?true:undefined} aria-label={`${count}关合作路线`}><div className="journey-caption"><b>一起走完这条路</b><span>出发 → {count}关 → 共同抵达</span></div><ol style={{'--journey-columns':columns,'--journey-mobile-columns':mobileColumns} as CSSProperties}>{Array.from({length:count},(_,i)=>{const desktop=position(i,columns),mobile=position(i,mobileColumns);return <li key={i} style={{'--journey-column':desktop.column,'--journey-row':desktop.row,'--journey-mobile-column':mobile.column,'--journey-mobile-row':mobile.row} as CSSProperties} data-arrow={desktop.arrow} data-mobile-arrow={mobile.arrow} data-current-stop={i===s.stage?true:undefined} aria-current={i===s.stage?'step':undefined} className={i<s.stage?'complete':i===s.stage?'here':''}><span>{i<s.stage?'✓':String(i+1).padStart(2,'0')}</span><b>{i===count-1?'终点营地':['初见桥','林间路','溪流湾','树屋','花园','观景台','星光坡'][i]??`同行第${i+1}站`}</b><small>{i<s.stage?'已点亮':i===s.stage?'当前关卡':'等待同行'}</small></li>;})}</ol></div>;
 }
 if(k==='vote')return <div className="journey-rounds" aria-label={`${session.config.rounds??5}题默契进度`}>{Array.from({length:session.config.rounds??5},(_,i)=><div key={i} data-current-stop={i===s.round?true:undefined} aria-current={i===s.round?'step':undefined} className={i<s.round?'complete':i===s.round?'here':''}><span>{i<s.round?'✓':i+1}</span><b>第{i+1}题</b><small>{i<s.round?'已揭晓':i===s.round?'正在选择':'待开启'}</small></div>)}</div>;
 if(k!=='story')return null;
 if(session.config.story)return <ChapterJourney session={session}/>;
 const rows=[['start'],['forest','city'],['creek','tree','books','gallery'],['camp','square'],['stars','home','letter','show']];
 const journal=s.creative?.kind==='story'?s.creative.journal:[],next=STORY[s.node].options?.map(o=>o.to)??(STORY[s.node].to?[STORY[s.node].to]:[]);
 const coords=Object.fromEntries(rows.flatMap((row,y)=>row.map((id,i)=>[id,[(i+1)*960/(row.length+1),52+y*105]])));
 return <div className="journey-story" aria-label="剧情分支地图"><div className="journey-caption"><b>这趟旅程，走向哪里？</b><span>当前位置 · 已走过 · 可选择的下一站</span></div><svg viewBox="0 0 960 530" role="img" aria-label="从车站出发，森林与城市两条分支通往四种结局"><defs><marker id="journey-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#a9bba0"/></marker></defs>{Object.entries(STORY).flatMap(([id,n])=>(n.options?.map(o=>o.to)??(n.to?[n.to]:[])).map(to=><line key={`${id}-${to}`} x1={coords[id][0]} y1={coords[id][1]+27} x2={coords[to][0]} y2={coords[to][1]-30} stroke="#c3cebb" strokeWidth="2" markerEnd="url(#journey-arrow)"/>))}{Object.entries(coords).map(([id,[x,y]])=><g key={id} transform={`translate(${x},${y})`} data-current-stop={id===s.node?true:undefined} className={id===s.node?'here':journal.includes(id)?'complete':next.includes(id)?'next':''}><rect x="-90" y="-28" width="180" height="62" rx="15"/><text textAnchor="middle" y="-2">{STORY[id].title.replace('今天，把时间交给一段旅程','出发 · 车站')}</text><text className="journey-node-status" textAnchor="middle" y="20">{id===s.node?'你们在这里':journal.includes(id)?'已走过':next.includes(id)?'下一站':STORY[id].ending?'结局':'沿途地点'}</text></g>)}</svg><p>在下方选择路线。地图标记随选择与任务进度更新。</p></div>;
}

function ChapterJourney({session}:{session:ArcadeSession}){
 const c=session.config,s=session.state,graph=storyMap(c),chapter=graph[s.node].chapter??1,visited=s.creative?.kind==='story'?s.creative.journal:[];
 return <div className="chapter-journey" data-long-route={c.story!.chapters>3?true:undefined} aria-label={`${c.story!.chapters}章剧情路线`}><div className="journey-caption"><b>你们的旅程地图</b><span>{c.story!.chapters}章 · 两条路任选 · 四种结局</span></div><ol>{Array.from({length:c.story!.chapters},(_,i)=>{const id=`chapter${i+1}`,n=graph[id],here=chapter===i+1&&!['finale','stars','home','letter','show'].includes(s.node);return <li key={id} data-current-stop={here?true:undefined} aria-current={here?'step':undefined} className={here?'here':i+1<chapter||['finale','stars','home','letter','show'].includes(s.node)?'complete':''}><header><b>{n.title}</b><span>{i+1<chapter||['finale','stars','home','letter','show'].includes(s.node)?'已走过':here?'当前章节':'等待抵达'}</span></header><div className="chapter-routes">{n.options!.map(o=><div key={o.to} data-story-node={o.to} className={s.node===o.to?'here':visited.includes(o.to)?'complete':''}><b>{o.label}</b><span>↓</span><small>{graph[o.to].title}</small><small>{s.node===o.to?'当前沿途任务':visited.includes(o.to)?'已选择的路线':'选择后领取任务'}</small></div>)}</div><small className="chapter-next">{i+1<c.story!.chapters?'↓ 下一章':'↓ 选择旅程结局'}</small></li>;})}</ol><section className="chapter-finales" data-current-stop={['finale','stars','home','letter','show'].includes(s.node)?true:undefined}><h3>最后一站</h3><div>{graph.finale.options!.map(o=><span key={o.to} className={s.node===o.to?'here':''}>{graph[o.to].title}</span>)}</div></section></div>;
}
