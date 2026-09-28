# Working Access personal reading companion

An experimental browser extension, separate from the consulting website and its
embedded toolbar. Same goal and design language, different user: a person who
wants a comfortable reading view on a supported webpage. No audits, scores,
compliance claims, automatic repair, screenshot capture, or OCR.

## Try the interaction demo

Run `npm run preview:extension` from the application root. Open
http://127.0.0.1:4320/ and choose **Open Working Access reading view**.
The fixture links cover an article, fictional service instructions, and
unsupported content. Demo preferences persist only in memory for that page.
This uses the same reader and extractor as the extension, but is not an
installed-extension test.

## Build an unpacked extension

Run `npm run build:extension`. The generated `extension/dist/` directory contains
the Manifest V3 package, background worker, styles and reader code. Generated
files are ignored by Git. No additional dependencies or network build step.
The speech chunking utility is reused from the website toolbar.

When the owner is ready to install locally, open Chrome's extensions page,
enable developer mode, choose **Load unpacked**, and select `extension/dist/`.
Pin the extension, open a regular HTTP(S) article, then click its action.
Click again, choose **Back to page**, or press Escape to close it.
Installation and browser settings were not changed by the prototype work.
Store publication, Safari/Firefox packaging, and managed-browser distribution
are not implemented.

## Features and boundaries

- Appearance preferences apply only to the reading dialog: size, serif/sans,
  spacing, system/light/dark theme, solid surface, reset.
- Page headings group visible prose into a section picker. A non-collapsed text
  selection limits extraction to the paragraphs it touches, not exact characters.
- Only local voices matching the declared page language are offered. If the page
  has no language declaration, the prototype tries English. Voices are supplied
  by the device, not by Working Access. Speech is user-initiated.
- Pause/resume/stop, paragraph highlighting, and closing cancel pending playback.
  Highlighting does not move focus or automatically scroll the page.
- Only appearance/speed preferences are saved in `chrome.storage.local`.
  No page text, URL, browsing history, account, analytics or cloud speech upload
  is stored/sent by the extension. Normal source-page network activity continues.
- Forms, editable regions, navigation, sidebars, hidden content, images, canvas,
  embedded frames and shadow-root page content are not copied into the view.
  Links become plain text. Return to the page for links, forms and transactions.
- This is a heuristic text snapshot, not a complete or authoritative page copy.
  Pages over the 60,000-character output budget or 5,000 block scan limit are
  marked shortened. Complex apps, tables, PDFs, image text and mixed-language
  passages may be unsupported or incomplete. No paywall/authentication bypass.

## Permission model

`activeTab`, `scripting`, and `storage` only. The action injects bundled code into
the clicked tab's top frame. There are no broad host permissions, automatic
content scripts, microphone permissions, or external message endpoints.
Restricted browser/store pages report unavailability through the action title
and badge. No automatic request for broader permissions.

The injected UI uses an open shadow root for style isolation and inspectability,
not as a security boundary against the host page. The extraction and text-only
rendering must be reviewed again before handling sensitive workflows or broad
distribution. Browser speech queues may interact with other page speech.

Primary implementation references:
- https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
- https://developer.chrome.com/docs/extensions/reference/api/scripting
- https://developer.chrome.com/docs/extensions/reference/api/storage

## Verification and next gates

September 27 prototype checks:
- Full application suite: 160 tests pass, including ten extension tests. Git
  whitespace checks pass. No browser console warnings/errors observed in the demo.
- Unit coverage for restricted-page handling, permission scope, preference
  allowlists, ordered section grouping, extraction caps, form/hidden exclusion,
  selection isolation and palette contrast. DOM extraction unit tests use stubs;
  they are not a replacement for browser fixtures or assistive-technology tests.
- Bundled script syntax check and successful unpacked package build.
- In-app browser fixtures: all article sections exclude the sentinel form,
  hidden and sidebar strings; service list items survive; empty state disables
  playback and explains the unsupported content.
- Keyboard open, settings, section selection, playback/pause/resume/stop, Escape
  and focus return verified. Same-page preference retention verified in the demo.
- At 320px with large text and extra spacing, measured dialog width equals its
  scroll width: no measured horizontal overflow. Desktop appearance inspected.

Outstanding: actual extension install/action/service-worker/storage lifecycle,
Chrome/Edge compatibility, third-party CSP and DOM interference, VoiceOver/NVDA,
audio quality, device voices, selected-text browser interactions, browser zoom,
forced colors/reduced transparency, and disabled-user feedback. No claims of
accessibility conformance or broad website compatibility are made.
