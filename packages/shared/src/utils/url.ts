export const toHref = (link: string): string => {
    if (link.startsWith("#")) {
        return link;
    }

    if (/^https?:\/\//i.test(link)) {
        return link;
    }

    return `/${link.replace(/^\/+/, "")}`;
};
