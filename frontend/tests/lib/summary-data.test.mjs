import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../../src/lib/summary-data.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module });

const { hasSummaryContent, normalizeLegacySummary, parseSummaryData } = module.exports;

assert.equal(parseSummaryData('{broken'), null);
assert.equal(parseSummaryData(null), null);
assert.equal(parseSummaryData('[]'), null);

const parsed = parseSummaryData(JSON.stringify({
  MeetingName: 'Planning',
  _section_order: ['Decisions'],
  Decisions: {
    title: 'Decisions',
    blocks: [
      { id: 'one', type: 'bullet', content: '  Ship it  ' },
      null,
      { content: 42 },
    ],
  },
}));

assert.ok(parsed);
const normalized = normalizeLegacySummary(parsed);
assert.deepEqual(JSON.parse(JSON.stringify(normalized)), {
  Decisions: {
    title: 'Decisions',
    blocks: [
      { id: 'one', type: 'bullet', content: 'Ship it', color: 'default' },
      { id: 'Decisions-block-2', type: 'text', content: '', color: 'default' },
    ],
  },
});
assert.equal(hasSummaryContent(normalized), true);
assert.equal(hasSummaryContent({ Empty: { title: 'Empty', blocks: [] } }), false);

console.log('summary-data tests passed');
