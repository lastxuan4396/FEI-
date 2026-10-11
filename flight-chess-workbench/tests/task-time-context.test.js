import test from 'node:test';import assert from 'node:assert/strict';
import {taskDuration,reviewDuration} from '../src/core/taskTiming.js';
test('time limits, repetitions, ambiguous per-kind times and unmet-condition penalties do not become whole-task clocks',()=>{
 for(const text of ['练习（限时3min）','观察15s×3','观察15s x 3','五种1min','5种1min','朗读未完成后整理2min','练习未达成后观察2min','等待未达到目标后休息2min'])assert.equal(taskDuration(text),undefined,text);
 for(const [text,seconds]of [['观察15s',15],['观察1min30s',90],['观察3种物品1min',60],['休息3分钟',180]])assert.equal(taskDuration(text),seconds,text);
});
test('already running review clocks keep their stored deadline and pause interpretation after parser improvements',()=>{
 for(const text of ['练习（限时3min）','观察15s×3','5种1min','朗读未完成后整理2min']){
  assert.equal(reviewDuration(text,{}),undefined,text);
  assert(reviewDuration(text,{timerEndsAt:123000})>0,text);
  assert(reviewDuration(text,{timerEndsAt:null,pausedRemaining:1000})>0,text);
 }
});
