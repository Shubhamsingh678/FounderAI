import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { chatWithCofounder, listChat, clearChat } from "@/lib/founder.functions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "AI Co-Founder Chat — FounderAI" }] }),
  component: ChatPage,
});

function ChatPage() {
  const qc = useQueryClient();
  const chatFn = useServerFn(chatWithCofounder);
  const listFn = useServerFn(listChat);
  const clearFn = useServerFn(clearChat);
  const { data: messages } = useQuery({ queryKey: ["chat"], queryFn: () => listFn() });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const send = useMutation({
    mutationFn: (text: string) => chatFn({ data: { message: text } }),
    onMutate: async (text) => {
      const prev = qc.getQueryData<any[]>(["chat"]) ?? [];
      qc.setQueryData(["chat"], [...prev, { id: `tmp-${Date.now()}`, role: "user", content: text }]);
      setInput("");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setTimeout(() => taRef.current?.focus(), 50);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["chat"] });
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, send.isPending]);

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || send.isPending) return;
    send.mutate(text);
  }

  const list = messages ?? [];
  const suggestions = [
    "How do I find my first 10 customers?",
    "Critique my pricing strategy",
    "What metrics matter pre-seed?",
    "Help me write a cold outbound email",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="AI Co-Founder"
        title="Chat with your co-founder"
        description="Ask anything: strategy, marketing, fundraising, hiring."
        actions={
          list.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10"
              onClick={async () => {
                await clearFn();
                qc.invalidateQueries({ queryKey: ["chat"] });
              }}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Clear
            </Button>
          )
        }
      />

      <div className="glass-strong flex-1 flex flex-col min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {list.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="h-14 w-14 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow mb-4">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg">Your AI co-founder is ready.</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Bounce ideas, get critiques, and ship faster. Try one of these:
              </p>
              <div className="grid sm:grid-cols-2 gap-2 mt-5 max-w-xl w-full">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send.mutate(s)}
                    className="text-left text-sm px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {list.map((m: any) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${
                  m.role === "user" ? "bg-white/10" : "bg-gradient-primary"
                }`}
              >
                {m.role === "user" ? (
                  <span className="text-xs font-bold">U</span>
                ) : (
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
              <div
                className={`max-w-[80%] text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 whitespace-pre-wrap"
                    : "text-foreground prose prose-invert prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-2 prose-pre:bg-white/5 prose-code:text-primary-foreground prose-a:text-primary"
                }`}
              >
                {m.role === "user" ? (
                  m.content
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {send.isPending && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="border-t border-white/5 p-3 flex gap-2 items-end">
          <Textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask your co-founder anything…"
            className="flex-1 min-h-[48px] max-h-40 resize-none bg-white/5 border-white/10"
            rows={1}
          />
          <Button
            type="submit"
            disabled={!input.trim() || send.isPending}
            className="bg-gradient-primary text-primary-foreground shadow-glow h-12 w-12 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
