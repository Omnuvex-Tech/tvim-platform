"use client";

import { usePathname } from "next/navigation";
import {
    createContext,
    useCallback,
    useContext,
    useLayoutEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export type LocalizedLinkMap = Record<string, string>;

type LocalizedLinksEntry = {
    pathname: string;
    links: LocalizedLinkMap;
};

type LocalizedLinksStore = {
    entry: LocalizedLinksEntry | null;
    publish: (pathname: string, links: LocalizedLinkMap | null | undefined) => void;
};

const LocalizedLinksContext = createContext<LocalizedLinksStore | null>(null);

/**
 * Slug-driven pages (products, menu pages, brands, news) publish their own
 * per-locale slug map for the navbar's language switcher. The navbar lives in
 * the [locale] layout while the map is page data, so it travels up through
 * this context instead of down as a prop.
 *
 * The published value is stored against the pathname it came from and read
 * back only for a matching pathname. A page that publishes nothing therefore
 * cannot inherit the previous page's map, and no ordering assumption is made
 * about when a child's effect runs relative to the provider's — which is what
 * a plain "reset on navigation" effect would have depended on, wrongly, since
 * child effects run before parent ones.
 */
export function LocalizedLinksProvider({ children }: { children: ReactNode }) {
    const [entry, setEntry] = useState<LocalizedLinksEntry | null>(null);

    const publish = useCallback((pathname: string, links: LocalizedLinkMap | null | undefined) => {
        setEntry((current) => {
            const hasLinks = !!links && Object.keys(links).length > 0;

            if (!hasLinks) {
                return current?.pathname === pathname ? null : current;
            }

            if (current?.pathname === pathname && shallowEqual(current.links, links)) {
                return current;
            }

            return { pathname, links };
        });
    }, []);

    const value = useMemo<LocalizedLinksStore>(() => ({ entry, publish }), [entry, publish]);

    return <LocalizedLinksContext.Provider value={value}>{children}</LocalizedLinksContext.Provider>;
}

/** The current page's slug map, or null when it did not publish one. */
export function useLocalizedLinks(): LocalizedLinkMap | null {
    const store = useContext(LocalizedLinksContext);
    const pathname = usePathname();

    if (!store?.entry) return null;
    return store.entry.pathname === pathname ? store.entry.links : null;
}

/**
 * Rendered by a page to hand its slug map to the navbar. Renders nothing.
 */
export function LocalizedLinks({ value }: { value?: LocalizedLinkMap | null }) {
    const store = useContext(LocalizedLinksContext);
    const pathname = usePathname();
    const publish = store?.publish;

    // The map is a fresh object on every server render, so the effect keys off
    // its contents rather than its identity.
    const serialized = JSON.stringify(value ?? null);

    useLayoutEffect(() => {
        if (!publish) return;

        publish(pathname, JSON.parse(serialized) as LocalizedLinkMap | null);
    }, [publish, pathname, serialized]);

    return null;
}

function shallowEqual(a: LocalizedLinkMap, b: LocalizedLinkMap) {
    const aKeys = Object.keys(a);
    if (aKeys.length !== Object.keys(b).length) return false;
    return aKeys.every((key) => a[key] === b[key]);
}
