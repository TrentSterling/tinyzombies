'use strict';
// Exact inverse of the reviewed closer-scare delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./closer87-delta.json');
function withoutCloser87(html){
 if(!html.includes("Closer scare: robot runs showed the 15 s pack"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact closer hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Closer inverse must restore immutable pre-closer runtime');return html;
}
module.exports={delta,withoutCloser87};
