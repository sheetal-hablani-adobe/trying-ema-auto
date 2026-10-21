/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the breadcrumbs block (AEM Core Components cmp-breadcrumb, wknd.site).
 *
 * Source (validated against block-context/breadcrumbs/source.html + instances/01.html):
 *   nav.cmp-breadcrumb > ol.cmp-breadcrumb__list > li.cmp-breadcrumb__item
 *     - ancestor items: li > a.cmp-breadcrumb__item-link[href] > span
 *     - current item:   li.cmp-breadcrumb__item--active > span
 *
 * Target (1 column, 1 row):
 *   <ul><li><a href="/us/en/adventures">Adventures</a></li>...</ul><p>Current Page Title</p>
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('li.cmp-breadcrumb__item'));

  const list = document.createElement('ul');
  let currentTitle = '';

  items.forEach((item) => {
    const link = item.querySelector('a[href]');
    const label = (link || item).textContent.replace(/\s+/g, ' ').trim();
    if (!label) return;

    if (link && !item.classList.contains('cmp-breadcrumb__item--active')) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      // Drop the AEM .html extension so links match EDS paths (/us/en/adventures).
      a.href = link.getAttribute('href').replace(/\.html(?=$|[?#])/, '');
      a.textContent = label;
      li.append(a);
      list.append(li);
    } else {
      currentTitle = label;
    }
  });

  const contentCell = [];
  if (list.children.length) contentCell.push(list);
  if (currentTitle) {
    const p = document.createElement('p');
    p.textContent = currentTitle;
    contentCell.push(p);
  }

  const cells = [[contentCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'breadcrumbs', cells });
  element.replaceWith(block);
}
