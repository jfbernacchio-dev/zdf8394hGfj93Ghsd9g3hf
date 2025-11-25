# FASE C1.0 — AUDITORIA COMPLETA

**Data:** 2025-11-25  
**Escopo:** Portar sistema de grid layout da DashboardExample para a Visão Geral do PatientDetail  
**Status:** SOMENTE AUDITORIA — NENHUMA IMPLEMENTAÇÃO

---

## 1. MAPEAMENTO DO ESTADO ATUAL DA VISÃO GERAL

### 1.1 Como Funciona Hoje

A **Visão Geral** do PatientDetail (src/pages/PatientDetail.tsx) usa um sistema manual de layout baseado em **CSS Transform** e **localStorage**, completamente diferente do sistema da Dashboard.

#### Sistema de Layout Atual

**Arquivo:** `src/pages/PatientDetail.tsx`

**Componentes Usados:**
- `ResizableCard` - Cards individuais com resize manual via mouse drag
- `ResizableSection` - Seções com altura ajustável
- **NÃO USA** `react-grid-layout` (engine moderno)
- **NÃO USA** `GridCardContainer`

**Estados de Controle:**
```typescript
const [isEditMode, setIsEditMode] = useState(false);
const [visibleCards, setVisibleCards] = useState<string[]>([]);
const [tempSizes, setTempSizes] = useState<Record<string, { width, height, x, y }>>({});
const [tempSectionHeights, setTempSectionHeights] = useState<Record<string, number>>({});
const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
```

**Como os Cards São Renderizados:**
- Loop manual sobre `visibleCards[]`
- Renderização direta de componentes sem abstração de registry
- Posicionamento via CSS inline (width, height, transform)

**Exemplo de Renderização Atual (linha ~2490):**
```typescript
<ResizableCard
  key={cardId}
  id={cardId}
  isEditMode={isEditMode}
  tempSize={tempSizes[cardId]}
  onTempSizeChange={handleTempSizeChange}
>
  {renderStatCard(cardId)}  // Função local no componente
</ResizableCard>
```

**Persistência:**
- localStorage direto: `card-width-${cardId}`, `card-height-${cardId}`, etc.
- Supabase: **NÃO USA**
- Hook de layout: **NÃO USA**

**Seções:**
- Arquivo: `src/lib/defaultSectionsPatient.ts`
- Apenas define quais cards estão disponíveis
- **NÃO define** posições, grid, ou constraints

```typescript
export const PATIENT_SECTIONS: Record<string, SectionConfig> = {
  'patient-financial': {
    availableCardIds: [...],
    defaultHeight: 400,
    collapsible: true,
  },
  // ...
}
```

**AddCardDialog:**
- Usa `AddCardDialog` mas com assinatura antiga
- Props: `existingCardIds`, `onAddCard(cardConfig)`, `onRemoveCard(cardId)`
- **NÃO passa** `sectionId` nem `sectionCards`

#### Funcionalidade de Edição

**Botões de Controle (linha ~2300):**
```typescript
{isEditMode ? (
  <>
    <Button onClick={handleSave}>Salvar</Button>
    <Button onClick={handleCancel}>Cancelar</Button>
  </>
) : (
  <Button onClick={() => setIsEditMode(true)}>Editar</Button>
)}
```

**Lógica de Salvamento:**
```typescript
const handleSave = () => {
  // Salva tempSizes no localStorage
  Object.entries(tempSizes).forEach(([id, size]) => {
    localStorage.setItem(`card-width-${id}`, size.width.toString());
    // ...
  });
  setIsEditMode(false);
};
```

**Lógica de Cancelamento:**
```typescript
const handleCancel = () => {
  setTempSizes({});
  setIsEditMode(false);
  window.location.reload(); // ⚠️ Reload forçado
};
```

**Reset para Padrão:**
```typescript
const handleReset = () => {
  resetToDefaultLayout(); // Limpa localStorage
  window.location.reload();
};
```

### 1.2 Limitações do Sistema Atual

| Limitação | Descrição | Impacto |
|-----------|-----------|---------|
| **Sem Grid System** | Layout livre sem constraints de colunas | Cards podem sobrepor, sem reflow |
| **Persistência Frágil** | Apenas localStorage, sem sincronização | Perde customizações entre devices |
| **Resize Manual** | Mouse drag com `transform`, sem constraints | UX inconsistente, sem snap |
| **Sem Catálogo Estruturado** | `renderStatCard()` é switch/case local | Código não reutilizável |
| **Sem Auto-Save** | Exige "Salvar" manual | Risco de perder edições |
| **Reload Forçado** | `window.location.reload()` no cancelar | Perde estado da página |

