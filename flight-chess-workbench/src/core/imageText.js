// Recognized words remain data; conflicting readings require an explicit choice.
const normalized=text=>text.replace(/\s/g,'');
const sources=new Set(['whole','crop','comparison','manual']);
const arrowGlyphs={up:'↑',down:'↓',left:'←',right:'→'};
function reading(input){if(!input||typeof input.text!=='string'||input.text.length>500||!Number.isFinite(input.confidence)||input.confidence<0||input.confidence>1||input.source!==undefined&&!sources.has(input.source))throw Error('图片文字候选不正确');return {text:input.text,confidence:input.confidence,...(input.source?{source:input.source}:{})};}
export function validateImageTexts(input){
 if(input===undefined)return undefined;if(!Array.isArray(input)||input.length>2000)throw Error('图片文字最多2000行');let length=0;const ids=new Set();
 return input.map((line,i)=>{const r=reading(line);if([line.x,line.y,line.width,line.height].some(v=>!Number.isFinite(v))||line.x<0||line.y<0||line.width<=0||line.height<=0||line.x+line.width>1.000001||line.y+line.height>1.000001||typeof line.reviewed!=='boolean'||line.edited!==undefined&&typeof line.edited!=='boolean')throw Error(`第${i+1}行图片文字不正确`);
 if(typeof line.id==='string'&&(!line.id||line.id.length>80))throw Error('图片文字ID不正确');const id=typeof line.id==='string'?line.id:`text-${i}`;if(ids.has(id))throw Error('图片文字ID重复');ids.add(id);
 if(line.alternatives!==undefined&&(!Array.isArray(line.alternatives)||line.alternatives.length>4))throw Error('每行最多4个候选');const alternatives=line.alternatives?.map(reading);
 if(typeof line.originalText==='string'&&line.originalText.length>500)throw Error('图片原始文字超过500字');const originalText=typeof line.originalText==='string'?line.originalText:undefined;length+=r.text.length+(originalText?.length??0)+(alternatives??[]).reduce((n,v)=>n+v.text.length,0);if(length>200000)throw Error('图片文字总长度超过限制');
 if(line.words!==undefined&&(!Array.isArray(line.words)||line.words.length>500))throw Error('每行最多500个字位置');
 const words=line.words?.map(word=>{if(!word||typeof word.text!=='string'||!word.text||word.text.length>500||!Number.isFinite(word.confidence)||word.confidence<0||word.confidence>1||[word.x,word.y,word.width,word.height].some(v=>!Number.isFinite(v))||word.x<0||word.y<0||word.width<=0||word.height<=0||word.x+word.width>1.000001||word.y+word.height>1.000001)throw Error('图片字位置不正确');length+=word.text.length;if(length>200000)throw Error('图片文字总长度超过限制');return {text:word.text,confidence:word.confidence,x:word.x,y:word.y,width:word.width,height:word.height};});
 if(line.excluded!==undefined&&typeof line.excluded!=='boolean')throw Error('图片文字排除标记不正确');
 if(line.graphic!==undefined&&(!Object.hasOwn(arrowGlyphs,line.graphic)||line.text!==arrowGlyphs[line.graphic]))throw Error('图片箭头方向不正确');
 return {id,...r,x:line.x,y:line.y,width:line.width,height:line.height,reviewed:line.reviewed,...(originalText!==undefined?{originalText}:{}),...(line.graphic!==undefined?{graphic:line.graphic}:{}),...(alternatives?.length?{alternatives}:{}),...(line.edited!==undefined?{edited:line.edited}:{}),...(line.excluded!==undefined?{excluded:line.excluded}:{}),...(words?.length?{words}:{})};
 });
}
function sameLocation(a,b){const inter=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));const heightRatio=Math.min(a.height,b.height)/Math.max(a.height,b.height),widthRatio=Math.min(a.width,b.width)/Math.max(a.width,b.width);return inter/Math.min(a.width*a.height,b.width*b.height)>.68&&heightRatio>.5&&widthRatio>.48&&Math.abs(a.y+a.height/2-b.y-b.height/2)<Math.min(a.height,b.height)*.45;}
function variants(values,primary){const seen=new Set([normalized(primary)]);return values.filter(v=>{const n=normalized(v.text);if(!n||seen.has(n))return false;seen.add(n);return true;}).slice(0,4).map(reading);}
export function mergeImageTexts(old,next){
 const result=old.map(line=>({...line,...(line.alternatives?{alternatives:[...line.alternatives]}:{})}));
 for(const line of next){const matching=result.map((a,index)=>({a,index})).filter(({a})=>sameLocation(a,line)).sort((a,b)=>Math.abs(a.a.x-line.x)-Math.abs(b.a.x-line.x));const at=matching[0]?.index;
 if(at===undefined){if(result.length>=2000)throw Error('文字超过2000行，请分图整理；已有结果保留。');result.push({...line});continue;}
 const previous=result[at],same=normalized(previous.text)===normalized(line.text);
 if(same){result[at]={...previous,...(!previous.words&&line.words&&!previous.edited?{words:line.words}:{}),confidence:previous.reviewed||previous.edited?previous.confidence:Math.max(previous.confidence,line.confidence),...(variants([...(previous.alternatives??[]),...(line.alternatives??[])],previous.text).length?{alternatives:variants([...(previous.alternatives??[]),...(line.alternatives??[])],previous.text)}:{})};continue;}
 // High confidence is not proof. Keep the old/edited reading and collect alternatives.
 result[at]={...previous,alternatives:variants([...(previous.alternatives??[]),reading(line),...(line.alternatives??[])],previous.text)};
 }
 return result;
}
export function chooseImageReading(line,text){const chosen=line.alternatives?.find(a=>a.text===text);if(!chosen)throw Error('候选已不存在');const alternatives=variants([reading(line),...(line.alternatives??[])],chosen.text);const result={...line,...chosen,reviewed:false,edited:true,alternatives};delete result.words;delete result.graphic;return result;}
export function textForRegion(texts,region){
 const lines=(texts??[]).filter(l=>{const x=l.x+l.width/2,y=l.y+l.height/2;return !l.excluded&&x>=region.x&&x<=region.x+region.width&&y>=region.y&&y<=region.y+region.height;}).sort((a,b)=>a.y+a.height/2-b.y-b.height/2||a.x-b.x);
 // Group against a fixed row anchor. A pairwise "same row" comparator is
 // non-transitive and can interleave the next row when boxes have uneven heights.
 const rows=[];for(const line of lines){const center=line.y+line.height/2;let row=rows.find(r=>Math.abs(center-r.center)<Math.min(line.height,r.height)*.45);if(!row){row={center,height:line.height,lines:[]};rows.push(row);}row.lines.push(line);}
 return rows.flatMap(row=>row.lines.sort((a,b)=>a.x-b.x));
}
export function overlappingReadings(lines){return lines.some((a,i)=>a.text.trim()&&lines.slice(i+1).some(b=>{if(!b.text.trim()||a.excluded||b.excluded)return false;const inter=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));return inter/Math.min(a.width*a.height,b.width*b.height)>.7;}));}
export function proposeRule(source){if(/如果|若|否则|只有|当.+时|直到|期间|同时|并|且|然后|[；;]/.test(source))return null;const numbers={'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};const text=source.replace(/\s/g,'').replace(/[一二两三四五六七八九十]{1,3}(?=[格步])/g,value=>{if(value==='十')return '10';if(value.includes('十')){const [a,b]=value.split('十');return String((numbers[a]??1)*10+(numbers[b]??0));}return String(numbers[value]??value);});if(/^(?:按|按照)(?:本次)?(?:骰子)?点数(前进|后退)[。.!！]?$/.test(text)){const forward=text.includes('前进');return {tile:{type:'move',steps:forward?1:-1,stepsFromDice:true},reason:'按本次骰子点数移动'};}if(/^(?:前进|后退|退回|返回)\d+(?:格|步)[。.!！]?$/.test(text)){const m=text.match(/(前进|后退|退回|返回)(\d+)(?:格|步)/);const n=+m[2];if(n>=1&&n<=256)return {tile:{type:'move',steps:m[1]==='前进'?n:-n},reason:m[0]};}if(/^(?:回到|返回|退回)起点[。.!！]?$/.test(text))return {tile:{type:'home'},reason:'返回起点'};if(/^(?:再掷|再投|再扔)(?:一次|1次)[。.!！]?$/.test(text))return {tile:{type:'extra'},reason:'再掷一次'};if(/^(?:暂停|停)(?:一|1)轮[。.!！]?$/.test(text))return {tile:{type:'skip'},reason:'暂停一轮'};const scale=text.match(/^下(?:一)?(?:项|个)(?:任务)?(翻倍|双倍|减半)[。.!！]?$/);if(scale)return {tile:{type:'taskScale',factor:scale[1]==='减半'?0.5:2},reason:`下一项本人任务${scale[1]==='减半'?'减半':'翻倍'}（骰子不变）`};if(/^下(?:一)?次(?:掷骰子|骰子|掷骰|点数|骰子点数|掷骰子点数)?(?:翻倍|双倍)[。.!！]?$/.test(text))return {tile:{type:'double'},reason:'下次翻倍'};return null;}
export function numberedRoute(boxes,texts){const assignments=[];const candidates=new Map(boxes.map(b=>[b.id,[]]));for(const line of texts){if(line.excluded||!/^\d{1,3}$/.test(line.text.trim())||line.confidence<.75)continue;const x=line.x+line.width/2,y=line.y+line.height/2;const choices=boxes.map(b=>({b,d:Math.hypot((x-b.x-b.width/2)/b.width,(y-b.y-b.height/2)/b.height)})).filter(({d})=>d<1.05).sort((a,b)=>a.d-b.d);if(!choices.length)continue;const {b,d}=choices[0],outside=x<b.x||x>b.x+b.width||y<b.y||y>b.y+b.height;candidates.get(b.id).push({number:+line.text,rank:(outside?3:0)+line.confidence-d*.1});}
for(const box of boxes){const found=candidates.get(box.id).sort((a,b)=>b.rank-a.rank);if(found.length&&(!found[1]||found[0].rank-found[1].rank>.3))assignments.push({id:box.id,number:found[0].number});}
const duplicates=assignments.filter((a,i)=>assignments.findIndex(b=>b.number===a.number)!==i).map(a=>a.number),sorted=assignments.sort((a,b)=>a.number-b.number),missing=[];for(let n=sorted[0]?.number??0;n<=(sorted.at(-1)?.number??-1);n++)if(!sorted.some(a=>a.number===n))missing.push(n);return {route:sorted.map(a=>a.id),numbers:sorted.map(a=>a.number),duplicates,missing,unassigned:boxes.length-assignments.length};}

// A single whole-image line can join words from neighboring cells. Its center
// alone cannot identify which cell owns the text; require manual separation.
export function crossingReadings(texts,regions){return texts.filter(line=>{if(line.excluded||!line.text.trim())return false;const area=line.width*line.height;let matched=0,total=0;for(const r of regions){const inter=Math.max(0,Math.min(line.x+line.width,r.x+r.width)-Math.max(line.x,r.x))*Math.max(0,Math.min(line.y+line.height,r.y+r.height)-Math.max(line.y,r.y));const fraction=inter/area;if(fraction>=.15){matched++;total+=fraction;}}return matched>1&&total>=.65;});}

// Split only when every recognized word has one unambiguous cell owner.
// No characters are invented or discarded; the raw joined line stays excluded.
export function splitCrossingReadings(texts,regions){
 const crossed=new Set(crossingReadings(texts,regions).map(l=>l.id)),result=[],ids=new Set(texts.map(l=>l.id));let split=0;
 for(const line of texts){
  if(!crossed.has(line.id)||line.reviewed||line.edited||!line.words?.length||normalized(line.words.map(w=>w.text).join(''))!==normalized(line.text)){result.push(line);continue;}
  const groups=[];let unsafe=false;
  for(const word of line.words){const area=word.width*word.height,owners=regions.map((r,i)=>({i,share:Math.max(0,Math.min(word.x+word.width,r.x+r.width)-Math.max(word.x,r.x))*Math.max(0,Math.min(word.y+word.height,r.y+r.height)-Math.max(word.y,r.y))/area})).sort((a,b)=>b.share-a.share);
   if(!owners.length||owners[0].share<.7||(owners[1]?.share??0)>.15){unsafe=true;break;}
   const owner=owners[0].i;let group=groups.at(-1);if(!group||group.owner!==owner){if(groups.some(g=>g.owner===owner)){unsafe=true;break;}group={owner,words:[]};groups.push(group);}group.words.push(word);
  }
  if(unsafe||groups.length<2){result.push(line);continue;}
  result.push({...line,excluded:true});split++;
  for(const [n,g] of groups.entries()){const ws=g.words,x=Math.min(...ws.map(w=>w.x)),y=Math.min(...ws.map(w=>w.y)),right=Math.max(...ws.map(w=>w.x+w.width)),bottom=Math.max(...ws.map(w=>w.y+w.height));let id=`${line.id.slice(0,60)}-split-${n}`,suffix=0;while(ids.has(id))id=`${line.id.slice(0,60)}-split-${n}-${++suffix}`;ids.add(id);const text=ws.map(w=>w.text).join('');result.push({id,text,originalText:line.text,confidence:Math.min(...ws.map(w=>w.confidence)),source:line.source,x,y,width:right-x,height:bottom-y,reviewed:false,words:ws});}
 }
 return {lines:validateImageTexts(result),split};
}

// Explicitly re-read selected cells, while archiving old unreviewed readings.
// Human corrections protect their entire cell; empty OCR never erases old text.
export function replaceRegionReadings(old,next,regions){
 const owns=(r,l)=>{const x=l.x+l.width/2,y=l.y+l.height/2;return x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height;};
 const share=(r,l)=>Math.max(0,Math.min(l.x+l.width,r.x+r.width)-Math.max(l.x,r.x))*Math.max(0,Math.min(l.y+l.height,r.y+r.height)-Math.max(l.y,r.y))/(l.width*l.height);
 const protectedCells=regions.filter(r=>old.some(l=>!l.excluded&&(l.reviewed||l.edited||l.source==='manual')&&owns(r,l))),fresh=next.map(l=>({...l,...(protectedCells.some(r=>owns(r,l))?{excluded:true}:{})}));
 const updated=old.map(l=>{if(l.excluded||l.reviewed||l.edited||l.source==='manual')return l;const replace=regions.some(r=>!protectedCells.includes(r)&&owns(r,l)&&fresh.some(n=>!n.excluded&&n.text.trim()&&owns(r,n))&&share(r,l)>=.7&&regions.every(n=>n===r||share(n,l)<=.15));return replace?{...l,excluded:true}:l;});
 return validateImageTexts([...updated,...fresh]);
}
