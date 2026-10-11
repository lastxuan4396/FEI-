import test from 'node:test';
import assert from 'node:assert/strict';
import { referenceLayout, boardGeometry } from '../src/core/boardLayouts.js';
import { createMode, MODES } from '../src/core/modes.js';
import { validateConfig, createTemplate } from '../src/core/config.js';
import { createGame } from '../src/core/engine.js';
import { makeSave, parseSave } from '../src/core/storage.js';
test('六种参考版式各不相同，路线稀疏、唯一且全部在画布内',()=>{
 const styles=new Set();
 for(const {id} of MODES){const c=createMode(id),l=referenceLayout(id);styles.add(l.style);assert.deepEqual(c.layout,l);assert.ok(l.path.length<l.rows*l.columns*.51);assert.equal(new Set(l.path.map(p=>p.join(','))).size,l.path.length);assert.equal(c.tiles.length,l.path.length);assert.deepEqual(validateConfig(c),c);assert.deepEqual(parseSave(JSON.stringify(makeSave(c,createGame(c)))).config.layout,l);}
 assert.equal(styles.size,6);
});
test('旧模式仅变换绘制坐标，保存数据/位置/规则不被绘制器改写；自定义棋盘不改',()=>{
 for(const {id} of MODES){const c=createMode(id);delete c.layout.style;c.layout=createTemplate(id==='cooperative'?6:7).layout;const before=structuredClone(c);assert.equal(boardGeometry(c).style,referenceLayout(id).style);assert.deepEqual(c,before);assert.equal(boardGeometry(c).path.length,c.tiles.length);}
 const c=createTemplate();assert.deepEqual(boardGeometry(c),c.layout);
});
test('版式只允许白名单，拒绝任意绘制脚本/样式，导入坐标仍严格校验',()=>{
 const c=createMode('classic');c.layout.style='<script>';assert.throws(()=>validateConfig(c));c.layout.style='cross';c.layout.path[1]=c.layout.path[0];assert.throws(()=>validateConfig(c));
});