### 1.3 O Que Será Substituído na Track C1

✅ **SUBSTITUIR:**
- `ResizableCard` → `GridCardContainer` + `react-grid-layout`
- `ResizableSection` → Sistema de seções da Dashboard
- `tempSizes` → Grid layout state do hook
- Função `renderStatCard()` → Registry centralizado
- localStorage direto → `useDashboardLayout` (Supabase + localStorage)
- Botões manuais de Save/Cancel → Auto-save com debounce

✅ **MANTER INTOCADO:**
- Tabs de navegação (Visão Geral, Evolução, Métricas)
- Lógica de carregamento de dados (sessions, patient, nfse)
- Permissões e RLS (`useEffectivePermissions`)
- Tab de Evolução Clínica (não faz parte do escopo)
- Tab de Métricas (não faz parte do escopo)

---

## 2. MAPEAMENTO COMPLETO DO SISTEMA DA DASHBOARD

### 2.1 Módulos Principais

| Módulo | Caminho | Função | Por Que É Necessário |
|--------|---------|--------|----------------------|
| **DashboardExample.tsx** | `src/pages/DashboardExample.tsx` | Página principal | Referência de implementação completa |
| **useDashboardLayout** | `src/hooks/useDashboardLayout.ts` | Hook de persistência | **CRÍTICO** - Gerencia layout, save, reset |
| **GridCardContainer** | `src/components/GridCardContainer.tsx` | Container de grid | **CRÍTICO** - Engine de drag/drop |
| **gridLayoutUtils** | `src/lib/gridLayoutUtils.ts` | Utilitários de grid | Conversão, validação, posicionamento |
| **dashboardLayoutUtils** | `src/lib/dashboardLayoutUtils.ts` | Manipulação de layout | Funções imutáveis de CRUD |
| **dashboardLayoutPersistence** | `src/lib/dashboardLayoutPersistence.ts` | Persistência auxiliar | Funções de save/load no localStorage |
| **dashboardCardRegistry** | `src/lib/dashboardCardRegistry.tsx` | Registry de componentes | **CRÍTICO** - Mapeia cardId → Componente |
| **dashboardCardRegistryTeam** | `src/lib/dashboardCardRegistryTeam.tsx` | Cards de equipe | Cards específicos para dados de subordinados |
| **cardTypes.ts** | `src/types/cardTypes.ts` | Tipos e interfaces | Definições de `GridCardLayout`, `CardConfig` |
| **defaultLayoutDashboardExample** | `src/lib/defaultLayoutDashboardExample.ts` | Layout padrão | Default grid positions para cada seção |
| **AddCardDialog** | `src/components/AddCardDialog.tsx` | Dialog de adicionar cards | Interface para add/remove cards |

### 2.2 Arquitetura do Engine de Grid

#### A. Estrutura de Dados

```typescript
// Grid Layout Structure
interface GridCardLayout {
  i: string;        // cardId único
  x: number;        // coluna inicial (0-11)
  y: number;        // linha inicial (0-∞)
  w: number;        // largura em colunas (1-12)
  h: number;        // altura em rows (1-∞)
  minW?: number;    // largura mínima
  minH?: number;    // altura mínima
  maxW?: number;    // largura máxima (12)
}

// Section Layout
interface GridSectionLayout {
  cardLayouts: GridCardLayout[];
}

// Complete Dashboard Layout
type DashboardGridLayout = Record<string, GridSectionLayout>;
```

**Exemplo Real:**
```typescript
{
  'dashboard-financial': {
    cardLayouts: [
      { i: 'dashboard-expected-revenue', x: 0, y: 0, w: 3, h: 4, minW: 2, minH: 2 },
      { i: 'dashboard-actual-revenue', x: 3, y: 0, w: 3, h: 4, minW: 2, minH: 2 },
    ]
  },
  // ...
}
```

