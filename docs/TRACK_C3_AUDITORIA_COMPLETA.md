# 🔎 TRACK C3 — AUDITORIA COMPLETA DO SISTEMA ATUAL DE MÉTRICAS

**Data:** 2025-11-27  
**Fase:** C3.0 - Auditoria Read-Only  
**Status:** ✅ COMPLETA

---

## 1️⃣ ESTRUTURA ATUAL DO MÓDULO DE MÉTRICAS

### 📁 Páginas de Métricas Existentes

#### **Financial.tsx** (`src/pages/Financial.tsx`)
- **Linha:** 1-1396 (arquivo completo)
- **Propósito:** Dashboard financeiro completo com análises agregadas
- **Características:**
  - Sistema de filtros temporais (mês, 3 meses, 6 meses, ano, custom)
  - 16+ funções de cálculo inline (não modularizadas)
  - Sistema de tabs (Revenue, Distribution, Performance, Retention)
  - Gráficos com Recharts (Line, Bar, Pie)
  - Integração com permissões (`useEffectivePermissions`, `useCardPermissions`)
  - Filtros por organização (`organizationFilters`)
  - **NÃO usa sistema de cards/layout drag&drop**

#### **WebsiteMetrics.tsx** (`src/pages/WebsiteMetrics.tsx`)
- **Linha:** 1-141 (arquivo completo)
- **Propósito:** Placeholder para métricas de website/marketing
- **Status:** **100% MOCK** - nenhum dado real implementado
- **Características:**
  - Cards de métricas estáticas (visualizações, visitantes, conversão, CTR)
  - Alertas indicando necessidade de integração com Google Analytics
  - Guia de próximos passos para implementação
  - **NÃO integrado com backend**

#### **DashboardExample.tsx** (`src/pages/DashboardExample.tsx`)
- **Linha:** 1-826 (arquivo completo)
- **Propósito:** Dashboard modular com React Grid Layout
- **Características:**
  - Sistema de cards drag&drop (GridCardContainer)
  - Persistência Supabase + localStorage (`useDashboardLayout`)
  - Sistema de seções colapsáveis (financial, administrative, clinical, media, general, charts, **team**)
  - Filtros temporais avançados (week, thisWeek, month, lastMonth, Q1-Q4, year, custom)
  - Sistema de permissões integrado (`useDashboardPermissions`)
  - Escala de tempo adaptativa (`useChartTimeScale`)
  - **Este é o modelo a ser seguido na TRACK C3**

#### **DashboardOLD.tsx** (`src/pages/DashboardOLD.tsx`)
- **Linha:** 1-583 (arquivo completo)
- **Propósito:** Dashboard antigo (LEGACY)
- **Status:** **DEPRECATED** - mantido apenas para referência
- **Características:**
  - Layout fixo sem drag&drop
  - Cálculos inline de métricas
  - Diálogos com detalhes por paciente
  - **NÃO deve ser usado como referência**

### 🧩 Sistema de Layout Atual

**Financial.tsx:**
- Layout estático baseado em CSS Grid/Flexbox
- Sem persistência de preferências do usuário
- Sem suporte a drag&drop ou resize

**DashboardExample.tsx:**
- React Grid Layout (12 colunas)
- Sistema de seções (`DASHBOARD_SECTIONS`)
- Hook de persistência (`useDashboardLayout`)
  - Supabase: `user_layout_preferences` (layout_type: 'dashboard-example-grid')
  - localStorage: customizações temporárias por card (`grid-card-{sectionId}-{cardId}`)
- Cards com dimensões em grid (x, y, w, h)
- Utilitários em `gridLayoutUtils.ts`

### 📂 Arquivos Principais do Módulo

```
PÁGINAS:
- src/pages/Financial.tsx               (1396 linhas) ⚠️ LEGACY - não modular
- src/pages/WebsiteMetrics.tsx          (141 linhas)  ⚠️ MOCK - sem dados reais
- src/pages/DashboardExample.tsx        (826 linhas)  ✅ MODELO IDEAL
- src/pages/DashboardOLD.tsx            (583 linhas)  ❌ DEPRECATED

LIBRARIES:
- src/lib/patientFinancialUtils.ts      (213 linhas)  ✅ Cálculos por paciente
- src/lib/dashboardCardRegistry.tsx     (2008 linhas) ✅ Renderização de cards
- src/lib/dashboardCardRegistryTeam.tsx (453 linhas)  ✅ Cards de equipe
- src/lib/defaultLayoutDashboard.ts     (130 linhas)  ✅ Layout padrão
- src/lib/defaultSectionsDashboard.ts   (233 linhas)  ✅ Configuração de seções
- src/lib/gridLayoutUtils.ts            (249 linhas)  ✅ Utilitários de grid

HOOKS:
- src/hooks/useDashboardLayout.ts       (389 linhas)  ✅ Persistência de layout
- src/hooks/useChartTimeScale.ts        (150 linhas)  ✅ Escalas de tempo
- src/hooks/useDashboardPermissions.ts  (?)           ✅ Sistema de permissões
- src/hooks/useEffectivePermissions.ts  (?)           ✅ Permissões centralizadas

TYPES:
- src/types/cardTypes.ts                (1058 linhas) ✅ Definições de cards
- src/types/sectionTypes.ts             (?)           ✅ Definições de seções
- src/types/permissions.ts              (?)           ✅ Sistema de permissões

COMPONENTS:
- src/components/GridCardContainer.tsx  (?)           ✅ Container de grid 12 colunas
- src/components/AddCardDialog.tsx      (?)           ✅ Diálogo de adicionar cards
```

---

## 2️⃣ CÁLCULOS DE MÉTRICAS — MAPEAMENTO COMPLETO

### 🔴 PROBLEMA CRÍTICO: CÁLCULOS INLINE

**TODOS os cálculos financeiros e administrativos agregados estão implementados como funções inline em `Financial.tsx`**. Não existem hooks ou utilitários centralizados para métricas de sistema.

### A. Financeiro (AGREGADO) - `Financial.tsx`

#### **Funções Principais:**

