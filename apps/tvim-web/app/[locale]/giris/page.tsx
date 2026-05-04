import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Lock, Mail } from "lucide-react";
import type {
  FooterMenusData,
  Language,
  ProjectSettingsData,
  ProjectSettingsResponseData,
} from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { Footer } from "@/app/components/Footer/footer";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

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

  const headerMenuResponse = await api.get<any>(config.endpoints.menus.list, {
    params: { in_header: "1" },
    locale,
  });

  const rawHeaderData = headerMenuResponse.success && headerMenuResponse.data ? headerMenuResponse.data : null;

  let headerItems: any[] = [];
  if (Array.isArray(rawHeaderData)) headerItems = rawHeaderData;
  else if (rawHeaderData) {
    if (Array.isArray(rawHeaderData.header)) headerItems = rawHeaderData.header;
    else if (Array.isArray(rawHeaderData.menus)) headerItems = rawHeaderData.menus;
    else if (Array.isArray(rawHeaderData.items)) headerItems = rawHeaderData.items;
    else if (Array.isArray(rawHeaderData.data)) headerItems = rawHeaderData.data;
    else if (Array.isArray(rawHeaderData.footer)) headerItems = rawHeaderData.footer;
  }

  const headerTopLevel = headerItems.filter((it: any) => !it || !it.parent_id || Number(it.parent_id) === 0).filter(Boolean);

  const headerMenuItems = headerTopLevel
    .filter((it: any) => (((it.type ?? "") + "").toString().toLowerCase() !== "categories"))
    .map((it: any) => {
      const hrefPart = (it.multi_links && it.multi_links[locale.toLowerCase()]) || it.link || "";
      const path = hrefPart ? `/${locale.toLowerCase()}/${String(hrefPart).replace(/^\/+/, "")}` : "#";
      return { label: it.name ?? it.title ?? it.link ?? "", href: path };
    });

  const categoriesResponse = await api.get<any>("/product/categories", {
    params: { in_header: "1" },
    locale,
  });

  let headerCategoryItems: any[] = [];
  if (categoriesResponse.success && categoriesResponse.data) {
    const raw = categoriesResponse.data;
    let items: any[] = [];
    if (Array.isArray(raw)) items = raw;
    else if (Array.isArray(raw.data)) items = raw.data;
    else if (Array.isArray(raw.items)) items = raw.items;
    else if (raw && typeof raw === "object") {
      const arr = Object.values(raw).find((v) => Array.isArray(v));
      if (Array.isArray(arr)) items = arr as any[];
    }

    const filtered = items.filter(
      (it) =>
        !!it &&
        (it.in_header === true || it.in_header === 1 || it.in_header === "1" || it.in_header === "true")
    );
    headerCategoryItems = filtered.length > 0 ? filtered : items;
  } else {
    headerCategoryItems = headerTopLevel.filter((it: any) => (((it.type ?? "") + "").toString().toLowerCase() === "categories"));
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
    <div className="flex min-h-svh w-full flex-col items-center justify-start gap-3 pt-0 pb-8">
      <NavbarWrapper
        logo={navbarLogo}
        phone={navbarPhone}
        locale={locale}
        languages={langResponse.data}
        menuItems={headerMenuItems}
        initialCatalogItems={headerCategoryItems}
      />

      <section className="w-full rounded-[20px] bg-white px-4 pt-3 pb-8 sm:px-8 sm:pt-4 sm:pb-10 lg:px-12">
        <nav className="mb-7 flex items-center gap-2 text-[13px] text-[#9aa3b2] lg:-ml-10">
          <Link href={`/${locale}`} className="hover:text-[#2050f5]">Ana səhifə</Link>
          <span>»</span>
          <span>Hesab</span>
          <span>»</span>
          <span className="text-[#6c7484]">Giriş</span>
        </nav>

        <div className="mx-auto w-full max-w-[640px]">
          <h1 className="mb-10 text-center text-[52px] leading-none font-bold tracking-[-0.02em] text-[#000000] sm:text-[56px]">Giriş</h1>

          <form className="space-y-4" autoComplete="off">
            <label className="relative block h-[64px] w-full rounded-[20px] border border-[#d8dde6]">
              <Mail className="absolute top-1/2 left-5 size-6 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
              <input
                type="email"
                placeholder="E-mail ünvanı"
                autoComplete="off"
                className="h-full w-full rounded-[20px] bg-transparent pl-[55px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
              />
            </label>

            <label className="relative block h-[64px] w-full rounded-[20px] border border-[#d8dde6]">
              <Lock className="absolute top-1/2 left-5 size-6 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
              <input
                type="password"
                placeholder="Şifrə"
                autoComplete="new-password"
                className="h-full w-full rounded-[20px] bg-transparent pl-[55px] pr-14 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
              />
              <Eye className="absolute top-1/2 right-5 size-5 -translate-y-1/2 text-[#8ea1bf]" strokeWidth={2.1} />
            </label>

            <div className="-mt-2 text-center">
              <Link href="#" className="inline-block text-[13px] font-[500] text-[#1f2430] no-underline hover:no-underline">
                Şifrənizi unutmusunuz?
              </Link>
            </div>

            <div className="mt-0 text-center">
              <button
                type="submit"
                className="inline-flex h-[62px] min-w-[136px] items-center justify-center rounded-[18px] bg-[#ffd500] px-7 text-[15px] leading-none font-[780] text-[#000000]"
              >
                <span className="-translate-y-[1px]">Giriş</span>
              </button>
            </div>

            <div className="pt-4 text-center text-[15px] font-[450] text-[#111111]">
              Hesab yaradaraq saytın bütün imkanlarından istifadə edə bilərsiniz.
            </div>

            <div className="text-center text-[15px]">
              <Link href={`/${locale}/qeydiyyat`} className="font-semibold text-[#2258f6] no-underline hover:no-underline">Hesab qeydiyyatı</Link>
            </div>
          </form>
        </div>
      </section>

      <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
    </div>
  );
}
