import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatTimeLabel } from '@/hooks/useChartTimeScale';
import type { FinancialTrendPoint } from '@/lib/systemMetricsUtils';
import type { MetricsPeriodFilter } from '@/types/metricsCardTypes';
import type { TimeScale } from '@/hooks/useChartTimeScale';

interface FinancialConversionRateChartProps {
  trends: FinancialTrendPoint[];
  periodFilter: MetricsPeriodFilter;
  timeScale: TimeScale;
  isLoading: boolean;
}

/**
 * Gráfico de Taxa de Conversão (LineChart)
 * Exibe a taxa de sessões realizadas vs agendadas (100% - missed rate)
 * 
 * @phase C3-R.4 - Financial Charts
 */
export function FinancialConversionRateChart({
  trends,
  timeScale,
  isLoading,
}: FinancialConversionRateChartProps) {
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

  // Calculate conversion rate (inverse of missed rate)
  const chartData = useMemo(() => {
    return trends.map(point => {
      // Conversion rate = 100% - missed rate
      const conversionRate = point.missedRate !== undefined 
        ? 100 - point.missedRate 
        : 100;

      return {
        ...point,
        dateLabel: formatTimeLabel(new Date(point.date), timeScale),
        conversionRate: Math.max(0, Math.min(100, conversionRate)), // Clamp between 0-100
      };
    });
  }, [trends, timeScale]);

  // Empty state
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sem dados de conversão para o período selecionado
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    conversionRate: {
      label: 'Taxa de Conversão',
      color: 'hsl(var(--success))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Conversão</CardTitle>
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
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                className="text-xs"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${Number(value).toFixed(1)}%`}
                  />
                }
              />
              <Legend />
              <Line 
                type="monotone"
                dataKey="conversionRate" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                name="Taxa de Conversão"
                dot={{ fill: 'hsl(var(--success))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
