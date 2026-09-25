import { page } from '../layout.js';
import { escapeHtml } from '../escape.js';
import { HOME_STYLES } from '../homeStyles.js';
import { PROJECT_OPTIONS, projectOutline, plannerScript } from '../projectPlanner.js';

export function buildHomePage({ contactEmail = 'bob@whakauru.com', mediaPreview = true } = {}) {
  // Keep the verified mailbox until the new domain's email has been tested.
  const email = typeof contactEmail === 'string' ? contactEmail.trim() : '';
  const validEmail = /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(email);
  const contact = validEmail
    ? `<a class="contact-address" href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`
    : '<p>Client enquiries are not open yet. Our contact process is being prepared.</p>';

  return page({
    title: 'Nobody gets left off the map',
    description: 'Practical accessibility examination and remediation planning for public-facing websites, documents, and media. Clear evidence. Useful next steps.',
    path: '/',
    mediaPreview,
    styles: HOME_STYLES,
    body: `
    <div class="civic-home">
      <section class="civic-hero" aria-labelledby="home-title">
        <div class="hero-copy">
          <p class="eyebrow">Digital accessibility / Public-facing services</p>
          <h1 id="home-title">Nobody gets<br>left off <em>the map.</em></h1>
          <p class="hero-lede">Find out where you stand.<br>Then make a plan to put things right.</p>
          <p class="hero-description">Accessibility examination and remediation support in development for municipalities, public bodies, and organizations. Starting with the websites, documents, and media people rely on.</p>
          <div class="civic-actions">
            <a class="btn" href="#contact">Discuss your project <span aria-hidden="true">&#8599;</span></a>
            <a class="text-link" href="#approach">See what a useful finding looks like <span aria-hidden="true">&#8595;</span></a>
          </div>
        </div>
        <figure class="access-figure">
          <svg viewBox="0 0 420 370" aria-hidden="true" focusable="false" class="access-drawing">
            <defs><pattern id="access-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" stroke-width=".6"/></pattern></defs>
            <rect x="1" y="1" width="418" height="368" fill="url(#access-grid)" class="drawing-grid"/>
            <ellipse cx="210" cy="180" rx="174" ry="138" class="map-surface"/>
            <g class="map-graticule"><ellipse cx="210" cy="180" rx="108" ry="138"/><ellipse cx="210" cy="180" rx="44" ry="138"/><path d="M36 180H384 M55 118H365 M55 242H365 M210 42V318"/></g>
            <path d="M76 213 C115 213 100 110 156 110 S199 213 245 213 S272 288 333 288" class="drawing-route"/>
            <g class="map-stops"><circle cx="76" cy="213" r="7"/><circle cx="156" cy="110" r="7"/><circle cx="245" cy="213" r="7"/><circle cx="333" cy="288" r="7"/></g>
            <circle cx="333" cy="288" r="20" class="map-destination"/>
            <path d="M333 252V260 M333 316V324 M297 288H305 M361 288H369" class="map-destination"/>
          </svg>
          <figcaption><span class="figure-number">01 / Routes to participation</span><span>Different journeys. A place for everyone.</span></figcaption>
        </figure>
      </section>

      <div class="principle-strip" aria-label="Our principles">
        <span>Evidence before assurances</span><span>People before scores</span><span>Clear scope. Honest limits.</span>
      </div>

      <section class="civic-section" id="services" aria-labelledby="services-title">
        <div class="section-intro">
          <div><p class="eyebrow">01 / The proposed practice</p><h2 id="services-title">Know where you stand.<br>Know what comes next.</h2></div>
          <p>Not every organization needs the same engagement. Start with a defined scope, the people affected, and a deliverable your team can actually use.</p>
        </div>
        <div class="service-grid">
          <article class="service-item"><span class="service-number" aria-hidden="true">01</span><div><h3>Accessibility examination</h3><p>Review key journeys across websites, forms, and documents. Plan automated checks alongside keyboard and assistive-technology testing.</p><p class="deliverable"><strong>The record:</strong> scoped findings, evidence, and user impact.</p></div></article>
          <article class="service-item"><span class="service-number" aria-hidden="true">02</span><div><h3>Remediation &amp; retesting</h3><p>Turn findings into work your staff or web vendor can act on. Agree priorities, ownership, and how each fix will be checked.</p><p class="deliverable"><strong>The record:</strong> an action plan and verification notes.</p></div></article>
          <article class="service-item"><span class="service-number" aria-hidden="true">03</span><div><h3>Reporting readiness</h3><p>Organize supporting evidence and unresolved questions for the client's review. Ontario portal assistance remains subject to ministry clarification.</p><p class="deliverable"><strong>The record:</strong> an evidence index and readiness summary.</p></div></article>
          <article class="service-item"><span class="service-number" aria-hidden="true">04</span><div><h3>Media accessibility planning</h3><p>Scope caption, transcript, and description needs for meetings, briefings, and recordings. Separate draft generation from quality review.</p><p class="deliverable"><strong>The record:</strong> a media inventory and review plan.</p></div></article>
        </div>
      </section>

      <section class="civic-section evidence-section" id="approach" aria-labelledby="approach-title">
        <div class="evidence-copy">
          <p class="eyebrow">02 / A finding, not just a score</p>
          <h2 id="approach-title">Something your team<br>can put to work.</h2>
          <p>A useful report connects a barrier to a real task. It explains what happened, who it affects, and what to do next.</p>
          <ol class="method-list">
            <li><strong>Agree the scope.</strong><span>List the services, representative pages, documents, standards, and testing methods.</span></li>
            <li><strong>Document the experience.</strong><span>Record reproducible steps, user impact, and supporting evidence. State what was not tested.</span></li>
            <li><strong>Fix, then verify.</strong><span>Give each action an owner. Retest the original task and record any remaining limitations.</span></li>
          </ol>
        </div>
        <aside class="finding-sheet" aria-labelledby="finding-title">
          <div class="sheet-top"><span>Working Access / Field notes</span><span>Illustrative example</span></div>
          <p class="finding-id">Finding 001 <span class="finding-status">Open / Not retested</span></p>
          <h3 id="finding-title">A resident cannot finish<br>the request form.</h3>
          <dl class="finding-details">
            <div><dt>Observed barrier</dt><dd>Keyboard focus becomes trapped inside the date picker.</dd></div>
            <div><dt>Impact on the task</dt><dd>A person using a keyboard cannot reach the submit button.</dd></div>
            <div><dt>Recommended action</dt><dd>Restore a predictable focus order and a keyboard-operable way to leave the picker.</dd></div>
            <div><dt>Verification</dt><dd>Complete the request using only a keyboard, including opening and closing the picker.</dd></div>
          </dl>
          <p class="sheet-foot">A format example, not a client finding or completed audit.</p>
        </aside>
      </section>

      <section class="civic-section" id="project-plan" aria-labelledby="plan-title">
        <div class="section-intro">
          <div><p class="eyebrow">03 / Start small</p><h2 id="plan-title">What needs attention?</h2></div>
          <p>You do not need to know the name of a standard to start a conversation. Choose a starting point for a practical project brief.</p>
        </div>
        <div class="project-planner" id="projectPlanner" hidden>
          <div class="planner-controls">
            <label for="projectFocus">Your starting point</label>
            <select id="projectFocus">${PROJECT_OPTIONS.map(({ value, label }) => `<option value="${value}">${label}</option>`).join('')}</select>
            <button class="btn" type="button" id="outlineButton">Show a starting plan</button>
            <p class="small muted">Runs in your browser. Nothing is submitted or saved by this guide.</p>
          </div>
          <div class="planner-result" role="status" aria-live="polite" aria-atomic="true">
            <p class="eyebrow">Your starting plan</p>
            <h3 id="outlineTitle">${projectOutline('unsure').title}</h3>
            <p id="outlineText">${projectOutline('unsure').text}</p>
          </div>
        </div>
        <noscript><p class="planner-fallback">The interactive guide needs JavaScript. You can still <a href="#contact">contact us directly</a> with the service, website, or recording you want to improve.</p></noscript>
        <p class="section-note">This guide helps scope a conversation. It does not determine legal obligations, deadlines, or compliance.</p>
      </section>

      ${mediaPreview ? `<section class="media-band" id="pipeline" aria-labelledby="pipeline-title">
        <div><p class="eyebrow">The open-source workbench / Development preview</p><h2 id="pipeline-title">Better access to<br>what is said <em>and shown.</em></h2><p>Explore the media workflow behind Working Access: caption formats, description segments, and experimental sign-gloss output.</p><a class="btn-outline" href="/media">Explore the media preview <span aria-hidden="true">&#8599;</span></a></div>
        <div class="media-notes"><h3>Useful tools. Human judgment.</h3><p>Mock providers are enabled by default. Outputs need accuracy and accessibility review before publication.</p><p>Sign gloss is not sign-language interpretation. Self-hosting does not, by itself, establish privacy compliance or data residency.</p><a href="https://github.com/dedmonwalkin/accessibility-lite">Explore the source code</a></div>
      </section>` : ''}

      <section class="civic-section boundaries" aria-labelledby="scope-title">
        <div><p class="eyebrow">Before an engagement</p><h2 id="scope-title">Trust starts with<br>clear boundaries.</h2></div>
        <div class="boundary-copy"><p>Agree the scope, deliverables, timetable, access needs, data handling, and fees in writing before work begins. Procurement requirements should be discussed, not assumed.</p><p>A scan or accessibility menu does not establish compliance. Our proposed deliverables are not legal advice, government certification, or a guarantee of compliance.</p><p>Our proposed reporting role is to prepare supporting evidence, not to certify on a client's behalf. Legal questions belong with qualified counsel.</p></div>
      </section>

      <section class="civic-section name-section" id="name" aria-labelledby="name-title">
        <div><p class="eyebrow">Our purpose</p><h2 id="name-title">Access that works.<br>Work that matters.</h2></div>
        <div class="name-copy"><p>People visit public websites to do something: report a problem, apply for a permit, read a council agenda, or follow a meeting. Access matters when those tasks work for the people who need them.</p><p>A form that cannot be completed with a keyboard. A meeting without captions. A document that a screen reader cannot navigate. Our work starts by looking for the people and tasks a design has missed.</p><div class="name-note"><h3>Why Working Access?</h3><p>The name keeps the focus on practical progress: find the barrier, agree the next step, and check whether the change helps. Not just a higher score. A service someone can use.</p></div></div>
      </section>

      <section class="civic-section accessibility-section" id="accessibility" aria-labelledby="accessibility-title">
        <div><p class="eyebrow">Access to this site</p><h2 id="accessibility-title">The conversation<br>should be accessible, too.</h2></div>
        <div><p>Our design target is WCAG 2.2 Level AA. This site is under development; this is a target, not a conformance claim or independent certification.</p><p>Use the text-size and theme controls in the header, or your browser's zoom. The site includes keyboard focus indicators and respects reduced-motion preferences.</p><p>Found a barrier? Tell us the page, what you were trying to do, and your preferred way to receive a reply. Please leave out sensitive personal information. Use the same contact below for accessibility enquiries.</p>${contact}</div>
      </section>

      <section class="contact-section" id="contact" aria-labelledby="contact-title">
        <div><p class="eyebrow">A good place to begin</p><h2 id="contact-title">Tell us what people<br>need to be able to do.</h2><p>A website, a document, a council meeting.<br>Start with the service and the people it needs to reach.</p>${contact}</div>
        <aside class="contact-brief" aria-labelledby="brief-title"><h3 id="brief-title">For a useful first conversation</h3><ul><li>Your organization and location</li><li>The website, document, or media involved</li><li>A barrier you know about, or a question you have</li><li>Your timeframe and preferred reply format</li></ul><p class="small">Please do not email passwords, confidential documents, or sensitive records. A message starts a conversation, not an engagement.</p></aside>
      </section>
    </div>`,
    scripts: plannerScript()
  });
}
