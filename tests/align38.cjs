'use strict';
// Exact inverse of the reviewed crush-binding alignment hotfix; not a general code scrubber.
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const delta=require('./align38-delta.json');
function withoutAlign38(html){
 if(!html.includes('const CRUSH_LEAD30='))return html;
 for(const [i,change]of [...delta.changes.entries()].reverse()){assert.equal(html.split(change.after).length,2,'Exact alignment hunk '+i);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Alignment inverse must restore immutable pre-alignment-fix runtime');return html;
}
module.exports={delta,withoutAlign38};
