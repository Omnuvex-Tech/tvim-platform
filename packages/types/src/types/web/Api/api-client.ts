export type RequestOptions = RequestInit & {
    params?: Record<string, string>;
    locale?: string;
    /**
     * Next Data Cache seçimləri. `RequestInit` bu paketdə Next-in tip
     * genişlənməsini görmür, ona görə açıq şəkildə elan olunur.
     */
    next?: {
        revalidate?: number | false;
        tags?: string[];
    };
};
