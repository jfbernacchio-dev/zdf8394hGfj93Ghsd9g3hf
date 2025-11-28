# 🟦 FASE C3.5 — SEÇÕES & ESTRUTURA LÓGICA DE /metrics

## 📋 RESUMO DA FASE

**Objetivo:** Centralizar e organizar a configuração de seções, domínios e sub-abas da página `/metrics` em uma camada de configuração/registry, alinhando com a arquitetura existente de layout/sections do dashboard.

**Status:** ✅ Concluída

**Data:** 2025-01-XX

---

## 🎯 OBJETIVOS ALCANÇADOS

### 1. Registry de Seções e Sub-Abas

Criado arquivo de configuração centralizada:

- **Arquivo:** `src/lib/metricsSectionsConfig.ts`
- **Conteúdo:**
  - Tipos: `MetricsDomain`, `MetricsSectionConfig`, `MetricsSubTabConfig`
  - Arrays de configuração: `METRICS_SECTIONS`, `METRICS_SUBTABS`
  - Helpers: `getSectionsForDomain()`, `getSubTabsForDomain()`, `getDefaultSubTabForDomain()`, etc.

### 2. Seções Configuradas

Definidas 4 seções principais por domínio:

| ID                     | Domínio         | Título          | Descrição                                              |
|------------------------|-----------------|-----------------|--------------------------------------------------------|
| `metrics-financial`    | `financial`     | Financeiro      | Receita, faltas, ticket médio e indicadores financeiros |
| `metrics-administrative` | `administrative` | Administrativo  | Volume de pacientes, status e fluxo administrativo     |
| `metrics-team`         | `team`          | Equipe          | Distribuição de carga e métricas por terapeuta         |
| `metrics-marketing`    | `marketing`     | Marketing       | Indicadores de website e funil de aquisição            |

### 3. Sub-Abas Configuradas

Definidas sub-abas de gráficos por domínio:

**Financial:**
- Distribuições
- Desempenho
- Tendências

**Administrative:**
- Distribuições
- Desempenho
- Retenção

**Marketing:**
- Website

**Team:**
- Desempenho
- Distribuições
- Retenção

---

## 📁 ARQUIVOS ALTERADOS/CRIADOS

### Criados:
1. **`src/lib/metricsSectionsConfig.ts`**
   - Registry centralizado de seções e sub-abas
   - Tipos e helpers de consulta

2. **`docs/track_c3_phase_c3_5_metrics_sections.md`** (este arquivo)
   - Documentação da fase

### Modificados:
1. **`src/pages/Metrics.tsx`**
   - Removido array local `METRICS_SECTIONS`
   - Importado configuração do registry
   - Adicionado lógica de domínios visíveis baseada em permissões
   - Adicionado suporte a URL params (`domain`, `subTab`)
   - Implementado seletor de domínio na UI
   - Implementado tabs de sub-abas (ainda com placeholders)

---

## 🔄 FLUXO DE DADOS ATUAL

### 1. Determinação de Domínios Visíveis

```typescript
visibleDomains = calcular com base em:
  - permissionContext.financialAccess
  - permissionContext.roleGlobal
  - permissionContext.canAccessMarketing
  - permissionContext.canViewTeamFinancialSummary
  - isOrganizationOwner
  - isAdmin
```

### 2. Domínio Atual

```typescript
currentDomain = searchParams.get('domain') || visibleDomains[0] || 'financial'
```

### 3. Sub-Abas Disponíveis

```typescript
availableSubTabs = getSubTabsForDomain(currentDomain)
```

### 4. Sub-Aba Atual

```typescript
currentSubTab = searchParams.get('subTab') || getDefaultSubTabForDomain(currentDomain)
```

---

## 🎨 ESTRUTURA DA UI

### Layout da Página `/metrics`:

```
┌─────────────────────────────────────────┐
│ Header: "Métricas"                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Domain Selector (se > 1 visível)        │
│ [Financeiro] [Administrativo] [Team]... │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Period Filters (week/month/year/custom) │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Current Domain Section                  │
├─────────────────────────────────────────┤
│ Resumo do Período (summary metrics)     │
│ [Cards numéricos - só financial por ora]│
├─────────────────────────────────────────┤
│ Visualizações Detalhadas                │
│ Tabs: [Distribuições] [Desempenho]...   │
│ Content: Placeholders "Em breve"        │
└─────────────────────────────────────────┘
```

---

## ⚙️ INTEGRAÇÃO COM LAYOUT/PERMISSIONS

