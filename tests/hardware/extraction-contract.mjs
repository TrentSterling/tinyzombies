// Ordinary-input extraction observations. Only reads State; no runtime/storage mutation.
export async function runExtractionContract({ev,key,sleep,shot,deadline,chapter,doorIndex,onProgress=()=>{}}){
 const report={chapter,passed:false,method:'Ordinary E/Escape input with State-only polling; exact scalar thresholds are separately tested. Missed short-input windows are inconclusive.',samples:[]};
 const read=()=>ev(`(async()=>{const p=await __tiny.readState(),b=CHAPTER_GEOMETRY16[stage-1].safe,pad=stage>=3?22/64:0,inside=q=>stage>=3?q[0]>b[0]+pad&&q[0]<b[2]-pad&&q[2]>b[1]+pad&&q[2]<b[3]-pad:q[0]>=b[0]&&q[0]<b[2]&&q[2]>=b[1]&&q[2]<b[3];const human=p.slice(0,4),team=Array.from({length:3},(_,i)=>({p:p.slice(L7.team7+i*128,L7.team7+i*128+4),life:p.slice(L13.botLife+i*4,L13.botLife+i*4+4)}));return {stage,t:p[24],frame,paused:settings.paused,eHeld:keys.has('KeyE'),hold:p[L7.escape+1],seal:p[L7.escape],prompt:p[L7.squad7+3],interaction:p[449],interactionIndex:p[450],goal:p[67],hp:p[3],down:p[L7.player7],pin:p[L12.flags+3],inside:inside(human),allFourAliveInside:p[3]>0&&!p[L7.player7]&&inside(human)&&team.every(a=>a.p[3]>0&&a.life[1]<.5&&inside(a.p)),human,team,errors:diagnostics.errors,stopped};})()`);
 const snapshot=async()=>{const s=await read();if(s.stage!==chapter||s.errors.length||s.stopped)throw Error('Extraction runtime/stage error');if(report.samples.length<1200)report.samples.push(s);return s;};
 const eligible=(s,{pending=true}={})=>{if(s.paused||!s.inside||!s.allFourAliveInside||s.down||s.pin||s.hp<=0||s.interaction!==7||s.interactionIndex!==doorIndex)throw Error('Extraction observation inconclusive: eligibility changed');if(pending&&(s.seal!==0||s.goal!==0||s.prompt!==0))throw Error('Extraction observation inconclusive: door not clear and ready');};
 const poll=async predicate=>{const end=Math.min(deadline,Date.now()+15000);while(Date.now()<end){const s=await snapshot();if(predicate(s))return s;await sleep(5);}throw Error('Extraction observation window ended; outcome incomplete');};
 const press=async code=>{await key(code,true);await key(code,false);};
 const reset=async()=>{await key('KeyE',false);const first=await snapshot();const s=await poll(q=>!q.paused&&q.t>first.t&&q.hold===0&&!q.eHeld);eligible(s);return s;};
 const partial=async()=>{const start=await reset();await key('KeyE',true);const p=await poll(s=>{eligible(s);if(s.hold>=.18||s.seal>0)throw Error('Extraction short-input window missed or seal started too early; inspect trace');return s.eHeld&&s.hold>=.04;});if(!(p.hold>0&&p.hold<.18))throw Error('No measured subthreshold hold');return{start,partial:p};};
 const freeze=async kind=>{await press('Escape');const first=await poll(s=>s.paused);await key('KeyE',false);await sleep(300);const second=await snapshot();if(!second.paused||second.t!==first.t||second.hold!==first.hold||second.seal!==first.seal)throw Error('Paused '+kind+' changed');await shot('ch'+chapter+'-seal-'+kind+'-paused');await press('Escape');return{first,second};};
 try{
  report.start=await reset();onProgress(report);
  report.tap=await partial();await key('KeyE',false);report.tap.released=await poll(s=>s.t>report.tap.partial.t&&!s.eHeld&&s.hold===0);
  eligible(report.tap.released);const start=report.tap.released.t;report.tap.later=await poll(s=>{eligible(s);if(s.eHeld||s.hold!==0)throw Error('Released tap retained input or hold');return s.t-start>.65;});
  report.tapRejected=report.tap.partial.hold>0&&report.tap.partial.hold<.18&&report.tap.later.seal===0&&report.tap.later.goal===0;await shot('ch'+chapter+'-seal-tap-rejected');onProgress(report);
  report.interrupted=await partial();report.interrupted.pause=await freeze('partial');report.interrupted.resumed=await reset();
  report.partialPausePassed=report.interrupted.pause.first.seal===0&&report.interrupted.pause.first.hold>0&&report.interrupted.pause.first.hold<.18&&report.interrupted.resumed.hold===0;onProgress(report);
  report.full={start:await reset()};let last=report.full.start;await key('KeyE',true);
  report.full.initiated=await poll(s=>{eligible(s,{pending:false});if(s.goal||s.seal>=1)throw Error('Extraction initiation window missed');if(s.seal>0)return true;if(s.prompt!==0||!s.eHeld)throw Error('Extraction hold interrupted');last=s;return false;});
  report.full.lastPending=last;await key('KeyE',false);const first=report.full.initiated;
  report.holdBracketPassed=last.seal===0&&last.hold>=.10&&last.hold<.18&&first.t-last.t<=.10&&last.hold+first.t-last.t>=.18-.0001&&first.seal>0&&first.seal<.5;
  if(!report.holdBracketPassed)throw Error('Extraction .18-second initiation bracket is incomplete');
  report.full.pause=await freeze('closure');if(!(report.full.pause.first.seal>0&&report.full.pause.first.seal<1))throw Error('Closure pause observation missed');
  report.full.resumed=await poll(s=>!s.paused&&s.t>report.full.pause.first.t);if(report.full.resumed.eHeld)throw Error('Closure resumed with E still held');let lastClosing=report.full.resumed;
  report.full.completed=await poll(s=>{if(!s.allFourAliveInside||s.down||s.pin||s.eHeld)throw Error('Extraction closure observation interrupted');if(s.goal===1&&s.seal===1)return true;if(s.goal||s.seal===0)throw Error('Extraction closure cancelled');lastClosing=s;return false;});
  report.full.lastClosing=lastClosing;const complete=report.full.completed,closureElapsed=complete.t-first.t+first.seal*.6;
  report.autonomousClosurePassed=lastClosing.seal>0&&lastClosing.seal<1&&complete.seal===1&&complete.goal===1&&complete.allFourAliveInside&&!complete.eHeld&&closureElapsed>=.59&&closureElapsed<=.76;
  report.closureTimingObserved={activationSample:first.t,closureSample:complete.t,elapsedIncludingObservedInitialFraction:closureElapsed,method:'Simulation-time readback brackets; pause contributes no simulated time.'};
  const accepted=report.tapRejected&&report.partialPausePassed&&report.holdBracketPassed&&report.autonomousClosurePassed;await shot('ch'+chapter+'-seal-complete');if(!accepted)throw Error('Extraction contract incomplete');report.passed=true;return report;
 }catch(e){report.passed=false;report.failure=String(e);throw e;}finally{try{await key('KeyE',false);}catch(e){report.passed=false;report.failure??=String(e);throw e;}finally{onProgress(report);}}
}
