"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useNotify, Spinner } from "@repo/ui";
import { config } from "@/config";
import { useLanguageStore } from "@/stores";

type ResetPasswordFormProps = {
    locale: string;
    email: string;
    code: string;
};

type ResetPasswordResponse = {
    success?: boolean;
    message?: string;
    email?: string[] | string;
    code?: string[] | string;
    password?: string[] | string;
    password_confirmation?: string[] | string;
    errors?: {
        email?: string[] | string;
        code?: string[] | string;
        password?: string[] | string;
        password_confirmation?: string[] | string;
    };
};

type ResetPasswordPayload = {
    password: string;
    password_confirmation: string;
};

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

const firstError = (value?: string[] | string) => {
    if (typeof value === "string" && value.trim()) return value;
    if (Array.isArray(value)) {
        const first = value.find((item) => typeof item === "string" && item.trim());
        if (typeof first === "string") return first;
    }
    return "";
};

const ResetPasswordForm = ({ locale, email, code }: ResetPasswordFormProps) => {
    const notify = useNotify();
    const router = useRouter();
    const { locale: storedLocale } = useLanguageStore();

    const resetPasswordUrl = useMemo(
        () => normalizeApiUrl(config.api.url, config.endpoints.auth.resetPassword),
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

    const [formData, setFormData] = useState<ResetPasswordPayload>({
        password: "",
        password_confirmation: "",
    });
    const [errors, setErrors] = useState<Partial<Record<keyof ResetPasswordPayload, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextErrors: Partial<Record<keyof ResetPasswordPayload, string>> = {};
        if (!formData.password.trim()) {
            nextErrors.password = "Yeni şifrəni daxil edin";
        }
        if (!formData.password_confirmation.trim()) {
            nextErrors.password_confirmation = "Şifrə təkrarını daxil edin";
        }
        if (
            formData.password.trim() &&
            formData.password_confirmation.trim() &&
            formData.password !== formData.password_confirmation
        ) {
            nextErrors.password_confirmation = "Şifrələr eyni deyil";
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            notify.error("Zəhmət olmasa xanaları düzgün doldurun.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(resetPasswordUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    email,
                    code,
                    password: formData.password,
                    password_confirmation: formData.password_confirmation,
                }),
            });

            let payload: ResetPasswordResponse = {};
            try {
                payload = (await response.json()) as ResetPasswordResponse;
            } catch {
                payload = {};
            }

            if (!response.ok || payload.success === false) {
                const passwordError =
                    firstError(payload.errors?.password) || firstError(payload.password);
                const passwordConfirmationError =
                    firstError(payload.errors?.password_confirmation) ||
                    firstError(payload.password_confirmation);

                if (passwordError || passwordConfirmationError) {
                    setErrors({
                        password: passwordError || undefined,
                        password_confirmation: passwordConfirmationError || undefined,
                    });
                }

                const message =
                    firstError(payload.errors?.code) ||
                    firstError(payload.code) ||
                    firstError(payload.errors?.email) ||
                    firstError(payload.email) ||
                    payload.message ||
                    "Şifrə yenilənə bilmədi.";
                notify.error(message);
                return;
            }

            notify.success(payload.message || "Şifrə uğurla yeniləndi");
            router.push(`/${effectiveLocale}/signin`);
        } catch {
            notify.error("Server ilə bağlantı zamanı xəta baş verdi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-4" autoComplete="off" onSubmit={onSubmit}>
            <div className="rounded-[18px] border border-[#d8dde6] bg-[#f9fbff] px-4 py-3 text-sm text-[#3d4a61]">
                <div className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0 text-[#2050f5]" />
                    <span>{email}</span>
                </div>
                <p className="mt-2 text-[13px] text-[#6f7786]">Kod təsdiqləndi, yeni şifrənizi təyin edin.</p>
            </div>

            <label className="group relative flex h-[64px] w-full items-center rounded-[20px] border border-[#d8dde6]">
                <Lock className="ml-5 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder=""
                    aria-label="Yeni şifrə"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(event) => {
                        setFormData((prev) => ({ ...prev, password: event.target.value }));
                        setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className="h-5 w-full bg-transparent pr-12 text-[15px] leading-5 font-normal text-[#161922] outline-none"
                />
                <span
                    className={`pointer-events-none absolute top-1/2 left-[52px] -translate-y-1/2 text-[15px] leading-5 text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.password ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                >
                    Yeni şifrə
                </span>
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 cursor-pointer text-[#8ea1bf]"
                    aria-label="Şifrəni göstər/gizlət"
                >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
            </label>
            {errors.password ? <p className="-mt-2 px-2 text-sm text-red-600">{errors.password}</p> : null}

            <label className="group relative flex h-[64px] w-full items-center rounded-[20px] border border-[#d8dde6]">
                <Lock className="ml-5 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                <input
                    type={showPasswordConfirmation ? "text" : "password"}
                    placeholder=""
                    aria-label="Yeni şifrəni təkrarlayın"
                    autoComplete="new-password"
                    value={formData.password_confirmation}
                    onChange={(event) => {
                        setFormData((prev) => ({ ...prev, password_confirmation: event.target.value }));
                        setErrors((prev) => ({ ...prev, password_confirmation: undefined }));
                    }}
                    className="h-5 w-full bg-transparent pr-12 text-[15px] leading-5 font-normal text-[#161922] outline-none"
                />
                <span
                    className={`pointer-events-none absolute top-1/2 left-[52px] -translate-y-1/2 text-[15px] leading-5 text-[#9aa3b2] transition-opacity duration-200 ease-out ${formData.password_confirmation ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                >
                    Yeni şifrəni təkrarlayın
                </span>
                <button
                    type="button"
                    onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                    className="absolute right-4 cursor-pointer text-[#8ea1bf]"
                    aria-label="Şifrə təkrarını göstər/gizlət"
                >
                    {showPasswordConfirmation ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
            </label>
            {errors.password_confirmation ? <p className="-mt-2 px-2 text-sm text-red-600">{errors.password_confirmation}</p> : null}

            <div className="pt-1 text-center">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-[62px] min-w-[190px] cursor-pointer items-center justify-center rounded-[18px] bg-[#ffd500] px-7 text-[15px] leading-none font-[780] text-[#000000] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? <Spinner size={20} /> : "Şifrəni yenilə"}
                </button>
            </div>
        </form>
    );
};

export { ResetPasswordForm };
