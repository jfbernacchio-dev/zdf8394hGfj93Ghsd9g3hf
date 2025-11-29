/**
 * 🧪 TESTES UNITÁRIOS: metricsCardRegistry.tsx
 * 
 * Validação do registry centralizado de cards de métricas.
 * 
 * Cobertura:
 * - getMetricsCardById
 * - getMetricsCardsByDomain
 * - canUserViewCard
 * - getAllCardIds
 * - getCardIdsByDomain
 * - getDefaultCardLayout
 * - isValidCardId
 * 
 * @phase TRACK_C3_TEST_PLAN - FASE 5 (Helpers)
 */

import { describe, it, expect } from "vitest";
import {
  METRICS_CARD_REGISTRY,
  getMetricsCardById,
  getMetricsCardsByDomain,
  canUserViewCard,
  getAllCardIds,
  getCardIdsByDomain,
  getDefaultCardLayout,
  isValidCardId,
} from "../metricsCardRegistry";

// ============================================================
// CONSTANTES DO REGISTRY
// ============================================================

describe("Constantes do Registry", () => {
  it("deve ter exatamente 12 cards registrados", () => {
    const cardCount = Object.keys(METRICS_CARD_REGISTRY).length;
    expect(cardCount).toBe(12);
  });

  it("deve ter 5 cards financial", () => {
    const financialCards = Object.values(METRICS_CARD_REGISTRY).filter(c => c.domain === "financial");
    expect(financialCards).toHaveLength(5);
  });

  it("deve ter 3 cards administrative", () => {
    const adminCards = Object.values(METRICS_CARD_REGISTRY).filter(c => c.domain === "administrative");
    expect(adminCards).toHaveLength(3);
  });

  it("deve ter 4 cards marketing", () => {
    const marketingCards = Object.values(METRICS_CARD_REGISTRY).filter(c => c.domain === "marketing");
    expect(marketingCards).toHaveLength(4);
  });

  it("deve ter 0 cards team", () => {
    const teamCards = Object.values(METRICS_CARD_REGISTRY).filter(c => c.domain === "team");
    expect(teamCards).toHaveLength(0);
  });

  it("todos os cards devem ter campos obrigatórios", () => {
    Object.values(METRICS_CARD_REGISTRY).forEach(card => {
      expect(card.id).toBeTruthy();
      expect(card.title).toBeTruthy();
      expect(card.description).toBeTruthy();
      expect(card.domain).toBeTruthy();
      expect(card.component).toBeDefined();
      expect(card.defaultLayout).toBeDefined();
    });
  });
});

// ============================================================
// getMetricsCardById
// ============================================================

describe("getMetricsCardById", () => {
  it("deve retornar card válido para metrics-revenue-total", () => {
    const card = getMetricsCardById("metrics-revenue-total");
    expect(card).toBeDefined();
    expect(card?.id).toBe("metrics-revenue-total");
    expect(card?.title).toBe("Receita Total");
    expect(card?.domain).toBe("financial");
  });

  it("deve retornar card válido para metrics-active-patients", () => {
    const card = getMetricsCardById("metrics-active-patients");
    expect(card).toBeDefined();
    expect(card?.id).toBe("metrics-active-patients");
    expect(card?.title).toBe("Pacientes Ativos");
    expect(card?.domain).toBe("administrative");
  });

  it("deve retornar card válido para metrics-website-visitors", () => {
    const card = getMetricsCardById("metrics-website-visitors");
    expect(card).toBeDefined();
    expect(card?.id).toBe("metrics-website-visitors");
    expect(card?.title).toBe("Visitantes do Site");
    expect(card?.domain).toBe("marketing");
  });

  it("deve retornar undefined para ID inválido", () => {
    const card = getMetricsCardById("invalid-card-id");
    expect(card).toBeUndefined();
  });

  it("deve retornar undefined para string vazia", () => {
    const card = getMetricsCardById("");
    expect(card).toBeUndefined();
  });

  it("todos os 12 cards devem ser encontráveis", () => {
    const allIds = getAllCardIds();
    allIds.forEach(id => {
      const card = getMetricsCardById(id);
      expect(card).toBeDefined();
      expect(card?.id).toBe(id);
    });
  });
});

// ============================================================
// getMetricsCardsByDomain
// ============================================================

