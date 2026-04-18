import { normalizer } from "@repo/shared/utils";

export const system = {
    port: normalizer.number(process.env.NEXT_PUBLIC_PORT),
} as const;