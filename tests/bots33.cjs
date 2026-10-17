'use strict';
// Exact inverse of the reviewed bot grid-scan delta (perf pass 2); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./bots33-delta.json');
function withoutBots33(html){
 if(!html.includes('let lx4=clamp('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact bot-scan hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Bot-scan inverse must restore immutable pre-bot-scan runtime');return html;
}
module.exports={delta,withoutBots33};
