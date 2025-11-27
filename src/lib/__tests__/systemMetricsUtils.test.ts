/**
 * 🧪 TESTES UNITÁRIOS: systemMetricsUtils.ts
 * 
 * Suíte de testes para validar a correção das métricas financeiras.
 * 
 * Cobertura:
 * - Fachadas públicas (getFinancialSummary, getFinancialTrends, getRetentionAndChurn)
 * - Funções de cálculo de baixo nível
 * - Edge cases e invariantes
 * 
 * @phase C3.1.5 - Testes Unitários
 */

import { describe, it, expect } from "vitest";
import {
  getFinancialSummary,
  getFinancialTrends,
  getRetentionAndChurn,
  calculateTotalRevenue,
  calculateTotalSessions,
  calculateMissedSessions,
  calculateMissedRatePercentage,
  calculateActivePatients,
  calculateLostRevenue,
  getForecastRevenue,
  getMonthlyRevenue,
  getMissedRate,
  getNewVsInactive,
} from "../systemMetricsUtils";

import {
  mockPatients,
  mockSessions,
  emptyDataset,
  allMissedDataset,
  allInactiveDataset,
} from "./fixtures/metricsTestData";

// ============================================================
// FACHADA PÚBLICA: getFinancialSummary
// ============================================================

describe("getFinancialSummary", () => {
  it("deve calcular corretamente o resumo financeiro para janeiro/2025", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");

    const summary = getFinancialSummary({
      sessions: mockSessions,
      patients: mockPatients,
      start,
      end,
    });

    // Sessões atendidas em jan/2025: session-9, session-11, session-12, session-13
    // Valores: 200 + 180 + 600 + 220 = 1200
    expect(summary.totalRevenue).toBe(1200);

    // Total de sessões atendidas
    expect(summary.totalSessions).toBe(4);

    // Taxa de falta: 1 falta visível (session-10) em 5 sessões visíveis (session-9, 10, 11, 12, 13, 14)
    // Nota: session-14 é rescheduled (não conta como falta), session-15 é hidden
    // Sessões visíveis: session-9 (attended), session-10 (missed), session-11 (attended), 
    //                   session-12 (attended), session-13 (attended), session-14 (rescheduled)
    // Faltas visíveis: session-10 (missed)
    // Taxa: 1/6 * 100 = 16.67%
    expect(summary.missedRate).toBeCloseTo(16.7, 0);

    // Ticket médio por sessão: 1200 / 4 = 300
    expect(summary.avgPerSession).toBe(300);

    // Pacientes ativos: patient-1, patient-2, patient-3, patient-5 = 4
    expect(summary.activePatients).toBe(4);

    // Receita perdida por faltas visíveis: session-10 (200)
    expect(summary.lostRevenue).toBe(200);

    // Ticket médio por paciente ativo: 1200 / 4 = 300
    expect(summary.avgRevenuePerActivePatient).toBe(300);

    // Previsão de receita (baseado em frequência)
    // patient-3 (mensal): 600
    // patient-1 (weekly): 200 * 4 = 800
    // patient-2 (biweekly): 180 * 2 = 360
    // patient-5 (weekly): 220 * 4 = 880
    // Total: 600 + 800 + 360 + 880 = 2640
    expect(summary.forecastRevenue).toBe(2640);
  });

  it("deve retornar valores zerados quando não há dados no período", () => {
    const start = new Date("2026-01-01");
    const end = new Date("2026-01-31");

    const summary = getFinancialSummary({
      sessions: mockSessions,
      patients: mockPatients,
      start,
      end,
    });

    expect(summary.totalRevenue).toBe(0);
    expect(summary.totalSessions).toBe(0);
    expect(summary.missedRate).toBe(0);
    expect(summary.avgPerSession).toBe(0);
    expect(summary.lostRevenue).toBe(0);
    expect(summary.avgRevenuePerActivePatient).toBe(0);
  });

  it("deve lidar com dataset vazio sem erros", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");

    const summary = getFinancialSummary({
      sessions: emptyDataset.sessions,
      patients: emptyDataset.patients,
      start,
      end,
    });

    expect(summary.totalRevenue).toBe(0);
    expect(summary.totalSessions).toBe(0);
    expect(summary.missedRate).toBe(0);
    expect(summary.activePatients).toBe(0);
    expect(summary.lostRevenue).toBe(0);
    expect(summary.forecastRevenue).toBe(0);
    
    // Não deve gerar NaN ou divisão por zero
    expect(summary.avgPerSession).toBe(0);
    expect(summary.avgRevenuePerActivePatient).toBe(0);
  });

  it("deve calcular corretamente quando há apenas faltas", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");

    const summary = getFinancialSummary({
      sessions: allMissedDataset.sessions,
      patients: allMissedDataset.patients,
      start,
      end,
    });

    expect(summary.totalRevenue).toBe(0); // Nenhuma sessão atendida
    expect(summary.totalSessions).toBe(0);
    expect(summary.missedRate).toBe(100); // 100% de faltas
    expect(summary.lostRevenue).toBe(400); // 2 faltas * 200
  });

  it("não deve gerar valores negativos ou NaN em nenhum campo", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");

    const summary = getFinancialSummary({
      sessions: mockSessions,
      patients: mockPatients,
      start,
      end,
    });

    // Validar invariantes
    expect(summary.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(summary.totalSessions).toBeGreaterThanOrEqual(0);
    expect(summary.missedRate).toBeGreaterThanOrEqual(0);
    expect(summary.missedRate).toBeLessThanOrEqual(100);
    expect(summary.avgPerSession).toBeGreaterThanOrEqual(0);
    expect(summary.activePatients).toBeGreaterThanOrEqual(0);
    expect(summary.lostRevenue).toBeGreaterThanOrEqual(0);
    expect(summary.avgRevenuePerActivePatient).toBeGreaterThanOrEqual(0);
    expect(summary.forecastRevenue).toBeGreaterThanOrEqual(0);

    // Nenhum campo deve ser NaN
    expect(Number.isNaN(summary.totalRevenue)).toBe(false);
    expect(Number.isNaN(summary.totalSessions)).toBe(false);
    expect(Number.isNaN(summary.missedRate)).toBe(false);
    expect(Number.isNaN(summary.avgPerSession)).toBe(false);
    expect(Number.isNaN(summary.activePatients)).toBe(false);
    expect(Number.isNaN(summary.lostRevenue)).toBe(false);
    expect(Number.isNaN(summary.avgRevenuePerActivePatient)).toBe(false);
    expect(Number.isNaN(summary.forecastRevenue)).toBe(false);
  });
});

