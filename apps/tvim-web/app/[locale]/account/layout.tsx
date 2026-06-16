import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata();

export default function AccountLayout({
    children,
}: {
    children: ReactNode;
}) {
    return children;
}
