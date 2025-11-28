/**
 * 📊 GRÁFICO DE OVERVIEW DE WEBSITE (MOCKADO)
 * 
 * Visualiza dados fictícios de website (views, visitors).
 * Sub-aba: "Website" do domínio "Marketing"
 * 
 * ATENÇÃO: Dados mockados para demonstração. 
 * Integração com Google Analytics será feita em fase futura.
 * 
 * @phase C3.7
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, AlertCircle } from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import type { MockChartProps } from '@/types/metricsChartTypes';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export function MarketingWebsiteOverviewChart({ 
  isLoading, 
}: MockChartProps) {
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

  // Generate mock data (30 days)
  const mockData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate pseudo-random but stable data based on day
      const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
      const baseViews = 80 + (dayOfYear % 40);
      const baseVisitors = 30 + (dayOfYear % 20);
      
      data.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        views: baseViews + Math.floor(Math.random() * 20),
        visitors: baseVisitors + Math.floor(Math.random() * 10),
      });
    }
    
    return data;
  }, []);

  // Chart configuration
  const chartConfig = {
    views: {
      label: 'Visualizações',
      color: 'hsl(var(--chart-1))',
    },
    visitors: {
      label: 'Visitantes',
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <div className="space-y-4">
      {/* Warning Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Dados de Exemplo:</strong> Estes são dados fictícios para demonstração. 
          A integração com Google Analytics será implementada em uma fase futura.
        </AlertDescription>
      </Alert>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Tráfego do Website (Exemplo)
          </CardTitle>
          <CardDescription>
            Visualizações e visitantes únicos dos últimos 30 dias (dados fictícios)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                  }
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => 
                    value === 'views' ? 'Visualizações' : 'Visitantes'
                  }
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-1))', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Visualizações"
                />
                <Line 
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Visitantes"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
