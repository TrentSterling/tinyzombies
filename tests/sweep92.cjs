'use strict';
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs'),delta=require('./sweep92-delta.json');
function withoutSweep92(html){
 if(!html.includes(" // Bound the body's whole short segment"))return html;
 for(const change of delta.changes){assert.equal(html.split(change.after).length,2);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Swept-clearance inverse restores the exact archived sampled candidate');return html;
}
module.exports={delta,withoutSweep92};
