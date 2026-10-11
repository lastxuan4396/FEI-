import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import readline from 'node:readline';
const candidates=[process.env.FLIGHT_OCR_PYTHON,fileURLToPath(new URL('../.ocr-venv/bin/python',import.meta.url)),fileURLToPath(new URL('../../../work/ocr-runtime/bin/python',import.meta.url))].filter(Boolean);
let child,next=0;const pending=new Map();
export function ocrAvailable(){return candidates.some(p=>existsSync(p));}
function start(){if(child)return child;const python=candidates.find(p=>existsSync(p));if(!python)throw Error('本地文字引擎尚未安装。请运行 npm run setup:ocr。');const process=spawn(python,[fileURLToPath(new URL('./ocr_service.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});child=process;
 readline.createInterface({input:process.stdout}).on('line',line=>{let reply;try{reply=JSON.parse(line);}catch{return;}const p=pending.get(reply.id);if(!p)return;clearTimeout(p.timer);pending.delete(reply.id);reply.error?p.reject(Error(reply.error)):p.resolve(reply.result);});
 process.stderr.on('data',()=>{});const failed=()=>{if(child===process)child=null;for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('本地识别引擎停止，请重试或检查安装。'));}pending.clear();};process.on('error',failed);process.on('exit',failed);return process;
}
export async function localVision(request){if(pending.size>=2)throw Error('正在处理其他图片，请稍后重试。');const worker=start(),id=++next;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('本地识别超过3分钟，请缩小图片或逐格识别。'));worker.kill();},180000);pending.set(id,{resolve,reject,timer});worker.stdin.write(JSON.stringify({...request,id})+'\n');});}
export function stopVision(){child?.kill();child=null;}
