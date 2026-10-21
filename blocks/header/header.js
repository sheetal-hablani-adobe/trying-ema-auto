// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 900px)');

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
 * Returns the current path without the local /content prefix and .html extension.
 * @returns {string}
 */
function getPagePath() {
  return window.location.pathname.replace(/^\/content(?=\/)/, '').replace(/\.html$/, '');
}

/**
 * Fetches the first URL that responds OK.
 * @param {string[]} urls candidate URLs, tried in order
 * @returns {Promise<{resp: Response, url: string}|null>}
 */
async function fetchFirst(urls) {
  if (!urls.length) return null;
  const [url, ...rest] = urls;
  const resp = await fetch(url);
  return resp.ok ? { resp, url } : fetchFirst(rest);
}

/**
 * Loads the nav fragment: the locale nav first, then the default nav.
 * @returns {Promise<{html: string, url: string}|null>}
 */
async function fetchNav() {
  const locale = getLocale();
  if (locale) {
    const localized = await fetchFirst([`/content/${locale}/nav.plain.html`, `/${locale}/nav.plain.html`]);
    if (localized) return { html: await localized.resp.text(), url: localized.url };
  }
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  return { html: await resp.text(), url: new URL(resp.url).pathname };
}

/**
 * Resolves relative image paths against the nav fragment's own URL.
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
 * Normalises a link path for comparison (no /content prefix, no .html, no trailing slash).
 * @param {string} href link href
 * @returns {string}
 */
function normalisePath(href) {
  const { pathname } = new URL(href, window.location.origin);
  return pathname.replace(/^\/content(?=\/)/, '').replace(/\.html$/, '').replace(/\/$/, '');
}

/**
 * Closes every open header popup (locale panel, sign-in dialog, mobile menu).
 * @param {Element} nav nav element
 */
function closeAll(nav) {
  nav.querySelectorAll('[aria-expanded="true"]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
  nav.setAttribute('aria-expanded', 'false');
  const dialog = nav.closest('.nav-wrapper')?.querySelector('dialog[open]');
  if (dialog) dialog.close();
  document.body.classList.remove('nav-panel-visible');
  nav.querySelector('.nav-hamburger button')?.setAttribute('aria-label', 'Open navigation');
}

/**
 * Builds the locale selector from the authored country list.
 * @param {Element} list authored <ul> of countries
 * @returns {Element} locale selector
 */
function buildLocaleSelector(list) {
  const currentPath = getLocale() ? `/${getLocale()}` : null;
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-locale';

  list.className = 'nav-locale-list';
  let currentLink = null;
  [...list.children].forEach((country) => {
    country.className = 'nav-locale-country';
    const [flag, name] = country.querySelectorAll(':scope > p');
    if (flag) flag.className = 'nav-locale-flag';
    if (name) name.className = 'nav-locale-name';
    const langs = country.querySelector(':scope > ul');
    if (langs) langs.className = 'nav-locale-langs';
    country.querySelectorAll('a').forEach((a) => {
      if (currentPath && normalisePath(a.href) === currentPath) {
        a.setAttribute('aria-current', 'true');
        currentLink = a;
      }
    });
  });
  if (!currentLink) currentLink = list.querySelector('a');

  const panel = document.createElement('div');
  panel.className = 'nav-locale-panel';
  panel.id = 'nav-locale-panel';
  panel.append(list);

  // the source toggle is a link (#langNavToggle) acting as a button
  const toggle = document.createElement('a');
  toggle.href = '#langNavToggle';
  toggle.setAttribute('role', 'button');
  toggle.className = 'nav-locale-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', panel.id);
  const currentFlag = currentLink?.closest('.nav-locale-country')?.querySelector('img');
  if (currentFlag) toggle.append(currentFlag.cloneNode(true));
  const label = document.createElement('span');
  label.textContent = currentLink ? currentLink.textContent.trim() : '';
  toggle.append(label);
  toggle.setAttribute('aria-label', `Toggle language ${label.textContent}`);
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });

  wrapper.append(toggle, panel);
  return wrapper;
}

/**
 * Builds the sign-in dialog from the authored copy (heading, intro, field labels,
 * forgot-password link, button label). The form is a front-end demo with no backend.
 * @param {Element} section authored sign-in section
 * @returns {HTMLDialogElement}
 */
