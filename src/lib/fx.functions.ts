import { createServerFn } from "@tanstack/react-start";

// Public, keyless USD->INR rate. Cached briefly by the runtime.
export const getUsdInrRate = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`rate http ${res.status}`);
    const json = (await res.json()) as { rates?: Record<string, number>; time_last_update_unix?: number };
    const rate = json.rates?.INR;
    if (!rate || typeof rate !== "number") throw new Error("no INR rate");
    return { rate, fetchedAt: Date.now(), source: "open.er-api.com" as const };
  } catch {
    // Fallback so the UI still works if the upstream is unreachable.
    return { rate: 83.5, fetchedAt: Date.now(), source: "fallback" as const };
  }
});
