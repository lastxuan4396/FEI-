import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const candidates=process.env.FLIGHT_OCR_SETUP_PYTHON?[process.env.FLIGHT_OCR_SETUP_PYTHON]:['python3.12','python3.13','python3'];
const python=candidates.find(p=>spawnSync(p,['-c','import sys;sys.exit(0 if sys.version_info >= (3,12) else 1)'],{stdio:'ignore'}).status===0);
if(!python){console.error('需要Python 3.12或以上；可用FLIGHT_OCR_SETUP_PYTHON指定Python。');process.exit(1);}
for(const [program,args] of [[python,['-m','venv','.ocr-venv']],['.ocr-venv/bin/python',['-m','pip','install','-r','scripts/ocr-requirements.txt']]]){const r=spawnSync(program,args,{cwd:root,stdio:'inherit'});if(r.status!==0){console.error('安装未完成。已在Python 3.12验证，请检查Python版本和网络。');process.exit(1);}}
console.log('本地OCR安装完成；重新启动 npm run serve 即可使用。');
