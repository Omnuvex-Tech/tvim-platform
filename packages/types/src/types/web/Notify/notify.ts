export type NotifyVariant = "success" | "error";

export type NotifyOptions = {
    /** Makes the whole toast clickable; clicking it also dismisses the toast. */
    onClick?: () => void;
};

export type NotifyItem = {
    id: string;
    variant: NotifyVariant;
    message: string;
    onClick?: () => void;
    isEntering?: boolean;
    isLeaving?: boolean;
};
