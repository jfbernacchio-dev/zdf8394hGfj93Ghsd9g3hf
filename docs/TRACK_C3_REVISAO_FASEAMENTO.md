# 🔬 TRACK C3 — REVISÃO CRÍTICA DO FASEAMENTO PROPOSTO

**Data:** 2025-01-15  
**Status:** 🔴 ANÁLISE CRÍTICA — AGUARDANDO VALIDAÇÃO  
**Objetivo:** Revisar o faseamento C3.1–C3.9 proposto, identificar bloqueadores e recomendar correções

---

## 📋 SUMÁRIO EXECUTIVO

### ✅ PONTOS FORTES DO PLANO
1. **Faseamento incremental** bem estruturado
2. **Separação clara** entre extração (C3.1-C3.2) e novo sistema (C3.3-C3.7)
3. **Convivência controlada** entre legado e novo (C3.8)
4. **QA embutido** em cada fase

### 🚨 BLOQUEADORES CRÍTICOS IDENTIFICADOS
1. **C3.1**: Risco de duplicação de lógica sem testes unitários
2. **C3.4**: Nome `useMetricsLayout` colide conceitualmente com `useDashboardLayout`
3. **C3.5**: Falta de especificação de como integrar cards com domínios múltiplos
4. **C3.6**: Registry separado pode quebrar sistema de permissões existente
5. **C3.8**: Redirecionamento pode causar loops infinitos se mal implementado
6. **C3.9**: Falta estratégia para migração de dados de layout salvos
7. **GERAL**: Falta de estratégia para migração de dados de layout salvos

---

## 🔍 ANÁLISE FASE A FASE

---

### 🟦 FASE C3.1 — Extração "cirúrgica" das métricas de Financial.tsx

#### ✅ PONTOS POSITIVOS
- Abordagem conservadora (copiar antes de remover)
- Escopo bem definido (16+ funções conhecidas)
- Zero risco funcional se bem executado

#### 🚨 PROBLEMAS CRÍTICOS

##### 1. **FALTA DE TESTES UNITÁRIOS**
```
❌ RISCO ALTO
Motivo: Copiar 16+ funções sem testes significa que qualquer erro
        nas assinaturas, tipos ou edge cases só será descoberto
        em runtime na FASE C3.2.
        
Solução: Adicionar mini-fase C3.1.5:
         "Criar testes unitários para systemMetricsUtils.ts antes de C3.2"
```

##### 2. **DEPENDÊNCIAS NÃO MAPEADAS**
```
⚠️ RISCO MÉDIO
Problema: O plano não menciona dependências internas que Financial.tsx usa:
          - formatBrazilianCurrency (de @/lib/brazilianFormat)
          - parseISO, format, differenceInDays (de date-fns)
          - Tipos implícitos (Patient, Session)
          
Solução: Criar interface clara em systemMetricsUtils.ts:
         
         // systemMetricsUtils.ts
         import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
         import { parseISO, format, differenceInDays } from 'date-fns';
         
         export interface MetricsPatient {
           id: string;
           name: string;
           session_value: number;
           frequency: string;
           monthly_price?: boolean;
           status: string;
           start_date?: string;
           // ... outros campos relevantes
         }
         
         export interface MetricsSession {
           id: string;
           patient_id: string;
           date: string;
           status: 'attended' | 'missed' | 'cancelled' | 'pending';
           paid: boolean;
           value: number;
           // ... outros campos relevantes
         }
```

##### 3. **FUNÇÕES NÃO LISTADAS NO PLANO**
```
⚠️ RISCO BAIXO
Problema: Financial.tsx tem funções auxiliares não mencionadas:
          - getDateRange() — converte período ('week', 'month') em Date
          - helpers de parsing de frequência (getFrequencyCount)
          
Solução: Incluir explicitamente no escopo de C3.1:
         ✅ getDateRange()
         ✅ helpers de frequência
         ✅ helpers de agrupamento por mês
```

#### 📊 ESTRUTURA RECOMENDADA PARA systemMetricsUtils.ts

```typescript
// src/lib/systemMetricsUtils.ts

import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { parseISO, format, differenceInDays, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ===========================
// TYPES
// ===========================
export interface MetricsPatient {
  id: string;
  name: string;
  session_value: number;
  frequency: string;
  monthly_price?: boolean;
  status: string;
  start_date?: string;
  organization_id?: string;
}

export interface MetricsSession {
  id: string;
  patient_id: string;
  date: string;
  status: 'attended' | 'missed' | 'cancelled' | 'pending';
  paid: boolean;
  value: number;
  organization_id?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ===========================
// HELPERS
// ===========================
export const getFrequencyCount = (frequency: string): number => {
  // ... (copiado de Financial.tsx)
};

export const getDateRange = (
  period: string,
  customStart?: string,
  customEnd?: string
): DateRange => {
  // ... (copiado de Financial.tsx)
};

// ===========================
// CORE CALCULATIONS
// ===========================

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  sessions: number;
  expected: number;
}

export const getMonthlyRevenue = (params: {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
  start: Date;
  end: Date;
}): MonthlyRevenueData[] => {
  // ... (copiado de Financial.tsx)
};

// ... (resto das 16+ funções)
```

#### ✅ CHECKLIST DE ENTREGA PARA C3.1
- [ ] `systemMetricsUtils.ts` criado com todas as funções
- [ ] Tipos explícitos exportados (`MetricsPatient`, `MetricsSession`)
- [ ] Dependências importadas (date-fns, brazilianFormat)
- [ ] Helpers auxiliares incluídos (getFrequencyCount, getDateRange)
- [ ] Comentários JSDoc em cada função
- [ ] ⚠️ **ADICIONAR**: Arquivo de testes `systemMetricsUtils.test.ts`

---

### 🟦 FASE C3.2 — Ligar Financial.tsx ao novo systemMetricsUtils

