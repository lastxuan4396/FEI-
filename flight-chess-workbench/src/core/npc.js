// Independently implemented. One calculation drives both the visible intent and
// enemy resolution, following the preview consistency principle in deckbuilders.
export const NPC_TYPES={
 patrol:{name:'巡逻者',trait:'交替单次攻击和两次连击，格挡由两人共用。'},
 charger:{name:'蓄势兽',trait:'先蓄力，再重击；蓄力轮可以集中进攻，重击轮一起准备格挡。'},
 mender:{name:'修复者',trait:'攻击与修复交替，修复不会超过最大生命。'},
 sentinel:{name:'铁甲守卫',trait:'先获得临时护甲，再攻击；临时护甲在下一次敌人行动后消失。'},
 boss:{name:'尖塔守望者',trait:'循环使用连击、汲取和重击；汲取只按实际造成的伤害回血。'}
};
function classicIntent(floor,round,difficulty){return {type:round%3===0?'heavy':floor%3===0&&round%2===0?'heal':'attack',amount:round%3===0?(6+floor)*difficulty:floor%3===0&&round%2===0?4:(3+Math.ceil(floor/2))*difficulty};}
export function npcRoute(floor,floors,path,patterns='classic'){
 const elite=path==='elite'||floor===floors,archetype=floor===floors?'boss':elite?'sentinel':['patrol','charger','mender'][(floor-1)%3];
 return {elite,archetype:patterns==='varied'?archetype:undefined,name:NPC_TYPES[archetype].name,trait:patterns==='varied'?NPC_TYPES[archetype].trait:'基础打法：按轮数攻击，部分层数会回血。'};
}
export function nextNPCIntent(enemy,floor,round,difficulty){
 if(!enemy.archetype)return classicIntent(floor,round,difficulty);
 const base=(3+Math.ceil(floor/2))*difficulty,step=(round-1)%3;
 switch(enemy.archetype){
  case 'charger':return step===0?{type:'charge',amount:0}:step===1?{type:'heavy',amount:(7+floor)*difficulty}:{type:'attack',amount:base};
  case 'mender':return round%2===0?{type:'heal',amount:(3+floor)*difficulty}:{type:'attack',amount:base};
  case 'sentinel':return step===0?{type:'fortify',amount:3}:step===1?{type:'attack',amount:base+difficulty}:{type:'heavy',amount:(6+floor)*difficulty};
  case 'boss':return step===0?{type:'attack',amount:base,hits:2}:step===1?{type:'drain',amount:base+2*difficulty,heal:4*difficulty}:{type:'heavy',amount:(8+floor)*difficulty};
  default:return step===1?{type:'attack',amount:Math.ceil(base*.6),hits:2}:{type:'attack',amount:base};
 }
}
export function createNPC(floor,floors,path,difficulty,patterns='classic'){
 const route=npcRoute(floor,floors,path,patterns),maxHp=(16+floor*5)*difficulty+(route.elite?10:0),enemy={...route,hp:maxHp,maxHp,armor:route.elite?2:0,baseArmor:route.elite?2:0};
 enemy.intent=nextNPCIntent(enemy,floor,1,difficulty);return enemy;
}
export function npcTrait(enemy){return NPC_TYPES[enemy.archetype]?.trait??'基础打法：按轮数攻击，部分层数会回血。';}
export function previewNPCAction(battle){
 const enemy=battle.enemy,intent=enemy.intent,attacks=['attack','heavy','drain'].includes(intent.type),total=attacks?intent.amount*(intent.hits??1):0;
 const reduced=Math.min(total,battle.weakened??0),incoming=total-reduced,blocked=Math.min(battle.block,incoming),damage=Math.min(battle.hp,Math.max(0,incoming-blocked));
 const healed=intent.type==='heal'?Math.min(enemy.maxHp-enemy.hp,intent.amount):intent.type==='drain'?Math.min(enemy.maxHp-enemy.hp,damage,intent.heal??0):0;
 const retaliation=attacks&&blocked>0&&battle.hp>damage?Math.min(enemy.hp+healed,Math.max(0,Math.min(blocked,battle.riposte??0)-enemy.armor)):0;
 const armorAfter=intent.type==='fortify'?(enemy.baseArmor??enemy.armor)+intent.amount:enemy.baseArmor??enemy.armor;
 const label=intent.type==='charge'?'蓄力 · 本轮不攻击':intent.type==='fortify'?`护甲 +${intent.amount}`:intent.type==='heal'?`恢复 ${intent.amount}`:intent.type==='drain'?`汲取攻击 ${total}`:intent.hits>1?`连击 ${intent.amount} × ${intent.hits}`:`${intent.type==='heavy'?'重击':'攻击'} ${total}`;
 return {attacks,total,reduced,incoming,blocked,damage,healed,retaliation,armorAfter,label};
}
export function resolveNPCAction(battle){
 const action=previewNPCAction(battle),type=battle.enemy.intent.type;
 battle.hp-=action.damage;battle.enemy.hp+=action.healed-action.retaliation;battle.enemy.armor=action.armorAfter;battle.block=0;battle.marked=0;battle.weakened=0;battle.riposte=0;
 return type==='charge'?'敌人蓄力，本轮不攻击；下一轮准备重击。':type==='fortify'?`敌人护甲提高至${action.armorAfter}，持续到下一次敌人行动。`:type==='heal'?`敌人恢复${action.healed}生命。`:`敌人攻击${action.total}，压制减少${action.reduced}，格挡${action.blocked}，承受${action.damage}伤害。${action.retaliation?`掩护反击造成${action.retaliation}伤害。`:''}${type==='drain'?`敌人汲取恢复${action.healed}生命。`:''}`;
}
// Telegraph tasks from the same attack preview used by damage resolution.
// A single hit alternates its target; multi-hit attacks pressure both players.
export function npcAttackTasks(battle,mode='off'){
 const action=previewNPCAction(battle);
 if(mode==='off'||!action.attacks||mode==='on-hit'&&action.incoming<=battle.block)return [];
 const targets=(battle.enemy.intent.hits??1)>1?[0,1]:[(battle.round-1)%2];
 const unblocked=Math.max(0,action.incoming-battle.block),guard=Math.ceil(unblocked/2);
 return targets.map((actor,i)=>({actor,guardGain:Math.floor(guard/targets.length)+(i<guard%targets.length?1:0)}));
}
export function battleCardDamage(battle,card){return card.attack>0?Math.min(battle.enemy.hp,Math.max(0,card.attack+(battle.power??0)+((battle.marked??0)>0?3:0)-battle.enemy.armor)):0;}
export function resolveBattleCard(battle,card){
 const damage=battleCardDamage(battle,card);battle.enemy.hp=Math.max(0,battle.enemy.hp-damage);battle.block+=card.block;battle.hp=Math.min(battle.maxHp,battle.hp+card.heal);
 if(card.attack>0&&battle.marked>0)battle.marked--;
 if(card.mark)battle.marked=card.mark;
 if(card.riposte)battle.riposte=Math.max(battle.riposte??0,card.riposte);
 if(card.weaken)battle.weakened=Math.min(8,(battle.weakened??0)+card.weaken);
 return damage;
}
