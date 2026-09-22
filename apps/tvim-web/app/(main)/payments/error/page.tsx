import { redirect } from "next/navigation";
import { resolveRootLocale } from "@/lib/root-locale";
import { paymentResultPath } from "@/lib/payments/result";

// The unprefixed address the admin's payment section hands to the gateway.
// A gateway stores one return url, so the language cannot live in it — the
// visitor's own locale is resolved here and they are forwarded to it.
export const dynamic = "force-dynamic";

export default async function PaymentErrorEntryPage() {
    const { locale } = await resolveRootLocale();
    redirect(paymentResultPath("error", locale));
}
