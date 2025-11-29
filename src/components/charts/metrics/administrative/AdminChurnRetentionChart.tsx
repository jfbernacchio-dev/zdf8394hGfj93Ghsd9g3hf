/**
 * 📊 GRÁFICO DE CHURN VS RETENÇÃO
 * 
 * Visualiza comparativo entre taxa de retenção e churn de pacientes.
 * Sub-aba: "Retenção" do domínio "Administrative"
 * 
 * @phase C3-R.5
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserMinus } from 'lucide-react';
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { RetentionChartProps } from '@/types/metricsChartTypes';

export function AdminChurnRetentionChart({ 
  retention,
  isLoading, 
  periodFilter,
  timeScale
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

  // Prepare comparative data
  const compareData = useMemo(() => {
    if (!retention) return [];

    // Create comparative bars for retention vs churn
    return [
      {
        category: 'Retenção 3m',
        retentionRate: retention.retentionRate3m || 0,
        churnRate: 0,
        type: 'retention',
        fill: 'hsl(var(--success))',
      },
      {
        category: 'Churn',
        retentionRate: 0,
        churnRate: retention.churnRate || 0,
        type: 'churn',
        fill: 'hsl(var(--destructive))',
      },
      {
        category: 'Retenção 6m',
        retentionRate: retention.retentionRate6m || 0,
        churnRate: 0,
        type: 'retention',
        fill: 'hsl(var(--chart-2))',
      },
      {
        category: 'Retenção 12m',
        retentionRate: retention.retentionRate12m || 0,
        churnRate: 0,
        type: 'retention',
        fill: 'hsl(var(--chart-3))',
      },
    ];
  }, [retention]);

  if (!retention || compareData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            Churn vs Retenção
          </CardTitle>
          <CardDescription>Comparativo entre retenção e churn de pacientes</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados suficientes para calcular churn e retenção neste período.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Chart configuration
  const chartConfig = {
    retentionRate: {
      label: 'Retenção (%)',
      color: 'hsl(var(--success))',
    },
    churnRate: {
      label: 'Churn (%)',
      color: 'hsl(var(--destructive))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserMinus className="h-5 w-5" />
          Churn vs Retenção
        </CardTitle>
        <CardDescription>
          Comparativo entre retenção e churn de pacientes • Novos: {retention.newPatients} | Inativos: {retention.inactivePatients}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compareData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="category" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
                label={{ value: 'Taxa (%)', angle: -90, position: 'insideLeft' }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `${label}`}
                    formatter={(value, name, props) => {
                      const payload = props.payload;
                      const displayValue = payload.type === 'churn' 
                        ? payload.churnRate 
                        : payload.retentionRate;
                      const labelText = payload.type === 'churn' ? 'Churn' : 'Retenção';
                      return [`${displayValue.toFixed(1)}%`, labelText];
                    }}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar 
                dataKey={(data) => data.type === 'churn' ? data.churnRate : data.retentionRate}
                radius={[8, 8, 0, 0]}
                name="Taxa"
              >
                {compareData.map((entry, index) => (
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
