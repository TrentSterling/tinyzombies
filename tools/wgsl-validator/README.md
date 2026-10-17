# CPU-only WGSL validation

This development-only check evaluates the exact shader strings composed by `index.html` using the existing CPU host fixture. It parses all 40 shaders with Naga and runs Naga's semantic validator. It opens no browser, requests no GPU adapter, and does not execute shaders. It changes no runtime files.

Requires Node.js 24.12 or later. From this directory:

```sh
npm ci --ignore-scripts --no-audit --no-fund
node validate.mjs
# Optional input and report destination:
node validate.mjs ../../index.html /path/to/report.json
```

`naga-wasm` is pinned to 30.2.0, containing Naga 30.0.1. The lockfile pins its npm registry tarball and integrity. The report records runtime SHA-256, each evaluated shader's SHA-256, the WebAssembly binary SHA-256, Node version, and both valid and invalid control results. A swizzle-assignment control must fail parsing; a compute-stage `discard` control must fail semantic validation.

The npm package is a third-party WebAssembly build of Naga, not an official wgpu distribution. Its documented validator calls Naga with all validation flags and all capabilities. This is shader-level validation only: success does not establish compatibility with a particular browser's enabled features, device limits, bind-group or pipeline layout, backend compiler, GPU execution, rendering, or gameplay.

Primary sources:

- https://github.com/gfx-rs/wgpu/tree/trunk/naga
- https://github.com/kekkon-nexus/naga-wasm
- https://raw.githubusercontent.com/kekkon-nexus/naga-wasm/main/src/lib.rs
- https://registry.npmjs.org/naga-wasm/30.2.0
