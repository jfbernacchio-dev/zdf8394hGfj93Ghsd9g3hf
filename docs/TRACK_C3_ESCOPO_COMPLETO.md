# 📊 TRACK C3 - REFATORAÇÃO COMPLETA DA TELA MÉTRICAS

## 🎯 OBJETIVO GERAL

Transformar a atual estrutura de métricas (hardcoded em `/financial` + dropdown no Navbar) em uma **tela unificada `/metrics`** com:

1. **Abas por Domain**: Financial, Administrative, Marketing, Team
2. **Sistema de Permissões Integrado**: Usar `resolveEffectivePermissions`, `useCardPermissions`, `level_role_settings`
3. **Layout Personalizável**: Drag & Drop + Resize com persistência Supabase (igual DashboardExample)
4. **Cards Catalogados**: Registry centralizado com `primaryDomain` e `secondaryDomains`
5. **Dados Reais**: Queries em tempo real (exceto Website que fica mockado)
6. **Arquitetura Consistente**: Reutilizar 100% da infraestrutura existente

---

## 📋 INVENTÁRIO COMPLETO - ESTADO ATUAL

### 1. Localização Atual dos Cards

**Arquivo**: `src/pages/Financial.tsx` (1396 linhas, cards hardcoded)

**Estrutura Visual Atual**:
```
┌─────────────────────────────────────────────────────────┐
│  FILTRO DE PERÍODO (year, 3months, 6months, custom)    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  CARDS NUMÉRICOS (Grid de 8 cards)                     │
│  - Receita Total                                        │
│  - Média por Sessão                                     │
│  - Taxa de Faltas                                       │
│  - Pacientes Ativos                                     │
│  - Previsão Mensal                                      │
│  - Média por Paciente Ativo                             │
│  - Perdido com Faltas                                   │
│  - Taxa de Ocupação                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  TABS (Sub-abas gráficas)                               │
│  ├─ Distribuição                                        │
│  ├─ Desempenho                                          │
│  ├─ Retenção                                            │
│  └─ Pagamentos                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  GRÁFICOS (renderizados conforme sub-aba selecionada)  │
│  - LineCharts, BarCharts, PieCharts (Recharts)         │
└─────────────────────────────────────────────────────────┘
```

### 2. Cards Existentes - Catalogação Completa

#### **CARDS NUMÉRICOS (8 total)**

1. **Receita Total**
   - Cálculo: `totalRevenue` (soma de sessões `attended`, considerando `monthly_price`)
   - Domain: `financial`
   - Fonte: `sessions` + `patients`

2. **Média por Sessão**
   - Cálculo: `avgPerSession = totalRevenue / totalSessions`
   - Domain: `financial`
   - Fonte: `sessions`

3. **Taxa de Faltas**
   - Cálculo: `missedRate = (missedSessions / visiblePeriodSessions.length) * 100`
   - Domain: `administrative`, `financial` (secondary)
   - Fonte: `sessions` (filtra `show_in_schedule !== false`)

4. **Pacientes Ativos**
   - Cálculo: `activePatients = patients.filter(p => p.status === 'active').length`
   - Domain: `administrative`
   - Fonte: `patients`

5. **Previsão Mensal**
   - Cálculo: `forecastRevenue = getForecastRevenue()` (pacientes mensais + semanais * 4)
   - Domain: `financial`
   - Fonte: `patients`

6. **Média por Paciente Ativo**
   - Cálculo: `avgRevenuePerActivePatient = totalRevenue / activePatients`
   - Domain: `financial`
   - Fonte: `sessions` + `patients`

7. **Perdido com Faltas**
   - Cálculo: `lostRevenue = sum(sessions.filter(missed).value)`
   - Domain: `financial`, `administrative` (secondary)
   - Fonte: `sessions`

8. **Taxa de Ocupação**
   - Cálculo: `calculateOccupationRate()` (baseado em `work_days`, `work_start_time`, `work_end_time`, `slot_duration`)
   - Domain: `administrative`
   - Fonte: `profile` + `sessions` + `schedule_blocks`

#### **GRÁFICOS (Sub-aba DISTRIBUIÇÃO)**

9. **Receita por Paciente** (PieChart)
   - Função: `getPatientDistribution()`
   - Domain: `financial`

10. **Receita por Mês** (BarChart)
    - Função: `getMonthlyRevenue()`
    - Domain: `financial`

11. **Distribuição de Faltas** (PieChart)
    - Função: `getMissedDistribution()`
    - Domain: `administrative`, `financial` (secondary)

#### **GRÁFICOS (Sub-aba DESEMPENHO)**

12. **Receita Mensal** (LineChart)
    - Função: `getMonthlyRevenue()` (mesma data)
    - Domain: `financial`

