import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Quote block.
 * Row 1: quotation text. Row 2 (optional): attribution (italic text becomes <cite>).
 * Any cell holding only an image becomes the quote image, wherever it is authored.
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const imageCells = [];
  const textCells = [];
  cells.forEach((cell) => {
    if (cell.querySelector('picture, img') && !cell.textContent.trim()) imageCells.push(cell);
    else if (cell.textContent.trim()) textCells.push(cell);
  });

  const figure = document.createElement('figure');
  figure.className = 'quote-figure';

  const [quotation, attribution, ...rest] = textCells;
  if (quotation) {
    const blockquote = document.createElement('blockquote');
    quotation.className = 'quote-quotation';
    blockquote.append(quotation);
    figure.append(blockquote);
  }

  if (attribution) {
    const caption = document.createElement('figcaption');
    caption.className = 'quote-attribution';
    attribution.querySelectorAll('em').forEach((em) => {
      const cite = document.createElement('cite');
      cite.innerHTML = em.innerHTML;
      em.replaceWith(cite);
    });
    caption.append(...attribution.childNodes, ...rest.flatMap((c) => [...c.childNodes]));
    figure.append(caption);
  }

  const elements = [figure];
  if (imageCells.length) {
    const media = document.createElement('div');
    media.className = 'quote-image';
    imageCells.forEach((cell) => {
      cell.querySelectorAll('picture > img').forEach((img) => {
        img.closest('picture').replaceWith(
          createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 600px)', width: '1200' }, { width: '750' }]),
        );
      });
      media.append(...cell.childNodes);
    });
    elements.push(media);
  }

  block.replaceChildren(...elements);
}
