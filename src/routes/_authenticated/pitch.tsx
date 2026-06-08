import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generatePitchDeck, listReports } from "@/lib/founder.functions";
import { PageHeader } from "@/components/page-header";
import { IdeaPicker } from "@/components/idea-picker";
import { Button } from "@/components/ui/button";
import { Loader2, Presentation, Sparkles, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pitch")({
  head: () => ({ meta: [{ title: "Pitch Deck — FounderAI" }] }),
  component: PitchPage,
});

type Slide = { title: string; bullets: string[]; speaker_notes?: string };

function PitchPage() {
  const qc = useQueryClient();
  const genFn = useServerFn(generatePitchDeck);
  const listFn = useServerFn(listReports);
  const { data: reports } = useQuery({
    queryKey: ["reports", "pitch_deck"],
    queryFn: () => listFn({ data: { kind: "pitch_deck" } }),
  });
  const [ideaId, setIdeaId] = useState<string | undefined>();
  const [active, setActive] = useState(0);

  const gen = useMutation({
    mutationFn: () => genFn({ data: { idea_id: ideaId! } }),
    onSuccess: () => {
      toast.success("Pitch deck generated");
      setActive(0);
      qc.invalidateQueries({ queryKey: ["reports", "pitch_deck"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const latest = reports?.[0];
  const slides: Slide[] = (latest?.payload as any)?.slides ?? [];
  const current = slides[active];

  async function exportPptx() {
    if (!latest || slides.length === 0) return;
    const { default: PptxGenJS } = await import("pptxgenjs");
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.title = latest.title;

    slides.forEach((s, i) => {
      const slide = pptx.addSlide();
      slide.background = { color: "0E0B1F" };
      // accent strip
      slide.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.4, fill: { color: "8B5CF6" } });
      slide.addText(s.title, {
        x: 0.6,
        y: 0.7,
        w: 12,
        h: 1.0,
        fontSize: 36,
        bold: true,
        color: "FFFFFF",
        fontFace: "Calibri",
      });
      slide.addText(
        (s.bullets ?? []).map((b) => ({ text: b, options: { bullet: { code: "25CF" } } })),
        {
          x: 0.7,
          y: 1.9,
          w: 12,
          h: 5,
          fontSize: 20,
          color: "E6E4F0",
          paraSpaceAfter: 10,
          fontFace: "Calibri",
        },
      );
      slide.addText(`${i + 1} / ${slides.length}`, {
        x: 12,
        y: 7,
        w: 1,
        h: 0.3,
        fontSize: 10,
        color: "8B7FB8",
        align: "right",
      });
      if (s.speaker_notes) slide.addNotes(s.speaker_notes);
    });

    await pptx.writeFile({ fileName: `${latest.title.replace(/[^a-z0-9]+/gi, "_")}.pptx` });
    toast.success("PPTX downloaded");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Pitch Deck"
        title="Investor-ready in minutes"
        description="A 10-slide pitch deck — review in-app or export to PowerPoint."
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
          Generate deck
        </Button>
        {slides.length > 0 && (
          <Button variant="outline" className="bg-white/5 border-white/10" onClick={exportPptx}>
            <Download className="h-4 w-4 mr-1.5" /> Export .pptx
          </Button>
        )}
      </div>

      {!latest && !gen.isPending && (
        <div className="glass p-12 text-center">
          <Presentation className="h-8 w-8 mx-auto text-primary mb-3" />
          <h3 className="font-semibold">No deck yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Pick an idea above to draft your investor deck.</p>
        </div>
      )}
      {gen.isPending && (
        <div className="glass p-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Crafting your deck slide by slide…</p>
        </div>
      )}

      {current && (
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          <div>
            <div className="glass-strong aspect-video p-8 sm:p-12 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-primary" />
              <div className="text-xs uppercase tracking-widest text-primary/80 font-semibold">
                Slide {active + 1} of {slides.length}
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold mt-3">{current.title}</h2>
              <ul className="mt-6 space-y-3 text-base sm:text-lg">
                {current.bullets.map((b, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-primary mt-1.5">●</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="absolute bottom-4 right-6 text-xs text-muted-foreground">
                {latest!.title.replace("Pitch Deck — ", "")}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                className="bg-white/5 border-white/10"
                onClick={() => setActive(Math.max(0, active - 1))}
                disabled={active === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === active ? "w-6 bg-gradient-primary" : "w-1.5 bg-white/15"
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                className="bg-white/5 border-white/10"
                onClick={() => setActive(Math.min(slides.length - 1, active + 1))}
                disabled={active === slides.length - 1}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            {current.speaker_notes && (
              <div className="glass p-4 mt-4 text-sm">
                <div className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold mb-1">
                  Speaker notes
                </div>
                {current.speaker_notes}
              </div>
            )}
          </div>
          <aside className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Slides</div>
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  i === active
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-[10px] opacity-70">{String(i + 1).padStart(2, "0")}</div>
                <div className="font-medium truncate">{s.title}</div>
              </button>
            ))}
          </aside>
        </div>
      )}
    </div>
  );
}