13. **Taxa de Faltas** (LineChart)
    - Função: `getMissedRate()`
    - Domain: `administrative`, `financial` (secondary)

#### **GRÁFICOS (Sub-aba RETENÇÃO)**

14. **Faturamento Médio por Paciente** (BarChart)
    - Função: `getAvgRevenuePerPatient()`
    - Domain: `financial`

15. **Pacientes Encerrados por Mês** (LineChart)
    - Fonte: `getMonthlyRevenue()` (campo `encerrados`)
    - Domain: `administrative`

#### **GRÁFICOS (Sub-aba PAGAMENTOS)**

16. **Status de Pagamentos** (BarChart + PieChart)
    - Fonte: `paymentStatusData`
    - Domain: `financial`

#### **CARDS DE WEBSITE (WebsiteMetrics.tsx)**

17. **Visualizações** (mockado)
18. **Visitantes Únicos** (mockado)
19. **Taxa de Conversão** (mockado)
20. **Taxa de Cliques** (mockado)
21. **Páginas Mais Visitadas** (mockado)
22. **Origem do Tráfego** (mockado)

Domain: `marketing`

---

## 🏗️ ARQUITETURA PROPOSTA - ESTRUTURA DETALHADA

### 1. Estrutura de Domains e Abas

#### **1.1 Abas Principais (Ordem Fixa)**

```tsx
const DOMAIN_TABS = [
  { id: 'financial', label: 'Financeiro', domain: 'financial' },
  { id: 'administrative', label: 'Administrativo', domain: 'administrative' },
  { id: 'marketing', label: 'Marketing', domain: 'marketing' },
  { id: 'team', label: 'Equipe', domain: 'team' },
];
```

**Filtro de Abas por Permissão**:
- Se usuário NÃO tem `financialAccess` → aba "Financeiro" some
- Se usuário é `assistant` (secretária) → vê apenas "Administrativo"
- Se usuário é `accountant` → vê apenas "Financeiro"
- Admin/Owner → veem TODAS as abas

#### **1.2 Layout Visual de Cada Aba**

```
┌─────────────────────────────────────────────────────────┐
│  ABAS PRINCIPAIS (Financeiro | Administrativo | ...)   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SEÇÃO 1: CARDS MÉTRICOS NUMÉRICOS                      │
│  (Drag & Drop + Resize habilitado)                     │
│  [Card1] [Card2] [Card3] [Card4] ...                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SUB-ABAS GRÁFICAS (Distribuição | Desempenho | ...)   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SEÇÃO 2: GRÁFICOS                                       │
│  (Drag & Drop + Resize habilitado)                     │
│  [Gráfico1] [Gráfico2] ...                              │
└─────────────────────────────────────────────────────────┘
```

#### **1.3 Sub-abas de Cada Domain**

##### **FINANCIAL**
```tsx
const FINANCIAL_SUBTABS = [
  { id: 'distribution', label: 'Distribuição' },
  { id: 'performance', label: 'Desempenho' },
  { id: 'retention', label: 'Retenção' },
  { id: 'payments', label: 'Pagamentos' },
];
```

##### **ADMINISTRATIVE**
```tsx
const ADMINISTRATIVE_SUBTABS = [
  { id: 'occupation', label: 'Ocupação' },
  { id: 'missed', label: 'Faltas' },
  { id: 'patients', label: 'Pacientes' },
];
```

##### **MARKETING**
```tsx
const MARKETING_SUBTABS = [
  { id: 'website', label: 'Website' },
  // Futuro: { id: 'social', label: 'Redes Sociais' },
];
```

##### **TEAM**
```tsx
const TEAM_SUBTABS = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'performance', label: 'Desempenho' },
];
```

---

### 2. Sistema de Permissões - Implementação Detalhada

#### **2.1 Filtro de Abas Principais**

```tsx
// src/pages/Metrics.tsx
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';

const { 
  permissions, 
  loading: permissionsLoading,
  financialAccess,
  canAccessAdministrative,
  canAccessMarketing
} = useEffectivePermissions();

// Filtrar abas visíveis
const visibleTabs = DOMAIN_TABS.filter(tab => {
  if (tab.domain === 'financial') return financialAccess !== 'none';
  if (tab.domain === 'administrative') return canAccessAdministrative;
  if (tab.domain === 'marketing') return canAccessMarketing;
  if (tab.domain === 'team') return permissions?.canViewTeamFinancialSummary || permissions?.isAdmin;
  return false;
});
```

#### **2.2 Permissões por Card (Sistema Existente)**

