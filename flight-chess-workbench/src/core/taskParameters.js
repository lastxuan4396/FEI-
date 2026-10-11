import {taskDuration,taskNumber} from './taskTiming.js';
import {DICE_FORMULA_SOURCE,parseDiceFormula} from './diceFormula.js';
const NUM='(?:\\d+(?:\\.\\d+)?|[零一二两三四五六七八九十百千半]+|[Xx×])';
const TIME='(?:小时|分钟|秒钟|秒|分(?!钟|之)|min(?:utes?)?(?![a-z])|sec(?:onds?)?(?![a-z])|s(?![a-z]))';
export const TASK_COUNT_UNITS=['次','下','遍','组','T','声','句','个','张','件','根','项','口','杯','瓶','ml','毫升','升','步','格','圈'];
const QUANTITIES=['张','件','个','根','项','口','杯','瓶','ml','毫升','升'];
const REPETITIONS=['次','下','遍','组','T','声','句',''];
const COUNTS='行动回合|回合|轮|'+TASK_COUNT_UNITS.map(u=>/[a-z]/i.test(u)?`${u}(?![a-z])`:u).join('|');
const operatorBefore=(text,index)=>/[+＋×*\/÷^−.\d-]$/.test(text.slice(0,index).trimEnd());
const COUNT_SUFFIX=new RegExp(`(?:${COUNTS})$`,'i');
function parseTaskParameters(text,includeBare=true,extended=true,formulas=true){
 const pattern=new RegExp(extended?`${NUM}\\s*${TIME}(?:半|(?:\\s*${NUM}\\s*${TIME})*)|${NUM}\\s*(?:${COUNTS})`:`${NUM}${TIME}(?:${NUM}${TIME})*|${NUM}(?:回合|轮|圈|组|次|下|T(?![a-z]))`,'gi');const parts=[];let template='',end=0;
 const matches=[...text.matchAll(pattern)];const bare=text.match(/(?<![\d.])(\d+)(?=[。.!！]?\s*$)/);const barePrefix=bare?text.slice(0,bare.index):'';
 const bareTool=extended?/(?:工具|戒尺|藤条|散鞭|蛇鞭|藤拍|鞭子|皮带|皮拍|板子|竹尺|木勺|水晶板|发刷|巴掌|耳光|小红|小绿|SP)[^。；\d]{0,12}$/i:/(?:工具|戒尺|藤条|皮带|皮拍|板子|竹尺|木勺|水晶板|发刷|巴掌|小红|小绿|SP)[^。；\d]{0,12}$/i;
 if(includeBare&&bare&&!/(?:编号|序号|型号|版本)\s*$/.test(barePrefix)&&!(extended&&/点数\s*[×x*]\s*$/i.test(barePrefix))&&bareTool.test(barePrefix)&&!matches.some(m=>bare.index>=m.index&&bare.index<m.index+m[0].length))matches.push(bare);
 if(formulas){
  const formulaPattern=new RegExp(`(${DICE_FORMULA_SOURCE})\\s*(${TIME}|${COUNTS})`,'gi');
  const expressions=[...text.matchAll(formulaPattern)].flatMap(m=>{
   const formula=parseDiceFormula(m[1]);if(!formula||operatorBefore(text,m.index))return [];
   const scale=/^(?:小时)$/.test(m[2])?3600:/^(?:分|分钟|min)/i.test(m[2])?60:1;
   m.formula={factor:formula.factor*scale,offset:formula.offset*scale};return [m];
  });
  const bareExpression=text.match(new RegExp(`(${DICE_FORMULA_SOURCE})(?=[。.!！]?\\s*$)`,'i'));
  if(includeBare&&bareExpression){const formula=parseDiceFormula(bareExpression[1]),prefix=text.slice(0,bareExpression.index);if(formula&&bareTool.test(prefix)&&!operatorBefore(text,bareExpression.index)){bareExpression.formula=formula;expressions.push(bareExpression);}}
  for(let i=matches.length-1;i>=0;i--){const m=matches[i];if(expressions.some(v=>m.index>=v.index&&m.index+m[0].length<=v.index+v[0].length)||operatorBefore(text,m.index))matches.splice(i,1);}
  matches.push(...expressions);
 }
 matches.sort((a,b)=>a.index-b.index);
 for(const m of matches){const token=m[0],isTime=new RegExp(TIME,'i').test(token),unit=isTime?'秒':token.match(COUNT_SUFFIX)?.[0]??'';const kind=isTime?'time':['回合','行动回合','轮'].includes(unit)?'turn':'count';
  template+=text.slice(end,m.index)+`〔${kind==='time'?'时长':kind==='turn'?'回合':'次数'}${parts.length+1}〕`;parts.push({token,start:m.index,end:m.index+token.length,kind,unit:isTime?'秒':unit,value:m.formula?null:isTime?taskDuration(token)??null:Number.isFinite(taskNumber(token.replace(COUNT_SUFFIX,'')))?taskNumber(token.replace(COUNT_SUFFIX,'')):null,...(m.formula?{diceFormula:m.formula}:{})});end=m.index+token.length;
 }template+=text.slice(end);const key=template.replace(/\s/g,'');return {key,template,parts};
}
export function taskParameters(text){return parseTaskParameters(text);}
export function taskParameterAliases(text){
 const parsed=taskParameters(text);
 return [parseTaskParameters(text,true,true,false),parseTaskParameters(text,true,false,false),parseTaskParameters(text,false,false,false)].filter(p=>p.key!==parsed.key&&p.parts.length).map(p=>({key:p.key,total:parsed.parts.length,slots:p.parts.map(old=>parsed.parts.findIndex(part=>part.start<=old.start&&part.end>=old.end))})).filter(p=>p.slots.every(i=>i>=0));
}
export function taskParameterValues(text,preferences={}){
 const parsed=taskParameters(text);if(preferences[parsed.key])return preferences[parsed.key];
 for(const alias of taskParameterAliases(text)){const old=preferences[alias.key];if(old)return parsed.parts.map((_,i)=>{const slot=alias.slots.indexOf(i);return slot<0?null:old[slot]??null;});}
 return undefined;
}
export function taskParameterGroups(texts){
 const groups=new Map();
 for(const text of new Set(texts)){const parsed=taskParameters(text);if(!parsed.parts.length)continue;const existing=groups.get(parsed.key);if(existing)existing.originals.push(text);else groups.set(parsed.key,{...parsed,originals:[text]});}
 return [...groups.values()];
}
// Display every original unit and value, rather than treating the first variant
// as the default for the whole group. Stored keys and execution stay compatible.
export function taskParameterDetails(group){
 const versions=group.originals.map(taskParameters);
 return group.parts.map((part,i)=>{
  const originals=versions.map(v=>v.parts[i]).filter(Boolean),units=[...new Set(originals.map(p=>p.unit||'未标单位'))],tokens=[...new Set(originals.map(p=>p.token.replace(/\s/g,'')))];
  const label=part.kind==='time'?'时长（秒）':part.kind==='turn'?`持续数（${units.join('／')}）`:`${units.every(u=>QUANTITIES.includes(u.toLowerCase()))?'数量':units.every(u=>['步','格','圈'].includes(u))?'步数／圈数':'次数'}（${units.join('／')}）`;
  return {label,units,tokens,mixedUnits:part.kind!=='time'&&units.length>1};
 });
}
export function taskParameterMatches(group,type){
 if(type==='all')return true;if(type==='multiple')return group.parts.length>1;
 const parts=group.originals?group.originals.flatMap(text=>taskParameters(text).parts):group.parts;
 if(type==='repetition')return parts.some(p=>p.kind==='count'&&REPETITIONS.includes(p.unit.toUpperCase()==='T'?'T':p.unit));
 if(type==='quantity')return parts.some(p=>p.kind==='count'&&QUANTITIES.includes(p.unit.toLowerCase()));
 if(type==='movement')return parts.some(p=>p.kind==='count'&&['步','格','圈'].includes(p.unit));
 return parts.some(p=>p.kind===type);
}
export function applyTaskParameters(text,preferences={}){
 const parsed=taskParameters(text),values=taskParameterValues(text,preferences);
 if(!values)return {text,original:text,duration:taskDuration(text)};let result='',end=0;parsed.parts.forEach((part,i)=>{const value=values[i];result+=text.slice(end,part.start)+(Number.isInteger(value)&&value>0&&value<=(part.kind==='time'?86400:9999)?`${value}${part.unit}`:part.token);end=part.end;});result+=text.slice(end);return {text:result,original:text,duration:taskDuration(result)};
}
export function readTaskPreferences(){try{const values=JSON.parse(localStorage.getItem('flight-chess.task-parameters.v1')||'{}');return validateTaskPreferences(values);}catch{return {};}}
export function validateTaskPreferences(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>2000)throw Error('参数文件不正确');
 for(const [key,values] of Object.entries(value)){if(key.length>1000||!Array.isArray(values)||values.length>30||values.some(v=>v!==null&&(!Number.isSafeInteger(v)||v<1||v>86400)))throw Error('参数值超出范围');}
 const next={...value};
 for(const [key,values] of Object.entries(value)){
  const old=[...key.matchAll(/〔(时长|回合|次数)(\d+)〕/g)],parts=taskParameters(key).parts;if(!old.length||!parts.length||old.length+parts.length>30)continue;
  const slots=[...old.map(m=>({start:m.index,end:m.index+m[0].length,label:m[1],value:values[Number(m[2])-1]??null})),...parts.map(p=>({start:p.start,end:p.end,label:p.kind==='time'?'时长':p.kind==='turn'?'回合':'次数',value:null}))].sort((a,b)=>a.start-b.start);
  let upgraded='',end=0;slots.forEach((slot,i)=>{upgraded+=key.slice(end,slot.start)+`〔${slot.label}${i+1}〕`;end=slot.end;});upgraded+=key.slice(end);
  if(upgraded!==key){if(!Object.hasOwn(next,upgraded))next[upgraded]=slots.map(slot=>slot.value);delete next[key];}
 }
 return next;
}
