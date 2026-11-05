'use strict';
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs'),delta=require('./clearance91-delta.json');
function withoutClearance91(html){
 html=require("./sweep92.cjs").withoutSweep92(html);
 if(!html.includes(" // Match the escort motor's body footprint"))return html;
 for(const change of delta.changes){assert.equal(html.split(change.after).length,2);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Clearance inverse must restore exact latest main');return html;
}
module.exports={delta,withoutClearance91};
