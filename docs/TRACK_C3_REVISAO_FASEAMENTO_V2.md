# 🔍 TRACK C3 — ANÁLISE DO PLANO DE FASEAMENTO REVISADO (V2)

**Data:** 2025-01-XX  
**Status:** ANÁLISE CRÍTICA PRÉ-IMPLEMENTAÇÃO  
**Objetivo:** Verificar se o novo plano de faseamento está adequado à realidade arquitetural e de permissões do sistema

---

## ✅ RESUMO EXECUTIVO

### Veredicto Geral: **APROVADO COM RESSALVAS MENORES**

O plano revisado corrige **TODOS os 5 blockers críticos** identificados na revisão anterior:

1. ✅ **Unificação de sistemas** - Agora usa `useDashboardLayout('metrics-grid')` e `dashboardCardRegistry.tsx` existentes
2. ✅ **Testes unitários** - Fase C3.1.5 dedicada exclusivamente a testes
3. ✅ **Feature flag** - C3.2 inclui `USE_NEW_METRICS` para rollback seguro
4. ✅ **Sem redirect direto** - C3.8 usa `FinancialLegacyWrapper` eliminando risco de loop
5. ✅ **Migração de layout** - C3.9 define critérios claros e período de convivência

### Pontos Fortes do Novo Plano

1. **Arquitetura coerente** - Reutiliza infraestrutura existente (layout, registry, sections)
2. **Segurança em primeiro lugar** - Feature flags, wrappers, critérios de migração
3. **Testabilidade** - Fase dedicada a testes unitários antes de integração
4. **Rollback fácil** - Múltiplos pontos de fallback em cada fase crítica
5. **Incremental e validável** - Cada fase entrega valor sem quebrar o anterior

---

## 📋 ANÁLISE FASE A FASE

### 🟦 FASE C3.1 — Extração cirúrgica ✅ **APROVADA**

**Compatibilidade arquitetural:** 10/10

**O que está correto:**
- ✅ Copiar lógica sem alterar comportamento (read-only de `Financial.tsx`)
- ✅ Tipos explícitos (`MetricsPatient`, `MetricsSession`, `DateRange`)
- ✅ Helpers isolados (frequency, date range, agrupamento)
- ✅ Todas as 14+ funções mapeadas

**Alinhamento com sistema atual:**
- ✅ Similar a `patientFinancialUtils.ts` (já existe e funciona bem)
- ✅ Formato de helpers condizente com `sessionUtils.ts`
- ✅ Uso de `date-fns` consistente com resto do sistema

**Riscos identificados:**
- ⚠️ **BAIXO** - Possível drift entre tipos exportados e tipos internos de `Financial.tsx`
  - **Mitigação:** Validar assinaturas antes de C3.2

**Arquivos tocados:**
- ✅ `src/lib/systemMetricsUtils.ts` (NOVO)
- ✅ `src/pages/Financial.tsx` (read-only)

**Dependências:**
- ✅ `date-fns` (já instalado)
- ✅ `date-fns-tz` (já instalado)

---

### 🟦 FASE C3.1.5 — Testes unitários ✅ **APROVADA - CRÍTICA**

**Importância:** 🔴 **BLOCKER** - Não pode pular esta fase

**O que está correto:**
- ✅ Fase dedicada exclusivamente a testes (não misturada com implementação)
- ✅ Cobertura mínima definida (revenue, missed rate, retention, lost revenue, occupation)
- ✅ Uso de dados fictícios inspirados nos reais

**Sugestões de melhoria:**

1. **Definir estrutura de dados de teste reutilizável:**
```typescript
// src/lib/__tests__/fixtures/metricsTestData.ts
export const mockPatients: MetricsPatient[] = [
  { id: '1', name: 'Paciente A', status: 'active', frequency: 'weekly', sessionValue: 200 },
  { id: '2', name: 'Paciente B', status: 'active', frequency: 'biweekly', sessionValue: 180 },
  // ...
];

export const mockSessions: MetricsSession[] = [
  { id: 's1', patientId: '1', date: '2025-01-10', status: 'completed', value: 200 },
  { id: 's2', patientId: '1', date: '2025-01-17', status: 'missed', value: 0 },
  // ...
];
```

2. **Cobrir casos extremos:**
   - Paciente com 0 sessões
   - Período sem dados
   - Todos os status possíveis (completed, missed, rescheduled, cancelled)
   - Período de 1 dia vs 1 ano

3. **Validar outputs vs Financial.tsx atual:**
   - Criar um script que roda os mesmos inputs em ambas implementações
   - Comparar saídas numericamente (delta < 0.01)

**Arquivos necessários:**
- ✅ `src/lib/__tests__/systemMetricsUtils.test.ts`
- 💡 `src/lib/__tests__/fixtures/metricsTestData.ts` (recomendado)
- 💡 `scripts/validate-metrics-parity.ts` (recomendado para CI)

**Critérios de aprovação desta fase:**
- ✅ Cobertura de código > 80% em `systemMetricsUtils.ts`
- ✅ Todos os testes passando
- ✅ Outputs validados contra `Financial.tsx` (manual ou script)

---

### 🟦 FASE C3.2 — Plugar Financial.tsx ✅ **APROVADA COM FEATURE FLAG**

**Compatibilidade arquitetural:** 9/10

**O que está correto:**
- ✅ Feature flag para rollback (`USE_NEW_METRICS`)
- ✅ Adaptadores para mapear dados existentes → tipos novos
- ✅ Uso de `useMemo` para performance
- ✅ Nenhuma mudança de layout (apenas lógica interna)

**Implementação sugerida do feature flag:**

```typescript
// Em Financial.tsx
const USE_NEW_METRICS = import.meta.env.VITE_USE_NEW_METRICS === 'true';

// Cálculos
const monthlyRevenue = useMemo(() => {
  if (USE_NEW_METRICS) {
    return getMonthlyRevenue({ 
      sessions: adaptedSessions, 
      patients: adaptedPatients, 
      start, 
      end 
    });
  } else {
    // lógica inline atual (mantida como fallback)
    return sessions.reduce(...); // código atual
  }
}, [sessions, patients, start, end, USE_NEW_METRICS]);
```

**Riscos identificados:**
- ⚠️ **MÉDIO** - Drift entre tipos de `Financial.tsx` (Supabase types) e `MetricsPatient/Session`
  - **Mitigação:** Adaptadores bem testados + validação manual de outputs
  
- ⚠️ **BAIXO** - Feature flag pode ser esquecida no código
  - **Mitigação:** Adicionar TODO comentado para remoção após C3.9

