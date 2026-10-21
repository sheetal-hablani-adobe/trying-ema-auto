/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for wknd.site (AEM Core Components).
 * Removes non-authorable chrome and widgets; selectors taken from
 * migration-work/cleaned.html (detail-page template).
 */
export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
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

    // Strip tracking / data-layer attributes left on remaining elements.
    element.querySelectorAll('[data-cmp-data-layer], [data-cmp-clickable], [data-cmp-link-accessibility-enabled]').forEach((el) => {
      el.removeAttribute('data-cmp-data-layer');
      el.removeAttribute('data-cmp-clickable');
      el.removeAttribute('data-cmp-link-accessibility-enabled');
    });
  }
}
