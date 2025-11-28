# 🔧 TRACK C3 - CORREÇÕES
## Faseamento Detalhado para Atingir 100% do Escopo Planejado

---

## 📊 SUMÁRIO EXECUTIVO

**Status Atual:** 30% implementado  
**Meta:** 100% funcional conforme `TRACK_C3_METRICAS_PLANO_FINAL.md`  
**Problemas Identificados:** 7 críticos (ver `TRACK_C3_AUDITORIA_COMPLETA_REALIDADE.md`)  
**Estimativa Total:** 54-79h de trabalho  
**Número de Fases:** 10 fases progressivas e granulares

---

## 🎯 COBERTURA DE PROBLEMAS

Este faseamento cobre **100%** dos problemas identificados na auditoria:

| Problema Auditoria | Fases que Resolvem |
|-------------------|-------------------|
| ❌ **P1:** Sistema de layout não funciona | C3-R.1 |
| ❌ **P2:** Gráficos invisíveis (7 criados) | C3-R.2 |
| ❌ **P3:** 18 gráficos faltando (de 26) | C3-R.4, C3-R.5, C3-R.6 |
| ❌ **P4:** Zero testes unitários (blocker C3.1.5) | C3-R.3 |
| ❌ **P5:** Financial.tsx ainda usa código antigo | C3-R.7 |
| ❌ **P6:** Cards não registrados globalmente | C3-R.8 |
| ❌ **P7:** Dropdown navbar desnecessário | C3-R.9 |

---

## 📋 FASEAMENTO CORRETIVO

---

### **FASE C3-R.1** - Restauração do Sistema de Layout (CRÍTICO)
**Prioridade:** 🔴 CRÍTICA  
**Estimativa:** 6-9h  
**Dependências:** Nenhuma  
**Objetivo:** Fazer o sistema de grid layout funcionar completamente

#### 🎯 Problemas que Resolve
- ✅ **P1:** Sistema de layout não funciona
- ✅ Falta de drag & drop
- ✅ Falta de persistência de layout
- ✅ `useDashboardLayout()` sendo ignorado

#### 📝 Escopo Detalhado

**1.1 - Conectar GridCardContainer ao Metrics.tsx (2-3h)**

**Estado Atual:**
```tsx
// src/pages/Metrics.tsx - LINHA ~850
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {renderMetricCards()}
</div>
```

**Estado Desejado:**
```tsx
import { GridCardContainer } from "@/components/GridCardContainer";
import type { GridCardLayout } from "@/components/GridCardContainer";

// Dentro do componente
const {
  layout,
  updateLayout,
  addCard,
  removeCard,
  saveLayout,
  resetLayout,
  hasUnsavedChanges
} = useDashboardLayout('metrics-grid');

const [isEditMode, setIsEditMode] = useState(false);

// Calcular currentSectionLayout
const currentDomain = searchParams.get('domain') || 'financial';
const currentSectionLayout = layout.sections.find(
  s => s.sectionId === `metrics-${currentDomain}`
)?.layout || [];

// Renderizar com GridCardContainer
<GridCardContainer
  sectionId={`metrics-${currentDomain}`}
  layout={currentSectionLayout}
  onLayoutChange={(newLayout) => updateLayout(`metrics-${currentDomain}`, newLayout)}
  isEditMode={isEditMode}
>
  {renderMetricCards()}
</GridCardContainer>
```

**Arquivos a Modificar:**
- `src/pages/Metrics.tsx` (PRINCIPAL)
  - Importar `GridCardContainer`
  - Substituir grid estático por `<GridCardContainer>`
  - Implementar `isEditMode` toggle
  - Conectar `useDashboardLayout('metrics-grid')`

**1.2 - Adicionar Controles de Edição de Layout (2-3h)**

**Requisitos:**
- Botão "Editar Layout" / "Salvar Layout" / "Resetar"
- Toggle visual de modo edição
- Indicador de mudanças não salvas
- Confirmação antes de resetar

**Implementação Sugerida:**
```tsx
// Header controls
<div className="flex items-center gap-2">
  {!isEditMode ? (
    <Button onClick={() => setIsEditMode(true)} variant="outline">
      <Pencil className="h-4 w-4 mr-2" />
      Editar Layout
    </Button>
  ) : (
    <>
      <Button onClick={handleSaveLayout} disabled={!hasUnsavedChanges}>
        <Save className="h-4 w-4 mr-2" />
        Salvar Layout
      </Button>
      <Button onClick={handleResetLayout} variant="destructive">
        <RotateCcw className="h-4 w-4 mr-2" />
        Resetar
      </Button>
      <Button onClick={() => setIsEditMode(false)} variant="ghost">
        Cancelar
      </Button>
    </>
  )}
</div>
```

**Arquivos a Modificar:**
- `src/pages/Metrics.tsx` (adicionar controles no header)

**1.3 - Implementar data-grid nos Cards (1-2h)**

**Problema:** Cards renderizados não possuem atributo `data-grid` necessário para `react-grid-layout`

**Solução:**
Cada card numérico deve ser envolvido assim:

```tsx
// Exemplo em renderMetricCards()
const cardLayouts = currentSectionLayout;

return cardLayouts.map((cardLayout) => {
  const CardComponent = getCardComponent(cardLayout.i);
  
  return (
    <div key={cardLayout.i} data-grid={cardLayout}>
      <CardComponent
        periodFilter={periodFilter}
        summary={summary}
        isLoading={isLoading}
      />
    </div>
  );
});
```

**Arquivos a Modificar:**
- `src/pages/Metrics.tsx` (função `renderMetricCards()`)
- Criar helper `getCardComponent(cardId)` que mapeia ID → componente

**1.4 - Configurar Layout Default por Domínio (1-2h)**

**Objetivo:** Cada domínio (`financial`, `administrative`, `marketing`, `team`) precisa de um layout inicial padrão.

**Estrutura:**
```typescript
// src/lib/defaultLayoutMetrics.ts (CRIAR)
import type { DashboardGridLayout } from "@/types/cardTypes";

export const DEFAULT_METRICS_LAYOUT: DashboardGridLayout = {
  sections: [
    {
      sectionId: "metrics-financial",
      title: "Financial Metrics",
      layout: [
        { i: "metrics-revenue-total", x: 0, y: 0, w: 4, h: 2 },
        { i: "metrics-forecast-revenue", x: 4, y: 0, w: 4, h: 2 },
        { i: "metrics-lost-revenue", x: 8, y: 0, w: 4, h: 2 },
        // ... demais cards financeiros
      ]
    },
    {
      sectionId: "metrics-administrative",
      title: "Administrative Metrics",
      layout: [
        { i: "metrics-active-patients", x: 0, y: 0, w: 4, h: 2 },
        { i: "metrics-occupation-rate", x: 4, y: 0, w: 4, h: 2 },
        { i: "metrics-missed-rate", x: 8, y: 0, w: 4, h: 2 },
      ]
    },
    {
      sectionId: "metrics-marketing",
      title: "Marketing Metrics",
      layout: [
        { i: "metrics-website-visitors", x: 0, y: 0, w: 3, h: 2 },
        { i: "metrics-website-views", x: 3, y: 0, w: 3, h: 2 },
        { i: "metrics-website-ctr", x: 6, y: 0, w: 3, h: 2 },
        { i: "metrics-website-conversion", x: 9, y: 0, w: 3, h: 2 },
      ]
    },
    {
      sectionId: "metrics-team",
      title: "Team Metrics",
      layout: [] // Ainda sem cards implementados
    }
  ]
};
```

**Arquivos a Criar:**
- `src/lib/defaultLayoutMetrics.ts`

**Arquivos a Modificar:**
- `src/hooks/useDashboardLayout.ts` (importar e usar `DEFAULT_METRICS_LAYOUT` quando `layoutType === 'metrics-grid'`)

