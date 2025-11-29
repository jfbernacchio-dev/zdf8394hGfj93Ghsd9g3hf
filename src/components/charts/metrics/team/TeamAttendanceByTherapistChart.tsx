/**
 * 📈 GRÁFICO DE TAXA DE COMPARECIMENTO POR TERAPEUTA
 * 
 * Visualiza taxa de comparecimento individual de cada terapeuta ao longo do tempo.
 * Sub-aba: "Retenção" do domínio "Team"
 * 
 * @phase C3-R.6
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCheck } from 'lucide-react';
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
import type { MetricsSession, MetricsPatient } from '@/lib/systemMetricsUtils';
import { parseISO, startOfWeek, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TeamAttendanceByTherapistChartProps extends MetricsChartBaseProps {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
  isLoading: boolean;
}

export function TeamAttendanceByTherapistChart({ 
  sessions,
  patients,
  isLoading, 
  periodFilter,
  timeScale
}: TeamAttendanceByTherapistChartProps) {
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

  // Calculate attendance rate by therapist over time
  const attendanceData = useMemo(() => {
    if (!sessions || sessions.length === 0 || !patients || patients.length === 0) {
      return { data: [], therapistIds: [], therapistNames: {} };
    }

    // Group sessions by week and therapist
    const weekMap = new Map<string, Map<string, { attended: number; missed: number }>>();
    
    sessions.forEach((session) => {
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
      if (!weekData.has(therapistId)) {
        weekData.set(therapistId, { attended: 0, missed: 0 });
      }

      const therapistData = weekData.get(therapistId)!;
      if (session.status === 'attended') {
        therapistData.attended++;
      } else if (session.status === 'missed') {
        therapistData.missed++;
      }
    });

    // Get unique therapist IDs
    const therapistIds = Array.from(new Set(patients.map(p => p.user_id)));
    const therapistNames: Record<string, string> = {};
    
    therapistIds.forEach(userId => {
      const therapistPatients = patients.filter(p => p.user_id === userId);
      therapistNames[userId] = therapistPatients[0]?.name?.split(' ')[0] || `Terapeuta ${userId.substring(0, 8)}`;
    });

    // Build result array
    const result = Array.from(weekMap.entries())
      .map(([weekKey, therapistMap]) => {
        const weekDate = parseISO(weekKey);
        const dataPoint: any = {
          weekLabel: format(weekDate, 'dd/MM', { locale: ptBR }),
          weekKey,
        };

        therapistIds.forEach(userId => {
          const data = therapistMap.get(userId) || { attended: 0, missed: 0 };
          const total = data.attended + data.missed;
          const attendanceRate = total > 0 ? (data.attended / total) * 100 : 0;
          dataPoint[userId] = parseFloat(attendanceRate.toFixed(1));
        });

        return dataPoint;
      })
      .sort((a, b) => a.weekKey.localeCompare(b.weekKey));

    return { data: result, therapistIds, therapistNames };
  }, [sessions, patients]);

  if (attendanceData.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Taxa de Comparecimento por Terapeuta
          </CardTitle>
          <CardDescription>Taxa de comparecimento individual ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados suficientes para calcular comparecimento por terapeuta.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Chart configuration
  const chartConfig: Record<string, any> = {};
  attendanceData.therapistIds.forEach((userId, index) => {
    chartConfig[userId] = {
      label: attendanceData.therapistNames[userId],
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Taxa de Comparecimento por Terapeuta
        </CardTitle>
        <CardDescription>
          Taxa de comparecimento individual ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceData.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                label={{ value: 'Taxa de Comparecimento (%)', angle: -90, position: 'insideLeft' }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `Semana: ${label}`}
                    formatter={(value) => [`${value}%`, 'Comparecimento']}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <ReferenceLine 
                y={80} 
                stroke="hsl(var(--warning))" 
                strokeDasharray="3 3" 
                label={{ value: 'Meta 80%', position: 'right' }}
              />
              {attendanceData.therapistIds.map((userId, index) => (
                <Line 
                  key={userId}
                  type="monotone" 
                  dataKey={userId} 
                  name={attendanceData.therapistNames[userId]}
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
