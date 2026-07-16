import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const route = '/meeting-details/page';
const maximumCompressedBytes = 350_000;
const productionForbiddenMarkers = ['[WDIO Tauri Plugin]', 'window.wdioTauri'];
const manifest = JSON.parse(await readFile('.next/app-build-manifest.json', 'utf8'));
const routeFiles = manifest.pages?.[route];

if (!Array.isArray(routeFiles)) {
  throw new Error(`Missing ${route} in .next/app-build-manifest.json. Run the production build first.`);
}

const initialJavaScript = routeFiles.filter(file => file.endsWith('.js'));
const compressedBytes = (
  await Promise.all(
    initialJavaScript.map(async file => gzipSync(await readFile(`.next/${file}`)).byteLength),
  )
).reduce((total, size) => total + size, 0);

const formattedSize = new Intl.NumberFormat('en-US').format(compressedBytes);
const formattedBudget = new Intl.NumberFormat('en-US').format(maximumCompressedBytes);

if (compressedBytes > maximumCompressedBytes) {
  throw new Error(
    `${route} initial JavaScript is ${formattedSize} compressed bytes; budget is ${formattedBudget}.`,
  );
}

const staticChunksRoot = '.next/static/chunks';
const staticChunks = (await readdir(staticChunksRoot, { recursive: true }))
  .filter((file) => file.endsWith('.js'));

for (const file of staticChunks) {
  const source = await readFile(`${staticChunksRoot}/${file}`, 'utf8');
  const marker = productionForbiddenMarkers.find((candidate) => source.includes(candidate));
  if (marker) {
    throw new Error(`Production chunk ${file} contains test-only WDIO marker ${JSON.stringify(marker)}.`);
  }
}

console.log(`${route} initial JavaScript: ${formattedSize} / ${formattedBudget} compressed bytes`);
console.log(`Production static chunks exclude ${productionForbiddenMarkers.length} WDIO bridge markers`);
