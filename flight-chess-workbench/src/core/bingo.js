// Shared geometry and victory rules for both editions. Missing settings retain
// the original 3-by-3 save format and each edition's original victory target.
export const BINGO_SIZES=[3,4,5];
export function bingoSide(config){return config.bingo?.size??3;}
export function bingoGoal(config){return config.bingo?.goalLines??(config.creative?2:1);}
export function bingoLines(side){
 if(!BINGO_SIZES.includes(side))throw Error('宾果地图请选择3、4或5格边长');
 const range=Array.from({length:side},(_,i)=>i);
 return [...range.map(row=>range.map(col=>row*side+col)),...range.map(col=>range.map(row=>row*side+col)),range.map(i=>i*side+i),range.map(i=>i*side+side-1-i)];
}
export function bingoLineCount(done){const side=Math.sqrt(done.length);return bingoLines(side).filter(line=>line.every(i=>done[i])).length;}
