import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Landmark, Mail, MapPin, Phone, User, Wallet } from "lucide-react";
import { useNotify } from "@repo/ui";
import type { AuthSessionUser } from "@/lib/auth/session";
import type { CheckoutData } from "../checkout-client";
import { CHECKOUT_SUBMIT_DONE_EVENT, CHECKOUT_SUBMIT_EVENT } from "../checkout-client";
import { hydrateCart } from "@/lib/cart/client";

const formatPrice = (value: number) => `${value.toFixed(2)}₼`;
const toNumber = (value: unknown) => {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
};

const toText = (value: unknown) => (typeof value === "string" ? value : "");

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

            while (nextCursor < formatted.length && /\D/.test(formatted[nextCursor] ?? "")) {
                nextCursor += 1;
            }

            return nextCursor;
        }
    }

    return formatted.length;
};

type DeliverySelectOption = {
    id: number;
    name: string;
};

function DeliverySelect({
    value,
    onChange,
    options,
    disabled,
    loading,
}: {
    value: string;
    onChange: (nextValue: string) => void;
    options: DeliverySelectOption[];
    disabled?: boolean;
    loading?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selectedLabel = options.find((o) => String(o.id) === value)?.name ?? "";

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (containerRef.current && !containerRef.current.contains(target)) setOpen(false);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        window.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    const isDisabled = Boolean(disabled || loading);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => {
                    if (isDisabled) return;
                    setOpen((v) => !v);
                }}
                disabled={isDisabled}
                className="flex h-[64px] w-full cursor-pointer items-center justify-between rounded-[18px] border border-[#d8dde6] bg-white px-4 text-[15px] text-[#161922] outline-none transition focus:border-[#2050f5] focus:ring-2 focus:ring-inset focus:ring-[#2050f5]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <span className="min-w-0 truncate text-left">{loading ? "Yüklənir..." : selectedLabel || "Seçin"}</span>
                <svg className="h-5 w-5 text-[#565F6F]" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[280px] overflow-auto rounded-[18px] border border-[#d8dde6] bg-white p-2 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.55)]">
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-[14px] text-[#565F6F]">Seçim yoxdur</div>
                    ) : (
                        options.map((opt) => {
                            const optValue = String(opt.id);
                            const isSelected = optValue === value;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(optValue);
                                        setOpen(false);
                                    }}
                                    className={[
                                        "flex w-full cursor-pointer items-center rounded-[14px] px-3 py-2 text-left text-[14px] font-medium",
                                        isSelected ? "text-[#0D47FF]" : "text-[#0F131A] hover:text-[#2050f5]",
                                    ].join(" ")}
                                >
                                    <span className="min-w-0 truncate">{opt.name}</span>
                                </button>
                            );
                        })
                    )}
                </div>
            ) : null}
        </div>
    );
}

type Props = {
    locale: string;
    checkout: CheckoutData;
    isAuthenticated: boolean;
    isLoading?: boolean;
    onDeliveryPriceIdChange: (nextId: number | null) => void;
    authUser?: AuthSessionUser | null;
};

