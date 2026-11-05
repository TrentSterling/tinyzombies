'use strict';
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs'),delta=require('./loading93-delta.json');
function withoutLoading93(html){
 if(!html.includes('function createStartup93('))return html;
 for(const change of [...delta.changes].reverse()){assert.equal(html.split(change.after).length,2);html=html.replace(change.after,change.before);}
 assert.equal(sha(html),delta.parentSha256,'Loading inverse restores exact pre-loading runtime');return html;
}
module.exports={delta,withoutLoading93};
