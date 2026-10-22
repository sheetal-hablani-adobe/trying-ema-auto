/* eslint-disable */
/* global WebImporter */

/**
 * Contributor byline fragments for wknd.site articles.
 * Each byline (an AEM experience fragment) is authored once as its own document
 * at /fragments/contributors/<slug> and referenced from the article with a
 * fragment block. US and CA articles by the same author share one fragment.
 *
 * Runs in beforeTransform, before block discovery, so the moved byline is never
 * claimed by the page's own profile block: this transformer parses it itself.
 */
import profileParser from '../parsers/profile.js';

const BYLINE_SELECTOR = 'main.cmp-layout-container--fixed main.container > div.cmp-container > div.experiencefragment';
const FRAGMENT_ROOT = '/fragments/contributors';

function toSlug(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function contributorSlug(element) {
  const xf = element.querySelector('[class*="cmp-experiencefragment--"]');
  const cls = xf && [...xf.classList].find((c) => c.startsWith('cmp-experiencefragment--'));
  if (cls) return toSlug(cls.slice('cmp-experiencefragment--'.length));
  const name = element.querySelector('.cmp-byline__name, h2');
  return toSlug(name && name.textContent);
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const { document, params = {} } = payload;
  if (!params.fragments) params.fragments = [];

  element.querySelectorAll(BYLINE_SELECTOR).forEach((byline) => {
    if (!byline.querySelector('.cmp-byline')) return;
    const slug = contributorSlug(byline);
    if (!slug) return;
    const path = `${FRAGMENT_ROOT}/${slug}`;

    const link = document.createElement('a');
    link.href = path;
    link.textContent = path;
    const fragmentBlock = WebImporter.Blocks.createBlock(document, { name: 'Fragment', cells: [[link]] });

    const holder = document.createElement('div');
    byline.replaceWith(fragmentBlock);
    holder.append(byline);
    try {
      profileParser(byline, { document, url: payload.url, params });
    } catch (e) {
      console.error(`Failed to parse contributor byline ${slug}:`, e);
    }

    // one document per contributor, even when a page lists it twice
    if (!params.fragments.some((f) => f.path === path)) {
      params.fragments.push({ element: holder, path });
    }
  });
}
