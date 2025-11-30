import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

/**
 * Card de Receita Total da Equipe
 * Mostra receita total gerada pelos subordinados no período
 */
export function MetricsTeamTotalRevenueCard({ 
  summary, 
  isLoading,
  className 
}: MetricsCardBaseProps) {
  const totalRevenue = summary?.totalRevenue || 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Receita Total da Equipe
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[120px]" />
          <Skeleton className="h-4 w-[160px] mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Receita Total da Equipe
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(totalRevenue)}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Receita gerada pela equipe no período
        </p>
      </CardContent>
    </Card>
  );
}