const CheckoutDetailsForm = ({ locale, checkout, isAuthenticated, isLoading, onDeliveryPriceIdChange, authUser }: Props) => {
    const notify = useNotify();
    const router = useRouter();

    const deliveryPrices = useMemo(() => (Array.isArray(checkout.delivery_prices) ? checkout.delivery_prices : []), [checkout.delivery_prices]);
    const addresses = useMemo(() => (Array.isArray(checkout.addresses) ? checkout.addresses : []), [checkout.addresses]);
    const paymentMethods = useMemo(
        () => (Array.isArray(checkout.payment_methods) ? checkout.payment_methods : []),
        [checkout.payment_methods]
    );

    type DeliveryPrice = NonNullable<CheckoutData["delivery_prices"]>[number];
    type DeliveryLevel = {
        options: DeliveryPrice[];
        selectedId: string;
    };

    const hasSavedAddresses = isAuthenticated && addresses.length > 0;

    const defaultAddressId = useMemo(() => {
        if (!hasSavedAddresses) return null;
        const def = addresses.find((a) => a.is_default);
        return (def?.id ?? addresses[0]?.id) ?? null;
    }, [addresses, hasSavedAddresses]);

    const [addressMode, setAddressMode] = useState<"existing" | "new">(hasSavedAddresses ? "existing" : "new");
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(defaultAddressId);
    const [selectedDeliveryLeafId, setSelectedDeliveryLeafId] = useState<number | null>(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const phoneInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!authUser) return;

        const nextFirstName = toText(authUser.name);
        const nextLastName = toText(authUser.surname);
        const nextEmail = toText(authUser.email);
        const nextPhone = formatAzerbaijanPhone(toText(authUser.phone));

        setFirstName((current) => current || nextFirstName);
        setLastName((current) => current || nextLastName);
        setEmail((current) => current || nextEmail);
        setPhone((current) => current || nextPhone);
    }, [authUser]);

    const handlePhoneChange = (value: string, cursorPosition: number | null) => {
        const localDigitsBeforeCursor = countLocalDigitsBeforeCursor(value, cursorPosition ?? value.length);
        const formattedPhone = formatAzerbaijanPhone(value);

        setPhone(formattedPhone);

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

        const currentValue = phone;
        if (!currentValue) return;

        const localDigits = extractAzerbaijanLocalDigits(currentValue);
        const localDigitsBeforeCursor = countLocalDigitsBeforeCursor(currentValue, selectionStart);
        const deleteLocalIndex = localDigitsBeforeCursor - 1;

        if (deleteLocalIndex < 0) {
            event.preventDefault();
            return;
        }

        event.preventDefault();

        const nextLocalDigits = localDigits.slice(0, deleteLocalIndex) + localDigits.slice(deleteLocalIndex + 1);
        const nextFormattedPhone = formatAzerbaijanPhone(nextLocalDigits);

        setPhone(nextFormattedPhone);

        requestAnimationFrame(() => {
            const target = phoneInputRef.current;
            if (!target) return;

            const nextCursor = getCursorPositionFromLocalDigits(nextFormattedPhone, deleteLocalIndex);
            target.setSelectionRange(nextCursor, nextCursor);
        });
    };

    const idToDeliveryName = useMemo(() => {
        const map = new Map<number, string>();
        for (const item of deliveryPrices as DeliveryPrice[]) {
            const id = toNumber((item as any).id);
            if (!Number.isFinite(id) || id <= 0) continue;
            map.set(id, toText((item as any).name));
        }
        return map;
    }, [deliveryPrices]);

    useEffect(() => {
        if (!hasSavedAddresses) {
            setAddressMode("new");
        }
    }, [hasSavedAddresses]);

    useEffect(() => {
        if (addressMode !== "existing") return;
        if (!hasSavedAddresses) return;
        if (selectedAddressId) return;
        setSelectedAddressId(defaultAddressId);
    }, [addressMode, defaultAddressId, hasSavedAddresses, selectedAddressId]);

    useEffect(() => {
        if (addressMode !== "existing") return;
        if (!hasSavedAddresses) return;
        const address = addresses.find((a) => a.id === selectedAddressId) ?? null;
        const id = address?.delivery_price_id ?? null;
        if (typeof id === "number" && Number.isFinite(id)) {
            setSelectedDeliveryLeafId(id);
            onDeliveryPriceIdChange(id);
        }
    }, [addressMode, addresses, hasSavedAddresses, onDeliveryPriceIdChange, selectedAddressId]);

    const deliveryByParent = useMemo(() => {
        const map = new Map<number, DeliveryPrice[]>();
        for (const item of deliveryPrices as DeliveryPrice[]) {
            const parentId = toNumber((item as any).parent_id);
            const list = map.get(parentId);
            if (list) list.push(item);
            else map.set(parentId, [item]);
        }
        return map;
    }, [deliveryPrices]);

    const rootDeliveryOptions = useMemo(() => deliveryByParent.get(0) ?? [], [deliveryByParent]);
    const [deliveryLevels, setDeliveryLevels] = useState<DeliveryLevel[]>([]);

    useEffect(() => {
        if (addressMode !== "new") return;
        setSelectedDeliveryLeafId(null);
        setDeliveryLevels((prev) => {
            const selections = prev.map((l) => l.selectedId);
            const next: DeliveryLevel[] = [];
            let options = rootDeliveryOptions;
            for (let i = 0; i < Math.max(1, selections.length); i++) {
                const selectedId = String(selections[i] ?? "");
                next.push({ options, selectedId });
                const selectedNum = Number(selectedId);
                if (!selectedId || !Number.isFinite(selectedNum) || selectedNum <= 0) break;
                const childOptions = deliveryByParent.get(selectedNum) ?? [];
                if (childOptions.length === 0) break;
                options = childOptions;
            }

            if (next.length === 0) return [{ options: rootDeliveryOptions, selectedId: "" }];
            if (next[0]?.options !== rootDeliveryOptions) {
                next[0] = {
                    options: rootDeliveryOptions,
                    selectedId: String(next[0]?.selectedId ?? ""),
                };
            }
            return next;
        });
    }, [addressMode, deliveryByParent, rootDeliveryOptions]);

    const onDeliverySelectChange = (levelIndex: number, nextSelectedId: string) => {
        const selectedNum = Number(nextSelectedId);
        const hasSelected = Boolean(nextSelectedId) && Number.isFinite(selectedNum) && selectedNum > 0;
        const childrenOptions = hasSelected ? deliveryByParent.get(selectedNum) ?? [] : [];
        const isLeaf = hasSelected && childrenOptions.length === 0;

        setDeliveryLevels((prev) => {
            const current = prev.length > 0 ? prev : [{ options: rootDeliveryOptions, selectedId: "" }];
            const next = current
                .slice(0, levelIndex + 1)
                .map((l, idx) => (idx === levelIndex ? { ...l, selectedId: nextSelectedId } : l));

            if (!hasSelected) return next;

            if (childrenOptions.length > 0) {
                next.push({ options: childrenOptions, selectedId: "" });
            }

            return next;
        });

        if (isLeaf) {
            setSelectedDeliveryLeafId(selectedNum);
            onDeliveryPriceIdChange(selectedNum);
        } else {
            setSelectedDeliveryLeafId(null);
        }
    };

    const deliveryPrice = toNumber(checkout.totals?.delivery_price);
    const [selectedPaymentKey, setSelectedPaymentKey] = useState<string>(() => paymentMethods[0]?.key ?? "");
    const selectedPaymentMethod = useMemo(
        () => paymentMethods.find((m) => toText((m as any).key) === selectedPaymentKey) ?? null,
        [paymentMethods, selectedPaymentKey]
    );
    const installments = useMemo(() => {
        const raw = (selectedPaymentMethod as any)?.installments;
        return Array.isArray(raw) ? raw : [];
    }, [selectedPaymentMethod]);
    const [selectedInstallmentId, setSelectedInstallmentId] = useState<number | null>(null);

    useEffect(() => {
        if (selectedPaymentKey) return;
        if (paymentMethods[0]?.key) setSelectedPaymentKey(paymentMethods[0].key);
    }, [paymentMethods, selectedPaymentKey]);

    useEffect(() => {
        if (installments.length === 0) {
            setSelectedInstallmentId(null);
            return;
        }
        const first = Number((installments[0] as any)?.id);
        setSelectedInstallmentId(Number.isFinite(first) && first > 0 ? first : null);
    }, [installments, selectedPaymentKey]);

    const deliverySelectionNames = useMemo(() => {
        const ids = deliveryLevels.map((l) => Number(l.selectedId)).filter((id) => Number.isFinite(id) && id > 0);
        return ids.map((id) => idToDeliveryName.get(id) || "").filter(Boolean);
    }, [deliveryLevels, idToDeliveryName]);

    const submitOrder = useCallback(async () => {
        if (isSubmitting) return;

        const paymentMethodKey = selectedPaymentKey.trim();
        if (!paymentMethodKey) {
            notify.error("Ödəniş üsulunu seçin.");
            return;
        }

        if (installments.length > 0) {
            if (!selectedInstallmentId) {
                notify.error("Hissə sayını seçin.");
                return;
            }
        }

        const shouldUseExisting = hasSavedAddresses && addressMode === "existing";

        if (shouldUseExisting) {
            if (!selectedAddressId) {
                notify.error("Ünvan seçin.");
                return;
            }
        } else {
            if (!selectedDeliveryLeafId) {
                notify.error("Çatdırılma ünvanını son səviyyəyə qədər seçin.");
                return;
            }
            if (!firstName.trim() || !lastName.trim()) {
                notify.error("Ad və soyad doldurun.");
                return;
            }
            if (!phone.trim()) {
                notify.error("Telefon doldurun.");
                return;
            }
            if (!addressLine1.trim()) {
                notify.error("Ünvan doldurun.");
                return;
            }
        }

        const effectiveLocale = ["az", "ru", "en"].includes(locale.trim().toLowerCase()) ? locale.trim().toLowerCase() : "az";
        const body: any = {
            payment_method: paymentMethodKey,
            ...(installments.length > 0 && selectedInstallmentId ? { payment_installment_id: selectedInstallmentId } : {}),
            ...(comment.trim() ? { comment: comment.trim() } : {}),
        };

        if (shouldUseExisting) {
            body.address_id = selectedAddressId;
        } else {
            const region = deliverySelectionNames.slice(0, -1).join(" / ");
            const city = deliverySelectionNames.slice(-1)[0] || "";
            body.delivery_price_id = selectedDeliveryLeafId;
            body.address = {
                type: "shipping",
                label: "",
                name: firstName.trim(),
                surname: lastName.trim(),
                recipient_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
                phone: phone.trim(),
                country_id: 1,
                region,
                city,
                postal_code: "",
                address_line1: addressLine1.trim(),
                address_line2: "",
                company: "",
                note: "",
            };
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/order/checkout", {
                method: "POST",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Content-Language": effectiveLocale,
                },
                body: JSON.stringify(body),
            });

            const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string; data?: any } | null;
            if (!res.ok || !json?.success) {
                notify.error(json?.message || "Server Error");
                return;
            }

            notify.success(json.message || "Sifariş uğurla yaradıldı.");
            try {
                await hydrateCart(true);
            } catch {
            }

            if (isAuthenticated) {
                router.push(`/${effectiveLocale}/account/orders`);
            } else {
                router.push(`/${effectiveLocale}`);
            }
            router.refresh();
        } finally {
            setIsSubmitting(false);
            window.dispatchEvent(new Event(CHECKOUT_SUBMIT_DONE_EVENT));
        }
    }, [
        addressLine1,
        addressMode,
        comment,
        deliverySelectionNames,
        email,
        firstName,
        hasSavedAddresses,
        idToDeliveryName,
        installments.length,
        isAuthenticated,
        isSubmitting,
        lastName,
        locale,
        notify,
        onDeliveryPriceIdChange,
        phone,
        router,
        selectedAddressId,
        selectedDeliveryLeafId,
        selectedInstallmentId,
        selectedPaymentKey,
    ]);

    useEffect(() => {
        const onSubmitRequested = () => {
            submitOrder();
        };

        window.addEventListener(CHECKOUT_SUBMIT_EVENT, onSubmitRequested);
        return () => {
            window.removeEventListener(CHECKOUT_SUBMIT_EVENT, onSubmitRequested);
        };
    }, [submitOrder]);

    return (
        <div className="mt-4 border-t border-[#edf1f6] px-0 pb-2 pt-8 sm:px-0 lg:px-0">
            <div className="space-y-9">
                <section>
                    <h3 className="mb-5 text-[32px] leading-none font-semibold text-[#111826]">1. Əlaqə məlumatları</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="flex h-[64px] items-center rounded-[20px] border border-[#d8dde6] bg-white">
                            <User className="ml-5 mr-3 size-5 text-[#2050f5]" strokeWidth={2.1} />
                            <input
                                type="text"
                                placeholder="Ad *"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                disabled={Boolean(isLoading) || isSubmitting}
                                className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                            />
                        </label>
                        <label className="flex h-[64px] items-center rounded-[20px] border border-[#d8dde6] bg-white">
                            <User className="ml-5 mr-3 size-5 text-[#2050f5]" strokeWidth={2.1} />
                            <input
                                type="text"
                                placeholder="Soyad *"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                disabled={Boolean(isLoading) || isSubmitting}
                                className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                            />
                        </label>
                        <label className="flex h-[64px] items-center rounded-[20px] border border-[#d8dde6] bg-white">
                            <Phone className="ml-5 mr-3 size-5 text-[#2050f5]" strokeWidth={2.1} />
                            <input
                                ref={phoneInputRef}
                                type="tel"
                                placeholder="Telefon *"
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value, e.target.selectionStart)}
                                onKeyDown={handlePhoneBackspace}
                                disabled={Boolean(isLoading) || isSubmitting}
                                className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                            />
                        </label>
                        <label className="flex h-[64px] items-center rounded-[20px] border border-[#d8dde6] bg-white">
                            <Mail className="ml-5 mr-3 size-5 text-[#2050f5]" strokeWidth={2.1} />
                            <input
                                type="email"
                                placeholder="Email *"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={Boolean(isLoading) || isSubmitting}
                                className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                            />
                        </label>
                    </div>
                </section>

                <section>
                    <h3 className="mb-5 text-[32px] leading-none font-semibold text-[#111826]">2. Ünvan</h3>
                    <div className="space-y-4">
                        {hasSavedAddresses ? (
                            <div className="space-y-3">
                                <label className="flex cursor-pointer items-center gap-3 rounded-[20px] border border-[#e3e9f2] bg-[#f2f5fa] px-5 py-5">
                                    <input
                                        type="radio"
                                        name="address-mode"
                                        checked={addressMode === "existing"}
                                        onChange={() => setAddressMode("existing")}
                                        className="h-[15px] w-[15px] accent-[#2756ff]"
                                        disabled={Boolean(isLoading)}
                                    />
                                    <span className="text-[15px] font-medium text-[#161922]">Mən mövcud ünvanımı istifadə etmək istəyirəm</span>
                                </label>

                                {addressMode === "existing" ? (
                                    <div className="space-y-3">
                                        <div className="space-y-3">
                                            {addresses.map((a) => {
                                                const isSelected = a.id === selectedAddressId;
                                                const label = (toText(a.label) || toText(a.recipient_name) || `#${a.id}`).trim();
                                                const addressChunks = [
                                                    toText(a.city),
                                                    toText(a.region),
                                                    toText(a.address_line1),
                                                ].filter(Boolean);
                                                const addressLine = addressChunks.join(", ");

                                                return (
                                                    <button
                                                        key={a.id}
                                                        type="button"
                                                        onClick={() => setSelectedAddressId(a.id)}
                                        disabled={Boolean(isLoading) || isSubmitting}
                                                        className={[
                                                            "w-full cursor-pointer rounded-[20px] border px-5 py-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                                                            isSelected ? "border-[#2050f5] bg-[#eaf0f7]" : "border-[#e3e9f2] bg-white hover:bg-[#f2f5fa]",
                                                        ].join(" ")}
                                                    >
                                                        <div className="text-[15px] font-semibold text-[#111826]">{label}</div>
                                                        {addressLine ? (
                                                            <div className="mt-1 text-[14px] font-medium text-[#565F6F]">{addressLine}</div>
                                                        ) : null}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}

                                <label className="flex cursor-pointer items-center gap-3 rounded-[20px] border border-[#d2dded] bg-[#eaf0f7] px-5 py-5">
                                    <input
                                        type="radio"
                                        name="address-mode"
                                        checked={addressMode === "new"}
                                        onChange={() => setAddressMode("new")}
                                        className="h-[15px] w-[15px] accent-[#2756ff]"
                                        disabled={Boolean(isLoading)}
                                    />
                                    <span className="text-[15px] font-medium text-[#161922]">Mən yeni ünvan istifadə etmək istəyirəm</span>
                                </label>
                            </div>
                        ) : null}

                        {(!hasSavedAddresses || addressMode === "new") ? (
                            <>
                                {(deliveryLevels.length > 0 ? deliveryLevels : [{ options: rootDeliveryOptions, selectedId: "" }]).map((level, idx, arr) => {
                                    const prevSelectedId = idx > 0 ? arr[idx - 1]?.selectedId : "";
                                    const isDisabled = Boolean(isLoading) || isSubmitting || (idx > 0 && !prevSelectedId);
                                    const options = (Array.isArray(level.options) ? level.options : []).map((opt) => ({
                                        id: toNumber((opt as any).id),
                                        name: toText((opt as any).name),
                                    }));
                                    return (
                                        <DeliverySelect
                                            key={idx}
                                            value={level.selectedId}
                                            onChange={(nextValue) => onDeliverySelectChange(idx, nextValue)}
                                            options={options}
                                            disabled={isDisabled}
                                            loading={false}
                                        />
                                    );
                                })}

                                <p className="text-[15px] font-semibold text-[#ef2b2b]">
                                    Ünvana çatdırılma: {formatPrice(deliveryPrice)}
                                </p>

                                <label className="flex h-[64px] items-center rounded-[20px] border border-[#d8dde6] bg-white">
                                    <MapPin className="ml-5 mr-3 size-5 text-[#2050f5]" strokeWidth={2.1} />
                                    <input
                                        type="text"
                                        placeholder="Ünvan *"
                                        value={addressLine1}
                                        onChange={(e) => setAddressLine1(e.target.value)}
                                        className="h-full w-full bg-transparent pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                                        disabled={Boolean(isLoading) || isSubmitting}
                                    />
                                </label>
                            </>
                        ) : (
                            <p className="text-[15px] font-semibold text-[#ef2b2b]">
                                Ünvana çatdırılma: {formatPrice(deliveryPrice)}
                            </p>
                        )}
                    </div>
                </section>

                <section>
                    <h3 className="mb-5 text-[32px] leading-none font-semibold text-[#111826]">3. Ödəniş üsulları</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {paymentMethods.length > 0 ? (
                            paymentMethods.map((method, idx) => {
                                const key = toText(method.key);
                                const isSelected = Boolean(key && key === selectedPaymentKey);
                                const baseClass = "flex h-[88px] cursor-pointer items-center gap-3 rounded-[16px] border px-4";
                                const selectedClass = "border border-[#d2dded] bg-[#eaf0f7]";
                                const unselectedClass = "border border-[#e3e9f2] bg-[#f2f5fa]";
                                const labelClass = isSelected ? "text-[14px] font-medium text-[#2e5cff]" : "text-[14px] font-medium text-[#7f8fa8]";
                                const iconColor = isSelected ? "text-[#8d99ab]" : "text-[#9aa7ba]";

                                const icon =
                                    idx === 0 ? (
                                        <Landmark className={`ml-auto size-[18px] ${iconColor}`} />
                                    ) : idx === 1 ? (
                                        <Wallet className={`ml-auto size-[18px] ${iconColor}`} />
                                    ) : (
                                        <CreditCard className={`ml-auto size-[18px] ${iconColor}`} />
                                    );

                                return (
                                    <label key={key || String(idx)} className={[baseClass, isSelected ? selectedClass : unselectedClass].join(" ")}>
                                        <input
                                            type="radio"
                                            name="payment-method"
                                            checked={isSelected}
                                            onChange={() => setSelectedPaymentKey(key)}
                                            className="h-[15px] w-[15px] accent-[#2756ff]"
                                            disabled={Boolean(isLoading) || isSubmitting || !key}
                                        />
                                        <span className={labelClass}>{toText(method.name) || key}</span>
                                        {icon}
                                    </label>
                                );
                            })
                        ) : (
                            <>
                                <label className="flex h-[88px] cursor-pointer items-center gap-3 rounded-[16px] border border-[#d2dded] bg-[#eaf0f7] px-4">
                                    <input type="radio" name="payment-method" defaultChecked className="h-[15px] w-[15px] accent-[#2756ff]" />
                                    <span className="text-[14px] font-medium text-[#2e5cff]">Qapıda post terminalla</span>
                                    <Landmark className="ml-auto size-[18px] text-[#8d99ab]" />
                                </label>
                                <label className="flex h-[88px] cursor-pointer items-center gap-3 rounded-[16px] border border-[#e3e9f2] bg-[#f2f5fa] px-4">
                                    <input type="radio" name="payment-method" className="h-[15px] w-[15px] accent-[#2756ff]" />
                                    <span className="text-[14px] font-medium text-[#7f8fa8]">Qapıda nəğd pulla</span>
                                    <Wallet className="ml-auto size-[18px] text-[#9aa7ba]" />
                                </label>
                                <label className="flex h-[88px] cursor-pointer items-center gap-3 rounded-[16px] border border-[#e3e9f2] bg-[#f2f5fa] px-4">
                                    <input type="radio" name="payment-method" className="h-[15px] w-[15px] accent-[#2756ff]" />
                                    <span className="text-[14px] font-medium text-[#7f8fa8]">Saytda kart ilə ödəniş</span>
                                    <CreditCard className="ml-auto size-[18px] text-[#9aa7ba]" />
                                </label>
                            </>
                        )}
                    </div>

                    {installments.length > 0 ? (
                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                            {installments.map((inst: any) => {
                                const id = Number(inst?.id);
                                const month = Number(inst?.month);
                                const isSelected = id === selectedInstallmentId;
                                return (
                                    <label
                                        key={Number.isFinite(id) ? id : String(month)}
                                        className={[
                                            "flex h-[72px] cursor-pointer items-center gap-3 rounded-[16px] border px-4",
                                            isSelected ? "border border-[#d2dded] bg-[#eaf0f7]" : "border border-[#e3e9f2] bg-[#f2f5fa]",
                                        ].join(" ")}
                                    >
                                        <input
                                            type="radio"
                                            name="payment-installment"
                                            checked={isSelected}
                                            onChange={() => setSelectedInstallmentId(Number.isFinite(id) ? id : null)}
                                            className="h-[15px] w-[15px] accent-[#2756ff]"
                                            disabled={Boolean(isLoading) || isSubmitting || !Number.isFinite(id)}
                                        />
                                        <span className={isSelected ? "text-[14px] font-medium text-[#2e5cff]" : "text-[14px] font-medium text-[#7f8fa8]"}>
                                            {Number.isFinite(month) ? `${month} ay` : "Hissə"}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    ) : null}
                </section>

                <section>
                    <h3 className="mb-5 text-[32px] leading-none font-semibold text-[#111826]">4. Şərh</h3>
                    <label className="flex min-h-[160px] items-start gap-3 rounded-[20px] border border-[#d8dde6] bg-white px-5 py-4 text-[#6e7f99]">
                        <svg className="mt-[2px] h-5 w-5 shrink-0 text-[#2050f5]" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M6.5 13.5L5.75 16.5L8.75 15.75L15.25 9.25C15.6642 8.83579 15.6642 8.16421 15.25 7.75L12.25 4.75C11.8358 4.33579 11.1642 4.33579 10.75 4.75L4.25 11.25L3.5 14.5L6.5 13.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <textarea
                            placeholder="Şərh"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="h-full min-h-[130px] w-full resize-none bg-transparent pr-5 text-[15px] leading-[1.35] font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
                            disabled={Boolean(isLoading) || isSubmitting}
                        />
                    </label>
                </section>
            </div>
        </div>
    );
};

export { CheckoutDetailsForm };
