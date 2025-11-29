import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { formatTimeLabel } from '@/hooks/useChartTimeScale';
import type { FinancialTrendPoint, FinancialSummary } from '@/lib/systemMetricsUtils';
import type { MetricsPeriodFilter } from '@/types/metricsCardTypes';
import type { TimeScale } from '@/hooks/useChartTimeScale';

interface FinancialForecastVsActualChartProps {
  trends: FinancialTrendPoint[];
  summary: FinancialSummary | null;
  periodFilter: MetricsPeriodFilter;
  timeScale: TimeScale;
  isLoading: boolean;
}

/**
 * Gráfico de Previsão vs Realizado (AreaChart)
 * Exibe a receita real vs projeção/média móvel
 * 
 * @phase C3-R.4 - Financial Charts
 */
export function FinancialForecastVsActualChart({
  trends,
  summary,
  timeScale,
  isLoading,
}: FinancialForecastVsActualChartProps) {
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

  // Calculate forecast (simple moving average of 3 periods)
  const chartData = useMemo(() => {
    if (trends.length === 0) return [];

    const avgPerSession = summary?.avgPerSession || 0;
    
    return trends.map((point, index) => {
      // Calculate moving average from last 3 periods
      const start = Math.max(0, index - 2);
      const recentTrends = trends.slice(start, index + 1);
      const avgRevenue = recentTrends.reduce((sum, t) => sum + t.revenue, 0) / recentTrends.length;
      
      // Forecast: use moving average or average per session * session count
      const forecast = index < 2 
        ? avgPerSession * point.sessions 
        : avgRevenue;

      return {
        ...point,
        dateLabel: formatTimeLabel(new Date(point.date), timeScale),
        forecast: Math.round(forecast),
      };
    });
  }, [trends, summary, timeScale]);

  // Empty state
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previsão vs Realizado</CardTitle>
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
      label: 'Receita Real',
      color: 'hsl(var(--primary))',
    },
    forecast: {
      label: 'Previsão',
      color: 'hsl(var(--muted-foreground))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Previsão vs Realizado</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
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
              <Area 
                type="monotone"
                dataKey="revenue" 
                fill="hsl(var(--primary) / 0.2)" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Receita Real"
              />
              <Area 
                type="monotone"
                dataKey="forecast" 
                fill="hsl(var(--muted) / 0.1)" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Previsão"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
