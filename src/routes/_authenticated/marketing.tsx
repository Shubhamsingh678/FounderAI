import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateMarketingPlan, listReports } from "@/lib/founder.functions";
import { PageHeader } from "@/components/page-header";
import { IdeaPicker } from "@/components/idea-picker";
import { Button } from "@/components/ui/button";
import { Loader2, Megaphone, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/marketing")({
  head: () => ({ meta: [{ title: "Marketing Plan — FounderAI" }] }),
  component: MarketingPage,
});

function MarketingPage() {
  const qc = useQueryClient();
  const genFn = useServerFn(generateMarketingPlan);
  const listFn = useServerFn(listReports);
  const { data: reports } = useQuery({
    queryKey: ["reports", "marketing_plan"],
    queryFn: () => listFn({ data: { kind: "marketing_plan" } }),
  });
  const [ideaId, setIdeaId] = useState<string | undefined>();

  const gen = useMutation({
    mutationFn: () => genFn({ data: { idea_id: ideaId! } }),
    onSuccess: () => {
      toast.success("Marketing plan generated");
      qc.invalidateQueries({ queryKey: ["reports", "marketing_plan"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const latest = reports?.[0];
  const p = latest?.payload as any;

  return (
    <div>
      <PageHeader
        eyebrow="Marketing"
        title="Growth plan"
        description="A full social, SEO, content, and email playbook tailored to your startup."
      />

      <div className="glass-strong p-5 flex flex-col sm:flex-row gap-3 items-end mb-6">
        <div className="flex-1 w-full">
          <label className="text-xs text-muted-foreground">Startup idea</label>
          <IdeaPicker value={ideaId} onChange={setIdeaId} />
        </div>
        <Button
          onClick={() => gen.mutate()}
          disabled={!ideaId || gen.isPending}
          className="bg-gradient-primary text-primary-foreground shadow-glow"
        >
          {gen.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
          Generate plan
        </Button>
      </div>

      {!latest && !gen.isPending && (
        <div className="glass p-12 text-center">
          <Megaphone className="h-8 w-8 mx-auto text-primary mb-3" />
          <h3 className="font-semibold">No marketing plan yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Pick an idea above to draft a complete growth plan.</p>
        </div>
      )}
      {gen.isPending && (
        <div className="glass p-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Drafting your growth playbook…</p>
        </div>
      )}

      {p && (
        <div className="space-y-6">
          <h2 className="font-semibold text-lg">{latest!.title}</h2>

          <Section title="Social media strategy">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(p.social_media ?? []).map((s: any, i: number) => (
                <div key={i} className="glass p-4">
                  <div className="font-semibold">{s.platform}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.cadence}</div>
                  <p className="text-sm mt-2">{s.strategy}</p>
                </div>
              ))}
            </div>
          </Section>

          <div className="grid lg:grid-cols-2 gap-6">
            <Section title="SEO">
              <div className="glass p-5 space-y-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold mb-1.5">
                    Target keywords
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(p.seo?.keywords ?? []).map((k: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold mb-1.5">
                    Content pillars
                  </div>
                  <ul className="space-y-1">
                    {(p.seo?.content_pillars ?? []).map((c: string, i: number) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold mb-1.5">
                    Backlink plan
                  </div>
                  <p>{p.seo?.backlink_plan}</p>
                </div>
              </div>
            </Section>

            <Section title="Budget allocation">
              <div className="glass p-5 space-y-2 text-sm">
                {(p.budget_allocation ?? []).map((b: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span>{b.channel}</span>
                      <span className="text-muted-foreground">{b.percent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary"
                        style={{ width: `${Math.min(100, Math.max(0, b.percent))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <Section title="Content calendar (4 weeks)">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(p.content_calendar ?? []).map((w: any, i: number) => (
                <div key={i} className="glass p-4">
                  <div className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold">
                    Week {w.week}
                  </div>
                  <div className="font-semibold mt-1">{w.theme}</div>
                  <ul className="space-y-1 mt-2 text-sm">
                    {(w.pieces ?? []).map((piece: string, j: number) => (
                      <li key={j}>• {piece}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Email sequences">
            <div className="grid lg:grid-cols-2 gap-3">
              {(p.email_marketing ?? []).map((e: any, i: number) => (
                <div key={i} className="glass p-5">
                  <div className="font-semibold">{e.sequence_name}</div>
                  <div className="text-xs text-muted-foreground">{e.goal}</div>
                  <ol className="mt-3 space-y-1 text-sm list-decimal list-inside">
                    {(e.emails ?? []).map((em: string, j: number) => (
                      <li key={j}>{em}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm uppercase tracking-wider text-primary/80 font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
