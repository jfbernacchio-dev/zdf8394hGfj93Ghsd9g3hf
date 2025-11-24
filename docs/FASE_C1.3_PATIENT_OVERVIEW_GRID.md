# FASE C1.3 - PatientDetail Grid Integration

## ✅ Objetivos Alcançados

### ETAPA 1 - Análise Dashboard Grid
- **Componente identificado:** `GridCardContainer` 
- **Sistema:** React Grid Layout, 12 colunas, rowHeight 30px
- **Props:** `sectionId`, `layout`, `onLayoutChange`, `isEditMode`, `children`
- **Recursos:** Drag & drop bidirecional, resize, reflow automático

### ETAPA 2 - Análise Aba "Visão Geral"
- **Fonte de cards:** `filteredOverviewCards` (já com `canSeeOverviewCard` aplicado)
- **Funções render:** `renderFunctionalCard`, `renderStatCard`
- **Layout atual:** CSS Grid simples (Tailwind), SEM drag & drop
- **Cards mapeados:** 9 cards (next-appointment, contact-info, clinical-complaint, clinical-info, history, recent-notes, quick-actions, payment-summary, session-frequency)

### ETAPA 3 - Componente PatientOverviewGrid
**Arquivo criado:** `src/components/patient/PatientOverviewGrid.tsx`

**Características:**
- Wrapper específico para aba "Visão Geral" do PatientDetail
- Reaproveita `GridCardContainer` da Dashboard
- Layout padrão definido em `DEFAULT_CARD_LAYOUTS`
- Props: `cardIds`, `renderCard`, `onLayoutChange`, `isEditMode`
- Por enquanto: apenas ordem persistida, não posições absolutas
- Não conhece lógica de paciente (puro grid wrapper)

**Dimensionamento padrão:**
- Cards grandes (info clínica): 6-12 cols × 8-10 rows
- Cards médios (ações, histórico): 4-6 cols × 6-8 rows  
- Cards pequenos (resumos): 3-4 cols × 4-6 rows

### ETAPA 4 - Integração Preparatória
**Arquivos modificados:** `src/pages/PatientDetail.tsx`

**Mudanças:**
1. Importado `PatientOverviewGrid` e `useCallback`
2. Criado `handleOverviewLayoutChange` callback
3. Preparado `renderOverviewCardForGrid` helper (stub inicial)
4. Estrutura pronta para substituir ResizableSection por PatientOverviewGrid

**NOTA IMPORTANTE:** Integração completa será feita em C1.4 para evitar quebrar cards existentes. Por enquanto, apenas infraestrutura está pronta.

## 🎯 Estado Atual

- ✅ Componente `PatientOverviewGrid` criado e funcional
- ✅ Sistema de grid da Dashboard reutilizado
- ✅ Callbacks e handlers preparados
- ⏳ Renderização completa de todos os cards no grid (próxima fase C1.4)
- ⏳ Migração total de ResizableSection → GridCardContainer (C1.4)

## 📋 Próximos Passos (C1.4)

1. Completar `renderOverviewCardForGrid` com todos os 9 cards
2. Substituir `ResizableSection` por `PatientOverviewGrid` completamente
3. Remover código legacy de grid CSS Tailwind
4. Testar drag & drop + resize em todos os cards
5. Garantir que edit mode funciona perfeitamente

## ⚠️ Garantias Mantidas

- ❌ NÃO alterado: Header paciente, consentimentos, outras abas
- ❌ NÃO alterado: RLS, permission engine, backend
- ❌ NÃO alterado: Persistência atual de layout (ainda por paciente)
- ✅ Comportamento funcional mantido (mesmos cards, mesmo conteúdo)
