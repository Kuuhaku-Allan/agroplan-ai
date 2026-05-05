import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingCard() {
  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-24 bg-slate-800" />
          <Skeleton className="h-8 w-32 bg-slate-800" />
          <Skeleton className="h-3 w-20 bg-slate-800" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg bg-slate-800" />
      </div>
    </Card>
  );
}

export function LoadingChart() {
  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <Skeleton className="h-5 w-40 mb-4 bg-slate-800" />
      <Skeleton className="h-[300px] w-full bg-slate-800" />
    </Card>
  );
}
