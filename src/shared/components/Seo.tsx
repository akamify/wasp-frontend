import { useEffect } from "react";

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
    ogSiteName = "WaspAkamify",
    twitterCard = "summary_large_image",
}: SeoProps) {
    useEffect(() => {
        const previousTitle = document.title;
        const previousLang = document.documentElement.lang;

        if (title) document.title = title;

        if (description) {
            setMetaTag('meta[name="description"]', { name: "description" }, description);
        }
        if (robots) {
            setMetaTag('meta[name="robots"]', { name: "robots" }, robots);
        }
        setMetaTag('meta[property="og:title"]', { property: "og:title" }, title || previousTitle);
        if (description) {
            setMetaTag('meta[property="og:description"]', { property: "og:description" }, description);
        }
        setMetaTag('meta[property="og:type"]', { property: "og:type" }, ogType);
        setMetaTag('meta[property="og:site_name"]', { property: "og:site_name" }, ogSiteName);
        if (ogImage) {
            setMetaTag('meta[property="og:image"]', { property: "og:image" }, ogImage);
        }
        if (ogImageAlt) {
            setMetaTag('meta[property="og:image:alt"]', { property: "og:image:alt" }, ogImageAlt);
        }
        setMetaTag('meta[name="twitter:card"]', { name: "twitter:card" }, twitterCard);
        setMetaTag('meta[name="twitter:title"]', { name: "twitter:title" }, title || previousTitle);
        if (description) {
            setMetaTag('meta[name="twitter:description"]', { name: "twitter:description" }, description);
        }
        if (canonical) {
            setLinkTag("canonical", canonical);
        }

        return () => {
            document.title = previousTitle;
            document.documentElement.lang = previousLang;
        };
    }, [canonical, description, ogImage, ogImageAlt, ogSiteName, ogType, robots, title, twitterCard]);

    return null;
}