```tsx
// src/lib/metricsCardRegistry.tsx
export const METRICS_AVAILABLE_CARDS: Record<string, MetricsCardConfig> = {
  'metrics-total-revenue': {
    id: 'metrics-total-revenue',
    title: 'Receita Total',
    primaryDomain: 'financial',
    secondaryDomains: [],
    component: TotalRevenueCard,
  },
  
  'metrics-missed-rate': {
    id: 'metrics-missed-rate',
    title: 'Taxa de Faltas',
    primaryDomain: 'administrative',
    secondaryDomains: ['financial'], // Precisa de ambos
    component: MissedRateCard,
  },
  
  // Cards de TEAM aparecem APENAS na aba Team
  'metrics-team-revenue': {
    id: 'metrics-team-revenue',
    title: 'Receita da Equipe',
    primaryDomain: 'team',
    secondaryDomains: ['financial'],
    component: TeamRevenueCard,
  },
};
```

#### **2.3 Validação de Permissão por Card**

```tsx
// Usar useCardPermissions (já existe)
import { useCardPermissions } from '@/hooks/useCardPermissions';

const { canViewCard } = useCardPermissions();

// Filtrar cards visíveis em cada seção
const visibleMetricsCards = metricsCards.filter(card => 
  canViewCard(card, permissionContext)
);
```

#### **2.4 Regras Especiais**

**Admin/Owner**: Sempre vê tudo
```tsx
if (permissions?.isAdmin || permissions?.isOwner) {
  return true; // Acesso total
}
```

**Roles Específicos**:
```tsx
// Secretária (assistant): APENAS administrative
if (roleGlobal === 'assistant') {
  return domain === 'administrative';
}

// Contador (accountant): APENAS financial
if (roleGlobal === 'accountant') {
  return domain === 'financial';
}
```

**Hierarquia Organizacional**:
```tsx
// Usar resolveEffectivePermissions (já implementado)
// Respeita level_role_settings, level_sharing_config, peer_sharing
const effectivePermissions = await resolveEffectivePermissions(userId);
```

---

### 3. Layout Personalizável - Detalhamento Técnico

#### **3.1 Reutilizar Infraestrutura Existente**

**Hooks**:
- `src/hooks/useDashboardLayout.ts` → **REUTILIZAR** (generalizar se necessário)
- `src/hooks/useChartTimeScale.ts` → **REUTILIZAR** (filtro de período)

**Componentes**:
- `src/components/GridCardContainer.tsx` → **REUTILIZAR**
- `src/components/ResizableCard.tsx` → **REUTILIZAR** (se existir)

**Utils**:
- `src/lib/gridLayoutUtils.ts` → **REUTILIZAR**
- `src/lib/dashboardLayoutUtils.ts` → **REUTILIZAR**

#### **3.2 Persistência - Decisão Arquitetural**

**OPÇÃO RECOMENDADA**: Generalizar tabela existente

```sql
-- NÃO criar nova tabela metrics_layouts
-- NÃO reutilizar dashboard_example_layouts

-- GENERALIZAR: user_layout_preferences
ALTER TABLE user_layout_preferences 
ADD COLUMN IF NOT EXISTS layout_type TEXT DEFAULT 'dashboard';

-- Tipos possíveis: 'dashboard', 'metrics', 'patient_overview'
```

**Por quê?**
- ✅ Mais limpo e escalável
- ✅ Evita duplicação de lógica
- ✅ Facilita futuras extensões (ex: layout de agenda, layout de pacientes)
- ✅ Mantém consistência arquitetural

**Alterações no Hook**:
```tsx
// src/hooks/useLayoutPersistence.ts (novo hook genérico)
export const useLayoutPersistence = (layoutType: 'dashboard' | 'metrics' | 'patient_overview') => {
  // Lógica genérica de persistência
  // Reutiliza código do useDashboardLayout
};

// src/hooks/useMetricsLayout.ts
export const useMetricsLayout = (domain: string, subtab?: string) => {
  const layoutKey = `${domain}${subtab ? `-${subtab}` : ''}`;
  return useLayoutPersistence('metrics');
};
```

#### **3.3 LocalStorage + Supabase (Mesmo comportamento do Dashboard)**

```tsx
// localStorage: cache temporário
localStorage.setItem(
  `metrics-layout-${domain}-${subtab}-card-${cardId}`,
  JSON.stringify({ x, y, w, h })
);

// Supabase: fonte de verdade (auto-save com debounce)
await supabase
  .from('user_layout_preferences')
  .upsert({
    user_id: user.id,
    layout_type: 'metrics',
    layout_config: layoutConfig,
  });
```

#### **3.4 Layout Padrão**

