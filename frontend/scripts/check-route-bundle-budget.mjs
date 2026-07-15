import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const route = '/meeting-details/page';
const maximumCompressedBytes = 350_000;
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

console.log(`${route} initial JavaScript: ${formattedSize} / ${formattedBudget} compressed bytes`);
