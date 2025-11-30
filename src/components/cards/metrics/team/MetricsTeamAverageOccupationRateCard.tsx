import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';
import type { TeamMetricsSummary } from '@/types/teamMetricsTypes';

/**
 * Card de Ocupação Média da Equipe
 * Mostra o percentual do tempo disponível da equipe que foi ocupado com atendimentos
 */
export function MetricsTeamAverageOccupationRateCard({ 
  summary, 
  isLoading,
  className 
}: MetricsCardBaseProps) {
  const teamSummary = summary as TeamMetricsSummary | null;
  
  const occupationRate = teamSummary?.averageOccupationRate || 0;
  const attendedSlots = teamSummary?.totalAttendedSlots || 0;
  const availableSlots = teamSummary?.totalAvailableSlots || 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ocupação média da equipe
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[80px]" />
          <Skeleton className="h-4 w-[160px] mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Ocupação média da equipe
        </CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {availableSlots === 0 ? '--' : `${occupationRate.toFixed(1)}%`}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {availableSlots === 0 
            ? 'Nenhuma disponibilidade cadastrada para a equipe no período' 
            : `${attendedSlots} de ${availableSlots} blocos preenchidos`
          }
        </p>
      </CardContent>
    </Card>
  );
}
