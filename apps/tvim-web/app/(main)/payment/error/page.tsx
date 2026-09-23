import { redirect } from "next/navigation";
import { resolveRootLocale } from "@/lib/root-locale";
import { paymentResultPath } from "@/lib/payments/result";

// The unprefixed address the admin's payment section hands to the gateway as
// its failure url. A gateway stores one url per outcome, so the language
// cannot live in it — the visitor's own locale is resolved here and they are
// forwarded to the message written in it.
//
// The query string is not consulted: it is whatever the shopper's browser was
// handed, and nothing in it may turn a failure into a confirmation.
export const dynamic = "force-dynamic";

export default async function PaymentErrorEntryPage() {
    const { locale } = await resolveRootLocale();
    redirect(paymentResultPath("error", locale));
}
