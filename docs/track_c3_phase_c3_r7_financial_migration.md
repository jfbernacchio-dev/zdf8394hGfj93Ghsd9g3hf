# 📊 FASE C3-R.7 - Migração Completa de Financial.tsx

**Status:** 🟡 EM PROGRESSO  
**Data:** 2025-01-29  
**Fase:** C3-R.7 (TRACK C3 - Correções)  
**Prioridade:** 🟢 MÉDIA  

---

## 🎯 Objetivos

Realizar auditoria completa de `Financial.tsx` e garantir paridade 100% com `/metrics?domain=financial`, migrando ou validando todas as funcionalidades únicas.

---

## 📋 AUDITORIA COMPLETA DE FINANCIAL.TXS

### Estrutura do Arquivo
- **Total de Linhas:** 1,735
- **Componente:** `Financial` (exportado como default)
- **Última Atualização Significativa:** FASE C3.2 (integração com systemMetricsUtils)

---

## 🔍 FUNCIONALIDADES IDENTIFICADAS

### 1. **Sistema de Permissões** ✅ MIGRADO
**Localização:** Linhas 56-102

**Funcionalidades:**
- Hook `useEffectivePermissions()` para validação de acesso financeiro
- Hook `useCardPermissions()` para controle de visibilidade de cards
- Lógica de subordinado vs full therapist
- Redirect automático se usuário sem acesso

**Status:** ✅ **JÁ MIGRADO**  
**Localização em /metrics:** `src/pages/Metrics.tsx` usa os mesmos hooks
**Validação:** Não requer migração

---

### 2. **Carregamento de Dados (loadData)** ✅ MIGRADO
**Localização:** Linhas 110-211

**Funcionalidades:**
- Filtro por organização via `getUserIdsInOrganization()`
- Carregamento de pacientes, sessões, perfil, schedule_blocks
- Lógica de "full financial" vs subordinado com acesso limitado
- Query filtering baseado em permissões

**Status:** ✅ **JÁ MIGRADO**  
**Localização em /metrics:** `src/pages/Metrics.tsx` (linhas 200-400) usa lógica idêntica
**Validação:** Não requer migração

---

### 3. **Cálculo de Range de Datas (getDateRange)** ✅ MIGRADO
**Localização:** Linhas 213-232

**Funcionalidades:**
- Suporte a 4 tipos de período: custom, 3months, 6months, year
- Cálculo dinâmico de start/end dates

**Status:** ✅ **JÁ MIGRADO**  
**Localização em /metrics:** `src/hooks/usePeriodFilter.ts` implementa lógica equivalente
**Validação:** Não requer migração

---

### 4. **Adaptadores de Tipo** ✅ MIGRADO
**Localização:** Linhas 246-271

**Funcionalidades:**
- `mapPatientsToMetricsPatients()`
- `mapSessionsToMetricsSessions()`

**Status:** ✅ **JÁ MIGRADO**  
**Localização em /metrics:** Mesma lógica usada em `Metrics.tsx`
**Validação:** Não requer migração

---

### 5. **Feature Flag (USE_NEW_METRICS)** ✅ LEGADO
**Localização:** Linhas 53, 788+

**Funcionalidades:**
- Flag para alternar entre versão antiga e nova dos cálculos
- `VITE_USE_NEW_METRICS` env variable

**Status:** ✅ **LEGADO - PODE SER REMOVIDO**  
**Justificativa:** systemMetricsUtils.ts é a versão definitiva. Código antigo não é mais necessário.
**Ação:** Deprecar ou remover código condicional

---

### 6. **Funções de Cálculo ANTIGAS** ⚠️ LEGADO
**Localização:** Linhas 274-768

**Funções Identificadas:**
- `getMonthlyRevenueOLD()`
- `getPatientDistributionOLD()`
- `getMissedRateOLD()`
- `getAvgRevenuePerPatientOLD()`
- `calculateTotalRevenueOLD()`
- `calculateTotalSessionsOLD()`
- `calculateMissedRateOLD()`
- `calculateAvgPerSessionOLD()`
- `calculateActivePatientsOLD()`
- `getMissedByPatientOLD()`
- `getMissedDistributionOLD()`
- `calculateLostRevenueOLD()`
- `getForecastRevenueOLD()`
- `calculateOccupationRateOLD()`
- `getTicketComparisonOLD()`
- `getGrowthTrendOLD()`
- `getNewVsInactiveOLD()`
- `getRetentionRateOLD()`
- `getLostRevenueByMonthOLD()`

