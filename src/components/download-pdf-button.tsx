import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DownloadPdfButton({
  targetId,
  filename,
  label = "Download PDF",
}: {
  targetId: string;
  filename: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    const el = document.getElementById(targetId);
    if (!el) {
      toast.error("Nothing to export yet");
      return;
    }
    setBusy(true);
    try {
      const mod = await import("html2pdf.js");
      const html2pdf = (mod as any).default ?? mod;
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: {
            scale: 2,
            backgroundColor: "#0b0b14",
            useCORS: true,
            windowWidth: Math.max(el.scrollWidth, 1200),
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(el)
        .save();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to export PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      onClick={handle}
      disabled={busy}
      variant="outline"
      className="border-white/10 bg-white/5 hover:bg-white/10"
    >
      {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
      {label}
    </Button>
  );
}
