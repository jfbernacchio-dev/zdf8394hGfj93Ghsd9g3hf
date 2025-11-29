import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign } from 'lucide-react';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

export function MetricsRevenueTotalCard({ periodFilter, summary, isLoading, className }: MetricsCardBaseProps) {
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

  // ✅ FASE 2.3 - CORREÇÃO C.1: Proteger contra valores negativos
  const value = Math.max(summary.totalRevenue || 0, 0);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">{formatBrazilianCurrency(value)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Receita no período selecionado
        </p>
      </CardContent>
    </Card>
  );
}
