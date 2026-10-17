'use strict';
// Deterministic mock-controller tests of the ordinary-input observation helper.
// The helper is imported unchanged. Callback snapshots are synthetic: this does
// not execute gameplay, the readback expression, a browser, WGSL, or a GPU.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');

const helperPath = path.join(__dirname, 'hardware/extraction-contract.mjs');
const checks = [];
const clone = value => JSON.parse(JSON.stringify(value));

function controller(options = {}) {
  const chapter = options.chapter || 1, doorIndex = 41;
  const s = { stage: chapter, t: 0, frame: 0, paused: false, eHeld: false,
    hold: 0, seal: 0, prompt: 0, interaction: 7, interactionIndex: doorIndex,
    goal: 0, hp: 100, down: 0, pin: 0, inside: true, allFourAliveInside: true,
    human: [0, 0, 0, 100], team: Array.from({ length: 3 }, () => ({ p: [0, 0, 0, 100], life: [0, 0, 0, 0] })),
    errors: [], stopped: false };
  const log = { reads: 0, sleeps: 0, keys: [], shots: [], starts: [], completions: [], progress: [] };
  const c = { s, log, chapter, doorIndex, wall: 100000, presses: 0, closureReleased: false,
    closurePauseDone: false, injected: false, lastReport: null };

  function step(dt) {
    if (s.paused) return;
    s.t += dt;
    s.frame++;
    if (s.goal) return;
    // Model only the controller contract being exercised; production scalar
    // implementation coverage lives separately in extraction-hold.test.cjs.
    if (s.hp > 0 && !s.down) {
      if (s.eHeld && !s.pin && s.interaction === 7) s.hold += dt;
      else if (options.mode !== 'retained-release-hold') s.hold = 0;
    }
    if (s.seal === 0 && s.eHeld && s.hold >= .18 - 1e-12 && s.allFourAliveInside && !s.down && !s.pin) {
      s.seal = .0001;
      s.hold = 0;
      s.prompt = 3;
      log.starts.push({ t: s.t, press: c.presses });
    }
    if (s.seal > 0 && s.seal < 1) {
      s.seal = Math.min(1, s.seal + dt / (options.closureSeconds || .6));
      if (s.seal === 1) {
        s.goal = 1;
        log.completions.push({ t: s.t, eHeld: s.eHeld });
      }
    }
  }

  c.ev = async expression => {
    assert.equal(typeof expression, 'string');
    assert(expression.includes('__tiny.readState()'), 'expected the unchanged State readback request');
    if (++log.reads > 5000) throw Error('Mock read budget exceeded');
    if (options.snapshot) options.snapshot(c);
    return clone(s);
  };
  c.key = async (code, down) => {
    assert(['KeyE', 'Escape'].includes(code), 'unexpected ordinary input');
    log.keys.push({ code, down, t: s.t, paused: s.paused });
    if (code === 'Escape' && down) {
      s.paused = !s.paused;
      if (!s.paused && c.presses === 3) c.closurePauseDone = true;
    }
    if (code === 'KeyE') {
      if (down && !s.eHeld) {
        c.presses++;
        if (options.mode === 'old-edge-trigger') { s.seal = .0001; s.prompt = 3; }
      }
      if (!down && s.eHeld && s.seal > 0) c.closureReleased = true;
      s.eHeld = down;
    }
    if (options.key) options.key(c, code, down);
  };
  c.sleep = async milliseconds => {
    assert(milliseconds === 5 || milliseconds === 300, 'unexpected polling or pause sleep');
    if (++log.sleeps > 5000) throw Error('Mock sleep budget exceeded');
    let elapsed = milliseconds;
    if (options.delay) elapsed = options.delay(c, milliseconds);
    assert(Number.isFinite(elapsed) && elapsed > 0 && elapsed <= 20000);
    c.wall += elapsed;
    for (let remaining = elapsed / 1000; remaining > 1e-12;) {
      const dt = Math.min(.005, remaining);
      step(dt);
      remaining -= dt;
    }
    if (options.sleep) options.sleep(c, milliseconds);
  };
  c.shot = async name => {
    log.shots.push({ name, t: s.t, paused: s.paused, hold: s.hold, seal: s.seal });
    if (options.shot) options.shot(c, name);
  };
  c.onProgress = report => {
    c.lastReport = clone(report);
    log.progress.push({ passed: report.passed, failure: report.failure || null });
  };
  return c;
}

async function run(runExtractionContract, options = {}) {
  const c = controller(options), realNow = Date.now;
  let result, error;
  // The helper uses wall-clock deadlines. A per-run virtual clock keeps every
  // failure finite without waiting in real time; runs are strictly sequential.
  Date.now = () => c.wall;
  try {
    result = await runExtractionContract({ ev: c.ev, key: c.key, sleep: c.sleep, shot: c.shot,
      deadline: c.wall + (options.deadlineMs || 20000), chapter: c.chapter,
      doorIndex: c.doorIndex, onProgress: c.onProgress });
  } catch (e) { error = e; }
  finally { Date.now = realNow; }
  assert.equal(c.s.eHeld, false, 'helper must release E even after a failed observation');
  assert.deepEqual(c.log.keys.at(-1) && { code: c.log.keys.at(-1).code, down: c.log.keys.at(-1).down },
    { code: 'KeyE', down: false });
  assert(c.log.reads <= 5000 && c.log.sleeps <= 5000, 'bounded callbacks');
  return { c, result, error };
}

