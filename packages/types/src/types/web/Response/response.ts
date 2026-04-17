import type { ErrorDetail } from "../Error/error";

export type ApiResponseBody<T = unknown> = {
    success: boolean;
    message: string;
    data: T | null;
    errors: ErrorDetail[];
};
