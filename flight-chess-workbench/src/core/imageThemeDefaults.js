import {IMAGE_DECK_BASELINE_PRE_SOURCE2} from './imageDeckBaselinePreSource2.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE1} from './imageDeckBaselinePreSource1.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE14} from './imageDeckBaselinePreSource14.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE13} from './imageDeckBaselinePreSource13.js';
import {IMAGE_MODE_DECKS} from './modes.js';
import {IMAGE_DECK_BASELINE_173} from './imageDeckBaseline173.js';
import {IMAGE_DECK_BASELINE_174} from './imageDeckBaseline174.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE10} from './imageDeckBaselinePreSource10.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE15} from './imageDeckBaselinePreSource15.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE27} from './imageDeckBaselinePreSource27.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE19} from './imageDeckBaselinePreSource19.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE20} from './imageDeckBaselinePreSource20.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE21} from './imageDeckBaselinePreSource21.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE22} from './imageDeckBaselinePreSource22.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE4} from './imageDeckBaselinePreSource4.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE6} from './imageDeckBaselinePreSource6.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE5} from './imageDeckBaselinePreSource5.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE3} from './imageDeckBaselinePreSource3.js';
import {IMAGE_DECK_BASELINE_SOURCE27_DRAFT} from './imageDeckBaselineSource27Draft.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE26} from './imageDeckBaselinePreSource26.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE7} from './imageDeckBaselinePreSource7.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE17} from './imageDeckBaselinePreSource17.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE16} from './imageDeckBaselinePreSource16.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE_BOUNDARIES} from './imageDeckBaselinePreSourceBoundaries.js';
import {IMAGE_DECK_BASELINE_PRE_SOURCE9} from './imageDeckBaselinePreSource9.js';
// Corrected image readings update exact old defaults only. Any added, removed,
// reordered or renamed user deck stays as edited; active game snapshots stay intact.
export function refreshUntouchedImageThemes(themes) {
  return themes.map(theme => {
    const next = IMAGE_MODE_DECKS[theme.id];
    const untouched = [IMAGE_DECK_BASELINE_PRE_SOURCE9, IMAGE_DECK_BASELINE_PRE_SOURCE_BOUNDARIES, IMAGE_DECK_BASELINE_PRE_SOURCE2, IMAGE_DECK_BASELINE_PRE_SOURCE1, IMAGE_DECK_BASELINE_PRE_SOURCE14, IMAGE_DECK_BASELINE_PRE_SOURCE13, IMAGE_DECK_BASELINE_173, IMAGE_DECK_BASELINE_174, IMAGE_DECK_BASELINE_PRE_SOURCE10, IMAGE_DECK_BASELINE_PRE_SOURCE15, IMAGE_DECK_BASELINE_PRE_SOURCE16, IMAGE_DECK_BASELINE_PRE_SOURCE17, IMAGE_DECK_BASELINE_PRE_SOURCE7, IMAGE_DECK_BASELINE_PRE_SOURCE26, IMAGE_DECK_BASELINE_PRE_SOURCE27, IMAGE_DECK_BASELINE_PRE_SOURCE19, IMAGE_DECK_BASELINE_PRE_SOURCE20, IMAGE_DECK_BASELINE_PRE_SOURCE21, IMAGE_DECK_BASELINE_PRE_SOURCE22, IMAGE_DECK_BASELINE_PRE_SOURCE3, IMAGE_DECK_BASELINE_PRE_SOURCE4, IMAGE_DECK_BASELINE_PRE_SOURCE5, IMAGE_DECK_BASELINE_PRE_SOURCE6, IMAGE_DECK_BASELINE_SOURCE27_DRAFT].some(baseline => {
      const old = baseline[theme.id];
      return old && theme.name === old.name && theme.tasks.length === old.cards.length && theme.tasks.every((text, i) => text === old.cards[i]);
    });
    if (!next || !untouched) return theme;
    return { ...theme, tasks: [...next.cards] };
  });
}
