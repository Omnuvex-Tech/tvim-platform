import { cache } from "react";
import { isDevelopmentRuntime } from "@/lib/runtime-env";

export type DevApiMetricEntry = {
    durationMs: number;
    method: string;
    status: number;
    url: string;
};

type DevRequestMetricsStore = {
    apiCallCount: number;
    apiDurationMs: number;
    apiEntries: DevApiMetricEntry[];
};

const getDevRequestMetricsStore = cache(
    (): DevRequestMetricsStore => ({
        apiCallCount: 0,
        apiDurationMs: 0,
        apiEntries: [],
    })
);

export function recordDevApiMetric(entry: DevApiMetricEntry) {
    if (!isDevelopmentRuntime) {
        return;
    }

    const store = getDevRequestMetricsStore();
    store.apiCallCount += 1;
    store.apiDurationMs += entry.durationMs;

    if (store.apiEntries.length < 12) {
        store.apiEntries.push({
            ...entry,
            durationMs: Math.round(entry.durationMs * 10) / 10,
        });
    }
}

export function readDevRequestMetricsSnapshot() {
    const store = getDevRequestMetricsStore();

    return {
        apiCallCount: store.apiCallCount,
        apiDurationMs: Math.round(store.apiDurationMs * 10) / 10,
        apiEntries: store.apiEntries,
    };
}
