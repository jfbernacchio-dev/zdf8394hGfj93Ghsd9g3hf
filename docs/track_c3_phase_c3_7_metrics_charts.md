# 📊 FASE C3.7 — GRÁFICOS REAIS DE MÉTRICAS

## 🎯 Objetivo

Implementar **gráficos reais** nas sub-abas da página `/metrics`, utilizando Recharts para visualização de dados de tendências financeiras, desempenho operacional, retenção de pacientes e tráfego de website (mockado).

---

## ✅ Escopo Implementado

### 1. Tipos para Gráficos (`src/types/metricsChartTypes.ts`)

Criado arquivo com tipos específicos para componentes de gráficos:

- **`MetricsChartBaseProps`**: Props base para todos os gráficos
- **`FinancialTrendsChartProps`**: Props para gráficos de tendências (séries temporais)
- **`RetentionChartProps`**: Props para gráficos de retenção
- **`SessionDistributionChartProps`**: Props para gráficos de distribuição
- **`MockChartProps`**: Props para gráficos mockados (Marketing)

### 2. Componentes de Gráficos Criados

#### Domínio Financial (3 gráficos)

**`FinancialTrendsChart`** (Sub-aba: Tendências)
- **Localização**: `src/components/charts/metrics/financial/FinancialTrendsChart.tsx`
- **Tipo**: LineChart com dois eixos Y
- **Dados**: `aggregatedData.trends`
- **Visualiza**: Receita (linha) + Sessões (linha) ao longo do tempo
- **Recursos**:
  - Eixo Y esquerdo para receita (formatado como moeda)
  - Eixo Y direito para sessões
  - Tooltip com formatação contextual
  - Integração com `useChartTimeScale`
  - Skeleton e estado vazio

**`FinancialPerformanceChart`** (Sub-aba: Desempenho)
- **Localização**: `src/components/charts/metrics/financial/FinancialPerformanceChart.tsx`
- **Tipo**: ComposedChart (Bar + Line)
- **Dados**: `aggregatedData.trends`
- **Visualiza**: Sessões (barras) + Taxa de Faltas (linha) ao longo do tempo
- **Recursos**:
  - Eixo Y esquerdo para sessões
  - Eixo Y direito para taxa de faltas (%)
  - Barras arredondadas
  - Cores temáticas (destructive para faltas)

**`FinancialDistributionsChart`** (Sub-aba: Distribuições)
- **Localização**: `src/components/charts/metrics/financial/FinancialDistributionsChart.tsx`
- **Tipo**: PieChart
- **Dados**: `aggregatedData.summary` (derivado)
- **Visualiza**: Distribuição de sessões atendidas vs faltas
- **Recursos**:
  - Labels com percentuais
  - Tooltip com valores absolutos e percentuais
  - Cores temáticas consistentes

#### Domínio Administrative (3 gráficos)

**`AdminRetentionChart`** (Sub-aba: Retenção)
- **Localização**: `src/components/charts/metrics/administrative/AdminRetentionChart.tsx`
- **Tipo**: BarChart
- **Dados**: `aggregatedData.retention`
- **Visualiza**: Taxas de retenção 3m/6m/12m + Taxa de Churn
- **Recursos**:
  - 4 barras com cores diferentes
  - Domínio fixo 0-100%
  - Informações de novos pacientes e inativos no header

**`AdminPerformanceChart`** (Sub-aba: Desempenho)
- **Localização**: `src/components/charts/metrics/administrative/AdminPerformanceChart.tsx`
- **Tipo**: LineChart
- **Dados**: `aggregatedData.trends`
- **Visualiza**: Volume total de sessões ao longo do tempo
- **Recursos**:
  - Linha única com ênfase (strokeWidth: 3)
  - Foco operacional (contexto administrativo)
  - Integração com `useChartTimeScale`

**`AdminDistributionsChart`** (Sub-aba: Distribuições)
- **Localização**: `src/components/charts/metrics/administrative/AdminDistributionsChart.tsx`
- **Tipo**: PieChart (reutiliza lógica de distribuição)
- **Dados**: `aggregatedData.summary` (derivado)
- **Visualiza**: Status de sessões (contexto administrativo)
- **Recursos**:
  - Mesmo visual que FinancialDistributions
  - Texto contextualizado para administração

#### Domínio Marketing (1 gráfico mockado)

**`MarketingWebsiteOverviewChart`** (Sub-aba: Website)
- **Localização**: `src/components/charts/metrics/marketing/MarketingWebsiteOverviewChart.tsx`
- **Tipo**: LineChart
- **Dados**: Mockados (gerados dinamicamente)
- **Visualiza**: Views e Visitors dos últimos 30 dias
- **Recursos**:
  - Dados pseudo-aleatórios mas estáveis
  - Alert destacando que são dados de exemplo
  - 2 linhas (visualizações e visitantes)
  - Pronto para integração futura com Google Analytics

