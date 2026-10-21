/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-detail-page.js
  var import_detail_page_exports = {};
  __export(import_detail_page_exports, {
    default: () => import_detail_page_default
  });

  // tools/importer/parsers/breadcrumbs.js
  function parse(element, { document }) {
    const items = Array.from(element.querySelectorAll("li.cmp-breadcrumb__item"));
    const list = document.createElement("ul");
    let currentTitle = "";
    items.forEach((item) => {
      const link = item.querySelector("a[href]");
      const label = (link || item).textContent.replace(/\s+/g, " ").trim();
      if (!label) return;
      if (link && !item.classList.contains("cmp-breadcrumb__item--active")) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = link.getAttribute("href").replace(/\.html(?=$|[?#])/, "");
        a.textContent = label;
        li.append(a);
        list.append(li);
      } else {
        currentTitle = label;
      }
    });
    const contentCell = [];
    if (list.children.length) contentCell.push(list);
    if (currentTitle) {
      const p = document.createElement("p");
      p.textContent = currentTitle;
      contentCell.push(p);
    }
    const cells = [[contentCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: "breadcrumbs", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel.js
  function parse2(element, { document }) {
    const slides = Array.from(element.querySelectorAll(".cmp-carousel__item"));
    const rows = slides.map((slide) => {
      const img = slide.querySelector("picture") || slide.querySelector("img");
      const textParts = Array.from(
        slide.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, .cmp-image__title, .cmp-teaser__description, a.cmp-teaser__action-link")
      ).filter((el) => {
        if (!el.textContent.trim()) return false;
        const parent = el.parentElement && el.parentElement.closest("h1, h2, h3, h4, h5, h6, p, ul, ol, .cmp-teaser__description");
        return !(parent && slide.contains(parent));
      });
      return { img, textParts };
    }).filter((row) => row.img);
    const hasText = rows.some((row) => row.textParts.length);
    const cells = rows.map(({ img, textParts }) => hasText ? [img, textParts.length ? textParts : ""] : [img]);
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs.js
  var CONTENT_SELECTOR = "h1, h2, h3, h4, h5, h6, p, ul, ol, table, blockquote, picture, img";
  var INLINE_TAGS = /* @__PURE__ */ new Set(["A", "B", "STRONG", "I", "EM", "U", "SPAN", "BR", "SUP", "SUB", "CODE", "SMALL", "MARK"]);
  function collectContent(node, document, out = []) {
    let buffer = [];
    const flush = () => {
      if (buffer.some((n) => n.textContent.trim() || n.nodeType === 1 && n.querySelector("img"))) {
        const p = document.createElement("p");
        buffer.forEach((n) => p.append(n));
        out.push(p);
      }
      buffer = [];
    };
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        buffer.push(child);
      } else if (child.nodeType === 1) {
        if (child.matches(CONTENT_SELECTOR)) {
          flush();
          if (child.matches("img, picture") || child.textContent.trim() || child.querySelector("img, picture")) {
            out.push(child);
          }
        } else if (INLINE_TAGS.has(child.tagName)) {
          buffer.push(child);
        } else {
          flush();
          collectContent(child, document, out);
        }
      }
    });
    flush();
    return out;
  }
  function parse3(element, { document }) {
    const tabs = Array.from(element.querySelectorAll(".cmp-tabs__tab"));
    const panels = Array.from(element.querySelectorAll(".cmp-tabs__tabpanel"));
    const cells = [];
    tabs.forEach((tab, index) => {
      const label = tab.textContent.replace(/\s+/g, " ").trim();
      if (!label) return;
      const panelId = tab.getAttribute("aria-controls") || (tab.id ? tab.id.replace(/-tab$/, "-tabpanel") : "");
      const panel = panelId && panels.find((p) => p.id === panelId) || panels[index];
      const root = panel && (panel.querySelector(".cmp-contentfragment__elements") || panel);
      const content = root ? collectContent(root, document) : [];
      cells.push([label, content.length ? content : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      element.querySelectorAll("h3.cmp-contentfragment__title").forEach((el) => el.remove());
      element.querySelectorAll(".sharing .fb-share-button").forEach((el) => el.remove());
      element.querySelectorAll('.sharing a[href*="pinterest.com"]').forEach((a) => {
        if (!a.textContent.trim() && !a.querySelector("img")) a.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        'iframe[src*="demdex.net"]',
        'iframe[id^="destination_publishing_iframe"]',
        'img[src*="demdex.net"]',
        'img[src*="omtrdc.net"]'
      ]);
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        "header.cmp-experiencefragment--header",
        "footer.cmp-experiencefragment--footer",
        "header",
        "footer",
        "#toggleNav",
        "#mobileNav",
        ".cmp-navigation--mobile",
        "iframe",
        "script",
        "style",
        "noscript",
        "link"
      ]);
      element.querySelectorAll("[data-cmp-data-layer], [data-cmp-clickable], [data-cmp-link-accessibility-enabled]").forEach((el) => {
        el.removeAttribute("data-cmp-data-layer");
        el.removeAttribute("data-cmp-clickable");
        el.removeAttribute("data-cmp-link-accessibility-enabled");
      });
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections;
    if (!Array.isArray(sections) || sections.length < 2) return;
    const document = element.ownerDocument || payload.document;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const isFirst = i === 0;
        if (isFirst && !section.style) continue;
        const el = findSectionElement(element, section);
        if (!el || !el.parentNode) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        el.parentNode.insertBefore(hr, el);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        const anchor = marker || findSectionElement(element, section);
        if (!anchor || !anchor.parentNode) continue;
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.parentNode.insertBefore(metadata, anchor.nextSibling);
        if (marker) {
          if (i === 0) {
            marker.remove();
          } else {
            marker.removeAttribute(MARKER);
          }
        }
      }
    }
  }

  // tools/importer/import-detail-page.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    breadcrumbs: parse,
    carousel: parse2,
    tabs: parse3
  };
  var transformers = [transform, transform2];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
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
  var import_detail_page_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: [...new Set(pageBlocks.map((b) => b.name))]
        }
      }];
    }
  };
  return __toCommonJS(import_detail_page_exports);
})();