#### ✅ Critérios de Aceite C3-R.1

- [ ] `GridCardContainer` integrado em `Metrics.tsx`
- [ ] Botões "Editar Layout", "Salvar", "Resetar" funcionando
- [ ] Modo edição permite drag & drop de cards
- [ ] Layout persiste em Supabase via `useDashboardLayout`
- [ ] Cada domínio tem layout padrão definido
- [ ] Todos os 12 cards numéricos têm `data-grid` correto
- [ ] Zero erros de console relacionados a layout
- [ ] Documentação criada: `docs/track_c3_phase_c3_r1_layout_restoration.md`

#### 📚 Documentação Esperada
Arquivo: `docs/track_c3_phase_c3_r1_layout_restoration.md`

**Conteúdo Mínimo:**
- Problema resolvido
- Arquivos criados/modificados
- Como testar drag & drop
- Como testar persistência
- Screenshots do antes/depois
- Confirmação de que useDashboardLayout agora funciona

---

### **FASE C3-R.2** - Correção dos Gráficos Existentes (CRÍTICO)
**Prioridade:** 🔴 CRÍTICA  
**Estimativa:** 4-6h  
**Dependências:** Nenhuma (pode rodar em paralelo com C3-R.1)  
**Objetivo:** Fazer os 7 gráficos já criados aparecerem e funcionarem

#### 🎯 Problemas que Resolve
- ✅ **P2:** Gráficos invisíveis (7 gráficos criados mas não renderizados)
- ✅ Função `renderChartContent()` não está sendo chamada corretamente

#### 📝 Escopo Detalhado

**2.1 - Diagnosticar Problema de Renderização (1h)**

**Investigar:**
```tsx
// src/pages/Metrics.tsx - LINHA ~470
const renderChartContent = () => {
  const chartId = `metrics-${currentDomain}-${subTabId}`;
  const { currentScale } = useChartTimeScale({ 
    chartId, 
    startDate: dateRange.start, 
    endDate: dateRange.end 
  });
  // ...
}
```

**Problema Provável:**
- `renderChartContent()` está definido mas talvez não esteja sendo invocado
- Ou está sendo invocado em contexto errado (fora do componente)
- Hook `useChartTimeScale` sendo chamado dentro de função regular (ERRO!)

**Solução:**
Mover lógica de `useChartTimeScale` para o corpo principal do componente:

```tsx
// No topo do componente Metrics
const currentDomain = searchParams.get('domain') || defaultDomain;
const currentSubTab = searchParams.get('subTab') || getDefaultSubTabForDomain(currentDomain);
const chartId = `metrics-${currentDomain}-${currentSubTab}`;

const { currentScale, setManualScale } = useChartTimeScale({
  chartId,
  startDate: dateRange.start,
  endDate: dateRange.end
});

// Depois, renderChartContent usa 'currentScale' diretamente
const renderChartContent = () => {
  switch (currentDomain) {
    case 'financial':
      // usa currentScale aqui
      return <FinancialTrendsChart ... timeScale={currentScale} />;
    // ...
  }
}
```

**2.2 - Garantir Chamada de renderChartContent() (1h)**

**Verificar onde está sendo chamado:**
```tsx
// Procurar por estrutura similar em Metrics.tsx
<Tabs value={currentSubTab}>
  {subTabs.map(subTab => (
    <TabsContent key={subTab.id} value={subTab.id}>
      {renderChartContent()} {/* ← PRECISA ESTAR AQUI */}
    </TabsContent>
  ))}
</Tabs>
```

**Se não estiver chamado:** adicionar `{renderChartContent()}` dentro de cada `<TabsContent>`.

**2.3 - Validar Props dos Gráficos (2-3h)**

**Checklist para cada um dos 7 gráficos:**

| Gráfico | Arquivo | Props Esperadas | Status |
|---------|---------|-----------------|--------|
| FinancialTrendsChart | `src/components/charts/metrics/financial/FinancialTrendsChart.tsx` | `trends`, `periodFilter`, `timeScale`, `isLoading` | ⚠️ Validar |
| FinancialPerformanceChart | `src/components/charts/metrics/financial/FinancialPerformanceChart.tsx` | `trends`, `summary`, `periodFilter`, `timeScale`, `isLoading` | ⚠️ Validar |
| FinancialDistributionsChart | `src/components/charts/metrics/financial/FinancialDistributionsChart.tsx` | `summary`, `periodFilter`, `timeScale`, `isLoading` | ⚠️ Validar |
| AdminRetentionChart | `src/components/charts/metrics/administrative/AdminRetentionChart.tsx` | `retention`, `periodFilter`, `timeScale`, `isLoading` | ⚠️ Validar |
| AdminPerformanceChart | `src/components/charts/metrics/administrative/AdminPerformanceChart.tsx` | `trends`, `periodFilter`, `timeScale`, `isLoading` | ⚠️ Validar |
| AdminDistributionsChart | `src/components/charts/metrics/administrative/AdminDistributionsChart.tsx` | `summary`, `periodFilter`, `timeScale`, `isLoading` | ⚠️ Validar |
| MarketingWebsiteOverviewChart | `src/components/charts/metrics/marketing/MarketingWebsiteOverviewChart.tsx` | `isLoading` (mockado) | ⚠️ Validar |

**Para cada gráfico:**
1. Abrir o arquivo do componente
2. Verificar interface de props
3. Garantir que `Metrics.tsx` está passando props corretas
4. Testar renderização com dados mock primeiro
5. Testar com dados reais (`summary`, `trends`, `retention`)

**2.4 - Adicionar Estados de Loading/Empty (1h)**

**Para cada gráfico, garantir:**
```tsx
if (isLoading) {
  return <Skeleton className="w-full h-[300px]" />;
}

if (!trends || trends.length === 0) {
  return (
    <div className="flex items-center justify-center h-[300px]">
      <p className="text-muted-foreground">Sem dados para o período selecionado</p>
    </div>
  );
}

// Renderizar gráfico normal
return <ResponsiveContainer>...</ResponsiveContainer>;
```

#### ✅ Critérios de Aceite C3-R.2

- [ ] `useChartTimeScale` chamado no corpo do componente (não dentro de função)
- [ ] `renderChartContent()` invocado corretamente em todas as TabsContent
- [ ] 7 gráficos renderizam visualmente
- [ ] Skeleton aparece durante loading
- [ ] Estado "empty" aparece quando sem dados
- [ ] Gráficos respondem a mudança de período
- [ ] Console sem erros relacionados a charts
- [ ] Documentação criada: `docs/track_c3_phase_c3_r2_charts_fix.md`

#### 📚 Documentação Esperada
Arquivo: `docs/track_c3_phase_c3_r2_charts_fix.md`

**Conteúdo Mínimo:**
- Problema diagnosticado (hook em função, chamada faltando, props erradas)
- Solução implementada
- Checklist dos 7 gráficos validados
- Screenshots de cada gráfico funcionando
- Como testar cada sub-aba

---

### **FASE C3-R.3** - Implementação de Testes Unitários (BLOCKER)
**Prioridade:** 🟡 ALTA (blocker da C3.1.5)  
**Estimativa:** 6-9h  
**Dependências:** Nenhuma  
**Objetivo:** Criar testes unitários conforme planejado na C3.1.5

#### 🎯 Problemas que Resolve
- ✅ **P4:** Zero testes unitários implementados
- ✅ Blocker da fase C3.1.5 original
- ✅ Falta de validação automatizada

#### 📝 Escopo Detalhado

**3.1 - Testes de systemMetricsUtils.ts (3-4h)**

**Arquivo de Teste:** `src/lib/__tests__/systemMetricsUtils.test.ts` (CRIAR)

**Suites de Teste:**

