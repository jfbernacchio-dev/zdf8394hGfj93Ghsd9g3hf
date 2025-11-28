# 🟦 FASE C3.9 — MIGRAÇÃO LEGADA DE /metrics/website → /metrics?domain=marketing

## 📋 OBJETIVO

Realizar a migração suave da rota legada `/metrics/website` para o novo sistema unificado de métricas em `/metrics?domain=marketing&subTab=website`, garantindo:

1. **Backwards compatibility** para links antigos ou favoritos dos usuários
2. **Fonte única da verdade** para métricas de website dentro de `/metrics`
3. **Preservação de query params** (período, datas) durante o redirect
4. **Zero impacto** nas funcionalidades C3.4–C3.8

---

## 📂 ARQUIVOS CRIADOS

### 1. `src/pages/MetricsWebsiteLegacyWrapper.tsx`

Componente wrapper responsável por:
- Interceptar acessos a `/metrics/website`
- Ler query params legados:
  - `period` (week, month, year, custom)
  - `start`, `end` (datas ISO)
  - `customStartDate`, `customEndDate` (variantes de datas custom)
- Mapear para a nova estrutura:
  - Sempre forçar `domain=marketing`
  - Sempre forçar `subTab=website`
  - Preservar período e datas
- Redirecionar com `navigate({ replace: true })` para evitar entrada extra no histórico
- Exibir mensagem amigável: "Redirecionando para as métricas de website..."

---

## 📝 ARQUIVOS MODIFICADOS

### 1. `src/App.tsx`

**Linha 18:** Adicionado import do wrapper:
```tsx
import { MetricsWebsiteLegacyWrapper } from "./pages/MetricsWebsiteLegacyWrapper";
```

**Linha 194:** Rota `/metrics/website` atualizada:
```tsx
// ANTES (C3.8)
<Route path="/metrics/website" element={
  <ProtectedRoute>
    <PermissionRoute path="/website-metrics">
      <Layout>
        <WebsiteMetrics />
      </Layout>
    </PermissionRoute>
  </ProtectedRoute>
} />

// DEPOIS (C3.9)
<Route path="/metrics/website" element={
  <ProtectedRoute>
    <PermissionRoute path="/website-metrics">
      <Layout>
        <MetricsWebsiteLegacyWrapper />
      </Layout>
    </PermissionRoute>
  </ProtectedRoute>
} />
```

**Proteções mantidas:**
- `<ProtectedRoute>` (autenticação)
- `<PermissionRoute path="/website-metrics">` (autorização)
- `<Layout>` (UI consistente)

---

## 🔄 LÓGICA DE REDIRECT

### Cenários de Uso

#### 1. Redirect Básico
```
Acesso: /metrics/website
Redirect: /metrics?domain=marketing&subTab=website
```

#### 2. Com Período Mensal
```
Acesso: /metrics/website?period=month
Redirect: /metrics?domain=marketing&subTab=website&period=month
```

#### 3. Com Período Custom
```
Acesso: /metrics/website?period=custom&start=2025-01-01&end=2025-01-31
Redirect: /metrics?domain=marketing&subTab=website&period=custom&start=2025-01-01&end=2025-01-31
```

#### 4. Com Datas Customizadas (variante)
```
Acesso: /metrics/website?customStartDate=2025-01-01&customEndDate=2025-01-31
Redirect: /metrics?domain=marketing&subTab=website&customStartDate=2025-01-01&customEndDate=2025-01-31
```

---

## ✅ VERIFICAÇÃO DE CONFIGURAÇÃO

### 1. `src/lib/metricsSectionsConfig.ts`

**Domínio Marketing já configurado:**
```ts
// Linha 103-108
{ 
  id: 'website', 
  domain: 'marketing', 
  label: 'Website', 
  chartCategory: 'website' 
}
```

**Default sub-tab:**
```ts
export function getDefaultSubTabForDomain(domain: MetricsDomain): string | undefined {
  const subTabs = getSubTabsForDomain(domain);
  return subTabs[0]?.id; // Para marketing, retorna 'website' (única sub-aba)
}
```

### 2. Navbar (C3.8)

Links já apontam para a nova estrutura:
```tsx
<Link to="/metrics?domain=marketing">Métricas de Marketing</Link>
```

---

## 🧪 TESTES REALIZADOS

### ✅ Redirect Básico
- [x] Acessar `/metrics/website`
- [x] Redireciona para `/metrics?domain=marketing&subTab=website`
- [x] Não cria loop de redirect
- [x] Botão "voltar" funciona normalmente

### ✅ Preservação de Período
- [x] Acessar `/metrics/website?period=month`
- [x] URL final contém `period=month`
- [x] Filtro de período reflete "Mês" corretamente

### ✅ Preservação de Datas Custom
- [x] Acessar `/metrics/website?period=custom&start=2025-01-01&end=2025-01-31`
- [x] URL final preserva ambas as datas
- [x] DatePicker reflete o intervalo correto

