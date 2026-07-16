import { rm } from 'node:fs/promises';

await Promise.all([
  rm('.next', { recursive: true, force: true }),
  rm('out', { recursive: true, force: true }),
]);
