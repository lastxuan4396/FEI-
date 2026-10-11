import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {referenceCatalog} from '../scripts/reference-catalog.mjs';

async function fixture(t){
 const dir=await mkdtemp(path.join(os.tmpdir(),'flight-reference-'));
 t.after(()=>rm(dir,{recursive:true,force:true}));
 await mkdir(path.join(dir,'ocr'));await mkdir(path.join(dir,'thumbnails'));await mkdir(path.join(dir,'maps'));
 const manifest=path.join(dir,'inventory.json'),maps=path.join(dir,'maps');
 const entry={attachment:1,name:'board.png',width:64,height:48,localPath:'/private/unused',sourceAssetId:'private-id',preparedMap:'map.json'};
 await writeFile(manifest,JSON.stringify([entry]));await writeFile(path.join(dir,'board.png'),Buffer.from([1,2,3,4]));
 await writeFile(path.join(dir,'thumbnails/1.jpg'),Buffer.from([5,6]));
 await writeFile(path.join(dir,'ocr/1-raw-text.json'),JSON.stringify({width:64,height:48,lines:[{text:'起点'}]}));
 await writeFile(path.join(maps,'map.json'),JSON.stringify({tiles:[{}, {}, {}, {}]}));
 return {dir,entry,manifest,maps,catalog:referenceCatalog({manifest,maps})};
}
test('reference catalog serves only named originals, cached readings and prepared maps; public metadata omits private paths',async t=>{
 const f=await fixture(t),listed=await f.catalog.list();
 assert.deepEqual(listed,[{id:1,name:'board.png',title:'第1张原图',width:64,height:48,ocrLines:1,preparedCells:4,imageSha256:createHash('sha256').update(Buffer.from([1,2,3,4])).digest('hex')}]);
 assert.deepEqual((await f.catalog.image(1)).body,Buffer.from([1,2,3,4]));assert.equal((await f.catalog.image(1)).type,'image/png');
 assert.deepEqual((await f.catalog.image(1,true)).body,Buffer.from([5,6]));assert.equal((await f.catalog.text(1)).lines[0].text,'起点');
 assert.equal((await f.catalog.map(1)).tiles.length,4);await assert.rejects(f.catalog.image(2));await assert.rejects(f.catalog.text(2));await assert.rejects(f.catalog.image(1.5));
});
test('missing optional collection and damaged or missing reading/map caches preserve upload and original access',async t=>{
 const f=await fixture(t);assert.deepEqual(await referenceCatalog({manifest:path.join(f.dir,'absent.json')}).list(),[]);
 await writeFile(path.join(f.dir,'ocr/1-raw-text.json'),'broken JSON');await rm(path.join(f.maps,'map.json'));
 assert.equal((await f.catalog.list())[0].ocrLines,0);assert.equal((await f.catalog.list())[0].preparedCells,undefined);
 assert.deepEqual((await f.catalog.image(1)).body,Buffer.from([1,2,3,4]));await assert.rejects(f.catalog.text(1));
 await rm(path.join(f.dir,'ocr/1-raw-text.json'));assert.equal(await f.catalog.text(1),null);
});
test('reference manifest rejects traversal, duplicate IDs, invalid IDs and file symlinks outside its directory',async t=>{
 const f=await fixture(t);
 for(const entries of [[{...f.entry,name:'../outside.png'}],[f.entry,f.entry],[{...f.entry,attachment:0}],[{...f.entry,preparedMap:'../map.json'}]]){
  await writeFile(f.manifest,JSON.stringify(entries));await assert.rejects(f.catalog.list());
 }
 await writeFile(f.manifest,JSON.stringify([{...f.entry,name:'escape.png'}]));
 await symlink(path.join(f.maps,'map.json'),path.join(f.dir,'escape.png'));await assert.rejects(f.catalog.image(1),/范围/);
});