function buildSignInDialog(section) {
  const dialog = document.createElement('dialog');
  dialog.className = 'nav-signin';
  const title = section.querySelector('h1, h2');
  const intro = section.querySelector('h3, h4');
  if (title) {
    title.id = 'nav-signin-title';
    dialog.setAttribute('aria-labelledby', title.id);
    dialog.append(title);
  }
  if (intro) dialog.append(intro);

  const form = document.createElement('form');
  form.method = 'dialog';
  const types = ['text', 'password'];
  section.querySelectorAll(':scope > ul > li').forEach((li, i) => {
    const input = document.createElement('input');
    const text = li.textContent.trim();
    input.type = types[i] || 'text';
    input.name = text.toLowerCase().replace(/\W+/g, '-');
    input.placeholder = text;
    input.setAttribute('aria-label', text);
    input.autocomplete = input.type === 'password' ? 'current-password' : 'username';
    form.append(input);
  });
  const forgot = section.querySelector('p a');
  if (forgot) {
    const p = document.createElement('p');
    p.className = 'nav-signin-forgot';
    p.append(forgot);
    form.append(p);
  }
  const buttonLabel = section.querySelector('p strong, p b');
  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = buttonLabel ? buttonLabel.textContent.trim() : 'Sign In';
  form.append(button);
  dialog.append(form);
  return dialog;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navData = await fetchNav();
  block.textContent = '';
  if (!navData) return;

  const fragment = document.createElement('div');
  fragment.innerHTML = navData.html;
  resolveImages(fragment, navData.url);
  const [utility, brand, sections, tools, signIn] = fragment.querySelectorAll(':scope > div');

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // utility bar: sign in + locale selector
  const utilityBar = document.createElement('div');
  utilityBar.className = 'nav-utility';
  const utilityInner = document.createElement('div');
  utilityInner.className = 'nav-utility-inner';
  const signInLink = utility?.querySelector('a[href="#sign-in"]');
  if (signInLink) {
    signInLink.className = 'nav-signin-link';
    signInLink.setAttribute('role', 'button');
    utilityInner.append(signInLink);
  }
  const localeList = utility?.querySelector(':scope > ul');
  if (localeList) utilityInner.append(buildLocaleSelector(localeList));
  utilityBar.append(utilityInner);

  // main bar: hamburger, brand, sections, tools
  const mainBar = document.createElement('div');
  mainBar.className = 'nav-main';

  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.querySelector('button').addEventListener('click', () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    hamburger.querySelector('button').setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
    // the source drawer pushes the page aside rather than overlaying it
    document.body.classList.toggle('nav-panel-visible', !expanded);
  });

  const navBrand = document.createElement('div');
  navBrand.className = 'nav-brand';
  if (brand) navBrand.append(...brand.childNodes);

  // the section list is its own landmark, as on the source (nav > ul > li)
  const navSections = document.createElement('nav');
  navSections.className = 'nav-sections';
  navSections.setAttribute('aria-label', 'Main');
  const sectionList = sections?.querySelector('ul');
  if (sectionList) {
    const pagePath = getPagePath();
    // a top-level entry with a nested list (e.g. "Home") is the locale root:
    // it only shows on mobile and is current only on the homepage itself
    sectionList.querySelectorAll(':scope > li').forEach((li) => {
      if (li.querySelector(':scope > ul')) li.classList.add('nav-root');
    });
    sectionList.querySelectorAll('a').forEach((a) => {
      const linkPath = normalisePath(a.href);
      const isRoot = !!a.parentElement.querySelector(':scope > ul');
      if (pagePath === linkPath || (!isRoot && pagePath.startsWith(`${linkPath}/`))) {
        a.setAttribute('aria-current', 'page');
      }
    });
    navSections.append(sectionList);
  }

  const navTools = document.createElement('div');
  navTools.className = 'nav-tools';
  const searchLink = tools?.querySelector('a');
  if (searchLink) {
    const text = searchLink.textContent.trim();
    searchLink.className = 'nav-search';
    searchLink.setAttribute('aria-label', text);
    searchLink.innerHTML = `<span class="nav-search-icon" aria-hidden="true"></span><span class="nav-search-label">${text}</span>`;
    navTools.append(searchLink);
  }

  mainBar.append(hamburger, navBrand, navSections, navTools);
  nav.append(utilityBar, mainBar);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);

  if (signIn && signInLink) {
    const dialog = buildSignInDialog(signIn);
    navWrapper.append(dialog);
    signInLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (dialog.open) dialog.close();
      else dialog.show();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeAll(nav);
  });
  // reset popups and the mobile menu when crossing the desktop breakpoint
  isDesktop.addEventListener('change', () => closeAll(nav));

  block.append(navWrapper);
}
