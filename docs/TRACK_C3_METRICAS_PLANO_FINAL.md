# 📊 TRACK C3 - REFATORAÇÃO COMPLETA DE MÉTRICAS
## PLANO FINAL DE IMPLEMENTAÇÃO (TODAS DECISÕES DEFINIDAS)

---

## 🎯 OBJETIVO GERAL

Refatorar completamente a área de métricas (`/financial` + `/metrics/website`) em uma **tela unificada** (`/metrics`) com:

- **Abas por domain** (Financial, Administrative, Marketing, Team)
- **Sistema de permissões** totalmente integrado ao sistema organizacional existente
- **Layout personalizável** (drag & drop + resize + persistência Supabase)
- **Comparativos temporais** inteligentes (vs período anterior)
- **Escalas de tempo adaptativas** (portado da /dashboard)
- **Arquitetura 100% consistente** com o resto do sistema

---

## 📦 1. INVENTÁRIO COMPLETO DE CARDS EXISTENTES

### 1.1 Cards na página `/financial` (Financial.tsx)

#### **SEÇÃO 1: CARDS MÉTRICOS (Topo - 8 cards numéricos)**

| # | ID | Nome | Domain(s) | Ícone | Dados Reais? |
|---|---|---|---|---|---|
| 1 | `metrics-revenue-total` | Receita Total | `financial` | `DollarSign` | ✅ Real |
| 2 | `metrics-avg-per-session` | Média por Sessão | `financial` | `TrendingUp` | ✅ Real |
| 3 | `metrics-missed-rate` | Taxa de Faltas | `administrative` | `AlertCircle` | ✅ Real |
| 4 | `metrics-active-patients` | Pacientes Ativos | `administrative` | `Users` | ✅ Real |
| 5 | `metrics-forecast-revenue` | Previsão Mensal | `financial` | `Target` | ✅ Real |
| 6 | `metrics-avg-per-active-patient` | Média por Paciente Ativo | `financial` | `Activity` | ✅ Real |
| 7 | `metrics-lost-revenue` | Perdido com Faltas | `financial`, `administrative` | `AlertCircle` | ✅ Real |
| 8 | `metrics-occupation-rate` | Taxa de Ocupação | `administrative` | `Percent` | ✅ Real |

**CARACTERÍSTICAS:**
- Calculados em tempo real (fórmulas no próprio card)
- Fontes: `sessions`, `nfse_issued`, `nfse_payments`, `patients`
- Filtro de período aplicado (3m, 6m, ano, custom)
- **DECISÃO:** Seção com drag & drop habilitado (como /dashboard)

---

#### **SEÇÃO 2: CARDS GRÁFICOS (15 gráficos + sub-abas)**

**Sub-aba: DISTRIBUIÇÕES**

| # | ID | Nome | Tipo | Domain(s) | Dados Reais? |
|---|---|---|---|---|---|
| 9 | `chart-revenue-monthly` | Receita Mensal | `LineChart` | `financial` | ✅ Real |
| 10 | `chart-patient-distribution` | Distribuição por Paciente | `PieChart` | `financial`, `team` | ✅ Real |
| 11 | `chart-sessions-vs-expected` | Sessões vs Esperadas | `BarChart` | `administrative` | ✅ Real |

**Sub-aba: DESEMPENHO**

| # | ID | Nome | Tipo | Domain(s) | Dados Reais? |
|---|---|---|---|---|---|
| 12 | `chart-missed-rate-monthly` | Taxa de Faltas Mensal | `LineChart` | `administrative` | ✅ Real |
| 13 | `chart-avg-revenue-per-patient` | Faturamento Médio por Paciente | `BarChart` | `financial`, `team` | ✅ Real |
| 14 | `chart-missed-by-patient` | Faltas por Paciente | `BarChart` | `administrative`, `team` | ✅ Real |
| 15 | `chart-ticket-comparison` | Ticket Médio: Mensais vs Semanais | `BarChart` | `financial` | ✅ Real |

**Sub-aba: TENDÊNCIAS**

| # | ID | Nome | Tipo | Domain(s) | Dados Reais? |
|---|---|---|---|---|---|
| 16 | `chart-growth-trend` | Crescimento Mês a Mês | `LineChart` | `financial` | ✅ Real |
| 17 | `chart-new-vs-inactive` | Pacientes Novos vs Encerrados | `BarChart` | `administrative`, `team` | ✅ Real |
| 18 | `chart-lost-revenue-monthly` | Valor Perdido por Faltas (Mensal) | `BarChart` | `financial`, `administrative` | ✅ Real |

**Sub-aba: RETENÇÃO** (apenas cards de retenção)

| # | ID | Nome | Tipo | Domain(s) | Dados Reais? |
|---|---|---|---|---|---|
| 19 | `chart-retention-rate` | Taxa de Retenção | `BarChart` | `administrative`, `team` | ✅ Real |
| 20 | `chart-missed-distribution` | Distribuição de Faltas | `PieChart` | `administrative`, `team` | ✅ Real |

**SUBTOTAL /financial:** 20 cards (8 métricos + 12 gráficos)

---

### 1.2 Cards na página `/metrics/website` (WebsiteMetrics.tsx)

#### **SEÇÃO 1: CARDS MÉTRICOS (4 cards numéricos)**

| # | ID | Nome | Domain | Ícone | Dados Reais? |
|---|---|---|---|---|---|
| 21 | `metrics-website-views` | Visualizações | `marketing` | `Eye` | ❌ Mockado |
| 22 | `metrics-website-visitors` | Visitantes Únicos | `marketing` | `Users` | ❌ Mockado |
| 23 | `metrics-website-conversion` | Taxa de Conversão | `marketing` | `TrendingUp` | ❌ Mockado |
| 24 | `metrics-website-ctr` | Taxa de Cliques (CTR) | `marketing` | `MousePointerClick` | ❌ Mockado |

#### **SEÇÃO 2: CARDS INFORMATIVOS (2 cards)**

| # | ID | Nome | Tipo | Domain | Dados Reais? |
|---|---|---|---|---|---|
| 25 | `chart-website-top-pages` | Páginas Mais Visitadas | Lista | `marketing` | ❌ Mockado |
| 26 | `chart-website-traffic-sources` | Origem do Tráfego | Lista | `marketing` | ❌ Mockado |

**NOTA:** Integração com Google Analytics será **FASE FUTURA**. Por agora, manter placeholders com dados mockados.

**SUBTOTAL /website:** 6 cards (4 métricos + 2 informativos)

---

### **TOTAL GERAL: 26 CARDS**

**Distribuição por Domain:**
- **Financial:** 10 cards únicos
- **Administrative:** 10 cards únicos
- **Marketing:** 6 cards únicos
- **Team:** 7 cards compartilhados (aparecem apenas na aba Team)

---

## 🗂️ 2. ARQUITETURA COMPLETA DA NOVA TELA `/metrics`

### 2.1 Estrutura de Abas e Sub-abas

#### **ABAS PRINCIPAIS (Domains)**

Ordem de exibição (da esquerda para direita):

1. **Financeiro** (`financial`)
2. **Administrativo** (`administrative`)
3. **Marketing** (`marketing`)
4. **Equipe** (`team`)

**FILTRO POR PERMISSÃO:**
- Abas são renderizadas APENAS se o usuário tem acesso ao domain
- Lógica detalhada na seção 3 (Sistema de Permissões)

---

#### **Domain: FINANCEIRO (`financial`)**

**SEÇÃO SUPERIOR - Cards Métricos (Grid Responsivo):**

Layout responsivo:
- Desktop (≥1024px): 4 colunas
- Tablet (768-1023px): 2 colunas
- Mobile (<768px): 1 coluna

Cards:
1. Receita Total
2. Média por Sessão
3. Previsão Mensal
4. Média por Paciente Ativo
5. Perdido com Faltas

**DECISÃO IMPORTANTE:** Cards métricos **COM DRAG & DROP** (mesmo que /dashboard).

---

**SEÇÃO INFERIOR - Sub-abas Gráficas:**

**Sub-aba: Distribuições**
- Chart: Receita Mensal (LineChart)
- Chart: Distribuição por Paciente (PieChart)

**Sub-aba: Desempenho**
- Chart: Faturamento Médio por Paciente (BarChart)
- Chart: Ticket Médio: Mensais vs Semanais (BarChart)

**Sub-aba: Tendências**
- Chart: Crescimento Mês a Mês (LineChart)
- Chart: Valor Perdido por Faltas (BarChart)

**CARACTERÍSTICAS:**
- React Grid Layout (12 colunas)
- Drag & Drop habilitado
- Resize habilitado
- Persistência em Supabase (debounce 2s)
- localStorage como cache

---

#### **Domain: ADMINISTRATIVO (`administrative`)**

**SEÇÃO SUPERIOR - Cards Métricos:**

1. Taxa de Faltas
2. Pacientes Ativos
3. Taxa de Ocupação

---

**SEÇÃO INFERIOR - Sub-abas Gráficas:**

**Sub-aba: Distribuições**
- Chart: Sessões vs Esperadas (BarChart)

**Sub-aba: Desempenho**
- Chart: Taxa de Faltas Mensal (LineChart)
- Chart: Faltas por Paciente (BarChart)

**Sub-aba: Retenção**
- Chart: Taxa de Retenção (BarChart)
- Chart: Distribuição de Faltas (PieChart)

---

#### **Domain: MARKETING (`marketing`)**

**SEÇÃO SUPERIOR - Cards Métricos:**

1. Visualizações (mockado)
2. Visitantes Únicos (mockado)
3. Taxa de Conversão (mockado)
4. CTR (mockado)

---

**SEÇÃO INFERIOR - Sub-abas Gráficas:**

**Sub-aba: Website**
- Card: Páginas Mais Visitadas (Lista)
- Card: Origem do Tráfego (Lista)

**Sub-aba: Redes Sociais** (placeholder para futuro)
- Vazia por enquanto (placeholder visual)

**NOTA:** Todos os dados de Marketing são **mockados** até integração com Google Analytics (fase futura).

---

#### **Domain: EQUIPE (`team`) - REGRAS ESPECIAIS**

⚠️ **ATENÇÃO CRÍTICA:**

