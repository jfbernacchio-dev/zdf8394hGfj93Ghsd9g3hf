import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Target } from 'lucide-react';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

export function MetricsOccupationRateCard({ periodFilter, summary, isLoading, className }: MetricsCardBaseProps) {
  if (isLoading || !summary) {
    return (
      <>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-24 mt-2" />
        </CardContent>
      </>
    );
  }

  // occupationRate may not be in summary yet - show as coming soon or 0
  const rate = 0; // TODO: will be added to FinancialSummary in future

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{rate.toFixed(1)}%</div>
        <p className="text-xs text-muted-foreground mt-1">
          Capacidade vs agenda potencial
        </p>
      </CardContent>
    </>
  );
}
