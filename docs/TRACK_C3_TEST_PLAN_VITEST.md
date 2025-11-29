# 🧪 TRACK C3 - PLANO DE TESTES VITEST
## AUDITORIA GLOBAL E ROADMAP DE TESTES UNITÁRIOS/INTEGRAÇÃO

**Data:** 2025-11-29  
**Fase:** Pós C3-R.10 (TRACK C3 completo)  
**Objetivo:** Mapear 100% do escopo implementado e criar plano de testes exaustivo

---

## 📊 SUMÁRIO EXECUTIVO

### Cobertura Atual (Baseline)
- ✅ **Testes Existentes:** `systemMetricsUtils.test.ts` (40+ testes), `useChartTimeScale.test.ts` (30+ testes), 12 card tests
- ✅ **Cobertura Estimada:** ~75% em módulos críticos
- ❌ **Gaps Identificados:** Gráficos (0% cobertura), `Metrics.tsx` (0% integração), adaptadores de dados, edge cases de timezone

### Escopo Total da TRACK C3
- **10 Fases Implementadas:** C3-R.1 até C3-R.10
- **4 Domínios:** financial, administrative, marketing, team
- **12 Cards Numéricos:** 5 financial, 3 administrative, 4 marketing, 0 team
- **32 Gráficos:** 17 financial, 7 administrative, 1 marketing, 7 team
- **14 Sub-abas:** distribuicoes, desempenho, tendencias, retencao (variando por domínio)

---

## 🎯 MATRIZ DE REQUISITOS → TESTES

### 1. DOMÍNIOS E SUB-ABAS

| Domínio | Sub-abas | Comportamento Esperado | Tipo de Teste | Prioridade | Status Atual |
|---------|----------|------------------------|---------------|------------|--------------|
| **financial** | distribuicoes, desempenho, tendencias, retencao | Renderiza cards + gráficos corretos por sub-aba | Integração | 🔴 Alta | ❌ Sem testes |
| **administrative** | distribuicoes, desempenho, retencao | Renderiza cards + gráficos corretos por sub-aba | Integração | 🔴 Alta | ❌ Sem testes |
| **marketing** | website | Renderiza 4 cards mockados + 1 gráfico | Integração | 🟡 Média | ❌ Sem testes |
| **team** | desempenho, distribuicoes, retencao | Renderiza 7 gráficos sem cards numéricos | Integração | 🟡 Média | ❌ Sem testes |

**Teste de Rota:**
- `/metrics?domain=financial&subTab=tendencias` → Deve carregar domínio correto, sub-aba correta
- `/metrics?domain=invalid` → Deve redirecionar para domínio padrão (financial)
- `/metrics` (sem params) → Deve usar defaults (financial + primeira sub-aba)

---

### 2. CARDS NUMÉRICOS (12 CARDS)

#### 2.1 Cards Financial (5)

| Card ID | Título | Fonte de Dados | Fórmula/Cálculo | Estados | Permissões | Prioridade | Status Atual |
|---------|--------|----------------|-----------------|---------|------------|------------|--------------|
| `metrics-revenue-total` | Receita Total | `sessions` (attended) | `sum(session.value)` considerando mensalistas | loading/empty/error | `financial_access` | 🔴 Alta | ✅ Testado |
| `metrics-avg-per-session` | Média por Sessão | `summary.totalRevenue` / `summary.totalSessions` | `avgPerSession` | loading/empty/error | `financial_access` | 🔴 Alta | ✅ Testado |
| `metrics-forecast-revenue` | Receita Prevista | `patients` (active) + frequência | `forecastRevenue` (4.33 semanas/mês) | loading/empty/error | `financial_access` | 🔴 Alta | ✅ Testado |
| `metrics-avg-per-active-patient` | Média por Paciente Ativo | `summary.totalRevenue` / `summary.activePatients` | `avgRevenuePerActivePatient` | loading/empty/error | `financial_access` | 🔴 Alta | ✅ Testado |
| `metrics-lost-revenue` | Receita Perdida | `sessions` (missed) | `sum(session.value) where status=missed` | loading/empty/error | `financial_access` | 🔴 Alta | ✅ Testado |

**Testes Existentes:** ✅ `src/components/cards/metrics/__tests__/` (financial)  
**Cobertura:** ~90% para rendering, loading, edge cases

#### 2.2 Cards Administrative (3)

| Card ID | Título | Fonte de Dados | Fórmula/Cálculo | Estados | Permissões | Prioridade | Status Atual |
|---------|--------|----------------|-----------------|---------|------------|------------|--------------|
| `metrics-active-patients` | Pacientes Ativos | `patients` | `count where status=active` | loading/empty/error | `administrative_access` | 🔴 Alta | ✅ Testado |
| `metrics-occupation-rate` | Taxa de Ocupação | `sessions` / `schedule_blocks` | `(attendedSessions / capacity) * 100` | loading/empty/error | `administrative_access` | 🔴 Alta | ✅ Testado |
| `metrics-missed-rate` | Taxa de Faltas | `sessions` (missed) / `sessions` (total) | `(missedCount / visibleTotal) * 100` | loading/empty/error | `administrative_access` | 🔴 Alta | ✅ Testado |

**Testes Existentes:** ✅ `src/components/cards/metrics/__tests__/` (administrative)  
**Cobertura:** ~90% para rendering, loading, edge cases

#### 2.3 Cards Marketing (4)

| Card ID | Título | Fonte de Dados | Fórmula/Cálculo | Estados | Permissões | Prioridade | Status Atual |
|---------|--------|----------------|-----------------|---------|------------|------------|--------------|
| `metrics-website-visitors` | Visitantes | Mockado | Hardcoded `1234` | loading | `marketing_access` | 🟢 Baixa | ✅ Testado |
| `metrics-website-views` | Visualizações | Mockado | Hardcoded `5678` | loading | `marketing_access` | 🟢 Baixa | ✅ Testado |
| `metrics-website-ctr` | CTR | Mockado | Hardcoded `3.4%` | loading | `marketing_access` | 🟢 Baixa | ✅ Testado |
| `metrics-website-conversion` | Taxa de Conversão | Mockado | Hardcoded `2.1%` | loading | `marketing_access` | 🟢 Baixa | ✅ Testado |

