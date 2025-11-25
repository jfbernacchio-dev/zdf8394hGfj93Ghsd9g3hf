# 📋 FASE C1.0 — AUDITORIA COMPLETA

**Data:** 2025-11-25  
**Objetivo:** Auditoria técnica preparatória para TRACK C1 (migração do sistema de layout da aba "Visão Geral" do PatientDetail)

---

## 1. DIAGNÓSTICO DO PATIENTDETAIL.TSX ATUAL

### 1.1. Como Funciona Hoje o Sistema de Cards da "Visão Geral"

**Localização do código:** `src/pages/PatientDetail.tsx` (linhas 63-2638)

#### Sistema Atual de Layout

O PatientDetail usa um **sistema manual de posicionamento baseado em CSS Transform** com os seguintes componentes:

**A) Componentes Principais:**
- `ResizableCard` (src/components/ResizableCard.tsx)
  - Drag & drop manual via event handlers
  - Resize bidirecional (8 handles: N, S, E, W, NE, NW, SE, SW)
  - Posicionamento via `transform: translate(x, y)`
  - Dimensionamento via `width` e `height` em pixels
  - Guias de alinhamento visuais
  - Persistência em `localStorage` por card

- `ResizableSection` (src/components/ResizableSection.tsx)
  - Resize vertical apenas (top/bottom handles)
  - Altura controlada via `minHeight` e `height`
  - Persistência em `localStorage` por seção

**B) Estrutura de Estado:**
```typescript
// Estados temporários durante edição
const [tempSizes, setTempSizes] = useState<Record<string, { width, height, x, y }>>({});
const [tempSectionHeights, setTempSectionHeights] = useState<Record<string, number>>({});

// Controle de modo de edição
const [isEditMode, setIsEditMode] = useState(false);

// Cards visíveis
const [visibleCards, setVisibleCards] = useState<string[]>([]);
```

**C) Persistência:**
```typescript
// LocalStorage por card individual
localStorage.setItem(`card-size-${cardId}`, JSON.stringify({ width, height, x, y }));

// LocalStorage por seção
localStorage.setItem(`section-height-${sectionId}`, height.toString());

// Lista de cards visíveis
localStorage.setItem('visible-cards', JSON.stringify(visibleCardIds));
```

**D) Layout Padrão:**
- Definido em `src/lib/defaultLayoutEvolution.ts`
- Estrutura:
```typescript
export const DEFAULT_LAYOUT = {
  sectionHeights: {
    'evolution-charts-section': 800,
  },
  visibleCards: ['evolution-chart-consciousness', ...],
  cardSizes: {
    'evolution-chart-consciousness': { width: 590, height: 320, x: 12, y: 11 },
    ...
  }
};
```

#### Fluxo de Edição

1. **Entrar em modo de edição:**
   - `setIsEditMode(true)`
   - Carrega tamanhos atuais para `tempSizes` e `tempSectionHeights`

2. **Arrastar card:**
   - `ResizableCard` → `handleDragStart` → atualiza `tempSizes` via `onTempSizeChange`
   - Posição atualizada em tempo real via callback

3. **Redimensionar card:**
   - `ResizableCard` → `handleMouseDown` → atualiza `tempSizes` via `onTempSizeChange`
   - Calcula novas dimensões baseado no delta do mouse

4. **Salvar:**
   - Grava todos os `tempSizes` em `localStorage` individualmente
   - Grava todos os `tempSectionHeights` em `localStorage`
   - `setIsEditMode(false)`
   - **NÃO HÁ PERSISTÊNCIA EM SUPABASE**

5. **Cancelar:**
   - Descarta `tempSizes` e `tempSectionHeights`
   - Recarrega página (`window.location.reload()`)

#### Sistema de AddCard

**NÃO EXISTE sistema integrado de adicionar cards**. O código atual:
- Tem componente `AddCardDialog` importado (linha 44)
- Tem estado `isAddCardDialogOpen` (linha 129)
- **MAS** não há implementação funcional de adicionar cards dinamicamente
- Cards são fixos no layout padrão

### 1.2. Dependências Externas

**Imports relevantes:**
```typescript
import { ResizableCard } from '@/components/ResizableCard';
import { ResizableSection } from '@/components/ResizableSection';
import { DEFAULT_LAYOUT, resetToDefaultLayout } from '@/lib/defaultLayoutEvolution';
import type { CardConfig } from '@/types/cardTypes';
import { AddCardDialog } from '@/components/AddCardDialog';
```

**Sistema NÃO usa:**
- ❌ `react-grid-layout`
- ❌ `useDashboardLayout` hook
- ❌ `GridCardContainer`
- ❌ Supabase para persistência de layout

### 1.3. O Que Existe Hoje Que Será Substituído

**Componentes a substituir:**
1. `ResizableCard` → por sistema react-grid-layout
2. `ResizableSection` → por collapsible sections sem resize vertical manual
3. Estados `tempSizes` e `tempSectionHeights` → gerenciados por `useDashboardLayout`
4. Lógica de save/cancel manual → auto-save do hook

**Estruturas de dados a substituir:**
1. `cardSizes: { cardId: { width, height, x, y } }` → `cardLayouts: [{ i, x, y, w, h }]`
2. localStorage direto → Supabase + localStorage (via hook)
3. `sectionHeights` → collapsible sections sem altura controlada

