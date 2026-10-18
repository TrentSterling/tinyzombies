'use strict';
// Exact inverse of the reviewed cheese-wheel delta (ZAMN events 2); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./cheese49-delta.json');
function withoutCheese49(html){
 html=require('./reward50.cjs').withoutReward50(html);
 if(!html.includes('fn cheese48('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact cheese hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Cheese inverse must restore immutable pre-cheese runtime');return html;
}
module.exports={delta,withoutCheese49};
