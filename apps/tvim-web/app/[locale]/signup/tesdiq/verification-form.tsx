"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNotify, Spinner } from "@repo/ui";
import { config } from "@/config";
import { useLanguageStore } from "@/stores";

type VerificationFormProps = {
    locale: string;
    email: string;
    flow?: "signup" | "forgot";
};

type VerificationResponse = {
    message?: string;
    success?: boolean;
    data?: {
        message?: string;
    };
    errors?: {
        email?: string[];
        code?: string[];
        message?: string[];
        password?: string[];
        password_confirmation?: string[];
    };
    email?: string;
    code?: string;
    password?: string | string[];
    password_confirmation?: string | string[];
};

const OTP_LENGTH = 4;

const toDigits = (value: string) => value.replace(/\D/g, "").slice(0, OTP_LENGTH);

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

const extractVerifyMessage = (payload: VerificationResponse, fallback: string) => {
    const codeError = Array.isArray(payload.errors?.code) ? payload.errors?.code[0] : undefined;
    const emailError = Array.isArray(payload.errors?.email) ? payload.errors?.email[0] : undefined;
    const messageError = Array.isArray(payload.errors?.message) ? payload.errors?.message[0] : undefined;
    return (
        payload.data?.message ||
        payload.message ||
        payload.code ||
        payload.email ||
        messageError ||
        codeError ||
        emailError ||
        fallback
    );
};

