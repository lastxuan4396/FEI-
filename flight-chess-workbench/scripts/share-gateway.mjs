// Tunnel only this gateway. Original photo catalog and local OCR stay local.
import http from 'node:http';
const key=process.env.SHARE_ACCESS_KEY;
if(!key||!/^[a-f0-9]{48}$/.test(key))throw Error('缺少邀请访问凭据');
const upstream=Number(process.env.UPSTREAM_PORT)||8766;
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://local'),cookie=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('flight_share='))?.slice(13);
 const access=url.searchParams.get('access');
 if(cookie!==key&&access!==key){res.writeHead(403,{'Content-Type':'text/plain;charset=utf-8'});res.end('请使用房主给你的完整邀请链接。');return;}
 const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer',...(access===key?{'Set-Cookie':`flight_share=${key}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`}:{})};
 if(url.pathname==='/api/rooms/network'){res.writeHead(200,{...headers,'Content-Type':'application/json'});res.end(JSON.stringify({urls:[]}));return;}
 const allowed=url.pathname==='/'||url.pathname==='/favicon.ico'||url.pathname.startsWith('/assets/')||url.pathname.startsWith('/api/board-rooms')||/^\/api\/rooms(?:\/|$)/.test(url.pathname)||url.pathname.startsWith('/arcade/');
 if(!allowed){res.writeHead(404,headers);res.end('Not found');return;}
 // All local task/reference files are outside the HTTP root. Photo API stays blocked.
 const forwarded={...req.headers,host:`127.0.0.1:${upstream}`};delete forwarded.origin;delete forwarded['sec-fetch-site'];delete forwarded['x-forwarded-proto'];
 const proxy=http.request({hostname:'127.0.0.1',port:upstream,path:req.url,method:req.method,headers:forwarded},r=>{res.writeHead(r.statusCode,{...r.headers,...headers});r.pipe(res);});proxy.on('error',()=>{if(!res.headersSent)res.writeHead(503,headers);res.end('网站服务正在恢复，请稍后刷新。');});req.pipe(proxy);
});
server.listen(Number(process.env.SHARE_PORT)||8769,'127.0.0.1',()=>console.log('邀请网关已启动'));
// Keep import list small and avoid ever printing the access key.

