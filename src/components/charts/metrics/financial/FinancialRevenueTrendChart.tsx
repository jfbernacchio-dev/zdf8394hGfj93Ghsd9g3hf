import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { formatTimeLabel } from '@/hooks/useChartTimeScale';
import type { FinancialTrendPoint } from '@/lib/systemMetricsUtils';
import type { MetricsPeriodFilter } from '@/types/metricsCardTypes';
import type { TimeScale } from '@/hooks/useChartTimeScale';

interface FinancialRevenueTrendChartProps {
  trends: FinancialTrendPoint[];
  periodFilter: MetricsPeriodFilter;
  timeScale: TimeScale;
  isLoading: boolean;
}

/**
 * Gráfico de Tendência de Receita (LineChart)
 * Exibe a evolução da receita ao longo do tempo com linha suave
 * 
 * @phase C3-R.4 - Financial Charts
 */
export function FinancialRevenueTrendChart({
  trends,
  timeScale,
  isLoading,
}: FinancialRevenueTrendChartProps) {
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
          <CardTitle>Tendência de Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sem dados de tendência para o período selecionado
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    revenue: {
      label: 'Receita',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Receita</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
              <Line 
                type="monotone"
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Receita"
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