// ============================================================
// FACHADA PÚBLICA: getFinancialTrends
// ============================================================

describe("getFinancialTrends", () => {
  it("deve gerar série temporal mensal correta para nov/2024 a jan/2025", () => {
    const start = new Date("2024-11-01");
    const end = new Date("2025-01-31");

    const trends = getFinancialTrends({
      sessions: mockSessions,
      patients: mockPatients,
      start,
      end,
      timeScale: "monthly",
    });

    // Deve ter 3 meses: Nov/24, Dez/24, Jan/25
    expect(trends).toHaveLength(3);

    // Verificar estrutura de cada ponto
    trends.forEach((point) => {
      expect(point).toHaveProperty("label");
      expect(point).toHaveProperty("date");
      expect(point).toHaveProperty("revenue");
      expect(point).toHaveProperty("sessions");
      expect(point).toHaveProperty("missedRate");
      expect(point).toHaveProperty("growth");

      expect(typeof point.label).toBe("string");
      expect(typeof point.date).toBe("string");
      expect(typeof point.revenue).toBe("number");
      expect(typeof point.sessions).toBe("number");
      expect(typeof point.missedRate).toBe("number");
      expect(typeof point.growth).toBe("number");
    });

    // Novembro 2024: session-1 (200) + session-2 (180) + session-3 (600, mensal)
    // Total: 980 (session-4 não conta porque paciente 3 é mensal)
    expect(trends[0].revenue).toBe(980);
    expect(trends[0].sessions).toBe(4); // 4 sessões realizadas

    // Dezembro 2024: session-5 (200) + session-7 (180) + session-8 (150)
    // Total: 530
    expect(trends[1].revenue).toBe(530);
    expect(trends[1].sessions).toBe(3);

    // Janeiro 2025: session-9 (200) + session-11 (180) + session-12 (600) + session-13 (220)
    // Total: 1200
    expect(trends[2].revenue).toBe(1200);
    expect(trends[2].sessions).toBe(4);
  });

  it("deve calcular crescimento mês-a-mês corretamente", () => {
    const start = new Date("2024-11-01");
    const end = new Date("2025-01-31");

    const trends = getFinancialTrends({
      sessions: mockSessions,
      patients: mockPatients,
      start,
      end,
      timeScale: "monthly",
    });

    // Primeiro mês deve ter crescimento 0
    expect(trends[0].growth).toBe(0);

    // Dezembro vs Novembro: (530 - 980) / 980 * 100 = -45.9%
    expect(trends[1].growth).toBeCloseTo(-45.9, 0);

    // Janeiro vs Dezembro: (1200 - 530) / 530 * 100 = 126.4%
    expect(trends[2].growth).toBeCloseTo(126.4, 0);
  });

  it("deve retornar lista de meses mesmo sem sessões", () => {
    const start = new Date("2026-01-01");
    const end = new Date("2026-03-31");

    const trends = getFinancialTrends({
      sessions: mockSessions,
      patients: mockPatients,
      start,
      end,
      timeScale: "monthly",
    });

    // Deve ter 3 meses mesmo sem dados
    expect(trends).toHaveLength(3);

    // Todos os valores devem ser 0
    trends.forEach((point) => {
      expect(point.revenue).toBe(0);
      expect(point.sessions).toBe(0);
      expect(point.missedRate).toBe(0);
    });
  });

  it("deve calcular taxa de falta mensal corretamente", () => {
    const start = new Date("2024-12-01");
    const end = new Date("2024-12-31");

    const trends = getFinancialTrends({
      sessions: mockSessions,
      patients: mockPatients,
      start,
      end,
      timeScale: "monthly",
    });

    // Dezembro: 1 falta (session-6) em 4 sessões visíveis
    // Taxa: 1/4 * 100 = 25%
    expect(trends[0].missedRate).toBe(25);
  });

  it("não deve gerar valores NaN ou negativos inválidos", () => {
    const start = new Date("2024-11-01");
    const end = new Date("2025-01-31");

    const trends = getFinancialTrends({
      sessions: mockSessions,
      patients: mockPatients,
      start,
      end,
      timeScale: "monthly",
    });

    trends.forEach((point) => {
      expect(Number.isNaN(point.revenue)).toBe(false);
      expect(Number.isNaN(point.sessions)).toBe(false);
      expect(Number.isNaN(point.missedRate)).toBe(false);
      expect(Number.isNaN(point.growth)).toBe(false);

      expect(point.revenue).toBeGreaterThanOrEqual(0);
      expect(point.sessions).toBeGreaterThanOrEqual(0);
      expect(point.missedRate).toBeGreaterThanOrEqual(0);
      expect(point.missedRate).toBeLessThanOrEqual(100);
    });
  });
});

