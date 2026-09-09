import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

/**
 * Admin tərəfi (Laravel) məhsul dəyişəndə buranı çağırır və Next Data Cache-də
 * uyğun tag-ları etibarsız edir. Bunsuz `next: { revalidate: 60 }` TTL-i
 * gözləmək lazım gəlir; bununla dəyişiklik saniyələr içində saytda görünür.
 *
 * Laravel bu ünvana Cloudflare-i keçmədən, birbaşa 127.0.0.1:3000-ə müraciət edir.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_TAGS = 50;

const secretMatches = (received: string) => {
    const expected = process.env.REVALIDATE_SECRET ?? "";

    // Açar konfiqurasiya olunmayıbsa, endpoint bağlı sayılır — boş açarla
    // hər kəsin keşi silə bilməsindənsə, xidmətin işləməməsi yaxşıdır.
    if (expected.length === 0) return false;

    const a = Buffer.from(received);
    const b = Buffer.from(expected);

    // timingSafeEqual eyni uzunluq tələb edir; uzunluq fərqi özü də uyğunsuzluqdur.
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
};

export async function POST(request: Request) {
    const provided = request.headers.get("x-revalidate-secret") ?? "";

    if (!secretMatches(provided)) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let payload: unknown = null;

    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
    }

    const rawTags = (payload as { tags?: unknown })?.tags;

    if (!Array.isArray(rawTags)) {
        return NextResponse.json({ success: false, message: "`tags` massiv olmalıdır" }, { status: 400 });
    }

    const tags = Array.from(
        new Set(
            rawTags
                .map((tag) => String(tag ?? "").trim())
                .filter((tag) => tag.length > 0 && tag.length <= 256)
        )
    ).slice(0, MAX_TAGS);

    if (tags.length === 0) {
        return NextResponse.json({ success: false, message: "Tag verilmədi" }, { status: 400 });
    }

    // Next 16-da `revalidateTag` ikinci arqument tələb edir. Hazır profillər
    // (`max` = 1 illik expire) burada yaramır — bizə dərhal təmizləmə lazımdır,
    // ona görə `{ expire: 0 }` verilir: Next bunu xüsusi hal kimi tanıyır və
    // köhnə cavabı stale-while-revalidate ilə də paylamır.
    for (const tag of tags) {
        revalidateTag(tag, { expire: 0 });
    }

    return NextResponse.json({ success: true, revalidated: tags });
}
