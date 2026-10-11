// OpenCV lives in a worker: decoding/contours never block board interaction.
let ready;
async function runtime(){
 if(!ready)ready=(async()=>{importScripts('opencv.js');const m=self.cv;if(m instanceof Promise)return await m;if(m.Mat)return m;await new Promise(resolve=>{m.onRuntimeInitialized=resolve;});return m;})();
 return ready;
}
self.onmessage=async({data})=>{try{const [cv,{detectOpenCVCells,filterCellBoxes},{detectCells},{normalizeLowContrast}]=await Promise.all([runtime(),import('./cell-detector.js'),import('./basic-detector.js'),import('./contrast.js')]);const rgba=normalizeLowContrast(data.rgba);
 if(data.mode==='color'){const {detectColorCells}=await import('./color-detector.js');const boxes=detectColorCells(cv,rgba,data.width,data.height,!!data.scoped);self.postMessage({id:data.id,boxes});return;}
 const candidates=detectOpenCVCells(cv,rgba,data.width,data.height,data.threshold,data.mode==='edges'?'edges':'lines',!!data.scoped);
 if(data.mode==='hybrid'||!data.mode){candidates.push(...detectOpenCVCells(cv,rgba,data.width,data.height,data.threshold,'edges',!!data.scoped));
 for(const t of [data.threshold,Math.min(190,data.threshold+30),Math.min(210,data.threshold+60)]) candidates.push(...detectCells(rgba,data.width,data.height,t));
 }
 let boxes=filterCellBoxes(candidates);
 if(data.mode==='hybrid'||!data.mode){const {detectColorCells,refineCellsByColor}=await import('./color-detector.js');boxes=refineCellsByColor(boxes,detectColorCells(cv,rgba,data.width,data.height,!!data.scoped));}
 boxes=boxes.map(({x,y,width,height})=>({x,y,width,height}));self.postMessage({id:data.id,boxes});}catch(e){self.postMessage({id:data.id,error:e.message||'OpenCV识别失败'});}};
