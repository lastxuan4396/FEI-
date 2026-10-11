import {imageDisplay} from '../core/imageDisplay.js';
import {ImageCrop} from './ImageCrop';
import type {ImageTileNote} from '../core/types';
export function ImageSourceNotes({image,notes}:{image:{dataUrl:string;width:number;height:number;displayRotation?:0|90|180|270};notes?:ImageTileNote[]}) {
 if(!notes?.length)return null;
 return <aside className="image-source-notes" aria-label="本格关联的原图说明"><b>格外原文说明</b><p>任务与额外条件由两位玩家按原图共同核对；程序提供的计时或结束规则以当前操作提示为准。</p>{notes.map((note,i)=>{const r=note.region,crop=imageDisplay(image,r).crop!;return <div key={i} className="image-source-note"><ImageCrop image={image} region={r} label={`格外说明原图局部${i+1}`} maxHeight={140} maxWidth={140*crop.width/crop.height}/><p>{note.text}</p>{!note.reviewed&&<small>此处小字不清，已标出可读部分，未补写。</small>}</div>;})}</aside>;
}