| Função | Linha | Dependências | Multi-tenant | Refatoração |
|--------|-------|-------------|--------------|-------------|
| `getMonthlyRevenue()` | 216-263 | patients, sessions | ✅ Sim | 🔴 CRÍTICA |
| `getPatientDistribution()` | 266-296 | patients, sessions | ✅ Sim | 🟡 MÉDIA |
| `getMissedRate()` | 299-322 | sessions (visible) | ✅ Sim | 🟡 MÉDIA |
| `getAvgRevenuePerPatient()` | 325-374 | patients, sessions | ✅ Sim | 🟡 MÉDIA |
| `calculateExpectedRevenue()` | inline 376-395 | patients, sessions | ✅ Sim | 🔴 CRÍTICA |
| `totalRevenue` | 377-395 | sessions (attended) | ✅ Sim | 🔴 CRÍTICA |
| `totalSessions` | 397 | sessions (attended) | ✅ Sim | 🟢 BAIXA |
| `missedRate` | 398-401 | sessions (visible) | ✅ Sim | 🟢 BAIXA |
| `avgPerSession` | 403 | totalRevenue, totalSessions | ✅ Sim | 🟢 BAIXA |
| `activePatients` | 404 | patients (status='active') | ✅ Sim | 🟢 BAIXA |
| `getMissedByPatient()` | 407-421 | sessions (visible) | ✅ Sim | 🟡 MÉDIA |
| `getMissedDistribution()` | 424-438 | sessions (visible) | ✅ Sim | 🟡 MÉDIA |
| `lostRevenue` | 449-451 | sessions (visible, missed) | ✅ Sim | 🟡 MÉDIA |
| `avgRevenuePerActivePatient` | 454 | totalRevenue, activePatients | ✅ Sim | 🟢 BAIXA |
| `getForecastRevenue()` | 457-469 | patients (active) | ✅ Sim | 🟡 MÉDIA |
| `calculateOccupationRate()` | 476-533 | profile, sessions, scheduleBlocks | ✅ Sim | 🔴 CRÍTICA |
| `getTicketComparison()` | 536-575 | patients (active), sessions | ✅ Sim | 🟡 MÉDIA |
| `getGrowthTrend()` | 578-636 | sessions (attended) | ✅ Sim | 🟡 MÉDIA |
| `getNewVsInactive()` | 639-664 | patients | ✅ Sim | 🟡 MÉDIA |
| `getRetentionRate()` | 667-692 | patients | ✅ Sim | 🟡 MÉDIA |
| `getLostRevenueByMonth()` | 695-719 | sessions (visible, missed) | ✅ Sim | 🟡 MÉDIA |

#### **Características Comuns:**
- ✅ Respeitam multi-tenancy (filtro por organizationId via `organizationFilters`)
- ✅ Consideram mensalistas (monthly_price)
- ✅ Usam `parseISO`, `format`, `eachMonthOfInterval` (date-fns)
- ❌ NÃO modulares (acoplados ao componente)
- ❌ NÃO testados isoladamente
- ❌ NÃO reutilizáveis em outros contextos

### B. Financeiro (POR PACIENTE) - `patientFinancialUtils.ts`

#### **Funções Exportadas:**

| Função | Linha | Propósito | Testado |
|--------|-------|-----------|---------|
| `getFrequencyCount()` | 52-60 | Converte '1x' → 1, '2x' → 2, etc. | ❌ |
| `calculateExpectedRevenue()` | 66-84 | Receita esperada de 1 paciente | ❌ |
| `groupSessionsByPatientMonth()` | 90-103 | Agrupa sessões por paciente+mês | ❌ |
| `calculateActualRevenue()` | 109-126 | Valor realizado (attended) | ❌ |
| `calculateUnpaidRevenue()` | 132-135 | Valor não pago (attended, !paid) | ❌ |
| `calculatePatientFinancials()` | 149-185 | Detalhes completos de 1 paciente | ❌ |
| `calculateExpectedSessions()` | 190-203 | Sessões esperadas (múltiplos pacientes) | ❌ |
| `formatBrazilianCurrency()` | 208-213 | Formatação R$ | ✅ |

#### **Avaliação:**
- ✅ **MODULAR** - funções isoladas e testáveis
- ✅ **REUTILIZÁVEL** - pode ser usado em qualquer contexto
- ⚠️ **SEM TESTES** - nenhum teste automatizado
- ⚠️ **COBERTURA PARCIAL** - faltam métricas administrativas, clínicas, marketing

### C. Website / Marketing - `WebsiteMetrics.tsx`

#### **Status: 100% MOCK**

**Cards Existentes:**
- Visualizações (placeholder: "-")
- Visitantes Únicos (placeholder: "-")
- Taxa de Conversão (placeholder: "-")
- Taxa de Cliques (placeholder: "-")
- Páginas Mais Visitadas (mock list)
- Origem do Tráfego (mock list)

**Dependências:** NENHUMA - todos dados são hardcoded

**Próximos Passos (sugeridos no próprio componente):**
1. Integrar Google Analytics
2. Configurar eventos de rastreamento
3. Criar edge function para buscar dados da API do Analytics
4. Conectar dados reais no dashboard

#### **Compatibilidade TRACK C3:**
- ⚠️ Precisa ser completamente reimplementado
- ⚠️ Layout atual é estático (não usa grid/cards)
- ✅ Pode ser integrado como nova seção 'Marketing'

---

## 3️⃣ GRÁFICOS E COMPONENTES

### 📊 Inventário de Gráficos Atuais

#### **Financial.tsx - Gráficos Implementados:**

| Gráfico | Tipo | Dados | Time Scale | Linha | Compatível C3 |
|---------|------|-------|------------|-------|---------------|
| Receita Mensal | Line | monthlyData | ❌ Fixo mensal | ~850 | 🟡 Precisa adaptação |
| Sessões vs Esperadas | Bar | monthlyData | ❌ Fixo mensal | ~900 | 🟡 Precisa adaptação |
| Crescimento MoM | Line | getGrowthTrend() | ❌ Fixo mensal | ~950 | 🟡 Precisa adaptação |
| Distribuição por Paciente | Pie | patientDistribution | N/A | ~1000 | ✅ OK |
| Previsão vs Real | Line | monthlyData + forecast | ❌ Fixo mensal | ~1050 | 🟡 Precisa adaptação |
| Taxa de Faltas Mensal | Line | missedRateData | ❌ Fixo mensal | ~1100 | 🟡 Precisa adaptação |
| Pacientes Encerrados | Bar | monthlyData | ❌ Fixo mensal | ~1150 | 🟡 Precisa adaptação |
| Faltas por Paciente | Bar | missedByPatient | N/A | ~1200 | ✅ OK |
| Receita Perdida/Mês | Bar | getLostRevenueByMonth() | ❌ Fixo mensal | ~1250 | 🟡 Precisa adaptação |
| Retenção de Pacientes | Line | getRetentionRate() | ❌ Fixo trimestral | ~1300 | 🟡 Precisa adaptação |
| Novos vs Inativos | Bar | getNewVsInactive() | ❌ Fixo mensal | ~1350 | 🟡 Precisa adaptação |

#### **DashboardExample.tsx - Gráficos Implementados:**

**Todos os gráficos do DashboardExample usam:**
- ✅ `useChartTimeScale` → escala adaptativa (daily/weekly/monthly)
- ✅ `generateTimeIntervals()` → intervalos dinâmicos
- ✅ `formatTimeLabel()` → formatação correta das labels
- ✅ `aggregatedData` → dados pré-agregados por intervalo
- ✅ Componentes modulares (`dashboardCardRegistry.tsx`)

**Cards de gráficos disponíveis:**
- `dashboard-chart-revenue-trend`
- `dashboard-chart-payment-status`
- `dashboard-chart-attendance-weekly`
- `dashboard-chart-session-types`
- `dashboard-chart-monthly-comparison`
- etc. (26 cards no total)

