import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateBusinessModel, listReports } from "@/lib/founder.functions";
import { PageHeader } from "@/components/page-header";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { IdeaPicker } from "@/components/idea-picker";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutGrid, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/business-model")({
  head: () => ({ meta: [{ title: "Business Model — FounderAI" }] }),
  component: BusinessModelPage,
});

const blocks: { key: string; title: string; tone: string }[] = [
  { key: "key_partners", title: "Key Partners", tone: "from-violet-500/20 to-fuchsia-500/10" },
  { key: "key_activities", title: "Key Activities", tone: "from-cyan-500/20 to-sky-500/10" },
  { key: "key_resources", title: "Key Resources", tone: "from-emerald-500/20 to-teal-500/10" },
  { key: "value_propositions", title: "Value Propositions", tone: "from-fuchsia-500/30 to-violet-500/20" },
  { key: "customer_relationships", title: "Customer Relationships", tone: "from-amber-500/20 to-orange-500/10" },
  { key: "channels", title: "Channels", tone: "from-pink-500/20 to-rose-500/10" },
  { key: "customer_segments", title: "Customer Segments", tone: "from-indigo-500/20 to-blue-500/10" },
  { key: "cost_structure", title: "Cost Structure", tone: "from-red-500/20 to-rose-500/10" },
  { key: "revenue_streams", title: "Revenue Streams", tone: "from-lime-500/20 to-emerald-500/10" },
];

function BusinessModelPage() {
  const qc = useQueryClient();
  const genFn = useServerFn(generateBusinessModel);
  const listFn = useServerFn(listReports);
  const { data: reports } = useQuery({
    queryKey: ["reports", "business_model"],
    queryFn: () => listFn({ data: { kind: "business_model" } }),
  });
  const [ideaId, setIdeaId] = useState<string | undefined>();

  const gen = useMutation({
    mutationFn: () => genFn({ data: { idea_id: ideaId! } }),
    onSuccess: () => {
      toast.success("Business Model Canvas generated");
      qc.invalidateQueries({ queryKey: ["reports", "business_model"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const latest = reports?.[0];

  return (
    <div>
      <PageHeader
        eyebrow="Business Model"
        title="Business Model Canvas"
        description="Auto-generate the 9 building blocks of your startup."
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
          Generate canvas
        </Button>
      </div>

      {!latest && !gen.isPending && (
        <div className="glass p-12 text-center">
          <LayoutGrid className="h-8 w-8 mx-auto text-primary mb-3" />
          <h3 className="font-semibold">No canvas yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Pick an idea above and generate your first canvas.</p>
        </div>
      )}

      {gen.isPending && (
        <div className="glass p-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Designing your canvas…</p>
        </div>
      )}

      {latest && (
        <div>
          <h2 className="font-semibold text-lg mb-3">{latest.title}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            {blocks.map((b, idx) => {
              const items: string[] = (latest.payload as any)?.[b.key] ?? [];
              // layout: first row 3 cells (3, 2, 2 visually) — use simple span
              const span =
                b.key === "value_propositions"
                  ? "lg:col-span-1 lg:row-span-2"
                  : b.key === "customer_segments"
                    ? "lg:col-span-1 lg:row-span-2"
                    : b.key === "cost_structure" || b.key === "revenue_streams"
                      ? "lg:col-span-2"
                      : "lg:col-span-1";
              return (
                <div
                  key={b.key}
                  className={`glass p-4 bg-gradient-to-br ${b.tone} ${span} min-h-[160px]`}
                  style={{ order: idx }}
                >
                  <div className="text-[10px] uppercase tracking-wider text-foreground/70 font-semibold mb-2">
                    {b.title}
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {items.map((it, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
