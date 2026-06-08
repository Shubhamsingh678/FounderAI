import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Lightbulb,
  LayoutGrid,
  Target,
  MessagesSquare,
  Megaphone,
  Presentation,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { title: "Generate Idea", to: "/idea", icon: Lightbulb },
  { title: "Business Model", to: "/business-model", icon: LayoutGrid },
  { title: "Competitors", to: "/competitors", icon: Target },
  { title: "AI Co-Founder", to: "/chat", icon: MessagesSquare },
  { title: "Marketing Plan", to: "/marketing", icon: Megaphone },
  { title: "Pitch Deck", to: "/pitch", icon: Presentation },
  { title: "Settings", to: "/settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/5 bg-sidebar/70 backdrop-blur-xl">
        <BrandBlock />
        <nav className="flex-1 px-3 py-2 space-y-1">
          {items.map((it) => {
            const active = path === it.to || path.startsWith(it.to + "/");
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                  active
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-white/5",
                )}
              >
                <it.icon className="h-4 w-4" />
                {it.title}
              </Link>
            );
          })}
        </nav>
        <UserBlock email={email} onSignOut={signOut} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-sidebar/95 backdrop-blur-xl border-r border-white/10 flex flex-col">
            <BrandBlock />
            <nav className="flex-1 px-3 py-2 space-y-1">
              {items.map((it) => {
                const active = path === it.to;
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                      active
                        ? "bg-gradient-primary text-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-white/5",
                    )}
                  >
                    <it.icon className="h-4 w-4" />
                    {it.title}
                  </Link>
                );
              })}
            </nav>
            <UserBlock email={email} onSignOut={signOut} />
          </div>
          <button
            aria-label="Close menu"
            className="flex-1 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-white/5 bg-background/70 backdrop-blur-xl">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-sm text-foreground/80"
            aria-label="Open menu"
          >
            ☰ Menu
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> FounderAI
          </div>
          <div className="w-10" />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

function BrandBlock() {
  return (
    <div className="px-5 pt-6 pb-4">
      <Link to="/dashboard" className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-bold text-base leading-tight">FounderAI</div>
          <div className="text-[11px] text-muted-foreground -mt-0.5">AI Startup Co-Founder</div>
        </div>
      </Link>
    </div>
  );
}

function UserBlock({ email, onSignOut }: { email: string | null; onSignOut: () => void }) {
  return (
    <div className="border-t border-white/5 px-3 py-3">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="h-8 w-8 rounded-full bg-gradient-primary grid place-items-center text-xs font-semibold text-primary-foreground">
          {(email?.[0] ?? "U").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs truncate text-foreground/90">{email ?? "Signed in"}</div>
        </div>
        <button
          onClick={onSignOut}
          className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
