/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for wknd.site.
 * Uses payload.template.sections: inserts <hr> section breaks in
 * beforeTransform (while parser target elements still exist) and
 * Section Metadata blocks for styled sections in afterTransform.
 */
const MARKER = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector, try next
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = payload && payload.template && payload.template.sections;
  if (!Array.isArray(sections) || sections.length < 2) return;
  const document = element.ownerDocument || payload.document;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const isFirst = i === 0;
      // First section only needs a (temporary) marker when styled.
      if (isFirst && !section.style) continue;
      const el = findSectionElement(element, section);
      if (!el || !el.parentNode) continue;
      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(MARKER, section.id);
      el.parentNode.insertBefore(hr, el);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      const anchor = marker || findSectionElement(element, section);
      if (!anchor || !anchor.parentNode) continue;

      const metadata = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.parentNode.insertBefore(metadata, anchor.nextSibling);

      if (marker) {
        if (i === 0) {
          // Temporary break before a styled first section: drop it so it
          // doesn't open an empty leading section.
          marker.remove();
        } else {
          marker.removeAttribute(MARKER);
        }
      }
    }
  }
}
