# 📋 FASE C1.10 — DOCUMENTAÇÃO CONSOLIDADA DA ABA "VISÃO GERAL"

**Data de criação**: 2025-11-25  
**Track**: C1 — PatientDetail / Overview Tab  
**Status**: ✅ Implementado e documentado

---

## 🎯 OBJETIVO DESTA DOCUMENTAÇÃO

Esta documentação consolida toda a arquitetura, pipeline de dados e decisões de design da aba "Visão Geral" do `PatientDetail.tsx`, implementada nas FASES C1.0 até C1.9.

O sistema foi desenhado para:
- **Modularidade**: Separação clara entre catálogo, permissões, layout e preferências
- **Extensibilidade**: Preparado para templates por role/abordagem clínica
- **Escalabilidade**: Pronto para evoluir de localStorage para Supabase
- **Manutenibilidade**: Código documentado, testado e com pipeline claro

---

## 📐 ARQUITETURA ATUAL DA VISÃO GERAL

### 🏗️ Localização no PatientDetail.tsx

A aba "Visão Geral" é uma das tabs do componente `PatientDetail.tsx`:

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
    <TabsTrigger value="evolution">Evolução Clínica</TabsTrigger>
    <TabsTrigger value="complaint">Queixa Clínica</TabsTrigger>
    <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
    <TabsTrigger value="billing">Faturamento</TabsTrigger>
    <TabsTrigger value="files">Arquivos</TabsTrigger>
  </TabsList>
  
  <TabsContent value="overview">
    {/* Sistema de cards documentado aqui */}
  </TabsContent>
</Tabs>
```

### 🧱 O que é fixo (não controlado por cards)

Estas partes **NÃO** fazem parte do sistema de cards e permanecem sempre visíveis:

1. **Header do paciente**:
   - Nome, foto, status
   - Badges (ficha encerrada, etc.)
   - Botões de ação (Editar, Nova Queixa)

2. **Banners de contexto**:
   - Banner de modo somente leitura (isReadOnly)
   - Banner de consentimento expirado (ConsentReminder)

3. **Navegação de tabs**:
   - TabsList com as abas do PatientDetail
   - Botão "Nova Nota"

### 🎴 O que é dinâmico (controlado por cards)

Estas partes **SÃO** controladas pelo sistema de cards:

1. **Seção de STAT CARDS** (cards estatísticos):
   - Cards de métricas e KPIs
   - Grid fixo (2 ou 5 colunas)
   - Sempre no topo da aba

2. **Seção de FUNCTIONAL CARDS** (cards funcionais):
   - Cards com funcionalidade (ações, info, formulários)
   - Grid flexível (1 ou 3 colunas)
   - Abaixo dos stat cards

---

## 🔄 PIPELINE DE CARDS (DETALHADO)

O pipeline segue uma ordem rigorosa de 5 etapas, aplicada separadamente para STAT e FUNCTIONAL cards:

### **ETAPA 1: Fonte de Verdade (Catálogo)**

**Arquivo**: `src/config/patientOverviewCards.ts`

O catálogo define TODOS os cards disponíveis no sistema:
- 11 stat cards (métricas)
- 9 functional cards (funcionalidade)

Cada card possui:
```typescript
interface PatientOverviewCardDefinition {
  id: string;                           // Ex: 'patient-stat-total'
  title: string;                        // Ex: 'Total no Mês'
  description: string;                  // Descrição técnica
  cardCategory: 'statistical' | 'functional';
  domain: PermissionDomain;             // clinical, financial, administrative, general
  requiresFinancialAccess?: boolean;    // Exige acesso financeiro
  requiresFullClinicalAccess?: boolean; // Exige acesso clínico completo
  blockedFor?: string[];                // Roles explicitamente bloqueadas
  isDefaultVisible: boolean;            // Aparece por padrão
  defaultWidth?: number;                // Largura padrão (grid futuro)
  defaultHeight?: number;               // Altura padrão (grid futuro)
  metadata?: {
    tags?: string[];
    priority?: number;
    dataDependencies?: string[];
  };
}
```

**Helpers disponíveis**:
```typescript
// Buscar definição de um card
getPatientOverviewCardDefinition(id: string)

// Cards visíveis por padrão
getDefaultPatientOverviewCardIds()

// Cards por categoria
getCardsByCategory(category: 'statistical' | 'functional')

// Cards por domínio
getCardsByDomain(domain: PermissionDomain)
```

### **ETAPA 2: Filtro por Categoria**

```typescript
// Separar STAT cards
const statCardIds = allOverviewCardIds.filter(id => {
  const def = getPatientOverviewCardDefinition(id);
  return def?.cardCategory === 'statistical';
});

// Separar FUNCTIONAL cards
const functionalCardIds = allOverviewCardIds.filter(id => {
  const def = getPatientOverviewCardDefinition(id);
  return def?.cardCategory === 'functional';
});
```

### **ETAPA 3: Filtro por Permissões**

**Arquivo helper**: `src/config/patientOverviewCards.ts` (função `canUserSeeOverviewCard`)

Contexto de permissões montado no `PatientDetail.tsx`:
```typescript
const permissionCtx: PatientOverviewPermissionContext = {
  roleGlobal,                        // admin, fulltherapist, etc.
  isClinicalProfessional,            // Se é profissional clínico
  isAdminOrOwner,                    // Se é admin ou dono
  financialAccess,                   // none, read, write, full
  canAccessClinical,                 // Permissão geral de acesso clínico
  patientAccessLevel,                // none, read, write (para este paciente)
};
```

**Regras de permissão**:
```typescript
// Clinical cards
if (domain === 'clinical') {
  return canAccessClinical && patientAccessLevel !== 'none';
}

