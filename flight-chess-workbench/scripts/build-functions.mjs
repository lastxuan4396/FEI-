import {build} from 'esbuild';
await build({entryPoints:['functions/index.js'],outfile:'functions/lib/index.js',bundle:true,platform:'node',target:'node22',format:'esm',packages:'external'});
console.log('Firebase room function bundled.');
