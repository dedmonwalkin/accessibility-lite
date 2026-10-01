export const READING_BAR_HTML = `
<section class="reading-bar" aria-label="Reading preferences" id="readingBar" hidden>
  <div class="reading-bar-top">
    <div class="reading-brand"><span class="reading-orb" aria-hidden="true"></span><div><strong>Your page. Your pace.</strong><small>Reading tools / Preview</small></div></div>
    <p class="device-preferences" id="devicePreferences"></p>
  </div>
  <div class="reading-overview">
    <button type="button" class="pref-btn reading-disclosure" id="preferencesToggle" aria-expanded="false" aria-controls="readingControls" aria-describedby="readingSummary">Reading preferences<span aria-hidden="true">+</span></button>
    <p class="reading-summary" id="readingSummary"></p>
  </div>
  <div class="reading-controls" id="readingControls">
    <div class="reading-settings">
      <fieldset class="reading-choice"><legend>Text size</legend><div class="reading-segments">
        <label><input type="radio" name="readingTextSize" id="textNormal" value="normal" checked><span>Normal</span></label>
        <label><input type="radio" name="readingTextSize" id="textLarge" value="large"><span>Large</span></label>
        <label><input type="radio" name="readingTextSize" id="textLarger" value="xlarge"><span>Larger</span></label>
      </div></fieldset>
      <fieldset class="reading-choice"><legend>Theme</legend><div class="reading-segments">
        <label><input type="radio" name="readingTheme" id="themeDevice" value="device" checked><span>Device</span></label>
        <label><input type="radio" name="readingTheme" id="themeDark" value="dark"><span>Dark</span></label>
        <label><input type="radio" name="readingTheme" id="themeLight" value="light"><span>Light</span></label>
      </div></fieldset>
      <div class="reading-surface">
        <label class="reading-check"><input type="checkbox" id="solidToggle" aria-describedby="surfaceNote"><span>Reduce transparency</span></label>
        <small id="surfaceNote">A solid background for the reading bar.</small>
      </div>
      <div class="reading-actions reading-utilities">
        <button type="button" class="pref-btn" id="listenToggle" aria-expanded="false" aria-controls="listenPanel">Read aloud</button>
        <button type="button" class="pref-btn" id="readingReset">Reset preferences</button>
      </div>
    </div>
    <p class="reading-note">Optional reading tools. They don't replace an accessible website.</p>
  <div id="listenPanel" class="listen-panel" hidden>
    <p class="reading-intro">A little room to listen.</p>
    <p id="listenPrivacy">Reads public page text using a local device voice. No microphone needed. Press Escape to stop reading. This is a reading aid, not a screen reader.</p>
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
  </div>
</section>`;

