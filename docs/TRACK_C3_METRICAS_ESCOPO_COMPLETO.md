# 📊 TRACK C3 - REFATORAÇÃO COMPLETA DE MÉTRICAS
## ESCOPO DETALHADO E ARQUITETURA

---

## 🎯 OBJETIVO GERAL

Refatorar completamente a área de métricas (`/financial` + `/metrics/website`) em uma **tela unificada** (`/metrics`) com:

- **Abas por domain** (Financial, Administrative, Marketing, Team)
- **Sistema de permissões** totalmente integrado (mesmo que Dashboard/Patient Detail)
- **Layout personalizável** (drag & drop + resize + persistência Supabase)
- **Arquitetura consistente** com o resto do sistema

---

## 📦 1. INVENTÁRIO DE CARDS EXISTENTES

### 1.1 Cards na página `/financial` (Financial.tsx)

#### **CARDS MÉTRICOS (Topo da página - 8 cards numéricos)**

1. **Receita Total** (`metrics-revenue-total`)
   - Domain: `financial`
   - Dados: `totalRevenue` (calculado em tempo real)
   - Ícone: `DollarSign`
   - Cor: success

2. **Média por Sessão** (`metrics-avg-per-session`)
   - Domain: `financial`
   - Dados: `avgPerSession` (calculado em tempo real)
   - Ícone: `TrendingUp`
   - Cor: primary

3. **Taxa de Faltas** (`metrics-missed-rate`)
   - Domain: `administrative`
   - Dados: `missedRate` (% calculado em tempo real)
   - Ícone: `AlertCircle`
   - Cor: destructive

4. **Pacientes Ativos** (`metrics-active-patients`)
   - Domain: `administrative`
   - Dados: `activePatients` (count em tempo real)
   - Ícone: `Users`
   - Cor: accent

5. **Previsão Mensal** (`metrics-forecast-revenue`)
   - Domain: `financial`
   - Dados: `forecastRevenue` (calculado em tempo real)
   - Ícone: `Target`
   - Cor: primary

6. **Média por Paciente Ativo** (`metrics-avg-per-active-patient`)
   - Domain: `financial`
   - Dados: `avgRevenuePerActivePatient` (calculado)
   - Ícone: `Activity`
   - Cor: accent

7. **Perdido com Faltas** (`metrics-lost-revenue`)
   - Domain: `financial` + `administrative`
   - Dados: `lostRevenue` (calculado em tempo real)
   - Ícone: `AlertCircle`
   - Cor: destructive

8. **Taxa de Ocupação** (`metrics-occupation-rate`)
   - Domain: `administrative`
   - Dados: `occupationRate` (% calculado via `calculateOccupationRate()`)
   - Ícone: `Percent`
   - Cor: primary

#### **CARDS GRÁFICOS (Abas - 15 gráficos)**

**Aba "Distribuições":**

9. **Receita Mensal** (`chart-revenue-monthly`)
   - Domain: `financial`
   - Tipo: `LineChart`
   - Dados: `monthlyData` (receita por mês)
   - Query: `getMonthlyRevenue()`

10. **Distribuição por Paciente** (`chart-patient-distribution`)
    - Domain: `financial` + `team`
    - Tipo: `PieChart`
    - Dados: `patientDistribution`
    - Query: `getPatientDistribution()`

11. **Sessões vs Esperadas** (`chart-sessions-vs-expected`)
    - Domain: `administrative`
    - Tipo: `BarChart`
    - Dados: `monthlyData` (sessões vs esperadas)
    - Query: `getMonthlyRevenue()` (mesmo dataset)

**Aba "Desempenho":**

12. **Taxa de Faltas Mensal** (`chart-missed-rate-monthly`)
    - Domain: `administrative`
    - Tipo: `LineChart`
    - Dados: `missedRateData`
    - Query: `getMissedRate()`

13. **Faturamento Médio por Paciente** (`chart-avg-revenue-per-patient`)
    - Domain: `financial` + `team`
    - Tipo: `BarChart`
    - Dados: `avgRevenueData`
    - Query: `getAvgRevenuePerPatient()`