### 🔧 Estrutura de Componentes de Gráfico

#### **DashboardCardRegistry Pattern:**

```typescript
// Exemplo: DashboardChartRevenueTrend
export const DashboardChartRevenueTrend = ({ 
  isEditMode,
  className,
  aggregatedData, // ← Dados pré-processados
  automaticScale, // ← Escala automática
  getScale,       // ← Getter de escala por chartId
  setScaleOverride, // ← Setter de override manual
  ...
}: CardProps) => {
  // Usa dados agregados (já calculados fora)
  const chartData = aggregatedData || [];
  
  // Usa escala adaptativa
  const currentScale = getScale ? getScale('revenue-trend') : automaticScale;
  
  // Renderiza com Recharts
  return (
    <Card>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Line dataKey="totalRevenue" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
```

**Características:**
- ✅ **Modular:** Componente independente
- ✅ **Reutilizável:** Props padronizadas (CardProps)
- ✅ **Adaptativo:** Time scale automático
- ✅ **Testável:** Pode receber dados mockados
- ✅ **Permissionado:** Registrado em cardTypes com permissionConfig

---

## 4️⃣ SISTEMA DE CARDS ATUAL

### 📇 Inventário Completo de Cards

#### **Cards Ativos (DashboardExample.tsx)**

**TOTAL: 26 cards implementados**

**Por Categoria:**

| Categoria | Quantidade | Cards |
|-----------|------------|-------|
| **Financial** | 8 | expected-revenue, actual-revenue, unpaid-value, payment-rate, chart-revenue-trend, chart-payment-status, chart-revenue-by-therapist, chart-patient-value-distribution |
| **Administrative** | 9 | total-patients, attended-sessions, expected-sessions, pending-sessions, missed-sessions, attendance-rate, whatsapp-unread, chart-session-types, chart-therapist-distribution |
| **Clinical** | 2 | active-complaints, no-diagnosis |
| **General** | 2 | quick-actions, recent-sessions |
| **Charts** | 9 | Diversos gráficos cross-domain |
| **Team** | 7 | expected-revenue-team, actual-revenue-team, unpaid-value-team, payment-rate-team, total-patients-team, attended-sessions-team, active-therapists-team |

#### **Registries de Cards**

**`dashboardCardRegistry.tsx` (linhas 1-2008):**
- Função `renderDashboardCard(cardId, props)` - Switch case com 26+ cards
- Componentes inline (DashboardExpectedRevenue, DashboardActualRevenue, etc.)
- Props padronizadas: `CardProps` (isEditMode, className, patients, sessions, start, end, etc.)
- Todos cards retornam `Card` component do shadcn/ui
- Tooltips com explicação de fórmulas (`<Info>` icon)

**`dashboardCardRegistryTeam.tsx` (linhas 1-453):**
- Versões "Team" dos cards financeiros/administrativos
- Dados agregados da equipe (subordinados)
- Mesma interface CardProps

#### **Status dos Cards por Domínio**

| Domínio | Cards Reais | Cards Mock | Cards Placeholder |
|---------|-------------|------------|-------------------|
| Financial | 8 ✅ | 0 | 0 |
| Administrative | 9 ✅ | 0 | 0 |
| Clinical | 2 ✅ | 0 | 0 |
| Marketing | 0 | 0 | 100% pendente |
| Team | 7 ✅ | 0 | 0 |

#### **Cards com Dependências de Permissão**

**`cardTypes.ts` - Sistema de Permissões:**

```typescript
export interface CardPermissionConfig {
  domain: PermissionDomain; // 'financial' | 'administrative' | 'clinical' | 'media' | 'general'
  requiresFinancialAccess?: boolean;
  requiresFullClinicalAccess?: boolean;
  blockedFor?: ('admin' | 'fulltherapist' | 'subordinate' | 'accountant')[];
  minimumAccess?: 'read' | 'write' | 'full';
}
```

**Exemplos:**

```typescript
// Card financeiro restrito
'dashboard-expected-revenue': {
  permissionConfig: {
    domain: 'financial',
    requiresFinancialAccess: true,
  }
}

// Card de equipe bloqueado para subordinados
'dashboard-team': {
  permissionConfig: {
    domain: 'team',
    blockedFor: ['subordinate'],
  }
}

// Card clínico sensível
'dashboard-active-complaints': {
  permissionConfig: {
    domain: 'clinical',
    requiresFullClinicalAccess: true,
  }
}
```

### 🔍 Análise de Quebra Potencial na C3

**Cards que PODEM quebrar:**
- ❌ Todos os cards de `Financial.tsx` → Não modulares, inline no componente
- ❌ `WebsiteMetrics.tsx` cards → 100% mock, precisam implementação real
- ✅ Cards de `DashboardExample.tsx` → Já modulares, COMPATÍVEIS

**Ação Necessária:**
- Refatorar cálculos de Financial.tsx → criar utilitários modulares
- Implementar dados reais para marketing (ou remover da C3 inicial)
- Migrar cards não-modulares para pattern do DashboardExample

---

## 5️⃣ HOOKS E SISTEMA DE LAYOUT

### 🪝 Hook: `useDashboardLayout`

**Arquivo:** `src/hooks/useDashboardLayout.ts` (389 linhas)

#### **Funcionalidades:**

| Função | Propósito | Persistência |
|--------|-----------|-------------|
| `loadLayoutFromDatabase()` | Busca layout do Supabase | user_layout_preferences |
| `loadLayoutFromLocalStorage()` | Mescla default + customizações locais | localStorage (grid-card-*) |
| `updateLayout()` | Atualiza posições de cards em uma seção | localStorage |
| `addCard()` | Adiciona card em posição livre | localStorage |
| `removeCard()` | Remove card e limpa localStorage | localStorage |
| `saveLayout()` | Persiste no Supabase | user_layout_preferences |
| `resetLayout()` | Volta ao default (limpa tudo) | Deleta DB + localStorage |

#### **Estrutura de Dados:**

```typescript
// Layout persistido no Supabase
interface DashboardGridLayout {
  [sectionId: string]: {
    cardLayouts: GridCardLayout[];
  };
}

// Layout de cada card (React Grid Layout)
interface GridCardLayout {
  i: string;   // cardId
  x: number;   // coluna (0-11)
  y: number;   // linha (0-∞)
  w: number;   // largura em colunas
  h: number;   // altura em rows
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}
```

#### **Tabela Supabase:**

```sql
user_layout_preferences (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  layout_type text NOT NULL, -- 'dashboard-example-grid'
  layout_config jsonb NOT NULL,
  version integer DEFAULT 1,
  created_at timestamptz,
  updated_at timestamptz
)
```

#### **localStorage Keys:**

```
grid-card-{sectionId}-{cardId} → GridCardLayout
```

**Exemplo:**
```
grid-card-dashboard-financial-dashboard-expected-revenue → {i, x, y, w, h, ...}
```

### 📐 Utilitários de Grid: `gridLayoutUtils.ts`

**Funções Disponíveis:**

