/**
 * Returns the locale folder of the current page (e.g. "ca/en"), if any.
 * Local preview serves pages under /content, so that prefix is ignored.
 * @returns {string|null}
 */
function getLocale() {
  const match = window.location.pathname.match(/^\/(?:content\/)?([a-z]{2})\/([a-z]{2})(?=\/|\.|$)/);
  return match ? `${match[1]}/${match[2]}` : null;
}

/**
 * Fetches the first URL that responds OK.
 * @param {string[]} urls candidate URLs, tried in order
 * @returns {Promise<Response|null>}
 */
async function fetchFirst(urls) {
  if (!urls.length) return null;
  const [url, ...rest] = urls;
  const resp = await fetch(url);
  return resp.ok ? resp : fetchFirst(rest);
}

/**
 * Loads the footer fragment: the locale footer first, then the default footer.
 * @returns {Promise<{html: string, url: string}|null>}
 */
async function fetchFooter() {
  const locale = getLocale();
  if (locale) {
    const localized = await fetchFirst([`/content/${locale}/footer.plain.html`, `/${locale}/footer.plain.html`]);
    if (localized) return { html: await localized.text(), url: new URL(localized.url).pathname };
  }
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  return { html: await resp.text(), url: new URL(resp.url).pathname };
}

/**
 * Resolves relative image paths against the fragment's own URL.
 * @param {Element} root fragment root
 * @param {string} baseUrl URL the fragment was fetched from
 */
function resolveImages(root, baseUrl) {
  const base = new URL(baseUrl, window.location.origin);
  const isRelative = (src) => !/^(https?:|data:|\/)/.test(src);
  const resolve = (src) => {
    const url = new URL(src, base);
    return `${url.pathname}${url.search}`;
  };
  root.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (isRelative(src)) img.src = resolve(src);
  });
  root.querySelectorAll('source[srcset]').forEach((source) => {
    const srcset = source.getAttribute('srcset');
    if (isRelative(srcset)) source.srcset = resolve(srcset);
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const data = await fetchFooter();
  block.textContent = '';
  if (!data) return;

  const fragment = document.createElement('div');
  fragment.innerHTML = data.html;
  resolveImages(fragment, data.url);
  const [brand, links, social, legal] = fragment.querySelectorAll(':scope > div');

  const inner = document.createElement('div');
  inner.className = 'footer-inner';

  const top = document.createElement('div');
  top.className = 'footer-top';

  if (brand) {
    const footerBrand = document.createElement('div');
    footerBrand.className = 'footer-brand';
    footerBrand.append(...brand.childNodes);
    top.append(footerBrand);
  }

  const list = links?.querySelector('ul');
  if (list) {
    const nav = document.createElement('nav');
    nav.className = 'footer-nav';
    nav.setAttribute('aria-label', 'Footer navigation');
    // a top-level entry wrapping a nested list is the locale root (hidden on desktop)
    list.querySelectorAll(':scope > li').forEach((li) => {
      if (li.querySelector(':scope > ul')) li.classList.add('footer-nav-root');
    });
    // mark the current section (the source underlines it); the root is current only on the homepage
    const normalise = (href) => new URL(href, window.location.origin).pathname
      .replace(/^\/content(?=\/)/, '').replace(/\.html$/, '').replace(/\/$/, '');
    const pagePath = normalise(window.location.href);
    list.querySelectorAll('a').forEach((a) => {
      const linkPath = normalise(a.href);
      const isRoot = !!a.parentElement.querySelector(':scope > ul');
      if (pagePath === linkPath || (!isRoot && pagePath.startsWith(`${linkPath}/`))) {
        a.setAttribute('aria-current', 'page');
      }
    });
    nav.append(list);
    top.append(nav);
  }

  if (social) {
    const footerSocial = document.createElement('div');
    footerSocial.className = 'footer-social';
    const heading = social.querySelector('h1, h2, h3, h4, h5, h6');
    const icons = social.querySelector('ul');
    if (heading) footerSocial.append(heading);
    if (icons) {
      // render each authored icon image as a decorative glyph (like the source's icon font);
      // the link keeps the image's alt text as its accessible name
      icons.querySelectorAll('a').forEach((a) => {
        const img = a.querySelector('img');
        if (!img) return;
        if (!a.getAttribute('aria-label')) a.setAttribute('aria-label', img.alt);
        const glyph = document.createElement('span');
        glyph.className = 'footer-social-icon';
        glyph.setAttribute('aria-hidden', 'true');
        glyph.style.setProperty('--footer-icon', `url("${img.getAttribute('src')}")`);
        (img.closest('picture') || img).replaceWith(glyph);
      });
      icons.className = 'footer-social-list';
      footerSocial.append(icons);
    }
    top.append(footerSocial);
  }

  inner.append(top);

  if (legal) {
    const footerLegal = document.createElement('div');
    footerLegal.className = 'footer-legal';
    footerLegal.append(...legal.childNodes);
    inner.append(footerLegal);
  }

  block.append(inner);
}
