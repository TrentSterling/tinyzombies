'use strict';
// Exact reviewed Mercer delta only. Never refresh the separate pre-edit fingerprints.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./mercer-restoration-delta.json');
function withoutMercerRestoration24(html){
 html=require('./wgsl-swizzle-assignment.cjs').withoutSwizzleAssignmentFix(html);
 if(!html.includes('const MERCER_DISTRICT24='))return html;
 for(const [i,change]of delta.changes.entries()){assert.equal(html.split(change.after).length,2,'Exact Mercer hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.baselineSha256,'Mercer inverse must restore immutable pre-restoration runtime');return html;
}
module.exports={withoutMercerRestoration24};