| Função | Propósito | Usado? |
|--------|-----------|--------|
| `convertSequentialToGrid()` | Converte layout antigo para grid | ❌ Não |
| `calculatePixelWidth()` | Cols → pixels | ❌ Não |
| `calculatePixelHeight()` | Rows → pixels | ❌ Não |
| `validateGridLayout()` | Valida estrutura do layout | ❌ Não |
| `findNextAvailablePosition()` | Encontra posição livre para novo card | ✅ Sim |

**Observação:** Muitas funções não estão em uso. Podem ser removidas ou documentadas como utilitários auxiliares.

### 🚫 Incompatibilidades com Financial.tsx

**Financial.tsx NÃO USA:**
- ❌ React Grid Layout
- ❌ useDashboardLayout hook
- ❌ Sistema de cards modulares
- ❌ Persistência de preferências
- ❌ Drag & drop

**Financial.tsx USA:**
- ✅ Layout fixo CSS Grid/Flexbox
- ✅ Tabs estáticas (Recharts Tabs component)
- ✅ Gráficos inline
- ✅ Cálculos inline

**Migração Necessária:**
- Refatorar todos cálculos → utilitários modulares
- Converter tabs → seções de grid
- Converter gráficos → cards modulares
- Implementar drag & drop

---

## 6️⃣ PERMISSÕES

### 🔐 Sistema Atual de Permissões

#### **Arquitetura Centralizada:**

**Arquivo Central:** `src/lib/resolveEffectivePermissions.ts` (514 linhas)

**Função Principal:**
```typescript
resolveEffectivePermissions(userId: string): Promise<EffectivePermissions>
```

**Estrutura de Permissões:**

```typescript
interface EffectivePermissions {
  // Domínios
  canAccessClinical: boolean;
  financialAccess: 'none' | 'summary' | 'full';
  canAccessMarketing: boolean;
  canAccessWhatsapp: boolean;
  
  // NFSe
  usesOrgNFSe: boolean;
  
  // Visibilidade
  clinicalVisibleToSuperiors: boolean;
  
  // Compartilhamento entre pares
  peerAgendaSharing: boolean;
  peerClinicalSharing: 'none' | 'view' | 'full';
  
  // Específicos
  canEditSchedules: boolean;
  canViewTeamFinancialSummary: boolean;
  
  // WhatsApp
  canViewSubordinateWhatsapp: boolean;
  canManageSubordinateWhatsapp: boolean;
  secretaryCanAccessWhatsapp: boolean;
  
  // Metadados
  levelId: string | null;
  levelNumber: number | null;
  roleType: GlobalRole | null;
  isOrganizationOwner: boolean;
}
```

#### **Hooks de Permissões:**

**`useEffectivePermissions()` (usado em Financial.tsx):**
```typescript
const { 
  permissions, 
  loading,
  financialAccess,
  canAccessClinical,
  // ... outros flags derivados
} = useEffectivePermissions();
```

**`useDashboardPermissions()` (usado em DashboardExample.tsx):**
```typescript
const { 
  permissionContext, 
  loading, 
  canViewCard 
} = useDashboardPermissions();
```

**`useCardPermissions()` (usado em Financial.tsx):**
```typescript
const { canViewFullFinancial } = useCardPermissions();
```

### 🚨 Problemas Atuais de Permissões em Financial.tsx

#### **1. Exposição Indevida de Dados Financeiros:**

```typescript
// Financial.tsx linha 118-152
if (viewFullFinancial) {
  // Admin/Full vê fechamento completo (próprio + subordinados)
  const subordinateIds = await getSubordinatesForFinancialClosing(user!.id);
  const viewableUserIds = [user!.id, ...subordinateIds].filter(id => orgUserIds.includes(id));
  
  // ⚠️ Carrega TODOS os pacientes desses usuários
  const { data: patientsData } = await supabase
    .from('patients')
    .select('*')
    .in('user_id', viewableUserIds);
}
```

**Problema:**
- Subordinados com `financialAccess: 'summary'` podem estar vendo dados completos via cálculos inline
- Não há validação granular por card/métrica

#### **2. Falta de Filtragem por Domínio:**

Todos os cálculos agregados (getMonthlyRevenue, getTotalRevenue, etc.) operam sobre os mesmos dados carregados. Não há:
- Filtragem por domínio de permissão
- Ocultação de métricas sensíveis para roles específicos
- Verificação de `requiresFinancialAccess` antes de calcular/exibir

#### **3. Seção "Team" Não Implementada em Financial.tsx:**

Financial.tsx não possui:
- Cards de equipe (team domain)
- Dados agregados de subordinados
- Sistema de permissões para visualizar dados da equipe

**DashboardExample.tsx tem:**
- Seção 'dashboard-team' ✅
- Cards de equipe (`DashboardExpectedRevenueTeam`, etc.) ✅
- Filtros de permissão (`blockedFor: ['subordinate']`) ✅
- Hook `useTeamData()` para buscar dados de subordinados ✅

### ✅ Sistema Correto (DashboardExample.tsx)

```typescript
// FASE 12.1: Sistema de permissões integrado
const { permissionContext, loading: permissionsLoading, canViewCard } = useDashboardPermissions();

// Aguardar carregamento de permissões
if (loading || permissionsLoading) {
  return <LoadingState />;
}

// Filtrar seções visíveis baseado em permissões
const visibleSections = useMemo(() => {
  const filtered: Record<string, SectionConfig> = {};
  
  Object.entries(DASHBOARD_SECTIONS).forEach(([sectionId, section]) => {
    const sectionCards = ALL_AVAILABLE_CARDS.filter(card => 
      section.availableCardIds.includes(card.id)
    );
    const visibleCards = filterCardsByPermissions(sectionCards, permissionContext);
    
    // Só incluir seção se tiver pelo menos um card visível
    if (visibleCards.length > 0) {
      filtered[sectionId] = section;
    }
  });
  
  return filtered;
}, [permissionContext, permissionsLoading]);

// Renderizar apenas cards permitidos
{section.cardLayouts.map(cardLayout => {
  const card = ALL_AVAILABLE_CARDS.find(c => c.id === cardLayout.i);
  if (!card || !canViewCard(card.id)) return null; // ← CRÍTICO
  
  return renderDashboardCard(card.id, cardProps);
})}
```

### 🎯 Ações Necessárias para TRACK C3

1. **Migrar Financial.tsx para sistema de cards modulares**
   - Cada métrica = 1 card com permissionConfig
   - Usar `canViewCard()` antes de renderizar
   
2. **Implementar domínio 'team' em todas páginas de métricas**
   - Adicionar seção 'Equipe' em Financial.tsx
   - Filtrar por permissões (`blockedFor: ['subordinate']`)
   
3. **Criar validações granulares de acesso financeiro**
   - `financialAccess: 'summary'` → Cards de resumo apenas
   - `financialAccess: 'full'` → Todos os cards financeiros
   
4. **Auditar exposição de dados sensíveis**
   - Revisar queries que carregam dados de subordinados
   - Garantir que apenas dados permitidos sejam carregados
   
