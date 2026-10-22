import { createOptimizedPicture } from '../../scripts/aem.js';

const NETWORKS = ['facebook', 'twitter', 'x', 'instagram', 'linkedin', 'youtube', 'pinterest', 'tiktok'];
const ALIASES = {
  fb: 'facebook', insta: 'instagram', ig: 'instagram', yt: 'youtube',
};

/**
 * Maps a word (from link text or a hash href) to a known network, or null.
 * @param {string} word
 * @returns {string|null}
 */
function toNetwork(word) {
  if (ALIASES[word]) return ALIASES[word];
  return NETWORKS.includes(word) ? word : null;
}

/**
 * Returns the social network a link points to, or null.
 * Checks the link host first, then (for placeholder links such as `#insta-name`)
 * the hash, then the visible link text (e.g. "Facebook").
 * @param {HTMLAnchorElement} a
 * @returns {string|null}
 */
function getNetwork(a) {
  let host = '';
  try {
    host = new URL(a.href, window.location.href).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
  const match = NETWORKS.find((n) => host === `${n}.com` || host.endsWith(`.${n}.com`));
  if (match) return match;

  const href = a.getAttribute('href') || '';
  const hints = [
    href.startsWith('#') ? href.slice(1) : '',
    a.textContent,
  ];
  let found = null;
  hints.some((hint) => {
    const words = hint.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    found = words.map(toNetwork).find(Boolean) || null;
    return found;
  });
  return found;
}

/**
 * Decorates one person (one authored row).
 * Photo: first picture. Name: first heading (or first text line).
 * Social links: links that point to a known social network, or links in a list.
 * Everything else with text: roles / description.
 * @param {HTMLElement} row
 * @returns {HTMLElement|null}
 */
function buildProfile(row) {
  const picture = row.querySelector('picture');
  const links = [...row.querySelectorAll('a[href]')].filter((a) => getNetwork(a) || a.closest('li'));

  const item = document.createElement('div');
  item.className = 'profile-item';

  if (picture) {
    const photo = document.createElement('div');
    photo.className = 'profile-photo';
    const img = picture.querySelector('img');
    photo.append(img
      ? createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }])
      : picture);
    picture.remove();
    item.append(photo);
  }

  let social = null;
  if (links.length) {
    social = document.createElement('ul');
    social.className = 'profile-social';
    links.forEach((a) => {
      const network = getNetwork(a);
      const li = document.createElement('li');
      if (network) {
        li.className = `profile-social-${network}`;
        if (!a.getAttribute('aria-label')) a.setAttribute('aria-label', a.textContent.trim() || network);
      }
      const holder = a.closest('li, p');
      li.append(a);
      if (holder && !holder.textContent.trim() && !holder.querySelector('a, picture')) holder.remove();
      social.append(li);
    });
    row.querySelectorAll('ul, ol').forEach((list) => {
      if (!list.textContent.trim()) list.remove();
    });
  }

  const info = document.createElement('div');
  info.className = 'profile-info';
  const textNodes = [...row.querySelectorAll(':scope > div')].flatMap((cell) => [...cell.children])
    .filter((el) => el.textContent.trim());
  // cells that hold plain text directly (no wrapping element)
  row.querySelectorAll(':scope > div').forEach((cell) => {
    if (!cell.children.length && cell.textContent.trim()) textNodes.push(cell);
  });

  let name = textNodes.find((el) => /^H[1-6]$/.test(el.tagName));
  if (!name && textNodes.length) [name] = textNodes;
  textNodes.forEach((el) => {
    if (el === name) {
      if (el.tagName === 'DIV') {
        const p = document.createElement('p');
        p.textContent = el.textContent.trim();
        p.className = 'profile-name';
        info.append(p);
      } else {
        el.classList.add('profile-name');
        info.append(el);
      }
      return;
    }
    let role = el;
    if (el.tagName === 'DIV') {
      role = document.createElement('p');
      role.textContent = el.textContent.trim();
    }
    role.classList.add('profile-role');
    info.append(role);
  });

  if (info.children.length) item.append(info);
  if (social) item.append(social);
  return item.children.length ? item : null;
}

/**
 * Profile block.
 * One row per person: photo cell | details cell (name heading, roles, social links).
 * Default: centred card. `byline`: horizontal author row (photo, name + role, social icons right).
 */
export default function decorate(block) {
  const items = [...block.children].map(buildProfile).filter(Boolean);
  block.replaceChildren(...items);
}
