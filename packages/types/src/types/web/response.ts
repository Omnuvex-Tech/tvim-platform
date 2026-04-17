import type { ErrorDetail } from "./error";

export type ApiResponseBody<T = unknown> = {
    success: boolean;
    message: string;
    data: T | null;
    errors: ErrorDetail[];
};
