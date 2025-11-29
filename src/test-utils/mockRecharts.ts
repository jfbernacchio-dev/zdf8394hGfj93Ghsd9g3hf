/**
 * Mock de Recharts para testes
 * 
 * Recharts tem problemas com jsdom devido a generics complexos e dependências de DOM.
 * Este helper simplifica os componentes para versões mockadas que apenas renderizam divs.
 */

import { vi } from 'vitest';

export const mockRecharts = () => {
  vi.mock('recharts', () => {
    // Componente mock genérico que aceita qualquer prop
    const MockComponent = (props: any) => null;

    return {
      ResponsiveContainer: MockComponent,
      LineChart: MockComponent,
      BarChart: MockComponent,
      AreaChart: MockComponent,
      ComposedChart: MockComponent,
      PieChart: MockComponent,
      Line: MockComponent,
      Bar: MockComponent,
      Area: MockComponent,
      Pie: MockComponent,
      XAxis: MockComponent,
      YAxis: MockComponent,
      Tooltip: MockComponent,
      Legend: MockComponent,
      CartesianGrid: MockComponent,
      Cell: MockComponent,
    };
  });
};
