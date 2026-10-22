/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the accordion block (AEM Core Components cmp-accordion, wknd.site FAQ).
 *
 * Source (validated against block-context/accordion/source.html and the
 * US + CA FAQ pages):
 *   div.accordion.panelcontainer > div.cmp-accordion > div.cmp-accordion__item (x7)
 *     h3.cmp-accordion__header > button > span.cmp-accordion__title  -> question
 *     div.cmp-accordion__panel(.cmp-accordion__panel--hidden)         -> answer
 *       > div.container > div.cmp-container > div.text > div.cmp-text > p|ul|ol|...
 *   Panels are only collapsed via a CSS class; their content is in the markup and
 *   is read regardless of visibility.
 *
 * Target (2 columns, one row per item): question (<h3>, matching the source
 * h3.cmp-accordion__header) | answer content.
 *
 * Both template selectors (`div.accordion.panelcontainer` and the nested
 * `.cmp-accordion`) resolve here. The outer wrapper is always the one replaced;
 * a second call on an already-detached element is a no-op.
 */
const clean = (s) => (s || '').replace(/[\s ​]+/g, ' ').trim();

function answerContent(panel, document) {
  const out = [];
  const parts = panel.querySelectorAll('.cmp-text, .cmp-image, .cmp-title, .cmp-button');
  parts.forEach((part) => {
    if (part.classList.contains('cmp-text')) {
      [...part.children].forEach((child) => {
        if (!clean(child.textContent) && !child.querySelector('img, picture, video, iframe')) return;
        out.push(child);
      });
    } else if (part.classList.contains('cmp-image')) {
      const img = part.querySelector('img');
      if (img) out.push(img);
    } else if (part.classList.contains('cmp-title')) {
      const text = clean(part.textContent);
      if (text) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = text;
        p.append(strong);
        out.push(p);
      }
    } else {
      const a = part.matches('a') ? part : part.querySelector('a');
      if (a && clean(a.textContent)) {
        const p = document.createElement('p');
        p.append(a);
        out.push(p);
      }
    }
  });

  if (!out.length) {
    const text = clean(panel.textContent);
    if (text) {
      const p = document.createElement('p');
      p.textContent = text;
      out.push(p);
    }
  }
  return out;
}

export default function parse(element, { document }) {
  // Already handled through the other instance selector (detached by replaceWith).
  if (!element.ownerDocument.contains(element)) return;

  const root = element.closest('div.accordion.panelcontainer') || element;
  const accordion = root.matches('.cmp-accordion') ? root : root.querySelector('.cmp-accordion');
  if (!accordion) return;

  // Direct items only (ignores accordions nested inside answers).
  const items = [...accordion.children].filter((c) => c.classList.contains('cmp-accordion__item'));

  const cells = [];
  items.forEach((item) => {
    const titleEl = item.querySelector(':scope > .cmp-accordion__header .cmp-accordion__title')
      || item.querySelector(':scope > .cmp-accordion__header');
    const question = clean(titleEl && titleEl.textContent);
    const panel = item.querySelector(':scope > .cmp-accordion__panel');
    const answer = panel ? answerContent(panel, document) : [];
    if (!question && !answer.length) return;
    let questionCell = '';
    if (question) {
      questionCell = document.createElement('h3');
      questionCell.textContent = question;
    }
    cells.push([questionCell, answer]);
  });

  if (!cells.length) return;
  const block = WebImporter.Blocks.createBlock(document, { name: 'Accordion', cells });
  root.replaceWith(block);
}