// Financial cards
if (domain === 'financial') {
  return financialAccess !== 'none';
}

// Administrative cards
if (domain === 'administrative') {
  return true; // Liberado por padrão
}

// General cards
if (domain === 'general') {
  return true; // Sempre liberado
}
```

Aplicação no código:
```typescript
// Filtrar TODOS os cards por permissão (único ponto central)
const permittedOverviewCardIds = allOverviewCardIds.filter((cardId) => {
  const def = getPatientOverviewCardDefinition(cardId);
  if (!def) return false;
  return canUserSeeOverviewCard(permissionCtx, def);
});

// Aplicar a STAT cards
const permittedStatCardIds = statCardIds.filter((id) =>
  permittedOverviewCardIds.includes(id)
);

// Aplicar a FUNCTIONAL cards
const permittedFunctionalCardIds = functionalCardIds.filter((id) =>
  permittedOverviewCardIds.includes(id)
);
```

### **ETAPA 4: Ordenação por Layout**

**Arquivo**: `src/lib/patientOverviewLayout.ts`  
**Persistência**: `src/lib/patientOverviewLayoutPersistence.ts`  
**Hook**: `src/hooks/usePatientOverviewLayout.ts`

Layout define:
- Posição (x, y)
- Dimensões (w, h)
- Constraints (static, minW, maxW, minH, maxH)

```typescript
interface PatientOverviewCardLayout {
  i: string;      // ID do card
  x: number;      // Posição horizontal (grid)
  y: number;      // Posição vertical (grid)
  w: number;      // Largura em células
  h: number;      // Altura em células
  static?: boolean;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}
```

**Layout padrão**: `DEFAULT_PATIENT_OVERVIEW_LAYOUT` (20 cards total)

**Persistência atual**: `localStorage`
- Chave: `patient-overview-layout:{userId}:{organizationId}`
- Formato: JSON string do array de layouts
- Fallback: Se não existe ou corrompido → layout padrão

**Ordenação no código**:
```typescript
const layoutToOrderedCardIds = (
  layout: PatientOverviewCardLayout[],
  permittedIds: string[]
): string[] => {
  const layoutCardIds = getLayoutCardIds(layout); // Extrai IDs do layout
  return layoutCardIds.filter(id => permittedIds.includes(id));
};

// Aplicar a STAT cards
const orderedStatCardIds = layoutToOrderedCardIds(overviewLayout, permittedStatCardIds);

// Aplicar a FUNCTIONAL cards
const orderedFunctionalCardIds = layoutToOrderedCardIds(overviewLayout, permittedFunctionalCardIds);
```

### **ETAPA 5: Preferências do Usuário (apenas FUNCTIONAL cards)**

**Variável de estado**: `visibleCards: string[]`

Apenas FUNCTIONAL cards passam por este filtro. STAT cards são SEMPRE visíveis (se passarem por permissão).

```typescript
// Função helper
const isCardVisible = (cardId: string) => {
  const def = getPatientOverviewCardDefinition(cardId);
  
  // STAT cards: sempre visíveis (se passaram por permissão)
  if (def?.cardCategory === 'statistical') {
    return true;
  }
  
  // FUNCTIONAL cards: apenas se estiver em visibleCards
  return visibleCards.includes(cardId);
};

// Aplicação na renderização
{orderedFunctionalCardIds.map(cardId => {
  if (!isCardVisible(cardId)) return null;
  return renderFunctionalCard(cardId, content);
})}
```

Gerenciamento via `AddCardDialog`:
```typescript
const handleAddCard = (cardId: string) => {
  if (!visibleCards.includes(cardId)) {
    setVisibleCards([...visibleCards, cardId]);
  }
};

const handleRemoveCard = (cardId: string) => {
  setVisibleCards(visibleCards.filter(id => id !== cardId));
};
```

---

## 📊 DIFERENÇA ENTRE STAT × FUNCTIONAL CARDS

### 🔢 STAT CARDS (Statistical Cards)

**Definição**:
- Cards de métricas, KPIs e contadores
- `cardCategory: 'statistical'`

**Características**:
- ✅ Sempre visíveis (se passarem por permissão)
- ❌ NÃO aparecem no `AddCardDialog`
- ❌ NÃO podem ser removidos via UI
- ❌ NÃO passam por filtro de `visibleCards`
- ✅ Respeitam layout e ordenação
- ✅ Respeitam permissões

**Lista de STAT CARDS** (11 total):

| ID | Title | Domain | Visible por padrão |
|----|-------|--------|-------------------|
| `patient-stat-total` | Total no Mês | administrative | ✅ |
| `patient-stat-attended` | Comparecidas | administrative | ✅ |
| `patient-stat-scheduled` | Agendadas | administrative | ✅ |
| `patient-stat-unpaid` | A Pagar | financial | ✅ |
| `patient-stat-nfse` | NFSe Emitida | financial | ✅ |
| `patient-stat-total-all` | Total Geral | administrative | ❌ |
| `patient-stat-revenue-month` | Faturamento do Mês | financial | ❌ |
| `patient-stat-paid-month` | Recebido no Mês | financial | ❌ |
| `patient-stat-missed-month` | Faltas no Mês | administrative | ❌ |
| `patient-stat-attendance-rate` | Taxa de Comparecimento | administrative | ❌ |
| `patient-stat-unscheduled-month` | Desmarcadas no Mês | administrative | ❌ |

**Renderização**:
```tsx
<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
  {orderedStatCardIds.map(cardId => renderStatCard(cardId))}
