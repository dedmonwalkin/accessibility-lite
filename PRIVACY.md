# Privacy notice

Last updated: 2026-04-16

This notice describes how a deployment of Accessibility Lite handles personal data. This file is a template; the operator of the specific deployment you are using may publish their own version. Always check the `/privacy` page of the site you are actually using.

## Who is the controller

You are reading this from a self-hostable, open-source project. When you upload a file to a hosted deployment, the **operator of that deployment** is the data controller. The original authors of this project ([Isabella & Tan](https://github.com/dedmonwalkin)) are not controllers of any data you submit to a third-party deployment. The authors are controllers only of the data submitted directly to deployments we operate, if and when any exist.

## What we process and why

| Category | Purpose | Legal basis (GDPR) | Retention |
|---|---|---|---|
| Uploaded media (video/audio) | Transcription, description, caption generation | Contract / consent | Default 24 hours, then deleted |
| Transcripts & derived captions | Deliver the output you asked for | Contract / consent | Same as uploaded media |
| API key (if configured) | Authenticate requests | Contract / legitimate interests | Until revoked |
| Request IP | Rate limiting, abuse prevention | Legitimate interests | Rolling 60-second window in memory; not persisted |
| Audit log (operation, timestamp, job id) | Debugging, support | Legitimate interests | Same as job retention |
| Anonymous analytics (if operator enables) | Improve the product | Consent | 90 days |

**What we do not process:** We do not sell personal data. We do not transmit your media to advertising networks. We do not share your content with model vendors beyond the inference step you configured.

## Your rights

If you are in the EU / UK: you have the right to access, rectify, erase, restrict, port, and object. Contact the operator of the deployment you are using. If they do not respond, you can lodge a complaint with your data protection authority.

If you are in California: you have the right to know, delete, correct, and opt out of any sale or share. We do not sell or share in the CCPA sense.

## International transfers

A self-hosted deployment that runs entirely locally performs no international transfer of your data. A hosted deployment may. Any hosted deployment we offer will publish its transfer basis (Standard Contractual Clauses and a transfer impact assessment for EU transfers).

## Subprocessors

A standard self-hosted deployment has no subprocessors. A hosted deployment, if offered, will publish its subprocessor list here and notify users before adding new ones.

## Children

This service is not directed at children under 16. Do not upload media of children unless you have parental consent and a lawful basis for processing.

## Security

See [SECURITY.md](SECURITY.md) for our responsible-disclosure process and for the technical measures in place.

## Changes

Material changes are announced in the repository changelog with a minimum 30-day notice for the hosted tier.

## Contact

Open an issue at [github.com/dedmonwalkin/accessibility-lite](https://github.com/dedmonwalkin/accessibility-lite) for general questions. Use the contact in [SECURITY.md](SECURITY.md) for anything sensitive.
