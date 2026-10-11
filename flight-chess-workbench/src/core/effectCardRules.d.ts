export function beforeEffectRules(state:unknown,config:unknown,action:unknown,before:unknown):string[];
export function afterEffectRules(state:unknown,config:unknown,action:unknown,before:unknown,labels?:string[]):void;
export function taskEffectCards(session:import('./arcade.js').ArcadeSession):import('./effectCards.js').EffectCard[];