**Arquivos tocados:**
- ✅ `src/pages/Financial.tsx` (modificado)
- ✅ `src/lib/systemMetricsUtils.ts` (possíveis ajustes)
- ✅ `.env` (adicionar `VITE_USE_NEW_METRICS=false` por padrão)

**Critérios de validação:**
- ✅ Com flag OFF: comportamento idêntico ao atual
- ✅ Com flag ON: outputs numericamente iguais (delta < 0.01)
- ✅ Performance equivalente ou melhor (verificar useMemo)

---

### 🟦 FASE C3.3 — Fachada de métricas agregadas ✅ **APROVADA**

**Compatibilidade arquitetural:** 10/10

**O que está correto:**
- ✅ Interfaces explícitas e tipadas (`FinancialSummary`, `FinancialTrendPoint`)
- ✅ API de alto nível para consumo pelos cards
- ✅ Reutiliza funções "baixo nível" extraídas em C3.1
- ✅ Suporte a `timeScale` como parâmetro

**Estrutura sugerida:**

```typescript
// src/lib/systemMetricsUtils.ts

// ============================================================
// TIPOS PÚBLICOS (para consumo pelos cards)
// ============================================================

export interface FinancialSummary {
  totalRevenue: number;
  totalSessions: number;
  missedRate: number;
  avgPerSession: number;
  activePatients: number;
  lostRevenue: number;
  avgRevenuePerActivePatient: number;
}

export interface FinancialTrendPoint {
  label: string;   // "Jan/25" | "1ª/Jan" | "10/01"
  date: string;    // ISO date "2025-01-01"
  revenue: number;
  sessions: number;
  missedRate: number;
}

export interface RetentionSummary {
  newPatients: number;
  inactivePatients: number;
  retentionRate: number;
  churnRate: number;
}

// ============================================================
// API PÚBLICA (fachada)
// ============================================================

export function getFinancialSummary(params: {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
  start: Date;
  end: Date;
}): FinancialSummary {
  // Usa funções internas extraídas em C3.1
  return {
    totalRevenue: calculateTotalRevenue(params),
    totalSessions: getTotalSessions(params),
    missedRate: getMissedRate(params),
    // ...
  };
}

export function getFinancialTrends(params: {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
  start: Date;
  end: Date;
  timeScale: 'daily' | 'weekly' | 'monthly';
}): FinancialTrendPoint[] {
  // Gera intervalos baseado na escala
  const intervals = generateTimeIntervals(params.start, params.end, params.timeScale);
  
  return intervals.map(date => {
    const intervalSessions = filterSessionsByInterval(params.sessions, date, params.timeScale);
    return {
      label: formatTimeLabel(date, params.timeScale),
      date: date.toISOString(),
      revenue: calculateRevenue(intervalSessions),
      sessions: intervalSessions.length,
      missedRate: calculateMissedRate(intervalSessions),
    };
  });
}

export function getRetentionAndChurn(params: {
  patients: MetricsPatient[];
  start: Date;
  end: Date;
}): RetentionSummary {
  const { newPatients, inactivePatients } = getNewVsInactive(params);
  const retentionRate = getRetentionRate(params);
  
  return {
    newPatients,
    inactivePatients,
    retentionRate,
    churnRate: 100 - retentionRate,
  };
}
```

**Alinhamento com sistema atual:**
- ✅ Similar ao padrão de `patientFinancialUtils.ts` (interface pública + helpers privados)
- ✅ Compatível com `useChartTimeScale` (aceita 'daily' | 'weekly' | 'monthly')
- ✅ Formato de output pronto para Recharts (label + valores numéricos)

**Arquivos tocados:**
- ✅ `src/lib/systemMetricsUtils.ts` (extensão)
- ✅ `src/lib/__tests__/systemMetricsUtils.test.ts` (testes das novas funções)

---

### 🟦 FASE C3.4 — Esqueleto /metrics ✅ **APROVADA - ARQUITETURA PERFEITA**

**Compatibilidade arquitetural:** 10/10 🎯

**O que está PERFEITAMENTE correto:**
- ✅ Usa `useDashboardLayout('metrics-grid')` - **UNIFICAÇÃO CORRETA**
- ✅ Seções seguem padrão existente (metrics-financial, metrics-administrative, metrics-team)
- ✅ Integração com `useEffectivePermissions` e `useDashboardPermissions`
- ✅ Usa `useChartTimeScale` para gerenciar escalas de tempo
- ✅ Filtros de período (week, month, year, custom) - consistente com DashboardExample
- ✅ Placeholders iniciais para validar infraestrutura antes dos cards reais

**Estrutura sugerida de Metrics.tsx:**

```typescript
// src/pages/Metrics.tsx
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { useEffectivePermissions } from "@/hooks/useEffectivePermissions";
import { useDashboardPermissions } from "@/hooks/useDashboardPermissions";
import { useChartTimeScale } from "@/hooks/useChartTimeScale";
import { GridCardContainer } from "@/components/GridCardContainer";
import { ResizableSection } from "@/components/ResizableSection";
import { renderDashboardCard } from "@/lib/dashboardCardRegistry";

export default function Metrics() {
  // Permissions
  const { permissions } = useEffectivePermissions();
  const { canViewCard } = useDashboardPermissions();
  
  // Layout (usando tipo específico 'metrics-grid')
  const {
    layout,
    loading: layoutLoading,
    updateLayout,
    saveLayout,
    resetLayout,
    isModified,
  } = useDashboardLayout('metrics-grid');
  
  // Period filters
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'custom'>('month');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
  
  // Time scale management
  const {
    automaticScale,
    getScale,
    setScaleOverride,
    clearOverride,
    hasOverride,
  } = useChartTimeScale({ 
    startDate: dateRange.start, 
    endDate: dateRange.end 
  });
  
  // Data loading (sessions, patients)
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions', organizationId, dateRange.start, dateRange.end],
    queryFn: () => fetchSessions(...),
  });
  
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['patients', organizationId],
    queryFn: () => fetchPatients(...),
  });
  
  // Aggregated data (calculado uma vez)
  const aggregatedData = useMemo(() => {
    if (!sessions || !patients) return null;
    
    return {
      financialSummary: getFinancialSummary({ sessions, patients, ...dateRange }),
      financialTrends: getFinancialTrends({ sessions, patients, ...dateRange, timeScale: automaticScale }),
      retentionSummary: getRetentionAndChurn({ patients, ...dateRange }),
    };
  }, [sessions, patients, dateRange.start, dateRange.end, automaticScale]);
  
  // Render
  return (
    <div className="space-y-6">
      {/* Header com filtros de período */}
      <MetricsHeader 
        period={period} 
        onPeriodChange={setPeriod}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />
      
      {/* Seções colapsáveis */}
      <ResizableSection
        sectionId="metrics-financial"
        title="Métricas Financeiras"
        defaultCollapsed={false}
      >
        <GridCardContainer
          sectionId="metrics-financial"
          layout={layout['metrics-financial'] || []}
          onLayoutChange={(newLayout) => updateLayout('metrics-financial', newLayout)}
          renderCard={(cardId) => {
            if (!canViewCard(cardId, permissions)) return null;
            
            return renderDashboardCard(cardId, {
              // Passar dados agregados
              financialSummary: aggregatedData?.financialSummary,
              financialTrends: aggregatedData?.financialTrends,
              // Time scale controls
              timeScale: getScale(cardId),
              automaticScale,
              onTimeScaleChange: (scale) => setScaleOverride(cardId, scale),
              hasOverride: hasOverride(cardId),
              onResetTimeScale: () => clearOverride(cardId),
              // Raw data (se card precisar calcular algo específico)
              sessions,
              patients,
              start: dateRange.start,
              end: dateRange.end,
            });
          }}
        />
      </ResizableSection>
      
      {/* Repetir para metrics-administrative e metrics-team */}
    </div>
  );
}
```

