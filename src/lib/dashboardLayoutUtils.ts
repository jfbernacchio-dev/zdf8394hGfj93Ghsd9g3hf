/**
 * ============================================================================
 * DASHBOARD LAYOUT UTILS - FASE 3C
 * ============================================================================
 * 
 * Utilitários e helpers para manipulação de layout do Dashboard Example.
 * 
 * ============================================================================
 */

import type { DashboardExampleLayout, CardLayout } from './defaultLayoutDashboardExample';

/**
 * FIND CARD IN LAYOUT
 * 
 * Encontra um card específico no layout e retorna sua configuração.
 * Retorna undefined se não encontrado.
 */
export const findCardInLayout = (
  layout: DashboardExampleLayout,
  sectionId: string,
  cardId: string
): CardLayout | undefined => {
  const section = layout[sectionId];
  if (!section) return undefined;

  return section.cardLayouts.find(cl => cl.cardId === cardId);
};

/**
 * GET SECTION CARD IDS
 * 
 * Retorna array de IDs de cards em uma seção, ordenados por 'order'.
 */
export const getSectionCardIds = (
  layout: DashboardExampleLayout,
  sectionId: string
): string[] => {
  const section = layout[sectionId];
  if (!section) return [];

  return section.cardLayouts
    .sort((a, b) => a.order - b.order)
    .map(cl => cl.cardId);
};

/**
 * UPDATE CARD IN LAYOUT
 * 
 * Cria novo layout com card atualizado (imutável).
 */
export const updateCardInLayout = (
  layout: DashboardExampleLayout,
  sectionId: string,
  cardId: string,
  updates: Partial<CardLayout>
): DashboardExampleLayout => {
  const section = layout[sectionId];
  if (!section) return layout;

  return {
    ...layout,
    [sectionId]: {
      ...section,
      cardLayouts: section.cardLayouts.map(cl =>
        cl.cardId === cardId ? { ...cl, ...updates } : cl
      ),
    },
  };
};

/**
 * ADD CARD TO LAYOUT
 * 
 * Adiciona um novo card ao final de uma seção.
 */
export const addCardToLayout = (
  layout: DashboardExampleLayout,
  sectionId: string,
  cardId: string,
  width: number = 300
): DashboardExampleLayout => {
  const section = layout[sectionId] || { cardLayouts: [] };
  const maxOrder = Math.max(-1, ...section.cardLayouts.map(cl => cl.order));

  const newCard: CardLayout = {
    cardId,
    width,
    order: maxOrder + 1,
  };

  return {
    ...layout,
    [sectionId]: {
      cardLayouts: [...section.cardLayouts, newCard],
    },
  };
};

/**
 * REMOVE CARD FROM LAYOUT
 * 
 * Remove um card de uma seção e reordena os índices.
 */
export const removeCardFromLayout = (
  layout: DashboardExampleLayout,
  sectionId: string,
  cardId: string
): DashboardExampleLayout => {
  const section = layout[sectionId];
  if (!section) return layout;

  const filteredCards = section.cardLayouts
    .filter(cl => cl.cardId !== cardId)
    .sort((a, b) => a.order - b.order)
    .map((cl, index) => ({ ...cl, order: index }));

  return {
    ...layout,
    [sectionId]: {
      cardLayouts: filteredCards,
    },
  };
};

/**
 * REORDER CARDS IN SECTION
 * 
 * Reordena cards em uma seção baseado em array de IDs.
 */
export const reorderCardsInSection = (
  layout: DashboardExampleLayout,
  sectionId: string,
  orderedCardIds: string[]
): DashboardExampleLayout => {
  const section = layout[sectionId];
  if (!section) return layout;

  const reordered = orderedCardIds.map((cardId, index) => {
    const cardLayout = section.cardLayouts.find(cl => cl.cardId === cardId);
    if (!cardLayout) return null;
    return { ...cardLayout, order: index };
  }).filter(Boolean) as CardLayout[];

  return {
    ...layout,
    [sectionId]: {
      cardLayouts: reordered,
    },
  };
};

/**
 * GET CARDS COUNT BY SECTION
 * 
 * Retorna número de cards em cada seção.
 */
export const getCardsCountBySection = (layout: DashboardExampleLayout): Record<string, number> => {
  const counts: Record<string, number> = {};

  Object.entries(layout).forEach(([sectionId, section]) => {
    counts[sectionId] = section.cardLayouts.length;
  });

  return counts;
};

/**
 * GET TOTAL CARDS COUNT
 * 
 * Retorna número total de cards no layout.
 */
export const getTotalCardsCount = (layout: DashboardExampleLayout): number => {
  return Object.values(layout).reduce(
    (total, section) => total + section.cardLayouts.length,
    0
  );
};

/**
 * COMPARE LAYOUTS
 * 
 * Compara dois layouts e retorna se são iguais.
 */
export const compareLayouts = (
  layout1: DashboardExampleLayout,
  layout2: DashboardExampleLayout
): boolean => {
  return JSON.stringify(layout1) === JSON.stringify(layout2);
};

/**
 * GET LAYOUT DIFF
 * 
 * Retorna diferenças entre dois layouts para debug/logging.
 */
export const getLayoutDiff = (
  oldLayout: DashboardExampleLayout,
  newLayout: DashboardExampleLayout
): string[] => {
  const diffs: string[] = [];

  const allSections = new Set([
    ...Object.keys(oldLayout),
    ...Object.keys(newLayout),
  ]);

  allSections.forEach(sectionId => {
    const oldSection = oldLayout[sectionId];
    const newSection = newLayout[sectionId];

    if (!oldSection) {
      diffs.push(`+ Seção ${sectionId} adicionada`);
      return;
    }

    if (!newSection) {
      diffs.push(`- Seção ${sectionId} removida`);
      return;
    }

    // Comparar cards
    const oldCards = oldSection.cardLayouts;
    const newCards = newSection.cardLayouts;

    oldCards.forEach(oldCard => {
      const newCard = newCards.find(c => c.cardId === oldCard.cardId);
      
      if (!newCard) {
        diffs.push(`- Card ${oldCard.cardId} removido de ${sectionId}`);
        return;
      }

      if (oldCard.width !== newCard.width) {
        diffs.push(`~ Card ${oldCard.cardId} width: ${oldCard.width} → ${newCard.width}`);
      }

      if (oldCard.order !== newCard.order) {
        diffs.push(`~ Card ${oldCard.cardId} order: ${oldCard.order} → ${newCard.order}`);
      }
    });

    newCards.forEach(newCard => {
      const oldCard = oldCards.find(c => c.cardId === newCard.cardId);
      if (!oldCard) {
        diffs.push(`+ Card ${newCard.cardId} adicionado em ${sectionId}`);
      }
    });
  });

  return diffs;
};
