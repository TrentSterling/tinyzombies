'use strict';
// Exact inverse of the reviewed neighbor-hunt delta (behaviour pass 8); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./hunt41-delta.json');
function withoutHunt41(html){
 if(!html.includes('Waiting neighbors shout HELP!, so they are heard too'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact hunt hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Hunt inverse must restore immutable pre-hunt runtime');return html;
}
module.exports={delta,withoutHunt41};