14. **Faltas por Paciente** (`chart-missed-by-patient`)
    - Domain: `administrative` + `team`
    - Tipo: `BarChart`
    - Dados: `missedByPatient`
    - Query: `getMissedByPatient()`

15. **Ticket Médio: Mensais vs Semanais** (`chart-ticket-comparison`)
    - Domain: `financial`
    - Tipo: `BarChart`
    - Dados: `ticketComparison`
    - Query: `getTicketComparison()`

**Aba "Tendências":**

16. **Crescimento Mês a Mês** (`chart-growth-trend`)
    - Domain: `financial`
    - Tipo: `LineChart`
    - Dados: `growthTrend`
    - Query: `getGrowthTrend()`

17. **Pacientes Novos vs Encerrados** (`chart-new-vs-inactive`)
    - Domain: `administrative` + `team`
    - Tipo: `BarChart`
    - Dados: `newVsInactive`
    - Query: `getNewVsInactive()`

18. **Valor Perdido por Faltas (Mensal)** (`chart-lost-revenue-monthly`)
    - Domain: `financial` + `administrative`
    - Tipo: `BarChart`
    - Dados: `lostRevenueByMonth`
    - Query: `getLostRevenueByMonth()`

**Aba "Retenção":**

19. **Taxa de Retenção** (`chart-retention-rate`)
    - Domain: `administrative` + `team`
    - Tipo: `BarChart`
    - Dados: `retentionRate`
    - Query: `getRetentionRate()`

20. **Distribuição de Faltas** (`chart-missed-distribution`)
    - Domain: `administrative` + `team`
    - Tipo: `PieChart`
    - Dados: `missedDistribution`
    - Query: `getMissedDistribution()`

**SUBTOTAL FINANCIAL:** 20 cards (8 métricos + 12 gráficos)

---

### 1.2 Cards na página `/metrics/website` (WebsiteMetrics.tsx)

**CARDS MÉTRICOS (4 cards numéricos):**

21. **Visualizações** (`metrics-website-views`)
    - Domain: `marketing`
    - Dados: **MOCKADO** (ainda sem integração)
    - Ícone: `Eye`

22. **Visitantes Únicos** (`metrics-website-visitors`)
    - Domain: `marketing`
    - Dados: **MOCKADO**
    - Ícone: `Users`

23. **Taxa de Conversão** (`metrics-website-conversion`)
    - Domain: `marketing`
    - Dados: **MOCKADO**
    - Ícone: `TrendingUp`

24. **Taxa de Cliques (CTR)** (`metrics-website-ctr`)
    - Domain: `marketing`
    - Dados: **MOCKADO**
    - Ícone: `MousePointerClick`

**CARDS INFORMATIVOS (2 cards):**

25. **Páginas Mais Visitadas** (`chart-website-top-pages`)
    - Domain: `marketing`
    - Dados: **MOCKADO**
    - Tipo: Lista

26. **Origem do Tráfego** (`chart-website-traffic-sources`)
    - Domain: `marketing`
    - Dados: **MOCKADO**
    - Tipo: Lista

**SUBTOTAL WEBSITE:** 6 cards (4 métricos + 2 informativos)

---

### **TOTAL GERAL: 26 CARDS**

- **Financeiro:** 10 cards
- **Administrativo:** 10 cards
- **Marketing:** 6 cards
- **Team (sobreposição):** 7 cards compartilhados

---

## 🗂️ 2. ARQUITETURA PROPOSTA

### 2.1 Estrutura de Domains e Abas

#### **ABAS PRINCIPAIS (Domains)**

Ordem de exibição:

1. **Financeiro** (`financial`)
2. **Administrativo** (`administrative`)
3. **Marketing** (`marketing`)
4. **Equipe** (`team`)

#### **SUB-ABAS POR DOMAIN**

**Domain: FINANCEIRO**

