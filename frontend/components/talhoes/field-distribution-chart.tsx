import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartTooltip } from "@/components/shared/chart-tooltip";

interface FieldDistributionChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title: string;
  subtitle?: string;
}

export function FieldDistributionChart({ data, title, subtitle }: FieldDistributionChartProps) {
  const colors = [
    "#10b981", // emerald-500
    "#3b82f6", // blue-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
  ];

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis 
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
          <Bar 
            dataKey="value" 
            radius={[8, 8, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
