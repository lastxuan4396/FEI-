// Optional local reference collection. Only files named by its manifest are read.
import {readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
const bundledManifest=fileURLToPath(new URL('../resources/reference-boards/inventory.json',import.meta.url));
const bundled=existsSync(bundledManifest);
const defaultManifest=bundled?bundledManifest:fileURLToPath(new URL('../../../work/reference-boards/inventory.json',import.meta.url));
const defaultMaps=fileURLToPath(new URL(bundled?'../resources/prepared-maps/':'../../../outputs/personal-import-maps/',import.meta.url));
const safeName=name=>typeof name==='string'&&name.length<=160&&path.basename(name)===name&&!name.includes('..')&&/\.(jpeg|jpg|png|webp|json)$/i.test(name);
async function boundedFile(directory,name,limit){
 if(!safeName(name))throw Error('原图文件名不正确');
 const base=await realpath(directory),target=await realpath(path.join(base,name));
 if(path.dirname(target)!==base)throw Error('原图文件超出集合范围');
 const info=await stat(target);if(!info.isFile()||info.size>limit)throw Error('原图文件大小不正确');
 return readFile(target);
}
export function referenceCatalog({manifest=process.env.FLIGHT_REFERENCE_MANIFEST??defaultManifest,maps=process.env.FLIGHT_PREPARED_MAPS??defaultMaps}={}){
 const directory=path.dirname(manifest);
 async function entries(){
  let raw;try{raw=await readFile(manifest,'utf8');}catch(e){if(e.code==='ENOENT')return [];throw e;}
  if(raw.length>200000)throw Error('原图目录数据过大');const list=JSON.parse(raw);
  if(!Array.isArray(list)||list.length>128)throw Error('原图目录不正确');
  const ids=new Set();return list.map(item=>{if(!Number.isSafeInteger(item.attachment)||item.attachment<1||item.attachment>128||ids.has(item.attachment)||!safeName(item.name)||!/^.+\.(jpeg|jpg|png|webp)$/i.test(item.name)||item.preparedMap!==undefined&&(!safeName(item.preparedMap)||!item.preparedMap.endsWith('.json')))throw Error('原图目录条目不正确');ids.add(item.attachment);return item;});
 }
 async function find(id){if(!Number.isSafeInteger(id))throw Error('原图编号不正确');const item=(await entries()).find(e=>e.attachment===id);if(!item)throw Error('原图不存在');return item;}
 async function reading(id){try{const body=await boundedFile(path.join(directory,'ocr'),`${id}-raw-text.json`,4000000);return JSON.parse(body.toString());}catch(e){if(e.code==='ENOENT')return null;throw e;}}
 return {
  async list(){const list=await entries();return Promise.all(list.map(async e=>{let ocr,count,imageSha256;try{ocr=await reading(e.attachment);}catch{/* A damaged OCR cache must not hide the original images. */}try{if(e.preparedMap){const c=JSON.parse((await boundedFile(maps,e.preparedMap,6000000)).toString());if(Array.isArray(c.tiles))count=c.tiles.length;}}catch{/* Missing personal map does not hide its source image. */}if(count)try{imageSha256=createHash('sha256').update(await boundedFile(directory,e.name,25000000)).digest('hex');}catch{/* Missing source cannot be used for an exact-image match. */}return {id:e.attachment,name:e.name,title:`第${e.attachment}张原图`,width:e.width,height:e.height,ocrLines:Array.isArray(ocr?.lines)?ocr.lines.length:0,...(count?{preparedCells:count}:{}),...(imageSha256?{imageSha256}:{})};}));},
  async image(id,thumbnail=false){const e=await find(id);if(thumbnail){const body=await boundedFile(path.join(directory,'thumbnails'),`${id}.jpg`,500000);return {body,type:'image/jpeg'};}const body=await boundedFile(directory,e.name,25000000);const ext=path.extname(e.name).toLowerCase();return {body,type:ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg'};},
  async text(id){await find(id);return reading(id);},
  async map(id){const e=await find(id);if(!e.preparedMap)throw Error('这张原图尚无已整理地图');return JSON.parse((await boundedFile(maps,e.preparedMap,6000000)).toString());}
 };
}