- **Seção Superior:** Cards métricos numéricos
  - Receita Total
  - Média por Sessão
  - Previsão Mensal
  - Média por Paciente Ativo
  - Perdido com Faltas

- **Seção Inferior (Sub-abas):**
  - **Distribuições:** Receita Mensal, Distribuição por Paciente
  - **Desempenho:** Faturamento Médio por Paciente, Ticket Médio
  - **Tendências:** Crescimento Mês a Mês, Valor Perdido por Faltas

**Domain: ADMINISTRATIVO**

- **Seção Superior:** Cards métricos numéricos
  - Taxa de Faltas
  - Pacientes Ativos
  - Taxa de Ocupação

- **Seção Inferior (Sub-abas):**
  - **Distribuições:** Sessões vs Esperadas
  - **Desempenho:** Taxa de Faltas Mensal, Faltas por Paciente
  - **Retenção:** Taxa de Retenção, Distribuição de Faltas

**Domain: MARKETING**

- **Seção Superior:** Cards métricos numéricos
  - Visualizações
  - Visitantes Únicos
  - Taxa de Conversão
  - CTR

- **Seção Inferior (Sub-abas):**
  - **Website:** Páginas Mais Visitadas, Origem do Tráfego
  - **Futuro:** Redes Sociais (placeholder)

**Domain: EQUIPE** (Team)

⚠️ **REGRA ESPECIAL:** Cards com `team` no `secondaryDomains` aparecem **APENAS** na aba Team, NÃO nas outras abas.

- **Seção Superior:** Cards métricos numéricos
  - (Nenhum dedicado, apenas compartilhados)

- **Seção Inferior (Sub-abas):**
  - **Desempenho:** Faturamento Médio por Paciente, Faltas por Paciente
  - **Distribuições:** Distribuição por Paciente
  - **Retenção:** Taxa de Retenção, Distribuição de Faltas, Pacientes Novos vs Encerrados

---

### 2.2 Layout Visual (Exatamente como em `/financial`)

```
┌─────────────────────────────────────────────────────────────┐
│ [Aba Financial] [Aba Administrative] [Aba Marketing] [Team] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  SEÇÃO DE CARDS MÉTRICOS (Numéricos)                        │
│  [Card 1] [Card 2] [Card 3] [Card 4]                        │
│  (Responsivo: 4 cols desktop, 2 cols tablet, 1 col mobile)  │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Sub-aba Distribuições] [Desempenho] [Tendências] [etc]    │
│                                                               │
│  SEÇÃO DE CARDS GRÁFICOS (React Grid Layout)                │
│  [GridCardContainer]                                         │
│    - Drag & Drop habilitado                                  │
│    - Resize habilitado                                       │
│    - Persistência em Supabase                                │
│    - localStorage como cache                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**IMPORTANTE:**

- Cards métricos **NÃO** são arrastáveis (seção fixa)
- Cards gráficos **SIM** são arrastáveis (GridCardContainer)
- Filtro de período (3m, 6m, ano, custom) no topo
- Mesmo visual atual de `/financial` (design system respeitado)

---

## 🔐 3. SISTEMA DE PERMISSÕES

### 3.1 Integração com Sistema Existente

**FONTES DE PERMISSÃO:**

1. **useEffectivePermissions** (hook central)
   - Retorna: `EffectivePermissions` (já calculado via `resolveEffectivePermissions`)
   - Campos relevantes:
     - `canAccessClinical`
     - `financialAccess: 'none' | 'summary' | 'full'`
     - `canAccessMarketing`
     - `canAccessWhatsapp`
     - `isOrganizationOwner`
     - `canViewTeamFinancialSummary`

2. **useAuth** (role global)
   - `roleGlobal: 'admin' | 'psychologist' | 'assistant' | 'accountant'`
   - `isAdmin: boolean`
   - `organizationId: string | null`

3. **useCardPermissions** (validação por card)
   - `canViewCard(cardConfig: CardConfig): boolean`

### 3.2 Lógica de Filtro de Abas

```typescript
// Pseudo-código
const visibleDomains = [];

