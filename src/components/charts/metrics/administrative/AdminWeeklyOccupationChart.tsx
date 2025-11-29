/**
 * 📊 GRÁFICO DE OCUPAÇÃO SEMANAL
 * 
 * Visualiza a taxa de ocupação semanal baseado em horários disponíveis.
 * Sub-aba: "Desempenho" do domínio "Administrative"
 * 
 * @phase C3-R.5
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { MetricsChartBaseProps } from '@/types/metricsChartTypes';
import type { MetricsProfile } from '@/lib/systemMetricsUtils';
import { startOfWeek, format, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminWeeklyOccupationChartProps extends MetricsChartBaseProps {
  trends: Array<{ date: string; sessions: number; label?: string }>;
  profile: MetricsProfile | null;
  scheduleBlocks: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    start_date?: string | null;
    end_date?: string | null;
  }>;
  isLoading: boolean;
}

export function AdminWeeklyOccupationChart({ 
  trends, 
  profile,
  scheduleBlocks,
  isLoading, 
  periodFilter,
  timeScale
}: AdminWeeklyOccupationChartProps) {
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

  // Calculate weekly occupation rates
  const weeklyData = useMemo(() => {
    if (!trends || trends.length === 0 || !profile) return [];

    // Group sessions by week
    const weekMap = new Map<string, number>();
    
    trends.forEach((point) => {
      try {
        const date = parseISO(point.date);
        const weekStart = startOfWeek(date, { locale: ptBR });
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        
        const currentCount = weekMap.get(weekKey) || 0;
        weekMap.set(weekKey, currentCount + (point.sessions || 0));
      } catch (error) {
        console.error('Error parsing date:', point.date, error);
      }
    });

    // Calculate capacity for each week
    const slotDuration = profile.slot_duration || 50;
    const workDays = profile.work_days || [1, 2, 3, 4, 5];
    
    // Calculate base weekly capacity from work hours
    const calculateWeeklyCapacity = (weekStartDate: Date): number => {
      let totalMinutes = 0;
      
      // Check if we have schedule blocks for this week
      const relevantBlocks = scheduleBlocks.filter(block => {
        if (!block.start_date && !block.end_date) return true; // Permanent blocks
        
        const blockStart = block.start_date ? parseISO(block.start_date) : new Date(0);
        const blockEnd = block.end_date ? parseISO(block.end_date) : new Date('2099-12-31');
        
        return isWithinInterval(weekStartDate, { start: blockStart, end: blockEnd });
      });

      if (relevantBlocks.length > 0) {
        // Calculate from schedule blocks
        relevantBlocks.forEach(block => {
          const [startHour, startMin] = block.start_time.split(':').map(Number);
          const [endHour, endMin] = block.end_time.split(':').map(Number);
          const blockMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
          totalMinutes += blockMinutes;
        });
      } else {
        // Fallback to work hours from profile
        const workStartTime = profile.work_start_time || '08:00';
        const workEndTime = profile.work_end_time || '18:00';
        
        const [startHour, startMin] = workStartTime.split(':').map(Number);
        const [endHour, endMin] = workEndTime.split(':').map(Number);
        const dailyMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        
        totalMinutes = dailyMinutes * workDays.length;
      }
      
      return Math.floor(totalMinutes / slotDuration);
    };

    // Build result array
    const result = Array.from(weekMap.entries())
      .map(([weekKey, sessionCount]) => {
        const weekDate = parseISO(weekKey);
        const capacity = calculateWeeklyCapacity(weekDate);
        const occupationRate = capacity > 0 ? (sessionCount / capacity) * 100 : 0;
        
        return {
          weekLabel: format(weekDate, 'dd/MM', { locale: ptBR }),
          weekKey,
          occupationRate: parseFloat(occupationRate.toFixed(1)),
          sessionCount,
          capacity,
          fill: occupationRate > 90 
            ? 'hsl(var(--destructive))' 
            : occupationRate > 70 
            ? 'hsl(var(--warning))' 
            : 'hsl(var(--success))',
        };
      })
      .sort((a, b) => a.weekKey.localeCompare(b.weekKey));

    return result;
  }, [trends, profile, scheduleBlocks]);

  if (weeklyData.length === 0 || !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ocupação Semanal
          </CardTitle>
          <CardDescription>Taxa de ocupação por semana</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados suficientes para calcular ocupação semanal. Certifique-se de que o perfil e os horários de trabalho estão configurados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Chart configuration
  const chartConfig = {
    occupationRate: {
      label: 'Taxa de Ocupação (%)',
      color: 'hsl(var(--primary))',
    },
  };

  const avgOccupation = weeklyData.reduce((sum, week) => sum + week.occupationRate, 0) / weeklyData.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Ocupação Semanal
        </CardTitle>
        <CardDescription>
          Taxa de ocupação por semana • Média: {avgOccupation.toFixed(1)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                    labelFormatter={(label, payload) => {
                      const data = payload && payload[0]?.payload;
                      return data ? `Semana: ${label}` : label;
                    }}
                    formatter={(value, name, props) => {
                      const payload = props.payload;
                      return [
                        <div key="tooltip-content" className="space-y-1">
                          <div className="font-semibold">{value}%</div>
                          <div className="text-xs text-muted-foreground">
                            Sessões: {payload.sessionCount} de {payload.capacity} possíveis
                          </div>
                        </div>,
                        'Taxa de Ocupação'
                      ];
                    }}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={() => 'Taxa de Ocupação (%)'}
              />
              <ReferenceLine 
                y={100} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="3 3" 
                label={{ value: 'Capacidade Máxima', position: 'right' }}
              />
              <Bar 
                dataKey="occupationRate" 
                radius={[8, 8, 0, 0]}
                name="Ocupação"
              >
                {weeklyData.map((entry, index) => (
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