#### ✅ PONTOS POSITIVOS
- Migração controlada (mesma página, mesma rota)
- Validação funcional clara (se algo quebrar, é bug de refatoração)

#### 🚨 PROBLEMAS CRÍTICOS

##### 1. **FALTA DE ESTRATÉGIA DE ROLLBACK**
```
❌ RISCO ALTO
Problema: Se a migração quebrar em produção, não há plano B rápido.

Solução: Implementar feature flag temporária:
         
         // Financial.tsx
         const USE_NEW_METRICS = import.meta.env.VITE_USE_NEW_METRICS === 'true';
         
         const monthlyRevenue = USE_NEW_METRICS
           ? getMonthlyRevenue({ sessions, patients, start, end })
           : getMonthlyRevenueOLD(); // função inline original
```

##### 2. **TIPOS INCOMPATÍVEIS**
```
⚠️ RISCO MÉDIO
Problema: Financial.tsx usa qualquer tipo Patient/Session da query.
          systemMetricsUtils.ts precisa de MetricsPatient/MetricsSession.
          
Solução: Criar adaptadores de tipo em Financial.tsx:
         
         const metricsPatients: MetricsPatient[] = patients.map(p => ({
           id: p.id,
           name: p.name,
           session_value: p.session_value,
           frequency: p.frequency,
           monthly_price: p.monthly_price,
           status: p.status,
           start_date: p.start_date,
         }));
```

##### 3. **IMPACTO EM PERFORMANCE**
```
⚠️ RISCO BAIXO
Problema: Refatoração pode introduzir re-cálculos desnecessários.

Solução: Usar useMemo para cálculos pesados:
         
         const monthlyRevenue = useMemo(() => 
           getMonthlyRevenue({ sessions, patients, start, end }),
           [sessions, patients, start, end]
         );
```

#### ✅ CHECKLIST DE ENTREGA PARA C3.2
- [ ] `Financial.tsx` importa de `systemMetricsUtils`
- [ ] Todas as 16+ funções inline removidas
- [ ] Tipos adaptados corretamente
- [ ] `useMemo` aplicado em cálculos pesados
- [ ] ⚠️ **ADICIONAR**: Feature flag para rollback rápido
- [ ] **QA**: Comparar 3 métricas antes/depois (totalRevenue, missedRate, activePatients)

---

### 🟦 FASE C3.3 — API pública de métricas agregadas

#### ✅ PONTOS POSITIVOS
- Fachada simplifica consumo pelos cards
- Reduz duplicação de lógica

#### 🚨 PROBLEMAS CRÍTICOS

##### 1. **FALTA DE ESPECIFICAÇÃO DE RETORNO**
```
⚠️ RISCO MÉDIO
Problema: Plano menciona:
          getFinancialSummary({ sessions, patients, start, end })
          → retorna: { totalRevenue, totalSessions, ... }
          
          Mas não especifica:
          - Formato de datas nos retornos
          - Se arrays já vêm ordenados
          - Se valores são strings formatadas ou números
          
Solução: Definir interfaces explícitas:
         
         export interface FinancialSummary {
           totalRevenue: number; // em centavos
           totalSessions: number;
           missedRate: number; // 0-100
           avgPerSession: number; // em centavos
           activePatients: number;
           lostRevenue: number; // em centavos
           avgRevenuePerActivePatient: number; // em centavos
         }
         
         export interface FinancialTrend {
           label: string; // formato: "Jan/24"
           date: string; // formato: "2024-01-01"
           revenue: number; // em centavos
           sessions: number;
         }
         
         export const getFinancialSummary = (params: {
           sessions: MetricsSession[];
           patients: MetricsPatient[];
           start: Date;
           end: Date;
         }): FinancialSummary => {
           // ...
         };
         
         export const getFinancialTrends = (params: {
           sessions: MetricsSession[];
           patients: MetricsPatient[];
           start: Date;
           end: Date;
         }): FinancialTrend[] => {
           // ...
         };
```

##### 2. **CONFLITO COM SISTEMA DE TIME SCALE**
```
⚠️ RISCO MÉDIO
Problema: Plano não menciona como getFinancialTrends() se integra
          com useChartTimeScale (daily/weekly/monthly).
          
Solução: Adicionar parâmetro timeScale:
         
         export const getFinancialTrends = (params: {
           sessions: MetricsSession[];
           patients: MetricsPatient[];
           start: Date;
           end: Date;
           timeScale: 'daily' | 'weekly' | 'monthly';
         }): FinancialTrend[] => {
           // Internamente chama getMonthlyRevenue() ou similar
           // mas agrupa/formata conforme timeScale
         };
```

#### ✅ CHECKLIST DE ENTREGA PARA C3.3
- [ ] Interfaces de retorno definidas (`FinancialSummary`, `FinancialTrend`, etc.)
- [ ] Funções de fachada implementadas (`getFinancialSummary`, `getFinancialTrends`)
- [ ] Integração com `timeScale` explícita
- [ ] Documentação JSDoc com exemplos de uso
- [ ] Testes unitários para fachadas

---

### 🟦 FASE C3.4 — Esqueleto da nova página /metrics

#### ✅ PONTOS POSITIVOS
- Inspiração no DashboardExample.tsx (comprovadamente funcional)
- Infraestrutura de layout preparada antes dos cards

#### 🚨 PROBLEMAS CRÍTICOS

