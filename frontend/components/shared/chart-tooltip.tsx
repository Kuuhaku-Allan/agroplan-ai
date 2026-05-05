import { formatCurrencyBRL, formatPercent } from "@/lib/formatters";

interface ChartTooltipProps {
  active?: boolean;
  payload?: readonly any[];
  label?: string | number;
  type?: "currency" | "percent";
  valueLabel?: string;
}

export function ChartTooltip({ active, payload, type = "currency", valueLabel }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  const value = payload[0].value;

  const formattedValue = type === "currency" 
    ? formatCurrencyBRL(Number(value))
    : formatPercent(Number(value));

  const valueColor = type === "currency" 
    ? "text-amber-400" 
    : "text-red-400";

  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-sm font-semibold text-slate-100">
        {item.fullName || item.name}
      </p>
      <p className={`mt-1 text-sm font-bold ${valueColor}`}>
        {valueLabel ? `${valueLabel}: ` : ""}{formattedValue}
      </p>
    </div>
  );
}