**Testes Existentes:** ✅ `src/components/cards/metrics/__tests__/` (marketing)  
**Cobertura:** ~80% (mockados, menos críticos)

---

### 3. GRÁFICOS (32 GRÁFICOS)

#### 3.1 Gráficos Financial (17)

| # | Componente | Tipo | Sub-aba | Dados de Entrada | Regras de Cálculo | Estados | Prioridade | Status Atual |
|---|------------|------|---------|------------------|-------------------|---------|------------|--------------|
| 1 | `FinancialTrendsChart` | LineChart (duplo Y) | tendencias | `trends[]` | Receita + Sessões por mês | loading/empty | 🔴 Alta | ❌ Sem testes |
| 2 | `FinancialRevenueTrendChart` | LineChart | tendencias | `trends[]` | Receita por mês | loading/empty | 🔴 Alta | ❌ Sem testes |
| 3 | `FinancialForecastVsActualChart` | AreaChart | tendencias | `trends[]` + forecast | Previsto vs Realizado | loading/empty | 🔴 Alta | ❌ Sem testes |
| 4 | `FinancialConversionRateChart` | LineChart | tendencias | `trends[]` | Taxa conversão por mês | loading/empty | 🟡 Média | ❌ Sem testes |
| 5 | `FinancialTopPatientsChart` | BarChart | tendencias | `patients` + `sessions` | Top 10 por receita | loading/empty | 🟡 Média | ❌ Sem testes |
| 6 | `FinancialRevenueDistributionChart` | PieChart | distribuicoes | `summary` | Realizada/Prevista/Perdida | loading/empty | 🔴 Alta | ❌ Sem testes |
| 7 | `FinancialSessionStatusChart` | PieChart | distribuicoes | `summary` | Atendidas/Faltas | loading/empty | 🔴 Alta | ❌ Sem testes |
| 8 | `FinancialDistributionsChart` | PieChart | distribuicoes | `summary` | Atendidas/Faltas (alt) | loading/empty | 🟡 Média | ❌ Sem testes |
| 9 | `FinancialMonthlyPerformanceChart` | ComposedChart | desempenho | `trends[]` | Receita (bar) + Taxa (line) | loading/empty | 🔴 Alta | ❌ Sem testes |
| 10 | `FinancialWeeklyComparisonChart` | BarChart | desempenho | `sessions` | Receita por semana | loading/empty | 🟡 Média | ❌ Sem testes |
| 11 | `FinancialPerformanceChart` | LineChart | desempenho | `trends[]` | Volume sessões por mês | loading/empty | 🟡 Média | ❌ Sem testes |
| 12 | `FinancialTicketComparisonChart` | BarChart | desempenho | `patients` + `sessions` | Mensais vs Semanais | loading/empty | 🟡 Média | ❌ Sem testes |
| 13 | `FinancialInactiveByMonthChart` | BarChart | desempenho | `patients` | Encerrados por mês | loading/empty | 🟡 Média | ❌ Sem testes |
| 14 | `FinancialMissedByPatientChart` | BarChart | desempenho | `sessions` | Faltas por paciente | loading/empty | 🟡 Média | ❌ Sem testes |
| 15 | `FinancialLostRevenueChart` | BarChart | desempenho | `sessions` | Valor perdido por mês | loading/empty | 🔴 Alta | ❌ Sem testes |
| 16 | `FinancialRetentionRateChart` | BarChart | retencao | `retention` | Retenção 3/6/12m | loading/empty | 🔴 Alta | ❌ Sem testes |
| 17 | `FinancialNewVsInactiveChart` | BarChart | retencao | `patients` | Novos vs Encerrados | loading/empty | 🟡 Média | ❌ Sem testes |

**Testes Existentes:** ❌ Nenhum  
**Cobertura:** 0%

#### 3.2 Gráficos Administrative (7)

| # | Componente | Tipo | Sub-aba | Dados de Entrada | Regras de Cálculo | Estados | Prioridade | Status Atual |
|---|------------|------|---------|------------------|-------------------|---------|------------|--------------|
| 1 | `AdminRetentionChart` | BarChart | retencao | `retention` | Retenção 3/6/12m + Churn | loading/empty | 🔴 Alta | ❌ Sem testes |
| 2 | `AdminPerformanceChart` | LineChart | desempenho | `trends[]` | Volume de sessões por mês | loading/empty | 🟡 Média | ❌ Sem testes |
| 3 | `AdminDistributionsChart` | PieChart | distribuicoes | `summary` | Atendidas/Faltas | loading/empty | 🟡 Média | ❌ Sem testes |
| 4 | `AdminFrequencyDistributionChart` | PieChart | distribuicoes | `patients` | Semanal/Quinzenal/Mensal | loading/empty | 🟡 Média | ❌ Sem testes |
| 5 | `AdminAttendanceRateChart` | LineChart | desempenho | `sessions` | Taxa comparecimento por mês | loading/empty | 🟡 Média | ❌ Sem testes |
| 6 | `AdminWeeklyOccupationChart` | BarChart | desempenho | `sessions` + `schedule_blocks` | Ocupação semanal | loading/empty | 🔴 Alta | ❌ Sem testes |
| 7 | `AdminChurnRetentionChart` | BarChart | retencao | `retention` | Retenção vs Churn | loading/empty | 🟡 Média | ❌ Sem testes |

**Testes Existentes:** ❌ Nenhum  
**Cobertura:** 0%

#### 3.3 Gráficos Marketing (1)

| # | Componente | Tipo | Sub-aba | Dados de Entrada | Regras de Cálculo | Estados | Prioridade | Status Atual |
|---|------------|------|---------|------------------|-------------------|---------|------------|--------------|
| 1 | `MarketingWebsiteOverviewChart` | LineChart | website | Mockado | Visualizações + Visitantes mockados | loading | 🟢 Baixa | ❌ Sem testes |

