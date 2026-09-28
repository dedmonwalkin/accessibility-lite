# Reading bar preview

Branch: `asexibility`. Experimental reading controls; not a compliance product or
a third-party embed release. Owner authorized commit, push and service-site
deployment September 27, 2026. Deployment outcome is recorded in the private
project-home handoff.

The service-only site has six explicitly marked public reading sections. Only
local English speech voices are offered. Playback is user-initiated. The current
passage is visible but is not a live region; playback status is a separate polite
status region. The original media UI is not given this reading bar.

## Verified September 27, 2026

- 150 Node tests pass, including ten reading-bar tests.
- Service container smoke passed on linux/amd64, non-root, read-only and without
  external networking: toolbar, fonts, health, CSP and blocked media routes.
- Strict Fly service configuration validation passed.
- In-app browser: direct pointer input opens Listen. Semantic automation clicks
  did not activate it; do not confuse this with direct pointer verification.
- Keyboard: start, pause, restart, stop; Stop returns focus to Read section.
- Accessible control names, expanded state, voice options, paused status and
  visible passage were inspected in the browser accessibility tree.
- No browser warnings/errors observed. This is not a VoiceOver listening test.
- Initial layout checks: no measured horizontal overflow at 1280px and at 320px
  with maximum built-in text size. These are not browser-zoom conformance tests.

## Remaining manual checks

1. In Safari and Chrome with VoiceOver running, reach Listen, choose a section
   and voice, play/pause/resume/stop, then close the panel using Escape from a
   playback button. Verify names, order, focus and no unwanted repeated speech.
2. Listen to a full section with each supported device/browser combination.
   Check pauses between sentences, pronunciation, restart after pause, natural
   completion, and changing the section or voice while reading.
3. Test actual browser zoom at 200% and 400%, forced colors, increased contrast,
   reduced transparency, and measured contrast for glass surfaces in both themes.
4. Test unavailable speech/voices, delayed voice arrival and denied local storage
   in real browsers. Unit harnesses do not substitute for platform tests.
5. Confirm controls do not interfere with the user's screen reader. Obtain
   feedback from disabled users before distributing an embeddable version.

Chrome was not available through the connected browser tools for this pass.
The voice list and speech events come from the device; audio quality has not
been independently verified. No cloud voice fallback, tracking, or microphone
access was added. Third-party integration still requires a separate review of
content scoping, styling, privacy, host-page behavior and compatibility.