if (financialAccess !== 'none') {
  visibleDomains.push('financial');
}

if (roleGlobal !== 'accountant') {
  visibleDomains.push('administrative');
}

if (canAccessMarketing) {
  visibleDomains.push('marketing');
}

if (canViewTeamFinancialSummary || isOrganizationOwner || isAdmin) {
  visibleDomains.push('team');
}
```

**REGRAS ESPECIAIS:**

- **Contadores:** Veem APENAS Financial (financialAccess = 'full')
- **Assistentes:** Veem Administrative + Marketing (sem Financial)
- **Admin/Owner:** Veem TUDO
- **Sem organização:** Tratado como Owner (full access)

### 3.3 Validação por Card

Cada card tem:

```typescript
interface MetricsCardConfig {
  id: string;
  primaryDomain: PermissionDomain;
  secondaryDomains?: PermissionDomain[];
  component: React.ComponentType<any>;
  defaultLayout: GridCardLayout;
}
```

**Regra de acesso:**

- Usuário precisa ter acesso a **TODOS** os domains do card
- Exemplo: Card `chart-avg-revenue-per-patient`:
  - `primaryDomain: 'financial'`
  - `secondaryDomains: ['team']`
  - Só aparece se: `financialAccess !== 'none' && canViewTeamFinancialSummary`

**EXCEÇÃO - Domain TEAM:**

Cards com `team` em `secondaryDomains` aparecem:
- Na aba **Team** (sempre, se user tem acesso)
- Nas outras abas **APENAS SE** `team` NÃO é `primaryDomain`

Isso evita duplicação.

---

## 💾 4. PERSISTÊNCIA DE LAYOUT

### 4.1 Decisão: Generalizar Tabela (MAIS ELEGANTE)

**Criar nova coluna `layout_type` em `user_layout_preferences`:**

```sql
-- Já existe: user_layout_preferences
-- Adicionar valores possíveis para layout_type:
-- 'dashboard-example-grid'
-- 'patient-overview'
-- 'metrics-grid'  ← NOVO
```

**Vantagens:**

✅ Tabela única para todos os layouts  
✅ Reutilização de lógica de persistência  
✅ Menos duplicação de código  
✅ Escalável (futuras telas podem usar a mesma tabela)

**Estrutura do `layout_config` (JSONB):**

```json
{
  "metrics-financial": {
    "cardLayouts": [
      { "i": "chart-revenue-monthly", "x": 0, "y": 0, "w": 6, "h": 2, ... },
      { "i": "chart-patient-distribution", "x": 6, "y": 0, "w": 6, "h": 2, ... }
    ]
  },
  "metrics-administrative": {
    "cardLayouts": [ ... ]
  },
  "metrics-marketing": {
    "cardLayouts": [ ... ]
  },
  "metrics-team": {
    "cardLayouts": [ ... ]
  }
}
```

### 4.2 Estratégia de Cache

**Mesma estratégia de `useDashboardLayout`:**

1. **localStorage** como cache temporário
   - Keys: `grid-card-metrics-financial-{cardId}`
   - Salvamento imediato em mudanças
   - Limpeza em reset

2. **Supabase** como fonte da verdade
   - Load inicial busca DB
   - Merge com localStorage (localStorage sobrescreve)
   - Auto-save com debounce (2s)
   - Versionamento (`version` column)

### 4.3 Novo Hook: `useMetricsLayout`

```typescript
// src/hooks/useMetricsLayout.ts
export const useMetricsLayout = (domain: PermissionDomain): UseMetricsLayoutReturn => {
  // Similar a useDashboardLayout, mas:
  // - layout_type = 'metrics-grid'
  // - Seção específica: `metrics-{domain}`
  // - Mesma lógica de load, save, reset
  // - Mesma integração localStorage + Supabase
}
```

---

## 📚 5. CARD REGISTRY DE MÉTRICAS

### 5.1 Novo Arquivo: `src/lib/metricsCardRegistry.tsx`

```typescript
import { MetricsCardConfig } from '@/types/metricsCardTypes';
import { RevenueTotal } from '@/components/cards/metrics/financial/RevenueTotal';
// ... imports

