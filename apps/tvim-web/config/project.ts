import { normalizer } from "@repo/shared/utils";

export const project = {
    url: normalizer.string(process.env.NEXT_PUBLIC_APP_URL),
    /**
     * Where the site is published, which is what canonical and hreflang urls
     * must point at. NEXT_PUBLIC_APP_URL is where this instance happens to be
     * reachable and is not always the same host, so it is only the fallback.
     */
    siteUrl:
        normalizer.string(process.env.NEXT_PUBLIC_SITE_URL) ||
        normalizer.string(process.env.NEXT_PUBLIC_APP_URL),
    name: normalizer.string(process.env.NEXT_PUBLIC_APP_NAME),
    projectName: "Tvim | Tikinti Materialları və İnşaat Materialları",
    projectDescription: "Tvim - Azərbaycanda tikinti materialları, inşaat materialları və təmir məhsullarının onlayn satışı.",
    keywords: ["tikinti materialları", "inşaat materialları", "təmir", "Tvim", "Azərbaycan"],
    defLang: "az",
} as const;
