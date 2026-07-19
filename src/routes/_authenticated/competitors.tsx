import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateCompetitorAnalysis, listReports } from "@/lib/founder.functions";
import { PageHeader } from "@/components/page-header";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { IdeaPicker } from "@/components/idea-picker";
import { Button } from "@/components/ui/button";
import { Loader2, Target, Sparkles, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/competitors")({
  head: () => ({ meta: [{ title: "Competitors — FounderAI" }] }),
  component: CompetitorsPage,
});

function CompetitorsPage() {
  const qc = useQueryClient();
  const genFn = useServerFn(generateCompetitorAnalysis);
  const listFn = useServerFn(listReports);
  const { data: reports } = useQuery({
    queryKey: ["reports", "competitor_analysis"],
    queryFn: () => listFn({ data: { kind: "competitor_analysis" } }),
  });
  const [ideaId, setIdeaId] = useState<string | undefined>();

  const gen = useMutation({
    mutationFn: () => genFn({ data: { idea_id: ideaId! } }),
    onSuccess: () => {
      toast.success("Competitor analysis ready");
      qc.invalidateQueries({ queryKey: ["reports", "competitor_analysis"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const latest = reports?.[0];
  const payload = latest?.payload as any;

  return (
    <div>
      <PageHeader
        eyebrow="Competitor Analysis"
        title="Know your market"
        description="Identify rivals, surface strengths and weaknesses, and find your opportunity."
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
          Run analysis
        </Button>
      </div>

      {!latest && !gen.isPending && (
        <div className="glass p-12 text-center">
          <Target className="h-8 w-8 mx-auto text-primary mb-3" />
          <h3 className="font-semibold">No analysis yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Pick an idea above to scan the competitive landscape.</p>
        </div>
      )}
      {gen.isPending && (
        <div className="glass p-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Scouting the market…</p>
        </div>
      )}

      {payload && (
        <div className="space-y-6">
          <h2 className="font-semibold text-lg">{latest!.title}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {(payload.competitors ?? []).map((c: any, i: number) => (
              <div key={i} className="glass p-5">
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1.5">
                      Strengths
                    </div>
                    <ul className="space-y-1">
                      {(c.strengths ?? []).map((s: string, j: number) => (
                        <li key={j} className="flex gap-1.5">
                          <Check className="h-3.5 w-3.5 mt-0.5 text-emerald-400 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold mb-1.5">
                      Weaknesses
                    </div>
                    <ul className="space-y-1">
                      {(c.weaknesses ?? []).map((s: string, j: number) => (
                        <li key={j} className="flex gap-1.5">
                          <X className="h-3.5 w-3.5 mt-0.5 text-rose-400 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass p-5">
              <div className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold mb-2">
                Market gaps
              </div>
              <ul className="space-y-1.5 text-sm">
                {(payload.market_gaps ?? []).map((g: string, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">→</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass p-5">
              <div className="text-[10px] uppercase tracking-wider text-accent/90 font-semibold mb-2">
                Opportunities
              </div>
              <ul className="space-y-1.5 text-sm">
                {(payload.opportunities ?? []).map((g: string, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent">★</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {payload.recommendation && (
            <div className="glass-strong p-6 ring-glow">
              <div className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold mb-2">
                FounderAI recommendation
              </div>
              <p className="text-sm leading-relaxed">{payload.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