export const METRICS_CARDS: Record<string, MetricsCardConfig> = {
  // FINANCIAL
  'metrics-revenue-total': {
    id: 'metrics-revenue-total',
    primaryDomain: 'financial',
    component: RevenueTotal,
    defaultLayout: { i: 'metrics-revenue-total', x: 0, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
  },
  
  'chart-revenue-monthly': {
    id: 'chart-revenue-monthly',
    primaryDomain: 'financial',
    component: ChartRevenueMonthly,
    defaultLayout: { i: 'chart-revenue-monthly', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
  },
  
  // ADMINISTRATIVE
  'metrics-missed-rate': {
    id: 'metrics-missed-rate',
    primaryDomain: 'administrative',
    component: MissedRate,
    defaultLayout: { i: 'metrics-missed-rate', x: 0, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
  },
  
  // TEAM (cards com secondaryDomains)
  'chart-avg-revenue-per-patient': {
    id: 'chart-avg-revenue-per-patient',
    primaryDomain: 'financial',
    secondaryDomains: ['team'],
    component: ChartAvgRevenuePerPatient,
    defaultLayout: { i: 'chart-avg-revenue-per-patient', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
  },
  
  // ... 26 cards total
};
```

### 5.2 Estrutura de Componentes

```
src/components/cards/metrics/
├── financial/
│   ├── RevenueTotal.tsx
│   ├── AvgPerSession.tsx
│   ├── ChartRevenueMonthly.tsx
│   └── ...
├── administrative/
│   ├── MissedRate.tsx
│   ├── ActivePatients.tsx
│   └── ...
├── marketing/
│   ├── WebsiteViews.tsx
│   └── ...
└── shared/
    └── (componentes reutilizáveis)
```

**Cada componente recebe:**

```typescript
interface MetricsCardProps {
  period: { start: Date; end: Date };
  // Dados já calculados (pré-processados pela página)
  data?: any;
}
```

---

## 🔄 6. DADOS E QUERIES

### 6.1 Estratégia: Cálculo em Tempo Real (Como DashboardExample)

**DECISÃO:** Cada card calcula seus próprios dados a partir de queries base.

**Queries Base (executadas pela página):**

```typescript
// src/pages/Metrics.tsx
const { data: sessions } = useQuery(['sessions', organizationId, period]);
const { data: patients } = useQuery(['patients', organizationId]);
const { data: nfseIssued } = useQuery(['nfse_issued', organizationId, period]);
// ...
```

**Cada card recebe os dados brutos e calcula:**

```typescript
// Exemplo: ChartRevenueMonthly.tsx
export const ChartRevenueMonthly = ({ period, sessions, patients }) => {
  const monthlyData = useMemo(() => {
    return calculateMonthlyRevenue(sessions, patients, period);
  }, [sessions, patients, period]);
  
  return <LineChart data={monthlyData} />;
};
```

**VANTAGENS:**

✅ Sem necessidade de Edge Functions agregadas  
✅ Filtros de período funcionam automaticamente  
✅ Cada card independente (fácil manutenção)  
✅ Consistente com arquitetura do Dashboard

**DESVANTAGENS (aceitáveis):**

⚠️ Queries duplicadas entre cards (mas queries são cachadas pelo React Query)  
⚠️ Cálculos no cliente (mas dados são leves e usuários têm bons dispositivos)

### 6.2 Filtros de Período

**Filtro Global no Topo da Página:**

```typescript
const [period, setPeriod] = useState<'3months' | '6months' | 'year' | 'custom'>('year');
const [customStartDate, setCustomStartDate] = useState<string>('');
const [customEndDate, setCustomEndDate] = useState<string>('');

const dateRange = useMemo(() => getDateRange(period, customStartDate, customEndDate), [period, customStartDate, customEndDate]);
```

**TODOS os cards recebem o mesmo `dateRange` e recalculam automaticamente.**

### 6.3 Dados Mockados (Website/Marketing)

Cards de website continuam mockados:

```typescript
// ChartWebsiteTopPages.tsx
export const ChartWebsiteTopPages = () => {
  const mockData = [
    { name: "Home", views: "-" },
    { name: "Sobre Nós", views: "-" },
    // ...
  ];
  
  return <div>
    <Alert>Integração com analytics será feita em fase futura</Alert>
    {/* Render mockData */}
  </div>;
};
```

---

## 🧭 7. NAVEGAÇÃO E ROTA

### 7.1 Nova Rota: `/metrics`

**Remover:**
- Dropdown "Métricas" no Navbar (linhas 119-145 do Navbar.tsx)
- Rotas antigas: `/financial`, `/metrics/website`

**Adicionar:**

```tsx
// src/App.tsx
<Route path="/metrics" element={
  <PermissionRoute 
    requiredPermissions={{ 
      anyOf: [
        { financialAccess: 'summary' },
        { canAccessMarketing: true },
        { canViewTeamFinancialSummary: true }
      ]
    }}
  >
    <Layout><Metrics /></Layout>
  </PermissionRoute>
} />
```

**Navbar.tsx (substituir dropdown):**

```tsx
<Link
  to="/metrics"
  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
    isActive('/metrics')
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
  }`}
>
  <TrendingUp className="w-4 h-4" />
  <span className="font-medium">Métricas</span>
</Link>
```

### 7.2 Estado de Navegação (Abas + Sub-abas)

**URL com query params:**

```
/metrics?domain=financial&tab=distribuicoes
/metrics?domain=administrative&tab=desempenho
```

**Estado interno:**

```typescript
const [activeTab, setActiveTab] = useState<PermissionDomain>('financial');
const [activeSubTab, setActiveSubTab] = useState<string>('distribuicoes');
```

**Persistência de última aba visitada:**
- localStorage: `metrics-last-domain`
- localStorage: `metrics-last-subtab-{domain}`

---

## 🎨 8. DESIGN E UX

### 8.1 Linguagem Visual

**MANTER EXATAMENTE COMO ESTÁ EM `/financial`:**

- Mesmos ícones
- Mesmas cores (success, destructive, accent, primary)
- Mesmo grid responsivo (4 cols → 2 cols → 1 col)
- Mesmos cards shadcn com `shadow-[var(--shadow-card)]`
- Mesmos gráficos (Recharts)

**ADICIONAR:**

- Abas de domain no topo (Tabs do shadcn)
- Sub-abas de gráficos (Tabs do shadcn)
- Badges de permissão (discretos, só se necessário)

### 8.2 Estados de Loading/Empty

**Loading:**
```tsx
{loading && <div className="grid gap-4">
  <Skeleton className="h-32" />
  <Skeleton className="h-32" />
</div>}
```

**Empty:**
```tsx
{!loading && sessions.length === 0 && (
  <Alert>
    <AlertDescription>
      Nenhum dado disponível para o período selecionado.
    </AlertDescription>
  </Alert>
)}
```

### 8.3 Responsividade

**Mobile:**
- Abas principais horizontais com scroll (TouchSwipe)
- Cards métricos empilhados (1 col)
- Gráficos ocupam largura total
- Sub-abas horizontais com scroll

**Tablet:**
- 2 colunas para cards métricos
- Gráficos 2x2

**Desktop:**
- 4 colunas para cards métricos
- GridCardContainer com 12 colunas

---

## 📝 9. LISTA DE TAREFAS (NÃO IMPLEMENTAR AGORA)

### 9.1 Arquivos a CRIAR

```
src/pages/Metrics.tsx                               (componente principal)
src/hooks/useMetricsLayout.ts                       (persistência de layout)
src/lib/metricsCardRegistry.tsx                     (registro de cards)
src/lib/defaultLayoutMetrics.ts                     (layouts padrão)
src/types/metricsCardTypes.ts                       (tipos específicos)

src/components/cards/metrics/financial/             (12 componentes)
src/components/cards/metrics/administrative/        (10 componentes)
src/components/cards/metrics/marketing/             (6 componentes)
src/components/cards/metrics/shared/                (componentes reutilizáveis)
```

### 9.2 Arquivos a MODIFICAR

```
src/App.tsx                                         (nova rota /metrics)
src/components/Navbar.tsx                           (remover dropdown, link direto)
src/lib/routePermissions.ts                         (adicionar rota /metrics)
```

### 9.3 Arquivos a DELETAR (após migração completa)

```
src/pages/Financial.tsx
src/pages/WebsiteMetrics.tsx
```

### 9.4 Database (Sem mudanças necessárias)

✅ Tabela `user_layout_preferences` JÁ EXISTE  
✅ Apenas adicionar novo `layout_type: 'metrics-grid'`  
✅ Nenhuma migração necessária

---

## ❓ 10. QUESTÕES PENDENTES (PARA DEFINIR ANTES DE IMPLEMENTAR)

### 10.1 Persistência de Layout

**QUESTÃO 1:** Confirmar estratégia de generalização da tabela.

**PROPOSTA:** Usar `user_layout_preferences` com novo `layout_type: 'metrics-grid'`.

**DECISÃO NECESSÁRIA:** ✅ APROVADO ou ❌ CRIAR TABELA NOVA

---

### 10.2 Sub-abas (Organização de Gráficos)

**QUESTÃO 2:** Confirmar divisão de sub-abas.

**PROPOSTA ATUAL:**

- **Financial:** Distribuições, Desempenho, Tendências
- **Administrative:** Distribuições, Desempenho, Retenção
- **Marketing:** Website, Redes Sociais (futuro)
- **Team:** Desempenho, Distribuições, Retenção

**ALTERNATIVA:** Usar tags/filtros ao invés de sub-abas?

**DECISÃO NECESSÁRIA:** ✅ MANTER SUB-ABAS ou ❌ USAR TAGS

---

### 10.3 Filtros Temporais

**QUESTÃO 3:** Implementar comparativos com período anterior?

**EXEMPLO:** "Receita Total: R$ 10.000 (+15% vs mês passado)"

**PROPOSTA:** Adicionar flag `showComparison: boolean` nos cards métricos.

**DECISÃO NECESSÁRIA:** ✅ IMPLEMENTAR ou ❌ DEIXAR PARA DEPOIS

---

### 10.4 Escopo de Dados (Próprio vs Equipe)

**QUESTÃO 4:** Cards de Team mostram dados de quem?

**CENÁRIOS:**

A) **Sempre do usuário logado** (comportamento atual do `/financial`)
B) **Toggle "Meus dados / Equipe"** (novo controle)
C) **Sempre da equipe completa** (se tem acesso a Team)

