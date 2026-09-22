"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin, Pencil, Phone, Trash2, UserRound } from "lucide-react";
import { Spinner, useNotify } from "@repo/ui";
import { sanitizeNameInput } from "@repo/shared/utils";
import { getTranslations } from "@/lib/i18n";

type Address = {
    id: number;
    type: string | null;
    label: string | null;
    recipient_name: string | null;
    phone: string | null;
    country_id: number | null;
    delivery_price_id: number | null;
    region: string | null;
    city: string | null;
    postal_code: string | null;
    address_line1: string | null;
    address_line2: string | null;
    company: string | null;
    note: string | null;
    is_default: boolean | null;
    status: boolean | null;
};

type ApiResponse<T> = {
    success?: boolean;
    message?: string;
    data?: T;
};

type AddressForm = {
    label: string;
    name: string;
    surname: string;
    city: string;
    address_line1: string;
    is_default: boolean;
};

type Field = keyof AddressForm;
type Errors = Partial<Record<Field, string>>;

const toText = (value: unknown) => (typeof value === "string" ? value : "");

type DeliveryPrice = {
    id: number;
    parent_id: number;
    parent_name?: string | null;
    name: string;
    price?: number | string | null;
    status?: string | null;
    sort_order?: number | null;
};

type DeliveryLevel = {
    options: DeliveryPrice[];
    selectedId: string;
};

