import { splitMon } from "@/utils/format";

// Angka besar dengan desimal dipudarkan.
export function Amount({
  wei,
  decimals = 2,
  unit = "MON",
  className = "",
  unitClassName = "",
}: {
  wei: bigint;
  decimals?: number;
  unit?: string | null;
  className?: string;
  unitClassName?: string;
}) {
  const { int, dec } = splitMon(wei, decimals);
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={`font-head font-semibold tracking-[-0.045em] tabular-nums ${className}`}>
        {int}
        <span className="num-dim">{dec}</span>
      </span>
      {unit ? <span className={`text-base opacity-70 ${unitClassName}`}>{unit}</span> : null}
    </span>
  );
}
