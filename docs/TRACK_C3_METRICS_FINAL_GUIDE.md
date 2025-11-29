# 📊 TRACK C3 - METRICS PAGE - GUIA TÉCNICO COMPLETO

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Estrutura de Pastas](#estrutura-de-pastas)
5. [Como Adicionar Novo Card](#como-adicionar-novo-card)
6. [Como Adicionar Novo Gráfico](#como-adicionar-novo-gráfico)
7. [Como Adicionar Novo Domínio](#como-adicionar-novo-domínio)
8. [Sistema de Layout](#sistema-de-layout)
9. [Dependências Críticas](#dependências-críticas)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 VISÃO GERAL

A página `/metrics` é o painel unificado de métricas do sistema, substituindo as antigas páginas separadas (`/financial`, `/metrics/website`). Ela implementa:

- **4 domínios**: Financial, Administrative, Marketing, Team
- **12 cards numéricos**: Métricas instantâneas
- **31+ gráficos**: Visualizações detalhadas por sub-aba
- **Sistema de layout**: Drag & drop com persistência
- **Filtros de período**: Semana, Mês, Ano, Customizado
- **Controle de permissões**: Por domínio e card

### Status de Implementação

| Componente | Status | Cobertura |
|-----------|--------|-----------|
| Infraestrutura de página | ✅ 100% | FASE C3.2 |
| Cards numéricos | ✅ 100% | FASE C3.6 |
| Gráficos Financial | ✅ 100% | FASE C3-R.4 |
| Gráficos Administrative | ✅ 100% | FASE C3-R.5 |
| Gráficos Marketing | ✅ 100% | FASE C3.4.3 |
| Gráficos Team | ✅ 100% | FASE C3-R.6 |
| Sistema de Layout | ✅ 100% | FASE C3-R.1 |
| Registry de Cards | ✅ 100% | FASE C3-R.8 |
| Testes Unitários | ✅ 100% | FASE C3-R.3 |

---

## 🏗️ ARQUITETURA DO SISTEMA

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────┐
│                   src/pages/Metrics.tsx              │
│  ┌───────────────────────────────────────────────┐  │
│  │  1. Queries (useQuery)                        │  │
│  │     - Patients, Sessions, Profiles, Blocks    │  │
│  └───────────────────────────────────────────────┘  │
│                        ↓                             │
│  ┌───────────────────────────────────────────────┐  │
│  │  2. Data Adapters                             │  │
│  │     - dbPatientsToMetrics()                   │  │
│  │     - dbSessionsToMetrics()                   │  │
│  └───────────────────────────────────────────────┘  │
│                        ↓                             │
│  ┌───────────────────────────────────────────────┐  │
│  │  3. Metrics Utils (systemMetricsUtils)        │  │
│  │     - getFinancialSummary()                   │  │
│  │     - getFinancialTrends()                    │  │
│  │     - getRetentionAndChurn()                  │  │
│  └───────────────────────────────────────────────┘  │
│                        ↓                             │
│  ┌───────────────────────────────────────────────┐  │
│  │  4. UI Layer                                  │  │
│  │     - MetricsCards (12 components)            │  │
│  │     - Charts (31 components)                  │  │
│  │     - GridCardContainer (layout system)       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Camadas de Abstração

#### **1. Camada de Dados (Data Layer)**
- **Responsabilidade**: Buscar dados do Supabase
- **Tecnologia**: `@tanstack/react-query`
- **Arquivos**: `src/pages/Metrics.tsx` (queries)

```typescript
// Exemplo de query
const { data: patients, isLoading: loadingPatients } = useQuery({
  queryKey: ['patients', user?.id, organizationId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user!.id);
    
    if (error) throw error;
    return data;
  },
  enabled: !!user?.id,
});
```

#### **2. Camada de Adaptação (Adapter Layer)**
- **Responsabilidade**: Converter dados do banco para formato esperado pelos utils
- **Arquivos**: `src/pages/Metrics.tsx` (funções `dbXXXToMetrics`)

```typescript
// Exemplo de adapter
const adaptedPatients: MetricsPatient[] = useMemo(() => {
  if (!patients || !effectivePermissions) return [];
  
  return dbPatientsToMetrics(
    patients, 
    effectivePermissions, 
    user?.id
  );
}, [patients, effectivePermissions, user?.id]);
```

#### **3. Camada de Cálculo (Business Logic Layer)**
- **Responsabilidade**: Calcular métricas a partir dos dados adaptados
- **Arquivos**: `src/lib/systemMetricsUtils.ts`

```typescript
// Exemplo de cálculo
const summary = useMemo(() => {
  if (!adaptedPatients || !adaptedSessions) return null;
  
  return getFinancialSummary(adaptedPatients, adaptedSessions);
}, [adaptedPatients, adaptedSessions]);
```

#### **4. Camada de Apresentação (UI Layer)**
- **Responsabilidade**: Renderizar cards e gráficos
- **Arquivos**: `src/components/cards/metrics/**`, `src/components/charts/metrics/**`

```typescript
// Exemplo de card
<MetricsRevenueTotalCard
  periodFilter={periodFilter}
  summary={summary}
  isLoading={isLoading}
/>
```

---

## 🔄 FLUXO DE DADOS

### 1. Inicialização da Página

```
User acessa /metrics
    ↓
Lê searchParams (?domain=financial)
    ↓
Valida permissões do usuário
    ↓
Determina domínio padrão
    ↓
Redireciona se necessário
    ↓
Renderiza página
```

### 2. Fluxo de Filtros de Período

```
User seleciona "Semana"
    ↓
Atualiza state periodFilter
    ↓
Recalcula dateRange (start/end)
    ↓
useMemo recalcula summary/trends
    ↓
Cards e gráficos re-renderizam
```

### 3. Fluxo de Troca de Domínio

```
User clica em "Administrative"
    ↓
Atualiza URL (?domain=administrative)
    ↓
useEffect detecta mudança
    ↓
Atualiza currentDomain
    ↓
Filtra cards do novo domínio
    ↓
Renderiza gráficos do novo domínio
```

### 4. Fluxo de Drag & Drop (Layout)

```
User ativa "Editar Layout"
    ↓
isEditMode = true
    ↓
GridCardContainer habilita drag
    ↓
User arrasta card
    ↓
onLayoutChange() chamado
    ↓
useDashboardLayout atualiza state
    ↓
User clica "Salvar Layout"
    ↓
Persiste em Supabase (layout_profiles)
```

---

## 📁 ESTRUTURA DE PASTAS

```
src/
├── pages/
│   ├── Metrics.tsx                          # Página principal (1195 linhas)
│   ├── FinancialLegacyWrapper.tsx           # Redirect /financial → /metrics
│   └── MetricsWebsiteLegacyWrapper.tsx      # Redirect /metrics/website → /metrics
│
├── lib/
│   ├── systemMetricsUtils.ts                # Cálculos de métricas (1167 linhas)
│   ├── metricsSectionsConfig.ts             # Config de domínios/sub-abas (175 linhas)
│   ├── metricsCardRegistry.tsx              # Registry de cards (305 linhas)
│   └── defaultLayoutMetrics.ts              # Layouts padrão por domínio
│
├── types/
│   ├── metricsCardTypes.ts                  # Tipos de cards (36 linhas)
│   └── metricsChartTypes.ts                 # Tipos de gráficos (60 linhas)
│
├── components/
│   ├── cards/metrics/
│   │   ├── financial/
│   │   │   ├── MetricsRevenueTotalCard.tsx
│   │   │   ├── MetricsAvgPerSessionCard.tsx
│   │   │   ├── MetricsForecastRevenueCard.tsx
│   │   │   ├── MetricsAvgPerActivePatientCard.tsx
│   │   │   └── MetricsLostRevenueCard.tsx
│   │   ├── administrative/
│   │   │   ├── MetricsActivePatientsCard.tsx
│   │   │   ├── MetricsOccupationRateCard.tsx
│   │   │   └── MetricsMissedRateCard.tsx
│   │   └── marketing/
│   │       ├── MetricsWebsiteViewsCard.tsx
│   │       ├── MetricsWebsiteVisitorsCard.tsx
│   │       ├── MetricsWebsiteConversionCard.tsx
│   │       └── MetricsWebsiteCTRCard.tsx
│   │
│   ├── charts/metrics/
│   │   ├── financial/                       # 17 gráficos
│   │   │   ├── FinancialTrendsChart.tsx
│   │   │   ├── FinancialPerformanceChart.tsx
│   │   │   ├── FinancialDistributionsChart.tsx
│   │   │   ├── FinancialRevenueDistributionChart.tsx
│   │   │   ├── FinancialSessionStatusChart.tsx
│   │   │   ├── FinancialMonthlyPerformanceChart.tsx
│   │   │   ├── FinancialWeeklyComparisonChart.tsx
│   │   │   ├── FinancialRevenueTrendChart.tsx
│   │   │   ├── FinancialForecastVsActualChart.tsx
│   │   │   ├── FinancialConversionRateChart.tsx
│   │   │   ├── FinancialTicketComparisonChart.tsx
│   │   │   ├── FinancialInactiveByMonthChart.tsx
│   │   │   ├── FinancialMissedByPatientChart.tsx
│   │   │   ├── FinancialLostRevenueChart.tsx
│   │   │   ├── FinancialRetentionRateChart.tsx
│   │   │   ├── FinancialNewVsInactiveChart.tsx
│   │   │   └── FinancialTopPatientsChart.tsx
│   │   ├── administrative/                  # 7 gráficos
│   │   │   ├── AdminRetentionChart.tsx
│   │   │   ├── AdminPerformanceChart.tsx
│   │   │   ├── AdminDistributionsChart.tsx
│   │   │   ├── AdminFrequencyDistributionChart.tsx
│   │   │   ├── AdminAttendanceRateChart.tsx
│   │   │   ├── AdminWeeklyOccupationChart.tsx
│   │   │   └── AdminChurnRetentionChart.tsx
│   │   ├── marketing/                       # 1 gráfico
│   │   │   └── MarketingWebsiteOverviewChart.tsx
│   │   └── team/                            # 7 gráficos
│   │       ├── TeamIndividualPerformanceChart.tsx
│   │       ├── TeamRevenueComparisonChart.tsx
│   │       ├── TeamPatientDistributionChart.tsx
│   │       ├── TeamWorkloadChart.tsx
│   │       ├── TeamMonthlyEvolutionChart.tsx
│   │       ├── TeamOccupationByMemberChart.tsx
│   │       └── TeamAttendanceByTherapistChart.tsx
│   │
│   └── GridCardContainer.tsx                # Sistema de layout drag & drop
│
└── hooks/
    ├── useDashboardLayout.ts                # Gerencia layout/persistência
    ├── useChartTimeScale.ts                 # Escala de tempo para gráficos
    ├── useEffectivePermissions.ts           # Calcula permissões efetivas
    └── useDashboardPermissions.ts           # Filtra domínios por permissão
```

### Resumo Quantitativo

| Tipo | Quantidade | Status |
|------|-----------|--------|
| **Cards Numéricos** | 12 | ✅ 100% |
| **Gráficos Financial** | 17 | ✅ 100% |
| **Gráficos Administrative** | 7 | ✅ 100% |
| **Gráficos Marketing** | 1 | ✅ 100% |
| **Gráficos Team** | 7 | ✅ 100% |
| **Total Gráficos** | 32 | ✅ 100% |
| **Domínios** | 4 | ✅ 100% |
| **Sub-abas** | 11 | ✅ 100% |

---

## 📦 COMO ADICIONAR NOVO CARD

### Passo 1: Criar o Componente

**Arquivo**: `src/components/cards/metrics/<domain>/MetricsXYZCard.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

export function MetricsXYZCard({ 
  periodFilter, 
  summary, 
  isLoading 
}: MetricsCardBaseProps) {
  // Estado de carregamento
  if (isLoading || !summary) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    );
  }

  // Cálculo da métrica
  const value = summary.totalRevenue; // Exemplo
  const previousValue = 10000; // Exemplo
  const percentChange = ((value - previousValue) / previousValue) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Nome da Métrica
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% vs período anterior
        </p>
      </CardContent>
    </Card>
  );
}
```

### Passo 2: Registrar no Registry

**Arquivo**: `src/lib/metricsCardRegistry.tsx`

```typescript
// 1. Importar componente no topo
import { MetricsXYZCard } from '@/components/cards/metrics/financial/MetricsXYZCard';

// 2. Adicionar ao METRICS_CARD_REGISTRY
export const METRICS_CARD_REGISTRY: Record<string, MetricsCardDefinition> = {
  // ... cards existentes ...
  
  'metrics-xyz-new': {
    id: 'metrics-xyz-new',
    title: 'Nome da Métrica',
    description: 'Descrição curta do que mostra',
    domain: 'financial', // ou 'administrative', 'marketing', 'team'
    component: MetricsXYZCard,
    defaultLayout: { 
      x: 0,  // Posição X no grid (0-11)
      y: 0,  // Posição Y no grid
      w: 4,  // Largura (1-12)
      h: 2,  // Altura
      minW: 3, 
      minH: 2 
    },
    requiredPermission: 'financial_access', // Opcional
  },
};
```

### Passo 3: Adicionar ao Layout Padrão

**Arquivo**: `src/lib/defaultLayoutMetrics.ts`

```typescript
{
  sectionId: "metrics-financial",
  title: "Financial Metrics",
  layout: [
    // ... cards existentes ...
    { i: "metrics-xyz-new", x: 8, y: 0, w: 4, h: 2 },
  ]
}
```

### Passo 4: Testar

1. Acesse `/metrics?domain=financial`
2. Ative "Editar Layout"
3. Verifique se o novo card aparece
4. Teste drag & drop
5. Salve e recarregue a página

---

## 📊 COMO ADICIONAR NOVO GRÁFICO

### Passo 1: Criar o Componente

**Arquivo**: `src/components/charts/metrics/<domain>/<NomeDoGrafico>Chart.tsx`

```typescript
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { FinancialTrendsChartProps } from '@/types/metricsChartTypes';

export function ExemploChart({ 
  trends, 
  isLoading, 
  periodFilter, 
  timeScale 
}: FinancialTrendsChartProps) {
  // Estado de carregamento
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  // Processar dados
  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return [];
    
    return trends.map(point => ({
      date: point.date,
      value: point.revenue,
      // ... outros campos
    }));
  }, [trends]);

  // Estado vazio
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nome do Gráfico</CardTitle>
          <CardDescription>Descrição</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sem dados para o período selecionado
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Configuração do gráfico
  const chartConfig = {
    value: {
      label: "Receita",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nome do Gráfico</CardTitle>
        <CardDescription>
          Mostrando {chartData.length} pontos de dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="var(--color-value)" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

### Passo 2: Importar no Metrics.tsx

**Arquivo**: `src/pages/Metrics.tsx`

```typescript
// No topo do arquivo
import { ExemploChart } from '@/components/charts/metrics/financial/ExemploChart';
```

### Passo 3: Adicionar à Função renderChartContent()

**Arquivo**: `src/pages/Metrics.tsx` (linha ~900)

```typescript
const renderChartContent = () => {
  switch (currentDomain) {
    case 'financial':
      switch (currentSubTab) {
        case 'distribuicoes':
          return (
            <>
              <FinancialDistributionsChart ... />
              <FinancialRevenueDistributionChart ... />
              <FinancialSessionStatusChart ... />
              <ExemploChart  // ← NOVO GRÁFICO
                trends={trends}
                isLoading={isLoading}
                periodFilter={periodFilter}
                timeScale={currentScale}
              />
            </>
          );
        // ... outros casos
      }
    // ... outros domínios
  }
};
```

### Passo 4: Testar

1. Acesse `/metrics?domain=financial&subTab=distribuicoes`
2. Verifique se o gráfico aparece
3. Teste filtros de período
4. Valide estado de loading
5. Valide estado vazio

---

## 🌐 COMO ADICIONAR NOVO DOMÍNIO

### Passo 1: Atualizar Types

**Arquivo**: `src/lib/metricsSectionsConfig.ts`

```typescript
// Adicionar novo domínio ao type
export type MetricsDomain = Extract<
  PermissionDomain, 
  'financial' | 'administrative' | 'marketing' | 'team' | 'novo_dominio'
>;
```

### Passo 2: Adicionar à Configuração

**Arquivo**: `src/lib/metricsSectionsConfig.ts`

```typescript
export const METRICS_SECTIONS: MetricsSectionConfig[] = [
  // ... seções existentes ...
  {
    id: 'metrics-novo-dominio',
    domain: 'novo_dominio',
    title: 'Novo Domínio',
    description: 'Descrição do novo domínio.',
  },
];

export const METRICS_SUBTABS: MetricsSubTabConfig[] = [
  // ... sub-abas existentes ...
  { 
    id: 'sub-aba-1', 
    domain: 'novo_dominio', 
    label: 'Sub-aba 1',
    chartCategory: 'categoria1' 
  },
];
```

### Passo 3: Criar Cards do Domínio

Seguir [Como Adicionar Novo Card](#como-adicionar-novo-card) para cada card do domínio.

### Passo 4: Criar Gráficos do Domínio

Seguir [Como Adicionar Novo Gráfico](#como-adicionar-novo-gráfico) para cada gráfico.

### Passo 5: Adicionar Switch Case no Metrics.tsx

**Arquivo**: `src/pages/Metrics.tsx`

```typescript
const renderChartContent = () => {
  switch (currentDomain) {
    // ... casos existentes ...
    case 'novo_dominio':
      switch (currentSubTab) {
        case 'sub-aba-1':
          return <NovoGraficoChart ... />;
        default:
          return null;
      }
    default:
      return null;
  }
};
```

### Passo 6: Configurar Permissões

**Arquivo**: `src/types/permissions.ts`

```typescript
// Adicionar ao type
export type PermissionDomain = 
  | 'financial' 
  | 'administrative' 
  | 'marketing' 
  | 'team'
  | 'novo_dominio';
```

**Arquivo**: `src/hooks/useDashboardPermissions.ts`

```typescript
const domainPermissions: Record<PermissionDomain, boolean> = {
  // ... existentes ...
  novo_dominio: permissions.novo_dominio_access,
};
```

---

## 🎨 SISTEMA DE LAYOUT

### Arquitetura

```
useDashboardLayout (hook)
    ↓
Gerencia state + persistência
    ↓
GridCardContainer (component)
    ↓
react-grid-layout
    ↓
Renderiza cards com data-grid
```

### Hooks Principais

#### useDashboardLayout

**Arquivo**: `src/hooks/useDashboardLayout.ts`

**Responsabilidades**:
- Carregar layout do Supabase
- Manter state local de layouts
- Detectar mudanças não salvas
- Persistir no Supabase
- Resetar para layout padrão

**API**:
```typescript
const {
  layout,              // DashboardGridLayout atual
  updateLayout,        // (sectionId, newLayout) => void
  addCard,            // (sectionId, cardId) => void
  removeCard,         // (sectionId, cardId) => void
  saveLayout,         // () => Promise<void>
  resetLayout,        // () => Promise<void>
  hasUnsavedChanges,  // boolean
  isLoading,          // boolean
} = useDashboardLayout('metrics-grid');
```

#### useChartTimeScale

**Arquivo**: `src/hooks/useChartTimeScale.ts`

**Responsabilidades**:
- Determinar escala de tempo (daily, weekly, monthly)
- Persistir escolha manual do usuário
- Ajustar automaticamente baseado no período

**API**:
```typescript
const { 
  currentScale,     // TimeScale: 'daily' | 'weekly' | 'monthly'
  setManualScale,   // (scale: TimeScale) => void
} = useChartTimeScale({
  chartId: 'metrics-financial-tendencias',
  startDate: dateRange.start,
  endDate: dateRange.end,
});
```

### Componente GridCardContainer

**Arquivo**: `src/components/GridCardContainer.tsx`

**Props**:
```typescript
interface GridCardContainerProps {
  sectionId: string;
  layout: GridCardLayout[];
  onLayoutChange: (newLayout: GridCardLayout[]) => void;
  isEditMode: boolean;
  children: React.ReactNode;
}
```

**Features**:
- Drag & drop quando `isEditMode=true`
- Responsivo (breakpoints: lg, md, sm, xs)
- Persistência automática via callback
- Animações suaves

---

## 🔧 DEPENDÊNCIAS CRÍTICAS

### Bibliotecas Principais

| Biblioteca | Versão | Uso |
|-----------|--------|-----|
| `react-grid-layout` | ^1.5.2 | Sistema de layout drag & drop |
| `recharts` | ^2.15.4 | Gráficos interativos |
| `@tanstack/react-query` | ^5.83.0 | Cache e gerenciamento de queries |
| `date-fns` | ^3.6.0 | Manipulação de datas |
| `lucide-react` | ^0.462.0 | Ícones |

### Hooks Críticos

| Hook | Arquivo | Propósito |
|------|---------|-----------|
| `useAuth` | `src/contexts/AuthContext.tsx` | Usuário atual |
| `useEffectivePermissions` | `src/hooks/useEffectivePermissions.ts` | Permissões efetivas |
| `useDashboardPermissions` | `src/hooks/useDashboardPermissions.ts` | Domínios permitidos |
| `useDashboardLayout` | `src/hooks/useDashboardLayout.ts` | Layouts personalizados |
| `useChartTimeScale` | `src/hooks/useChartTimeScale.ts` | Escala temporal |

### Queries Supabase

| Query | Tabela | Propósito |
|-------|--------|-----------|
| `patients` | `patients` | Dados de pacientes |
| `sessions` | `sessions` | Dados de sessões |
| `profiles` | `profiles` | Dados de equipe |
| `schedule-blocks` | `schedule_blocks` | Bloqueios de agenda |
| `layout-profiles` | `layout_profiles` | Layouts personalizados |

---

## 🐛 TROUBLESHOOTING

### Problema: Cards não aparecem

**Possíveis Causas**:
1. Domínio não tem permissão
2. Card não registrado no `METRICS_CARD_REGISTRY`
3. Layout padrão não define o card
4. Erro em `getCardComponent()`

**Solução**:
```typescript
// 1. Verificar permissões
console.log('Effective Permissions:', effectivePermissions);
console.log('Allowed Domains:', allowedDomains);

// 2. Verificar registry
console.log('Card Definition:', getMetricsCardById('metrics-xyz'));

// 3. Verificar layout
console.log('Current Section Layout:', currentSectionLayout);

// 4. Verificar erro em console
// Abrir DevTools → Console → Filtrar por "Error"
```

### Problema: Gráficos não renderizam

**Possíveis Causas**:
1. `renderChartContent()` não está sendo chamado
2. Switch case não cobre o subTab atual
3. Props incorretas sendo passadas
4. Dados vazios (`trends.length === 0`)

**Solução**:
```typescript
// 1. Adicionar log em renderChartContent
const renderChartContent = () => {
  console.log('Current Domain:', currentDomain);
  console.log('Current SubTab:', currentSubTab);
  console.log('Trends:', trends);
  
  // ... resto do código
};

// 2. Verificar se está dentro de TabsContent
<TabsContent value={subTab.id}>
  {renderChartContent()} {/* ← DEVE ESTAR AQUI */}
</TabsContent>
```

### Problema: Drag & Drop não funciona

**Possíveis Causas**:
1. `isEditMode` está `false`
2. `data-grid` não está configurado nos cards
3. `onLayoutChange` não está conectado

**Solução**:
```typescript
// 1. Verificar isEditMode
console.log('Edit Mode:', isEditMode);

// 2. Verificar data-grid nos elementos
<div key={cardLayout.i} data-grid={cardLayout}>
  <CardComponent ... />
</div>

// 3. Verificar onLayoutChange
<GridCardContainer
  onLayoutChange={(newLayout) => {
    console.log('New Layout:', newLayout);
    updateLayout(sectionId, newLayout);
  }}
/>
```

### Problema: Layout não persiste

**Possíveis Causas**:
1. `saveLayout()` não está sendo chamado
2. Erro ao salvar no Supabase
3. `useDashboardLayout` não está conectado

**Solução**:
```typescript
// 1. Adicionar log em saveLayout
const handleSaveLayout = async () => {
  try {
    console.log('Saving layout...');
    await saveLayout();
    console.log('Layout saved successfully');
  } catch (error) {
    console.error('Failed to save layout:', error);
  }
};

// 2. Verificar network tab
// DevTools → Network → Filtrar por "supabase"
// Verificar se POST para layout_profiles foi bem-sucedido

// 3. Verificar se useDashboardLayout está inicializado
console.log('Dashboard Layout Hook:', {
  layout,
  hasUnsavedChanges,
  isLoading,
});
```

### Problema: Permissões não funcionam

**Possíveis Causas**:
1. `useEffectivePermissions` retornando dados incorretos
2. `requiredPermission` no card incorreto
3. `canUserViewCard()` com bug

**Solução**:
```typescript
// 1. Debugar permissões
console.log('User Permissions:', effectivePermissions);
console.log('Financial Access:', effectivePermissions.financialAccess);

// 2. Verificar se card tem requiredPermission
const cardDef = getMetricsCardById('metrics-revenue-total');
console.log('Card Required Permission:', cardDef?.requiredPermission);

// 3. Testar canUserViewCard
const canView = canUserViewCard('metrics-revenue-total', effectivePermissions);
console.log('Can View Card:', canView);
```

### Problema: Performance ruim (página lenta)

**Possíveis Causas**:
1. Muitos re-renders desnecessários
2. `useMemo` não otimizado
3. Queries sem cache adequado

**Solução**:
```typescript
// 1. Adicionar React DevTools Profiler
// Ativar "Record why each component rendered"

// 2. Verificar useMemo nas funções pesadas
const summary = useMemo(() => {
  console.time('Calculate Summary');
  const result = getFinancialSummary(...);
  console.timeEnd('Calculate Summary');
  return result;
}, [adaptedPatients, adaptedSessions]);

// 3. Verificar cache do react-query
const { data, isLoading, isFetching } = useQuery({
  queryKey: ['patients', user?.id],
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000,   // 10 minutos
});
```

---

## ✅ CHECKLIST DE QUALIDADE

Antes de fazer deploy ou considerar uma feature completa:

### Funcionalidade

- [ ] Todos os cards renderizam corretamente
- [ ] Todos os gráficos renderizam corretamente
- [ ] Filtros de período funcionam
- [ ] Troca de domínio funciona
- [ ] Troca de sub-aba funciona
- [ ] Drag & drop funciona
- [ ] Layout persiste após reload
- [ ] Reset layout funciona
- [ ] Permissões funcionam corretamente

### Performance

- [ ] Página carrega em < 2 segundos
- [ ] Troca de domínio é instantânea
- [ ] Troca de período é < 500ms
- [ ] Zero re-renders desnecessários
- [ ] Queries usam cache adequado

### UX

- [ ] Loading states em todos os componentes
- [ ] Empty states quando sem dados
- [ ] Mensagens de erro claras
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Acessível (ARIA labels, keyboard navigation)

### Código

- [ ] TypeScript sem erros
- [ ] Console sem warnings
- [ ] Testes unitários passando
- [ ] Código documentado
- [ ] Sem código morto

---

## 📚 REFERÊNCIAS

- [Documentação FASE C3-R.1](./track_c3_phase_c3_r1_layout_restoration.md)
- [Documentação FASE C3-R.2](./track_c3_phase_c3_r2_charts_fix.md)
- [Documentação FASE C3-R.3](./track_c3_phase_c3_r3_unit_tests.md)
- [Documentação FASE C3-R.4](./track_c3_phase_c3_r4_financial_charts.md)
- [Documentação FASE C3-R.5](./track_c3_phase_c3_r5_admin_charts.md)
- [Documentação FASE C3-R.6](./track_c3_phase_c3_r6_team_charts.md)
- [Documentação FASE C3-R.7](./track_c3_phase_c3_r7_financial_migration.md)
- [Documentação FASE C3-R.8](./track_c3_phase_c3_r8_card_registry.md)
- [Documentação FASE C3-R.9](./track_c3_phase_c3_r9_refinements.md)
- [Guia de Usuário](./USER_GUIDE_METRICS.md)

---

**Última Atualização**: 2025-01-11  
**Versão**: 1.0.0  
**Autor**: TRACK C3 Team  
**Status**: ✅ COMPLETO
