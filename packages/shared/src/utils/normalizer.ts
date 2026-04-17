import { isPlainObject } from "./guards";

export const normalizer = {
    number(value: unknown): number {
        const num = Number(value);
        if (Number.isNaN(num)) {
            throw new Error(`Cannot normalize "${value}" to number`);
        }
        return num;
    },

    string(value: unknown): string {
        if (value === null || value === undefined) {
            throw new Error(`Cannot normalize ${value} to string`);
        }
        return String(value).trim();
    },

    boolean(value: unknown): boolean {
        if (value === "true" || value === "1" || value === true) return true;
        if (value === "false" || value === "0" || value === false) return false;
        throw new Error(`Cannot normalize "${value}" to boolean`);
    },

    array<T>(value: unknown): T[] {
        if (Array.isArray(value)) return value as T[];
        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) return parsed as T[];
            } catch {}
        }
        throw new Error(`Cannot normalize "${value}" to array`);
    },

    object<T extends Record<string, unknown>>(value: unknown): T {
        if (isPlainObject(value)) return value as T;
        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);
                if (isPlainObject(parsed)) return parsed as T;
            } catch {}
        }
        throw new Error(`Cannot normalize "${value}" to object`);
    },
} as const;