const VerificationForm = ({ locale, email, flow = "signup" }: VerificationFormProps) => {
    const notify = useNotify();
    const router = useRouter();
    const { locale: storedLocale } = useLanguageStore();
    const verifyUrl = useMemo(() => normalizeApiUrl(config.api.url, config.endpoints.auth.otpVerify), [flow]);
    const resendUrl = useMemo(
        () =>
            flow === "forgot"
                ? normalizeApiUrl(config.api.url, config.endpoints.auth.forgotPassword)
                : normalizeApiUrl(config.api.url, config.endpoints.auth.emailResend),
        [flow]
    );
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

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

    const code = useMemo(() => digits.join(""), [digits]);

    const focusInput = (index: number) => {
        const target = inputRefs.current[index];
        if (target) {
            target.focus();
            target.select();
        }
    };

    const applyPastedDigits = (startIndex: number, rawValue: string) => {
        const parsed = toDigits(rawValue);
        if (!parsed) return;

        setDigits((prev) => {
            const next = [...prev];
            let cursor = startIndex;

            for (const char of parsed) {
                if (cursor >= OTP_LENGTH) break;
                next[cursor] = char;
                cursor += 1;
            }

            return next;
        });

        const nextFocus = Math.min(startIndex + parsed.length, OTP_LENGTH - 1);
        focusInput(nextFocus);
    };

    const handleChange = (index: number, value: string) => {
        const parsed = toDigits(value);

        if (!parsed) {
            setDigits((prev) => {
                const next = [...prev];
                next[index] = "";
                return next;
            });
            return;
        }

        if (parsed.length > 1) {
            applyPastedDigits(index, parsed);
            return;
        }

        setDigits((prev) => {
            const next = [...prev];
            next[index] = parsed;
            return next;
        });

        if (index < OTP_LENGTH - 1) {
            focusInput(index + 1);
        }
    };

    const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace" && !digits[index] && index > 0) {
            focusInput(index - 1);
        }
    };

    const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        applyPastedDigits(index, event.clipboardData.getData("text"));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const normalizedEmail = email.trim();
        if (!normalizedEmail) {
            notify.error("Email tapılmadı. Zəhmət olmasa yenidən qeydiyyatdan keçin.");
            return;
        }

        if (code.length !== OTP_LENGTH) {
            notify.error("Zəhmət olmasa 4 rəqəmli kodu daxil edin.");
            return;
        }

        if (flow === "forgot") {
            if (!password) {
                notify.error("Zəhmət olmasa yeni şifrənizi daxil edin.");
                return;
            }

            if (!passwordConfirm) {
                notify.error("Zəhmət olmasa şifrə təsdiqini daxil edin.");
                return;
            }

            if (password !== passwordConfirm) {
                notify.error("Şifrələr uyğun deyil.");
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const postVerify = async (url: string, body: Record<string, unknown>) => {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(body),
                });

                let payload: VerificationResponse = {};
                try {
                    payload = (await response.json()) as VerificationResponse;
                } catch {
                    payload = {};
                }

                return { response, payload };
            };

            const verifyBodies: Array<Record<string, unknown>> =
                flow === "forgot"
                    ? [
                        {
                            email: normalizedEmail,
                            code,
                            otp: code,
                            type: "forgot_password",
                            verification_type: "forgot_password",
                            password,
                            password_confirmation: passwordConfirm,
                        },
                        {
                            email: normalizedEmail,
                            code,
                            otp: code,
                            type: "password_reset",
                            verification_type: "password_reset",
                            password,
                            password_confirmation: passwordConfirm,
                        },
                        {
                            email: normalizedEmail,
                            code,
                            otp: code,
                            type: "reset_password",
                            verification_type: "reset_password",
                            password,
                            password_confirmation: passwordConfirm,
                        },
                        {
                            email: normalizedEmail,
                            code,
                            otp: code,
                            type: "password-reset",
                            verification_type: "password-reset",
                            password,
                            password_confirmation: passwordConfirm,
                        },
                        {
                            email: normalizedEmail,
                            code,
                            otp: code,
                            password,
                            password_confirmation: passwordConfirm,
                        },
                    ]
                    : [
                        {
                            email: normalizedEmail,
                            code,
                            type: "email_verification",
                        },
                    ];

            let response: Response | null = null;
            let payload: VerificationResponse = {};

            for (const body of verifyBodies) {
                const result = await postVerify(verifyUrl, body);
                response = result.response;
                payload = result.payload;

                const hasMessageErrors =
                    Array.isArray(payload.errors?.message) && payload.errors.message.length > 0;
                const isFailure = !response.ok || payload.success === false || hasMessageErrors;
                if (!isFailure) {
                    break;
                }

                const message = extractVerifyMessage(payload, "").toLowerCase();
                const isVerificationTypeError =
                    message.includes("verification type") ||
                    message.includes("selected verification type is invalid");

                if (!(flow === "forgot" && isVerificationTypeError)) {
                    break;
                }
            }

            if (!response) {
                notify.error("Kod təsdiqlənmədi. Yenidən cəhd edin.");
                return;
            }

            const hasMessageErrors = Array.isArray(payload.errors?.message) && payload.errors.message.length > 0;
            const isFailure = !response.ok || payload.success === false || hasMessageErrors;

            if (isFailure) {
                notify.error(extractVerifyMessage(payload, "Kod təsdiqlənmədi. Yenidən cəhd edin."));
                return;
            }

            if (flow === "forgot") {
                notify.success(extractVerifyMessage(payload, "Kod uğurla təsdiqləndi."));

                // If user provided a new password in this step, assume the server reset it
                // and redirect to signin. Otherwise, navigate to the reset-password page.
                if (password) {
                    router.push(`/${effectiveLocale}/signin`);
                    return;
                }

                const nextEmail = encodeURIComponent(normalizedEmail);
                const nextCode = encodeURIComponent(code);
                router.push(`/${effectiveLocale}/forgot-password/reset-password?email=${nextEmail}&code=${nextCode}`);
                return;
            }

            notify.success(extractVerifyMessage(payload, "Email uğurla təsdiqləndi."));
            router.push(`/${effectiveLocale}/signin`);
        } catch {
            notify.error("Server ilə bağlantı zamanı xəta baş verdi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendCode = async () => {
        const normalizedEmail = email.trim();
        if (!normalizedEmail) {
            notify.error("Email tapılmadı. Zəhmət olmasa yenidən qeydiyyatdan keçin.");
            return;
        }

        setIsResending(true);

        try {
            const response = await fetch(resendUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    email: normalizedEmail,
                }),
            });

            let payload: VerificationResponse = {};
            try {
                payload = (await response.json()) as VerificationResponse;
            } catch {
                payload = {};
            }

            if (!response.ok) {
                notify.error(extractVerifyMessage(payload, "Kod yenidən göndərilə bilmədi."));
                return;
            }

            const resendSuccessMessage =
                flow === "forgot"
                    ? "Şifrə yeniləmə kodu uğurla yenidən göndərildi."
                    : "Təsdiq kodu uğurla yenidən göndərildi.";
            notify.success(extractVerifyMessage(payload, resendSuccessMessage));
        } catch {
            notify.error("Server ilə bağlantı zamanı xəta baş verdi.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <form className="mt-7 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-[18px] border border-[#d8dde6] bg-[#f9fbff] px-4 py-4 text-sm text-[#3d4a61]">
                <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 size-5 shrink-0 text-[#2050f5]" />
                    <p>
                        {email
                            ? `${email} ünvanına 4 rəqəmli ${flow === "forgot" ? "şifrə yeniləmə" : "təsdiq"} kodu göndərildi.`
                            : "E-poçt ünvanınıza 4 rəqəmli təsdiq kodu göndərildi."}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4">
                {digits.map((digit, index) => (
                    <input
                        key={index}
                        ref={(node) => {
                            inputRefs.current[index] = node;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(event) => handleChange(index, event.target.value)}
                        onKeyDown={(event) => handleKeyDown(index, event)}
                        onPaste={(event) => handlePaste(index, event)}
                        className="h-14 w-12 rounded-[14px] border border-[#d8dde6] bg-white text-center text-[26px] leading-none font-bold text-[#161922] outline-none transition focus:border-[#2050f5] focus:ring-2 focus:ring-[#2050f5]/20 sm:h-16 sm:w-14"
                        aria-label={`${index + 1}. kod rəqəmi`}
                    />
                ))}
            </div>

            {flow === "forgot" && (
                <div className="mt-4 space-y-3">
                    <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                        <Lock className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder=""
                            aria-label="Yeni şifrə"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-full w-full bg-transparent pr-14 text-[15px] leading-none font-normal text-[#161922] outline-none"
                        />
                        <span
                            className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${password ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                        >
                            Yeni şifrə
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

                    <label className="group relative flex h-[64px] w-full items-center rounded-[18px] border border-[#d8dde6]">
                        <Lock className="ml-4 mr-3 size-5 shrink-0 text-[#2050f5]" strokeWidth={2.1} />
                        <input
                            type={showPasswordConfirmation ? "text" : "password"}
                            placeholder=""
                            aria-label="Şifrə təsdiqi"
                            autoComplete="new-password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            className="h-full w-full bg-transparent pr-14 text-[15px] leading-none font-normal text-[#161922] outline-none"
                        />
                        <span
                            className={`pointer-events-none absolute top-1/2 left-[50px] -translate-y-1/2 text-[15px] leading-none text-[#9aa3b2] transition-opacity duration-200 ease-out ${passwordConfirm ? "opacity-0" : "opacity-100"} group-focus-within:opacity-0`}
                        >
                            Şifrə təsdiqi
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                            className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[#8ea1bf]"
                            aria-label="Şifrə təsdiqini göstər/gizlət"
                        >
                            {showPasswordConfirmation ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                    </label>
                </div>
            )}

            <div className="mt-7 text-center">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-[62px] w-[190px] cursor-pointer items-center justify-center gap-2 rounded-[20px] bg-[#ffd500] px-8 text-[15px] leading-none font-bold text-[#000000] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? <Spinner size={20} /> : <><CheckCircle2 className="size-5" /><span>Kodu təsdiqlə</span></>}
                </button>
            </div>

            <div className="pt-0 flex items-center justify-center text-[13px] text-[#1f2430]">
                <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="inline-flex min-w-[130px] cursor-pointer items-center justify-center underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isResending ? <Spinner size={14} /> : "Kodu yenidən göndər"}
                </button>
                <span className="mx-2 inline-flex items-center">|</span>
                <Link href={`/${effectiveLocale}/${flow === "forgot" ? "forgot-password" : "signup"}`} className="underline">
                    {flow === "forgot" ? "şifrə bərpası səhifəsinə qayıdın" : "qeydiyyat səhifəsinə qayıdın"}
                </Link>
            </div>
        </form>
    );
};

export { VerificationForm };