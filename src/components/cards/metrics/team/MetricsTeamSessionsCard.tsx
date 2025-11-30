import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

/**
 * Card de Sessões Realizadas da Equipe
 * Mostra total de sessões realizadas pelos subordinados no período
 */
export function MetricsTeamSessionsCard({ 
  summary, 
  isLoading,
  className 
}: MetricsCardBaseProps) {
  const totalSessions = summary?.totalSessions || 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Sessões Realizadas
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
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
          Sessões Realizadas
        </CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{totalSessions}</div>
        <p className="text-xs text-muted-foreground mt-2">
          Total de sessões realizadas pela equipe
        </p>
      </CardContent>
    </Card>
  );
}