describe("getMetricsCardsByDomain", () => {
  it("deve retornar 5 cards para financial", () => {
    const cards = getMetricsCardsByDomain("financial");
    expect(cards).toHaveLength(5);
    
    const ids = cards.map(c => c.id);
    expect(ids).toContain("metrics-revenue-total");
    expect(ids).toContain("metrics-avg-per-session");
    expect(ids).toContain("metrics-forecast-revenue");
    expect(ids).toContain("metrics-avg-per-active-patient");
    expect(ids).toContain("metrics-lost-revenue");
  });

  it("deve retornar 3 cards para administrative", () => {
    const cards = getMetricsCardsByDomain("administrative");
    expect(cards).toHaveLength(3);
    
    const ids = cards.map(c => c.id);
    expect(ids).toContain("metrics-active-patients");
    expect(ids).toContain("metrics-occupation-rate");
    expect(ids).toContain("metrics-missed-rate");
  });

  it("deve retornar 4 cards para marketing", () => {
    const cards = getMetricsCardsByDomain("marketing");
    expect(cards).toHaveLength(4);
    
    const ids = cards.map(c => c.id);
    expect(ids).toContain("metrics-website-visitors");
    expect(ids).toContain("metrics-website-views");
    expect(ids).toContain("metrics-website-ctr");
    expect(ids).toContain("metrics-website-conversion");
  });

  it("deve retornar array vazio para team", () => {
    const cards = getMetricsCardsByDomain("team");
    expect(cards).toHaveLength(0);
  });

  it("todos os cards retornados devem ser do domínio solicitado", () => {
    const domains = ["financial", "administrative", "marketing", "team"] as const;
    
    domains.forEach(domain => {
      const cards = getMetricsCardsByDomain(domain);
      cards.forEach(card => {
        expect(card.domain).toBe(domain);
      });
    });
  });
});

// ============================================================
// canUserViewCard
// ============================================================

describe("canUserViewCard", () => {
  it("deve retornar true para usuário com financial_access vendo card financeiro", () => {
    const canView = canUserViewCard("metrics-revenue-total", ["financial_access"]);
    expect(canView).toBe(true);
  });

  it("deve retornar false para usuário sem financial_access vendo card financeiro", () => {
    const canView = canUserViewCard("metrics-revenue-total", ["administrative_access"]);
    expect(canView).toBe(false);
  });

  it("deve retornar true para usuário com administrative_access vendo card administrativo", () => {
    const canView = canUserViewCard("metrics-active-patients", ["administrative_access"]);
    expect(canView).toBe(true);
  });

  it("deve retornar false para usuário sem administrative_access vendo card administrativo", () => {
    const canView = canUserViewCard("metrics-active-patients", ["financial_access"]);
    expect(canView).toBe(false);
  });

  it("deve retornar true para usuário com marketing_access vendo card marketing", () => {
    const canView = canUserViewCard("metrics-website-visitors", ["marketing_access"]);
    expect(canView).toBe(true);
  });

  it("deve retornar false para usuário sem marketing_access vendo card marketing", () => {
    const canView = canUserViewCard("metrics-website-visitors", ["financial_access"]);
    expect(canView).toBe(false);
  });

  it("deve retornar false para card inexistente", () => {
    const canView = canUserViewCard("invalid-card", ["financial_access"]);
    expect(canView).toBe(false);
  });

  it("deve retornar true se usuário tiver múltiplas permissões incluindo a necessária", () => {
    const canView = canUserViewCard("metrics-revenue-total", [
      "administrative_access",
      "financial_access",
      "marketing_access",
    ]);
    expect(canView).toBe(true);
  });

  it("deve retornar false se usuário não tiver nenhuma permissão", () => {
    const canView = canUserViewCard("metrics-revenue-total", []);
    expect(canView).toBe(false);
  });

  it("deve validar permissões para todos os 12 cards", () => {
    const allIds = getAllCardIds();
    
    allIds.forEach(cardId => {
      const card = getMetricsCardById(cardId);
      if (card?.requiredPermission) {
        // Com permissão correta
        expect(canUserViewCard(cardId, [card.requiredPermission])).toBe(true);
        
        // Sem permissão
        expect(canUserViewCard(cardId, [])).toBe(false);
      }
    });
  });
});

// ============================================================
// getAllCardIds
// ============================================================

