/**
 * 📊 GRÁFICO DE TAXA DE RETENÇÃO
 * 
 * Visualiza percentual de retenção de pacientes em 3m, 6m e 12m.
 * Sub-aba: "Retenção" do domínio "Financial"
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
import type { MetricsChartBaseProps } from '@/types/metricsChartTypes';
import type { MetricsPatient } from '@/lib/systemMetricsUtils';
import { getRetentionRate } from '@/lib/systemMetricsUtils';

interface FinancialRetentionRateChartProps extends MetricsChartBaseProps {
  patients: MetricsPatient[];
  isLoading: boolean;
}

export function FinancialRetentionRateChart({ 
  patients, 
  isLoading, 
  periodFilter,
  timeScale
}: FinancialRetentionRateChartProps) {
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

  const retentionData = useMemo(() => {
    if (!patients || patients.length === 0) return [];
    return getRetentionRate({ patients });
  }, [patients, periodFilter]);

  if (retentionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Taxa de Retenção de Pacientes
          </CardTitle>
          <CardDescription>Percentual de pacientes que continuam ativos após períodos específicos</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados suficientes para calcular retenção.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    taxa: {
      label: 'Taxa de Retenção',
      color: 'hsl(var(--success))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Taxa de Retenção de Pacientes
        </CardTitle>
        <CardDescription>
          Percentual de pacientes que continuam ativos após períodos específicos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={retentionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                tickFormatter={(val) => `${val}%`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => label}
                    formatter={(value) => [`${value}%`, 'Taxa de Retenção']}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar 
                dataKey="taxa" 
                fill="hsl(var(--success))" 
                radius={[8, 8, 0, 0]}
                name="Taxa de Retenção (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <div className="mt-6 grid grid-cols-3 gap-4">
          {retentionData.map(item => (
            <div key={item.periodo} className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">{item.periodo}</p>
              <p className="text-2xl font-bold text-foreground">{item.taxa}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
