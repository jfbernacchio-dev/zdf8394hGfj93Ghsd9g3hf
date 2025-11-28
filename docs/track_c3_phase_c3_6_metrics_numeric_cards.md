# 📊 FASE C3.6 — CARDS NUMÉRICOS REAIS DE MÉTRICAS

## 🎯 Objetivo da Fase

Implementar **cards numéricos reais** no topo da página `/metrics`, consumindo os dados já agregados via `systemMetricsUtils` e integrando com o sistema de layout/registry existente.

**Escopo:**
- ✅ Criar 12 componentes de cards numéricos
- ✅ Registrar no sistema central de cards
- ✅ Renderizar na página `/metrics` por domínio
- ❌ Não implementar gráficos ainda (FASE C3.7)
- ❌ Não migrar `/financial` ou `/metrics/website` ainda

---

## 📦 Componentes Criados

### 1. Tipos Base

**`src/types/metricsCardTypes.ts`**
- `MetricsPeriod`: tipo do período (`'week' | 'month' | 'year' | 'custom'`)
- `MetricsPeriodFilter`: filtro completo com startDate/endDate
- `MetricsCardBaseProps`: props base para todos os cards numéricos
- `MockMetricsCardProps`: props para cards mockados (marketing)

**Importante:** Reutiliza `FinancialSummary` de `systemMetricsUtils.ts` para evitar duplicação.

---

### 2. Cards Financeiros (domain: `financial`)

**Pasta:** `src/components/cards/metrics/financial/`

1. **MetricsRevenueTotalCard.tsx**
   - **Métrica:** `summary.totalRevenue`
   - **Descrição:** Receita total no período selecionado
   - **Ícone:** DollarSign
   - **Cor:** primary

2. **MetricsAvgPerSessionCard.tsx**
   - **Métrica:** `summary.avgPerSession`
   - **Descrição:** Ticket médio por sessão atendida
   - **Ícone:** TrendingUp

3. **MetricsForecastRevenueCard.tsx**
   - **Métrica:** `summary.forecastRevenue`
   - **Descrição:** Projeção de receita mensal
   - **Ícone:** Target
   - **Cor:** green-600

4. **MetricsAvgPerActivePatientCard.tsx**
   - **Métrica:** `summary.avgRevenuePerActivePatient`
   - **Descrição:** Receita média por paciente ativo
   - **Ícone:** Users

5. **MetricsLostRevenueCard.tsx**
   - **Métrica:** `summary.lostRevenue`
   - **Descrição:** Receita estimada perdida por faltas
   - **Ícone:** AlertCircle
   - **Cor:** red-500

---

### 3. Cards Administrativos (domain: `administrative`)

**Pasta:** `src/components/cards/metrics/administrative/`

6. **MetricsMissedRateCard.tsx**
   - **Métrica:** `summary.missedRate`
   - **Descrição:** Taxa de faltas (%)
   - **Ícone:** Activity
   - **Cor:** red-500

7. **MetricsActivePatientsCard.tsx**
   - **Métrica:** `summary.activePatients`
   - **Descrição:** Pacientes com sessões no período
   - **Ícone:** Users
   - **Cor:** primary

8. **MetricsOccupationRateCard.tsx**
   - **Métrica:** `occupationRate` (ainda não no summary)
   - **Status:** Exibe 0% por enquanto — será implementado futuramente
   - **Ícone:** Target

---

### 4. Cards Marketing (domain: `marketing`, MOCKADOS)

**Pasta:** `src/components/cards/metrics/marketing/`

9. **MetricsWebsiteViewsCard.tsx**
   - **Valor mock:** 1847
   - **Ícone:** Eye
   - **Aviso:** "Dados de exemplo — integração com Analytics futura"

10. **MetricsWebsiteVisitorsCard.tsx**
    - **Valor mock:** 542
    - **Ícone:** Users

11. **MetricsWebsiteConversionCard.tsx**
    - **Valor mock:** 3.2%
    - **Ícone:** TrendingUp

12. **MetricsWebsiteCTRCard.tsx**
    - **Valor mock:** 5.8%
    - **Ícone:** MousePointerClick

**Todos os cards de marketing incluem um Alert explícito indicando que são dados de exemplo.**

---

## 🔧 Integração com Sistema Central

### cardTypes.ts

Adicionado novo array `AVAILABLE_METRICS_CARDS` com 12 configurações:
- IDs: `metrics-revenue-total`, `metrics-avg-per-session`, etc.
- Permissões: `financial` cards requerem `requiresFinancialAccess: true`
- Category: `'dashboard-cards'`

### dashboardCardRegistry.tsx

Registrados placeholders no `DASHBOARD_CARD_COMPONENTS`:
- Cards de métricas retornam `null` pois são renderizados diretamente em `Metrics.tsx`
- Placeholders permitem extensibilidade futura se necessário usar o sistema genérico

---

## 📄 Integração na Página /metrics

### Fluxo de Dados

```
Metrics.tsx
  ↓
  queries (patients, sessions, profile, schedule_blocks)
  ↓
  adaptadores (MetricsPatient, MetricsSession, etc.)
  ↓
  systemMetricsUtils (getFinancialSummary, etc.)
  ↓
  aggregatedData { summary, trends, retention }
  ↓
  periodFilter { type, startDate, endDate }
  ↓
  cards numéricos (MetricsRevenueTotalCard, etc.)
```

### Renderização por Domínio

