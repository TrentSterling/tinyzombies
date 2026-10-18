'use strict';
// Exact inverse of the reviewed rewards and baby delta (ZAMN events 3); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./reward50-delta.json');
function withoutReward50(html){
 if(!html.includes('const CIV_REWARD47='))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact rewards hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Rewards inverse must restore immutable pre-rewards runtime');return html;
}
module.exports={delta,withoutReward50};
