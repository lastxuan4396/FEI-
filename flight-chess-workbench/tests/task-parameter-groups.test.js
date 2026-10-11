import test from 'node:test';
import assert from 'node:assert/strict';
import {taskParameters,taskParameterGroups,taskParameterDetails,taskParameterMatches,applyTaskParameters} from '../src/core/taskParameters.js';
import {defaultWorkspace} from '../src/core/workspace.js';
import {changeTaskLibrary} from '../src/core/taskLibrary.js';
import {gameTaskPool} from '../src/core/gameTaskPool.js';
import {createArcade,arcadeTransition} from '../src/core/arcade.js';
test('Same action groups count variants but distinct actions and conditions stay separate',()=>{
 const groups=taskParameterGroups(['重复动作五次','重复动作10次','重复动作五次','换一个动作5次','如果成功，重复动作5次']);
 assert.equal(groups.length,3);assert.deepEqual(groups[0].originals,['重复动作五次','重复动作10次']);
 for(const text of groups[0].originals)assert.equal(applyTaskParameters(text,{[groups[0].key]:[7]}).text,'重复动作7次');
});
test('Multiple count and duration fields preserve units and conditions independently',()=>{
 const text='挑选两件物品，拍3张照片，重复五遍，走4步，持续2轮，每个动作30秒';
 const p=taskParameters(text);assert.deepEqual(p.parts.map(v=>[v.kind,v.value,v.unit]),[['count',2,'件'],['count',3,'张'],['count',5,'遍'],['count',4,'步'],['turn',2,'轮'],['time',30,'秒']]);
 const result=applyTaskParameters(text,{[p.key]:[1,2,4,6,3,45]});
 assert.equal(result.text,'挑选1件物品，拍2张照片，重复4遍，走6步，持续3轮，每个动作45秒');assert.equal(result.duration,undefined);
 for(const unit of ['个','口','杯','圈','组','次','下','T','格'])assert.equal(taskParameters(`重复10${unit}`).parts[0].unit,unit);
 for(const text of ['版本1.8.5','图片23','编号975','工具编号35'])assert.equal(taskParameters(text).parts.length,0);
});
test('Spaced units and minutes-and-half group with equivalent literal durations',()=>{
 const groups=taskParameterGroups(['观察1分钟半','观察90 s','观察1 min 30 sec']);assert.equal(groups.length,1);assert(groups[0].parts[0].value===90);
 for(const text of groups[0].originals)assert.equal(applyTaskParameters(text,{[groups[0].key]:[45]}).text,'观察45秒');
});
test('Custom count settings flow into games as count text without an inferred count clock',()=>{
 let w=defaultWorkspace();w=changeTaskLibrary(w,{type:'add',id:'user-count-demo',text:'重复动作五遍',level:1});w=changeTaskLibrary(w,{type:'select',ids:['user-count-demo'],mode:'selected'});w.imageLevels=[1];
 const params={[taskParameters('重复动作五遍').key]:[7]},snap=gameTaskPool(w,'@personal',params);assert.deepEqual(snap.pool,['重复动作7遍']);assert.equal(applyTaskParameters('重复动作五遍',params).duration,undefined);
 const game=createArcade('spinner',[{name:'甲',color:'#aabbcc'},{name:'乙',color:'#ccbbaa'}],{...snap,creative:true});const drawn=arcadeTransition(game,{type:'SPIN'});assert.equal(drawn.state.pending.text,'重复动作7遍');assert.equal(drawn.state.pending.original,'重复动作五遍');
});
test('Previously stored timing settings retain their slot when newly supported counters precede or follow it',async()=>{
 const {validateTaskPreferences}=await import('../src/core/taskParameters.js');
 const old={'挑选两件，观察〔时长1〕，重复五遍':[40]},text='挑选两件，观察30秒，重复五遍';
 assert.equal(applyTaskParameters(text,old).text,'挑选两件，观察40秒，重复五遍');
 const migrated=validateTaskPreferences(old);assert.deepEqual(migrated[taskParameters(text).key],[null,40,null]);
 assert.equal(applyTaskParameters(text,migrated).text,'挑选两件，观察40秒，重复五遍');assert.deepEqual(validateTaskPreferences(migrated),migrated);
});
test('A grouped counter reports all original values and units, and both quantity filters can find it',()=>{
 const [group]=taskParameterGroups(['记录5次','记录10次','记录两张','记录3圈']);
 const [detail]=taskParameterDetails(group);assert.deepEqual(detail.tokens,['5次','10次','两张','3圈']);assert.deepEqual(detail.units,['次','张','圈']);assert.equal(detail.mixedUnits,true);
 for(const type of ['count','quantity','movement'])assert(taskParameterMatches(group,type));assert.equal(taskParameterMatches(group,'time'),false);
 const parameters={[group.key]:[7]};assert.deepEqual(group.originals.map(t=>applyTaskParameters(t,parameters).text),['记录7次','记录7次','记录7张','记录7圈']);assert.deepEqual(group.originals.map(t=>applyTaskParameters(t,{}).text),group.originals);
});
