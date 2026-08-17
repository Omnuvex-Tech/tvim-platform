import { NextRequest, NextResponse } from "next/server";
import { getPublicMenuDetail } from "@/lib/public-data";
import { normalizeLocale } from "@/lib/site-locales";

const TERMS_MENU_LINK = "İstifade-sertleri";

type TermsMenuDetail = {
    menu: {
        name: string;
        title: string | null;
    };
    data: {
        description?: string;
    };
};

export async function GET(request: NextRequest) {
    const locale = normalizeLocale(request.nextUrl.searchParams.get("locale") ?? "");

    try {
        const detail = await getPublicMenuDetail<TermsMenuDetail>(TERMS_MENU_LINK, locale);
        const html = String(detail?.data.description ?? "").trim();

        if (!html) {
            return NextResponse.json({ success: false, message: "Terms not found.", data: null }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                title: String(detail?.menu.title || detail?.menu.name || "").trim(),
                html,
            },
        });
    } catch {
        return NextResponse.json({ success: false, message: "Terms could not be loaded.", data: null }, { status: 502 });
    }
}
