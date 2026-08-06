import { normalizer } from "@repo/shared/utils";

const DEFAULT_TIMEOUT_MS = 30_000;

export const api = {
    url: normalizer.string(process.env.NEXT_PUBLIC_API_URL),
    timeout: normalizer.number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? DEFAULT_TIMEOUT_MS),
} as const;
