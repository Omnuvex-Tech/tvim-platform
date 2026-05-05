"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useNotify } from "@repo/ui";
import { config } from "@/config";

type LoginFormProps = {
    locale: string;
};

type LoginPayload = {
    email: string;
    password: string;
};

type LoginField = keyof LoginPayload;
type LoginErrors = Partial<Record<LoginField, string>>;

type LoginResponse = {
    success?: boolean;
    message?: string;
    requires_email_verification?: boolean;
    token?: string;
    user?: Record<string, unknown>;
    data?: {
        token?: string;
        user?: Record<string, unknown>;
        requires_email_verification?: boolean;
        message?: string;
    };
};

type SessionResponse = {
    success?: boolean;
    message?: string;
};

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

const LoginForm = ({ locale }: LoginFormProps) => {
    const notify = useNotify();
    const router = useRouter();
    const loginUrl = useMemo(
        () => normalizeApiUrl(config.api.url, config.endpoints.auth.login),
        []
    );

    const [formData, setFormData] = useState<LoginPayload>({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState<LoginErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const updateField = (field: LoginField, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validate = () => {
        const nextErrors: LoginErrors = {};

        if (!formData.email.trim()) {
            nextErrors.email = "Zəhmət olmasa e-mail daxil edin";
        }

        if (!formData.password.trim()) {
            nextErrors.password = "Zəhmət olmasa şifrə daxil edin";
        }

        return nextErrors;
    };

    const extractMessage = (payload: LoginResponse, fallback: string) => {
        return payload.data?.message || payload.message || fallback;
    };

    const resolveRequiresEmailVerification = (payload: LoginResponse) => {
        return payload.requires_email_verification === true || payload.data?.requires_email_verification === true;
    };

    const persistAuthSession = async (token: string, user?: Record<string, unknown>) => {
        const response = await fetch("/api/auth/session", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ token, user }),
        });

        let payload: SessionResponse = {};
        try {
            payload = (await response.json()) as SessionResponse;
        } catch {
            payload = {};
        }

        if (!response.ok || payload.success === false) {
            throw new Error(payload.message || "Sessiya yaradıla bilmədi.");
        }
    };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextErrors = validate();
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            notify.error("Zəhmət olmasa məcburi xanaları doldurun.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(loginUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(formData),
            });

            let payload: LoginResponse = {};
            try {
                payload = (await response.json()) as LoginResponse;
            } catch {
                payload = {};
            }

            if (!response.ok) {
                const message = extractMessage(payload, "Giriş zamanı xəta baş verdi.");
                const needsVerification = resolveRequiresEmailVerification(payload);

                notify.error(message);

                if (needsVerification) {
                    const nextEmail = encodeURIComponent(formData.email.trim());
                    router.push(`/${locale}/qeydiyyat/tesdiq${nextEmail ? `?email=${nextEmail}` : ""}`);
                }
                return;
            }

            const token = payload.data?.token || payload.token;
            const user = payload.data?.user || payload.user;

            if (!token) {
                notify.error("Token tapılmadı. Yenidən cəhd edin.");
                return;
            }

            try {
                await persistAuthSession(token, user);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Sessiya yaradıla bilmədi.";
                notify.error(message);
                return;
            }

            notify.success("Giriş uğurla tamamlandı.");
            router.replace(`/${locale}`);
            router.refresh();
        } catch {
            notify.error("Server ilə bağlantı zamanı xəta baş verdi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-4" autoComplete="off" onSubmit={onSubmit}>
            <label className="relative block h-[64px] w-full rounded-[20px] border border-[#d8dde6]">
                <Mail className="absolute top-1/2 left-5 size-6 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                <input
                    type="email"
                    placeholder="E-mail ünvanı"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="h-full w-full rounded-[20px] bg-transparent pl-[55px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                />
            </label>
            {errors.email ? <p className="-mt-2 text-sm text-red-600">{errors.email}</p> : null}

            <label className="relative block h-[64px] w-full rounded-[20px] border border-[#d8dde6]">
                <Lock className="absolute top-1/2 left-5 size-6 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Şifrə"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    className="h-full w-full rounded-[20px] bg-transparent pl-[55px] pr-14 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute top-1/2 right-5 -translate-y-1/2 text-[#8ea1bf]"
                    aria-label="Şifrəni göstər/gizlət"
                >
                    {showPassword ? <EyeOff className="size-5" strokeWidth={2.1} /> : <Eye className="size-5" strokeWidth={2.1} />}
                </button>
            </label>
            {errors.password ? <p className="-mt-2 text-sm text-red-600">{errors.password}</p> : null}

            <div className="-mt-2 text-center">
                <Link href="#" className="inline-block text-[13px] font-[500] text-[#1f2430] no-underline hover:no-underline">
                    Şifrənizi unutmusunuz?
                </Link>
            </div>

            <div className="mt-0 text-center">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-[62px] min-w-[136px] items-center justify-center rounded-[18px] bg-[#ffd500] px-7 text-[15px] leading-none font-[780] text-[#000000] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="-translate-y-[1px]">{isSubmitting ? "Yoxlanılır..." : "Giriş"}</span>
                </button>
            </div>

            <div className="pt-4 text-center text-[15px] font-[450] text-[#111111]">
                Hesab yaradaraq saytın bütün imkanlarından istifadə edə bilərsiniz.
            </div>

            <div className="text-center text-[15px]">
                <Link href={`/${locale}/qeydiyyat`} className="font-semibold text-[#2258f6] no-underline hover:no-underline">Hesab qeydiyyatı</Link>
            </div>
        </form>
    );
};

export { LoginForm };