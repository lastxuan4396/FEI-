import {parseConfigJSON} from './config.js';
export async function findPreparedImage(file:File){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{
  let response:Response;try{response=await fetch(`${import.meta.env.BASE_URL}api/reference-boards`,{signal:controller.signal});}catch{return null;}if(!response.ok)return null;
  const data=await response.json();if(!Array.isArray(data.boards))return null;
  const candidates=data.boards.filter((b:{id?:number;imageSha256?:string;preparedCells?:number})=>Number.isSafeInteger(b.id)&&b.id!>0&&b.id!<=128&&typeof b.imageSha256==='string'&&/^[a-f0-9]{64}$/.test(b.imageSha256)&&b.preparedCells);
  if(!candidates.length)return null;
  const digest=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  const hash=await digest(await file.arrayBuffer()),match=candidates.find((b:{imageSha256:string})=>b.imageSha256===hash);if(!match)return null;
  const map=await fetch(`${import.meta.env.BASE_URL}api/reference-boards/${match.id}/map`,{signal:controller.signal});if(!map.ok)throw Error('对应的已整理地图暂时读不到，请重试。');
  const config=parseConfigJSON(await map.text()),image=config.layout.image;
  if(!image||config.tiles.length!==match.preparedCells)throw Error('对应地图的信息已变化，请重新核对。');
  const bytes=Uint8Array.from(atob(image.dataUrl.split(',')[1]),c=>c.charCodeAt(0));
  if(await digest(bytes.buffer)!==hash)throw Error('已整理地图与这张原图不一致，不能自动套用。请重新识别。');
  return {config,referenceId:match.id};
 }finally{clearTimeout(timer);}
}