**Testes Existentes:** ❌ Nenhum  
**Cobertura:** 0% (mockado, baixa prioridade)

#### 3.4 Gráficos Team (7)

| # | Componente | Tipo | Sub-aba | Dados de Entrada | Regras de Cálculo | Estados | Prioridade | Status Atual |
|---|------------|------|---------|------------------|-------------------|---------|------------|--------------|
| 1 | `TeamIndividualPerformanceChart` | BarChart (duplo Y) | desempenho | `sessions` + `patients` | Receita + Sessões por terapeuta | loading/empty | 🔴 Alta | ❌ Sem testes |
| 2 | `TeamRevenueComparisonChart` | BarChart | desempenho | `sessions` + `patients` | Receita por terapeuta | loading/empty | 🔴 Alta | ❌ Sem testes |
| 3 | `TeamPatientDistributionChart` | PieChart | distribuicoes | `patients` | Pacientes ativos por terapeuta | loading/empty | 🟡 Média | ❌ Sem testes |
| 4 | `TeamWorkloadChart` | BarChart | distribuicoes | `schedule_blocks` + `profiles` | Horas semanais por terapeuta | loading/empty | 🟡 Média | ❌ Sem testes |
| 5 | `TeamMonthlyEvolutionChart` | LineChart (duplo Y) | retencao | `trends[]` | Receita + Sessões da equipe | loading/empty | 🟡 Média | ❌ Sem testes |
| 6 | `TeamOccupationByMemberChart` | LineChart (múltiplas) | retencao | `sessions` + `schedule_blocks` | Taxa ocupação por terapeuta/semana | loading/empty | 🔴 Alta | ❌ Sem testes |
| 7 | `TeamAttendanceByTherapistChart` | LineChart (múltiplas) | retencao | `sessions` + `patients` | Taxa comparecimento por terapeuta/semana | loading/empty | 🟡 Média | ❌ Sem testes |

**Testes Existentes:** ❌ Nenhum  
**Cobertura:** 0%

---

### 4. FLUXOS PRINCIPAIS

#### 4.1 Cálculo de Métricas (`systemMetricsUtils.ts`)

| Função | Entrada | Saída | Regras Críticas | Casos de Teste | Prioridade | Status Atual |
|--------|---------|-------|-----------------|----------------|------------|--------------|
| `getFinancialSummary()` | sessions, patients, dateRange | `FinancialSummary` | Filtro por período, pacientes mensalistas contam 1x/mês | Total/avg/forecast/lost | 🔴 Alta | ✅ 40+ testes |
| `getFinancialTrends()` | sessions, patients, dateRange, timeScale | `FinancialTrendPoint[]` | Agregação daily/weekly/monthly, crescimento MoM | Agregação por escala, growth correto | 🔴 Alta | ✅ Testado |
| `getRetentionAndChurn()` | patients, dateRange | `RetentionSummary` | Retenção 3/6/12m, churn = 100 - retention3m | Cálculo de retenção, novos vs inativos | 🔴 Alta | ✅ Testado |
| `calculateTotalRevenue()` | sessions, patients | number | Pacientes mensalistas: 1 cobrança/mês | Mensalistas vs semanais | 🔴 Alta | ✅ Testado |
| `calculateMissedRate()` | sessions | string | Apenas sessões visíveis (show_in_schedule !== false) | Taxa 0-100%, divisão por zero | 🔴 Alta | ✅ Testado |
| `calculateOccupationRate()` | sessions, scheduleBlocks, profile | string | (sessões / capacidade) * 100 | Capacidade com schedule_blocks, fallback profile | 🟡 Média | ✅ Testado |
| `getForecastRevenue()` | patients | number | Pacientes ativos × valor × frequência × 4.33 | Frequências: semanal/quinzenal/mensal | 🔴 Alta | ✅ Testado |
| `getMonthlyRevenue()` | sessions, patients, dateRange | Array | Agregação mensal com pacientes mensalistas | Normalização UTC, intervalo correto | 🔴 Alta | ✅ Testado |
| `getPatientDistribution()` | sessions, patients | Array | Top pacientes por receita | Ordenação decrescente, mensalistas | 🟡 Média | ✅ Testado |
| `getMissedRate()` | sessions, dateRange | Array | Taxa de falta por mês | Apenas sessões visíveis | 🟡 Média | ✅ Testado |
| `getTicketComparison()` | sessions, patients | Object | Mensais vs Semanais ticket médio | Separação por frequency | 🟡 Média | ✅ Testado |
| `getNewVsInactive()` | patients, dateRange | Array | Novos vs Encerrados por mês | Criação vs updated_at | 🟡 Média | ✅ Testado |
| `getRetentionRate()` | patients | Array | Retenção 3/6/12m | Pacientes criados há X meses ainda ativos | 🔴 Alta | ✅ Testado |
| `getLostRevenueByMonth()` | sessions, dateRange | Array | Valor perdido por mês | Sessões missed × valor | 🟡 Média | ✅ Testado |

**Testes Existentes:** ✅ `src/lib/__tests__/systemMetricsUtils.test.ts` (40+ testes)  
**Cobertura:** ~85% em lógica de cálculo

**Edge Cases a Adicionar:**
- Timezone issues (UTC vs local)
- Período custom com datas inválidas
- Datasets vazios (0 pacientes, 0 sessões)
- NaN/Infinity em divisões
- Pacientes com campos nulos (created_at, updated_at)

#### 4.2 Hook `useChartTimeScale`

