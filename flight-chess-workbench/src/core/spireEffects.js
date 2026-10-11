import {effectCard} from './effectCards.js';
import {effectRemaining} from './ongoingEffects.js';
// Read from the same saved action counter for previews and actual resolution.
export function spireEffectBonus(s,actor){
 const bonus={block:0,heal:0,response:0,cards:[]};
 if(s.config.variant!=='spire'||s.phase==='finished')return bonus;
 for(const e of s.effects??[]){const c=effectCard(e.cardId);if(c?.kind!=='spire'||!e.targets.includes(String(actor))||s.effectTurns<e.startedCounter||effectRemaining(e,s.effectTurns,2,0)<=0)continue;
  bonus.cards.push(c);if(c.rule==='spireBlock')bonus.block+=2;if(c.rule==='spireHeal')bonus.heal++;if(c.rule==='spireResponse')bonus.response++;
 }return bonus;
}
