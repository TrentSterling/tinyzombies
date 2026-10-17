'use strict';
const assert=require('node:assert/strict'),{sha}=require('./deadends-cpu-host.cjs');
const changes=[
 ['S.objectivePoint.xy=select(u.goals.xy,chapterDoor16(u.run.x),gateDone);','S.objectivePoint=vec4f(select(u.goals.xy,chapterDoor16(u.run.x),gateDone),S.objectivePoint.zw);',1],
 ['S.objectivePoint.xy=u.goals.zw;','S.objectivePoint=vec4f(u.goals.zw,S.objectivePoint.zw);',1],
 ['S.objectivePoint.xy=q.p.xz;','S.objectivePoint=vec4f(q.p.xz,S.objectivePoint.zw);',1],
 ['z.special13.xy=direct;','z.special13=vec4f(direct,z.special13.zw);',2],
 ['z.sense13.xy=goalPoint+jitter;','z.sense13=vec4f(goalPoint+jitter,z.sense13.zw);',1],
];
function withoutSwizzleAssignmentFix(html){
 html=require('./audit-fixes25.cjs').withoutAuditFixes25(html);
 if(!html.includes(changes[0][1]))return html;
 for(const [before,after,count]of changes){assert.equal(html.split(after).length-1,count,'Exact reviewed swizzle assignment');assert(!html.includes(before));html=html.split(after).join(before);}
 assert.equal(sha(html),'85a239175a397c542e388fd876c949bfc38328ad351a54ce364414edaacf6449','Swizzle inverse must restore immutable pre-fix runtime');return html;
}
function multiComponentAssignments(code){return [...code.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'').matchAll(/\.\s*([xyzwrgba]{2,4})\s*\)*\s*(?:(?:<<|>>|[+\-*/%&|^])?=)(?!=)/g)].map(m=>({swizzle:m[1],at:m.index}));}
module.exports={changes,withoutSwizzleAssignmentFix,multiComponentAssignments};
