import { redirect } from "next/navigation";
import { PAYMENT_RESULT_ENTRY } from "@/lib/payments/result";

// The address this screen used to answer at; see the success entry beside it.
// Nothing is carried across: the entry behind this one shows the failure
// whatever the query string says.
export const dynamic = "force-dynamic";

export default function LegacyPaymentErrorEntryPage() {
    redirect(PAYMENT_RESULT_ENTRY.error);
}
