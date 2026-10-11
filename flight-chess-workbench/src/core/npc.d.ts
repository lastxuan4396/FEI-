import type {Enemy,Battle,BattleCard} from './adventure.js';
export const NPC_TYPES:Record<string,{name:string;trait:string}>;
export function npcRoute(floor:number,floors:number,path:string,patterns?:string):{elite:boolean;archetype?:string;name:string;trait:string};
export function nextNPCIntent(enemy:Enemy,floor:number,round:number,difficulty:number):Enemy['intent'];
export function createNPC(floor:number,floors:number,path:string,difficulty:number,patterns?:string):Enemy;
export function npcTrait(enemy:Enemy):string;
export function previewNPCAction(battle:Battle):{attacks:boolean;total:number;reduced:number;incoming:number;blocked:number;damage:number;healed:number;retaliation:number;armorAfter:number;label:string};
export function resolveNPCAction(battle:Battle):string;
export function battleCardDamage(battle:Battle,card:BattleCard):number;
export function resolveBattleCard(battle:Battle,card:BattleCard):number;

export function npcAttackTasks(battle:Battle,mode?:'off'|'on-hit'|'always'):{actor:number;guardGain:number}[];