**Funções a remover:**
- Todos os handlers de mouse (`handleDragStart`, `handleMouseDown`, etc.) do `ResizableCard`
- Lógica de alinhamento manual (guides)
- Cálculos manuais de posição e dimensão

### 1.4. O Que NÃO Deve Ser Tocado

**MÓDULOS SENSÍVEIS - NÃO ALTERAR:**

1. **Permissões e Acesso:**
   - `useEffectivePermissions()` hook (linha 89-94)
   - `checkPatientAccess` sistema (linha 53, 204-226)
   - `accessLevel` e `accessDeniedReason` states
   - Lógica de controle de acesso clínico/financeiro

2. **Sistema de Sessões:**
   - Criação/edição de sessões (Dialog, linhas 2208-2470)
   - Listagem de sessões (linhas 1977-2048)
   - Filtros de período e status
   - Toggle de status attended/scheduled
   - Cálculo de payment status (`getSessionPaymentStatus`)
   - Integração com NFSe

3. **Sistema de Faturamento:**
   - Tab "billing" completa (linhas 2052-2163)
   - Geração de invoices
   - Integração com `IssueNFSeDialog`
   - Cálculos financeiros (unpaid, total, etc.)

4. **Sistema Clínico:**
   - Tab "complaint" (linhas 2166-2181)
   - Tab "evolution" (linhas 2184-2199)
   - Componentes `ClinicalComplaintSummary` e `ClinicalEvolution`
   - **IMPORTANTE:** A aba "Visão Geral" (overview) tem cards de evolução, MAS o componente `ClinicalEvolution` é SEPARADO e NÃO deve ser alterado

5. **Sistema de Arquivos:**
   - Tab "files" (linhas 2202-2204)
   - Componente `PatientFiles`

6. **Dados e Estados do Paciente:**
   - `loadData()` function (linhas 271-338)
   - Estados: `patient`, `sessions`, `allSessions`, `nfseIssued`
   - `userProfile` state
   - Real-time subscriptions (Supabase channels, linhas 228-242)

7. **Navegação e Routing:**
   - useParams, useNavigate, useLocation
   - Tab system (Tabs component)
   - Redirect logic baseada em `location.state`

**ÁREAS QUE SERÃO MODIFICADAS (escopo restrito):**

✅ **TabsContent "overview" APENAS** (linhas ~1700-1897):
- Sistema de cards resizable
- Sistema de seções resizable
- Botões de edição/save/cancel
- AddCardDialog
- **Tudo dentro do `<TabsContent value="overview">`**

---

## 2. DIAGNÓSTICO DO DASHBOARDEXAMPLE.TSX

### 2.1. Arquitetura do Engine de Grid

**Localização:** `src/pages/DashboardExample.tsx` (linhas 1-826)

#### Componentes Principais

**A) GridCardContainer**
- **Arquivo:** `src/components/GridCardContainer.tsx`
- **Função:** Wrapper para react-grid-layout
- **Características:**
  - Grid de 12 colunas
  - rowHeight: 30px (menor que o padrão para mais controle)
  - Drag handle: `.drag-handle` class
  - Compactação vertical automática
  - Reflow habilitado (empurra outros cards)
  - Margem entre cards: 16px
  
```typescript
<GridLayout
  cols={12}
  rowHeight={30}
  width={containerWidth}
  isDraggable={isEditMode}
  isResizable={isEditMode}
  onLayoutChange={handleLayoutChange}
  draggableHandle=".drag-handle"
  compactType="vertical"
  preventCollision={false}
  margin={[16, 16]}
/>
```

**B) useDashboardLayout Hook**
- **Arquivo:** `src/hooks/useDashboardLayout.ts`
- **Função:** Gerenciar estado e persistência do layout
- **Retorna:**
```typescript
{
  layout: DashboardGridLayout,
  loading: boolean,
  saving: boolean,
  isModified: boolean,
  updateLayout: (sectionId, newLayout: GridCardLayout[]) => void,
  addCard: (sectionId, cardId) => void,
  removeCard: (sectionId, cardId) => void,
  saveLayout: () => Promise<void>,
  resetLayout: () => Promise<void>,
  hasUnsavedChanges: boolean,
}
```

**C) Sistema de Seções**
- **Arquivo:** `src/lib/defaultSectionsDashboard.ts`
- **Estrutura:**
```typescript
export const DASHBOARD_SECTIONS: Record<string, SectionConfig> = {
  'dashboard-financial': {
    id: 'dashboard-financial',
    name: 'Financeira',
    description: 'Receitas, pagamentos pendentes e NFSe',
    permissionConfig: {
      primaryDomain: 'financial',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [...],
    defaultHeight: 400,
    collapsible: true,
    startCollapsed: false,
  },
  ...
}
```

**D) Layout Padrão Grid**
- **Arquivo:** `src/lib/defaultLayoutDashboardExample.ts`
- **Estrutura:**
```typescript
export const DEFAULT_DASHBOARD_GRID_LAYOUT: DashboardGridLayout = {
  'dashboard-financial': {
    cardLayouts: [
      { i: 'dashboard-expected-revenue', x: 0, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-actual-revenue', x: 3, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      ...
    ]
  },
  ...
}
```

**E) Card Registry**
- **Arquivo:** `src/lib/dashboardCardRegistry.tsx`
- **Função:** Mapear cardId → Componente React
- **Exemplo:**
```typescript
export const renderDashboardCard = (cardId: string, props: CardProps) => {
  switch (cardId) {
    case 'dashboard-expected-revenue':
      return <DashboardExpectedRevenue {...props} />;
    // ... mais cards
  }
};
```

