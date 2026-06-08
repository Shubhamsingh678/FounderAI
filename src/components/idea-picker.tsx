import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listIdeas } from "@/lib/founder.functions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function IdeaPicker({
  value,
  onChange,
  placeholder = "Select a startup idea",
}: {
  value: string | undefined;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const fn = useServerFn(listIdeas);
  const { data, isLoading } = useQuery({ queryKey: ["ideas"], queryFn: () => fn() });
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-white/5 border-white/10">
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {(data ?? []).map((i: any) => (
          <SelectItem key={i.id} value={i.id}>
            {i.name}
          </SelectItem>
        ))}
        {data && data.length === 0 && (
          <div className="px-2 py-2 text-xs text-muted-foreground">No ideas yet — generate one first.</div>
        )}
      </SelectContent>
    </Select>
  );
}