```typescript
import { describe, it, expect } from 'vitest';
import { 
  getFinancialSummary, 
  getFinancialTrends, 
  getRetentionAndChurn 
} from '@/lib/systemMetricsUtils';
import { 
  mockPatients, 
  mockSessions, 
  mockProfile, 
  mockScheduleBlocks 
} from '@/lib/__tests__/fixtures/metricsTestData';

describe('getFinancialSummary', () => {
  it('calcula receita total corretamente', () => {
    const result = getFinancialSummary(mockPatients, mockSessions);
    expect(result.totalRevenue).toBe(2400); // Exemplo esperado
  });

  it('calcula receita prevista corretamente', () => {
    const result = getFinancialSummary(mockPatients, mockSessions);
    expect(result.forecastRevenue).toBeGreaterThan(result.totalRevenue);
  });

  it('calcula receita perdida com sessões missed', () => {
    const result = getFinancialSummary(mockPatients, mockSessions);
    expect(result.lostRevenue).toBe(800); // Exemplo
  });

  it('calcula média por paciente ativo', () => {
    const result = getFinancialSummary(mockPatients, mockSessions);
    expect(result.avgRevenuePerActivePatient).toBe(600); // 2400 / 4
  });

  it('calcula média por sessão realizada', () => {
    const result = getFinancialSummary(mockPatients, mockSessions);
    expect(result.avgRevenuePerSession).toBe(200);
  });

  it('conta pacientes ativos corretamente', () => {
    const result = getFinancialSummary(mockPatients, mockSessions);
    expect(result.activePatientsCount).toBe(4);
  });

  it('conta sessões realizadas vs faltadas', () => {
    const result = getFinancialSummary(mockPatients, mockSessions);
    expect(result.attendedSessionsCount).toBe(12);
    expect(result.missedSessionsCount).toBe(4);
  });
});

describe('getFinancialTrends', () => {
  it('agrupa dados por dia quando período < 31 dias', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-01-15');
    const result = getFinancialTrends(mockPatients, mockSessions, start, end, 'daily');
    
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('date');
    expect(result[0]).toHaveProperty('revenue');
    expect(result[0]).toHaveProperty('sessionCount');
  });

  it('agrupa dados por semana quando período 31-90 dias', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-02-28');
    const result = getFinancialTrends(mockPatients, mockSessions, start, end, 'weekly');
    
    expect(result.length).toBeLessThan(15); // Menos pontos que diário
  });

  it('agrupa dados por mês quando período > 90 dias', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-12-31');
    const result = getFinancialTrends(mockPatients, mockSessions, start, end, 'monthly');
    
    expect(result.length).toBe(12);
  });
});

describe('getRetentionAndChurn', () => {
  it('calcula taxa de retenção', () => {
    const result = getRetentionAndChurn(mockPatients, mockSessions);
    expect(result.retentionRate).toBeGreaterThanOrEqual(0);
    expect(result.retentionRate).toBeLessThanOrEqual(100);
  });

  it('identifica novos pacientes vs returning', () => {
    const result = getRetentionAndChurn(mockPatients, mockSessions);
    expect(result.newPatientsCount).toBeGreaterThanOrEqual(0);
    expect(result.returningPatientsCount).toBeGreaterThanOrEqual(0);
  });

  it('calcula churn rate', () => {
    const result = getRetentionAndChurn(mockPatients, mockSessions);
    expect(result.churnRate).toBeGreaterThanOrEqual(0);
    expect(result.churnRate).toBeLessThanOrEqual(100);
  });
});
```

**Arquivos a Criar:**
- `src/lib/__tests__/systemMetricsUtils.test.ts`

**Arquivos a Validar:**
- `src/lib/__tests__/fixtures/metricsTestData.ts` (já existe, validar se cobre casos)

**3.2 - Testes de Cards Numéricos (2-3h)**

**Exemplo:** `src/components/cards/metrics/__tests__/MetricsRevenueTotalCard.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsRevenueTotalCard } from '../financial/MetricsRevenueTotalCard';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

describe('MetricsRevenueTotalCard', () => {
  const mockProps: MetricsCardBaseProps = {
    periodFilter: {
      type: 'month',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31')
    },
    summary: {
      totalRevenue: 15000,
      forecastRevenue: 18000,
      // ... demais campos
    },
    isLoading: false
  };

  it('renderiza valor correto quando carregado', () => {
    render(<MetricsRevenueTotalCard {...mockProps} />);
    expect(screen.getByText(/R\$ 15\.000,00/)).toBeInTheDocument();
  });

  it('mostra skeleton quando isLoading=true', () => {
    render(<MetricsRevenueTotalCard {...mockProps} isLoading={true} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('formata valor em reais corretamente', () => {
    const props = { ...mockProps, summary: { ...mockProps.summary!, totalRevenue: 1234.56 } };
    render(<MetricsRevenueTotalCard {...props} />);
    expect(screen.getByText(/R\$ 1\.234,56/)).toBeInTheDocument();
  });

  it('mostra ícone de DollarSign', () => {
    const { container } = render(<MetricsRevenueTotalCard {...mockProps} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
```

**Criar testes similares para:**
- MetricsForecastRevenueCard
- MetricsLostRevenueCard
- MetricsAvgPerSessionCard
- MetricsAvgPerActivePatientCard
- MetricsActivePatientsCard
- MetricsOccupationRateCard
- MetricsMissedRateCard
- MetricsWebsiteVisitorsCard
- MetricsWebsiteViewsCard
- MetricsWebsiteCTRCard
- MetricsWebsiteConversionCard

**Arquivos a Criar:**
- `src/components/cards/metrics/__tests__/[NomeDoCard].test.tsx` (12 arquivos)

**3.3 - Testes de Hooks (1-2h)**

**Exemplo:** `src/hooks/__tests__/useChartTimeScale.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChartTimeScale } from '@/hooks/useChartTimeScale';

describe('useChartTimeScale', () => {
  it('retorna "daily" para período < 31 dias', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        chartId: 'test-chart',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-15')
      })
    );
    
    expect(result.current.currentScale).toBe('daily');
  });

  it('retorna "weekly" para período 31-90 dias', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        chartId: 'test-chart',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-02-28')
      })
    );
    
    expect(result.current.currentScale).toBe('weekly');
  });

  it('retorna "monthly" para período > 90 dias', () => {
    const { result } = renderHook(() => 
      useChartTimeScale({
        chartId: 'test-chart',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      })
    );
    
    expect(result.current.currentScale).toBe('monthly');
  });
});
```

**Arquivos a Criar:**
- `src/hooks/__tests__/useChartTimeScale.test.ts`
- `src/hooks/__tests__/useDashboardLayout.test.ts` (opcional, mais complexo)

#### ✅ Critérios de Aceite C3-R.3

- [ ] 20+ testes para `systemMetricsUtils.ts`
- [ ] 12 arquivos de teste para cards numéricos
- [ ] Testes de `useChartTimeScale`
- [ ] `npm run test` passa 100%
- [ ] Cobertura > 80% em `systemMetricsUtils.ts`
- [ ] Documentação criada: `docs/track_c3_phase_c3_r3_unit_tests.md`

#### 📚 Documentação Esperada
Arquivo: `docs/track_c3_phase_c3_r3_unit_tests.md`

**Conteúdo Mínimo:**
- Lista de todos os testes criados
- Como rodar os testes (`npm run test`)
- Relatório de cobertura
- Casos de teste críticos cobertos
- Fixtures utilizados

---

### **FASE C3-R.4** - Completar Gráficos Faltantes - Financial
**Prioridade:** 🟡 ALTA  
**Estimativa:** 12-17h  
**Dependências:** C3-R.2 (gráficos existentes funcionando)  
**Objetivo:** Implementar os 7 gráficos financeiros faltantes das sub-abas

#### 🎯 Problemas que Resolve
- ✅ **P3:** Parte dos 18 gráficos faltantes
- ✅ Sub-abas financeiras incompletas