#### B. Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│ DashboardExample.tsx (Componente Principal)                  │
│                                                               │
│  const { layout, updateLayout, addCard, removeCard,          │
│          saveLayout, resetLayout } = useDashboardLayout();    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ useDashboardLayout (Hook)                                    │
│  - Carrega de Supabase (user_layout_preferences)             │
│  - Merge com localStorage customizations                     │
│  - Auto-save com debounce (2s)                               │
│  - Funções CRUD de layout                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ GridCardContainer (Engine de Rendering)                      │
│  - React Grid Layout (biblioteca externa)                    │
│  - Drag & Drop com constraints                               │
│  - Resize bidirecional                                       │
│  - Reflow automático (compactação vertical)                  │
│  - onLayoutChange → updateLayout()                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ dashboardCardRegistry (Rendering de Cards)                   │
│  - Função renderDashboardCard(cardId, props)                 │
│  - Switch/case mapeando cardId → Componente                  │
│  - Passa dados (patients, sessions, etc.)                    │
└─────────────────────────────────────────────────────────────┘
```

#### C. Persistência Multi-Camada

```
┌──────────────────────────────────────────────────────────────┐
│ NÍVEL 1: Supabase (user_layout_preferences)                  │
│  - Fonte de verdade principal                                │
│  - Sincronizado entre devices                                │
│  - Versionado (incremental)                                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ loadLayoutFromDatabase()
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ NÍVEL 2: localStorage (customizações temporárias)            │
│  - Chaves: grid-card-{sectionId}-{cardId}                    │
│  - Sobrescreve Supabase em caso de conflito                  │
│  - Usado durante edição (antes de save)                      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ loadLayoutFromLocalStorage()
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ NÍVEL 3: Default Layout (fallback)                           │
│  - defaultLayoutDashboardExample.ts                          │
│  - Usado quando não há customização                          │
│  - Garantia de sempre ter layout válido                      │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Sistema de Permissões

#### Integração com Permissões Organizacionais

```typescript
// Hook de permissões
const { permissionContext, canViewCard } = useDashboardPermissions();

// Filtragem de seções visíveis
const visibleSections = useMemo(() => {
  const filtered: Record<string, Section> = {};
  
  Object.entries(DASHBOARD_SECTIONS).forEach(([sectionId, section]) => {
    const sectionCards = ALL_AVAILABLE_CARDS.filter(card => 
      section.availableCardIds.includes(card.id)
    );
    const visibleCards = filterCardsByPermissions(sectionCards, permissionContext);
    
    if (visibleCards.length > 0) {
      filtered[sectionId] = section;
    }
  });
  
  return filtered;
}, [permissionContext]);
```

**Domínios de Permissão:**
- `financial` - Requer `financialAccess === 'full'` ou `'read'`
- `administrative` - Acesso geral a métricas não-financeiras
- `clinical` - Requer `canAccessClinical === true`
- `media` - Bloqueado para subordinados
- `team` - Cards de dados de equipe/subordinados

### 2.4 AddCardDialog - Interface de Adicionar Cards

**Nova API (usada pela Dashboard):**
```typescript
<AddCardDialog
  open={isAddCardDialogOpen}
  onOpenChange={setIsAddCardDialogOpen}
  onAddCard={(sectionId: string, cardId: string) => addCard(sectionId, cardId)}
  onRemoveCard={(sectionId: string, cardId: string) => removeCard(sectionId, cardId)}
  sectionCards={layout}  // CRÍTICO: layout completo por seção
/>
```

**API Antiga (usada pelo PatientDetail atual):**
```typescript
<AddCardDialog
  open={isAddCardDialogOpen}
  onOpenChange={setIsAddCardDialogOpen}
  onAddCard={(cardConfig: CardConfig) => handleAddCard(cardConfig)}
  onRemoveCard={(cardId: string) => handleRemoveCard(cardId)}
  existingCardIds={visibleCards}
  mode="patient"
/>
```

**Diferença Crítica:**
- Nova API: `(sectionId, cardId)` - sabe onde adicionar
- API antiga: `(cardConfig)` - não sabe a seção

### 2.5 Sistema de Seções

**Arquivo:** `src/lib/defaultSectionsDashboard.ts`

```typescript
export const DASHBOARD_SECTIONS: Record<string, SectionConfig> = {
  'dashboard-financial': {
    id: 'dashboard-financial',
    name: 'Financeiro',
    description: 'Receitas, pagamentos e métricas financeiras',
    permissionConfig: {
      primaryDomain: 'financial',
      requiresOwnDataOnly: false,
    },
    availableCardIds: [
      'dashboard-expected-revenue',
      'dashboard-actual-revenue',
      'dashboard-unpaid-value',
      // ...
    ],
    collapsible: true,
    startCollapsed: false,
  },
  // ...
}
```