**PROPOSTA:** Opção A por enquanto (mais simples), opção B em fase futura.

**DECISÃO NECESSÁRIA:** ✅ A, ❌ B ou ❌ C

---

### 10.5 Exportação de Dados

**QUESTÃO 5:** Implementar botão de exportar métricas?

**FORMATOS:** CSV, PDF, Excel

**PROPOSTA:** Deixar para fase futura (não é crítico).

**DECISÃO NECESSÁRIA:** ✅ IMPLEMENTAR AGORA ou ❌ FASE FUTURA

---

### 10.6 Permissões Granulares (Sub-abas)

**QUESTÃO 6:** Usuário pode ter acesso parcial a um domain?

**EXEMPLO:** Acesso a Financial, mas sem sub-aba "NFSe"?

**PROPOSTA:** NÃO. Permissão é por domain completo (mais simples).

**DECISÃO NECESSÁRIA:** ✅ DOMAIN COMPLETO ou ❌ GRANULAR POR SUB-ABA

---

### 10.7 Tempo Real (Realtime Updates)

**QUESTÃO 7:** Métricas atualizam em tempo real via WebSockets?

**PROPOSTA:** NÃO. Refresh manual ou auto-refresh periódico (a cada 5min).

**DECISÃO NECESSÁRIA:** ✅ REFRESH PERIÓDICO ou ❌ REALTIME

