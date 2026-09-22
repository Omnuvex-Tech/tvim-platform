"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Spinner, useNotify } from "@repo/ui";
import { getTranslations } from "@/lib/i18n";

type ChangePasswordFormProps = {
    locale: string;
};

type Payload = {
    password: string;
    password_confirmation: string;
};

type Field = keyof Payload;
type Errors = Partial<Record<Field, string>>;

type SessionResponse = {
    success?: boolean;
    data?: {
        isAuthenticated?: boolean;
        user?: {
            name?: string | null;
            surname?: string | null;
            email?: string | null;
            phone?: string | null;
        } | null;
    };
    message?: string;
};

type ApiResponse = {
    success?: boolean;
    message?: string;
    data?: unknown;
};

export function ChangePasswordForm({ locale }: ChangePasswordFormProps) {
    const notify = useNotify();
    const router = useRouter();
    const effectiveLocale = useMemo(() => {
        const normalized = locale.trim().toLowerCase();
        return ["az", "ru", "en"].includes(normalized) ? normalized : "az";
    }, [locale]);

    const account = useMemo(() => getTranslations(effectiveLocale).account, [effectiveLocale]);
    const messages = useMemo(
        () => ({
            ...account.passwordForm,
            save: account.form.save,
            togglePassword: account.form.togglePassword,
            toggleConfirmation: account.form.toggleConfirmation,
        }),
        [account]
    );

    const [formData, setFormData] = useState<Payload>({
        password: "",
        password_confirmation: "",
    });
    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const updateField = (field: Field, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    };

    const validate = (payload: Payload): Errors => {
        const next: Errors = {};
        if (!payload.password.trim()) next.password = messages.requiredPassword;
        if (!payload.password_confirmation.trim()) next.password_confirmation = messages.requiredConfirmation;
        if (payload.password.trim() && payload.password_confirmation.trim() && payload.password !== payload.password_confirmation) {
            next.password_confirmation = messages.mismatch;
        }
        return next;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        const payload: Payload = {
            password: formData.password,
            password_confirmation: formData.password_confirmation,
        };

        const nextErrors = validate(payload);
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const sessionRes = await fetch("/api/auth/session", { method: "GET", cache: "no-store" });
            const sessionJson = (await sessionRes.json().catch(() => null)) as SessionResponse | null;
            const user = sessionJson?.data?.user ?? null;
            const isAuthenticated = sessionJson?.data?.isAuthenticated ?? false;

            if (!sessionRes.ok || !isAuthenticated || !user) {
                notify.error(messages.missingProfile);
                return;
            }

            const requestBody: Record<string, string> = {
                name: (user.name ?? "").toString(),
                surname: (user.surname ?? "").toString(),
                email: (user.email ?? "").toString(),
                phone: (user.phone ?? "").toString(),
                password: payload.password,
                password_confirmation: payload.password_confirmation,
            };

            if (!(requestBody.name ?? "").trim() || !(requestBody.email ?? "").trim()) {
                notify.error(messages.missingProfile);
                return;
            }

            const response = await fetch("/api/customer/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "Content-Language": effectiveLocale,
                },
                body: JSON.stringify(requestBody),
            });

            const json = (await response.json().catch(() => null)) as ApiResponse | null;
            const success = response.ok && (json?.success ?? true);

            if (!success) {
                notify.error(json?.message || messages.failed);
                return;
            }

            await fetch("/api/auth/session", { method: "GET", cache: "no-store" });
            notify.success(messages.success);
            setFormData({ password: "", password_confirmation: "" });
            router.refresh();
        } catch {
            notify.error(messages.failed);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="mx-auto mt-0 w-full max-w-[900px]" autoComplete="off" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <div className="px-1 text-[13px] font-semibold text-[#0F131A]">{messages.password}</div>
                        <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                            <Lock className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder=""
                                aria-label={messages.password}
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={(e) => updateField("password", e.target.value)}
                                className="h-full w-full bg-transparent pr-12 text-[15px] leading-none font-normal text-[#161922] outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-4 cursor-pointer text-[#8ea1bf]"
                                aria-label={messages.togglePassword}
                            >
                                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                        </label>
                        {errors.password ? <p className="px-2 text-sm text-red-600">{errors.password}</p> : null}
                    </div>

                    <div className="space-y-2">
                        <div className="px-1 text-[13px] font-semibold text-[#0F131A]">{messages.confirmation}</div>
                        <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                            <Lock className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                            <input
                                type={showPasswordConfirmation ? "text" : "password"}
                                placeholder=""
                                aria-label={messages.confirmation}
                                autoComplete="new-password"
                                value={formData.password_confirmation}
                                onChange={(e) => updateField("password_confirmation", e.target.value)}
                                className="h-full w-full bg-transparent pr-12 text-[15px] leading-none font-normal text-[#161922] outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                                className="absolute right-4 cursor-pointer text-[#8ea1bf]"
                                aria-label={messages.toggleConfirmation}
                            >
                                {showPasswordConfirmation ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                        </label>
                        {errors.password_confirmation ? (
                            <p className="px-2 text-sm text-red-600">{errors.password_confirmation}</p>
                        ) : null}
                    </div>
                </div>

                <div className="mt-0 text-center">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-[62px] min-w-[170px] cursor-pointer items-center justify-center rounded-[18px] bg-[#2050f5] px-7 text-[15px] leading-none font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? <Spinner className="h-5 w-5" /> : messages.save}
                    </button>
                </div>
            </div>
        </form>
    );
}