</div>
```

### 🎯 FUNCTIONAL CARDS (Functional Cards)

**Definição**:
- Cards com funcionalidade, ações e informações detalhadas
- `cardCategory: 'functional'`

**Características**:
- ✅ Visibilidade controlada por `visibleCards`
- ✅ Aparecem no `AddCardDialog`
- ✅ Podem ser adicionados/removidos via UI
- ✅ Respeitam layout e ordenação
- ✅ Respeitam permissões

**Lista de FUNCTIONAL CARDS** (9 total):

| ID | Title | Domain | Visible por padrão |
|----|-------|--------|-------------------|
| `patient-next-appointment` | Próximo Agendamento | administrative | ✅ |
| `patient-contact-info` | Contato | general | ✅ |
| `patient-clinical-complaint` | Queixa Clínica | clinical | ✅ |
| `patient-clinical-info` | Informações Clínicas | administrative | ✅ |
| `patient-history` | Histórico | administrative | ✅ |
| `recent-notes` | Últimas Notas | clinical | ❌ |
| `quick-actions` | Ações Rápidas | administrative | ❌ |
| `payment-summary` | Resumo de Pagamentos | financial | ❌ |
| `session-frequency` | Frequência de Sessões | administrative | ❌ |

**Renderização**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {orderedFunctionalCardIds.map(cardId => {
    if (!isCardVisible(cardId)) return null;
    return renderFunctionalCard(cardId, content);
  })}
</div>
```

---

## 🔐 PERMISSÕES CLÍNICAS / FINANCEIRAS / ADMINISTRATIVAS

### 🧩 Contexto de Permissões

Montado em `PatientDetail.tsx` (linhas ~160-167):
```typescript
const permissionCtx: PatientOverviewPermissionContext = {
  roleGlobal,                    // 'admin', 'fulltherapist', 'clinical', etc.
  isClinicalProfessional,        // Se é psicólogo/terapeuta
  isAdminOrOwner,                // Se é admin ou dono da org
  financialAccess,               // 'none', 'read', 'write', 'full'
  canAccessClinical,             // true/false
  patientAccessLevel,            // 'none', 'read', 'write'
};
```

### 📋 Regras de Permissão por Domínio

**Domain: `clinical`**
```typescript
// Requer AMBOS:
// 1. Permissão geral de acesso clínico
// 2. Acesso ao paciente específico

if (domain === 'clinical') {
  return canAccessClinical && patientAccessLevel !== 'none';
}
```

Exemplos de cards clínicos:
- `patient-clinical-complaint` (Queixa Clínica)
- `recent-notes` (Últimas Notas)

**Domain: `financial`**
```typescript
// Requer acesso financeiro

if (domain === 'financial') {
  return financialAccess !== 'none';
}
```

Exemplos de cards financeiros:
- `patient-stat-unpaid` (A Pagar)
- `patient-stat-nfse` (NFSe Emitida)
- `patient-stat-revenue-month` (Faturamento do Mês)
- `payment-summary` (Resumo de Pagamentos)

**Domain: `administrative`**
```typescript
// Liberado por padrão

if (domain === 'administrative') {
  return true;
}
```

Exemplos de cards administrativos:
- `patient-stat-total` (Total no Mês)
- `patient-next-appointment` (Próximo Agendamento)
- `patient-clinical-info` (Informações Clínicas)
- `patient-history` (Histórico)

**Domain: `general`**
```typescript
// Sempre liberado

if (domain === 'general') {
  return true;
}
```

Exemplos de cards gerais:
- `patient-contact-info` (Contato)

### 🎯 Centralização da Lógica de Permissões

**Ponto único**: `canUserSeeOverviewCard(permissionCtx, cardDef)`

✅ **BOM** (atual):
```typescript
// Filtrar TODOS os cards por permissão em um único lugar
const permittedOverviewCardIds = allOverviewCardIds.filter((cardId) => {
  const def = getPatientOverviewCardDefinition(cardId);
  if (!def) return false;
  return canUserSeeOverviewCard(permissionCtx, def);
});

// Reutilizar o resultado
const permittedStatCardIds = statCardIds.filter(id =>
  permittedOverviewCardIds.includes(id)
);
const permittedFunctionalCardIds = functionalCardIds.filter(id =>
  permittedOverviewCardIds.includes(id)
);
```

❌ **RUIM** (evitado):
```typescript
// Chamar canUserSeeOverviewCard múltiplas vezes em lugares diferentes
const permittedStatCards = statCardIds.filter(id => {
  const def = getPatientOverviewCardDefinition(id);
  return canUserSeeOverviewCard(permissionCtx, def); // Duplicação
});

const permittedFunctionalCards = functionalCardIds.filter(id => {
  const def = getPatientOverviewCardDefinition(id);
  return canUserSeeOverviewCard(permissionCtx, def); // Duplicação
});
```

---

## 🎨 LAYOUT & FUTURO (TEMPLATES / DRAG & DROP)

