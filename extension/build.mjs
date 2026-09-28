import {readFile, mkdir, writeFile, copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {extractSections, groupBlocks, normalizePreferences} from './core.js';
import {openReader} from './reader.js';
import {speechChunks} from '../src/ui/readingBar.js';

const output = new URL('./dist/', import.meta.url);
const css = await readFile(new URL('./reader.css', import.meta.url), 'utf8');
await mkdir(output, {recursive: true});
for (const name of ['manifest.json', 'background.js']) await copyFile(new URL(name, import.meta.url), new URL(name, output));
const bundle = `(() => {
  const key = '__workingAccessReaderClose';
  if (typeof globalThis[key] === 'function') { globalThis[key](); return; }
  const group = ${groupBlocks.toString()};
  const extract = ${extractSections.toString()};
  globalThis[key] = (${openReader.toString()})({
    extract: doc => extract(doc, group), normalize: ${normalizePreferences.toString()},
    chunkText: ${speechChunks.toString()}, css: ${JSON.stringify(css)},
    load: async () => (await chrome.storage.local.get('readingPreferences')).readingPreferences,
    save: value => chrome.storage.local.set({readingPreferences: value}),
    onClose: () => { delete globalThis[key]; }
  });
})();`;
await writeFile(new URL('reader.bundle.js', output), bundle);
console.log('Unpacked extension: ' + fileURLToPath(output));
