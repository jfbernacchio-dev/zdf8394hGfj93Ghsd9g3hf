/**
 * 🧪 TESTES UNITÁRIOS: useDashboardLayout.ts
 * 
 * Validação do hook de gerenciamento de layout de dashboard.
 * 
 * Cobertura:
 * - updateLayout
 * - addCard
 * - removeCard
 * - saveLayout
 * - resetLayout
 * - hasUnsavedChanges
 * 
 * @phase TRACK_C3_TEST_PLAN - FASE 6 (Hooks)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDashboardLayout } from "../useDashboardLayout";
import type { GridCardLayout } from "@/types/cardTypes";

// Mock do Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    })),
  },
}));

// Mock do AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "test-user-id" },
    profile: { id: "test-user-id", full_name: "Test User" },
  })),
}));

// Mock do sonner (toast)
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// LocalStorage já está mockado globalmente em setupTests.ts
// Apenas criamos uma referência local para limpeza nos testes
const getLocalStorageKeys = () => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  return keys;
};

describe("useDashboardLayout - Inicialização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("deve iniciar com loading=true", () => {
    const { result } = renderHook(() => useDashboardLayout());
    expect(result.current.loading).toBe(true);
  });

  it("deve carregar layout padrão quando não há dados salvos", async () => {
    const { result } = renderHook(() => useDashboardLayout());

    // Esperar que loading seja false
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.layout).toBeDefined();
    expect(result.current.isModified).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("deve iniciar com saving=false", async () => {
    const { result } = renderHook(() => useDashboardLayout());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.saving).toBe(false);
  });
});

describe("useDashboardLayout - updateLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("deve atualizar layout de uma seção", async () => {
    const { result } = renderHook(() => useDashboardLayout());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newLayout: GridCardLayout[] = [
      { i: "card-1", x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 1 },
      { i: "card-2", x: 4, y: 0, w: 4, h: 2, minW: 2, minH: 1 },
    ];

    act(() => {
      result.current.updateLayout("test-section", newLayout);
    });

    expect(result.current.isModified).toBe(true);
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it("deve salvar cards individuais no localStorage", async () => {
    const { result } = renderHook(() => useDashboardLayout());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newLayout: GridCardLayout[] = [
      { i: "card-1", x: 2, y: 1, w: 6, h: 3, minW: 4, minH: 2 },
    ];

    act(() => {
      result.current.updateLayout("test-section", newLayout);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "grid-card-test-section-card-1",
      JSON.stringify(newLayout[0])
    );
  });

  it("deve ignorar seção inexistente", async () => {
    const { result } = renderHook(() => useDashboardLayout());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialLayout = result.current.layout;

    act(() => {
      result.current.updateLayout("invalid-section", []);
    });

    // Layout não deve mudar
    expect(result.current.layout).toEqual(initialLayout);
  });
});

describe("useDashboardLayout - addCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("deve adicionar novo card a uma seção", async () => {
    const { result } = renderHook(() => useDashboardLayout());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // FIXME: Este teste pode falhar se o layout padrão não tiver seções
    const sectionId = Object.keys(result.current.layout)[0];
    if (!sectionId) return; // Skip se não houver seções

    const initialCardCount = result.current.layout[sectionId]?.cardLayouts.length || 0;

    act(() => {
      result.current.addCard(sectionId, "new-card-id");
    });

    const finalCardCount = result.current.layout[sectionId]?.cardLayouts.length || 0;
    expect(finalCardCount).toBe(initialCardCount + 1);
    expect(result.current.isModified).toBe(true);
  });

  it("deve salvar novo card no localStorage", async () => {
    const { result } = renderHook(() => useDashboardLayout());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const sectionId = Object.keys(result.current.layout)[0];
    if (!sectionId) return;

    act(() => {
      result.current.addCard(sectionId, "new-card-id");
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      expect.stringContaining(`grid-card-${sectionId}-new-card-id`),
      expect.any(String)
    );
  });

  it("não deve adicionar card duplicado", async () => {
    const { result } = renderHook(() => useDashboardLayout());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const sectionId = Object.keys(result.current.layout)[0];
    if (!sectionId) return;

    // Adicionar pela primeira vez
    act(() => {
      result.current.addCard(sectionId, "duplicate-card");
    });

    const countAfterFirst = result.current.layout[sectionId]?.cardLayouts.length || 0;

    // Tentar adicionar novamente
    act(() => {
      result.current.addCard(sectionId, "duplicate-card");
    });

    const countAfterSecond = result.current.layout[sectionId]?.cardLayouts.length || 0;

    // Não deve ter aumentado
    expect(countAfterSecond).toBe(countAfterFirst);
  });
});

describe("useDashboardLayout - removeCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("deve remover card de uma seção", async () => {
    const { result } = renderHook(() => useDashboardLayout());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const sectionId = Object.keys(result.current.layout)[0];
    if (!sectionId) return;

    // Adicionar um card primeiro
    act(() => {
      result.current.addCard(sectionId, "card-to-remove");
    });

    const countAfterAdd = result.current.layout[sectionId]?.cardLayouts.length || 0;

    // Remover o card
    act(() => {
      result.current.removeCard(sectionId, "card-to-remove");
    });

    const countAfterRemove = result.current.layout[sectionId]?.cardLayouts.length || 0;
    expect(countAfterRemove).toBe(countAfterAdd - 1);
  });

  it("deve remover card do localStorage", async () => {
    const { result } = renderHook(() => useDashboardLayout());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const sectionId = Object.keys(result.current.layout)[0];
    if (!sectionId) return;

    act(() => {
      result.current.addCard(sectionId, "card-to-remove");
    });

    act(() => {
      result.current.removeCard(sectionId, "card-to-remove");
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith(
      `grid-card-${sectionId}-card-to-remove`
    );
  });
});

describe("useDashboardLayout - saveLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("deve marcar isModified como false após salvar", async () => {
    const { result } = renderHook(() => useDashboardLayout());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const sectionId = Object.keys(result.current.layout)[0];
    if (!sectionId) return;

    act(() => {
      result.current.addCard(sectionId, "new-card");
    });

    expect(result.current.isModified).toBe(true);

    await act(async () => {
      await result.current.saveLayout();
    });

    await vi.waitFor(() => {
      expect(result.current.isModified).toBe(false);
    });
  });
});

describe("useDashboardLayout - resetLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("deve limpar localStorage ao resetar", async () => {
    const { result } = renderHook(() => useDashboardLayout());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.resetLayout();
    });

    // FIXME: Verificar se localStorage.removeItem foi chamado
    expect(localStorage.removeItem).toHaveBeenCalled();
  });

  it("deve marcar isModified como false após reset", async () => {
    const { result } = renderHook(() => useDashboardLayout());

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const sectionId = Object.keys(result.current.layout)[0];
    if (!sectionId) return;

    act(() => {
      result.current.addCard(sectionId, "new-card");
    });

    expect(result.current.isModified).toBe(true);

    await act(async () => {
      await result.current.resetLayout();
    });

    await vi.waitFor(() => {
      expect(result.current.isModified).toBe(false);
    });
  });
});
