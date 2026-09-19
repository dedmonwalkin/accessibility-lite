import { page } from '../layout.js';
import { escapeHtml } from '../escape.js';

export function buildHomePage({ contactEmail = '' } = {}) {
  // Only a configured, plain mailbox becomes an actionable contact link.
  const email = typeof contactEmail === 'string' ? contactEmail.trim() : '';
  const validEmail = /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(email);
  const contact = validEmail
    ? `<a class="btn" href="mailto:${escapeHtml(email)}">Discuss your project</a>
       <p class="muted small">${escapeHtml(email)}. Please do not email credentials or sensitive records.</p>`
    : '<p>Client enquiries are not open yet. We are preparing our service and contact process before accepting engagements.</p>';

  return page({
    title: 'Accessibility, with a clear next step',
    description: 'Inclusy is developing practical accessibility examination and remediation support for websites, media, and organizational readiness.',
    path: '/',
    styles: `
      .home-kicker { font-size: var(--text-sm); font-weight: 700; color: var(--accent); }
      .home-hero { display: grid; grid-template-columns: 1.5fr 1fr; gap: var(--s7); align-items: center; padding: var(--s8) 0; }
      .home-hero h1 { font-size: clamp(2.25rem, 5vw, 4rem); max-width: 15ch; line-height: 1.08; letter-spacing: -.025em; }
      .home-lead { font-size: var(--text-lg); color: var(--ink-muted); max-width: 47ch; }
      .home-actions { display: flex; flex-wrap: wrap; gap: var(--s3); margin-top: var(--s5); }
      .home-record { background: var(--surface); border: 1px solid var(--border); padding: var(--s5); box-shadow: 8px 8px 0 var(--rule); }
      .home-record h2 { font-size: var(--text-lg); }
      .home-record ol { padding-left: var(--s5); }
      .home-record li { padding: var(--s3) 0; border-bottom: 1px solid var(--rule); }
      .home-record li:last-child { border: 0; }
      .home-record strong, .home-record span { display: block; }
      .home-record span { color: var(--ink-muted); font-size: var(--text-sm); }
      .home-section { padding: var(--s7) 0; border-top: 1px solid var(--rule); scroll-margin-top: var(--s5); }
      .home-services { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--s6); margin-top: var(--s5); }
      .home-services h3 { font-size: var(--text-lg); }
      .home-services p { color: var(--ink-muted); }
      .home-note { border-left: 4px solid var(--accent); padding: var(--s3) var(--s5); background: var(--surface); }
      .home-contact { max-width: 65ch; }
      @media (max-width: 800px) {
        .home-hero, .home-services { grid-template-columns: 1fr; }
        .home-hero { gap: var(--s5); padding: var(--s6) 0; }
        .home-record { box-shadow: 4px 4px 0 var(--rule); }
      }
    `,
    body: `
      <section class="home-hero" aria-labelledby="home-title">
        <div>
          <p class="home-kicker">Inclusy / Accessibility in practice</p>
          <h1 id="home-title">A clearer path to access.</h1>
          <p class="home-lead">Understand the barriers. Make a practical plan. Keep a record of what changed.</p>
          <p>We are developing accessibility examination and remediation support for organizations, with an initial focus on Ontario.</p>
          <div class="home-actions">
            <a class="btn" href="#services">Explore the approach</a>
            <a class="btn-outline" href="/media">Explore media tools</a>
          </div>
        </div>
        <aside class="home-record" aria-labelledby="record-title">
          <p class="home-kicker">The proposed engagement</p>
          <h2 id="record-title">Evidence you can work with.</h2>
          <ol>
            <li><strong>Define the scope</strong><span>Agree what is being examined and why.</span></li>
            <li><strong>Document the barriers</strong><span>Capture reproducible findings and their impact.</span></li>
            <li><strong>Plan and verify fixes</strong><span>Assign actions, retest, and record limitations.</span></li>
          </ol>
        </aside>
      </section>

      <section class="home-section" id="services" aria-labelledby="services-title">
        <p class="home-kicker">Three connected areas</p>
        <h2 id="services-title">Start with the work that matters.</h2>
        <div class="home-services">
          <article><h3>Websites &amp; documents</h3><p>Scope key journeys, forms, and documents. Combine automated checks with planned keyboard and assistive-technology testing, then prioritize remediation.</p></article>
          <article><h3>Video &amp; audio</h3><p>Identify caption, transcript, and description needs. Our open-source media tools are a development preview, not a substitute for qualified review.</p><a href="/media">See the media preview</a></article>
          <article><h3>Organizational readiness</h3><p>Map applicable obligations, gather evidence, and prepare a clear record for the client's review. Portal assistance remains subject to ministry clarification.</p></article>
        </div>
      </section>

      <section class="home-section" id="approach" aria-labelledby="approach-title">
        <p class="home-kicker">Clear scope. Honest limits.</p>
        <h2 id="approach-title">More than a score or a widget.</h2>
        <p>An automated scan can identify some barriers. A useful examination also needs context, manual testing, and a record of what was and was not checked. An accessibility menu does not establish compliance.</p>
        <div class="home-note"><p>The proposed deliverables are a scoped findings register, a prioritized remediation plan, and a retest record. These are not legal advice, government certification, or a guarantee of compliance.</p></div>
        <p>Reporting preparation and technical remediation are separate services. The client's authorized officer remains responsible for reviewing and certifying its report.</p>
        <p><a href="https://www.ontario.ca/page/completing-your-accessibility-compliance-report">Ontario's accessibility reporting guidance</a></p>
      </section>

      <section class="home-section home-contact" id="contact" aria-labelledby="contact-title">
        <p class="home-kicker">Preparing for a first engagement</p>
        <h2 id="contact-title">A useful starting point.</h2>
        <p>A first conversation should establish your organization type, the website or media involved, the people affected, and the outcome you need. Scope, timing, and terms should be agreed before work begins.</p>
        ${contact}
      </section>
    `
  });
}
