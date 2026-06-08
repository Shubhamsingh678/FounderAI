import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAIJson, callAI } from "./ai.server";

// ===== Startup Idea =====
const IdeaInput = z.object({
  skills: z.string().min(1).max(2000),
  interests: z.string().min(1).max(2000),
  budget: z.string().min(1).max(200),
  industry: z.string().min(1).max(200),
});
type IdeaJson = {
  name: string;
  problem: string;
  solution: string;
  target_audience: string;
  revenue_model: string;
  growth_strategy: string;
  score: number;
  tagline: string;
};

export const generateStartupIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IdeaInput.parse(d))
  .handler(async ({ data, context }) => {
    const result = await callAIJson<IdeaJson>({
      system:
        "You are a world-class startup co-founder and venture analyst. Generate one compelling, realistic startup idea.",
      prompt: `Generate a startup idea as JSON with keys: name, tagline, problem, solution, target_audience, revenue_model, growth_strategy, score (0-100 viability).
Inputs:
- Skills: ${data.skills}
- Interests: ${data.interests}
- Budget: ${data.budget}
- Industry: ${data.industry}
Be specific, ambitious, and grounded. Keep each field 1-3 sentences.`,
    });
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("startup_ideas")
      .insert({
        user_id: userId,
        name: result.name,
        industry: data.industry,
        skills: data.skills,
        interests: data.interests,
        budget: data.budget,
        problem: result.problem,
        solution: result.solution,
        target_audience: result.target_audience,
        revenue_model: result.revenue_model,
        growth_strategy: result.growth_strategy,
        score: Math.min(100, Math.max(0, Math.round(result.score ?? 70))),
        payload: result as never,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listIdeas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("startup_ideas")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("startup_ideas")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("startup_ideas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Business Model Canvas =====
type BMCJson = {
  key_partners: string[];
  key_activities: string[];
  key_resources: string[];
  value_propositions: string[];
  customer_relationships: string[];
  channels: string[];
  customer_segments: string[];
  cost_structure: string[];
  revenue_streams: string[];
};

const IdeaRefInput = z.object({ idea_id: z.string().uuid() });

async function fetchIdea(supabase: any, id: string) {
  const { data, error } = await supabase.from("startup_ideas").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Idea not found");
  return data;
}

export const generateBusinessModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IdeaRefInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const idea = await fetchIdea(supabase, data.idea_id);
    const bmc = await callAIJson<BMCJson>({
      system: "You are an expert in the Business Model Canvas by Osterwalder.",
      prompt: `Generate a Business Model Canvas as JSON with keys: key_partners, key_activities, key_resources, value_propositions, customer_relationships, channels, customer_segments, cost_structure, revenue_streams. Each is an array of 3-6 concise bullet strings.
Startup: ${idea.name}
Problem: ${idea.problem}
Solution: ${idea.solution}
Target: ${idea.target_audience}
Revenue: ${idea.revenue_model}`,
    });
    const { data: row, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        startup_idea_id: idea.id,
        kind: "business_model",
        title: `Business Model — ${idea.name}`,
        payload: bmc as never,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ===== Competitor Analysis =====
type CompetitorJson = {
  competitors: { name: string; description: string; strengths: string[]; weaknesses: string[] }[];
  market_gaps: string[];
  opportunities: string[];
  recommendation: string;
};
export const generateCompetitorAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IdeaRefInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const idea = await fetchIdea(supabase, data.idea_id);
    const result = await callAIJson<CompetitorJson>({
      system: "You are a senior market analyst.",
      prompt: `Produce a competitor analysis as JSON: { competitors: [ { name, description, strengths: string[], weaknesses: string[] } x4-6 ], market_gaps: string[3-5], opportunities: string[3-5], recommendation: string }.
Startup: ${idea.name}
Industry: ${idea.industry}
Problem: ${idea.problem}
Solution: ${idea.solution}`,
    });
    const { data: row, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        startup_idea_id: idea.id,
        kind: "competitor_analysis",
        title: `Competitors — ${idea.name}`,
        payload: result as never,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ===== Marketing Plan =====
type MarketingJson = {
  social_media: { platform: string; strategy: string; cadence: string }[];
  seo: { keywords: string[]; content_pillars: string[]; backlink_plan: string };
  content_calendar: { week: number; theme: string; pieces: string[] }[];
  email_marketing: { sequence_name: string; goal: string; emails: string[] }[];
  budget_allocation: { channel: string; percent: number }[];
};
export const generateMarketingPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IdeaRefInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const idea = await fetchIdea(supabase, data.idea_id);
    const result = await callAIJson<MarketingJson>({
      system: "You are a growth marketing strategist for early-stage startups.",
      prompt: `Produce a marketing plan as JSON: { social_media: [{platform, strategy, cadence}] (4 platforms), seo: { keywords: string[8-12], content_pillars: string[4-6], backlink_plan: string }, content_calendar: [{week:1..4, theme, pieces: string[3-5]}], email_marketing: [{sequence_name, goal, emails: string[3-5]}] (2-3 sequences), budget_allocation: [{channel, percent}] summing to 100 }.
Startup: ${idea.name}
Target: ${idea.target_audience}
Solution: ${idea.solution}
Budget hint: ${idea.budget}`,
    });
    const { data: row, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        startup_idea_id: idea.id,
        kind: "marketing_plan",
        title: `Marketing Plan — ${idea.name}`,
        payload: result as never,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ===== Pitch Deck =====
type PitchSlide = { title: string; bullets: string[]; speaker_notes?: string };
type PitchJson = { slides: PitchSlide[] };

export const generatePitchDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IdeaRefInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const idea = await fetchIdea(supabase, data.idea_id);
    const result = await callAIJson<PitchJson>({
      system: "You are a YC partner who has helped craft 1000+ pitch decks.",
      prompt: `Generate a 10-slide investor pitch deck as JSON: { slides: [{ title, bullets: string[3-5], speaker_notes: string }] }. Use this slide order: Title, Problem, Solution, Market Opportunity, Product, Business Model, Traction, Competition, Team, Ask.
Startup: ${idea.name}
Tagline: ${(idea.payload as any)?.tagline ?? ""}
Problem: ${idea.problem}
Solution: ${idea.solution}
Target: ${idea.target_audience}
Revenue model: ${idea.revenue_model}
Growth: ${idea.growth_strategy}`,
    });
    const { data: row, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        startup_idea_id: idea.id,
        kind: "pitch_deck",
        title: `Pitch Deck — ${idea.name}`,
        payload: result as never,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ===== Reports listing =====
export const listReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ kind: z.enum(["business_model", "competitor_analysis", "marketing_plan", "pitch_deck"]).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase.from("reports").select("*").order("created_at", { ascending: false });
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.from("reports").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

// ===== Chat =====
const ChatInput = z.object({ message: z.string().min(1).max(4000) });
export const chatWithCofounder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ChatInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Save user message
    await supabase.from("chat_messages").insert({ user_id: userId, role: "user", content: data.message });
    // Load last 20 messages
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .order("created_at", { ascending: true })
      .limit(40);

    const messages = [
      {
        role: "system" as const,
        content:
          "You are FounderAI, an experienced startup co-founder. Give crisp, actionable advice on strategy, product, growth, fundraising, and hiring. Use short paragraphs and bullet points where helpful.",
      },
      ...((history ?? []) as { role: "user" | "assistant" | "system"; content: string }[]).map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];
    const reply = await callAI({ messages });
    await supabase.from("chat_messages").insert({ user_id: userId, role: "assistant", content: reply });
    return { reply };
  });

export const listChat = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const clearChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("chat_messages").delete().eq("user_id", userId);
    return { ok: true };
  });

// ===== Dashboard stats =====
export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [ideas, reports, msgs] = await Promise.all([
      supabase.from("startup_ideas").select("id, name, score, created_at").order("created_at", { ascending: false }),
      supabase.from("reports").select("id, kind, title, created_at").order("created_at", { ascending: false }).limit(8),
      supabase.from("chat_messages").select("id", { count: "exact", head: true }),
    ]);
    const ideaRows = ideas.data ?? [];
    const avg = ideaRows.length
      ? Math.round(ideaRows.reduce((s, i) => s + (i.score ?? 0), 0) / ideaRows.length)
      : 0;
    return {
      ideaCount: ideaRows.length,
      reportCount: reports.data?.length ?? 0,
      messageCount: msgs.count ?? 0,
      avgScore: avg,
      recentIdeas: ideaRows.slice(0, 5),
      recentReports: reports.data ?? [],
    };
  });

// ===== Profile =====
export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ full_name: z.string().max(120).optional(), bio: z.string().max(1000).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