// ============================================================
// FACHADA PÚBLICA: getRetentionAndChurn
// ============================================================

describe("getRetentionAndChurn", () => {
  it("deve calcular corretamente novos pacientes e inativos em 2025", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");

    const retention = getRetentionAndChurn({
      patients: mockPatients,
      start,
      end,
    });

    // Novos em janeiro: patient-5
    expect(retention.newPatients).toBe(1);

    // Inativos em janeiro: patient-4 (updated_at em 2025-01-15)
    expect(retention.inactivePatients).toBe(1);

    // Taxas de retenção devem estar entre 0 e 100
    expect(retention.retentionRate3m).toBeGreaterThanOrEqual(0);
    expect(retention.retentionRate3m).toBeLessThanOrEqual(100);
    expect(retention.retentionRate6m).toBeGreaterThanOrEqual(0);
    expect(retention.retentionRate6m).toBeLessThanOrEqual(100);
    expect(retention.retentionRate12m).toBeGreaterThanOrEqual(0);
    expect(retention.retentionRate12m).toBeLessThanOrEqual(100);

    // Churn = 100 - retenção (3m)
    expect(retention.churnRate).toBeCloseTo(100 - retention.retentionRate3m, 1);
  });

  it("deve retornar zeros para período sem pacientes", () => {
    const start = new Date("2026-01-01");
    const end = new Date("2026-01-31");

    const retention = getRetentionAndChurn({
      patients: mockPatients,
      start,
      end,
    });

    expect(retention.newPatients).toBe(0);
    expect(retention.inactivePatients).toBe(0);
  });

  it("deve lidar com dataset vazio sem erros", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");

    const retention = getRetentionAndChurn({
      patients: emptyDataset.patients,
      start,
      end,
    });

    expect(retention.newPatients).toBe(0);
    expect(retention.inactivePatients).toBe(0);
    expect(retention.retentionRate3m).toBe(0);
    expect(retention.retentionRate6m).toBe(0);
    expect(retention.retentionRate12m).toBe(0);
    expect(retention.churnRate).toBe(100);
  });

  it("deve validar invariantes (taxas entre 0-100, sem NaN)", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");

    const retention = getRetentionAndChurn({
      patients: mockPatients,
      start,
      end,
    });

    // Validar ranges
    expect(retention.newPatients).toBeGreaterThanOrEqual(0);
    expect(retention.inactivePatients).toBeGreaterThanOrEqual(0);
    expect(retention.retentionRate3m).toBeGreaterThanOrEqual(0);
    expect(retention.retentionRate3m).toBeLessThanOrEqual(100);
    expect(retention.retentionRate6m).toBeGreaterThanOrEqual(0);
    expect(retention.retentionRate6m).toBeLessThanOrEqual(100);
    expect(retention.retentionRate12m).toBeGreaterThanOrEqual(0);
    expect(retention.retentionRate12m).toBeLessThanOrEqual(100);
    expect(retention.churnRate).toBeGreaterThanOrEqual(0);
    expect(retention.churnRate).toBeLessThanOrEqual(100);

    // Validar sem NaN
    expect(Number.isNaN(retention.newPatients)).toBe(false);
    expect(Number.isNaN(retention.inactivePatients)).toBe(false);
    expect(Number.isNaN(retention.retentionRate3m)).toBe(false);
    expect(Number.isNaN(retention.retentionRate6m)).toBe(false);
    expect(Number.isNaN(retention.retentionRate12m)).toBe(false);
    expect(Number.isNaN(retention.churnRate)).toBe(false);
  });
});

