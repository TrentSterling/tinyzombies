'use strict';
// Exact inverse of the reviewed safe-room delta (style pass 2); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./safe44-delta.json');
function withoutSafe44(html){
 html=require('./yard45.cjs').withoutYard45(html);
 if(!html.includes('fn shelterDecor44('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact safe-room hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Safe-room inverse must restore immutable pre-safe-room runtime');return html;
}
module.exports={delta,withoutSafe44};