#### 📝 Gráficos a Implementar

Conforme `TRACK_C3_METRICAS_PLANO_FINAL.md` - Seção 3.4.1:

| Sub-Aba | Gráfico | Tipo | Arquivo | Status |
|---------|---------|------|---------|--------|
| **distribuicoes** | Distribuição de Receita | PieChart | `FinancialRevenueDistributionChart.tsx` | ❌ Criar |
| **distribuicoes** | Status de Sessões | PieChart | `FinancialSessionStatusChart.tsx` | ❌ Criar |
| **desempenho** | Performance Mensal | ComposedChart | `FinancialMonthlyPerformanceChart.tsx` | ❌ Criar |
| **desempenho** | Comparativo Semanal | BarChart | `FinancialWeeklyComparisonChart.tsx` | ❌ Criar |
| **tendencias** | Tendência de Receita | LineChart | `FinancialRevenueTrendChart.tsx` | ❌ Criar |
| **tendencias** | Previsão vs Realizado | AreaChart | `FinancialForecastVsActualChart.tsx` | ❌ Criar |
| **tendencias** | Taxa de Conversão | LineChart | `FinancialConversionRateChart.tsx` | ❌ Criar |

**Nota:** `FinancialTrendsChart`, `FinancialPerformanceChart`, `FinancialDistributionsChart` já existem (C3.7), mas podem precisar de ajustes.

#### 📝 Escopo Detalhado por Gráfico

**4.1 - FinancialRevenueDistributionChart (2-3h)**

**Dados de Entrada:**
- `summary.totalRevenue`
- `summary.forecastRevenue`
- `summary.lostRevenue`

**Visualização:**
```tsx
<PieChart>
  <Pie
    data={[
      { name: 'Receita Realizada', value: summary.totalRevenue, fill: 'hsl(var(--chart-1))' },
      { name: 'Receita Prevista (Faltante)', value: summary.forecastRevenue - summary.totalRevenue, fill: 'hsl(var(--chart-2))' },
      { name: 'Receita Perdida', value: summary.lostRevenue, fill: 'hsl(var(--chart-3))' },
    ]}
    // ...
  />
  <Tooltip content={<CustomTooltip />} />
  <Legend />
</PieChart>
```

**Arquivo a Criar:**
- `src/components/charts/metrics/financial/FinancialRevenueDistributionChart.tsx`

**Props:**
```typescript
interface FinancialRevenueDistributionChartProps {
  summary: FinancialSummary | null;
  periodFilter: MetricsPeriodFilter;
  timeScale: TimeScale;
  isLoading: boolean;
}
```

**4.2 - FinancialSessionStatusChart (2-3h)**

**Dados de Entrada:**
- `summary.attendedSessionsCount`
- `summary.missedSessionsCount`
- `summary.rescheduledSessionsCount`

**Visualização:**
```tsx
<PieChart>
  <Pie
    data={[
      { name: 'Realizadas', value: summary.attendedSessionsCount, fill: 'hsl(var(--success))' },
      { name: 'Faltadas', value: summary.missedSessionsCount, fill: 'hsl(var(--destructive))' },
      { name: 'Remarcadas', value: summary.rescheduledSessionsCount, fill: 'hsl(var(--warning))' },
    ]}
    // ...
  />
</PieChart>
```

**Arquivo a Criar:**
- `src/components/charts/metrics/financial/FinancialSessionStatusChart.tsx`

**4.3 - FinancialMonthlyPerformanceChart (2-3h)**

**Dados de Entrada:**
- `trends` (agrupado por mês se necessário)

**Visualização:**
```tsx
<ComposedChart data={monthlyData}>
  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Receita" />
  <Line dataKey="sessionCount" stroke="hsl(var(--accent))" name="Sessões" />
  <Tooltip />
  <Legend />
</ComposedChart>
```

**Arquivo a Criar:**
- `src/components/charts/metrics/financial/FinancialMonthlyPerformanceChart.tsx`

**4.4 - FinancialWeeklyComparisonChart (2-3h)**

**Dados de Entrada:**
- `trends` (agrupado por semana)

**Visualização:**
```tsx
<BarChart data={weeklyData}>
  <Bar dataKey="revenue" fill="hsl(var(--chart-1))" />
  <XAxis dataKey="weekLabel" />
  <YAxis />
  <Tooltip />
</BarChart>
```

**Arquivo a Criar:**
- `src/components/charts/metrics/financial/FinancialWeeklyComparisonChart.tsx`

**4.5 - FinancialRevenueTrendChart (2-3h)**

**Dados de Entrada:**
- `trends`

**Visualização:**
```tsx
<LineChart data={trends}>
  <Line 
    dataKey="revenue" 
    stroke="hsl(var(--primary))" 
    strokeWidth={2}
    dot={{ fill: 'hsl(var(--primary))' }}
  />
  <XAxis dataKey="date" tickFormatter={formatDate} />
  <YAxis tickFormatter={formatCurrency} />
  <Tooltip />
</LineChart>
```

**Arquivo a Criar:**
- `src/components/charts/metrics/financial/FinancialRevenueTrendChart.tsx`

**4.6 - FinancialForecastVsActualChart (2-3h)**

**Dados de Entrada:**
- `trends` (com campo adicional `forecast` calculado)

**Lógica:**
```typescript
const dataWithForecast = trends.map(point => ({
  ...point,
  forecast: calculateForecast(point, summary), // Média móvel ou projeção
}));
```

**Visualização:**
```tsx
<AreaChart data={dataWithForecast}>
  <Area dataKey="revenue" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" />
  <Area dataKey="forecast" fill="hsl(var(--muted))" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
  <Tooltip />
  <Legend />
</AreaChart>
```

**Arquivo a Criar:**
- `src/components/charts/metrics/financial/FinancialForecastVsActualChart.tsx`

**4.7 - FinancialConversionRateChart (2-3h)**

**Dados de Entrada:**
- `trends` com cálculo de taxa de conversão (sessões agendadas → realizadas)

**Lógica:**
```typescript
const conversionData = trends.map(point => ({
  date: point.date,
  conversionRate: (point.attendedCount / point.scheduledCount) * 100,
}));
```

**Visualização:**
```tsx
<LineChart data={conversionData}>
  <Line dataKey="conversionRate" stroke="hsl(var(--success))" />
  <XAxis dataKey="date" />
  <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
  <Tooltip formatter={(val) => `${val.toFixed(1)}%`} />
</LineChart>
```

**Arquivo a Criar:**
- `src/components/charts/metrics/financial/FinancialConversionRateChart.tsx`

#### 🔌 Integração em Metrics.tsx

**Modificar:** `src/pages/Metrics.tsx` - função `renderChartContent()`

```tsx
const renderChartContent = () => {
  if (currentDomain === 'financial') {
    switch (currentSubTab) {
      case 'distribuicoes':
        return (
          <>
            <FinancialRevenueDistributionChart
              summary={summary}
              periodFilter={periodFilter}
              timeScale={currentScale}
              isLoading={isLoading}
            />
            <FinancialSessionStatusChart
              summary={summary}
              periodFilter={periodFilter}
              timeScale={currentScale}
              isLoading={isLoading}
            />
          </>
        );
      
      case 'desempenho':
        return (
          <>
            <FinancialMonthlyPerformanceChart
              trends={trends}
              periodFilter={periodFilter}
              timeScale={currentScale}
              isLoading={isLoading}
            />
            <FinancialWeeklyComparisonChart
              trends={trends}
              periodFilter={periodFilter}
              timeScale={currentScale}
              isLoading={isLoading}
            />
          </>
        );
      
      case 'tendencias':
        return (
          <>
            <FinancialRevenueTrendChart
              trends={trends}
              periodFilter={periodFilter}
              timeScale={currentScale}
              isLoading={isLoading}
            />
            <FinancialForecastVsActualChart
              trends={trends}
              summary={summary}
              periodFilter={periodFilter}
              timeScale={currentScale}
              isLoading={isLoading}
            />
            <FinancialConversionRateChart
              trends={trends}
              periodFilter={periodFilter}
              timeScale={currentScale}
              isLoading={isLoading}
            />
          </>
        );
      
      default:
        return null;
    }
  }
  // ... demais domínios
};
```

