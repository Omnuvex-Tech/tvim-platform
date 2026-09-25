"use client";

import { useParams } from "next/navigation";
import { ErrorPage, toErrorLocale } from "@/app/components/ErrorPage/error-page";

export default function LocaleError({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry?: () => void;
}) {
    const params = useParams<{ locale?: string }>();

    return <ErrorPage locale={toErrorLocale(params?.locale)} error={error} retry={unstable_retry} />;
}
