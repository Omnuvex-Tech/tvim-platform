"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
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

    const updateField = (field: RegisterField, value: string | number | null) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

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

        const nextErrors = validate();
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            notify.error("Zəhmət olmasa məcburi xanaları doldurun.");
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
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <form className="mt-6 space-y-4" autoComplete="off" onSubmit={onSubmit}>
                <label className="relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
                    <UserRound className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type="text"
                        placeholder="Ad"
                        autoComplete="given-name"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                    />
                </label>
                {errors.name ? <p className="-mt-2 text-sm text-red-600">{errors.name}</p> : null}

                <label className="relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
                    <UserRound className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type="text"
                        placeholder="Soyad"
                        autoComplete="family-name"
                        value={formData.surname}
                        onChange={(e) => updateField("surname", e.target.value)}
                        className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                    />
                </label>
                {errors.surname ? <p className="-mt-2 text-sm text-red-600">{errors.surname}</p> : null}

                <label className="relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
                    <Phone className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type="tel"
                        placeholder="0511111111"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                    />
                </label>
                {errors.phone ? <p className="-mt-2 text-sm text-red-600">{errors.phone}</p> : null}

                <label className="relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
                    <Mail className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type="email"
                        placeholder="E-poçtunuz"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                    />
                </label>
                {errors.email ? <p className="-mt-2 text-sm text-red-600">{errors.email}</p> : null}

                <label className="relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
                    <Lock className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Şifrə yaradın"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-14 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute top-1/2 right-4 -translate-y-1/2 text-[#8ea1bf]"
                        aria-label="Şifrəni göstər/gizlət"
                    >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                </label>
                {errors.password ? <p className="-mt-2 text-sm text-red-600">{errors.password}</p> : null}

                <label className="relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
                    <Lock className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Şifrəni təkrarlayın"
                        autoComplete="new-password"
                        value={formData.password_confirmation}
                        onChange={(e) => updateField("password_confirmation", e.target.value)}
                        className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-14 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute top-1/2 right-4 -translate-y-1/2 text-[#8ea1bf]"
                        aria-label="Şifrə təkrarını göstər/gizlət"
                    >
                        {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                </label>
                {errors.password_confirmation ? <p className="-mt-2 text-sm text-red-600">{errors.password_confirmation}</p> : null}

                {successMessage ? <p className="rounded-[12px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p> : null}

                <div className="mt-6 text-center">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-[66px] w-[182px] items-center justify-center rounded-[22px] bg-[#ffd500] px-8 text-[15px] leading-none font-bold text-[#000000] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "Göndərilir..." : "Davam et"}
                    </button>
                </div>

                <p className="pt-16 text-center text-[13px] font-[495] text-[#1f2430]">
                    Əgər artıq hesabınızı yaratmısınızsa, <Link href={`/${locale}/giris`} className="underline">giriş səhifəsinə</Link> keçin.
                </p>
            </form>
        </>
    );
};

export { RegisterForm };
