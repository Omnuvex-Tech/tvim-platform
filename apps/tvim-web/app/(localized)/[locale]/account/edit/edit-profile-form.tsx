"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, UserRound } from "lucide-react";
import { Spinner, useNotify } from "@repo/ui";
import { getTranslations } from "@/lib/i18n";
import {
    AZ_PHONE_PREFIX,
    azPhoneOnBlur,
    azPhoneOnFocus,
    extractAzLocalDigits,
    formatAzPhone,
    isCompleteAzMobile,
    sanitizeNameInput,
} from "@repo/shared/utils";

type EditProfileFormProps = {
    locale: string;
    initialValues?: {
        name?: string | null;
        surname?: string | null;
        email?: string | null;
        phone?: string | null;
    };
};

type Payload = {
    name: string;
    surname: string;
    email: string;
    phone: string;
};

type Field = keyof Payload;
type Errors = Partial<Record<Field, string>>;

type ApiResponse = {
    success?: boolean;
    message?: string;
    data?: unknown;
};

export function EditProfileForm({ locale, initialValues }: EditProfileFormProps) {
    const notify = useNotify();
    const router = useRouter();
    const effectiveLocale = useMemo(() => {
        const normalized = locale.trim().toLowerCase();
        return ["az", "ru", "en"].includes(normalized) ? normalized : "az";
    }, [locale]);

    const t = useMemo(() => getTranslations(effectiveLocale).account, [effectiveLocale]);
    const common = useMemo(() => getTranslations(effectiveLocale).common, [effectiveLocale]);

    const placeholders = useMemo(
        () => ({
            name: (initialValues?.name ?? "").toString(),
            surname: (initialValues?.surname ?? "").toString(),
            email: (initialValues?.email ?? "").toString(),
            phone: (initialValues?.phone ?? "").toString(),
        }),
        [initialValues]
    );

    const [formData, setFormData] = useState<Payload>({
        name: "",
        surname: "",
        email: "",
        phone: "",
    });
    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateField = (field: Field, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    };

    const handlePhoneChange = (rawValue: string) => {
        const previousDigits = extractAzLocalDigits(formData.phone);
        let nextValue = rawValue;

        // Deleting a bracket or space leaves the digits untouched, so remove the
        // last digit instead — otherwise the auto-inserted ")" cannot be passed.
        if (previousDigits && rawValue.length < formData.phone.length && extractAzLocalDigits(rawValue) === previousDigits) {
            nextValue = rawValue.replace(/\d(?=\D*$)/, "");
        }

        // The field is focused while typing, so never fall back to an empty value.
        updateField("phone", formatAzPhone(nextValue) || AZ_PHONE_PREFIX);
    };

    const validate = (payload: Payload): Errors => {
        const next: Errors = {};
        if (!payload.name.trim()) next.name = t.form.requiredName;
        if (!payload.email.trim()) next.email = t.form.requiredEmail;
        if (payload.phone.trim() && !isCompleteAzMobile(payload.phone)) next.phone = common.invalidMobile;
        return next;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        const payload: Payload = {
            name: formData.name.trim() || placeholders.name.trim(),
            surname: formData.surname.trim() || placeholders.surname.trim(),
            email: formData.email.trim() || placeholders.email.trim(),
            phone: formData.phone.trim() || placeholders.phone.trim(),
        };

        const nextErrors = validate(payload);
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/customer/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "Content-Language": effectiveLocale,
                },
                body: JSON.stringify(payload),
            });

            const json = (await response.json().catch(() => null)) as ApiResponse | null;
            const success = response.ok && (json?.success ?? true);

            if (!success) {
                notify.error(json?.message || t.profile.updateFailed);
                return;
            }

            await fetch("/api/auth/session", { method: "GET", cache: "no-store" });
            notify.success(t.profile.updated);
            router.refresh();
        } catch {
            notify.error(t.form.serverError);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="mt-0" autoComplete="off" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <div className="px-1 text-[13px] font-semibold text-[#0F131A]">{t.form.name}</div>
                        <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                            <UserRound className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                            <input
                                type="text"
                                placeholder={placeholders.name}
                                aria-label={t.form.name}
                                autoComplete="given-name"
                                value={formData.name}
                                onChange={(e) => updateField("name", sanitizeNameInput(e.target.value))}
                                className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none"
                            />
                        </label>
                        {errors.name ? <p className="px-2 text-sm text-red-600">{errors.name}</p> : null}
                    </div>

                    <div className="space-y-2">
                        <div className="px-1 text-[13px] font-semibold text-[#0F131A]">{t.form.surname}</div>
                        <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                            <UserRound className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                            <input
                                type="text"
                                placeholder={placeholders.surname}
                                aria-label={t.form.surname}
                                autoComplete="family-name"
                                value={formData.surname}
                                onChange={(e) => updateField("surname", sanitizeNameInput(e.target.value))}
                                className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none"
                            />
                        </label>
                        {errors.surname ? <p className="px-2 text-sm text-red-600">{errors.surname}</p> : null}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <div className="px-1 text-[13px] font-semibold text-[#0F131A]">{t.form.email}</div>
                        <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                            <Mail className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                            <input
                                type="email"
                                placeholder={placeholders.email}
                                aria-label={t.form.email}
                                autoComplete="email"
                                value={formData.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none"
                            />
                        </label>
                        {errors.email ? <p className="px-2 text-sm text-red-600">{errors.email}</p> : null}
                    </div>

                    <div className="space-y-2">
                        <div className="px-1 text-[13px] font-semibold text-[#0F131A]">{t.form.phone}</div>
                        <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                            <Phone className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                            <input
                                type="tel"
                                placeholder={placeholders.phone}
                                aria-label={t.form.phone}
                                autoComplete="tel"
                                value={formData.phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                onFocus={() => updateField("phone", azPhoneOnFocus(formData.phone))}
                                onBlur={() => updateField("phone", azPhoneOnBlur(formData.phone))}
                                className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none"
                            />
                        </label>
                        {errors.phone ? <p className="px-2 text-sm text-red-600">{errors.phone}</p> : null}
                    </div>
                </div>

                <div className="mt-0 text-center">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-[62px] min-w-[170px] cursor-pointer items-center justify-center rounded-[18px] bg-[#2050f5] px-7 text-[15px] leading-none font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? <Spinner className="h-5 w-5" /> : t.form.save}
                    </button>
                </div>
            </div>
        </form>
    );
}
