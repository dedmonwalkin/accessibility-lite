import http from 'node:http';
import {readFile} from 'node:fs/promises';

const allowed = new Map([
  ['/', ['demo.html', 'text/html']], ['/demo.js', ['demo.js', 'text/javascript']],
  ['/reader.css', ['reader.css', 'text/css']], ['/reader.js', ['reader.js', 'text/javascript']],
  ['/core.js', ['core.js', 'text/javascript']],
  ['/speech.js', ['../src/ui/readingBar.js', 'text/javascript']]
]);
const server = http.createServer(async (req, res) => {
  const entry = allowed.get(new URL(req.url, 'http://localhost').pathname);
  if (!entry || req.method !== 'GET') { res.writeHead(404); res.end('Not found'); return; }
  try {
    const body = await readFile(new URL(entry[0], import.meta.url));
    res.writeHead(200, {
      'Content-Type': entry[1] + '; charset=utf-8', 'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(body);
  } catch { res.writeHead(500); res.end('Preview unavailable'); }
});
server.listen(4320, '127.0.0.1', () => console.log('Extension interaction demo: http://127.0.0.1:4320/'));
process.on('SIGINT', () => server.close());
process.on('SIGTERM', () => server.close());