#### Domínio Team

- **Status**: Placeholder mantido
- **Mensagem**: "Gráficos de equipe serão implementados em fases futuras"

---

## 🔧 Integração na `/metrics`

### Alterações em `src/pages/Metrics.tsx`

1. **Novos imports** (linha 62-68):
   - Importação de todos os 7 componentes de gráficos
   - Importação de tipos `TimeScale`

2. **Novos estados derivados** (linha 403-405):
   - `trends`: array de `FinancialTrendPoint`
   - `retention`: objeto `RetentionSummary`
   - Já disponíveis de `aggregatedData`

3. **Nova função `renderChartContent()`** (linha 484-583):
   - Recebe `subTabId` atual
   - Determina `timeScale` via `getScale(chartId)`
   - Renderiza gráfico apropriado baseado em:
     - `currentDomain` (financial, administrative, marketing, team)
     - `subTabId` (tendencias, desempenho, distribuicoes, retencao, website)
   - Passa props padronizadas:
     - `trends`, `summary`, `retention`, `isLoading`
     - `periodFilter`, `timeScale`

4. **Integração nas sub-abas** (linha 714-736):
   - Substituição de placeholders "Em breve" por `renderChartContent(subTab.id)`
   - Sistema de tabs mantido idêntico
   - URLs e navegação inalteradas

---

## 📊 Fluxo de Dados

```
Metrics.tsx
  ├─ Queries (patients, sessions, profile, blocks)
  ├─ Adapters (Supabase → Metrics types)
  ├─ Aggregation (systemMetricsUtils)
  │   ├─ getFinancialSummary() → summary
  │   ├─ getFinancialTrends() → trends[]
  │   └─ getRetentionAndChurn() → retention
  ├─ useChartTimeScale({ startDate, endDate })
  │   └─ getScale(chartId) → 'daily' | 'weekly' | 'monthly'
  └─ renderChartContent(subTabId)
      ├─ Financial Charts
      │   ├─ FinancialTrendsChart (trends)
      │   ├─ FinancialPerformanceChart (trends)
      │   └─ FinancialDistributionsChart (summary)
      ├─ Administrative Charts
      │   ├─ AdminRetentionChart (retention)
      │   ├─ AdminPerformanceChart (trends)
      │   └─ AdminDistributionsChart (summary)
      ├─ Marketing Charts
      │   └─ MarketingWebsiteOverviewChart (mock)
      └─ Team Charts
          └─ [placeholder]
```

---

## 🎨 Padrões de Design Implementados

### Chart IDs para `useChartTimeScale`

Formato: `metrics-{domain}-{subTab}`

Exemplos:
- `metrics-financial-tendencias`
- `metrics-financial-desempenho`
- `metrics-administrative-retencao`

### Cores Temáticas (Semantic Tokens)

- **Primary charts**: `hsl(var(--chart-1))`
- **Secondary charts**: `hsl(var(--chart-2))`
- **Tertiary charts**: `hsl(var(--chart-3))`
- **Errors/Faltas**: `hsl(var(--destructive))`
- **Muted elements**: `hsl(var(--muted))`

### Estados de Loading

Todos os gráficos implementam:
1. **Loading**: Skeleton com altura fixa (400px)
2. **Empty**: Alert com mensagem contextual
3. **Success**: Gráfico Recharts completo

### Tooltips Personalizados

- Uso de `ChartTooltip` e `ChartTooltipContent` do shadcn/ui
- Formatação contextual:
  - Moeda para receita (`Intl.NumberFormat`)
  - Percentual para taxas (`toFixed(1)`)
  - Números inteiros para contadores

---

## 🔍 Integração com `useChartTimeScale`

### Implementação Atual

```typescript
const timeScale = getScale(`metrics-${currentDomain}-${subTabId}`);

<FinancialTrendsChart
  trends={trends}
  timeScale={timeScale}  // 'daily' | 'weekly' | 'monthly'
  ...
/>
```

### Regras Automáticas

- **≤ 2 semanas**: Escala diária
- **> 2 semanas e ≤ 3 meses**: Escala semanal
- **> 3 meses**: Escala mensal

### Exibição na UI

Todos os gráficos exibem a escala atual na `CardDescription`:

```
"Evolução de receita e sessões ao longo do tempo • Escala: Mensal"
```

---

## ⚠️ Limitações e Escopo Não Implementado

### ❌ Não Implementado Nesta Fase

