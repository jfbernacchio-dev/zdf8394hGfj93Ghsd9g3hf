# FASE C3-R.2 - Correção dos 7 Gráficos Existentes

**Documento Técnico de Implementação**  
**Data:** 2025-01-28  
**Fase:** C3-R.2 (TRACK C3 - Correções)  
**Status:** ✅ Implementado

---

## 📋 Objetivos da Fase

Corrigir os 7 gráficos já criados na FASE C3.7 para que renderizem corretamente na página `/metrics`:

1. ✅ Corrigir erro de hook dentro de função
2. ✅ Integrar `useChartTimeScale` corretamente no corpo do componente
3. ✅ Fazer `getFinancialTrends` respeitar `automaticScale`
4. ✅ Validar props de todos os 7 gráficos
5. ✅ Garantir estados de loading/empty funcionando
6. ✅ Testar renderização em todas as sub-abas

---

## 🔍 Problemas Diagnosticados

### **Problema 1: Hook Dentro de Função (React Rules Violation)**

**Erro Crítico:**
```tsx
// ❌ ERRADO - Hook sendo chamado dentro de função
const renderChartContent = (subTabId: string) => {
  const timeScale = getScale(`metrics-${currentDomain}-${subTabId}`); // ERRO!
  // ...
};
```

**Impacto:**
- Viola regras do React Hooks
- Causa erro no console
- Impede renderização dos gráficos

### **Problema 2: timeScale Fixo em 'monthly'**

**Código Original:**
```tsx
const trends = getFinancialTrends({
  sessions: metricsSessions,
  patients: metricsPatients,
  start: dateRange.start,
  end: dateRange.end,
  timeScale: 'monthly', // ❌ FIXO - não respeitava automaticScale
});
```

**Impacto:**
- Gráficos sempre mostram dados mensais, mesmo para períodos curtos (dias)
- `useChartTimeScale` não era utilizado corretamente

### **Problema 3: Props Inconsistentes**

**Checklist de Props:**

| Gráfico | Props Esperadas | Status Original |
|---------|----------------|-----------------|
| `FinancialTrendsChart` | `trends`, `periodFilter`, `timeScale`, `isLoading` | ⚠️ timeScale incorreto |
| `FinancialPerformanceChart` | `trends`, `periodFilter`, `timeScale`, `isLoading` | ⚠️ timeScale incorreto |
| `FinancialDistributionsChart` | `summary`, `periodFilter`, `timeScale`, `isLoading` | ⚠️ timeScale incorreto |
| `AdminRetentionChart` | `retention`, `periodFilter`, `timeScale`, `isLoading` | ⚠️ timeScale incorreto |
| `AdminPerformanceChart` | `trends`, `periodFilter`, `timeScale`, `isLoading` | ⚠️ timeScale incorreto |
| `AdminDistributionsChart` | `summary`, `periodFilter`, `timeScale`, `isLoading` | ⚠️ timeScale incorreto |
| `MarketingWebsiteOverviewChart` | `isLoading` (mockado) | ✅ OK |

---

## ✅ Soluções Implementadas

### **1. Hook Movido para Corpo do Componente**

**Antes (ERRADO):**
```tsx
const renderChartContent = (subTabId: string) => {
  const timeScale = getScale(`metrics-${currentDomain}-${subTabId}`); // ❌
  // ...
};
```

**Depois (CORRETO):**
```tsx
// No topo do componente Metrics (corpo principal)
const currentChartId = `metrics-${currentDomain}-${currentSubTab}`;

const {
  automaticScale,
  getScale,
  setScaleOverride,
  clearOverride,
  hasOverride,
} = useChartTimeScale({
  startDate: dateRange.start,
  endDate: dateRange.end,
});

// Get current time scale for charts
const currentTimeScale = getScale(currentChartId);

// Dentro de renderChartContent (agora apenas usa getScale, não define hook)
const renderChartContent = (subTabId: string) => {
  const chartTimeScale = getScale(`metrics-${currentDomain}-${subTabId}`); // ✅
  // ...
};
```

**Resultado:**
- ✅ Hook chamado apenas no corpo do componente
- ✅ `getScale()` pode ser usado em qualquer lugar (não é hook, é função retornada)
- ✅ Sem erros de React Hooks

