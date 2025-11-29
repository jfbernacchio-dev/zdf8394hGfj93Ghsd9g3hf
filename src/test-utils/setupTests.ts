/**
 * ============================================================================
 * SETUP GLOBAL DE TESTES - VITEST
 * ============================================================================
 * 
 * Configuração global para todos os testes unitários e de integração.
 * Carrega mocks, polyfills e configurações antes da execução dos testes.
 * 
 * @phase C3-R.3 - Fase 1: Desbloqueio
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi, beforeAll } from 'vitest';
import { createPortal } from 'react-dom';

// ============================================================================
// 1. MOCK GLOBAL: Recharts (evita ResizeObserver)
// ============================================================================
vi.mock('recharts', () => {
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

// ============================================================================
// 2. POLYFILLS: ResizeObserver, IntersectionObserver, etc.
// ============================================================================
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: () => [],
}));

// ============================================================================
// 3. MOCK GLOBAL: localStorage
// ============================================================================
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// ============================================================================
// 4. MOCK GLOBAL: matchMedia
// ============================================================================
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ============================================================================
// 5. MOCK GLOBAL: createPortal (react-dom)
// ============================================================================
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: any) => node,
  };
});

// ============================================================================
// 6. LIMPEZA AUTOMÁTICA: afterEach
// ============================================================================
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ============================================================================
// 7. CONFIGURAÇÃO INICIAL: beforeAll
// ============================================================================
beforeAll(() => {
  // Silenciar console.error durante testes (opcional)
  // vi.spyOn(console, 'error').mockImplementation(() => {});
});