##### 1. **COLISÃO DE NOMES E CONCEITOS**
```
❌ RISCO ALTO - BLOQUEADOR
Problema: Plano sugere criar useMetricsLayout.ts baseado em useDashboardLayout.ts
          Isso cria confusão conceitual:
          
          - useDashboardLayout.ts → para /dashboard
          - useMetricsLayout.ts → para /metrics
          
          MAS:
          - /metrics É UM TIPO DE DASHBOARD (dashboard de métricas)
          - Ambos usam o mesmo sistema de persistência (layout_preferences)
          - Ambos usam GridCardLayout
          
Solução RECOMENDADA: UNIFICAR em vez de duplicar
         
         Opção A (RECOMENDADA): Usar useDashboardLayout.ts para ambos
         
         // src/pages/Metrics.tsx
         const {
           layout,
           loading,
           updateLayout,
           // ...
         } = useDashboardLayout('metrics-grid'); // layout_type diferente
         
         Opção B (Se realmente precisar isolar):
         Renomear para algo mais genérico:
         
         useDashboardLayout.ts → useGridLayout.ts (genérico)
         useMetricsLayout.ts → ELIMINAR, usar useGridLayout('metrics')
```

##### 2. **FALTA DE ESPECIFICAÇÃO DE TABS**
```
⚠️ RISCO MÉDIO
Problema: Plano diz "Tabs ou filtro de 'domínio' (Financial / Administrative / Team)"
          Mas não define:
          - São tabs tipo <Tabs> do Shadcn?
          - São seções colapsáveis como DashboardExample?
          - Como isso se integra com permissões?
          
Solução: Especificar claramente:
         
         RECOMENDAÇÃO: Usar SEÇÕES COLAPSÁVEIS (como DashboardExample)
         
         Motivo:
         ✅ Tabs escondem conteúdo que o usuário pode querer ver side-by-side
         ✅ Seções permitem scroll vertical natural
         ✅ Já temos o pattern funcionando em DashboardExample
         ✅ Permissões são verificadas por seção, não por tab
         
         // src/pages/Metrics.tsx
         const METRICS_SECTIONS = {
           'metrics-financial': { ... },
           'metrics-administrative': { ... },
           'metrics-team': { ... },
         };
```

##### 3. **FALTA DE INTEGRAÇÃO COM useChartTimeScale**
```
⚠️ RISCO MÉDIO
Problema: Plano diz "Uso de useChartTimeScale dentro da página"
          Mas não especifica como passar para os cards.
          
Solução: Seguir o pattern do DashboardExample.tsx:
         
         // src/pages/Metrics.tsx
         const {
           automaticScale,
           getScale,
           setScaleOverride,
           clearOverride,
           hasOverride,
         } = useChartTimeScale({ startDate, endDate });
         
         // Passar via props para os cards:
         <GridCardContainer>
           {renderMetricsCard(cardId, {
             automaticScale,
             getScale,
             setScaleOverride,
             clearOverride,
             hasOverride,
             // ... outros dados
           })}
         </GridCardContainer>
```

##### 4. **FALTA DE DEFINIÇÃO DE DADOS AGREGADOS**
```
⚠️ RISCO MÉDIO
Problema: Cards de gráficos precisam de aggregatedData pré-processada
          (como no DashboardExample). O plano não menciona isso em C3.4.
          
Solução: Adicionar cálculo de aggregatedData em Metrics.tsx:
         
         // src/pages/Metrics.tsx
         const aggregatedData = useMemo(() => {
           const intervals = generateTimeIntervals(startDate, endDate, automaticScale);
           return intervals.map(interval => {
             const { start, end } = getIntervalBounds(interval, automaticScale);
             
             const intervalSessions = sessions.filter(s => {
               const sessionDate = parseISO(s.date);
               return sessionDate >= start && sessionDate <= end;
             });
             
             return {
               label: formatTimeLabel(interval, automaticScale),
               interval,
               attended: intervalSessions.filter(s => s.status === 'attended').length,
               missed: intervalSessions.filter(s => s.status === 'missed').length,
               pending: intervalSessions.filter(s => s.status === 'pending').length,
               totalRevenue: calculateRevenueForSessions(intervalSessions, patients),
               // ...
             };
           });
         }, [sessions, patients, startDate, endDate, automaticScale]);
```

#### ✅ CHECKLIST DE ENTREGA PARA C3.4
- [ ] **DECISÃO**: Usar `useDashboardLayout('metrics-grid')` OU criar `useGridLayout` genérico
- [ ] **DECISÃO**: Usar seções colapsáveis (RECOMENDADO) ou tabs
- [ ] `Metrics.tsx` criada com estrutura base
- [ ] Filtros de período implementados (week, month, year, custom)
- [ ] `useChartTimeScale` integrado
- [ ] `aggregatedData` calculada e passada aos cards
- [ ] Permissões carregadas via `useEffectivePermissions` ou similar
- [ ] Skeleton/placeholders para seções vazias

---

### 🟦 FASE C3.5 — Definir seções e metadados de cards de métricas

#### ✅ PONTOS POSITIVOS
- Catalogação clara antes da implementação
- Permissões definidas antecipadamente

#### 🚨 PROBLEMAS CRÍTICOS

##### 1. **CONFLITO COM SISTEMA EXISTENTE**
```
❌ RISCO ALTO - BLOQUEADOR
Problema: Plano sugere criar defaultSectionsMetrics.ts separado.
          Mas o sistema atual usa:
          - defaultSectionsDashboard.ts
          - DASHBOARD_SECTIONS (exportado)
          
          Isso cria:
          - Duplicação de lógica de seções
          - Dois sistemas paralelos de configuração
          - Confusão para manutenção futura
          
Solução RECOMENDADA: UNIFICAR
         
         Opção A (RECOMENDADA): Adicionar seções de métricas no mesmo arquivo
         
         // src/lib/defaultSectionsDashboard.ts → defaultSections.ts (renomear)
         
         export const DASHBOARD_SECTIONS = { ... }; // já existe
         export const METRICS_SECTIONS = {
           'metrics-financial': { ... },
           'metrics-administrative': { ... },
           'metrics-team': { ... },
         };
         
         Opção B: Se preferir separar, criar estrutura unificada:
         
         // src/lib/sectionRegistry.ts (NOVO)
         export const SECTION_REGISTRY = {
           dashboard: DASHBOARD_SECTIONS,
           metrics: METRICS_SECTIONS,
         };
```

