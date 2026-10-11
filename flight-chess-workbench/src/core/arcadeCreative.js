import {storyMap,storyMemento,storyDetourLimit} from './storyMaps.js';
import {bingoSide,bingoGoal,bingoLines,bingoLineCount} from './bingo.js';
// Optional second edition. Task wording stays in the existing source deck.
export const BINGO_LINES=bingoLines(3);
export const MEMENTOS={start:'出发车票',forest:'林间书签',city:'城市明信片',camp:'星空剪影',square:'街角音符'};
export const CREATIVE_RULES={
 spinner:'每次转盘前可选稳步、冒险或二选一。冒险完成得双倍基础分，未完成扣1分。每连续完成两次赚1张换题券，最多3张；10次后结算。',
 cards:'任务牌可稳步完成得2分，或冒险得4分、未完成扣1分。加倍再加2分，保护也能挡一次冒险扣分。完成两张任务赚换牌券；换牌不结束回合，先到8分获胜。',
 coop:'自定义关卡数，共同冒险，可选一起完成、一人领航或双人接力。接力必须两人各完成一题才过关；每两关获得1次援助换题。跳过保留已过关卡，换题保留当前接力步骤。',
 story:'设置1至20章，每章选择路线并领取沿途任务。章节和支线数量分别调整；完成支线获得纪念物与默契，收藏写进结局。最多轮数决定行动上限。',
 bingo:'选择9、16或25格，设定获胜连线数。每人有2次换格机会；亲自完成与边长相同的格数后获得1枚万能标记，可免费点亮一格。已点亮的格子不能换，标记不增加完成任务得分。',
 vote:'双人秘密选择谁更适合本轮任务，两人提交后一起揭晓。选择一致时双方各得1分；之后由被选者自愿领取，意见不同时任一方可自愿领取。完成加2分，每题只领取一次，完成设定题数后结算。',
 mystery:'两人合作解三道线索，开局有1枚提示币。提示分两层，先给线索辅助，再揭晓答案，每层花1币。每道线索可完成一项图片任务赚2币；题目解开后轮到另一人。'
};
const ensure=(v,m)=>{if(!v)throw Error(m);};
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
export function initialCreative(kind,puzzleCount=3,goalLines=2){
 switch(kind){
  case 'spinner':return {kind,plan:'steady',tickets:[1,1],streaks:[0,0],candidates:[]};
  case 'cards':return {kind,recycles:[1,1],streaks:[0,0]};
  case 'coop':return {kind,plan:'together',leader:0,step:0,relayActive:false,help:1};
  case 'story':return {kind,detours:[],mementos:[],journal:[]};
  case 'bingo':return {kind,redraws:[2,2],jokerUsed:[false,false],goalLines};
  case 'vote':return {kind,ballots:[-1,-1],claimed:false,volunteer:null,agreements:0};
  case 'mystery':return {kind,hintCredits:1,levels:Array(puzzleCount).fill(0),earned:Array(puzzleCount).fill(false),tip:''};
  default:throw Error('没有这个创意玩法');
 }
}
export function lineCount(done){return bingoLineCount(done);}
export function recordJourney(s,node){if(s.creative?.kind==='story')s.creative.journal.push(node);}
export function handleCreative(s,c,a,h){
 const e=s.creative,p=s.players[s.turn],actor=s.turn;
 const meta=(style,actors=[actor],extra={})=>({kind:c.kind,style,actors,...extra});
 const drawDifferent=text=>{ensure(c.pool.some(v=>v!==text),'题库中没有其他题目可换');let next;for(let n=0;n<=c.pool.length;n++){next=h.draw();if(next!==text)return next;}throw Error('没有可用的替换题目');};
 const winBingo=()=>{if(lineCount(p.done)>=e.goalLines)h.finish(`宾果！完成${e.goalLines}条连线。`,[actor]);else h.advance();};
 if(a.type==='RESOLVE'){
  ensure(s.phase==='task'&&s.pending&&typeof a.done==='boolean','请先领取任务');const t=s.pending,m=t.creative;
  ensure(m&&m.kind===c.kind,'任务结算不匹配');
  if(c.kind==='spinner'){
   const gain=t.points*(m.style==='risk'?2:1);if(a.done){p.score+=gain;e.streaks[actor]++;if(e.streaks[actor]%2===0)e.tickets[actor]=Math.min(3,e.tickets[actor]+1);}else{e.streaks[actor]=0;if(m.style==='risk')p.score=Math.max(0,p.score-1);}h.note(a.done?`任务完成，获得${gain}分。`:m.style==='risk'?'冒险未完成，扣1分（最低0）。':'已跳过，积分不变。');h.advance();
  }else if(c.kind==='cards'){
   const gain=(m.style==='risk'?4:2)+p.boost;if(a.done){p.score+=gain;e.streaks[actor]++;if(e.streaks[actor]%2===0)e.recycles[actor]=Math.min(3,e.recycles[actor]+1);}else{e.streaks[actor]=0;if(m.style==='risk'){if(p.shield){p.shield=false;h.note('保护牌抵挡了本次冒险扣分。');}else p.score=Math.max(0,p.score-1);}}p.boost=0;p.hand[t.card]=h.newCard();if(a.done)h.note(`任务牌完成，获得${gain}分。`);if(p.score>=8)h.finish('率先获得8分，卡牌对战获胜！',[actor]);else h.advance();
  }else if(c.kind==='coop'){
   if(a.done&&e.plan==='relay'&&e.step===0){e.step=1;s.turn=1-e.leader;h.task(h.draw(),0,{category:'双人接力 · 第二棒',creative:meta('relay',[s.turn],{step:1})});h.note('第一棒完成，轮到另一人接力；两棒完成才过关。');}
   else{if(a.done){s.stage++;if(s.stage%2===0)e.help=Math.min(3,e.help+1);h.note('本关完成，星星已点亮。');}else h.note('本关尚未完成，已通过的关卡保留。');s.pending=null;s.phase='ready';s.turn=1-e.leader;e.leader=s.turn;e.step=0;e.relayActive=false;if(s.stage===(c.rounds??8))h.finish(`${c.rounds??8}关全部点亮，双人冒险通关！`);}
  }else if(c.kind==='story'){
   if(m.style==='detour'){if(a.done){s.trust++;e.mementos.push(storyMemento(c,s.node));}s.pending=null;s.phase='choice';s.turn=1-actor;h.note(a.done?`支线完成，收下「${storyMemento(c,s.node)}」。`:'支线已略过，可以继续原来的路线。');}
   else{s.moves++;if(a.done)s.trust+=2;s.turn=1-actor;h.storyEnter(0);}
  }else if(c.kind==='bingo'){
   if(a.done){p.done[t.cell]=true;p.score++;}h.note(a.done?'格子已点亮。':'格子保留，之后还可以再试。');winBingo();
  }else if(c.kind==='vote'){
   if(a.done)p.score+=2;s.pending=null;s.phase='reveal';h.note(a.done?'自愿任务完成，执行者获得2分。':'已放弃这次任务，没有扣分。');
  }else if(c.kind==='mystery'){
   if(a.done){e.earned[s.stage]=true;e.hintCredits=Math.min(6,e.hintCredits+2);}s.pending=null;s.phase='ready';h.note(a.done?'补给任务完成，获得2枚提示币。':'补给任务未完成，可以继续解谜或重新尝试。');
  }return true;
 }
 if(c.kind==='spinner'){
  if(a.type==='SPIN_PLAN'){ensure(s.phase==='ready'&&['steady','risk','choice'].includes(a.method),'当前不能选择转盘方式');e.plan=a.method;return true;}
  if(a.type==='SPIN'){ensure(s.phase==='ready','请先处理当前转盘');s.sector=h.rand(6);const points=[1,2,1,2,3,1][s.sector];if(e.plan==='choice'){e.candidates=[h.draw(),h.draw()];s.phase='pick';}else h.task(h.draw(),points,{category:h.sectors[s.sector],creative:meta(e.plan)});h.note('转盘结果已生成，任务来自本局题库。');return true;}
  if(a.type==='PICK_TASK'){ensure(s.phase==='pick'&&integer(a.index,0,1),'请选择一张任务');const text=e.candidates[a.index];e.candidates=[];h.task(text,[1,2,1,2,3,1][s.sector],{category:h.sectors[s.sector],creative:meta('choice')});return true;}
  if(a.type==='CREATIVE_REDRAW'){ensure(s.phase==='task'&&e.tickets[actor]>0,'没有可用换题券');const t=s.pending,text=drawDifferent(t.text);e.tickets[actor]--;h.task(text,t.points,{category:t.category,creative:t.creative});h.note('换题券已使用，原来的收益与风险保留。');return true;}
 }
 if(c.kind==='cards'){
  if(a.type==='RECYCLE_CARD'){ensure(s.phase==='ready'&&integer(a.index,0,2)&&e.recycles[actor]>0,'当前不能换牌');const old=p.hand[a.index];const text=old.type==='mission'?drawDifferent(old.text):h.draw();p.hand[a.index]={type:'mission',text};e.recycles[actor]--;h.note('换牌券已使用，补入一张新任务牌；仍可继续出牌。');return true;}
  if(a.type==='PLAY'&&p.hand[a.index]?.type==='mission'){ensure(s.phase==='ready'&&integer(a.index,0,2)&&[undefined,'steady','risk'].includes(a.method),'请选择稳步或冒险');h.task(p.hand[a.index].text,2,{card:a.index,category:a.method==='risk'?'冒险任务牌':'稳步任务牌',creative:meta(a.method??'steady')});return true;}
 }
 if(c.kind==='coop'){
  if(a.type==='COOP_PLAN'){ensure(s.phase==='ready'&&['together','lead','relay'].includes(a.method)&&integer(a.target,0,1),'请选择本关分工');e.plan=a.method;e.leader=a.target;s.turn=a.target;return true;}
  if(a.type==='DRAW'){ensure(s.phase==='ready','请先处理当前关卡');e.step=0;e.relayActive=e.plan==='relay';s.turn=e.leader;h.task(h.draw(),0,{category:e.plan==='relay'?'双人接力 · 第一棒':e.plan==='lead'?'一人领航':'共同完成',creative:meta(e.plan,e.plan==='together'?[0,1]:[s.turn],{step:0})});return true;}
  if(a.type==='CREATIVE_REDRAW'){ensure(s.phase==='task'&&e.help>0,'没有援助次数');const t=s.pending,text=drawDifferent(t.text);e.help--;h.task(text,0,{category:t.category,creative:t.creative});h.note('援助已使用；当前关卡与接力步骤保留。');return true;}
 }
 if(c.kind==='story'&&a.type==='STORY_DETOUR'){ensure(s.phase==='choice'&&storyMemento(c,s.node)&&!e.detours.includes(s.node)&&e.detours.length<storyDetourLimit(c),'这个地点不能再领取支线');e.detours.push(s.node);h.task(h.draw(),0,{category:'支线纪念',creative:meta('detour',[0,1])});return true;}
 if(c.kind==='bingo'){
  if(['CELL','BINGO_REDRAW','BINGO_JOKER'].includes(a.type))ensure(s.phase==='ready'&&integer(a.index,0,bingoSide(c)**2-1)&&!p.done[a.index],'请选择未点亮的格子');
  if(a.type==='CELL'){h.task(p.bingo[a.index],1,{cell:a.index,creative:meta('steady')});return true;}
  if(a.type==='BINGO_REDRAW'){ensure(e.redraws[actor]>0,'换格机会已用完');p.bingo[a.index]=drawDifferent(p.bingo[a.index]);e.redraws[actor]--;h.note('这个格子的任务已更换。');return true;}
  if(a.type==='BINGO_JOKER'){ensure(p.score>=bingoSide(c)&&!e.jokerUsed[actor],`亲自完成${bingoSide(c)}格后可使用一次万能标记`);p.done[a.index]=true;e.jokerUsed[actor]=true;h.note('万能标记已点亮一格，不增加任务完成分数。');winBingo();return true;}
 }
 if(c.kind==='vote'){
  if(a.type==='VOTE'){ensure(s.phase==='ballot'&&integer(a.target,0,1),'请选择一位玩家');e.ballots[s.voter]=a.target;s.votes[a.target]++;s.voter++;if(s.voter===2){s.phase='reveal';if(e.ballots[0]===e.ballots[1]){e.agreements++;s.players.forEach(v=>v.score++);h.note('你们选择一致，双方各得1分。');}else h.note('你们选择不同，可以让愿意的人领取任务。');}else{s.turn=s.voter;h.note('选择已保存，等待另一人提交。');}return true;}
  if(a.type==='DRAW'){ensure(s.phase==='reveal'&&!e.claimed&&integer(a.target,0,1)&&a.yes===true,'任务需要执行者自愿确认，且每题只能领取一次');ensure(e.ballots[0]!==e.ballots[1]||a.target===e.ballots[0],'请由双方一致选中的玩家决定是否领取');e.claimed=true;e.volunteer=a.target;s.turn=a.target;h.task(s.question,0,{category:'自愿委托',creative:meta('steady',[a.target])});return true;}
  if(a.type==='NEXT'){ensure(s.phase==='reveal','请先完成双方选择');s.round++;if(s.round===(c.rounds??5))h.finish(`${c.rounds??5}题抉择结束，达成${e.agreements}次默契。`,h.leaders());else{e.ballots=[-1,-1];e.claimed=false;e.volunteer=null;s.votes.fill(0);s.voter=0;s.turn=0;s.question=h.draw();s.phase='ballot';}return true;}
 }
 if(c.kind==='mystery'){
  if(a.type==='MYSTERY_TASK'){ensure(s.phase==='ready'&&!e.earned[s.stage],'这道线索的补给奖励已经领取');h.task(h.draw(),0,{category:'提示补给',creative:meta('hint',[0,1],{stage:s.stage})});return true;}
  if(a.type==='HINT'){ensure(s.phase==='ready'&&e.hintCredits>0&&e.levels[s.stage]<2,'提示币不足或本题提示已全部揭晓');e.hintCredits--;e.levels[s.stage]++;s.hints++;const answer=c.puzzles[s.stage].answer.trim(),chars=Array.from(answer);e.tip=e.levels[s.stage]===1?`答案有${chars.length}个字符${chars.length>1?`，首个字符是「${chars[0]}」`:''}。再对照场景和线索。`:`答案是「${answer}」。`;h.note(e.tip);return true;}
  if(a.type==='ANSWER'){ensure(s.phase==='ready'&&a.index===s.stage&&typeof a.answer==='string'&&a.answer.length<=100,'请解开当前线索');if(a.answer.trim().toLowerCase()===c.puzzles[s.stage].answer.trim().toLowerCase()){s.stage++;s.moves++;s.turn=1-actor;e.tip='';h.note('线索解开了，轮到另一人继续探索。');if(s.stage===c.puzzles.length)h.finish(`双人解谜成功，使用了${s.hints}层提示。`);}else h.note('答案还不对，继续观察或用提示币换一条线索。');return true;}
 }
 return false;
}
export function creativeTaskEffect(session){const c=session.config,s=session.state,t=s.pending,m=t?.creative,e=s.creative;if(!m)return '';switch(m.kind){case 'spinner':return `完成：${t.points*(m.style==='risk'?2:1)}分；${m.style==='risk'?'未完成：扣1分（最低0）。':'跳过：积分不变。'}连续完成两次获得换题券。`;case 'cards':return `完成：${(m.style==='risk'?4:2)+s.players[s.turn].boost}分；${m.style==='risk'?'未完成：扣1分，保护牌可抵挡。':'跳过：积分不变。'}结算后补一张牌。`;case 'coop':return m.style==='relay'?`当前第${e.step+1}棒；两人各完成一题才过关。跳过则重新选择本关，已过关保留。`:'完成：点亮本关，每两关赚1次援助；跳过：本关未点亮。';case 'story':return m.style==='detour'?`完成：获得「${storyMemento(c,s.node)}」和1点默契；跳过：回到当前地点继续主线。`:'完成增加2点默契；完成或跳过后继续所选路线。';case 'bingo':return `完成：点亮该格并获得1分；跳过：不点亮。亲自完成${bingoSide(session.config)}格解锁一次万能标记，${e.goalLines}条线获胜。`;case 'vote':return '自愿完成：执行者获得2分；跳过：没有扣分。本题任务只能领取一次。';case 'mystery':return '完成：获得2枚提示币，每道线索只奖励一次；跳过：返回场景，可以重新尝试。';default:return '';}}
export function validateCreative(c,s){
 if(!c.creative){ensure(s.creative===undefined,'旧局不能混入新版机制');ensure(s.pending?.creative===undefined,'旧局不能混入新版任务');return;}
 const e=s.creative;ensure(c.kind!=='estate'&&c.players.length===2&&e?.kind===c.kind,'创意玩法需要双人并匹配状态');
 const ints=(v,max)=>Array.isArray(v)&&v.length===2&&v.every(n=>integer(n,0,max));const bools=v=>Array.isArray(v)&&v.length===2&&v.every(n=>typeof n==='boolean');const strings=(v,max)=>Array.isArray(v)&&v.length<=max&&v.every(x=>typeof x==='string'&&x.length>0&&x.length<100);const t=s.pending,m=t?.creative;
 switch(c.kind){
  case 'spinner':ensure(['steady','risk','choice'].includes(e.plan)&&ints(e.tickets,3)&&ints(e.streaks,(c.rounds??5)*2)&&Array.isArray(e.candidates)&&e.candidates.length===(s.phase==='pick'?2:0)&&e.candidates.every(v=>c.pool.includes(v)),'转盘机会或候选任务不正确');if(s.phase==='pick')ensure(e.plan==='choice'&&!t,'二选一状态不正确');break;
  case 'cards':ensure(ints(e.recycles,3)&&ints(e.streaks,32),'换牌机会不正确');break;
  case 'coop':ensure(['together','lead','relay'].includes(e.plan)&&integer(e.leader,0,1)&&integer(e.step,0,1)&&typeof e.relayActive==='boolean'&&integer(e.help,0,3),'合作分工不正确');ensure(s.phase!=='ready'||!e.relayActive&&e.step===0,'接力步骤不正确');break;
  case 'story':ensure(strings(e.detours,storyDetourLimit(c))&&new Set(e.detours).size===e.detours.length&&e.detours.every(n=>!!storyMemento(c,n))&&strings(e.mementos,storyDetourLimit(c))&&new Set(e.mementos).size===e.mementos.length&&e.mementos.every(v=>e.detours.some(n=>storyMemento(c,n)===v))&&strings(e.journal,c.story?c.story.chapters*2+2:5)&&e.journal.every(n=>Object.hasOwn(storyMap(c),n))&&e.journal.at(-1)===s.node,'支线收藏或旅途记录不正确');if(c.story){const graph=storyMap(c);ensure(e.journal[0]==='chapter1'&&e.journal.every((n,i)=>i===0||graph[e.journal[i-1]].to===n||graph[e.journal[i-1]].options?.some(o=>o.to===n))&&e.detours.every(n=>e.journal.includes(n)),'章节旅行路线不一致');}break;
  case 'bingo':ensure(ints(e.redraws,2)&&bools(e.jokerUsed)&&e.goalLines===bingoGoal(c)&&s.players.every((p,i)=>p.done.filter(Boolean).length===p.score+Number(e.jokerUsed[i]))&&s.players.every((p,i)=>!e.jokerUsed[i]||p.score>=bingoSide(c)),'宾果标记或积分不正确');if(s.phase!=='finished')ensure(s.players.every(p=>lineCount(p.done)<e.goalLines),'宾果胜利未结算');break;
  case 'vote':ensure(Array.isArray(e.ballots)&&e.ballots.length===2&&e.ballots.every((v,i)=>integer(v,-1,1)&&(i<s.voter?v>=0:v===-1))&&typeof e.claimed==='boolean'&&(e.volunteer===null||integer(e.volunteer,0,1))&&e.claimed===(e.volunteer!==null)&&integer(e.agreements,0,c.rounds??5),'默契选择状态不正确');ensure(s.votes.every((n,i)=>n===e.ballots.filter(v=>v===i).length),'选择与汇总不一致');if(e.claimed)ensure(s.voter===2&&(e.ballots[0]!==e.ballots[1]||e.volunteer===e.ballots[0]),'自愿执行者不一致');break;
  case 'mystery':ensure(integer(e.hintCredits,0,6)&&Array.isArray(e.levels)&&e.levels.length===c.puzzles.length&&e.levels.every(v=>integer(v,0,2))&&Array.isArray(e.earned)&&e.earned.length===c.puzzles.length&&e.earned.every(v=>typeof v==='boolean')&&typeof e.tip==='string'&&e.tip.length<300&&e.levels.reduce((n,v)=>n+v,0)===s.hints,'提示币或提示层级不正确');ensure(e.levels.every((v,i)=>i<=s.stage||v===0)&&e.earned.every((v,i)=>i<=s.stage||!v),'不能领取未来线索的补给或提示');break;
 }
 if(s.phase==='task'){
  ensure(m&&m.kind===c.kind&&Array.isArray(m.actors)&&m.actors.length>=1&&m.actors.length<=2&&new Set(m.actors).size===m.actors.length&&m.actors.every(v=>integer(v,0,1))&&m.actors.includes(s.turn),'任务参与者不正确');
  const styles={spinner:['steady','risk','choice'],cards:['steady','risk'],coop:['together','lead','relay'],story:['journey','detour'],bingo:['steady'],vote:['steady'],mystery:['hint']};ensure(styles[c.kind].includes(m.style),'任务方式不正确');
  if(['spinner','cards','bingo','vote'].includes(c.kind))ensure(m.actors.length===1&&m.actors[0]===s.turn,'执行者不一致');
  if(c.kind==='coop')ensure(m.style===e.plan&&m.step===e.step&&e.relayActive===(e.plan==='relay')&&(e.plan==='together'?m.actors.length===2:m.actors.length===1&&m.actors[0]===s.turn)&&s.turn===(e.plan==='relay'&&e.step===1?1-e.leader:e.leader),'接力执行者不一致');
  if(c.kind==='story'&&m.style==='detour')ensure(e.detours.includes(s.node)&&!e.mementos.includes(storyMemento(c,s.node)),'支线任务不正确');
  if(c.kind==='vote')ensure(e.claimed&&e.volunteer===s.turn&&t.text===s.question,'自愿任务不正确');
  if(c.kind==='mystery')ensure(m.stage===s.stage&&!e.earned[s.stage]&&m.actors.length===2,'提示补给任务不正确');
 }else ensure(m===undefined,'任务阶段不一致');
}
