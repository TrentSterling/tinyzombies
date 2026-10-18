'use strict';
// Exact inverse of the reviewed daylight-style delta (style pass 1); not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./sunny43-delta.json');
function withoutSunny43(html){
 html=require('./safe44.cjs').withoutSafe44(html);
 if(!html.includes('fn suburb42('))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact daylight hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Daylight inverse must restore immutable pre-daylight runtime');return html;
}
module.exports={delta,withoutSunny43};
