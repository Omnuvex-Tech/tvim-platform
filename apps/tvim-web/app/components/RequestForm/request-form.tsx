"use client";

import { RequestForm as RequestFormUI } from "@repo/ui";
import type { RequestFormData, RequestFormField, RequestFormProps, RequestFormSubmitResult } from "@repo/types/types";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { resolveRequestFormSubmitConfig } from "@/lib/request-form";
import { isCompleteAzMobile } from "@repo/shared/utils";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "https://admin.tvim.az/api/v1").replace(/\/+$/, "");

function normalizeAzerbaijanPhone(value: string) {
    const digits = String(value ?? "").replace(/\D/g, "");

    if (digits.startsWith("994") && digits.length === 12) {
        return `+${digits}`;
    }

    if (digits.length === 9) {
        return `+994${digits}`;
    }

    if (digits.startsWith("0") && digits.length === 10) {
        return `+994${digits.slice(1)}`;
    }

    return String(value ?? "").trim();
}

function resolveSubmitUrl(path: string) {
    const normalizedPath = path.trim();

    if (/^https?:\/\//i.test(normalizedPath)) {
        return normalizedPath;
    }

    const withLeadingSlash = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
    return `${API_BASE_URL}${withLeadingSlash}`;
}

function normalizeRequestFormFields(fields: RequestFormField[] | undefined) {
    if (!Array.isArray(fields)) return [] as RequestFormField[];

    const toOrder = (value: unknown) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
    };

    const toIdNumber = (value: unknown) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
    };

    return [...fields]
        .filter((field): field is RequestFormField => Boolean(field) && String((field as any).id ?? "").trim() !== "")
        .sort((a, b) => {
            const orderDiff = toOrder(a.sort_order) - toOrder(b.sort_order);
            if (orderDiff !== 0) return orderDiff;
            return toIdNumber(a.id) - toIdNumber(b.id);
        });
}

function resolveValueForFieldType(type: string, data: RequestFormData) {
    const normalized = type.toLowerCase().trim();
    if (normalized === "textbox") return data.name;
    if (normalized === "phone_number") return data.phone;
    if (normalized === "textarea") return data.description;
    if (normalized === "file") return data.file;
    return null;
}

function extractSuccessMessage(payload: unknown) {
    if (!payload || typeof payload !== "object") return "";

    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();

    const nested = (payload as { data?: { message?: unknown } }).data?.message;
    if (typeof nested === "string" && nested.trim()) return nested.trim();

    return "";
}

function extractOkFlag(payload: unknown) {
    if (!payload || typeof payload !== "object") return false;
    const ok = (payload as { ok?: unknown }).ok;
    if (typeof ok === "boolean") return ok;
    const nestedOk = (payload as { data?: { ok?: unknown } }).data?.ok;
    return typeof nestedOk === "boolean" ? nestedOk : false;
}

