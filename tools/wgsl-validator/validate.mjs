import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseWgsl, validate, nagaVersion } from 'naga-wasm';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const { loadHost, sha } = require('../../tests/deadends-cpu-host.cjs');
const expectedNagaVersion = '30.0.1';
assert.equal(nagaVersion, expectedNagaVersion, 'Unexpected Naga version');

function check(code) {
  const result = { bytes: Buffer.byteLength(code), sha256: sha(code) };
  let module, info;
  try {
    module = parseWgsl(code);
    result.parsed = true;
    info = validate(module);
    result.validated = true;
  } catch (error) {
    result.parsed ??= false;
    result.validated = false;
    result.error = {
      kind: error.kind,
      message: error.message,
      formatted: error.formatted,
    };
  } finally {
    info?.free();
    module?.free();
  }
  return result;
}

// These prove both the frontend and semantic validator are actually invoked.
const controls = [
  { name: 'valid-component-write', expected: 'pass', source: '@compute @workgroup_size(1) fn main() { var x=vec2f(1.,2.); x.x=3.; }' },
  { name: 'invalid-swizzle-write', expected: 'parse', source: '@compute @workgroup_size(1) fn main() { var x=vec2f(1.,2.); x.xy=vec2f(3.,4.); }' },
  { name: 'invalid-compute-discard', expected: 'validation', source: '@compute @workgroup_size(1) fn main() { discard; }' },
].map(control => {
  const result = check(control.source);
  const actual = result.validated ? 'pass' : result.error?.kind;
  return { ...control, ...result, actual, passed: actual === control.expected };
});
assert(controls.every(control => control.passed), 'Validator control failed');

const file = path.resolve(process.argv[2] || path.join(here, '../../index.html'));
const host = loadHost(file);
const names = [...host.script.matchAll(/const ([A-Za-z_][A-Za-z_0-9]*Shader)\s*=/g)].map(match => match[1]);
assert.equal(names.length, 40, 'Update the expected shader inventory if runtime intentionally changes');
assert.equal(new Set(names).size, names.length, 'Duplicate shader names');
const shaders = names.map(name => ({ name, ...check(host.run(name)) }));
const report = {
  method: 'Naga WebAssembly parseWgsl followed by validate, CPU-only, exact composed runtime strings from deadends-cpu-host. No GPU execution or pipeline/device validation.',
  package: 'naga-wasm@30.2.0',
  nagaVersion,
  registryTarball: 'https://registry.npmjs.org/naga-wasm/-/naga-wasm-30.2.0.tgz',
  packageIntegrity: 'sha512-TNKjybMep7dUtmslyueiXMhZLa8Tr432/v0XUcbRfip0gb9liiiynoX8iLNcOkqK/8LaIoG+8HEy4LE6/y8R1w==',
  wasmSha256: sha(fs.readFileSync(require.resolve('naga-wasm/naga_bg.wasm'))),
  nodeVersion: process.version,
  file,
  candidateSha256: host.sha256,
  shadersChecked: shaders.length,
  passed: shaders.every(shader => shader.validated),
  controls,
  failures: shaders.filter(shader => !shader.validated),
  shaders,
};
const json = JSON.stringify(report, null, 2) + '\n';
if (process.argv[3]) fs.writeFileSync(process.argv[3], json);
process.stdout.write(json);
process.exitCode = report.passed ? 0 : 1;
