export const SUPPORTED_OUTPUT_LANGUAGES = [
  'en-US', 'es-ES', 'fr-FR', 'de-DE', 'pt-BR', 'hi-IN', 'ja-JP', 'ar-SA',
  'zh-CN', 'zh-TW', 'ko-KR', 'it-IT', 'nl-NL', 'sv-SE', 'pl-PL', 'tr-TR',
  'he-IL', 'th-TH', 'vi-VN', 'id-ID', 'ru-RU'
];

export const SUPPORTED_SIGN_LANGUAGES = [
  'ASL', 'BSL', 'LSF', 'ISL', 'JSL', 'DGS', 'AUSLAN', 'LIBRAS', 'NZSL', 'HKSL'
];

export const SUPPORTED_SIGN_PRESENTATION_MODES = ['avatar_2d', 'basic_signs_book'];
export const SUPPORTED_CAPTION_STYLES = ['standard', 'simplified', 'verbatim'];
export const SUPPORTED_AUDIO_DESCRIPTION_STYLES = ['standard', 'concise', 'detailed'];
export const SUPPORTED_UI_MODES = ['default', 'high_contrast', 'dyslexia_friendly', 'reduced_motion'];

export const SIGN_OVERLAY_THEMES = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Experimental gloss tokens on a dark background; no animated interpreter',
    signer_style: 'avatar_2d_clean',
    size: 'small',
    background: { style: 'solid', color: '#1a1a2e', opacity: 0.85 },
    palette: { primary: '#5bd7ff', secondary: '#ffffff', accent: '#74ffa8', text: '#f7fbff', token_bg: '#12243f' },
    font: { family: '"IBM Plex Mono", monospace', weight: 400, size_scale: 1.0 },
    layout: 'column',
    accessibility_notes: null
  },
  {
    id: 'realistic',
    name: 'Realistic',
    description: 'Warm-toned experimental gloss display; no lifelike signer is generated',
    signer_style: 'avatar_2d_realistic',
    size: 'medium',
    background: { style: 'solid', color: '#1c1410', opacity: 0.92 },
    palette: { primary: '#e8c87a', secondary: '#f5ebe0', accent: '#d4a853', text: '#faf6ef', token_bg: '#2a1f14' },
    font: { family: '"Georgia", "Times New Roman", serif', weight: 400, size_scale: 1.05 },
    layout: 'column',
    accessibility_notes: null
  },
  {
    id: 'kids',
    name: 'Kids',
    description: 'Large colorful experimental gloss tokens; suitability for children requires review',
    signer_style: 'avatar_2d_expressive',
    size: 'large',
    background: { style: 'gradient', color: '#1a0a3e', opacity: 0.9 },
    palette: { primary: '#ff6fb7', secondary: '#ffe45c', accent: '#44eea5', text: '#ffffff', token_bg: '#3b1a6e' },
    font: { family: '"Comic Neue", "Comic Sans MS", cursive', weight: 700, size_scale: 1.3 },
    layout: 'grid',
    accessibility_notes: null
  },
  {
    id: 'hands_only',
    name: 'Hands Only',
    description: 'Experimental gloss text on a parchment-style background; not hand-sign animation',
    signer_style: 'hands_only',
    size: 'medium',
    background: { style: 'textured', color: '#f5f0e1', opacity: 0.93 },
    palette: { primary: '#3d3225', secondary: '#6b5d4f', accent: '#8b6914', text: '#2c2416', token_bg: '#ebe3d1' },
    font: { family: '"IBM Plex Sans", sans-serif', weight: 500, size_scale: 1.1 },
    layout: 'inline',
    accessibility_notes: null
  },
  {
    id: 'high_contrast',
    name: 'High Contrast',
    description: 'Yellow-on-black experimental gloss display with high-contrast text',
    signer_style: 'avatar_2d_clean',
    size: 'large',
    background: { style: 'solid', color: '#000000', opacity: 1.0 },
    palette: { primary: '#ffd700', secondary: '#ffffff', accent: '#00e5ff', text: '#ffffff', token_bg: '#1a1a1a' },
    font: { family: '"IBM Plex Mono", monospace', weight: 700, size_scale: 1.2 },
    layout: 'column',
    accessibility_notes: 'Text palette contrast is tested; this is not a claim of overall conformance.'
  },
  {
    id: 'fun',
    name: 'Fun',
    description: 'Colorful experimental gloss tokens on a purple background; no animated signs',
    signer_style: 'avatar_2d_creature',
    size: 'medium',
    background: { style: 'gradient', color: '#1a0033', opacity: 0.9 },
    palette: { primary: '#c77dff', secondary: '#ff9e64', accent: '#7aff7a', text: '#f0e6ff', token_bg: '#2d0052' },
    font: { family: '"Comic Neue", "Comic Sans MS", cursive', weight: 700, size_scale: 1.15 },
    layout: 'grid',
    accessibility_notes: null
  }
];

export const SUPPORTED_SIGN_OVERLAY_THEME_IDS = SIGN_OVERLAY_THEMES.map((t) => t.id);
