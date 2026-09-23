import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { paymentResultPath, readPaymentReturn } from "@/lib/payments/result";
import { toSearchParams, type RouteSearchParams } from "@/lib/search-params";

// A gateway stores one return url and the admin's is still this page, so a
// payment can arrive here instead of at /payments/callback. When it does, the
// verdict rides in the query string and the shopper is moved on to the screen
// that matches it; a submitted form arrives with a bare path and stays.
export const dynamic = "force-dynamic";

export default async function ThankYouRedirectPage({
    searchParams,
}: {
    searchParams: Promise<RouteSearchParams>;
}) {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("preferred-locale")?.value?.trim().toLowerCase() ?? "";
    const normalizedPreferredLocale = (["az", "ru", "en"].includes(cookieLocale)
        ? cookieLocale
        : "az") as "az" | "ru" | "en";

    const outcome = readPaymentReturn(toSearchParams(await searchParams));
    if (outcome) {
        redirect(paymentResultPath(outcome, normalizedPreferredLocale));
    }

    redirect(`/${normalizedPreferredLocale}/thank-you`);
}