```tsx
// src/lib/defaultLayoutMetrics.ts
export const DEFAULT_METRICS_LAYOUT = {
  financial: {
    metrics: { // Seção de cards numéricos
      sectionId: 'financial-metrics',
      cards: [
        { i: 'metrics-total-revenue', x: 0, y: 0, w: 3, h: 2 },
        { i: 'metrics-avg-session', x: 3, y: 0, w: 3, h: 2 },
        { i: 'metrics-missed-rate', x: 6, y: 0, w: 3, h: 2 },
        { i: 'metrics-active-patients', x: 9, y: 0, w: 3, h: 2 },
        // ...
      ],
    },
    distribution: { // Sub-aba gráfica
      sectionId: 'financial-distribution',
      cards: [
        { i: 'metrics-revenue-by-patient', x: 0, y: 0, w: 6, h: 4 },
        { i: 'metrics-revenue-by-month', x: 6, y: 0, w: 6, h: 4 },
      ],
    },
    // ... outras sub-abas
  },
  administrative: { /* ... */ },
  marketing: { /* ... */ },
  team: { /* ... */ },
};
```

---

### 4. Card Registry - Estrutura Completa

#### **4.1 Novo Registry Central**

```tsx
// src/lib/metricsCardRegistry.tsx
import { MetricsCardConfig } from '@/types/metricsCardTypes';

export const METRICS_AVAILABLE_CARDS: Record<string, MetricsCardConfig> = {
  // FINANCIAL DOMAIN
  'metrics-total-revenue': {
    id: 'metrics-total-revenue',
    title: 'Receita Total',
    description: 'Total de receita no período',
    primaryDomain: 'financial',
    secondaryDomains: [],
    section: 'metrics', // Seção de cards numéricos
    component: TotalRevenueCard,
    defaultSize: { w: 3, h: 2 },
  },
  
  'metrics-revenue-chart': {
    id: 'metrics-revenue-chart',
    title: 'Receita por Mês',
    primaryDomain: 'financial',
    section: 'distribution', // Sub-aba gráfica
    component: RevenueChartCard,
    defaultSize: { w: 6, h: 4 },
  },
  
  // ADMINISTRATIVE DOMAIN
  'metrics-occupation-rate': {
    id: 'metrics-occupation-rate',
    title: 'Taxa de Ocupação',
    primaryDomain: 'administrative',
    section: 'metrics',
    component: OccupationRateCard,
    defaultSize: { w: 3, h: 2 },
  },
  
  // MARKETING DOMAIN (mockados)
  'metrics-website-views': {
    id: 'metrics-website-views',
    title: 'Visualizações',
    primaryDomain: 'marketing',
    section: 'metrics',
    component: WebsiteViewsCard,
    defaultSize: { w: 3, h: 2 },
    isMocked: true, // Flag para indicar dados de exemplo
  },
  
  // TEAM DOMAIN
  'metrics-team-revenue': {
    id: 'metrics-team-revenue',
    title: 'Receita da Equipe',
    primaryDomain: 'team',
    secondaryDomains: ['financial'],
    section: 'metrics',
    component: TeamRevenueCard,
    defaultSize: { w: 6, h: 3 },
    requiresTeamPermission: true,
  },
};
```

#### **4.2 Tipos**

```tsx
// src/types/metricsCardTypes.ts
export interface MetricsCardConfig {
  id: string;
  title: string;
  description?: string;
  primaryDomain: PermissionDomain;
  secondaryDomains?: PermissionDomain[];
  section: 'metrics' | string; // 'metrics' para cards numéricos, ou nome da sub-aba
  component: React.ComponentType<MetricsCardProps>;
  defaultSize: { w: number; h: number };
  isMocked?: boolean;
  requiresTeamPermission?: boolean;
}

export interface MetricsCardProps {
  domain: PermissionDomain;
  subtab?: string;
  sessions: any[];
  patients: any[];
  profiles: any[];
  period: string;
  customStartDate?: string;
  customEndDate?: string;
  timeScale?: TimeScale;
}
```

#### **4.3 Estrutura de Pastas**

```
src/components/cards/metrics/
├── financial/
│   ├── TotalRevenueCard.tsx
│   ├── AvgSessionCard.tsx
│   ├── RevenueChartCard.tsx
│   ├── PatientDistributionCard.tsx
│   └── ...
├── administrative/
│   ├── OccupationRateCard.tsx
│   ├── MissedRateCard.tsx
│   ├── ActivePatientsCard.tsx
│   └── ...
├── marketing/
│   ├── WebsiteViewsCard.tsx
│   ├── VisitorsCard.tsx
│   └── ...
└── team/
    ├── TeamRevenueCard.tsx
    ├── TeamPerformanceCard.tsx
    └── ...
```

---

### 5. Rota e Navegação

#### **5.1 Rota Principal**

```tsx
// src/App.tsx
<Route path="/metrics" element={<PermissionRoute><Metrics /></PermissionRoute>} />
```

#### **5.2 Navbar**