5. **Unificar sistema de permissões**
   - Deprecar `useCardPermissions()` local
   - Usar apenas `useDashboardPermissions()` centralizado

---

## 7️⃣ ROTAS ATUAIS DE MÉTRICAS

### 🛣️ Inventário de Rotas

**Arquivo:** `src/App.tsx` (linhas 1-209)

#### **Rotas Relacionadas a Métricas:**

| Rota | Componente | Proteção | Status |
|------|-----------|----------|--------|
| `/financial` | `Financial.tsx` | PermissionRoute (financial domain) | ✅ Ativa |
| `/metrics/website` | `WebsiteMetrics.tsx` | PermissionRoute (website-metrics) | ✅ Ativa (MOCK) |
| `/dashboard` | `DashboardExample.tsx` | PermissionRoute (role-based) | ✅ Ativa |
| `/dashboard-old` | `DashboardOLD.tsx` | ProtectedRoute (sem permissões) | ⚠️ DEPRECATED |
| `/accountant-dashboard` | `AccountantDashboard.tsx` | PermissionRoute (accountant only) | ✅ Ativa |

#### **Sistema de Proteção:**

```typescript
// PermissionRoute - Valida acesso por routePermissions.ts
<Route path="/financial" element={
  <ProtectedRoute>
    <PermissionRoute path="/financial">
      <Layout><Financial /></Layout>
    </PermissionRoute>
  </ProtectedRoute>
} />

// ProtectedRoute - Apenas verifica autenticação + org ativa
<Route path="/dashboard-old" element={
  <ProtectedRoute>
    <Layout><DashboardOLD /></Layout>
  </ProtectedRoute>
} />
```

#### **Configurações em routePermissions.ts:**

```typescript
'/financial': {
  blockedFor: ['accountant'],
  requiresDomain: 'financial',
  minimumAccess: 'read',
},

'/website-metrics': {
  allowedFor: ['admin'],
},
```

### 📍 Rotas Propostas para TRACK C3

**Nova Rota Principal:**
```
/metrics → Página unificada de métricas
```

**Sub-abas dentro de /metrics:**
```
/metrics?tab=financial&subtab=distributions
/metrics?tab=administrative&subtab=performance
/metrics?tab=marketing&subtab=website
/metrics?tab=team&subtab=performance
```

**OU rotas separadas:**
```
/metrics/financial
/metrics/administrative
/metrics/marketing
/metrics/team
```

### 🗑️ Rotas a Serem Migradas/Eliminadas

| Rota | Ação | Motivo |
|------|------|--------|
| `/financial` | 🔄 Migrar → `/metrics?tab=financial` | Consolidação |
| `/metrics/website` | 🔄 Migrar → `/metrics?tab=marketing` | Consolidação |
| `/dashboard-old` | ❌ Deletar | DEPRECATED |
| `/dashboard` | ✅ Manter | Separado de métricas (visão operacional) |

### 🔀 Estratégia de Migração

**Opção A: Redirect Gradual**
```typescript
// Manter rotas antigas com redirect durante transição
<Route path="/financial" element={<Navigate to="/metrics?tab=financial" replace />} />
<Route path="/metrics/website" element={<Navigate to="/metrics?tab=marketing" replace />} />
```

**Opção B: Rotas Paralelas**
```typescript
// Manter ambas temporariamente
<Route path="/financial" element={<Financial />} />
<Route path="/metrics" element={<Metrics />} />
// Depois deprecar gradualmente
```

**Recomendação:** Opção A - Redirect Gradual
- Evita duplicação de código
- Força migração dos usuários
- Permite remover código legacy após período de transição

---

## 8️⃣ DEPENDÊNCIAS ENTRE MÓDULOS

### 🕸️ Mapa de Dependências

```
PÁGINAS (CONSUMIDORES):
┌─────────────────────┐
│ Financial.tsx       │───┐
└─────────────────────┘   │
                          ├──→ patientFinancialUtils.ts (🟢 Modular)
┌─────────────────────┐   │
│ DashboardExample.tsx│───┤
└─────────────────────┘   │
                          ├──→ dashboardCardRegistry.tsx (🟢 Modular)
┌─────────────────────┐   │
│ WebsiteMetrics.tsx  │   ├──→ dashboardCardRegistryTeam.tsx (🟢 Modular)
└─────────────────────┘   │
                          ├──→ gridLayoutUtils.ts (🟢 Modular)
┌─────────────────────┐   │
│ DashboardOLD.tsx    │───┘
└─────────────────────┘   ├──→ useDashboardLayout.ts (🟢 Modular)
                          │
                          ├──→ useChartTimeScale.ts (🟢 Modular)
                          │
                          ├──→ useDashboardPermissions.ts (🟢 Modular)
                          │
                          ├──→ useEffectivePermissions.ts (🟢 Modular)
                          │
                          ├──→ cardTypes.ts (🟢 Modular)
                          │
                          └──→ routePermissions.ts (🟢 Modular)

BIBLIOTECAS COMPARTILHADAS:
┌─────────────────────────────┐
│ patientFinancialUtils.ts    │───→ Usado por: Financial, DashboardExample
└─────────────────────────────┘

┌─────────────────────────────┐
│ dashboardCardRegistry.tsx   │───→ Usado por: DashboardExample
└─────────────────────────────┘

┌─────────────────────────────┐
│ gridLayoutUtils.ts          │───→ Usado por: DashboardExample, useDashboardLayout
└─────────────────────────────┘

┌─────────────────────────────┐
│ useChartTimeScale.ts        │───→ Usado por: DashboardExample
└─────────────────────────────┘

DEPENDÊNCIAS EXTERNAS:
- Recharts (gráficos)
- React Grid Layout (drag & drop)
- date-fns (datas)
- Supabase (persistência)
```

### 🔍 Análise de Reaproveitamento

#### ✅ **PODE SER REAPROVEITADO:**

| Módulo | Uso na C3 | Modificações Necessárias |
|--------|-----------|--------------------------|
| `patientFinancialUtils.ts` | ✅ Sim | Expandir com métricas administrativas |
| `dashboardCardRegistry.tsx` | ✅ Sim | Adicionar cards novos (se necessário) |
| `dashboardCardRegistryTeam.tsx` | ✅ Sim | Nenhuma (já pronto) |
| `gridLayoutUtils.ts` | ✅ Sim | Nenhuma (já pronto) |
| `useDashboardLayout.ts` | ✅ Sim | Mudar `layout_type` para 'metrics-grid' |
| `useChartTimeScale.ts` | ✅ Sim | Nenhuma (já pronto) |
| `useDashboardPermissions.ts` | ✅ Sim | Nenhuma (já pronto) |
| `useEffectivePermissions.ts` | ✅ Sim | Nenhuma (já pronto) |
| `cardTypes.ts` | ✅ Sim | Adicionar novos card IDs |
| `defaultSectionsDashboard.ts` | ✅ Sim | Criar `defaultSectionsMetrics.ts` |
| `routePermissions.ts` | ✅ Sim | Adicionar `/metrics` |

