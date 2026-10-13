import {randomBytes,createHash} from 'node:crypto';
import {createArcade,arcadeTransition,validateArcade} from '../src/core/arcade.js';
import {arcadeActionAllowed,arcadeRoomView} from '../src/core/arcadeRoomPolicy.js';

const lifetime=7*86400000;
const reply=(status,body)=>({status,body});
const digest=value=>createHash('sha256').update(value).digest('hex');
const secureSeed=()=>randomBytes(4).readUInt32BE()||1;
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const operationId=value=>typeof value==='string'&&/^[\w-]{1,100}$/.test(value);
function fail(status,message){const error=Error(message);error.status=status;throw error;}

function freshSession(input,seed){
 const supplied=validateArcade(input),{config:c,state:s}=supplied;
 if(c.players.length!==2)fail(422,'在线房间只支持两位玩家。');
 if(s.revision!==0||s.moves!==0||s.pending||s.phase==='finished'||s.effects?.length||s.effectDraft)fail(422,'请从新开局设置创建在线房间，已有任务和成绩请先导出保留。');
 const session=createArcade(c.kind,c.players,{pool:c.pool,poolName:c.poolName,sourceTexts:c.sourceTexts,puzzles:c.puzzles,scene:c.scene,rounds:c.rounds,story:c.story,bingo:c.bingo,estate:c.estate,creative:c.creative,seed});
 // Explicit pools let the server reproduce the exact configuration, without inheriting client scores or dice.
 session.config=structuredClone(c);
 return validateArcade(session);
}

