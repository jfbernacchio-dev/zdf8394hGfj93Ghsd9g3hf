# Sistema de Layout do Dashboard Example

## Arquitetura (FASE 3C)

### Visão Geral

O sistema de layout do Dashboard Example é dividido em três camadas de persistência:

```
┌─────────────────────────────────────────────────┐
│           CAMADA DE INTERFACE                   │
│    (DashboardExample.tsx + Components)          │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│         CAMADA DE LÓGICA                        │
│   (useDashboardLayout Hook)                     │
│                                                  │
│   - Gerencia estado do layout                   │
│   - Coordena load/save                          │
│   - Implementa auto-save com debounce           │
└────────┬────────────────────┬───────────────────┘
         │                    │
┌────────▼──────────┐  ┌─────▼──────────────────┐
│   SUPABASE DB     │  │   LOCALSTORAGE         │
│                   │  │                        │
│ Fonte de verdade  │  │ Cache temporário       │
│ Sincronizado      │  │ Edições não salvas     │
└───────────────────┘  └────────────────────────┘
```

### Estrutura de Dados

#### DashboardExampleLayout
```typescript
{
  'dashboard-financial': {
    cardLayouts: [
      { cardId: 'dashboard-expected-revenue', width: 300, order: 0 },
      { cardId: 'dashboard-actual-revenue', width: 300, order: 1 },
      // ...
    ]
  },
  'dashboard-administrative': {
    cardLayouts: [...]
  },
  // ... outras seções
}
```

**Diferença do Dashboard Original:**
- Original: `{ width, height, x, y }` - posicionamento absoluto free-form
- Example: `{ width, order }` - layout sequencial baseado em seções

### Fluxo de Dados

#### 1. Inicialização (Load)
```
┌─────────────┐
│   Mount     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Load from Supabase  │
│ (user_layout_       │
│  preferences)       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Merge with          │
│ localStorage        │
│ (localStorage wins) │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Set layout state    │
└─────────────────────┘
```

#### 2. Edição (Update)
```
┌──────────────────┐
│ User edits card  │
│ (resize/reorder) │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│ updateCardWidth() or │
│ updateCardOrder()    │
└────────┬─────────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐  ┌──────────────────┐
│ Update layout   │  │ Save to          │
│ state (React)   │  │ localStorage     │
└─────────────────┘  │ (immediate)      │
                     └──────────────────┘
```

#### 3. Salvamento (Save)
```
┌──────────────────┐
│ Layout modified  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│ Debounce 2s          │
│ (auto-save)          │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ saveLayout()         │
│                      │
│ - Check existing     │
│ - Update or Insert   │
│ - Increment version  │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Saved in Supabase    │
│ (user_layout_        │
│  preferences)        │
└──────────────────────┘
```

#### 4. Reset
```
┌──────────────────┐
│ resetLayout()    │
└────────┬─────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐  ┌──────────────────┐
│ Clear           │  │ Delete from      │
│ localStorage    │  │ Supabase         │
└─────────────────┘  └──────────────────┘
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Restore              │
         │ DEFAULT_DASHBOARD_   │
         │ EXAMPLE_LAYOUT       │
         └──────────────────────┘
```

### Arquivos e Responsabilidades

#### `useDashboardLayout.ts` (Hook Principal)
**Responsabilidades:**
- Gerenciar estado do layout
- Carregar do Supabase + merge com localStorage
- Salvar no Supabase com auto-save (debounce 2s)
- Resetar para layout padrão
- Detectar mudanças não salvas

**API:**
```typescript
const {
  layout,              // Layout atual
  loading,             // Carregando do Supabase
  saving,              // Salvando no Supabase
  isModified,          // Tem mudanças não salvas?
  hasUnsavedChanges,   // Alias de isModified
  updateCardWidth,     // (sectionId, cardId, width) => void
  updateCardOrder,     // (sectionId, cardIds[]) => void
  saveLayout,          // () => Promise<void>
  resetLayout,         // () => Promise<void>
} = useDashboardLayout();
```

#### `defaultLayoutDashboardExample.ts` (Configuração)
**Responsabilidades:**
- Definir `DEFAULT_DASHBOARD_EXAMPLE_LAYOUT`
- Funções helper: `getCardWidth()`, `getCardOrder()`, etc.
- Filtrar layout por permissões
- Helpers de manipulação: `addCardToSectionLayout()`, `removeCardFromSectionLayout()`