### Permissões por Domínio:

- **Financial:** Requer `financialAccess !== 'none'`
- **Administrative:** Bloqueado para `roleGlobal === 'accountant'`
- **Marketing:** Requer `canAccessMarketing`
- **Team:** Requer `canViewTeamFinancialSummary` OR `isOrganizationOwner` OR `isAdmin`

### Fallback:
Se não há `organizationId` e não é admin, assume acesso total (owner comportamento).

---

## 🔗 INTEGRAÇÃO COM OUTROS SISTEMAS

### Mantido da FASE C3.4:

✅ **Filtros de Período:**
- `period` state: `'week' | 'month' | 'year' | 'custom'`
- `dateRange` calculado: `{ start: Date, end: Date }`

✅ **Queries de Dados:**
- `patients`, `sessions`, `profile`, `schedule_blocks` (via React Query)
- Adaptadores de tipo Supabase → `MetricsPatient`, `MetricsSession`, etc.

✅ **Agregações:**
- `getFinancialSummary()`, `getFinancialTrends()`, `getRetentionAndChurn()`
- Dados prontos em `aggregatedData`

✅ **Layout Hooks:**
- `useDashboardLayout('metrics-grid')`
- `useChartTimeScale({ startDate, endDate })`

---

## 🚧 LIMITAÇÕES / PENDÊNCIAS

### Ainda NÃO Implementado (aguardando C3.6/C3.7):

❌ **Cards Reais de Métricas:**
- Nenhum card novo foi registrado em `dashboardCardRegistry`
- Nenhum novo tipo em `cardTypes.ts`
- Placeholders "Em breve" ainda estão no lugar

❌ **Gráficos com Recharts:**
- Sub-abas têm apenas placeholders
- Dados agregados prontos, mas não conectados a visualizações

❌ **Migração de /financial:**
- `/financial` continua intocado
- Nenhum redirecionamento implementado (FASE C3.8)

---

## 🎯 PRÓXIMAS FASES

### FASE C3.6 — CARDS NUMÉRICOS DE MÉTRICAS
- Registrar card IDs em `cardTypes.ts`
- Criar componentes de card numérico
- Integrar com `dashboardCardRegistry`
- Consumir dados de `aggregatedData`

### FASE C3.7 — CARDS DE GRÁFICOS
- Implementar gráficos com Recharts
- Conectar sub-abas aos cards específicos
- Usar `useChartTimeScale` para escala automática

### FASE C3.8 — MIGRAÇÃO COMPLETA DE /FINANCIAL
- Criar `FinancialLegacyWrapper`
- Redirecionar `/financial` → `/metrics?domain=financial`
- Deprecar página antiga

---

## ✅ CRITÉRIOS DE CONCLUSÃO

✔️ `metricsSectionsConfig.ts` criado com registry completo  
✔️ `Metrics.tsx` não tem mais seções hardcoded locais  
✔️ Domínio atual e sub-aba derivados de URL + registry  
✔️ Mudança de domain/sub-aba atualiza URL corretamente  
✔️ `/metrics` compila e abre normalmente  
✔️ Filtros de período, queries e agregações continuam funcionando  
✔️ Nenhum card real implementado/migrado  
✔️ Documentação criada

---

## 📝 NOTAS TÉCNICAS

### URL Params:

- **`?domain=financial`** → Define o domínio atual
- **`?subTab=distribuicoes`** → Define a sub-aba atual
- Navegação entre domínios reseta sub-aba para default do novo domínio
- Validação: se param inválido, usa default

### Helpers do Registry:

```typescript
// Obter seções de um domínio
const sections = getSectionsForDomain('financial');

// Obter sub-abas de um domínio
const subTabs = getSubTabsForDomain('financial');

// Obter sub-aba default
const defaultSubTab = getDefaultSubTabForDomain('financial'); // "distribuicoes"

// Validar seção
const isValid = isSectionValid('metrics-financial'); // true

// Validar sub-aba para domínio
const isValidSub = isSubTabValidForDomain('distribuicoes', 'financial'); // true
```

---

## 🏁 CONCLUSÃO

A FASE C3.5 estabeleceu a **fundação arquitetural** para a página `/metrics`:

✅ Configuração centralizada e reutilizável  
✅ Navegação por domínios e sub-abas via URL  
✅ Permissões corretamente integradas  
✅ Estrutura preparada para receber cards reais  
✅ Compatibilidade total com infraestrutura existente (C3.4)

**Próximo passo:** FASE C3.6 — implementar cards numéricos de métricas.
