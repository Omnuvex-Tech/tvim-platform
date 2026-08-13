"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Phone, UserRound, X } from "lucide-react";
import { useNotify, Spinner } from "@repo/ui";
import { config } from "@/config";
import { useLanguageStore } from "@/stores";
import { localizedHref } from "@/lib/routes";
import { getTranslations } from "@/lib/i18n";

type RegisterFormProps = {
    locale: string;
};

type RegisterPayload = {
    name: string;
    surname: string;
    email: string;
    phone: string;
    country_id: number | null;
    password: string;
    password_confirmation: string;
};

type RegisterField = keyof RegisterPayload;

type RegisterErrors = Partial<Record<RegisterField, string>>;

type RegisterResponse = {
    success?: boolean;
    message?: string;
    data?: {
        message?: string;
    };
    errors?: Array<{
        field?: string;
        message?: string;
    }>;
};

type SubscribeResponse = {
    success?: boolean;
    message?: string;
    data?: {
        id?: number;
        email?: string;
        created_at?: string;
    };
    errors?: {
        email?: string[];
    };
};

type ReCaptchaVerifyResponse = {
    success?: boolean;
    message?: string;
};

type ReCaptchaRenderOptions = {
    sitekey: string;
    callback?: (token: string) => void;
    "expired-callback"?: () => void;
    "error-callback"?: () => void;
};

type ReCaptchaApi = {
    render?: (container: HTMLElement, options: ReCaptchaRenderOptions) => number;
    reset?: (widgetId: number) => void;
    ready?: (callback: () => void) => void;
    enterprise?: {
        render?: (container: HTMLElement, options: ReCaptchaRenderOptions) => number;
        reset?: (widgetId: number) => void;
        ready?: (callback: () => void) => void;
    };
};

type WindowWithReCaptcha = Window & {
    grecaptcha?: ReCaptchaApi;
};

const RECAPTCHA_TEST_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

const getReCaptchaController = (win: WindowWithReCaptcha) => {
    const recaptcha = win.grecaptcha;
    if (!recaptcha) {
        return null;
    }

    if (typeof recaptcha.render === "function") {
        return {
            render: recaptcha.render,
            reset: recaptcha.reset,
            ready: recaptcha.ready,
        };
    }

    if (recaptcha.enterprise && typeof recaptcha.enterprise.render === "function") {
        return {
            render: recaptcha.enterprise.render,
            reset: recaptcha.enterprise.reset,
            ready: recaptcha.enterprise.ready,
        };
    }

    return null;
};

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

const AZ_COUNTRY_CODE = "994";
const AZ_LOCAL_PHONE_LENGTH = 9;

const extractAzerbaijanLocalDigits = (value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits.startsWith(AZ_COUNTRY_CODE)) {
        return digits.slice(AZ_COUNTRY_CODE.length, AZ_COUNTRY_CODE.length + AZ_LOCAL_PHONE_LENGTH);
    }

    return digits.slice(0, AZ_LOCAL_PHONE_LENGTH);
};

const formatAzerbaijanPhone = (value: string) => {
    const localDigits = extractAzerbaijanLocalDigits(value);
    if (!localDigits) return "";

    const part1 = localDigits.slice(0, 2);
    const part2 = localDigits.slice(2, 5);
    const part3 = localDigits.slice(5, 7);
    const part4 = localDigits.slice(7, 9);

    let formatted = "+994";

    if (part1) {
        formatted += ` (${part1}`;
        if (part1.length === 2) {
            formatted += ")";
        }
    }

    if (part2) {
        formatted += ` ${part2}`;
    }

    if (part3) {
        formatted += ` ${part3}`;
    }

    if (part4) {
        formatted += ` ${part4}`;
    }

    return formatted;
};

const countLocalDigitsBeforeCursor = (value: string, cursorPosition: number) => {
    const limit = Math.max(0, Math.min(cursorPosition, value.length));
    const leftPart = value.slice(0, limit);
    return extractAzerbaijanLocalDigits(leftPart).length;
};