#### ✅ Critérios de Aceite C3-R.4

- [ ] 7 novos componentes de gráfico criados
- [ ] Todos os gráficos renderizam com dados reais
- [ ] Estados de loading/empty implementados
- [ ] Gráficos respondem a mudanças de período
- [ ] Sub-abas `distribuicoes`, `desempenho`, `tendencias` funcionam 100%
- [ ] Integração em `renderChartContent()` completa
- [ ] Zero erros de console
- [ ] Documentação criada: `docs/track_c3_phase_c3_r4_financial_charts.md`

#### 📚 Documentação Esperada
Arquivo: `docs/track_c3_phase_c3_r4_financial_charts.md`

**Conteúdo Mínimo:**
- Lista dos 7 gráficos implementados
- Tipo de chart usado (PieChart, LineChart, etc.)
- Dados de entrada de cada um
- Screenshots de cada sub-aba funcionando
- Como testar cada gráfico

---

### **FASE C3-R.5** - Completar Gráficos Faltantes - Administrative
**Prioridade:** 🟡 ALTA  
**Estimativa:** 8-12h  
**Dependências:** C3-R.2  
**Objetivo:** Implementar os 4 gráficos administrativos faltantes

#### 🎯 Problemas que Resolve
- ✅ **P3:** Parte dos 18 gráficos faltantes
- ✅ Sub-abas administrativas incompletas

#### 📝 Gráficos a Implementar

Conforme `TRACK_C3_METRICAS_PLANO_FINAL.md` - Seção 3.4.2:

| Sub-Aba | Gráfico | Tipo | Arquivo | Status |
|---------|---------|------|---------|--------|
| **distribuicoes** | Distribuição por Frequência | PieChart | `AdminFrequencyDistributionChart.tsx` | ❌ Criar |
| **desempenho** | Taxa de Comparecimento | LineChart | `AdminAttendanceRateChart.tsx` | ❌ Criar |
| **desempenho** | Ocupação Semanal | BarChart | `AdminWeeklyOccupationChart.tsx` | ❌ Criar |
| **retencao** | Churn vs Retenção | BarChart | `AdminChurnRetentionChart.tsx` | ❌ Criar |

**Nota:** `AdminRetentionChart`, `AdminPerformanceChart`, `AdminDistributionsChart` já existem (C3.7).

#### 📝 Escopo Detalhado por Gráfico

**5.1 - AdminFrequencyDistributionChart (2-3h)**

**Dados de Entrada:**
```typescript
const frequencyData = [
  { name: 'Semanal', value: patients.filter(p => p.frequency === 'weekly').length },
  { name: 'Quinzenal', value: patients.filter(p => p.frequency === 'biweekly').length },
  { name: 'Mensal', value: patients.filter(p => p.frequency === 'monthly').length },
];
```

**Visualização:**
```tsx
<PieChart>
  <Pie data={frequencyData} dataKey="value" nameKey="name" />
  <Tooltip />
  <Legend />
</PieChart>
```

**Arquivo a Criar:**
- `src/components/charts/metrics/administrative/AdminFrequencyDistributionChart.tsx`

**5.2 - AdminAttendanceRateChart (2-3h)**

**Dados de Entrada:**
- `trends` com cálculo de taxa de comparecimento ao longo do tempo

**Lógica:**
```typescript
const attendanceData = trends.map(point => ({
  date: point.date,
  attendanceRate: (point.attendedCount / (point.attendedCount + point.missedCount)) * 100,
}));
```

**Visualização:**
```tsx
<LineChart data={attendanceData}>
  <Line dataKey="attendanceRate" stroke="hsl(var(--success))" />
  <XAxis dataKey="date" />
  <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
  <Tooltip />
  <ReferenceLine y={80} stroke="hsl(var(--warning))" strokeDasharray="3 3" label="Meta 80%" />
</LineChart>
```

**Arquivo a Criar:**
- `src/components/charts/metrics/administrative/AdminAttendanceRateChart.tsx`

**5.3 - AdminWeeklyOccupationChart (2-3h)**

**Dados de Entrada:**
- `trends` (agrupado por semana) + cálculo de taxa de ocupação

**Lógica:**
```typescript
const weeklyOccupation = calculateWeeklyOccupation(
  trends,
  profile,
  scheduleBlocks
);
```

**Visualização:**
```tsx
<BarChart data={weeklyOccupation}>
  <Bar dataKey="occupationRate" fill="hsl(var(--primary))" />
  <XAxis dataKey="weekLabel" />
  <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
  <Tooltip formatter={(val) => `${val.toFixed(1)}%`} />
  <ReferenceLine y={100} stroke="hsl(var(--destructive))" label="Capacidade Máxima" />
</BarChart>
```

**Arquivo a Criar:**
- `src/components/charts/metrics/administrative/AdminWeeklyOccupationChart.tsx`

**5.4 - AdminChurnRetentionChart (2-3h)**

**Dados de Entrada:**
- `retention.churnRate`
- `retention.retentionRate`
- Comparativo mensal

**Visualização:**
```tsx
<BarChart data={monthlyRetentionData}>
  <Bar dataKey="retentionRate" fill="hsl(var(--success))" name="Retenção" />
  <Bar dataKey="churnRate" fill="hsl(var(--destructive))" name="Churn" />
  <XAxis dataKey="month" />
  <YAxis domain={[0, 100]} />
  <Tooltip />
  <Legend />
</BarChart>
```

**Arquivo a Criar:**
- `src/components/charts/metrics/administrative/AdminChurnRetentionChart.tsx`

#### 🔌 Integração em Metrics.tsx

```tsx
const renderChartContent = () => {
  if (currentDomain === 'administrative') {
    switch (currentSubTab) {
      case 'distribuicoes':
        return (
          <>
            <AdminFrequencyDistributionChart
              patients={metricsPatients}
              periodFilter={periodFilter}
              timeScale={currentScale}
              isLoading={isLoading}
            />
            {/* Gráfico existente AdminDistributionsChart também aqui */}
          </>
        );
      
      case 'desempenho':
        return (
          <>
            <AdminAttendanceRateChart
              trends={trends}
              periodFilter={periodFilter}
              timeScale={currentScale}
              isLoading={isLoading}
            />
            <AdminWeeklyOccupationChart
              trends={trends}
              profile={metricsProfile}
              scheduleBlocks={metricsScheduleBlocks}
              periodFilter={periodFilter}
              timeScale={currentScale}
              isLoading={isLoading}
            />
          </>
        );
      
      case 'retencao':
        return (
          <>
            <AdminChurnRetentionChart
              retention={retention}
              periodFilter={periodFilter}
              timeScale={currentScale}
              isLoading={isLoading}
            />
            {/* Gráfico existente AdminRetentionChart também aqui */}
          </>
        );
      
      default:
        return null;
    }
  }
  // ...
};
```

#### ✅ Critérios de Aceite C3-R.5

- [ ] 4 novos componentes de gráfico criados
- [ ] Todos os gráficos renderizam com dados reais
- [ ] Estados de loading/empty implementados
- [ ] Gráficos respondem a mudanças de período
- [ ] Sub-abas `distribuicoes`, `desempenho`, `retencao` funcionam 100%
- [ ] Integração em `renderChartContent()` completa
- [ ] Documentação criada: `docs/track_c3_phase_c3_r5_administrative_charts.md`

