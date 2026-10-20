'use strict';
// Exact inverse of the reviewed soundtrack delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./music79-delta.json');
function withoutMusic79(html){
 html=require('./fight80.cjs').withoutFight80(html);
 if(!html.includes("Soundtrack: a synthesised B-movie surf-horror loop"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact music hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Music inverse must restore immutable pre-music runtime');return html;
}
module.exports={delta,withoutMusic79};