### ✅ Navegação Normal
- [x] Menu "Métricas de Marketing" funciona
- [x] Domínio `marketing` carrega cards mockados
- [x] Sub-aba `website` exibe gráfico mockado
- [x] Alert de "dados de exemplo" presente

### ✅ Permissões
- [x] Usuários sem acesso a marketing são bloqueados
- [x] `PermissionRoute` continua funcionando
- [x] Comportamento idêntico ao de `/metrics/website` (legado)

---

## 🚫 FORA DO ESCOPO (NÃO FEITO)

- ❌ Não deletamos `WebsiteMetrics.tsx` (mantido como referência)
- ❌ Não alteramos `systemMetricsUtils.ts`
- ❌ Não mexemos em RLS, schemas ou edge functions
- ❌ Não alteramos cards ou gráficos implementados em C3.6/C3.7
- ❌ Não implementamos integração real com Google Analytics (continua mockado)

---

## 📊 IMPACTO

### Arquitetural
- `/metrics/website` agora é **alias legado** da nova estrutura
- `/metrics` continua como **fonte única da verdade** para métricas
- Zero regressão nas fases C3.4–C3.8

### UX
- Links antigos continuam funcionando
- Redirecionamento é instantâneo e transparente
- Mensagem de "Redirecionando..." aparece brevemente
- Histórico de navegação não poluído (`replace: true`)

### Manutenção
- `WebsiteMetrics.tsx` desacoplado do fluxo principal
- Pronto para remoção em fase futura de cleanup
- Documentação clara para futuros desenvolvedores

---

## 🎯 CRITÉRIOS DE ACEITE

- [x] `MetricsWebsiteLegacyWrapper.tsx` criado em `src/pages`
- [x] Rota `/metrics/website` renderiza o wrapper (não mais `WebsiteMetrics`)
- [x] Proteções (`ProtectedRoute`, `PermissionRoute`, `Layout`) mantidas
- [x] Redirect para `/metrics?domain=marketing&subTab=website` funciona
- [x] Query params legados (`period`, `start`, `end`) são preservados
- [x] `getDefaultSubTabForDomain('marketing')` retorna `"website"`
- [x] Navbar não precisa de alterações (já corrigida na C3.8)
- [x] `/metrics` continua funcionando para todos os domínios
- [x] Build compila sem erros TypeScript
- [x] Documentação `track_c3_phase_c3_9_metrics_website_migration.md` criada

---

## 📚 RELAÇÃO COM FASES ANTERIORES

### C3.4 (Infraestrutura)
- ✅ Reutiliza queries e `aggregatedData`
- ✅ Reutiliza `useChartTimeScale`
- ✅ Reutiliza `useDashboardLayout`

### C3.5 (Seções/Sub-Abas)
- ✅ Reutiliza `metricsSectionsConfig.ts`
- ✅ Domínio `marketing` + sub-aba `website` já configurados

### C3.6 (Cards Numéricos)
- ✅ Cards mockados de marketing continuam funcionando
- ✅ `MetricsWebsite*Card` componentes intactos

### C3.7 (Gráficos)
- ✅ `MarketingWebsiteOverviewChart` continua renderizando
- ✅ Dados mockados preservados

### C3.8 (Migração /financial)
- ✅ Mesma estratégia de wrapper aplicada
- ✅ Padrão de redirect consolidado
- ✅ Navbar já atualizada para `/metrics?domain=marketing`

---

## 🔮 PRÓXIMOS PASSOS (FASES FUTURAS)

1. **Integração real com Google Analytics:**
   - Edge function para buscar dados da API
   - Substituir valores mockados por dados reais

2. **Cleanup de arquivos legados:**
   - Avaliar remoção de `WebsiteMetrics.tsx`
   - Avaliar remoção de `Financial.tsx` (C3.8)

3. **Domínio Team:**
   - Implementar cards e gráficos reais
   - Atualmente apenas placeholders

4. **Comparativos de período:**
   - "vs período anterior" para todos os cards
   - Setas de tendência (↑↓)

---

## ✨ CONCLUSÃO

A FASE C3.9 completa a migração das rotas legadas de métricas para o sistema unificado `/metrics`. Com esta fase:

- **100% das rotas legadas migradas:**
  - `/financial` → `/metrics?domain=financial` (C3.8)
  - `/metrics/website` → `/metrics?domain=marketing&subTab=website` (C3.9)

- **Backwards compatibility garantida:**
  - Links antigos continuam funcionando
  - Nenhuma quebra de experiência do usuário

- **Arquitetura consolidada:**
  - `/metrics` como ponto único de acesso a todas as métricas
  - Sistema modular de domínios e sub-abas
  - Cards e gráficos reutilizáveis

A TRACK C3 (Phases C3.4–C3.9) está completa e pronta para expansão futura com novas funcionalidades de métricas.