#### 📚 Documentação Esperada
Arquivo: `docs/track_c3_phase_c3_r5_administrative_charts.md`

**Conteúdo Mínimo:**
- Lista dos 4 gráficos implementados
- Tipo de chart usado
- Dados de entrada
- Screenshots
- Como testar

---

### **FASE C3-R.6** - Completar Gráficos Faltantes - Team
**Prioridade:** 🟢 MÉDIA  
**Estimativa:** 8-12h  
**Dependências:** C3-R.5  
**Objetivo:** Implementar os 7 gráficos de métricas de equipe

#### 🎯 Problemas que Resolve
- ✅ **P3:** Parte dos 18 gráficos faltantes
- ✅ Domínio `team` completamente vazio

#### 📝 Gráficos a Implementar

Conforme `TRACK_C3_METRICAS_PLANO_FINAL.md` - Seção 3.4.4:

| Sub-Aba | Gráfico | Tipo | Arquivo | Status |
|---------|---------|------|---------|--------|
| **desempenho** | Performance Individual | BarChart | `TeamIndividualPerformanceChart.tsx` | ❌ Criar |
| **desempenho** | Comparativo de Receita | BarChart | `TeamRevenueComparisonChart.tsx` | ❌ Criar |
| **distribuicao** | Distribuição de Pacientes | PieChart | `TeamPatientDistributionChart.tsx` | ❌ Criar |
| **distribuicao** | Carga Horária | BarChart | `TeamWorkloadChart.tsx` | ❌ Criar |
| **tendencias** | Evolução Mensal da Equipe | LineChart | `TeamMonthlyEvolutionChart.tsx` | ❌ Criar |
| **tendencias** | Taxa de Ocupação por Membro | LineChart | `TeamOccupationByMemberChart.tsx` | ❌ Criar |
| **tendencias** | Comparecimento por Terapeuta | LineChart | `TeamAttendanceByTherapistChart.tsx` | ❌ Criar |

#### 📝 Escopo Detalhado

**IMPORTANTE:** Métricas de Team requerem dados de múltiplos usuários (terapeutas).

**Pré-requisito:** Validar se `systemMetricsUtils.ts` já possui funções para agregação por terapeuta:
- Se não, criar `getTeamMetrics(allPatients, allSessions, teamMembers)`

**6.1 - TeamIndividualPerformanceChart (1-2h)**

**Dados:**
```typescript
const teamPerformance = teamMembers.map(member => ({
  name: member.name,
  revenue: calculateRevenueForUser(member.id, sessions),
  sessionCount: sessions.filter(s => s.user_id === member.id).length,
}));
```

**Visualização:**
```tsx
<BarChart data={teamPerformance}>
  <Bar dataKey="revenue" fill="hsl(var(--chart-1))" />
  <Bar dataKey="sessionCount" fill="hsl(var(--chart-2))" />
  <XAxis dataKey="name" />
  <Tooltip />
  <Legend />
</BarChart>
```

**6.2 - TeamRevenueComparisonChart (1-2h)**

Similar ao anterior, focado apenas em receita.

**6.3 - TeamPatientDistributionChart (1-2h)**

**Dados:**
```typescript
const patientDistribution = teamMembers.map(member => ({
  name: member.name,
  value: patients.filter(p => p.user_id === member.id && p.status === 'active').length,
}));
```

**Visualização:**
```tsx
<PieChart>
  <Pie data={patientDistribution} dataKey="value" nameKey="name" />
</PieChart>
```

**6.4 - TeamWorkloadChart (1-2h)**

**Dados:**
```typescript
const workload = teamMembers.map(member => ({
  name: member.name,
  horasSemanais: calculateWeeklyHours(member.id, scheduleBlocks),
}));
```

**6.5 - TeamMonthlyEvolutionChart (1-2h)**

**Dados:**
Evolução da receita total da equipe ao longo dos meses.

**6.6 - TeamOccupationByMemberChart (1-2h)**

**Dados:**
Taxa de ocupação individual de cada terapeuta ao longo do tempo.

**6.7 - TeamAttendanceByTherapistChart (1-2h)**

**Dados:**
Taxa de comparecimento individual ao longo do tempo.

#### 🔌 Integração

**Arquivos a Criar:**
- 7 componentes em `src/components/charts/metrics/team/`

**Modificar:**
- `src/pages/Metrics.tsx` - adicionar lógica de `currentDomain === 'team'` em `renderChartContent()`

**Validar:**
- Permissões: apenas usuários com permissão de `team` devem ver esse domínio
- Dados: filtrar por organização do usuário

#### ✅ Critérios de Aceite C3-R.6

- [ ] 7 componentes de gráfico Team criados
- [ ] Gráficos usam dados reais de múltiplos terapeutas
- [ ] Filtro por organização funcionando
- [ ] Permissões validadas
- [ ] Sub-abas `desempenho`, `distribuicao`, `tendencias` funcionam
- [ ] Documentação criada: `docs/track_c3_phase_c3_r6_team_charts.md`

---

### **FASE C3-R.7** - Migração Completa de Financial.tsx
**Prioridade:** 🟢 MÉDIA  
**Estimativa:** 6-9h  
**Dependências:** C3-R.1, C3-R.4 (layout e gráficos financeiros)  
**Objetivo:** Deprecar completamente o código legado de `Financial.tsx`

#### 🎯 Problemas que Resolve
- ✅ **P5:** `Financial.tsx` ainda usa código antigo
- ✅ Duplicação de lógica entre `/metrics` e código legado

#### 📝 Escopo Detalhado

**7.1 - Auditoria de Financial.tsx (2-3h)**

**Ações:**
1. Abrir `src/pages/Financial.tsx`
2. Listar TODAS as funcionalidades únicas que ainda não foram migradas para `/metrics`
3. Identificar:
   - Cálculos específicos
   - Filtros únicos
   - Componentes visuais únicos
   - Lógica de negócio específica

**Criar Checklist:**
```markdown
## Funcionalidades em Financial.tsx

- [ ] Cálculo X
- [ ] Filtro Y
- [ ] Componente Z
- [ ] Lógica de W
- ...
```

**7.2 - Migrar Lógica Faltante (3-4h)**

**Para cada item do checklist:**

1. **Se já existe em `/metrics`:**
   - Marcar como ✅ (nada a fazer)

2. **Se não existe:**
   - Implementar em `systemMetricsUtils.ts` (se for cálculo)
   - Ou criar card/gráfico novo em `/metrics`
   - Ou adicionar filtro/controle no header de `/metrics`

**7.3 - Validação de Paridade 100% (1-2h)**

**Testes lado-a-lado:**
1. Acessar `/financial` (wrapper → `/metrics?domain=financial`)
2. Comparar visualmente com antiga versão de `Financial.tsx`
3. Validar que TODOS os dados batam:
   - Receita total
   - Previsões
   - Gráficos
   - Filtros

**7.4 - Deprecar Financial.tsx (opcional)**

**Opções:**

**A) Manter como referência (recomendado):**
```tsx
// src/pages/Financial.tsx
/**
 * @deprecated
 * Esta página foi migrada para /metrics?domain=financial
 * Mantida apenas como referência histórica.
 * Ver: TRACK_C3_CORRECOES_FASEAMENTO.md - FASE C3-R.7
 */
export function Financial() {
  // código original intacto
}
```

**B) Remover completamente:**
- Deletar `src/pages/Financial.tsx`
- Garantir que nenhum outro arquivo importa `Financial`
- Atualizar rotas (já feito em C3.8)

#### ✅ Critérios de Aceite C3-R.7

- [ ] Checklist completo de funcionalidades de `Financial.tsx`
- [ ] 100% das funcionalidades migradas ou confirmadas como desnecessárias
- [ ] Paridade visual e de dados validada
- [ ] `Financial.tsx` deprecado ou removido
- [ ] Zero regressões em `/metrics?domain=financial`
- [ ] Documentação criada: `docs/track_c3_phase_c3_r7_financial_migration.md`

