/* eslint-disable */
/* global WebImporter */

import heroImageOnlyParser from './parsers/hero-image-only.js';
import breadcrumbsParser from './parsers/breadcrumbs.js';
import quoteParser from './parsers/quote.js';
import profileParser from './parsers/profile.js';
import cleanupTransformer from './transformers/wknd-cleanup.js';
import contributorFragmentsTransformer from './transformers/wknd-contributor-fragments.js';
import sectionsTransformer from './transformers/wknd-sections.js';

const PAGE_TEMPLATE = {
  "name": "article",
  "urls": [
    "https://wknd.site/ca/en/magazine/arctic-surfing.html",
    "https://wknd.site/ca/en/magazine/guide-la-skateparks.html",
    "https://wknd.site/ca/en/magazine/members-only/alaskan-adventure.html",
    "https://wknd.site/ca/en/magazine/members-only/fly-fishing-the-amazon.html",
    "https://wknd.site/ca/en/magazine/san-diego-surf.html",
    "https://wknd.site/ca/en/magazine/ski-touring.html",
    "https://wknd.site/ca/en/magazine/western-australia.html",
    "https://wknd.site/us/en/magazine/arctic-surfing.html",
    "https://wknd.site/us/en/magazine/guide-la-skateparks.html",
    "https://wknd.site/us/en/magazine/san-diego-surf.html",
    "https://wknd.site/us/en/magazine/ski-touring.html",
    "https://wknd.site/us/en/magazine/western-australia.html"
  ],
  "description": "Long-form article with hero image, breadcrumbs, author byline, pull quotes and inline images in the body",
  "blocks": [
    {
      "name": "hero-image-only",
      "instances": [
        "main.cmp-layout-container--fixed > div.cmp-container > div.aem-Grid > div.image"
      ]
    },
    {
      "name": "breadcrumbs",
      "instances": [
        "main.cmp-layout-container--fixed > div.cmp-container > div.aem-Grid > div.breadcrumb"
      ]
    },
    {
      "name": "quote",
      "instances": [
        "article.contentfragment div.text.cmp-text--quote"
      ],
      "pageInstances": {
        "https://wknd.site/ca/en/magazine/guide-la-skateparks.html": [
          "#contentfragment-c33562458a > div > div:nth-child(2) > div:nth-child(2) > div > div.text.cmp-text--quote.aem-GridColumn.aem-GridColumn--default--12"
        ],
        "https://wknd.site/ca/en/magazine/members-only/alaskan-adventure.html": [
          "#contentfragment-da62ddbb66 > div > div:nth-child(2) > div:nth-child(6)"
        ],
        "https://wknd.site/ca/en/magazine/ski-touring.html": [
          "#contentfragment-b066f43096 > div > div:nth-child(2) > div:nth-child(2) > div > div.text.cmp-text--quote.aem-GridColumn.aem-GridColumn--default--12"
        ],
        "https://wknd.site/ca/en/magazine/western-australia.html": [
          "#contentfragment-210d8d3282 > div > div:nth-child(2) > div:nth-child(2)"
        ],
        "https://wknd.site/us/en/magazine/guide-la-skateparks.html": [
          "#contentfragment-1dac24729b > div > div:nth-child(2) > div:nth-child(2) > div > div.text.cmp-text--quote.aem-GridColumn.aem-GridColumn--default--12"
        ],
        "https://wknd.site/us/en/magazine/ski-touring.html": [
          "#contentfragment-906f1eecc2 > div > div:nth-child(2) > div:nth-child(2) > div > div.text.cmp-text--quote.aem-GridColumn.aem-GridColumn--default--12"
        ],
        "https://wknd.site/us/en/magazine/western-australia.html": [
          "#contentfragment-9fa4745cf6 > div > div:nth-child(2) > div:nth-child(2)"
        ]
      }
    },
    {
      "name": "profile",
      "instances": [
        "main.cmp-layout-container--fixed main.container > div.cmp-container > div.experiencefragment"
      ],
      "pageInstances": {
        "https://wknd.site/ca/en/magazine/arctic-surfing.html": [
          "#container-3cf9457313 > div.experiencefragment"
        ],
        "https://wknd.site/ca/en/magazine/guide-la-skateparks.html": [
          "#container-6720009e64 > div.experiencefragment"
        ],
        "https://wknd.site/ca/en/magazine/members-only/alaskan-adventure.html": [
          "#container-ee62c0dd17 > div.experiencefragment"
        ],
        "https://wknd.site/ca/en/magazine/members-only/fly-fishing-the-amazon.html": [
          "#container-9d49132d6f > div.experiencefragment"
        ],
        "https://wknd.site/ca/en/magazine/san-diego-surf.html": [
          "#container-66ceb663d3 > div.experiencefragment"
        ],
        "https://wknd.site/ca/en/magazine/ski-touring.html": [
          "#container-5dfaba72e4 > div.experiencefragment"
        ],
        "https://wknd.site/ca/en/magazine/western-australia.html": [
          "#container-0a536d9395 > div.experiencefragment"
        ],
        "https://wknd.site/us/en/magazine/arctic-surfing.html": [
          "#container-641a40404e > div.experiencefragment"
        ],
        "https://wknd.site/us/en/magazine/guide-la-skateparks.html": [
          "#container-a7678c5eec > div.experiencefragment"
        ],
        "https://wknd.site/us/en/magazine/san-diego-surf.html": [
          "#container-fca115ba19 > div.experiencefragment"
        ],
        "https://wknd.site/us/en/magazine/ski-touring.html": [
          "#container-2a69b0225c > div.experiencefragment"
        ],
        "https://wknd.site/us/en/magazine/western-australia.html": [
          "#container-fc6c2f500a > div.experiencefragment"
        ]
      }
    }
  ],
  "sections": [
    {
      "id": "article-hero",
      "name": "article-hero",
      "selector": [
        "main.cmp-layout-container--fixed > div.cmp-container > div.aem-Grid > div.image"
      ],
      "style": null,
      "blocks": [
        "hero-image-only"
      ],
      "defaultContent": []
    },
    {
      "id": "article-breadcrumbs",
      "name": "article-breadcrumbs",
      "selector": [
        "main.cmp-layout-container--fixed > div.cmp-container > div.aem-Grid > div.breadcrumb"
      ],
      "style": null,
      "blocks": [
        "breadcrumbs"
      ],
      "defaultContent": []
    },
    {
      "id": "article-body",
      "name": "article-body",
      "selector": [
        "main.cmp-layout-container--fixed main.container > div.cmp-container"
      ],
      "style": "article",
      "blocks": [
        "quote",
        "profile"
      ],
      "defaultContent": [
        "main.cmp-layout-container--fixed main.container > div.cmp-container > div.title",
        "main.cmp-layout-container--fixed main.container > div.cmp-container > article.contentfragment"
      ]
    },
    {
      "id": "article-sidebar",
      "name": "article-sidebar",
      "selector": [
        "aside.cmp-layoutcontainer--sidebar"
      ],
      "style": "sidebar",
      "blocks": [],
      "defaultContent": [
        "aside.cmp-layoutcontainer--sidebar div.download",
        "aside.cmp-layoutcontainer--sidebar div.list"
      ]
    }
  ]
};

const parsers = {
  'hero-image-only': heroImageOnlyParser,
  'breadcrumbs': breadcrumbsParser,
  'quote': quoteParser,
  'profile': profileParser,
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
