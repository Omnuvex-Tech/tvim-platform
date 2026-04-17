"use client";

import { useNotify } from "@repo/ui";
import { ApiResponse } from "@/classes";
import type { ApiResponseBody } from "@repo/types/types";

const fakeSuccessBody: ApiResponseBody<{ id: number; name: string }> = {
    success: true,
    message: "Uğurla əlavə edildi!",
    data: { id: 1, name: "Test Product" },
    errors: [],
};

const fakeErrorBody: ApiResponseBody<null> = {
    success: false,
    message: "Validasiya xətası",
    data: null,
    errors: [
        { code: "REQUIRED", message: "Ad sahəsi tələb olunur", field: "name" },
        { code: "REQUIRED", message: "Qiymət sahəsi tələb olunur", field: "price" },
        { code: "SERVER_ERROR", message: "Serverlə əlaqə xətası" },
    ],
};

const TestNotifyMultiplePage = () => {
    const notify = useNotify();

    const handleSuccess = () => {
        const response = new ApiResponse(fakeSuccessBody);
        notify.success(response.message);
    };

    const handleError = (showFieldErrors: boolean) => {
        const response = new ApiResponse(fakeErrorBody);

        const generalErrors = response.getGeneralErrors();
        for (const msg of generalErrors) {
            notify.error(msg);
        }

        if (showFieldErrors) {
            const fieldErrors = response.getFieldErrors();
            for (const field of Object.keys(fieldErrors)) {
                notify.error(`${field}: ${fieldErrors[field]}`);
            }
        }
    };

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
            <h1 className="text-2xl font-bold">ApiResponse + Notify Test (Field Errors)</h1>

            <div className="flex gap-4">
                <button
                    type="button"
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    onClick={handleSuccess}
                >
                    Success Response
                </button>

                <button
                    type="button"
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    onClick={() => handleError(true)}
                >
                    Error Response (with field errors)
                </button>
            </div>
        </div>
    );
};

export default TestNotifyMultiplePage;
