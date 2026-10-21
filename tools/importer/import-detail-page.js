/* eslint-disable */
/* global WebImporter */

import breadcrumbsParser from './parsers/breadcrumbs.js';
import carouselParser from './parsers/carousel.js';
import tabsParser from './parsers/tabs.js';
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

const PAGE_TEMPLATE = {
  "name": "detail-page",
  "urls": [
    "https://wknd.site/us/en/adventures/bali-surf-camp.html",
    "https://wknd.site/ca/en/adventures/bali-surf-camp.html",
    "https://wknd.site/ca/en/adventures/beervana-portland.html",
    "https://wknd.site/ca/en/adventures/climbing-new-zealand.html",
    "https://wknd.site/ca/en/adventures/colorado-rock-climbing.html",
    "https://wknd.site/ca/en/adventures/cycling-southern-utah.html",
    "https://wknd.site/ca/en/adventures/cycling-tuscany.html",
    "https://wknd.site/ca/en/adventures/downhill-skiing-wyoming.html",
    "https://wknd.site/ca/en/adventures/gastronomic-marais-tour.html",
    "https://wknd.site/ca/en/adventures/napa-wine-tasting.html",
    "https://wknd.site/ca/en/adventures/riverside-camping-australia.html",
    "https://wknd.site/ca/en/adventures/ski-touring-mont-blanc.html",
    "https://wknd.site/ca/en/adventures/surf-camp-costa-rica.html",
    "https://wknd.site/ca/en/adventures/tahoe-skiing.html",
    "https://wknd.site/ca/en/adventures/west-coast-cycling.html",
    "https://wknd.site/ca/en/adventures/whistler-mountain-biking.html",
    "https://wknd.site/ca/en/adventures/yosemite-backpacking.html",
    "https://wknd.site/us/en/adventures/beervana-portland.html",
    "https://wknd.site/us/en/adventures/climbing-new-zealand.html",
    "https://wknd.site/us/en/adventures/colorado-rock-climbing.html",
    "https://wknd.site/us/en/adventures/cycling-southern-utah.html",
    "https://wknd.site/us/en/adventures/cycling-tuscany.html",
    "https://wknd.site/us/en/adventures/downhill-skiing-wyoming.html",
    "https://wknd.site/us/en/adventures/gastronomic-marais-tour.html",
    "https://wknd.site/us/en/adventures/napa-wine-tasting.html",
    "https://wknd.site/us/en/adventures/riverside-camping-australia.html",
    "https://wknd.site/us/en/adventures/ski-touring-mont-blanc.html",
    "https://wknd.site/us/en/adventures/surf-camp-costa-rica.html",
    "https://wknd.site/us/en/adventures/tahoe-skiing.html",
    "https://wknd.site/us/en/adventures/west-coast-cycling.html",
    "https://wknd.site/us/en/adventures/whistler-mountain-biking.html",
    "https://wknd.site/us/en/adventures/yosemite-backpacking.html"
  ],
  "coverageGaps": [],
  "description": "Detail page with breadcrumbs, an image carousel and tabbed content panels",
  "blocks": [
    {
      "name": "breadcrumbs",
      "instances": [
        "div.breadcrumb.cmp-breadcrumb--fixed",
        "nav.cmp-breadcrumb"
      ]
    },
    {
      "name": "carousel",
      "instances": [
        "div.carousel.panelcontainer.cmp-carousel--mini",
        ".cmp-carousel"
      ]
    },
    {
      "name": "tabs",
      "instances": [
        "div.tabs.panelcontainer",
        ".cmp-tabs"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc1",
      "name": "breadcrumbs",
      "selector": [
        "div.breadcrumb.cmp-breadcrumb--fixed",
        "nav.cmp-breadcrumb"
      ],
      "style": null,
      "blocks": [
        "breadcrumbs"
      ],
      "defaultContent": []
    },
    {
      "id": "rc2",
      "name": "image-carousel",
      "selector": [
        "div.carousel.panelcontainer.cmp-carousel--mini",
        ".cmp-carousel"
      ],
      "style": null,
      "blocks": [
        "carousel"
      ],
      "defaultContent": []
    },
    {
      "id": "rc4",
      "name": "adventure-title",
      "selector": [
        "div.title.cmp-title--underline",
        "h1.cmp-title__text"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "div.title.cmp-title--underline h1"
      ]
    },
    {
      "id": "rc5",
      "name": "adventure-details",
      "selector": [
        "main.cmp-layout-container--fixed main.container.responsivegrid.aem-GridColumn--default--3",
        "div.tabs.panelcontainer"
      ],
      "style": "split",
      "blocks": [
        "tabs"
      ],
      "defaultContent": [
        "main.cmp-layout-container--fixed main.container.responsivegrid.aem-GridColumn--default--3"
      ]
    }
  ]
};

const parsers = {
  breadcrumbs: breadcrumbsParser,
  carousel: carouselParser,
  tabs: tabsParser,
};
const transformers = [cleanupTransformer, sectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      // skip elements already replaced by an earlier instance selector (nested matches)
      if (!main.contains(block.element)) return;
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
      },
    }];
  },
};
