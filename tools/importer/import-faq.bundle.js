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

  // tools/importer/import-faq.js
  var import_faq_exports = {};
  __export(import_faq_exports, {
    default: () => import_faq_default
  });

  // tools/importer/parsers/hero-image-only.js
  function parse(element, { document }) {
    const sourceImg = element.querySelector("img.cmp-image__image") || element.querySelector("img");
    if (!sourceImg) return;
    let src = sourceImg.getAttribute("src") || sourceImg.getAttribute("data-cmp-src") || sourceImg.getAttribute("data-src") || "";
    if (!src && sourceImg.getAttribute("srcset")) {
      src = sourceImg.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0];
    }
    if (!src) return;
    const img = document.createElement("img");
    img.src = src;
    img.alt = (sourceImg.getAttribute("alt") || "").trim();
    const title = sourceImg.getAttribute("title");
    if (title) img.title = title;
    const cells = [[[img]]];
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero (image-only)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  var clean = (s) => (s || "").replace(/[\s ​]+/g, " ").trim();
  function answerContent(panel, document) {
    const out = [];
    const parts = panel.querySelectorAll(".cmp-text, .cmp-image, .cmp-title, .cmp-button");
    parts.forEach((part) => {
      if (part.classList.contains("cmp-text")) {
        [...part.children].forEach((child) => {
          if (!clean(child.textContent) && !child.querySelector("img, picture, video, iframe")) return;
          out.push(child);
        });
      } else if (part.classList.contains("cmp-image")) {
        const img = part.querySelector("img");
        if (img) out.push(img);
      } else if (part.classList.contains("cmp-title")) {
        const text = clean(part.textContent);
        if (text) {
          const p = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = text;
          p.append(strong);
          out.push(p);
        }
      } else {
        const a = part.matches("a") ? part : part.querySelector("a");
        if (a && clean(a.textContent)) {
          const p = document.createElement("p");
          p.append(a);
          out.push(p);
        }
      }
    });
    if (!out.length) {
      const text = clean(panel.textContent);
      if (text) {
        const p = document.createElement("p");
        p.textContent = text;
        out.push(p);
      }
    }
    return out;
  }
  function parse2(element, { document }) {
    if (!element.ownerDocument.contains(element)) return;
    const root = element.closest("div.accordion.panelcontainer") || element;
    const accordion = root.matches(".cmp-accordion") ? root : root.querySelector(".cmp-accordion");
    if (!accordion) return;
    const items = [...accordion.children].filter((c) => c.classList.contains("cmp-accordion__item"));
    const cells = [];
    items.forEach((item) => {
      const titleEl = item.querySelector(":scope > .cmp-accordion__header .cmp-accordion__title") || item.querySelector(":scope > .cmp-accordion__header");
      const question = clean(titleEl && titleEl.textContent);
      const panel = item.querySelector(":scope > .cmp-accordion__panel");
      const answer = panel ? answerContent(panel, document) : [];
      if (!question && !answer.length) return;
      let questionCell = "";
      if (question) {
        questionCell = document.createElement("h3");
        questionCell.textContent = question;
      }
      cells.push([questionCell, answer]);
    });
    if (!cells.length) return;
    const block = WebImporter.Blocks.createBlock(document, { name: "Accordion", cells });
    root.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  function normalizeUrl(u) {
    if (!u || typeof u !== "string") return "";
    let str = u.trim().split("#")[0].split("?")[0];
    try {
      const parsed = new URL(str, "https://placeholder.local");
      str = `${parsed.host}${parsed.pathname}`;
    } catch (e) {
    }
    str = str.replace(/\/+$/, "").replace(/(\.plain)?\.html?$/i, "").replace(/\/index$/i, "");
    return str.toLowerCase();
  }
  function pathOnly(normalized) {
    const i = normalized.indexOf("/");
    return i >= 0 ? normalized.slice(i) : normalized;
  }
  function findPageCleanup(pageCleanup, payload) {
    if (!pageCleanup || typeof pageCleanup !== "object") return null;
    const candidates = [
      payload && payload.params && payload.params.originalURL,
      payload && payload.url
    ].filter(Boolean).map(normalizeUrl);
    if (!candidates.length) return null;
    const keys = Object.keys(pageCleanup);
    for (const key of keys) {
      if (candidates.includes(normalizeUrl(key))) return pageCleanup[key];
    }
    const candidatePaths = candidates.map(pathOnly);
    for (const key of keys) {
      if (candidatePaths.includes(pathOnly(normalizeUrl(key)))) return pageCleanup[key];
    }
    return null;
  }
  function safeQueryAll(root, selector) {
    try {
      return Array.from(root.querySelectorAll(selector));
    } catch (e) {
      return [];
    }
  }
  function replayPageCleanup(element, payload) {
    const template = payload && payload.template;
    const entry = template && findPageCleanup(template.pageCleanup, payload);
    if (!entry) return;
    const selectors = Array.isArray(entry) ? entry : entry.selectors || entry.rules || [];
    selectors.forEach((rule) => {
      const sel = typeof rule === "string" ? rule : rule && rule.selector;
      if (!sel) return;
      const matches = safeQueryAll(element, sel);
      if (matches.length === 1) matches[0].remove();
    });
  }
  function applyCleanupRules(element, payload) {
    const rules = payload && payload.template && payload.template.cleanupRules;
    if (!Array.isArray(rules) || !rules.length) return;
    rules.forEach((rule) => {
      const sel = typeof rule === "string" ? rule : rule && rule.selector;
      if (!sel) return;
      safeQueryAll(element, sel).forEach((el) => {
        if (el.tagName !== "MAIN" && !el.closest("main") && el.parentNode) el.remove();
      });
    });
  }
  function cleanupArticle(element, document) {
    const sidebar = "aside.cmp-layoutcontainer--sidebar";
    element.querySelectorAll(`${sidebar} div.title`).forEach((title) => {
      if (title.matches(".cmp-title--black") || /share this story/i.test(title.textContent)) title.remove();
    });
    WebImporter.DOMUtils.remove(element, ["aside div.sharing"]);
    element.querySelectorAll(`${sidebar} .separator.cmp-separator--hidden`).forEach((el) => el.remove());
    element.querySelectorAll(`${sidebar} div.list li.cmp-list__item a.cmp-list__item-link`).forEach((link) => {
      const titleEl = link.querySelector("span.cmp-list__item-title");
      if (!titleEl) return;
      const dateEl = link.querySelector("span.cmp-list__item-date");
      const title = titleEl.textContent.trim();
      const date = dateEl ? dateEl.textContent.trim() : "";
      link.textContent = title;
      if (date) {
        const em = document.createElement("em");
        em.textContent = date;
        link.appendChild(em);
      }
    });
    element.querySelectorAll("div.experiencefragment div.separator").forEach((sep) => {
      if (!sep.textContent.trim() && !sep.querySelector("img, picture, a")) sep.remove();
    });
    element.querySelectorAll("div.download").forEach((dl) => {
      if (!dl.querySelector("a[href]")) {
        dl.remove();
        return;
      }
      dl.querySelectorAll("dl.cmp-download__properties").forEach((props) => {
        const frag = document.createDocumentFragment();
        props.querySelectorAll(".cmp-download__property").forEach((prop) => {
          const label = prop.querySelector("dt");
          const value = prop.querySelector("dd");
          const l = label ? label.textContent.trim() : "";
          const v = value ? value.textContent.trim() : "";
          if (!l && !v) return;
          const p = document.createElement("p");
          p.textContent = l ? `${l}: ${v}` : v;
          frag.appendChild(p);
        });
        props.replaceWith(frag);
      });
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      replayPageCleanup(element, payload);
      applyCleanupRules(element, payload);
      const templateName = payload && payload.template && payload.template.name;
      if (templateName === "article") {
        cleanupArticle(element, element.ownerDocument || payload.document);
      }
      element.querySelectorAll("h3.cmp-contentfragment__title").forEach((el) => el.remove());
      element.querySelectorAll(".sharing .fb-share-button").forEach((el) => el.remove());
      element.querySelectorAll('.sharing a[href*="pinterest.com"]').forEach((a) => {
        if (!a.textContent.trim() && !a.querySelector("img")) a.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        'iframe[src*="demdex.net"]',
        'iframe[id^="destination_publishing_iframe"]',
        'img[src*="demdex.net"]',
        'img[src*="omtrdc.net"]',
        'img[src*="doubleclick.net"]',
        'img[src*="facebook.com/tr"]'
      ]);
      element.querySelectorAll('img[width="1"][height="1"], img[width="0"][height="0"]').forEach((img) => img.remove());
      element.querySelectorAll(".separator.cmp-separator--hidden").forEach((sep) => {
        const hasText = sep.textContent.replace(/\u00a0/g, " ").trim() !== "";
        const hasMedia = sep.querySelector("img, picture, video, iframe, a");
        if (!hasText && !hasMedia) sep.remove();
      });
      element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
        const text = h.textContent.replace(/[\s\u00a0\u200b]/g, "");
        if (!text && !h.querySelector("img, picture, svg, video, a[href]")) h.remove();
      });
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
      element.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        let parsed;
        try {
          parsed = new URL(href, "https://wknd.site");
        } catch (e) {
          return;
        }
        if (parsed.hostname !== "wknd.site" || href.startsWith("#")) return;
        if (parsed.pathname.startsWith("/content/dam/")) {
          a.setAttribute("href", `https://wknd.site${parsed.pathname}${parsed.search}`);
        } else if (/\.html$/.test(parsed.pathname)) {
          a.setAttribute("href", `${parsed.pathname.replace(/\.html$/, "")}${parsed.search}${parsed.hash}`);
        }
      });
      element.querySelectorAll("[data-cmp-data-layer], [data-cmp-clickable], [data-cmp-link-accessibility-enabled]").forEach((el) => {
        el.removeAttribute("data-cmp-data-layer");
        el.removeAttribute("data-cmp-clickable");
        el.removeAttribute("data-cmp-link-accessibility-enabled");
      });
    }
  }

  // tools/importer/parsers/profile.js
  var NETWORK_LABELS = {
    facebook: "Facebook",
    twitter: "Twitter",
    x: "X",
    instagram: "Instagram",
    insta: "Instagram",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    pinterest: "Pinterest",
    tiktok: "TikTok"
  };
  function clean2(text) {
    return (text || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  function capitalize(text) {
    const key = text.toLowerCase();
    if (NETWORK_LABELS[key]) return NETWORK_LABELS[key];
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  function resolveImageSrc(img, scope) {
    let src = img ? img.getAttribute("src") || img.getAttribute("data-src") || "" : "";
    if (src && !src.startsWith("data:")) return src;
    if (img && img.getAttribute("srcset")) {
      return img.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0];
    }
    const holder = img && img.closest("[data-cmp-src]") || scope.querySelector("[data-cmp-src]");
    if (holder) {
      const tpl = holder.getAttribute("data-cmp-src");
      const widths = (holder.getAttribute("data-cmp-widths") || "").split(",").map(Number).filter(Boolean);
      return tpl.replace("{.width}", widths.length ? `.${Math.max(...widths)}` : "");
    }
    const noscript = scope.querySelector("noscript");
    if (noscript) {
      const m = noscript.textContent.match(/<img[^>]+src="([^"]+)"/i);
      if (m) return m[1];
    }
    const asset = scope.querySelector("[data-asset]");
    return asset ? asset.getAttribute("data-asset") : "";
  }
  function buildPhoto(scope, document) {
    const imgScope = scope.querySelector(".cmp-byline__image") || scope;
    const sourceImg = imgScope.querySelector("img");
    const src = resolveImageSrc(sourceImg, imgScope);
    if (!src) return "";
    const img = document.createElement("img");
    img.src = src;
    img.alt = clean2(sourceImg && sourceImg.getAttribute("alt"));
    return img;
  }
  function networkLabel(a) {
    const text = clean2((a.querySelector(".cmp-button__text") || a).textContent);
    if (text) return capitalize(text);
    const icon = a.querySelector('[class*="cmp-button__icon--"]');
    const iconMatch = icon && icon.className.match(/cmp-button__icon--([a-z]+)/);
    if (iconMatch) return capitalize(iconMatch[1]);
    const layer = a.getAttribute("data-cmp-data-layer") || "";
    const titleMatch = layer.match(/"dc:title"\s*:\s*"([^"]+)"/);
    if (titleMatch) return capitalize(clean2(titleMatch[1]));
    const aria = clean2(a.getAttribute("aria-label")).split(" ")[0];
    if (aria) return capitalize(aria);
    const hrefMatch = (a.getAttribute("href") || "").match(/#([a-z]+)/i);
    return hrefMatch ? capitalize(hrefMatch[1]) : "";
  }
  function buildSocialList(links, document) {
    const ul = document.createElement("ul");
    links.forEach((a) => {
      const label = networkLabel(a);
      if (!label) return;
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = a.getAttribute("href") || "#";
      link.textContent = label;
      li.append(link);
      ul.append(li);
    });
    return ul.children.length ? ul : null;
  }
  function buildDetails(person, links, document) {
    const details = [];
    const nameEl = person.querySelector(".cmp-byline__name, h1, h2, h3, h4, h5, h6");
    if (nameEl && clean2(nameEl.textContent)) {
      const h = document.createElement(/^H[1-6]$/.test(nameEl.tagName) ? nameEl.tagName.toLowerCase() : "h2");
      h.textContent = clean2(nameEl.textContent);
      details.push(h);
    }
    const roles = person.querySelectorAll(".cmp-byline__occupations");
    const roleEls = roles.length ? [...roles] : [...person.querySelectorAll("p")].filter((p) => !p.closest(".cmp-button, .cmp-buildingblock--btn-list"));
    roleEls.forEach((r) => {
      const text = clean2(r.textContent);
      if (!text) return;
      const p = document.createElement("p");
      p.textContent = text;
      details.push(p);
    });
    const ul = buildSocialList(links, document);
    if (ul) details.push(ul);
    return details;
  }
  function parse3(element, { document }) {
    const bylines = [...element.querySelectorAll(".cmp-byline")];
    const buttons = [...element.querySelectorAll(".cmp-buildingblock--btn-list a.cmp-button, .cmp-buildingblock--btn-list a[href]")].filter((a, i, all) => all.indexOf(a) === i);
    const cells = [];
    if (bylines.length) {
      const byPerson = bylines.map(() => []);
      buttons.forEach((a) => {
        let idx = 0;
        bylines.forEach((b, i) => {
          if (b.compareDocumentPosition(a) & 4) idx = i;
        });
        byPerson[idx].push(a);
      });
      bylines.forEach((person, i) => {
        const photo = buildPhoto(person, document);
        const details = buildDetails(person, byPerson[i], document);
        if (!photo && !details.length) return;
        cells.push([photo, details]);
      });
    } else {
      const photo = buildPhoto(element, document);
      const links = buttons.length ? buttons : [...element.querySelectorAll("a.cmp-button")];
      const details = buildDetails(element, links, document);
      if (photo || details.length) cells.push([photo, details]);
    }
    if (!cells.length) return;
    const name = bylines.length ? "profile (byline)" : "profile";
    const block = WebImporter.Blocks.createBlock(document, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-contributor-fragments.js
  var BYLINE_SELECTOR = "main.cmp-layout-container--fixed main.container > div.cmp-container > div.experiencefragment";
  var FRAGMENT_ROOT = "/fragments/contributors";
  function toSlug(text) {
    return (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function contributorSlug(element) {
    const xf = element.querySelector('[class*="cmp-experiencefragment--"]');
    const cls = xf && [...xf.classList].find((c) => c.startsWith("cmp-experiencefragment--"));
    if (cls) return toSlug(cls.slice("cmp-experiencefragment--".length));
    const name = element.querySelector(".cmp-byline__name, h2");
    return toSlug(name && name.textContent);
  }
  function transform2(hookName, element, payload) {
    if (hookName !== "beforeTransform") return;
    const { document, params = {} } = payload;
    if (!params.fragments) params.fragments = [];
    element.querySelectorAll(BYLINE_SELECTOR).forEach((byline) => {
      if (!byline.querySelector(".cmp-byline")) return;
      const slug = contributorSlug(byline);
      if (!slug) return;
      const path = `${FRAGMENT_ROOT}/${slug}`;
      const link = document.createElement("a");
      link.href = path;
      link.textContent = path;
      const fragmentBlock = WebImporter.Blocks.createBlock(document, { name: "Fragment", cells: [[link]] });
      const holder = document.createElement("div");
      byline.replaceWith(fragmentBlock);
      holder.append(byline);
      try {
        parse3(byline, { document, url: payload.url, params });
      } catch (e) {
        console.error(`Failed to parse contributor byline ${slug}:`, e);
      }
      if (!params.fragments.some((f) => f.path === path)) {
        params.fragments.push({ element: holder, path });
      }
    });
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
  function transform3(hookName, element, payload) {
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

  // tools/importer/import-faq.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "hero-image-only": parse,
    "accordion": parse2
  };
  var sectionTransformers = [transform3];
  var transformers = [transform, transform2, ...sectionTransformers];
  function executeTransformers(hookName, element, payload, list = transformers) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    list.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template, url) {
    const pageBlocks = [];
    const pageKey = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey(url);
    const claim = (blockDef, selector) => {
      let matches = [];
      try {
        matches = document.querySelectorAll(selector);
      } catch (e) {
        return;
      }
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
  var import_faq_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      params.fragments = [];
      executeTransformers("beforeTransform", main, payload, transformers.filter((fn) => !sectionTransformers.includes(fn)));
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL);
      executeTransformers("beforeTransform", main, payload, sectionTransformers);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
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
      params.fragments.forEach((f) => WebImporter.rules.adjustImageUrls(f.element, url, params.originalURL));
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: [...new Set(pageBlocks.map((b) => b.name))],
          fragments: params.fragments.map((f) => f.path)
        }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_faq_exports);
})();
