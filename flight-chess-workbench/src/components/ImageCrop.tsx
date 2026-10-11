import {useEffect,useId,useState} from 'react';
import {imageDisplay} from '../core/imageDisplay.js';
import type {ImageRegion} from '../core/types';
const matrices={
 contrast:'1.4 0 0 0 -.2 0 1.4 0 0 -.2 0 0 1.4 0 -.2 0 0 0 1 0',
 blue:'0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 1 0',
 red:'1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 1 0',
 green:'0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 1 0'
};
type Mode='original'|keyof typeof matrices;
/** Reading-only filters use source pixels. Neither text nor stored image is modified. */
export function ImageCrop({image,region,label,maxHeight=210,maxWidth=220,className}:{image:{dataUrl:string;width:number;height:number;displayRotation?:0|90|180|270};region:ImageRegion;label:string;maxHeight?:number;maxWidth?:number;className?:string}){
 const [mode,setMode]=useState<Mode>('original'),id=useId().replace(/:/g,'');
 useEffect(()=>setMode('original'),[image.dataUrl,region.x,region.y,region.width,region.height,image.displayRotation]);
 const crop=imageDisplay(image,region).crop!;
 const aspect=crop.width/crop.height;
 return <div className="image-crop-viewer"><details className="image-crop-adjustments"><summary>看不清？调整显示</summary><label>显示方式<select aria-label={`${label}显示方式`} value={mode} onChange={e=>setMode(e.target.value as Mode)}><option value="original">原图</option><option value="contrast">提高对比度</option><option value="blue">蓝底文字 · 蓝色通道</option><option value="red">红底文字 · 红色通道</option><option value="green">绿底文字 · 绿色通道</option></select></label><small>仅调整原像素的显示，不补字；无法辨认时仍保留不清标记。</small></details><svg className={className} role="img" aria-label={label} data-crop-mode={mode} viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`} style={{width:`min(100%,${maxWidth}px,calc(var(--image-crop-max-height,${maxHeight}px) * ${aspect}))`,height:'auto',maxHeight:'none'}}><defs><filter id={`${id}-reading`} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={mode==='original'?matrices.contrast:matrices[mode]}/></filter></defs><g transform={imageDisplay(image).transform}><image href={image.dataUrl} width={image.width} height={image.height} filter={mode==='original'?undefined:`url(#${id}-reading)`}/></g></svg></div>;
}
