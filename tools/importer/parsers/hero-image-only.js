/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the hero-image-only variant -> block "Hero (image-only)"
 * (class `hero image-only`).
 *
 * Source (validated against block-context/hero-image-only/source.html and the
 * US + CA FAQ pages):
 *   div.aem-GridColumn--default--8 div.image > div.cmp-image
 *     > img.cmp-image__image[src][alt][title]  (optionally inside a.cmp-image__link)
 *
 * Target (1 column, 1 row): a single cell holding the image (alt kept). No text.
 */
export default function parse(element, { document }) {
  const sourceImg = element.querySelector('img.cmp-image__image') || element.querySelector('img');
  if (!sourceImg) return;

  let src = sourceImg.getAttribute('src')
    || sourceImg.getAttribute('data-cmp-src')
    || sourceImg.getAttribute('data-src')
    || '';
  if (!src && sourceImg.getAttribute('srcset')) {
    src = sourceImg.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0];
  }
  if (!src) return;

  const img = document.createElement('img');
  img.src = src;
  img.alt = (sourceImg.getAttribute('alt') || '').trim();
  const title = sourceImg.getAttribute('title');
  if (title) img.title = title;

  const cells = [[[img]]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero (image-only)', cells });
  element.replaceWith(block);
}
