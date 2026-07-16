import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateStartupIdea, listIdeas, deleteIdea } from "@/lib/founder.functions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sparkles, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/idea")({
  head: () => ({ meta: [{ title: "Generate Startup Idea — FounderAI" }] }),
  component: IdeaPage,
});

function IdeaPage() {
  const qc = useQueryClient();
  const genFn = useServerFn(generateStartupIdea);
  const listFn = useServerFn(listIdeas);
  const delFn = useServerFn(deleteIdea);

  const { data: ideas } = useQuery({ queryKey: ["ideas"], queryFn: () => listFn() });

  const [form, setForm] = useState({
    skills: "",
    interests: "",
    budgetUsd: "$5,000",
    budgetInr: "₹4,00,000",
    industry: "SaaS",
  });


  const gen = useMutation({
    mutationFn: () =>
      genFn({
        data: {
          skills: form.skills,
          interests: form.interests,
          industry: form.industry,
          budget: `${form.budgetUsd} / ${form.budgetInr}`,
        },
      }),

    onSuccess: () => {
      toast.success("New startup idea generated!");
      qc.invalidateQueries({ queryKey: ["ideas"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["ideas"] });
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Idea Generator"
        title="Generate your next startup"
        description="Describe yourself and your constraints. We'll generate a complete startup concept."
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 glass-strong p-6 h-fit">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              gen.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="skills">Your skills</Label>
              <Textarea
                id="skills"
                rows={2}
                required
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="e.g., React, marketing, healthcare ops"
              />
            </div>
            <div>
              <Label htmlFor="interests">Your interests</Label>
              <Textarea
                id="interests"
                rows={2}
                required
                value={form.interests}
                onChange={(e) => setForm({ ...form, interests: e.target.value })}
                placeholder="e.g., climate, fitness, education"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="budgetUsd">Budget (USD)</Label>
                <Input
                  id="budgetUsd"
                  required
                  value={form.budgetUsd}
                  onChange={(e) => setForm({ ...form, budgetUsd: e.target.value })}
                  placeholder="$5,000"
                />
              </div>
              <div>
                <Label htmlFor="budgetInr">Budget (INR)</Label>
                <Input
                  id="budgetInr"
                  required
                  value={form.budgetInr}
                  onChange={(e) => setForm({ ...form, budgetInr: e.target.value })}
                  placeholder="₹4,00,000"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                required
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              disabled={gen.isPending}
              className="w-full bg-gradient-primary text-primary-foreground shadow-glow"
            >
              {gen.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
              Generate idea
            </Button>
          </form>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {(ideas ?? []).length === 0 && !gen.isPending && (
            <div className="glass p-10 text-center">
              <Sparkles className="h-8 w-8 mx-auto text-primary mb-3" />
              <h3 className="font-semibold">No ideas yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Fill the form on the left to generate your first startup concept.
              </p>
            </div>
          )}
          {gen.isPending && (
            <div className="glass p-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground mt-3">Brewing your next big idea…</p>
            </div>
          )}
          {(ideas ?? []).map((i: any) => (
            <article key={i.id} className="glass p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-primary/80">{i.industry}</div>
                  <h3 className="text-2xl font-bold mt-1">{i.name}</h3>
                  {i.payload?.tagline && (
                    <p className="italic text-muted-foreground mt-1">"{i.payload.tagline}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-primary text-primary-foreground">
                    {i.score}/100
                  </div>
                  <button
                    onClick={() => del.mutate(i.id)}
                    className="p-2 rounded-md hover:bg-white/5 text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-5 text-sm">
                <Section title="Problem">{i.problem}</Section>
                <Section title="Solution">{i.solution}</Section>
                <Section title="Target audience">{i.target_audience}</Section>
                <Section title="Revenue model">{i.revenue_model}</Section>
                <Section title="Growth strategy" wide>
                  {i.growth_strategy}
                </Section>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold">{title}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
