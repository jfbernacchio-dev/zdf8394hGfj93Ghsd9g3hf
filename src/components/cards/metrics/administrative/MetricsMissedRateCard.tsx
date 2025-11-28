import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

export function MetricsMissedRateCard({ periodFilter, summary, isLoading, className }: MetricsCardBaseProps) {
  if (isLoading || !summary) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-24 mt-2" />
        </CardContent>
      </Card>
    );
  }

  const rate = summary.missedRate || 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Taxa de Faltas</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-500">{rate.toFixed(1)}%</div>
        <p className="text-xs text-muted-foreground mt-1">
          Sessões marcadas não comparecidas
        </p>
      </CardContent>
    </Card>
  );
}
