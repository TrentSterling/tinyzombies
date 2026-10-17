'use strict';
// Exact inverse of the reviewed parity-audit delta (director, alarms, keys, loadout HUD); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./audit-fixes25-delta.json');
function withoutAuditFixes25(html){
 html=require('./sandbox26.cjs').withoutSandbox26(html);
 if(!html.includes('function drawLoadout25('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact audit hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Audit inverse must restore immutable pre-audit runtime');return html;
}
// Byte-preservation suites captured before this delta read the exact inverse; it fails on any other drift.
function auditParentFile25(file){
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),html=fs.readFileSync(file,'utf8'),parent=withoutAuditFixes25(html);
 if(parent===html)return file;
 const out=path.join(os.tmpdir(),'tiny-audit25-parent-'+sha(parent).slice(0,16)+'.html');fs.writeFileSync(out,parent);return out;
}
module.exports={delta,withoutAuditFixes25,auditParentFile25};
