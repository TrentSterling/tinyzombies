'use strict';
// UI pass 2: controls as key caps in two columns, the sandbox's house rules, and the boot screen in the HUD fonts.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutUi35}=require('./ui35.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
const mock=`(()=>{const log=[];return {canvas:{width:0,height:0,clientWidth:1920,clientHeight:1080},log,clearRect(){},
 fillRect(x,y,w,h){log.push(['rect',x,y,w,h]);},strokeText(){},fillText(s,x,y){log.push(['fill',s,x,y]);},measureText(s){return {width:String(s).length*9};}};})()`;
const host=seed=>{const h=loadHost(file,seed?{seed}:undefined);h.run('reset()');h.run(`width=1920;height=1080;window.devicePixelRatio=1;hud2d30=${mock};sizeHud2d30();`);return h;};
const draw=h=>{h.run('hud2d30.log.length=0;helpCard30(clamp9(height/900,.72,1.15))');return h.json('hud2d30.log');};
check('every binding from the old sentence list still appears, as key caps beside its action',()=>{
 const h=host(),log=draw(h),f=log.filter(e=>e[0]==='fill').map(e=>e[1]);
 for(const k of ['W','A','S','D','Mouse','LMB','RMB','Space','1','2','3','R','Q','4','G','5','F','Shift','V','X','E','Tab','Wheel','Ctrl','M','Backspace','Esc','?'])assert(f.includes(k),'key '+k);
 for(const a of ['Move','Aim','Fire / use gear','Shove','Guns','Reload','Last gun','Throwables','Medkit: LMB self, RMB ally','Sprint','Drag a body','Order the squad','Interact','Field map','Cycle gear','Zoom','Mute','Restart','Pause'])assert(f.includes(a),'action '+a);
 assert(!f.includes('MAPLE STREET RULES'),'campaign card has no sandbox rules');return {strings:f.length};
});
check('key caps never overlap their action label and both columns stay inside the panel',()=>{
 const h=host(),log=draw(h),panel=log.find(e=>e[0]==='rect');const fills=log.filter(e=>e[0]==='fill');
 for(const e of fills){assert(e[2]>=panel[1]&&e[2]+String(e[1]).length*9<=panel[1]+panel[3],'inside: '+e[1]);}
 const ctrl=fills.find(e=>e[1]==='Wheel'&&fills.some(g=>g[1]==='Ctrl'&&Math.abs(g[3]-e[3])<1)),zoom=fills.find(e=>e[1]==='Zoom');assert(zoom[2]>ctrl[2]+5*9,'Zoom label right of the Ctrl+Wheel caps');
});
check('sandbox card adds the three Maple Street rules',()=>{
 const f=draw(host('73129&sandbox')).filter(e=>e[0]==='fill').map(e=>e[1]);assert(f.includes('MAPLE STREET RULES'));for(const r of ['Find neighbors shouting HELP! and walk them to the shelter.','Knock a house down and the wreck crushes whoever is underneath.','Blasts, alarms and gunfire are loud. The whole street hears.'])assert(f.includes(r),r);
});
check('without the overlay the original sentence list is kept',()=>{
 assert(html.includes("if(hud2d30)helpCard30(k);else{"));assert(html.includes("'M mutes. Backspace restarts. ? shows help; Esc pauses.'"));
});
check('boot screen uses Bangers and Rubik instead of the monospace console',()=>{
 assert(html.includes("font:500 17px/1.65 Rubik,'Segoe UI',system-ui,sans-serif"));assert(html.includes("#boot h1{font:clamp(44px,9vw,120px)/1 Bangers,Impact"));assert(!html.includes('#boot{position:fixed;inset:0;display:flex;flex-direction:column;justify-content:center;padding:7vw;background:#0b1b22;color:#e1e9d2;font:16px/1.65 ui-monospace'));
 assert(html.includes('textarea{width:min(100%,960px);height:38vh;background:#101d22;border:1px solid #39594e;color:#e8e7d5;font:13px/1.4 monospace;'),'diagnostic report stays monospace');
});
check('exact inverse restores the immutable pre-help-card runtime',()=>{assert.equal(sha(withoutUi35(html)),delta.parentSha256);});
const report={method:'CPU host with a recording 2D context; no GPU, real fonts or layout.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
