'use strict';
// Maple Street specials wear B-movie monster palettes; DEAD ENDS and commons keep theirs.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha}=require('./deadends-cpu-host.cjs'),{delta,withoutMonsters61}=require('./monsters61.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('Maple-only, specials-only override at the top of artColor6',()=>{const f=html.slice(html.indexOf('fn artColor6('),html.indexOf('fn enemyModel6('));const o=f.indexOf('if(u.run.x>5.0&&u.run.y<.5&&kind>0.0){');
 assert(o>0&&o<f.indexOf('var skin='),'before the stock palette');for(const k of ['1.0','2.0','4.0','5.0','6.0'])assert(f.includes('if(kind=='+k+'){'),k);
 assert(f.includes('return vec3f(.93,.91,.84);'),'maniac mask');assert(f.includes('let wrap=vec3f(.84,.78,.60)'),'mummy wraps');});
check('every override falls through to the stock palette',()=>{const f=html.slice(html.indexOf('if(u.run.x>5.0&&u.run.y<.5&&kind>0.0){'),html.indexOf('var skin='));assert.equal((f.match(/switch index/g)||[]).length,5);assert.equal((f.match(/default:\{\}/g)||[]).length,5);});
check('exact inverse restores the immutable pre-monster runtime',()=>{assert.equal(sha(withoutMonsters61(html)),delta.parentSha256);});
const report={method:'Source fragments; a lineup of every special was rendered on Maple Street on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
