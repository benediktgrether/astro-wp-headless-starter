// src/lib/wp-menu.ts
import { parse as parseHtml, HTMLElement } from "node-html-parser";

export interface MenuItem {
  label: string;
  url: string;
  children: MenuItem[];
}

const WP_URL = import.meta.env.WP_URL ?? "http://astro-demo.local";

export async function getFseMenu(slug: string): Promise<MenuItem[]> {
  const res = await fetch(`${WP_URL}/wp-json/wp/v2/navigation?slug=${slug}`);

  if (!res.ok) {
    console.error("Failed to fetch navigation", res.status, res.statusText);
    return [];
  }

  const json = await res.json();

  if (!Array.isArray(json) || json.length === 0) return [];

  const nav = json[0];
  const renderedHtml: string = nav.content?.rendered ?? "";

  const root = parseHtml(renderedHtml);

  // 1. Versuch: echtes <ul> finden (Navigation- oder Page-List-Container)
  let navUl =
    root.querySelector("ul.wp-block-navigation__container") ||
    root.querySelector("ul.wp-block-page-list");

  // NEU: wenn kein <ul>-Container da ist, aber einzelne <li>s → künstlich wrappen
  if (!navUl) {
    const hasTopLevelLis =
      root.querySelectorAll(
        ":scope > li.wp-block-navigation-item, :scope > li.wp-block-pages-list__item",
      ).length > 0;

    if (hasTopLevelLis) {
      // Wir bauen selbst ein <ul> um dein Markup
      const wrapped = parseHtml(
        `<ul class="wp-block-navigation__container">${renderedHtml}</ul>`,
      );

      navUl =
        wrapped.querySelector("ul.wp-block-navigation__container") ||
        wrapped.querySelector("ul");

      if (!navUl) return [];

      return parseUniversalList(navUl as HTMLElement);
    }

    // Fallback wie bisher: irgendein <ul>
    navUl = root.querySelector("ul");
  }

  if (!navUl) return [];

  return parseUniversalList(navUl as HTMLElement);
}

// UNIVERSAL-PARSER !! (unverändert)
function parseUniversalList(ul: HTMLElement): MenuItem[] {
  const items: MenuItem[] = [];

  const liSelectors = [
    ":scope > li.wp-block-navigation-item",
    ":scope > li.wp-block-navigation__container-item",
    ":scope > li.wp-block-pages-list__item",
    ":scope > li.menu-item-home",
  ];

  const lis = ul.querySelectorAll(liSelectors.join(","));

  lis.forEach((li) => {
    const aNav = li.querySelector("a.wp-block-navigation-item__content");
    const aPage = li.querySelector("a.wp-block-pages-list__item__link");
    const a = aNav || aPage || li.querySelector("a");

    if (!a) return;

    let rawUrl = a.getAttribute("href") ?? "#";
    const label = a.text.trim();

    try {
      const base = new URL(WP_URL);
      const absolute = new URL(rawUrl, base);
      rawUrl = absolute.pathname;
    } catch (e) {
      // ignore, rawUrl bleibt so
    }

    const submenu =
      li.querySelector(":scope > ul.wp-block-navigation__submenu-container") ||
      li.querySelector(":scope > ul");

    const children = submenu ? parseUniversalList(submenu as HTMLElement) : [];

    items.push({
      label,
      url: rawUrl,
      children,
    });
  });

  return items;
}
