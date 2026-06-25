import { DevelopmentPerformancePanel } from "./development-performance-panel";
import { readDevRequestMetricsSnapshot } from "@/lib/dev-request-metrics";
import { isDevelopmentRuntime } from "@/lib/runtime-env";

export function DevelopmentPerformance() {
    if (!isDevelopmentRuntime) {
        return null;
    }

    const snapshot = readDevRequestMetricsSnapshot();

    return (
        <DevelopmentPerformancePanel
            apiCallCount={snapshot.apiCallCount}
            apiDurationMs={snapshot.apiDurationMs}
            apiEntries={snapshot.apiEntries}
        />
    );
}