### 📦 O que o Layout faz HOJE

**Funcionalidade atual**:
1. Define ordem de exibição dos cards
2. Define posicionamento conceitual (x, y)
3. Define dimensões conceituais (w, h)
4. Persistido em `localStorage`
5. Hook `usePatientOverviewLayout` gerencia carregamento/salvamento

**Limitações atuais**:
- ❌ Sem drag & drop visual
- ❌ Sem grid interativo (React Grid Layout)
- ❌ Sem templates por role/abordagem
- ❌ Sem sincronização via Supabase
- ✅ Apenas ordenação e persistência simples

### 🚀 O que está PREPARADO para o FUTURO

#### 1️⃣ Templates por Professional Role

**Cenário futuro**:
```typescript
// Tabela Supabase: layout_templates_patient_overview
{
  id: uuid,
  professional_role_id: uuid,      // FK → professional_roles
  template_name: string,
  layout_config: json,             // Array de PatientOverviewCardLayout
  is_default: boolean,
  created_at: timestamp
}
```

**Ponto de extensão**:
```typescript
// src/hooks/usePatientOverviewLayout.ts

// HOJE:
const stored = loadPatientOverviewLayout(userId, organizationId);

// FUTURO:
const template = await loadTemplateByRole(professionalRoleId);
const stored = template?.layout_config || loadPatientOverviewLayout(userId, organizationId);
```

#### 2️⃣ Templates por Clinical Approach

**Cenário futuro**:
```typescript
// Tabela Supabase: layout_templates_by_approach
{
  id: uuid,
  clinical_approach_id: uuid,      // FK → clinical_approaches
  template_name: string,
  layout_config: json,
  is_default: boolean,
  created_at: timestamp
}
```

**Exemplo de uso**:
- Psicólogo TCC → template com cards focados em sessões e métricas
- Psicólogo Junguiano → template com cards focados em queixa clínica e notas

**Ponto de extensão**:
```typescript
// src/hooks/usePatientOverviewLayout.ts

// Prioridade de templates:
// 1. Template específico por clinicalApproachId
// 2. Template geral por professionalRoleId
// 3. Layout customizado do usuário (localStorage)
// 4. Layout padrão do sistema

const template = 
  await loadTemplateByApproach(clinicalApproachId) ||
  await loadTemplateByRole(professionalRoleId) ||
  loadPatientOverviewLayout(userId, organizationId) ||
  getDefaultPatientOverviewLayout();
```

#### 3️⃣ Grid com Drag & Drop (React Grid Layout)

**Cenário futuro**: Portar sistema da Dashboard para a aba "Visão Geral"

**Arquivo de referência**: `src/pages/Dashboard.tsx` (usa React Grid Layout)

**O que seria necessário**:
1. Instalar/verificar dependências:
   - `react-grid-layout`
   - `@types/react-grid-layout`

2. Criar componente wrapper:
   ```tsx
   // src/components/PatientOverviewGrid.tsx
   import GridLayout from 'react-grid-layout';
   
   export function PatientOverviewGrid({ cards, layout, onLayoutChange }) {
     return (
       <GridLayout
         layout={layout}
         onLayoutChange={onLayoutChange}
         cols={12}
         rowHeight={30}
         width={1200}
         isDraggable={isEditMode}
         isResizable={isEditMode}
       >
         {cards.map(card => (
           <div key={card.id}>{card.content}</div>
         ))}
       </GridLayout>
     );
   }
   ```

3. Integrar no `PatientDetail.tsx`:
   ```tsx
   <TabsContent value="overview">
     {isEditMode ? (
       <PatientOverviewGrid
         cards={allCards}
         layout={overviewLayout}
         onLayoutChange={updateLayout}
       />
     ) : (
       // Renderização estática atual (grid simples)
     )}
   </TabsContent>
   ```

**Ponto de extensão**:
```typescript
// src/hooks/usePatientOverviewLayout.ts

// O hook já retorna tudo necessário:
const {
  layout,           // Array de PatientOverviewCardLayout (compatível com react-grid-layout)
  updateLayout,     // Callback para atualizar layout
  isLoading,
  isDirty,
  saveNow,
  resetLayout,
  hasStoredLayout
} = usePatientOverviewLayout({ userId, organizationId });
```

---

## 🔗 INTEGRAÇÃO COM ADDCARDDIALOG

### 📝 Funcionamento Atual

**Arquivo**: `src/components/AddCardDialog.tsx`

**Modo**: `mode="patient-overview"`

**Comportamento**:
1. Abre via botão "Adicionar Card" (apenas em `isEditMode` e `!isReadOnly`)
2. Exibe abas:
   - **Disponível**: Cards funcionais que o usuário pode adicionar
   - **Adicionados**: Cards funcionais atualmente visíveis

3. **Lista de cards disponíveis**:
   ```typescript
   const availableOverviewCards = orderedFunctionalCardIds
     .filter(id => !visibleCards.includes(id)) // Ainda não adicionados
     .map(id => {
       const def = getPatientOverviewCardDefinition(id);
       return {
         id: id,
         name: def?.title || id,
       };
     });
   ```

4. **Adicionar card**:
   ```typescript
   const handleAddCard = (cardId: string) => {
     if (!visibleCards.includes(cardId)) {
       setVisibleCards([...visibleCards, cardId]);
     }
   };
   ```