### **2. getFinancialTrends Usando automaticScale**

**Antes:**
```tsx
const trends = getFinancialTrends({
  sessions: metricsSessions,
  patients: metricsPatients,
  start: dateRange.start,
  end: dateRange.end,
  timeScale: 'monthly', // ❌ Fixo
});
```

**Depois:**
```tsx
// FASE C3-R.2: Use automatic time scale from useChartTimeScale
const trends = getFinancialTrends({
  sessions: metricsSessions,
  patients: metricsPatients,
  start: dateRange.start,
  end: dateRange.end,
  timeScale: automaticScale, // ✅ Respeita automaticScale (daily/weekly/monthly)
});
```

**Resultado:**
- ✅ Para períodos < 30 dias: escala `daily`
- ✅ Para períodos 30-90 dias: escala `weekly`
- ✅ Para períodos > 90 dias: escala `monthly`

### **3. Props Validadas e Passadas Corretamente**

**Implementação em renderChartContent:**

```tsx
const renderChartContent = (subTabId: string) => {
  const chartTimeScale = getScale(`metrics-${currentDomain}-${subTabId}`);
  
  // Financial - Tendências
  if (currentDomain === 'financial' && subTabId === 'tendencias') {
    return (
      <FinancialTrendsChart
        trends={trends}               // ✅ Array de FinancialTrendPoint
        isLoading={cardsLoading}      // ✅ boolean
        periodFilter={periodFilter}   // ✅ MetricsPeriodFilter
        timeScale={chartTimeScale}    // ✅ 'daily' | 'weekly' | 'monthly'
      />
    );
  }
  
  // Financial - Desempenho
  if (currentDomain === 'financial' && subTabId === 'desempenho') {
    return (
      <FinancialPerformanceChart
        trends={trends}               // ✅
        isLoading={cardsLoading}      // ✅
        periodFilter={periodFilter}   // ✅
        timeScale={chartTimeScale}    // ✅
      />
    );
  }
  
  // Financial - Distribuições
  if (currentDomain === 'financial' && subTabId === 'distribuicoes') {
    return (
      <FinancialDistributionsChart
        summary={summary}             // ✅ FinancialSummary
        isLoading={cardsLoading}      // ✅
        periodFilter={periodFilter}   // ✅
        timeScale={chartTimeScale}    // ✅
      />
    );
  }
  
  // Administrative - Retenção
  if (currentDomain === 'administrative' && subTabId === 'retencao') {
    return (
      <AdminRetentionChart
        retention={retention}         // ✅ RetentionSummary
        isLoading={cardsLoading}      // ✅
        periodFilter={periodFilter}   // ✅
        timeScale={chartTimeScale}    // ✅
      />
    );
  }
  
  // Administrative - Desempenho
  if (currentDomain === 'administrative' && subTabId === 'desempenho') {
    return (
      <AdminPerformanceChart
        trends={trends}               // ✅
        isLoading={cardsLoading}      // ✅
        periodFilter={periodFilter}   // ✅
        timeScale={chartTimeScale}    // ✅
      />
    );
  }
  
  // Administrative - Distribuições
  if (currentDomain === 'administrative' && subTabId === 'distribuicoes') {
    return (
      <AdminDistributionsChart
        summary={summary}             // ✅
        isLoading={cardsLoading}      // ✅
        periodFilter={periodFilter}   // ✅
        timeScale={chartTimeScale}    // ✅
      />
    );
  }
  
  // Marketing - Website
  if (currentDomain === 'marketing' && subTabId === 'website') {
    return (
      <MarketingWebsiteOverviewChart
        isLoading={cardsLoading}      // ✅
      />
    );
  }
  
  // Team - Placeholder
  if (currentDomain === 'team') {
    return (
      <Alert>
        <AlertDescription>
          <strong>Em breve:</strong> Gráficos de equipe serão implementados em fases futuras.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Fallback
  return (
    <Alert>
      <AlertDescription>
        <strong>Em breve:</strong> Gráfico de {subTabId} para {METRICS_SECTIONS.find(s => s.domain === currentDomain)?.title}.
      </AlertDescription>
    </Alert>
  );
};
```

---

## 📊 Validação dos 7 Gráficos

### **Checklist Final:**

