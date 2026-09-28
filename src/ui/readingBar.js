export const READING_BAR_HTML = `
<section class="reading-bar" aria-label="Reading preferences" id="readingBar" hidden>
  <div class="reading-bar-top">
    <div class="reading-brand"><span class="reading-orb" aria-hidden="true"></span><div><strong>Your page. Your pace.</strong><small>Reading tools / Preview</small></div></div>
    <div class="reading-actions">
      <button type="button" class="pref-btn" id="listenToggle" aria-expanded="false" aria-controls="listenPanel">Listen</button>
      <button type="button" class="pref-btn" id="textSizeToggle" aria-label="Change text size">A</button>
      <button type="button" class="pref-btn" id="themeToggle" aria-label="Switch theme">Dark</button>
      <button type="button" class="pref-btn" id="solidToggle" aria-pressed="false">Solid surface</button>
      <button type="button" class="pref-btn" id="readingReset">Reset</button>
    </div>
  </div>
  <div id="listenPanel" class="listen-panel" hidden>
    <p class="reading-intro">A little room to listen.</p>
    <p id="listenPrivacy">Reads public page text using a local device voice. No microphone needed. This is a reading aid, not a screen reader.</p>
    <div class="listen-fields">
      <label>Section<select id="readingSection"></select></label>
      <label>Device voice<select id="readingVoice" aria-describedby="listenPrivacy"></select></label>
      <label>Speed<select id="readingSpeed"><option value="0.8">Slower</option><option value="1" selected>Normal</option><option value="1.2">Faster</option></select></label>
    </div>
    <div class="reading-actions">
      <button type="button" class="pref-btn" id="readingPlay" disabled>Read section</button>
      <button type="button" class="pref-btn" id="readingPause" disabled>Pause</button>
      <button type="button" class="pref-btn" id="readingStop" disabled>Stop</button>
    </div>
    <p id="readingStatus" role="status" aria-atomic="true">Checking for local voices...</p>
    <div class="reading-passage" id="readingPassage" hidden aria-live="off"><span>Now reading</span><p id="readingPassageText"></p></div>
  </div>
</section>`;

export const READING_BAR_STYLES = `
  .reading-bar[hidden], .listen-panel[hidden] { display: none; }
  .reading-bar { width: 100%; padding: 1rem; border: 1px solid var(--border); border-radius: 1.75rem;
    color: var(--ink); background: var(--surface);
    background: linear-gradient(125deg, color-mix(in srgb, var(--surface) 94%, white), color-mix(in srgb, var(--surface) 86%, transparent));
    backdrop-filter: blur(20px) saturate(120%); -webkit-backdrop-filter: blur(20px) saturate(120%);
    box-shadow: inset 0 1px 0 #ffffff60, 0 10px 32px #102b2212; }
  .reading-bar-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
  .reading-brand { display: flex; align-items: center; gap: .8rem; }
  .reading-brand strong { font-size: 1rem; }
  .reading-brand small { display: block; font-size: .75rem; color: var(--ink-muted); margin-top: .2rem; }
  .reading-orb { width: 2.25rem; height: 2.25rem; flex: 0 0 auto; border-radius: 50%;
    background: radial-gradient(circle at 30% 25%, #fff9, transparent 48%), conic-gradient(#477565, #a9cbbd, #c39777, #477565);
    box-shadow: inset 0 0 0 1px #fff6, inset -3px -4px 8px #173d4838; }
  .reading-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
  .reading-bar .pref-btn { border-radius: 999px; padding: .65rem 1rem; min-height: 44px; background: var(--surface); font-size: .875rem; }
  .reading-bar .pref-btn[aria-expanded="true"], .reading-bar .pref-btn[aria-pressed="true"] { background: var(--accent); color: var(--on-accent); }
  .reading-bar .pref-btn:disabled { cursor: not-allowed; opacity: .65; }
  .reading-bar :focus-visible { outline: 3px solid var(--accent); outline-offset: 4px; }
  .listen-panel { margin-top: 1rem; border-top: 1px solid var(--border); padding: 1rem .25rem .25rem; }
  .listen-panel p { max-width: 70ch; font-size: .875rem; }
  .listen-panel .reading-intro { font-size: 1.5rem; margin: 0 0 .5rem; }
  .listen-fields { display: grid; grid-template-columns: 2fr 2fr 1fr; gap: 1rem; margin-bottom: 1rem; }
  .listen-fields label { margin: 0; min-width: 0; }
  .listen-fields select { width: 100%; min-width: 0; font-size: 1rem; }
  .reading-passage { background: var(--surface); border-left: 3px solid var(--accent); padding: 1rem; border-radius: .25rem .75rem .75rem .25rem; }
  .reading-passage[hidden] { display: none; }
  .reading-passage span { font-size: .75rem; font-weight: 700; color: var(--ink-muted); }
  .reading-passage p { font-size: 1rem; line-height: 1.7; margin: .5rem 0 0; }
  .reading-bar[data-solid="true"] { background: var(--surface); backdrop-filter: none; -webkit-backdrop-filter: none; box-shadow: none; }
  @media (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active) {
    .reading-bar { background: var(--surface); backdrop-filter: none; -webkit-backdrop-filter: none; box-shadow: none; }
    .reading-orb { background: var(--accent); border: 1px solid currentColor; }
  }
  @media (max-width: 640px) { .listen-fields { grid-template-columns: 1fr; } .reading-bar { border-radius: 1.25rem; } }
  @media print { .reading-bar { display: none; } }
`;

