'use strict';
// Exact inverse of the reviewed yards delta (style pass 3); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./yard45-delta.json');
function withoutYard45(html){
 html=require('./polish46.cjs').withoutPolish46(html);
 if(!html.includes('function yard45('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact yards hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Yards inverse must restore immutable pre-yards runtime');return html;
}
module.exports={delta,withoutYard45};
