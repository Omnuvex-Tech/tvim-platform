"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useNotify } from "@repo/ui";
import { hydrateCart } from "@/lib/cart/client";

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
        void (async () => {
            try {
                await hydrateCart(true);
            } catch {
            }
            window.dispatchEvent(new Event("tvim:favorites-updated"));
            window.dispatchEvent(new Event("tvim:compare-updated"));
            window.dispatchEvent(
                new CustomEvent("tvim:auth-updated", {
                    detail: {
                        isAuthenticated: false,
                        user: null,
                    },
                })
            );
        })();

        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete("logout_message");

        const nextQuery = nextParams.toString();
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }, [notify, pathname, router, searchParams]);

    return null;
}
