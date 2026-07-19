import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats } from "@/lib/founder.functions";
import { PageHeader } from "@/components/page-header";
import { Lightbulb, FileText, MessagesSquare, TrendingUp, ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadPdfButton } from "@/components/download-pdf-button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FounderAI" }] }),
  component: Dashboard,
});

const kindLabels: Record<string, string> = {
  business_model: "Business Model",
  competitor_analysis: "Competitors",
  marketing_plan: "Marketing Plan",
  pitch_deck: "Pitch Deck",
};

function Dashboard() {
  const fn = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  const stats = [
    { label: "Startup Ideas", value: data?.ideaCount ?? 0, icon: Lightbulb },
    { label: "Reports Generated", value: data?.reportCount ?? 0, icon: FileText },
    { label: "Co-Founder Messages", value: data?.messageCount ?? 0, icon: MessagesSquare },
    { label: "Average Score", value: data?.avgScore ? `${data.avgScore}/100` : "—", icon: TrendingUp },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title="Welcome back, founder."
        description="Your startup workspace at a glance."
        actions={
          <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Link to="/idea">
              <Sparkles className="h-4 w-4 mr-1.5" /> New idea
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold mt-2">{isLoading ? "…" : s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <div className="glass p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent ideas</h2>
            <Link to="/idea" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {data?.recentIdeas?.length ? (
            <ul className="divide-y divide-white/5">
              {data.recentIdeas.map((i: any) => (
                <li key={i.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(i.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <ScoreBadge score={i.score ?? 0} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No ideas yet"
              cta={{ label: "Generate your first idea", to: "/idea" }}
            />
          )}
        </div>

        <div className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent reports</h2>
          </div>
          {data?.recentReports?.length ? (
            <ul className="space-y-3">
              {data.recentReports.map((r: any) => (
                <li key={r.id} className="text-sm">
                  <div className="text-[10px] uppercase tracking-wider text-primary/80">
                    {kindLabels[r.kind] ?? r.kind}
                  </div>
                  <div className="font-medium truncate">{r.title}</div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing yet" hint="Generate a business model, competitors, or pitch deck." />
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { to: "/business-model", label: "Build canvas" },
          { to: "/competitors", label: "Analyze rivals" },
          { to: "/marketing", label: "Plan growth" },
          { to: "/pitch", label: "Build deck" },
        ].map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="glass p-5 hover:ring-glow transition-all flex items-center justify-between"
          >
            <span className="font-medium">{q.label}</span>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80 ? "from-emerald-400 to-cyan-400" : score >= 60 ? "from-fuchsia-400 to-violet-400" : "from-amber-400 to-orange-400";
  return (
    <div className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r ${tone} text-background`}>
      {score}
    </div>
  );
}

function EmptyState({
  title,
  hint,
  cta,
}: {
  title: string;
  hint?: string;
  cta?: { label: string; to: "/idea" | "/business-model" | "/competitors" | "/marketing" | "/pitch" };
}) {
  return (
    <div className="text-center py-8">
      <div className="text-sm font-medium">{title}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      {cta && (
        <Button asChild size="sm" className="mt-4 bg-gradient-primary text-primary-foreground">
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}