### 2.2. Fluxo de Funcionamento

#### Inicialização

1. **Mount do componente:**
   ```typescript
   const { layout, loading, ... } = useDashboardLayout();
   ```

2. **Hook carrega layout:**
   - Busca em Supabase (`user_layout_preferences`)
   - Se não encontrar, usa `DEFAULT_DASHBOARD_GRID_LAYOUT`
   - Aplica customizações de localStorage por cima
   - Merge garante que novas sections apareçam (ex: dashboard-team)

3. **Filtragem por permissões:**
   ```typescript
   const visibleSections = useMemo(() => {
     // Filtra sections baseado em permissionContext
     // Remove sections sem cards visíveis
   }, [permissionContext, permissionsLoading]);
   ```

#### Modo de Edição

1. **Ativar edit mode:**
   ```typescript
   <Button onClick={() => setIsEditMode(true)}>
     <Pencil />
     Editar Layout
   </Button>
   ```

2. **Arrastar/Redimensionar:**
   - Usuário arrasta/redimensiona card via handles do react-grid-layout
   - `GridCardContainer` → `onLayoutChange` → `updateLayout(sectionId, newLayout)`
   - `updateLayout` salva em localStorage imediatamente
   - Debounce auto-save para Supabase após 2s

3. **Adicionar Card:**
   ```typescript
   <AddCardDialog
     onAddCard={(sectionId, cardId) => {
       addCard(sectionId, cardId);
       // Calcula próxima posição disponível
       // Adiciona card com w:3, h:2
     }}
   />
   ```

4. **Remover Card:**
   - Remove do layout via `removeCard(sectionId, cardId)`
   - Limpa localStorage
   - Auto-save em Supabase

5. **Salvar/Cancelar:**
   ```typescript
   // Salvar
   await saveLayout(); // Persiste em Supabase
   setIsEditMode(false);
   
   // Cancelar
   if (isModified) {
     // Confirmação
   }
   window.location.reload(); // Recarrega estado original
   ```

6. **Reset:**
   ```typescript
   await resetLayout();
   // Limpa localStorage
   // Deleta de Supabase
   // Restaura DEFAULT_DASHBOARD_GRID_LAYOUT
   window.location.reload();
   ```

#### Auto-Save

```typescript
useEffect(() => {
  if (!isModified) return;
  
  const timeout = setTimeout(() => {
    saveLayout(); // Auto-save após 2s de inatividade
  }, DEBOUNCE_SAVE_MS);
  
  return () => clearTimeout(timeout);
}, [layout, isModified]);
```

### 2.3. Dependências e Utilitários

**Hooks:**
- `useDashboardLayout` - persistência e estado
- `useDashboardPermissions` - filtro de permissões
- `useOwnData` - dados próprios do usuário
- `useTeamData` - dados da equipe
- `useChartTimeScale` - escalas de tempo para gráficos

**Utilities:**
- `src/lib/gridLayoutUtils.ts`:
  - `findNextAvailablePosition(layout, width, height)` - encontra espaço livre
  - `validateGridLayout(layout)` - valida estrutura
  - `convertSequentialToGrid(oldLayout)` - migração de layouts legados
  - `calculatePixelWidth/Height` - conversão grid → pixels

**Types:**
```typescript
// src/types/cardTypes.ts
export interface GridCardLayout extends Layout {
  i: string;        // cardId único
  x: number;        // coluna inicial (0-11)
  y: number;        // linha inicial (0-∞)
  w: number;        // largura em colunas (1-12)
  h: number;        // altura em rows (1-∞)
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}
```

### 2.4. Sistema de Persistência

#### LocalStorage (Customizações Temporárias)

```typescript
// Por card individual
localStorage.setItem(`grid-card-${sectionId}-${cardId}`, JSON.stringify(cardLayout));

// Leitura
const saved = localStorage.getItem(`grid-card-${sectionId}-${cardId}`);
if (saved) {
  const parsed = JSON.parse(saved) as GridCardLayout;
  // Aplica por cima do layout base
}
```

#### Supabase (Persistência Definitiva)

```typescript
// Tabela: user_layout_preferences
{
  user_id: string,
  layout_type: 'dashboard-example-grid',
  layout_config: DashboardGridLayout, // JSON
  version: number,
  updated_at: timestamp
}

// Insert ou Update
await supabase
  .from('user_layout_preferences')
  .upsert({
    user_id: user.id,
    layout_type: 'dashboard-example-grid',
    layout_config: layout,
    version: existing ? existing.version + 1 : 1,
  });
```

#### Hierarquia de Prioridade

1. **localStorage** (customizações ativas) - mais alta
2. **Supabase** (preferências salvas)
3. **DEFAULT_DASHBOARD_GRID_LAYOUT** (fallback)

### 2.5. O Que DEVE Ser Portado

**✅ Componentes:**
1. `GridCardContainer` (EXATO como está)
2. `useDashboardLayout` hook (adaptar nomes de tabelas/tipos)
3. Sistema de seções colapsáveis (sem resize vertical)
4. Controles de edit mode (botões salvar/cancelar/reset)
5. `AddCardDialog` integração

**✅ Estruturas:**
1. `GridCardLayout` type system
2. Persistência Supabase + localStorage
3. Sistema de permissões por seção
4. Auto-save com debounce
5. Validação de layout

