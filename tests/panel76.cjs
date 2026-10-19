'use strict';
// Exact inverse of the reviewed mission panel fit delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./panel76-delta.json');
function withoutPanel76(html){
 html=require('./bazooka77.cjs').withoutBazooka77(html);
 if(!html.includes("Every line shrinks to fit the 296 px panel"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact panel hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Panel inverse must restore immutable pre-panel runtime');return html;
}
module.exports={delta,withoutPanel76};
