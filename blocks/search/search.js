import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

/**
 * Search block.
 * Authored content (all optional):
 * - a link to a JSON index (defaults to /query-index.json)
 * - plain text used as the input placeholder
 */

const DEFAULT_PLACEHOLDER = 'Search...';
const NO_RESULTS = 'No results found.';

function findNextHeading(block) {
  const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .filter((h) => !block.contains(h)
      && h.compareDocumentPosition(block) === Node.DOCUMENT_POSITION_FOLLOWING);
  const last = headings.pop();
  if (!last) return 'H2';
  const level = parseInt(last.nodeName[1], 10);
  return level < 6 ? `H${level + 1}` : 'H6';
}

function highlight(terms, element) {
  if (!element?.textContent) return;
  const { textContent } = element;
  const lower = textContent.toLowerCase();
  const matches = [];
  terms.forEach((term) => {
    let offset = lower.indexOf(term);
    while (offset >= 0) {
      matches.push({ offset, length: term.length });
      offset = lower.indexOf(term, offset + term.length);
    }
  });
  if (!matches.length) return;
  matches.sort((a, b) => a.offset - b.offset);
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  matches.forEach(({ offset, length }) => {
    if (offset < cursor) return;
    if (offset > cursor) fragment.append(textContent.substring(cursor, offset));
    const mark = document.createElement('mark');
    mark.textContent = textContent.substring(offset, offset + length);
    fragment.append(mark);
    cursor = offset + length;
  });
  if (cursor < textContent.length) fragment.append(textContent.substring(cursor));
  element.replaceChildren(fragment);
}

let indexCache = null;
async function fetchIndex(source) {
  if (indexCache?.source === source) return indexCache.data;
  try {
    const resp = await fetch(source);
    if (!resp.ok) return [];
    const json = await resp.json();
    const data = Array.isArray(json?.data) ? json.data : [];
    indexCache = { source, data };
    return data;
  } catch (e) {
    return [];
  }
}

function filterData(terms, data) {
  const inTitle = [];
  const inMeta = [];
  data.forEach((result) => {
    const title = `${result.header || result.title || ''}`.toLowerCase();
    if (terms.some((t) => title.includes(t))) {
      inTitle.push(result);
      return;
    }
    const meta = `${result.title || ''} ${result.description || ''} ${(result.path || '').split('/').pop()}`.toLowerCase();
    if (terms.some((t) => meta.includes(t))) inMeta.push(result);
  });
  return [...inTitle, ...inMeta];
}

function renderResult(result, terms, titleTag) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = result.path || '#';
  if (result.image) {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-result-image';
    wrapper.append(createOptimizedPicture(result.image, '', false, [{ width: '375' }]));
    a.append(wrapper);
  }
  if (result.title) {
    const title = document.createElement(titleTag);
    title.className = 'search-result-title';
    title.textContent = result.title;
    highlight(terms, title);
    a.append(title);
  }
  if (result.description) {
    const p = document.createElement('p');
    p.textContent = result.description;
    highlight(terms, p);
    a.append(p);
  }
  li.append(a);
  return li;
}

function updateUrl(value) {
  if (!window.history.replaceState) return;
  const url = new URL(window.location.href);
  if (value) url.searchParams.set('q', value);
  else url.searchParams.delete('q');
  window.history.replaceState({}, '', url.toString());
}

export default async function decorate(block) {
  const source = block.querySelector('a[href]')?.href
    || `${window.hlx?.codeBasePath || ''}/query-index.json`;
  const authoredText = [...block.querySelectorAll(':scope > div > div')]
    .filter((cell) => !cell.querySelector('a'))
    .map((cell) => cell.textContent.trim())
    .find(Boolean);
  const placeholder = authoredText || DEFAULT_PLACEHOLDER;

  const box = document.createElement('div');
  box.className = 'search-box';
  const icon = document.createElement('span');
  icon.className = 'icon icon-search';
  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'search-input';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);
  box.append(icon, input);

  const results = document.createElement('ul');
  results.className = 'search-results';
  results.setAttribute('role', 'status');
  results.setAttribute('aria-live', 'polite');
  const titleTag = findNextHeading(block);

  const clear = () => {
    results.replaceChildren();
    results.classList.remove('no-results');
  };

  const run = async () => {
    const value = input.value.trim();
    updateUrl(value);
    if (value.length < 3) {
      clear();
      return;
    }
    const terms = value.toLowerCase().split(/\s+/).filter(Boolean);
    const data = await fetchIndex(source);
    if (input.value.trim() !== value) return;
    const filtered = filterData(terms, data);
    clear();
    if (filtered.length) {
      filtered.forEach((r) => results.append(renderResult(r, terms, titleTag)));
    } else {
      results.classList.add('no-results');
      const li = document.createElement('li');
      li.textContent = NO_RESULTS;
      results.append(li);
    }
  };

  input.addEventListener('input', run);
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      updateUrl('');
      clear();
    }
  });

  block.replaceChildren(box, results);
  decorateIcons(block);

  const q = new URLSearchParams(window.location.search).get('q');
  if (q) {
    input.value = q;
    run();
  }
}
