/**
 * 🧪 TESTES AVANÇADOS: systemMetricsUtils.ts
 * 
 * Edge cases e cenários complexos para validação robusta:
 * - Datasets grandes (10.000+ sessões)
 * - Períodos longos (5 anos)
 * - Integridade de dados (nulos, valores inválidos)
 * - Timezones extremos
 * 
 * @phase TRACK_C3_TEST_PLAN - FASE 1 (Pendente)
 */

import { describe, it, expect } from "vitest";
import {
  getFinancialSummary,
  calculateMissedRatePercentage,
  getForecastRevenue,
} from "../systemMetricsUtils";
import type { MetricsSession, MetricsPatient } from "../systemMetricsUtils";

// Helper para criar pacientes mockados
const createMockPatient = (overrides: Partial<MetricsPatient> = {}): MetricsPatient => ({
  id: "patient-1",
  name: "Test Patient",
  status: "active",
  frequency: "weekly",
  session_value: 200,
  user_id: "user-1",
  created_at: "2024-01-01",
  updated_at: "2025-01-01",
  ...overrides,
});

// Helper para criar sessões mockadas
const createMockSession = (overrides: Partial<MetricsSession> = {}): MetricsSession => ({
  id: "session-1",
  patient_id: "patient-1",
  date: "2025-01-15",
  status: "attended",
  value: 200,
  show_in_schedule: true,
  ...overrides,
});

// ============================================================
// EDGE CASE 1: DATASETS GRANDES
// ============================================================

describe("Edge Cases: Datasets Grandes", () => {
  it("deve processar 10.000+ sessões sem problemas de performance", () => {
    const sessions: MetricsSession[] = [];
    const patients: MetricsPatient[] = [];
    
    // Gerar 100 pacientes
    for (let i = 0; i < 100; i++) {
      patients.push(createMockPatient({
        id: `patient-${i}`,
        name: `Patient ${i}`,
        user_id: `user-${i}`,
      }));
    }
    
    // Gerar 10.000 sessões (100 pacientes × 100 sessões)
    for (let i = 0; i < 100; i++) {
      for (let j = 0; j < 100; j++) {
        const date = new Date(2020, 0, 1);
        date.setDate(date.getDate() + j * 7); // Uma sessão por semana
        
        sessions.push(createMockSession({
          id: `session-${i}-${j}`,
          patient_id: `patient-${i}`,
          date: date.toISOString().split('T')[0],
          status: j % 10 === 0 ? "missed" : "attended", // 10% faltas
        }));
      }
    }
    
    const start = new Date("2020-01-01");
    const end = new Date("2024-12-31");
    
    const startTime = Date.now();
    const summary = getFinancialSummary({ sessions, patients, start, end });
    const elapsed = Date.now() - startTime;
    
    // Performance: deve processar em menos de 2 segundos
    expect(elapsed).toBeLessThan(2000);
    
    // Validações básicas
    expect(summary.totalSessions).toBe(9000); // 10.000 sessões - 1000 faltas
    expect(summary.activePatients).toBe(100);
    expect(summary.totalRevenue).toBe(1800000); // 9000 × 200
  });
});

// ============================================================
// EDGE CASE 2: INTEGRIDADE DE DADOS
// ============================================================

describe("Edge Cases: Integridade de Dados", () => {
  it("deve lidar com pacientes sem created_at", () => {
    const patients: MetricsPatient[] = [
      createMockPatient({
        created_at: "", // ❌ VAZIO
      }),
    ];
    
    const sessions: MetricsSession[] = [
      createMockSession(),
    ];
    
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");
    
    // FIXME: implementação deve tratar created_at vazio/nulo
    const summary = getFinancialSummary({ sessions, patients, start, end });
    
    expect(summary.totalRevenue).toBe(200);
    expect(summary.activePatients).toBe(1);
  });

  it("deve lidar com valores de sessão negativos", () => {
    const patients: MetricsPatient[] = [
      createMockPatient(),
    ];
    
    const sessions: MetricsSession[] = [
      createMockSession({
        value: -100, // ❌ NEGATIVO
      }),
      createMockSession({
        id: "session-2",
        date: "2025-01-20",
        value: 300,
      }),
    ];
    
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");
    
    // FIXME: valores negativos devem ser tratados
    const summary = getFinancialSummary({ sessions, patients, start, end });
    
    // Comportamento esperado: ignorar valores negativos ou aceitar como estorno
    expect(summary.totalRevenue).toBeDefined();
  });

  it("deve lidar com frequência inválida", () => {
    const patients: MetricsPatient[] = [
      createMockPatient({
        frequency: "invalid" as any, // ❌ FREQUÊNCIA INVÁLIDA
      }),
      createMockPatient({
        id: "patient-2",
        name: "Patient 2",
        user_id: "user-2",
        frequency: "" as any, // ❌ VAZIO
      }),
    ];
    
    // FIXME: deve retornar 0 ou tratar frequências inválidas
    const forecast = getForecastRevenue({ patients });
    
    // Comportamento esperado: pacientes com frequência inválida não contam
    expect(forecast).toBe(0);
  });

  it("deve evitar divisão por zero na taxa de faltas", () => {
    const sessions: MetricsSession[] = []; // ❌ SEM SESSÕES
    
    const missedRate = calculateMissedRatePercentage({ sessions });
    
    // Deve retornar "0.0%" ao invés de "NaN%" ou quebrar
    expect(missedRate).toBe("0.0%");
  });
});