**✅ Utilities:**
1. `findNextAvailablePosition`
2. `validateGridLayout`
3. Merge de layouts (DEFAULT + Supabase + localStorage)

### 2.6. O Que NÃO Deve Ser Portado

**❌ Específicos do Dashboard:**
1. Cards de métricas dashboard (revenue, sessions, etc.)
2. Lógica de agregação de dados (aggregatedData, teamAggregatedData)
3. Hooks de dados (`useTeamData`, `useOwnData`)
4. Filtros de período (period, customStartDate, etc.)
5. Sistema de time scales (`useChartTimeScale`)
6. Permissões de nível organizacional (dashboard-specific)

**❌ Seções Dashboard:**
1. `DASHBOARD_SECTIONS` → criar `PATIENT_OVERVIEW_SECTIONS`
2. `DEFAULT_DASHBOARD_GRID_LAYOUT` → criar `DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT`
3. `dashboardCardRegistry.tsx` → usar registry específico de patient

---

## 3. MAPA DE DIVERGÊNCIAS

### 3.1. Diferenças Arquiteturais

| Aspecto | PatientDetail (Atual) | DashboardExample (Referência) |
|---------|----------------------|------------------------------|
| **Sistema de Grid** | Manual (CSS Transform) | react-grid-layout |
| **Posicionamento** | Absoluto (x, y em px) | Grid 12 cols (x, y em cols/rows) |
| **Dimensionamento** | Pixels (width, height) | Grid units (w, h em cols/rows) |
| **Drag & Drop** | Event handlers manuais | react-grid-layout handles |
| **Resize** | 8 handles manuais | react-grid-layout handles |
| **Reflow** | Nenhum | Automático (vertical compaction) |
| **Persistência** | localStorage apenas | Supabase + localStorage |
| **Hook Central** | ❌ Não existe | ✅ useDashboardLayout |
| **Auto-save** | ❌ Não existe | ✅ Debounced (2s) |
| **AddCard** | ❌ Não funcional | ✅ Totalmente integrado |
| **Seções** | ResizableSection (com altura) | Collapsible apenas |
| **Estado** | Local (tempSizes, etc.) | Gerenciado pelo hook |

### 3.2. Diferenças de Estrutura de Dados

**PatientDetail (Atual):**
```typescript
// defaultLayoutEvolution.ts
{
  sectionHeights: { 'evolution-charts-section': 800 },
  visibleCards: ['evolution-chart-consciousness', ...],
  cardSizes: {
    'evolution-chart-consciousness': { 
      width: 590,   // pixels
      height: 320,  // pixels
      x: 12,        // pixels
      y: 11         // pixels
    },
    ...
  }
}
```

**DashboardExample (Referência):**
```typescript
// defaultLayoutDashboardExample.ts
type DashboardGridLayout = Record<string, GridSectionLayout>;

interface GridSectionLayout {
  cardLayouts: GridCardLayout[];
}

interface GridCardLayout {
  i: string;        // cardId
  x: number;        // coluna (0-11)
  y: number;        // row (0-∞)
  w: number;        // largura em colunas (1-12)
  h: number;        // altura em rows
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

// Exemplo:
{
  'dashboard-financial': {
    cardLayouts: [
      { i: 'dashboard-expected-revenue', x: 0, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-actual-revenue', x: 3, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
    ]
  },
  'dashboard-administrative': {
    cardLayouts: [...]
  },
  ...
}
```

### 3.3. Cards na Visão Geral vs Dashboard

**Cards Patient Overview (atuais na aba "Visão Geral"):**

Não há cards implementados! A aba "overview" atual (linhas 1700-1897) é um **mockup vazio**. Ela apenas renderiza:
- Botões de controle (editar, salvar, cancelar, add card)
- Sistema de seções vazias
- **NÃO HÁ CARDS SENDO RENDERIZADOS**

**Cards Esperados (baseados em PATIENT_SECTIONS):**
```typescript
// src/lib/defaultSectionsPatient.ts (já existe mas não é usado)
'patient-financial': [
  'patient-stat-revenue-month',
  'patient-stat-pending-sessions',
  'patient-stat-nfse-count',
],
'patient-clinical': [
  'patient-complaints-summary',
  'patient-medications-list',
],
'patient-sessions': [
  'patient-sessions-timeline',
],
'patient-contact': [
  'patient-contact-info',
],
```

### 3.4. Pontos de Conflito Potencial

**🔴 CRÍTICO - Alto risco de quebra:**

1. **Estado de edição compartilhado:**
   - PatientDetail tem múltiplas tabs
   - isEditMode pode interferir com outras tabs se não isolado corretamente
   - **Solução:** Garantir que isEditMode só afete TabsContent "overview"

2. **Permissões clínicas:**
   - Cards de evolução requerem `canAccessClinical`
   - PatientDetail já tem sistema de `accessLevel` (none/view/full)
   - **Solução:** Integrar com sistema existente, não substituir

3. **Dados de paciente:**
   - Cards precisam de dados do paciente (sessions, patient, nfseIssued)
   - Já carregados em `loadData()`
   - **Solução:** Passar como props para cards

4. **Real-time updates:**
   - PatientDetail tem subscription Supabase para sessions
   - Não quebrar ao adicionar grid system
   - **Solução:** Manter subscription intacto

**🟡 MÉDIO - Requer atenção:**

