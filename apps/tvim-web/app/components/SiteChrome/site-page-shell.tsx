import type { ReactNode } from "react";
import { Footer } from "@/app/components/Footer/footer";
import { LogoutToast } from "@/app/components/LogoutToast/logout-toast";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import type { SiteChromeData } from "@/lib/site-chrome";

type SitePageShellProps = {
    children: ReactNode;
    chrome: SiteChromeData;
    contentClassName?: string;
    includeLogoutToast?: boolean;
    localizedLinks?: Record<string, string>;
};

export function SitePageShell({
    children,
    chrome,
    contentClassName = "gap-0",
    includeLogoutToast = false,
    localizedLinks,
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
                localizedLinks={localizedLinks}
            />

            {children}

            {includeLogoutToast ? <LogoutToast /> : null}

            <Footer
                footerMenus={chrome.footerMenus}
                footerSettings={chrome.projectSettings}
                locale={chrome.locale}
            />
        </div>
    );
}
