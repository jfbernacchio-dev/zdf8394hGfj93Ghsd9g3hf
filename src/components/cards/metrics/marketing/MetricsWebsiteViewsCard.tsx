import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { MockMetricsCardProps } from '@/types/metricsCardTypes';

export function MetricsWebsiteViewsCard({ isLoading, className }: MockMetricsCardProps) {
  if (isLoading) {
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

  const mockValue = 1847;

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Visualizações (exemplo)</CardTitle>
        <Eye className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-muted-foreground">{mockValue.toLocaleString('pt-BR')}</div>
        <Alert className="mt-2 py-1 px-2">
          <AlertDescription className="text-xs">
            Dados de exemplo — integração com Analytics futura
          </AlertDescription>
        </Alert>
      </CardContent>
    </>
  );
}