5. **localStorage namespace collision:**
   - Evitar conflito com chaves existentes
   - PatientDetail usa: `card-size-*`, `section-height-*`, `visible-cards`
   - **Solução:** Usar prefixo específico: `patient-overview-grid-card-*`

6. **Responsividade:**
   - PatientDetail é usado em mobile (BottomNav)
   - GridCardContainer precisa adaptar
   - **Solução:** Usar breakpoints e containerWidth dinâmico

7. **Altura de seções:**
   - Dashboard não controla altura de seções
   - PatientDetail atual tem ResizableSection
   - **Solução:** Remover controle de altura, usar collapsible apenas

**🟢 BAIXO - Facilmente contornável:**

8. **Ícones e labels:**
   - Cards patient vs dashboard têm nomenclaturas diferentes
   - **Solução:** Criar registry específico de patient

9. **Cores e estilos:**
   - Manter consistência visual
   - **Solução:** Usar design system existente

---

## 4. REQUISITOS TÉCNICOS PARA TRACK C1

### 4.1. Arquivos que Precisarão Ser MODIFICADOS

**Arquivo principal:**
1. `src/pages/PatientDetail.tsx`
   - **Seção afetada:** `<TabsContent value="overview">` (linhas ~1700-1897)
   - **Mudanças:**
     - Substituir ResizableCard por GridCardContainer
     - Integrar useDashboardLayout hook
     - Adicionar renderização de cards via registry
     - Implementar controles edit/save/cancel
     - Integrar AddCardDialog

**Arquivos de configuração:**
2. `src/lib/defaultLayoutEvolution.ts`
   - **Renomear para:** `src/lib/defaultLayoutPatientOverview.ts`
   - **Mudanças:**
     - Converter estrutura de `cardSizes` para `GridCardLayout[]`
     - Remover `sectionHeights` (não usado mais)
     - Criar `PATIENT_OVERVIEW_SECTIONS` similares a `DASHBOARD_SECTIONS`

3. `src/lib/defaultSectionsPatient.ts`
   - **Mudanças:**
     - Já existe mas precisa ser expandido
     - Adicionar configurações de collapsible, defaultHeight, etc.
     - Alinhar com estrutura de `DASHBOARD_SECTIONS`

### 4.2. Arquivos que Precisarão Ser CRIADOS

**Novos componentes:**
1. `src/lib/patientOverviewCardRegistry.tsx`
   - Função: Mapear cardId patient → Componente React
   - Referência: `src/lib/dashboardCardRegistry.tsx`
   - Cards a implementar:
     ```typescript
     'patient-stat-revenue-month' → <PatientStatRevenueMonth />
     'patient-stat-pending-sessions' → <PatientStatPendingSessions />
     'patient-complaints-summary' → <PatientComplaintsSummary />
     'patient-sessions-timeline' → <PatientSessionsTimeline />
     // ... etc
     ```

2. `src/lib/defaultLayoutPatientOverview.ts`
   - Função: Definir layout grid padrão para patient overview
   - Estrutura:
     ```typescript
     export const DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT: PatientOverviewGridLayout = {
       'patient-overview-financial': {
         cardLayouts: [
           { i: 'patient-stat-revenue-month', x: 0, y: 0, w: 3, h: 3, ... },
           { i: 'patient-stat-pending-sessions', x: 3, y: 0, w: 3, h: 3, ... },
           { i: 'patient-stat-nfse-count', x: 6, y: 0, w: 3, h: 3, ... },
         ]
       },
       'patient-overview-clinical': {
         cardLayouts: [
           { i: 'patient-complaints-summary', x: 0, y: 0, w: 6, h: 4, ... },
           { i: 'patient-medications-list', x: 6, y: 0, w: 6, h: 4, ... },
         ]
       },
       'patient-overview-sessions': {
         cardLayouts: [
           { i: 'patient-sessions-timeline', x: 0, y: 0, w: 12, h: 6, ... },
         ]
       },
       'patient-overview-contact': {
         cardLayouts: [
           { i: 'patient-contact-info', x: 0, y: 0, w: 6, h: 4, ... },
         ]
       },
     };
     ```

**Novos hooks:**
3. `src/hooks/usePatientOverviewLayout.ts`
   - Função: Hook de persistência específico para patient overview
   - Baseado em: `src/hooks/useDashboardLayout.ts`
   - Mudanças:
     ```typescript
     const LAYOUT_TYPE = 'patient-overview-grid'; // Namespace único
     const DEBOUNCE_SAVE_MS = 2000;
     
     // Mesma interface, tipos adaptados
     interface UsePatientOverviewLayoutReturn {
       layout: PatientOverviewGridLayout,
       // ... resto igual
     }
     ```

**Novos types:**
4. `src/types/patientOverviewTypes.ts` (opcional, pode usar cardTypes.ts)
   - Se necessário, definir types específicos
   - Mas preferencialmente reusar `GridCardLayout` de `cardTypes.ts`

### 4.3. Componentes Card a Implementar

**Prioridade ALTA (MVP):**

1. **Financial Cards:**
   ```typescript
   <PatientStatRevenueMonth />       // Faturamento do mês
   <PatientStatPendingSessions />    // Sessões pendentes de pagamento
   <PatientStatNfseCount />          // Total de NFSes emitidas
   ```

