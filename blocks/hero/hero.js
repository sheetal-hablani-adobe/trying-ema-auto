import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero block.
 * Default: full-width image with a text card (heading, text, CTAs) overlapping its bottom edge.
 * `image-only`: plain content-width image banner; any authored text renders below the image.
 *
 * Authoring is tolerant: image and text may sit in one cell, in separate cells,
 * or in separate rows. The first picture becomes the hero image; everything else
 * with content becomes the text card.
 */
export default function decorate(block) {
  const picture = block.querySelector('picture');

  const media = document.createElement('div');
  media.className = 'hero-image';
  if (picture) {
    const img = picture.querySelector('img');
    const holder = picture.parentElement;
    if (img) {
      media.append(createOptimizedPicture(img.src, img.alt, true, [
        { media: '(min-width: 900px)', width: '2000' },
        { width: '900' },
      ]));
      picture.remove();
    } else {
      media.append(picture);
    }
    // drop the now-empty paragraph/link that wrapped the picture
    if (holder && holder !== block && !holder.textContent.trim() && !holder.querySelector('picture, img')) {
      holder.remove();
    }
  } else {
    block.classList.add('no-image');
  }

  const content = document.createElement('div');
  content.className = 'hero-content';
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    [...cell.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.textContent.trim()) return;
        const p = document.createElement('p');
        p.textContent = node.textContent.trim();
        content.append(p);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (!node.textContent.trim() && !node.querySelector('picture, img')) return;
      content.append(node);
    });
  });

  const children = [];
  if (picture) children.push(media);
  if (content.children.length) children.push(content);
  else block.classList.add('no-content');
  block.replaceChildren(...children);
}
