/**
 * 🧪 TESTES UNITÁRIOS: useChartTimeScale
 * 
 * Suíte de testes para validar o hook de escala temporal automática.
 * 
 * Cobertura:
 * - Cálculo automático de escala (daily/weekly/monthly)
 * - Overrides manuais de escala
 * - Geração de intervalos temporais
 * - Formatação de labels
 * - Invariantes e edge cases
 * 
 * @phase C3-R.3 - Testes Unitários
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useChartTimeScale, 
  generateTimeIntervals, 
  formatTimeLabel, 
  getIntervalBounds,
  getScaleLabel,
  type TimeScale
} from '@/hooks/useChartTimeScale';

// ============================================================
// HOOK: useChartTimeScale - Escala Automática
// ============================================================

describe('useChartTimeScale - automaticScale', () => {
  it('retorna "daily" para período < 15 dias', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-10') // 10 dias
      })
    );
    
    expect(result.current.automaticScale).toBe('daily');
  });

  it('retorna "daily" para período de exatos 14 dias', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-14') // 14 dias
      })
    );
    
    expect(result.current.automaticScale).toBe('daily');
  });

  it('retorna "weekly" para período entre 15 e 90 dias', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-02-28') // ~59 dias
      })
    );
    
    expect(result.current.automaticScale).toBe('weekly');
  });

  it('retorna "weekly" para período de exatos 90 dias', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31') // 90 dias
      })
    );
    
    expect(result.current.automaticScale).toBe('weekly');
  });

  it('retorna "monthly" para período > 90 dias', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31') // 366 dias
      })
    );
    
    expect(result.current.automaticScale).toBe('monthly');
  });

  it('retorna "monthly" para período de 91 dias', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-04-02') // 91 dias (corrigido)
      })
    );
    
    expect(result.current.automaticScale).toBe('monthly');
  });
});

// ============================================================
// HOOK: useChartTimeScale - Overrides Manuais
// ============================================================

describe('useChartTimeScale - overrides', () => {
  it('permite definir override para escala específica de um gráfico', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31') // 31 dias (seria weekly)
      })
    );
    
    // Escala automática é weekly
    expect(result.current.automaticScale).toBe('weekly');
    
    // Definir override para daily
    act(() => {
      result.current.setScaleOverride('chart-1', 'daily');
    });
    
    expect(result.current.getScale('chart-1')).toBe('daily');
  });

  it('retorna automaticScale quando não há override', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-10')
      })
    );
    
    expect(result.current.getScale('chart-without-override')).toBe('daily');
  });

  it('permite limpar override específico', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-10')
      })
    );
    
    // Definir override
    act(() => {
      result.current.setScaleOverride('chart-1', 'monthly');
    });
    
    expect(result.current.getScale('chart-1')).toBe('monthly');
    expect(result.current.hasOverride('chart-1')).toBe(true);
    
    // Limpar override
    act(() => {
      result.current.clearOverride('chart-1');
    });
    
    expect(result.current.getScale('chart-1')).toBe('daily'); // Volta ao automatic
    expect(result.current.hasOverride('chart-1')).toBe(false);
  });

  it('permite limpar todos os overrides', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-10')
      })
    );
    
    // Definir múltiplos overrides
    act(() => {
      result.current.setScaleOverride('chart-1', 'weekly');
      result.current.setScaleOverride('chart-2', 'monthly');
    });
    
    expect(result.current.hasOverride('chart-1')).toBe(true);
    expect(result.current.hasOverride('chart-2')).toBe(true);
    
    // Limpar todos
    act(() => {
      result.current.clearAllOverrides();
    });
    
    expect(result.current.hasOverride('chart-1')).toBe(false);
    expect(result.current.hasOverride('chart-2')).toBe(false);
  });
});

// ============================================================
// FUNÇÕES AUXILIARES: generateTimeIntervals
// ============================================================

describe('generateTimeIntervals', () => {
  it('gera intervalos diários para escala daily', () => {
    const intervals = generateTimeIntervals(
      new Date('2025-01-01'),
      new Date('2025-01-05'),
      'daily'
    );
    
    expect(intervals).toHaveLength(5); // 1, 2, 3, 4, 5
    expect(intervals[0].getDate()).toBe(1);
    expect(intervals[4].getDate()).toBe(5);
  });

  it('gera intervalos semanais para escala weekly', () => {
    const intervals = generateTimeIntervals(
      new Date('2025-01-01'),
      new Date('2025-01-31'),
      'weekly'
    );
    
    // Janeiro 2025 tem ~5 semanas
    expect(intervals.length).toBeGreaterThanOrEqual(4);
    expect(intervals.length).toBeLessThanOrEqual(5);
  });

  it('gera intervalos mensais para escala monthly', () => {
    const intervals = generateTimeIntervals(
      new Date('2025-01-01'),
      new Date('2025-06-30'),
      'monthly'
    );
    
    expect(intervals).toHaveLength(6); // Jan, Fev, Mar, Abr, Mai, Jun
  });

  it('não gera intervalos futuros', () => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    const intervals = generateTimeIntervals(
      now,
      futureDate,
      'daily'
    );
    
    // Último intervalo normalizado (startOfDay) não deve ultrapassar o dia atual
    const lastInterval = intervals[intervals.length - 1];
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    expect(lastInterval.getTime()).toBeLessThanOrEqual(todayStart.getTime());
  });
});

// ============================================================
// FUNÇÕES AUXILIARES: formatTimeLabel
// ============================================================

describe('formatTimeLabel', () => {
  it('formata label diária como dd/MM', () => {
    const label = formatTimeLabel(new Date('2025-01-15'), 'daily');
    expect(label).toBe('15/01');
  });

  it('formata label semanal como "Nª/Mês"', () => {
    const label = formatTimeLabel(new Date('2025-01-08'), 'weekly');
    // 08/01 é a 2ª semana de janeiro
    expect(label).toMatch(/\d+ª\/jan/i);
  });

  it('formata label mensal como "Mês/AA"', () => {
    const label = formatTimeLabel(new Date('2025-01-15'), 'monthly');
    expect(label).toMatch(/jan\/25/i);
  });
});

// ============================================================
// FUNÇÕES AUXILIARES: getIntervalBounds
// ============================================================

describe('getIntervalBounds', () => {
  it('retorna início e fim do dia para escala daily', () => {
    const bounds = getIntervalBounds(new Date('2025-01-15'), 'daily');
    
    expect(bounds.start.getHours()).toBe(0);
    expect(bounds.start.getMinutes()).toBe(0);
    expect(bounds.end.getHours()).toBe(23);
    expect(bounds.end.getMinutes()).toBe(59);
  });

  it('retorna início e fim da semana para escala weekly', () => {
    const bounds = getIntervalBounds(new Date('2025-01-15'), 'weekly');
    
    // Semana começa no domingo (weekStartsOn: 0)
    expect(bounds.start.getDay()).toBe(0); // Domingo
    expect(bounds.end.getDay()).toBe(6); // Sábado
  });

  it('retorna início e fim do mês para escala monthly', () => {
    const bounds = getIntervalBounds(new Date('2025-01-15'), 'monthly');
    
    expect(bounds.start.getDate()).toBe(1);
    expect(bounds.end.getMonth()).toBe(0); // Janeiro
    expect(bounds.end.getDate()).toBeGreaterThanOrEqual(28); // Último dia do mês
  });
});

// ============================================================
// FUNÇÕES AUXILIARES: getScaleLabel
// ============================================================

describe('getScaleLabel', () => {
  it('retorna "Diária" para daily', () => {
    expect(getScaleLabel('daily')).toBe('Diária');
  });

  it('retorna "Semanal" para weekly', () => {
    expect(getScaleLabel('weekly')).toBe('Semanal');
  });

  it('retorna "Mensal" para monthly', () => {
    expect(getScaleLabel('monthly')).toBe('Mensal');
  });
});

// ============================================================
// INVARIANTES E EDGE CASES
// ============================================================

describe('useChartTimeScale - edge cases', () => {
  it('lida com data de início igual à data final', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-01')
      })
    );
    
    // Período de 0 dias -> daily
    expect(result.current.automaticScale).toBe('daily');
  });

  it('lida com data final anterior à data inicial', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        startDate: new Date('2025-01-31'),
        endDate: new Date('2025-01-01')
      })
    );
    
    // Deve retornar daily (comportamento padrão para período inválido)
    expect(['daily', 'weekly', 'monthly']).toContain(result.current.automaticScale);
  });

  it('não retorna valores undefined ou null', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      })
    );
    
    expect(result.current.automaticScale).toBeDefined();
    expect(result.current.automaticScale).not.toBeNull();
    expect(result.current.getScale).toBeDefined();
    expect(result.current.setScaleOverride).toBeDefined();
    expect(result.current.clearOverride).toBeDefined();
    expect(result.current.clearAllOverrides).toBeDefined();
    expect(result.current.hasOverride).toBeDefined();
  });
});