##### 2. **FALTA DE ESPECIFICAÇÃO DE CARDS COM DOMÍNIOS MÚLTIPLOS**
```
⚠️ RISCO MÉDIO
Problema: Plano não especifica como lidar com cards que têm
          permissionConfig com múltiplos domains.
          
          Exemplo: Um card de "Comparação Financeira vs Administrativa"
                   precisa de domains: ['financial', 'administrative']
          
Solução: Definir lógica clara em cardTypes.ts:
         
         export interface CardPermissionConfig {
           domains: PermissionDomain[]; // ARRAY, não single domain
           requiresAllDomains?: boolean; // default: true (AND lógico)
           requiresAnyDomain?: boolean; // se true, usa OR lógico
           blockedFor?: UserRole[];
           requiresFinancialAccess?: boolean;
         }
         
         // Exemplos:
         'metrics-summary-financial': {
           permissionConfig: {
             domains: ['financial'],
             requiresFinancialAccess: true,
           },
         },
         
         'metrics-financial-vs-admin': {
           permissionConfig: {
             domains: ['financial', 'administrative'],
             requiresAllDomains: true, // precisa de AMBOS
           },
         },
```

##### 3. **FALTA DE MIGRAÇÃO DE CARDS EXISTENTES**
```
⚠️ RISCO MÉDIO
Problema: Cards existentes em Financial.tsx não estão mapeados
          para os novos cardIds de métricas.
          
Solução: Criar tabela de mapeamento:
         
         | Card em Financial.tsx          | Novo cardId em Metrics         |
         |--------------------------------|--------------------------------|
         | Total Revenue (inline)         | metrics-summary-revenue        |
         | Monthly Revenue Chart (inline) | metrics-chart-monthly-revenue  |
         | Missed Rate (inline)           | metrics-chart-missed-rate      |
         | Growth Trend (inline)          | metrics-chart-growth-trend     |
         | Retention (inline)             | metrics-chart-retention        |
         | ... (completo)                 | ...                            |
```

#### ✅ CHECKLIST DE ENTREGA PARA C3.5
- [ ] **DECISÃO**: Unificar em `defaultSections.ts` (RECOMENDADO) ou criar separado
- [ ] Seções de métricas definidas (`metrics-financial`, `metrics-administrative`, `metrics-team`)
- [ ] `cardTypes.ts` estendido com novos cardIds (ex: `metrics-summary-financial`)
- [ ] Lógica de domínios múltiplos implementada (`requiresAllDomains`, `requiresAnyDomain`)
- [ ] Tabela de mapeamento: cards antigos → novos cardIds
- [ ] Permissões configuradas (`blockedFor`, `requiresFinancialAccess`)

---

### 🟦 FASE C3.6 — Registry de cards de métricas + primeiros cards simples

#### ✅ PONTOS POSITIVOS
- Início com KPIs numéricos (baixo risco)
- Pattern familiar do dashboardCardRegistry.tsx

#### 🚨 PROBLEMAS CRÍTICOS

##### 1. **DUPLICAÇÃO DE REGISTRY**
```
❌ RISCO ALTO - BLOQUEADOR
Problema: Plano sugere criar metricsCardRegistry.tsx separado.
          Mas isso cria:
          - Dois sistemas de renderização paralelos
          - Risco de inconsistência (um registry respeita permissões, outro não)
          - Manutenção duplicada
          
Solução RECOMENDADA: UNIFICAR
         
         Opção A (RECOMENDADA): Estender dashboardCardRegistry.tsx
         
         // src/lib/dashboardCardRegistry.tsx (já existe)
         
         // Adicionar cards de métricas ao mesmo arquivo:
         export const MetricsSummaryFinancial = ({ ... }: CardProps) => {
           // ...
         };
         
         export const renderCard = (cardId: string, props: CardProps) => {
           switch (cardId) {
             // Cards existentes de dashboard
             case 'dashboard-expected-revenue':
               return <DashboardExpectedRevenue {...props} />;
             
             // Cards novos de métricas
             case 'metrics-summary-financial':
               return <MetricsSummaryFinancial {...props} />;
             
             case 'metrics-chart-monthly-revenue':
               return <MetricsChartMonthlyRevenue {...props} />;
             
             // ...
             default:
               return <CardNotFound cardId={cardId} />;
           }
         };
         
         Opção B: Se preferir separar, criar camada unificada:
         
         // src/lib/cardRegistry.ts (NOVO, unificado)
         import { renderDashboardCard } from './dashboardCardRegistry';
         import { renderMetricsCard } from './metricsCardRegistry';
         
         export const renderCard = (cardId: string, props: CardProps) => {
           if (cardId.startsWith('dashboard-')) {
             return renderDashboardCard(cardId, props);
           }
           if (cardId.startsWith('metrics-')) {
             return renderMetricsCard(cardId, props);
           }
           return <CardNotFound cardId={cardId} />;
         };
```

##### 2. **FALTA DE ESPECIFICAÇÃO DE PROPS**
```
⚠️ RISCO MÉDIO
Problema: Plano não define quais props os cards de métricas receberão.
          
Solução: Reutilizar interface CardProps existente:
         
         // src/lib/dashboardCardRegistry.tsx (ou metricsCardRegistry.tsx)
         
         interface CardProps {
           isEditMode?: boolean;
           className?: string;
           patients?: MetricsPatient[]; // IMPORTANTE: usar tipos de systemMetricsUtils
           sessions?: MetricsSession[];
           profiles?: any[];
           start?: Date;
           end?: Date;
           automaticScale?: TimeScale;
           getScale?: (chartId: string) => TimeScale;
           setScaleOverride?: (chartId: string, scale: TimeScale | null) => void;
           clearOverride?: (chartId: string) => void;
           hasOverride?: (chartId: string) => boolean;
           aggregatedData?: Array<{
             label: string;
             interval: Date;
             // ... (mesma estrutura de DashboardExample)
           }>;
         }
```