**Escopo de Dados da Equipe:**
- Dados puxados da **estrutura organizacional** do usuário
- Respeita **TODAS** as permissões configuradas em `/orgmanagement`
- Se um nível não tem acesso a dados financeiros de subordinados → cards financeiros da equipe **NÃO RENDERIZAM** esses dados
- Se um nível não tem acesso a dados administrativos → cards administrativos da equipe **NÃO RENDERIZAM**

**Duplo Domain em Cards de Equipe:**

Todos os cards de equipe têm **2 domains**:
1. `primaryDomain: 'team'` (identifica que é dado de equipe)
2. `secondaryDomains: ['financial' | 'administrative' | ...]` (identifica o tipo de dado)

**Exemplo:**
```typescript
{
  id: 'chart-avg-revenue-per-patient',
  primaryDomain: 'team',
  secondaryDomains: ['financial'],
  component: ChartAvgRevenuePerPatient,
}
```

**Lógica de Renderização:**
- Usuário precisa ter acesso a **TEAM** E ao domain secundário
- Se `financialAccess === 'none'` → card financeiro de equipe **NÃO aparece**
- Se `canViewTeamFinancialSummary === false` → cards financeiros de equipe **NÃO aparecem**

---

**SEÇÃO SUPERIOR - Cards Métricos:**

(Nenhum card métrico dedicado apenas à equipe)

---

**SEÇÃO INFERIOR - Sub-abas Gráficas:**

**Sub-aba: Desempenho**
- Chart: Faturamento Médio por Paciente (`team` + `financial`)
- Chart: Faltas por Paciente (`team` + `administrative`)

**Sub-aba: Distribuições**
- Chart: Distribuição por Paciente (`team` + `financial`)

**Sub-aba: Retenção**
- Chart: Taxa de Retenção (`team` + `administrative`)
- Chart: Distribuição de Faltas (`team` + `administrative`)
- Chart: Pacientes Novos vs Encerrados (`team` + `administrative`)

**REGRA DE EXCLUSIVIDADE:**
Cards com `primaryDomain: 'team'` aparecem **APENAS** na aba Team, **NUNCA** nas outras abas.

---

### 2.2 Layout Visual Completo

```
┌────────────────────────────────────────────────────────────────────┐
│  /metrics - Métricas                                    [Filtro Período ▼] │
├────────────────────────────────────────────────────────────────────┤
│  [Aba Financial] [Aba Administrative] [Aba Marketing] [Aba Team]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SEÇÃO 1: CARDS MÉTRICOS (Grid Responsivo + Drag & Drop)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ Card 1   │ │ Card 2   │ │ Card 3   │ │ Card 4   │             │
│  │ 📊 1.2M  │ │ 📈 R$150 │ │ ⚠️ 12%   │ │ 👥 45    │             │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│                                                                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Sub-aba Distribuições] [Desempenho] [Tendências] [Retenção]      │
│                                                                      │
│  SEÇÃO 2: CARDS GRÁFICOS (React Grid Layout)                       │
│  ┌─────────────────────────┐ ┌─────────────────────────┐          │
│  │                         │ │                         │          │
│  │  📊 Receita Mensal     │ │  🥧 Distribuição       │          │
│  │  (LineChart)           │ │  por Paciente          │          │
│  │                         │ │  (PieChart)            │          │
│  └─────────────────────────┘ └─────────────────────────┘          │
│                                                                      │
│  [GridCardContainer: Drag & Drop + Resize habilitados]             │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

**DECISÕES IMPLEMENTADAS:**
✅ Cards métricos (topo) **COM drag & drop** (como /dashboard)  
✅ Cards gráficos (inferior) **COM drag & drop + resize**  
✅ Filtro de período (3m, 6m, ano, custom) no topo direito  
✅ Tabs de domains (Shadcn Tabs)  
✅ Sub-tabs de categorias (Shadcn Tabs secundário)  
✅ Layout 100% responsivo (mobile-first)  
✅ Mesmo design system da /dashboard (tokens CSS, cores HSL)

---

## 🔐 3. SISTEMA DE PERMISSÕES (INTEGRAÇÃO COMPLETA)

### 3.1 Fontes de Permissão (Já Existentes)

**1. useEffectivePermissions (hook principal)**

Retorna objeto `EffectivePermissions` com:

```typescript
interface EffectivePermissions {
  canAccessClinical: boolean;
  financialAccess: 'none' | 'summary' | 'full';
  canAccessMarketing: boolean;
  canAccessWhatsapp: boolean;
  canEditSchedules: boolean;
  canViewTeamFinancialSummary: boolean;
  isOrganizationOwner: boolean;
  // ... outros campos
}
```

**Fonte:** `src/lib/resolveEffectivePermissions.ts`  
**Usa:** `level_role_settings` + `organization_owners` + `user_roles` + hierarquia organizacional

---

**2. useAuth (role global)**

```typescript
interface AuthContext {
  roleGlobal: 'admin' | 'psychologist' | 'assistant' | 'accountant';
  isAdmin: boolean;
  organizationId: string | null;
  // ... outros campos
}
```

**Fonte:** `src/contexts/AuthContext.tsx`

---

**3. useCardPermissions (validação por card)**

```typescript
const { canViewCard } = useCardPermissions();

const isVisible = canViewCard({
  primaryDomain: 'financial',
  secondaryDomains: ['team'],
});
```

**Fonte:** `src/hooks/useCardPermissions.ts`  
**Usa:** `useEffectivePermissions` + `useAuth`

---

### 3.2 Lógica de Filtro de Abas (Domains Visíveis)

```typescript
// Pseudo-código (será implementado em Metrics.tsx)

const { 
  financialAccess, 
  canAccessMarketing, 
  canViewTeamFinancialSummary,
  isOrganizationOwner 
} = useEffectivePermissions();

const { roleGlobal, isAdmin, organizationId } = useAuth();

// Array de domains visíveis
const visibleDomains: PermissionDomain[] = [];

// ====================================
// DOMAIN: FINANCIAL
// ====================================
if (financialAccess !== 'none') {
  visibleDomains.push('financial');
}

// ====================================
// DOMAIN: ADMINISTRATIVE
// ====================================
// REGRA: Contadores NÃO veem Administrative
if (roleGlobal !== 'accountant') {
  visibleDomains.push('administrative');
}

// ====================================
// DOMAIN: MARKETING
// ====================================
if (canAccessMarketing) {
  visibleDomains.push('marketing');
}

// ====================================
// DOMAIN: TEAM
// ====================================
// REGRA: Apenas se tem acesso a dados de equipe
if (
  canViewTeamFinancialSummary || 
  isOrganizationOwner || 
  isAdmin
) {
  visibleDomains.push('team');
}

// ====================================
// EXCEÇÃO: SEM ORGANIZAÇÃO
// ====================================
// Se usuário não tem organization_id (sem tick de organização)
// → Tratado como Owner (full access)
if (!organizationId && !isAdmin) {
  visibleDomains = ['financial', 'administrative', 'marketing', 'team'];
}
```

---

### 3.3 Regras Especiais por Role

| Role | Financial | Administrative | Marketing | Team |
|------|-----------|----------------|-----------|------|
| **Admin** (Olimpo) | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Accountant** | ✅ Full | ❌ Negado | ❌ Negado | ❌ Negado |
| **Psychologist** | Depende de `financialAccess` | ✅ Full | Depende de `canAccessMarketing` | Depende de `canViewTeamFinancialSummary` |
| **Assistant** | ❌ Negado | ✅ Full | ✅ Full | ❌ Negado |
| **Owner de Org** | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Sem Organização** | ✅ Full | ✅ Full | ✅ Full | ✅ Full |

**NOTA CRÍTICA:**
- Sistema **NÃO usa mais** `therapist-full` vs `therapist-subordinate`
- Tudo é controlado via:
  1. `roleGlobal` (role principal)
  2. `level_role_settings` (permissões por nível hierárquico)
  3. `organization_owners` (ownership de organização)
  4. `user_positions` + `organization_positions` (hierarquia)

---

### 3.4 Validação por Card (Segunda Barreira)

Cada card tem configuração:

```typescript
interface MetricsCardConfig {
  id: string;
  primaryDomain: PermissionDomain;
  secondaryDomains?: PermissionDomain[];
  component: React.ComponentType<any>;
  defaultLayout: GridCardLayout;
  section: 'metrics' | 'charts'; // novo campo
  chartCategory?: 'distribuicoes' | 'desempenho' | 'tendencias' | 'retencao';
}
```

**Regra de Acesso:**

Usuário precisa ter acesso a **TODOS** os domains (primary + secondary).

**Exemplo 1:**
```typescript
{
  id: 'metrics-revenue-total',
  primaryDomain: 'financial',
  // Só precisa de 'financial'
}
// Visível se: financialAccess !== 'none'
```

**Exemplo 2:**
```typescript
{
  id: 'chart-avg-revenue-per-patient',
  primaryDomain: 'team',
  secondaryDomains: ['financial'],
  // Precisa de 'team' E 'financial'
}
// Visível se: canViewTeamFinancialSummary && financialAccess !== 'none'
```

**Exemplo 3:**
```typescript
{
  id: 'metrics-lost-revenue',
  primaryDomain: 'financial',
  secondaryDomains: ['administrative'],
  // Precisa de 'financial' E 'administrative'
}
// Visível se: financialAccess !== 'none' && roleGlobal !== 'accountant'
```

---

### 3.5 Regra de Exclusividade - Domain TEAM

⚠️ **REGRA CRÍTICA:**

Cards com `primaryDomain: 'team'` aparecem **APENAS** na aba Team.

**Motivo:** Evitar duplicação de cards entre abas.

**Implementação:**

```typescript
// Ao filtrar cards para aba 'financial'
const financialCards = allCards.filter(card => {
  // Se card tem primaryDomain 'team', NÃO aparece em outras abas
  if (card.primaryDomain === 'team') {
    return false;
  }
  
  // Se card tem 'financial' no primaryDomain ou secondaryDomains
  return (
    card.primaryDomain === 'financial' ||
    card.secondaryDomains?.includes('financial')
  );
});

// Ao filtrar cards para aba 'team'
const teamCards = allCards.filter(card => {
  // APENAS cards com primaryDomain 'team'
  return card.primaryDomain === 'team';
});
```

---

### 3.6 Hierarquia Organizacional e Dados de Equipe

**DECISÃO IMPLEMENTADA:**

Domain `team` puxa dados de **TODA a equipe** na estrutura organizacional do usuário, **RESPEITANDO** as permissões configuradas em `/orgmanagement`.

**Exemplo de Cenário:**

```
Organização: Clínica ABC
Níveis:
- Nível 1: Diretor (João)
- Nível 2: Coordenadores (Maria, José)
- Nível 3: Psicólogos (Ana, Pedro, Lucas)

