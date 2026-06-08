import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Lightbulb,
  LayoutGrid,
  Target,
  MessagesSquare,
  Megaphone,
  Presentation,
  ArrowRight,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FounderAI — Your AI Startup Co-Founder" },
      {
        name: "description",
        content:
          "FounderAI is your AI co-founder: generate startup ideas, business models, competitor analyses, marketing plans, and pitch decks in minutes.",
      },
      { property: "og:title", content: "FounderAI — Your AI Startup Co-Founder" },
      {
        property: "og:description",
        content: "Generate ideas, models, decks, and growth plans with an AI co-founder.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const features = [
    { icon: Lightbulb, title: "Idea Generator", desc: "Turn skills & interests into validated startup concepts." },
    { icon: LayoutGrid, title: "Business Model Canvas", desc: "Auto-build the 9 blocks for any idea." },
    { icon: Target, title: "Competitor Analysis", desc: "Spot strengths, weaknesses, and market gaps." },
    { icon: MessagesSquare, title: "AI Co-Founder Chat", desc: "On-demand strategy, growth, and fundraising advice." },
    { icon: Megaphone, title: "Marketing Plan", desc: "Social, SEO, content, and email — fully drafted." },
    { icon: Presentation, title: "Pitch Deck", desc: "Investor-ready 10-slide deck with PPTX export." },
  ];

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">FounderAI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 text-center max-w-5xl mx-auto">
        <h1 className="text-5xl sm:text-7xl font-bold leading-[1.05] tracking-tight">
          The AI <span className="text-gradient">co-founder</span>
          <br /> every startup needs.
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto">
          From idea to pitch deck in under an hour. FounderAI generates startup ideas, business models, competitor
          intelligence, marketing plans, and investor decks — tailored to you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Link to="/auth">
              Start building free <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-white/5 border-white/10">
            <a href="#features">See features</a>
          </Button>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {["No credit card", "Generate in seconds", "Export to PPTX"].map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-accent" /> {f}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">Everything you need to launch.</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            One platform. Six AI workflows. Built for founders who ship.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="glass p-6 hover:ring-glow transition-all">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary grid place-items-center mb-4">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center max-w-3xl mx-auto">
        <div className="glass-strong p-12">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to meet your co-founder?</h2>
          <p className="text-muted-foreground mt-3">
            Join founders building the next generation of startups with AI.
          </p>
          <Button asChild size="lg" className="mt-6 bg-gradient-primary text-primary-foreground shadow-glow">
            <Link to="/auth">
              Get started for free <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FounderAI · Built with Lovable
      </footer>
    </div>
  );
}
