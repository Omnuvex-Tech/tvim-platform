"use client";

import { useCallback, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Language } from "@repo/types/types";
import { Navbar } from "@repo/ui";
import { config } from "@/config";

interface NavbarWrapperProps {
    logo?: ReactNode;
    phone?: string;
    locale: string;
    languages: Language[];
    searchPlaceholder?: string;
}

const NavbarWrapper = ({
    logo,
    phone,
    locale,
    languages,
    searchPlaceholder,
}: NavbarWrapperProps) => {
    const router = useRouter();
    const pathname = usePathname();

    const handleLocaleChange = useCallback((nextLocale: string) => {
        const segments = pathname.split("/").filter(Boolean);
        if (segments.length === 0) {
            // Root path - sadece locale'ye git
            router.push(`/${nextLocale}`);
        } else {
            // Mevcut path'in locale kısmını değiştir
            segments[0] = nextLocale;
            router.push(`/${segments.join("/")}`);
        }
    }, [pathname, router]);

    return (
        <Navbar
            logo={logo}
            phone={phone}
            locale={locale}
            languages={languages}
            defLang={config.project.defLang}
            onLocaleChange={handleLocaleChange}
            searchPlaceholder={searchPlaceholder}
        />
    );
};

export { NavbarWrapper };
