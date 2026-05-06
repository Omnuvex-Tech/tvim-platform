"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { useNotify, Spinner } from "@repo/ui";
import { config } from "@/config";
import { useLanguageStore } from "@/stores";

type ForgotPasswordFormProps = {
    locale: string;
};

type ForgotPasswordPayload = {
    email: string;
};

type ForgotPasswordResponse = {
    success?: boolean;
    message?: string;
    data?: unknown;
    errors?: {
        email?: string[] | string;
    };
    email?: string[] | string;
};

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

const ForgotPasswordForm = ({ locale }: ForgotPasswordFormProps) => {
    const notify = useNotify();
    const router = useRouter();
    const { locale: storedLocale } = useLanguageStore();

    const forgotPasswordUrl = useMemo(
        () => normalizeApiUrl(config.api.url, config.endpoints.auth.forgotPassword),
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

    const [formData, setFormData] = useState<ForgotPasswordPayload>({
        email: "",
    });
    const [errors, setErrors] = useState<Partial<Record<keyof ForgotPasswordPayload, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const extractEmailError = (payload: ForgotPasswordResponse) => {
        const directEmail = payload.email;
        if (typeof directEmail === "string" && directEmail.trim()) {
            return directEmail;
        }

        if (Array.isArray(directEmail)) {
            const first = directEmail.find((item) => typeof item === "string" && item.trim());
            if (typeof first === "string") {
                return first;
            }
        }

        const errorsEmail = payload.errors?.email;
        if (typeof errorsEmail === "string" && errorsEmail.trim()) {
            return errorsEmail;
        }

        if (Array.isArray(errorsEmail)) {
            const first = errorsEmail.find((item) => typeof item === "string" && item.trim());
            if (typeof first === "string") {
                return first;
            }
        }

        return "";
    };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMessage("");

        const email = formData.email.trim();
        if (!email) {
            setErrors({ email: "E-mail ünvanını daxil edin" });
            notify.error("E-mail ünvanını daxil edin");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(forgotPasswordUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ email }),
            });

            let payload: ForgotPasswordResponse = {};
            try {
                payload = (await response.json()) as ForgotPasswordResponse;
            } catch {
                payload = {};
            }

            if (response.ok && payload.success !== false) {
                const message = payload.message || "Əgər email qeydiyyatlıdırsa, şifrə yeniləmə üçün kod göndərildi";
                setSuccessMessage(message);
                notify.success(message);
                setErrors({});
                const nextEmail = encodeURIComponent(email);
                router.push(`/${effectiveLocale}/signup/verify${nextEmail ? `?email=${nextEmail}&flow=forgot` : "?flow=forgot"}`);
                return;
            }

            const emailError = extractEmailError(payload);
            const message = emailError || payload.message || "Şifrə yeniləmə sorğusu göndərilə bilmədi.";
            if (emailError) {
                setErrors({ email: emailError });
            }
            notify.error(message);
        } catch {
            notify.error("Server ilə bağlantı zamanı xəta baş verdi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-4" autoComplete="off" onSubmit={onSubmit}>
            <label className="group relative flex h-[64px] w-full items-center rounded-[20px] border border-[#d8dde6]">
                <Mail className="ml-5 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                <input
                    type="email"
                    placeholder=""
                    aria-label="E-mail ünvanı"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(event) => {
                        setFormData({ email: event.target.value });
                        setErrors({ email: undefined });
                    }}
                    className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none"
                />
                <span
                    className={`pointer-events-none absolute top-1/2 left-[52px] -translate-y-1/2 text-[15px] leading-5 text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.email ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                >
                    E-mail ünvanı
                </span>
            </label>

            {errors.email ? <p className="-mt-2 px-2 text-sm text-red-600">{errors.email}</p> : null}
            {successMessage ? <p className="rounded-[12px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p> : null}

            <div className="mt-0 text-center">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-[62px] min-w-[170px] cursor-pointer items-center justify-center rounded-[18px] bg-[#ffd500] px-7 text-[15px] leading-none font-[780] text-[#000000] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? <Spinner size={20} /> : <span className="-translate-y-[1px]">Kod göndər</span>}
                </button>
            </div>

            <div className="pt-2 text-center text-[15px]">
                <Link href={`/${effectiveLocale}/signin`} className="font-semibold text-[#2258f6] no-underline hover:no-underline">
                    Giriş səhifəsinə qayıt
                </Link>
            </div>
        </form>
    );
};

export { ForgotPasswordForm };