---

### 10.8 Cards Métricos (Fixos vs Drag & Drop)

**QUESTÃO 8:** Cards métricos (topo) devem ser drag & drop também?

**PROPOSTA:** NÃO. Seção fixa (como está no `/financial` atual).

**Benefício:** Layout mais previsível e consistente.

**DECISÃO NECESSÁRIA:** ✅ FIXO ou ❌ DRAG & DROP

---

## 📊 11. MÉTRICAS DE SUCESSO (Como validar que funcionou)

### 11.1 Funcional

✅ Todas as 4 abas principais aparecem (se user tem permissão)  
✅ Filtro de período funciona e recalcula todos os cards  
✅ Drag & Drop salva no Supabase e persiste entre sessões  
✅ Cards de Team NÃO aparecem duplicados em outras abas  
✅ Permissões filtram corretamente (contadores só veem Financial)  
✅ Dados reais calculados corretamente (validar com `/financial` antigo)

### 11.2 UX

✅ Loading states claros  
✅ Empty states informativos  
✅ Transições suaves entre abas  
✅ Responsivo em mobile/tablet/desktop  
✅ Visual consistente com resto do sistema

### 11.3 Performance

✅ Página carrega em < 2s  
✅ Troca de abas em < 500ms  
✅ Drag & Drop sem lag  
✅ Queries cachadas (React Query)