**Validação de compatibilidade:**
- ✅ `useDashboardLayout` já suporta `layoutType` como parâmetro
- ✅ `GridCardContainer` + `ResizableSection` já existem e funcionam
- ✅ `useChartTimeScale` já existe e é usado no DashboardExample
- ✅ `renderDashboardCard` já existe (será estendido em C3.6)

**Arquivos tocados:**
- ✅ `src/pages/Metrics.tsx` (NOVO)
- ✅ `src/hooks/useDashboardLayout.ts` (verificar se suporta layoutType - já suporta ✅)
- 💡 `src/components/MetricsHeader.tsx` (NOVO - header com filtros)

**Critérios de validação:**
- ✅ Página abre sem erros
- ✅ Layout grid funciona (drag, drop, resize)
- ✅ Seções colapsam/expandem
- ✅ Filtros de período mudam dateRange
- ✅ Permissões carregam corretamente
- ✅ Placeholders renderizam (divs com borda + texto)

---

### 🟦 FASE C3.5 — Seções e metadados ✅ **APROVADA - REGISTRO CORRETO**

**Compatibilidade arquitetural:** 10/10 🎯

**O que está PERFEITAMENTE correto:**
- ✅ Adiciona `METRICS_SECTIONS` em arquivo existente (não cria novo)
- ✅ Estende `cardTypes.ts` com novos `cardIds` (prefixo `metrics-`)
- ✅ Usa `permissionConfig` existente (domain, requiresFinancialAccess, blockedFor)

**Estrutura sugerida:**

```typescript
// src/lib/defaultSectionsDashboard.ts (ou similar)

// Manter DASHBOARD_SECTIONS existentes...

export const METRICS_SECTIONS: Record<string, DashboardSection> = {
  'metrics-financial': {
    id: 'metrics-financial',
    title: 'Financeiro',
    icon: 'DollarSign',
    availableCardIds: [
      'metrics-summary-financial',
      'metrics-summary-lost-revenue',
      'metrics-chart-monthly-revenue',
      'metrics-chart-missed-rate',
      'metrics-chart-lost-revenue-by-month',
      'metrics-chart-occupation-rate',
      'metrics-chart-ticket-comparison',
      'metrics-chart-growth-trend',
    ],
    defaultLayout: [
      { i: 'metrics-summary-financial', x: 0, y: 0, w: 12, h: 3 },
      { i: 'metrics-chart-monthly-revenue', x: 0, y: 3, w: 6, h: 5 },
      { i: 'metrics-chart-missed-rate', x: 6, y: 3, w: 6, h: 5 },
      // ...
    ],
  },
  
  'metrics-administrative': {
    id: 'metrics-administrative',
    title: 'Administrativo',
    icon: 'FileText',
    availableCardIds: [
      'metrics-summary-administrative',
      'metrics-chart-session-distribution',
      'metrics-chart-patient-status',
    ],
    defaultLayout: [
      // ...
    ],
  },
  
  'metrics-team': {
    id: 'metrics-team',
    title: 'Equipe',
    icon: 'Users',
    availableCardIds: [
      'metrics-summary-team',
      'metrics-chart-therapist-performance',
      'metrics-chart-team-revenue',
    ],
    defaultLayout: [
      // ...
    ],
  },
};

// Helper para Metrics.tsx
export function getMetricsSections() {
  return METRICS_SECTIONS;
}
```

```typescript
// src/types/cardTypes.ts (extensão)

export const cardConfigs: Record<CardId, CardConfig> = {
  // ... cards existentes ...
  
  // ============================================================
  // METRICS CARDS - FINANCIAL
  // ============================================================
  
  'metrics-summary-financial': {
    id: 'metrics-summary-financial',
    name: 'Resumo Financeiro',
    description: 'Visão geral de receita, sessões e taxa de falta',
    category: 'metrics',
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
      blockedFor: [],
    },
    defaultSize: { w: 12, h: 3 },
  },
  
  'metrics-summary-lost-revenue': {
    id: 'metrics-summary-lost-revenue',
    name: 'Receita Perdida',
    description: 'Valor perdido por faltas e cancelamentos',
    category: 'metrics',
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
      blockedFor: [],
    },
    defaultSize: { w: 6, h: 3 },
  },
  
  'metrics-chart-monthly-revenue': {
    id: 'metrics-chart-monthly-revenue',
    name: 'Receita Mensal',
    description: 'Evolução da receita ao longo do tempo',
    category: 'metrics',
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
      blockedFor: [],
    },
    defaultSize: { w: 6, h: 5 },
  },
  
  // ... mais cards financeiros ...
  
  // ============================================================
  // METRICS CARDS - ADMINISTRATIVE
  // ============================================================
  
  'metrics-summary-administrative': {
    id: 'metrics-summary-administrative',
    name: 'Resumo Administrativo',
    description: 'Pacientes ativos, agendamentos e taxa de ocupação',
    category: 'metrics',
    permissionConfig: {
      domain: 'administrative',
      requiresFinancialAccess: false,
      blockedFor: [],
    },
    defaultSize: { w: 12, h: 3 },
  },
  
  // ============================================================
  // METRICS CARDS - TEAM
  // ============================================================
  
  'metrics-summary-team': {
    id: 'metrics-summary-team',
    name: 'Resumo de Equipe',
    description: 'Performance e métricas da equipe',
    category: 'metrics',
    permissionConfig: {
      domain: 'team',
      requiresFinancialAccess: false,
      blockedFor: ['subordinate'], // Subordinados não veem métricas de equipe
    },
    defaultSize: { w: 12, h: 3 },
  },
  
  // ... mais cards de equipe ...
};
```

