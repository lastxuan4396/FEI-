import type {ImageRegion} from './types';
let sequence=0;
// Each run owns its worker, so timeout/error cleanup releases the WASM heap.
export function detectCellsAdvanced(pixels:ImageData,threshold=120,mode='hybrid',scoped=false):Promise<ImageRegion[]> {
 return new Promise((resolve,reject)=>{
 const worker=new Worker(`${import.meta.env.BASE_URL}vision/worker.js`),id=++sequence;
 const timer=setTimeout(()=>{worker.terminate();reject(Error('OpenCV加载超时，已切换基础识别。'));},30000);
 const finish=()=>{clearTimeout(timer);worker.terminate();};
 worker.onmessage=({data})=>{if(data.id!==id)return;finish();if(data.error)reject(Error(data.error));else resolve(data.boxes);};
 worker.onerror=()=>{finish();reject(Error('OpenCV运行失败，已切换基础识别。'));};
 worker.postMessage({id,rgba:pixels.data,width:pixels.width,height:pixels.height,threshold,mode,scoped});
 });
}
