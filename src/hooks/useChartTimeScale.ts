import { useState, useMemo } from 'react';
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type TimeScale = 'daily' | 'weekly' | 'monthly';

interface UseChartTimeScaleProps {
  startDate: Date;
  endDate: Date;
}

/**
 * Hook para determinar e gerenciar a escala de tempo dos gráficos
 * Regras automáticas:
 * - ≤ 2 semanas: Escala diária
 * - > 2 semanas e ≤ 3 meses: Escala semanal
 * - > 3 meses: Escala mensal
 */
export const useChartTimeScale = ({ startDate, endDate }: UseChartTimeScaleProps) => {
  const [overrides, setOverrides] = useState<Record<string, TimeScale>>({});

  // Calcula a escala automática baseada no período
  const automaticScale = useMemo(() => {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 14) {
      return 'daily' as TimeScale;
    } else if (daysDiff <= 90) {
      return 'weekly' as TimeScale;
    } else {
      return 'monthly' as TimeScale;
    }
  }, [startDate, endDate]);

  const getScale = (chartId: string): TimeScale => {
    return overrides[chartId] || automaticScale;
  };

  const setScaleOverride = (chartId: string, scale: TimeScale | null) => {
    setOverrides(prev => {
      if (scale === null) {
        const newOverrides = { ...prev };
        delete newOverrides[chartId];
        return newOverrides;
      }
      return { ...prev, [chartId]: scale };
    });
  };

  const clearOverride = (chartId: string) => {
    setScaleOverride(chartId, null);
  };

  const clearAllOverrides = () => {
    setOverrides({});
  };

  return {
    automaticScale,
    getScale,
    setScaleOverride,
    clearOverride,
    clearAllOverrides,
    hasOverride: (chartId: string) => chartId in overrides,
  };
};

/**
 * Gera intervalos de tempo baseado na escala
 */
export const generateTimeIntervals = (
  startDate: Date,
  endDate: Date,
  scale: TimeScale
): Date[] => {
  switch (scale) {
    case 'daily':
      return eachDayOfInterval({ start: startDate, end: endDate });
    case 'weekly':
      return eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 0 });
    case 'monthly':
      return eachMonthOfInterval({ start: startDate, end: endDate });
  }
};

/**
 * Formata a label do eixo X baseado na escala
 */
export const formatTimeLabel = (date: Date, scale: TimeScale): string => {
  switch (scale) {
    case 'daily':
      return format(date, 'dd/MM', { locale: ptBR });
    case 'weekly':
      return format(date, "'S'w", { locale: ptBR }); // S1, S2, etc.
    case 'monthly':
      return format(date, 'MMM/yy', { locale: ptBR });
  }
};

/**
 * Retorna o início e fim do período baseado na escala
 */
export const getIntervalBounds = (date: Date, scale: TimeScale): { start: Date; end: Date } => {
  switch (scale) {
    case 'daily':
      return {
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
        end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59),
      };
    case 'weekly':
      return {
        start: startOfWeek(date, { weekStartsOn: 0 }),
        end: endOfWeek(date, { weekStartsOn: 0 }),
      };
    case 'monthly':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
  }
};

/**
 * Retorna o nome traduzido da escala
 */
export const getScaleLabel = (scale: TimeScale): string => {
  switch (scale) {
    case 'daily':
      return 'Diária';
    case 'weekly':
      return 'Semanal';
    case 'monthly':
      return 'Mensal';
  }
};