##### 3. **RISCO DE DESALINHAMENTO COM systemMetricsUtils**
```
⚠️ RISCO MÉDIO
Problema: Cards podem chamar funções de systemMetricsUtils diretamente
          em vez de receber dados pré-calculados.
          
          Isso causa:
          - Re-cálculos duplicados (cada card recalcula)
          - Performance ruim
          - Inconsistências (cada card pode ter lógica diferente)
          
Solução: Cards NUNCA devem calcular, apenas renderizar:
         
         ❌ ERRADO:
         export const MetricsSummaryFinancial = ({ sessions, patients }: CardProps) => {
           const summary = getFinancialSummary({ sessions, patients, start, end });
           return <div>{summary.totalRevenue}</div>;
         };
         
         ✅ CORRETO:
         // src/pages/Metrics.tsx (calcular UMA VEZ)
         const financialSummary = useMemo(() => 
           getFinancialSummary({ sessions, patients, start, end }),
           [sessions, patients, start, end]
         );
         
         // Passar para o card:
         renderMetricsCard('metrics-summary-financial', {
           financialSummary, // dado pré-calculado
         });
         
         // Card apenas renderiza:
         export const MetricsSummaryFinancial = ({ 
           financialSummary 
         }: CardProps & { financialSummary: FinancialSummary }) => {
           return (
             <Card>
               <CardContent>
                 <div>{formatBrazilianCurrency(financialSummary.totalRevenue)}</div>
               </CardContent>
             </Card>
           );
         };
```

#### ✅ CHECKLIST DE ENTREGA PARA C3.6
- [ ] **DECISÃO**: Unificar em `dashboardCardRegistry.tsx` (RECOMENDADO) ou criar separado
- [ ] Interface `CardProps` estendida para incluir dados pré-calculados
- [ ] Cards de KPI implementados:
  - [ ] `metrics-summary-financial`
  - [ ] `metrics-lost-revenue-summary`
  - [ ] `metrics-retention-summary`
- [ ] **IMPORTANTE**: Cards NUNCA calculam, apenas renderizam
- [ ] Dados calculados UMA VEZ em `Metrics.tsx` via `useMemo`
- [ ] Permissões verificadas via `canViewCard` antes de renderizar

---

### 🟦 FASE C3.7 — Cards de gráficos de métricas

#### ✅ PONTOS POSITIVOS
- Reutilização de `useChartTimeScale`
- Pattern de gráficos já validado em DashboardExample

#### 🚨 PROBLEMAS CRÍTICOS

##### 1. **FALTA DE ESPECIFICAÇÃO DE GRÁFICOS**
```
⚠️ RISCO MÉDIO
Problema: Plano lista cards de gráficos mas não especifica:
          - Tipo de gráfico (LineChart, BarChart, PieChart, etc.)
          - Eixos (X, Y)
          - Cores
          - Tooltips
          
Solução: Especificar claramente:
         
         | Card                            | Tipo   | Eixo X      | Eixo Y       | Dados                    |
         |---------------------------------|--------|-------------|--------------|--------------------------|
         | metrics-monthly-revenue-chart   | Line   | Mês         | Receita (R$) | getFinancialTrends()     |
         | metrics-missed-rate-chart       | Bar    | Mês         | Taxa (%)     | getMissedRateTrend()     |
         | metrics-lost-revenue-by-month   | Bar    | Mês         | Valor (R$)   | getLostRevenueByMonth()  |
         | metrics-growth-trend-chart      | Line   | Mês         | Crescimento  | getGrowthTrend()         |
         | metrics-new-vs-inactive-chart   | Bar    | Mês         | Pacientes    | getNewVsInactive()       |
         | metrics-retention-chart         | Line   | Período     | Taxa (%)     | getRetentionRate()       |
```

##### 2. **FALTA DE INTEGRAÇÃO COM aggregatedData**
```
⚠️ RISCO MÉDIO
Problema: Plano não especifica se gráficos usam aggregatedData (como DashboardExample)
          ou chamam funções específicas de systemMetricsUtils.
          
Solução RECOMENDADA: Usar aggregatedData sempre que possível
         
         Motivo:
         ✅ Dados já pré-processados (performance)
         ✅ Time scale já aplicado (consistência)
         ✅ Menos props para passar aos cards
         
         // src/pages/Metrics.tsx
         const aggregatedData = useMemo(() => {
           // ... (calcula UMA VEZ)
         }, [sessions, patients, startDate, endDate, automaticScale]);
         
         // Passar para TODOS os cards de gráfico:
         renderMetricsCard('metrics-monthly-revenue-chart', {
           aggregatedData, // SEMPRE a mesma estrutura
           automaticScale,
           getScale,
           setScaleOverride,
         });
```

##### 3. **FALTA DE COMPONENTE TimeScaleSelector**
```
⚠️ RISCO BAIXO
Problema: Cards de gráfico precisam de um seletor de escala de tempo
          (daily/weekly/monthly). O plano não menciona isso.
          
Solução: Criar componente reutilizável:
         
         // src/components/TimeScaleSelector.tsx
         interface TimeScaleSelectorProps {
           chartId: string;
           currentScale: TimeScale;
           automaticScale: TimeScale;
           onScaleChange: (scale: TimeScale | null) => void;
           hasOverride: boolean;
         }
         
         export const TimeScaleSelector = ({ ... }: TimeScaleSelectorProps) => {
           return (
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="sm">
                   <Settings className="h-4 w-4 mr-2" />
                   {getScaleLabel(currentScale)}
                   {hasOverride && <Badge variant="outline">Custom</Badge>}
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent>
                 <DropdownMenuItem onClick={() => onScaleChange('daily')}>
                   Diária
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => onScaleChange('weekly')}>
                   Semanal
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => onScaleChange('monthly')}>
                   Mensal
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => onScaleChange(null)}>
                   Automática ({getScaleLabel(automaticScale)})
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           );
         };
```

