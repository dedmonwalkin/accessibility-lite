import dns from 'node:dns/promises';
import net from 'node:net';
import { URL } from 'node:url';

// RFC1918 / loopback / link-local / unique-local-addresses / CGNAT.
// Hosts resolving to any of these are refused — prevents SSRF against
// cloud-metadata endpoints (169.254.169.254), container-local services, etc.
function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;          // link-local, includes AWS/GCP metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true;                         // multicast / reserved
  return false;
}

function isPrivateIPv6(ip) {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fe80:')) return true;        // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA
  if (lower.startsWith('ff')) return true;           // multicast
  // IPv4-mapped
  const mapped = lower.match(/^::ffff:([0-9.]+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

function isPrivate(ip) {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true; // refuse what we cannot classify
}

export class SsrfError extends Error {
  constructor(message) { super(message); this.name = 'SsrfError'; }
}

/**
 * Resolve a URL's hostname and refuse private / loopback / metadata IPs.
 * Accepts http:// for localhost only; all other hosts must be https.
 * Returns the validated URL string on success.
 */
export async function assertSafeUrl(rawUrl, { allowHttpLocalhost = false } = {}) {
  let parsed;
  try { parsed = new URL(rawUrl); }
  catch { throw new SsrfError(`Invalid URL: ${rawUrl}`); }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new SsrfError(`Unsupported protocol: ${parsed.protocol}`);
  }

  const host = parsed.hostname;
  const isLocalhostName = host === 'localhost' || host === 'localhost.localdomain';

  if (parsed.protocol === 'http:' && !(allowHttpLocalhost && isLocalhostName)) {
    throw new SsrfError(`Refusing plain http to non-localhost host: ${host}`);
  }

  // Literal IP case
  if (net.isIP(host)) {
    if (isPrivate(host) && !allowHttpLocalhost) {
      throw new SsrfError(`Refusing request to private/loopback IP: ${host}`);
    }
    return parsed.toString();
  }

  // DNS resolution — refuse DNS-rebinding style attacks where a public
  // hostname resolves to a private address
  const addrs = await dns.lookup(host, { all: true, verbatim: true });
  if (!addrs.length) throw new SsrfError(`DNS lookup returned no addresses for: ${host}`);
  for (const { address } of addrs) {
    if (isPrivate(address) && !(allowHttpLocalhost && isLocalhostName)) {
      throw new SsrfError(`Hostname ${host} resolves to private/loopback IP: ${address}`);
    }
  }
  return parsed.toString();
}

/**
 * Fetch wrapper that (1) validates URL against SSRF rules, (2) caps response
 * body by byte count, (3) enforces a hard timeout. Returns parsed JSON.
 */
export async function safeFetchJson(url, { method = 'GET', headers = {}, body, timeoutMs = 5000, maxResponseBytes = 10 * 1024 * 1024, allowHttpLocalhost = false } = {}) {
  await assertSafeUrl(url, { allowHttpLocalhost });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { method, headers, body, signal: controller.signal, redirect: 'error' });
    if (!res.ok) {
      const snippet = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${snippet.slice(0, 200)}`);
    }

    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > maxResponseBytes) {
      throw new Error(`Response content-length ${declared} exceeds cap ${maxResponseBytes}`);
    }

    const reader = res.body?.getReader();
    if (!reader) return {};
    const chunks = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maxResponseBytes) {
        try { reader.cancel(); } catch { /* noop */ }
        throw new Error(`Response exceeded cap ${maxResponseBytes} bytes`);
      }
      chunks.push(value);
    }
    const buf = Buffer.concat(chunks.map(c => Buffer.from(c)));
    if (!buf.length) return {};
    return JSON.parse(buf.toString('utf8'));
  } finally {
    clearTimeout(timer);
  }
}
