/**
 * 📊 GRÁFICO DE DISTRIBUIÇÃO POR FREQUÊNCIA
 * 
 * Visualiza a distribuição de pacientes por frequência de atendimento.
 * Sub-aba: "Distribuições" do domínio "Administrative"
 * 
 * @phase C3-R.5
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PieChart as PieChartIcon } from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { MetricsChartBaseProps } from '@/types/metricsChartTypes';

interface AdminFrequencyDistributionChartProps extends MetricsChartBaseProps {
  patients: Array<{ frequency: string }>;
  isLoading: boolean;
}

export function AdminFrequencyDistributionChart({ 
  patients,
  isLoading, 
}: AdminFrequencyDistributionChartProps) {
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

  // Calculate frequency distribution from patients
  const frequencyData = useMemo(() => {
    if (!patients || patients.length === 0) return [];

    const frequencyMap: Record<string, number> = {
      'weekly': 0,
      'biweekly': 0,
      'monthly': 0,
    };

    patients.forEach((p) => {
      const freq = p.frequency?.toLowerCase() || 'weekly';
      if (frequencyMap[freq] !== undefined) {
        frequencyMap[freq]++;
      }
    });

    const frequencyLabels: Record<string, string> = {
      'weekly': 'Semanal',
      'biweekly': 'Quinzenal',
      'monthly': 'Mensal',
    };

    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
    ];

    return Object.entries(frequencyMap)
      .filter(([_, count]) => count > 0)
      .map(([freq, count], index) => ({
        name: frequencyLabels[freq] || freq,
        value: count,
        color: colors[index] || 'hsl(var(--chart-1))',
      }));
  }, [patients]);

  if (frequencyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Distribuição por Frequência
          </CardTitle>
          <CardDescription>Distribuição de pacientes por frequência de sessões</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados suficientes para exibir distribuição de frequências neste período.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Chart configuration
  const chartConfig = {
    frequency: {
      label: 'Frequência',
      color: 'hsl(var(--chart-1))',
    },
  };

  const totalPatients = frequencyData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Distribuição por Frequência
        </CardTitle>
        <CardDescription>
          Distribuição de pacientes por frequência de sessões • Total: {totalPatients} pacientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={frequencyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => 
                  `${name}: ${(percent * 100).toFixed(1)}%`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {frequencyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const percent = ((value as number) / totalPatients * 100).toFixed(1);
                      return [`${value} pacientes (${percent}%)`, name];
                    }}
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
