import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseImageRouteJSON,pointRegion} from '../src/core/imageMaps.js';
test('原图点位在边缘也不越界，编号路线预设独立校验',()=>{
 for(const image of [{width:720,height:1200},{width:1400,height:500}])for(const x of [0,.5,1])for(const y of [0,.5,1]){const b=pointRegion(x,y,image);assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=1.000001&&b.y+b.height<=1.000001);}
 for(const name of ['verified-spiral-44','verified-spiral-51']){const p=JSON.parse(fs.readFileSync(new URL(`../examples/${name}-image-route.json`,import.meta.url)));const r=parseImageRouteJSON(JSON.stringify(p));assert.equal(r.regions.length,name.endsWith('44')?46:53);assert.equal(r.tiles[0].type,'start');assert.equal(r.tiles.at(-1).type,'finish');p.regions[2].x=1.2;assert.throws(()=>parseImageRouteJSON(JSON.stringify(p)));}
 assert.throws(()=>parseImageRouteJSON('{bad'));assert.throws(()=>parseImageRouteJSON(JSON.stringify({type:'image-route',version:8})));
});
