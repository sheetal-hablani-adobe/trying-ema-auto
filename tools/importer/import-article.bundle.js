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

  // tools/importer/import-article.js
  var import_article_exports = {};
  __export(import_article_exports, {
    default: () => import_article_default
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

  // tools/importer/parsers/breadcrumbs.js
  function parse2(element, { document }) {
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

  // tools/importer/parsers/quote.js
  var BLOCK_TAGS = /^(P|H[1-6]|UL|OL|DIV)$/;
  function hasText(el) {
    return !!el && el.textContent.replace(/[\s\u00a0\u200b]/g, "") !== "";
  }
  function cleanText(el) {
    return el.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  function parse3(element, { document }) {
    const root = element.querySelector(".cmp-text") || element;
    const blockquote = root.querySelector("blockquote");
    const quoteCell = [];
    let attributionSources = [];
    if (blockquote) {
      const blockChildren = [...blockquote.children].filter((c) => BLOCK_TAGS.test(c.tagName));
      if (blockChildren.length && blockChildren.length === blockquote.children.length) {
        blockChildren.filter(hasText).forEach((c) => quoteCell.push(c));
      } else if (hasText(blockquote)) {
        const p = document.createElement("p");
        p.innerHTML = blockquote.innerHTML.trim();
        p.querySelectorAll("b b, b strong, strong b, strong strong").forEach((inner) => {
          inner.replaceWith(...inner.childNodes);
        });
        quoteCell.push(p);
      }
      attributionSources = [...root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, div")].filter((el) => !blockquote.contains(el) && blockquote.compareDocumentPosition(el) & 4 && !el.querySelector("p, div") && hasText(el));
    } else {
      const parts = [...root.querySelectorAll("p, h1, h2, h3, h4, h5, h6")].filter(hasText);
      if (parts.length) quoteCell.push(parts.shift());
      attributionSources = parts;
    }
    if (!quoteCell.length) return;
    const cells = [[quoteCell]];
    const attribution = attributionSources.map(cleanText).filter(Boolean).join(" ");
    if (attribution) {
      const p = document.createElement("p");
      const em = document.createElement("em");
      em.textContent = attribution;
      p.append(em);
      cells.push([[p]]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "quote", cells });
    element.replaceWith(block);
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
  function clean(text) {
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
    img.alt = clean(sourceImg && sourceImg.getAttribute("alt"));
    return img;
  }
  function networkLabel(a) {
    const text = clean((a.querySelector(".cmp-button__text") || a).textContent);
    if (text) return capitalize(text);
    const icon = a.querySelector('[class*="cmp-button__icon--"]');
    const iconMatch = icon && icon.className.match(/cmp-button__icon--([a-z]+)/);
    if (iconMatch) return capitalize(iconMatch[1]);
    const layer = a.getAttribute("data-cmp-data-layer") || "";
    const titleMatch = layer.match(/"dc:title"\s*:\s*"([^"]+)"/);
    if (titleMatch) return capitalize(clean(titleMatch[1]));
    const aria = clean(a.getAttribute("aria-label")).split(" ")[0];
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
    if (nameEl && clean(nameEl.textContent)) {
      const h = document.createElement(/^H[1-6]$/.test(nameEl.tagName) ? nameEl.tagName.toLowerCase() : "h2");
      h.textContent = clean(nameEl.textContent);
      details.push(h);
    }
    const roles = person.querySelectorAll(".cmp-byline__occupations");
    const roleEls = roles.length ? [...roles] : [...person.querySelectorAll("p")].filter((p) => !p.closest(".cmp-button, .cmp-buildingblock--btn-list"));
    roleEls.forEach((r) => {
      const text = clean(r.textContent);
      if (!text) return;
      const p = document.createElement("p");
      p.textContent = text;
      details.push(p);
    });
    const ul = buildSocialList(links, document);
    if (ul) details.push(ul);
    return details;
  }
  function parse4(element, { document }) {
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
        const hasText2 = sep.textContent.replace(/\u00a0/g, " ").trim() !== "";
        const hasMedia = sep.querySelector("img, picture, video, iframe, a");
        if (!hasText2 && !hasMedia) sep.remove();
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
        parse4(byline, { document, url: payload.url, params });
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

  // tools/importer/import-article.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "hero-image-only": parse,
    "breadcrumbs": parse2,
    "quote": parse3,
    "profile": parse4
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
  var import_article_default = {
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
  return __toCommonJS(import_article_exports);
})();