| Função | Entrada | Saída | Regras Críticas | Casos de Teste | Prioridade | Status Atual |
|--------|---------|-------|-----------------|----------------|------------|--------------|
| `useChartTimeScale()` | startDate, endDate | automaticScale, getScale, setScaleOverride | < 15 dias = daily, ≤ 90 dias = weekly, > 90 = monthly | Lógica de escalonamento, overrides | 🔴 Alta | ✅ 30+ testes |
| `generateTimeIntervals()` | startDate, endDate, scale | Date[] | Gera intervalos daily/weekly/monthly, normaliza UTC | Intervalos corretos, filtro de futuros | 🔴 Alta | ✅ Testado |
| `formatTimeLabel()` | date, scale | string | Formato: dd/MM (daily), Xª/Mês (weekly), MMM/yy (monthly) | Formatação correta, UTC | 🔴 Alta | ✅ Testado |

**Testes Existentes:** ✅ `src/hooks/__tests__/useChartTimeScale.test.ts` (30+ testes)  
**Cobertura:** ~90%

#### 4.3 Sistema de Seções e Sub-abas (`metricsSectionsConfig.ts`)

| Função | Entrada | Saída | Regras Críticas | Casos de Teste | Prioridade | Status Atual |
|--------|---------|-------|-----------------|----------------|------------|--------------|
| `getSectionsForDomain()` | domain | `MetricsSectionConfig[]` | Retorna seções do domínio | 4 domínios | 🟡 Média | ❌ Sem testes |
| `getSubTabsForDomain()` | domain | `MetricsSubTabConfig[]` | Retorna sub-abas do domínio | Financial: 4, Admin: 3, Marketing: 1, Team: 3 | 🟡 Média | ❌ Sem testes |
| `getDefaultSubTabForDomain()` | domain | string | Primeira sub-aba do domínio | Fallback correto | 🟡 Média | ❌ Sem testes |
| `isSectionValid()` | sectionId | boolean | Valida se seção existe | IDs válidos/inválidos | 🟢 Baixa | ❌ Sem testes |
| `isSubTabValidForDomain()` | subTabId, domain | boolean | Valida sub-aba para domínio | Combinações válidas/inválidas | 🟢 Baixa | ❌ Sem testes |

**Testes Existentes:** ❌ Nenhum  
**Cobertura:** 0%

#### 4.4 Registro de Cards (`metricsCardRegistry.tsx`)

| Função | Entrada | Saída | Regras Críticas | Casos de Teste | Prioridade | Status Atual |
|--------|---------|-------|-----------------|----------------|------------|--------------|
| `getMetricsCardById()` | cardId | `MetricsCardDefinition \| undefined` | Retorna card ou undefined | 12 cards válidos, IDs inválidos | 🔴 Alta | ❌ Sem testes |
| `getMetricsCardsByDomain()` | domain | `MetricsCardDefinition[]` | Filtra cards por domínio | Financial: 5, Admin: 3, Marketing: 4 | 🔴 Alta | ❌ Sem testes |
| `canUserViewCard()` | cardId, permissions | boolean | Valida permissões do usuário | financial_access, administrative_access | 🔴 Alta | ❌ Sem testes |
| `getAllCardIds()` | - | string[] | Retorna todos os IDs | 12 IDs | 🟢 Baixa | ❌ Sem testes |
| `getDefaultCardLayout()` | cardId | GridCardLayout | Layout padrão do card | x, y, w, h, minW, minH | 🟡 Média | ❌ Sem testes |
| `isValidCardId()` | cardId | boolean | Valida se ID existe | IDs válidos/inválidos | 🟢 Baixa | ❌ Sem testes |

**Testes Existentes:** ❌ Nenhum  
**Cobertura:** 0%

#### 4.5 Página `Metrics.tsx` (Integração)

| Fluxo | Entrada | Comportamento Esperado | Tipo de Teste | Prioridade | Status Atual |
|-------|---------|------------------------|---------------|------------|--------------|
| Carregamento inicial | `/metrics` | Carrega domain=financial, primeira sub-aba, 5 cards | Integração | 🔴 Alta | ❌ Sem testes |
| Troca de domínio | Clicar "Administrativo" | Recarrega cards (3 admin), sub-aba=distribuicoes | Integração | 🔴 Alta | ❌ Sem testes |
| Troca de sub-aba | Clicar "Tendências" | Renderiza gráficos de tendências | Integração | 🔴 Alta | ❌ Sem testes |
| Filtro de período | Alterar para "Este Ano" | Re-calcula summary, trends, retention | Integração | 🔴 Alta | ❌ Sem testes |
| Layout drag & drop | Modo edição ON | Cards arrastáveis, persistência em Supabase | Integração | 🟡 Média | ❌ Sem testes |
| Permissões | Usuário sem `financial_access` | Domain "Financeiro" não aparece | Integração | 🔴 Alta | ❌ Sem testes |
| Loading states | Query em andamento | Skeletons aparecem | Integração | 🟡 Média | ❌ Sem testes |
| Empty states | Sem sessões no período | Alertas "Sem dados" | Integração | 🟡 Média | ❌ Sem testes |

**Testes Existentes:** ❌ Nenhum  
**Cobertura:** 0%

---

### 5. PERMISSÕES E ROTAS LEGADAS

| Funcionalidade | Comportamento Esperado | Tipo de Teste | Prioridade | Status Atual |
|----------------|------------------------|---------------|------------|--------------|
| `/financial` (legado) | Redireciona para `/metrics?domain=financial` | E2E | 🟡 Média | ❌ Sem testes |
| `/metrics/website` (legado) | Redireciona para `/metrics?domain=marketing&subTab=website` | E2E | 🟡 Média | ❌ Sem testes |
| Usuário sem `financial_access` | Aba "Financeiro" não aparece | Integração | 🔴 Alta | ❌ Sem testes |
| Usuário sem `administrative_access` | Aba "Administrativo" não aparece | Integração | 🔴 Alta | ❌ Sem testes |
| Usuário sem `marketing_access` | Aba "Marketing" não aparece | Integração | 🟡 Média | ❌ Sem testes |
| Usuário sem `canViewTeamFinancialSummary` | Aba "Equipe" não aparece | Integração | 🟡 Média | ❌ Sem testes |
| Contador (roleGlobal=accountant) | Acesso apenas a "Financeiro" | Integração | 🔴 Alta | ❌ Sem testes |

