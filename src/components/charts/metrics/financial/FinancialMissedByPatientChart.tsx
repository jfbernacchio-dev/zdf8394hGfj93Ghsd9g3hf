/**
 * 📊 GRÁFICO DE FALTAS POR PACIENTE
 * 
 * Visualiza o número de faltas de cada paciente no período.
 * Sub-aba: "Desempenho" do domínio "Financial"
 * 
 * @phase C3-R.7
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { MetricsChartBaseProps } from '@/types/metricsChartTypes';
import type { MetricsSession } from '@/lib/systemMetricsUtils';
import { getMissedByPatient } from '@/lib/systemMetricsUtils';

interface FinancialMissedByPatientChartProps extends MetricsChartBaseProps {
  sessions: MetricsSession[];
  isLoading: boolean;
}

export function FinancialMissedByPatientChart({ 
  sessions, 
  isLoading, 
  periodFilter,
  timeScale
}: FinancialMissedByPatientChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const missedData = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];
    return getMissedByPatient({ sessions });
  }, [sessions]);

  if (missedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Faltas por Paciente
          </CardTitle>
          <CardDescription>Número de faltas de cada paciente no período</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem faltas registradas no período selecionado.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    faltas: {
      label: 'Faltas',
      color: 'hsl(var(--destructive))',
    },
  };

  const totalMissed = missedData.reduce((sum, d) => sum + d.faltas, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Faltas por Paciente
        </CardTitle>
        <CardDescription>
          Número de faltas de cada paciente no período • Total: {totalMissed} faltas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={missedData} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                allowDecimals={false}
              />
              <YAxis 
                dataKey="name" 
                type="category"
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                width={140}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => label}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar 
                dataKey="faltas" 
                fill="hsl(var(--destructive))" 
                radius={[0, 8, 8, 0]}
                name="Faltas"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
