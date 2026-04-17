import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = "AZN"): string {
    return new Intl.NumberFormat("az-AZ", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(price);
}
