export function openReader({extract, normalize, chunkText, css, load, save, onClose = () => {}}) {
  const snapshot = extract(document);
  const previousFocus = document.activeElement;
  const host = document.createElement('div');
  host.setAttribute('data-working-access-host', '');
  const shadow = host.attachShadow({mode: 'open'});
  const style = document.createElement('style');
  style.textContent = css;
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-labelledby', 'reader-title');
  // Template contains no page-derived HTML. Extracted content is textContent only.
  dialog.innerHTML = `<div class="shell">
    <div class="brand-row"><div class="identity"><span class="orb" aria-hidden="true"></span><div><strong>Working Access</strong><small>Your page. Your pace.</small></div></div><button id="close">Back to page</button></div>
    <p class="eyebrow">Personal reading view / Preview</p><h1 id="reader-title"></h1>
    <div class="glass"><div class="controls" aria-label="Reading appearance" role="group">
      <button id="size">Text: comfortable</button><button id="font">Font: serif</button><button id="spacing" aria-pressed="false">Extra spacing</button>
      <button id="theme">Theme: system</button><button id="solid" aria-pressed="false">Solid surface</button><button id="reset">Reset</button>
    </div><div class="fields">
      <label>Section<select id="section"></select></label><label>Local device voice<select id="voice" aria-describedby="privacy"></select></label>
      <label>Speed<select id="rate"><option value="0.8">Slower</option><option value="1">Normal</option><option value="1.2">Faster</option></select></label>
    </div><div class="controls"><button id="play" class="primary" disabled>Listen to section</button><button id="pause" disabled>Pause</button><button id="stop" disabled>Stop</button></div>
    <p class="status" id="status" role="status" aria-atomic="true"></p></div>
    <p class="notice" id="scope"></p><div class="reading" id="reading" tabindex="-1"></div>
    <div class="bottom"><p class="notice" id="privacy">Local-device voices only. No audio starts automatically.</p><p class="notice">A reading companion, not an audit or website repair.</p></div>
    <p class="notice" id="storage-status" role="status"></p>
  </div>`;
  shadow.append(style, dialog);
  document.documentElement.append(host);
  const $ = id => shadow.getElementById(id);
  $('reader-title').textContent = snapshot.title;
  $('scope').textContent = (snapshot.selection ? 'Reading the paragraphs touched by your selection. ' : 'A text-only snapshot. Forms, navigation, images and embedded content are not included. ') +
    (snapshot.truncated ? 'This long page was shortened for the preview. ' : '') + 'Return to the original page for links and transactions.';
  const preferences = normalize({});
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  let changed = false;
  let closed = false;
  let saveQueue = Promise.resolve();
  let voices = [];
  let active = false;
  let paused = false;
  let token = 0;
  let pending = null;
  let utterance = null;
  const synth = window.speechSynthesis;
  const contentNodes = [];

  function paint() {
    dialog.dataset.dark = String(preferences.theme === 'dark' || (preferences.theme === 'system' && systemTheme.matches));
    dialog.dataset.solid = String(preferences.solid);
    dialog.style.setProperty('--text-size', preferences.size + 'px');
    dialog.style.setProperty('--reading-font', preferences.font === 'serif' ? "Georgia, 'Times New Roman', serif" : "'Atkinson Hyperlegible', Verdana, sans-serif");
    dialog.style.setProperty('--leading', preferences.spacing === 'wide' ? '2.1' : '1.8');
    dialog.style.setProperty('--tracking', preferences.spacing === 'wide' ? '.04em' : 'normal');
    $('size').textContent = 'Text: ' + ({18: 'standard', 22: 'comfortable', 26: 'large'})[preferences.size];
    $('font').textContent = 'Font: ' + preferences.font;
    $('theme').textContent = 'Theme: ' + preferences.theme;
    $('spacing').setAttribute('aria-pressed', String(preferences.spacing === 'wide'));
    $('solid').setAttribute('aria-pressed', String(preferences.solid));
    $('rate').value = String(preferences.rate);
  }
  function remember() {
    changed = true;
    paint();
    const value = normalize(preferences);
    saveQueue = saveQueue.then(() => save(value)).then(() => {
      if (!closed) $('storage-status').textContent = '';
    }).catch(() => {
      if (!closed) $('storage-status').textContent = 'Preferences could not be saved. They still work in this reading view.';
    });
  }
  function cancel(message = 'Stopped.') {
    token++;
    if (active && synth) { synth.cancel(); if (paused) synth.resume(); }
    active = paused = false;
    pending = utterance = null;
    if ([$('pause'), $('stop')].includes(shadow.activeElement)) $('play').focus();
    $('pause').disabled = $('stop').disabled = true;
    $('pause').textContent = 'Pause';
    $('play').textContent = 'Listen to section';
    contentNodes.forEach(node => node.removeAttribute('data-current'));
    $('status').textContent = message;
  }
  function renderSection() {
    cancel('Section selected.');
    const section = snapshot.sections[Number($('section').value)];
    const reading = $('reading');
    reading.replaceChildren();
    contentNodes.length = 0;
    if (!section) {
      const message = document.createElement('p');
      message.className = 'empty';
      message.textContent = 'No readable passages found. Try an article page or select visible paragraphs first. This preview cannot read images, PDFs, embedded frames or interactive apps reliably.';
      reading.append(message);
    } else {
      const title = document.createElement('h2');
      title.textContent = section.title;
      reading.append(title);
      section.paragraphs.forEach(text => {
        const p = document.createElement('p');
        p.textContent = text;
        contentNodes.push(p);
        reading.append(p);
      });
    }
  }
  function refreshVoices() {
    const previous = $('voice').value;
    const language = snapshot.language.toLowerCase().split('-')[0];
    voices = synth ? synth.getVoices().filter(voice => voice.localService && voice.lang.toLowerCase().split('-')[0] === language) : [];
    $('voice').replaceChildren();
    voices.forEach((voice, index) => $('voice').add(new Option(voice.name + ' / ' + voice.lang, String(index))));
    if (/^\d+$/.test(previous) && Number(previous) < voices.length) $('voice').value = previous;
    $('play').disabled = !voices.length || !snapshot.sections.length;
    if (!active) $('status').textContent = !synth ? 'Read-aloud is unavailable in this browser. Reading preferences still work.' : !voices.length ? 'No local voice for this page language. Remote voices are not used.' : !snapshot.sections.length ? 'No readable passages found.' : 'Ready when you are. Choose Listen to section.';
  }
  snapshot.sections.forEach((section, index) => $('section').add(new Option(section.title, String(index))));
  const firstPassage = snapshot.sections.findIndex(section => section.paragraphs.join(' ').length >= 80);
  if (firstPassage >= 0) $('section').value = String(firstPassage);
  $('section').disabled = !snapshot.sections.length;
  $('section').addEventListener('change', () => { renderSection(); refreshVoices(); });
  $('voice').addEventListener('change', () => cancel('Voice changed. Press Listen to section.'));
  $('rate').addEventListener('change', () => { cancel('Speed changed. Press Listen to section.'); preferences.rate = Number($('rate').value); remember(); });
  $('play').addEventListener('click', () => {
    cancel();
    const voice = voices[Number($('voice').value)];
    const section = snapshot.sections[Number($('section').value)];
    if (!voice || !section || !synth) return;
    const queue = [{text: section.title, paragraph: -1}, ...section.paragraphs.flatMap((text, paragraph) => chunkText(text).map(chunk => ({text: chunk, paragraph})))];
    const generation = token;
    let index = 0;
    active = true;
    $('pause').disabled = $('stop').disabled = false;
    $('play').textContent = 'Restart section';
    $('status').textContent = 'Reading: ' + section.title;
    function next() {
      if (generation !== token || closed) return;
      if (paused) { pending = next; return; }
      if (index >= queue.length) { cancel('Section finished.'); return; }
      const chunk = queue[index++];
      contentNodes.forEach((node, position) => { if (position === chunk.paragraph) node.setAttribute('data-current', 'true'); else node.removeAttribute('data-current'); });
      utterance = new SpeechSynthesisUtterance(chunk.text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = preferences.rate;
      utterance.onend = next;
      utterance.onerror = () => { if (generation === token) cancel('Playback stopped. Try another local voice.'); };
      try { synth.speak(utterance); } catch { cancel('Playback is unavailable.'); }
    }
    next();
  });
  $('pause').addEventListener('click', () => {
    if (!active) return;
    paused = !paused;
    if (paused) synth.pause(); else { synth.resume(); if (pending) { const next = pending; pending = null; next(); } }
    if (!active) return;
    $('pause').textContent = paused ? 'Resume' : 'Pause';
    $('status').textContent = paused ? 'Paused.' : 'Reading resumed.';
  });
  $('stop').addEventListener('click', () => cancel());
  $('size').addEventListener('click', () => { preferences.size = {18: 22, 22: 26, 26: 18}[preferences.size]; remember(); });
  $('font').addEventListener('click', () => { preferences.font = preferences.font === 'serif' ? 'sans' : 'serif'; remember(); });
  $('spacing').addEventListener('click', () => { preferences.spacing = preferences.spacing === 'wide' ? 'normal' : 'wide'; remember(); });
  $('theme').addEventListener('click', () => { preferences.theme = {system: 'light', light: 'dark', dark: 'system'}[preferences.theme]; remember(); });
  $('solid').addEventListener('click', () => { preferences.solid = !preferences.solid; remember(); });
  $('reset').addEventListener('click', () => { cancel('Reading preferences reset.'); Object.assign(preferences, normalize({})); remember(); });
  function close() {
    if (closed) return;
    closed = true;
    cancel();
    if (synth) synth.removeEventListener('voiceschanged', refreshVoices);
    systemTheme.removeEventListener('change', paint);
    window.removeEventListener('pagehide', close);
    dialog.close();
    host.remove();
    if (previousFocus?.isConnected) previousFocus.focus({preventScroll: true});
    onClose();
  }
  $('close').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  systemTheme.addEventListener('change', paint);
  window.addEventListener('pagehide', close);
  if (synth) synth.addEventListener('voiceschanged', refreshVoices);
  renderSection();
  refreshVoices();
  paint();
  try { dialog.showModal(); $('close').focus(); } catch (error) { close(); throw error; }
  Promise.resolve().then(load).then(value => { if (!closed && !changed) { Object.assign(preferences, normalize(value)); paint(); } }).catch(() => {
    if (!closed) $('storage-status').textContent = 'Saved preferences unavailable. Using defaults for this view.';
  });
  return close;
}
