import { clsx } from "clsx";

export function Progress({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={clsx("h-2 w-full rounded-full bg-white/10 overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
