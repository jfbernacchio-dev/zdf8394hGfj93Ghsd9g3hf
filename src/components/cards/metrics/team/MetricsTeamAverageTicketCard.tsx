import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign } from 'lucide-react';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';
import type { TeamMetricsSummary } from '@/types/teamMetricsTypes';

/**
 * Card de Ticket Médio da Equipe
 * Mostra o valor médio recebido por sessão realizada pelos profissionais da equipe
 */
export function MetricsTeamAverageTicketCard({ 
  summary, 
  isLoading,
  className 
}: MetricsCardBaseProps) {
  const teamSummary = summary as TeamMetricsSummary | null;
  
  const averageTicket = teamSummary?.averageTicket || 0;
  const attendedSessions = teamSummary?.attendedSessions || 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ticket médio da equipe
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
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
          Ticket médio da equipe
        </CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(averageTicket)}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {attendedSessions === 0 
            ? 'Nenhuma sessão realizada no período' 
            : `Baseado em ${attendedSessions} ${attendedSessions === 1 ? 'sessão realizada' : 'sessões realizadas'} pela equipe`
          }
        </p>
      </CardContent>
    </Card>
  );
}
