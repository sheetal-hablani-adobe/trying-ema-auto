/**
 * Breadcrumbs block.
 * Authored content: a list (or any set) of links, optionally followed by plain text
 * for the current page. If nothing usable is authored, the trail is derived from
 * the current URL path and the page title.
 */

function toLabel(segment) {
  return decodeURIComponent(segment)
    .replace(/\.html?$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

function crumbsFromContent(block) {
  const crumbs = [];
  const items = block.querySelectorAll('li');
  if (items.length) {
    items.forEach((li) => {
      const a = li.querySelector('a[href]');
      const label = (a || li).textContent.trim();
      if (label) crumbs.push({ label, href: a ? a.href : null });
    });
    // plain text after the list is the current page
    block.querySelectorAll(':scope > div > div > :not(ul, ol)').forEach((el) => {
      const label = el.textContent.trim();
      if (label && !el.querySelector('li')) crumbs.push({ label, href: null });
    });
    return crumbs;
  }
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const links = cell.querySelectorAll('a[href]');
    if (links.length) {
      links.forEach((a) => {
        const label = a.textContent.trim();
        if (label) crumbs.push({ label, href: a.href });
      });
    } else {
      const label = cell.textContent.trim();
      if (label) crumbs.push({ label, href: null });
    }
  });
  return crumbs;
}

function crumbsFromPath() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const crumbs = segments.map((segment, i) => ({
    label: toLabel(segment),
    href: `/${segments.slice(0, i + 1).join('/')}`,
  }));
  if (crumbs.length) {
    const title = document.querySelector('h1')?.textContent.trim();
    const last = crumbs[crumbs.length - 1];
    if (title) last.label = title;
    last.href = null;
  }
  return crumbs;
}

export default function decorate(block) {
  let crumbs = crumbsFromContent(block);
  if (!crumbs.length) crumbs = crumbsFromPath();

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  ol.className = 'breadcrumbs-list';

  crumbs.forEach((crumb, i) => {
    const li = document.createElement('li');
    li.className = 'breadcrumbs-item';
    const isLast = i === crumbs.length - 1;
    if (crumb.href && !isLast) {
      const a = document.createElement('a');
      a.href = crumb.href;
      a.textContent = crumb.label;
      li.append(a);
    } else {
      const span = document.createElement('span');
      span.textContent = crumb.label;
      if (isLast) span.setAttribute('aria-current', 'page');
      li.append(span);
    }
    ol.append(li);
  });

  nav.append(ol);
  block.replaceChildren(nav);
}