**Mapeamento Financial.tsx → Metrics cards:**

| Card Antigo (Financial.tsx) | Novo Card ID (Metrics) | Tipo |
|------------------------------|------------------------|------|
| Total Revenue + KPIs | `metrics-summary-financial` | Numérico |
| Monthly Revenue Chart | `metrics-chart-monthly-revenue` | Gráfico |
| Missed Sessions Chart | `metrics-chart-missed-rate` | Gráfico |
| Lost Revenue by Month | `metrics-chart-lost-revenue-by-month` | Gráfico |
| Occupation Rate | `metrics-chart-occupation-rate` | Gráfico |
| Ticket Comparison | `metrics-chart-ticket-comparison` | Gráfico |
| Growth Trend | `metrics-chart-growth-trend` | Gráfico |
| New vs Inactive | `metrics-chart-new-vs-inactive` | Gráfico |
| Retention Rate | `metrics-chart-retention` | Gráfico |

**Arquivos tocados:**
- ✅ `src/lib/defaultSectionsDashboard.ts` (adicionar METRICS_SECTIONS)
- ✅ `src/types/cardTypes.ts` (adicionar ~15-20 novos cardIds)
- 💡 `src/types/sectionTypes.ts` (se necessário estender DashboardSection)

**Validação:**
- ✅ Nenhum cardId duplicado
- ✅ Todos os cardIds em `availableCardIds` têm entrada em `cardConfigs`
- ✅ Permissões corretas (financial, administrative, team)
- ✅ Default layouts fazem sentido (posições não sobrepostas)

---

### 🟦 FASE C3.6 — Primeiros cards KPI ✅ **APROVADA - UNIFICAÇÃO PERFEITA**

**Compatibilidade arquitetural:** 10/10 🎯

**O que está PERFEITAMENTE correto:**
- ✅ Reutiliza `dashboardCardRegistry.tsx` existente (não cria novo registry)
- ✅ Estende `CardProps` interface para incluir dados agregados
- ✅ Cards usam agregados pré-calculados (não recalculam nada)
- ✅ Formato consistente com cards existentes

**Estrutura sugerida:**

```typescript
// src/lib/dashboardCardRegistry.tsx (estendido)

// ============================================================
// ESTENDER CARDPROPS INTERFACE
// ============================================================

interface CardProps {
  // Props existentes (manter)
  isEditMode?: boolean;
  className?: string;
  
  // Dados brutos (para cards que precisam)
  patients?: Patient[];
  sessions?: Session[];
  start?: Date;
  end?: Date;
  
  // ============================================================
  // NOVOS: Agregados pré-calculados (para cards de métricas)
  // ============================================================
  financialSummary?: FinancialSummary;
  financialTrends?: FinancialTrendPoint[];
  retentionSummary?: RetentionSummary;
  
  // Time scale controls (já existente no sistema)
  timeScale?: TimeScale;
  automaticScale?: TimeScale;
  onTimeScaleChange?: (scale: TimeScale) => void;
  hasOverride?: boolean;
  onResetTimeScale?: () => void;
}

// ============================================================
// NOVOS CARDS DE MÉTRICAS (numéricos primeiro)
// ============================================================

const MetricsSummaryFinancial = ({ financialSummary }: CardProps) => {
  if (!financialSummary) {
    return <CardSkeleton />;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo Financeiro</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Receita Total"
            value={formatCurrency(financialSummary.totalRevenue)}
            icon={<DollarSign />}
          />
          <MetricCard
            label="Total de Sessões"
            value={financialSummary.totalSessions}
            icon={<Calendar />}
          />
          <MetricCard
            label="Taxa de Falta"
            value={`${financialSummary.missedRate.toFixed(1)}%`}
            icon={<AlertCircle />}
            variant={financialSummary.missedRate > 15 ? 'danger' : 'default'}
          />
          <MetricCard
            label="Ticket Médio"
            value={formatCurrency(financialSummary.avgPerSession)}
            icon={<TrendingUp />}
          />
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Pacientes Ativos"
            value={financialSummary.activePatients}
            icon={<Users />}
          />
          <MetricCard
            label="Receita Perdida"
            value={formatCurrency(financialSummary.lostRevenue)}
            icon={<XCircle />}
            variant="danger"
          />
        </div>
      </CardContent>
    </Card>
  );
};

const MetricsSummaryLostRevenue = ({ financialSummary }: CardProps) => {
  if (!financialSummary) return <CardSkeleton />;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita Perdida</CardTitle>
        <CardDescription>
          Valor total perdido por faltas e cancelamentos no período
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-destructive">
          {formatCurrency(financialSummary.lostRevenue)}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Representa {((financialSummary.lostRevenue / (financialSummary.totalRevenue + financialSummary.lostRevenue)) * 100).toFixed(1)}% 
          da receita potencial
        </p>
      </CardContent>
    </Card>
  );
};

const MetricsSummaryRetention = ({ retentionSummary }: CardProps) => {
  if (!retentionSummary) return <CardSkeleton />;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Retenção de Pacientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Taxa de Retenção"
            value={`${retentionSummary.retentionRate.toFixed(1)}%`}
            icon={<UserCheck />}
            variant={retentionSummary.retentionRate > 80 ? 'success' : 'warning'}
          />
          <MetricCard
            label="Taxa de Churn"
            value={`${retentionSummary.churnRate.toFixed(1)}%`}
            icon={<UserX />}
            variant={retentionSummary.churnRate < 20 ? 'default' : 'danger'}
          />
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Novos Pacientes"
            value={retentionSummary.newPatients}
            icon={<UserPlus />}
          />
          <MetricCard
            label="Pacientes Inativos"
            value={retentionSummary.inactivePatients}
            icon={<UserMinus />}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================
// ESTENDER SWITCH DO REGISTRY
// ============================================================

export const renderDashboardCard = (cardId: CardId, props: CardProps): React.ReactNode => {
  switch (cardId) {
    // ... casos existentes ...
    
    // NOVOS: Metrics Cards
    case 'metrics-summary-financial':
      return <MetricsSummaryFinancial {...props} />;
      
    case 'metrics-summary-lost-revenue':
      return <MetricsSummaryLostRevenue {...props} />;
      
    case 'metrics-summary-retention':
      return <MetricsSummaryRetention {...props} />;
    
    // ... mais cards virão em C3.7 ...
    
    default:
      return <UnknownCard cardId={cardId} />;
  }
};
```