**Recursos:**
- `collapsible` - Seção pode ser colapsada
- `availableCardIds` - Cards que podem ser adicionados
- `permissionConfig` - Regras de acesso da seção

### 2.6 Catálogo de Cards

**Arquivo:** `src/lib/dashboardCardRegistry.tsx`

**Função Central:**
```typescript
export const renderDashboardCard = (
  cardId: string,
  props: {
    isEditMode?: boolean;
    patients?: any[];
    sessions?: any[];
    start?: Date;
    end?: Date;
    // ...
  }
): React.ReactNode => {
  switch (cardId) {
    case 'dashboard-expected-revenue':
      return <DashboardExpectedRevenue {...props} />;
    case 'dashboard-actual-revenue':
      return <DashboardActualRevenue {...props} />;
    // ... 50+ cards
    default:
      return null;
  }
}
```

**Componentes de Card Exportados:**
- `DashboardExpectedRevenue` - Receita esperada
- `DashboardActualRevenue` - Receita realizada
- `DashboardTotalPatients` - Total de pacientes
- **50+ componentes** individuais

---

## 3. COMPARAÇÃO DIRETA: VISÃO GERAL vs DASHBOARD

### 3.1 Divergências Arquiteturais

| Aspecto | Visão Geral Atual | Dashboard (Target) |
|---------|-------------------|-------------------|
| **Engine de Layout** | CSS Transform manual | React Grid Layout |
| **Estrutura de Dados** | `visibleCards: string[]` | `DashboardGridLayout` (x,y,w,h) |
| **Persistência** | localStorage direto | Hook + Supabase + localStorage |
| **Posicionamento** | Livre (sem grid) | Grid 12 colunas |
| **Resize** | Mouse drag com tempSizes | react-grid-layout built-in |
| **Drag & Drop** | ❌ Não tem | ✅ Com reflow automático |
| **Auto-save** | ❌ Save manual | ✅ Debounce 2s |
| **Seções** | Lista simples | Config estruturado + collapse |
| **Cards Registry** | Função local `renderStatCard()` | Registry centralizado |
| **AddCard Dialog** | API antiga (cardConfig) | API nova (sectionId, cardId) |
| **Permissions Filter** | ❌ Não integrado | ✅ Filtragem automática |

### 3.2 Dados Divergentes

#### Dashboard Usa:
```typescript
const { layout, updateLayout, addCard, removeCard, saveLayout, resetLayout } = useDashboardLayout();

// layout = {
//   'dashboard-financial': {
//     cardLayouts: [{ i: 'card-1', x: 0, y: 0, w: 3, h: 4 }]
//   }
// }
```

#### Visão Geral Usa:
```typescript
const [visibleCards, setVisibleCards] = useState<string[]>(['card-1', 'card-2']);
const [tempSizes, setTempSizes] = useState({
  'card-1': { width: 200, height: 120, x: 0, y: 0 }
});
```

**Conversão Necessária:**
- `visibleCards[]` → `GridCardLayout[]` com posições (x,y,w,h)
- `tempSizes` → Sistema de grid nativo

### 3.3 Componentes que NÃO Existem no PatientDetail

| Componente | Função | Onde Está | Precisa Portar? |
|------------|--------|-----------|----------------|
| `GridCardContainer` | Engine de grid | Dashboard | ✅ SIM - Reusar |
| `useDashboardLayout` | Hook de estado | Dashboard | ✅ SIM - Adaptar |
| Card registry | Mapeia cardId → Component | Dashboard | ✅ SIM - Criar novo para patient |
| `defaultLayoutDashboardExample` | Layout padrão | Dashboard | ✅ SIM - Criar `defaultLayoutPatientOverview` |
| Sistema de seções | Config de seções | Dashboard | ✅ SIM - Adaptar PATIENT_SECTIONS |

### 3.4 Componentes que Existem mas Serão SUBSTITUÍDOS

| Componente Atual | Será Substituído Por | Razão |
|------------------|----------------------|-------|
| `ResizableCard` | Grid nativo do `react-grid-layout` | Mais robusto, com constraints |
| `ResizableSection` | Sistema de seções da Dashboard | Melhor UX, collapsible |
| Função `renderStatCard()` | Registry `renderPatientCard()` | Reutilizável, tipado |
| Estado `tempSizes` | `layout` do hook | Persistência automática |
| Botões Save/Cancel | Auto-save do hook | Menos cliques, mais seguro |

### 3.5 Riscos de Conflito

