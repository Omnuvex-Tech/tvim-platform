export type NotifyVariant = "success" | "error";

export type NotifyItem = {
    id: string;
    variant: NotifyVariant;
    message: string;
};
