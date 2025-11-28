/**
 * 📊 GRÁFICO DE RETENÇÃO ADMINISTRATIVA
 * 
 * Visualiza taxas de retenção de pacientes em diferentes períodos.
 * Sub-aba: "Retenção" do domínio "Administrative"
 * 
 * @phase C3.7
 */

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
  Legend,
  Cell
} from 'recharts';
import type { RetentionChartProps } from '@/types/metricsChartTypes';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export function AdminRetentionChart({ 
  retention,
  isLoading, 
}: RetentionChartProps) {
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

  if (!retention) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Taxas de Retenção
          </CardTitle>
          <CardDescription>Retenção de pacientes ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados suficientes para retenção neste período.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart
  const chartData = [
    { 
      periodo: '3 meses', 
      taxa: retention.retentionRate3m,
      fill: 'hsl(var(--chart-1))'
    },
    { 
      periodo: '6 meses', 
      taxa: retention.retentionRate6m,
      fill: 'hsl(var(--chart-2))'
    },
    { 
      periodo: '12 meses', 
      taxa: retention.retentionRate12m,
      fill: 'hsl(var(--chart-3))'
    },
    { 
      periodo: 'Churn', 
      taxa: retention.churnRate,
      fill: 'hsl(var(--destructive))'
    },
  ];

  // Chart configuration
  const chartConfig = {
    taxa: {
      label: 'Taxa (%)',
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Taxas de Retenção
        </CardTitle>
        <CardDescription>
          Retenção de pacientes ao longo do tempo • Novos: {retention.newPatients} | Inativos: {retention.inactivePatients}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="periodo" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                domain={[0, 100]}
                label={{ value: 'Taxa (%)', angle: -90, position: 'insideLeft' }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `Período: ${label}`}
                    formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Taxa']}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={() => 'Taxa de Retenção (%)'}
              />
              <Bar 
                dataKey="taxa" 
                radius={[8, 8, 0, 0]}
                name="Taxa"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
