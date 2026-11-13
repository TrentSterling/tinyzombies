'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {loadHost}=require('./deadends-cpu-host.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html'),h=loadHost(file,{plain:true}),s=h.sources.mission5;
const fn=s.match(/fn (neighbors(?:Waiting30|Outstanding98))\(\)->u32 \{[^\n]+/);assert(fn);
const name=fn[1],js=fn[0].replace('fn '+name+'()->u32','function '+name+'()').replace(/(\d+)u\b/g,'$1');
const ready=s.match(/let ready=([^;\n]*neighbors[^;]+);/)[1].replace(/(\d+)u\b/g,'$1');
const seal=s.match(/if\((S\.escape\.x>=1\.0[^\n]+?)\)\{S\.escape\.y\+=dt;/)[1].replace(/(\d+)u\b/g,'$1');
const rows=[];
for(const [label,state,kind,expected]of [['waiting',1,30,false],['panicked-waiting',1.25,30,false],['following',2,30,false],['following-flag',2.25,30,false],['saved',3,30,true],['lost',4,30,true],['inactive',0,30,true],['not-civilian',2,0,true]]){
 const P=Array.from({length:192},()=>({p:{w:0},data:{y:0}}));P[180]={p:{w:kind},data:{y:state}};
 const context={P,CIV_BASE30:180,S:{goal:{x:2.4,y:2.4},rescue:{z:1},player7:{x:0},escape:{x:1},spare5:{x:0}},allInside:true,inside:true};
 const got=vm.runInNewContext(js+';({outstanding:'+name+'(),ready:'+ready+',seal:'+seal+'})',context);
 rows.push({label,...got});assert.equal(got.ready,expected,label+' arming');assert.equal(got.seal,expected,label+' final sealing');
}
h.run('playerValues.fill(0);playerValues[448]=4;playerValues[CIV_STATE30+2]=2;');assert.equal(h.run('followingNeighbors98()'),1);assert.equal(h.run('shortObjective9()'),'Bring followers to safety: 1');
h.run('playerValues[CIV_STATE30+2]=1.25;');assert.equal(h.run('shortObjective9()'),'Round up the neighbors: 1 still home');
h.run('playerValues[CIV_STATE30+2]=3;');assert.equal(h.run('shortObjective9()'),'Fallout shelter (HOA approved)');
h.run('playerValues[CIV_STATE30+2]=4;');assert.equal(h.run('followingNeighbors98()'),0);
assert(h.script.includes("interaction===7&&followingNeighbors98()>0)label='Bring followers to safety: '+followingNeighbors98()"));
let unchangedShaders=null;if(process.argv[3]){const b=loadHost(process.argv[3],{plain:true});unchangedShaders=Object.keys(h.sources).filter(k=>k!=='mission5');for(const name of unchangedShaders)assert.equal(h.sources[name],b.sources[name],name+' unchanged');}
console.log(JSON.stringify({passed:true,kind:'Production scalar WGSL gate expressions and host UI, not a GPU or ordinary-input test',sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),rows,unchangedShaders:unchangedShaders?.length??null}));
