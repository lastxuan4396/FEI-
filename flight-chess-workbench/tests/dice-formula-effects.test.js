import test from 'node:test';import assert from 'node:assert/strict';
import {taskParameters,taskParameterGroups,taskParameterAliases,applyTaskParameters,taskParameterValues} from '../src/core/taskParameters.js';
import {parseDiceFormula,diceFormulaAmount} from '../src/core/diceFormula.js';
import {ongoingTaskSpec,directTaskEligible,applyEffectAction,validateEffects} from '../src/core/ongoingEffects.js';
import {createMode,MODES} from '../src/core/modes.js';import {createGame,transition} from '../src/core/engine.js';import {makeSave,parseSave} from '../src/core/storage.js';
import {createArcade,arcadeTransition,parseArcade} from '../src/core/arcade.js';import {createAdventure,adventureTransition,adventureView} from '../src/core/adventure.js';
const people=[{name:'甲',color:'#739aa5'},{name:'乙',color:'#ce765f'}];
test('Fixed final values replace entire dice expressions; old partial keys retain their values and literal variants group together',()=>{
 for(const [text,target] of [['保持标记2X回合','保持标记7回合'],['记录5X次','记录7次'],['工具点数×10','工具7'],['观察（60+10X）秒','观察7秒'],['观察X分钟','观察7秒'],['失去X行动回合','失去7行动回合']]){const p=taskParameters(text);assert.equal(p.parts.length,1);assert.equal(applyTaskParameters(text,{[p.key]:[7]}).text,target);assert.equal(applyTaskParameters(text,{}).text,text);}
 const raw='保持标记2X回合',old={'保持标记2〔回合1〕':[7]};assert(taskParameterAliases(raw).some(a=>Object.hasOwn(old,a.key)));assert.deepEqual(taskParameterValues(raw,old),[7]);assert.equal(applyTaskParameters(raw,old).text,'保持标记7回合');assert.equal(applyTaskParameters(raw,{...old,[taskParameters(raw).key]:[9]}).text,'保持标记9回合');
 assert.equal(taskParameterGroups(['观察10X秒','观察（60+10X）秒','观察30秒']).length,1);
 assert.equal(taskParameterGroups(['保持标记2X回合','保持标记3回合']).length,1);
});
test('Linear dice arithmetic, printed caps and time units resolve explicitly; unsupported arithmetic stays untouched',()=>{
 for(const [raw,formula] of [['2X',{factor:2,offset:0}],['X×10',{factor:10,offset:0}],['点数×20',{factor:20,offset:0}],['（60+10X）',{factor:10,offset:60}]])assert.deepEqual(parseDiceFormula(raw),formula);
 for(const raw of ['X/2','X-2','Math.random()','X**2','(X+1)*2','((X+1))','X+'])assert.equal(parseDiceFormula(raw),undefined);
 assert.equal(diceFormulaAmount({factor:2,offset:1,cap:3},6),3);
 assert.deepEqual(ongoingTaskSpec('保持X回合（最多为3）').diceFormula,{factor:1,offset:0,cap:3});
 assert.deepEqual(ongoingTaskSpec('观察X分钟').diceFormula,{factor:60,offset:0});
 for(const raw of ['观察(X/2)秒','保持X/2回合','保持X / 2 回合','保持X-2回合','重复2.5X次','观察每轮10X秒','如果失败重复5X次','重复5X次每次20秒'])assert(!directTaskEligible(raw),raw);
 assert(directTaskEligible('工具点数×10'));assert.deepEqual(ongoingTaskSpec('工具点数×10').diceFormula,{factor:10,offset:0});assert(directTaskEligible('重复5X次'));assert(directTaskEligible('观察（60+10X）秒'));assert(directTaskEligible('失去X行动回合'));
});
test('One saved die controls the final count/time/turn amount; controls never reroll; forged amounts and out-of-range formulas are rejected before RNG',()=>{
 for(const text of ['保持标记2X回合','重复5X次','观察（60+10X）秒','保持X回合（最多为3）']){const spec=ongoingTaskSpec(text),s={phase:'playing',revision:1};let rolls=0;const rand=()=>{rolls++;return 5};applyEffectAction(s,{type:'EFFECT_ADD',now:1000,effect:{...spec,text,targets:['0']}},['0','1'],0,rand);const e=s.effects[0];assert.equal(e.amount,text.startsWith('保持X')?3:text.startsWith('保持')?12:text.startsWith('重复')?30:120);assert.equal(e.dice.value,6);assert.equal(rolls,1);validateEffects(JSON.parse(JSON.stringify(s.effects)),['0','1'],0);assert.throws(()=>validateEffects([{...e,amount:e.amount+1}],['0','1'],0));assert.throws(()=>validateEffects([{...e,dice:{...e.dice,value:7}}],['0','1'],0));
 if(e.unit==='count')applyEffectAction(s,{type:'EFFECT_COUNT',effectId:e.id,countDelta:1},['0','1'],0,rand);if(e.unit==='seconds')applyEffectAction(s,{type:'EFFECT_TIMER',effectId:e.id,now:2000,timerMode:'pause'},['0','1'],0,rand);assert.equal(rolls,1);assert.equal(e.dice.value,6);}
 for(const f of [{factor:100,offset:0},{factor:-1,offset:0},{factor:1,offset:0,cap:100},{factor:1.5,offset:0},{factor:1,offset:Infinity}]){let rolls=0;assert.throws(()=>applyEffectAction({phase:'playing',revision:1},{type:'EFFECT_ADD',now:1,effect:{unit:'turn',text:'无效公式',targets:['0'],diceFormula:f}},['0','1'],0,()=>{rolls++;return 0}));assert.equal(rolls,0);}
});
test('All 21 game engines persist formula results and preserve ordinary gameplay state',()=>{
 const text='重复5X次',spec=ongoingTaskSpec(text),action=ids=>({type:'EFFECT_ADD',now:1000,effect:{...spec,text,targets:ids}});
 for(const {id} of MODES){const c=createMode(id);let s=createGame(c);const before=JSON.stringify(s.players);s=transition(s,c,action(c.players.map(p=>p.id)),4);assert.equal(s.effects[0].amount,s.effects[0].dice.value*5);const amount=s.effects[0].amount;s=parseSave(JSON.stringify(makeSave(c,s))).state;assert.equal(s.effects[0].amount,amount);s=transition(s,c,{type:'EFFECT_COUNT',effectId:s.effects[0].id,countDelta:1});assert.equal(s.effects[0].amount,amount);assert.equal(JSON.stringify(s.players),before);assert.equal(s.rounds,0);s=transition(s,c,{type:'UNDO'});assert.equal(s.effects[0].progress,0);}
 for(const kind of ['spinner','cards','coop','story','bingo','vote','mystery','estate']){let s=createArcade(kind,people,{pool:['重复5X次','观察30秒']});const before=JSON.stringify(s.state.players);s=arcadeTransition(s,action(['0','1']));const amount=s.state.effects[0].amount;s=parseArcade(JSON.stringify(s));assert.equal(s.state.effects[0].amount,amount);assert.equal(s.state.effects[0].dice.value*5,amount);assert.equal(JSON.stringify(s.state.players),before);}
 for(const variant of ['rps','limited','ecard','numbers','charge','preference','spire']){let s=createAdventure({variant,players:['甲','乙'],pool:['重复5X次','观察30秒','念3句'],seed:1});const phase=s.phase,energy=s.energy.slice();s=adventureTransition(s,{...action(['0','1']),epoch:s.epoch},0);const amount=s.effects[0].amount;s=JSON.parse(JSON.stringify(s));validateEffects(s.effects,['0','1'],s.effectTurns);assert.equal(s.effects[0].dice.value*5,amount);assert.equal(s.phase,phase);assert.deepEqual(s.energy,energy);assert(adventureView(s,0).config.directPool.includes(text));}
});
