// Only definite, literal durations become countdowns. Separate steps and bounds stay text.
function number(text) {
 if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
 if(text==='半')return .5;
 const digits={零:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9},units={十:10,百:100,千:1000};
 let sum=0,pending=0;
 for(const c of text){if(Object.hasOwn(digits,c))pending=digits[c];else if(units[c]){sum+=(pending||1)*units[c];pending=0;}else return NaN;}
 return sum+pending;
}
const scale=unit=>unit==='小时'?3600:/^(分|分钟|min)/i.test(unit)?60:1;
function literalDuration(text,allowLegacyConditional=false) {
 if(typeof text!=='string')return undefined;
 // Keep a numeric boundary: a position/quantity beside a time is not one number.
 // Legacy snapshots retain their recorded interpretation for save recovery.
 let clean=(allowLegacyConditional?text:text.replace(/(\d)\s+(?=\d)/g,'$1\u200b')).replace(/\s/g,'');
 // An unresolved time number must not borrow another visible duration.
 // A separately confirmed literal time remains useful even if action words
 // elsewhere are incomplete; the original reading still shows that warning.
 if(!allowLegacyConditional&&/〔[^〕]*时长[^〕]*(?:不清|不完整|缺字|未确认)[^〕]*〕/.test(clean))return undefined;
 clean=clean.replace(/(\d+|[零一二两三四五六七八九十百千]+)(分钟|分|min)半/gi,(_,n)=>`${number(n)}分钟30秒`);
 const matches=[...clean.matchAll(/(?<![\d零一二两三四五六七八九十百千万半./~～-])(\d+(?:\.\d+)?|[零一二两三四五六七八九十百千半]+)(小时|分钟|分(?!之)|秒钟|秒|min(?:utes?)?(?![a-z])|sec(?:onds?)?(?![a-z])|s(?![a-z]))/gi)];
 if(!matches.length||matches.length>3)return undefined;
 // A duration inside a conditional or a variable penalty is not a fixed
 // whole-task clock. Leave the original clause for the players to review.
 const prefix=clean.slice(0,matches[0].index);
 if(!allowLegacyConditional&&/(?:如果|如若|否则|每少|未达成|未完成|未达到)|若[^。；]*?(?:则|就)/.test(prefix))return undefined;
 // A role branch or timed alternative does not define the other branch's time.
 if(!allowLegacyConditional&&/(?:男|女)(?:生)?(?:停留|停此|停在|到此)|(?:或|或者)/.test(prefix))return undefined;
 // A per-person/per-step clock does not establish how many steps the entire
 // task has. Existing saved interpretations remain readable via the legacy path.
 if(!allowLegacyConditional&&/每(?:个|种|一)?(?:姿势|动作|部位|人|位|玩家|项目|次|回合|轮|遍|圈|组)[^。；]*$|(?:各|分别)$/.test(prefix))return undefined;
 // A handwritten time limit, repeated interval, or compact "5 kinds 1min"
 // does not establish one fixed whole-task duration. Preserve old running
 // review clocks through the legacy path instead of invalidating saves.
 if(!allowLegacyConditional&&/(?:限时|限于)$|(?:\d+|[一二两三四五六七八九十]+)种$/.test(prefix))return undefined;
 if(!allowLegacyConditional&&matches.some(m=>/^[×x*](?:\d+|[一二两三四五六七八九十]+)/i.test(clean.slice(m.index+m[0].length))))return undefined;
 for(const m of matches){const before=clean.slice(Math.max(0,m.index-5),m.index),after=clean.slice(m.index+m[0].length);if(/[<>≥≤]$|(?:至少|至多|超过|大于|小于|不大于|不小于|不少于|不超过|不低于)$/.test(before)||/^(以上|以下|以内|内|左右)/.test(after)||!allowLegacyConditional&&/(?:最少|最多|约|大约|大概|近)$/.test(before))return undefined;}
 for(let i=1;i<matches.length;i++){const a=matches[i-1],b=matches[i];if(scale(a[2])<=scale(b[2])||clean.slice(a.index+a[0].length,b.index)!=='')return undefined;}
 const seconds=matches.reduce((sum,m)=>sum+number(m[1])*scale(m[2]),0);
 return Number.isInteger(seconds)&&seconds>=1&&seconds<=86400?seconds:undefined;
}
export function taskDuration(text){return literalDuration(text);}
// Read existing clocks using their saved interpretation; never use the legacy
// interpretation to infer a new clock for a conditional clause.
export function legacyTaskDuration(text){return literalDuration(text,true);}
export function reviewDuration(text,review){return taskDuration(text)??(review&&(review.timerEndsAt!==undefined||review.pausedRemaining!==undefined)?legacyTaskDuration(text):undefined);}
export function durationLabel(seconds){const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;return [h?`${h}小时`:'',m?`${m}分钟`:'',s?`${s}秒`:''].filter(Boolean).join('')||'0秒';}

export function taskNumber(text){return typeof text==='string'?number(text.trim()):NaN;}