**Testes Existentes:** ❌ Nenhum  
**Cobertura:** 0%

---

### 6. ESTADOS ESPECIAIS

| Estado | Trigger | Comportamento Esperado | Tipo de Teste | Prioridade | Status Atual |
|--------|---------|------------------------|---------------|------------|--------------|
| Loading (cards) | Query em execução | Skeleton aparece | Componente | 🟡 Média | ✅ Testado (parcial) |
| Empty (sem sessões) | 0 sessões no período | Alert "Sem dados" | Componente | 🔴 Alta | ✅ Testado (parcial) |
| Empty (sem pacientes) | 0 pacientes ativos | Alert "Sem dados" | Componente | 🔴 Alta | ❌ Sem testes |
| Empty (sem schedule_blocks) | Taxa de ocupação sem dados | Alert ou valor 0% | Componente | 🟡 Média | ❌ Sem testes |
| Período custom sem dados | startDate > endDate ou fora do range | Alert "Período inválido" | Integração | 🟡 Média | ❌ Sem testes |
| Timezone edge cases | UTC vs local midnight | Dados corretos (sem shift de dia) | Unitário | 🔴 Alta | ✅ Testado |
| NaN/Infinity | Divisão por zero | Fallback para 0 ou mensagem | Unitário | 🔴 Alta | ✅ Testado (parcial) |
| Pacientes mensalistas | Múltiplas sessões/mês | Conta apenas 1 vez | Unitário | 🔴 Alta | ✅ Testado |

**Testes Existentes:** ✅ Parcial (systemMetricsUtils, cards)  
**Cobertura:** ~60% em edge cases

---

## 📋 SUITES DE TESTE SUGERIDAS

### Suite 1: Lógica Pura (Unitários)

**Arquivo:** `src/lib/__tests__/systemMetricsUtils.test.ts` ✅ **JÁ EXISTE**

**Testes Existentes (40+):**
- ✅ `getFinancialSummary()`: Total revenue, forecast, lost revenue, averages
- ✅ `getFinancialTrends()`: Daily/weekly/monthly aggregation, growth calculation
- ✅ `getRetentionAndChurn()`: Retention rates, new vs inactive, churn
- ✅ Edge cases: Empty datasets, invalid dates, NaN handling, timezone normalization

**Testes a Adicionar (Prioridade 🔴 Alta):**
1. `getMonthlyRevenue()`: Validar normalização UTC, contagem de meses
2. `getPatientDistribution()`: Top patients, ordenação, mensalistas
3. `getMissedRate()`: Taxa mensal correta, apenas sessões visíveis
4. `getTicketComparison()`: Mensais vs Semanais, cálculo correto
5. `getNewVsInactive()`: Novos vs Encerrados por mês, filtro de datas
6. `getRetentionRate()`: Retenção 3/6/12m, cálculo base
7. `getLostRevenueByMonth()`: Valor perdido por mês

**Arquivo:** `src/lib/__tests__/systemMetricsUtilsAdvanced.test.ts` ❌ **CRIAR NOVO**

**Testes Avançados (Prioridade 🟡 Média):**
1. **Cenários de Edge:**
   - Dataset com 10.000+ sessões (performance)
   - Período custom de 5 anos (stress test)
   - Pacientes com campos nulos (created_at, updated_at)
   - Sessões com valores negativos
   - Frequências inválidas ("invalid", null)
   
2. **Cenários de Integração:**
   - Múltiplos pacientes mensalistas no mesmo mês
   - Mudança de status (active → inactive) no meio do período
   - Sessões fora do período selecionado (devem ser ignoradas)
   - Schedule blocks sobrepondo-se
   
3. **Timezone Extremos:**
   - Transição de horário de verão
   - Datas próximas a meia-noite UTC
   - Comparação com fusos GMT-12 e GMT+14

---

### Suite 2: Hooks Customizados

**Arquivo:** `src/hooks/__tests__/useChartTimeScale.test.ts` ✅ **JÁ EXISTE**

**Testes Existentes (30+):**
- ✅ Automatic scaling: < 15 dias = daily, ≤ 90 = weekly, > 90 = monthly
- ✅ Manual overrides: setScaleOverride, clearOverride
- ✅ Auxiliary functions: generateTimeIntervals, formatTimeLabel
- ✅ Edge cases: Período de 1 dia, período de 10 anos

**Testes a Adicionar (Prioridade 🟢 Baixa):**
1. Múltiplos gráficos com overrides diferentes
2. Persist overrides entre re-renders

**Arquivo:** `src/hooks/__tests__/useDashboardLayout.test.ts` ❌ **CRIAR NOVO**

**Testes Propostos (Prioridade 🟡 Média):**
1. **CRUD de Layout:**
   - `updateLayout()`: Atualiza layout de seção
   - `saveLayout()`: Persiste em Supabase
   - `resetLayout()`: Restaura defaults, limpa Supabase/localStorage
   - `hasUnsavedChanges`: Flag de alterações pendentes
   
2. **Persistência:**
   - Salvar → Recarregar → Layout idêntico
   - Múltiplos layoutTypes (dashboard-example-grid, metrics-grid)
   - Fallback para default quando sem registro
   
3. **Edge Cases:**
   - Layout inválido (w > 12 colunas)
   - Supabase offline (fallback localStorage)
   - Conflitos de versão

---

### Suite 3: Componentes de Card (Unitários)

**Arquivos:** `src/components/cards/metrics/__tests__/` ✅ **JÁ EXISTEM (12 arquivos)**

**Cobertura Atual:** ~85% em cards numéricos

**Testes Existentes:**
- ✅ Rendering básico com props válidas
- ✅ Loading state (skeleton)
- ✅ Empty state (quando summary = null ou valores zerados)
- ✅ Formatação de valores (moeda, percentual)

**Testes a Adicionar (Prioridade 🟢 Baixa):**
1. **Props Extremos:**
   - Valores muito grandes (R$ 999.999.999,99)
   - Valores muito pequenos (R$ 0,01)
   - Percentuais > 100% ou < 0%
   