#### 🔴 **PRECISA SER REFATORADO:**

| Módulo | Problema | Refatoração |
|--------|----------|-------------|
| `Financial.tsx` | Cálculos inline, não modular | Extrair funções → novo arquivo de utilitários |
| `DashboardOLD.tsx` | DEPRECATED | Deletar após migração completa |
| `WebsiteMetrics.tsx` | 100% mock | Implementar dados reais OU remover da C3 inicial |

#### ⚠️ **PONTOS DE QUEBRA POTENCIAL:**

1. **Se Financial.tsx for deletada antes de migrar funcionalidades:**
   - 🔴 Perda de 16+ funções de cálculo inline
   - 🔴 Perda de gráficos customizados (não modulares)
   - 🔴 Perda de lógica de filtros temporais específicos

2. **Se patientFinancialUtils.ts não for expandido:**
   - 🔴 Métricas administrativas (sessões, faltas) ficarão sem utilitários
   - 🔴 Métricas clínicas (queixas, diagnósticos) ficarão sem utilitários
   - 🔴 Novos cards da C3 terão que recriar lógicas existentes

3. **Se layout_type não for único:**
   - 🔴 Conflito entre `dashboard-example-grid` e `metrics-grid`
   - 🔴 Usuários verão layouts misturados

### 🎯 Plano de Migração de Dependências

**FASE 1: Extração (antes de começar C3)**
1. Criar `src/lib/systemMetricsUtils.ts`
2. Extrair TODAS as funções inline de Financial.tsx → systemMetricsUtils.ts
3. Criar interfaces e tipos claros
4. Adicionar testes unitários

**FASE 2: Expansão**
1. Adicionar métricas administrativas em systemMetricsUtils.ts
2. Adicionar métricas clínicas em systemMetricsUtils.ts
3. Adicionar métricas de marketing (quando dados reais existirem)

**FASE 3: Integração**
1. Criar cards modulares usando systemMetricsUtils
2. Registrar cards em cardTypes.ts e dashboardCardRegistry
3. Configurar seções em defaultSectionsMetrics.ts

**FASE 4: Substituição**
1. Redirecionar `/financial` → `/metrics?tab=financial`
2. Redirecionar `/metrics/website` → `/metrics?tab=marketing`
3. Deprecar DashboardOLD.tsx

---

## 9️⃣ RISCOS ATUAIS

### 🚨 Riscos de Alto Impacto

#### **1. REFATORAÇÃO DE Financial.tsx SEM BACKUP**

**Risco:** Perda de funcionalidades críticas durante migração

**Arquivos Sensíveis:**
- `src/pages/Financial.tsx` (1396 linhas)
  - 16+ funções de cálculo inline
  - 11 gráficos customizados
  - Lógica de filtros temporais complexa
  - Sistema de tabs com dados distintos

**Impacto:**
- 🔴 **CRÍTICO** - Se deletado antes de migração completa
- 🔴 Perda de receita esperada, receita real, faltas, crescimento, retenção
- 🔴 Usuários perdem acesso a análises financeiras completas

**Mitigação:**
1. Criar branch separada para refatoração
2. Extrair funções ANTES de deletar arquivo
3. Criar testes para cada função extraída
4. Manter Financial.tsx ativa até C3 estável
5. Redirect gradual, não remoção imediata

#### **2. INCOMPATIBILIDADE DE LAYOUT TYPES**

**Risco:** Conflito entre layouts de diferentes sistemas

**Problema:**
```typescript
// DashboardExample.tsx usa:
layout_type: 'dashboard-example-grid'

// Metrics.tsx (C3) usará:
layout_type: 'metrics-grid' // ← NOVO

// Se usar o mesmo:
layout_type: 'dashboard-example-grid' // ← CONFLITO
```

**Impacto:**
- 🟡 **MÉDIO** - Usuários veem layouts misturados
- 🟡 Customizações de dashboard aparecem em metrics
- 🟡 Perda de preferências ao mudar de página

**Mitigação:**
1. Usar `layout_type` único para Metrics: `'metrics-grid'`
2. Criar hook separado: `useMetricsLayout()` (clone de useDashboardLayout)
3. Testar migração com múltiplos usuários

#### **3. QUEBRA DE PERMISSÕES POR CARDS NÃO CATALOGADOS**

**Risco:** Cards novos sem permissionConfig correto

**Problema:**
```typescript
// Se adicionar card sem definir domínio:
'new-metric-card': {
  id: 'new-metric-card',
  name: 'Nova Métrica',
  category: 'dashboard-cards',
  // ❌ FALTA: permissionConfig
}

// Card será renderizado para TODOS usuários
// Incluindo subordinados sem permissão financeira
```

**Impacto:**
- 🔴 **CRÍTICO** - Exposição de dados sensíveis
- 🔴 Subordinados veem dados financeiros restritos
- 🔴 Violação de LGPD (dados de terceiros expostos)

**Mitigação:**
1. **CHECKLIST OBRIGATÓRIO** para novos cards:
   - [ ] `permissionConfig.domain` definido
   - [ ] `requiresFinancialAccess` configurado (se aplicável)
   - [ ] `blockedFor` configurado (se aplicável)
   - [ ] Testado com usuário subordinate
   - [ ] Testado com usuário admin
2. Criar testes automatizados de permissões
3. Code review obrigatório para novos cards

#### **4. FALTA DE MODULARIZAÇÃO DOS CÁLCULOS**

**Risco:** Código duplicado e inconsistente

**Problema Atual:**
```typescript
// Financial.tsx calcula totalRevenue inline
const totalRevenue = periodSessions
  .filter(s => s.status === 'attended')
  .reduce((sum, s) => sum + Number(s.value), 0);

// Metrics.tsx (C3) terá que recriar:
const totalRevenue = sessions
  .filter(s => s.status === 'attended' && s.date >= start && s.date <= end)
  .reduce((sum, s) => {
    const patient = patients.find(p => p.id === s.patient_id);
    if (patient?.monthly_price) {
      // ... lógica de mensalista
    }
    return sum + Number(s.value);
  }, 0);
```

**Impacto:**
- 🟡 **MÉDIO** - Divergência de valores entre páginas
- 🟡 Bugs difíceis de rastrear
- 🟡 Manutenção duplicada

**Mitigação:**
1. Criar `systemMetricsUtils.ts` ANTES da C3
2. Função centralizada: `calculateTotalRevenue(sessions, patients, start, end)`
3. Reutilizar em Financial.tsx E Metrics.tsx
4. Testes unitários para cada função

#### **5. DADOS DE MARKETING 100% MOCK**

**Risco:** Expectativa de funcionalidade que não existe

**Problema:**
- `WebsiteMetrics.tsx` mostra cards e gráficos
- Todos valores são "-" ou listas estáticas
- Nenhuma integração com Google Analytics
- Nenhuma integração com backend

