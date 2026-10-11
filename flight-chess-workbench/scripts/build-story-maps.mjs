import {writeFile} from 'node:fs/promises';
import {Compiler} from 'inkjs/full';
import {storyMap,storyEntry} from '../src/core/storyMaps.js';
const stories={};
for(let chapters=1;chapters<=20;chapters++){
 const config={story:{chapters,detours:3}},graph=storyMap(config);
 const source=`-> ${storyEntry(config)}\n`+Object.entries(graph).map(([id,n])=>`=== ${id} ===\n# node:${id}\n${n.title}\n${n.options?n.options.map(o=>`* [${o.label}] -> ${o.to}`).join('\n'):n.task?`* [继续旅程] -> ${n.to}`:'-> END'}`).join('\n\n');
 const compiler=new Compiler(source),story=compiler.Compile();if(compiler.errors?.length)throw Error(compiler.errors.join('\n'));
 stories[chapters]=JSON.parse(story.ToJson());
}
await writeFile(new URL('../src/core/arcadeStoryMaps.json',import.meta.url),JSON.stringify(stories));
console.log('Compiled 20 configurable Ink journeys');
