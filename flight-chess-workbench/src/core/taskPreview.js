// A short cell preview keeps numeric word boundaries and Unicode characters.
// The reader always retains the complete task, with an explicit truncation cue.
export function taskPreviewLines(text){
 const chars=Array.from((text??'').replace(/\s+/g,' ').trim()),preview=chars.length>16?[...chars.slice(0,15),'…']:chars;
 return Array.from({length:Math.ceil(preview.length/4)},(_,i)=>preview.slice(i*4,i*4+4).join(''));
}