**Impacto:**
- 🟡 **MÉDIO** - Usuários esperam dados reais
- 🟡 Frustração ao clicar e ver placeholders
- 🟡 C3 parecerá incompleta

**Mitigação (3 opções):**

**Opção A: Remover da C3 Inicial**
```typescript
// Não incluir aba Marketing na primeira versão
METRICS_SECTIONS = {
  financial: {...},
  administrative: {...},
  team: {...},
  // marketing: {...}, ← COMENTADO
}
```

**Opção B: Marcar como "Em Desenvolvimento"**
```typescript
<Alert>
  <Info /> Métricas de marketing estarão disponíveis em breve.
  Aguardando integração com Google Analytics.
</Alert>
```

**Opção C: Implementar Integração Real**
```typescript
// Criar edge function:
supabase/functions/fetch-google-analytics/index.ts

// Buscar dados reais:
const { data } = await supabase.functions.invoke('fetch-google-analytics', {
  body: { startDate, endDate }
});
```

**Recomendação:** Opção A (remover) + Opção B (alert) na primeira release

#### **6. AUTO-SAVE AGRESSIVO DO useDashboardLayout**

**Risco:** Salva automaticamente após 2 segundos de modificação

**Problema:**
```typescript
// useDashboardLayout.ts linha 358
const DEBOUNCE_SAVE_MS = 2000;

useEffect(() => {
  if (!isModified) return;
  
  const timeout = setTimeout(() => {
    saveLayout(); // ← Salva sem confirmação
  }, DEBOUNCE_SAVE_MS);
  
  // ...
}, [layout, isModified]);
```

**Impacto:**
- 🟡 **MÉDIO** - Usuário perde customizações experimentais
- 🟡 Não há "cancelar alterações"
- 🟡 Layout pode ficar quebrado se usuário sair durante drag

**Mitigação:**
1. Adicionar botão "Salvar Layout" manual
2. Aumentar debounce para 5 segundos
3. Mostrar toast: "Layout salvo automaticamente"
4. Adicionar botão "Desfazer" (undo)

---

## 🔟 RESUMO EXECUTIVO FINAL

### 📋 Diagnóstico Geral

#### **🟢 PONTOS SAUDÁVEIS**

1. **Sistema de Cards Modular (DashboardExample.tsx)**
   - ✅ 26 cards implementados e testados
   - ✅ Sistema de registro centralizado
   - ✅ Props padronizadas (CardProps)
   - ✅ Permissões integradas por card
   - ✅ Drag & drop funcional

2. **Sistema de Permissões Robusto**
   - ✅ Fonte única de verdade (resolveEffectivePermissions)
   - ✅ Validação granular por domínio
   - ✅ Hooks especializados (useEffectivePermissions, useDashboardPermissions)
   - ✅ Integração com level_role_settings

3. **Persistência de Layout**
   - ✅ Supabase (user_layout_preferences)
   - ✅ localStorage (customizações temporárias)
   - ✅ Merge inteligente entre sources
   - ✅ Auto-save com debounce

4. **Biblioteca de Utilitários (Parcial)**
   - ✅ patientFinancialUtils.ts (cálculos por paciente)
   - ✅ gridLayoutUtils.ts (utilitários de grid)
   - ✅ useChartTimeScale.ts (escalas adaptativas)

5. **Documentação Existente**
   - ✅ docs/TRACK_C3_METRICAS_PLANO_FINAL.md (escopo completo)
   - ✅ SORTABLE_CARDS_USAGE.md
   - ✅ DASHBOARD_LAYOUT_USAGE.md
   - ✅ DASHBOARD_LAYOUT_SYSTEM.md

#### **🔴 PROBLEMAS EXISTENTES**

1. **Financial.tsx Não Modular**
   - ❌ 16+ funções de cálculo inline (não reutilizáveis)
   - ❌ Gráficos acoplados ao componente
   - ❌ Sem sistema de cards/drag&drop
   - ❌ Layout fixo (CSS Grid)
   - ❌ Incompatível com arquitetura da C3

2. **Falta de Utilitários Centralizados**
   - ❌ Nenhum arquivo de métricas agregadas de sistema
   - ❌ Cálculos financeiros espalhados
   - ❌ Cálculos administrativos inexistentes como utilitários
   - ❌ Cálculos clínicos inexistentes como utilitários
   - ❌ Métricas de marketing 100% mock

3. **Exposição de Dados Sensíveis (Financial.tsx)**
   - ❌ Carrega TODOS dados de subordinados sem filtro granular
   - ❌ Não valida permissionConfig por card/métrica
   - ❌ Seção "Team" não implementada
   - ❌ `financialAccess: 'summary'` não respeitado

4. **WebsiteMetrics.tsx Inutilizável**
   - ❌ 100% mock - nenhum dado real
   - ❌ Sem integração com Google Analytics
   - ❌ Sem backend implementado
   - ❌ Cards estáticos (não modulares)

5. **Rotas Fragmentadas**
   - ❌ `/financial` - página separada
   - ❌ `/metrics/website` - página separada (mock)
   - ❌ `/dashboard` - mistura métricas + operacional
   - ❌ Nenhuma rota `/metrics` unificada

### 📊 Avaliação de Compatibilidade com TRACK C3

#### **✅ COMPATÍVEL**

| Componente | Status | Uso na C3 |
|-----------|--------|-----------|
| DashboardExample.tsx | 🟢 Pronto | ✅ Servir como template |
| dashboardCardRegistry.tsx | 🟢 Pronto | ✅ Adicionar novos cards |
| useDashboardLayout | 🟢 Pronto | ✅ Clonar para useMetricsLayout |
| useChartTimeScale | 🟢 Pronto | ✅ Usar diretamente |
| useDashboardPermissions | 🟢 Pronto | ✅ Usar diretamente |
| patientFinancialUtils.ts | 🟡 Parcial | ⚠️ Expandir com métricas admin |
| gridLayoutUtils.ts | 🟢 Pronto | ✅ Usar diretamente |

#### **🔴 INCOMPATÍVEL**

| Componente | Status | Ação Necessária |
|-----------|--------|-----------------|
| Financial.tsx | 🔴 Bloqueador | 🔄 Refatoração COMPLETA |
| WebsiteMetrics.tsx | 🔴 Bloqueador | ❌ Remover OU 🔄 Reimplementar |
| DashboardOLD.tsx | 🔴 Deprecated | ❌ Deletar |

### 🎯 Sugestão de Prioridades

#### **FASE PRÉ-C3: PREPARAÇÃO (CRÍTICA)**

**Prioridade 1: Extração de Cálculos (BLOQUEADOR)**
```
CRIAR: src/lib/systemMetricsUtils.ts
EXTRAIR de Financial.tsx:
  - getMonthlyRevenue()
  - getPatientDistribution()
  - getMissedRate()
  - getAvgRevenuePerPatient()
  - calculateExpectedRevenue()
  - totalRevenue calculation
  - totalSessions, missedRate, avgPerSession
  - getMissedByPatient(), getMissedDistribution()
  - lostRevenue, avgRevenuePerActivePatient
  - getForecastRevenue()
  - calculateOccupationRate()
  - getTicketComparison()
  - getGrowthTrend()
  - getNewVsInactive()
  - getRetentionRate()
  - getLostRevenueByMonth()

ADICIONAR:
  - Interfaces de entrada/saída claras
  - Testes unitários para cada função
  - Documentação JSDoc
```