**Status:** ⚠️ **LEGADO - PODE SER REMOVIDO**  
**Justificativa:** Todas as funções têm equivalente "NEW" em `systemMetricsUtils.ts`  
**Ação:** Marcar como deprecated ou remover completamente

---

### 7. **Controles de UI - Header** ⚠️ AVALIAR PARIDADE
**Localização:** Linhas 1061-1142

**Funcionalidades:**
- Selector de período (3 meses / 6 meses / ano / custom)
- Date pickers para período custom (Popover + Calendar)
- Botão "Registrar Pagamento NFSe" (RegisterPaymentDialog)

#### Validação Necessária:

| Funcionalidade | Em /metrics? | Status | Ação |
|----------------|--------------|--------|------|
| Selector de período | ✅ Sim | OK | Validar visualmente |
| Date pickers custom | ✅ Sim | OK | Validar visualmente |
| Botão "Registrar Pagamento" | ❓ Verificar | AVALIAR | Verificar se está presente |

**Ação:** Validar presença do botão "Registrar Pagamento NFSe" em `/metrics?domain=financial`

---

### 8. **Cards Numéricos** ✅ MIGRADO
**Localização:** Linhas 1143-1281

**8 Cards Identificados:**
1. Receita Total
2. Previsão de Receita
3. Taxa de Faltas
4. Sessões Realizadas
5. Ticket Médio por Sessão
6. Taxa de Ocupação
7. Pacientes Ativos
8. Faturamento Médio por Paciente

**Status:** ✅ **JÁ MIGRADO**  
**Localização em /metrics:** `src/components/cards/metrics/financial/` (12 cards implementados)
**Validação:** Cards já implementados na FASE C3.6

---

### 9. **Tabs de Visualização** ⚠️ AVALIAR PARIDADE
**Localização:** Linhas 1282-1730

#### Tab 1: "overview" (Visão Geral)

**Gráficos:**
1. **Resumo Mensal** (LineChart)
   - Receita por mês
   - Sessões realizadas vs esperadas
   - Pacientes encerrados por mês
   
2. **Evolução de Receita** (AreaChart)
   - Tendência de crescimento/declínio
   
3. **Faturamento por Paciente - Top 10** (BarChart)
   - Faturamento total + média por sessão
   
4. **Previsão vs Realizado** (BarChart)
   - Receita prevista vs receita real por mês

**Status:** ⚠️ **AVALIAR**  
**Ação:** Verificar se `/metrics?domain=financial&subTab=tendencias` possui esses gráficos

---

#### Tab 2: "distribution" (Distribuição)

**Gráficos:**
1. **Distribuição de Receita por Paciente** (PieChart)
   - Percentual de receita por paciente
   
2. **Ticket Médio: Mensais vs Semanais** (BarChart)
   - Comparação de ticket médio entre pacientes mensais e semanais

**Status:** ⚠️ **AVALIAR**  
**Ação:** Verificar se `/metrics?domain=financial&subTab=distribuicoes` possui esses gráficos

---

#### Tab 3: "performance" (Desempenho)

**Gráficos:**
1. **Taxa de Faltas por Mês** (LineChart)
   - Taxa percentual mensal de faltas
   
2. **Pacientes Encerrados por Mês** (BarChart)
   - Número de fichas encerradas mensalmente
   
3. **Faltas por Paciente** (BarChart horizontal)
   - Faltas individuais por paciente
   
4. **Valor Perdido por Faltas** (BarChart)
   - Receita não realizada devido a faltas

**Status:** ⚠️ **AVALIAR**  
**Ação:** Verificar se `/metrics?domain=financial&subTab=desempenho` possui esses gráficos

---

#### Tab 4: "retention" (Retenção)

