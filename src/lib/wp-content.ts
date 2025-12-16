// src/lib/wp-content.ts
import { wpQuery } from "./wp";

export type WpBlock = {
  name: string;
  attributes?: Record<string, any>;
  innerBlocks?: WpBlock[];
};

export interface WpEntry {
  title: string;
  slug: string;
  date?: string | null;
  content: string;
  blocks?: WpBlock[];
}

export type WpType = "post" | "page";

const TYPE_CONFIG: Record<WpType, { single: string; plural: string }> = {
  post: { single: "post", plural: "posts" },
  page: { single: "page", plural: "pages" },
};

export async function getStaticPathsForType(type: WpType) {
  const { plural } = TYPE_CONFIG[type];

  if (type === "page") {
    const LIST_QUERY = `
      query AllPages {
        pages(first: 100) {
          nodes {
            slug
            uri
          }
        }
      }
    `;

    const result = await wpQuery<{
      pages: { nodes: { slug: string; uri: string }[] };
    }>(LIST_QUERY);

    const nodes = result.pages.nodes;

    return nodes.map((node) => {
      // z.B. uri: "/seitentyp-a/seitentyp-a-a/"
      // => "seitentyp-a/seitentyp-a-a"
      const slugPath = node.uri.replace(/^\/|\/$/g, "");

      return {
        // WICHTIG: slug ist ein STRING, KEIN Array
        // für [...slug].astro darf hier z.B. "seitentyp-a/seitentyp-a-a" stehen
        params: { slug: slugPath },
        // Props: der WP-Slug der eigentlichen Seite (z.B. "seitentyp-a-a")
        props: { slug: node.slug },
      };
    });
  }

  // POSTS bleiben wie bisher
  if (type === "post") {
    const LIST_QUERY = `
      query AllPosts {
        posts(first: 100) {
          nodes {
            slug
          }
        }
      }
    `;

    const result = await wpQuery<{
      posts: { nodes: { slug: string }[] };
    }>(LIST_QUERY);

    const nodes = result.posts.nodes;

    return nodes.map((node) => ({
      params: { slug: node.slug },
      props: { slug: node.slug },
    }));
  }

  throw new Error(`Unsupported type "${type}" in getStaticPathsForType`);
}

export async function getEntryBySlug(
  type: WpType,
  slug: string,
): Promise<WpEntry> {
  if (type === "post") {
    const ENTRY_QUERY = `
      query PostBySlug($slug: ID!) {
        post(id: $slug, idType: SLUG) {
          title
          slug
          date
          content(format: RENDERED)
        }
      }
    `;

    const data = await wpQuery<{ post: WpEntry | null }>(ENTRY_QUERY, {
      slug,
    });

    if (!data.post) {
      throw new Error(`post with slug "${slug}" not found`);
    }

    return data.post;
  }

  if (type === "page") {
    const ENTRY_QUERY = `
      query PageBySlug($slug: String!) {
        pages(where: { name: $slug }) {
          nodes {
            title
            slug
            date
            content(format: RENDERED)
            blocks(attributes: true)
          }
        }
      }
    `;

    const data = await wpQuery<{
      pages: { nodes: WpEntry[] };
    }>(ENTRY_QUERY, { slug });

    const page = data.pages.nodes[0];

    if (!page) {
      throw new Error(`page with slug "${slug}" not found`);
    }

    return {
      ...page,
      blocks: page.blocks ?? [],
    };
  }

  throw new Error(`Unsupported type "${type}" in getEntryBySlug`);
}