const requestFormCopy = {
    az: {
        heading: "Təmir və tikinti üçün lazım olan məhsulları seçməkdə sizə peşəkar dəstək veririk!",
        subheading: "Bir sorğu göndərin və ən qısa zamanda sizinlə əlaqə saxlayaq.",
        submitLabel: "Göndər",
        consentText: "“Göndər” düyməsini klikləməklə, şəxsi məlumatların emalına razılıq verirsiniz.",
        errors: {
            name: "Adınızı daxil edin.",
            phone: "Telefon nömrənizi daxil edin.",
            phoneInvalid: "Düzgün mobil nömrə daxil edin (010, 050, 051, 055, 060, 070, 077, 099).",
            file: "Fayl seçin.",
            description: "Layihəni təsvir edin.",
            submitFailed: "Sorğu göndərilmədi. Bir az sonra yenidən cəhd edin.",
        },
        placeholders: {
            name: "Adınız *",
            phone: "Telefon *",
            file: "Fayl seç",
            description: "Layihəni təsvir edin... *",
        },
    },
    en: {
        heading: "We give you professional support in choosing the products you need for repair and construction!",
        subheading: "Send a request and we will contact you as soon as possible.",
        submitLabel: "Send",
        consentText: "By clicking the “Send” button, you consent to the processing of personal data.",
        errors: {
            name: "Please enter your name.",
            phone: "Please enter your phone number.",
            phoneInvalid: "Enter a valid mobile number (010, 050, 051, 055, 060, 070, 077, 099).",
            file: "Please choose a file.",
            description: "Please describe the project.",
            submitFailed: "The request could not be sent. Please try again shortly.",
        },
        placeholders: {
            name: "Your name *",
            phone: "Phone *",
            file: "Choose file",
            description: "Describe the project... *",
        },
    },
    ru: {
        heading: "Мы оказываем вам профессиональную поддержку в выборе материалов для ремонта и строительства!",
        subheading: "Отправьте запрос, и мы свяжемся с вами в кратчайшие сроки.",
        submitLabel: "Отправить",
        consentText: "Нажимая кнопку «Отправить», вы соглашаетесь на обработку персональных данных.",
        errors: {
            name: "Введите ваше имя.",
            phone: "Введите ваш номер телефона.",
            phoneInvalid: "Введите корректный мобильный номер (010, 050, 051, 055, 060, 070, 077, 099).",
            file: "Выберите файл.",
            description: "Опишите проект.",
            submitFailed: "Запрос не отправлен. Повторите попытку чуть позже.",
        },
        placeholders: {
            name: "Ваше имя *",
            phone: "Телефон *",
            file: "Выберите файл",
            description: "Опишите проект... *",
        },
    },
} as const;

const FIELD_PLACEHOLDER_KEYS: Record<string, "name" | "phone" | "file" | "description"> = {
    textbox: "name",
    text: "name",
    phone_number: "phone",
    phone: "phone",
    file: "file",
    textarea: "description",
};

function placeholdersFromFields(fields: RequestFormField[] | undefined) {
    if (!Array.isArray(fields)) return undefined;

    const resolved: Partial<Record<"name" | "phone" | "file" | "description", string>> = {};

    for (const field of fields) {
        const key = FIELD_PLACEHOLDER_KEYS[String((field as any)?.type ?? "").trim().toLowerCase()];
        if (!key || resolved[key]) continue;

        const label = String((field as any)?.name ?? (field as any)?.label ?? "").trim();
        if (!label) continue;

        resolved[key] = (field as any)?.is_required ? `${label} *` : label;
    }

    return Object.keys(resolved).length > 0 ? resolved : undefined;
}

type RequestFormErrorCopy = Record<"name" | "phone" | "phoneInvalid" | "file" | "description" | "submitFailed", string>;

const FIELD_ERROR_KEYS: Record<string, "name" | "phone" | "file" | "description"> = {
    textbox: "name",
    text: "name",
    phone_number: "phone",
    phone: "phone",
    file: "file",
    textarea: "description",
};


function findFirstValidationError(
    data: RequestFormData,
    fields: RequestFormField[] | undefined,
    errors: RequestFormErrorCopy,
) {
    const isBlank = (key: "name" | "phone" | "file" | "description") => {
        const value = resolveValueForFieldType(
            key === "name" ? "textbox" : key === "phone" ? "phone_number" : key === "file" ? "file" : "textarea",
            data,
        );
        return value instanceof File ? false : !String(value ?? "").trim();
    };

    const required = new Set<"name" | "phone" | "file" | "description">();
    const declared = Array.isArray(fields) ? fields : [];

    for (const field of declared) {
        const key = FIELD_ERROR_KEYS[String(field?.type ?? "").trim().toLowerCase()];
        if (key && field?.is_required) required.add(key);
    }

    if (declared.length === 0) {
        required.add("name");
        required.add("phone");
        required.add("description");
    }

    for (const key of ["name", "phone", "file", "description"] as const) {
        if (required.has(key) && isBlank(key)) return errors[key];
    }

    const phone = String(data.phone ?? "").trim();
    if (phone && !isCompleteAzMobile(phone)) return errors.phoneInvalid;

    return "";
}

