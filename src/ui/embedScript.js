/**
 * The Whakauru plugin, served at /embed.js. Legacy data-inclusy attributes
 * remain supported so existing integrations are not broken by the rebrand.
 *
 * Hand-written, no build step, no dependencies. Two decisions drive the shape
 * of this file:
 *
 *   1. Cues are injected programmatically via addTextTrack + VTTCue rather than
 *      a <track src> pointing back here. A cross-origin <track> would require
 *      crossorigin="anonymous" on the host's <video>, which forces CORS on
 *      their media too and breaks any video on a CDN that doesn't send the
 *      headers. Programmatic cues need CORS only on our own endpoint.
 *
 *   2. The overlay lives in a shadow root. Host CSS can't reach in and break
 *      it, and its styles can't leak out and break the host page.
 *
 * It never throws into the host page: every failure path warns and no-ops.
 */
export function buildEmbedScript(baseUrl) {
  return `(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return warn('embed.js must be loaded with a normal <script> tag.');

  /**
   * The API lives wherever this script was served from — derived at runtime,
   * not baked in. A self-hosted instance must talk to itself, not phone home
   * to the public site. Falls back to the configured URL only if the script's
   * own src is unreadable.
   */
  var BASE = ${JSON.stringify(baseUrl)};
  try {
    if (script.src) BASE = new URL(script.src).origin;
  } catch (e) { /* keep the fallback */ }

  var cfg = {
    id: script.getAttribute('data-inclusy') || '',
    target: script.getAttribute('data-target') || '',
    lang: script.getAttribute('data-lang') || '',
    sign: script.getAttribute('data-sign') || 'on',
    ad: script.getAttribute('data-ad') || 'panel',
    theme: script.getAttribute('data-theme') || '',
    // Top by default: the bottom of the frame belongs to the caption line and
    // the native control bar, and the overlay must not sit on either.
    position: script.getAttribute('data-position') || 'top-right'
  };

  function warn(message) {
    if (window.console && console.warn) console.warn('[whakauru] ' + message);
  }

  if (!cfg.id) return warn('Missing data-inclusy="EMBED_ID" on the script tag.');

  function api(path) {
    return BASE + '/v1/embed/' + encodeURIComponent(cfg.id) + path;
  }

  function findVideo() {
    if (cfg.target) return document.querySelector(cfg.target);
    return document.querySelector('video');
  }

  /* ── Captions ────────────────────────────────────────────────── */

  function timeToSeconds(stamp) {
    var parts = stamp.trim().split(':');
    var seconds = 0;
    for (var i = 0; i < parts.length; i++) {
      seconds = seconds * 60 + parseFloat(parts[i].replace(',', '.'));
    }
    return seconds;
  }

  function parseVtt(text) {
    var cues = [];
    var blocks = text.replace(/\\r/g, '').split('\\n\\n');
    for (var i = 0; i < blocks.length; i++) {
      var lines = blocks[i].split('\\n').filter(Boolean);
      if (!lines.length) continue;
      var timingIndex = -1;
      for (var j = 0; j < lines.length; j++) {
        if (lines[j].indexOf('-->') !== -1) { timingIndex = j; break; }
      }
      if (timingIndex === -1) continue;
      var timing = lines[timingIndex].split('-->');
      var body = lines.slice(timingIndex + 1).join('\\n');
      if (!body) continue;
      cues.push({
        start: timeToSeconds(timing[0]),
        end: timeToSeconds(timing[1]),
        text: body
      });
    }
    return cues;
  }

  function attachCaptions(video, cues) {
    if (!cues.length) return;
    var Cue = window.VTTCue || window.TextTrackCue;
    if (!Cue) return warn('This browser has no VTTCue support; captions skipped.');

    var track = video.addTextTrack('captions', 'Whakauru captions', (cfg.lang || 'en').split('-')[0]);
    for (var i = 0; i < cues.length; i++) {
      try {
        track.addCue(new Cue(cues[i].start, cues[i].end, cues[i].text));
      } catch (e) { /* a malformed cue must not kill the rest */ }
    }
    track.mode = 'showing';
  }

  /* ── Overlay ─────────────────────────────────────────────────── */

  var OVERLAY_CSS = [
    ':host { all: initial; }',
    '.wrap { position: absolute; z-index: 2147483000; max-width: min(340px, 45%);',
    '  font-family: "Atkinson Hyperlegible", system-ui, sans-serif; font-size: 15px; line-height: 1.45;',
    '  display: flex; flex-direction: column; gap: 8px; pointer-events: none; }',
    '.wrap > * { pointer-events: auto; }',
    '.card { background: rgba(14, 17, 22, 0.92); color: #F2F5F9; border-radius: 10px; padding: 10px 12px; }',
    '.label { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #A7B0BD; margin-bottom: 4px; }',
    '.tokens { display: flex; flex-wrap: wrap; gap: 5px; }',
    '.token { background: #2A3140; color: #9FD2FF; padding: 3px 8px; border-radius: 5px; letter-spacing: 0.04em; font-weight: 700; font-size: 13px; }',
    '.bar { display: flex; gap: 6px; }',
    'button { font: inherit; font-size: 12px; font-weight: 700; cursor: pointer;',
    '  background: rgba(14, 17, 22, 0.92); color: #F2F5F9; border: 1px solid #616B7A; border-radius: 8px; padding: 4px 10px; }',
    'button[aria-pressed="true"] { background: #7CB8FF; color: #0E1116; border-color: #7CB8FF; }',
    'button:focus-visible { outline: 3px solid #7CB8FF; outline-offset: 2px; }',
    '.hidden { display: none; }',
    '@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }'
  ].join('\\n');

  function buildOverlay() {
    var host = document.createElement('div');
    host.setAttribute('data-inclusy-overlay', '');
    host.style.position = 'absolute';
    host.style.margin = '0';
    host.style.padding = '0';
    host.style.pointerEvents = 'none';

    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : null;
    if (!root) { warn('Shadow DOM unavailable; overlay skipped.'); return null; }

    var style = document.createElement('style');
    style.textContent = OVERLAY_CSS;

    var wrap = document.createElement('div');
    wrap.className = 'wrap';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Accessibility overlay');

    var bar = document.createElement('div');
    bar.className = 'bar';

    var signCard = document.createElement('div');
    signCard.className = 'card hidden';
    signCard.innerHTML = '<div class="label">Sign</div><div class="tokens"></div>';

    var adCard = document.createElement('div');
    adCard.className = 'card hidden';
    adCard.innerHTML = '<div class="label">Audio description</div><div class="ad-text" role="status" aria-live="polite"></div>';

    wrap.appendChild(bar);
    wrap.appendChild(signCard);
    wrap.appendChild(adCard);
    root.appendChild(style);
    root.appendChild(wrap);

    return { host: host, wrap: wrap, bar: bar, signCard: signCard, adCard: adCard };
  }

  function positionWrap(wrap, position) {
    var vertical = position.indexOf('top') === 0 ? 'top' : 'bottom';
    var horizontal = position.indexOf('left') !== -1 ? 'left' : 'right';
    wrap.style.position = 'absolute';
    wrap.style[horizontal] = '12px';
    wrap.style[vertical] = '12px';
    if (vertical === 'bottom') {
      /* Clear the control bar and the caption line, which both live down here.
         Cards stack upward so the newest content stays clear of the captions. */
      wrap.style.bottom = '92px';
      wrap.style.flexDirection = 'column-reverse';
    }
  }

  function toggleButton(label, pressed, onChange) {
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(pressed));
    button.addEventListener('click', function () {
      var next = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(next));
      onChange(next);
    });
    return button;
  }

  /* ── Boot ────────────────────────────────────────────────────── */

  function boot() {
    var video = findVideo();
    if (!video) return warn('No <video> found. Add data-target="#your-video" to the script tag.');

    fetch(api('/manifest.json'))
      .then(function (r) {
        if (!r.ok) throw new Error('manifest ' + r.status);
        return r.json();
      })
      .then(function (manifest) {
        var language = cfg.lang || manifest.default_language || 'en-US';

        fetch(api('/captions.vtt?language=' + encodeURIComponent(language)))
          .then(function (r) { return r.ok ? r.text() : ''; })
          .then(function (text) { if (text) attachCaptions(video, parseVtt(text)); })
          .catch(function (e) { warn('Captions unavailable: ' + e.message); });

        var wantsSign = cfg.sign !== 'off' && manifest.has_sign;
        var wantsAd = cfg.ad !== 'off' && manifest.has_audio_description;
        if (!wantsSign && !wantsAd) return;

        var overlay = buildOverlay();
        if (!overlay) return;

        /* Anchored to the video's own box, in document space, rather than to
           whatever element happens to be its parent — that could be <body>,
           and the overlay would float over the whole page. Nothing in the
           host's DOM structure or CSS is modified. */
        document.body.appendChild(overlay.host);

        function syncPosition() {
          var rect = video.getBoundingClientRect();
          overlay.host.style.display = rect.width > 0 ? 'block' : 'none';
          if (!rect.width) return;

          overlay.host.style.width = rect.width + 'px';
          overlay.host.style.height = rect.height + 'px';

          /* Park the host at its own origin and measure where that landed,
             then correct by the difference. The containing block for an
             absolutely positioned child of <body> is only <body> when <body>
             is itself positioned — otherwise it's the initial containing
             block. Measuring instead of assuming gets it right either way. */
          overlay.host.style.left = '0px';
          overlay.host.style.top = '0px';
          var origin = overlay.host.getBoundingClientRect();
          overlay.host.style.left = (rect.left - origin.left) + 'px';
          overlay.host.style.top = (rect.top - origin.top) + 'px';
        }

        syncPosition();
        positionWrap(overlay.wrap, cfg.position);

        if (window.ResizeObserver) {
          new ResizeObserver(syncPosition).observe(video);
        }
        window.addEventListener('resize', syncPosition);
        video.addEventListener('loadedmetadata', syncPosition);

        var signCues = [];
        var adCues = [];
        var signOn = wantsSign;
        var adOn = wantsAd;

        if (wantsSign) {
          overlay.bar.appendChild(toggleButton('Sign', true, function (on) {
            signOn = on;
            overlay.signCard.classList.toggle('hidden', !on);
          }));
          fetch(api('/sign-data.json'))
            .then(function (r) { return r.ok ? r.json() : { sign_script: [] }; })
            .then(function (data) { signCues = data.sign_script || []; })
            .catch(function (e) { warn('Sign data unavailable: ' + e.message); });
        }

        if (wantsAd) {
          overlay.bar.appendChild(toggleButton(cfg.ad === 'speak' ? 'Describe' : 'AD', true, function (on) {
            adOn = on;
            overlay.adCard.classList.toggle('hidden', !on);
            if (!on) cancelSpeech();
          }));
          fetch(api('/audio-description.json'))
            .then(function (r) { return r.ok ? r.json() : { segments: [] }; })
            .then(function (data) { adCues = data.segments || []; })
            .catch(function (e) { warn('Audio description unavailable: ' + e.message); });
        }

        /* Spoken AD: free, client-side, and it ducks the video rather than
           talking over it. */
        var spokenId = null;
        var duckedFrom = null;
        function cancelSpeech() {
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          if (duckedFrom !== null) { video.volume = duckedFrom; duckedFrom = null; }
          spokenId = null;
        }
        function speak(text, id) {
          if (cfg.ad !== 'speak' || !window.speechSynthesis || spokenId === id) return;
          spokenId = id;
          var utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = (cfg.lang || 'en-US');
          duckedFrom = video.volume;
          video.volume = Math.min(duckedFrom, 0.25);
          utterance.onend = utterance.onerror = function () {
            if (duckedFrom !== null) { video.volume = duckedFrom; duckedFrom = null; }
          };
          window.speechSynthesis.speak(utterance);
        }

        function msOf(segment, edge) {
          var direct = segment[edge + '_ms'];
          if (typeof direct === 'number') return direct;
          var raw = segment[edge];
          if (typeof raw === 'number') return raw;
          var parsed = Date.parse(raw);
          return isNaN(parsed) ? 0 : parsed;
        }

        function activeAt(list, ms) {
          for (var i = 0; i < list.length; i++) {
            if (ms >= msOf(list[i], 'start') && ms < msOf(list[i], 'end')) return list[i];
          }
          return null;
        }

        var lastSign = null;
        video.addEventListener('timeupdate', function () {
          var ms = video.currentTime * 1000;

          if (signOn) {
            var sign = activeAt(signCues, ms);
            if (sign !== lastSign) {
              lastSign = sign;
              var tokens = overlay.signCard.querySelector('.tokens');
              tokens.textContent = '';
              if (sign && sign.gloss_tokens) {
                sign.gloss_tokens.forEach(function (t) {
                  var span = document.createElement('span');
                  span.className = 'token';
                  span.textContent = t;
                  tokens.appendChild(span);
                });
              }
              overlay.signCard.classList.toggle('hidden', !sign);
            }
          }

          if (adOn) {
            var ad = activeAt(adCues, ms);
            var target = overlay.adCard.querySelector('.ad-text');
            var text = ad ? ad.text : '';
            if (target.textContent !== text) target.textContent = text;
            overlay.adCard.classList.toggle('hidden', !text);
            if (ad) speak(ad.text, msOf(ad, 'start'));
          }
        });

        video.addEventListener('seeking', cancelSpeech);
        video.addEventListener('pause', cancelSpeech);
      })
      .catch(function (e) {
        warn('Could not load embed ' + cfg.id + ': ' + e.message);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`;
}