2. **Interação:**
   - Hover states (se houver tooltips)
   - Click events (se houver drill-down)

---

### Suite 4: Componentes de Gráfico (Integração)

**Diretório:** `src/components/charts/metrics/__tests__/` ❌ **CRIAR COMPLETO**

#### 4.1 Financial Charts (17 gráficos)

**Arquivo:** `src/components/charts/metrics/financial/__tests__/FinancialTrendsChart.test.tsx` ❌ **CRIAR**

**Testes Propostos (Prioridade 🔴 Alta):**
1. **Rendering:**
   - Renderiza LineChart com dados válidos
   - Duplo eixo Y (receita + sessões)
   - Labels formatados corretamente (MMM/yy)
   
2. **Estados:**
   - Loading: Skeleton aparece
   - Empty: Alert "Sem dados"
   - Com poucos dados (< 3 pontos): Ainda renderiza
   
3. **Props:**
   - `trends` com 12 meses
   - `timeScale='monthly'`
   - `periodFilter` aplicado corretamente

**Arquivo:** `src/components/charts/metrics/financial/__tests__/FinancialRevenueDistributionChart.test.tsx` ❌ **CRIAR**

**Testes Propostos (Prioridade 🔴 Alta):**
1. **PieChart:**
   - 3 fatias: Realizada, Prevista, Perdida
   - Percentuais somam 100%
   - Labels corretos
   
2. **Tooltips:**
   - Mostra valor + percentual
   
3. **Edge Cases:**
   - Receita prevista = 0 (apenas 1 fatia)
   - Receita perdida > Receita realizada (alerta?)

**Padrão para os 15 gráficos restantes:**
- Skeleton loading
- Empty state
- Props corretas (trends, summary, retention)
- Recharts rendering (snapshot test)
- Edge cases específicos do gráfico

#### 4.2 Administrative Charts (7 gráficos)

**Padrão Similar:** Skeleton, empty, props validation, edge cases

#### 4.3 Marketing Charts (1 gráfico)

**Prioridade 🟢 Baixa:** Mockado, menos crítico

#### 4.4 Team Charts (7 gráficos)

**Prioridade 🟡 Média:** Importante validar agregação por terapeuta

---

### Suite 5: Fluxos de Página (Integração)

**Arquivo:** `src/pages/__tests__/Metrics.integration.test.tsx` ❌ **CRIAR NOVO**

**Testes Propostos (Prioridade 🔴 Alta):**

1. **Carregamento Inicial:**
```typescript
it('should load financial domain by default', async () => {
  renderWithRouter(<Metrics />);
  expect(await screen.findByText('Financeiro')).toBeInTheDocument();
  expect(screen.getAllByTestId('metrics-card')).toHaveLength(5);
});
```

2. **Troca de Domínio:**
```typescript
it('should switch to administrative domain', async () => {
  renderWithRouter(<Metrics />);
  fireEvent.click(screen.getByText('Administrativo'));
  expect(await screen.findByText('Pacientes Ativos')).toBeInTheDocument();
  expect(screen.getAllByTestId('metrics-card')).toHaveLength(3);
});
```

3. **Troca de Sub-aba:**
```typescript
it('should render chart for "tendencias" subtab', async () => {
  renderWithRouter(<Metrics />);
  fireEvent.click(screen.getByText('Tendências'));
  expect(await screen.findByTestId('financial-trends-chart')).toBeInTheDocument();
});
```

4. **Filtro de Período:**
```typescript
it('should recalculate metrics when period changes', async () => {
  const { rerender } = renderWithRouter(<Metrics />);
  
  // Período: Este Ano
  expect(screen.getByText('R$ 45.000,00')).toBeInTheDocument();
  
  // Mudar para: Últimos 3 Meses
  fireEvent.click(screen.getByText('Últimos 3 Meses'));
  
  // Valor deve mudar
  await waitFor(() => {
    expect(screen.getByText('R$ 12.000,00')).toBeInTheDocument();
  });
});
```

5. **Layout Drag & Drop:**
```typescript
it('should enable edit mode and persist layout', async () => {
  renderWithRouter(<Metrics />);
  fireEvent.click(screen.getByText('Editar Layout'));
  
  // Arrastar card (mock)
  const card = screen.getByTestId('metrics-revenue-total');
  // ... simulate drag
  
  fireEvent.click(screen.getByText('Salvar'));
  expect(mockSaveLayout).toHaveBeenCalled();
});
```

6. **Permissões:**
```typescript
it('should hide financial tab for users without access', async () => {
  mockUseEffectivePermissions.mockReturnValue({
    financialAccess: 'none',
  });
  
  renderWithRouter(<Metrics />);
  expect(screen.queryByText('Financeiro')).not.toBeInTheDocument();
});
```

7. **Empty States:**
```typescript
it('should show empty state when no sessions', async () => {
  mockUseSessions.mockReturnValue({ data: [], isLoading: false });
  
  renderWithRouter(<Metrics />);
  expect(await screen.findByText('Sem dados')).toBeInTheDocument();
});
```

---

### Suite 6: Helpers e Utilitários

**Arquivo:** `src/lib/__tests__/metricsSectionsConfig.test.ts` ❌ **CRIAR NOVO**

**Testes Propostos (Prioridade 🟡 Média):**
```typescript
describe('metricsSectionsConfig', () => {
  it('should return sections for domain', () => {
    const sections = getSectionsForDomain('financial');
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Financeiro');
  });
  
  it('should return subtabs for domain', () => {
    const subtabs = getSubTabsForDomain('financial');
    expect(subtabs).toHaveLength(4);
    expect(subtabs[0].id).toBe('distribuicoes');
  });
  
  it('should return default subtab', () => {
    const defaultSubtab = getDefaultSubTabForDomain('financial');
    expect(defaultSubtab).toBe('distribuicoes');
  });
  
  it('should validate section ID', () => {
    expect(isSectionValid('metrics-financial')).toBe(true);
    expect(isSectionValid('invalid')).toBe(false);
  });
  
  it('should validate subtab for domain', () => {
    expect(isSubTabValidForDomain('tendencias', 'financial')).toBe(true);
    expect(isSubTabValidForDomain('website', 'financial')).toBe(false);
  });
});
```

