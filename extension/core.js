export function normalizePreferences(value) {
  const input = value && typeof value === 'object' ? value : {};
  return {
    theme: ['system', 'light', 'dark'].includes(input.theme) ? input.theme : 'system',
    size: [18, 22, 26].includes(input.size) ? input.size : 22,
    font: ['serif', 'sans'].includes(input.font) ? input.font : 'serif',
    spacing: input.spacing === 'wide' ? 'wide' : 'normal',
    solid: input.solid === true,
    rate: [0.8, 1, 1.2].includes(input.rate) ? input.rate : 1
  };
}

export function groupBlocks(blocks, fallbackTitle, maxChars = 60000) {
  const sections = [];
  let current = null;
  let length = 0;
  let truncated = false;
  for (const block of blocks) {
    const text = String(block.text || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (length + text.length > maxChars) { truncated = true; break; }
    length += text.length;
    if (block.heading || !current) {
      current = {title: block.heading ? text : fallbackTitle, paragraphs: []};
      sections.push(current);
    }
    if (!block.heading) current.paragraphs.push(text);
  }
  return {sections: sections.filter(section => section.paragraphs.length), truncated};
}

export function extractSections(doc, group) {
  const excluded = 'nav,header,footer,aside,form,button,input,textarea,select,script,style,noscript,svg,canvas,iframe,[hidden],[inert],[aria-hidden="true"],[contenteditable],[data-working-access-host]';
  const view = doc.defaultView;
  function visible(node) {
    if (!node || node.closest(excluded)) return false;
    for (let parent = node; parent; parent = parent.parentElement) {
      const css = view.getComputedStyle(parent);
      if (css.display === 'none' || css.visibility === 'hidden' || css.visibility === 'collapse' || css.opacity === '0') return false;
    }
    return node.getClientRects().length > 0;
  }
  const selected = view.getSelection();
  const root = [...doc.querySelectorAll('main,[role="main"],article')].find(visible) || doc.body;
  const nodes = [...root.querySelectorAll('h1,h2,h3,p,li,blockquote,dt,dd')];
  const blocks = [];
  let selectedBlocks = [];
  let visited = 0;
  for (const node of nodes) {
    if (++visited > 5000) break;
    if (!visible(node)) continue;
    // Read each text node once, even in nested lists or blockquotes.
    const textNodes = [];
    const walker = doc.createTreeWalker(node, 4);
    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      if (textNode.parentElement.closest('h1,h2,h3,p,li,blockquote,dt,dd') !== node) continue;
      if (!visible(textNode.parentElement)) continue;
      textNodes.push(textNode.textContent);
    }
    const text = textNodes.join(' ').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const block = {heading: /^H[1-3]$/.test(node.tagName), text};
    blocks.push(block);
    if (selected && !selected.isCollapsed && selected.rangeCount && selected.getRangeAt(0).intersectsNode(node)) selectedBlocks.push(block);
  }
  // Selection mode is intentionally paragraph-scoped, never input-field values.
  const selection = Boolean(selected && !selected.isCollapsed && selected.rangeCount);
  const result = group(selection ? selectedBlocks : blocks, selection ? 'Selected passages' : (doc.title || 'This page'));
  const pageHeading = blocks.find(block => block.heading);
  return {...result, selection, truncated: result.truncated || visited > 5000, title: pageHeading?.text || doc.title || 'This page', language: doc.documentElement.lang || 'en'};
}