const getCursorPositionFromLocalDigits = (formatted: string, localDigitsCount: number) => {
    if (!formatted) return 0;
    if (localDigitsCount <= 0) {
        return Math.min(formatted.length, 4);
    }

    let countryDigitsLeft = AZ_COUNTRY_CODE.length;
    let seenLocalDigits = 0;

    for (let i = 0; i < formatted.length; i += 1) {
        const char = formatted[i] ?? "";
        if (!/\d/.test(char)) continue;

        if (countryDigitsLeft > 0) {
            countryDigitsLeft -= 1;
            continue;
        }

        seenLocalDigits += 1;
        if (seenLocalDigits >= localDigitsCount) {
            let nextCursor = i + 1;

            // Keep caret on the next editable slot, not between formatting chars.
            while (nextCursor < formatted.length && /\D/.test(formatted[nextCursor] ?? "")) {
                nextCursor += 1;
            }

            return nextCursor;
        }
    }

    return formatted.length;
};

const isKnownField = (field: string): field is RegisterField => {
    return ["name", "surname", "email", "phone", "country_id", "password", "password_confirmation"].includes(field);
};

const extractFieldErrors = (payload: unknown): RegisterErrors => {
    const result: RegisterErrors = {};

    if (!payload || typeof payload !== "object") {
        return result;
    }

    const data = payload as Record<string, unknown>;

    const nestedErrors = data.errors;
    if (nestedErrors && typeof nestedErrors === "object" && !Array.isArray(nestedErrors)) {
        for (const [key, value] of Object.entries(nestedErrors as Record<string, unknown>)) {
            if (!isKnownField(key) || result[key]) continue;

            if (typeof value === "string" && value.trim()) {
                result[key] = value;
                continue;
            }

            if (Array.isArray(value) && value.length > 0) {
                const first = value.find((item) => typeof item === "string" && item.trim());
                if (typeof first === "string") {
                    result[key] = first;
                }
            }
        }
    }

    if (Array.isArray(data.errors)) {
        for (const item of data.errors) {
            if (!item || typeof item !== "object") continue;
            const error = item as { field?: unknown; message?: unknown };
            const field = typeof error.field === "string" ? error.field : "";
            const message = typeof error.message === "string" ? error.message : "";
            if (isKnownField(field) && message) {
                result[field] = message;
            }
        }
    }

    for (const [key, value] of Object.entries(data)) {
        if (!isKnownField(key) || result[key]) continue;
        if (typeof value === "string" && value.trim()) {
            result[key] = value;
            continue;
        }

        if (Array.isArray(value) && value.length > 0) {
            const first = value[0];
            if (typeof first === "string" && first.trim()) {
                result[key] = first;
            }
        }
    }

    return result;
};

const sanitizeSummaryMessage = (message: string) => {
    return message.replace(/\s*\(and\s+\d+\s+more\s+errors\)\s*$/i, "").trim();
};

const getFirstFieldError = (errors: RegisterErrors) => {
    const firstMessage = Object.values(errors).find((value) => typeof value === "string" && value.trim());
    return typeof firstMessage === "string" ? firstMessage : "";
};

const extractSubscribeErrorMessage = (payload: unknown): string => {
    if (!payload || typeof payload !== "object") {
        return "";
    }

    const data = payload as Record<string, unknown>;
    const responseMessage = typeof data.message === "string" ? data.message : "";
    const errors = data.errors;

    if (errors && typeof errors === "object" && !Array.isArray(errors)) {
        const emailErrors = (errors as Record<string, unknown>).email;
        if (Array.isArray(emailErrors)) {
            const firstError = emailErrors.find((item) => typeof item === "string" && item.trim());
            if (typeof firstError === "string") {
                return firstError;
            }
        }

        if (typeof emailErrors === "string" && emailErrors.trim()) {
            return emailErrors;
        }
    }

    return responseMessage;
};

