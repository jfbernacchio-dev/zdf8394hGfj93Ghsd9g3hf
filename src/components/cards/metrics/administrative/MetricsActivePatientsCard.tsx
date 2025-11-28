import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

export function MetricsActivePatientsCard({ periodFilter, summary, isLoading, className }: MetricsCardBaseProps) {
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

  const count = summary.activePatients || 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">{count}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Com sessões no período
        </p>
      </CardContent>
    </Card>
  );
}
