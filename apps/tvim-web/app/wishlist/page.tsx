import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function WishlistRedirectPage() {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("preferred-locale")?.value?.trim().toLowerCase() ?? "";
    const normalizedPreferredLocale = (["az", "ru", "en"].includes(cookieLocale)
        ? cookieLocale
        : "az") as "az" | "ru" | "en";

    redirect(`/${normalizedPreferredLocale}/wishlist`);
}