// ============================================================
// FUNÇÕES DE BAIXO NÍVEL: Cálculos Básicos
// ============================================================

describe("calculateTotalRevenue", () => {
  it("deve calcular receita total considerando mensalistas", () => {
    // Janeiro: 200 + 180 + 600 + 220 = 1200
    const revenue = calculateTotalRevenue({
      sessions: mockSessions.filter((s) => s.date.startsWith("2025-01")),
      patients: mockPatients,
    });

    expect(revenue).toBe(1200);
  });

  it("deve retornar 0 para sessões vazias", () => {
    const revenue = calculateTotalRevenue({
      sessions: [],
      patients: mockPatients,
    });

    expect(revenue).toBe(0);
  });
});

describe("calculateTotalSessions", () => {
  it("deve contar apenas sessões atendidas", () => {
    const total = calculateTotalSessions({
      sessions: mockSessions.filter((s) => s.date.startsWith("2025-01")),
    });

    // session-9, session-11, session-12, session-13
    expect(total).toBe(4);
  });
});

describe("calculateMissedSessions", () => {
  it("deve contar apenas faltas visíveis", () => {
    const missed = calculateMissedSessions({
      sessions: mockSessions.filter((s) => s.date.startsWith("2025-01")),
    });

    // session-10 (visível), session-15 (oculta - não conta)
    expect(missed).toBe(1);
  });
});

describe("calculateMissedRatePercentage", () => {
  it("deve calcular taxa de falta corretamente", () => {
    const rate = calculateMissedRatePercentage({
      sessions: mockSessions.filter((s) => s.date.startsWith("2025-01")),
    });

    // 1 falta em 6 sessões visíveis = 16.7%
    expect(parseFloat(rate)).toBeCloseTo(16.7, 0);
  });

  it("deve retornar '0.0' para sessões vazias", () => {
    const rate = calculateMissedRatePercentage({
      sessions: [],
    });

    expect(rate).toBe("0.0");
  });
});

describe("calculateActivePatients", () => {
  it("deve contar apenas pacientes ativos", () => {
    const active = calculateActivePatients({
      patients: mockPatients,
    });

    // patient-1, patient-2, patient-3, patient-5
    expect(active).toBe(4);
  });
});

describe("calculateLostRevenue", () => {
  it("deve calcular receita perdida por faltas visíveis", () => {
    const lost = calculateLostRevenue({
      sessions: mockSessions.filter((s) => s.date.startsWith("2025-01")),
    });

    // session-10 (200)
    expect(lost).toBe(200);
  });
});

describe("getForecastRevenue", () => {
  it("deve prever receita mensal baseada em frequência", () => {
    const forecast = getForecastRevenue({
      patients: mockPatients.filter((p) => p.status === "active"),
    });

    // patient-1: 200 * 4 = 800
    // patient-2: 180 * 2 = 360
    // patient-3: 600 (mensal)
    // patient-5: 220 * 4 = 880
    // Total: 2640
    expect(forecast).toBe(2640);
  });
});

describe("getMonthlyRevenue", () => {
  it("deve agrupar receita por mês corretamente", () => {
    const start = new Date("2024-11-01");
    const end = new Date("2025-01-31");

    const monthly = getMonthlyRevenue({
      sessions: mockSessions,
      patients: mockPatients,
      start,
      end,
    });

    expect(monthly).toHaveLength(3);
    expect(monthly[0].receita).toBe(980); // Nov
    expect(monthly[1].receita).toBe(530); // Dez
    expect(monthly[2].receita).toBe(1200); // Jan
  });
});

describe("getMissedRate", () => {
  it("deve calcular taxa de falta mensal", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");

    const rates = getMissedRate({
      sessions: mockSessions,
      start,
      end,
    });

    expect(rates).toHaveLength(1);
    expect(rates[0].taxa).toBeCloseTo(16.7, 0);
    expect(rates[0].faltas).toBe(1);
  });
});

describe("getNewVsInactive", () => {
  it("deve listar novos e inativos por mês", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-31");

    const data = getNewVsInactive({
      patients: mockPatients,
      start,
      end,
    });

    expect(data).toHaveLength(1);
    expect(data[0].novos).toBe(1); // patient-5
    expect(data[0].encerrados).toBe(1); // patient-4
  });
});
