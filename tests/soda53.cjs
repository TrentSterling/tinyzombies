'use strict';
// Exact inverse of the reviewed soda can delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./soda53-delta.json');
function withoutSoda53(html){
 if(!html.includes('A soda can is already fizzing.'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact soda hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Soda inverse must restore immutable pre-soda runtime');return html;
}
module.exports={delta,withoutSoda53};