5. **Remover card**:
   ```typescript
   const handleRemoveCard = (cardId: string) => {
     setVisibleCards(visibleCards.filter(id => id !== cardId));
   };
   ```

### 🎯 Regras Importantes

**O que o AddCardDialog GERENCIA**:
- ✅ Apenas FUNCTIONAL cards
- ✅ Respeitando permissões (cards já filtrados antes)
- ✅ Respeitando `isReadOnly` (desabilitado em read-only)
- ✅ Respeitando `isEditMode` (só abre em modo de edição)

**O que o AddCardDialog NÃO GERENCIA**:
- ❌ STAT cards (sempre visíveis)
- ❌ Permissões (já aplicadas antes de montar a lista)
- ❌ Layout (apenas visibilidade, não posição)

---

## 📚 ARQUIVOS PRINCIPAIS

### 🗂️ Estrutura de Arquivos

```
src/
├── pages/
│   └── PatientDetail.tsx              # Componente principal (aba "Visão Geral")
│
├── config/
│   └── patientOverviewCards.ts        # Catálogo de cards + helper de permissões
│
├── lib/
│   ├── patientOverviewLayout.ts       # Tipos e funções de layout
│   └── patientOverviewLayoutPersistence.ts  # Persistência (localStorage)
│
├── hooks/
│   └── usePatientOverviewLayout.ts    # Hook de gerenciamento de layout
│
└── components/
    └── AddCardDialog.tsx              # Dialog de adicionar/remover cards
```

### 📄 Responsabilidades de Cada Arquivo

#### `src/config/patientOverviewCards.ts`

**Responsabilidades**:
- ✅ Definir catálogo completo de cards (STAT + FUNCTIONAL)
- ✅ Fornecer helpers puros de consulta
- ✅ Implementar lógica de permissões (`canUserSeeOverviewCard`)
- ❌ NÃO contém React, hooks ou JSX
- ❌ NÃO faz IO ou acessa localStorage

**Exports principais**:
```typescript
export const PATIENT_OVERVIEW_CARDS: Record<string, PatientOverviewCardDefinition>;
export function getPatientOverviewCardDefinition(id: string);
export function getDefaultPatientOverviewCardIds();
export function getCardsByCategory(category);
export function getCardsByDomain(domain);
export function canUserSeeOverviewCard(ctx, cardDef);
```

#### `src/lib/patientOverviewLayout.ts`

**Responsabilidades**:
- ✅ Definir tipos de layout
- ✅ Fornecer layout padrão (`DEFAULT_PATIENT_OVERVIEW_LAYOUT`)
- ✅ Funções puras de manipulação de layout
- ❌ NÃO faz IO ou acessa localStorage
- ❌ NÃO contém React ou hooks

**Exports principais**:
```typescript
export interface PatientOverviewCardLayout;
export const DEFAULT_PATIENT_OVERVIEW_LAYOUT: PatientOverviewCardLayout[];
export function getDefaultPatientOverviewLayout();
export function isValidLayout(layout);
export function normalizePatientOverviewLayout(layout);
export function mergeLayouts(base, existing);
export function filterLayoutByVisibility(layout, visibleIds);
export function addCardToLayout(layout, cardId);
export function removeCardFromLayout(layout, cardId);
export function getLayoutCardIds(layout);
```

#### `src/lib/patientOverviewLayoutPersistence.ts`

**Responsabilidades**:
- ✅ Carregar/salvar layout no localStorage
- ✅ Gerar chave de storage única por usuário/organização
- ✅ Validar e normalizar layouts carregados
- ❌ NÃO contém React ou hooks

**Exports principais**:
```typescript
export function loadPatientOverviewLayout(userId, orgId);
export function savePatientOverviewLayout(userId, orgId, layout);
export function resetPatientOverviewLayout(userId, orgId);
export function hasStoredLayout(userId, orgId);
export function clearAllPatientOverviewLayouts();
```

#### `src/hooks/usePatientOverviewLayout.ts`

**Responsabilidades**:
- ✅ Hook React para gerenciar layout
- ✅ Carregar layout na montagem
- ✅ Salvar com debounce
- ✅ Fornecer funções de manipulação
- ✅ Gerenciar estado de loading, dirty, etc.

**API do Hook**:
```typescript
const {
  layout,           // Layout atual
  isLoading,        // Se está carregando
  isDirty,          // Se foi modificado
  updateLayout,     // Atualizar layout (com debounce)
  saveNow,          // Salvar imediatamente
  resetLayout,      // Resetar para padrão
  hasStoredLayout   // Se existe layout salvo
} = usePatientOverviewLayout({ userId, organizationId });
```

#### `src/pages/PatientDetail.tsx` (aba "Visão Geral")

**Responsabilidades**:
- ✅ Montar contexto de permissões
- ✅ Executar pipeline de cards (catálogo → permissões → layout → preferências)
- ✅ Renderizar STAT e FUNCTIONAL cards
- ✅ Integrar com `AddCardDialog`
- ✅ Gerenciar modo de edição e read-only
- ✅ Persistir `visibleCards` (opcional, via localStorage ou estado)

