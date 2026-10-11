import test from 'node:test';import assert from 'node:assert/strict';
import {imageReviewIssues,IMAGE_CONTENT} from '../src/core/imageTaskLibrary.js';
test('reading warnings preserve legacy position/reason arrays and newer per-body/per-table records',()=>{
 const cells=Array.from({length:26},()=>({}));const old={cells,reviewStatus:{unresolved:[{position:3,reason:'反光无法辨认'}]}};assert.deepEqual(imageReviewIssues(old),[{position:3,reason:'反光无法辨认'}]);
 const modern={cells,reviewStatus:{unresolved:{bodyPositions:[7,7],notes:[5,7],additionalTasks:[],reason:'Uncertain glyphs'}}};const before=structuredClone(modern);assert.deepEqual(imageReviewIssues(modern).map(i=>i.position),[7]);assert.match(imageReviewIssues(modern)[0].reason,/原图小字/);assert.deepEqual(modern,before);
 assert.deepEqual(imageReviewIssues({cells,reviewStatus:{unresolved:[{area:'蓝色图例',reason:'数字不清'}]}}),[{area:'蓝色图例',reason:'数字不清'}]);assert.deepEqual(imageReviewIssues({cells}),[]);assert.deepEqual(imageReviewIssues({cells,reviewStatus:{unresolved:{bodyPositions:[-1,26,NaN,3.5,'7'],reason:''}}}),[]);
});
test('every current board yields its declared body warning positions without the reading page throwing',()=>{
 for(const board of IMAGE_CONTENT.boards){const declared=board.reviewStatus?.unresolved;const expected=Array.isArray(declared)?declared.map(i=>i.position):declared?.bodyPositions??[];assert.deepEqual(imageReviewIssues(board).filter(i=>i.position!==undefined).map(i=>i.position),[...new Set(expected.filter(Number.isInteger))]);if(Array.isArray(declared))assert.deepEqual(imageReviewIssues(board).filter(i=>i.area).map(i=>i.area),declared.filter(i=>i.area).map(i=>i.area));}
});
