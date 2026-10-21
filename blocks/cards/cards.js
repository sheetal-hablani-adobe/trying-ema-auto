import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards block.
 * One row per card: image cell | body cell (heading, text, link). Cells may be omitted.
 * `locked`: members-only teasers. Each card gets a lock badge and a locked state;
 * the body (title, subtitle, "Read more") renders above the image.
 */
export default function decorate(block) {
  const locked = block.classList.contains('locked');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    // skip rows the author left completely empty
    if (!li.textContent.trim() && !li.querySelector('picture, img')) return;

    if (locked) {
      li.classList.add('cards-card-locked');
      const badge = document.createElement('span');
      badge.className = 'cards-lock-badge';
      const label = document.createElement('span');
      label.className = 'cards-lock-label';
      label.textContent = 'Members only';
      badge.append(label);
      li.prepend(badge);
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