**Prioridade 2: Decisão sobre Marketing (BLOQUEADOR)**
```
OPÇÕES:
A) Remover aba Marketing da C3 inicial
B) Implementar integração real com Google Analytics
C) Marcar como "Em Desenvolvimento" com alert

RECOMENDAÇÃO: Opção A
```

**Prioridade 3: Auditoria de Permissões (ALTA)**
```
VERIFICAR:
- Financial.tsx expõe dados sensíveis?
- Cards novos têm permissionConfig?
- Seção Team implementada em todos lugares?

AÇÃO:
- Criar checklist de segurança para novos cards
- Code review obrigatório
```

#### **FASE C3.1: ESTRUTURA BASE**

**Prioridade 1: Criar Página Metrics.tsx**
```typescript
CRIAR: src/pages/Metrics.tsx
BASEADO EM: DashboardExample.tsx

CARACTERÍSTICAS:
- Sistema de tabs (Financial, Administrative, Marketing, Team)
- React Grid Layout (12 colunas)
- useMetricsLayout() hook
- Filtros temporais avançados
- Escala de tempo adaptativa
```

**Prioridade 2: Configurar Seções**
```typescript
CRIAR: src/lib/defaultSectionsMetrics.ts
BASEADO EM: defaultSectionsDashboard.ts

SEÇÕES:
- metrics-financial (domain: financial)
- metrics-administrative (domain: administrative)
- metrics-marketing (domain: media) [opcional]
- metrics-team (domain: team, blockedFor: ['subordinate'])
```

**Prioridade 3: Registrar Cards**
```typescript
ATUALIZAR: src/types/cardTypes.ts
ADICIONAR:
- metrics-monthly-revenue
- metrics-patient-distribution
- metrics-missed-rate
- metrics-avg-revenue-per-patient
- ... (todos cards de Financial.tsx)

CRIAR: src/lib/metricsCardRegistry.tsx
BASEADO EM: dashboardCardRegistry.tsx

USAR: systemMetricsUtils.ts (criado na PRÉ-C3)
```

#### **FASE C3.2: MIGRAÇÃO GRADUAL**

**Prioridade 1: Rotas**
```typescript
ADICIONAR: /metrics → Metrics.tsx

REDIRECT:
/financial → /metrics?tab=financial
/metrics/website → /metrics?tab=marketing

DEPRECAR (após 2 semanas):
/financial (deletar componente)
/metrics/website (deletar componente)
```

**Prioridade 2: Testes**
```
TESTAR:
- Usuário admin vê todas abas
- Usuário subordinate NÃO vê aba Team
- financialAccess='summary' vê apenas cards de resumo
- financialAccess='full' vê todos cards financeiros
- Drag & drop funciona
- Layout persiste no Supabase
- Escalas de tempo adaptam ao período
```

#### **FASE C3.3: REFINAMENTO**

**Prioridade 1: AddCardDialog**
```typescript
CRIAR: src/components/AddMetricsCardDialog.tsx
BASEADO EM: AddCardDialog.tsx

CARACTERÍSTICAS:
- Sistema de abas (Financial, Administrative, etc.)
- Sub-abas por domínio
- Filtro por permissões
- Preview de cards
```

**Prioridade 2: Comparativos**
```typescript
ADICIONAR EM: systemMetricsUtils.ts

FUNÇÕES:
- compareWithPreviousPeriod(metric, period)
- calculateGrowthRate(current, previous)
- formatComparison(value, previousValue)

USO:
- Mostrar "vs mês anterior"
- Mostrar "vs Q anterior"
- Mostrar "vs ano anterior"
```

**Prioridade 3: Exportação**
```
POSTERGAR para FASE FUTURA
- Exportar relatórios PDF
- Exportar CSV
- Enviar por email
```

### 📝 Lista de Ações Imediatas

**ANTES de iniciar TRACK C3:**

- [ ] **CRÍTICO:** Extrair funções de Financial.tsx → systemMetricsUtils.ts
- [ ] **CRÍTICO:** Decidir sobre aba Marketing (remover ou implementar?)
- [ ] **CRÍTICO:** Criar testes unitários para funções extraídas
- [ ] **ALTO:** Auditar exposição de dados em Financial.tsx
- [ ] **ALTO:** Implementar seção Team em Financial.tsx (se tempo permitir)
- [ ] **MÉDIO:** Documentar permissionConfig de todos cards existentes
- [ ] **MÉDIO:** Criar checklist de segurança para novos cards
- [ ] **BAIXO:** Limpar funções não usadas em gridLayoutUtils.ts

**Durante TRACK C3:**

- [ ] Criar Metrics.tsx baseado em DashboardExample.tsx
- [ ] Criar defaultSectionsMetrics.ts
- [ ] Criar metricsCardRegistry.tsx
- [ ] Adicionar rota /metrics
- [ ] Configurar redirects de rotas antigas
- [ ] Implementar AddMetricsCardDialog.tsx
- [ ] Adicionar comparativos temporais
- [ ] Testes de permissões
- [ ] Testes de persistência de layout

**Após TRACK C3:**

- [ ] Deprecar /financial (após 2 semanas de transição)
- [ ] Deletar Financial.tsx
- [ ] Deletar WebsiteMetrics.tsx
- [ ] Deletar DashboardOLD.tsx
- [ ] Limpar rotas antigas
- [ ] Documentação de usuário atualizada

---

## ✅ CONCLUSÃO

O sistema atual de métricas está **parcialmente pronto** para a TRACK C3:

**Pontos Fortes:**
- ✅ Sistema de cards modular (DashboardExample.tsx)
- ✅ Persistência de layout robusta
- ✅ Permissões granulares implementadas
- ✅ Biblioteca de utilitários (parcial)

**Bloqueadores Críticos:**
- 🔴 Financial.tsx não modular (16+ funções inline)
- 🔴 Falta de utilitários centralizados (systemMetricsUtils.ts)
- 🔴 WebsiteMetrics.tsx 100% mock

**Recomendação:**
**NÃO iniciar TRACK C3 sem:**
1. Extrair funções de Financial.tsx → systemMetricsUtils.ts
2. Decidir sobre Marketing (remover ou implementar)
3. Criar testes unitários para funções extraídas

**Estimativa de Preparação:**
- Extração de funções: 4-6 horas
- Testes unitários: 2-3 horas
- Auditoria de permissões: 1-2 horas
- **TOTAL: 7-11 horas**

**Após Preparação:**
- ✅ TRACK C3 pode iniciar com segurança
- ✅ Risco de quebra minimizado
- ✅ Base sólida para expansão futura
