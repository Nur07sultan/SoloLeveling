import { Button } from "@/components/ui/Button";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
      <div className="text-lg font-semibold text-zinc-100">{title}</div>
      {description ? <div className="mt-2 text-sm text-zinc-400">{description}</div> : null}
      {action ? (
        <div className="mt-4 flex justify-center">
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      ) : null}
    </div>
  );
}
