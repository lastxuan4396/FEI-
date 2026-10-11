import {spawn} from 'node:child_process';import {mkdir,writeFile,chmod} from 'node:fs/promises';import {fileURLToPath} from 'node:url';import {randomBytes} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));process.chdir(root);
await mkdir('work/service',{recursive:true});const children=[];
const launch=(file,args,env)=>{const p=spawn(file,args,{env:{...process.env,...env},stdio:['ignore','pipe','pipe']});children.push(p);return p;};
try{
 try{await fetch('http://127.0.0.1:8766/api/board-rooms/invalid');}catch{const p=launch(process.execPath,['scripts/serve.mjs'],{});p.stderr.on('data',d=>process.stderr.write(d));await new Promise(r=>setTimeout(r,1000));}
 const key=randomBytes(24).toString('hex'),gateway=launch(process.execPath,['scripts/share-gateway.mjs'],{SHARE_ACCESS_KEY:key});gateway.stderr.on('data',d=>process.stderr.write(d));
 const tool=new URL('../work/online-tools/cloudflared',import.meta.url),tunnel=launch(fileURLToPath(tool),['tunnel','--url','http://127.0.0.1:8769','--protocol','http2','--no-autoupdate'],{});
 let shown=false;const output=async data=>{const text=data.toString(),match=text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);if(match&&!shown){shown=true;const url=match[0]+'/?access='+key;await writeFile('work/service/public-url.txt',url,{mode:0o600});await chmod('work/service/public-url.txt',0o600);console.log('异地试玩已启动；电脑需保持在线。链接也已保存到 work/service/public-url.txt');const opener=spawn('open',[url],{stdio:'ignore'});opener.unref();}};
 tunnel.stdout.on('data',output);tunnel.stderr.on('data',output);tunnel.on('error',e=>console.error('公网工具启动失败：'+e.message));
 const stop=async()=>{for(const p of children)p.kill('SIGTERM');await writeFile('work/service/public-url.txt','');process.exit(0);};process.on('SIGINT',stop);process.on('SIGTERM',stop);
}catch(e){console.error(e.message);for(const p of children)p.kill('SIGTERM');process.exitCode=1;}