---

## 🚀 12. PRÓXIMOS PASSOS (APÓS APROVAÇÃO)

1. **Responder questões pendentes** (seção 10)
2. **Criar estrutura de fases** (C3.1 a C3.7)
3. **Gerar documento de implementação detalhado** para cada fase
4. **Iniciar implementação** fase por fase

---

## 📌 13. NOTAS FINAIS

### 13.1 Compatibilidade

✅ **100% compatível** com sistema de permissões existente  
✅ **Reutiliza** toda infraestrutura de layout (GridCardContainer, useDashboardLayout, etc)  
✅ **Mantém** visual e UX existentes  
✅ **Sem breaking changes** em outras partes do sistema

### 13.2 Escalabilidade

✅ **Fácil adicionar novos domains** (basta adicionar aba + cards)  
✅ **Fácil adicionar novos cards** (basta adicionar no registry)  
✅ **Fácil adicionar sub-abas** (estrutura já suporta)  
✅ **Fácil adicionar filtros** (props dos cards já recebem período)

### 13.3 Manutenção

✅ **Cards isolados** (cada um é independente)  
✅ **Registry centralizado** (fácil encontrar e modificar)  
✅ **Tipos fortemente tipados** (TypeScript previne erros)  
✅ **Documentação inline** (comentários em código)

---

## 🎯 RESUMO EXECUTIVO

**O QUE SERÁ FEITO:**

Transformar `/financial` + `/metrics/website` em uma única tela `/metrics` com:

- 4 abas de domain (Financial, Administrative, Marketing, Team)
- 26 cards (8 métricos fixos + 18 gráficos drag & drop)
- Sistema de permissões totalmente integrado
- Layout personalizável com persistência Supabase
- Arquitetura 100% consistente com Dashboard/Patient Detail

**O QUE NÃO SERÁ FEITO (AGORA):**

- Integração real com Google Analytics (continua mockado)
- Comparativos com períodos anteriores
- Exportação de dados (CSV/PDF)
- Permissões granulares por sub-aba
- Tempo real via WebSockets

**TEMPO ESTIMADO:** 7 fases (C3.1 a C3.7)

**RISCOS:** Baixos (reutilizando infraestrutura existente)

**IMPACTO:** Alto (melhor UX, melhor DX, melhor organização)

---

FIM DO DOCUMENTO
