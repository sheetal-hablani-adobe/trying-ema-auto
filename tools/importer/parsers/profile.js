/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the profile block.
 *   - `byline` variant (article contributor) -> "profile (byline)"
 *   - anything without a .cmp-byline (e.g. future About Us team) -> "profile"
 *
 * Source (validated against block-context/profile/source.html + instances/01-05.html):
 *   div.experiencefragment ... div.aem-Grid
 *     > div.separator (hr)                               dropped
 *     > div.byline > div.cmp-byline
 *         > div.cmp-byline__image div.cmp-image[data-cmp-src] > img.cmp-image__image
 *         > h2.cmp-byline__name
 *         > p.cmp-byline__occupations
 *     > div.cmp-buildingblock--btn-list ... a.cmp-button[href]
 *         > span.cmp-button__icon--{network} + span.cmp-button__text "Facebook"
 *
 * Target (2 columns, one row per person, matches blocks/profile/profile.js):
 *   | photo | <h2>Name</h2><p>Occupations</p><ul><li><a>Facebook</a></li>...</ul> |
 */
const NETWORK_LABELS = {
  facebook: 'Facebook',
  twitter: 'Twitter',
  x: 'X',
  instagram: 'Instagram',
  insta: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  tiktok: 'TikTok',
};

function clean(text) {
  return (text || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function capitalize(text) {
  const key = text.toLowerCase();
  if (NETWORK_LABELS[key]) return NETWORK_LABELS[key];
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Resolve an image URL, covering AEM Core lazy images. */
function resolveImageSrc(img, scope) {
  let src = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';
  if (src && !src.startsWith('data:')) return src;
  if (img && img.getAttribute('srcset')) {
    return img.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0];
  }
  const holder = (img && img.closest('[data-cmp-src]')) || scope.querySelector('[data-cmp-src]');
  if (holder) {
    const tpl = holder.getAttribute('data-cmp-src');
    const widths = (holder.getAttribute('data-cmp-widths') || '').split(',').map(Number).filter(Boolean);
    return tpl.replace('{.width}', widths.length ? `.${Math.max(...widths)}` : '');
  }
  const noscript = scope.querySelector('noscript');
  if (noscript) {
    const m = noscript.textContent.match(/<img[^>]+src="([^"]+)"/i);
    if (m) return m[1];
  }
  const asset = scope.querySelector('[data-asset]');
  return asset ? asset.getAttribute('data-asset') : '';
}

function buildPhoto(scope, document) {
  const imgScope = scope.querySelector('.cmp-byline__image') || scope;
  const sourceImg = imgScope.querySelector('img');
  const src = resolveImageSrc(sourceImg, imgScope);
  if (!src) return '';
  const img = document.createElement('img');
  img.src = src;
  img.alt = clean(sourceImg && sourceImg.getAttribute('alt'));
  return img;
}

/** Network name for a social button: label text, icon class, data layer, aria-label, href. */
function networkLabel(a) {
  const text = clean((a.querySelector('.cmp-button__text') || a).textContent);
  if (text) return capitalize(text);
  const icon = a.querySelector('[class*="cmp-button__icon--"]');
  const iconMatch = icon && icon.className.match(/cmp-button__icon--([a-z]+)/);
  if (iconMatch) return capitalize(iconMatch[1]);
  const layer = a.getAttribute('data-cmp-data-layer') || '';
  const titleMatch = layer.match(/"dc:title"\s*:\s*"([^"]+)"/);
  if (titleMatch) return capitalize(clean(titleMatch[1]));
  const aria = clean(a.getAttribute('aria-label')).split(' ')[0];
  if (aria) return capitalize(aria);
  const hrefMatch = (a.getAttribute('href') || '').match(/#([a-z]+)/i);
  return hrefMatch ? capitalize(hrefMatch[1]) : '';
}

function buildSocialList(links, document) {
  const ul = document.createElement('ul');
  links.forEach((a) => {
    const label = networkLabel(a);
    if (!label) return;
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = a.getAttribute('href') || '#';
    link.textContent = label;
    li.append(link);
    ul.append(li);
  });
  return ul.children.length ? ul : null;
}

function buildDetails(person, links, document) {
  const details = [];
  const nameEl = person.querySelector('.cmp-byline__name, h1, h2, h3, h4, h5, h6');
  if (nameEl && clean(nameEl.textContent)) {
    const h = document.createElement(/^H[1-6]$/.test(nameEl.tagName) ? nameEl.tagName.toLowerCase() : 'h2');
    h.textContent = clean(nameEl.textContent);
    details.push(h);
  }
  const roles = person.querySelectorAll('.cmp-byline__occupations');
  const roleEls = roles.length
    ? [...roles]
    : [...person.querySelectorAll('p')].filter((p) => !p.closest('.cmp-button, .cmp-buildingblock--btn-list'));
  roleEls.forEach((r) => {
    const text = clean(r.textContent);
    if (!text) return;
    const p = document.createElement('p');
    p.textContent = text;
    details.push(p);
  });
  const ul = buildSocialList(links, document);
  if (ul) details.push(ul);
  return details;
}

export default function parse(element, { document }) {
  const bylines = [...element.querySelectorAll('.cmp-byline')];
  const buttons = [...element.querySelectorAll('.cmp-buildingblock--btn-list a.cmp-button, .cmp-buildingblock--btn-list a[href]')]
    .filter((a, i, all) => all.indexOf(a) === i);
  const cells = [];

  if (bylines.length) {
    // Pair each button with the closest preceding byline (document order);
    // buttons before the first byline belong to the first one.
    const byPerson = bylines.map(() => []);
    buttons.forEach((a) => {
      let idx = 0;
      bylines.forEach((b, i) => {
        if (b.compareDocumentPosition(a) & 4) idx = i; // a follows b
      });
      byPerson[idx].push(a);
    });
    bylines.forEach((person, i) => {
      const photo = buildPhoto(person, document);
      const details = buildDetails(person, byPerson[i], document);
      if (!photo && !details.length) return;
      cells.push([photo, details]);
    });
  } else {
    // Generic fallback: whole element is one person.
    const photo = buildPhoto(element, document);
    const links = buttons.length ? buttons : [...element.querySelectorAll('a.cmp-button')];
    const details = buildDetails(element, links, document);
    if (photo || details.length) cells.push([photo, details]);
  }

  if (!cells.length) return;
  const name = bylines.length ? 'profile (byline)' : 'profile';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
