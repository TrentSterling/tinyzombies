'use strict';
// Exact inverse of the reviewed bots-stay-close delta; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./bots48-delta.json');
function withoutBots48(html){
 html=require('./cheese49.cjs').withoutCheese49(html);
 if(!html.includes('Maple Street has no authored route: hold a slot'))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact bots-fix hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Bots-fix inverse must restore immutable pre-bots-fix runtime');return html;
}
module.exports={delta,withoutBots48};