Permissões do Nível 2 (Coordenadores):
- canViewTeamFinancialSummary: true
- financialAccess: 'summary' (não 'full')
- clinical_visible_to_superiors: false

Resultado para Maria (Coordenadora):
✅ Vê aba "Equipe"
✅ Vê card "Faturamento Médio por Paciente" (porque tem 'summary')
❌ NÃO vê detalhes financeiros individuais dos psicólogos (porque não é 'full')
❌ NÃO vê dados clínicos dos psicólogos (clinical_visible_to_superiors = false)
```

**Implementação nos Cards de Equipe:**

```typescript
// Dentro de cada card de equipe
const { organizationId } = useAuth();
const { canViewTeamFinancialSummary, financialAccess } = useEffectivePermissions();

// Buscar subordinados (função da hierarquia)
const subordinates = await getSubordinates(userId, organizationId);

// Filtrar subordinados baseado nas permissões
const visibleSubordinates = subordinates.filter(sub => {
  // Se card é financial E user não tem acesso 'full'
  if (cardDomain === 'financial' && financialAccess !== 'full') {
    return false; // Não renderiza esse subordinado
  }
  
  // Se card é clinical E clinical_visible_to_superiors = false
  if (cardDomain === 'clinical' && !sub.clinical_visible_to_superiors) {
    return false;
  }
  
  return true;
});

// Calcular métricas APENAS com subordinados visíveis
const metrics = calculateTeamMetrics(visibleSubordinates);
```

**Funções Hierárquicas Existentes (já implementadas):**
- `get_all_subordinates(user_id)` → retorna subordinados recursivamente
- `get_all_superiors(user_id)` → retorna superiores recursivamente
- `is_in_hierarchy_below(user_id, superior_id)` → verifica se está abaixo

---

## 💾 4. PERSISTÊNCIA DE LAYOUT (DECISÃO FINAL)

### 4.1 Estratégia: Generalizar Tabela (APROVADO)

**Decisão:** Usar tabela existente `user_layout_preferences` com novo valor `layout_type`.

**Migração SQL Necessária:**

```sql
-- Adicionar novo valor ao enum (se existir constraint)
-- Ou apenas adicionar novo tipo de layout ao sistema

-- Exemplo de registro:
INSERT INTO user_layout_preferences (
  user_id,
  layout_type,
  layout_config,
  version
) VALUES (
  'user-uuid',
  'metrics-grid', -- NOVO TIPO
  '{
    "metrics-financial": {
      "cardLayouts": [...]
    },
    "metrics-administrative": {
      "cardLayouts": [...]
    },
    "metrics-marketing": {
      "cardLayouts": [...]
    },
    "metrics-team": {
      "cardLayouts": [...]
    }
  }',
  1
);
```

**Estrutura da Tabela (já existe):**

```sql
CREATE TABLE user_layout_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_type TEXT NOT NULL, -- 'dashboard-example-grid', 'patient-overview', 'metrics-grid'
  layout_config JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, layout_type)
);
```

**Valores de `layout_type`:**
- `'dashboard-example-grid'` (já existe)
- `'patient-overview'` (já existe)
- `'metrics-grid'` ← **NOVO**

---

### 4.2 Estrutura do `layout_config` (JSONB)

```json
{
  "metrics-financial": {
    "metricCards": [
      {
        "i": "metrics-revenue-total",
        "x": 0,
        "y": 0,
        "w": 3,
        "h": 1,
        "minW": 2,
        "minH": 1,
        "maxW": 6,
        "maxH": 2
      },
      {
        "i": "metrics-avg-per-session",
        "x": 3,
        "y": 0,
        "w": 3,
        "h": 1,
        "minW": 2,
        "minH": 1
      }
      // ... outros cards métricos
    ],
    "chartCards": {
      "distribuicoes": [
        {
          "i": "chart-revenue-monthly",
          "x": 0,
          "y": 0,
          "w": 6,
          "h": 2,
          "minW": 4,
          "minH": 2
        },
        {
          "i": "chart-patient-distribution",
          "x": 6,
          "y": 0,
          "w": 6,
          "h": 2,
          "minW": 4,
          "minH": 2
        }
      ],
      "desempenho": [
        // ... layouts para sub-aba desempenho
      ],
      "tendencias": [
        // ... layouts para sub-aba tendências
      ]
    }
  },
  "metrics-administrative": {
    // ... mesma estrutura
  },
  "metrics-marketing": {
    // ... mesma estrutura
  },
  "metrics-team": {
    // ... mesma estrutura
  }
}
```

**NOTA:** Layouts são separados por:
1. Domain (financial, administrative, marketing, team)
2. Seção (metricCards vs chartCards)
3. Sub-aba (distribuicoes, desempenho, tendencias, retencao)

---

### 4.3 Estratégia de Cache (localStorage + Supabase)

**Exatamente igual a `useDashboardLayout`:**

1. **localStorage** como cache rápido
   - Keys: `metrics-grid-{domain}-metric-{cardId}`
   - Keys: `metrics-grid-{domain}-chart-{subTab}-{cardId}`
   - Salvamento imediato em mudanças
   - Limpeza em reset

2. **Supabase** como fonte da verdade
   - Load inicial: busca DB
   - Merge: localStorage sobrescreve se mais recente
   - Auto-save: debounce de 2 segundos
   - Versionamento: coluna `version`

**Fluxo:**

```
1. Usuário carrega /metrics
   ↓
2. Hook useMetricsLayout('financial') executa:
   - Busca localStorage primeiro
   - Busca Supabase em paralelo
   - Merge (localStorage wins se conflito)
   ↓
3. Usuário move/redimensiona card
   ↓
4. Salva imediatamente em localStorage
   ↓
5. Debounce de 2s → salva em Supabase
   ↓
6. Atualiza version++ no DB
```

---

### 4.4 Novo Hook: `useMetricsLayout`

**Arquivo:** `src/hooks/useMetricsLayout.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { GridCardLayout } from '@/types/gridTypes';
import { PermissionDomain } from '@/types/permissions';
import { debounce } from 'lodash';

interface UseMetricsLayoutParams {
  domain: PermissionDomain;
  section: 'metrics' | 'charts';
  subTab?: string; // para section='charts'
}

interface UseMetricsLayoutReturn {
  layouts: GridCardLayout[];
  saveLayout: (newLayouts: GridCardLayout[]) => void;
  resetLayout: () => void;
  isLoading: boolean;
}