#### `dashboardLayoutPersistence.ts` (Persistência)
**Responsabilidades:**
- Funções de save/load do localStorage
- Limpeza de dados: `clearSectionLayoutFromLocalStorage()`, `clearAllDashboardLayoutFromLocalStorage()`
- Validação: `validateLayoutStructure()`, `hasLocalCustomizations()`
- Debug: `getLayoutSummary()`

#### `dashboardLayoutUtils.ts` (Utilitários)
**Responsabilidades:**
- Busca e manipulação de cards: `findCardInLayout()`, `updateCardInLayout()`
- Operações de ordenação: `reorderCardsInSection()`
- Contagem: `getTotalCardsCount()`, `getCardsCountBySection()`
- Comparação: `compareLayouts()`, `getLayoutDiff()`

### Comparação com Sistemas Existentes

| Feature | Dashboard Original | Dashboard Example |
|---------|-------------------|-------------------|
| **Layout** | Free-form (x, y, width, height) | Section-based (width, order) |
| **Persistência** | localStorage + Supabase templates | localStorage + Supabase preferences |
| **Tabela** | `user_layout_templates` | `user_layout_preferences` |
| **Organização** | Absoluto, overlapping permitido | Sequencial, dentro de seções |
| **Drag & Drop** | 2D (x, y) | 1D (reorder dentro de seção) |
| **Resize** | Width + Height | Width apenas |

### Supabase Schema

```sql
-- Tabela: user_layout_preferences
CREATE TABLE user_layout_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  layout_type TEXT NOT NULL,  -- 'dashboard-example'
  layout_config JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, layout_type)
);
```

**layout_config structure:**
```json
{
  "dashboard-financial": {
    "cardLayouts": [
      { "cardId": "dashboard-expected-revenue", "width": 300, "order": 0 },
      { "cardId": "dashboard-actual-revenue", "width": 320, "order": 1 }
    ]
  },
  "dashboard-administrative": { "cardLayouts": [...] }
}
```

### localStorage Keys

- `card-width-{sectionId}-{cardId}`: Largura de um card
- `card-order-{sectionId}-{cardId}`: Ordem de um card
- `section-collapsed-{sectionId}`: Estado de colapso da seção

**Exemplo:**
```
card-width-dashboard-financial-dashboard-expected-revenue: "320"
card-order-dashboard-financial-dashboard-expected-revenue: "0"
section-collapsed-dashboard-financial: "false"
```

### Comportamento de Merge (localStorage vs Supabase)

Quando há conflito, **localStorage sempre vence**:

```typescript
// Exemplo: card tem width=300 no Supabase, mas width=350 no localStorage
const dbWidth = 300;
const localWidth = localStorage.getItem('card-width-...');  // "350"

const finalWidth = localWidth ? parseInt(localWidth) : dbWidth;
// Resultado: 350 (localStorage vence)
```

**Rationale:** localStorage representa edições mais recentes do usuário que ainda não foram sincronizadas.

### Auto-Save com Debounce

Para evitar salvar a cada alteração (spam no Supabase):

```typescript
const DEBOUNCE_SAVE_MS = 2000;  // 2 segundos

// Usuário faz 10 resizes em 1 segundo
// Sistema aguarda 2s de inatividade
// Salva UMA VEZ no Supabase com todas as mudanças
```

### Tratamento de Erros

```typescript
// Erros de rede no Supabase não bloqueiam UI
try {
  await supabase.from('user_layout_preferences').update(...)
} catch (error) {
  console.error('Erro ao salvar:', error);
  toast.error('Erro ao salvar layout');
  // Layout continua em localStorage
  // Usuário pode tentar salvar manualmente depois
}
```

### Próximas Fases

- **FASE 3B:** Drag & Drop dentro de seções (reorder)
- **FASE 3D:** Integração com DashboardExample.tsx
- **FASE 3E:** Polimento visual (feedback, animações)

### Debugging

#### Ver layout atual no console:
```javascript
const { layout } = useDashboardLayout();
console.log(getLayoutSummary(layout));
// Output: "6 seções, 15 cards"

console.log(getCardsCountBySection(layout));
// Output: { 'dashboard-financial': 3, 'dashboard-administrative': 5, ... }
```

#### Ver diferenças entre layouts:
```javascript
const diffs = getLayoutDiff(oldLayout, newLayout);
console.log(diffs);
// Output: [
//   "~ Card dashboard-expected-revenue width: 300 → 320",
//   "+ Card dashboard-new-card adicionado em dashboard-financial"
// ]
```

#### Verificar customizações locais:
```javascript
console.log(hasLocalCustomizations());
// Output: true (existem mudanças não salvas)
```

---

**Última atualização:** FASE 3C - Sistema de Persistência implementado