describe("getAllCardIds", () => {
  it("deve retornar array com 12 IDs", () => {
    const ids = getAllCardIds();
    expect(ids).toHaveLength(12);
  });

  it("deve retornar todos os IDs únicos", () => {
    const ids = getAllCardIds();
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("deve incluir todos os cards financeiros", () => {
    const ids = getAllCardIds();
    expect(ids).toContain("metrics-revenue-total");
    expect(ids).toContain("metrics-avg-per-session");
    expect(ids).toContain("metrics-forecast-revenue");
    expect(ids).toContain("metrics-avg-per-active-patient");
    expect(ids).toContain("metrics-lost-revenue");
  });

  it("deve incluir todos os cards administrativos", () => {
    const ids = getAllCardIds();
    expect(ids).toContain("metrics-active-patients");
    expect(ids).toContain("metrics-occupation-rate");
    expect(ids).toContain("metrics-missed-rate");
  });

  it("deve incluir todos os cards de marketing", () => {
    const ids = getAllCardIds();
    expect(ids).toContain("metrics-website-visitors");
    expect(ids).toContain("metrics-website-views");
    expect(ids).toContain("metrics-website-ctr");
    expect(ids).toContain("metrics-website-conversion");
  });
});

// ============================================================
// getCardIdsByDomain
// ============================================================

describe("getCardIdsByDomain", () => {
  it("deve retornar 5 IDs para financial", () => {
    const ids = getCardIdsByDomain("financial");
    expect(ids).toHaveLength(5);
  });

  it("deve retornar 3 IDs para administrative", () => {
    const ids = getCardIdsByDomain("administrative");
    expect(ids).toHaveLength(3);
  });

  it("deve retornar 4 IDs para marketing", () => {
    const ids = getCardIdsByDomain("marketing");
    expect(ids).toHaveLength(4);
  });

  it("deve retornar array vazio para team", () => {
    const ids = getCardIdsByDomain("team");
    expect(ids).toHaveLength(0);
  });

  it("deve retornar IDs válidos que podem ser usados com getMetricsCardById", () => {
    const domains = ["financial", "administrative", "marketing", "team"] as const;
    
    domains.forEach(domain => {
      const ids = getCardIdsByDomain(domain);
      ids.forEach(id => {
        const card = getMetricsCardById(id);
        expect(card).toBeDefined();
        expect(card?.domain).toBe(domain);
      });
    });
  });
});

// ============================================================
// getDefaultCardLayout
// ============================================================

describe("getDefaultCardLayout", () => {
  it("deve retornar layout padrão para metrics-revenue-total", () => {
    const layout = getDefaultCardLayout("metrics-revenue-total");
    expect(layout).toBeDefined();
    expect(layout?.x).toBe(0);
    expect(layout?.y).toBe(0);
    expect(layout?.w).toBe(4);
    expect(layout?.h).toBe(2);
    expect(layout?.minW).toBe(3);
    expect(layout?.minH).toBe(2);
  });

  it("deve retornar undefined para card inexistente", () => {
    const layout = getDefaultCardLayout("invalid-card");
    expect(layout).toBeUndefined();
  });

  it("todos os cards devem ter layout padrão válido", () => {
    const allIds = getAllCardIds();
    
    allIds.forEach(id => {
      const layout = getDefaultCardLayout(id);
      expect(layout).toBeDefined();
      expect(layout?.x).toBeGreaterThanOrEqual(0);
      expect(layout?.y).toBeGreaterThanOrEqual(0);
      expect(layout?.w).toBeGreaterThan(0);
      expect(layout?.h).toBeGreaterThan(0);
      
      if (layout?.minW) {
        expect(layout.minW).toBeLessThanOrEqual(layout.w);
      }
      if (layout?.minH) {
        expect(layout.minH).toBeLessThanOrEqual(layout.h);
      }
    });
  });

  it("layouts devem seguir grid de 12 colunas", () => {
    const allIds = getAllCardIds();
    
    allIds.forEach(id => {
      const layout = getDefaultCardLayout(id);
      expect(layout?.w).toBeLessThanOrEqual(12);
      if (layout?.maxW) {
        expect(layout.maxW).toBeLessThanOrEqual(12);
      }
    });
  });
});

// ============================================================
// isValidCardId
// ============================================================

describe("isValidCardId", () => {
  it("deve retornar true para IDs válidos", () => {
    expect(isValidCardId("metrics-revenue-total")).toBe(true);
    expect(isValidCardId("metrics-active-patients")).toBe(true);
    expect(isValidCardId("metrics-website-visitors")).toBe(true);
  });

  it("deve retornar false para IDs inválidos", () => {
    expect(isValidCardId("invalid-card")).toBe(false);
    expect(isValidCardId("metrics-team-performance")).toBe(false);
    expect(isValidCardId("")).toBe(false);
  });

  it("deve ser case-sensitive", () => {
    expect(isValidCardId("Metrics-Revenue-Total")).toBe(false);
    expect(isValidCardId("METRICS-REVENUE-TOTAL")).toBe(false);
  });

  it("deve validar todos os IDs do registry", () => {
    const allIds = getAllCardIds();
    allIds.forEach(id => {
      expect(isValidCardId(id)).toBe(true);
    });
  });
});

// ============================================================
// EDGE CASES
// ============================================================

describe("Edge Cases", () => {
  it("deve lidar com undefined", () => {
    expect(isValidCardId(undefined as any)).toBe(false);
    expect(getMetricsCardById(undefined as any)).toBeUndefined();
    expect(canUserViewCard(undefined as any, ["financial_access"])).toBe(false);
  });

  it("deve lidar com null", () => {
    expect(isValidCardId(null as any)).toBe(false);
    expect(getMetricsCardById(null as any)).toBeUndefined();
    expect(canUserViewCard(null as any, ["financial_access"])).toBe(false);
  });

  it("canUserViewCard deve lidar com array de permissões vazio", () => {
    expect(canUserViewCard("metrics-revenue-total", [])).toBe(false);
  });

  it("getMetricsCardsByDomain deve retornar array vazio para domínio inválido", () => {
    const cards = getMetricsCardsByDomain("invalid" as any);
    expect(cards).toEqual([]);
  });

  it("deve prevenir colisão de nomes entre domínios", () => {
    const allIds = getAllCardIds();
    const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
    expect(duplicates).toHaveLength(0);
  });
});
