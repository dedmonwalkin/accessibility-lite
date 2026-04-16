# Cookie policy

Last updated: 2026-04-16

## Short version

At the time of this writing, **self-hosted Accessibility Lite sets no cookies by default**. The pages served by this server do not set tracking cookies, analytics cookies, or advertising cookies. The only time you will ever see a cookie from this service is if the operator of a deployment explicitly enables one of the categories below.

## Full version

### What a cookie is, in one sentence

A cookie is a small piece of text your browser stores on behalf of a site and sends back on future requests to that site. It is the mechanism behind sign-in, shopping carts, and a great deal of tracking.

### Cookies this service may set

The only cookies a standard deployment of this service should ever set are in the first two categories below. Anything else is the decision of whoever is operating your particular deployment.

1. **Strictly necessary (no consent required, cannot be disabled).**
   - `session` — HttpOnly, Secure, SameSite=Lax. Keeps a signed-in operator signed in across requests. Only set after authentication. **Not present in the public open-source release; will appear when user accounts ship.**
   - `csrf` — Protects state-changing HTML forms against cross-site request forgery. Paired with a matching header on submission. **Not present in the current release.**

2. **Functional (opt-in).**
   - `ui_prefs` — Remembers your player UI choices (caption font size, high-contrast mode, preferred language). Not sent to any third party. Can be cleared from the player page.

3. **Analytics (opt-in, off by default).**
   - If and only if the operator enables analytics, an anonymous identifier may be set with a 90-day lifetime. The identifier is not linked to your name, email, IP address, or any account. It is used only to count usage of features (e.g. "how many people downloaded a VTT file this week"). **Never shared with advertising networks. Never sold.**

4. **Advertising.**
   - Never. This service does not support advertising cookies, never has, and never will in its open-source form.

### Consent and control

Under the EU ePrivacy Directive, UK PECR, and state laws in the US (e.g. California CCPA/CPRA, Colorado, Connecticut), analytics cookies require opt-in consent from residents of those jurisdictions. The hosted deployment of Accessibility Lite shows a consent banner the first time a visitor loads a page that would set an analytics cookie. Declining keeps the cookie off. Changing your mind is one click from the footer link "Cookie preferences".

Strictly-necessary cookies do not require consent and cannot be turned off without breaking sign-in.

### Third parties

A standard self-hosted Accessibility Lite deployment makes no outbound requests to third parties from the browser. If you have enabled an optional integration (Sentry, PostHog, DeepL, LibreTranslate), your browser may make requests that involve cookies or similar technologies operated by those vendors. Each of them publishes their own cookie policy.

### Changes to this policy

We'll note changes in the repository changelog and update the "last updated" date above.

### Contact

Open an issue at [github.com/dedmonwalkin/accessibility-lite](https://github.com/dedmonwalkin/accessibility-lite) or email the address in [SECURITY.md](SECURITY.md).
