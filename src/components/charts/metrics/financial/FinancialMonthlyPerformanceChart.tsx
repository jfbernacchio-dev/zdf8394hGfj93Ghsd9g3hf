import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { 
  Bar, 
  CartesianGrid, 
  ComposedChart, 
  Legend, 
  Line, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { formatTimeLabel } from '@/hooks/useChartTimeScale';
import type { FinancialTrendPoint } from '@/lib/systemMetricsUtils';
import type { MetricsPeriodFilter } from '@/types/metricsCardTypes';
import type { TimeScale } from '@/hooks/useChartTimeScale';

interface FinancialMonthlyPerformanceChartProps {
  trends: FinancialTrendPoint[];
  periodFilter: MetricsPeriodFilter;
  timeScale: TimeScale;
  isLoading: boolean;
}

/**
 * Gráfico de Performance Mensal (ComposedChart)
 * Exibe receita (barras) e número de sessões (linha) ao longo do tempo
 * 
 * @phase C3-R.4 - Financial Charts
 */
export function FinancialMonthlyPerformanceChart({
  trends,
  timeScale,
  isLoading,
}: FinancialMonthlyPerformanceChartProps) {
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
          <CardTitle>Performance Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sem dados de performance para o período selecionado
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
    sessionCount: {
      label: 'Sessões',
      color: 'hsl(var(--accent))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dateLabel" 
                className="text-xs"
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => formatBrazilianCurrency(value)}
                className="text-xs"
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                className="text-xs"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (name === 'revenue') {
                        return formatBrazilianCurrency(Number(value));
                      }
                      return `${value} sessões`;
                    }}
                  />
                }
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="revenue" 
                fill="hsl(var(--primary))" 
                name="Receita"
                radius={[4, 4, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone"
                dataKey="sessionCount" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                name="Sessões"
                dot={{ fill: 'hsl(var(--accent))' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
