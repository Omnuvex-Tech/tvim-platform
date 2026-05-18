import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type {
  FooterMenusData,
  HeaderCategoriesResponseData,
  HeaderMenuResponseData,
  Language,
  ProjectSettingsData,
  ProjectSettingsResponseData,
} from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { api } from "@/lib/api";
import { config } from "@/config";
import {
  extractHeaderCategories,
  extractHeaderItems,
  isCategoriesMenuType,
  isHeaderEnabledItem,
  isTopLevelHeaderItem,
  resolveHeaderMenuHref,
  resolveHeaderMenuLabel,
} from "@/lib/header-navigation";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { Footer } from "@/app/components/Footer/footer";
import { LoginForm } from "./login-form";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const normalizedLocale = (["az", "ru", "en"].includes(locale.toLowerCase())
    ? locale.toLowerCase()
    : "az") as "az" | "ru" | "en";

  const cookieStore = await cookies();
  const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
  const hasValidRouteLocale = ["az", "ru", "en"].includes(locale.toLowerCase());
  if (authToken && hasValidRouteLocale) {
    redirect(`/${normalizedLocale}`);
  }

  const homePageMeta = config.pages.home[normalizedLocale];
  const loginPageMeta = config.pages.signin[normalizedLocale];

  const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

  if (!langResponse.success || !langResponse.data) {
    return (
      <div className="flex min-h-svh items-center justify-center py-8">
        <p className="text-destructive">{langResponse.message}</p>
      </div>
    );
  }

  if (!langResponse.data.some((language) => language.code === locale)) {
    notFound();
  }

  const footerMenuResponse = await api.get<FooterMenusData>(config.endpoints.menus.list, {
    params: { in_footer: "1" },
    locale,
  });

  const settingsResponse = await api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
    locale,
  });

  const headerMenuResponse = await api.get<HeaderMenuResponseData>(config.endpoints.menus.list, {
    params: { in_header: "1" },
    locale,
  });

  const rawHeaderData = headerMenuResponse.success && headerMenuResponse.data ? headerMenuResponse.data : null;
  const headerItems = extractHeaderItems(rawHeaderData);
  const headerTopLevel = headerItems.filter(isTopLevelHeaderItem);

  const headerMenuItems = headerTopLevel
    .filter((item) => !isCategoriesMenuType(item))
    .map((item) => ({
      label: resolveHeaderMenuLabel(item),
      href: resolveHeaderMenuHref(item, locale),
    }))
    .filter((item) => item.label);

  const categoriesResponse = await api.get<HeaderCategoriesResponseData>("/product/categories", {
    params: { in_header: "1" },
    locale,
  });

  let headerCategoryItems = [];
  if (categoriesResponse.success && categoriesResponse.data) {
    const items = extractHeaderCategories(categoriesResponse.data);
    const filtered = items.filter(isHeaderEnabledItem);
    headerCategoryItems = filtered.length > 0 ? filtered : items;
  } else {
    headerCategoryItems = headerTopLevel.filter(isCategoriesMenuType);
  }

  const footerMenus =
    footerMenuResponse.success && footerMenuResponse.data
      ? footerMenuResponse.data.footer
      : [];

  let projectSettings: ProjectSettingsData | undefined;
  if (settingsResponse.success && settingsResponse.data) {
    projectSettings = settingsResponse.data.data;
  }

  const navbarLogo = projectSettings?.general.images.logo ? (
    <img
      src={projectSettings.general.images.logo}
      alt={projectSettings.general.site_title}
      className="h-10 w-auto object-contain sm:h-12 lg:h-14"
    />
  ) : projectSettings?.general.site_title ? (
    <div className="text-[32px] leading-none font-semibold tracking-[-0.02em] text-[#111318]">
      {projectSettings.general.site_title}
    </div>
  ) : undefined;

  const navbarPhone = projectSettings?.general.phones.find(
    (phone) => phone.is_whatsapp && phone.number.trim().startsWith("+994")
  )?.number;

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
      <NavbarWrapper
        logo={navbarLogo}
        phone={navbarPhone}
        locale={locale}
        languages={langResponse.data}
        menuItems={headerMenuItems}
        initialCatalogItems={headerCategoryItems}
      />

      <Breadcrumb
        items={[
          { label: homePageMeta.name, href: homePageMeta.url },
          { label: loginPageMeta.name, isCurrent: true },
        ]}
        showTitle
        pageTitle={loginPageMeta.title}
        titleClassName="mb-1"
      />

      <section className="w-full rounded-[20px] bg-white px-4 pt-3 pb-8 sm:px-8 sm:pt-4 sm:pb-10 lg:px-12">
        <div className="mx-auto w-full max-w-[640px]">
          <LoginForm locale={locale} />
        </div>
      </section>

      <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={locale} />
    </div>
  );
}