**Gráficos:**
1. **Taxa de Retenção de Pacientes** (BarChart)
   - Retenção em 3m / 6m / 12m
   
2. **Pacientes Novos vs Encerrados** (BarChart)
   - Comparativo mensal de cadastros vs encerrados

**Status:** ⚠️ **AVALIAR**  
**Ação:** Verificar se `/metrics?domain=financial&subTab=retencao` existe e possui esses gráficos

---

## 📊 CHECKLIST DE VALIDAÇÃO

### FASE 1: Validação de Gráficos Existentes

- [ ] **1.1** Acessar `/metrics?domain=financial&subTab=tendencias`
  - [ ] Verificar se possui "Resumo Mensal" (receita + sessões)
  - [ ] Verificar se possui "Evolução de Receita" (tendência)
  - [ ] Verificar se possui "Faturamento por Paciente - Top 10"
  - [ ] Verificar se possui "Previsão vs Realizado"

- [ ] **1.2** Acessar `/metrics?domain=financial&subTab=distribuicoes`
  - [ ] Verificar se possui "Distribuição de Receita por Paciente" (PieChart)
  - [ ] Verificar se possui "Ticket Médio: Mensais vs Semanais"

- [ ] **1.3** Acessar `/metrics?domain=financial&subTab=desempenho`
  - [ ] Verificar se possui "Taxa de Faltas por Mês"
  - [ ] Verificar se possui "Pacientes Encerrados por Mês"
  - [ ] Verificar se possui "Faltas por Paciente"
  - [ ] Verificar se possui "Valor Perdido por Faltas"

- [ ] **1.4** Verificar se sub-aba `retencao` existe
  - [ ] Se não existe, marcar para criação
  - [ ] Se existe, verificar presença dos 2 gráficos

- [ ] **1.5** Verificar presença do botão "Registrar Pagamento NFSe"
  - [ ] Se não existe, marcar para adição

---

### FASE 2: Implementar Funcionalidades Faltantes

#### Se algum gráfico estiver faltando:

- [ ] **2.1** Identificar qual gráfico está ausente
- [ ] **2.2** Criar componente do gráfico em `src/components/charts/metrics/financial/`
- [ ] **2.3** Integrar em `src/pages/Metrics.tsx` (função `renderChartContent()`)
- [ ] **2.4** Testar renderização e validação de dados

#### Se sub-aba `retencao` não existir:

- [ ] **2.5** Adicionar `retencao` em `metricsSectionsConfig.ts`
- [ ] **2.6** Criar 2 gráficos de retenção
- [ ] **2.7** Integrar em `renderChartContent()`

#### Se botão "Registrar Pagamento" estiver faltando:

- [ ] **2.8** Adicionar botão no header de `/metrics?domain=financial`
- [ ] **2.9** Importar e usar `RegisterPaymentDialog`
- [ ] **2.10** Testar funcionalidade

---

### FASE 3: Validação de Paridade Visual e de Dados

- [ ] **3.1** Abrir `/financial` lado-a-lado com `/metrics?domain=financial`
- [ ] **3.2** Comparar cards numéricos:
  - [ ] Receita Total
  - [ ] Previsão de Receita
  - [ ] Taxa de Faltas
  - [ ] Sessões Realizadas
  - [ ] Ticket Médio
  - [ ] Taxa de Ocupação
  - [ ] Pacientes Ativos
  - [ ] Faturamento Médio

- [ ] **3.3** Comparar cada gráfico visualmente
- [ ] **3.4** Validar que TODOS os dados batem (valores idênticos)
- [ ] **3.5** Testar mudança de período (3m / 6m / ano / custom)
- [ ] **3.6** Validar que filtros afetam todos os gráficos igualmente

---

### FASE 4: Deprecação de Financial.tsx

#### Opção A: Deprecar (Recomendado)

- [ ] **4.1** Adicionar comentário `@deprecated` no topo do arquivo
- [ ] **4.2** Adicionar aviso visual na UI indicando migração para `/metrics`
- [ ] **4.3** Manter código intacto como referência histórica

#### Opção B: Remover Completamente