#### ⚠️ RISCO 1: Estado de Edit Mode
**Problema:** Dashboard usa `isEditMode` global, PatientDetail também tem `isEditMode` local.  
**Conflito:** Variáveis de mesmo nome podem colidir.  
**Solução:** Renomear `isEditMode` → `isLayoutEditMode` no código portado.

#### ⚠️ RISCO 2: Permissões Clínicas
**Problema:** PatientDetail tem acesso clínico sensível (Evolução, Queixa).  
**Conflito:** Cards da Visão Geral NÃO devem quebrar permissões de `useEffectivePermissions`.  
**Solução:** Validar que `patientOverviewCardRegistry` respeita `canAccessClinical`.

#### ⚠️ RISCO 3: Real-time de Sessões
**Problema:** PatientDetail tem canal de Supabase Realtime para `sessions`.  
**Conflito:** Edição de layout pode causar re-render e quebrar listener.  
**Solução:** Isolar edit mode em sub-componente, não mexer no canal.

#### ⚠️ RISCO 4: Tabs de Navegação
**Problema:** PatientDetail tem tabs (Visão Geral, Evolução, Métricas).  
**Conflito:** Trocar de tab durante edit mode pode perder estado.  
**Solução:** Desabilitar troca de tabs quando `isLayoutEditMode === true`.

---

## 4. LISTA COMPLETA DE REQUISITOS PARA TRACK C1

### 4.1 Arquivos a Modificar

| Arquivo | Tipo de Modificação | Complexidade |
|---------|---------------------|--------------|
| `src/pages/PatientDetail.tsx` | **SUBSTITUIÇÃO PARCIAL** - Apenas seção Visão Geral | ALTA |
| `src/lib/defaultSectionsPatient.ts` | **EXTENSÃO** - Adicionar estrutura de grid | MÉDIA |
| `src/lib/defaultLayoutEvolution.ts` | **RENOMEAR** → `defaultLayoutPatientOverview.ts` | BAIXA |

### 4.2 Arquivos a Criar

| Arquivo | Função | Baseado Em | Complexidade |
|---------|--------|------------|--------------|
| `src/lib/patientOverviewCardRegistry.tsx` | Registry de cards para patient | `dashboardCardRegistry.tsx` | ALTA |
| `src/lib/defaultLayoutPatientOverview.ts` | Layout grid padrão | `defaultLayoutDashboardExample.ts` | MÉDIA |
| `src/hooks/usePatientOverviewLayout.ts` | Hook de layout específico | `useDashboardLayout.ts` | MÉDIA |
| `src/types/patientCardTypes.ts` (opcional) | Tipos específicos de patient cards | `cardTypes.ts` | BAIXA |

### 4.3 Componentes de Card a Implementar (MVP)

#### Seção Financial (4 cards MVP)
- ✅ `patient-stat-revenue-month` - Faturamento do mês
- ✅ `patient-stat-pending-sessions` - Sessões não pagas
- ✅ `patient-stat-nfse-count` - Total de NFSe emitidas
- ✅ `patient-chart-payment-history` - Gráfico de histórico de pagamentos

#### Seção Clinical (3 cards MVP)
- ✅ `patient-complaints-summary` - Resumo de queixas
- ✅ `patient-medications-list` - Lista de medicações
- ✅ `patient-clinical-notes` - Notas clínicas

#### Seção Sessions (3 cards MVP)
- ✅ `patient-sessions-timeline` - Timeline de sessões
- ✅ `patient-attendance-rate` - Taxa de comparecimento
- ✅ `patient-session-frequency` - Frequência de sessões

#### Seção Contact (2 cards MVP)
- ✅ `patient-contact-info` - Informações de contato
- ✅ `patient-consent-status` - Status de consentimento LGPD

**Total MVP:** 12 cards (expandível para 30+ no futuro)

### 4.4 Estados e Hooks Necessários

#### Estados a Adicionar:
```typescript
// Substituir estados antigos
const [visibleCards] = useState<string[]>([]);         // ❌ REMOVER
const [tempSizes] = useState<Record<...>>({});          // ❌ REMOVER

// Adicionar novo hook
const {
  layout,                    // DashboardGridLayout
  updateLayout,              // (sectionId, GridCardLayout[]) => void
  addCard,                   // (sectionId, cardId) => void
  removeCard,                // (sectionId, cardId) => void
  saveLayout,                // () => Promise<void>
  resetLayout,               // () => Promise<void>
  loading,                   // boolean
  saving,                    // boolean
  isModified,                // boolean
} = usePatientOverviewLayout();
```

