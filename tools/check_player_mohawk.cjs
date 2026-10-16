// Usage: node tools/check_player_mohawk.cjs PR10_INDEX_HTML index.html [REPORT_JSON]
// Checks scope against the exact prior release; it does not infer browser behavior.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const [baselinePath,candidatePath,reportPath]=process.argv.slice(2);
assert(baselinePath&&candidatePath,'Supply the prior and candidate HTML paths');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const before=fs.readFileSync(baselinePath),after=fs.readFileSync(candidatePath);
assert.equal(hash(before),'517446909154b42d695fc14717cbfdb1cdb7482a970f1b12cbdde4051f3b5e58','Exact PR10 baseline');
const insertion=' if(player){let hair=vec3f(.065,.045,.03);part(base,vec3f(0,1.0625,-.15625),vec3f(.125,.125,.1875),hair,face,0);part(base,vec3f(0,1.125,0),vec3f(.125,.25,.1875),hair,face,0);part(base,vec3f(0,1.0625,.15625),vec3f(.125,.125,.1875),hair,face,0);}\n';
const source=after.toString('utf8');
assert.equal(source.split(insertion).length,2,'Exactly one hair insertion');
assert(Buffer.from(source.replace(insertion,''),'utf8').equals(before),'All existing source bytes preserved');
const assets=JSON.parse(source.match(/const audioBankAssets9=(.*);\r?\n/)[1]);
const clips=Object.entries(assets).map(([id,meta])=>{
 const bytes=fs.readFileSync(path.join(path.dirname(candidatePath),'assets/audio',id+'.flac'));
 assert.equal(hash(bytes),meta.hash,id+' hash');assert.equal(bytes.length,meta.bytes,id+' size');
 return {id,bytes:bytes.length,sha256:hash(bytes)};
});
assert.equal(clips.length,43);assert.equal(clips.reduce((n,c)=>n+c.bytes,0),736350);
const report={passed:true,baselineSha256:hash(before),candidateSha256:hash(after),candidateBytes:after.length,addedRenderCuboids:3,existingSourceBytesPreserved:true,audioClips:clips.length,audioBytes:clips.reduce((n,c)=>n+c.bytes,0),audioHashesPreserved:true};
if(reportPath)fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