---

### **FASE C3-R.8** - Registro Global de Cards
**Prioridade:** 🟢 MÉDIA  
**Estimativa:** 4-6h  
**Dependências:** C3-R.1 (layout funcionando)  
**Objetivo:** Criar registry único para todos os cards de métricas

#### 🎯 Problemas que Resolve
- ✅ **P6:** Cards não registrados globalmente
- ✅ Falta de sistema unificado para mapear ID → componente
- ✅ Impossibilidade de adicionar/remover cards dinamicamente

#### 📝 Escopo Detalhado

**8.1 - Criar metricsCardRegistry.tsx (2-3h)**

**Arquivo a Criar:** `src/lib/metricsCardRegistry.tsx`

**Estrutura:**
```tsx
import { MetricsRevenueTotalCard } from "@/components/cards/metrics/financial/MetricsRevenueTotalCard";
// ... imports de todos os 12 cards

import type { MetricsCardBaseProps, MockMetricsCardProps } from "@/types/metricsCardTypes";

export interface MetricsCardDefinition {
  id: string;
  title: string;
  description: string;
  domain: 'financial' | 'administrative' | 'marketing' | 'team';
  component: React.ComponentType<MetricsCardBaseProps | MockMetricsCardProps>;
  defaultLayout: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  requiredPermission?: string; // Ex: 'financial_access'
}

export const METRICS_CARD_REGISTRY: Record<string, MetricsCardDefinition> = {
  // FINANCIAL
  'metrics-revenue-total': {
    id: 'metrics-revenue-total',
    title: 'Receita Total',
    description: 'Receita total realizada no período',
    domain: 'financial',
    component: MetricsRevenueTotalCard,
    defaultLayout: { x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'financial_access',
  },
  'metrics-forecast-revenue': {
    id: 'metrics-forecast-revenue',
    title: 'Receita Prevista',
    description: 'Receita prevista com base em pacientes ativos',
    domain: 'financial',
    component: MetricsForecastRevenueCard,
    defaultLayout: { x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'financial_access',
  },
  // ... demais 10 cards
  
  // ADMINISTRATIVE
  'metrics-active-patients': { /* ... */ },
  'metrics-occupation-rate': { /* ... */ },
  'metrics-missed-rate': { /* ... */ },
  
  // MARKETING
  'metrics-website-visitors': { /* ... */ },
  'metrics-website-views': { /* ... */ },
  'metrics-website-ctr': { /* ... */ },
  'metrics-website-conversion': { /* ... */ },
};

// Helper: obter card por ID
export function getMetricsCardById(cardId: string): MetricsCardDefinition | undefined {
  return METRICS_CARD_REGISTRY[cardId];
}

// Helper: obter todos os cards de um domínio
export function getMetricsCardsByDomain(domain: string): MetricsCardDefinition[] {
  return Object.values(METRICS_CARD_REGISTRY).filter(card => card.domain === domain);
}

// Helper: verificar permissão do card
export function canUserViewCard(cardId: string, userPermissions: string[]): boolean {
  const card = getMetricsCardById(cardId);
  if (!card) return false;
  if (!card.requiredPermission) return true;
  return userPermissions.includes(card.requiredPermission);
}
```

**8.2 - Integrar Registry em Metrics.tsx (1-2h)**

**Modificar:** `src/pages/Metrics.tsx`

```tsx
import { getMetricsCardsByDomain, getMetricsCardById } from "@/lib/metricsCardRegistry";

// Dentro do componente
const currentDomainCards = getMetricsCardsByDomain(currentDomain);

const renderMetricCards = () => {
  return currentSectionLayout.map((cardLayout) => {
    const cardDef = getMetricsCardById(cardLayout.i);
    if (!cardDef) return null;

    const CardComponent = cardDef.component;

    return (
      <div key={cardLayout.i} data-grid={cardLayout}>
        <CardComponent
          periodFilter={periodFilter}
          summary={summary}
          isLoading={isLoading}
        />
      </div>
    );
  });
};
```

**8.3 - Adicionar UI de Gerenciamento de Cards (1h - opcional)**

**Funcionalidade:**
- Botão "+ Adicionar Card"
- Modal listando cards disponíveis (filtrados por domínio e permissão)
- Usuário seleciona e card é adicionado ao layout

**Implementação:**
```tsx
// Dialog com lista de cards
<Dialog>
  <DialogContent>
    <DialogTitle>Adicionar Card</DialogTitle>
    {currentDomainCards.map(cardDef => (
      <Button
        key={cardDef.id}
        onClick={() => addCard(`metrics-${currentDomain}`, cardDef.id)}
      >
        {cardDef.title}
      </Button>
    ))}
  </DialogContent>
</Dialog>
```

**Nota:** Esta UI é opcional para C3-R.8, pode ser adiada para refinamentos.

#### ✅ Critérios de Aceite C3-R.8

- [ ] `metricsCardRegistry.tsx` criado com todos os 12 cards
- [ ] Helpers `getMetricsCardById`, `getMetricsCardsByDomain`, `canUserViewCard` funcionando
- [ ] `Metrics.tsx` usa o registry para renderizar cards
- [ ] Permissões de cards validadas
- [ ] (Opcional) UI de adicionar cards implementada
- [ ] Documentação criada: `docs/track_c3_phase_c3_r8_card_registry.md`

---

### **FASE C3-R.9** - Refinamentos Finais
**Prioridade:** 🟢 BAIXA  
**Estimativa:** 4-6h  
**Dependências:** Todas as anteriores  
**Objetivo:** Polimento e limpeza

#### 🎯 Problemas que Resolve
- ✅ **P7:** Dropdown navbar desnecessário
- ✅ Código morto
- ✅ Otimizações de performance

#### 📝 Escopo Detalhado

**9.1 - Remover Dropdown da Navbar (1h)**

**Modificar:** `src/components/Navbar.tsx`

**Estado Atual (C3.8):**
```tsx
<NavigationMenuContent>
  <Link to="/metrics?domain=financial">Financeiro</Link>
  <Link to="/metrics?domain=administrative">Administrativo</Link>
  <Link to="/metrics?domain=marketing">Marketing</Link>
</NavigationMenuContent>
```

**Estado Desejado:**
```tsx
<NavigationMenuItem>
  <Link to="/metrics">Métricas</Link>
</NavigationMenuItem>
```

**Justificativa:**
- Dentro de `/metrics`, já há seletor de domínio no header
- Dropdown fragmenta navegação
- Simplificar é melhor

**9.2 - Limpar Código Morto (2-3h)**

**Buscar e remover/deprecar:**
- [ ] Imports não utilizados em `Metrics.tsx`
- [ ] Componentes órfãos (ex: `Financial.tsx` se não usado)
- [ ] Funções duplicadas entre `systemMetricsUtils.ts` e código antigo
- [ ] Comentários TODOs antigos resolvidos

**Ferramentas:**
```bash
# Encontrar imports não usados
npx knip

# Remover código morto
# Manualmente ou com ferramentas de refactor
```

**9.3 - Otimizar Performance (1-2h)**

**Ações:**
1. **Memoizar cálculos pesados:**
   ```tsx
   const summary = useMemo(
     () => getFinancialSummary(metricsPatients, metricsSessions),
     [metricsPatients, metricsSessions]
   );
   ```

2. **Lazy load de gráficos:**
   ```tsx
   const FinancialTrendsChart = lazy(() => import("@/components/charts/metrics/financial/FinancialTrendsChart"));
   ```

3. **Reduzir re-renders:**
   - Verificar se `renderMetricCards()` e `renderChartContent()` estão causando re-renders desnecessários
   - Usar `React.memo` em cards se necessário

**9.4 - Validar Responsividade (1h)**

