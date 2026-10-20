'use strict';
// Byte-preservation contracts captured before the one-chapter Mercer restoration.
// Exact host execution only. This suite never starts animation, a browser, or WebGPU.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadHost,sha}=require('./deadends-cpu-host.cjs');
const baseline=require('./mercer-restoration-baseline.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html'),h=loadHost(require('./audit-fixes25.cjs').auditParentFile25(file)),checks=[];
const digest=value=>ArrayBuffer.isView(value)?sha(Buffer.from(value.buffer,value.byteOffset,value.byteLength)):sha(JSON.stringify(value));
function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(error){checks.push({name,passed:false,error:error.stack});}}
function slice(start,end){const a=h.script.indexOf(start),b=h.script.indexOf(end,a);assert(a>=0&&b>a,`Missing protected source section ${start}`);return h.script.slice(a,b);}
for(let chapter=2;chapter<=5;chapter++){
 h.run(`stage=${chapter};world=makeWorld();`);
 const world=h.run('world'),expected=baseline.worlds[chapter];
 check(`Chapter${chapter} world geometry, props, navigation and initial population match pre-restoration bytes`,()=>{
  for(const [field,hash] of Object.entries(expected.fields))assert.equal(digest(world[field]),hash,`Chapter${chapter} changed world.${field}`);
  return{comparedFields:Object.keys(expected.fields).length,initialInfected:expected.counts.infected,voxels:expected.counts.voxels};
 });
 for(const budget of [512,8192])check(`Chapter${chapter} remains identical when Mercer population setting is ${budget}`,()=>{
  h.run(`settings.zombies=${budget};world=makeWorld();`);const w=h.run('world');
  for(const [field,hash] of Object.entries(expected.fields))assert.equal(digest(w[field]),hash,`Chapter${chapter} budget${budget} changed world.${field}`);
 });
}
for(const name of ['renderShader','postShader','uiShader','fx6Shader','dripShader','spawnShader','integrateShader','boxesShader'])check(`${name} presentation, particle or blood implementation remains byte-identical`,()=>{
 const start=h.script.indexOf('const '+name+'='),end=h.script.indexOf('`;',start)+2;assert(start>=0&&end>start);assert.equal(sha(h.script.slice(start,end)),baseline.protected[name]);
});
for(const name of ['bindInput','ordnanceHint','gearLabel14','gearAvailable12','selectGear12','resetGear12'])check(`${name} control implementation remains byte-identical`,()=>assert.equal(sha(h.run(name+'.toString()')),baseline.protected[name]));
check('audio mixer, bank metadata, playback and event handling remain byte-identical',()=>assert.equal(sha(slice('let audio=null','const L12=')),baseline.protected.audio));
check('embedded character art remains byte-identical',()=>assert.equal(sha(slice('const ART_RANGE6:','fn artMotion6(')),baseline.protected.art));
check('embedded font remains byte-identical',()=>assert.equal(sha(h.run('JSON.stringify([FONT_ADV9,SDF_DATA9])')),baseline.protected.font));
check('persistent blood helpers and splatter implementation remain byte-identical',()=>assert.equal(sha(slice('fn bloodAt(','const fx6Shader=')),baseline.protected.blood));
check('HTML and CSS outside the script remain byte-identical',()=>assert.equal(sha(h.html.slice(0,h.html.indexOf('<script>'))+h.html.slice(h.html.lastIndexOf('</script>'))),baseline.protected.shell));
check('all existing external art/audio assets remain byte-identical',()=>{
 const actual={};function visit(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,item.name);if(item.isDirectory()){if(full.endsWith(path.join('audio','voice')))continue;visit(full);}else actual[path.relative(path.dirname(file),full).split(path.sep).join('/')]=sha(fs.readFileSync(full));}}
 visit(path.join(path.dirname(file),'assets'));assert.deepEqual(actual,baseline.assets);return{assets:Object.keys(actual).length};
});
check('strict restoration inverse recovers immutable parent and rejects unrelated drift',()=>{const inverse=require('./mercer-restoration-scope.cjs').withoutMercerRestoration24;assert.equal(sha(inverse(h.html)),baseline.provenance.sha256);assert.throws(()=>inverse(h.html+'\n// unrelated drift'));assert.throws(()=>inverse(h.html.replace('const MERCER_DISTRICT24=','const MERCER_DISTRICT24=/* changed */')));});
const report={method:'Exact production host, typed-buffer bytes and immutable pre-edit source/asset fingerprints. CPU only; no shader compilation, GPU execution or earned gameplay.',baseline:baseline.provenance,candidateSha256:h.sha256,passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
