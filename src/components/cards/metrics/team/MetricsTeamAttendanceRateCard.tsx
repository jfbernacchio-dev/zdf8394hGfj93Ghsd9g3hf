import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle } from 'lucide-react';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';
import type { TeamMetricsSummary } from '@/types/teamMetricsTypes';

/**
 * Card de Taxa de Comparecimento da Equipe
 * Mostra o percentual de sessões que foram efetivamente realizadas (vs faltadas)
 */
export function MetricsTeamAttendanceRateCard({ 
  summary, 
  isLoading,
  className 
}: MetricsCardBaseProps) {
  const teamSummary = summary as TeamMetricsSummary | null;
  
  const attendanceRate = teamSummary?.attendanceRate || 0;
  const attendedSessions = teamSummary?.attendedSessions || 0;
  const totalCommitted = teamSummary?.totalCommittedSessions || 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Taxa de comparecimento da equipe
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
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
          Taxa de comparecimento da equipe
        </CardTitle>
        <CheckCircle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {totalCommitted === 0 ? '--' : `${attendanceRate.toFixed(1)}%`}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {totalCommitted === 0 
            ? 'Nenhuma sessão agendada no período' 
            : `${attendedSessions} de ${totalCommitted} sessões comparecidas`
          }
        </p>
      </CardContent>
    </Card>
  );
}
