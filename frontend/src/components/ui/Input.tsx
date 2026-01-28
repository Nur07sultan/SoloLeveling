import { clsx } from "clsx";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-zinc-100",
        "border border-white/10 focus:border-white/20 focus:outline-none",
        "placeholder:text-zinc-500",
        className
      )}
    />
  );
}
