/* eslint-disable */
/* global WebImporter */

import heroImageOnlyParser from './parsers/hero-image-only.js';
import accordionParser from './parsers/accordion.js';
import cleanupTransformer from './transformers/wknd-cleanup.js';
import contributorFragmentsTransformer from './transformers/wknd-contributor-fragments.js';
import sectionsTransformer from './transformers/wknd-sections.js';

const PAGE_TEMPLATE = {
  "name": "faq",
  "urls": [
    "https://wknd.site/ca/en/faqs.html",
    "https://wknd.site/us/en/faqs.html"
  ],
  "description": "FAQ page with a hero banner and an accordion of question-and-answer items",
  "blocks": [
    {
      "name": "hero-image-only",
      "instances": [
        "div.aem-GridColumn--default--8 div.image .cmp-image"
      ]
    },
    {
      "name": "accordion",
      "instances": [
        "div.accordion.panelcontainer",
        ".cmp-accordion"
      ],
      "pageInstances": {
        "https://wknd.site/ca/en/faqs.html": [
          "#container-1b01500a52 > div > div.accordion.panelcontainer.aem-GridColumn--tablet--12.aem-GridColumn--phone--none.aem-GridColumn--phone--12.aem-GridColumn.aem-GridColumn--default--8.aem-GridColumn--offset--phone--0"
        ],
        "https://wknd.site/us/en/faqs.html": [
          "#container-0e3ddb0dd6 > div > div.accordion.panelcontainer.aem-GridColumn--tablet--12.aem-GridColumn--phone--none.aem-GridColumn--phone--12.aem-GridColumn.aem-GridColumn--default--8.aem-GridColumn--offset--phone--0"
        ]
      }
    }
  ],
  "sections": [
    {
      "id": "s1",
      "name": "faq-main",
      "selector": [
        "div.container.responsivegrid.aem-GridColumn--default--8"
      ],
      "style": "article",
      "blocks": [
        "hero-image-only",
        "accordion"
      ],
      "defaultContent": [
        "div.aem-GridColumn--default--8 div.title.cmp-title--underline",
        "div.aem-GridColumn--default--8 > div > div > div.text"
      ]
    },
    {
      "id": "s2",
      "name": "need-more-help",
      "selector": [
        "div.container.responsivegrid.aem-GridColumn--default--3"
      ],
      "style": "sidebar",
      "blocks": [],
      "defaultContent": [
        "div.container.responsivegrid.aem-GridColumn--default--3"
      ]
    }
  ]
};

const parsers = {
  'hero-image-only': heroImageOnlyParser,
  'accordion': accordionParser,
};
// Section transformers insert <hr> markers, so their beforeTransform runs after block discovery.
const sectionTransformers = [sectionsTransformer];
// Contributor bylines move into their own fragment documents before block discovery.
const transformers = [cleanupTransformer, contributorFragmentsTransformer, ...sectionTransformers];

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

    executeTransformers('beforeTransform', main, payload, transformers.filter((fn) => !sectionTransformers.includes(fn)));
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL);
    executeTransformers('beforeTransform', main, payload, sectionTransformers);

    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    params.fragments.forEach((f) => WebImporter.rules.adjustImageUrls(f.element, url, params.originalURL));

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: [...new Set(pageBlocks.map((b) => b.name))],
        fragments: params.fragments.map((f) => f.path),
      },
    }, ...params.fragments];
  },
};
