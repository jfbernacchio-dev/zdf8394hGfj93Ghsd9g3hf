/**
 * 📈 GRÁFICO DE TAXA DE OCUPAÇÃO POR MEMBRO DA EQUIPE
 * 
 * Visualiza taxa de ocupação individual de cada terapeuta ao longo do tempo.
 * Sub-aba: "Retenção" do domínio "Team"
 * 
 * @phase C3-R.6
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity } from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { MetricsChartBaseProps } from '@/types/metricsChartTypes';
import type { MetricsSession, MetricsPatient, MetricsScheduleBlock, MetricsProfile } from '@/lib/systemMetricsUtils';
import { parseISO, startOfWeek, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TeamOccupationByMemberChartProps extends MetricsChartBaseProps {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
  scheduleBlocks: MetricsScheduleBlock[];
  profiles: Record<string, MetricsProfile>;
  isLoading: boolean;
}

export function TeamOccupationByMemberChart({ 
  sessions,
  patients,
  scheduleBlocks,
  profiles,
  isLoading, 
  periodFilter,
  timeScale
}: TeamOccupationByMemberChartProps) {
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

  // Calculate occupation by member over time
  const occupationData = useMemo(() => {
    if (!sessions || sessions.length === 0 || !patients || patients.length === 0) {
      return { data: [], therapistIds: [], therapistNames: {} };
    }

    // Group sessions by week and therapist
    const weekMap = new Map<string, Map<string, number>>();
    
    sessions.forEach((session) => {
      if (session.status !== 'attended') return;
      
      const patient = patients.find(p => p.id === session.patient_id);
      if (!patient) return;

      const date = parseISO(session.date);
      const weekStart = startOfWeek(date, { locale: ptBR });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      const therapistId = patient.user_id;

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, new Map());
      }
      
      const weekData = weekMap.get(weekKey)!;
      weekData.set(therapistId, (weekData.get(therapistId) || 0) + 1);
    });

    // Get unique therapist IDs
    const therapistIds = Array.from(new Set(patients.map(p => p.user_id)));
    const therapistNames: Record<string, string> = {};
    
    therapistIds.forEach(userId => {
      therapistNames[userId] = profiles[userId]?.full_name?.split(' ')[0] || `Terapeuta ${userId.substring(0, 8)}`;
    });

    // Calculate capacity for each therapist
    const calculateWeeklyCapacity = (userId: string): number => {
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
        const profile = profiles[userId];
        if (profile && profile.work_start_time && profile.work_end_time && profile.work_days) {
          const [startHour, startMin] = profile.work_start_time.split(':').map(Number);
          const [endHour, endMin] = profile.work_end_time.split(':').map(Number);
          const dailyMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
          weeklyMinutes = dailyMinutes * profile.work_days.length;
        }
      }

      const slotDuration = profiles[userId]?.slot_duration || 50;
      return Math.floor(weeklyMinutes / slotDuration);
    };

    // Build result array
    const result = Array.from(weekMap.entries())
      .map(([weekKey, therapistMap]) => {
        const weekDate = parseISO(weekKey);
        const dataPoint: any = {
          weekLabel: format(weekDate, 'dd/MM', { locale: ptBR }),
          weekKey,
        };

        therapistIds.forEach(userId => {
          const sessionCount = therapistMap.get(userId) || 0;
          const capacity = calculateWeeklyCapacity(userId);
          const occupationRate = capacity > 0 ? (sessionCount / capacity) * 100 : 0;
          dataPoint[userId] = parseFloat(occupationRate.toFixed(1));
        });

        return dataPoint;
      })
      .sort((a, b) => a.weekKey.localeCompare(b.weekKey));

    return { data: result, therapistIds, therapistNames };
  }, [sessions, patients, scheduleBlocks, profiles]);

  if (occupationData.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Taxa de Ocupação por Membro
          </CardTitle>
          <CardDescription>Taxa de ocupação individual ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados suficientes para calcular ocupação por membro.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Chart configuration
  const chartConfig: Record<string, any> = {};
  occupationData.therapistIds.forEach((userId, index) => {
    chartConfig[userId] = {
      label: occupationData.therapistNames[userId],
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Taxa de Ocupação por Membro
        </CardTitle>
        <CardDescription>
          Taxa de ocupação individual ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={occupationData.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="weekLabel" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{ value: 'Semana', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
                label={{ value: 'Taxa de Ocupação (%)', angle: -90, position: 'insideLeft' }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `Semana: ${label}`}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <ReferenceLine 
                y={100} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="3 3" 
                label={{ value: 'Capacidade Máxima', position: 'right' }}
              />
              {occupationData.therapistIds.map((userId, index) => (
                <Line 
                  key={userId}
                  type="monotone" 
                  dataKey={userId} 
                  name={occupationData.therapistNames[userId]}
                  stroke={`hsl(var(--chart-${(index % 5) + 1}))`}
                  strokeWidth={2}
                  dot={{ fill: `hsl(var(--chart-${(index % 5) + 1}))`, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
