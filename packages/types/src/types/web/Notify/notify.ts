export type NotifyVariant = "success" | "error";

export type NotifyLink = {
    label: string;
    href: string;
    /** The product name is set apart from the rest of the sentence in bold. */
    isBold?: boolean;
};

export type NotifyOptions = {
    links?: NotifyLink[];
    onNavigate?: () => void;
};

export type NotifyItem = {
    id: string;
    variant: NotifyVariant;
    message: string;
    links?: NotifyLink[];
    onNavigate?: () => void;
    isEntering?: boolean;
    isLeaving?: boolean;
};
