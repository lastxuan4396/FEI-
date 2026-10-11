export const BINGO_SIZES:readonly (3|4|5)[];
export interface BingoRules {size:3|4|5;goalLines:number}
export function bingoSide(config:{bingo?:BingoRules}):number;
export function bingoGoal(config:{bingo?:BingoRules;creative?:boolean}):number;
export function bingoLines(side:number):number[][];
export function bingoLineCount(done:readonly boolean[]):number;
