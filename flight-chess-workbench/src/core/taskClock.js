// Millisecond deadlines preserve half-second tasks and paused time across reloads.
export function nextClock(duration,endsAt,pausedRemaining,now,mode){
 if(!Number.isSafeInteger(now)&&now!==null||now!==null&&(now<0||now>10_000_000_000_000))throw Error('计时时间不正确');
 if(mode!==undefined&&mode!=='pause')throw Error('计时操作不正确');
 if(mode==='pause'){
  if(now===null||endsAt==null)throw Error('当前计时没有运行');
  return {endsAt:null,pausedRemaining:Math.max(0,Math.min(duration*1000,endsAt-now))};
 }
 return {endsAt:now===null?null:now+(pausedRemaining??duration*1000)};
}
export function validPause(duration,endsAt,remaining){return remaining===undefined||endsAt==null&&Number.isSafeInteger(remaining)&&remaining>=0&&remaining<=duration*1000;}