**Remover Dropdown Atual**:
```tsx
// src/components/Navbar.tsx (ANTES)
<DropdownMenu>
  <DropdownMenuTrigger>
    Métricas
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Financeiro</DropdownMenuItem>
    <DropdownMenuItem>Website</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// (DEPOIS) - Link direto
<NavLink to="/metrics">
  Métricas
</NavLink>
```

#### **5.3 Estrutura de URL**

```
/metrics → Abre na primeira aba com permissão
/metrics?domain=financial → Abre aba Financeiro
/metrics?domain=financial&subtab=distribution → Abre sub-aba específica
```

---

### 6. Dados Reais vs Mockados

#### **6.1 Métricas Financeiras (REAIS)**

**Fonte**: `sessions`, `patients`, `nfse_issued`, `nfse_payments`

**Cálculo**: Tempo real, cada card faz sua query otimizada

**Exemplo**:
```tsx
// TotalRevenueCard.tsx
const { data: sessions } = useQuery({
  queryKey: ['sessions', userId, period],
  queryFn: async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);
    return data;
  },
});

const totalRevenue = useMemo(() => {
  return sessions
    ?.filter(s => s.status === 'attended')
    .reduce((sum, s) => sum + Number(s.value), 0) || 0;
}, [sessions]);
```

#### **6.2 Métricas Clínicas (FUTURO)**

**Fonte**: `patients`, `sessions`, `clinical_complaints`, `session_evaluations`

**Status**: NÃO implementar agora (não há cards clínicos na tela atual)

#### **6.3 Métricas de Website (MOCKADO)**

**Fonte**: Dados de exemplo hardcoded

**Integração Real**: FASE FUTURA (Google Analytics / Plausible)

```tsx
// WebsiteViewsCard.tsx
const MOCKED_DATA = {
  views: 1234,
  visitors: 567,
  conversionRate: 3.2,
};
```

#### **6.4 Performance**

**Estratégia**: Cada card faz query independente (IGUAL DashboardExample)

**Por quê?**
- ✅ Mais simples de implementar
- ✅ Cards podem ser adicionados/removidos sem afetar outros
- ✅ Caching automático via React Query
- ✅ Filtro de período já funcionando (useChartTimeScale)

**NÃO criar Edge Function agregada** (desnecessário para escopo atual)

---

## 🔧 DECISÕES ARQUITETURAIS PENDENTES

### ❓ 1. Persistência de Layout

**Pergunta**: Criar tabela nova ou generalizar `user_layout_preferences`?

**Resposta**: **GENERALIZAR** (adicionar coluna `layout_type`)

**Justificativa**:
- Mais limpo e escalável
- Evita duplicação de código
- Facilita futuras extensões

---

### ❓ 2. Escopo de Dados (Próprios vs Equipe)

**Pergunta**: Métricas devem mostrar:
- A) Apenas dados próprios
- B) Dados da equipe (subordinados)
- C) Ambos (com toggle)

**Resposta**: **Depende do card**

**Regras**:
- Cards em **Financial/Administrative/Marketing**: Apenas dados próprios + subordinados SEM acesso financeiro (igual Financial.tsx atual)
- Cards em **Team**: Dados de toda a equipe visível (usar `useTeamData`)

```tsx
// Cards normais
const { ownPatients, ownSessions } = useOwnData(allPatients, allSessions, subordinateIds);

// Cards de Team
const { teamPatients, teamSessions } = useTeamData();
```

---

### ❓ 3. Filtro de Período Temporal

**Pergunta**: Todos os cards têm filtro de período?

**Resposta**: **SIM** (igual Financial.tsx atual)

**Implementação**:
```tsx
// Reutilizar useChartTimeScale
const { 
  period, 
  setPeriod, 
  customStartDate, 
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  getDateRange 
} = useChartTimeScale();

// Filtro global no topo da tela Metrics
<Select value={period} onValueChange={setPeriod}>
  <SelectItem value="month">Último Mês</SelectItem>
  <SelectItem value="3months">3 Meses</SelectItem>
  <SelectItem value="6months">6 Meses</SelectItem>
  <SelectItem value="year">Ano Atual</SelectItem>
  <SelectItem value="custom">Personalizado</SelectItem>
</Select>
```

---

### ❓ 4. Comparativos com Período Anterior

**Pergunta**: Cards devem mostrar comparação com período anterior (ex: +15% vs mês passado)?

**Resposta**: **NÃO por enquanto** (pode ser FASE C3.8 - Polimento Avançado)

**Justificativa**:
- Aumenta complexidade
- Não existe no Financial.tsx atual
- Pode ser adicionado depois sem quebrar nada

---

### ❓ 5. Exportação de Métricas

**Pergunta**: Usuários podem exportar métricas (CSV, PDF)?

**Resposta**: **NÃO** (escopo fora da TRACK C3)

