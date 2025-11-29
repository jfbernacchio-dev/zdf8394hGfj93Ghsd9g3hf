/**
 * 🧪 TESTES UNITÁRIOS: metricsSectionsConfig.ts
 * 
 * Validação do sistema de configuração de seções e sub-abas de métricas.
 * 
 * Cobertura:
 * - getSectionsForDomain
 * - getSubTabsForDomain
 * - getDefaultSubTabForDomain
 * - isSectionValid
 * - isSubTabValidForDomain
 * 
 * @phase TRACK_C3_TEST_PLAN - FASE 5 (Helpers)
 */

import { describe, it, expect } from "vitest";
import {
  METRICS_SECTIONS,
  METRICS_SUBTABS,
  getSectionsForDomain,
  getSubTabsForDomain,
  getDefaultSubTabForDomain,
  isSectionValid,
  isSubTabValidForDomain,
  type MetricsDomain,
} from "../metricsSectionsConfig";

// ============================================================
// CONSTANTES DO REGISTRY
// ============================================================

describe("Constantes do Registry", () => {
  it("deve ter exatamente 4 seções principais", () => {
    expect(METRICS_SECTIONS).toHaveLength(4);
  });

  it("deve ter seções para todos os domínios", () => {
    const domains = METRICS_SECTIONS.map(s => s.domain);
    expect(domains).toContain("financial");
    expect(domains).toContain("administrative");
    expect(domains).toContain("marketing");
    expect(domains).toContain("team");
  });

  it("deve ter 11 sub-abas no total", () => {
    // Financial: 4, Administrative: 3, Marketing: 1, Team: 3 = 11
    expect(METRICS_SUBTABS).toHaveLength(11);
  });

  it("cada seção deve ter ID único", () => {
    const ids = METRICS_SECTIONS.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ============================================================
// getSectionsForDomain
// ============================================================

describe("getSectionsForDomain", () => {
  it("deve retornar 1 seção para financial", () => {
    const sections = getSectionsForDomain("financial");
    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe("metrics-financial");
    expect(sections[0].domain).toBe("financial");
  });

  it("deve retornar 1 seção para administrative", () => {
    const sections = getSectionsForDomain("administrative");
    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe("metrics-administrative");
    expect(sections[0].domain).toBe("administrative");
  });

  it("deve retornar 1 seção para marketing", () => {
    const sections = getSectionsForDomain("marketing");
    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe("metrics-marketing");
    expect(sections[0].domain).toBe("marketing");
  });

  it("deve retornar 1 seção para team", () => {
    const sections = getSectionsForDomain("team");
    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe("metrics-team");
    expect(sections[0].domain).toBe("team");
  });

  it("cada seção deve ter título e descrição", () => {
    const domains: MetricsDomain[] = ["financial", "administrative", "marketing", "team"];
    
    domains.forEach(domain => {
      const sections = getSectionsForDomain(domain);
      sections.forEach(section => {
        expect(section.title).toBeTruthy();
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.description).toBeTruthy();
      });
    });
  });
});

// ============================================================
// getSubTabsForDomain
// ============================================================

describe("getSubTabsForDomain", () => {
  it("deve retornar 4 sub-abas para financial", () => {
    const subTabs = getSubTabsForDomain("financial");
    expect(subTabs).toHaveLength(4);
    
    const ids = subTabs.map(s => s.id);
    expect(ids).toContain("distribuicoes");
    expect(ids).toContain("desempenho");
    expect(ids).toContain("tendencias");
    expect(ids).toContain("retencao");
  });

  it("deve retornar 3 sub-abas para administrative", () => {
    const subTabs = getSubTabsForDomain("administrative");
    expect(subTabs).toHaveLength(3);
    
    const ids = subTabs.map(s => s.id);
    expect(ids).toContain("distribuicoes");
    expect(ids).toContain("desempenho");
    expect(ids).toContain("retencao");
  });

  it("deve retornar 1 sub-aba para marketing", () => {
    const subTabs = getSubTabsForDomain("marketing");
    expect(subTabs).toHaveLength(1);
    
    expect(subTabs[0].id).toBe("website");
    expect(subTabs[0].chartCategory).toBe("website");
  });

  it("deve retornar 3 sub-abas para team", () => {
    const subTabs = getSubTabsForDomain("team");
    expect(subTabs).toHaveLength(3);
    
    const ids = subTabs.map(s => s.id);
    expect(ids).toContain("desempenho");
    expect(ids).toContain("distribuicoes");
    expect(ids).toContain("retencao");
  });

  it("todas as sub-abas devem ter label e chartCategory", () => {
    const domains: MetricsDomain[] = ["financial", "administrative", "marketing", "team"];
    
    domains.forEach(domain => {
      const subTabs = getSubTabsForDomain(domain);
      subTabs.forEach(subTab => {
        expect(subTab.label).toBeTruthy();
        expect(subTab.label.length).toBeGreaterThan(0);
        expect(subTab.chartCategory).toBeTruthy();
      });
    });
  });

  it("sub-abas do mesmo ID devem ter o mesmo label em diferentes domínios", () => {
    const financialDistribuicoes = getSubTabsForDomain("financial").find(s => s.id === "distribuicoes");
    const adminDistribuicoes = getSubTabsForDomain("administrative").find(s => s.id === "distribuicoes");
    
    expect(financialDistribuicoes?.label).toBe(adminDistribuicoes?.label);
  });
});

// ============================================================
// getDefaultSubTabForDomain
// ============================================================

describe("getDefaultSubTabForDomain", () => {
  it("deve retornar primeira sub-aba para financial", () => {
    const defaultSubTab = getDefaultSubTabForDomain("financial");
    expect(defaultSubTab).toBe("distribuicoes");
  });

  it("deve retornar primeira sub-aba para administrative", () => {
    const defaultSubTab = getDefaultSubTabForDomain("administrative");
    expect(defaultSubTab).toBe("distribuicoes");
  });

  it("deve retornar primeira sub-aba para marketing", () => {
    const defaultSubTab = getDefaultSubTabForDomain("marketing");
    expect(defaultSubTab).toBe("website");
  });

  it("deve retornar primeira sub-aba para team", () => {
    const defaultSubTab = getDefaultSubTabForDomain("team");
    expect(defaultSubTab).toBe("desempenho");
  });

  it("nunca deve retornar undefined para domínios válidos", () => {
    const domains: MetricsDomain[] = ["financial", "administrative", "marketing", "team"];
    
    domains.forEach(domain => {
      const defaultSubTab = getDefaultSubTabForDomain(domain);
      expect(defaultSubTab).toBeDefined();
      expect(defaultSubTab).not.toBe("");
    });
  });
});

// ============================================================
// isSectionValid
// ============================================================

describe("isSectionValid", () => {
  it("deve retornar true para IDs válidos", () => {
    expect(isSectionValid("metrics-financial")).toBe(true);
    expect(isSectionValid("metrics-administrative")).toBe(true);
    expect(isSectionValid("metrics-marketing")).toBe(true);
    expect(isSectionValid("metrics-team")).toBe(true);
  });

  it("deve retornar false para IDs inválidos", () => {
    expect(isSectionValid("invalid-section")).toBe(false);
    expect(isSectionValid("metrics-clinical")).toBe(false);
    expect(isSectionValid("")).toBe(false);
    expect(isSectionValid("financial")).toBe(false); // sem prefixo "metrics-"
  });

  it("deve ser case-sensitive", () => {
    expect(isSectionValid("metrics-Financial")).toBe(false);
    expect(isSectionValid("METRICS-FINANCIAL")).toBe(false);
  });

  it("deve validar todos os IDs do registry", () => {
    METRICS_SECTIONS.forEach(section => {
      expect(isSectionValid(section.id)).toBe(true);
    });
  });
});

// ============================================================
// isSubTabValidForDomain
// ============================================================

describe("isSubTabValidForDomain", () => {
  it("deve retornar true para combinações válidas em financial", () => {
    expect(isSubTabValidForDomain("distribuicoes", "financial")).toBe(true);
    expect(isSubTabValidForDomain("desempenho", "financial")).toBe(true);
    expect(isSubTabValidForDomain("tendencias", "financial")).toBe(true);
    expect(isSubTabValidForDomain("retencao", "financial")).toBe(true);
  });

  it("deve retornar false para sub-aba inválida em financial", () => {
    expect(isSubTabValidForDomain("website", "financial")).toBe(false);
    expect(isSubTabValidForDomain("invalid", "financial")).toBe(false);
  });

  it("deve retornar true para combinações válidas em administrative", () => {
    expect(isSubTabValidForDomain("distribuicoes", "administrative")).toBe(true);
    expect(isSubTabValidForDomain("desempenho", "administrative")).toBe(true);
    expect(isSubTabValidForDomain("retencao", "administrative")).toBe(true);
  });

  it("deve retornar false para tendencias em administrative", () => {
    expect(isSubTabValidForDomain("tendencias", "administrative")).toBe(false);
  });

  it("deve retornar true para website em marketing", () => {
    expect(isSubTabValidForDomain("website", "marketing")).toBe(true);
  });

  it("deve retornar false para outras sub-abas em marketing", () => {
    expect(isSubTabValidForDomain("distribuicoes", "marketing")).toBe(false);
    expect(isSubTabValidForDomain("desempenho", "marketing")).toBe(false);
    expect(isSubTabValidForDomain("tendencias", "marketing")).toBe(false);
    expect(isSubTabValidForDomain("retencao", "marketing")).toBe(false);
  });

  it("deve retornar true para combinações válidas em team", () => {
    expect(isSubTabValidForDomain("desempenho", "team")).toBe(true);
    expect(isSubTabValidForDomain("distribuicoes", "team")).toBe(true);
    expect(isSubTabValidForDomain("retencao", "team")).toBe(true);
  });

  it("deve retornar false para tendencias em team", () => {
    expect(isSubTabValidForDomain("tendencias", "team")).toBe(false);
  });

  it("deve ser case-sensitive para sub-aba", () => {
    expect(isSubTabValidForDomain("Distribuicoes", "financial")).toBe(false);
    expect(isSubTabValidForDomain("TENDENCIAS", "financial")).toBe(false);
  });

  it("deve validar todas as combinações do registry", () => {
    METRICS_SUBTABS.forEach(subTab => {
      expect(isSubTabValidForDomain(subTab.id, subTab.domain)).toBe(true);
    });
  });
});

// ============================================================
// EDGE CASES
// ============================================================

describe("Edge Cases", () => {
  it("deve lidar com strings vazias", () => {
    expect(isSectionValid("")).toBe(false);
    expect(isSubTabValidForDomain("", "financial")).toBe(false);
    expect(getDefaultSubTabForDomain("" as any)).toBeUndefined();
  });

  it("deve lidar com valores undefined", () => {
    expect(isSectionValid(undefined as any)).toBe(false);
    expect(isSubTabValidForDomain(undefined as any, "financial")).toBe(false);
  });

  it("deve lidar com null", () => {
    expect(isSectionValid(null as any)).toBe(false);
    expect(isSubTabValidForDomain(null as any, "financial")).toBe(false);
  });

  it("getSubTabsForDomain deve retornar array vazio para domínio inexistente", () => {
    const subTabs = getSubTabsForDomain("invalid" as any);
    expect(subTabs).toEqual([]);
  });

  it("getSectionsForDomain deve retornar array vazio para domínio inexistente", () => {
    const sections = getSectionsForDomain("invalid" as any);
    expect(sections).toEqual([]);
  });
});