// Transactions cover authorization, engine transition, request receipt and durable storage together.
export function arcadeRooms(store,{baseURL,now=Date.now,randomSeed=secureSeed,maxRooms=100}={}){
 const urls=[baseURL],allowedOrigin=new URL(baseURL??'http://127.0.0.1').origin;
 function context(room){return {draftActor:room.draftActor??null,lastActor:room.lastActor??null,submitted:(room.ballots??[null,null]).map(v=>v!==null),coopRequest:room.coopRequest??null};}
 function snapshot(room,actor){
  const current=context(room),stamp=now();
  return {code:room.code,actor,urls,session:arcadeRoomView(room.session,actor,current),revision:room.session.state.revision,serverNow:stamp,...current,ownBallot:room.ballots?.[actor]??null,...(actor===0?{inviteToken:room.tokens[1]}:{}),presence:{joined:room.lastSeen.map(Boolean),online:room.lastSeen.map(t=>t>0&&stamp-t<45000)}};
 }
 return async({path,method,token,body,origin,requestId})=>{
  if(origin&&origin!==allowedOrigin)return reply(403,{error:'请从本网站打开房间。'});
  try{
   if(path==='/network'&&method==='GET')return reply(200,{urls,mode:'internet'});
   if(path===''&&method==='POST'){
    if(!body||typeof body!=='object'||!body.session)fail(422,'请提供新开局设置。');
    if(Buffer.byteLength(JSON.stringify(body))>2_000_000)fail(413,'本局图片或题库太大，请缩小场景图片或减少题目数量。');
    const createId=operationId(requestId)?digest(requestId):null,fingerprint=digest(JSON.stringify(body));
    return await store.transaction(async tx=>{
     const index=await tx.get('index')??{rooms:{},requests:{}};
     if(createId&&index.requests[createId]){
      const record=index.requests[createId],old=await tx.get(record.code);
      if(old&&old.updated>now()-lifetime){
       if(record.fingerprint!==fingerprint)fail(409,'建房请求已使用，请重新开始这次建房。');
       return reply(201,{...snapshot(old,0),token:old.tokens[0]});
      }
     }
     index.rooms=Object.fromEntries(Object.entries(index.rooms).filter(([,updated])=>updated>now()-lifetime));
     index.requests=Object.fromEntries(Object.entries(index.requests).filter(([,record])=>index.rooms[record.code]));
     if(Object.keys(index.rooms).length>=maxRooms)fail(429,'在线房间较多，请继续已有房间，或稍后再新开。');
     const session=freshSession(body.session,randomSeed());
     let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(index.rooms[code]);
     const room={code,session,tokens:[randomBytes(24).toString('hex'),randomBytes(24).toString('hex')],seen:[[],[]],updated:now(),lastSeen:[now(),0],lastActor:null,draftActor:null,ballots:[null,null],ballotEpoch:session.state.revision,coopRequest:null};
     index.rooms[code]=room.updated;if(createId)index.requests[createId]={code,fingerprint};
     tx.put(code,room);tx.put('index',index);
     return reply(201,{...snapshot(room,0),token:room.tokens[0]});
    });
   }
   const match=path.match(/^\/([A-F0-9]{6})(\/action)?$/);
   if(!match)return reply(404,{error:'房间不存在。'});
   return await store.transaction(async tx=>{
    const room=await tx.get(match[1]),actor=room?.tokens.indexOf(token);
    if(!room||actor===undefined||actor<0||room.updated<=now()-lifetime)fail(403,'链接无效或房间已过期。');
    if(method==='GET'&&!match[2]){
     if(now()-room.lastSeen[actor]>=20000){room.lastSeen[actor]=now();tx.put(room.code,room);}
     return reply(200,snapshot(room,actor));
    }
    if(method!=='POST'||!match[2])return reply(405,{error:'操作方式不正确。'});
    if(!body||!operationId(body.requestId)||!body.action||typeof body.action!=='object'||Array.isArray(body.action)||typeof body.action.type!=='string')fail(422,'操作编号或内容不正确。');
    if(Buffer.byteLength(JSON.stringify(body))>12000)fail(413,'单次操作内容太大。');
    const fingerprint=digest(JSON.stringify(body.action)),receipt=room.seen[actor].find(v=>v.id===body.requestId);
    if(receipt){
     if(receipt.fingerprint!==fingerprint)fail(409,'同一操作编号不能用于不同操作。');
     return reply(200,snapshot(room,actor));
    }
    const action={...body.action},s=room.session.state;
    if(!integer(action.expectedRevision,0,1e9))fail(422,'请提供当前对局版本。');
    // Independent secret submissions may arrive together, within this question's revision interval.
    const parallelVote=room.session.config.kind==='vote'&&action.type==='VOTE'&&s.phase==='ballot'&&action.expectedRevision>=room.ballotEpoch&&action.expectedRevision<=s.revision;
    if(action.expectedRevision!==s.revision&&!parallelVote)return reply(409,{...snapshot(room,actor),error:'对方已经更新了对局，请等待同步后重试。'});
    if(!arcadeActionAllowed(room.session,actor,action.type,action,context(room)))fail(403,'这项操作需要由对应玩家完成。');
    const base=structuredClone(room.session);base.state.seed=randomSeed();base.state.undo=[];
    if(['TIMER','EFFECT_TIMER'].includes(action.type))action.now=action.now===null?null:now();
    else if(['EFFECT_ADD','EFFECT_CHOOSE'].includes(action.type))action.now=now();
    // The client never chooses a roll, a shuffle seed, or the engine's clock.
    delete action.seed;delete action.dice;action.expectedRevision=s.revision;
    if(room.session.config.kind==='vote'&&action.type==='VOTE'){
     if(!integer(action.target,0,1))fail(422,'请选择一位玩家。');
     room.ballots[actor]=action.target;
     if(room.ballots.every(v=>v!==null)){
      let next=arcadeTransition(base,{type:'VOTE',target:room.ballots[0]});
      next=arcadeTransition(next,{type:'VOTE',target:room.ballots[1]});
      room.session=next;
     }else{
      base.state.revision++;base.state.message='选择已保存，等待另一位玩家提交。';
      base.state.log=[...base.state.log.slice(-29),base.state.message];room.session=validateArcade(base);
     }
    }else if(room.session.config.kind==='estate'&&action.type==='CONTRACT'&&action.method==='coop'){
     if(!integer(action.target,0,1)||action.target===actor||s.phase!=='contract'||s.estate?.bankrupt[action.target])fail(422,'请选择另一位玩家共同接受本次合约。');
     room.coopRequest={from:actor,to:action.target};base.state.revision++;base.state.message='合作委托已发出，等待另一位玩家确认。';
     base.state.log=[...base.state.log.slice(-29),base.state.message];room.session=validateArcade(base);
    }else if(action.type==='ACCEPT_COOP'){
     if(typeof action.yes!=='boolean')fail(422,'请选择接受或拒绝合作。');
     if(action.yes)room.session=arcadeTransition(base,{type:'CONTRACT',method:'coop',target:room.coopRequest.to,partnerAccepted:true,expectedRevision:s.revision});
     else{base.state.revision++;base.state.message='对方暂不接受合作，可以选择其他合约回报。';base.state.log=[...base.state.log.slice(-29),base.state.message];room.session=validateArcade(base);}
     room.coopRequest=null;
    }else room.session=arcadeTransition(base,action);
    room.session.state.undo=[];validateArcade(room.session);
    if(action.type==='NEXT'&&room.session.config.kind==='vote'&&room.session.state.phase==='ballot'){room.ballots=[null,null];room.ballotEpoch=room.session.state.revision;}
    if(action.type==='EFFECT_DRAW')room.draftActor=actor;
    if(['EFFECT_CHOOSE','EFFECT_DISMISS','END'].includes(action.type))room.draftActor=null;
    if(action.type==='END')room.coopRequest=null;
    room.lastActor=actor;room.lastSeen[actor]=now();room.updated=now();
    room.seen[actor]=[...room.seen[actor].slice(-99),{id:body.requestId,fingerprint}];
    const index=await tx.get('index');if(index){index.rooms[room.code]=room.updated;tx.put('index',index);}
    tx.put(room.code,room);return reply(200,snapshot(room,actor));
   });
  }catch(error){return reply(error.status??422,{error:error.status===503?'房间保存暂时失败，请稍后重连。':error.message||'操作失败。'});}
 };
}