- [ ] **4.1** Deletar `src/pages/Financial.tsx`
- [ ] **4.2** Verificar que nenhum arquivo importa `Financial`
- [ ] **4.3** Confirmar que rota `/financial` redireciona para `/metrics?domain=financial`

---

## 🎯 DECISÃO DE IMPLEMENTAÇÃO

**Aguardando Validação:** Preciso verificar estado atual de `/metrics?domain=financial` antes de prosseguir.

### Próximos Passos:

1. **Rodar navegador** e acessar `/metrics?domain=financial`
2. **Navegar por todas as sub-abas** e documentar o que existe
3. **Criar lista definitiva** do que falta implementar
4. **Implementar funcionalidades faltantes** (se houver)
5. **Validar paridade 100%** entre Financial.tsx e /metrics
6. **Deprecar ou remover** Financial.tsx

---

## 📝 NOTAS TÉCNICAS

### Sobre o Feature Flag `USE_NEW_METRICS`

**Contexto:**  
- Flag criada na FASE C3.2 para permitir rollback
- Controla uso de funções antigas (_OLD) vs novas (_NEW)
- Atualmente hardcoded como `false` (usa versões antigas)

**Recomendação:**  
- Remover flag após validação completa
- Manter apenas funções NEW (em systemMetricsUtils.ts)
- Deletar todas as funções _OLD (linhas 274-768)

### Sobre Funções _OLD

**Total:** 19 funções antigas (500+ linhas de código legado)

**Ação Recomendada:**  
Após validação de paridade, criar PR separado para:
1. Remover feature flag `USE_NEW_METRICS`
2. Remover todas as funções _OLD
3. Simplificar useMemo hooks (sempre usar versões NEW)
4. Reduzir Financial.tsx de 1,735 → ~1,200 linhas

---

## ✅ Critérios de Aceite C3-R.7

- [ ] Checklist completo de funcionalidades de `Financial.tsx`
- [ ] 100% das funcionalidades migradas ou confirmadas como desnecessárias
- [ ] Paridade visual e de dados validada
- [ ] `Financial.tsx` deprecado ou removido
- [ ] Zero regressões em `/metrics?domain=financial`
- [ ] Documentação atualizada com decisões tomadas

---

## 📊 MAPEAMENTO COMPLETO: Financial.tsx ↔ /metrics

### Gráficos JÁ IMPLEMENTADOS em /metrics

#### Sub-aba: `distribuicoes`
| Gráfico em Financial.tsx | Componente em /metrics | Status |
|--------------------------|------------------------|--------|
| Distribuição de Receita por Paciente | `FinancialRevenueDistributionChart` | ✅ OK |
| (Status de Sessões) | `FinancialDistributionsChart` | ✅ OK |
| (Status de Sessões - alternativo) | `FinancialSessionStatusChart` | ✅ OK |

#### Sub-aba: `desempenho`
| Gráfico em Financial.tsx | Componente em /metrics | Status |
|--------------------------|------------------------|--------|
| Taxa de Faltas por Mês | `FinancialPerformanceChart` | ✅ OK |
| (Performance Mensal) | `FinancialMonthlyPerformanceChart` | ✅ OK |
| (Comparação Semanal) | `FinancialWeeklyComparisonChart` | ✅ OK |

#### Sub-aba: `tendencias`
| Gráfico em Financial.tsx | Componente em /metrics | Status |
|--------------------------|------------------------|--------|
| Resumo Mensal (receita + sessões) | `FinancialTrendsChart` | ✅ OK |
| Evolução de Receita | `FinancialRevenueTrendChart` | ✅ OK |
| Previsão vs Realizado | `FinancialForecastVsActualChart` | ✅ OK |
| Taxa de Conversão | `FinancialConversionRateChart` | ✅ OK |

**Total de gráficos já migrados:** 10 gráficos ✅

---

### Gráficos FALTANTES em /metrics

#### ❌ FALTAM 5 GRÁFICOS:

1. **Ticket Médio: Mensais vs Semanais** (BarChart)
   - Tab original: `distribution`
   - Função: `getTicketComparison()` ✅ já existe em systemMetricsUtils.ts
   - **Ação:** Criar `FinancialTicketComparisonChart.tsx`

