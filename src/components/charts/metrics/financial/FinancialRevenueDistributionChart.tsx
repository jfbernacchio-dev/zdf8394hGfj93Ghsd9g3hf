import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import type { FinancialSummary } from '@/lib/systemMetricsUtils';
import type { MetricsPeriodFilter } from '@/types/metricsCardTypes';
import type { TimeScale } from '@/hooks/useChartTimeScale';

interface FinancialRevenueDistributionChartProps {
  summary: FinancialSummary | null;
  periodFilter: MetricsPeriodFilter;
  timeScale: TimeScale;
  isLoading: boolean;
}

/**
 * Gráfico de Distribuição de Receita (PieChart)
 * Exibe a composição da receita: realizada, prevista (faltante) e perdida
 * 
 * @phase C3-R.4 - Financial Charts
 */
export function FinancialRevenueDistributionChart({
  summary,
  isLoading,
}: FinancialRevenueDistributionChartProps) {
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
          <CardTitle>Distribuição de Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sem dados de receita para o período selecionado
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Prepare data
  const totalRevenue = summary.totalRevenue || 0;
  const forecastRevenue = summary.forecastRevenue || 0;
  const lostRevenue = summary.lostRevenue || 0;
  
  // Calculate pending revenue (forecast - realized)
  const pendingRevenue = Math.max(forecastRevenue - totalRevenue, 0);

  const chartData = [
    { 
      name: 'Receita Realizada', 
      value: totalRevenue, 
      fill: 'hsl(var(--chart-1))',
      percentage: totalRevenue > 0 ? ((totalRevenue / forecastRevenue) * 100) : 0
    },
    { 
      name: 'Receita Prevista (Faltante)', 
      value: pendingRevenue, 
      fill: 'hsl(var(--chart-2))',
      percentage: pendingRevenue > 0 ? ((pendingRevenue / forecastRevenue) * 100) : 0
    },
    { 
      name: 'Receita Perdida', 
      value: lostRevenue, 
      fill: 'hsl(var(--chart-3))',
      percentage: lostRevenue > 0 ? ((lostRevenue / forecastRevenue) * 100) : 0
    },
  ].filter(item => item.value > 0); // Remove items with 0 value

  const chartConfig = {
    realizada: {
      label: 'Receita Realizada',
      color: 'hsl(var(--chart-1))',
    },
    prevista: {
      label: 'Receita Prevista (Faltante)',
      color: 'hsl(var(--chart-2))',
    },
    perdida: {
      label: 'Receita Perdida',
      color: 'hsl(var(--chart-3))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Receita</CardTitle>
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
                    formatter={(value) => formatBrazilianCurrency(Number(value))}
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
