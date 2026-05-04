import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { Lock, Mail, Phone, UserRound } from "lucide-react";
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

export default async function RegisterPage({
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
      <Script src="https://www.google.com/recaptcha/api.js" strategy="afterInteractive" />

      <NavbarWrapper
        logo={navbarLogo}
        phone={navbarPhone}
        locale={locale}
        languages={langResponse.data}
        menuItems={headerMenuItems}
        initialCatalogItems={headerCategoryItems}
      />

      <section className="w-full rounded-[20px] bg-white px-4 pt-3 pb-8 sm:px-8 sm:pt-4 sm:pb-10 lg:px-12">
        <nav className="mb-7 flex items-center gap-2 text-[13px] text-[#9aa3b2] lg:-ml-12">
          <Link href={`/${locale}`} className="hover:text-[#2050f5]">Ana səhifə</Link>
          <span>»</span>
          <span>Hesab</span>
          <span>»</span>
          <span className="text-[#6c7484]">Hesab qeydiyyatı</span>
        </nav>

        <div className="mx-auto w-full max-w-[640px]">
          <h1 className="text-center text-[52px] leading-none font-bold tracking-[-0.02em] text-[#000000] sm:text-[56px]">Hesab qeydiyyatı</h1>
          <p className="mx-auto mt-4 max-w-[560px] text-center text-[15px] leading-[1.4] text-[#6f7786]">
            Əlaqə məlumatlarınız yalnız sifariş vermək və saytda daha rahat işləmək üçün istifadə olunacaq
          </p>

          <form className="mt-6 space-y-4" autoComplete="off">
            <label className="relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
              <UserRound className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
              <input
                type="text"
                placeholder="Ad"
                autoComplete="given-name"
                className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
              />
            </label>

            <label className="relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
              <UserRound className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
              <input
                type="text"
                placeholder="Soyad"
                autoComplete="family-name"
                className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
              />
            </label>

            <label className="relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
              <Phone className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
              <input
                type="tel"
                placeholder="+994 (_) __-__-__"
                autoComplete="tel"
                className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
              />
            </label>

            <label className="relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
              <Mail className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
              <input
                type="email"
                placeholder="E-poçtunuz"
                autoComplete="email"
                className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
              />
            </label>

            <label className="relative block h-[64px] w-full rounded-[18px] border border-[#d8dde6]">
              <Lock className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#2050f5]" strokeWidth={2.1} />
              <input
                type="password"
                placeholder="Şifrə yaradın"
                autoComplete="new-password"
                className="h-full w-full rounded-[18px] bg-transparent pl-[50px] pr-5 text-[15px] leading-none font-normal text-[#161922] outline-none placeholder:text-[#9aa3b2]"
              />
            </label>

            <div className="w-full pt-2">
              <div className="flex items-start gap-6 pl-2">
                <span className="pt-[2px] text-[19px] font-[450] leading-none text-[#171717]">Abunə ol</span>
                <div className="pt-[2px] space-y-4 text-[19px] font-[450] leading-none text-[#171717]">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="subscribe" defaultChecked className="size-4" />
                    <span>Bəli</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="subscribe" className="size-4" />
                    <span>Xeyr</span>
                  </label>
                </div>
              </div>

              <div className="captcha form-group required mt-10">
                <div className="col-sm-12">
                  <div
                    className="g-recaptcha"
                    data-sitekey="6LfBGlosAAAAAPihskFz31qEqDsmH9Xn_odO_VRl"
                    style={{ transformOrigin: "0", display: "flex", justifyContent: "center" }}
                  />
                </div>
              </div>

              <div className="mx-auto mt-4 w-fit">
                <label className="input flex items-center gap-3 text-[16px] leading-[1.3] text-[#171717]">
                  <input type="checkbox" name="agree" value="1" className="size-[18px]" />
                  <span>
                    Mən <a href="https://tvim.az/index.php?route=information/information/agree&information_id=20" className="agree"><strong className="font-extrabold">İstifadə şərtləri</strong></a>-ni oxudum və razıyam
                  </span>
                </label>
              </div>

              <div className="mt-6 text-center">
                <button
                  type="submit"
                  className="inline-flex h-[66px] w-[182px] items-center justify-center rounded-[22px] bg-[#ffd500] px-8 text-[15px] leading-none font-bold text-[#000000]"
                >
                  Davam et
                </button>
              </div>

              <p className="pt-16 text-center text-[13px] font-[495] text-[#1f2430]">
                Əgər artıq hesabınızı yaratmısınızsa, <Link href={`/${locale}/giris`} className="underline">giriş səhifəsinə</Link> keçin.
              </p>
            </div>
          </form>
        </div>
      </section>

      <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
    </div>
  );
}
