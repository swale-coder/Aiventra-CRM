import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  barClassName,
  height = 8,
}: {
  value: number;
  className?: string;
  barClassName?: string;
  height?: number;
}) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-black/[0.06]", className)}
      style={{ height }}
    >
      <div
        className={cn("h-full rounded-full bg-gradient-to-r from-aiventra-orange to-[#FF9152] transition-all duration-700 ease-out", barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