**Arquivo:** `src/lib/__tests__/metricsCardRegistry.test.ts` ❌ **CRIAR NOVO**

**Testes Propostos (Prioridade 🔴 Alta):**
```typescript
describe('metricsCardRegistry', () => {
  it('should get card by ID', () => {
    const card = getMetricsCardById('metrics-revenue-total');
    expect(card).toBeDefined();
    expect(card?.title).toBe('Receita Total');
  });
  
  it('should return undefined for invalid ID', () => {
    const card = getMetricsCardById('invalid');
    expect(card).toBeUndefined();
  });
  
  it('should get cards by domain', () => {
    const financialCards = getMetricsCardsByDomain('financial');
    expect(financialCards).toHaveLength(5);
    
    const adminCards = getMetricsCardsByDomain('administrative');
    expect(adminCards).toHaveLength(3);
  });
  
  it('should check user permissions', () => {
    const canView = canUserViewCard('metrics-revenue-total', ['financial_access']);
    expect(canView).toBe(true);
    
    const cannotView = canUserViewCard('metrics-revenue-total', []);
    expect(cannotView).toBe(false);
  });
  
  it('should get all card IDs', () => {
    const ids = getAllCardIds();
    expect(ids).toHaveLength(12);
  });
  
  it('should get default layout', () => {
    const layout = getDefaultCardLayout('metrics-revenue-total');
    expect(layout).toEqual({ x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 });
  });
});
```

---

## 🔍 GAPS DE TESTES (O QUE NÃO ESTÁ COBERTO)

### Gap 1: Gráficos (0% cobertura)

**Impacto:** 🔴 **CRÍTICO**

**Problema:**
- 32 gráficos implementados, **0 testes**
- Risco alto de regressão em:
  - Agregação de dados (daily/weekly/monthly)
  - Formatação de labels (timezone)
  - Tooltips (valores, percentuais)
  - Estados especiais (empty, loading)

**Solução:**
1. Criar suite de testes para cada gráfico (padrão)
2. Prioridade: Financial (17) > Administrative (7) > Team (7) > Marketing (1)
3. Focar em: Rendering, props validation, edge cases

**Estimativa:** 40-60h de trabalho

---

### Gap 2: Integração `Metrics.tsx` (0% cobertura)

**Impacto:** 🔴 **CRÍTICO**

**Problema:**
- Página principal sem testes de integração
- Risco alto de regressão em:
  - Troca de domínio/sub-aba
  - Filtro de período
  - Drag & drop
  - Permissões

**Solução:**
1. Criar `Metrics.integration.test.tsx`
2. Testar fluxos principais (7 testes mínimos)
3. Mockar hooks (useQuery, useEffectivePermissions)

**Estimativa:** 10-15h de trabalho

---

### Gap 3: Helpers de Config (0% cobertura)

**Impacto:** 🟡 **MÉDIO**

**Problema:**
- `metricsSectionsConfig.ts` e `metricsCardRegistry.tsx` sem testes
- Risco médio de regressão em:
  - Validação de IDs
  - Filtros por domínio
  - Permissões

**Solução:**
1. Criar testes unitários simples (5-10 testes cada)
2. Validar retornos de todas as funções

**Estimativa:** 4-6h de trabalho

---

### Gap 4: Edge Cases de Timezone (Parcial)

**Impacto:** 🟡 **MÉDIO**

**Problema:**
- Apenas testes básicos de UTC
- Falta cobertura de:
  - Transição horário de verão
  - Datas próximas a meia-noite
  - Comparação entre fusos extremos

**Solução:**
1. Adicionar suite de timezone extremos em `systemMetricsUtilsAdvanced.test.ts`
2. Testar com múltiplos fusos (GMT-12, GMT+0, GMT+14)

**Estimativa:** 3-4h de trabalho

---

### Gap 5: Layout Drag & Drop (0% cobertura)

**Impacto:** 🟡 **MÉDIO**

**Problema:**
- `useDashboardLayout` sem testes
- Risco médio de regressão em:
  - Persistência em Supabase
  - Conflitos de layout
  - Reset de defaults

**Solução:**
1. Criar `useDashboardLayout.test.ts`
2. Mockar queries Supabase
3. Testar CRUD de layouts

**Estimativa:** 6-8h de trabalho

---

### Gap 6: Adaptadores de Dados (Parcial)

**Impacto:** 🟢 **BAIXO**

**Problema:**
- Funções de mapeamento (`mapPatientsToMetricsPatients`, etc.) com pouca cobertura
- Risco baixo, mas importante para integridade

**Solução:**
1. Adicionar testes em `systemMetricsUtils.test.ts`
2. Validar conversão de tipos

**Estimativa:** 2-3h de trabalho

---

## 📝 ORDEM DE ATAQUE (PRIORIZADA)

### **FASE 1: Testes Críticos de Lógica (Prioridade 🔴 Alta)**

**Objetivo:** Garantir solidez dos cálculos de métricas

**Tasks:**
1. ✅ **CONCLUÍDO:** `systemMetricsUtils.test.ts` (40+ testes) — Validado
2. ❌ **PENDENTE:** Criar `systemMetricsUtilsAdvanced.test.ts`
   - Edge cases avançados (10.000+ sessões, 5 anos, timezone extremos)
   - Estimativa: 6-8h
3. ❌ **PENDENTE:** Expandir testes de funções auxiliares
   - `getMonthlyRevenue()`, `getPatientDistribution()`, `getMissedRate()`
   - Estimativa: 4-6h

**Duração Total:** 10-14h

---

### **FASE 2: Testes de Componentes de Card (Prioridade 🟡 Média)**