function DeliverySelect({
    value,
    onChange,
    options,
    disabled,
    loading,
    labels,
}: {
    value: string;
    onChange: (nextValue: string) => void;
    options: DeliveryPrice[];
    disabled?: boolean;
    loading?: boolean;
    labels: { loading: string; select: string; noOptions: string };
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
                className="flex h-[64px] w-full cursor-pointer items-center justify-between rounded-[18px] border border-[#d8dde6] bg-white px-4 text-[15px] text-[#161922] outline-none transition focus:border-[#2050f5] focus:ring-2 focus:ring-[#2050f5]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <span className="min-w-0 truncate text-left">
                    {loading ? labels.loading : selectedLabel || labels.select}
                </span>
                <ChevronDown className="h-5 w-5 text-[#565F6F]" />
            </button>

            {open ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[280px] overflow-auto rounded-[18px] border border-[#d8dde6] bg-white p-2 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.55)]">
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-[14px] text-[#565F6F]">{labels.noOptions}</div>
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

export function AddressClient({
    locale,
    initialAddresses,
}: {
    locale: string;
    initialAddresses: Address[];
}) {
    const notify = useNotify();
    const router = useRouter();
    const effectiveLocale = useMemo(() => {
        const normalized = locale.trim().toLowerCase();
        return ["az", "ru", "en"].includes(normalized) ? normalized : "az";
    }, [locale]);

    const t = useMemo(() => getTranslations(effectiveLocale).account, [effectiveLocale]);
    const selectLabels = useMemo(
        () => ({ loading: t.form.loading, select: t.form.select, noOptions: t.form.noOptions }),
        [t]
    );

    const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Errors>({});
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isEditingLoading, setIsEditingLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deliveryLevels, setDeliveryLevels] = useState<DeliveryLevel[]>([]);
    const [deliveryRootLoading, setDeliveryRootLoading] = useState(false);
    const [deliveryChildrenLoading, setDeliveryChildrenLoading] = useState(false);
    const [deliveryLeafId, setDeliveryLeafId] = useState<string>("");
    const deliveryFetchSeqRef = useRef(0);
    const [formData, setFormData] = useState<AddressForm>({
        label: "",
        name: "",
        surname: "",
        city: "",
        address_line1: "",
        is_default: false,
    });

    const updateField = (field: Field, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value as any }));
        setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    };

    const resetForm = () => {
        setFormData({
            label: "",
            name: "",
            surname: "",
            city: "",
            address_line1: "",
            is_default: false,
        });
        setErrors({});
        setEditingId(null);
        setDeliveryLeafId("");
        setDeliveryLevels((prev) => {
            const root = prev[0];
            if (!root) return prev;
            return [{ ...root, selectedId: "" }];
        });
    };

    const closeForm = () => {
        resetForm();
        setIsFormOpen(false);
    };

    useEffect(() => {
        let isMounted = true;

        const run = async () => {
            setDeliveryRootLoading(true);
            try {
                const res = await fetch("/api/order/delivery-prices?parent_id=0", {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        Accept: "application/json",
                        "Content-Language": effectiveLocale,
                    },
                });
                const json = (await res.json().catch(() => null)) as ApiResponse<DeliveryPrice[] | null> | null;
                const list = res.ok && json?.success && Array.isArray(json.data) ? json.data : [];

                if (!isMounted) return;
                setDeliveryLevels([{ options: list, selectedId: "" }]);
                setDeliveryLeafId("");
            } catch {
                if (!isMounted) return;
                setDeliveryLevels([]);
                setDeliveryLeafId("");
            } finally {
                if (!isMounted) return;
                setDeliveryRootLoading(false);
            }
        };

        run();

        return () => {
            isMounted = false;
        };
    }, [effectiveLocale]);

    const fetchDeliveryPrices = async (parentId: string, cache: Map<string, DeliveryPrice[]>) => {
        const key = String(parentId);
        const cached = cache.get(key);
        if (cached) return cached;

        const res = await fetch(`/api/order/delivery-prices?parent_id=${encodeURIComponent(key)}`, {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "Content-Language": effectiveLocale,
            },
        });
        const json = (await res.json().catch(() => null)) as ApiResponse<DeliveryPrice[] | null> | null;
        const list = res.ok && json?.success && Array.isArray(json.data) ? json.data : [];
        cache.set(key, list);
        return list;
    };

    const buildDeliveryLevelsForLeaf = async (leafId: string) => {
        const cache = new Map<string, DeliveryPrice[]>();
        const roots = await fetchDeliveryPrices("0", cache);
        const trimmedLeaf = String(leafId || "").trim();
        const fallbackFirstId = "";

        if (!trimmedLeaf) {
            return fallbackFirstId ? [{ options: roots, selectedId: fallbackFirstId }] : [{ options: roots, selectedId: "" }];
        }

        const stack: Array<{ node: DeliveryPrice; path: DeliveryPrice[] }> = roots.map((node) => ({ node, path: [node] }));
        const visited = new Set<number>();
        let foundPath: DeliveryPrice[] | null = null;

        while (stack.length > 0) {
            const { node, path } = stack.pop()!;
            if (visited.has(node.id)) continue;
            visited.add(node.id);
            if (String(node.id) === trimmedLeaf) {
                foundPath = path;
                break;
            }
            const children = await fetchDeliveryPrices(String(node.id), cache);
            for (const child of children) {
                stack.push({ node: child, path: [...path, child] });
            }
            if (visited.size > 800) break;
        }

        if (!foundPath || foundPath.length === 0) {
            return fallbackFirstId ? [{ options: roots, selectedId: fallbackFirstId }] : [{ options: roots, selectedId: "" }];
        }

        const first = foundPath[0];
        if (!first) {
            return fallbackFirstId ? [{ options: roots, selectedId: fallbackFirstId }] : [{ options: roots, selectedId: "" }];
        }

        const levels: DeliveryLevel[] = [{ options: roots, selectedId: String(first.id) }];
        for (let i = 1; i < foundPath.length; i++) {
            const parent = foundPath[i - 1];
            const current = foundPath[i];
            if (!parent || !current) break;

            const parentId = String(parent.id);
            const siblings = await fetchDeliveryPrices(parentId, cache);
            levels.push({ options: siblings, selectedId: String(current.id) });
        }

        return levels;
    };

    const loadChildrenFor = async (levelIndex: number, selectedId: string) => {
        const cleanId = String(selectedId || "").trim();
        if (!cleanId) return;

        const seq = ++deliveryFetchSeqRef.current;
        setDeliveryChildrenLoading(true);
        setDeliveryLeafId("");

        try {
            const res = await fetch(`/api/order/delivery-prices?parent_id=${encodeURIComponent(cleanId)}`, {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                    "Content-Language": effectiveLocale,
                },
            });
            const json = (await res.json().catch(() => null)) as ApiResponse<DeliveryPrice[] | null> | null;
            const list = res.ok && json?.success && Array.isArray(json.data) ? json.data : [];

            if (seq !== deliveryFetchSeqRef.current) return;

            if (list.length === 0) {
                setDeliveryLevels((prev) => prev.slice(0, levelIndex + 1));
                setDeliveryLeafId(cleanId);
                return;
            }

            setDeliveryLevels((prev) => [...prev.slice(0, levelIndex + 1), { options: list, selectedId: "" }]);
        } finally {
            if (seq !== deliveryFetchSeqRef.current) return;
            setDeliveryChildrenLoading(false);
        }
    };

    const validate = (payload: AddressForm): Errors => {
        const next: Errors = {};
        if (!payload.name.trim()) next.name = t.form.requiredName;
        if (!payload.surname.trim()) next.surname = t.form.requiredSurname;
        if (!payload.city.trim()) next.city = t.address.requiredCity;
        if (!payload.address_line1.trim()) next.address_line1 = t.address.requiredAddress;
        return next;
    };

    const refreshAddresses = async () => {
        const res = await fetch("/api/customer/addresses", {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "Content-Language": effectiveLocale,
            },
        });
        const json = (await res.json().catch(() => null)) as ApiResponse<Address[] | null> | null;
        if (!res.ok || !json?.success || !Array.isArray(json.data)) {
            return;
        }
        setAddresses(json.data);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!deliveryLeafId) {
            notify.error(t.address.incompleteRegion);
            return;
        }

        const nextErrors = validate(formData);
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const recipient_name = `${formData.name.trim()} ${formData.surname.trim()}`.trim();
            const selectedPath = deliveryLevels
                .map((lvl) => lvl.options.find((opt) => String(opt.id) === lvl.selectedId)?.name)
                .filter(Boolean);

            const payload: Record<string, unknown> = {
                type: "shipping",
                label: formData.label.trim() || undefined,
                recipient_name,
                phone: "",
                country_id: 1,
                delivery_price_id: String(deliveryLeafId),
                region: selectedPath.join(" / ") || undefined,
                city: formData.city.trim(),
                address_line1: formData.address_line1.trim(),
                is_default: formData.is_default,
                status: true,
                sort_order: 0,
            };

            const isEditing = typeof editingId === "number";
            const endpoint = isEditing ? `/api/customer/addresses/${editingId}` : "/api/customer/addresses";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "Content-Language": effectiveLocale,
                },
                body: JSON.stringify(payload),
            });

            const json = (await res.json().catch(() => null)) as ApiResponse<Address | null> | null;
            const ok = res.ok && (json?.success ?? true);
            if (!ok) {
                notify.error(json?.message || t.address.saveFailed);
                return;
            }

            notify.success(isEditing ? t.address.updated : t.address.added);
            closeForm();
            await refreshAddresses();
            router.refresh();
        } catch {
            notify.error(t.form.serverError);
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEdit = async (id: number) => {
        if (isSubmitting) return;
        if (editingId === id) {
            closeForm();
            return;
        }

        setIsFormOpen(true);
        setEditingId(id);
        setIsEditingLoading(true);
        setErrors({});

        try {
            const res = await fetch(`/api/customer/addresses/${id}`, {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                    "Content-Language": effectiveLocale,
                },
            });

            const json = (await res.json().catch(() => null)) as ApiResponse<Address | null> | null;
            const addr = res.ok && json?.success && json.data ? json.data : null;
            if (!addr) {
                notify.error(json?.message || t.address.notFound);
                closeForm();
                return;
            }

            const recipient = toText(addr.recipient_name).trim();
            const [firstName, ...rest] = recipient.split(/\s+/).filter(Boolean);
            const name = firstName || "";
            const surname = rest.join(" ");

            setFormData({
                label: toText(addr.label),
                name,
                surname,
                city: toText(addr.city),
                address_line1: toText(addr.address_line1),
                is_default: Boolean(addr.is_default),
            });

            const leafId = addr.delivery_price_id ? String(addr.delivery_price_id) : "";
            const levels = await buildDeliveryLevelsForLeaf(leafId);
            setDeliveryLevels(levels);
            setDeliveryLeafId(leafId);
        } catch {
            notify.error(t.form.serverError);
            closeForm();
        } finally {
            setIsEditingLoading(false);
        }
    };

    const deleteAddress = async (id: number) => {
        if (isSubmitting || isEditingLoading) return;
        if (deletingId === id) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/customer/addresses/${id}`, {
                method: "DELETE",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                    "Content-Language": effectiveLocale,
                },
            });

            const json = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;
            const ok = res.ok && (json?.success ?? true);
            if (!ok) {
                notify.error(json?.message || t.address.deleteFailed);
                return;
            }

            notify.success(t.address.deleted);
            if (editingId === id) closeForm();
            setAddresses((prev) => prev.filter((a) => a.id !== id));
            router.refresh();
        } catch {
            notify.error(t.form.serverError);
        } finally {
            setDeletingId((prev) => (prev === id ? null : prev));
        }
    };

    const isDeliveryLoading = isFormOpen && (deliveryRootLoading || deliveryChildrenLoading);
    const [deliveryOverlayVisible, setDeliveryOverlayVisible] = useState(false);
    const overlayShowTimerRef = useRef<number | null>(null);
    const overlayHideTimerRef = useRef<number | null>(null);
    const overlayShownAtRef = useRef<number>(0);

    useEffect(() => {
        const SHOW_DELAY_MS = 150;
        const MIN_VISIBLE_MS = 250;

        if (isDeliveryLoading) {
            if (overlayHideTimerRef.current !== null) {
                window.clearTimeout(overlayHideTimerRef.current);
                overlayHideTimerRef.current = null;
            }

            if (deliveryOverlayVisible) return;
            if (overlayShowTimerRef.current !== null) return;

            overlayShowTimerRef.current = window.setTimeout(() => {
                overlayShownAtRef.current = Date.now();
                setDeliveryOverlayVisible(true);
                overlayShowTimerRef.current = null;
            }, SHOW_DELAY_MS);

            return;
        }

        if (overlayShowTimerRef.current !== null) {
            window.clearTimeout(overlayShowTimerRef.current);
            overlayShowTimerRef.current = null;
        }

        if (!deliveryOverlayVisible) return;

        const elapsed = Date.now() - overlayShownAtRef.current;
        const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

        if (overlayHideTimerRef.current !== null) {
            window.clearTimeout(overlayHideTimerRef.current);
        }

        overlayHideTimerRef.current = window.setTimeout(() => {
            setDeliveryOverlayVisible(false);
            overlayHideTimerRef.current = null;
        }, remaining);
    }, [isDeliveryLoading, deliveryOverlayVisible]);

    useEffect(() => {
        return () => {
            if (overlayShowTimerRef.current !== null) window.clearTimeout(overlayShowTimerRef.current);
            if (overlayHideTimerRef.current !== null) window.clearTimeout(overlayHideTimerRef.current);
        };
    }, []);

    return (
        <div className="w-full">
            {deliveryOverlayVisible || isEditingLoading ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20">
                    <Spinner size={24} />
                </div>
            ) : null}
            <div className="grid gap-5">
                <div className="rounded-[20px] bg-[#f7f7f7] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-[15px] font-semibold text-[#0F131A]">{t.address.heading}</div>
                        <button
                            type="button"
                            onClick={() => {
                                setIsFormOpen(true);
                                resetForm();
                            }}
                            disabled={isSubmitting || isEditingLoading}
                            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#2050f5] px-6 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <span aria-hidden className="text-[18px] leading-none">
                                +
                            </span>
                            {t.address.newAddress}
                        </button>
                    </div>

                    {addresses.length === 0 ? (
                        <div className="mt-3 text-[14px] font-medium text-[#202938]">{t.address.notFound}</div>
                    ) : (
                        <div className="mt-4 grid gap-3">
                            {addresses.map((addr) => (
                                <div key={addr.id} className="rounded-[16px] bg-white p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <div className="min-w-0 truncate text-[14px] font-semibold text-[#0F131A]">
                                                {addr.label || t.address.addressLine}
                                            </div>
                                            {addr.is_default ? (
                                                <span className="shrink-0 rounded-full bg-[#e8efff] px-2 py-0.5 text-[12px] font-semibold text-[#0D47FF]">
                                                    {t.address.primary}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => startEdit(addr.id)}
                                                disabled={isSubmitting || isEditingLoading || deletingId === addr.id}
                                                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#f0f1f3] text-[#0F131A] hover:bg-[#e5e7eb] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <span className="sr-only">{t.form.edit}</span>
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteAddress(addr.id)}
                                                disabled={isSubmitting || isEditingLoading || deletingId === addr.id}
                                                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#fff1f2] text-[#b91c1c] hover:bg-[#ffe4e6] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <span className="sr-only">{t.form.remove}</span>
                                                {deletingId === addr.id ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-2 grid gap-1 text-[13px] text-[#565F6F]">
                                        {addr.recipient_name ? (
                                            <div className="flex items-center gap-2">
                                                <UserRound className="size-4 text-[#2050f5]" />
                                                <span>{addr.recipient_name}</span>
                                            </div>
                                        ) : null}
                                        {addr.phone ? (
                                            <div className="flex items-center gap-2">
                                                <Phone className="size-4 text-[#2050f5]" />
                                                <span>{addr.phone}</span>
                                            </div>
                                        ) : null}
                                        <div className="flex items-start gap-2">
                                            <MapPin className="mt-0.5 size-4 text-[#2050f5]" />
                                            <div className="min-w-0">
                                                <div className="text-[#0F131A]">
                                                    {toText(addr.address_line1)}
                                                    {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                                                </div>
                                                <div>
                                                    {[addr.city, addr.region, addr.postal_code].filter(Boolean).join(" • ")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isFormOpen ? (
                    <div className="rounded-[20px] bg-white px-0 py-5 sm:p-5">
                        <div className="flex flex-nowrap items-center justify-between gap-3">
                            <div className="min-w-0 truncate text-[15px] font-semibold text-[#0F131A]">
                                {editingId ? t.address.editTitle : t.address.addTitle}
                            </div>
                            <div className="shrink-0">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={isSubmitting || isEditingLoading}
                                    className="h-9 cursor-pointer rounded-[12px] bg-[#f0f1f3] px-4 text-[13px] font-semibold text-[#0F131A] hover:bg-[#e5e7eb] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {t.form.cancel}
                                </button>
                            </div>
                        </div>

                        <form className="mt-4" onSubmit={onSubmit}>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <div className="text-[13px] font-semibold text-[#0F131A]">{t.address.label}</div>
                                    <input
                                        type="text"
                                        value={formData.label}
                                        onChange={(e) => updateField("label", e.target.value)}
                                        placeholder={t.address.labelPlaceholder}
                                        className="h-[64px] w-full rounded-[18px] border border-[#d8dde6] bg-transparent px-4 text-[15px] text-[#161922] outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="text-[13px] font-semibold text-[#0F131A]">{t.form.name}</div>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => updateField("name", sanitizeNameInput(e.target.value))}
                                            placeholder={t.form.name}
                                            className="h-[64px] w-full rounded-[18px] border border-[#d8dde6] bg-transparent px-4 text-[15px] text-[#161922] outline-none"
                                        />
                                        {errors.name ? <p className="px-2 text-sm text-red-600">{errors.name}</p> : null}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-[13px] font-semibold text-[#0F131A]">{t.form.surname}</div>
                                        <input
                                            type="text"
                                            value={formData.surname}
                                            onChange={(e) => updateField("surname", sanitizeNameInput(e.target.value))}
                                            placeholder={t.form.surname}
                                            className="h-[64px] w-full rounded-[18px] border border-[#d8dde6] bg-transparent px-4 text-[15px] text-[#161922] outline-none"
                                        />
                                        {errors.surname ? <p className="px-2 text-sm text-red-600">{errors.surname}</p> : null}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-[13px] font-semibold text-[#0F131A]">{t.address.country}</div>
                                    <DeliverySelect
                                        value={deliveryLevels[0]?.selectedId ?? ""}
                                        onChange={(selectedId) => {
                                            setDeliveryLevels((prev) => {
                                                const root = prev[0];
                                                if (!root) return prev;
                                                return [{ ...root, selectedId }];
                                            });
                                            void loadChildrenFor(0, selectedId);
                                        }}
                                        options={deliveryLevels[0]?.options ?? []}
                                        loading={deliveryRootLoading}
                                        labels={selectLabels}
                                    />
                                </div>

                                {deliveryLevels.slice(1).map((level, index) => {
                                    const absoluteIndex = index + 1;
                                    return (
                                        <div key={`region-${absoluteIndex}`} className="space-y-2">
                                            <div className="text-[13px] font-semibold text-[#0F131A]">{t.address.region}</div>
                                            <DeliverySelect
                                                value={level.selectedId}
                                                onChange={(selectedId) => {
                                                    setDeliveryLevels((prev) => {
                                                        const next = prev.slice(0, absoluteIndex + 1);
                                                        const current = next[absoluteIndex];
                                                        if (!current) return next;
                                                        next[absoluteIndex] = { options: current.options, selectedId };
                                                        return next;
                                                    });
                                                    void loadChildrenFor(absoluteIndex, selectedId);
                                                }}
                                                options={level.options}
                                                labels={selectLabels}
                                            />
                                        </div>
                                    );
                                })}

                                <div className="space-y-2">
                                    <div className="text-[13px] font-semibold text-[#0F131A]">{t.address.city}</div>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => updateField("city", e.target.value)}
                                        placeholder={t.address.city}
                                        className="h-[64px] w-full rounded-[18px] border border-[#d8dde6] bg-transparent px-4 text-[15px] text-[#161922] outline-none"
                                    />
                                    {errors.city ? <p className="px-2 text-sm text-red-600">{errors.city}</p> : null}
                                </div>

                                <div className="space-y-2">
                                    <div className="text-[13px] font-semibold text-[#0F131A]">{t.address.addressLine}</div>
                                    <input
                                        type="text"
                                        value={formData.address_line1}
                                        onChange={(e) => updateField("address_line1", e.target.value)}
                                        placeholder={t.address.addressLine}
                                        className="h-[64px] w-full rounded-[18px] border border-[#d8dde6] bg-transparent px-4 text-[15px] text-[#161922] outline-none"
                                    />
                                    {errors.address_line1 ? (
                                        <p className="px-2 text-sm text-red-600">{errors.address_line1}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <div className="text-[13px] font-semibold text-[#0F131A]">{t.address.primary}</div>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <label className="inline-flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#0F131A]">
                                            <input
                                                type="radio"
                                                name="is_default"
                                                checked={formData.is_default === true}
                                                onChange={() => updateField("is_default", true)}
                                            />
                                            <span>{t.form.yes}</span>
                                        </label>
                                        <label className="inline-flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#0F131A]">
                                            <input
                                                type="radio"
                                                name="is_default"
                                                checked={formData.is_default === false}
                                                onChange={() => updateField("is_default", false)}
                                            />
                                            <span>{t.form.no}</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isEditingLoading}
                                        className="flex h-[56px] w-full cursor-pointer items-center justify-center rounded-[16px] bg-[#2050f5] text-[15px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSubmitting ? <Spinner className="h-5 w-5" /> : t.form.save}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        disabled={isSubmitting || isEditingLoading}
                                        className="flex h-[56px] w-full cursor-pointer items-center justify-center rounded-[16px] bg-[#f0f1f3] text-[15px] font-semibold text-[#0F131A] transition-opacity hover:bg-[#e5e7eb] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {t.form.cancel}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