```tsx
const renderMetricCards = () => {
  if (currentDomain === 'financial') {
    return <grid com 5 cards financeiros />;
  }
  
  if (currentDomain === 'administrative') {
    return <grid com 3 cards administrativos />;
  }
  
  if (currentDomain === 'marketing') {
    return <grid com 4 cards marketing mockados />;
  }
  
  if (currentDomain === 'team') {
    return <Alert "Em breve" />;
  }
};
```

### Estados de Carregamento

- `cardsLoading = patientsLoading || sessionsLoading || ...`
- Cada card exibe skeleton enquanto `isLoading === true`
- Summary pode ser `null` durante carregamento

---

## 🗂️ Arquivos Criados/Modificados

### Arquivos Criados

**Tipos:**
- `src/types/metricsCardTypes.ts`

**Componentes (12 cards):**
- `src/components/cards/metrics/financial/MetricsRevenueTotalCard.tsx`
- `src/components/cards/metrics/financial/MetricsAvgPerSessionCard.tsx`
- `src/components/cards/metrics/financial/MetricsForecastRevenueCard.tsx`
- `src/components/cards/metrics/financial/MetricsAvgPerActivePatientCard.tsx`
- `src/components/cards/metrics/financial/MetricsLostRevenueCard.tsx`
- `src/components/cards/metrics/administrative/MetricsMissedRateCard.tsx`
- `src/components/cards/metrics/administrative/MetricsActivePatientsCard.tsx`
- `src/components/cards/metrics/administrative/MetricsOccupationRateCard.tsx`
- `src/components/cards/metrics/marketing/MetricsWebsiteViewsCard.tsx`
- `src/components/cards/metrics/marketing/MetricsWebsiteVisitorsCard.tsx`
- `src/components/cards/metrics/marketing/MetricsWebsiteConversionCard.tsx`
- `src/components/cards/metrics/marketing/MetricsWebsiteCTRCard.tsx`

**Documentação:**
- `docs/track_c3_phase_c3_6_metrics_numeric_cards.md` (este arquivo)

### Arquivos Modificados

- `src/types/cardTypes.ts`: adicionado `AVAILABLE_METRICS_CARDS`
- `src/lib/dashboardCardRegistry.tsx`: registrados placeholders para os 12 cards
- `src/pages/Metrics.tsx`: 
  - Importados os 12 componentes de cards
  - Criada função `renderMetricCards()`
  - Removidos placeholders anteriores
  - Integrado `periodFilter` e `summary`

---

## ✅ Validação dos Critérios de Aceite

### Funcionalidades Implementadas

- ✅ 12 componentes de cards numéricos criados
- ✅ Cards registrados no sistema central (cardTypes + registry)
- ✅ `/metrics` renderiza cards reais por domínio:
  - ✅ Financial: 5 cards com dados reais
  - ✅ Administrative: 3 cards com dados reais
  - ✅ Marketing: 4 cards mockados com avisos
  - ✅ Team: placeholder "em breve"
- ✅ Cards consomem `aggregatedData.summary`
- ✅ Estados de loading com skeletons
- ✅ Build passa sem erros
- ✅ Formatação usando `formatBrazilianCurrency`

### O que NÃO foi feito (conforme escopo)

- ❌ Nenhum gráfico com Recharts (isso é FASE C3.7)
- ❌ `/financial` e `/metrics/website` permanecem intactos
- ❌ Nenhuma mudança em RLS, schemas ou edge functions
- ❌ Comparativo "vs período anterior" (futuro)
- ❌ Taxa de ocupação real (será adicionada ao summary futuramente)

---

## 📊 Fonte de Dados

### FinancialSummary (systemMetricsUtils.ts)

```ts
export interface FinancialSummary {
  totalRevenue: number;
  totalSessions: number;
  missedRate: number;
  avgPerSession: number;
  activePatients: number;
  lostRevenue: number;
  avgRevenuePerActivePatient: number;
  forecastRevenue: number;
}
```

**Calculado via:**
- `getFinancialSummary({ sessions, patients, start, end })`
- Reutiliza lógica extraída de `Financial.tsx` (FASE C3.1)
- Testado em `systemMetricsUtils.test.ts` (FASE C3.1.5)

---

## 🔄 Próximas Fases

### FASE C3.7 (Próxima)
- Implementar gráficos reais com Recharts
- Consumir `aggregatedData.trends`
- Sub-abas de gráficos por domínio
- Controles de escala de tempo

### FASE C3.8
- Migrar `/financial` para usar facade pattern
- Redirecionar para `/metrics?domain=financial`
- FinancialLegacyWrapper

### Fases Futuras
- Integração real com Google Analytics (marketing)
- Implementar taxa de ocupação real
- Comparativo vs período anterior
- Métricas de equipe (team domain)

---

## 🐛 Notas Técnicas

### Reutilização de Lógica

Todos os cálculos são feitos via `systemMetricsUtils.ts`, que já contém:
- Lógica fiel extraída de `Financial.tsx`
- Tratamento de pacientes mensalistas
- Filtragem correta de sessões visíveis
- Testes automatizados

### Formatação

- Moeda: `formatBrazilianCurrency()` de `@/lib/brazilianFormat`
- Percentual: `.toFixed(1)` + `%`
- Números: `.toLocaleString('pt-BR')`

### Skeletons

Todos os cards implementam estado de loading consistente:
```tsx
if (isLoading || !summary) {
  return <Card com Skeletons />;
}
```

---

## ✅ Conclusão da Fase C3.6

A FASE C3.6 está **completa** e pronta para produção:
- Todos os 12 cards numéricos implementados
- Integração com sistema central de registry
- Renderização condicional por domínio na `/metrics`
- Build passando sem erros
- Documentação completa

**Próxima fase:** C3.7 — Implementação de gráficos reais