**Justificativa**:
- Feature nova, não existe hoje
- Pode ser TRACK C4 futura

---

### ❓ 6. Permissões Granulares por Sub-aba

**Pergunta**: Um usuário pode ter acesso a "financial" mas não a sub-aba "NFSe"?

**Resposta**: **NÃO** (simplificar)

**Justificativa**:
- Muito complexo para o valor entregue
- Permissões por domain já são suficientes
- Cards individuais já têm filtro de permissão

---

### ❓ 7. Responsividade Mobile

**Pergunta**: Layout mobile usa tabs verticais ou horizontal scroll?

**Resposta**: **Horizontal scroll** (igual tabs existentes)

**Implementação**:
```tsx
// TabsList já tem scroll horizontal automático
<TabsList className="w-full overflow-x-auto">
  {visibleTabs.map(tab => (
    <TabsTrigger key={tab.id} value={tab.id}>
      {tab.label}
    </TabsTrigger>
  ))}
</TabsList>
```

---

### ❓ 8. Atualização em Tempo Real

**Pergunta**: Alguma métrica precisa de atualização em tempo real (websockets)?

**Resposta**: **NÃO** (React Query + polling é suficiente)

**Justificativa**:
- Métricas não mudam com tanta frequência
- Polling a cada 30s é adequado
- Websockets aumentam complexidade

```tsx
const { data } = useQuery({
  queryKey: ['sessions', userId],
  queryFn: fetchSessions,
  refetchInterval: 30000, // Poll a cada 30s
});
```

---

### ❓ 9. Design e Componentes

**Pergunta**: Usar mesma linguagem visual da Dashboard e Patient Overview?

**Resposta**: **SIM** (consistência total)

**Componentes**:
- `Card`, `CardHeader`, `CardTitle`, `CardContent` (shadcn)
- `LineChart`, `BarChart`, `PieChart` (Recharts)
- `Select`, `Tabs`, `Badge` (shadcn)

**Cores**: Usar `COLORS` array do Financial.tsx:
```tsx
const COLORS = [
  'hsl(100, 20%, 55%)', 
  'hsl(100, 25%, 65%)', 
  'hsl(100, 30%, 75%)', 
  'hsl(100, 15%, 45%)', 
  'hsl(100, 35%, 85%)', 
  'hsl(40, 35%, 75%)'
];
```

---

## 📦 CHECKLIST COMPLETO DE IMPLEMENTAÇÃO

### FASE C3.1 - Fundação e Estrutura

#### 1.1 Rota e Navegação
- [ ] Criar `/metrics` em `App.tsx`
- [ ] Remover dropdown "Métricas" do Navbar
- [ ] Adicionar link direto "Métricas" no Navbar
- [ ] Implementar `PermissionRoute` wrapper

#### 1.2 Componente Principal
- [ ] Criar `src/pages/Metrics.tsx`
- [ ] Implementar abas de domains (Financeiro, Administrativo, Marketing, Equipe)
- [ ] Implementar filtro de abas por permissão (`useEffectivePermissions`)
- [ ] Adicionar filtro de período global (reutilizar `useChartTimeScale`)

#### 1.3 Tipos e Interfaces
- [ ] Criar `src/types/metricsCardTypes.ts`
  - `MetricsCardConfig`
  - `MetricsCardProps`
  - `MetricsLayoutConfig`

---

### FASE C3.2 - Sistema de Persistência

#### 2.1 Banco de Dados
- [ ] Avaliar: Generalizar `user_layout_preferences` (adicionar `layout_type`)
- [ ] OU: Criar nova tabela `metrics_layouts`
- [ ] Migração SQL
- [ ] Testar RLS policies

#### 2.2 Hook de Layout
- [ ] Opção A: Generalizar `useDashboardLayout` → `useLayoutPersistence(layoutType)`
- [ ] Opção B: Criar `useMetricsLayout` (código próprio)
- [ ] Implementar auto-save com debounce
- [ ] Implementar reset de layout

#### 2.3 Layout Padrão
- [ ] Criar `src/lib/defaultLayoutMetrics.ts`
- [ ] Definir layout padrão para cada domain
- [ ] Definir layout padrão para cada sub-aba

---

### FASE C3.3 - Card Registry e Componentização

#### 3.1 Registry Central
- [ ] Criar `src/lib/metricsCardRegistry.tsx`
- [ ] Catalogar todos os 22 cards existentes
- [ ] Definir `primaryDomain` e `secondaryDomains` de cada card
- [ ] Definir `section` (metrics vs sub-aba gráfica)

#### 3.2 Estrutura de Pastas
- [ ] Criar `src/components/cards/metrics/financial/`
- [ ] Criar `src/components/cards/metrics/administrative/`
- [ ] Criar `src/components/cards/metrics/marketing/`
- [ ] Criar `src/components/cards/metrics/team/`

