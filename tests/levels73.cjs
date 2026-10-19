'use strict';
// Exact inverse of the reviewed Maple level progression delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./levels73-delta.json');
function withoutLevels73(html){
 html=require('./coop74.cjs').withoutCoop74(html);
 if(!html.includes("Maple Street levels: every evacuation rolls a new street"))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact level hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Level inverse must restore immutable pre-level runtime');return html;
}
module.exports={delta,withoutLevels73};
