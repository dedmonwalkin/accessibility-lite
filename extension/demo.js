import {extractSections, groupBlocks, normalizePreferences} from './core.js';
import {openReader} from './reader.js';
import {speechChunks} from './speech.js';

const fixture = new URL(location.href).searchParams.get('fixture');
const article = document.getElementById('article');
if (fixture === 'service') {
  document.title = 'Borrow a meeting room - Fictional service';
  article.innerHTML = '<h1>Borrow a meeting room</h1><p>This is a fictional service used to test reading tools.</p><h2>Before you begin</h2><p>Choose a date and check the opening hours.</p><h2>What to bring</h2><ul><li>Your booking reference.</li><li>A way to contact the organizer.</li></ul><h2>Get help</h2><p>Ask the desk team for a quieter space or a different format.</p>';
} else if (fixture === 'empty') {
  document.title = 'Unsupported content example';
  article.innerHTML = '<canvas aria-label="An example of content the prototype cannot extract"></canvas>';
}
const css = await fetch('/reader.css').then(response => response.text());
let preferences;
let close;
document.getElementById('open-reader').addEventListener('click', () => {
  if (close) { close(); return; }
  close = openReader({
    extract: doc => extractSections(doc, groupBlocks), normalize: normalizePreferences,
    chunkText: speechChunks, css,
    load: async () => preferences, save: async value => { preferences = value; },
    onClose: () => { close = undefined; }
  });
});
document.getElementById('open-reader').disabled = false;
