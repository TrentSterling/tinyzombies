'use strict';
// Exact inverse of the reviewed player-bleed delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./bleed59-delta.json');
function withoutBleed59(html){
 html=require('./card60.cjs').withoutCard60(html);
 if(!html.includes('spurts blood off them, more for harder hits'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact bleed hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Bleed inverse must restore immutable pre-bleed runtime');return html;
}
module.exports={delta,withoutBleed59};