async function check(name, fn) {
  try { checks.push({ name, passed: true, ...(await fn()) }); }
  catch (e) { checks.push({ name, passed: false, error: e.stack }); }
}

async function reject(runExtractionContract, options, expected) {
  const { c, result, error } = await run(runExtractionContract, options);
  assert.equal(result, undefined, 'failed observation must not return an acceptance report');
  assert(error, 'invalid observation unexpectedly accepted');
  assert.match(String(error), expected);
  assert.equal(c.lastReport.passed, false, 'final progress must not report acceptance');
  assert(c.log.progress.every(p => !p.passed), 'no intermediate acceptance on failed observation');
  // A completion-state screenshot is diagnostic evidence, not acceptance.
  // Timing failures may reach that state but must keep every report false.
  return { reads: c.log.reads, rejection: String(error) };
}

(async () => {
  const { runExtractionContract } = await import(pathToFileURL(helperPath).href);
  for (const chapter of [1, 2, 3, 4, 5]) await check('chapter ' + chapter + ': measured short tap rejected, hold and independent closure accepted', async () => {
    const { c, result: r, error } = await run(runExtractionContract, { chapter });
    assert.ifError(error);
    assert.equal(r.passed, true);
    assert.equal(r.tapRejected, true);
    assert(r.tap.partial.hold > 0 && r.tap.partial.hold < .18);
    assert.equal(r.tap.released.hold, 0);
    assert.equal(r.tap.released.eHeld, false);
    assert(r.tap.later.t - r.tap.released.t > .65);
    assert.equal(r.tap.later.seal, 0);
    assert.equal(r.tap.later.goal, 0);
    assert.equal(r.partialPausePassed, true);
    assert.equal(r.interrupted.resumed.hold, 0, 'release during pause resets only after simulation resumes');
    for (const pair of [r.interrupted.pause, r.full.pause]) {
      assert.equal(pair.first.paused, true);
      assert.equal(pair.second.paused, true);
      for (const field of ['t', 'hold', 'seal']) assert.equal(pair.first[field], pair.second[field]);
    }
    assert.equal(r.holdBracketPassed, true);
    assert(r.full.lastPending.hold >= .10 && r.full.lastPending.hold < .18);
    assert(r.full.initiated.t - r.full.lastPending.t <= .10);
    assert.equal(r.autonomousClosurePassed, true);
    assert.equal(r.full.completed.eHeld, false);
    assert.equal(r.full.completed.seal, 1);
    assert.equal(r.full.completed.goal, 1);
    assert(Math.abs(r.closureTimingObserved.elapsedIncludingObservedInitialFraction - .60006) < .006);
    assert.deepEqual(c.log.starts.map(x => x.press), [3], 'neither positive tap may start closure');
    assert.deepEqual(c.log.completions.map(x => x.eHeld), [false], 'started closure is independent of E');
    assert.deepEqual(c.log.shots.map(x => x.name), ['tap-rejected', 'partial-paused', 'closure-paused', 'complete'].map(x => 'ch' + chapter + '-seal-' + x));
    return { reads: c.log.reads, positiveTapSeconds: r.tap.partial.hold,
      holdBracket: [r.full.lastPending.hold, r.full.lastPending.hold + r.full.initiated.t - r.full.lastPending.t],
      observedClosureSeconds: r.closureTimingObserved.elapsedIncludingObservedInitialFraction };
  });

  await check('legacy edge-triggered seal is rejected at the positive-tap probe', () => reject(runExtractionContract,
    { mode: 'old-edge-trigger' }, /door not clear and ready/));
  await check('missing positive subthreshold tap sample is inconclusive', () => reject(runExtractionContract,
    { delay: (c, ms) => c.presses === 1 && c.s.eHeld && !c.injected ? (c.injected = true, 200) : ms }, /door not clear and ready/));
  await check('no positive hold sample before the deadline is inconclusive', () => reject(runExtractionContract,
    { deadlineMs: 150, snapshot: c => { if (c.presses === 1) c.s.hold = 0; } }, /observation window ended/));
  await check('missing pending full-hold samples cannot establish the .18s bracket', () => reject(runExtractionContract,
    { delay: (c, ms) => c.presses === 3 && c.s.eHeld && !c.injected ? (c.injected = true, 200) : ms }, /initiation bracket is incomplete/));
  await check('a full-hold sampling gap above 100ms is rejected despite a positive pending sample', () => reject(runExtractionContract,
    { delay: (c, ms) => c.presses === 3 && c.s.eHeld && c.s.hold >= .10 && !c.injected ? (c.injected = true, 110) : ms }, /initiation bracket is incomplete/));
  await check('missing the entire initiation window cannot count as completion', () => reject(runExtractionContract,
    { delay: (c, ms) => c.presses === 3 && c.s.eHeld && !c.injected ? (c.injected = true, 1000) : ms }, /initiation window missed/));
  await check('missing all post-resume closing samples cannot count as completion', () => reject(runExtractionContract,
    { delay: (c, ms) => c.closurePauseDone && !c.injected ? (c.injected = true, 1000) : ms }, /contract incomplete/));
  await check('retained pending hold after release cannot count as tap rejection', () => reject(runExtractionContract,
    { mode: 'retained-release-hold', deadlineMs: 1200 }, /observation window ended/));
  await check('downed release freezes the mock pending hold and cannot count as a reset or pass', async () => {
    const { c, result, error } = await run(runExtractionContract, { deadlineMs: 1200,
      key: (model, code, down) => { if (code === 'KeyE' && !down && model.presses === 1 && model.s.hold > 0) {
        model.s.down = 1; model.s.hp = 0; model.s.allFourAliveInside = false;
      } } });
    assert.equal(result, undefined);
    assert.match(String(error), /observation window ended/);
    assert.equal(c.lastReport.passed, false);
    assert(c.s.hold > 0 && c.s.hold < .18, 'downed state must freeze, not reset, the mock pending hold');
    assert.equal(c.s.hold, c.lastReport.tap.partial.hold);
    assert.equal(c.s.seal, 0);
    return { frozenHoldSeconds: c.s.hold, rejection: String(error) };
  });
  await check('deadline expiry cannot count as acceptance', () => reject(runExtractionContract,
    { deadlineMs: 100 }, /observation window ended/));

  for (const kind of ['partial', 'closure']) for (const field of ['paused', 't', 'hold', 'seal']) {
    await check('pause ' + kind + ': changing ' + field + ' is rejected', () => reject(runExtractionContract,
      { sleep: (c, ms) => { if (ms === 300 && c.presses === (kind === 'partial' ? 2 : 3)) {
        if (field === 'paused') c.s.paused = false; else c.s[field] += .005;
      } } }, new RegExp('Paused ' + kind + ' changed')));
  }

  for (const [field, value] of [['inside', false], ['allFourAliveInside', false], ['down', 1], ['pin', 1], ['hp', 0], ['interaction', 1], ['interactionIndex', 99]]) {
    await check('pending hold eligibility change: ' + field, () => reject(runExtractionContract,
      { snapshot: c => { if (c.presses === 3 && c.s.hold >= .08) c.s[field] = value; } }, /eligibility changed/));
  }
  await check('pending hold cancellation by released E is rejected', () => reject(runExtractionContract,
    { snapshot: c => { if (c.presses === 3 && c.s.hold >= .08) c.s.eHeld = false; } }, /hold interrupted/));
  await check('closure cancellation after resume is rejected', () => reject(runExtractionContract,
    { snapshot: c => { if (c.closurePauseDone && c.s.seal > .1) c.s.seal = 0; } }, /closure cancelled/));
  for (const [field, value] of [['allFourAliveInside', false], ['down', 1], ['pin', 1], ['eHeld', true]]) {
    await check('autonomous closure interruption: ' + field, () => reject(runExtractionContract,
      { snapshot: c => { if (c.closurePauseDone && c.s.seal > .1) c.s[field] = value; } }, /closure observation interrupted/));
  }
  for (const seconds of [.25, 1.1]) await check('closure duration ' + seconds + 's is rejected', () => reject(runExtractionContract,
    { closureSeconds: seconds }, /contract incomplete/));
  for (const [field, value] of [['stage', 99], ['errors', ['synthetic runtime error']], ['stopped', true]]) {
    await check('invalid runtime observation: ' + field, () => reject(runExtractionContract,
      { snapshot: c => { c.s[field] = value; } }, /runtime\/stage error/));
  }
  await check('failed final evidence capture cannot publish a passing progress report', () => reject(runExtractionContract,
    { shot: (_c, name) => { if (name.endsWith('-complete')) throw Error('Synthetic screenshot capture cancelled'); } }, /screenshot capture cancelled/));
  await check('failed final E release cannot publish a passing progress report', () => reject(runExtractionContract,
    { key: (c, code, down) => {
      if (code === 'KeyE' && !down && c.log.shots.some(x => x.name.endsWith('-complete'))) {
        throw Error('Synthetic final input release failed');
      }
    } }, /final input release failed/));

  const report = { method: 'CPU-only deterministic mock callbacks exercising the unchanged ordinary-input extraction observation helper. No readback evaluation, browser, GPU, shader compilation, earned gameplay, or hardware acceptance.',
    helperSha256: crypto.createHash('sha256').update(fs.readFileSync(helperPath)).digest('hex'),
    limits: { maxReadsPerCase: 5000, maxSleepsPerCase: 5000, realSleeps: 0 },
    passed: checks.every(x => x.passed), checks };
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.passed ? 0 : 1;
})().catch(e => { console.error(e.stack); process.exitCode = 1; });
