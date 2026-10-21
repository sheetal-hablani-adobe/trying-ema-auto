import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';

let tabsCount = 0;

/**
 * Builds one card from a list of nodes: the first node holding a picture becomes
 * the image, everything else becomes the card body.
 * @param {Node[]} nodes
 * @returns {HTMLLIElement|null}
 */
function buildCard(nodes) {
  const li = document.createElement('li');
  li.className = 'tabs-card';
  const image = document.createElement('div');
  image.className = 'tabs-card-image';
  const body = document.createElement('div');
  body.className = 'tabs-card-body';
  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.textContent.trim()) return;
      const p = document.createElement('p');
      p.textContent = node.textContent.trim();
      body.append(p);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (!image.children.length && (node.matches('picture') || node.querySelector('picture'))) {
      image.append(node);
    } else if (node.textContent.trim() || node.querySelector('picture, img')) {
      body.append(node);
    }
  });
  if (!image.children.length && !body.children.length) return null;
  if (image.children.length) li.append(image);
  if (body.children.length) li.append(body);
  return li;
}

/**
 * card-grid option: turns each panel's content into a grid of cards.
 * Cards come from list items that hold a picture or, failing that, from runs
 * of content that each start with a picture. Content before the first picture
 * (e.g. an intro paragraph) is left in place.
 * @param {HTMLElement} panel
 */
function decorateCardGrid(panel) {
  panel.querySelectorAll(':scope > .tabs-panel-content').forEach((cell) => {
    const grid = document.createElement('ul');
    grid.className = 'tabs-cards';

    const lists = [...cell.querySelectorAll(':scope > ul, :scope > ol')]
      .filter((list) => list.querySelector('picture'));
    if (lists.length) {
      lists.forEach((list) => {
        [...list.children].forEach((item) => {
          const card = buildCard([...item.childNodes]);
          if (card) grid.append(card);
        });
        list.remove();
      });
    } else {
      const groups = [];
      [...cell.children].forEach((el) => {
        if (el.matches('picture') || el.querySelector('picture')) groups.push([el]);
        else if (groups.length) groups[groups.length - 1].push(el);
      });
      groups.forEach((nodes) => {
        const card = buildCard(nodes);
        if (card) grid.append(card);
      });
    }

    if (grid.children.length) cell.append(grid);
  });
}

/**
 * Tabs block.
 * Each row is one tab: first cell is the tab label, remaining cells are the panel.
 * Rows without a label are skipped; rows with a label but no panel get an empty panel.
 * `card-grid`: each panel renders its content as a grid of image cards.
 */
export default function decorate(block) {
  const cardGrid = block.classList.contains('card-grid');
  tabsCount += 1;
  const prefix = `tabs-${tabsCount}`;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  const panels = [];
  const buttons = [];
  const usedIds = new Set();

  [...block.children].forEach((row) => {
    const [labelCell, ...contentCells] = [...row.children];
    const labelText = labelCell?.textContent.trim();
    if (!labelText) {
      row.remove();
      return;
    }

    let id = `${prefix}-${toClassName(labelText) || panels.length}`;
    while (usedIds.has(id)) id = `${id}-${panels.length}`;
    usedIds.add(id);

    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = `tabpanel-${id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    contentCells.forEach((cell) => {
      cell.className = 'tabs-panel-content';
      panel.append(cell);
    });
    if (cardGrid) decorateCardGrid(panel);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panel.id);
    button.innerHTML = labelCell.innerHTML;

    panels.push(panel);
    buttons.push(button);
    tablist.append(button);
    row.replaceWith(panel);
  });

  const select = (index) => {
    buttons.forEach((btn, i) => {
      const active = i === index;
      btn.setAttribute('aria-selected', active);
      btn.setAttribute('tabindex', active ? '0' : '-1');
      panels[i].setAttribute('aria-hidden', !active);
    });
  };

  buttons.forEach((button, i) => {
    button.addEventListener('click', () => select(i));
    button.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % buttons.length;
      if (e.key === 'ArrowLeft') next = (i - 1 + buttons.length) % buttons.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = buttons.length - 1;
      if (next !== null) {
        e.preventDefault();
        select(next);
        buttons[next].focus();
      }
    });
  });

  block.querySelectorAll('.tabs-panel picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 600px)', width: '1200' }, { width: '750' }]),
    );
  });

  if (buttons.length) {
    select(0);
    block.prepend(tablist);
  }
}
