import { useEffect } from "react";
import { BRAND_NAME } from "@shared/config/brand";

type SeoProps = {
    title?: string;
    description?: string;
    robots?: string;
    canonical?: string;
    ogType?: string;
    ogImage?: string;
    ogImageAlt?: string;
    ogSiteName?: string;
    twitterCard?: string;
    structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
};

function setMetaTag(selector: string, attributes: Record<string, string>, content?: string) {
    let element = document.head.querySelector<HTMLMetaElement>(selector);
    if (!element) {
        element = document.createElement("meta");
        Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
        document.head.appendChild(element);
    }
    if (content == null) {
        element.remove();
        return;
    }
    Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
    element.setAttribute("content", content);
}

function setLinkTag(rel: string, href?: string) {
    const selector = `link[rel="${rel}"]`;
    let element = document.head.querySelector<HTMLLinkElement>(selector);
    if (!href) {
        element?.remove();
        return;
    }
    if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
    }
    element.setAttribute("href", href);
}

export function Seo({
    title,
    description,
    robots,
    canonical,
    ogType = "website",
    ogImage,
    ogImageAlt,
    ogSiteName = BRAND_NAME,
    twitterCard = "summary_large_image",
    structuredData,
}: SeoProps) {
    useEffect(() => {
        if (title) document.title = title;

        if (description) {
            setMetaTag('meta[name="description"]', { name: "description" }, description);
        }
        if (robots) {
            setMetaTag('meta[name="robots"]', { name: "robots" }, robots);
        }
        setMetaTag('meta[property="og:title"]', { property: "og:title" }, title );
        if (description) {
            setMetaTag('meta[property="og:description"]', { property: "og:description" }, description);
        }
        setMetaTag('meta[property="og:type"]', { property: "og:type" }, ogType);
        setMetaTag('meta[property="og:site_name"]', { property: "og:site_name" }, ogSiteName);
        if (canonical) {
            setMetaTag('meta[property="og:url"]', { property: "og:url" }, canonical);
        }
        if (ogImage) {
            setMetaTag('meta[property="og:image"]', { property: "og:image" }, ogImage);
            setMetaTag('meta[name="twitter:image"]', { name: "twitter:image" }, ogImage);
        }
        if (ogImageAlt) {
            setMetaTag('meta[property="og:image:alt"]', { property: "og:image:alt" }, ogImageAlt);
        }
        setMetaTag('meta[name="twitter:card"]', { name: "twitter:card" }, twitterCard);
        setMetaTag('meta[name="twitter:title"]', { name: "twitter:title" }, title );
        if (description) {
            setMetaTag('meta[name="twitter:description"]', { name: "twitter:description" }, description);
        }
        if (canonical) {
            setLinkTag("canonical", canonical);
        }

        const scriptId = "structured-data-jsonld";
        let script = document.head.querySelector<HTMLScriptElement>(`#${scriptId}`);
        if (structuredData) {
            if (!script) {
                script = document.createElement("script");
                script.id = scriptId;
                script.type = "application/ld+json";
                document.head.appendChild(script);
            }
            script.textContent = JSON.stringify(structuredData);
        } else {
            script?.remove();
        }

        // Intentionally do not restore previous title on unmount. In a single-page
        // app multiple `Seo` components can mount/unmount and restoring the
        // previous title can cause stale titles to re-appear after navigation.
        // Cleanup is intentionally left empty so the most-recently mounted
        // `Seo` controls the document title.
        return () => { };
    }, [canonical, description, ogImage, ogImageAlt, ogSiteName, ogType, robots, structuredData, title, twitterCard]);

    return null;
}