**Componente auxiliar sugerido:**

```typescript
// src/components/MetricCard.tsx (NOVO - reutilizável)
interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const MetricCard = ({ label, value, icon, variant = 'default' }: MetricCardProps) => {
  return (
    <div className={cn("space-y-2", variantStyles[variant])}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};
```

**Integração em Metrics.tsx:**

```typescript
// src/pages/Metrics.tsx
const aggregatedData = useMemo(() => {
  if (!sessions || !patients) return null;
  
  return {
    financialSummary: getFinancialSummary({ sessions, patients, ...dateRange }),
    retentionSummary: getRetentionAndChurn({ patients, ...dateRange }),
  };
}, [sessions, patients, dateRange.start, dateRange.end]);

// Passar para GridCardContainer
<GridCardContainer
  sectionId="metrics-financial"
  layout={layout['metrics-financial'] || []}
  onLayoutChange={(newLayout) => updateLayout('metrics-financial', newLayout)}
  renderCard={(cardId) => {
    if (!canViewCard(cardId, permissions)) return null;
    
    return renderDashboardCard(cardId, {
      financialSummary: aggregatedData?.financialSummary,
      retentionSummary: aggregatedData?.retentionSummary,
      // ... outros props ...
    });
  }}
/>
```

**Arquivos tocados:**
- ✅ `src/lib/dashboardCardRegistry.tsx` (estender)
- ✅ `src/pages/Metrics.tsx` (passar dados agregados)
- 💡 `src/components/MetricCard.tsx` (NOVO - componente auxiliar)

**Resultado esperado:**
- ✅ `/metrics` mostra KPIs numéricos reais
- ✅ Valores vêm de `systemMetricsUtils` (validados em C3.1.5)
- ✅ Layout drag&drop funciona
- ✅ Permissões respeitadas (`canViewCard`)

---

### 🟦 FASE C3.7 — Cards de gráficos ✅ **APROVADA COM PADRÃO CONSISTENTE**

**Compatibilidade arquitetural:** 10/10 🎯

**O que está correto:**
- ✅ Mesmo padrão dos cards numéricos de C3.6
- ✅ Uso de `useChartTimeScale` via props
- ✅ Dados vêm de agregados pré-calculados
- ✅ Componente `TimeScaleSelector` reutilizável

**Estrutura sugerida:**

```typescript
// src/components/TimeScaleSelector.tsx (NOVO - reutilizável)
interface TimeScaleSelectorProps {
  currentScale: TimeScale;
  automaticScale: TimeScale;
  hasOverride: boolean;
  onScaleChange: (scale: TimeScale) => void;
  onReset: () => void;
}

export const TimeScaleSelector = ({
  currentScale,
  automaticScale,
  hasOverride,
  onScaleChange,
  onReset,
}: TimeScaleSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <ToggleGroup type="single" value={currentScale} onValueChange={onScaleChange}>
        <ToggleGroupItem value="daily" size="sm">
          Diário
        </ToggleGroupItem>
        <ToggleGroupItem value="weekly" size="sm">
          Semanal
        </ToggleGroupItem>
        <ToggleGroupItem value="monthly" size="sm">
          Mensal
        </ToggleGroupItem>
      </ToggleGroup>
      
      {hasOverride && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Reset (Auto: {getScaleLabel(automaticScale)})
        </Button>
      )}
    </div>
  );
};
```

```typescript
// src/lib/dashboardCardRegistry.tsx (adicionar cards de gráfico)

const MetricsChartMonthlyRevenue = ({
  financialTrends,
  timeScale,
  automaticScale,
  onTimeScaleChange,
  hasOverride,
  onResetTimeScale,
}: CardProps) => {
  if (!financialTrends || financialTrends.length === 0) {
    return <CardSkeleton />;
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Evolução da receita ao longo do tempo</CardDescription>
          </div>
          <TimeScaleSelector
            currentScale={timeScale || automaticScale || 'monthly'}
            automaticScale={automaticScale || 'monthly'}
            hasOverride={hasOverride || false}
            onScaleChange={(scale) => onTimeScaleChange?.(scale as TimeScale)}
            onReset={() => onResetTimeScale?.()}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={financialTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Período: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Receita"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const MetricsChartMissedRate = ({
  financialTrends,
  timeScale,
  automaticScale,
  onTimeScaleChange,
  hasOverride,
  onResetTimeScale,
}: CardProps) => {
  if (!financialTrends) return <CardSkeleton />;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Taxa de Falta</CardTitle>
            <CardDescription>Percentual de sessões perdidas por período</CardDescription>
          </div>
          <TimeScaleSelector
            currentScale={timeScale || automaticScale || 'monthly'}
            automaticScale={automaticScale || 'monthly'}
            hasOverride={hasOverride || false}
            onScaleChange={(scale) => onTimeScaleChange?.(scale as TimeScale)}
            onReset={() => onResetTimeScale?.()}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={financialTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(1)}%`}
              labelFormatter={(label) => `Período: ${label}`}
            />
            <Bar 
              dataKey="missedRate" 
              fill="hsl(var(--destructive))" 
              name="Taxa de Falta (%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Adicionar ao switch
export const renderDashboardCard = (cardId: CardId, props: CardProps): React.ReactNode => {
  switch (cardId) {
    // ... casos existentes + C3.6 ...
    
    case 'metrics-chart-monthly-revenue':
      return <MetricsChartMonthlyRevenue {...props} />;
      
    case 'metrics-chart-missed-rate':
      return <MetricsChartMissedRate {...props} />;
    
    // ... implementar resto dos gráficos ...
    
    default:
      return <UnknownCard cardId={cardId} />;
  }
};
```

**Integração em Metrics.tsx:**

```typescript
// Calcular trends com escala atual
const aggregatedData = useMemo(() => {
  if (!sessions || !patients) return null;
  
  return {
    financialSummary: getFinancialSummary({ sessions, patients, ...dateRange }),
    financialTrends: getFinancialTrends({ 
      sessions, 
      patients, 
      ...dateRange, 
      timeScale: automaticScale  // Usa escala automática ou override
    }),
    retentionSummary: getRetentionAndChurn({ patients, ...dateRange }),
  };
}, [sessions, patients, dateRange.start, dateRange.end, automaticScale]);

