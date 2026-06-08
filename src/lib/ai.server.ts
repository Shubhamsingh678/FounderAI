// Server-only helper for calling Lovable AI Gateway.
type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function callAI(opts: {
  messages?: Msg[];
  system?: string;
  prompt?: string;
  json?: boolean;
  model?: string;
}): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const messages: Msg[] = opts.messages ? [...opts.messages] : [];
  if (!opts.messages) {
    if (opts.system) messages.push({ role: "system", content: opts.system });
    if (opts.prompt) messages.push({ role: "user", content: opts.prompt });
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-2.5-flash",
      messages,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (res.status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in your Lovable workspace billing.");
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

export async function callAIJson<T = unknown>(opts: {
  system?: string;
  prompt: string;
  model?: string;
}): Promise<T> {
  const text = await callAI({
    system: (opts.system ?? "") + "\n\nReply ONLY with valid JSON. No markdown, no prose.",
    prompt: opts.prompt,
    json: true,
    model: opts.model,
  });
  // Strip code fences if any
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to find first {...}
    const m = cleaned.match(/\{[\s\S]*\}$/);
    if (m) return JSON.parse(m[0]) as T;
    throw new Error("AI did not return valid JSON");
  }
}
