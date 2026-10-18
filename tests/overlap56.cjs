'use strict';
// Exact inverse of the reviewed callout overlap fix; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./overlap56-delta.json');
function withoutOverlap56(html){
 html=require('./gorefloor57.cjs').withoutGorefloor57(html);
 if(!html.includes('height*.11,px,COL9.gold'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact overlap hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Overlap inverse must restore immutable pre-overlap-fix runtime');return html;
}
module.exports={delta,withoutOverlap56};
