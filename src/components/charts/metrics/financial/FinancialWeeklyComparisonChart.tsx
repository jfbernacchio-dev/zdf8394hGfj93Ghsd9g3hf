import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { formatTimeLabel } from '@/hooks/useChartTimeScale';
import type { FinancialTrendPoint } from '@/lib/systemMetricsUtils';
import type { MetricsPeriodFilter } from '@/types/metricsCardTypes';
import type { TimeScale } from '@/hooks/useChartTimeScale';

interface FinancialWeeklyComparisonChartProps {
  trends: FinancialTrendPoint[];
  periodFilter: MetricsPeriodFilter;
  timeScale: TimeScale;
  isLoading: boolean;
}

/**
 * Gráfico de Comparativo Semanal (BarChart)
 * Exibe receita por semana em barras para comparação visual
 * 
 * @phase C3-R.4 - Financial Charts
 */
export function FinancialWeeklyComparisonChart({
  trends,
  timeScale,
  isLoading,
}: FinancialWeeklyComparisonChartProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[400px]" />
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data with formatted labels
  const chartData = useMemo(() => {
    return trends.map(point => ({
      ...point,
      dateLabel: formatTimeLabel(new Date(point.date), timeScale),
    }));
  }, [trends, timeScale]);

  // Empty state
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparativo Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sem dados para comparação no período selecionado
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    revenue: {
      label: 'Receita',
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo Semanal</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dateLabel" 
                className="text-xs"
              />
              <YAxis 
                tickFormatter={(value) => formatBrazilianCurrency(value)}
                className="text-xs"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatBrazilianCurrency(Number(value))}
                  />
                }
              />
              <Legend />
              <Bar 
                dataKey="revenue" 
                fill="hsl(var(--chart-1))" 
                name="Receita"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