export const useMetricsLayout = ({
  domain,
  section,
  subTab
}: UseMetricsLayoutParams): UseMetricsLayoutReturn => {
  const { user } = useAuth();
  const [layouts, setLayouts] = useState<GridCardLayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Key para localStorage
  const storageKey = `metrics-grid-${domain}-${section}${subTab ? `-${subTab}` : ''}`;
  
  // Key para path no JSONB do Supabase
  const configPath = section === 'metrics' 
    ? `metrics-${domain}.metricCards`
    : `metrics-${domain}.chartCards.${subTab}`;

  // 1. Load inicial (localStorage + Supabase)
  useEffect(() => {
    loadLayouts();
  }, [domain, section, subTab]);

  const loadLayouts = async () => {
    setIsLoading(true);
    
    try {
      // Buscar localStorage
      const localData = localStorage.getItem(storageKey);
      const localLayouts = localData ? JSON.parse(localData) : null;

      // Buscar Supabase
      const { data: dbData } = await supabase
        .from('user_layout_preferences')
        .select('layout_config, version')
        .eq('user_id', user?.id)
        .eq('layout_type', 'metrics-grid')
        .single();

      if (dbData) {
        // Extrair layouts do path específico
        const dbLayouts = getNestedValue(dbData.layout_config, configPath);
        
        // Merge: localStorage wins
        const finalLayouts = localLayouts || dbLayouts || [];
        setLayouts(finalLayouts);
      } else if (localLayouts) {
        setLayouts(localLayouts);
      } else {
        // Usar default layouts
        setLayouts(getDefaultLayouts(domain, section, subTab));
      }
    } catch (error) {
      console.error('Error loading metrics layout:', error);
      setLayouts(getDefaultLayouts(domain, section, subTab));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Save layout (localStorage imediato + Supabase com debounce)
  const saveLayout = useCallback((newLayouts: GridCardLayout[]) => {
    setLayouts(newLayouts);
    
    // Salvar imediatamente em localStorage
    localStorage.setItem(storageKey, JSON.stringify(newLayouts));
    
    // Salvar em Supabase com debounce
    debouncedSaveToSupabase(newLayouts);
  }, [storageKey]);

  const debouncedSaveToSupabase = useCallback(
    debounce(async (newLayouts: GridCardLayout[]) => {
      try {
        // Buscar config atual
        const { data: current } = await supabase
          .from('user_layout_preferences')
          .select('layout_config, version')
          .eq('user_id', user?.id)
          .eq('layout_type', 'metrics-grid')
          .single();

        let newConfig = current?.layout_config || {};
        
        // Atualizar path específico
        newConfig = setNestedValue(newConfig, configPath, newLayouts);

        if (current) {
          // Update
          await supabase
            .from('user_layout_preferences')
            .update({
              layout_config: newConfig,
              version: (current.version || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user?.id)
            .eq('layout_type', 'metrics-grid');
        } else {
          // Insert
          await supabase
            .from('user_layout_preferences')
            .insert({
              user_id: user?.id,
              layout_type: 'metrics-grid',
              layout_config: newConfig,
              version: 1
            });
        }
      } catch (error) {
        console.error('Error saving to Supabase:', error);
      }
    }, 2000),
    [user?.id, configPath]
  );

  // 3. Reset layout
  const resetLayout = useCallback(() => {
    const defaultLayouts = getDefaultLayouts(domain, section, subTab);
    setLayouts(defaultLayouts);
    localStorage.removeItem(storageKey);
    
    // Resetar também no Supabase
    // ... (implementação similar ao save)
  }, [domain, section, subTab, storageKey]);

  return {
    layouts,
    saveLayout,
    resetLayout,
    isLoading
  };
};

// Helper functions
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const newObj = { ...obj };
  let current = newObj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...current[keys[i]] };
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  return newObj;
}

function getDefaultLayouts(
  domain: PermissionDomain,
  section: 'metrics' | 'charts',
  subTab?: string
): GridCardLayout[] {
  // Importar de defaultLayoutMetrics.ts
  return getDefaultMetricsLayout(domain, section, subTab);
}
```

**NOTA:** Hook é **IDÊNTICO** em lógica ao `useDashboardLayout`, apenas mudando:
- `layout_type` para `'metrics-grid'`
- Estrutura JSONB (domains + seções + sub-tabs)
- Keys do localStorage

---

### 4.5 Arquivo de Layouts Padrão

**Arquivo:** `src/lib/defaultLayoutMetrics.ts`

```typescript
import { GridCardLayout } from '@/types/gridTypes';
import { PermissionDomain } from '@/types/permissions';

interface DefaultLayoutsStructure {
  [domain: string]: {
    metricCards: GridCardLayout[];
    chartCards: {
      [subTab: string]: GridCardLayout[];
    };
  };
}

export const DEFAULT_METRICS_LAYOUTS: DefaultLayoutsStructure = {
  // ========================================
  // DOMAIN: FINANCIAL
  // ========================================
  financial: {
    metricCards: [
      { i: 'metrics-revenue-total', x: 0, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
      { i: 'metrics-avg-per-session', x: 3, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
      { i: 'metrics-forecast-revenue', x: 6, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
      { i: 'metrics-avg-per-active-patient', x: 9, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
      { i: 'metrics-lost-revenue', x: 0, y: 1, w: 3, h: 1, minW: 2, minH: 1 },
    ],
    chartCards: {
      distribuicoes: [
        { i: 'chart-revenue-monthly', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
        { i: 'chart-patient-distribution', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      ],
      desempenho: [
        { i: 'chart-avg-revenue-per-patient', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
        { i: 'chart-ticket-comparison', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      ],
      tendencias: [
        { i: 'chart-growth-trend', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
        { i: 'chart-lost-revenue-monthly', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      ],
    },
  },

  // ========================================
  // DOMAIN: ADMINISTRATIVE
  // ========================================
  administrative: {
    metricCards: [
      { i: 'metrics-missed-rate', x: 0, y: 0, w: 4, h: 1, minW: 2, minH: 1 },
      { i: 'metrics-active-patients', x: 4, y: 0, w: 4, h: 1, minW: 2, minH: 1 },
      { i: 'metrics-occupation-rate', x: 8, y: 0, w: 4, h: 1, minW: 2, minH: 1 },
    ],
    chartCards: {
      distribuicoes: [
        { i: 'chart-sessions-vs-expected', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
      ],
      desempenho: [
        { i: 'chart-missed-rate-monthly', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
        { i: 'chart-missed-by-patient', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      ],
      retencao: [
        { i: 'chart-retention-rate', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
        { i: 'chart-missed-distribution', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      ],
    },
  },

  // ========================================
  // DOMAIN: MARKETING
  // ========================================
  marketing: {
    metricCards: [
      { i: 'metrics-website-views', x: 0, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
      { i: 'metrics-website-visitors', x: 3, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
      { i: 'metrics-website-conversion', x: 6, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
      { i: 'metrics-website-ctr', x: 9, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
    ],
    chartCards: {
      website: [
        { i: 'chart-website-top-pages', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
        { i: 'chart-website-traffic-sources', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      ],
    },
  },

  // ========================================
  // DOMAIN: TEAM
  // ========================================
  team: {
    metricCards: [],
    chartCards: {
      desempenho: [
        { i: 'chart-avg-revenue-per-patient', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
        { i: 'chart-missed-by-patient', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      ],
      distribuicoes: [
        { i: 'chart-patient-distribution', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
      ],
      retencao: [
        { i: 'chart-retention-rate', x: 0, y: 0, w: 4, h: 2, minW: 4, minH: 2 },
        { i: 'chart-missed-distribution', x: 4, y: 0, w: 4, h: 2, minW: 4, minH: 2 },
        { i: 'chart-new-vs-inactive', x: 8, y: 0, w: 4, h: 2, minW: 4, minH: 2 },
      ],
    },
  },
};

export function getDefaultMetricsLayout(
  domain: PermissionDomain,
  section: 'metrics' | 'charts',
  subTab?: string
): GridCardLayout[] {
  const domainLayouts = DEFAULT_METRICS_LAYOUTS[domain];
  
  if (!domainLayouts) {
    return [];
  }
  
  if (section === 'metrics') {
    return domainLayouts.metricCards;
  }
  
  if (section === 'charts' && subTab) {
    return domainLayouts.chartCards[subTab] || [];
  }
  
  return [];
}
```

---

## 📚 5. CARD REGISTRY DE MÉTRICAS

### 5.1 Novo Tipo: `MetricsCardConfig`

**Arquivo:** `src/types/metricsCardTypes.ts`

```typescript
import { PermissionDomain } from './permissions';
import { GridCardLayout } from './gridTypes';

export interface MetricsCardConfig {
  id: string;
  primaryDomain: PermissionDomain;
  secondaryDomains?: PermissionDomain[];
  component: React.ComponentType<MetricsCardProps>;
  defaultLayout: GridCardLayout;
  section: 'metrics' | 'charts';
  chartCategory?: 'distribuicoes' | 'desempenho' | 'tendencias' | 'retencao' | 'website';
  title: string;
  description?: string;
}

export interface MetricsCardProps {
  periodFilter: PeriodFilter;
  compareWithPrevious?: boolean;
}

export interface PeriodFilter {
  startDate: Date;
  endDate: Date;
  type: '3m' | '6m' | '1y' | 'custom';
}
```

---

### 5.2 Novo Arquivo: `src/lib/metricsCardRegistry.tsx`

```typescript
import { MetricsCardConfig } from '@/types/metricsCardTypes';

// ========================================
// IMPORTS - Cards Métricos
// ========================================
import { RevenueTotal } from '@/components/cards/metrics/financial/RevenueTotal';
import { AvgPerSession } from '@/components/cards/metrics/financial/AvgPerSession';
import { ForecastRevenue } from '@/components/cards/metrics/financial/ForecastRevenue';
import { AvgPerActivePatient } from '@/components/cards/metrics/financial/AvgPerActivePatient';
import { LostRevenue } from '@/components/cards/metrics/financial/LostRevenue';

import { MissedRate } from '@/components/cards/metrics/administrative/MissedRate';
import { ActivePatients } from '@/components/cards/metrics/administrative/ActivePatients';
import { OccupationRate } from '@/components/cards/metrics/administrative/OccupationRate';

import { WebsiteViews } from '@/components/cards/metrics/marketing/WebsiteViews';
import { WebsiteVisitors } from '@/components/cards/metrics/marketing/WebsiteVisitors';
import { WebsiteConversion } from '@/components/cards/metrics/marketing/WebsiteConversion';
import { WebsiteCTR } from '@/components/cards/metrics/marketing/WebsiteCTR';

// ========================================
// IMPORTS - Cards Gráficos
// ========================================
import { ChartRevenueMonthly } from '@/components/cards/metrics/financial/ChartRevenueMonthly';
import { ChartPatientDistribution } from '@/components/cards/metrics/financial/ChartPatientDistribution';
import { ChartAvgRevenuePerPatient } from '@/components/cards/metrics/financial/ChartAvgRevenuePerPatient';
import { ChartTicketComparison } from '@/components/cards/metrics/financial/ChartTicketComparison';
import { ChartGrowthTrend } from '@/components/cards/metrics/financial/ChartGrowthTrend';
import { ChartLostRevenueMonthly } from '@/components/cards/metrics/financial/ChartLostRevenueMonthly';

import { ChartSessionsVsExpected } from '@/components/cards/metrics/administrative/ChartSessionsVsExpected';
import { ChartMissedRateMonthly } from '@/components/cards/metrics/administrative/ChartMissedRateMonthly';
import { ChartMissedByPatient } from '@/components/cards/metrics/administrative/ChartMissedByPatient';
import { ChartRetentionRate } from '@/components/cards/metrics/administrative/ChartRetentionRate';
import { ChartMissedDistribution } from '@/components/cards/metrics/administrative/ChartMissedDistribution';

import { ChartWebsiteTopPages } from '@/components/cards/metrics/marketing/ChartWebsiteTopPages';
import { ChartWebsiteTrafficSources } from '@/components/cards/metrics/marketing/ChartWebsiteTrafficSources';

import { ChartNewVsInactive } from '@/components/cards/metrics/team/ChartNewVsInactive';

// ========================================
// REGISTRY
// ========================================
export const METRICS_CARDS: Record<string, MetricsCardConfig> = {
  // ========================================
  // FINANCIAL - Metric Cards
  // ========================================
  'metrics-revenue-total': {
    id: 'metrics-revenue-total',
    primaryDomain: 'financial',
    component: RevenueTotal,
    defaultLayout: { i: 'metrics-revenue-total', x: 0, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
    section: 'metrics',
    title: 'Receita Total',
    description: 'Receita total no período selecionado',
  },
  
  'metrics-avg-per-session': {
    id: 'metrics-avg-per-session',
    primaryDomain: 'financial',
    component: AvgPerSession,
    defaultLayout: { i: 'metrics-avg-per-session', x: 3, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
    section: 'metrics',
    title: 'Média por Sessão',
  },
  
  'metrics-forecast-revenue': {
    id: 'metrics-forecast-revenue',
    primaryDomain: 'financial',
    component: ForecastRevenue,
    defaultLayout: { i: 'metrics-forecast-revenue', x: 6, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
    section: 'metrics',
    title: 'Previsão Mensal',
  },
  
  'metrics-avg-per-active-patient': {
    id: 'metrics-avg-per-active-patient',
    primaryDomain: 'financial',
    component: AvgPerActivePatient,
    defaultLayout: { i: 'metrics-avg-per-active-patient', x: 9, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
    section: 'metrics',
    title: 'Média por Paciente Ativo',
  },
  
  'metrics-lost-revenue': {
    id: 'metrics-lost-revenue',
    primaryDomain: 'financial',
    secondaryDomains: ['administrative'],
    component: LostRevenue,
    defaultLayout: { i: 'metrics-lost-revenue', x: 0, y: 1, w: 3, h: 1, minW: 2, minH: 1 },
    section: 'metrics',
    title: 'Perdido com Faltas',
  },

  // ========================================
  // FINANCIAL - Chart Cards
  // ========================================
  'chart-revenue-monthly': {
    id: 'chart-revenue-monthly',
    primaryDomain: 'financial',
    component: ChartRevenueMonthly,
    defaultLayout: { i: 'chart-revenue-monthly', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    section: 'charts',
    chartCategory: 'distribuicoes',
    title: 'Receita Mensal',
  },
  
  'chart-patient-distribution': {
    id: 'chart-patient-distribution',
    primaryDomain: 'financial',
    secondaryDomains: ['team'],
    component: ChartPatientDistribution,
    defaultLayout: { i: 'chart-patient-distribution', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    section: 'charts',
    chartCategory: 'distribuicoes',
    title: 'Distribuição por Paciente',
  },
  
  'chart-avg-revenue-per-patient': {
    id: 'chart-avg-revenue-per-patient',
    primaryDomain: 'financial',
    secondaryDomains: ['team'],
    component: ChartAvgRevenuePerPatient,
    defaultLayout: { i: 'chart-avg-revenue-per-patient', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    section: 'charts',
    chartCategory: 'desempenho',
    title: 'Faturamento Médio por Paciente',
  },
  
  'chart-ticket-comparison': {
    id: 'chart-ticket-comparison',
    primaryDomain: 'financial',
    component: ChartTicketComparison,
    defaultLayout: { i: 'chart-ticket-comparison', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    section: 'charts',
    chartCategory: 'desempenho',
    title: 'Ticket Médio: Mensais vs Semanais',
  },
  
  'chart-growth-trend': {
    id: 'chart-growth-trend',
    primaryDomain: 'financial',
    component: ChartGrowthTrend,
    defaultLayout: { i: 'chart-growth-trend', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    section: 'charts',
    chartCategory: 'tendencias',
    title: 'Crescimento Mês a Mês',
  },
  
  'chart-lost-revenue-monthly': {
    id: 'chart-lost-revenue-monthly',
    primaryDomain: 'financial',
    secondaryDomains: ['administrative'],
    component: ChartLostRevenueMonthly,
    defaultLayout: { i: 'chart-lost-revenue-monthly', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    section: 'charts',
    chartCategory: 'tendencias',
    title: 'Valor Perdido por Faltas',
  },

  // ========================================
  // ADMINISTRATIVE - Metric Cards
  // ========================================
  'metrics-missed-rate': {
    id: 'metrics-missed-rate',
    primaryDomain: 'administrative',
    component: MissedRate,
    defaultLayout: { i: 'metrics-missed-rate', x: 0, y: 0, w: 4, h: 1, minW: 2, minH: 1 },
    section: 'metrics',
    title: 'Taxa de Faltas',
  },
  
  'metrics-active-patients': {
    id: 'metrics-active-patients',
    primaryDomain: 'administrative',
    component: ActivePatients,
    defaultLayout: { i: 'metrics-active-patients', x: 4, y: 0, w: 4, h: 1, minW: 2, minH: 1 },
    section: 'metrics',
    title: 'Pacientes Ativos',
  },
  
  'metrics-occupation-rate': {
    id: 'metrics-occupation-rate',
    primaryDomain: 'administrative',
    component: OccupationRate,
    defaultLayout: { i: 'metrics-occupation-rate', x: 8, y: 0, w: 4, h: 1, minW: 2, minH: 1 },
    section: 'metrics',
    title: 'Taxa de Ocupação',
  },

  // ========================================
  // ADMINISTRATIVE - Chart Cards
  // ========================================
  'chart-sessions-vs-expected': {
    id: 'chart-sessions-vs-expected',
    primaryDomain: 'administrative',
    component: ChartSessionsVsExpected,
    defaultLayout: { i: 'chart-sessions-vs-expected', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
    section: 'charts',
    chartCategory: 'distribuicoes',
    title: 'Sessões vs Esperadas',
  },
  
  'chart-missed-rate-monthly': {
    id: 'chart-missed-rate-monthly',
    primaryDomain: 'administrative',
    component: ChartMissedRateMonthly,
    defaultLayout: { i: 'chart-missed-rate-monthly', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    section: 'charts',
    chartCategory: 'desempenho',
    title: 'Taxa de Faltas Mensal',
  },
  
  'chart-missed-by-patient': {
    id: 'chart-missed-by-patient',
    primaryDomain: 'administrative',
    secondaryDomains: ['team'],
    component: ChartMissedByPatient,
    defaultLayout: { i: 'chart-missed-by-patient', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    section: 'charts',
    chartCategory: 'desempenho',
    title: 'Faltas por Paciente',
  },
  
  'chart-retention-rate': {
    id: 'chart-retention-rate',
    primaryDomain: 'administrative',
    secondaryDomains: ['team'],
    component: ChartRetentionRate,
    defaultLayout: { i: 'chart-retention-rate', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    section: 'charts',
    chartCategory: 'retencao',
    title: 'Taxa de Retenção',
  },
  
  'chart-missed-distribution': {
    id: 'chart-missed-distribution',
    primaryDomain: 'administrative',
    secondaryDomains: ['team'],
    component: ChartMissedDistribution,
    defaultLayout: { i: 'chart-missed-distribution', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    section: 'charts',
    chartCategory: 'retencao',
    title: 'Distribuição de Faltas',
  },

  // ========================================
  // MARKETING - Metric Cards
  // ========================================
  'metrics-website-views': {
    id: 'metrics-website-views',
    primaryDomain: 'marketing',
    component: WebsiteViews,
    defaultLayout: { i: 'metrics-website-views', x: 0, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
    section: 'metrics',
    title: 'Visualizações',
    description: 'Dados de exemplo (integração futura)',
  },
  
  'metrics-website-visitors': {
    id: 'metrics-website-visitors',
    primaryDomain: 'marketing',
    component: WebsiteVisitors,
    defaultLayout: { i: 'metrics-website-visitors', x: 3, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
    section: 'metrics',
    title: 'Visitantes Únicos',
    description: 'Dados de exemplo (integração futura)',
  },
  
  'metrics-website-conversion': {
    id: 'metrics-website-conversion',
    primaryDomain: 'marketing',
    component: WebsiteConversion,
    defaultLayout: { i: 'metrics-website-conversion', x: 6, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
    section: 'metrics',
    title: 'Taxa de Conversão',
    description: 'Dados de exemplo (integração futura)',
  },
  
  'metrics-website-ctr': {
    id: 'metrics-website-ctr',
    primaryDomain: 'marketing',
    component: WebsiteCTR,
    defaultLayout: { i: 'metrics-website-ctr', x: 9, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
    section: 'metrics',
    title: 'CTR',
    description: 'Dados de exemplo (integração futura)',
  },

  // ========================================
  // MARKETING - Chart Cards
  // ========================================
  'chart-website-top-pages': {
    id: 'chart-website-top-pages',
    primaryDomain: 'marketing',
    component: ChartWebsiteTopPages,
    defaultLayout: { i: 'chart-website-top-pages', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    section: 'charts',
    chartCategory: 'website',
    title: 'Páginas Mais Visitadas',
    description: 'Dados de exemplo (integração futura)',
  },
  
  'chart-website-traffic-sources': {
    id: 'chart-website-traffic-sources',
    primaryDomain: 'marketing',
    component: ChartWebsiteTrafficSources,
    defaultLayout: { i: 'chart-website-traffic-sources', x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    section: 'charts',
    chartCategory: 'website',
    title: 'Origem do Tráfego',
    description: 'Dados de exemplo (integração futura)',
  },

  // ========================================
  // TEAM - Chart Cards (APENAS)
  // ========================================
  'chart-new-vs-inactive': {
    id: 'chart-new-vs-inactive',
    primaryDomain: 'team',
    secondaryDomains: ['administrative'],
    component: ChartNewVsInactive,
    defaultLayout: { i: 'chart-new-vs-inactive', x: 8, y: 0, w: 4, h: 2, minW: 4, minH: 2 },
    section: 'charts',
    chartCategory: 'retencao',
    title: 'Pacientes Novos vs Encerrados',
  },
};

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getCardsByDomain(domain: PermissionDomain): MetricsCardConfig[] {
  return Object.values(METRICS_CARDS).filter(card => {
    // Se domain é 'team', retornar APENAS cards com primaryDomain 'team'
    if (domain === 'team') {
      return card.primaryDomain === 'team';
    }
    
    // Para outros domains, retornar cards que:
    // 1. Têm o domain como primaryDomain
    // 2. OU têm o domain em secondaryDomains
    // 3. MAS não têm primaryDomain 'team' (para evitar duplicação)
    return (
      card.primaryDomain !== 'team' &&
      (card.primaryDomain === domain || card.secondaryDomains?.includes(domain))
    );
  });
}

export function getMetricCards(domain: PermissionDomain): MetricsCardConfig[] {
  return getCardsByDomain(domain).filter(card => card.section === 'metrics');
}

export function getChartCards(
  domain: PermissionDomain,
  category?: string
): MetricsCardConfig[] {
  const chartCards = getCardsByDomain(domain).filter(card => card.section === 'charts');
  
  if (category) {
    return chartCards.filter(card => card.chartCategory === category);
  }
  
  return chartCards;
}

export function getAvailableSubTabs(domain: PermissionDomain): string[] {
  const chartCards = getCardsByDomain(domain).filter(card => card.section === 'charts');
  const categories = new Set(chartCards.map(card => card.chartCategory).filter(Boolean));
  return Array.from(categories) as string[];
}
```

---

### 5.3 Estrutura de Pastas para Componentes

```
src/components/cards/metrics/
├── financial/
│   ├── RevenueTotal.tsx
│   ├── AvgPerSession.tsx
│   ├── ForecastRevenue.tsx
│   ├── AvgPerActivePatient.tsx
│   ├── LostRevenue.tsx
│   ├── ChartRevenueMonthly.tsx
│   ├── ChartPatientDistribution.tsx
│   ├── ChartAvgRevenuePerPatient.tsx
│   ├── ChartTicketComparison.tsx
│   ├── ChartGrowthTrend.tsx
│   └── ChartLostRevenueMonthly.tsx
├── administrative/
│   ├── MissedRate.tsx
│   ├── ActivePatients.tsx
│   ├── OccupationRate.tsx
│   ├── ChartSessionsVsExpected.tsx
│   ├── ChartMissedRateMonthly.tsx
│   ├── ChartMissedByPatient.tsx
│   ├── ChartRetentionRate.tsx
│   └── ChartMissedDistribution.tsx
├── marketing/
│   ├── WebsiteViews.tsx
│   ├── WebsiteVisitors.tsx
│   ├── WebsiteConversion.tsx
│   ├── WebsiteCTR.tsx
│   ├── ChartWebsiteTopPages.tsx
│   └── ChartWebsiteTrafficSources.tsx
└── team/
    └── ChartNewVsInactive.tsx
```

**NOTA:** Cada card será extraído/refatorado dos arquivos `Financial.tsx` e `WebsiteMetrics.tsx` existentes.

---

## ⏱️ 6. FILTROS TEMPORAIS E COMPARATIVOS (DECISÃO IMPLEMENTADA)

### 6.1 Filtro de Período (Global)

**Posição:** Topo direito da tela (ao lado do título "Métricas")

**Opções:**
- **3 meses**
- **6 meses**
- **1 ano**
- **Período personalizado** (date picker)

**Implementação:**

```typescript
// Estado global do filtro (Context ou URL params)
interface PeriodFilter {
  type: '3m' | '6m' | '1y' | 'custom';
  startDate: Date;
  endDate: Date;
}

// Componente
<Select value={periodFilter.type} onValueChange={handlePeriodChange}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="3m">Últimos 3 meses</SelectItem>
    <SelectItem value="6m">Últimos 6 meses</SelectItem>
    <SelectItem value="1y">Último ano</SelectItem>
    <SelectItem value="custom">Personalizado...</SelectItem>
  </SelectContent>
</Select>

{periodFilter.type === 'custom' && (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline">
        {format(periodFilter.startDate, 'dd/MM/yyyy')} - {format(periodFilter.endDate, 'dd/MM/yyyy')}
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <Calendar
        mode="range"
        selected={{ from: periodFilter.startDate, to: periodFilter.endDate }}
        onSelect={handleCustomRange}
      />
    </PopoverContent>
  </Popover>
)}
```

---

### 6.2 Comparativos Temporais (DECISÃO FINAL)

**DECISÃO IMPLEMENTADA:**

Comparações **AUTOMÁTICAS** baseadas no período selecionado:

| Período Selecionado | Comparação Com |
|---------------------|----------------|
| 3 meses | 3 meses anteriores |
| 6 meses | 6 meses anteriores |
| 1 ano | 1 ano anterior |
| Custom (30 dias) | 30 dias anteriores |
| Custom (60 dias) | 60 dias anteriores |

**Lógica:**

```typescript
function getPreviousPeriod(filter: PeriodFilter): { startDate: Date; endDate: Date } {
  const duration = differenceInDays(filter.endDate, filter.startDate);
  
  return {
    startDate: subDays(filter.startDate, duration),
    endDate: filter.startDate,
  };
}

// Uso no card
const currentData = await fetchMetrics(filter.startDate, filter.endDate);
const previousData = await fetchMetrics(...getPreviousPeriod(filter));

const percentChange = ((currentData - previousData) / previousData) * 100;
```

**Visual nos Cards:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Receita Total</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">R$ 125.430,00</div>
    <p className="text-sm text-muted-foreground mt-2">
      <span className="text-success">↗ +12,5%</span> vs período anterior
    </p>
  </CardContent>
</Card>
```

---

### 6.3 Escalas de Tempo Adaptativas (PORTADO DA /DASHBOARD)

**DECISÃO IMPLEMENTADA:**

Gráficos devem **adaptar o eixo X** baseado na longitude temporal do período.

**Lógica (já existe em `useChartTimeScale`):**

```typescript
// src/hooks/useChartTimeScale.ts (já existe)
export function useChartTimeScale(periodFilter: PeriodFilter) {
  const duration = differenceInDays(periodFilter.endDate, periodFilter.startDate);
  
  let scale: 'day' | 'week' | 'month' | 'quarter' | 'year';
  let format: string;
  
  if (duration <= 31) {
    scale = 'day';
    format = 'dd/MM';
  } else if (duration <= 93) {
    scale = 'week';
    format = 'dd/MM';
  } else if (duration <= 365) {
    scale = 'month';
    format = 'MMM/yy';
  } else if (duration <= 730) {
    scale = 'quarter';
    format = 'Qo yyyy';
  } else {
    scale = 'year';
    format = 'yyyy';
  }
  
  return { scale, format };
}
```

**Uso nos Charts:**

```tsx
// Dentro de cada Chart component
const { scale, format: dateFormat } = useChartTimeScale(periodFilter);

// Agrupar dados baseado na escala
const groupedData = groupDataByScale(rawData, scale);

// Renderizar chart
<LineChart data={groupedData}>
  <XAxis 
    dataKey="date" 
    tickFormatter={(value) => format(value, dateFormat)}
  />
  {/* ... */}
</LineChart>
```

**Escalas possíveis:**
- **Dia** (≤31 dias): Cada ponto = 1 dia
- **Semana** (32-93 dias): Cada ponto = 1 semana
- **Mês** (94-365 dias): Cada ponto = 1 mês
- **Quarter** (366-730 dias): Cada ponto = 1 trimestre
- **Ano** (>730 dias): Cada ponto = 1 ano

---

## 🗺️ 7. ROTA E NAVEGAÇÃO

### 7.1 Nova Rota

**Rota:** `/metrics` (APROVADO)

**Arquivo:** `src/pages/Metrics.tsx`

**Adição no router:**

```typescript
// src/App.tsx
import { Metrics } from '@/pages/Metrics';

// ...
<Route path="/metrics" element={<Metrics />} />
```

---

### 7.2 Modificação na Navbar

**Arquivo:** `src/components/Navbar.tsx`

**ANTES:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">Métricas</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem asChild>
      <Link to="/financial">Financeiro</Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link to="/metrics/website">Website</Link>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**DEPOIS:**
```tsx
<Button
  variant="ghost"
  asChild
>
  <Link to="/metrics">Métricas</Link>
</Button>
```

**REMOVER:** Dropdown Menu de Métricas  
**ADICIONAR:** Link direto para `/metrics`

---

### 7.3 Gestão de Estado da URL

**Query Params para persistir estado:**

```
/metrics?domain=financial&subTab=distribuicoes
/metrics?domain=administrative&subTab=desempenho
/metrics?domain=marketing&subTab=website
/metrics?domain=team&subTab=retencao
```

**Implementação:**

```typescript
// Hooks para sincronizar URL com estado
const [searchParams, setSearchParams] = useSearchParams();

const currentDomain = searchParams.get('domain') || 'financial';
const currentSubTab = searchParams.get('subTab') || 'distribuicoes';

function handleDomainChange(newDomain: PermissionDomain) {
  setSearchParams({
    domain: newDomain,
    subTab: getDefaultSubTab(newDomain),
  });
}

function handleSubTabChange(newSubTab: string) {
  setSearchParams({
    domain: currentDomain,
    subTab: newSubTab,
  });
}
```

**Vantagens:**
- URL é compartilhável (deep links)
- Navegação back/forward funciona
- Estado persiste em refresh

---

### 7.4 Breadcrumbs

**DECISÃO:** NÃO implementar breadcrumbs.

Motivo: Layout de abas já deixa claro onde o usuário está.

---

## 🎨 8. DESIGN E UX

### 8.1 Linguagem Visual

**DECISÃO:** Manter 100% consistente com `/dashboard` e `/patient-detail`.

**Tokens CSS (já existentes):**
- `--background`
- `--foreground`
- `--primary`
- `--primary-foreground`
- `--secondary`
- `--muted`
- `--accent`
- `--destructive`
- `--success`
- `--border`
- `--ring`

**Componentes Shadcn:**
- `Card` para containers
- `Tabs` para abas de domains e sub-abas
- `Button` para ações
- `Select` para filtros
- `Dialog` para AddCardDialog
- `Badge` para indicadores
- `Skeleton` para loading states

---

### 8.2 Cards Métricos (Topo)

**Exemplo de Componente:**

```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
    <DollarSign className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">R$ 125.430,00</div>
    <p className="text-xs text-muted-foreground">
      <span className="text-success">↗ +12,5%</span> vs período anterior
    </p>
  </CardContent>
</Card>
```

**Grid Responsivo:**

```css
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* Desktop */
  gap: 1rem;
}

@media (max-width: 1023px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr); /* Tablet */
  }
}

@media (max-width: 767px) {
  .metrics-grid {
    grid-template-columns: 1fr; /* Mobile */
  }
}
```

---

### 8.3 Cards Gráficos (Inferior)

**Biblioteca:** Recharts (já usada no sistema)

**Tipos de Gráficos:**
- `LineChart` (tendências)
- `BarChart` (comparações)
- `PieChart` (distribuições)
- `AreaChart` (volumes)

**Exemplo:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Receita Mensal</CardTitle>
    <CardDescription>
      Evolução da receita nos últimos {periodLabel}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={(v) => format(v, dateFormat)} />
        <YAxis tickFormatter={(v) => formatCurrency(v)} />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

---

### 8.4 Loading States

**Skeleton Loaders:**

```tsx
// Para cards métricos
<Card>
  <CardHeader>
    <Skeleton className="h-4 w-[100px]" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-8 w-[150px]" />
    <Skeleton className="h-3 w-[80px] mt-2" />
  </CardContent>
</Card>

// Para charts
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-[200px]" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-[300px] w-full" />
  </CardContent>
</Card>
```

---

### 8.5 Empty States

**Quando não há dados:**

```tsx
<Card className="flex flex-col items-center justify-center h-[300px]">
  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
  <p className="text-muted-foreground">Nenhum dado para exibir</p>
  <p className="text-sm text-muted-foreground">
    Ajuste o período ou aguarde novos dados
  </p>
</Card>
```

---

### 8.6 Responsividade

**Breakpoints (Tailwind):**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Mobile (<768px):**
- Cards métricos: 1 coluna
- Tabs: horizontal scroll
- Charts: height reduzido (250px)
- Grid: 1 coluna

**Tablet (768-1023px):**
- Cards métricos: 2 colunas
- Charts: 2 colunas (w=6)

**Desktop (≥1024px):**
- Cards métricos: 4 colunas
- Charts: grid layout livre (drag & drop)

---

## 🛠️ 9. COMPONENTE PRINCIPAL: METRICS.TSX

### 9.1 Estrutura do Componente

**Arquivo:** `src/pages/Metrics.tsx`

```tsx
import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GridCardContainer } from '@/components/GridCardContainer';
import { AddCardDialog } from '@/components/AddCardDialog';
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useMetricsLayout } from '@/hooks/useMetricsLayout';
import { useCardPermissions } from '@/hooks/useCardPermissions';
import { METRICS_CARDS, getMetricCards, getChartCards, getAvailableSubTabs } from '@/lib/metricsCardRegistry';
import { PermissionDomain } from '@/types/permissions';
import { PeriodFilter } from '@/types/metricsCardTypes';
import { Plus } from 'lucide-react';

export function Metrics() {
  // ========================================
  // HOOKS
  // ========================================
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    financialAccess, 
    canAccessMarketing, 
    canViewTeamFinancialSummary,
    isOrganizationOwner 
  } = useEffectivePermissions();
  const { roleGlobal, isAdmin, organizationId } = useAuth();
  const { canViewCard } = useCardPermissions();

  // ========================================
  // STATE
  // ========================================
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({
    type: '3m',
    startDate: subMonths(new Date(), 3),
    endDate: new Date(),
  });
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);

  // ========================================
  // DOMAINS VISÍVEIS
  // ========================================
  const visibleDomains = useMemo(() => {
    const domains: PermissionDomain[] = [];

    if (financialAccess !== 'none') {
      domains.push('financial');
    }

    if (roleGlobal !== 'accountant') {
      domains.push('administrative');
    }

    if (canAccessMarketing) {
      domains.push('marketing');
    }

    if (canViewTeamFinancialSummary || isOrganizationOwner || isAdmin) {
      domains.push('team');
    }

    // Exceção: sem organização = owner
    if (!organizationId && !isAdmin && domains.length === 0) {
      return ['financial', 'administrative', 'marketing', 'team'] as PermissionDomain[];
    }

    return domains;
  }, [financialAccess, roleGlobal, canAccessMarketing, canViewTeamFinancialSummary, isOrganizationOwner, isAdmin, organizationId]);

  // ========================================
  // DOMAIN ATIVO
  // ========================================
  const currentDomain = (searchParams.get('domain') || visibleDomains[0] || 'financial') as PermissionDomain;
  const currentSubTab = searchParams.get('subTab') || 'distribuicoes';

  // ========================================
  // CARDS FILTRADOS
  // ========================================
  const metricCards = useMemo(() => {
    return getMetricCards(currentDomain).filter(card => canViewCard(card));
  }, [currentDomain, canViewCard]);

  const chartCards = useMemo(() => {
    return getChartCards(currentDomain, currentSubTab).filter(card => canViewCard(card));
  }, [currentDomain, currentSubTab, canViewCard]);

  const availableSubTabs = useMemo(() => {
    return getAvailableSubTabs(currentDomain);
  }, [currentDomain]);

  // ========================================
  // LAYOUT PERSISTENCE
  // ========================================
  const metricLayout = useMetricsLayout({
    domain: currentDomain,
    section: 'metrics',
  });

  const chartLayout = useMetricsLayout({
    domain: currentDomain,
    section: 'charts',
    subTab: currentSubTab,
  });

  // ========================================
  // HANDLERS
  // ========================================
  function handleDomainChange(newDomain: PermissionDomain) {
    const defaultSubTab = getAvailableSubTabs(newDomain)[0] || 'distribuicoes';
    setSearchParams({ domain: newDomain, subTab: defaultSubTab });
  }

  function handleSubTabChange(newSubTab: string) {
    setSearchParams({ domain: currentDomain, subTab: newSubTab });
  }

  function handlePeriodChange(type: '3m' | '6m' | '1y' | 'custom') {
    let startDate: Date;
    const endDate = new Date();

    switch (type) {
      case '3m':
        startDate = subMonths(endDate, 3);
        break;
      case '6m':
        startDate = subMonths(endDate, 6);
        break;
      case '1y':
        startDate = subYears(endDate, 1);
        break;
      default:
        return;
    }

    setPeriodFilter({ type, startDate, endDate });
  }

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="container mx-auto py-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Métricas</h1>
        
        {/* Filtro de Período */}
        <Select value={periodFilter.type} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
            <SelectItem value="1y">Último ano</SelectItem>
            <SelectItem value="custom">Personalizado...</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABS DE DOMAINS */}
      <Tabs value={currentDomain} onValueChange={handleDomainChange}>
        <TabsList>
          {visibleDomains.map(domain => (
            <TabsTrigger key={domain} value={domain}>
              {getDomainLabel(domain)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* CONTENT POR DOMAIN */}
        {visibleDomains.map(domain => (
          <TabsContent key={domain} value={domain} className="space-y-6">
            {/* SEÇÃO 1: CARDS MÉTRICOS */}
            <div className="metrics-grid">
              <GridCardContainer
                sectionId={`metrics-${domain}-metrics`}
                layout={metricLayout.layouts}
                onLayoutChange={metricLayout.saveLayout}
                isEditMode={true}
              >
                {metricCards.map(card => {
                  const CardComponent = card.component;
                  return (
                    <div key={card.id} data-grid={card.defaultLayout}>
                      <CardComponent periodFilter={periodFilter} />
                    </div>
                  );
                })}
              </GridCardContainer>
            </div>

            {/* SEÇÃO 2: SUB-TABS + CHARTS */}
            {availableSubTabs.length > 0 && (
              <Tabs value={currentSubTab} onValueChange={handleSubTabChange}>
                <div className="flex items-center justify-between">
                  <TabsList>
                    {availableSubTabs.map(subTab => (
                      <TabsTrigger key={subTab} value={subTab}>
                        {getSubTabLabel(subTab)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddCardOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Card
                  </Button>
                </div>

                <TabsContent value={currentSubTab}>
                  <GridCardContainer
                    sectionId={`metrics-${domain}-charts-${currentSubTab}`}
                    layout={chartLayout.layouts}
                    onLayoutChange={chartLayout.saveLayout}
                    isEditMode={true}
                  >
                    {chartCards.map(card => {
                      const CardComponent = card.component;
                      return (
                        <div key={card.id} data-grid={card.defaultLayout}>
                          <CardComponent periodFilter={periodFilter} />
                        </div>
                      );
                    })}
                  </GridCardContainer>
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* ADD CARD DIALOG */}
      <AddCardDialog
        open={isAddCardOpen}
        onOpenChange={setIsAddCardOpen}
        domain={currentDomain}
        subTab={currentSubTab}
        onAddCard={(cardId) => {
          // Lógica para adicionar card ao layout
        }}
      />
    </div>
  );
}

// ========================================
// HELPER FUNCTIONS
// ========================================
function getDomainLabel(domain: PermissionDomain): string {
  const labels: Record<PermissionDomain, string> = {
    financial: 'Financeiro',
    administrative: 'Administrativo',
    marketing: 'Marketing',
    team: 'Equipe',
    clinical: 'Clínico',
    general: 'Geral',
  };
  return labels[domain] || domain;
}

function getSubTabLabel(subTab: string): string {
  const labels: Record<string, string> = {
    distribuicoes: 'Distribuições',
    desempenho: 'Desempenho',
    tendencias: 'Tendências',
    retencao: 'Retenção',
    website: 'Website',
  };
  return labels[subTab] || subTab;
}
```

---

## 🎛️ 10. ADD CARD DIALOG (DECISÃO IMPLEMENTADA)

### 10.1 Requisito

**DECISÃO:** Implementar `AddCardDialog` com sistema de abas/sub-abas, **IGUAL** ao usado na `/dashboard`.

**Funcionalidade:**
- Abrir dialog ao clicar em "Adicionar Card"
- Mostrar abas refletindo os domains disponíveis
- Dentro de cada aba, mostrar sub-abas refletindo as categorias de charts
- Listar cards disponíveis (que ainda não estão no layout)
- Adicionar card ao layout ao clicar

---

### 10.2 Componente AddCardDialog

**Arquivo:** `src/components/AddCardDialog.tsx` (ou criar novo específico: `AddMetricsCardDialog.tsx`)

```tsx
import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { METRICS_CARDS, getCardsByDomain, getChartCards } from '@/lib/metricsCardRegistry';
import { PermissionDomain } from '@/types/permissions';
import { useCardPermissions } from '@/hooks/useCardPermissions';
import { Plus } from 'lucide-react';

interface AddMetricsCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDomain: PermissionDomain;
  currentSubTab?: string;
  existingCardIds: string[]; // IDs dos cards já no layout
  onAddCard: (cardId: string) => void;
}

export function AddMetricsCardDialog({
  open,
  onOpenChange,
  currentDomain,
  currentSubTab,
  existingCardIds,
  onAddCard,
}: AddMetricsCardDialogProps) {
  const { canViewCard } = useCardPermissions();

  // Cards disponíveis (não estão no layout)
  const availableCards = useMemo(() => {
    const domainCards = getCardsByDomain(currentDomain).filter(
      card => canViewCard(card) && !existingCardIds.includes(card.id)
    );

    // Se há sub-aba ativa, filtrar apenas os charts dessa categoria
    if (currentSubTab) {
      return domainCards.filter(
        card => card.section === 'charts' && card.chartCategory === currentSubTab
      );
    }

    return domainCards;
  }, [currentDomain, currentSubTab, existingCardIds, canViewCard]);

  // Agrupar por categoria (se não há sub-aba selecionada)
  const cardsByCategory = useMemo(() => {
    if (currentSubTab) {
      return { [currentSubTab]: availableCards };
    }

    const groups: Record<string, typeof availableCards> = {
      metrics: [],
      charts: [],
    };

    availableCards.forEach(card => {
      if (card.section === 'metrics') {
        groups.metrics.push(card);
      } else {
        const category = card.chartCategory || 'outros';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(card);
      }
    });

    return groups;
  }, [availableCards, currentSubTab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Card</DialogTitle>
          <DialogDescription>
            Selecione um card para adicionar ao layout
          </DialogDescription>
        </DialogHeader>

        {currentSubTab ? (
          // Se há sub-aba, mostrar apenas os cards dessa categoria
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {availableCards.map(card => (
              <Card key={card.id} className="cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-sm">{card.title}</CardTitle>
                  {card.description && (
                    <CardDescription className="text-xs">{card.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      onAddCard(card.id);
                      onOpenChange(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Se não há sub-aba, mostrar tabs por categoria
          <Tabs defaultValue={Object.keys(cardsByCategory)[0]}>
            <TabsList>
              {Object.keys(cardsByCategory).map(category => (
                <TabsTrigger key={category} value={category}>
                  {getCategoryLabel(category)}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(cardsByCategory).map(([category, cards]) => (
              <TabsContent key={category} value={category}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cards.map(card => (
                    <Card key={card.id} className="cursor-pointer hover:border-primary transition-colors">
                      <CardHeader>
                        <CardTitle className="text-sm">{card.title}</CardTitle>
                        {card.description && (
                          <CardDescription className="text-xs">{card.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            onAddCard(card.id);
                            onOpenChange(false);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {availableCards.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Todos os cards disponíveis já estão no layout</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    metrics: 'Métricas',
    distribuicoes: 'Distribuições',
    desempenho: 'Desempenho',
    tendencias: 'Tendências',
    retencao: 'Retenção',
    website: 'Website',
    charts: 'Gráficos',
  };
  return labels[category] || category;
}
```

---

## 📋 11. LISTA COMPLETA DE TAREFAS

### 11.1 Arquivos a CRIAR

1. **Types**
   - `src/types/metricsCardTypes.ts` (novo tipo `MetricsCardConfig`, `MetricsCardProps`, `PeriodFilter`)

2. **Hooks**
   - `src/hooks/useMetricsLayout.ts` (gestão de layout + persistência)

3. **Lib**
   - `src/lib/metricsCardRegistry.tsx` (registry de 26 cards)
   - `src/lib/defaultLayoutMetrics.ts` (layouts padrão por domain/sub-aba)

4. **Pages**
   - `src/pages/Metrics.tsx` (componente principal)

5. **Components - Cards Métricos**
   - `src/components/cards/metrics/financial/RevenueTotal.tsx`
   - `src/components/cards/metrics/financial/AvgPerSession.tsx`
   - `src/components/cards/metrics/financial/ForecastRevenue.tsx`
   - `src/components/cards/metrics/financial/AvgPerActivePatient.tsx`
   - `src/components/cards/metrics/financial/LostRevenue.tsx`
   - `src/components/cards/metrics/administrative/MissedRate.tsx`
   - `src/components/cards/metrics/administrative/ActivePatients.tsx`
   - `src/components/cards/metrics/administrative/OccupationRate.tsx`
   - `src/components/cards/metrics/marketing/WebsiteViews.tsx`
   - `src/components/cards/metrics/marketing/WebsiteVisitors.tsx`
   - `src/components/cards/metrics/marketing/WebsiteConversion.tsx`
   - `src/components/cards/metrics/marketing/WebsiteCTR.tsx`

6. **Components - Cards Gráficos**
   - `src/components/cards/metrics/financial/ChartRevenueMonthly.tsx`
   - `src/components/cards/metrics/financial/ChartPatientDistribution.tsx`
   - `src/components/cards/metrics/financial/ChartAvgRevenuePerPatient.tsx`
   - `src/components/cards/metrics/financial/ChartTicketComparison.tsx`
   - `src/components/cards/metrics/financial/ChartGrowthTrend.tsx`
   - `src/components/cards/metrics/financial/ChartLostRevenueMonthly.tsx`
   - `src/components/cards/metrics/administrative/ChartSessionsVsExpected.tsx`
   - `src/components/cards/metrics/administrative/ChartMissedRateMonthly.tsx`
   - `src/components/cards/metrics/administrative/ChartMissedByPatient.tsx`
   - `src/components/cards/metrics/administrative/ChartRetentionRate.tsx`
   - `src/components/cards/metrics/administrative/ChartMissedDistribution.tsx`
   - `src/components/cards/metrics/marketing/ChartWebsiteTopPages.tsx`
   - `src/components/cards/metrics/marketing/ChartWebsiteTrafficSources.tsx`
   - `src/components/cards/metrics/team/ChartNewVsInactive.tsx`

7. **Components - Dialog**
   - `src/components/AddMetricsCardDialog.tsx` (dialog para adicionar cards)

---

### 11.2 Arquivos a MODIFICAR

1. **Router**
   - `src/App.tsx` (adicionar rota `/metrics`)

2. **Navigation**
   - `src/components/Navbar.tsx` (remover dropdown, adicionar link direto)

3. **Hooks Existentes (se necessário)**
   - `src/hooks/useChartTimeScale.ts` (verificar se precisa adaptações)
   - `src/hooks/useCardPermissions.ts` (verificar compatibilidade com novos tipos)

---

### 11.3 Arquivos a DELETAR (APÓS MIGRAÇÃO COMPLETA)

**IMPORTANTE:** Deletar APENAS após confirmar que todos os cards foram migrados.

1. `src/pages/Financial.tsx` (substituído por `/metrics?domain=financial`)
2. `src/pages/WebsiteMetrics.tsx` (substituído por `/metrics?domain=marketing`)

---

### 11.4 Database (Se Necessário)

**DECISÃO:** Usar tabela existente `user_layout_preferences`.

**SQL (se ainda não suporta `layout_type: 'metrics-grid'`):**

```sql
-- Verificar se já existe constraint no layout_type
-- Se existir enum/check, adicionar novo valor
-- (Provavelmente não é necessário, pois é apenas TEXT)

-- Exemplo de inserção (teste):
INSERT INTO user_layout_preferences (
  user_id,
  layout_type,
  layout_config,
  version
) VALUES (
  'test-user-id',
  'metrics-grid',
  '{}'::jsonb,
  1
);
```

**NOTA:** Tabela já existe e aceita qualquer valor TEXT em `layout_type`. Não precisa de migração.

---

## ❓ 12. PERGUNTAS PENDENTES (TODAS RESOLVIDAS)

✅ **1. Persistência:** Generalizar `user_layout_preferences` com `layout_type: 'metrics-grid'` → **APROVADO**

✅ **2. Sub-abas:** Manter divisão proposta (Distribuições, Desempenho, Tendências, Retenção, Website) → **APROVADO**

✅ **3. Comparativos:** Mostrar "vs período anterior" baseado no horizonte temporal → **APROVADO**

✅ **4. Escopo Team:** Dados da equipe seguindo estrutura organizacional + permissões do /orgmanagement → **APROVADO**

✅ **5. Exportação:** Fase futura → **ADIADO**

✅ **6. Permissões granulares:** Por domain completo, não por sub-aba → **APROVADO**

✅ **7. Tempo real:** Mesmo esquema da /dashboard (refresh periódico) → **APROVADO**

✅ **8. Cards métricos:** Drag & Drop habilitado (como /dashboard) → **APROVADO**

✅ **9. AddCardDialog:** Implementar com sistema de abas/sub-abas igual /dashboard → **APROVADO**

✅ **10. Escalas de tempo:** Portar funcionalidade de adaptação de eixo X da /dashboard → **APROVADO**

---

## 🚀 13. IMPLEMENTAÇÃO POR FASES (SUGESTÃO)

Embora você tenha pedido para NÃO dividir em fases ainda, aqui está uma sugestão de ordem lógica de implementação (para quando formos executar):

### **FASE 1: Fundação**
- Criar tipos (`MetricsCardConfig`, `MetricsCardProps`, `PeriodFilter`)
- Criar `metricsCardRegistry.tsx` (vazio inicialmente)
- Criar `defaultLayoutMetrics.ts`
- Criar rota `/metrics`
- Modificar Navbar (remover dropdown)

### **FASE 2: Layout System**
- Criar `useMetricsLayout.ts`
- Integrar com `GridCardContainer`
- Testar persistência (localStorage + Supabase)

### **FASE 3: Componente Principal**
- Criar `Metrics.tsx` com estrutura de abas
- Implementar filtro de período
- Implementar filtro de domains por permissão
- Integrar com `useMetricsLayout`

### **FASE 4: Cards Financeiros**
- Migrar 8 cards métricos de `Financial.tsx`
- Migrar 12 cards gráficos de `Financial.tsx`
- Testar com dados reais
- Implementar comparativos temporais
- Implementar escalas adaptativas

### **FASE 5: Cards Administrativos**
- Criar/migrar 3 cards métricos
- Criar/migrar 5 cards gráficos
- Testar permissões (contadores não veem)

### **FASE 6: Cards Marketing**
- Migrar 4 cards métricos de `WebsiteMetrics.tsx`
- Migrar 2 cards informativos
- Manter dados mockados

### **FASE 7: Cards Team**
- Implementar lógica de dados de equipe (respeitando permissões)
- Criar card `ChartNewVsInactive`
- Testar exclusividade (cards só na aba Team)

### **FASE 8: AddCardDialog**
- Criar `AddMetricsCardDialog.tsx`
- Implementar sistema de abas/sub-abas
- Integrar com layout (adicionar/remover cards)

### **FASE 9: Polimento & QA**
- Testar todos os cenários de permissão
- Testar responsividade (mobile/tablet/desktop)
- Testar loading states
- Testar empty states
- Performance (queries, rerenders)

### **FASE 10: Migração Final**
- Testar todas as funcionalidades
- Deletar `Financial.tsx`
- Deletar `WebsiteMetrics.tsx`
- Atualizar links/redirects

---

## 📄 14. DOCUMENTAÇÃO FINAL

Após implementação, criar:

1. **README da TRACK C3:**
   - `docs/TRACK_C3_METRICAS_IMPLEMENTACAO.md`
   - Decisões tomadas
   - Arquitetura implementada
   - Guia de manutenção

2. **Guia de Uso:**
   - `docs/METRICAS_USER_GUIDE.md`
   - Como adicionar novos cards
   - Como configurar permissões
   - Como customizar layouts

3. **Testes:**
   - Checklist de QA
   - Casos de teste por permissão
   - Testes de regressão

---

## ✅ CONCLUSÃO

Este plano documenta **TODAS** as decisões e requisitos para a TRACK C3. Está pronto para ser dividido em fases e implementado.

**Decisões Finais Incorporadas:**
✅ Persistência generalizada  
✅ Sub-abas mantidas  
✅ Comparativos temporais automáticos  
✅ Escopo Team com permissões organizacionais  
✅ Permissões por domain completo  
✅ Drag & Drop em cards métricos  
✅ AddCardDialog com abas/sub-abas  
✅ Escalas de tempo adaptativas portadas  

**Próximo Passo:** Aguardar aprovação final para dividir em fases e iniciar implementação.

---

**FIM DO PLANO FINAL**
