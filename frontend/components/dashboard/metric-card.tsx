import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color: "emerald" | "amber" | "red" | "blue" | "green";
}

const colorClasses = {
  emerald: "text-emerald-500 bg-emerald-500/10",
  amber: "text-amber-500 bg-amber-500/10",
  red: "text-red-500 bg-red-500/10",
  blue: "text-blue-500 bg-blue-500/10",
  green: "text-green-500 bg-green-500/10",
};

export function MetricCard({ title, value, subtitle, icon: Icon, color }: MetricCardProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6 hover:bg-slate-900/70 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-400 font-medium">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-slate-50 mt-2 whitespace-nowrap overflow-hidden text-ellipsis">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 break-words">{subtitle}</p>
          )}
        </div>
        
        <div className={cn("p-3 rounded-lg flex-shrink-0", colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}
