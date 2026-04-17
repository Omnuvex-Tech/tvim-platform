import type { ErrorDetail, ApiResponseBody } from "@repo/types/types";

export class ApiResponse<T = unknown> {
    readonly success: boolean;
    readonly message: string;
    readonly data: T | null;
    readonly errors: ErrorDetail[];

    constructor(body: ApiResponseBody<T>) {
        this.success = body.success;
        this.message = body.message;
        this.data = body.data;
        this.errors = body.errors;
    }

    getFieldError = (field: string): string | undefined => {
        const error = this.errors.find((e) => e.field === field);
        return error?.message;
    };

    getFieldErrors = (): Record<string, string> => {
        const result: Record<string, string> = {};

        for (const error of this.errors) {
            if (error.field) {
                result[error.field] = error.message;
            }
        }

        return result;
    };

    getGeneralErrors = (): string[] => {
        return this.errors
            .filter((e) => !e.field)
            .map((e) => e.message);
    };
}
