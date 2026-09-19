export const HOME_STYLES = `
  .civic-home { --serif: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif; }
  .civic-home h1, .civic-home h2 { font-family: var(--serif); font-weight: 400; letter-spacing: -.035em; }
  .civic-home h1 { font-size: clamp(2.8rem, 5.7vw, 4.7rem); line-height: 1.06; margin-bottom: var(--s5); }
  .civic-home h2 { font-size: clamp(2rem, 3.4vw, 3rem); line-height: 1.12; margin-bottom: var(--s5); }
  .civic-home h3 { font-size: var(--text-lg); line-height: 1.3; margin-bottom: var(--s3); }
  .civic-home em { color: var(--accent); font-weight: 400; }
  .civic-home .eyebrow { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: .035em; color: var(--clay); margin-bottom: var(--s5); }
  .civic-home p { text-wrap: pretty; }
  .civic-home [id] { scroll-margin-top: var(--s5); }
  .civic-home a { overflow-wrap: anywhere; }
  .civic-hero { display: grid; grid-template-columns: 1.45fr 1fr; gap: var(--s7); align-items: center; padding: var(--s7) 0 var(--s8); }
  .hero-lede { font-size: var(--text-lg); line-height: 1.5; margin-bottom: var(--s5); }
  .hero-description { color: var(--ink-muted); max-width: 51ch; }
  .civic-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s5); margin-top: var(--s6); }
  .text-link { font-size: var(--text-sm); font-weight: 700; text-decoration-thickness: 1px; }
  .access-figure { margin: 0; min-width: 0; background: radial-gradient(ellipse at center, var(--wash), transparent 72%); }
  .access-drawing { width: 100%; height: auto; display: block; color: var(--border); }
  .drawing-grid { opacity: .45; }
  .drawing-arch { stroke-width: 2; }
  .drawing-back { fill: var(--surface); stroke: var(--border); }
  .drawing-middle { fill: var(--wash); stroke: var(--accent); }
  .drawing-front { fill: var(--surface); stroke: var(--clay); }
  .drawing-ground { stroke: var(--border); stroke-width: 1; fill: none; }
  .drawing-route { stroke: var(--clay); stroke-width: 3; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .drawing-dot { fill: var(--clay); }
  .access-figure figcaption { border-top: 1px solid var(--border); padding-top: var(--s4); margin-top: var(--s3); font-size: var(--text-sm); color: var(--ink-muted); }
  .figure-number { display: block; color: var(--clay); font-family: var(--font-mono); font-size: var(--text-xs); margin-bottom: var(--s1); }
  .principle-strip { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--s3) var(--s5); border-block: 1px solid var(--border); padding: var(--s4) 0; font-size: var(--text-sm); color: var(--ink-muted); }
  .civic-section { padding: var(--s8) 0; border-bottom: 1px solid var(--rule); }
  .section-intro { display: grid; grid-template-columns: 1.2fr 1fr; gap: var(--s7); align-items: end; margin-bottom: var(--s6); }
  .section-intro > p { color: var(--ink-muted); }
  .service-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid var(--border); }
  .service-item { display: grid; grid-template-columns: auto 1fr; gap: var(--s5); padding: var(--s6) var(--s5) var(--s5) 0; border-bottom: 1px solid var(--rule); }
  .service-item:nth-child(even) { padding-left: var(--s6); border-left: 1px solid var(--rule); }
  .service-number { font-family: var(--serif); color: var(--clay); font-size: var(--text-2xl); line-height: 1.2; }
  .service-item p { color: var(--ink-muted); font-size: var(--text-sm); }
  .service-item .deliverable { margin-bottom: 0; }
  .deliverable strong { color: var(--ink); }
  .evidence-section { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s8); align-items: start; }
  .method-list { list-style: decimal-leading-zero; padding-left: 2em; margin: var(--s6) 0 0; }
  .method-list li { padding: 0 0 var(--s5) var(--s2); }
  .method-list li::marker { color: var(--clay); font-family: var(--font-mono); font-size: var(--text-xs); }
  .method-list strong, .method-list span { display: block; }
  .method-list span { font-size: var(--text-sm); color: var(--ink-muted); margin-top: var(--s1); }
  .finding-sheet { min-width: 0; background: var(--surface); border: 1px solid var(--border); padding: var(--s5); box-shadow: 7px 7px 0 var(--wash); }
  .sheet-top { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--s2); border-bottom: 1px solid var(--border); padding-bottom: var(--s4); font-size: var(--text-xs); color: var(--ink-muted); }
  .finding-id { display: flex; flex-wrap: wrap; gap: var(--s3); align-items: center; margin-top: var(--s5); color: var(--clay); font-family: var(--font-mono); font-size: var(--text-xs); }
  .finding-status { border: 1px solid var(--clay); padding: var(--s1) var(--s2); }
  .finding-details { margin-bottom: 0; }
  .finding-details > div { border-top: 1px solid var(--rule); padding: var(--s4) 0; }
  .finding-details dt { font-weight: 700; font-size: var(--text-sm); }
  .finding-details dd { margin: var(--s1) 0 0; font-size: var(--text-sm); color: var(--ink-muted); }
  .sheet-foot { font-size: var(--text-xs); color: var(--ink-muted); border-top: 1px solid var(--border); padding-top: var(--s4); margin-bottom: 0; }
  .project-planner { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--border); background: var(--surface); }
  .project-planner[hidden] { display: none; }
  .planner-controls, .planner-result { padding: var(--s6); min-width: 0; }
  .planner-controls { border-right: 1px solid var(--border); }
  .planner-controls label { margin-top: 0; }
  .planner-controls .btn { margin: var(--s5) 0 var(--s3); }
  .planner-controls p { margin-bottom: 0; }
  .planner-result { background: var(--wash); }
  .planner-result .eyebrow { margin-bottom: var(--s4); }
  .planner-result p:last-child { color: var(--ink-muted); margin-bottom: 0; }
  .section-note { font-size: var(--text-sm); color: var(--ink-muted); margin-top: var(--s4); }
  .media-band { display: grid; grid-template-columns: 1.2fr 1fr; gap: var(--s7); padding: var(--s7); margin-top: var(--s8); background: var(--wash); border: 1px solid var(--border); }
  .media-band .btn-outline { margin-top: var(--s3); }
  .media-notes { border-left: 1px solid var(--border); padding-left: var(--s6); align-self: center; }
  .media-notes p { font-size: var(--text-sm); color: var(--ink-muted); }
  .boundaries, .accessibility-section { display: grid; grid-template-columns: 1fr 1.2fr; gap: var(--s7); }
  .boundary-copy p, .accessibility-section p:not(.eyebrow) { color: var(--ink-muted); }
  .contact-section { display: grid; grid-template-columns: 1.25fr 1fr; gap: var(--s8); padding: var(--s8) 0 var(--s7); }
  .contact-address { display: inline-block; font-family: var(--serif); font-size: var(--text-xl); margin-top: var(--s3); }
  .contact-brief { border-left: 1px solid var(--border); padding-left: var(--s6); align-self: center; }
  .contact-brief ul { padding-left: var(--s5); }
  .contact-brief li { margin-bottom: var(--s2); font-size: var(--text-sm); }
  .contact-brief p { color: var(--ink-muted); }
  @media (prefers-reduced-motion: no-preference) {
    .hero-copy, .access-figure { animation: civic-arrive .5s ease-out both; }
    .access-figure { animation-delay: .1s; }
    @keyframes civic-arrive { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  }
  @media (max-width: 850px) {
    .civic-hero { gap: var(--s5); grid-template-columns: 1.3fr 1fr; }
    .evidence-section { gap: var(--s6); }
    .section-intro, .boundaries, .accessibility-section, .contact-section { grid-template-columns: 1fr; gap: var(--s4); }
    .media-band { padding: var(--s5); gap: var(--s5); }
  }
  @media (max-width: 640px) {
    .civic-hero, .service-grid, .evidence-section, .project-planner, .media-band { grid-template-columns: 1fr; }
    .civic-hero { padding-top: var(--s5); }
    .access-figure { max-width: 380px; width: 100%; justify-self: center; margin-top: var(--s5); }
    .service-item:nth-child(even) { padding-left: 0; border-left: 0; }
    .service-item { padding-right: 0; gap: var(--s4); }
    .planner-controls { border-right: 0; border-bottom: 1px solid var(--border); }
    .planner-controls, .planner-result { padding: var(--s5); }
    .media-notes, .contact-brief { border-left: 0; border-top: 1px solid var(--border); padding: var(--s5) 0 0; }
    .civic-section, .contact-section { padding-block: var(--s7); }
    .civic-home h1 { font-size: 2.7rem; }
  }
  @media print {
    .access-figure, .civic-actions, .project-planner { display: none; }
    .civic-home section { display: block; padding: 1rem 0; }
    .finding-sheet { box-shadow: none; break-inside: avoid; }
  }
`;