// Only opt-in public prose is read; interactive and hidden descendants are excluded.
export function readableText(section) {
  return [...section.querySelectorAll('h1,h2,h3,p,li,dt,dd')]
    .filter(node => !node.closest('[hidden],[aria-hidden="true"],form,[contenteditable],nav,button'))
    .filter(node => node.getClientRects().length > 0)
    .filter(node => !node.parentElement.closest('p,li,dt,dd'))
    .map(node => {
      const copy = node.cloneNode(true);
      copy.querySelectorAll('br').forEach(child => child.replaceWith(' '));
      copy.querySelectorAll('input,textarea,select,button,script,style,[hidden],[aria-hidden="true"],[contenteditable]').forEach(child => child.remove());
      return copy.textContent.replace(/\s+/g, ' ').trim();
    }).filter(Boolean).join('. ');
}

export function speechChunks(text, limit = 220) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chunks = [];
  let current = '';
  for (const word of words) {
    if (current && (current.length + word.length + 1 > limit || /[.!?]$/.test(current))) {
      chunks.push(current);
      current = '';
    }
    current += (current ? ' ' : '') + word;
  }
  if (current) chunks.push(current);
  return chunks;
}

export function mountReadingBar(extractText, chunkText) {
  const byId = id => document.getElementById(id);
  const bar = byId('readingBar');
  if (!bar) return;
  bar.hidden = false;
  const panel = byId('listenPanel');
  const toggle = byId('listenToggle');
  const solid = byId('solidToggle');
  const sectionPicker = byId('readingSection');
  const voicePicker = byId('readingVoice');
  const speed = byId('readingSpeed');
  const play = byId('readingPlay');
  const pause = byId('readingPause');
  const stop = byId('readingStop');
  const status = byId('readingStatus');
  const passage = byId('readingPassage');
  const passageText = byId('readingPassageText');
  const synth = window.speechSynthesis;
  let voices = [];
  let active = false;
  let paused = false;
  let generation = 0;
  let utterance;
  let pendingNext = null;
  const sections = [...document.querySelectorAll('#main [data-reading-section]')];
  sections.forEach((section, index) => {
    const heading = section.querySelector('h1,h2');
    sectionPicker.add(new Option(heading ? heading.innerText.replace(/\s+/g, ' ') : 'Section ' + (index + 1), String(index)));
  });
  function surface(value) {
    bar.dataset.solid = String(value);
    solid.setAttribute('aria-pressed', String(value));
  }
  try { surface(localStorage.getItem('workingaccess-solid') === 'true'); } catch {}
  solid.addEventListener('click', () => {
    const value = bar.dataset.solid !== 'true';
    surface(value);
    try { localStorage.setItem('workingaccess-solid', String(value)); } catch {}
  });
  function cancel(message = 'Stopped.') {
    generation++;
    if (active && synth) {
      synth.cancel();
      // Some engines retain the paused state after canceling their queue.
      if (paused) synth.resume();
    }
    active = false;
    paused = false;
    utterance = null;
    pendingNext = null;
    passage.hidden = true;
    passageText.textContent = '';
    if ([pause, stop].includes(document.activeElement)) play.focus();
    pause.disabled = stop.disabled = true;
    play.textContent = 'Read section';
    pause.textContent = 'Pause';
    status.textContent = message;
  }
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    if (panel.hidden) cancel();
  });
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); cancel(); toggle.focus(); }
  });
  function updateVoices() {
    const previous = voicePicker.value;
    voices = synth ? synth.getVoices().filter(voice => voice.localService && /^en(?:-|$)/i.test(voice.lang)) : [];
    voicePicker.replaceChildren();
    voices.forEach(voice => voicePicker.add(new Option(voice.name + ' (' + voice.lang + ')', voice.voiceURI)));
    if (voices.some(voice => voice.voiceURI === previous)) voicePicker.value = previous;
    play.disabled = !voices.length || !sections.length;
    if (!active) status.textContent = !synth ? 'Read-aloud is not supported in this browser.' : !voices.length ? 'No local English voice available. Install a device voice or use your screen reader; remote voices are not used in this preview.' : !sections.length ? 'No reading sections on this page.' : 'Ready. Choose a section and press Read section.';
  }
  updateVoices();
  if (synth) synth.addEventListener('voiceschanged', updateVoices);
  play.addEventListener('click', () => {
    cancel();
    const voice = voices.find(item => item.voiceURI === voicePicker.value);
    const section = sections[Number(sectionPicker.value)];
    if (!voice || !section || !synth) return;
    const text = extractText(section);
    if (!text) { status.textContent = 'No readable text in this section.'; return; }
    const chunks = chunkText(text);
    const token = generation;
    let index = 0;
    active = true;
    pause.disabled = stop.disabled = false;
    play.textContent = 'Restart section';
    status.textContent = 'Reading: ' + sectionPicker.selectedOptions[0].textContent;
    function next() {
      if (token !== generation) return;
      if (paused) { pendingNext = next; return; }
      if (index >= chunks.length) { cancel('Section finished.'); return; }
      const chunk = chunks[index++];
      utterance = new SpeechSynthesisUtterance(chunk);
      passageText.textContent = chunk;
      passage.hidden = false;
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = Number(speed.value);
      utterance.onend = next;
      utterance.onerror = () => { if (token === generation) cancel('Playback could not continue. Try another local voice.'); };
      try { synth.speak(utterance); } catch { cancel('Playback is unavailable.'); }
    }
    next();
  });
  pause.addEventListener('click', () => {
    if (!active) return;
    paused = !paused;
    if (paused) synth.pause(); else {
      synth.resume();
      if (pendingNext) { const next = pendingNext; pendingNext = null; next(); }
    }
    if (!active) return;
    pause.textContent = paused ? 'Resume' : 'Pause';
    status.textContent = paused ? 'Paused.' : 'Reading resumed.';
  });
  stop.addEventListener('click', () => cancel());
  [sectionPicker, voicePicker, speed].forEach(control => control.addEventListener('change', () => cancel('Selection changed. Press Read section to start.')));
  window.addEventListener('pagehide', () => cancel());
  byId('readingReset').addEventListener('click', () => {
    cancel('Reading preferences reset.');
    surface(false);
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-text-size');
    try { ['inclusy-theme', 'inclusy-text-size', 'workingaccess-solid'].forEach(key => localStorage.removeItem(key)); } catch {}
    window.dispatchEvent(new Event('reading-preferences-reset'));
    speed.value = '1';
    sectionPicker.selectedIndex = 0;
    voicePicker.selectedIndex = 0;
  });
}

export const READING_BAR_SCRIPT = `(${mountReadingBar.toString()})(${readableText.toString()}, ${speechChunks.toString()});`;