#### Props para Cards:
```typescript
interface PatientCardProps {
  isEditMode?: boolean;
  patient?: any;
  sessions?: any[];
  nfseIssued?: any[];
  complaint?: any;
  start?: Date;
  end?: Date;
  className?: string;
}
```

### 4.5 Dependências a Reutilizar da Dashboard

| Dependência | Reusar Direto? | Adaptação Necessária |
|-------------|----------------|----------------------|
| `GridCardContainer` | ✅ SIM | Nenhuma |
| `gridLayoutUtils.ts` | ✅ SIM | Nenhuma |
| `dashboardLayoutUtils.ts` | ✅ SIM | Nenhuma |
| `dashboardLayoutPersistence.ts` | ✅ SIM | Nenhuma (funções helper) |
| `AddCardDialog` | ✅ SIM | Passar props da nova API |
| `useDashboardLayout` | ❌ NÃO - Criar fork | Mudar LAYOUT_TYPE para 'patient-overview-grid' |

### 4.6 Checklist de Isolamento (Não Tocar)

#### ✅ Arquivos 100% Intocados:
- ❌ `src/lib/checkPermissions.ts` - Permissões globais
- ❌ `src/lib/checkPatientAccess.ts` - Validação de acesso a pacientes
- ❌ `src/hooks/useEffectivePermissions.ts` - Hook de permissões
- ❌ `src/components/ClinicalEvolution.tsx` - Tab de evolução
- ❌ `src/components/ClinicalComplaintSummary.tsx` - Queixa clínica
- ❌ `src/pages/NFSeHistory.tsx` - Histórico de NFSe
- ❌ `src/pages/Financial.tsx` - Página financeira
- ❌ Qualquer arquivo relacionado a WhatsApp, Agenda, Organização

#### ✅ Regiões do PatientDetail.tsx Intocadas:
- ❌ Função `loadData()` - Carregamento de dados
- ❌ Tabs de navegação principal (`<TabsList>`)
- ❌ Tab "Evolução Clínica" (`<TabsContent value="evolution">`)
- ❌ Tab "Métricas" (`<TabsContent value="metrics">`)
- ❌ Sistema de permissões (`useEffectivePermissions`, `canAccessClinical`)
- ❌ Canal de Realtime para sessions
- ❌ Dialogs de sessão (AppointmentDialog, IssueNFSeDialog)
- ❌ Sistema de nota de sessão (`isNoteDialogOpen`, `handleSaveNote`)

---

## 5. RISCOS E ZONAS SENSÍVEIS + MITIGAÇÃO

### 5.1 Riscos CRÍTICOS

#### 🔴 RISCO 1: Quebra de Permissões Clínicas
**Descrição:** Cards da Visão Geral podem expor dados clínicos sem validar `canAccessClinical`.  
**Impacto:** Violação de RLS, dados sensíveis expostos.  
**Probabilidade:** MÉDIA  
**Mitigação:**
1. ✅ Validar em CADA card do registry:
   ```typescript
   if (card.permissionConfig?.domain === 'clinical' && !canAccessClinical) {
     return null; // Não renderizar
   }
   ```
2. ✅ Adicionar testes de permissão antes de renderizar seção clínica.
3. ✅ Log de auditoria quando card clínico é renderizado.

#### 🔴 RISCO 2: Quebra do Real-time de Sessões
**Descrição:** Edit mode pode causar re-render que quebra canal de Supabase Realtime.  
**Impacto:** Dados de sessões não atualizam em tempo real.  
**Probabilidade:** ALTA (se não isolar corretamente)  
**Mitigação:**
1. ✅ Não mexer no `useEffect` que cria o canal (linha ~226).
2. ✅ Isolar edit mode em componente filho (ex: `<OverviewGridEditor>`).
3. ✅ Testar que após editar layout, canal continua funcionando.

#### 🔴 RISCO 3: Conflito de Estado de Tabs
**Descrição:** Trocar de tab durante edit mode pode perder layout temporário.  
**Impacto:** Usuário perde edições ao navegar.  
**Probabilidade:** MÉDIA  
**Mitigação:**
1. ✅ Desabilitar troca de tabs quando `isLayoutEditMode === true`:
   ```typescript
   <TabsTrigger disabled={isLayoutEditMode} value="evolution">
   ```
2. ✅ Mostrar aviso: "Salve ou cancele as edições antes de trocar de aba".

