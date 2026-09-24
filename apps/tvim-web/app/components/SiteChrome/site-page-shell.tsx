import { Suspense, type ReactNode } from "react";
import { Footer } from "@/app/components/Footer/footer";
import { KeywordChips } from "@/app/components/KeywordChips/keyword-chips";
import { LogoutToast } from "@/app/components/LogoutToast/logout-toast";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import type { SiteChromeData } from "@/lib/site-chrome";

type SitePageShellProps = {
    children: ReactNode;
    chrome: SiteChromeData;
    contentClassName?: string;
    includeLogoutToast?: boolean;
    /**
     * The page's meta keywords, drawn above the footer. Pass the same list the
     * page published in its metadata; pages kept out of the index pass none.
     */
    keywords?: readonly string[];
};

export function SitePageShell({
    children,
    chrome,
    contentClassName = "gap-0",
    includeLogoutToast = false,
    keywords = [],
}: SitePageShellProps) {
    return (
        <div className={`flex min-h-svh w-full flex-col items-center justify-start ${contentClassName} pt-0 pb-8`}>
            <NavbarWrapper
                logo={chrome.logo}
                phone={chrome.phone}
                locale={chrome.locale}
                languages={chrome.languages}
                menuItems={chrome.menuItems}
                initialCatalogItems={chrome.initialCatalogItems}
            />

            {children}

            {includeLogoutToast ? (
                <Suspense fallback={null}>
                    <LogoutToast />
                </Suspense>
            ) : null}

            <KeywordChips keywords={keywords} />

            <Footer
                footerMenus={chrome.footerMenus}
                footerSettings={chrome.projectSettings}
                locale={chrome.locale}
            />
        </div>
    );
}
