# Limitations

Accessibility Lite is an open-source draft-assist tool. It automates the parts of media accessibility where automation is useful today, and it is explicit about the parts where automation is not. Please read this document before relying on any output for legal compliance or for users who depend on the output.

## What it does well

- **Captions from clear speech.** When the default provider is swapped for [whisper.cpp](https://github.com/ggerganov/whisper.cpp) (or a comparable Whisper deployment), word-error rates are typically in the 5–10% range for clean English speech and degrade predictably with noise, accent, overlapping speakers, and domain-specific vocabulary. That is good enough to *seed* a human captioning workflow and, in low-stakes contexts, good enough as-is.
- **Format fidelity.** WebVTT and TTML outputs conform to the spec well enough for major media players, LMS systems, and broadcast delivery platforms.
- **Translation.** With DeepL or LibreTranslate wired up, caption translation quality matches the underlying service. It is not better and not worse.
- **Self-hosting.** The pipeline runs entirely offline against whisper.cpp + Ollama + LibreTranslate with no outbound network traffic — a requirement for many EU public-sector buyers.

## What is *draft-quality* and requires human review

### Audio Description ("AD Draft Assist")

Vision-language models can produce a first-pass description of what is visible on screen during dialogue gaps. That is not the same as writing an audio description that works for a blind audience.

- Timing is approximate. The model does not know when dialogue will resume, so descriptions frequently overrun and talk over returning speech.
- Tone, voice, and narrative choice (what to describe, what to omit) are the craft of professional describers. Model output reliably fails on these.
- Blind users surveyed in public studies (AMI, RNIB) consistently reject generic LLM-produced AD when it is presented as finished product.

**How to use the AD output:** as the first draft a sighted describer polishes in a tool like YouDescribe or a professional describer reviews in Amara. The UI labels these outputs as drafts and the JSON download includes a `requires_human_review: true` field.

### Transcript quality on hard audio

Whisper degrades sharply on: heavy accents the model has not seen, whispered or shouted speech, sustained background noise, music under dialogue, and speaker overlap. If your content includes these, expect meaningful manual correction. The captions endpoint does not guarantee WCAG "equivalent" quality on adversarial audio.

### Simplified captions

The `caption_style: "simplified"` mode truncates and compresses per-segment text. It is intended for readers who find verbatim text fast-moving. It is **not** a plain-language adaptation in the technical sense (CEFR A2, Easy Read, Leichte Sprache). Do not market it as such.

## What is **not in this release**

### Sign language

Earlier drafts of this project included a "sign language overlay" feature generated from gloss tokens. We have removed it from the public surface for v0.2.

Gloss is a written linguistic annotation; it is not a sign language. Signing avatars driven by gloss or by English text have been opposed by the [World Federation of the Deaf and WASLI since 2018](https://wfdeaf.org/news/resources/wfd-wasli-statement-use-signing-avatars/) and by NAD, BDA, and EUD. Shipping avatar overlays labelled as "ASL / AUSLAN / LIBRAS / HKSL" that are in fact word-for-word transliterations of English is not accessibility — it is inaccessible output presented as accessibility, and the Deaf community has been clear that it causes harm.

If we revisit sign language in a future version, it will be:

1. Led by Deaf signers and a Deaf-led organization.
2. Using human-signed video clips, not generated avatars.
3. Scoped to a small number of languages at a time, curated in partnership with that community.
4. Marketed honestly.

We will not ship avatar-based sign output before then. If you fork the project and add it back, please read the WFD statement first.

## Compliance note

Nothing in this repository is legal advice. Accessibility Lite can *help* you meet WCAG 2.2 A captions (Success Criterion 1.2.2) and AA audio description (Success Criterion 1.2.5) obligations when combined with appropriate human review. It does not by itself make a site or service conformant, and it does not produce outputs that should be labelled as "WCAG AA captions" without the review step for anything beyond the lowest-stakes content.

For EU buyers subject to EN 301 549 or the European Accessibility Act: use outputs as drafts and keep the human-in-the-loop step in your procurement requirement.

## Reporting problems with outputs

If an output is actively harmful — mistranscribed in a way that changes meaning, or describes a scene in a way that misleads a blind listener — please open an issue labelled `output-quality` with the input source (if you can share it) and the output. These reports directly inform provider configuration defaults.
