'use strict';
// Exact inverse of the reviewed online co-op delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./online75-delta.json');
function withoutOnline75(html){
 if(!html.includes("Online co-op (experimental): ?host opens a room"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact online hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Online inverse must restore immutable pre-online runtime');return html;
}
module.exports={delta,withoutOnline75};