2. **Clinical Cards:**
   ```typescript
   <PatientComplaintsSummary />      // Resumo de queixas ativas
   <PatientMedicationsList />        // Lista de medicações atuais
   ```

3. **Sessions Cards:**
   ```typescript
   <PatientSessionsTimeline />       // Timeline visual de sessões
   ```

4. **Contact Cards:**
   ```typescript
   <PatientContactInfo />            // Telefone, email, endereço
   ```

**Prioridade MÉDIA (após MVP):**

5. **Financial Additional:**
   ```typescript
   <PatientStatRevenueYear />        // Faturamento anual
   <PatientStatTotalDebt />          // Dívida total acumulada
   <PatientChartPaymentHistory />    // Gráfico histórico de pagamentos
   <PatientChartRevenueTrend />      // Tendência de receita
   ```

6. **Clinical Additional:**
   ```typescript
   <PatientDiagnosesActive />        // Diagnósticos ativos
   <PatientVulnerabilities />        // Vulnerabilidades identificadas
   ```

7. **Sessions Additional:**
   ```typescript
   <PatientSessionsCalendar />       // Calendário de sessões
   <PatientSessionsStats />          // Estatísticas de frequência
   <PatientAttendanceRate />         // Taxa de comparecimento
   ```

**Prioridade BAIXA (futuro):**

8. **Advanced:**
   ```typescript
   <PatientFilesManager />           // Gerenciador de arquivos (já existe como PatientFiles)
   <PatientQuickActions />           // Ações rápidas
   <PatientNfseList />               // Lista de NFSes
   <PatientTimeline />               // Timeline completa de eventos
   ```

### 4.4. Dependências Auxiliares a Portar

**Grid Utilities (já existem):**
- ✅ `src/lib/gridLayoutUtils.ts` - reusar como está
- ✅ `src/types/cardTypes.ts` - reusar GridCardLayout

**Componentes Base (já existem):**
- ✅ `src/components/GridCardContainer.tsx` - reusar EXATO
- ✅ `src/components/AddCardDialog.tsx` - adaptar availableCards

**Novo - Layout Management:**
- ⚠️ Criar `src/lib/patientOverviewLayoutUtils.ts` (opcional)
  - Funções helper específicas se necessário
  - Ex: filtrar cards por permissões clínicas

### 4.5. Estados e Hooks Necessários

**Estados do PatientDetail (adicionar):**
```typescript
// Modo de edição (já existe parcialmente)
const [isEditMode, setIsEditMode] = useState(false);

// Hook de layout (NOVO)
const {
  layout,
  loading: layoutLoading,
  saving: layoutSaving,
  isModified,
  updateLayout,
  addCard,
  removeCard,
  saveLayout,
  resetLayout,
  hasUnsavedChanges,
} = usePatientOverviewLayout(id); // id do paciente

// Dialog de adicionar card (já existe)
const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);

// Seções colapsadas (NOVO)
const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
```

**Props para Cards:**
```typescript
interface PatientCardProps {
  patient: any;           // Dados do paciente
  sessions: any[];        // Todas as sessões
  nfseIssued: any[];      // NFSes emitidas
  isEditMode?: boolean;   // Modo de edição
  className?: string;
}
```

### 4.6. Persistência e Tipos Supabase

**Tabela: user_layout_preferences**
```sql
-- Já existe, apenas adicionar novo layout_type
{
  user_id: UUID,
  layout_type: VARCHAR, -- 'patient-overview-grid'
  layout_config: JSONB, -- PatientOverviewGridLayout
  version: INTEGER,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

**Tipo no Hook:**
```typescript
const LAYOUT_TYPE = 'patient-overview-grid';

await supabase
  .from('user_layout_preferences')
  .upsert({
    user_id: user.id,
    layout_type: LAYOUT_TYPE,
    layout_config: layout,
    version: existing ? existing.version + 1 : 1,
  });
