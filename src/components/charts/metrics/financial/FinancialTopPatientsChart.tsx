/**
 * 📊 GRÁFICO DE TOP 10 PACIENTES POR FATURAMENTO
 * 
 * Visualiza os 10 pacientes com maior faturamento no período,
 * mostrando faturamento total e média por sessão.
 * Sub-aba: "Tendências" do domínio "Financial"
 * 
 * @phase C3-R.7
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users } from 'lucide-react';
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
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import type { MetricsChartBaseProps } from '@/types/metricsChartTypes';
import type { MetricsPatient, MetricsSession } from '@/lib/systemMetricsUtils';
import { getAvgRevenuePerPatient } from '@/lib/systemMetricsUtils';

interface FinancialTopPatientsChartProps extends MetricsChartBaseProps {
  patients: MetricsPatient[];
  sessions: MetricsSession[];
  isLoading: boolean;
}

export function FinancialTopPatientsChart({ 
  patients, 
  sessions,
  isLoading, 
  periodFilter,
  timeScale
}: FinancialTopPatientsChartProps) {
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

  const topPatientsData = useMemo(() => {
    if (!patients || patients.length === 0 || !sessions || sessions.length === 0) return [];
    
    const avgRevenueData = getAvgRevenuePerPatient({ patients, sessions });
    
    // Top 10
    return avgRevenueData.slice(0, 10);
  }, [patients, sessions, periodFilter]);

  if (topPatientsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Faturamento por Paciente (Top 10)
          </CardTitle>
          <CardDescription>Comparativo de faturamento total e valor médio por sessão</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados de faturamento por paciente neste período.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    faturamento: {
      label: 'Faturamento Total',
      color: 'hsl(var(--primary))',
    },
    media: {
      label: 'Média por Sessão',
      color: 'hsl(var(--accent))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Faturamento por Paciente (Top 10)
        </CardTitle>
        <CardDescription>
          Comparativo de faturamento total e valor médio por sessão dos 10 maiores faturadores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={topPatientsData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={({ x, y, payload }) => {
                  const words = payload.value.split(' ');
                  const displayText = words.length > 2 ? `${words[0]} ${words[1]}` : payload.value;
                  return (
                    <text 
                      x={x} 
                      y={y} 
                      textAnchor="end" 
                      transform={`rotate(-45 ${x} ${y})`} 
                      fill="hsl(var(--foreground))"
                      fontSize={11}
                    >
                      {displayText}
                    </text>
                  );
                }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                tickFormatter={(val) => formatBrazilianCurrency(val)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `Paciente: ${label}`}
                    formatter={(value, name) => [formatBrazilianCurrency(Number(value)), name === 'faturamento' ? 'Faturamento Total' : 'Média por Sessão']}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar 
                dataKey="faturamento" 
                fill="hsl(var(--primary))" 
                radius={[8, 8, 0, 0]}
                name="Faturamento Total"
              />
              <Bar 
                dataKey="media" 
                fill="hsl(var(--accent))" 
                radius={[8, 8, 0, 0]}
                name="Média por Sessão"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
