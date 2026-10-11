import {randomBytes,randomInt} from 'node:crypto';
import {mkdir,readdir,readFile,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateConfig} from '../src/core/config.js';
import {createGame,validateState,transition} from '../src/core/engine.js';
import {boardActionAllowed} from '../src/core/boardRoomPolicy.js';
import {taskDuration} from '../src/core/taskTiming.js';
import {fillOwnBoardTasks} from '../src/core/boardTasks.js';
import {requestOriginAllowed} from './request-origin.mjs';
const defaultDirectory=fileURLToPath(new URL('../work/board-rooms/',import.meta.url));
const ttl=7*86400000;
export async function createBoardRooms({directory=defaultDirectory,store}={}){
 if(!store)await mkdir(directory,{recursive:true});const rooms=new Map(),presence=new Map();let queue=Promise.resolve();
 const records=store?(await store.entries()).filter(([key])=>/^[A-F0-9]{8}$/.test(key)):(await readdir(directory)).filter(n=>/^[A-F0-9]{8}\.json$/.test(n)).map(name=>[name,null]);
 for(const [name,value]of records){try{const r=value??JSON.parse(await readFile(`${directory}/${name}`,'utf8'));if(r.updated>Date.now()-ttl&&r.tokens?.length===2){r.config=validateConfig(r.config);r.state=validateState(r.state,r.config);rooms.set(r.code,r);}}catch{/* Ignore invalid saves without overwriting them. */}}
 async function save(r){if(store){await store.transaction(tx=>tx.put(r.code,r));return;}await writeFile(`${directory}/${r.code}.tmp`,JSON.stringify(r),{mode:0o600});await rename(`${directory}/${r.code}.tmp`,`${directory}/${r.code}.json`);}
 const reply=(r,actor)=>({code:r.code,actor,revision:r.revision,config:r.config,state:r.state,lastActor:r.lastActor,draftActor:r.draftActor,freeTimer:r.freeTimer,present:(presence.get(r.code)??[0,0]).map(t=>Date.now()-t<12000),serverNow:Date.now()});
 return async(req,res,path)=>{
  if(!path.startsWith('/api/board-rooms'))return false;
  const respond=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  if(!requestOriginAllowed(req)){respond(403,{error:'请从房间链接打开'});return true;}
  try{
   let data;
   if(req.method==='POST'){let text='';for await(const c of req){text+=c;if(Buffer.byteLength(text)>24_000_000)throw Error('地图超过24MB，请压缩图片后再建房');}data=JSON.parse(text);}
   // Mutations are serialized, including validation, transition and persistence.
   const execute=async()=>{
    for(const [code,r]of rooms)if(r.updated<Date.now()-ttl)rooms.delete(code);
    if(path==='/api/board-rooms'&&req.method==='POST'){
     if(rooms.size>=100)throw Error('房间数量已达上限');
     let config=validateConfig(data.config);if(config.players.length!==2)throw Error('联机需要两位玩家');
     const seed=randomInt(1,0xffffffff),code=randomBytes(4).toString('hex').toUpperCase();
     if(!data.state)config=validateConfig(fillOwnBoardTasks(config,seed));
     const state=data.state?validateState(data.state,config):createGame(config,{seed,id:code});
     const r={code,config,state,tokens:[randomBytes(24).toString('hex'),randomBytes(24).toString('hex')],revision:0,updated:Date.now(),seen:[[],[]],lastActor:null,draftActor:null,freeTimer:{duration:60,endsAt:null,owner:null}};
     await save(r);rooms.set(code,r);presence.set(code,[Date.now(),0]);respond(201,{...reply(r,0),token:r.tokens[0],inviteToken:r.tokens[1]});return;
    }
    const m=path.match(/^\/api\/board-rooms\/([A-F0-9]{8})(?:\/(action))?$/);
    if(!m){respond(404,{error:'房间不存在'});return;}
    const r=rooms.get(m[1]),actor=r?.tokens.indexOf(req.headers.authorization?.replace(/^Bearer /,''));
    if(!r||actor===undefined||actor<0){respond(403,{error:'房间链接无效或已过期，请重新邀请'});return;}
    const seen=presence.get(r.code)??[0,0];seen[actor]=Date.now();presence.set(r.code,seen);
    if(req.method==='GET'&&!m[2]){const view=reply(r,actor);if(new URL(req.url,'http://local').searchParams.get('since')===String(r.revision))respond(200,{unchanged:true,code:r.code,revision:r.revision,actor,present:view.present,serverNow:view.serverNow});else respond(200,view);return;}
    if(req.method!=='POST'||!m[2]){respond(405,{error:'操作方式不正确'});return;}
    const {requestId,revision,action}=data;
    if(typeof requestId!=='string'||!requestId||requestId.length>100)throw Error('操作编号不正确');
    if(r.seen[actor].includes(requestId)){respond(200,reply(r,actor));return;}
    if(revision!==r.revision){respond(409,{error:'对局已更新，请重新操作',...reply(r,actor)});return;}
    if(!action||typeof action.type!=='string'||!boardActionAllowed(r,actor,action.type,action)){respond(403,{error:'请等待当前玩家或任务承担者操作'});return;}
    const next=structuredClone(r);
    if(action.type==='SHUFFLE'){
     const cards=[...new Set(Object.values(r.config.decks).flatMap(d=>d.cards))];if(!cards.length||!r.config.tiles.some(t=>t.type==='task'))throw Error('这张地图没有可随机的任务格或题库');next.config=structuredClone(r.config);next.config.decks={shuffle_pool:{name:'本局随机题库',cards}};delete next.config.playerDecks;let bag=[];next.config.tiles=next.config.tiles.map(t=>{if(t.type!=='task')return t;if(!bag.length)bag=[...cards];const text=bag.splice(randomInt(bag.length),1)[0],tile={...t,text,deck:'shuffle_pool'};delete tile.playerTexts;delete tile.duration;if(next.config.layout.image)tile.originalText=t.originalText??t.text;const duration=taskDuration(text);if(duration)tile.duration=duration;return tile;});next.config=validateConfig(next.config);next.state=createGame(next.config,{id:randomBytes(8).toString('hex'),seed:randomInt(1,0xffffffff)});next.lastActor=null;next.draftActor=null;next.freeTimer={duration:60,endsAt:null,owner:null};
    }else if(action.type==='FREE_TIMER'){
     const timer=next.freeTimer;
     if(action.mode==='duration'){if(!Number.isInteger(action.duration)||action.duration<1||action.duration>86400)throw Error('计时秒数须为1–86400');next.freeTimer={duration:action.duration,endsAt:null,owner:actor};}
     else if(action.mode==='pause'){if(timer.endsAt===null)throw Error('计时尚未开始');next.freeTimer={...timer,endsAt:null,pausedRemaining:Math.max(0,timer.endsAt-Date.now()),owner:actor};}
     else if(action.mode==='reset')next.freeTimer={duration:timer.duration,endsAt:null,owner:null};
     else if(action.mode==='start')next.freeTimer={duration:timer.duration,endsAt:Date.now()+(timer.pausedRemaining??timer.duration*1000),owner:actor};
     else throw Error('计时操作不正确');
    }else{
     const cleaned={...action,expectedRevision:r.state.revision};
     if('now'in cleaned&&cleaned.now!==null)cleaned.now=Date.now();
     next.state=validateState(transition(r.state,r.config,cleaned,action.type==='ROLL'?randomInt(1,7):undefined),r.config);
     next.lastActor=actor;if(action.type==='EFFECT_DRAW')next.draftActor=actor;if(!next.state.effectDraft)next.draftActor=null;
    }
    next.revision++;next.updated=Date.now();next.seen[actor]=[...next.seen[actor].slice(-99),requestId];await save(next);rooms.set(next.code,next);respond(200,reply(next,actor));
   };
   const task=queue.then(execute);queue=task.catch(()=>{});await task;
  }catch(e){respond(e.status??422,{error:e.status===503?'房间保存暂时失败，请稍后重连。':e.message||'操作失败'});}return true;
 };
}
