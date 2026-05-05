"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Phone, UserRound } from "lucide-react";
import { useNotify } from "@repo/ui";
import { config } from "@/config";

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

const RegisterForm = ({ locale }: RegisterFormProps) => {
    const notify = useNotify();
    const router = useRouter();
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
    const [captchaToken, setCaptchaToken] = useState("");
    const [captchaError, setCaptchaError] = useState("");
    const [isRecaptchaScriptReady, setIsRecaptchaScriptReady] = useState(false);
    const phoneInputRef = useRef<HTMLInputElement | null>(null);
    const recaptchaRef = useRef<HTMLDivElement | null>(null);
    const recaptchaWidgetIdRef = useRef<number | null>(null);

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

            recaptchaWidgetIdRef.current = controller.render(recaptchaRef.current, {
                sitekey: recaptchaSiteKey,
                callback: (token: string) => {
                    setCaptchaToken(token);
                    setCaptchaError("");
                },
                "expired-callback": () => {
                    setCaptchaToken("");
                    setCaptchaError("reCAPTCHA vaxtı bitdi. Yenidən təsdiqləyin.");
                },
                "error-callback": () => {
                    setCaptchaToken("");
                    setCaptchaError("reCAPTCHA yüklənmədi. Bir daha yoxlayın.");
                },
            });

            return true;
        };

        if (renderCaptcha()) {
            return;
        }

        let tries = 0;
        const maxTries = 15;
        const timer = window.setInterval(() => {
            tries += 1;

            if (renderCaptcha()) {
                window.clearInterval(timer);
                return;
            }

            if (tries >= maxTries) {
                window.clearInterval(timer);
                setCaptchaError("reCAPTCHA yüklənmədi. Səhifəni yeniləyin.");
            }
        }, 200);

        return () => {
            window.clearInterval(timer);
        };
    }, [isRecaptchaScriptReady, recaptchaSiteKey]);

    const validate = (): RegisterErrors => {
        const nextErrors: RegisterErrors = {};

        if (!formData.name.trim()) {
            nextErrors.name = "Zəhmət olmasa boş buraxmayın";
        }

        if (!formData.email.trim()) {
            nextErrors.email = "Zəhmət olmasa boş buraxmayın";
        }

        if (!formData.password.trim()) {
            nextErrors.password = "Zəhmət olmasa boş buraxmayın";
        }

        if (!formData.password_confirmation.trim()) {
            nextErrors.password_confirmation = "Zəhmət olmasa boş buraxmayın";
        }

        if (
            formData.password.trim() &&
            formData.password_confirmation.trim() &&
            formData.password !== formData.password_confirmation
        ) {
            nextErrors.password_confirmation = "Şifrə təkrarı uyğun deyil";
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
            notify.error("Zəhmət olmasa məcburi xanaları doldurun.");
            return;
        }

        if (!acceptedTerms) {
            setTermsError("Davam etmək üçün istifadə şərtlərini qəbul edin.");
            notify.error("Davam etmək üçün istifadə şərtlərini qəbul edin.");
            return;
        }

        if (!recaptchaSiteKey) {
            setCaptchaError("reCAPTCHA konfiqurasiyası tapılmadı.");
            notify.error("reCAPTCHA konfiqurasiyası tapılmadı.");
            return;
        }

        if (!captchaToken) {
            setCaptchaError("Zəhmət olmasa reCAPTCHA təsdiqləyin.");
            notify.error("Zəhmət olmasa reCAPTCHA təsdiqləyin.");
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
                const message = verifyPayload.message || "reCAPTCHA təsdiqlənmədi. Yenidən cəhd edin.";
                setCaptchaError(message);
                notify.error(message);
                resetRecaptchaWidget();
                return;
            }
        } catch {
            setCaptchaError("reCAPTCHA yoxlanışı zamanı xəta baş verdi.");
            notify.error("reCAPTCHA yoxlanışı zamanı xəta baş verdi.");
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

                const fallbackMessage = "Qeydiyyat zamanı xəta baş verdi.";
                const serverMessage =
                    (payload as RegisterResponse)?.data?.message ||
                    (payload as RegisterResponse)?.message ||
                    fallbackMessage;

                notify.error(serverMessage);
                resetRecaptchaWidget();
                return;
            }

            const okMessage =
                (payload as RegisterResponse)?.data?.message ||
                (payload as RegisterResponse)?.message ||
                "Hesabınız uğurla yaradıldı! Email təsdiqi üçün kod göndərildi.";

            setSuccessMessage(okMessage);
            notify.success(okMessage);

            setFormData((prev) => ({
                ...prev,
                password: "",
                password_confirmation: "",
            }));
            setErrors({});

            const nextEmail = encodeURIComponent(formData.email.trim());
            router.push(`/${locale}/qeydiyyat/tesdiq${nextEmail ? `?email=${nextEmail}` : ""}`);
        } catch {
            notify.error("Server ilə bağlantı zamanı xəta baş verdi.");
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
                onError={() => setCaptchaError("reCAPTCHA skripti yüklənmədi.")}
            />

            <form className="mt-6 space-y-4" autoComplete="off" onSubmit={onSubmit}>
                <label className="group relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
                    <UserRound className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type="text"
                        placeholder=""
                        aria-label="Ad"
                        autoComplete="given-name"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none"
                    />
                    <span
                        className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.name ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                    >
                        Ad
                    </span>
                </label>
                {errors.name ? <p className="-mt-2 text-sm text-red-600">{errors.name}</p> : null}

                <label className="group relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
                    <UserRound className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type="text"
                        placeholder=""
                        aria-label="Soyad"
                        autoComplete="family-name"
                        value={formData.surname}
                        onChange={(e) => updateField("surname", e.target.value)}
                        className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none"
                    />
                    <span
                        className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.surname ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                    >
                        Soyad
                    </span>
                </label>
                {errors.surname ? <p className="-mt-2 text-sm text-red-600">{errors.surname}</p> : null}

                <label className="group relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
                    <Phone className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        ref={phoneInputRef}
                        type="tel"
                        placeholder=""
                        aria-label="Telefon"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value, e.target.selectionStart)}
                        onKeyDown={handlePhoneBackspace}
                        className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none"
                    />
                    <span
                        className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.phone ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                    >
                        Telefon
                    </span>
                </label>
                {errors.phone ? <p className="-mt-2 text-sm text-red-600">{errors.phone}</p> : null}

                <label className="group relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
                    <Mail className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type="email"
                        placeholder=""
                        aria-label="E-poçtunuz"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none"
                    />
                    <span
                        className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.email ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                    >
                        E-poçtunuz
                    </span>
                </label>
                {errors.email ? <p className="-mt-2 text-sm text-red-600">{errors.email}</p> : null}

                <label className="group relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
                    <Lock className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder=""
                        aria-label="Şifrə yaradın"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-14 text-[15px] leading-none font-normal text-[#161922] outline-none"
                    />
                    <span
                        className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.password ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                    >
                        Şifrə yaradın
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[#8ea1bf]"
                        aria-label="Şifrəni göstər/gizlət"
                    >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                </label>
                {errors.password ? <p className="-mt-2 text-sm text-red-600">{errors.password}</p> : null}

                <label className="group relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
                    <Lock className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder=""
                        aria-label="Şifrəni təkrarlayın"
                        autoComplete="new-password"
                        value={formData.password_confirmation}
                        onChange={(e) => updateField("password_confirmation", e.target.value)}
                        className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-14 text-[15px] leading-none font-normal text-[#161922] outline-none"
                    />
                    <span
                        className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.password_confirmation ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                    >
                        Şifrəni təkrarlayın
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[#8ea1bf]"
                        aria-label="Şifrə təkrarını göstər/gizlət"
                    >
                        {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                </label>
                {errors.password_confirmation ? <p className="-mt-2 text-sm text-red-600">{errors.password_confirmation}</p> : null}

                {successMessage ? <p className="rounded-[12px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p> : null}

                <div className="mt-6 space-y-6">
                    <fieldset className="flex items-start gap-4 whitespace-nowrap">
                        <span className="pt-[2px] text-[16px] leading-none font-medium text-[#000000]">Abunə ol</span>

                        <div className="flex flex-col items-start gap-4">
                            <label className="inline-flex cursor-pointer items-center gap-3 text-[16px] leading-none text-[#000000]">
                                <input
                                    type="radio"
                                    name="subscribe"
                                    value="yes"
                                    checked={subscribeToNews === "yes"}
                                    onChange={() => setSubscribeToNews("yes")}
                                    className="size-[20px] cursor-pointer border-[#c7ccd5] accent-[#2050f5]"
                                />
                                Bəli
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
                                Xeyr
                            </label>
                        </div>
                    </fieldset>

                    <div className="mx-auto flex flex-col items-center gap-0">
                        <div ref={recaptchaRef} className="min-h-[78px] w-fit overflow-hidden leading-none" />
                    </div>

                    <label className="mx-auto flex w-fit max-w-full cursor-pointer select-none items-center gap-3 text-[16px] leading-[1.2] text-[#000000]">
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
                            Mən <span className="font-bold">İstifadə şərtləri</span>-ni oxudum və razıyam
                        </span>
                    </label>

                    {termsError ? <p className="-mt-2 text-sm text-red-600">{termsError}</p> : null}
                </div>

                <div className="mt-4 text-center">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-[66px] w-[210px] cursor-pointer items-center justify-center rounded-[22px] bg-[#ffd500] px-8 text-[15px] leading-none font-bold text-[#000000] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "Göndərilir..." : "Davam et"}
                    </button>
                </div>

                <p className="pt-8 text-center text-[13px] font-[495] text-[#1f2430]">
                    Əgər artıq hesabınızı yaratmısınızsa, <Link href={`/${locale}/giris`} className="underline">giriş səhifəsinə</Link> keçin.
                </p>
            </form>
        </>
    );
};

export { RegisterForm };