export const READING_BAR_STYLES = `
  .reading-bar [hidden], .reading-bar[hidden] { display: none; }
  .reading-bar { width: 100%; padding: 1rem; border: 1px solid var(--border); border-radius: 1.75rem;
    color: var(--ink); background: var(--surface);
    background: linear-gradient(125deg, color-mix(in srgb, var(--surface) 94%, white), color-mix(in srgb, var(--surface) 86%, transparent));
    backdrop-filter: blur(20px) saturate(120%); -webkit-backdrop-filter: blur(20px) saturate(120%);
    box-shadow: inset 0 1px 0 #ffffff60, 0 10px 32px #102b2212; }
  .reading-bar-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem 1rem; }
  .reading-brand { display: flex; align-items: center; gap: .8rem; }
  .reading-brand strong { font-size: 1rem; }
  .reading-brand small { display: block; font-size: .75rem; color: var(--ink-muted); margin-top: .2rem; }
  .reading-bar .device-preferences { margin: 0; max-width: 48ch; font-size: .8125rem; color: var(--ink-muted); }
  .reading-overview { margin-top: .65rem; }
  .reading-bar .reading-summary { font-size: .8125rem; margin: 0; color: var(--ink-muted); }
  .reading-disclosure { display: none; }
  .reading-settings { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem 1.5rem; margin-top: 1rem; }
  .reading-bar .reading-choice { padding: 0; margin: 0; border: 0; min-width: 0; }
  .reading-choice legend { padding: 0; margin-bottom: .35rem; font-size: .8125rem; font-weight: 700; }
  .reading-segments { display: flex; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); padding: .2rem; }
  .reading-segments label { position: relative; margin: 0; font-weight: 400; cursor: pointer; }
  .reading-segments input { position: absolute; width: 1px; height: 1px; padding: 0; margin: 0; opacity: 0; }
  .reading-segments span { display: flex; align-items: center; justify-content: center; min-height: 44px; padding: .45rem .85rem; border-radius: 999px; font-size: .875rem; }
  .reading-segments input:checked + span { color: var(--on-accent); background: var(--accent); font-weight: 700; }
  .reading-segments input:focus-visible { outline: none; }
  .reading-segments input:focus-visible + span { outline: 3px solid var(--accent); outline-offset: 3px; }
  .reading-bar .reading-check { display: flex; align-items: center; gap: .5rem; margin: 0; min-height: 44px; font-size: .875rem; cursor: pointer; }
  .reading-check input { width: 1.1rem; height: 1.1rem; padding: 0; margin: 0; accent-color: var(--accent); flex: 0 0 auto; }
  .reading-surface small { display: block; color: var(--ink-muted); font-size: .75rem; max-width: 28ch; }
  .reading-utilities { margin-left: auto; }
  .reading-bar .reading-note { font-size: .8125rem; color: var(--ink-muted); margin: .85rem 0 0; }
  .reading-orb { width: 2.25rem; height: 2.25rem; flex: 0 0 auto; border-radius: 50%;
    background: radial-gradient(circle at 30% 25%, #fff9, transparent 48%), conic-gradient(#477565, #a9cbbd, #c39777, #477565);
    box-shadow: inset 0 0 0 1px #fff6, inset -3px -4px 8px #173d4838; }
  .reading-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
  .reading-bar .pref-btn { border-radius: 999px; padding: .65rem 1rem; min-height: 44px; background: var(--surface); font-size: .875rem; }
  .reading-bar .pref-btn[aria-expanded="true"] { background: var(--accent); color: var(--on-accent); }
  .reading-bar .pref-btn[aria-expanded="true"]:hover { color: var(--on-accent); }
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
  @media (forced-colors: active) {
    .reading-segments input:checked + span { color: HighlightText; background: Highlight; forced-color-adjust: none; }
    .reading-segments input:focus-visible + span { outline-color: Highlight; }
  }
  @media (max-width: 768px) {
    .listen-fields { grid-template-columns: 1fr; }
    .reading-bar { border-radius: 1.25rem; padding: .85rem; }
    .reading-bar-top { align-items: flex-start; }
    .reading-brand { gap: .6rem; }
    .reading-brand small { display: none; }
    .reading-orb { width: 1.75rem; height: 1.75rem; }
    .reading-bar .device-preferences { width: 100%; }
    .reading-overview { display: flex; flex-direction: column; gap: .4rem; }
    .reading-disclosure { display: flex; justify-content: space-between; align-items: center; gap: .75rem; width: 100%; }
    .reading-disclosure span { font-size: 1.25rem; line-height: 1; }
    .reading-settings { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    .reading-segments label { flex: 1; }
    .reading-segments span { padding-inline: .5rem; }
    .reading-utilities { margin-left: 0; }
  }
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
  const root = document.documentElement;
  const controls = byId('readingControls');
  const preferencesToggle = byId('preferencesToggle');
  const queries = {
    dark: window.matchMedia('(prefers-color-scheme: dark)'),
    motion: window.matchMedia('(prefers-reduced-motion: reduce)'),
    transparency: window.matchMedia('(prefers-reduced-transparency: reduce)'),
    contrast: window.matchMedia('(prefers-contrast: more)'),
    forced: window.matchMedia('(forced-colors: active)'),
    narrow: window.matchMedia('(max-width: 768px)')
  };
  const sizes = { normal: byId('textNormal'), large: byId('textLarge'), xlarge: byId('textLarger') };
  const themes = { device: byId('themeDevice'), dark: byId('themeDark'), light: byId('themeLight') };
  const sizeNames = { normal: 'Normal', large: 'Large', xlarge: 'Larger' };
  let solidPreference = false;
  let preferencesOpen = false;
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
  function paintPreferences() {
    const theme = root.getAttribute('data-theme') || 'device';
    const size = root.getAttribute('data-text-size') || 'normal';
    const deviceTheme = queries.dark.matches ? 'dark' : 'light';
    Object.entries(sizes).forEach(([value, input]) => { input.checked = value === size; });
    Object.entries(themes).forEach(([value, input]) => { input.checked = value === theme; });
    const following = [];
    if (theme === 'device') following.push(deviceTheme + ' theme');
    if (queries.motion.matches) following.push('reduced motion');
    if (queries.transparency.matches) following.push('reduced transparency');
    if (queries.contrast.matches) following.push('increased contrast');
    if (queries.forced.matches) following.push('system colours');
    byId('devicePreferences').textContent = following.length
      ? 'Following your device: ' + following.join(', ') + '.'
      : 'Theme: ' + sizeCase(theme) + ', your choice.';
    const themeSummary = theme === 'device' ? 'Device (' + deviceTheme + ')' : sizeCase(theme) + ' (your choice)';
    byId('readingSummary').textContent = 'Text: ' + sizeNames[size] + ' / Theme: ' + themeSummary;
    const required = queries.transparency.matches || queries.contrast.matches || queries.forced.matches;
    bar.dataset.solid = String(required || solidPreference);
    solid.checked = required || solidPreference;
    solid.disabled = required;
    byId('surfaceNote').textContent = required
      ? 'Following your device. A solid background is already applied.'
      : 'A solid background for the reading bar.';
  }
  function sizeCase(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
  try { solidPreference = localStorage.getItem('workingaccess-solid') === 'true'; } catch {}
  Object.entries(sizes).forEach(([value, input]) => input.addEventListener('change', () => {
    if (!input.checked) return;
    root.setAttribute('data-text-size', value);
    try { localStorage.setItem('inclusy-text-size', value); } catch {}
    paintPreferences();
  }));
  Object.entries(themes).forEach(([value, input]) => input.addEventListener('change', () => {
    if (!input.checked) return;
    if (value === 'device') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', value);
    try {
      if (value === 'device') localStorage.removeItem('inclusy-theme'); else localStorage.setItem('inclusy-theme', value);
    } catch {}
    paintPreferences();
  }));
  solid.addEventListener('change', () => {
    solidPreference = solid.checked;
    try { localStorage.setItem('workingaccess-solid', String(solidPreference)); } catch {}
    paintPreferences();
  });
  Object.values(queries).forEach(query => query.addEventListener('change', paintPreferences));
  paintPreferences();
  function paintDisclosure() {
    controls.hidden = queries.narrow.matches && !preferencesOpen;
    preferencesToggle.setAttribute('aria-expanded', String(!controls.hidden));
    preferencesToggle.querySelector('span').textContent = controls.hidden ? '+' : '-';
  }
  preferencesToggle.addEventListener('click', () => {
    preferencesOpen = !preferencesOpen;
    if (!preferencesOpen) {
      preferencesToggle.focus();
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      cancel();
    }
    paintDisclosure();
  });
  queries.narrow.addEventListener('change', () => {
    // Resizing must not hide the control someone is currently using.
    if (queries.narrow.matches && controls.contains(document.activeElement)) preferencesOpen = true;
    if (!queries.narrow.matches && document.activeElement === preferencesToggle) sizes[root.getAttribute('data-text-size') || 'normal'].focus();
    paintDisclosure();
  });
  paintDisclosure();
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
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (active) cancel();
    if (event.defaultPrevented) return;
    if (!panel.hidden && controls.contains(document.activeElement)) {
      toggle.focus();
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      event.preventDefault();
    } else if (queries.narrow.matches && preferencesOpen && controls.contains(document.activeElement)) {
      preferencesToggle.focus();
      preferencesOpen = false;
      paintDisclosure();
      event.preventDefault();
    }
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
    solidPreference = false;
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-text-size');
    try { ['inclusy-theme', 'inclusy-text-size', 'workingaccess-solid'].forEach(key => localStorage.removeItem(key)); } catch {}
    window.dispatchEvent(new Event('reading-preferences-reset'));
    paintPreferences();
    speed.value = '1';
    sectionPicker.selectedIndex = 0;
    voicePicker.selectedIndex = 0;
  });
}

export const READING_BAR_SCRIPT = `(${mountReadingBar.toString()})(${readableText.toString()}, ${speechChunks.toString()});`;
