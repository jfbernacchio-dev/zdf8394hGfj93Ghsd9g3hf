import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

export function MetricsAvgPerActivePatientCard({ periodFilter, summary, isLoading, className }: MetricsCardBaseProps) {
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

  const value = summary.avgRevenuePerActivePatient || 0;

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Média por Paciente</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatBrazilianCurrency(value)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Receita média por paciente ativo
        </p>
      </CardContent>
    </>
  );
}