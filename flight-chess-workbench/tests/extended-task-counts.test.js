import test from 'node:test';import assert from 'node:assert/strict';
import {taskParameters,taskParameterGroups,taskParameterMatches,applyTaskParameters,validateTaskPreferences} from '../src/core/taskParameters.js';
import {ongoingTaskSpec,validateEffects,effectRemaining} from '../src/core/ongoingEffects.js';
import {createArcade,arcadeTransition,parseArcade} from '../src/core/arcade.js';
import {createMode,MODES} from '../src/core/modes.js';import {createGame,transition} from '../src/core/engine.js';import {makeSave,parseSave} from '../src/core/storage.js';
import {createAdventure,adventureTransition} from '../src/core/adventure.js';
const people=[{name:'甲',color:'#739aa5'},{name:'乙',color:'#ce765f'}];
test('Source measures, spaced bare tool counts, and multiple segments can be changed without editing originals or creating count clocks',()=>{
 const text='念五句，拍3张，绕2圈，用100ml，保持2轮，观察30秒',p=taskParameters(text);
 assert.deepEqual(p.parts.map(v=>v.value),[5,3,2,100,2,30]);assert.equal(applyTaskParameters(text,{[p.key]:[7,4,3,50,1,12]}).text,'念7句，拍4张，绕3圈，用50ml，保持1轮，观察12秒');
 for(const unit of ['声','句','根','项','瓶','ml','毫升','升']){const raw=`记录5${unit}`,k=taskParameters(raw).key;assert.equal(applyTaskParameters(raw,{[k]:[7]}).text,`记录7${unit}`);assert.equal(applyTaskParameters(raw,{[k]:[7]}).duration,undefined);const spec=ongoingTaskSpec(`记录7${unit}`);assert.equal(spec.countUnit,unit);validateEffects([{id:'example',text:raw,targets:['0'],...spec,startedCounter:0,endsAt:null,progress:0}],['0','1'],0);}
 for(const text of ['藤拍\n40','散鞭\n50','耳光\n15']){const p=taskParameters(text);assert.equal(p.parts.length,1);assert.equal(applyTaskParameters(text,{[p.key]:[8]}).text,text.replace(/\d+$/,'8'));}
 for(const text of ['工具编号35','图片23'])assert.equal(taskParameters(text).parts.length,0,text);
 const [repeat]=taskParameterGroups(['记录3声','记录10声']);assert(taskParameterMatches(repeat,'repetition'));assert(!taskParameterMatches(repeat,'quantity'));
 const [quantity]=taskParameterGroups(['记录2瓶','记录100ml']);assert(taskParameterMatches(quantity,'quantity'));assert(!taskParameterMatches(quantity,'repetition'));
 const old={'用100ml，观察〔时长1〕':[45]},migrated=validateTaskPreferences(old);assert.equal(applyTaskParameters('用100ml，观察30秒',migrated).text,'用100ml，观察45秒');
});
function specs(ids){return ['seconds','count','turn','round','game'].map(unit=>({type:'EFFECT_ADD',now:1000,effect:{text:`测试${unit}`,unit,amount:unit==='seconds'?120:unit==='game'?1:5,targets:ids,...(unit==='count'?{countUnit:'句'}:{})}}));}
function remaining(effects,counter){assert.deepEqual(effects.map(e=>effectRemaining(e,counter,2,2000,true)),[119,5,0,0,0]);}
test('All native boards keep time and count tasks after a real round-limit finish, with save and undo intact',()=>{
 for(const {id}of MODES){const c=createMode(id);c.rules.maxRounds=1;c.rules.launchOnSix=false;c.tiles=c.tiles.map((t,i)=>i===0||i===c.tiles.length-1?t:{type:'plain'});let s=createGame(c);const go=a=>s=transition(s,c,a,1);
 for(const a of specs(c.players.map(p=>p.id)))go(a);go({type:'ROLL'});go({type:'ROLL'});assert.equal(s.phase,'finished',id);remaining(s.effects,s.rounds);s=parseSave(JSON.stringify(makeSave(c,s))).state;
 const result=JSON.stringify({players:s.players,winner:s.winner,rounds:s.rounds});go({type:'EFFECT_COUNT',effectId:s.effects[1].id,countDelta:1});go({type:'EFFECT_TIMER',effectId:s.effects[0].id,now:2000,timerMode:'pause'});assert.equal(JSON.stringify({players:s.players,winner:s.winner,rounds:s.rounds}),result);assert.equal(s.effects[1].progress,1);assert.equal(s.effects[0].pausedRemaining,119000);go({type:'UNDO'});assert.equal(s.effects[0].endsAt,121000);assert.equal(s.phase,'finished');
 }
});
test('All eight arcade and seven adventure endings retain independent count and timer progress',()=>{
 for(const kind of ['spinner','cards','coop','story','bingo','vote','mystery','estate']){let s=createArcade(kind,people,{creative:kind!=='estate'});for(const a of specs(['0','1']))s=arcadeTransition(s,a);s=arcadeTransition(s,{type:'END'});remaining(s.state.effects,s.state.effectTurns??0);s=parseArcade(JSON.stringify(s));const players=structuredClone(s.state.players);s=arcadeTransition(s,{type:'EFFECT_COUNT',effectId:s.state.effects[1].id,countDelta:1});s=arcadeTransition(s,{type:'EFFECT_TIMER',effectId:s.state.effects[0].id,now:2000,timerMode:'pause'});assert.equal(s.state.phase,'finished');assert.deepEqual(s.state.players,players);assert.equal(s.state.effects[1].progress,1);assert.equal(s.state.effects[0].pausedRemaining,119000);}
 for(const variant of ['rps','limited','ecard','numbers','charge','preference','spire']){let s=createAdventure({variant,players:['甲','乙'],pool:['观察30秒','念3句','记录2张'],seed:1});const go=a=>s=adventureTransition(s,{...a,epoch:s.epoch},0);for(const a of specs(['0','1']))go(a);go({type:'END'});remaining(s.effects,s.effectTurns??0);const score=s.score.slice();go({type:'EFFECT_COUNT',effectId:s.effects[1].id,countDelta:1});go({type:'EFFECT_TIMER',effectId:s.effects[0].id,now:2000,timerMode:'pause'});assert.equal(s.phase,'finished');assert.deepEqual(s.score,score);assert.equal(s.effects[1].progress,1);assert.equal(s.effects[0].pausedRemaining,119000);}
});