#### ✅ CHECKLIST DE ENTREGA PARA C3.7
- [ ] Tabela de especificação de gráficos criada (tipo, eixos, cores)
- [ ] `TimeScaleSelector.tsx` componente criado
- [ ] Cards de gráfico implementados:
  - [ ] `metrics-monthly-revenue-chart`
  - [ ] `metrics-missed-rate-chart`
  - [ ] `metrics-lost-revenue-by-month-chart`
  - [ ] `metrics-growth-trend-chart`
  - [ ] `metrics-new-vs-inactive-chart`
  - [ ] `metrics-retention-chart`
- [ ] **IMPORTANTE**: Todos os gráficos usam `aggregatedData` (não recalculam)
- [ ] Cores usando semantic tokens (`hsl(var(--primary))`)
- [ ] Tooltips personalizados com formatação brasileira

---

### 🟦 FASE C3.8 — Passagem de bastão: /financial vs /metrics

#### ✅ PONTOS POSITIVOS
- Convivência controlada antes de desligar legado
- Feedback gradual dos usuários

#### 🚨 PROBLEMAS CRÍTICOS

##### 1. **RISCO DE LOOP INFINITO**
```
❌ RISCO ALTO
Problema: Redirecionamento mal implementado pode causar:
          /financial → /metrics?tab=financial → /financial → ...
          
Solução: Implementar com cuidado:
         
         ❌ ERRADO (pode causar loop):
         // App.tsx
         <Route path="/financial" element={<Navigate to="/metrics" />} />
         
         // Metrics.tsx
         useEffect(() => {
           if (!hasFinancialAccess) {
             navigate('/financial'); // LOOP!
           }
         }, []);
         
         ✅ CORRETO:
         // App.tsx
         <Route path="/financial" element={<FinancialLegacyWrapper />} />
         <Route path="/metrics" element={<Metrics />} />
         
         // FinancialLegacyWrapper.tsx
         export const FinancialLegacyWrapper = () => {
           const [showLegacy, setShowLegacy] = useState(false);
           
           if (showLegacy) {
             return <Financial />;
           }
           
           return (
             <div className="p-8 max-w-4xl mx-auto">
               <Alert>
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Nova Página de Métricas Disponível</AlertTitle>
                 <AlertDescription>
                   A página de métricas foi atualizada com novos recursos:
                   <ul className="list-disc ml-6 mt-2">
                     <li>Gráficos interativos com escala de tempo adaptativa</li>
                     <li>Layout personalizável (drag & drop)</li>
                     <li>Filtros avançados de período</li>
                   </ul>
                 </AlertDescription>
               </Alert>
               
               <div className="flex gap-4 mt-6">
                 <Button onClick={() => navigate('/metrics')}>
                   Ir para Nova Página
                 </Button>
                 <Button variant="outline" onClick={() => setShowLegacy(true)}>
                   Continuar com Versão Antiga
                 </Button>
               </div>
             </div>
           );
         };
```

##### 2. **FALTA DE TRACKING DE USO**
```
⚠️ RISCO BAIXO
Problema: Não sabemos quantos usuários ainda usam /financial
          vs quantos já migraram para /metrics.
          
Solução: Adicionar telemetria simples:
         
         // Financial.tsx
         useEffect(() => {
           // Log de acesso à página legada
           supabase.from('page_access_logs').insert({
             page: '/financial',
             user_id: user?.id,
             timestamp: new Date().toISOString(),
           });
         }, []);
         
         // Metrics.tsx
         useEffect(() => {
           // Log de acesso à nova página
           supabase.from('page_access_logs').insert({
             page: '/metrics',
             user_id: user?.id,
             timestamp: new Date().toISOString(),
           });
         }, []);
```

#### ✅ CHECKLIST DE ENTREGA PARA C3.8
- [ ] **IMPORTANTE**: Implementar `FinancialLegacyWrapper` (NÃO redirect direto)
- [ ] Alert de depreciação adicionado em `Financial.tsx`
- [ ] Link "Ir para nova página" funcional
- [ ] Telemetria de uso implementada (opcional mas recomendado)
- [ ] Testes de navegação:
  - [ ] `/financial` → mostra wrapper → clica "Nova Página" → `/metrics` ✅
  - [ ] `/financial` → mostra wrapper → clica "Versão Antiga" → `<Financial />` ✅
  - [ ] `/metrics` → funciona normalmente ✅
  - [ ] Nenhum loop infinito ✅

---

### 🟦 FASE C3.9 — Desligar legado financeiro com segurança

#### ✅ PONTOS POSITIVOS
- Desativação gradual e segura
- Limpeza de código legado

#### 🚨 PROBLEMAS CRÍTICOS

##### 1. **FALTA DE CRITÉRIOS DE VALIDAÇÃO**
```
⚠️ RISCO MÉDIO
Problema: Plano diz "Desligar legado depois de teste e validação manual"
          Mas não define:
          - O que constitui "validação bem-sucedida"?
          - Quanto tempo de convivência é necessário?
          - Quais métricas usar para decisão?
          
Solução: Definir critérios claros:
         
         ✅ CRITÉRIOS PARA DESLIGAR LEGADO:
         
         1. Prazo mínimo de convivência: 2 semanas
         
         2. Métricas de uso:
            - >80% dos acessos são em /metrics (vs /financial)
            - Zero bugs críticos reportados em /metrics
            - Feedback positivo de pelo menos 3 usuários-chave
         
         3. Validação funcional:
            - Todas as 16+ métricas mostram valores idênticos entre /financial e /metrics
            - Todos os gráficos renderizam corretamente
            - Permissões funcionam corretamente (admin vs subordinate)
         
         4. Performance:
            - Tempo de carregamento de /metrics ≤ /financial
            - Sem travamentos ou lags
```