```

### 4.7. Checklist de Segurança

**Garantir que NÃO será tocado:**

- [ ] Verificar que `loadData()` permanece intacto
- [ ] Verificar que subscription Supabase (real-time) permanece intacto
- [ ] Verificar que tabs "sessions", "billing", "complaint", "evolution", "files" não foram alteradas
- [ ] Verificar que sistema de permissões `useEffectivePermissions` não foi modificado
- [ ] Verificar que `checkPatientAccess` continua funcionando
- [ ] Verificar que estados `patient`, `sessions`, `nfseIssued` não foram renomeados
- [ ] Verificar que Dialog de sessões não foi alterado
- [ ] Verificar que `IssueNFSeDialog` continua funcionando
- [ ] Verificar que `ClinicalComplaintSummary` e `ClinicalEvolution` não foram alterados
- [ ] Verificar que `PatientFiles` não foi alterado

**Garantir que FOI implementado:**

- [ ] GridCardContainer integrado em TabsContent "overview"
- [ ] usePatientOverviewLayout hook funcionando
- [ ] Persistência Supabase + localStorage funcionando
- [ ] Cards renderizando via registry
- [ ] AddCardDialog funcional
- [ ] Edit mode isolado da tab "overview"
- [ ] Auto-save após 2s
- [ ] Botões salvar/cancelar/reset funcionando
- [ ] Seções colapsáveis sem altura controlada
- [ ] Permissões clínicas respeitadas nos cards

---

## 5. MAPA DE RISCOS E MITIGAÇÕES

### 5.1. Riscos CRÍTICOS 🔴

**RISCO 1: Quebra do sistema de permissões clínicas**
- **Descrição:** PatientDetail tem controle fino de acesso clínico via `checkPatientAccess`. Cards de evolução requerem permissão clinical.
- **Impacto:** Usuários sem permissão poderiam ver dados clínicos sensíveis
- **Probabilidade:** ALTA (se não validar permissões nos cards)
- **Mitigação:**
  ```typescript
  // Em CADA card clínico, validar:
  const { canAccessClinical } = useEffectivePermissions();
  if (!canAccessClinical) {
    return <Card><CardContent>Sem permissão</CardContent></Card>;
  }
  ```
- **Checklist:**
  - [ ] Todos os cards clínicos validam `canAccessClinical`
  - [ ] Registry filtra cards não autorizados
  - [ ] Teste com usuário sem permissão clinical

**RISCO 2: Quebra do real-time de sessões**
- **Descrição:** PatientDetail tem subscription Supabase que recarrega dados quando sessões mudam
- **Impacto:** Dados desatualizados após edições de sessão
- **Probabilidade:** MÉDIA (se tocar na estrutura de states)
- **Mitigação:**
  - NÃO renomear `sessions`, `patient`, `nfseIssued`
  - NÃO remover `loadData()`
  - NÃO tocar no `useEffect` de subscription (linhas 228-242)
- **Checklist:**
  - [ ] Subscription permanece intacta
  - [ ] `loadData()` ainda é chamada
  - [ ] Estados não foram renomeados

**RISCO 3: Conflito de estado entre tabs**
- **Descrição:** PatientDetail tem múltiplas tabs. isEditMode pode afetar outras tabs se não isolado
- **Impacto:** Edit mode pode interferir com tabs "sessions", "billing", etc.
- **Probabilidade:** ALTA (se isEditMode for global)
- **Mitigação:**
  ```typescript
  // Garantir que isEditMode só afeta overview:
  <TabsContent value="overview">
    {isEditMode ? (
      <GridCardContainer isEditMode={true} />
    ) : (
      <GridCardContainer isEditMode={false} />
    )}
  </TabsContent>
  
  // Outras tabs não devem ver isEditMode
  <TabsContent value="sessions">
    {/* Não usa isEditMode */}
  </TabsContent>
  ```
- **Checklist:**
  - [ ] isEditMode só afeta TabsContent "overview"
  - [ ] Outras tabs não foram alteradas
  - [ ] Transição entre tabs não quebra

**RISCO 4: Quebra de dados financeiros**
- **Descrição:** Cards financeiros dependem de cálculos complexos (paid, nfse_issued, monthly_price)
- **Impacto:** Valores errados exibidos
- **Probabilidade:** MÉDIA (se não reusar lógica existente)
- **Mitigação:**
  - Reusar `getSessionPaymentStatus()` (linha 341-375)
  - Reusar lógica de `monthly_price` (linhas 2088-2101, 2111-2125)
  - NÃO criar cálculos novos, copiar existentes
- **Checklist:**
  - [ ] Cards financeiros reusam `getSessionPaymentStatus`
  - [ ] Lógica de `monthly_price` preservada
  - [ ] Valores conferidos manualmente

### 5.2. Riscos MÉDIOS 🟡

**RISCO 5: Performance com muitos cards**
- **Descrição:** react-grid-layout pode ficar lento com muitos cards (>20)
- **Impacto:** UI travada durante resize/drag
- **Probabilidade:** BAIXA (patient overview tem poucos cards)
- **Mitigação:**
  - Limitar quantidade de cards renderizados
  - Usar `React.memo()` nos cards
  - Lazy loading de cards fora da viewport
- **Checklist:**
  - [ ] Cards usam `React.memo()`
  - [ ] Testar com 20+ cards

**RISCO 6: Conflito de localStorage**
- **Descrição:** Chaves existentes (`card-size-*`, `visible-cards`) podem colidir com novo sistema
- **Impacto:** Dados corrompidos ou perdidos
- **Probabilidade:** ALTA (se usar mesmas chaves)
- **Mitigação:**
  - Usar namespace específico:
    ```typescript
    localStorage.setItem(`patient-overview-grid-card-${sectionId}-${cardId}`, ...);
    // NÃO usar `card-size-*` ou `visible-cards`
    ```
- **Checklist:**
  - [ ] Nenhuma chave nova começa com `card-size-`
  - [ ] Nenhuma chave nova começa com `section-height-`
  - [ ] Usar prefixo `patient-overview-grid-`

**RISCO 7: Responsividade quebrada**
- **Descrição:** GridCardContainer pode não adaptar bem em mobile
- **Impacto:** Layout quebrado em telas pequenas
- **Probabilidade:** MÉDIA (mobile é crítico no PatientDetail)
- **Mitigação:**
  - Usar breakpoints:
    ```typescript
    <GridCardContainer
      width={window.innerWidth < 768 ? window.innerWidth - 32 : 1200}
    />
    ```
  - Testar em mobile
- **Checklist:**
  - [ ] Testar em mobile (BottomNav)
  - [ ] Cards adaptam largura em telas pequenas
  - [ ] Drag funciona em touch screens

### 5.3. Riscos BAIXOS 🟢

**RISCO 8: Cards sem dados**
- **Descrição:** Cards podem renderizar sem dados carregados
- **Impacto:** Erros de undefined ou tela branca
- **Probabilidade:** BAIXA (dados já carregados)
- **Mitigação:**
  ```typescript
  if (!patient || !sessions) {
    return <Skeleton />;
  }
  ```
- **Checklist:**
  - [ ] Cards têm loading states
  - [ ] Cards tratam dados ausentes

**RISCO 9: Estilos inconsistentes**
- **Descrição:** Cards patient podem ter estilos diferentes dos cards dashboard
- **Impacto:** UI inconsistente
- **Probabilidade:** BAIXA (design system resolve)
- **Mitigação:**
  - Usar mesmos componentes base (Card, CardHeader, etc.)
  - Seguir padrões visuais do dashboard
- **Checklist:**
  - [ ] Cards usam design system
  - [ ] Cores e fontes consistentes

### 5.4. Plano de Rollback

**Se algo quebrar durante implementação:**

1. **Rollback Imediato (em desenvolvimento):**
   ```bash
   git checkout HEAD~1 src/pages/PatientDetail.tsx
   ```

2. **Rollback Parcial:**
   - Comentar seção de grid:
     ```typescript
     // <GridCardContainer>...</GridCardContainer>
     // Voltar para ResizableCard temporariamente
     ```

3. **Rollback Completo (em produção):**
   - Reverter commit inteiro da TRACK C1
   - Restaurar PatientDetail.tsx original
   - Limpar localStorage: `patient-overview-grid-*`
   - Deletar registros Supabase: `DELETE FROM user_layout_preferences WHERE layout_type = 'patient-overview-grid'`

**Garantias de segurança:**
- ✅ Código antigo não será deletado até confirmar que novo funciona
- ✅ Testes manuais completos antes de merge
- ✅ Backup de localStorage antes de implementar

---

## 6. CONCLUSÃO FINAL

### 6.1. Diagnóstico de Viabilidade

**Viabilidade Técnica: ✅ ALTA**

A migração é **100% viável** porque:

1. **Arquitetura limpa:** PatientDetail tem boa separação entre tabs
2. **Escopo restrito:** Apenas TabsContent "overview" será alterada
3. **Sistema comprovado:** react-grid-layout já funciona no DashboardExample
4. **Isolamento:** Não há dependências cruzadas críticas
5. **Rollback fácil:** Mudanças são localizadas e reversíveis

**Complexidade Estimada: 🟡 MÉDIA**

- **Simples:** Integração de GridCardContainer (já funciona)
- **Simples:** Hook de persistência (copiar e adaptar)
- **Médio:** Implementar cards de patient (20+ componentes novos)
- **Médio:** Garantir permissões clínicas em cada card
- **Simples:** Integração AddCardDialog (já existe)

**Tempo Estimado: 3-5 dias**

- Dia 1: Setup (hook, layout default, types)
- Dia 2: Integração GridCardContainer em PatientDetail
- Dia 3-4: Implementar cards MVP (financial, clinical, sessions, contact)
- Dia 5: Testes, ajustes, validação de permissões

### 6.2. Pré-requisitos para Iniciar

**Antes de começar TRACK C1, CONFIRMAR:**

- [ ] Código atual está funcionando 100%
- [ ] Backups feitos (git, localStorage, Supabase)
- [ ] Ambiente de desenvolvimento isolado
- [ ] Testes manuais documentados (checklist)
- [ ] Usuários de teste preparados (com/sem permissões)

**Documentação Necessária:**

- [ ] Especificação completa dos cards MVP
- [ ] Designs/wireframes dos cards (se houver)
- [ ] Regras de negócio para cálculos financeiros
- [ ] Critérios de permissão por card

### 6.3. Próximos Passos

**FASE C1.1 - Setup Inicial:**
1. Criar `src/hooks/usePatientOverviewLayout.ts`
2. Criar `src/lib/defaultLayoutPatientOverview.ts`
3. Criar `src/lib/patientOverviewCardRegistry.tsx` (vazio)
4. Atualizar `src/lib/defaultSectionsPatient.ts`

**FASE C1.2 - Integração Grid:**
1. Integrar GridCardContainer em TabsContent "overview"
2. Conectar usePatientOverviewLayout
3. Implementar botões edit/save/cancel/reset
4. Testar persistência Supabase + localStorage

**FASE C1.3 - Cards MVP:**
1. Implementar 4-6 cards prioritários
2. Validar permissões em cada card
3. Testar com dados reais

**FASE C1.4 - Refinamento:**
1. Integrar AddCardDialog
2. Testar responsividade
3. Validação final de permissões

**FASE C1.5 - QA e Merge:**
1. Testes manuais completos
2. Checklist de segurança
3. Merge para main

### 6.4. Confirmação de Prontidão

**Estou pronto para iniciar TRACK C1?**

✅ **SIM**, desde que:

1. O plano de implementação seja revisado seção por seção
2. Cada fase seja validada antes de seguir para a próxima
3. Testes manuais sejam feitos em CADA etapa
4. Nenhuma área sensível seja tocada sem confirmação explícita
5. Rollback esteja sempre disponível

**Recomendação:** 

Começar pela **FASE C1.1 (Setup)** - criar arquivos base sem tocar em PatientDetail.tsx ainda. Validar estruturas e tipos antes de integrar.

---

**FIM DO RELATÓRIO DE AUDITORIA FASE C1.0**

Data: 2025-11-25  
Status: ✅ COMPLETO  
Próximo: AGUARDANDO APROVAÇÃO PARA INICIAR FASE C1.1
