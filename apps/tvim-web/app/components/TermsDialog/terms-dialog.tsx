"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type TermsDialogProps = {
    open: boolean;
    onClose: () => void;
};

export const TermsDialog = ({ open, onClose }: TermsDialogProps) => {
    useEffect(() => {
        if (!open) return;

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose, open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
            role="presentation"
            onMouseDown={onClose}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="terms-dialog-title"
                className="flex max-h-[88vh] w-full max-w-[900px] flex-col overflow-hidden rounded-[4px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.28)]"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="flex min-h-[54px] items-center justify-between border-b border-[#eceff3] bg-[#fafafa] pl-5">
                    <h2 id="terms-dialog-title" className="text-[18px] font-bold text-[#1b1d22]">
                        İstifadə şərtləri
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-[54px] w-[40px] cursor-pointer items-center justify-center bg-[#f4f4f4] text-[#666] transition-colors hover:bg-[#ececec] hover:text-black"
                        aria-label="İstifadə şərtlərini bağla"
                    >
                        <X className="size-[14px]" strokeWidth={3.5} />
                    </button>
                </header>

                <div className="overflow-y-auto px-5 py-6 text-[16px] leading-[1.45] text-[#15171c] sm:px-6">
                    <h3 className="text-[24px] leading-tight font-bold">
                        Sifariş, Çatdırılma, Qaytarma və Dəyişdirmə Şərtləri
                    </h3>

                    <div className="mt-16 space-y-4">
                        <h4 className="text-[20px] font-bold">Əsas Anlayışlar:</h4>
                        <p><strong>Alıcı Razılaşması:</strong> Bu sənəddə onlayn alış-veriş ilə əlaqədar aşağıda göstərilən bütün şərtlər nəzərdə tutulur.</p>
                        <p><strong>Alıcı:</strong> TVİM.az onlayn platformasında göstərilən texniki imkanlar vasitəsilə elektron ödəniş edərək məhsul və ya xidmət sifariş edən, həmçinin bu &quot;Qaytarma və Dəyişdirmə Razılaşması&quot;nın şərtlərini qəbul edən fiziki və ya hüquqi şəxs.</p>
                        <p><strong>Satıcı:</strong> TVİM MMC-yə məxsus TVİM.az portalında öz məhsul və ya xidmətlərini onlayn olaraq satan, satış və çatdırılma şərtlərini müəyyən edən fiziki və ya hüquqi şəxs.</p>
                        <p><strong>Portal:</strong> Malların və xidmətlərin onlayn satış məkanı olan TVİM.az internet səhifəsi.</p>
                        <p><strong>Məhsul(lar)/Xidmət(lər):</strong> Portalda yerləşdirilən hər hansı mallar, xidmətlər, materiallar, avadanlıqlar və digər əşyalar.</p>
                        <p><strong>Sifariş:</strong> Alıcının müəyyən etdiyi ünvana çatdırılması məqsədilə Portaldan mal və ya xidmət alınması üçün elektron formada Satıcıya göndərilən sifariş forması.</p>
                        <p><strong>Qaytarma:</strong> Alıcının Portaldan əldə etdiyi məhsulun Satıcıya qaytarılması və ödənilmiş məbləğin geri alınması.</p>
                        <p><strong>Dəyişdirmə:</strong> Alıcının əldə etdiyi məhsulun Satıcıya təqdim edilərək əvəzində başqa məhsulun alınması.</p>
                    </div>

                    <div className="mt-12 space-y-4">
                        <h4 className="text-[20px] font-bold">Xüsusi Şərtlər:</h4>
                        <p>Alıcı Portaldan mal və ya xidmət sifariş etməklə bu Razılaşmanın şərtlərini tam şəkildə qəbul edir.</p>
                        <p>Portalda yerləşdirilən malların qaytarılması və dəyişdirilməsi Azərbaycan Respublikasının İstehlakçı Hüquqlarının Müdafiəsi haqqında Qanunun 15-ci maddəsi ilə tənzimlənir.</p>
                        <p>Satıcı alışın şərtlərini öncədən xəbərdarlıq etmədən dəyişdirmək hüququna malikdir.</p>
                        <p>Alışın baş tutması üçün Alıcı malın və ya xidmətin dəyərini tam şəkildə ödəmiş olmalıdır.</p>
                        <p>Alıcı sifariş forması doldurarkən öz əlaqə məlumatlarının Satıcı tərəfindən istifadə edilməsinə razılıq verir.</p>
                        <p>Sifarişin ləğvi və ya məhsulun mövcud olmaması hallarında Satıcı, Alıcıya sifarişin ləğvi barədə məlumat verməklə məsuliyyətdən azad olur.</p>
                    </div>

                    <div className="mt-12 space-y-4">
                        <h4 className="text-[20px] font-bold">Çatdırılma Qaydaları:</h4>
                        <ul className="list-disc space-y-3 pl-7">
                            <li>Azərbaycan daxilində 200 AZN və daha yuxarı məbləğdə olan sifarişlər üçün çatdırılma <strong>PULSUZ</strong>dur.</li>
                            <li>Böyük həcmli yüklərin çatdırılması 3 iş gününə qədər vaxt ala bilər.</li>
                        </ul>
                    </div>

                    <div className="mt-12 space-y-4 pb-4">
                        <h4 className="text-[20px] font-bold">Mübahisələrin Həlli:</h4>
                        <p>Bu Razılaşmadan irəli gələn bütün mübahisələr ilkin mərhələdə qarşılıqlı razılaşma yolu ilə həll olunmağa çalışılacaqdır. Əks halda, mübahisələr Azərbaycan Respublikasının qanunvericiliyi çərçivəsində həll ediləcəkdir.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};