##### 2. **FALTA DE PLANO DE ROLLBACK**
```
⚠️ RISCO MÉDIO
Problema: Se após desligar /financial surgir um bug crítico,
          não há plano para reverter rapidamente.
          
Solução: Manter /financial em "modo hibernação" por 1 mês:
         
         // App.tsx (versão C3.9)
         <Route path="/financial" element={<Navigate to="/metrics?tab=financial" replace />} />
         
         // MANTER Financial.tsx no código (não deletar ainda)
         // Comentar rota temporariamente:
         // <Route path="/financial-legacy" element={<Financial />} />
         
         // Em caso de emergência, reativar:
         // 1. Descomentar rota
         // 2. Deploy
         // 3. Avisar usuários via toast/email
```

##### 3. **FALTA DE MIGRAÇÃO DE LAYOUTS SALVOS**
```
❌ RISCO ALTO - BLOQUEADOR
Problema: Usuários que customizaram o layout de /financial
          perderão suas preferências ao acessar /metrics.
          
          Motivo:
          - Financial.tsx não usa useDashboardLayout (não salva em layout_preferences)
          - Metrics.tsx usa useGridLayout com layout_type: 'metrics-grid'
          - Não há migração de localStorage → Supabase
          
Solução: Implementar migração de layout:
         
         // src/lib/migrateFinancialLayout.ts
         export const migrateFinancialLayout = async (userId: string) => {
           // 1. Verificar se usuário tem layout salvo de /financial (localStorage?)
           const legacyLayout = localStorage.getItem('financial-layout');
           if (!legacyLayout) return;
           
           // 2. Converter para formato de metrics-grid
           const metricsLayout = convertLegacyLayout(JSON.parse(legacyLayout));
           
           // 3. Salvar em layout_preferences com layout_type: 'metrics-grid'
           await supabase.from('layout_preferences').upsert({
             user_id: userId,
             layout_type: 'metrics-grid',
             layout_json: metricsLayout,
           });
           
           // 4. Limpar localStorage legado
           localStorage.removeItem('financial-layout');
         };
         
         // Metrics.tsx
         useEffect(() => {
           if (user?.id) {
             migrateFinancialLayout(user.id);
           }
         }, [user]);
```

#### ✅ CHECKLIST DE ENTREGA PARA C3.9
- [ ] **IMPORTANTE**: Critérios de validação definidos e cumpridos
- [ ] Prazo mínimo de convivência respeitado (2+ semanas)
- [ ] Métricas de uso coletadas e analisadas
- [ ] **BLOQUEADOR**: Migração de layouts implementada (`migrateFinancialLayout`)
- [ ] Rota `/financial` redireciona para `/metrics?tab=financial`
- [ ] **IMPORTANTE**: `Financial.tsx` mantida em "hibernação" (não deletada)
- [ ] Rota de emergência `/financial-legacy` criada (comentada)
- [ ] `WebsiteMetrics.tsx` arquivada ou removida (se decidido)
- [ ] `DashboardOLD.tsx` removida
- [ ] Limpeza de funções mortas em `gridLayoutUtils.ts`

---

## 🎯 BLOQUEADORES CRÍTICOS GERAIS

### 1. **FALTA DE ESTRATÉGIA DE MIGRAÇÃO DE DADOS**
```
❌ RISCO CRÍTICO - BLOQUEADOR GERAL
Problema: NENHUMA fase menciona como migrar layouts salvos em:
          - layout_preferences (Supabase): layout_type: 'dashboard-example-grid'
          - localStorage (antigo sistema)
          
          Se /metrics usar layout_type: 'metrics-grid', usuários
          perderão personalizações de /dashboard ao acessar /metrics.
          
Solução: Decidir estratégia:
         
         Opção A: Compartilhar layout entre /dashboard e /metrics
         → useGridLayout('unified-grid') para AMBOS
         → Métricas são apenas mais seções no dashboard
         → Usuário tem um único layout personalizável
         
         Opção B: Layouts separados com migração opcional
         → useGridLayout('dashboard-grid') para /dashboard
         → useGridLayout('metrics-grid') para /metrics
         → Implementar botão "Importar Layout do Dashboard" em /metrics
         
         RECOMENDAÇÃO: Opção A (unificação)
```

### 2. **FALTA DE DEFINIÇÃO DE ESCOPO DE MARKETING**
```
⚠️ RISCO MÉDIO - DECISÃO NECESSÁRIA
Problema: Plano diz "Não mexemos em Website/Marketing nessa TRACK"
          Mas C3.5 reserva seção 'metrics-marketing'.
          
          Isso é contraditório. Precisa decidir:
          
          Opção A: Remover marketing completamente da C3
          → Não criar seção metrics-marketing
          → Deixar para TRACK futura (C4, C5)
          
          Opção B: Incluir marketing com dados mock
          → Criar seção metrics-marketing
          → Adicionar cards de placeholder (mock data)
          → Badge "Em Desenvolvimento"
          
          RECOMENDAÇÃO: Opção A (simplicidade)
```

### 3. **FALTA DE TESTES UNITÁRIOS**
```
⚠️ RISCO MÉDIO
Problema: Nenhuma fase menciona testes automatizados.
          Com 16+ funções de cálculo, isso é perigoso.
          
Solução: Adicionar micro-fase de testes:
         
         FASE C3.1.5 (NOVA): Criar testes para systemMetricsUtils
         
         - Testes unitários para cada função de cálculo
         - Casos de teste com dados reais (anonimizados)
         - Comparação: resultado atual (Financial.tsx) vs novo (systemMetricsUtils)
         - CI/CD: testes rodam automaticamente em cada commit
```

