/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the tabs block (AEM Core Components cmp-tabs, wknd.site).
 *
 * Source (validated against block-context/tabs/source.html [bali-surf-camp] and
 * instances/01.html [cycling-tuscany]):
 *   .cmp-tabs > ol.cmp-tabs__tablist > li.cmp-tabs__tab#{id}-tab   (labels)
 *   .cmp-tabs > div.cmp-tabs__tabpanel#{id}-tabpanel               (panels)
 *     > .contentfragment > article.cmp-contentfragment
 *       > .cmp-contentfragment__elements > div > p / ul / ol / .image ...
 *   (h3.cmp-contentfragment__title is removed by wknd-cleanup beforehand.)
 *
 * Target: one row per tab; cell 1 = tab label, cell 2 = panel content.
 */
const CONTENT_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, ul, ol, table, blockquote, picture, img';
const INLINE_TAGS = new Set(['A', 'B', 'STRONG', 'I', 'EM', 'U', 'SPAN', 'BR', 'SUP', 'SUB', 'CODE', 'SMALL', 'MARK']);

/**
 * Walk the panel in document order. Semantic content nodes are kept as-is;
 * layout wrappers (div/article/.aem-Grid) are descended into; loose inline
 * content sitting directly in a wrapper div (some fragments have bare text,
 * e.g. cycling-tuscany "What to Bring") is wrapped in a <p> so it is not lost.
 */
function collectContent(node, document, out = []) {
  let buffer = [];
  const flush = () => {
    if (buffer.some((n) => n.textContent.trim() || (n.nodeType === 1 && n.querySelector('img')))) {
      const p = document.createElement('p');
      buffer.forEach((n) => p.append(n));
      out.push(p);
    }
    buffer = [];
  };

  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === 3) {
      buffer.push(child);
    } else if (child.nodeType === 1) {
      if (child.matches(CONTENT_SELECTOR)) {
        flush();
        if (child.matches('img, picture') || child.textContent.trim() || child.querySelector('img, picture')) {
          out.push(child);
        }
      } else if (INLINE_TAGS.has(child.tagName)) {
        buffer.push(child);
      } else {
        flush();
        collectContent(child, document, out);
      }
    }
  });
  flush();
  return out;
}

export default function parse(element, { document }) {
  const tabs = Array.from(element.querySelectorAll('.cmp-tabs__tab'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  const cells = [];
  tabs.forEach((tab, index) => {
    const label = tab.textContent.replace(/\s+/g, ' ').trim();
    if (!label) return;

    // Pair tab -> panel by id ({id}-tab -> {id}-tabpanel / aria-controls), fall back to order.
    const panelId = tab.getAttribute('aria-controls')
      || (tab.id ? tab.id.replace(/-tab$/, '-tabpanel') : '');
    const panel = (panelId && panels.find((p) => p.id === panelId)) || panels[index];

    const root = panel && (panel.querySelector('.cmp-contentfragment__elements') || panel);
    const content = root ? collectContent(root, document) : [];
    cells.push([label, content.length ? content : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });
  element.replaceWith(block);
}
