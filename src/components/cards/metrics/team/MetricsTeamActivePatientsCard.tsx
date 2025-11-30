import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

/**
 * Card de Pacientes Ativos da Equipe
 * Mostra total de pacientes ativos sob gestão dos subordinados
 */
export function MetricsTeamActivePatientsCard({ 
  summary, 
  isLoading,
  className 
}: MetricsCardBaseProps) {
  const activePatients = summary?.activePatients || 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pacientes Ativos da Equipe
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
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
          Pacientes Ativos da Equipe
        </CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{activePatients}</div>
        <p className="text-xs text-muted-foreground mt-2">
          Total de pacientes ativos sob gestão da equipe
        </p>
      </CardContent>
    </Card>
  );
}
