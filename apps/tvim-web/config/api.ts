import { normalizer } from "@repo/shared/utils";

export const api = {
    url: normalizer.string(process.env.NEXT_PUBLIC_API_URL),
    timeout: normalizer.number(process.env.NEXT_PUBLIC_API_TIMEOUT),
} as const;
