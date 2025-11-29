/**
 * 📊 GRÁFICO DE COMPARAÇÃO DE TICKET MÉDIO
 * 
 * Compara ticket médio entre pacientes mensais e semanais.
 * Sub-aba: "Distribuições" do domínio "Financial"
 * 
 * @phase C3-R.7
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign } from 'lucide-react';
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
import type { MetricsSession, MetricsPatient } from '@/lib/systemMetricsUtils';
import { getTicketComparison } from '@/lib/systemMetricsUtils';

interface FinancialTicketComparisonChartProps extends MetricsChartBaseProps {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
  isLoading: boolean;
}

export function FinancialTicketComparisonChart({ 
  sessions, 
  patients,
  isLoading, 
  periodFilter,
  timeScale
}: FinancialTicketComparisonChartProps) {
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

  const ticketData = useMemo(() => {
    if (!sessions || sessions.length === 0 || !patients || patients.length === 0) return [];
    return getTicketComparison({ sessions, patients });
  }, [sessions, patients]);

  if (ticketData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Ticket Médio: Mensais vs Semanais
          </CardTitle>
          <CardDescription>Comparação de faturamento médio por tipo de paciente</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados suficientes para comparar ticket médio.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    ticket: {
      label: 'Ticket Médio',
      color: 'hsl(var(--primary))',
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Ticket Médio: Mensais vs Semanais
        </CardTitle>
        <CardDescription>
          Comparação de faturamento médio por tipo de paciente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ticketData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="tipo" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                tickFormatter={formatCurrency}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => label}
                    formatter={(value, name, props) => {
                      const payload = props.payload;
                      return [
                        <div key="tooltip-content" className="space-y-1">
                          <div className="font-semibold">{formatCurrency(payload.ticket)}</div>
                          <div className="text-xs text-muted-foreground">
                            {payload.quantidade} pacientes
                          </div>
                        </div>,
                        'Ticket Médio'
                      ];
                    }}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={() => 'Ticket Médio (R$)'}
              />
              <Bar 
                dataKey="ticket" 
                fill="hsl(var(--primary))" 
                radius={[8, 8, 0, 0]}
                name="Ticket Médio"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          {ticketData.map(item => (
            <div key={item.tipo} className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">{item.tipo}</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(item.ticket)}</p>
              <p className="text-xs text-muted-foreground">{item.quantidade} pacientes</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
