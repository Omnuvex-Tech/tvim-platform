export type NotifyVariant = "success" | "error";

export type NotifyLink = {
    label: string;
    href: string;
};

export type NotifyOptions = {
    /** Turns the label where it appears in the message into a link. */
    link?: NotifyLink;
    /** Renders this part of the message in a lighter colour. */
    muted?: string;
};

export type NotifyItem = {
    id: string;
    variant: NotifyVariant;
    message: string;
    link?: NotifyLink;
    muted?: string;
    isEntering?: boolean;
    isLeaving?: boolean;
};
