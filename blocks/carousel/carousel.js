import { createOptimizedPicture } from '../../scripts/aem.js';

const LABELS = {
  carousel: 'Carousel',
  controls: 'Carousel Slide Controls',
  previous: 'Previous Slide',
  next: 'Next Slide',
  show: 'Show Slide',
  of: 'of',
};

function updateActiveSlide(block, slideIndex) {
  block.dataset.activeSlide = slideIndex;

  block.querySelectorAll('.carousel-slide').forEach((slide, idx) => {
    const active = idx === slideIndex;
    slide.setAttribute('aria-hidden', !active);
    slide.querySelectorAll('a, button').forEach((el) => {
      if (active) el.removeAttribute('tabindex');
      else el.setAttribute('tabindex', '-1');
    });
  });

  block.querySelectorAll('.carousel-slide-indicator button').forEach((button, idx) => {
    if (idx === slideIndex) {
      button.setAttribute('disabled', '');
      button.setAttribute('aria-current', 'true');
    } else {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-current');
    }
  });
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  if (!slides.length) return;
  let index = slideIndex;
  if (index < 0) index = slides.length - 1;
  if (index >= slides.length) index = 0;
  const target = slides[index];
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: target.offsetLeft,
    behavior: 'smooth',
  });
  updateActiveSlide(block, index);
}

function bindEvents(block) {
  block.querySelectorAll('.carousel-slide-indicator button').forEach((button) => {
    button.addEventListener('click', () => {
      showSlide(block, parseInt(button.parentElement.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev')?.addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) - 1);
  });
  block.querySelector('.slide-next')?.addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) + 1);
  });

  // derive the active slide from scroll position: zero-height slides (images not yet
  // loaded) report as intersecting and would otherwise mark the wrong slide active
  const slidesEl = block.querySelector('.carousel-slides');
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting) || !slidesEl.clientWidth) return;
    const count = block.querySelectorAll('.carousel-slide').length;
    const position = Math.round(slidesEl.scrollLeft / slidesEl.clientWidth);
    const index = Math.min(count - 1, Math.max(0, position));
    if (String(index) !== block.dataset.activeSlide) updateActiveSlide(block, index);
  }, { root: slidesEl, threshold: 0.5 });
  block.querySelectorAll('.carousel-slide').forEach((slide) => observer.observe(slide));
}

function createSlide(row, slideIndex, carouselId, isHero) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.id = `carousel-${carouselId}-slide-${slideIndex}`;
  slide.className = 'carousel-slide';

  const imageCells = [];
  const contentCells = [];
  [...row.children].forEach((cell) => {
    if (!cell.children.length && !cell.textContent.trim()) return;
    const onlyPicture = cell.querySelector('picture, img') && !cell.textContent.trim();
    cell.className = onlyPicture ? 'carousel-slide-image' : 'carousel-slide-content';
    (onlyPicture ? imageCells : contentCells).push(cell);
  });

  if (isHero) {
    // hero: image first, then the overlapping text card, regardless of authored cell order
    slide.append(...imageCells, ...contentCells);
    if (contentCells.length) slide.classList.add('carousel-slide-has-content');
    contentCells.forEach((cell) => {
      cell.querySelectorAll('a').forEach((a) => {
        const p = a.closest('p');
        if (p && p.textContent.trim() === a.textContent.trim()) p.classList.add('carousel-slide-cta');
      });
    });
  } else {
    // default: keep authored order
    [...row.children].forEach((cell) => {
      if (imageCells.includes(cell) || contentCells.includes(cell)) slide.append(cell);
    });
  }

  slide.querySelectorAll('img').forEach((img) => {
    (img.closest('picture') || img).replaceWith(
      createOptimizedPicture(img.src, img.alt, slideIndex === 0, [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }]),
    );
  });

  const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading?.id) slide.setAttribute('aria-labelledby', heading.id);

  return slide;
}

let carouselCount = 0;

export default function decorate(block) {
  carouselCount += 1;
  const carouselId = carouselCount;
  block.id = `carousel-${carouselId}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', LABELS.carousel);
  const isHero = block.classList.contains('hero');

  const rows = [...block.querySelectorAll(':scope > div')]
    .filter((row) => row.textContent.trim() || row.querySelector('picture, img'));
  const isSingleSlide = rows.length < 2;

  const container = document.createElement('div');
  container.className = 'carousel-slides-container';
  const slidesWrapper = document.createElement('ul');
  slidesWrapper.className = 'carousel-slides';

  const controls = document.createElement('div');
  controls.className = 'carousel-controls';

  let indicators;
  if (!isSingleSlide) {
    const indicatorsNav = document.createElement('nav');
    indicatorsNav.setAttribute('aria-label', LABELS.controls);
    indicators = document.createElement('ol');
    indicators.className = 'carousel-slide-indicators';
    indicatorsNav.append(indicators);

    const navButtons = document.createElement('div');
    navButtons.className = 'carousel-navigation-buttons';
    navButtons.innerHTML = `
      <button type="button" class="slide-prev" aria-label="${LABELS.previous}"></button>
      <button type="button" class="slide-next" aria-label="${LABELS.next}"></button>
    `;
    controls.append(indicatorsNav, navButtons);
  }

  rows.forEach((row, idx) => {
    slidesWrapper.append(createSlide(row, idx, carouselId, isHero));
    if (indicators) {
      const indicator = document.createElement('li');
      indicator.className = 'carousel-slide-indicator';
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${LABELS.show} ${idx + 1} ${LABELS.of} ${rows.length}"></button>`;
      indicators.append(indicator);
    }
  });

  container.append(slidesWrapper);
  block.replaceChildren(container);
  if (!isSingleSlide) {
    block.append(controls);
    updateActiveSlide(block, 0);
    bindEvents(block);
  }
}
