import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const modulePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'lib', 'local-model-status.ts');
const source = fs.readFileSync(modulePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module });
const { getLocalModelStatus } = module.exports;

assert.equal(
  JSON.stringify(getLocalModelStatus({ provider: 'builtin-ai', model: 'local-model', ollamaModelCount: 0 })),
  JSON.stringify({ ready: true, description: 'local-model is configured as the built-in local model.' }),
);
assert.equal(
  JSON.stringify(getLocalModelStatus({ provider: 'ollama', model: 'local-model', ollamaModelCount: 2 })),
  JSON.stringify({ ready: true, description: '2 Ollama models available on this device.' }),
);
assert.equal(
  getLocalModelStatus({ provider: 'ollama', model: 'local-model', ollamaModelCount: 2, ollamaError: 'offline' }).ready,
  false,
);
assert.equal(
  getLocalModelStatus({ provider: 'openai', model: 'remote-model', ollamaModelCount: 0 }).ready,
  false,
);

console.log('local-model-status tests passed');