const RegisterForm = ({ locale }: RegisterFormProps) => {
    const notify = useNotify();
    const router = useRouter();
    const { locale: storedLocale } = useLanguageStore();
    const recaptchaSiteKey = useMemo(() => {
        const envKey = (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "").trim();
        if (envKey) {
            return envKey;
        }

        if (process.env.NODE_ENV !== "production") {
            return RECAPTCHA_TEST_SITE_KEY;
        }

        return "";
    }, []);
    const registerUrl = useMemo(
        () => normalizeApiUrl(config.api.url, config.endpoints.auth.register),
        []
    );
    const subscribeUrl = useMemo(
        () => normalizeApiUrl(config.api.url, config.endpoints.subscription.create),
        []
    );
    const effectiveLocale = useMemo(() => {
        const normalizedRoute = locale.trim().toLowerCase();
        if (["az", "ru", "en"].includes(normalizedRoute)) {
            return normalizedRoute;
        }

        const normalizedStored = storedLocale.trim().toLowerCase();
        if (["az", "ru", "en"].includes(normalizedStored)) {
            return normalizedStored;
        }

        return "az";
    }, [locale, storedLocale]);
    const t = useMemo(() => getTranslations(effectiveLocale).register, [effectiveLocale]);

    const [formData, setFormData] = useState<RegisterPayload>({
        name: "",
        surname: "",
        email: "",
        phone: "",
        country_id: 1,
        password: "",
        password_confirmation: "",
    });
    const [errors, setErrors] = useState<RegisterErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [subscribeToNews, setSubscribeToNews] = useState<"yes" | "no">("no");
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [termsError, setTermsError] = useState("");
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");
    const [captchaError, setCaptchaError] = useState("");
    const [isRecaptchaScriptReady, setIsRecaptchaScriptReady] = useState(false);
    const phoneInputRef = useRef<HTMLInputElement | null>(null);
    const recaptchaRef = useRef<HTMLDivElement | null>(null);
    const recaptchaWidgetIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isTermsOpen) return;

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsTermsOpen(false);
            }
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isTermsOpen]);

    const updateField = (field: RegisterField, value: string | number | null) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handlePhoneChange = (value: string, cursorPosition: number | null) => {
        const localDigitsBeforeCursor = countLocalDigitsBeforeCursor(value, cursorPosition ?? value.length);
        const formattedPhone = formatAzerbaijanPhone(value);

        updateField("phone", formattedPhone);

        requestAnimationFrame(() => {
            const input = phoneInputRef.current;
            if (!input) return;

            const nextCursor = getCursorPositionFromLocalDigits(formattedPhone, localDigitsBeforeCursor);
            input.setSelectionRange(nextCursor, nextCursor);
        });
    };

    const handlePhoneBackspace = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Backspace") return;

        const input = event.currentTarget;
        const selectionStart = input.selectionStart;
        const selectionEnd = input.selectionEnd;

        if (selectionStart === null || selectionEnd === null) return;
        if (selectionStart !== selectionEnd) return;

        const currentValue = formData.phone;
        if (!currentValue) return;

        const localDigits = extractAzerbaijanLocalDigits(currentValue);
        const localDigitsBeforeCursor = countLocalDigitsBeforeCursor(currentValue, selectionStart);
        const deleteLocalIndex = localDigitsBeforeCursor - 1;

        if (deleteLocalIndex < 0) {
            event.preventDefault();
            return;
        }

        event.preventDefault();

        const nextLocalDigits =
            localDigits.slice(0, deleteLocalIndex) + localDigits.slice(deleteLocalIndex + 1);
        const nextFormattedPhone = formatAzerbaijanPhone(nextLocalDigits);

        updateField("phone", nextFormattedPhone);

        requestAnimationFrame(() => {
            const target = phoneInputRef.current;
            if (!target) return;

            const nextCursor = getCursorPositionFromLocalDigits(nextFormattedPhone, deleteLocalIndex);
            target.setSelectionRange(nextCursor, nextCursor);
        });
    };

    const resetRecaptchaWidget = () => {
        const widgetId = recaptchaWidgetIdRef.current;
        const controller = getReCaptchaController(window as WindowWithReCaptcha);

        if (widgetId !== null && controller && typeof controller.reset === "function") {
            controller.reset(widgetId);
        }

        setCaptchaToken("");
    };

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        if (getReCaptchaController(window as WindowWithReCaptcha)) {
            setIsRecaptchaScriptReady(true);
        }
    }, []);

    useEffect(() => {
        if (!isRecaptchaScriptReady || !recaptchaSiteKey) {
            return;
        }

        if (recaptchaWidgetIdRef.current !== null || !recaptchaRef.current) {
            return;
        }

        const renderCaptcha = () => {
            if (!recaptchaRef.current || recaptchaWidgetIdRef.current !== null) {
                return true;
            }

            const controller = getReCaptchaController(window as WindowWithReCaptcha);
            if (!controller || typeof controller.render !== "function") {
                return false;
            }

            if (typeof controller.ready === "function") {
                controller.ready(() => {
                    if (!recaptchaRef.current || recaptchaWidgetIdRef.current !== null) {
                        return;
                    }

                    recaptchaWidgetIdRef.current = controller.render(recaptchaRef.current, {
                        sitekey: recaptchaSiteKey,
                        callback: (token: string) => {
                            setCaptchaToken(token);
                            setCaptchaError("");
                        },
                        "expired-callback": () => {
                            setCaptchaToken("");
                            setCaptchaError(t.captchaExpired);
                        },
                        "error-callback": () => {
                            setCaptchaToken("");
                            setCaptchaError(t.captchaNotLoaded);
                        },
                    });
                });

                return true;
            }

            recaptchaWidgetIdRef.current = controller.render(recaptchaRef.current, {
                sitekey: recaptchaSiteKey,
                callback: (token: string) => {
                    setCaptchaToken(token);
                    setCaptchaError("");
                },
                "expired-callback": () => {
                    setCaptchaToken("");
                    setCaptchaError(t.captchaExpired);
                },
                "error-callback": () => {
                    setCaptchaToken("");
                    setCaptchaError(t.captchaNotLoaded);
                },
            });

            return true;
        };

        if (renderCaptcha()) {
            return;
        }

        let tries = 0;
        const maxTries = 40;
        const timer = window.setInterval(() => {
            tries += 1;

            if (renderCaptcha()) {
                window.clearInterval(timer);
                return;
            }

            if (tries >= maxTries) {
                window.clearInterval(timer);
                setCaptchaError(t.captchaReload);
            }
        }, 200);

        return () => {
            window.clearInterval(timer);
        };
    }, [isRecaptchaScriptReady, recaptchaSiteKey]);

    const validate = (): RegisterErrors => {
        const nextErrors: RegisterErrors = {};

        if (!formData.name.trim()) {
            nextErrors.name = t.required;
        }

        if (!formData.email.trim()) {
            nextErrors.email = t.required;
        }

        if (!formData.password.trim()) {
            nextErrors.password = t.required;
        }

        if (!formData.password_confirmation.trim()) {
            nextErrors.password_confirmation = t.required;
        }

        if (
            formData.password.trim() &&
            formData.password_confirmation.trim() &&
            formData.password !== formData.password_confirmation
        ) {
            nextErrors.password_confirmation = t.passwordMismatch;
        }

        return nextErrors;
    };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMessage("");
        setTermsError("");
        setCaptchaError("");

        const nextErrors = validate();
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            notify.error(t.fillRequired);
            return;
        }

        if (!acceptedTerms) {
            setTermsError(t.acceptTerms);
            notify.error(t.acceptTerms);
            return;
        }

        if (!recaptchaSiteKey) {
            setCaptchaError(t.captchaMissingConfig);
            notify.error(t.captchaMissingConfig);
            return;
        }

        if (!captchaToken) {
            setCaptchaError(t.captchaRequired);
            notify.error(t.captchaRequired);
            return;
        }

        let verifyPayload: ReCaptchaVerifyResponse = {};
        try {
            const verifyResponse = await fetch("/api/recaptcha/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ token: captchaToken }),
            });

            try {
                verifyPayload = (await verifyResponse.json()) as ReCaptchaVerifyResponse;
            } catch {
                verifyPayload = {};
            }

            if (!verifyResponse.ok || !verifyPayload.success) {
                const message = verifyPayload.message || t.captchaFailed;
                setCaptchaError(message);
                notify.error(message);
                resetRecaptchaWidget();
                return;
            }
        } catch {
            setCaptchaError(t.captchaError);
            notify.error(t.captchaError);
            resetRecaptchaWidget();
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(registerUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(formData),
            });

            let payload: RegisterResponse | Record<string, unknown> = {};
            try {
                payload = (await response.json()) as RegisterResponse | Record<string, unknown>;
            } catch {
                payload = {};
            }

            if (!response.ok) {
                const fieldErrors = extractFieldErrors(payload);
                if (Object.keys(fieldErrors).length > 0) {
                    setErrors(fieldErrors);
                }

                const fallbackMessage = t.registerFailed;
                const serverMessage = sanitizeSummaryMessage(
                    (payload as RegisterResponse)?.data?.message ||
                    (payload as RegisterResponse)?.message ||
                    fallbackMessage
                );

                const firstFieldMessage = getFirstFieldError(fieldErrors);

                notify.error(firstFieldMessage || serverMessage);
                resetRecaptchaWidget();
                return;
            }

            const okMessage =
                (payload as RegisterResponse)?.data?.message ||
                (payload as RegisterResponse)?.message ||
                t.registerSuccess;

            setSuccessMessage(okMessage);
            notify.success(okMessage);

            setFormData((prev) => ({
                ...prev,
                password: "",
                password_confirmation: "",
            }));
            setErrors({});

            const wantsSubscription = subscribeToNews === "yes";

            if (wantsSubscription) {
                try {
                    const subscribeResponse = await fetch(subscribeUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({ email: formData.email.trim() }),
                    });

                    let subscribePayload: SubscribeResponse | Record<string, unknown> = {};
                    try {
                        subscribePayload = (await subscribeResponse.json()) as SubscribeResponse | Record<string, unknown>;
                    } catch {
                        subscribePayload = {};
                    }

                    const subscribeSucceeded =
                        subscribeResponse.ok &&
                        ((subscribePayload as SubscribeResponse)?.success ?? true);

                    if (!subscribeSucceeded) {
                        const subscribeErrorMessage =
                            extractSubscribeErrorMessage(subscribePayload) ||
                            t.subscribeFailed;
                        notify.error(subscribeErrorMessage);
                    }
                } catch {
                    notify.error(t.subscribeConnectionFailed);
                }
            }

            const nextEmail = encodeURIComponent(formData.email.trim());
            router.push(`${localizedHref("signup", effectiveLocale, "/verify")}${nextEmail ? `?email=${nextEmail}` : ""}`);
        } catch {
            notify.error(t.connectionError);
            resetRecaptchaWidget();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Script
                src="https://www.google.com/recaptcha/api.js?render=explicit"
                strategy="afterInteractive"
                onLoad={() => setIsRecaptchaScriptReady(true)}
                onError={() => setCaptchaError(t.captchaScriptFailed)}
            />

            <form className="mt-6 space-y-4" autoComplete="off" onSubmit={onSubmit}>
                <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                    <UserRound className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type="text"
                        placeholder=""
                        aria-label={t.name}
                        autoComplete="given-name"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none"
                    />
                    <span
                        className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.name ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                    >
                        {t.name}
                    </span>
                </label>
                {errors.name ? <p className="-mt-2 px-2 text-sm text-red-600">{errors.name}</p> : null}

                <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                    <UserRound className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type="text"
                        placeholder=""
                        aria-label={t.surname}
                        autoComplete="family-name"
                        value={formData.surname}
                        onChange={(e) => updateField("surname", e.target.value)}
                        className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none"
                    />
                    <span
                        className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.surname ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                    >
                        {t.surname}
                    </span>
                </label>
                {errors.surname ? <p className="-mt-2 px-2 text-sm text-red-600">{errors.surname}</p> : null}

                <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                    <Phone className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        ref={phoneInputRef}
                        type="tel"
                        placeholder=""
                        aria-label={t.phone}
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value, e.target.selectionStart)}
                        onKeyDown={handlePhoneBackspace}
                        className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none"
                    />
                    <span
                        className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.phone ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                    >
                        {t.phone}
                    </span>
                </label>
                {errors.phone ? <p className="-mt-2 px-2 text-sm text-red-600">{errors.phone}</p> : null}

                <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                    <Mail className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type="email"
                        placeholder=""
                        aria-label={t.email}
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none"
                    />
                    <span
                        className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.email ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                    >
                        {t.email}
                    </span>
                </label>
                {errors.email ? <p className="-mt-2 px-2 text-sm text-red-600">{errors.email}</p> : null}

                <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                    <Lock className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder=""
                        aria-label={t.password}
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        className="h-full w-full bg-transparent pr-14 text-[15px] leading-none font-normal text-[#161922] outline-none"
                    />
                    <span
                        className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.password ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                    >
                        {t.password}
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[#8ea1bf]"
                        aria-label={t.togglePassword}
                    >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                </label>
                {errors.password ? <p className="-mt-2 px-2 text-sm text-red-600">{errors.password}</p> : null}

                <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                    <Lock className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder=""
                        aria-label={t.passwordConfirm}
                        autoComplete="new-password"
                        value={formData.password_confirmation}
                        onChange={(e) => updateField("password_confirmation", e.target.value)}
                        className="h-full w-full bg-transparent pr-14 text-[15px] leading-none font-normal text-[#161922] outline-none"
                    />
                    <span
                        className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.password_confirmation ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                    >
                        {t.passwordConfirm}
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[#8ea1bf]"
                        aria-label={t.toggleConfirmPassword}
                    >
                        {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                </label>
                {errors.password_confirmation ? <p className="-mt-2 px-2 text-sm text-red-600">{errors.password_confirmation}</p> : null}

                {successMessage ? <p className="rounded-[12px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p> : null}

                <div className="mt-6 space-y-6">
                    <fieldset className="flex items-start gap-4 whitespace-nowrap px-1">
                        <span className="-mt-[0.5px] pt-0 text-[18px] leading-none font-medium text-[#000000]">{t.subscribe}</span>

                        <div className="flex items-center gap-6">
                            <label className="inline-flex cursor-pointer items-center gap-3 text-[16px] leading-none text-[#000000]">
                                <input
                                    type="radio"
                                    name="subscribe"
                                    value="yes"
                                    checked={subscribeToNews === "yes"}
                                    onChange={() => setSubscribeToNews("yes")}
                                    className="size-[20px] cursor-pointer border-[#c7ccd5] accent-[#2050f5]"
                                />
                                {t.yes}
                            </label>

                            <label className="inline-flex cursor-pointer items-center gap-3 text-[16px] leading-none text-[#000000]">
                                <input
                                    type="radio"
                                    name="subscribe"
                                    value="no"
                                    checked={subscribeToNews === "no"}
                                    onChange={() => setSubscribeToNews("no")}
                                    className="size-[20px] cursor-pointer border-[#c7ccd5] accent-[#2050f5]"
                                />
                                {t.no}
                            </label>
                        </div>
                    </fieldset>

                    <label className="flex w-full max-w-full cursor-pointer select-none items-start justify-start gap-3 px-1 text-[16px] leading-[1.2] text-[#000000]">
                        <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(event) => {
                                setAcceptedTerms(event.target.checked);
                                if (event.target.checked) {
                                    setTermsError("");
                                }
                            }}
                            className="size-[20px] cursor-pointer rounded-[2px] border-[#c7ccd5] accent-[#2050f5]"
                        />
                        <span>
                            {t.termsPrefix}{" "}
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setIsTermsOpen(true);
                                }}
                                className="cursor-pointer border-0 bg-transparent p-0 font-bold text-[#000000] transition-colors hover:text-[#4a4a4a]"
                            >{t.termsLink}</button>{t.termsSuffix}</span>
                    </label>

                    {termsError ? <p className="-mt-2 text-sm text-red-600">{termsError}</p> : null}

                    <div className="mx-auto flex flex-col items-center gap-0">
                        <div ref={recaptchaRef} className="min-h-[78px] w-fit overflow-hidden leading-none" />
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-[66px] w-[210px] cursor-pointer items-center justify-center rounded-[22px] bg-[#ffd500] px-8 text-[15px] leading-none font-bold text-[#000000] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? <Spinner size={20} /> : t.submit}
                    </button>
                </div>

                <p className="pt-3 text-center text-[13px] font-[495] text-[#1f2430]">
                    {t.haveAccountPrefix}{" "}<Link href={localizedHref("signin", effectiveLocale)} className="underline">{t.haveAccountLink}</Link>{t.haveAccountSuffix ? ` ${t.haveAccountSuffix}` : ""}
                </p>
            </form>

            {isTermsOpen ? (
                <div
                    className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
                    role="presentation"
                    onMouseDown={() => setIsTermsOpen(false)}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="terms-dialog-title"
                        className="flex max-h-[88vh] w-full max-w-[900px] flex-col overflow-hidden rounded-[4px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.28)]"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <header className="flex min-h-[54px] items-center justify-between border-b border-[#eceff3] bg-[#fafafa] pl-5">
                            <h2 id="terms-dialog-title" className="text-[18px] font-bold text-[#1b1d22]">
                                İstifadə şərtləri
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsTermsOpen(false)}
                                className="inline-flex h-[54px] w-[40px] cursor-pointer items-center justify-center bg-[#f4f4f4] text-[#666] transition-colors hover:bg-[#ececec] hover:text-black"
                                aria-label={t.closeTerms}
                            >
                                <X className="size-[14px]" strokeWidth={3.5} />
                            </button>
                        </header>

                        <div className="overflow-y-auto px-5 py-6 text-[16px] leading-[1.45] text-[#15171c] sm:px-6">
                            <h3 className="text-[24px] leading-tight font-bold">
                                Sifariş, Çatdırılma, Qaytarma və Dəyişdirmə Şərtləri
                            </h3>

                            <div className="mt-16 space-y-4">
                                <h4 className="text-[20px] font-bold">Əsas Anlayışlar:</h4>
                                <p><strong>Alıcı Razılaşması:</strong> Bu sənəddə onlayn alış-veriş ilə əlaqədar aşağıda göstərilən bütün şərtlər nəzərdə tutulur.</p>
                                <p><strong>Alıcı:</strong> TVİM.az onlayn platformasında göstərilən texniki imkanlar vasitəsilə elektron ödəniş edərək məhsul və ya xidmət sifariş edən, həmçinin bu &quot;Qaytarma və Dəyişdirmə Razılaşması&quot;nın şərtlərini qəbul edən fiziki və ya hüquqi şəxs.</p>
                                <p><strong>Satıcı:</strong> TVİM MMC-yə məxsus TVİM.az portalında öz məhsul və ya xidmətlərini onlayn olaraq satan, satış və çatdırılma şərtlərini müəyyən edən fiziki və ya hüquqi şəxs.</p>
                                <p><strong>Portal:</strong> Malların və xidmətlərin onlayn satış məkanı olan TVİM.az internet səhifəsi.</p>
                                <p><strong>Məhsul(lar)/Xidmət(lər):</strong> Portalda yerləşdirilən hər hansı mallar, xidmətlər, materiallar, avadanlıqlar və digər əşyalar.</p>
                                <p><strong>Sifariş:</strong> Alıcının müəyyən etdiyi ünvana çatdırılması məqsədilə Portaldan mal və ya xidmət alınması üçün elektron formada Satıcıya göndərilən sifariş forması.</p>
                                <p><strong>Qaytarma:</strong> Alıcının Portaldan əldə etdiyi məhsulun Satıcıya qaytarılması və ödənilmiş məbləğin geri alınması.</p>
                                <p><strong>Dəyişdirmə:</strong> Alıcının əldə etdiyi məhsulun Satıcıya təqdim edilərək əvəzində başqa məhsulun alınması.</p>
                            </div>

                            <div className="mt-12 space-y-4">
                                <h4 className="text-[20px] font-bold">Xüsusi Şərtlər:</h4>
                                <p>Alıcı Portaldan mal və ya xidmət sifariş etməklə bu Razılaşmanın şərtlərini tam şəkildə qəbul edir.</p>
                                <p>Portalda yerləşdirilən malların qaytarılması və dəyişdirilməsi Azərbaycan Respublikasının İstehlakçı Hüquqlarının Müdafiəsi haqqında Qanunun 15-ci maddəsi ilə tənzimlənir.</p>
                                <p>Satıcı alışın şərtlərini öncədən xəbərdarlıq etmədən dəyişdirmək hüququna malikdir.</p>
                                <p>Alışın baş tutması üçün Alıcı malın və ya xidmətin dəyərini tam şəkildə ödəmiş olmalıdır.</p>
                                <p>Alıcı sifariş forması doldurarkən öz əlaqə məlumatlarının Satıcı tərəfindən istifadə edilməsinə razılıq verir.</p>
                                <p>Sifarişin ləğvi və ya məhsulun mövcud olmaması hallarında Satıcı, Alıcıya sifarişin ləğvi barədə məlumat verməklə məsuliyyətdən azad olur.</p>
                            </div>

                            <div className="mt-12 space-y-4">
                                <h4 className="text-[20px] font-bold">Çatdırılma Qaydaları:</h4>
                                <p>Azərbaycan daxilində 200 AZN və daha yuxarı məbləğdə olan sifarişlər üçün çatdırılma PULSUZdur.</p>
                                <p>Böyük həcmli yüklərin çatdırılması 3 iş gününə qədər vaxt ala bilər.</p>
                            </div>

                            <div className="mt-12 space-y-4 pb-4">
                                <h4 className="text-[20px] font-bold">Mübahisələrin Həlli:</h4>
                                <p>Bu Razılaşmadan irəli gələn bütün mübahisələr ilkin mərhələdə qarşılıqlı razılaşma yolu ilə həll olunmağa çalışılacaqdır. Əks halda, mübahisələr Azərbaycan Respublikasının qanunvericiliyi çərçivəsində həll ediləcəkdir.</p>
                            </div>
                        </div>
                    </section>
                </div>
            ) : null}
        </>
    );
};

export { RegisterForm };
