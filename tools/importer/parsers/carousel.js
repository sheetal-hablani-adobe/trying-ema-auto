/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the carousel block (AEM Core Components cmp-carousel, wknd.site).
 *
 * Source (validated against block-context/carousel/source.html [1 slide] and
 * instances/01.html [cycling-tuscany, 3 slides]):
 *   .cmp-carousel > .cmp-carousel__content > .cmp-carousel__item (one per slide)
 *     > .image > .cmp-image > img.cmp-image__image
 *   .cmp-carousel__actions (Previous/Next buttons) and .cmp-carousel__indicators
 *   are UI chrome and are dropped.
 *
 * Target: one row per slide; cell 1 = image only, cell 2 = optional text
 * (heading / description / CTA). Cell 2 is emitted only when at least one slide
 * has text, and then every row gets 2 cells so the table stays even.
 */
export default function parse(element, { document }) {
  // Slides are the stable .cmp-carousel__item wrappers (works for 1..n slides).
  const slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));

  const rows = slides.map((slide) => {
    const img = slide.querySelector('picture') || slide.querySelector('img');

    // Optional slide text: anything textual inside the slide other than the image.
    const textParts = Array.from(
      slide.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, .cmp-image__title, .cmp-teaser__description, a.cmp-teaser__action-link'),
    ).filter((el) => {
      if (!el.textContent.trim()) return false;
      // Skip nodes nested inside another matched node to avoid double-selection.
      const parent = el.parentElement && el.parentElement.closest('h1, h2, h3, h4, h5, h6, p, ul, ol, .cmp-teaser__description');
      return !(parent && slide.contains(parent));
    });

    return { img, textParts };
  }).filter((row) => row.img);

  const hasText = rows.some((row) => row.textParts.length);
  const cells = rows.map(({ img, textParts }) => (
    hasText ? [img, textParts.length ? textParts : ''] : [img]
  ));

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells });
  element.replaceWith(block);
}