#### 🟡 RISCO 4: Corrupção de Dados Financeiros
**Descrição:** Cards financeiros podem calcular valores incorretamente se filtrarem sessões erradas.  
**Impacto:** Métricas financeiras incorretas exibidas.  
**Probabilidade:** MÉDIA  
**Mitigação:**
1. ✅ Reutilizar lógica de cálculo existente do PatientDetail.
2. ✅ Validar que período de filtro (`start`, `end`) é passado corretamente.
3. ✅ Adicionar testes unitários para cards financeiros.

### 5.2 Zonas 100% INTOCÁVEIS

#### 🚫 Backend e RLS
- ❌ Tabelas: `sessions`, `patients`, `nfse_issued`, `clinical_complaints`
- ❌ RLS policies: Qualquer policy de acesso
- ❌ Edge functions: Todas
- ❌ Triggers e functions SQL

#### 🚫 Estruturas Clínicas
- ❌ `ClinicalEvolution.tsx` - Sistema de evolução
- ❌ `ClinicalComplaintSummary.tsx` - Queixas clínicas
- ❌ `clinical_complaints` table

#### 🚫 Sistemas de Negócio Críticos
- ❌ NFSe (emissão, cancelamento, histórico)
- ❌ WhatsApp (todas as funcionalidades)
- ❌ Agenda (scheduling, bloqueios)
- ❌ Permissões organizacionais (levels, positions, RLS)
- ❌ Sistema de login/autenticação

### 5.3 Estratégia de Rollback Seguro

#### Plano de Rollback em 3 Níveis:

**NÍVEL 1: Rollback de UI (sem perda de dados)**
```typescript
// Manter código antigo comentado
// const [visibleCards, setVisibleCards] = useState<string[]>([]); // OLD
const { layout, updateLayout } = usePatientOverviewLayout(); // NEW

// Se der problema, descomentar OLD e comentar NEW
```

**NÍVEL 2: Rollback de Layout (localStorage)**
```typescript
// Função de emergência
const rollbackToOldLayout = () => {
  localStorage.removeItem('user_layout_preferences');
  window.location.reload();
};
```

**NÍVEL 3: Rollback de Código (Git)**
```bash
# Reverter commit específico da Track C1
git revert <commit-hash>
```

---

## 6. O QUE AINDA PRECISO SABER ANTES DA C1.1

### 6.1 Decisões de Design

#### ❓ Questão 1: Nome da Key de Persistência
**Pergunta:** Qual `LAYOUT_TYPE` usar no Supabase?  
**Opções:**
- `patient-overview-grid` (consistente com Dashboard)
- `patient-detail-layout` (mais genérico)
- `patient-visao-geral` (PT-BR)

**Recomendação:** `patient-overview-grid`

#### ❓ Questão 2: Cards MVP vs Completos
**Pergunta:** Implementar apenas 12 cards MVP ou todos os 30+ disponíveis?  
**Opções:**
- MVP (12 cards) - Mais rápido, menos risco
- Completo (30+ cards) - Funcionalidade total

**Recomendação:** MVP primeiro, expandir depois.

#### ❓ Questão 3: Reuso de Hook ou Fork?
**Pergunta:** Reusar `useDashboardLayout` ou criar `usePatientOverviewLayout`?  
**Opções:**
- Reusar - Menos código, mas pode ter acoplamento
- Fork - Mais controle, mas duplicação de código

**Recomendação:** Fork para evitar regressions na Dashboard.

### 6.2 Validações Necessárias Antes de Implementar

#### ✅ Pré-requisito 1: Teste de Permissões Clínicas
**Validar:**
- [ ] Usuário sem `canAccessClinical` NÃO vê cards clínicos
- [ ] Subordinado nível > 1 sem clinical_visible_to_superiors NÃO expõe dados clínicos
- [ ] Log de auditoria registra visualização de cards clínicos

#### ✅ Pré-requisito 2: Teste de Real-time
**Validar:**
- [ ] Canal de Supabase Realtime continua funcionando após editar layout
- [ ] Adicionar/remover sessão atualiza cards em tempo real
- [ ] Trocar de tab e voltar mantém canal ativo

#### ✅ Pré-requisito 3: Teste de Navegação
**Validar:**
- [ ] Trocar de tab durante edit mode mostra aviso
- [ ] Cancelar edit mode NÃO causa reload de página
- [ ] Reset layout funciona sem quebrar dados clínicos