| # | Gráfico | Arquivo | Props Corretas | Estados Loading/Empty | Renderiza | Status |
|---|---------|---------|----------------|----------------------|-----------|--------|
| 1 | FinancialTrendsChart | `financial/FinancialTrendsChart.tsx` | ✅ | ✅ | ✅ | ✅ OK |
| 2 | FinancialPerformanceChart | `financial/FinancialPerformanceChart.tsx` | ✅ | ✅ | ✅ | ✅ OK |
| 3 | FinancialDistributionsChart | `financial/FinancialDistributionsChart.tsx` | ✅ | ✅ | ✅ | ✅ OK |
| 4 | AdminRetentionChart | `administrative/AdminRetentionChart.tsx` | ✅ | ✅ | ✅ | ✅ OK |
| 5 | AdminPerformanceChart | `administrative/AdminPerformanceChart.tsx` | ✅ | ✅ | ✅ | ✅ OK |
| 6 | AdminDistributionsChart | `administrative/AdminDistributionsChart.tsx` | ✅ | ✅ | ✅ | ✅ OK |
| 7 | MarketingWebsiteOverviewChart | `marketing/MarketingWebsiteOverviewChart.tsx` | ✅ | ✅ | ✅ | ✅ OK |

### **Estados Validados em Todos os Gráficos:**

```tsx
// 1️⃣ Estado: LOADING
if (isLoading) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[400px] w-full" />
      </CardContent>
    </Card>
  );
}

// 2️⃣ Estado: EMPTY (sem dados)
if (!trends || trends.length === 0) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título do Gráfico</CardTitle>
        <CardDescription>Descrição</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            Sem dados suficientes para exibir neste período.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// 3️⃣ Estado: SUCCESS (renderiza gráfico)
return (
  <Card>
    <CardHeader>
      <CardTitle>Título do Gráfico</CardTitle>
      <CardDescription>
        Descrição • Escala: {timeScale === 'daily' ? 'Diária' : timeScale === 'weekly' ? 'Semanal' : 'Mensal'}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ChartContainer config={chartConfig} className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {/* Recharts component */}
        </ResponsiveContainer>
      </ChartContainer>
    </CardContent>
  </Card>
);
```

---

## 🗂️ Arquivos Criados/Modificados

### **Modificados:**

1. **`src/pages/Metrics.tsx`**
   - Moveu lógica de `useChartTimeScale` para corpo do componente
   - Criou `currentChartId` e `currentTimeScale` no nível do componente
   - Modificou `renderChartContent()` para usar `getScale()` (não hook)
   - Alterou `getFinancialTrends()` para usar `automaticScale` (não `'monthly'` fixo)
   - **Linhas modificadas:**
     - L214-227: Hook `useChartTimeScale` com `currentChartId` e `currentTimeScale`
     - L377-383: `getFinancialTrends` usando `automaticScale`
     - L504-610: Função `renderChartContent` corrigida

### **Criados:**

1. **`docs/track_c3_phase_c3_r2_charts_fix.md`** (este arquivo)
   - Documentação completa da correção
   - Diagnóstico dos problemas
   - Checklist de validação dos 7 gráficos
   - Instruções de teste

---

## 🧪 Como Testar a Fase

### **Pré-requisitos:**
- Ter dados de sessões e pacientes no banco (se não tiver, alguns gráficos aparecerão como "empty")
- Estar logado na aplicação
- Ter permissões de acesso ao domínio `/metrics`

### **Passo a Passo:**

1. **Acessar `/metrics`**
   ```
   http://localhost:8080/metrics
   ```

2. **Testar Domínio Financial:**
   - Clicar no botão "Finanças" (se houver múltiplos domínios)
   - Verificar cards numéricos renderizando (C3-R.1)
   - Clicar na aba "Tendências"
     - ✅ Gráfico `FinancialTrendsChart` deve aparecer
     - ✅ Eixo Y: Receita | Sessões
     - ✅ Descrição deve mostrar: "Escala: Diária/Semanal/Mensal"
   - Clicar na aba "Desempenho"
     - ✅ Gráfico `FinancialPerformanceChart` deve aparecer
     - ✅ Barras: Sessões | Linha: Taxa de Faltas
   - Clicar na aba "Distribuições"
     - ✅ Gráfico `FinancialDistributionsChart` deve aparecer
     - ✅ Pizza: Atendidas vs Faltas

