import {taskNumber} from './taskTiming.js';
const NUMBER='(?:\\d+|[零一二两三四五六七八九十百千]+)';
const VARIABLE='(?:[Xx]|点数|骰子点数)';
const TERM=`(?:${NUMBER}\\s*[×*]?\\s*${VARIABLE}|${VARIABLE}(?:\\s*[×*]\\s*${NUMBER})?|${NUMBER})`;
export const DICE_FORMULA_SOURCE=`(?:[（(]\\s*${TERM}(?:\\s*[+＋]\\s*${TERM})*\\s*[）)]|${TERM}(?:\\s*[+＋]\\s*${TERM})*)`;
// Only the printed, linear dice expressions are understood. Never evaluate JS,
// infer a missing operand, or evaluate a division/rounding instruction.
export function parseDiceFormula(value){
 if(typeof value!=='string'||value.length>100)return undefined;
 let text=value.replace(/\s/g,'').replaceAll('＋','+');
 if(/^[（(].*[）)]$/.test(text))text=text.slice(1,-1);
 const terms=text.split('+');if(terms.length>5)return undefined;
 let factor=0,offset=0;
 for(const term of terms){
  if(new RegExp(`^${VARIABLE}$`,'i').test(term)){factor++;continue;}
  let m=term.match(new RegExp(`^(${NUMBER})[×*]?${VARIABLE}$`,'i'));
  if(!m)m=term.match(new RegExp(`^${VARIABLE}[×*](${NUMBER})$`,'i'));
  if(m){factor+=taskNumber(m[1]);continue;}
  if(!new RegExp(`^${NUMBER}$`).test(term))return undefined;
  offset+=taskNumber(term);
 }
 return Number.isSafeInteger(factor)&&factor>0&&factor<=86400&&Number.isSafeInteger(offset)&&offset>=0&&offset<=86400?{factor,offset}:undefined;
}
export function diceFormulaAmount(formula,value){const amount=formula.factor*value+formula.offset;return formula.cap===undefined?amount:Math.min(amount,formula.cap);}
export function diceFormulaLabel(formula){return `骰点${formula.factor===1?'':` × ${formula.factor}`}${formula.offset?` + ${formula.offset}`:''}${formula.cap!==undefined?`，最多 ${formula.cap}`:''}`;}
