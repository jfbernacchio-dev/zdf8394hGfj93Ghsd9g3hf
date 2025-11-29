import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { FinancialSummary } from '@/lib/systemMetricsUtils';
import type { MetricsPeriodFilter } from '@/types/metricsCardTypes';
import type { TimeScale } from '@/hooks/useChartTimeScale';

interface FinancialSessionStatusChartProps {
  summary: FinancialSummary | null;
  periodFilter: MetricsPeriodFilter;
  timeScale: TimeScale;
  isLoading: boolean;
}

/**
 * Gráfico de Status de Sessões (PieChart)
 * Exibe a distribuição de sessões por status: realizadas, faltadas, remarcadas
 * 
 * @phase C3-R.4 - Financial Charts
 */
export function FinancialSessionStatusChart({
  summary,
  isLoading,
}: FinancialSessionStatusChartProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status de Sessões</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sem dados de sessões para o período selecionado
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Prepare data
  const totalSessions = summary.totalSessions || 0;
  const missedRate = summary.missedRate || 0;
  
  // Calculate missed and attended counts from rate
  const missedCount = Math.round((missedRate / 100) * totalSessions);
  const attendedCount = totalSessions - missedCount;

  const chartData = [
    { 
      name: 'Realizadas', 
      value: attendedCount, 
      fill: 'hsl(var(--success))',
      percentage: totalSessions > 0 ? ((attendedCount / totalSessions) * 100) : 0
    },
    { 
      name: 'Faltadas', 
      value: missedCount, 
      fill: 'hsl(var(--destructive))',
      percentage: totalSessions > 0 ? ((missedCount / totalSessions) * 100) : 0
    },
  ].filter(item => item.value > 0); // Remove items with 0 value

  const chartConfig = {
    realizadas: {
      label: 'Realizadas',
      color: 'hsl(var(--success))',
    },
    faltadas: {
      label: 'Faltadas',
      color: 'hsl(var(--destructive))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status de Sessões</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${value} sessões`}
                  />
                }
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
