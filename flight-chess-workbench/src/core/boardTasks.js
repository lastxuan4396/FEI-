import {taskDuration} from './taskTiming.js';
import {MODES} from './modes.js';
// The actual task is chosen once per new game and saved with the board.
// Image originals and user-authored literal cells are kept unchanged.
export function fillOwnBoardTasks(input,seed=20261002){
 const config=structuredClone(input);
 if(config.layout.image||!MODES.some(m=>config.id===`mode-${m.id}`))return config;
 let rng=(seed^0x7f4a7c15)>>>0||1;const bags={};
 const draw=deck=>{const cards=config.decks[deck].cards;if(!bags[deck]?.length)bags[deck]=cards.map((_,i)=>i);rng^=rng<<13;rng^=rng>>>17;rng^=rng<<5;rng>>>=0;const pick=Math.floor(rng/4294967296*bags[deck].length);return cards[bags[deck].splice(pick,1)[0]];};
 config.tiles=config.tiles.map(tile=>{
  if(tile.type!=='task'||tile.text||tile.playerTexts)return tile;
  const next={...tile};delete next.duration;
  if(config.playerDecks){next.playerTexts=Object.fromEntries(config.players.map((p,i)=>{const who=tile.target==='other'?config.players[(i+1)%config.players.length].id:p.id;return [p.id,draw(config.playerDecks[who]??tile.deck)];}));}
  else {next.text=draw(tile.deck);const duration=taskDuration(next.text);if(duration)next.duration=duration;}
  return next;
 });
 return config;
}
