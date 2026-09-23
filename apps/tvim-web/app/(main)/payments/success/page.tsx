import { redirect } from "next/navigation";
import { PAYMENT_RESULT_ENTRY } from "@/lib/payments/result";
import { withQuery, type RouteSearchParams } from "@/lib/search-params";

// The address this screen used to answer at. A gateway keeps whatever url it
// was configured with until someone changes it in admin, so the old spelling
// stays reachable rather than meeting a paying shopper with a 404.
//
// The gateway's own parameters are carried across, since the entry behind this
// reads the verdict out of them. The redirect is deliberately temporary: a
// permanent one would be cached in the browser against a url that only ever
// carries one shopper's payment.
export const dynamic = "force-dynamic";

export default async function LegacyPaymentSuccessEntryPage({
    searchParams,
}: {
    searchParams: Promise<RouteSearchParams>;
}) {
    redirect(withQuery(PAYMENT_RESULT_ENTRY.success, await searchParams));
}
