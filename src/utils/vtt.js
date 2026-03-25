function formatTimecode(iso) {
  const date = new Date(iso);
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

export function formatTimecodeFromMs(totalMs) {
  const hh = String(Math.floor(totalMs / 3600000)).padStart(2, '0');
  const mm = String(Math.floor((totalMs % 3600000) / 60000)).padStart(2, '0');
  const ss = String(Math.floor((totalMs % 60000) / 1000)).padStart(2, '0');
  const ms = String(totalMs % 1000).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

function escapeXml(input) {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function formatVtt(captions) {
  const rows = ['WEBVTT', ''];
  for (const c of captions) {
    const start = typeof c.start === 'string' && c.start.includes('T')
      ? formatTimecode(c.start) : formatTimecodeFromMs(c.start_ms || 0);
    const end = typeof c.end === 'string' && c.end.includes('T')
      ? formatTimecode(c.end) : formatTimecodeFromMs(c.end_ms || 0);
    rows.push(`${start} --> ${end}`);
    rows.push(c.text);
    rows.push('');
  }
  return rows.join('\n');
}

export function formatTtml(captions) {
  const body = captions
    .map((c) => {
      const start = typeof c.start === 'string' && c.start.includes('T')
        ? formatTimecode(c.start) : formatTimecodeFromMs(c.start_ms || 0);
      const end = typeof c.end === 'string' && c.end.includes('T')
        ? formatTimecode(c.end) : formatTimecodeFromMs(c.end_ms || 0);
      return `<p begin="${start}" end="${end}"><span>${escapeXml(c.text)}</span></p>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><tt xmlns="http://www.w3.org/ns/ttml"><body><div>${body}</div></body></tt>`;
}
