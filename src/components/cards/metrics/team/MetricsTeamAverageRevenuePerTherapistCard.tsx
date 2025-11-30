import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';
import type { TeamMetricsSummary } from '@/types/teamMetricsTypes';

/**
 * Card de Faturamento Médio por Terapeuta
 * Mostra a média de faturamento entre os profissionais da equipe que realizaram sessões
 */
export function MetricsTeamAverageRevenuePerTherapistCard({ 
  summary, 
  isLoading,
  className 
}: MetricsCardBaseProps) {
  const teamSummary = summary as TeamMetricsSummary | null;
  
  const averageRevenue = teamSummary?.averageRevenuePerTherapist || 0;
  const therapistsCount = teamSummary?.therapistsWithSessions || 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Faturamento médio por terapeuta
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
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
          Faturamento médio por terapeuta
        </CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(averageRevenue)}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {therapistsCount === 0 
            ? 'Nenhum atendimento realizado no período' 
            : `Equipe: ${therapistsCount} ${therapistsCount === 1 ? 'profissional' : 'profissionais'} com atendimentos`
          }
        </p>
      </CardContent>
    </Card>
  );
}