### 4. **FALTA DE DOCUMENTAÇÃO TÉCNICA**
```
⚠️ RISCO BAIXO
Problema: Após C3.9, código legado foi removido mas não há
          documentação de como o novo sistema funciona.
          
Solução: Criar documento de arquitetura:
         
         📄 docs/TRACK_C3_ARQUITETURA_FINAL.md
         
         Conteúdo:
         - Fluxo de dados: queries → systemMetricsUtils → Metrics.tsx → cards
         - Como adicionar nova métrica
         - Como adicionar novo card de gráfico
         - Sistema de permissões
         - Sistema de persistência de layout
         - Troubleshooting comum
```

---

## 📊 MATRIZ DE RISCOS POR FASE

| Fase  | Risco Crítico                | Risco Alto              | Risco Médio              | Status        |
|-------|------------------------------|-------------------------|--------------------------|---------------|
| C3.1  | Sem testes unitários         | —                       | Dependências não mapeadas | ⚠️ ATENÇÃO     |
| C3.2  | Sem rollback strategy        | Tipos incompatíveis     | Performance              | ⚠️ ATENÇÃO     |
| C3.3  | —                            | —                       | Time scale integration   | ✅ OK          |
| C3.4  | —                            | Colisão de nomes        | Falta spec de tabs       | 🔴 BLOQUEIO    |
| C3.5  | —                            | Conflito com sistema    | Domínios múltiplos       | 🔴 BLOQUEIO    |
| C3.6  | —                            | Duplicação de registry  | Props não definidas      | 🔴 BLOQUEIO    |
| C3.7  | —                            | —                       | Falta spec de gráficos   | ⚠️ ATENÇÃO     |
| C3.8  | Loop infinito                | —                       | Sem tracking             | 🔴 BLOQUEIO    |
| C3.9  | Migração de layouts          | —                       | Critérios vagos          | 🔴 BLOQUEIO    |

---

## 🎯 RECOMENDAÇÕES FINAIS

### ✅ APROVADO COM CORREÇÕES
O fluxo geral C3.1–C3.9 está **BEM ESTRUTURADO** mas precisa de:

### 1. **CORREÇÕES OBRIGATÓRIAS** (bloqueadores):
- **C3.4**: Unificar `useDashboardLayout` em vez de duplicar
- **C3.5**: Unificar `defaultSections.ts` em vez de duplicar
- **C3.6**: Unificar `dashboardCardRegistry.tsx` em vez de duplicar
- **C3.8**: Implementar `FinancialLegacyWrapper` (não redirect direto)
- **C3.9**: Implementar migração de layouts salvos

### 2. **ADIÇÕES NECESSÁRIAS**:
- **C3.1.5**: Criar testes unitários para `systemMetricsUtils`
- **Decisão**: Marketing - incluir ou não na C3?
- **Documentação**: Criar guia técnico final

### 3. **MELHORIAS RECOMENDADAS**:
- Feature flags para rollback rápido
- Telemetria de uso
- Componente `TimeScaleSelector` reutilizável
- Critérios de validação claros

---

## 📌 DECISÕES CRÍTICAS NECESSÁRIAS

### 🔴 BLOQUEADOR 1: Sistema de Layout
**Pergunta:** Unificar ou separar?
- **Opção A (RECOMENDADA)**: Usar `useDashboardLayout('metrics-grid')` para ambos
- **Opção B**: Criar `useGridLayout.ts` genérico

**Impacto:** Afeta C3.4, C3.9 e migração de dados

---

### 🔴 BLOQUEADOR 2: Sistema de Registry
**Pergunta:** Unificar ou separar?
- **Opção A (RECOMENDADA)**: Estender `dashboardCardRegistry.tsx`
- **Opção B**: Criar `metricsCardRegistry.tsx` separado + camada unificada

**Impacto:** Afeta C3.6, C3.7 e sistema de permissões

---

### 🔴 BLOQUEADOR 3: Sistema de Seções
**Pergunta:** Unificar ou separar?
- **Opção A (RECOMENDADA)**: Adicionar `METRICS_SECTIONS` em `defaultSectionsDashboard.ts`
- **Opção B**: Criar `defaultSectionsMetrics.ts` separado

**Impacto:** Afeta C3.5 e organização do código

---

### 🟡 DECISÃO 4: Marketing
**Pergunta:** Incluir ou não?
- **Opção A (RECOMENDADA)**: Remover completamente da C3
- **Opção B**: Incluir com dados mock e badge "Em Desenvolvimento"

**Impacto:** Afeta escopo de C3.5 e expectativas dos usuários

---

### 🟡 DECISÃO 5: Estrutura de Página
**Pergunta:** Tabs ou Seções?
- **Opção A (RECOMENDADA)**: Seções colapsáveis (como DashboardExample)
- **Opção B**: Tabs (como Shadcn Tabs)

**Impacto:** Afeta UX e C3.4

---

## 📋 PRÓXIMOS PASSOS

1. **REVISAR** este documento com a equipe
2. **DECIDIR** sobre:
   - Layout system (unificar ou separar)
   - Card registry (unificar ou separar)
   - Seções (unificar ou separar)
   - Marketing (incluir ou não)
   - Estrutura (tabs ou seções)
3. **CRIAR** especificação técnica final (FASE C3.0 TÉCNICA)
4. **APROVAR** antes de iniciar implementação

---

**Status:** 🔴 **AGUARDANDO VALIDAÇÃO E DECISÕES CRÍTICAS**

**Próxima ação:** Revisar bloqueadores e tomar decisões sobre unificações vs separações.
