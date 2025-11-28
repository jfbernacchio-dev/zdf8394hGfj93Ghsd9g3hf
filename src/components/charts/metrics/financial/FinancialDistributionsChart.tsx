/**
 * 🥧 GRÁFICO DE DISTRIBUIÇÕES FINANCEIRAS
 * 
 * Visualiza distribuição de status de sessões (atendidas, faltas, etc.).
 * Sub-aba: "Distribuições" do domínio "Financial"
 * 
 * @phase C3.7
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
import type { SessionDistributionChartProps } from '@/types/metricsChartTypes';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export function FinancialDistributionsChart({ 
  summary,
  isLoading, 
}: SessionDistributionChartProps) {
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

  // Calculate distribution data from summary
  const distributionData = useMemo(() => {
    if (!summary) return [];

    const totalSessions = summary.totalSessions;
    const missedRate = summary.missedRate / 100; // Convert from percentage
    const missedSessions = Math.round(totalSessions * missedRate);
    const attendedSessions = totalSessions - missedSessions;

    return [
      { name: 'Atendidas', value: attendedSessions, color: 'hsl(var(--chart-1))' },
      { name: 'Faltas', value: missedSessions, color: 'hsl(var(--destructive))' },
    ];
  }, [summary]);

  if (!summary || distributionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Distribuição de Sessões
          </CardTitle>
          <CardDescription>Status das sessões no período</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados suficientes para exibir distribuição neste período.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Chart configuration
  const chartConfig = {
    attended: {
      label: 'Atendidas',
      color: 'hsl(var(--chart-1))',
    },
    missed: {
      label: 'Faltas',
      color: 'hsl(var(--destructive))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Distribuição de Sessões
        </CardTitle>
        <CardDescription>
          Status das sessões no período • Total: {summary.totalSessions} sessões
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData}
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
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const total = distributionData.reduce((sum, item) => sum + item.value, 0);
                      const percent = ((value as number) / total * 100).toFixed(1);
                      return [`${value} (${percent}%)`, name];
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