**Testar em:**
- Desktop (1920x1080)
- Tablet (768px)
- Mobile (375px)

**Garantir:**
- Grid ajusta número de colunas
- Gráficos usam `ResponsiveContainer`
- Header de filtros empilha em mobile
- Tabs de sub-abas scrollam horizontalmente em mobile

#### ✅ Critérios de Aceite C3-R.9

- [ ] Dropdown navbar removido
- [ ] Zero código morto identificado
- [ ] Performance otimizada (< 2s para carregar página)
- [ ] Responsividade validada em 3 breakpoints
- [ ] Console sem warnings
- [ ] Documentação criada: `docs/track_c3_phase_c3_r9_refinements.md`

---

### **FASE C3-R.10** - QA Final e Documentação
**Prioridade:** 🟢 BAIXA  
**Estimativa:** 4-6h  
**Dependências:** Todas as anteriores  
**Objetivo:** Validação completa e documentação final

#### 🎯 Objetivo
- ✅ Garantir 100% de funcionalidade
- ✅ Documentar tudo para futuros desenvolvedores
- ✅ Criar guia de uso para usuários finais

#### 📝 Escopo Detalhado

**10.1 - Testes End-to-End (2-3h)**

**Cenários de Teste:**

| Cenário | Passos | Resultado Esperado |
|---------|--------|-------------------|
| Acesso inicial | 1. Login<br>2. Ir para `/metrics` | Redireciona para domínio padrão baseado em permissão |
| Filtro de período | 1. Selecionar "Semana"<br>2. Validar cards<br>3. Validar gráficos | Todos os dados refletem período selecionado |
| Período customizado | 1. Selecionar "Customizado"<br>2. Escolher datas<br>3. Aplicar | Cards e gráficos atualizam |
| Troca de domínio | 1. Clicar em "Financial"<br>2. Clicar em "Administrative" | URL atualiza, cards e gráficos mudam |
| Troca de sub-aba | 1. Em Financial, clicar em "Distribuições"<br>2. Clicar em "Tendências" | Gráficos corretos aparecem |
| Drag & Drop | 1. Ativar "Editar Layout"<br>2. Arrastar card<br>3. Salvar | Posição persiste após reload |
| Reset Layout | 1. Modificar layout<br>2. Clicar "Resetar"<br>3. Confirmar | Layout volta ao padrão |
| Redirect `/financial` | 1. Acessar `/financial` | Redireciona para `/metrics?domain=financial` |
| Redirect `/metrics/website` | 1. Acessar `/metrics/website` | Redireciona para `/metrics?domain=marketing&subTab=website` |
| Permissões | 1. Login como usuário sem `financial_access`<br>2. Ir para `/metrics` | Domínio `financial` não aparece |
| Responsividade | 1. Redimensionar para mobile<br>2. Validar layout | Grid adapta, gráficos responsivos |

**10.2 - Documentação Técnica (1-2h)**

**Criar:** `docs/TRACK_C3_METRICS_FINAL_GUIDE.md`

**Conteúdo:**
- Arquitetura completa de `/metrics`
- Fluxo de dados (queries → adapters → utils → cards/charts)
- Como adicionar novo card
- Como adicionar novo gráfico
- Como adicionar novo domínio
- Estrutura de pastas
- Dependências críticas
- Troubleshooting comum

**10.3 - Guia de Usuário (1h)**

**Criar:** `docs/USER_GUIDE_METRICS.md`

**Conteúdo:**
- O que é a página de Métricas
- Como usar filtros de período
- Como alternar entre domínios
- Como personalizar layout (drag & drop)
- Como interpretar cada card/gráfico
- FAQs

#### ✅ Critérios de Aceite C3-R.10

- [ ] 11 cenários de teste executados e passando
- [ ] Documentação técnica completa
- [ ] Guia de usuário criado
- [ ] Zero bugs conhecidos
- [ ] 100% de funcionalidade conforme `TRACK_C3_METRICAS_PLANO_FINAL.md`
- [ ] Documentação criada: `docs/track_c3_phase_c3_r10_qa_final.md`

---

## 📊 RESUMO DE ENTREGAS

Ao final das 10 fases:

| Entrega | Status Meta |
|---------|-------------|
| Sistema de layout drag & drop | ✅ 100% |
| Persistência de layout | ✅ 100% |
| 12 cards numéricos funcionando | ✅ 100% |
| 26 gráficos implementados | ✅ 100% |
| Testes unitários (30+ testes) | ✅ 100% |
| Migração `/financial` | ✅ 100% |
| Migração `/metrics/website` | ✅ 100% |
| Registry de cards | ✅ 100% |
| Código limpo e otimizado | ✅ 100% |
| Documentação completa | ✅ 100% |

**Total:** **100% de funcionalidade** conforme planejado.

---

## 📈 CRONOGRAMA ESTIMADO

| Fase | Estimativa | Acumulado |
|------|-----------|-----------|
| C3-R.1 | 6-9h | 6-9h |
| C3-R.2 | 4-6h | 10-15h |
| C3-R.3 | 6-9h | 16-24h |
| C3-R.4 | 12-17h | 28-41h |
| C3-R.5 | 8-12h | 36-53h |
| C3-R.6 | 8-12h | 44-65h |
| C3-R.7 | 6-9h | 50-74h |
| C3-R.8 | 4-6h | 54-80h |
| C3-R.9 | 4-6h | 58-86h |
| C3-R.10 | 4-6h | 62-92h |

**Estimativa Total:** **54-79h** de trabalho focado.

---

## 🎯 PRIORIZAÇÃO RECOMENDADA

### Sprint 1 (CRÍTICO - 16-24h)
- C3-R.1: Layout
- C3-R.2: Gráficos existentes
- C3-R.3: Testes unitários

**Meta:** Sistema funcional básico com drag & drop e gráficos visíveis.

### Sprint 2 (IMPORTANTE - 28-41h)
- C3-R.4: Gráficos Financial
- C3-R.5: Gráficos Administrative

**Meta:** Domínios principais completos.

### Sprint 3 (COMPLEMENTAR - 18-27h)
- C3-R.6: Gráficos Team
- C3-R.7: Migração Financial

**Meta:** Feature completa.

### Sprint 4 (POLIMENTO - 8-12h)
- C3-R.8: Registry
- C3-R.9: Refinamentos
- C3-R.10: QA

**Meta:** Produto 100% pronto.

---

## ✅ VALIDAÇÃO FINAL

Após completar as 10 fases, validar contra `TRACK_C3_METRICAS_PLANO_FINAL.md`:

- [ ] 3.1 - Extração de lógica ✅
- [ ] 3.2 - Infraestrutura de página ✅
- [ ] 3.3 - Sistema de seções/sub-abas ✅
- [ ] 3.4.1 - Gráficos Financial ✅
- [ ] 3.4.2 - Gráficos Administrative ✅
- [ ] 3.4.3 - Gráficos Marketing ✅
- [ ] 3.4.4 - Gráficos Team ✅
- [ ] 3.5 - Cards numéricos ✅
- [ ] 3.6 - Sistema de layout ✅
- [ ] 3.7 - Migrações legadas ✅

**Resultado Esperado:** ✅ **100% COMPLETO**

---

## 📝 CONCLUSÃO

Este faseamento garante:

1. **Progressividade:** Cada fase é independente e testável.
2. **Granularidade:** Fases pequenas (4-17h) para controle fino.
3. **Cobertura 100%:** Todos os 7 problemas da auditoria resolvidos.
4. **Documentação:** Cada fase gera documentação detalhada.
5. **Testabilidade:** Critérios de aceite claros em cada fase.

**Ao final, teremos a página `/metrics` 100% funcional, testada, documentada e pronta para produção.**

---

**FIM DO FASEAMENTO - TRACK C3 - CORREÇÕES**
