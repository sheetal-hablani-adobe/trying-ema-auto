/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the quote block (default variant, wknd.site cmp-text--quote).
 *
 * Source (validated against block-context/quote/source.html + instances/01-05.html):
 *   div.text.cmp-text--quote > div.cmp-text
 *     > blockquote                    quotation (may hold <b>, <br>, nested <b>)
 *     > p                             optional attribution, usually <p><u>Name</u></p>
 *                                     or <p><b><i><u>noun</u></i></b></p>
 *
 * Target (1 column, matches blocks/quote/quote.js):
 *   row 1: quotation text
 *   row 2 (optional): attribution as italic text (<em>) -> decorated into <cite>
 */
const BLOCK_TAGS = /^(P|H[1-6]|UL|OL|DIV)$/;

function hasText(el) {
  return !!el && el.textContent.replace(/[\s\u00a0\u200b]/g, '') !== '';
}

function cleanText(el) {
  return el.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const root = element.querySelector('.cmp-text') || element;
  const blockquote = root.querySelector('blockquote');

  // ---- Row 1: quotation ----
  const quoteCell = [];
  let attributionSources = [];

  if (blockquote) {
    const blockChildren = [...blockquote.children].filter((c) => BLOCK_TAGS.test(c.tagName));
    if (blockChildren.length && blockChildren.length === blockquote.children.length) {
      // Blockquote already holds block-level paragraphs: keep them as-is.
      blockChildren.filter(hasText).forEach((c) => quoteCell.push(c));
    } else if (hasText(blockquote)) {
      // Inline content (text, <b>, <br>): wrap in a single paragraph.
      const p = document.createElement('p');
      p.innerHTML = blockquote.innerHTML.trim();
      // Unwrap bold nested in bold (western-australia: <b>..<br><b>..</b></b>),
      // which otherwise renders as broken "****" markdown.
      p.querySelectorAll('b b, b strong, strong b, strong strong').forEach((inner) => {
        inner.replaceWith(...inner.childNodes);
      });
      quoteCell.push(p);
    }
    // Attribution: text-bearing elements after the blockquote, in document order.
    attributionSources = [...root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div')]
      .filter((el) => !blockquote.contains(el)
        && (blockquote.compareDocumentPosition(el) & 4) // DOCUMENT_POSITION_FOLLOWING
        && !el.querySelector('p, div')
        && hasText(el));
  } else {
    // Defensive: no <blockquote>, first text element is the quote, the rest is attribution.
    const parts = [...root.querySelectorAll('p, h1, h2, h3, h4, h5, h6')].filter(hasText);
    if (parts.length) quoteCell.push(parts.shift());
    attributionSources = parts;
  }

  if (!quoteCell.length) return;
  const cells = [[quoteCell]];

  // ---- Row 2 (optional): attribution as italic text ----
  const attribution = attributionSources.map(cleanText).filter(Boolean).join(' ');
  if (attribution) {
    const p = document.createElement('p');
    const em = document.createElement('em');
    em.textContent = attribution;
    p.append(em);
    cells.push([[p]]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote', cells });
  element.replaceWith(block);
}