**Fluxo principal**:
```typescript
// 1. Montar permissionContext
const permissionCtx = { roleGlobal, financialAccess, ... };

// 2. Filtrar por permissões
const permittedOverviewCardIds = allOverviewCardIds.filter(id => 
  canUserSeeOverviewCard(permissionCtx, getPatientOverviewCardDefinition(id))
);

// 3. Separar por categoria
const permittedStatCardIds = statCardIds.filter(...);
const permittedFunctionalCardIds = functionalCardIds.filter(...);

// 4. Ordenar por layout
const orderedStatCardIds = layoutToOrderedCardIds(overviewLayout, permittedStatCardIds);
const orderedFunctionalCardIds = layoutToOrderedCardIds(overviewLayout, permittedFunctionalCardIds);

// 5. Filtrar por preferências (apenas functional)
const isCardVisible = (cardId) => {
  const def = getPatientOverviewCardDefinition(cardId);
  if (def?.cardCategory === 'statistical') return true;
  return visibleCards.includes(cardId);
};

// 6. Renderizar
{orderedStatCardIds.map(id => renderStatCard(id))}
{orderedFunctionalCardIds.map(id => {
  if (!isCardVisible(id)) return null;
  return renderFunctionalCard(id, content);
})}
```

#### `src/components/AddCardDialog.tsx`

**Responsabilidades**:
- ✅ Exibir cards disponíveis para adicionar
- ✅ Exibir cards adicionados (removíveis)
- ✅ Callbacks de adicionar/remover
- ✅ Suportar modo `patient-overview`
- ✅ Respeitar `isReadOnly`

**Props principais**:
```typescript
interface AddCardDialogProps {
  mode: 'patient-overview' | 'dashboard' | ...;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCard: (cardId: string) => void;
  onRemoveCard: (cardId: string) => void;
  availableOverviewCards?: { id: string; name: string }[];
  currentCards?: { id: string; name: string }[];
}
```

---

## 🧪 CASOS DE USO E TESTES

### ✅ Caso 1: Usuário com Acesso Total (Admin)

**Contexto**:
```typescript
{
  roleGlobal: 'admin',
  isAdminOrOwner: true,
  financialAccess: 'full',
  canAccessClinical: true,
  patientAccessLevel: 'write'
}
```

**Resultado esperado**:
- ✅ Vê TODOS os STAT cards (11 cards)
- ✅ Vê TODOS os FUNCTIONAL cards (9 cards)
- ✅ Pode adicionar/remover FUNCTIONAL cards via `AddCardDialog`
- ✅ Pode editar layout

### ✅ Caso 2: Usuário SEM Acesso Clínico

**Contexto**:
```typescript
{
  roleGlobal: 'administrative',
  isAdminOrOwner: false,
  financialAccess: 'read',
  canAccessClinical: false,
  patientAccessLevel: 'none'
}
```

**Resultado esperado**:
- ✅ Vê STAT cards administrativos (6 cards)
- ✅ Vê STAT cards financeiros (3 cards) - porque tem `financialAccess: 'read'`
- ❌ NÃO vê STAT cards clínicos (0 cards)
- ✅ Vê FUNCTIONAL cards administrativos (5 cards)
- ✅ Vê FUNCTIONAL cards financeiros (1 card)
- ❌ NÃO vê FUNCTIONAL cards clínicos (2 cards)

### ✅ Caso 3: Usuário SEM Acesso Financeiro

**Contexto**:
```typescript
{
  roleGlobal: 'clinical',
  isAdminOrOwner: false,
  financialAccess: 'none',
  canAccessClinical: true,
  patientAccessLevel: 'write'
}
```

**Resultado esperado**:
- ✅ Vê STAT cards administrativos (6 cards)
- ❌ NÃO vê STAT cards financeiros (0 cards)
- ✅ Vê FUNCTIONAL cards clínicos (2 cards)
- ✅ Vê FUNCTIONAL cards administrativos (5 cards)
- ❌ NÃO vê FUNCTIONAL cards financeiros (0 cards)

### ✅ Caso 4: Modo Read-Only (Peer Sharing)

**Contexto**:
```typescript
{
  isReadOnly: true,
  // ... outras permissões
}
```

**Resultado esperado**:
- ✅ Vê cards permitidos normalmente
- ❌ NÃO pode entrar em modo de edição de layout
- ❌ NÃO pode abrir `AddCardDialog`
- ❌ NÃO pode adicionar/remover cards
- ❌ Botão "Editar Layout" está desabilitado

---

## 🔮 PRÓXIMOS PASSOS (FUTURAS TRACKS/FASES)

### 🎯 Track C2: Templates por Professional Role

**Objetivo**: Permitir layouts pré-definidos por papel profissional

**Tarefas**:
1. Criar tabela `layout_templates_patient_overview` no Supabase
2. Seed com templates padrão:
   - Psicólogo TCC
   - Psicólogo Junguiano
   - Psicanalista
   - Fonoaudiólogo
   - etc.
3. Estender `usePatientOverviewLayout` para carregar templates
4. UI para escolher template (dropdown ou modal)

### 🎯 Track C3: Templates por Clinical Approach

**Objetivo**: Layouts específicos por abordagem clínica

**Tarefas**:
1. Criar tabela `layout_templates_by_approach` no Supabase
2. Seed com templates por abordagem
3. Prioridade: approach → role → custom → default
4. UI para escolher template por abordagem

### 🎯 Track C4: Grid com Drag & Drop

**Objetivo**: Portar sistema de drag & drop da Dashboard