1. **Comparativo "vs período anterior"**: Planejado para fase futura
2. **Controles manuais de escala**: Hook já suporta, UI não implementada ainda
3. **Gráficos de equipe (team)**: Mantido como placeholder
4. **Integração real com Google Analytics**: Marketing usa dados mockados
5. **Ocupação real no Administrative**: Placeholder mantido (0% no card)
6. **Exportação de gráficos**: Não planejado para esta track

### ✅ Mantido Intacto

- `/financial` não foi alterado
- `/metrics/website` não foi alterado
- Nenhuma alteração em RLS, schemas ou edge functions
- Nenhuma alteração em permissões além das já existentes
- Sistema de cards numéricos (C3.6) permanece inalterado

---

## 📸 Estrutura de Sub-Abas por Domínio

### Financial
- ✅ **Tendências**: LineChart (receita + sessões)
- ✅ **Desempenho**: ComposedChart (sessões + taxa de faltas)
- ✅ **Distribuições**: PieChart (status de sessões)

### Administrative
- ✅ **Distribuições**: PieChart (status de sessões)
- ✅ **Desempenho**: LineChart (volume de sessões)
- ✅ **Retenção**: BarChart (taxas 3m/6m/12m + churn)

### Marketing
- ✅ **Website**: LineChart mockado (views + visitors)

### Team
- 🔜 **Desempenho**: Placeholder
- 🔜 **Distribuições**: Placeholder
- 🔜 **Retenção**: Placeholder

---

## 🧪 Como Testar

1. **Acesse `/metrics`**
2. **Selecione um domínio** (Financial, Administrative, Marketing)
3. **Altere o período de análise** (semana, mês, ano, custom)
4. **Navegue pelas sub-abas** de cada domínio
5. **Verifique:**
   - Gráficos renderizam corretamente
   - Skeletons aparecem durante loading
   - Mensagens de "sem dados" para períodos vazios
   - Escala de tempo se ajusta automaticamente
   - Tooltips exibem dados formatados
   - Cores seguem o design system

---

## 📝 Arquivos Criados/Alterados

### Criados (10 arquivos)

1. `src/types/metricsChartTypes.ts`
2. `src/components/charts/metrics/financial/FinancialTrendsChart.tsx`
3. `src/components/charts/metrics/financial/FinancialPerformanceChart.tsx`
4. `src/components/charts/metrics/financial/FinancialDistributionsChart.tsx`
5. `src/components/charts/metrics/administrative/AdminRetentionChart.tsx`
6. `src/components/charts/metrics/administrative/AdminPerformanceChart.tsx`
7. `src/components/charts/metrics/administrative/AdminDistributionsChart.tsx`
8. `src/components/charts/metrics/marketing/MarketingWebsiteOverviewChart.tsx`
9. `docs/track_c3_phase_c3_7_metrics_charts.md` (este arquivo)

### Alterados (1 arquivo)

1. `src/pages/Metrics.tsx`
   - Imports de componentes de gráficos
   - Estados derivados (`trends`, `retention`)
   - Nova função `renderChartContent()`
   - Integração na renderização de sub-abas

---

## ✅ Critérios de Aceite - VALIDADOS

- [x] Existem componentes separados para 7 gráficos (3 financial, 3 admin, 1 marketing)
- [x] `/metrics` renderiza gráficos reais nas sub-abas corretas
- [x] `aggregatedData.trends` e `aggregatedData.retention` são consumidos
- [x] `useChartTimeScale` é usado para gráficos de tendências/desempenho
- [x] Estados de loading mostram skeletons adequados
- [x] Gráficos sem dados exibem mensagens claras
- [x] Domínio team mostra "Em breve"
- [x] Build compila sem erros
- [x] Documentação criada e atualizada
- [x] `/financial` e `/metrics/website` permanecem intactos
- [x] Nenhuma alteração em RLS, schemas ou edge functions

---

## 🚀 Próximos Passos (Fases Futuras)

1. **Comparativos vs período anterior**: Adicionar linha/barra de comparação
2. **Controles de escala manual**: UI para override de timeScale
3. **Gráficos de equipe**: Implementar domínio team completo
4. **Google Analytics**: Substituir mock por dados reais
5. **Exportação**: PDF/PNG dos gráficos
6. **Drill-down**: Clique em pontos do gráfico para detalhes

---

## 📌 Notas de Implementação

- **Recharts**: Biblioteca escolhida pela consistência com shadcn/ui Chart components
- **Responsividade**: `ResponsiveContainer` em todos os gráficos
- **Acessibilidade**: Cores com contraste adequado, labels descritivos
- **Performance**: Uso de `useMemo` para dados derivados
- **Manutenibilidade**: Estrutura de pastas clara, componentes focados
- **Extensibilidade**: Fácil adicionar novos gráficos seguindo o padrão

---

**Status**: ✅ FASE C3.7 CONCLUÍDA

**Data**: 2025-01-28

**Autor**: Lovable AI