2. **Pacientes Encerrados por Mês** (BarChart)
   - Tab original: `performance`
   - Dados: `monthlyData[].encerrados`
   - Função: Dados já presentes em `trends` (campo `inactiveCount`)
   - **Ação:** Criar `FinancialInactiveByMonthChart.tsx`

3. **Faltas por Paciente** (BarChart horizontal)
   - Tab original: `performance`
   - Função: `getMissedByPatient()` ✅ já existe em systemMetricsUtils.ts
   - **Ação:** Criar `FinancialMissedByPatientChart.tsx`

4. **Valor Perdido por Faltas** (BarChart)
   - Tab original: `performance`
   - Função: `getLostRevenueByMonth()` ✅ já existe em systemMetricsUtils.ts
   - **Ação:** Criar `FinancialLostRevenueChart.tsx`

5. **Taxa de Retenção de Pacientes** (BarChart - 3m/6m/12m)
   - Tab original: `retention`
   - Função: `getRetentionRate()` ✅ já existe em systemMetricsUtils.ts
   - **Ação:** Criar `FinancialRetentionRateChart.tsx`

6. **Pacientes Novos vs Encerrados** (BarChart)
   - Tab original: `retention`
   - Função: `getNewVsInactive()` ✅ já existe em systemMetricsUtils.ts
   - **Ação:** Criar `FinancialNewVsInactiveChart.tsx`

---

### ❌ FALTA SUB-ABA: `retencao`

**Status Atual:** Domain `financial` tem apenas 3 sub-abas:
- distribuicoes ✅
- desempenho ✅
- tendencias ✅

**Ação Necessária:**
- Adicionar sub-aba `retencao` em `metricsSectionsConfig.ts`
- Adicionar 2 gráficos de retenção nessa sub-aba

---

### ❌ FALTA BOTÃO: "Registrar Pagamento NFSe"

**Status Atual:** Não identificado em `/metrics?domain=financial`

**Ação Necessária:**
- Adicionar botão `RegisterPaymentDialog` no header de `/metrics` quando `currentDomain === 'financial'`

---

## 🛠️ IMPLEMENTAÇÃO NECESSÁRIA

### Arquivos a CRIAR (6 novos gráficos):

1. `src/components/charts/metrics/financial/FinancialTicketComparisonChart.tsx`
2. `src/components/charts/metrics/financial/FinancialInactiveByMonthChart.tsx`
3. `src/components/charts/metrics/financial/FinancialMissedByPatientChart.tsx`
4. `src/components/charts/metrics/financial/FinancialLostRevenueChart.tsx`
5. `src/components/charts/metrics/financial/FinancialRetentionRateChart.tsx`
6. `src/components/charts/metrics/financial/FinancialNewVsInactiveChart.tsx`

### Arquivos a MODIFICAR:

1. **`src/lib/metricsSectionsConfig.ts`**
   - Adicionar sub-aba `retencao` ao domain `financial`

2. **`src/pages/Metrics.tsx`**
   - Importar os 6 novos gráficos
   - Adicionar gráfico #1 em `subTabId === 'distribuicoes'`
   - Adicionar gráficos #2, #3, #4 em `subTabId === 'desempenho'`
   - Adicionar sub-aba `retencao` com gráficos #5 e #6
   - Adicionar botão "Registrar Pagamento NFSe" no header

---

## 🚧 STATUS ATUAL

**Fase Atual:** 📝 **AUDITORIA CONCLUÍDA**  
**Próximo Passo:** Implementação dos 6 gráficos faltantes + sub-aba retencao + botão NFSe  

**Resumo:**
- ✅ 10 gráficos já migrados e funcionais
- ❌ 6 gráficos faltando (mas funções de cálculo já existem)
- ❌ 1 sub-aba faltando (`retencao`)
- ❌ 1 botão faltando ("Registrar Pagamento NFSe")

---

**Implementado por:** Lovable AI  
**Data de Início:** 2025-01-29  
**Status:** 🟡 EM PROGRESSO - AUDITORIA COMPLETA