**Tarefas**:
1. Criar `PatientOverviewGrid.tsx` (wrapper de React Grid Layout)
2. Adaptar `renderStatCard` e `renderFunctionalCard` para grid
3. Implementar modo de edição visual
4. Testar responsividade e breakpoints
5. Garantir compatibilidade com layout atual (fallback)

### 🎯 Track C5: Sincronização via Supabase

**Objetivo**: Migrar de localStorage para Supabase

**Tarefas**:
1. Criar tabela `user_patient_overview_layouts` no Supabase
2. Migrar dados de localStorage → Supabase (migration)
3. Estender `patientOverviewLayoutPersistence.ts` para usar Supabase
4. Implementar sync entre dispositivos
5. Manter localStorage como fallback offline

---

## 📌 CONVENÇÕES E BOAS PRÁTICAS

### 🔹 Nomenclatura de Cards

**Padrão**: `{escopo}-{tipo}-{descritor}`

Exemplos:
- `patient-stat-total` (escopo: patient, tipo: stat, descritor: total)
- `patient-next-appointment` (escopo: patient, tipo: funcional implícito)
- `patient-clinical-complaint` (escopo: patient, área: clinical)

### 🔹 Adicionar Novo Card

**Checklist**:
1. ✅ Adicionar definição em `patientOverviewCards.ts` (STATISTICAL_CARDS ou FUNCTIONAL_CARDS)
2. ✅ Definir `domain`, `cardCategory`, `isDefaultVisible`
3. ✅ Adicionar ao `DEFAULT_PATIENT_OVERVIEW_LAYOUT` em `patientOverviewLayout.ts`
4. ✅ Implementar renderização em `PatientDetail.tsx`
5. ✅ Testar com diferentes perfis de permissões

**Exemplo**:
```typescript
// 1. patientOverviewCards.ts
const FUNCTIONAL_CARDS = {
  'patient-new-feature': {
    id: 'patient-new-feature',
    title: 'Nova Funcionalidade',
    description: 'Descrição do novo card',
    cardCategory: 'functional',
    domain: 'administrative',
    isDefaultVisible: true,
    defaultWidth: 350,
    defaultHeight: 220,
  },
};

// 2. patientOverviewLayout.ts
export const DEFAULT_PATIENT_OVERVIEW_LAYOUT = [
  { i: 'patient-new-feature', x: 0, y: 10, w: 4, h: 7, static: false },
];

// 3. PatientDetail.tsx
if (cardId === 'patient-new-feature') {
  return renderFunctionalCard(
    'patient-new-feature',
    <div>
      <h3>Nova Funcionalidade</h3>
      <p>Conteúdo aqui</p>
    </div>
  );
}
```

### 🔹 Modificar Permissões de Card Existente

**Checklist**:
1. ✅ Editar definição em `patientOverviewCards.ts`
2. ✅ Ajustar `domain` ou flags (`requiresFinancialAccess`, etc.)
3. ✅ Testar com diferentes perfis de permissões
4. ✅ Documentar mudança (commit message ou changelog)

**Exemplo**:
```typescript
// ANTES
'patient-clinical-info': {
  id: 'patient-clinical-info',
  title: 'Informações Clínicas',
  domain: 'administrative', // ❌ Qualquer um pode ver
  cardCategory: 'functional',
  isDefaultVisible: true,
},

// DEPOIS
'patient-clinical-info': {
  id: 'patient-clinical-info',
  title: 'Informações Clínicas',
  domain: 'clinical', // ✅ Apenas usuários com acesso clínico
  cardCategory: 'functional',
  isDefaultVisible: true,
},
```

### 🔹 Remover Card Obsoleto

**Checklist**:
1. ✅ Remover definição de `patientOverviewCards.ts`
2. ✅ Remover do `DEFAULT_PATIENT_OVERVIEW_LAYOUT`
3. ✅ Remover renderização de `PatientDetail.tsx`
4. ✅ Verificar se card está em `visibleCards` de usuários (localStorage)
   - O sistema ignora IDs desconhecidos automaticamente, mas é bom limpar
5. ✅ Documentar remoção (commit message ou changelog)

---

## 🔍 DEBUGGING E TROUBLESHOOTING

### 🐛 Card não aparece mesmo com permissões corretas

**Possíveis causas**:
1. **Card não passou pelo filtro de permissão**:
   - Verificar `canUserSeeOverviewCard(permissionCtx, cardDef)`
   - Conferir `domain`, `requiresFinancialAccess`, etc.

2. **Card funcional não está em `visibleCards`**:
   - Se for FUNCTIONAL, verificar estado `visibleCards`
   - Adicionar via `AddCardDialog` ou setar manualmente

3. **Card não está no layout**:
   - Verificar se ID existe em `overviewLayout`
   - Resetar layout se necessário

4. **Renderização com bug**:
   - Verificar if dentro do map em `PatientDetail.tsx`
   - Adicionar console.log temporário

**Debug helper**:
```typescript
// Adicionar temporariamente no PatientDetail.tsx
console.log('🔍 Debug Overview Cards:', {
  allIds: allOverviewCardIds,
  permitted: permittedOverviewCardIds,
  statIds: permittedStatCardIds,
  functionalIds: permittedFunctionalCardIds,
  orderedStat: orderedStatCardIds,
  orderedFunctional: orderedFunctionalCardIds,
  visibleCards,
  permissionCtx,
});
```

### 🐛 Layout não está sendo salvo