---

### FASE C3.4 - Cards Financeiros (8 numéricos + 6 gráficos)

#### 4.1 Cards Numéricos
- [ ] `TotalRevenueCard.tsx`
- [ ] `AvgSessionCard.tsx`
- [ ] `MissedRateCard.tsx` (domain: administrative + financial)
- [ ] `ActivePatientsCard.tsx`
- [ ] `ForecastRevenueCard.tsx`
- [ ] `AvgRevenuePerPatientCard.tsx`
- [ ] `LostRevenueCard.tsx`
- [ ] `OccupationRateCard.tsx` (domain: administrative)

#### 4.2 Gráficos - Sub-aba Distribuição
- [ ] `PatientDistributionCard.tsx` (PieChart)
- [ ] `RevenueByMonthCard.tsx` (BarChart)
- [ ] `MissedDistributionCard.tsx` (PieChart)

#### 4.3 Gráficos - Sub-aba Desempenho
- [ ] `RevenueChartCard.tsx` (LineChart)
- [ ] `MissedRateChartCard.tsx` (LineChart)

#### 4.4 Gráficos - Sub-aba Retenção
- [ ] `AvgRevenueChartCard.tsx` (BarChart)
- [ ] `InactivePatientsCard.tsx` (LineChart)

#### 4.5 Gráficos - Sub-aba Pagamentos
- [ ] `PaymentStatusCard.tsx` (BarChart + PieChart)

---

### FASE C3.5 - Cards Administrativos

#### 5.1 Cards Numéricos
- [ ] `OccupationRateCard.tsx` (já criado em C3.4)
- [ ] `MissedRateCard.tsx` (já criado em C3.4)
- [ ] `ActivePatientsCard.tsx` (já criado em C3.4)

#### 5.2 Gráficos
- [ ] `OccupationChartCard.tsx`
- [ ] `MissedByPatientCard.tsx`

---

### FASE C3.6 - Cards de Marketing (Website - Mockados)

#### 6.1 Cards Numéricos
- [ ] `WebsiteViewsCard.tsx`
- [ ] `UniqueVisitorsCard.tsx`
- [ ] `ConversionRateCard.tsx`
- [ ] `ClickThroughRateCard.tsx`

#### 6.2 Cards Informativos
- [ ] `TopPagesCard.tsx`
- [ ] `TrafficSourceCard.tsx`

#### 6.3 Alerta de Dados Mockados
- [ ] Adicionar badge "Dados de Exemplo" em todos os cards de Website
- [ ] Adicionar tooltip explicando que integração com Analytics é futura

---

### FASE C3.7 - Cards de Equipe (Team)

#### 7.1 Avaliar Cards Necessários
- [ ] Definir quais métricas de equipe são relevantes
- [ ] Verificar se já existem no DashboardExample
- [ ] Criar cards específicos (ex: `TeamRevenueCard`, `TeamPerformanceCard`)

#### 7.2 Integração com useTeamData
- [ ] Usar `useTeamData()` para buscar dados de subordinados
- [ ] Implementar filtro por `level_sharing_config` e `peer_sharing`
- [ ] Garantir que apenas usuários com permissão veem a aba Team

---

### FASE C3.8 - Integração de Layout (Drag & Drop + Resize)

#### 8.1 GridCardContainer
- [ ] Integrar `GridCardContainer` em cada seção (metrics + sub-abas)
- [ ] Configurar `cols={12}`, `rowHeight={60}`, etc
- [ ] Implementar `draggableHandle=".drag-handle"`

#### 8.2 Controles de Layout
- [ ] Botão "Editar Layout" (modo de edição)
- [ ] Botão "Salvar Layout"
- [ ] Botão "Resetar Layout"
- [ ] Badge de "Layout Modificado"

#### 8.3 Persistência
- [ ] Salvar layout ao arrastar/redimensionar (debounce)
- [ ] Carregar layout salvo ao abrir a tela
- [ ] Restaurar layout padrão ao resetar

---

### FASE C3.9 - Polimento UX/UI

#### 9.1 Loading States
- [ ] Skeleton loader para cards numéricos
- [ ] Skeleton loader para gráficos
- [ ] Loading state de permissões
- [ ] Loading state de dados

#### 9.2 Empty States
- [ ] Mensagem "Nenhum dado disponível para o período selecionado"
- [ ] Mensagem "Você não tem permissão para visualizar esta aba"
- [ ] Mensagem "Nenhuma sessão registrada ainda"

#### 9.3 Error States
- [ ] Tratamento de erro de permissão (redirect para Dashboard)
- [ ] Tratamento de erro de query Supabase
- [ ] Toast de erro ao salvar layout