// Passar controles de escala para cards
renderCard={(cardId) => {
  if (!canViewCard(cardId, permissions)) return null;
  
  return renderDashboardCard(cardId, {
    financialSummary: aggregatedData?.financialSummary,
    financialTrends: aggregatedData?.financialTrends,
    retentionSummary: aggregatedData?.retentionSummary,
    
    // Time scale controls
    timeScale: getScale(cardId),
    automaticScale,
    onTimeScaleChange: (scale) => setScaleOverride(cardId, scale),
    hasOverride: hasOverride(cardId),
    onResetTimeScale: () => clearOverride(cardId),
  });
}}
```

**Lista completa de gráficos a implementar:**

1. ✅ `metrics-chart-monthly-revenue` - Linha (receita por período)
2. ✅ `metrics-chart-missed-rate` - Barra (taxa de falta por período)
3. 🔲 `metrics-chart-lost-revenue-by-month` - Barra (receita perdida)
4. 🔲 `metrics-chart-occupation-rate` - Linha (taxa de ocupação)
5. 🔲 `metrics-chart-ticket-comparison` - Linha dupla (ticket médio vs esperado)
6. 🔲 `metrics-chart-growth-trend` - Linha (crescimento mês a mês)
7. 🔲 `metrics-chart-new-vs-inactive` - Barra agrupada (novos vs inativos)
8. 🔲 `metrics-chart-retention` - Gauge ou pie (taxa de retenção)

**Arquivos tocados:**
- ✅ `src/lib/dashboardCardRegistry.tsx` (adicionar 8 cards de gráfico)
- ✅ `src/components/TimeScaleSelector.tsx` (NOVO)
- ✅ `src/pages/Metrics.tsx` (passar controles de escala)
- ✅ `src/lib/systemMetricsUtils.ts` (garantir outputs prontos para gráficos)

**Resultado esperado:**
- ✅ Gráficos renderizam com dados reais
- ✅ Time scale selector funciona (diário/semanal/mensal)
- ✅ Override de escala por card funciona
- ✅ Reset volta para escala automática
- ✅ Gráficos são visualmente consistentes

---

### 🟦 FASE C3.8 — Convivência /financial vs /metrics ✅ **APROVADA - SEM RISCO DE LOOP**

**Compatibilidade arquitetural:** 10/10 🎯

**O que está PERFEITAMENTE correto:**
- ✅ Usa `FinancialLegacyWrapper` em vez de redirect direto - **ELIMINA RISCO DE LOOP**
- ✅ Mantém `/financial` e `/metrics` convivendo
- ✅ Permite teste em produção sem quebrar nada
- ✅ Usuários escolhem quando migrar

**Estrutura sugerida:**

```typescript
// src/pages/FinancialLegacyWrapper.tsx (NOVO)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, ArrowRight } from 'lucide-react';
import Financial from './Financial';

