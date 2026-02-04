import { DOMParser } from "deno-dom";

export async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { signal: controller.signal });
        return response;
    } finally {
        clearTimeout(id);
    }
}

export async function parseSitemap(xml: string): Promise<string[]> {
    const urls: string[] = [];
    const p = new DOMParser();
    const doc = p.parseFromString(xml, "text/xml");

    if (!doc) return [];

    // Handle sitemap index
    const sitemaps = doc.getElementsByTagName('sitemap');
    if (sitemaps.length > 0) {
        // For now, we just return the sitemaps URLs to be fetched recursively if needed, 
        // or simplistic handling: finding the page-sitemap.xml
        for (const sitemap of sitemaps) {
            const loc = sitemap.getElementsByTagName('loc')[0]?.textContent;
            if (loc && loc.includes('page-sitemap')) {
                return [loc]; // Return this to be fetched again
            }
        }
    }

    const locs = doc.getElementsByTagName('loc');
    for (const loc of locs) {
        if (loc.textContent) {
            urls.push(loc.textContent.trim());
        }
    }

    // Filter for valid pages (rudimentary)
    return urls.filter(u => !u.match(/\.(xml|jpg|png|pdf|css|js)$/i)).slice(0, 50);
}

export function extractPageContent(html: string) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) return null;

    const title = doc.querySelector('title')?.textContent || '';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const h1 = doc.querySelector('h1')?.textContent || '';
    const h2s = Array.from(doc.querySelectorAll('h2')).map((el: any) => el.textContent).filter(Boolean);
    const bodyText = doc.body?.textContent || '';
    const wordCount = bodyText.split(/\s+/).filter((w: string) => w.length > 0).length;

    // Internal/External links
    const anchors = Array.from(doc.querySelectorAll('a')) as HTMLAnchorElement[];
    const internalLinks = anchors.filter((a: HTMLAnchorElement) => {
        const href = a.getAttribute('href');
        return href?.startsWith('/') || href?.includes(doc.baseURI || '');
    }).length;
    const externalLinks = anchors.length - internalLinks;

    return {
        title,
        description,
        h1,
        h2s,
        wordCount,
        links: {
            internal: internalLinks,
            external: externalLinks,
            total: anchors.length
        }
    };
}
