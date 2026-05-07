"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useNotify } from "@repo/ui";

export function LogoutToast() {
    const notify = useNotify();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const handledMessageRef = useRef<string | null>(null);

    useEffect(() => {
        const logoutMessage = searchParams.get("logout_message")?.trim();
        if (!logoutMessage) {
            return;
        }

        if (handledMessageRef.current === logoutMessage) {
            return;
        }

        handledMessageRef.current = logoutMessage;

        notify.success(logoutMessage);

        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete("logout_message");

        const nextQuery = nextParams.toString();
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }, [notify, pathname, router, searchParams]);

    return null;
}