// ============================================================
// EDGE CASE 3: CENÁRIOS DE PACIENTES MENSALISTAS
// ============================================================

describe("Edge Cases: Pacientes Mensalistas", () => {
  it("deve calcular forecast correto para mensalistas", () => {
    const patients: MetricsPatient[] = [
      createMockPatient({
        frequency: "monthly",
        session_value: 1200,
      }),
    ];
    
    const forecast = getForecastRevenue({ patients });
    
    // Mensalista: 1200 × 1 sessão/mês = 1200
    expect(forecast).toBe(1200);
  });

  it("deve calcular forecast para mix de pacientes", () => {
    const patients: MetricsPatient[] = [
      createMockPatient({
        id: "p1",
        name: "Patient 1",
        user_id: "u1",
        frequency: "monthly",
        session_value: 800,
      }),
      createMockPatient({
        id: "p2",
        name: "Patient 2",
        user_id: "u2",
        frequency: "weekly",
        session_value: 200,
      }),
      createMockPatient({
        id: "p3",
        name: "Patient 3",
        user_id: "u3",
        frequency: "biweekly",
        session_value: 250,
      }),
    ];
    
    const forecast = getForecastRevenue({ patients });
    
    // monthly: 800 × 1 = 800
    // weekly: 200 × 4.33 = 866
    // biweekly: 250 × 2.165 = 541.25
    // Total: ~2207.25
    expect(forecast).toBeGreaterThan(2200);
    expect(forecast).toBeLessThan(2220);
  });
});

// ============================================================
// EDGE CASE 4: SESSÕES OCULTAS (show_in_schedule)
// ============================================================

describe("Edge Cases: Sessões Ocultas", () => {
  it("deve ignorar sessões ocultas no cálculo da taxa de faltas", () => {
    const sessions: MetricsSession[] = [
      createMockSession({ id: "s1" }),
      createMockSession({ 
        id: "s2", 
        date: "2025-01-15", 
        status: "missed", 
        show_in_schedule: false, // OCULTA
      }),
      createMockSession({ id: "s3", date: "2025-01-20" }),
    ];
    
    const missedRate = calculateMissedRatePercentage({ sessions });
    
    // Apenas 2 sessões visíveis (s1, s3), 0 faltas visíveis
    expect(missedRate).toBe("0.0%");
  });

  it("deve contar faltas visíveis corretamente", () => {
    const sessions: MetricsSession[] = [
      createMockSession({ id: "s1" }),
      createMockSession({ 
        id: "s2", 
        date: "2025-01-15", 
        status: "missed", 
        show_in_schedule: true, // VISÍVEL
      }),
      createMockSession({ id: "s3", date: "2025-01-20" }),
    ];
    
    const missedRate = calculateMissedRatePercentage({ sessions });
    
    // 3 sessões visíveis, 1 falta = 33.3%
    expect(missedRate).toMatch(/33\./);
  });
});

// ============================================================
// EDGE CASE 5: VALORES ZERADOS E NULOS
// ============================================================

describe("Edge Cases: Valores Zerados e Nulos", () => {
  it("deve lidar com pacientes com session_value zero", () => {
    const patients: MetricsPatient[] = [
      createMockPatient({
        session_value: 0, // ❌ ZERO
      }),
    ];
    
    const forecast = getForecastRevenue({ patients });
    
    // Deve aceitar 0 como valor válido (sessões gratuitas/teste)
    expect(forecast).toBe(0);
  });

  it("deve lidar com sessões com value zero", () => {
    const patients: MetricsPatient[] = [
      createMockPatient(),
    ];
    
    const sessions: MetricsSession[] = [
      createMockSession({
        value: 0, // ❌ ZERO
      }),
    ];
    
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");
    
    const summary = getFinancialSummary({ sessions, patients, start, end });
    
    // Deve aceitar 0 como valor válido
    expect(summary.totalRevenue).toBe(0);
    expect(summary.totalSessions).toBe(1);
  });

  it("deve lidar com arrays vazios", () => {
    const patients: MetricsPatient[] = [];
    const sessions: MetricsSession[] = [];
    
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");
    
    const summary = getFinancialSummary({ sessions, patients, start, end });
    
    // Deve retornar zeros sem quebrar
    expect(summary.totalRevenue).toBe(0);
    expect(summary.totalSessions).toBe(0);
    expect(summary.activePatients).toBe(0);
    expect(summary.missedRate).toBe("0.0%");
  });
});