### 6.3 Informações Faltantes

#### ❓ Info 1: Formato de Dados de Patient
**Pergunta:** Qual a estrutura completa do objeto `patient`?  
**Por que preciso:** Para definir corretamente props de cards.  
**Como obter:** Verificar tipos em `src/integrations/supabase/types.ts`.

#### ❓ Info 2: Permissões de Seções Patient
**Pergunta:** `PATIENT_SECTIONS` em `defaultSectionsPatient.ts` está completo?  
**Por que preciso:** Para mapear corretamente permissões.  
**Como obter:** Revisar arquivo e comparar com Dashboard.

#### ❓ Info 3: Cards Existentes a Migrar
**Pergunta:** Quais dos cards atuais da Visão Geral devem virar grid cards?  
**Por que preciso:** Para definir escopo exato do MVP.  
**Como obter:** Listar todos os `renderStatCard()` cases no PatientDetail.tsx.

---

## 7. CONCLUSÃO E VIABILIDADE

### 7.1 Diagnóstico Final

✅ **VIABILIDADE: ALTA**  
A Track C1 é perfeitamente viável, com riscos gerenciáveis.

**Pontos Fortes:**
- ✅ Engine da Dashboard está 100% funcional e testado
- ✅ Componentes reutilizáveis (`GridCardContainer`, utils, etc.)
- ✅ Arquitetura bem definida e documentada
- ✅ Sistema de permissões já integrado na Dashboard
- ✅ Persistência multi-camada robusta

**Pontos de Atenção:**
- ⚠️ Permissões clínicas devem ser validadas card por card
- ⚠️ Real-time de sessions precisa ser preservado
- ⚠️ Estado de tabs pode conflitar com edit mode
- ⚠️ Registry de cards patient precisa ser criado do zero

### 7.2 Complexidade Estimada

| Componente | Complexidade | Tempo Estimado |
|------------|-------------|----------------|
| Hook `usePatientOverviewLayout` | MÉDIA | 1 dia |
| Registry `patientOverviewCardRegistry` | ALTA | 2-3 dias |
| Integração no `PatientDetail.tsx` | ALTA | 2 dias |
| Cards MVP (12 cards) | MÉDIA | 2 dias |
| Testes e QA | MÉDIA | 1 dia |
| **TOTAL** | - | **8-9 dias** |

### 7.3 Plano de Implementação Sugerido

#### FASE C1.1 - Setup (1 dia)
- [ ] Criar `usePatientOverviewLayout.ts` (fork de useDashboardLayout)
- [ ] Criar `defaultLayoutPatientOverview.ts`
- [ ] Atualizar `PATIENT_SECTIONS` com grid configs

#### FASE C1.2 - Grid Integration (2 dias)
- [ ] Substituir `ResizableCard` por `GridCardContainer`
- [ ] Integrar hook no PatientDetail.tsx (apenas Visão Geral)
- [ ] Adicionar botões de controle (Edit, Save, Cancel, Reset)
- [ ] Conectar AddCardDialog com nova API

#### FASE C1.3 - Cards MVP (2 dias)
- [ ] Criar `patientOverviewCardRegistry.tsx`
- [ ] Implementar 4 cards financeiros
- [ ] Implementar 3 cards clínicos
- [ ] Implementar 3 cards de sessões
- [ ] Implementar 2 cards de contato

#### FASE C1.4 - Refinamento (2 dias)
- [ ] Auto-save com debounce
- [ ] Validação de permissões em cada card
- [ ] Desabilitar troca de tabs durante edit
- [ ] Feedback visual de salvamento
- [ ] Toast notifications

#### FASE C1.5 - QA e Merge (1 dia)
- [ ] Teste de permissões clínicas
- [ ] Teste de real-time
- [ ] Teste de navegação entre tabs
- [ ] Teste de rollback
- [ ] Code review
- [ ] Merge na main

### 7.4 Confirmação de Prontidão

✅ **ESTOU PRONTO PARA INICIAR A TRACK C1**

**Pendências antes de C1.1:**
1. ✅ Definir LAYOUT_TYPE (sugestão: `patient-overview-grid`)
2. ✅ Confirmar lista de cards MVP (sugestão: 12 cards)
3. ✅ Decidir se fork ou reuso de hook (sugestão: fork)

**Próximo Passo:**
Aguardo sua aprovação para iniciar **FASE C1.1 - Setup**.

---

**FIM DA AUDITORIA C1.0**
