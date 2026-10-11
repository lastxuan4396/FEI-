import {useEffect,useRef,useState} from 'react';
import {Wheel} from 'spin-wheel';
import {TransformComponent,TransformWrapper} from 'react-zoom-pan-pinch';
import {Puzzle,SECTORS} from '../../core/arcade.js';
export function SpinScene({sector,spin,onRest}:{sector:number;spin:number;onRest:()=>void}){
 const container=useRef<HTMLDivElement>(null),wheel=useRef<Wheel>(),rest=useRef(onRest),animating=useRef(false);rest.current=onRest;
 useEffect(()=>{if(!container.current)return;const instance=new Wheel(container.current,{items:SECTORS.map(label=>({label})),itemBackgroundColors:['#f5b4a4','#b8cbc0','#eec476','#bab3d1','#93bfc6','#e3b4c2'],itemLabelColors:['#283e3c'],itemLabelFontSizeMax:22,pointerAngle:270,isInteractive:false,lineColor:'#fff8ed',lineWidth:3,onRest:()=>{if(animating.current){animating.current=false;rest.current();}}});wheel.current=instance;return()=>{instance.remove();wheel.current=undefined;};},[]);
 useEffect(()=>{animating.current=spin>0;wheel.current?.spinToItem(sector,spin&&!matchMedia('(prefers-reduced-motion: reduce)').matches?1100:0,true,spin?3:0,1);},[sector,spin]);
 return <div className="arc-wheel-wrap"><span className="arc-pointer" aria-hidden="true">▼</span><div ref={container} className="arc-wheel" aria-label={`转盘：${SECTORS[sector]}`}/></div>;
}
export function PhotoScene({scene,puzzles,stage,onSelect}:{scene?:string;puzzles:Puzzle[];stage:number;onSelect:(i:number)=>void}){
 const [scale,setScale]=useState(1);
 return <TransformWrapper minScale={1} maxScale={4} doubleClick={{disabled:true}} panning={{excluded:['hotspot']}} onTransformed={(_,s)=>setScale(s.scale)}>
  {({zoomIn,zoomOut,resetTransform})=><><div className="arc-row"><button onClick={()=>zoomOut()}>缩小</button><span>{Math.round(scale*100)}%</span><button onClick={()=>zoomIn()}>放大</button><button onClick={()=>resetTransform()}>复原</button></div><div className="arc-scene"><TransformComponent wrapperStyle={{width:'100%'}} contentStyle={{width:'100%'}}><div className="arc-scene-layer"><img src={scene||'/arcade/room.svg'} alt="解谜场景，点击数字标记查看线索" draggable={false}/>{puzzles.map((p,i)=><button key={i} className={`hotspot ${i<stage?'solved':''}`} style={{left:`${p.x*100}%`,top:`${p.y*100}%`}} aria-label={`线索${i+1}：${p.label}`} onClick={()=>onSelect(i)}>{i<stage?'✓':i+1}</button>)}</div></TransformComponent></div></>}
 </TransformWrapper>;
}