#### 9.4 Feedback Visual
- [ ] Toast de sucesso ao salvar layout
- [ ] Toast de sucesso ao resetar layout
- [ ] Badge de "Layout Modificado" (não salvo)
- [ ] Animação de transição entre abas

#### 9.5 Responsividade
- [ ] Testar layout em mobile
- [ ] Ajustar grid para mobile (cols reduzido)
- [ ] Garantir scroll horizontal das tabs

---

### FASE C3.10 - QA e Documentação

#### 10.1 Testes Manuais
- [ ] Testar filtro de abas por permissão (Admin, Owner, Assistant, Accountant, Psychologist)
- [ ] Testar filtro de cards por permissão
- [ ] Testar drag & drop de cards
- [ ] Testar resize de cards
- [ ] Testar persistência de layout (salvar, carregar, resetar)
- [ ] Testar filtro de período (month, 3months, 6months, year, custom)
- [ ] Testar sub-abas de cada domain
- [ ] Testar responsividade mobile

#### 10.2 Validação de Dados
- [ ] Verificar se dados financeiros batem com Financial.tsx atual
- [ ] Verificar se cálculos de métricas estão corretos
- [ ] Verificar se filtro de período afeta todos os cards
- [ ] Verificar se queries estão otimizadas (sem N+1)

#### 10.3 Documentação
- [ ] Criar `docs/TRACK_C3_RELATORIO_COMPLETO.md`
- [ ] Criar `docs/METRICS_SYSTEM_OVERVIEW.md`
- [ ] Criar `docs/TRACK_C3_QA_CHECKLIST.md`
- [ ] Atualizar `docs/ARQUITETURA_SISTEMA_REFERENCE.md` (se necessário)

---

## 🚨 RESTRIÇÕES E NÃO-ESCOPO

### ❌ O que NÃO fazer:

1. **NÃO alterar schema de banco** (exceto generalizar `user_layout_preferences`)
2. **NÃO alterar RLS policies** (apenas reutilizar as existentes)
3. **NÃO criar novos domains** (usar apenas: financial, administrative, marketing, team)
4. **NÃO integrar com Google Analytics ainda** (manter Website mockado)
5. **NÃO criar cards clínicos** (não existem no Financial.tsx atual)
6. **NÃO implementar exportação de dados** (CSV, PDF)
7. **NÃO implementar comparativos com período anterior** (pode ser fase futura)
8. **NÃO implementar permissões granulares por sub-aba** (complexidade desnecessária)
9. **NÃO usar websockets** (polling é suficiente)
10. **NÃO alterar lógica de negócio de métricas** (apenas migrar código existente)

---

## 🎯 CRITÉRIOS DE SUCESSO

### ✅ A TRACK C3 está completa quando:

1. Rota `/metrics` funcionando com abas de domains
2. Filtro de abas por permissão implementado e testado
3. Todos os 22 cards existentes migrados e funcionando
4. Layout personalizável (drag & drop + resize) implementado
5. Persistência Supabase funcionando (salvar, carregar, resetar)
6. Filtro de período global funcionando em todos os cards
7. Cards de Team implementados (se aplicável)
8. Cards de Website mockados com alerta de "Dados de Exemplo"
9. QA completo realizado (todos os roles e permissões testados)
10. Documentação completa gerada

---

## 📝 OBSERVAÇÕES FINAIS

### 🔧 Arquitetura
- **Reutilizar TUDO** do sistema existente (hooks, componentes, utils)
- **Generalizar** ao invés de duplicar (ex: `useLayoutPersistence`)
- **Consistência** visual e de código (mesma estrutura do Dashboard)

### 🎨 Design
- Manter identidade visual do Financial.tsx atual
- Usar mesmos componentes e cores
- Garantir responsividade

### 🔐 Segurança
- Usar `resolveEffectivePermissions` (fonte única de verdade)
- Validar permissões no frontend E no backend (queries Supabase)
- RLS policies já implementadas devem ser suficientes

### 📊 Performance
- Queries independentes por card (igual Dashboard)
- React Query para caching
- Polling a cada 30s (sem websockets)

---

## 🚀 PRÓXIMAS FASES (Pós-TRACK C3)

### TRACK C4 - Integração com Analytics Real
- Integrar Google Analytics ou Plausible
- Substituir dados mockados de Website
- Adicionar métricas de Redes Sociais

### TRACK C5 - Métricas Avançadas
- Comparativos com período anterior
- Exportação de dados (CSV, PDF)
- Alertas e notificações de métricas

### TRACK C6 - Métricas Clínicas
- Criar cards clínicos (evolução de pacientes, efetividade de tratamentos)
- Integrar com sistema de templates clínicos (TRACK C2)

---

**FIM DO ESCOPO COMPLETO DA TRACK C3**
