export interface DiceFormula {factor:number;offset:number;cap?:number}
export const DICE_FORMULA_SOURCE:string;
export function parseDiceFormula(value:string):DiceFormula|undefined;
export function diceFormulaAmount(formula:DiceFormula,value:number):number;
export function diceFormulaLabel(formula:DiceFormula):string;
