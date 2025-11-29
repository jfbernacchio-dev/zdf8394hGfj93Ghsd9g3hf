/**
 * 📊 GRÁFICO DE CARGA HORÁRIA DA EQUIPE
 * 
 * Visualiza carga horária semanal por terapeuta.
 * Sub-aba: "Distribuições" do domínio "Team"
 * 
 * @phase C3-R.6
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock } from 'lucide-react';
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
import type { MetricsChartBaseProps } from '@/types/metricsChartTypes';
import type { MetricsPatient, MetricsScheduleBlock, MetricsProfile } from '@/lib/systemMetricsUtils';

interface TeamWorkloadChartProps extends MetricsChartBaseProps {
  patients: MetricsPatient[];
  scheduleBlocks: MetricsScheduleBlock[];
  profiles: Record<string, MetricsProfile>;
  isLoading: boolean;
}

export function TeamWorkloadChart({ 
  patients,
  scheduleBlocks,
  profiles,
  isLoading, 
  periodFilter,
  timeScale
}: TeamWorkloadChartProps) {
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

  // Calculate workload by therapist
  const workloadData = useMemo(() => {
    if (!patients || patients.length === 0) return [];

    // Get unique therapist IDs
    const therapistIds = Array.from(new Set(patients.map(p => p.user_id)));

    // Calculate weekly hours for each therapist
    const data = therapistIds.map(userId => {
      const therapistPatients = patients.filter(p => p.user_id === userId && p.status === 'active');
      const therapistName = therapistPatients[0]?.name?.split(' ')[0] || `Terapeuta ${userId.substring(0, 8)}`;

      // Calculate weekly hours from schedule blocks
      const therapistBlocks = scheduleBlocks.filter(b => b.user_id === userId);
      let weeklyMinutes = 0;

      if (therapistBlocks.length > 0) {
        therapistBlocks.forEach(block => {
          const [startHour, startMin] = block.start_time.split(':').map(Number);
          const [endHour, endMin] = block.end_time.split(':').map(Number);
          const blockMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
          weeklyMinutes += blockMinutes;
        });
      } else {
        // Fallback to profile work_hours
        const profile = profiles[userId];
        if (profile && profile.work_start_time && profile.work_end_time && profile.work_days) {
          const [startHour, startMin] = profile.work_start_time.split(':').map(Number);
          const [endHour, endMin] = profile.work_end_time.split(':').map(Number);
          const dailyMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
          weeklyMinutes = dailyMinutes * profile.work_days.length;
        }
      }

      const weeklyHours = weeklyMinutes / 60;

      return {
        name: therapistName,
        weeklyHours: parseFloat(weeklyHours.toFixed(1)),
        activePatients: therapistPatients.length,
        fill: `hsl(var(--chart-${(therapistIds.indexOf(userId) % 5) + 1}))`,
      };
    })
    .filter(d => d.weeklyHours > 0)
    .sort((a, b) => b.weeklyHours - a.weeklyHours);

    return data;
  }, [patients, scheduleBlocks, profiles]);

  if (workloadData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Carga Horária
          </CardTitle>
          <CardDescription>Horas semanais por terapeuta</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados de carga horária. Certifique-se de que há blocos de agenda ou perfis configurados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Chart configuration
  const chartConfig = {
    weeklyHours: {
      label: 'Horas Semanais',
      color: 'hsl(var(--primary))',
    },
  };

  const totalHours = workloadData.reduce((sum, d) => sum + d.weeklyHours, 0);
  const avgHours = totalHours / workloadData.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Carga Horária
        </CardTitle>
        <CardDescription>
          Horas semanais por terapeuta • Total: {totalHours.toFixed(1)}h • Média: {avgHours.toFixed(1)}h
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                tickFormatter={(val) => `${val}h`}
                label={{ value: 'Horas Semanais', angle: -90, position: 'insideLeft' }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `${label}`}
                    formatter={(value, name, props) => {
                      const payload = props.payload;
                      return [
                        <div key="tooltip-content" className="space-y-1">
                          <div className="font-semibold">{payload.weeklyHours}h semanais</div>
                          <div className="text-xs text-muted-foreground">
                            Pacientes ativos: {payload.activePatients}
                          </div>
                        </div>,
                        'Carga Horária'
                      ];
                    }}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={() => 'Horas Semanais'}
              />
              <Bar 
                dataKey="weeklyHours" 
                radius={[8, 8, 0, 0]}
                name="Horas"
              >
                {workloadData.map((entry, index) => (
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
