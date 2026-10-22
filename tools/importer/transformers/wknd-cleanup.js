/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for wknd.site (AEM Core Components).
 * Removes non-authorable chrome and widgets; selectors taken from
 * migration-work/cleaned.html (detail-page, faq and article templates).
 */

/**
 * Normalise a page URL for matching template.pageCleanup keys (same way
 * block pageInstances are matched): drop query/hash, trailing slash and
 * .plain.html / .html suffixes; compare host + path, lower-cased.
 */
function normalizeUrl(u) {
  if (!u || typeof u !== 'string') return '';
  let str = u.trim().split('#')[0].split('?')[0];
  try {
    const parsed = new URL(str, 'https://placeholder.local');
    str = `${parsed.host}${parsed.pathname}`;
  } catch (e) {
    // keep raw string
  }
  str = str.replace(/\/+$/, '').replace(/(\.plain)?\.html?$/i, '').replace(/\/index$/i, '');
  return str.toLowerCase();
}

function pathOnly(normalized) {
  const i = normalized.indexOf('/');
  return i >= 0 ? normalized.slice(i) : normalized;
}

function findPageCleanup(pageCleanup, payload) {
  if (!pageCleanup || typeof pageCleanup !== 'object') return null;
  const candidates = [
    payload && payload.params && payload.params.originalURL,
    payload && payload.url,
  ].filter(Boolean).map(normalizeUrl);
  if (!candidates.length) return null;
  const keys = Object.keys(pageCleanup);
  // Exact host+path match first, then path-only match.
  for (const key of keys) {
    if (candidates.includes(normalizeUrl(key))) return pageCleanup[key];
  }
  const candidatePaths = candidates.map(pathOnly);
  for (const key of keys) {
    if (candidatePaths.includes(pathOnly(normalizeUrl(key)))) return pageCleanup[key];
  }
  return null;
}

function safeQueryAll(root, selector) {
  try {
    return Array.from(root.querySelectorAll(selector));
  } catch (e) {
    return [];
  }
}

/** Replay per-page cleanup: remove only when a selector matches exactly one element. */
function replayPageCleanup(element, payload) {
  const template = payload && payload.template;
  const entry = template && findPageCleanup(template.pageCleanup, payload);
  if (!entry) return;
  const selectors = Array.isArray(entry) ? entry : (entry.selectors || entry.rules || []);
  selectors.forEach((rule) => {
    const sel = typeof rule === 'string' ? rule : rule && rule.selector;
    if (!sel) return;
    const matches = safeQueryAll(element, sel);
    if (matches.length === 1) matches[0].remove();
  });
}

/** Template-level cleanup rules: only applied to elements outside any <main>. */
function applyCleanupRules(element, payload) {
  const rules = payload && payload.template && payload.template.cleanupRules;
  if (!Array.isArray(rules) || !rules.length) return;
  rules.forEach((rule) => {
    const sel = typeof rule === 'string' ? rule : rule && rule.selector;
    if (!sel) return;
    safeQueryAll(element, sel).forEach((el) => {
      if (el.tagName !== 'MAIN' && !el.closest('main') && el.parentNode) el.remove();
    });
  });
}

/**
 * Article (magazine) template cleanup. Scoped to the article template so
 * detail-page / faq imports are unaffected.
 */