export default function FinancialLegacyWrapper() {
  const navigate = useNavigate();
  const [showLegacy, setShowLegacy] = useState(false);
  
  if (showLegacy) {
    // Renderiza página antiga abaixo do alerta
    return (
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Nova Página de Métricas Disponível</AlertTitle>
          <AlertDescription>
            Você está usando a versão antiga da página financeira. 
            Uma nova versão com mais recursos está disponível.
          </AlertDescription>
          <div className="mt-4">
            <Button onClick={() => navigate('/metrics?tab=financial')}>
              Ir para Nova Página <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Alert>
        
        <Financial />
      </div>
    );
  }
  
  // Tela de escolha inicial
  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <Alert className="border-2">
        <Info className="h-5 w-5" />
        <AlertTitle className="text-lg">Nova Página de Métricas</AlertTitle>
        <AlertDescription className="mt-2 space-y-4">
          <p>
            Temos uma nova página de métricas com recursos aprimorados:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Layout personalizável (drag & drop)</li>
            <li>Escalas de tempo automáticas (diário/semanal/mensal)</li>
            <li>Mais métricas e gráficos</li>
            <li>Performance otimizada</li>
          </ul>
          
          <div className="flex gap-4 mt-6">
            <Button 
              onClick={() => navigate('/metrics?tab=financial')}
              size="lg"
            >
              Ir para Nova Página <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              onClick={() => setShowLegacy(true)}
              variant="outline"
              size="lg"
            >
              Continuar na Versão Antiga
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

```typescript
// src/App.tsx (rotas)
import FinancialLegacyWrapper from './pages/FinancialLegacyWrapper';
import Metrics from './pages/Metrics';

// Dentro de <Routes>
<Route path="/metrics" element={<Metrics />} />
<Route path="/financial" element={<FinancialLegacyWrapper />} />
```

**Telemetria opcional (recomendado):**

```typescript
// Em FinancialLegacyWrapper.tsx
useEffect(() => {
  // Log de acesso à página legada
  console.log('[METRICS MIGRATION] User accessed /financial legacy wrapper');
  
  // Opcional: enviar para analytics
  // analytics.track('legacy_financial_page_accessed');
}, []);

// Em Metrics.tsx
useEffect(() => {
  console.log('[METRICS MIGRATION] User accessed /metrics');
  
  // Opcional: enviar para analytics
  // analytics.track('new_metrics_page_accessed');
}, []);
```

**Por que este approach é seguro:**

1. ✅ **Sem redirect automático** - usuário escolhe
2. ✅ **Sem loop infinito** - `/financial` renderiza componente, não redireciona
3. ✅ **Rollback trivial** - basta mudar rota de volta se algo der errado
4. ✅ **Dados de adoção** - telemetria mostra quantos usam cada versão
5. ✅ **Educação do usuário** - alerta explica benefícios da nova versão

**Arquivos tocados:**
- ✅ `src/pages/FinancialLegacyWrapper.tsx` (NOVO)
- ✅ `src/App.tsx` (adicionar rota /metrics, manter /financial)
- 💡 `src/pages/Financial.tsx` (opcional: adicionar telemetria)
- 💡 `src/pages/Metrics.tsx` (opcional: adicionar telemetria)

**Validação:**
- ✅ `/financial` abre wrapper sem erros
- ✅ Botão "Nova página" vai para `/metrics`
- ✅ Botão "Versão antiga" renderiza `Financial.tsx`
- ✅ Não há redirect loop
- ✅ Usuários conseguem usar ambas versões

---

### 🟦 FASE C3.9 — Desligar legado ✅ **APROVADA - CRITÉRIOS CLAROS**

**Compatibilidade arquitetural:** 10/10 🎯

**O que está PERFEITAMENTE correto:**
- ✅ Critérios objetivos antes de desligar
- ✅ Período de convivência mínimo (2 semanas)
- ✅ Validação de outputs entre versões
- ✅ Rota de emergência comentada (hibernação)
- ✅ Cleanup gradual

**Checklist de pré-requisitos (TODOS devem ser ✅):**

#### Critério 1: Tempo de convivência
- [ ] Pelo menos **2 semanas** desde deploy de C3.8
- [ ] Sem bugs críticos reportados em `/metrics`
- [ ] Sem regressões de performance

#### Critério 2: Paridade de dados
- [ ] Comparação manual de 5+ métricas chave entre `/financial` e `/metrics`:
  - Total Revenue (delta < R$ 0.01)
  - Total Sessions (exato)
  - Missed Rate (delta < 0.01%)
  - Active Patients (exato)
  - Lost Revenue (delta < R$ 0.01)

#### Critério 3: Adoção
- [ ] Telemetria mostra uso majoritário de `/metrics`
- [ ] Nenhum usuário crítico (admin/owner) bloqueado

#### Critério 4: Feedback
- [ ] Nenhum feedback negativo crítico sobre `/metrics`
- [ ] Usuários aprovam nova interface

**Implementação quando critérios forem atingidos:**

```typescript
// src/App.tsx (DEPOIS de validação)

// ANTES (C3.8):
<Route path="/financial" element={<FinancialLegacyWrapper />} />

// DEPOIS (C3.9):
<Route 
  path="/financial" 
  element={<Navigate to="/metrics?tab=financial" replace />} 
/>

// Rota de emergência (comentada, pronta para reativar se necessário)
// <Route path="/financial-legacy" element={<FinancialLegacyWrapper />} />
```

**Plano de cleanup gradual:**

```typescript
// IMEDIATAMENTE após C3.9:
// 1. Redirect /financial → /metrics ✅
// 2. Comentar rota de emergência ✅
// 3. Manter arquivos Financial.tsx e FinancialLegacyWrapper.tsx

// APÓS 1 SEMANA sem incidentes:
// 4. Remover FinancialLegacyWrapper.tsx
// 5. Mover Financial.tsx para /src/pages/_legacy/Financial.tsx.bak

// APÓS 1 MÊS sem incidentes:
// 6. Deletar /src/pages/_legacy/

// 7. Remover DashboardOLD.tsx (se ainda existir)

// 8. Avaliar remoção de WebsiteMetrics.tsx (decisão separada - Track Marketing)
```

**Migração de dados de layout:**

```typescript
// Script one-time para migrar layouts salvos (opcional)
// scripts/migrate-financial-layouts.ts

import { supabase } from '@/integrations/supabase/client';

async function migrateFinancialLayoutsToMetrics() {
  // Buscar todos os layouts do tipo 'financial' (se existirem)
  const { data: oldLayouts } = await supabase
    .from('layout_preferences')
    .select('*')
    .eq('layout_type', 'financial');
  
  if (!oldLayouts || oldLayouts.length === 0) {
    console.log('Nenhum layout financial encontrado. Nada a migrar.');
    return;
  }
  
  // Copiar para 'metrics-grid'
  const migratedLayouts = oldLayouts.map(layout => ({
    ...layout,
    layout_type: 'metrics-grid',
    // Mapear cardIds antigos → novos (se necessário)
    layout_json: migrateCardIds(layout.layout_json),
  }));
  
  // Inserir novos layouts
  const { error } = await supabase
    .from('layout_preferences')
    .upsert(migratedLayouts);
  
  if (error) {
    console.error('Erro ao migrar layouts:', error);
  } else {
    console.log(`${migratedLayouts.length} layouts migrados com sucesso.`);
  }
}

function migrateCardIds(layoutJson: any): any {
  // Mapear IDs antigos para novos se necessário
  // Ex: 'financial-revenue' → 'metrics-chart-monthly-revenue'
  return layoutJson; // implementar se houver IDs antigos
}

// Executar uma vez após C3.9
// migrateFinancialLayoutsToMetrics();
```

**Arquivos afetados:**
- ✅ `src/App.tsx` (trocar rota)
- 🔄 `src/pages/Financial.tsx` (hibernar → deletar)
- 🔄 `src/pages/FinancialLegacyWrapper.tsx` (deletar após 1 semana)
- 🔄 `src/pages/DashboardOLD.tsx` (deletar se ainda existir)
- 💡 `scripts/migrate-financial-layouts.ts` (one-time, se necessário)

**Validação pós-C3.9:**
- ✅ `/financial` redireciona para `/metrics?tab=financial`
- ✅ Nenhum erro 404
- ✅ Nenhum usuário reporta bloqueio
- ✅ Performance estável
- ✅ Rota de emergência disponível (comentada)

---

## 🎯 VALIDAÇÃO GLOBAL DO PLANO

### ✅ Unificação de Sistemas

| Sistema | Antes (Proposta Inicial) | Agora (Revisado) | Status |
|---------|---------------------------|------------------|--------|
| Layout | Criar `useMetricsLayout` | Usar `useDashboardLayout('metrics-grid')` | ✅ CORRETO |
| Registry | Criar `metricsCardRegistry` | Estender `dashboardCardRegistry` | ✅ CORRETO |
| Sections | Criar arquivo separado | Adicionar `METRICS_SECTIONS` em existente | ✅ CORRETO |
| CardTypes | Novo arquivo | Estender `cardTypes.ts` | ✅ CORRETO |
| Permissions | Nova lógica | Usar `useEffectivePermissions` + `useDashboardPermissions` | ✅ CORRETO |

### ✅ Segurança e Rollback

| Fase | Mecanismo de Rollback | Status |
|------|----------------------|--------|
| C3.1 | Read-only, nada quebra | ✅ SEGURO |
| C3.1.5 | Testes validam outputs | ✅ CRÍTICO |
| C3.2 | Feature flag `USE_NEW_METRICS` | ✅ SEGURO |
| C3.3 | API nova não afeta código existente | ✅ SEGURO |
| C3.4 | Placeholders, sem dados reais | ✅ SEGURO |
| C3.5 | Apenas metadados, sem UI | ✅ SEGURO |
| C3.6 | Cards isolados, não afeta Financial.tsx | ✅ SEGURO |
| C3.7 | Extensão de C3.6, mesma lógica | ✅ SEGURO |
| C3.8 | **Wrapper sem redirect** - sem loop | ✅ SEGURO |
| C3.9 | Critérios + rota de emergência | ✅ SEGURO |

### ✅ Testabilidade

| Fase | Testes Necessários | Status |
|------|--------------------|--------|
| C3.1 | Nenhum (apenas extração) | ✅ N/A |
| C3.1.5 | **UNITÁRIOS COMPLETOS** | 🔴 CRÍTICO |
| C3.2 | Comparação outputs flag ON vs OFF | ✅ MANUAL |
| C3.3 | Unitários para fachada | ✅ RECOMENDADO |
| C3.4 | Smoke test (página abre) | ✅ MANUAL |
| C3.5 | Nenhum (apenas config) | ✅ N/A |
| C3.6-7 | Visual testing (cards renderizam) | ✅ MANUAL |
| C3.8 | Navegação entre páginas | ✅ MANUAL |
| C3.9 | Comparação final outputs | ✅ MANUAL |

### ✅ Permissões

| Domínio | Cards | Permissão Necessária | Validação |
|---------|-------|----------------------|-----------|
| Financial | `metrics-summary-financial`, `metrics-chart-*` | `requiresFinancialAccess: true` | ✅ `canViewCard` |
| Administrative | `metrics-summary-administrative`, etc. | `domain: 'administrative'` | ✅ `canViewCard` |
| Team | `metrics-summary-team`, etc. | `domain: 'team'`, `blockedFor: ['subordinate']` | ✅ `canViewCard` |

**Verificação de compatibilidade:**
- ✅ Sistema atual já usa `useEffectivePermissions()`
- ✅ `useDashboardPermissions()` já implementa `canViewCard()`
- ✅ `permissionConfig` em `cardTypes.ts` já existe
- ✅ Bloqueio por `blockedFor` já funciona

---

## 🚨 RISCOS RESIDUAIS E MITIGAÇÕES

### Risco 1: Drift de tipos entre Financial.tsx e MetricsPatient/Session
**Severidade:** 🟡 MÉDIO  
**Probabilidade:** MÉDIA  
**Mitigação:**
- Criar adaptadores explícitos em C3.2
- Validar outputs numericamente (script automatizado)
- Testes unitários em C3.1.5 cobrem casos extremos

### Risco 2: Performance de `systemMetricsUtils` com grandes volumes
**Severidade:** 🟡 MÉDIO  
**Probabilidade:** BAIXA  
**Mitigação:**
- Uso de `useMemo` em Metrics.tsx
- Calcular agregados uma vez, passar para todos os cards
- Monitorar performance em produção (C3.8)

### Risco 3: Usuários não migram para /metrics
**Severidade:** 🟢 BAIXO  
**Probabilidade:** BAIXA  
**Mitigação:**
- Wrapper em C3.8 educa sobre benefícios
- Telemetria mostra taxa de adoção
- Critérios claros em C3.9 antes de forçar migração

### Risco 4: Bug crítico em /metrics após C3.9
**Severidade:** 🔴 ALTO  
**Probabilidade:** MUITO BAIXA  
**Mitigação:**
- 2 semanas de convivência antes de C3.9
- Rota de emergência `/financial-legacy` (comentada, pronta)
- Rollback trivial: descomentar rota antiga

### Risco 5: Layouts customizados perdidos na migração
**Severidade:** 🟡 MÉDIO  
**Probabilidade:** BAIXA  
**Mitigação:**
- Script de migração opcional (C3.9)
- Layouts antigos preservados no DB (não deletados)
- Usuários podem reconfigurar em /metrics (drag&drop)

---

## 📊 COMPARAÇÃO: PROPOSTA INICIAL vs REVISADA

| Aspecto | Proposta Inicial | Revisão V2 | Impacto |
|---------|------------------|------------|---------|
| Unificação | ❌ Criar novos sistemas | ✅ Reutilizar existentes | 🟢 -50% código |
| Testes | ⚠️ Não especificado | ✅ Fase dedicada (C3.1.5) | 🟢 +Confiabilidade |
| Rollback | ⚠️ Não detalhado | ✅ Feature flags + wrapper | 🟢 +Segurança |
| Redirect | ❌ Direto (risco loop) | ✅ Wrapper intermediário | 🟢 Sem risco |
| Critérios | ⚠️ Vagos | ✅ Checklist objetivo | 🟢 +Clareza |
| Layout Migration | ❌ Não mencionado | ✅ Script one-time | 🟢 UX preservada |

---

## ✅ VEREDICTO FINAL

### APROVADO PARA IMPLEMENTAÇÃO ✅

O plano de faseamento revisado está **ARQUITETURALMENTE SÓLIDO** e **SEGURO** para implementação.

**Pontos fortes:**
1. ✅ Reutiliza infraestrutura existente (layout, registry, permissions)
2. ✅ Testes unitários dedicados antes de integração
3. ✅ Feature flags e wrappers para rollback fácil
4. ✅ Sem riscos de loops infinitos
5. ✅ Critérios objetivos para desligar legado
6. ✅ Cleanup gradual e controlado

**Recomendações finais:**

1. 🔴 **CRÍTICO** - Não pular fase C3.1.5 (testes unitários)
   - Cobertura mínima: 80% de `systemMetricsUtils.ts`
   - Validar outputs vs Financial.tsx atual

2. 🟡 **IMPORTANTE** - Implementar telemetria em C3.8
   - Rastrear uso de `/financial` vs `/metrics`
   - Dados informam decisão de C3.9

3. 🟡 **IMPORTANTE** - Criar script de migração de layouts (C3.9)
   - Preservar customizações dos usuários
   - Executar antes de forçar redirect

4. 🟢 **RECOMENDADO** - Documentar arquitetura final (opcional C3.10)
   - Facilita manutenção futura
   - Onboarding de novos devs

**Status:** ✅ **PRONTO PARA COMEÇAR C3.1**

---

## 📋 CHECKLIST DE INÍCIO

Antes de começar C3.1, garantir:

- [ ] Este documento foi revisado e aprovado
- [ ] Nenhuma mudança grande pendente em `Financial.tsx` (evitar conflitos)
- [ ] Branch de feature criado (`feature/track-c3-metrics-refactor`)
- [ ] Backup manual do código atual (caso precise reverter tudo)
- [ ] Time está ciente do escopo e cronograma

**Quando tudo estiver ✅, pode começar C3.1!**
