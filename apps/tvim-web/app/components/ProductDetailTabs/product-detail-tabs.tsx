"use client";

import Script from "next/script";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Spinner, useNotify } from "@repo/ui";
import { createProductComment, type ProductComment } from "@/lib/product-comments/client";
import { TermsDialog } from "@/app/components/TermsDialog/terms-dialog";

type SpecRow = {
    label: string;
    value: string;
};

type ProductDetailTabsProps = {
    descriptionHtml?: string | null;
    allSpecRows: SpecRow[];
    commentsCount?: number;
    productVariationId?: number | null;
    comments?: ProductComment[];
    metaKeywords?: string[];
};

type TabKey = "about" | "features" | "comments";

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
    if (!recaptcha) return null;

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

const getAuthorInitials = (author: string) => {
    const parts = String(author).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "U").toUpperCase();
    return `${parts[0]?.charAt(0) ?? ""}${parts[1]?.charAt(0) ?? ""}`.toUpperCase() || "U";
};

const formatCommentDate = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const ProductDetailTabs = ({
    descriptionHtml,
    allSpecRows,
    commentsCount = 0,
    productVariationId,
    comments = [],
    metaKeywords = [],
}: ProductDetailTabsProps) => {
    const notify = useNotify();
    const [activeTab, setActiveTab] = useState<TabKey>("about");
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [commentName, setCommentName] = useState("");
    const [commentText, setCommentText] = useState("");
    const [commentRating, setCommentRating] = useState(0);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [termsError, setTermsError] = useState("");
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");
    const [captchaError, setCaptchaError] = useState("");
    const [isRecaptchaScriptReady, setIsRecaptchaScriptReady] = useState(false);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const recaptchaRef = useRef<HTMLDivElement | null>(null);
    const recaptchaWidgetIdRef = useRef<number | null>(null);

    // --- Sliding indicator ---
    const tabsContainerRef = useRef<HTMLDivElement | null>(null);
    const [activeIndicator, setActiveIndicator] = useState({ left: 0, width: 0 });
    const [hoverIndicator, setHoverIndicator] = useState({ left: 0, width: 0 });
    const [hoveredTab, setHoveredTab] = useState<TabKey | null>(null);

    useEffect(() => {
        const container = tabsContainerRef.current;
        if (!container) return;
        const btn = container.querySelector<HTMLButtonElement>(`[data-tab="${activeTab}"]`);
        if (!btn) return;
        setActiveIndicator({
            left: activeTab === "about" ? 0 : btn.offsetLeft,
            width: activeTab === "about" ? btn.offsetLeft + btn.offsetWidth : btn.offsetWidth,
        });
    }, [activeTab]);

    const handleTabMouseEnter = (tab: TabKey) => {
        const container = tabsContainerRef.current;
        if (!container) return;
        const btn = container.querySelector<HTMLButtonElement>(`[data-tab="${tab}"]`);
        if (!btn) return;
        setHoverIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
        setHoveredTab(tab);
    };
    // -------------------------

    const hasDescription = useMemo(() => Boolean(String(descriptionHtml ?? "").trim()), [descriptionHtml]);
    const hasFeatures = allSpecRows.length > 0;
    const keywordItems = useMemo(() => metaKeywords.map((entry) => String(entry ?? "").trim()).filter(Boolean), [metaKeywords]);
    const recaptchaSiteKey = useMemo(() => {
        const envKey = (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "").trim();
        if (envKey) return envKey;
        return RECAPTCHA_TEST_SITE_KEY;
    }, []);
    const loadedComments = comments;
    const resolvedCommentsCount = Math.max(commentsCount, loadedComments.length);
    const averageRating =
        loadedComments.length > 0
            ? loadedComments.reduce((sum, item) => sum + (Number.isFinite(item.rating) ? item.rating : 0), 0) / loadedComments.length
            : 0;

    const resetRecaptchaWidget = () => {
        const widgetId = recaptchaWidgetIdRef.current;
        const controller = getReCaptchaController(window as WindowWithReCaptcha);

        if (widgetId !== null && controller && typeof controller.reset === "function") {
            controller.reset(widgetId);
        }

        setCaptchaToken("");
    };

    useEffect(() => {
        if (!showCommentForm || !isRecaptchaScriptReady || !recaptchaSiteKey) {
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
    }, [showCommentForm, isRecaptchaScriptReady, recaptchaSiteKey]);

    const handleSubmitComment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const fullname = commentName.trim();
        const comment = commentText.trim();

        setTermsError("");
        setCaptchaError("");

        if (!productVariationId) {
            notify.error("Məhsul variasiyası tapılmadı.");
            return;
        }

        if (!fullname) {
            notify.error("Adınızı daxil edin.");
            return;
        }

        if (!comment) {
            notify.error("Şərh mətnini daxil edin.");
            return;
        }

        if (commentRating < 1 || commentRating > 5) {
            notify.error("Reytinq 1-5 aralığında olmalıdır.");
            return;
        }

        if (!acceptedTerms) {
            const message = "Davam etmək üçün istifadə şərtlərini qəbul edin.";
            setTermsError(message);
            notify.error(message);
            return;
        }

        if (!recaptchaSiteKey) {
            const message = "reCAPTCHA konfiqurasiyası tapılmadı.";
            setCaptchaError(message);
            notify.error(message);
            return;
        }

        if (!captchaToken) {
            const message = "Zəhmət olmasa reCAPTCHA təsdiqləyin.";
            setCaptchaError(message);
            notify.error(message);
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
            const message = "reCAPTCHA yoxlanışı zamanı xəta baş verdi.";
            setCaptchaError(message);
            notify.error(message);
            resetRecaptchaWidget();
            return;
        }

        setIsSubmittingComment(true);
        try {
            const response = await createProductComment({
                productVariationId,
                fullname,
                rating: commentRating,
                comment,
            });

            notify.success(response.message || "Şərhiniz göndərildi.");
            setCommentName("");
            setCommentText("");
            setCommentRating(0);
            setAcceptedTerms(false);
            setTermsError("");
            setCaptchaError("");
            resetRecaptchaWidget();
            setShowCommentForm(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Şərh göndərilərkən xəta baş verdi.";
            notify.error(message);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    return (
        <section className="mt-10 max-lg:mt-8">
            <Script
                src="https://www.google.com/recaptcha/api.js?render=explicit"
                strategy="afterInteractive"
                onLoad={() => setIsRecaptchaScriptReady(true)}
                onError={() => setCaptchaError("reCAPTCHA skripti yüklənmədi.")}
            />

            {/* Tab header with sliding indicator */}
            <div
                ref={tabsContainerRef}
                id="product-features"
                className="relative -ml-3 flex items-end gap-10 border-b border-[#dce3ef] pl-3 max-lg:ml-0 max-lg:flex-col max-lg:items-stretch max-lg:gap-0 max-lg:border-b-0 max-lg:pl-0"
            >
                {/* Active tab indicator - always visible */}
                <div
                    className="absolute bottom-0 h-[1px] transition-all duration-300 ease-in-out max-lg:hidden"
                    style={{
                        left: activeIndicator.left,
                        width: activeIndicator.width,
                        backgroundColor: "rgba(0, 56, 245, 1)",
                    }}
                />
                {/* Hover indicator - scales in from left when hovering a non-active tab */}
                {hoveredTab && hoveredTab !== activeTab ? (
                    <div
                        className="absolute bottom-0 h-[1px] origin-left max-lg:hidden"
                        style={{
                            left: hoverIndicator.left,
                            width: hoverIndicator.width,
                            backgroundColor: "#8b95a8",
                            animation: "scaleInX 0.25s ease-out forwards",
                        }}
                    />
                ) : null}
                <style>{`
                    @keyframes scaleInX {
                        from { transform: scaleX(0); }
                        to { transform: scaleX(1); }
                    }
                `}</style>

                <button
                    type="button"
                    data-tab="about"
                    onClick={() => setActiveTab("about")}
                    onMouseEnter={() => handleTabMouseEnter("about")}
                    onMouseLeave={() => setHoveredTab(null)}
                    className={`-mb-px cursor-pointer pb-3 text-[24px] font-bold leading-none transition-colors duration-300 max-lg:mb-0 max-lg:min-h-[64px] max-lg:border-b max-lg:px-3 max-lg:py-5 max-lg:text-left max-lg:text-[22px] ${
                        activeTab === "about" ? "max-lg:border-[rgba(0,56,245,1)]" : "max-lg:border-[#e5e9f0]"
                    }`}
                    style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        color: activeTab === "about" ? "rgba(0, 56, 245, 1)" : "#8b95a8",
                    }}
                >
                    Məhsul haqqında
                </button>
                <button
                    id="tab-features"
                    type="button"
                    data-tab="features"
                    onClick={() => setActiveTab("features")}
                    onMouseEnter={() => handleTabMouseEnter("features")}
                    onMouseLeave={() => setHoveredTab(null)}
                    className={`-mb-px cursor-pointer pb-3 text-[24px] font-bold leading-none transition-colors duration-300 max-lg:mb-0 max-lg:min-h-[64px] max-lg:border-b max-lg:px-3 max-lg:py-5 max-lg:text-left max-lg:text-[22px] ${
                        activeTab === "features" ? "max-lg:border-[rgba(0,56,245,1)]" : "max-lg:border-[#e5e9f0]"
                    }`}
                    style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        color: activeTab === "features" ? "rgba(0, 56, 245, 1)" : "#8b95a8",
                    }}
                >
                    Xüsusiyyətlər
                </button>
                <button
                    type="button"
                    data-tab="comments"
                    onClick={() => setActiveTab("comments")}
                    onMouseEnter={() => handleTabMouseEnter("comments")}
                    onMouseLeave={() => setHoveredTab(null)}
                    className={`-mb-px cursor-pointer pb-3 text-[24px] font-bold leading-none transition-colors duration-300 max-lg:mb-0 max-lg:min-h-[64px] max-lg:border-b max-lg:px-3 max-lg:py-5 max-lg:text-left max-lg:text-[22px] ${
                        activeTab === "comments" ? "max-lg:border-[rgba(0,56,245,1)]" : "max-lg:border-[#e5e9f0]"
                    }`}
                    style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        color: activeTab === "comments" ? "rgba(0, 56, 245, 1)" : "#8b95a8",
                    }}
                >
                    Şərhlər ({resolvedCommentsCount})
                </button>
            </div>

            {activeTab === "about" ? (
                <div className="mt-4 text-[14px] leading-[1.42857143] text-[#1b202b] max-lg:text-[14px] [&_p]:text-[14px] [&_p]:font-normal [&_p]:text-[#1b202b] [&_span]:text-[14px] [&_span]:font-normal [&_span]:text-[#1b202b] [&_b]:text-[14px] [&_b]:font-normal [&_b]:text-[#1b202b] [&_strong]:text-[14px] [&_strong]:font-normal [&_strong]:text-[#1b202b]">
                    {hasDescription ? (
                        <div dangerouslySetInnerHTML={{ __html: String(descriptionHtml ?? "") }} />
                    ) : (
                        <div className="min-h-[24px]" />
                    )}

                    {keywordItems.length > 0 ? (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {keywordItems.map((keyword, idx) => (
                                <span
                                    key={`${keyword}-${idx}`}
                                    className="inline-flex items-center rounded-full border border-[#e8edf3] bg-[#f7f9fc] px-[10px] py-[4px] text-[11px] leading-[1.2] text-[#111318]"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}

            {activeTab === "features" ? (
                hasFeatures ? (
                    <div className="mt-6 w-full">
                        <div className="space-y-10 text-[14px] leading-[1.42857143]">
                            {allSpecRows.map((row, idx) => (
                                <div
                                    key={`${row.label}-${idx}`}
                                    className="grid grid-cols-1 items-start gap-y-1 sm:grid-cols-[minmax(220px,320px)_minmax(0,1fr)] sm:gap-x-6 lg:grid-cols-[600px_minmax(0,1fr)] lg:gap-x-8"
                                >
                                    <span className="text-[#111318]">{row.label}</span>
                                    <span className="text-[#2a2a2d]">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 min-h-[24px] text-[14px] text-[#8b95a8]">Xüsusiyyət tapılmadı.</div>
                )
            ) : null}

            {activeTab === "comments" ? (
                <div className="mt-6">
                    <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[16px] leading-[1.35] font-[450] !text-[#000000] sm:text-[17px]">
                        <span className="!text-[#000000]">Şərh: {resolvedCommentsCount}</span>
                        <span className="!text-[#000000]">Orta qiymət: {averageRating.toFixed(1)}</span>
                        <div className="flex items-center gap-1 text-[18px] leading-none text-[#c7cdd9] sm:text-[19px]">
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <i
                                    key={`summary-star-${idx}`}
                                    className={`${idx < Math.round(averageRating) ? "fa-solid text-[#f1c64a]" : "far text-[#c7cdd9]"} fa-star`}
                                    aria-hidden="true"
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowCommentForm((prev) => !prev)}
                            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[rgba(0,61,255,1)] !px-5 !py-4 !text-[15px] !leading-none !font-[650] text-white transition-opacity hover:opacity-95 sm:!px-6"
                            style={{ fontFamily: "var(--font-inter), sans-serif" }}
                        >
                            Şərh yaz
                        </button>
                    </div>

                    {showCommentForm ? (
                        <form onSubmit={handleSubmitComment} className="mt-8 w-[73.9%] max-w-full space-y-4 max-lg:w-full">
                            <div className="space-y-2">
                                <div className="px-1 text-[13px] font-semibold text-[#0F131A]">Adınız</div>
                                <input
                                    value={commentName}
                                    onChange={(event) => setCommentName(event.target.value)}
                                    placeholder="Adınız"
                                    className="h-[64px] w-full rounded-[18px] border border-[#d8dde6] bg-transparent px-4 text-[15px] text-[#161922] outline-none placeholder:font-normal placeholder:text-[#8e97a8]"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="px-1 text-[13px] font-semibold text-[#0F131A]">Şərh yazın</div>
                                <textarea
                                    value={commentText}
                                    onChange={(event) => setCommentText(event.target.value)}
                                    placeholder="Şərh yazın"
                                    rows={5}
                                    className="min-h-[128px] w-full resize-y rounded-[18px] border border-[#d8dde6] bg-transparent px-4 py-4 text-[15px] leading-[1.45] text-[#161922] outline-none placeholder:font-normal placeholder:text-[#8e97a8]"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
                                <span className="text-[16px] font-normal text-[#1b202b]">
                                    <span className="mr-0 text-[#e01010]">*</span> <span className="-ml-[2px]">Reytinq</span>
                                </span>
                                <div className="flex items-center gap-1 text-[20px] leading-none">
                                    {Array.from({ length: 5 }).map((_, idx) => {
                                        const value = idx + 1;
                                        return (
                                            <button
                                                key={`rating-star-${value}`}
                                                type="button"
                                                onClick={() => setCommentRating(value)}
                                                className="cursor-pointer"
                                                aria-label={`${value} ulduz`}
                                            >
                                                <i className={`${value <= commentRating ? "fa-solid text-[#f1c64a]" : "far text-[#c7cdd9]"} fa-star`} aria-hidden="true" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <label className="flex w-full cursor-pointer select-none items-start gap-3 text-[16px] leading-[1.2] text-[#111318]">
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(event) => {
                                        setAcceptedTerms(event.target.checked);
                                        if (event.target.checked) {
                                            setTermsError("");
                                        }
                                    }}
                                    className="mt-[1px] size-[20px] cursor-pointer rounded-[2px] border-[#c7ccd5] accent-[#2050f5]"
                                />
                                <span>
                                    Mən{" "}
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            setIsTermsOpen(true);
                                        }}
                                        className="cursor-pointer border-0 bg-transparent p-0 font-bold text-[#111318] transition-colors hover:text-[#4a4a4a]"
                                    >
                                        istifadə şərtləri
                                    </button>
                                    -ni oxudum və razıyam
                                </span>
                            </label>

                            {termsError ? <p className="-mt-1 text-sm text-red-600">{termsError}</p> : null}

                            <div className="w-full">
                                <div ref={recaptchaRef} className="min-h-[78px] w-fit overflow-hidden leading-none" />
                                {captchaError ? <p className="mt-2 text-sm text-red-600">{captchaError}</p> : null}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmittingComment}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#003dff] px-6 py-3 text-[16px] font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmittingComment ? <Spinner size={18} /> : <span>Göndər</span>}
                                </button>
                            </div>
                        </form>
                    ) : null}

                    <div className="mt-8">
                        {loadedComments.length > 0 ? (
                            <div className="space-y-0">
                                {loadedComments.map((item) => (
                                    <div key={item.id} className="border-b border-[#e4e9f2] py-4 first:pt-0 last:border-b-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex flex-1 items-start gap-6">
                                                <div className="flex w-[56px] shrink-0 flex-col items-start pt-[2px]">
                                                    <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[#f2c215] text-[13px] font-bold text-[#111318]">
                                                        {getAuthorInitials(item.author)}
                                                    </span>
                                                    <div className="mt-[12px] flex items-center gap-1 text-[13px] leading-none">
                                                        {Array.from({ length: 5 }).map((_, idx) => (
                                                            <i
                                                                key={`${item.id}-star-${idx}`}
                                                                className={`${idx < Math.round(item.rating) ? "fa-solid text-[#f1c64a]" : "far text-[#c7cdd9]"} fa-star`}
                                                                aria-hidden="true"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="min-w-0 flex-1 pl-[24px]">
                                                    <div className="min-w-0 text-[26px] leading-[1] font-semibold text-[#111318] max-lg:text-[18px]">{item.author}</div>
                                                    <p className="mt-[6px] min-w-0 text-[20px] leading-[1.2] text-[#1b202b] max-lg:text-[14px]">{item.comment}</p>
                                                </div>
                                            </div>

                                            <div className="pt-[2px] text-[14px] leading-none font-normal text-[#8ea0b8] max-lg:text-[12px]">
                                                {formatCommentDate(item.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="min-h-[24px] text-[14px] font-[450] leading-[1.42857143] text-[#050505]" style={{ fontSize: "14px" }}>
                                Bu məhsul üçün şərh yazılmayıb.
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            <div className="mt-6" />
            <TermsDialog open={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        </section>
    );
};

export { ProductDetailTabs };
