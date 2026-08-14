export type NotifyVariant = "success" | "error";

export type NotifyLink = {
    label: string;
    href: string;
};

export type NotifyOptions = {
    links?: NotifyLink[];
    /** Runs when one of the links is followed, before the toast is dismissed. */
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
