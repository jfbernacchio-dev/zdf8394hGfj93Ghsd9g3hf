/**
 * 🥧 GRÁFICO DE DISTRIBUIÇÃO DE PACIENTES DA EQUIPE
 * 
 * Visualiza distribuição de pacientes ativos por terapeuta.
 * Sub-aba: "Distribuições" do domínio "Team"
 * 
 * @phase C3-R.6
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users } from 'lucide-react';
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
import type { MetricsPatient } from '@/lib/systemMetricsUtils';

interface TeamPatientDistributionChartProps extends MetricsChartBaseProps {
  patients: MetricsPatient[];
  isLoading: boolean;
}

export function TeamPatientDistributionChart({ 
  patients,
  isLoading, 
  periodFilter,
  timeScale
}: TeamPatientDistributionChartProps) {
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

  // Calculate patient distribution
  const distributionData = useMemo(() => {
    if (!patients || patients.length === 0) return [];

    // Get active patients only
    const activePatients = patients.filter(p => p.status === 'active');
    
    // Get unique therapist IDs
    const therapistIds = Array.from(new Set(activePatients.map(p => p.user_id)));

    // Calculate patient count for each therapist
    const data = therapistIds.map(userId => {
      const therapistPatients = activePatients.filter(p => p.user_id === userId);
      const therapistName = therapistPatients[0]?.name?.split(' ')[0] || `Terapeuta ${userId.substring(0, 8)}`;

      return {
        name: therapistName,
        value: therapistPatients.length,
        fill: `hsl(var(--chart-${(therapistIds.indexOf(userId) % 5) + 1}))`,
      };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

    return data;
  }, [patients]);

  if (distributionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Distribuição de Pacientes
          </CardTitle>
          <CardDescription>Pacientes ativos por terapeuta</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem pacientes ativos para exibir. Certifique-se de que há pacientes ativos em múltiplos terapeutas.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Chart configuration
  const chartConfig = {
    patientCount: {
      label: 'Pacientes',
      color: 'hsl(var(--primary))',
    },
  };

  const totalPatients = distributionData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Distribuição de Pacientes
        </CardTitle>
        <CardDescription>
          Pacientes ativos por terapeuta • Total: {totalPatients} pacientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ name, value, percent }) => 
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                labelLine={true}
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `${label}`}
                    formatter={(value, name) => {
                      const total = distributionData.reduce((sum, d) => sum + d.value, 0);
                      const percent = ((value as number) / total * 100).toFixed(1);
                      return [`${value} pacientes (${percent}%)`, 'Pacientes'];
                    }}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => value}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
