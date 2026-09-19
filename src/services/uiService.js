/**
 * Facade over src/ui/. The page builders moved out of this file when the
 * redesign landed, but server.js and the test suite import from here, so the
 * shape of `uiService` is deliberately unchanged.
 */
import { escapeHtml } from '../ui/escape.js';
import { buildErrorPage } from '../ui/pages/error.js';
import { buildUploadPage } from '../ui/pages/upload.js';
import { buildHomePage } from '../ui/pages/home.js';
import { buildOptionsPage } from '../ui/pages/options.js';
import { buildResultsPage } from '../ui/pages/results.js';
import { buildPlayerPage } from '../ui/pages/player.js';
import { buildEmbedDocsPage, buildEmbedFramePage } from '../ui/pages/embed.js';

export { escapeHtml };

export const uiService = {
  escapeHtml,
  buildErrorPage,
  buildUploadPage,
  buildHomePage,
  buildOptionsPage,
  buildResultsPage,
  buildPlayerPage,
  buildEmbedDocsPage,
  buildEmbedFramePage
};
