'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

function makeRecorder() {
  let active, last, ticket = null;
  function stats(values) {
    if (!values.length) return null;
    const sorted = [...values].sort((a,b) => a-b);
    const p = n => sorted[Math.ceil(n * sorted.length) - 1];
    return {n: sorted.length, p50:p(.50), p95:p(.95), p99:p(.99), worst:sorted.at(-1)};
  }
  return {
    readyMs: null, playMs: null, acceptedPlayMs: null, startupWork: [],
    acceptPlay() { if (this.acceptedPlayMs === null && this.playMs === null) this.acceptedPlayMs = performance.now(); },
    async work(key, label, work) {
      const startMs = performance.now(); let status = 'failed';
      try { const value = await work(); status = 'completed'; return value; }
      finally { const endMs = performance.now(); this.startupWork.push({key, label, startMs, endMs, durationMs:endMs-startMs, status}); }
    },
    start(mode = 'frames') {
      if (active) throw Error('Stop the previous capture first');
      if (!['frames','gpu'].includes(mode)) throw Error('Use frames or gpu');
      active = {mode, rows:[], skipped:0, gpu:[], nextPhase:0, nextFrame:0, pending:0, missed:0};
      last = undefined;
    },
    skip() { if (active) active.skipped++; },
    submit(now, frame, phase, w, h, msaa, count, started, paused, seed, stage) {
      if (started && this.playMs === null) this.playMs = performance.now();
      if (!active) return;
      active.rows.push([now, last === undefined ? null : now-last, frame, phase, w, h, msaa, count, started, paused, seed, stage]);
      last = now;
    },
    shouldStamp(frame, phase) {
      return active && active.mode === 'gpu' ? frame >= active.nextFrame && phase === active.nextPhase : frame%30===0;
    },
    stamped(frame, phase, hasActorRead) {
      if (!active || active.mode !== 'gpu') return;
      ticket = {run:active, frame, phase, hasActorRead};
      active.nextPhase = (phase + 1) % 16;
      active.nextFrame = frame + 24;
      active.pending++;
    },
    timestamps(t) {
      if (!ticket) return;
      const {run, frame, phase, hasActorRead} = ticket;
      const ms = (a,b) => Number(t[b] - t[a])/1e6;
      run.gpu.push({frame, phase, drip:frame%8===0, actorRead:hasActorRead,
        throughToneMapMs:ms(0,1), aiMs:ms(2,3), worldMs:ms(4,5),
        relaxMs:ms(6,7), gibsMs:ms(8,9), geometryMs:ms(10,11)});
      run.pending--; ticket = null;
    },
    failedTimestamp() {
      if (!ticket) return;
      ticket.run.pending--; ticket.run.missed++; ticket = null;
    },
    stop() {
      if (!active) throw Error('No capture in progress');
      if (active.pending) throw Error('GPU sample pending; stop after a frame without a pending sample');
      const r = active; active = null;
      return {mode:r.mode, readyMs:this.readyMs, firstStartedSubmitMs:this.playMs,
        acceptedPlayMs:this.acceptedPlayMs,
        acceptedPlayToFirstSubmitMs:this.acceptedPlayMs===null||this.playMs===null?null:this.playMs-this.acceptedPlayMs,
        startupWork:this.startupWork.map(row=>({...row})), skippedCallbacks:r.skipped,
        intervalMs:stats(r.rows.slice(1).map(row=>row[1])),
        configuration:[...new Set(r.rows.map(row=>JSON.stringify(row.slice(4))))].map(JSON.parse),
        phaseCounts:Array.from({length:16},(_,phase)=>r.gpu.filter(s=>s.phase===phase).length),
        missedGpuSamples:r.missed, gpu:r.gpu, frames:r.rows};
    },
  };
}

function instrument(source) {
  if (source.includes('__tinyPerf')) throw Error('Already instrumented');
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const edits = [
    ["if(completedBoundary15)return;if(!settings.started){settings.started=true;", "if(completedBoundary15)return;if(!settings.started){perfAB.acceptPlay();settings.started=true;"],
    ["const value=await work();guard();done.add(key);", "const value=await perfAB.work(key,label,work);guard();done.add(key);"],
    ["const params=new URLSearchParams(location.search);", "const params=new URLSearchParams(location.search);" + eol +
      "const perfAB=window.__tinyPerf=("+makeRecorder.toString()+")();"],
    ["if(inFlight>=2){frameCallback=requestAnimationFrame(drawFrame);return;}", "if(inFlight>=2){perfAB.skip();frameCallback=requestAnimationFrame(drawFrame);return;}"],
    ["stampThisFrame=!!tsQuery&&!tsBusy&&!settings.paused&&playerValues[464]<.5&&frame%30===0;", "const phaseAB=navPhase;stampThisFrame=!!tsQuery&&!tsBusy&&!settings.paused&&playerValues[464]<.5&&perfAB.shouldStamp(frame,phaseAB);"],
    ["if(stampThisFrame){tsBusy=true;enc.resolveQuerySet", "if(stampThisFrame){perfAB.stamped(frame,phaseAB,audioSample);tsBusy=true;enc.resolveQuerySet"],
    ["device.queue.submit([enc.finish()]);inFlight++;", "device.queue.submit([enc.finish()]);perfAB.submit(now,frame,phaseAB,width,height,renderSamples25,settings.zombies,settings.started,settings.paused,runSeed,stage);inFlight++;"],
    ["const t=new BigUint64Array(tsRead.getMappedRange());gpuMs=", "const t=new BigUint64Array(tsRead.getMappedRange());perfAB.timestamps(t);gpuMs="],
    ["}).catch(()=>{tsBusy=false;});}", "}).catch(()=>{perfAB.failedTimestamp();tsBusy=false;});}"],
    ["window.__TINY_READY__=true;frameCallback=requestAnimationFrame(drawFrame);", "perfAB.readyMs=performance.now();window.__TINY_READY__=true;frameCallback=requestAnimationFrame(drawFrame);"],
  ];
  for (const [marker,replacement] of edits) {
    if (source.split(marker).length !== 2) throw Error('Missing or nonunique marker: '+marker);
    source = source.replace(marker,()=>replacement.replace(/\r?\n/g,eol));
  }
  return source;
}

if (require.main === module) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || path.dirname(path.resolve(input)) !== path.dirname(path.resolve(output))) {
    throw Error('Usage: node tools/browser-perf.cjs <path/index.html> <path/perf-local.html> (same directory for relative assets)');
  }
  const bytes = fs.readFileSync(input);
  const hash = createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  fs.writeFileSync(output,instrument(bytes.toString('utf8')), {flag:'wx'});
  console.log(hash+' -> '+output);
}

module.exports = {instrument, makeRecorder};