**Objetivo:** Validar rendering e edge cases de cards numéricos

**Tasks:**
1. ✅ **CONCLUÍDO:** 12 card tests (financial, administrative, marketing) — Validado
2. ❌ **PENDENTE:** Expandir testes com props extremos
   - Valores muito grandes, muito pequenos, percentuais > 100%
   - Estimativa: 3-4h

**Duração Total:** 3-4h

---

### **FASE 3: Testes de Integração `Metrics.tsx` (Prioridade 🔴 Alta)**

**Objetivo:** Garantir que fluxos principais da página funcionem

**Tasks:**
1. ❌ **CRIAR:** `Metrics.integration.test.tsx`
   - 7 testes principais: carregamento, troca de domínio, sub-aba, período, drag & drop, permissões, empty
   - Estimativa: 10-15h

**Duração Total:** 10-15h

---

### **FASE 4: Testes de Gráficos (Prioridade 🔴 Alta)**

**Objetivo:** Validar rendering e lógica de 32 gráficos

**Tasks:**
1. ❌ **CRIAR:** Financial charts (17 gráficos)
   - Padrão: Skeleton, empty, props, edge cases
   - Estimativa: 25-35h
2. ❌ **CRIAR:** Administrative charts (7 gráficos)
   - Padrão similar
   - Estimativa: 10-15h
3. ❌ **CRIAR:** Team charts (7 gráficos)
   - Padrão similar
   - Estimativa: 10-15h
4. ⏩ **OPCIONAL:** Marketing chart (1 gráfico, mockado)
   - Prioridade baixa
   - Estimativa: 1-2h

**Duração Total:** 45-65h

---

### **FASE 5: Testes de Helpers (Prioridade 🟡 Média)**

**Objetivo:** Validar funções auxiliares de config

**Tasks:**
1. ❌ **CRIAR:** `metricsSectionsConfig.test.ts`
   - Validar getSectionsForDomain, getSubTabsForDomain, etc.
   - Estimativa: 3-4h
2. ❌ **CRIAR:** `metricsCardRegistry.test.ts`
   - Validar getMetricsCardById, canUserViewCard, etc.
   - Estimativa: 3-4h

**Duração Total:** 6-8h

---

### **FASE 6: Testes de Hooks (Prioridade 🟡 Média)**

**Objetivo:** Validar hooks customizados

**Tasks:**
1. ✅ **CONCLUÍDO:** `useChartTimeScale.test.ts` (30+ testes) — Validado
2. ❌ **CRIAR:** `useDashboardLayout.test.ts`
   - Validar CRUD de layouts, persistência, reset
   - Estimativa: 6-8h

**Duração Total:** 6-8h

---

### **FASE 7: Testes de Edge Cases (Prioridade 🟢 Baixa)**

**Objetivo:** Cobertura de cenários extremos

**Tasks:**
1. ❌ **ADICIONAR:** Timezone extremos
   - Transição horário de verão, fusos GMT-12/+14
   - Estimativa: 3-4h
2. ❌ **ADICIONAR:** Props extremos em cards
   - Valores gigantes, percentuais inválidos
   - Estimativa: 2-3h

**Duração Total:** 5-7h

---

## 📈 ESTIMATIVA TOTAL

| Fase | Duração | Prioridade | Status |
|------|---------|------------|--------|
| **FASE 1:** Lógica Crítica | 10-14h | 🔴 Alta | 40% concluído |
| **FASE 2:** Cards | 3-4h | 🟡 Média | 85% concluído |
| **FASE 3:** Integração Metrics.tsx | 10-15h | 🔴 Alta | 0% concluído |
| **FASE 4:** Gráficos | 45-65h | 🔴 Alta | 0% concluído |
| **FASE 5:** Helpers | 6-8h | 🟡 Média | 0% concluído |
| **FASE 6:** Hooks | 6-8h | 🟡 Média | 50% concluído |
| **FASE 7:** Edge Cases | 5-7h | 🟢 Baixa | 20% concluído |

**TOTAL:** **85-121 horas** de trabalho estimado

**Prioridade 🔴 Alta:** 65-94h (Fases 1, 3, 4)  
**Prioridade 🟡 Média:** 15-20h (Fases 2, 5, 6)  
**Prioridade 🟢 Baixa:** 5-7h (Fase 7)

---

## 🎯 CRITÉRIOS DE SUCESSO

### Cobertura Mínima Aceitável
- **Lógica de cálculo (systemMetricsUtils):** ≥ 90%
- **Componentes de card:** ≥ 85%
- **Componentes de gráfico:** ≥ 70%
- **Hooks customizados:** ≥ 85%
- **Helpers e config:** ≥ 75%
- **Integração (Metrics.tsx):** ≥ 60%

### Cobertura Ideal
- **Global:** ≥ 80%
- **Módulos críticos:** ≥ 90%

---

## 🚀 PRÓXIMOS PASSOS

1. **Revisar este plano** com o time
2. **Priorizar fases** (recomendado: 1 → 3 → 4)
3. **Alocar recursos** (1-2 devs dedicados)
4. **Implementar fase por fase** (não tudo de uma vez)
5. **Validar cobertura** após cada fase (vitest --coverage)
6. **Documentar learnings** (edge cases descobertos)

---

## ✅ CONCLUSÃO

Este plano de testes cobre **100% do escopo implementado** na TRACK C3 (R1-R10). Com **85-121 horas** de trabalho, será possível atingir:

- ✅ **≥ 80% de cobertura global**
- ✅ **≥ 90% em módulos críticos**
- ✅ **Validação completa de fluxos principais**
- ✅ **Proteção contra regressões**

**Status Atual:**
- ✅ Lógica de cálculo: ~85% (sólido)
- ✅ Cards numéricos: ~85% (bom)
- ❌ Gráficos: 0% (gap crítico)
- ❌ Integração: 0% (gap crítico)

**Recomendação:** Priorizar **FASE 3 (Integração)** e **FASE 4 (Gráficos)** antes de adicionar novas features.
