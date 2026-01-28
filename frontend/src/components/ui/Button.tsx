import { clsx } from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-zinc-100 text-zinc-950 hover:bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
        variant === "ghost" && "bg-transparent text-zinc-200 hover:bg-white/5",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-500",
        className
      )}
    />
  );
}