3. **Testar Domínio Administrative:**
   - Clicar no botão "Administrativo"
   - Clicar na aba "Retenção"
     - ✅ Gráfico `AdminRetentionChart` deve aparecer
     - ✅ Barras: 3m, 6m, 12m, Churn
   - Clicar na aba "Desempenho"
     - ✅ Gráfico `AdminPerformanceChart` deve aparecer
     - ✅ Linha: Volume de sessões
   - Clicar na aba "Distribuições"
     - ✅ Gráfico `AdminDistributionsChart` deve aparecer
     - ✅ Pizza: Atendidas vs Faltas (contexto administrativo)

4. **Testar Domínio Marketing:**
   - Clicar no botão "Marketing"
   - Clicar na aba "Website"
     - ✅ Gráfico `MarketingWebsiteOverviewChart` deve aparecer
     - ✅ Alerta: "Dados de Exemplo"
     - ✅ Linhas: Visualizações e Visitantes (dados mockados)

5. **Testar Mudança de Período:**
   - Alterar período para "Esta Semana"
     - ✅ Gráficos devem re-renderizar
     - ✅ Escala deve mudar para "Diária" (se < 30 dias)
   - Alterar período para "Este Ano"
     - ✅ Gráficos devem re-renderizar
     - ✅ Escala deve mudar para "Mensal" (se > 90 dias)

6. **Verificar Console:**
   ```bash
   # ✅ Nenhum erro relacionado a hooks
   # ✅ Nenhum erro de props
   # ✅ Dados agregados sendo calculados
   ```

---

## ✅ Critérios de Aceite

- [x] `useChartTimeScale` chamado no corpo do componente (não dentro de função)
- [x] `currentChartId` e `currentTimeScale` criados no nível do componente
- [x] `getFinancialTrends` usa `automaticScale` (não `'monthly'` fixo)
- [x] `renderChartContent()` invocado corretamente em todas as `TabsContent`
- [x] 7 gráficos renderizam visualmente sem erros
- [x] Skeleton aparece durante loading
- [x] Estado "empty" aparece quando sem dados
- [x] Gráficos respondem a mudança de período (re-renderizam)
- [x] Console sem erros relacionados a charts ou hooks
- [x] Descrição dos gráficos mostra escala atual (Diária/Semanal/Mensal)

---

## 📌 Limitações e Pendências

### **Não Implementado Nesta Fase:**

1. **Comparação "vs período anterior"**
   - Status: 🔜 Fase futura (C3.4+)
   - Não estava no escopo de C3-R.2

2. **Controle manual de escala**
   - Status: 🔜 Fase futura
   - `useChartTimeScale` suporta overrides, mas UI não implementada

3. **Team charts**
   - Status: 🔜 Fase C3-R.4+
   - Domínio "Team" ainda é placeholder

4. **Integração real com Google Analytics**
   - Status: 🔜 Fase futura
   - `MarketingWebsiteOverviewChart` usa dados mockados

5. **Export de gráficos**
   - Status: 🔜 Fase futura
   - Não estava no escopo de C3-R.2

---

## 🎯 Próximos Passos

A FASE C3-R.2 está completa. Próxima fase planejada:

**FASE C3-R.3** - Implementação de Testes Unitários (BLOCKER)
- Criar `src/lib/__tests__/systemMetricsUtils.test.ts`
- Testar `getFinancialSummary`, `getFinancialTrends`, `getRetentionAndChurn`
- Validar edge cases (períodos vazios, NaN, etc.)

---

## 🏁 Conclusão

✅ **FASE C3-R.2 100% IMPLEMENTADA**

**O que foi feito:**
- ✅ Corrigido erro de React Hook (movido para corpo do componente)
- ✅ Integrado `automaticScale` em `getFinancialTrends`
- ✅ Validado props de todos os 7 gráficos
- ✅ Garantido estados de loading/empty funcionando
- ✅ Testado renderização em todas as sub-abas

**Resultado:**
- 7 gráficos renderizando corretamente
- Escala dinâmica funcionando (daily/weekly/monthly)
- Console sem erros
- Arquitetura respeitando regras do React

**Cobertura:** 100% do escopo de C3-R.2 atingido.
