import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const modulePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'src',
  'lib',
  'with-timeout.ts',
);
const source = fs.readFileSync(modulePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module, setTimeout, clearTimeout, Error, Promise });

const { withTimeout } = module.exports;

assert.equal(await withTimeout(Promise.resolve('ready'), 'should not time out', 1), 'ready');
await assert.rejects(
  withTimeout(new Promise(() => {}), 'Audio-device check timed out.', 1),
  /Audio-device check timed out/,
);

console.log('with-timeout tests passed');
