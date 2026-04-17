import { normalizer } from "@repo/shared/utils";

export const config = {
    app: {
        url: normalizer.string(process.env.NEXT_PUBLIC_APP_URL),
        name: normalizer.string(process.env.NEXT_PUBLIC_APP_NAME),
    },
    api: {
        url: normalizer.string(process.env.NEXT_PUBLIC_API_URL),
        timeout: normalizer.number(process.env.NEXT_PUBLIC_API_TIMEOUT),
    },
} as const;