function cleanupArticle(element, document) {
  const sidebar = 'aside.cmp-layoutcontainer--sidebar';

  // "SHARE THIS STORY" title and the sharing widget it labels
  // (the title is not always styled cmp-title--black, so also match it by text).
  element.querySelectorAll(`${sidebar} div.title`).forEach((title) => {
    if (title.matches('.cmp-title--black') || /share this story/i.test(title.textContent)) title.remove();
  });
  WebImporter.DOMUtils.remove(element, ['aside div.sharing']);

  // Hidden spacer separators in the sidebar (always removed, even if the
  // generic empty-check below would keep them).
  element
    .querySelectorAll(`${sidebar} .separator.cmp-separator--hidden`)
    .forEach((el) => el.remove());

  // Up-next list items: rebuild link content as "Title<em>Date</em>" so the
  // date survives as a separate (CSS-muted) line. Href is left untouched;
  // items without a date keep just the title.
  element
    .querySelectorAll(`${sidebar} div.list li.cmp-list__item a.cmp-list__item-link`)
    .forEach((link) => {
      const titleEl = link.querySelector('span.cmp-list__item-title');
      if (!titleEl) return;
      const dateEl = link.querySelector('span.cmp-list__item-date');
      const title = titleEl.textContent.trim();
      const date = dateEl ? dateEl.textContent.trim() : '';
      link.textContent = title;
      if (date) {
        const em = document.createElement('em');
        em.textContent = date;
        link.appendChild(em);
      }
    });

  // Separator <hr> above the byline inside the contributor experience
  // fragment. No section/block selector depends on it (profile parser targets
  // the whole div.experiencefragment and reads .cmp-byline), and left in place
  // it would become a bogus section break.
  element
    .querySelectorAll('div.experiencefragment div.separator')
    .forEach((sep) => {
      if (!sep.textContent.trim() && !sep.querySelector('img, picture, a')) sep.remove();
    });

  // Download component: drop empty ones (e.g. western-australia), flatten
  // the <dl> properties into plain paragraphs so they survive as default content.
  element.querySelectorAll('div.download').forEach((dl) => {
    if (!dl.querySelector('a[href]')) {
      dl.remove();
      return;
    }
    dl.querySelectorAll('dl.cmp-download__properties').forEach((props) => {
      const frag = document.createDocumentFragment();
      props.querySelectorAll('.cmp-download__property').forEach((prop) => {
        const label = prop.querySelector('dt');
        const value = prop.querySelector('dd');
        const l = label ? label.textContent.trim() : '';
        const v = value ? value.textContent.trim() : '';
        if (!l && !v) return;
        const p = document.createElement('p');
        p.textContent = l ? `${l}: ${v}` : v;
        frag.appendChild(p);
      });
      props.replaceWith(frag);
    });
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // 1. Per-page cleanup recorded in the catalog (no-op when absent).
    replayPageCleanup(element, payload);
    // 2. Template cleanup rules, outside <main> only (no-op when absent).
    applyCleanupRules(element, payload);
    // 3. Article-specific removals.
    const templateName = payload && payload.template && payload.template.name;
    if (templateName === 'article') {
      cleanupArticle(element, element.ownerDocument || payload.document);
    }

    // Hidden (display: none) content-fragment title repeated in the stats
    // sidebar and inside each tab panel
    // (e.g. <h3 class="cmp-contentfragment__title">Bali Surf Camp</h3>).
    // Removed before parsing so it never lands in the tabs block.
    element
      .querySelectorAll('h3.cmp-contentfragment__title')
      .forEach((el) => el.remove());

    // Empty third-party share widgets in the sidebar
    // (Facebook placeholder div, empty Pinterest anchor).
    element.querySelectorAll('.sharing .fb-share-button').forEach((el) => el.remove());
    element
      .querySelectorAll('.sharing a[href*="pinterest.com"]')
      .forEach((a) => {
        if (!a.textContent.trim() && !a.querySelector('img')) a.remove();
      });

    // Adobe ID syncing iframe / analytics pixels (demdex etc.)
    WebImporter.DOMUtils.remove(element, [
      'iframe[src*="demdex.net"]',
      'iframe[id^="destination_publishing_iframe"]',
      'img[src*="demdex.net"]',
      'img[src*="omtrdc.net"]',
      'img[src*="doubleclick.net"]',
      'img[src*="facebook.com/tr"]',
    ]);
    // Generic 1x1 tracking pixels.
    element
      .querySelectorAll('img[width="1"][height="1"], img[width="0"][height="0"]')
      .forEach((img) => img.remove());

    // Hidden spacer separators (AEM Core separator with cmp-separator--hidden),
    // e.g. top of the FAQ "Need more help?" sidebar. They only wrap an <hr>,
    // which would otherwise become a bogus section break. Only removed when
    // they hold no text or media, so real content is never dropped.
    element.querySelectorAll('.separator.cmp-separator--hidden').forEach((sep) => {
      const hasText = sep.textContent.replace(/\u00a0/g, ' ').trim() !== '';
      const hasMedia = sep.querySelector('img, picture, video, iframe, a');
      if (!hasText && !hasMedia) sep.remove();
    });

    // Empty / whitespace-only (incl. &nbsp;) headings, e.g. the trailing
    // <h3>&nbsp;</h3> in the "How does WKND pay for itself?" FAQ answer.
    element.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      const text = h.textContent.replace(/[\s\u00a0\u200b]/g, '');
      if (!text && !h.querySelector('img, picture, svg, video, a[href]')) h.remove();
    });
  }

  if (hookName === 'afterTransform') {
    // Site chrome: experience-fragment header/footer, mobile nav toggle + menu.
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header',
      'footer.cmp-experiencefragment--footer',
      'header',
      'footer',
      '#toggleNav',
      '#mobileNav',
      '.cmp-navigation--mobile',
      'iframe',
      'script',
      'style',
      'noscript',
      'link',
    ]);

    // Links: site pages drop .html (EDS paths); DAM assets stay on the source host.
    element.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      let parsed;
      try { parsed = new URL(href, 'https://wknd.site'); } catch (e) { return; }
      if (parsed.hostname !== 'wknd.site' || href.startsWith('#')) return;
      if (parsed.pathname.startsWith('/content/dam/')) {
        a.setAttribute('href', `https://wknd.site${parsed.pathname}${parsed.search}`);
      } else if (/\.html$/.test(parsed.pathname)) {
        a.setAttribute('href', `${parsed.pathname.replace(/\.html$/, '')}${parsed.search}${parsed.hash}`);
      }
    });

    // Strip tracking / data-layer attributes left on remaining elements.
    element.querySelectorAll('[data-cmp-data-layer], [data-cmp-clickable], [data-cmp-link-accessibility-enabled]').forEach((el) => {
      el.removeAttribute('data-cmp-data-layer');
      el.removeAttribute('data-cmp-clickable');
      el.removeAttribute('data-cmp-link-accessibility-enabled');
    });
  }
}