**Possíveis causas**:
1. **Hook em modo `readOnly`**:
   - Verificar props do `usePatientOverviewLayout`

2. **userId ou organizationId inválidos**:
   - Verificar se valores não estão vazios ou undefined

3. **localStorage cheio ou bloqueado**:
   - Verificar quota de localStorage
   - Testar em navegador anônimo

4. **Debounce ainda não disparou**:
   - Usar `saveNow()` para salvar imediatamente

**Debug helper**:
```typescript
// No PatientDetail.tsx
const {
  layout,
  isDirty,
  hasStoredLayout,
  saveNow
} = usePatientOverviewLayout({ userId, organizationId });

console.log('💾 Layout Debug:', {
  userId,
  organizationId,
  layoutLength: layout.length,
  isDirty,
  hasStoredLayout,
});

// Forçar salvamento manual
useEffect(() => {
  saveNow();
}, [layout]);
```

### 🐛 AddCardDialog não abre

**Possíveis causas**:
1. **Não está em modo de edição**:
   - Verificar `isEditMode === true`

2. **Está em modo read-only**:
   - Verificar `isReadOnly === false`

3. **Estado do dialog não está correto**:
   - Verificar `isAddCardDialogOpen` e `setIsAddCardDialogOpen`

**Solução**:
```typescript
// Verificar condições
{isEditMode && !isReadOnly && (
  <Button onClick={() => setIsAddCardDialogOpen(true)}>
    Adicionar Card
  </Button>
)}
```

---

## 📝 CHECKLIST DE VALIDAÇÃO FINAL

### ✅ Arquitetura

- [x] Catálogo completo em `patientOverviewCards.ts`
- [x] 11 STAT cards definidos
- [x] 9 FUNCTIONAL cards definidos
- [x] Pipeline de 5 etapas implementado
- [x] Permissões centralizadas em `canUserSeeOverviewCard`
- [x] Layout separado em arquivo próprio
- [x] Persistência em localStorage funcionando
- [x] Hook `usePatientOverviewLayout` estável

### ✅ Funcionalidades

- [x] STAT cards sempre visíveis (se permitidos)
- [x] FUNCTIONAL cards gerenciados por `visibleCards`
- [x] `AddCardDialog` funciona em modo `patient-overview`
- [x] Modo de edição bloqueia ações em `isReadOnly`
- [x] Botão "Restaurar Padrão" funciona
- [x] Layout ordenado corretamente

### ✅ Permissões

- [x] Cards clínicos respeitam `canAccessClinical` + `patientAccessLevel`
- [x] Cards financeiros respeitam `financialAccess`
- [x] Cards administrativos liberados por padrão
- [x] Cards gerais sempre liberados

### ✅ UX e Polimento

- [x] Botão "Editar Layout" desabilitado em read-only
- [x] Botão "Adicionar Card" só aparece em `isEditMode`
- [x] STAT cards não têm botão de remoção
- [x] FUNCTIONAL cards têm botão 'X' em modo de edição
- [x] Tooltips em botões desabilitados

### ✅ Extensibilidade

- [x] Arquitetura preparada para templates por role
- [x] Arquitetura preparada para templates por abordagem
- [x] Layout compatível com React Grid Layout (futuro)
- [x] Persistência preparada para migração Supabase (futuro)

---

## 📞 PONTOS DE CONTATO

### 🧑‍💻 Desenvolvedor Responsável

- **FASE C1.0 até C1.9**: Implementação completa
- **FASE C1.10**: Documentação e comentários

### 📚 Documentos Relacionados

- `docs/FASE_C1.3_PATIENT_OVERVIEW_LAYOUT_INFRA.md` - Infraestrutura de layout
- `docs/FASE_C1.5_PATIENT_OVERVIEW_QA.md` - QA inicial
- `docs/FASE_C1.6_PERMISSIONS_FILTER.md` - Sistema de permissões
- `docs/FASE_C_RELATORIO_FINAL.md` - Relatório geral da Track C

### 🔗 Código-Fonte Chave

```
src/pages/PatientDetail.tsx         # Linhas 160-230, 1470-1650
src/config/patientOverviewCards.ts  # Linhas 1-674 (completo)
src/hooks/usePatientOverviewLayout.ts  # Linhas 1-234 (completo)
src/lib/patientOverviewLayout.ts
src/lib/patientOverviewLayoutPersistence.ts
src/components/AddCardDialog.tsx
```

---

## 🏁 CONCLUSÃO

A aba "Visão Geral" do `PatientDetail.tsx` está **COMPLETA e ESTÁVEL** após as FASES C1.0 até C1.9.

**Principais conquistas**:
- ✅ Pipeline claro de 5 etapas (catálogo → permissões → layout → preferências → render)
- ✅ Sistema modular e extensível
- ✅ Permissões robustas e centralizadas
- ✅ Layout persistido e gerenciado via hook
- ✅ AddCardDialog integrado e funcional
- ✅ Preparado para futuras extensões (templates, drag & drop, Supabase)

**Próximos passos**:
- 🚀 Track C2: Templates por Professional Role
- 🚀 Track C3: Templates por Clinical Approach
- 🚀 Track C4: Grid com Drag & Drop
- 🚀 Track C5: Sincronização via Supabase

---

**Documentação criada em**: 2025-11-25  
**Última atualização**: 2025-11-25 (FASE C1.10)  
**Status**: ✅ COMPLETO