const RequestForm = (props: RequestFormProps) => {
    const pathname = usePathname();
    const locale = useMemo(() => {
        const segment = String(pathname ?? "").split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
        return segment === "ru" || segment === "en" || segment === "az" ? segment : "az";
    }, [pathname]);
    const localizedCopy = useMemo(() => requestFormCopy[locale], [locale]);
    const fieldPlaceholders = useMemo(
        () => placeholdersFromFields(props.fields),
        [props.fields],
    );

    const handleSubmit = async (data: RequestFormData) => {
        let successMessage = "";
        let ok = false;
        const normalizedPhone = normalizeAzerbaijanPhone(data.phone);
        const normalizedData = {
            ...data,
            phone: normalizedPhone,
        } satisfies RequestFormData;

        const validationError = findFirstValidationError(normalizedData, props.fields, localizedCopy.errors);
        if (validationError) {
            throw new Error(validationError);
        }

        const send = async (url: string, init: RequestInit) => {
            try {
                return await fetch(url, init);
            } catch {
                throw new Error(localizedCopy.errors.submitFailed);
            }
        };

        const submitConfig = resolveRequestFormSubmitConfig(props.submitConfig);

        if (submitConfig?.path) {
            const method = String(submitConfig.method ?? "POST").toUpperCase();
            const submitUrl = resolveSubmitUrl(submitConfig.path);

            const normalizedFields = normalizeRequestFormFields(props.fields);

            if (normalizedFields.length > 0) {
                const answers: Record<string, string> = {};
                const formData = new FormData();
                let hasFile = false;

                for (const field of normalizedFields) {
                    const key = String(field.id).trim();
                    if (!key) continue;

                    const value = resolveValueForFieldType(String(field.type ?? ""), normalizedData);
                    if (value === null) continue;

                    if (value instanceof File) {
                        hasFile = true;
                        formData.append(`answers[${key}]`, value);
                    } else {
                        const text = String(value ?? "");
                        answers[key] = text;
                        formData.append(`answers[${key}]`, text);
                    }
                }

                const response = await send(submitUrl, {
                    method,
                    body: hasFile ? formData : JSON.stringify({ answers }),
                    headers: {
                        ...(hasFile ? {} : { "Content-Type": "application/json" }),
                        Accept: "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(localizedCopy.errors.submitFailed);
                }

                try {
                    const payload = await response.json();
                    successMessage = extractSuccessMessage(payload);
                    ok = extractOkFlag(payload);
                } catch {
                    successMessage = "";
                    ok = false;
                }
            } else {
                const formData = new FormData();
                formData.append("name", normalizedData.name);
                formData.append("phone", normalizedData.phone);
                formData.append("description", normalizedData.description);

                if (normalizedData.file) {
                    formData.append("file", normalizedData.file);
                }

                const response = await send(submitUrl, {
                    method,
                    body: formData,
                    headers: {
                        Accept: "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(localizedCopy.errors.submitFailed);
                }

                try {
                    const payload = await response.json();
                    successMessage = extractSuccessMessage(payload);
                    ok = extractOkFlag(payload);
                } catch {
                    successMessage = "";
                    ok = false;
                }
            }
        }

        const extra = (await props.onSubmit?.(normalizedData)) as void | RequestFormSubmitResult;
        const message = typeof extra?.message === "string" && extra.message.trim() ? extra.message.trim() : successMessage;
        const mergedOk = typeof extra?.ok === "boolean" ? extra.ok : ok;
        if (message || mergedOk) {
            return { message, ok: mergedOk } satisfies RequestFormSubmitResult;
        }
    };

    return (
        <RequestFormUI
            {...props}
            heading={props.heading?.trim() || localizedCopy.heading}
            subheading={props.subheading?.trim() || localizedCopy.subheading}
            placeholders={{
                ...localizedCopy.placeholders,
                ...fieldPlaceholders,
                ...props.placeholders,
            }}
            submitLabel={props.submitLabel ?? localizedCopy.submitLabel}
            consentText={props.consentText ?? localizedCopy.consentText}
            onSubmit={handleSubmit}
        />
    );
};

export { RequestForm };
export type { RequestFormData, RequestFormProps } from "@repo/types/types";
