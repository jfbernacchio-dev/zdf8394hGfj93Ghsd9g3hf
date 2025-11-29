# 🔴 CORREÇÕES PROFUNDAS - FASE 1 `/metrics`

**Data de Criação:** 2025-01-XX  
**Fase:** C3 - Correções Críticas  
**Status:** 🟥 DIAGNÓSTICO COMPLETO

---

## 📋 SUMÁRIO EXECUTIVO

A página `/metrics` está com **4 problemas estruturais críticos** que impedem o funcionamento correto:

1. **Mistura de Dados (OWN vs TEAM)** - Cards financeiros e administrativos mostram dados da organização inteira, não apenas do usuário
2. **GridCardContainer Quebrado** - Drag & drop e resize não funcionam
3. **AddCardDialog Ausente** - Impossível gerenciar cards na tela
4. **Cards/Gráficos Team Inexistentes** - Aba Team não tem implementação

---

## 🔍 PROBLEMA 1: MISTURA DE DADOS (OWN vs TEAM)

### **Sintoma Reportado**
- ✅ **Financeiro:** Apenas "Previsão Mensal" funciona, mas **mostra dados da equipe também**
- ✅ **Administrativo:** Apenas "Pacientes Ativos" funciona, mas **mostra dados da equipe também**
- ❌ **Team:** NADA funciona - mensagens de erro

### **Causa Raiz**

#### 1.1 Consultas pegam TODOS os pacientes/sessões da organização

**Arquivo:** `src/pages/Metrics.tsx` (linhas 264-310)

```tsx
// ❌ ERRADO: Busca TODOS os usuários da organização
const { data: rawPatients } = useQuery({
  queryFn: async () => {
    const { getUserIdsInOrganization } = await import('@/lib/organizationFilters');
    const orgUserIds = await getUserIdsInOrganization(organizationId);
    
    // Busca pacientes de TODOS os usuários
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .in('user_id', orgUserIds)  // ❌ Todos da org!
      .eq('organization_id', organizationId);
    
    return data || [];
  },
});
```

#### 1.2 Não utiliza `useOwnData` nem `useTeamData`

**Comparação:** `/dashboard-example` usa corretamente:

```tsx
// ✅ CORRETO (DashboardExample.tsx linhas 91-94)
const { teamPatients, teamSessions, subordinateIds, loading: teamLoading } = useTeamData();
const { ownPatients, ownSessions } = useOwnData(allPatients, allSessions, subordinateIds);
```

**❌ `/metrics` NÃO FAZ ISSO!**

```tsx
// Metrics.tsx - linha 348+
const metricsPatients: MetricsPatient[] = useMemo(() => {
  // Converte rawPatients (TODOS) diretamente sem filtrar
  return rawPatients.map((p) => ({ ... }));
}, [rawPatients]);
```

#### 1.3 Consequências

| Domain | Esperado | Realidade |
|--------|----------|-----------|
| **Financial** | Apenas dados do usuário logado | Dados de TODA a organização |
| **Administrative** | Apenas dados do usuário logado | Dados de TODA a organização |
| **Marketing** | Mock (OK) | Mock (OK) |
| **Team** | Dados de subordinados | ❌ Não implementado |

---

## 🔍 PROBLEMA 2: GRIDCARDCONTAINER QUEBRADO

### **Sintomas Reportados**
- Cards fazem **sobreposição** ao invés de reflow
- **Resize handles não aparecem/funcionam**
- Drag não respeita compactação automática

### **Causa Raiz**

#### 2.1 Falta `show_in_schedule` nos adaptadores

**Arquivo:** `src/pages/Metrics.tsx` (linhas 363-373)

```tsx
// ❌ INCOMPLETO
const metricsSessions: MetricsSession[] = useMemo(() => {
  return rawSessions.map((s) => ({
    id: s.id,
    patient_id: s.patient_id,
    date: s.date,
    status: ...,
    value: s.value || 0,
    // ❌ FALTA: show_in_schedule: s.show_in_schedule
  }));
}, [rawSessions]);
```

**Tipo esperado:** `MetricsSession` (systemMetricsUtils.ts linha 96+)

```tsx
export interface MetricsSession {
  id: string;
  patient_id: string;
  date: string;
  status: 'attended' | 'missed' | 'rescheduled' | 'cancelled';
  value: number;
  show_in_schedule?: boolean; // ✅ Necessário!
  patients?: { name: string };
}
```

#### 2.2 Estrutura incorreta do drag-handle

**Arquivo:** `src/pages/Metrics.tsx` (linhas 538-545)

```tsx
// ❌ ERRADO: className no wrapper, não no card
<div key={cardLayout.i} data-grid={cardLayout} className="drag-handle cursor-move">
  {CardComponent}  {/* Card não recebe className */}
</div>
```

**Comparação:** `/dashboard-example` faz correto:

```tsx
// ✅ CORRETO (DashboardExample.tsx)
<div key={item.i} data-grid={item}>
  <Card className="drag-handle"> {/* className NO card */}
    {/* conteúdo */}
  </Card>
</div>
```

#### 2.3 GridCardContainer não tem botão de resize visível

**Possível causa:** CSS do `.react-resizable-handle` não está sendo aplicado ou está oculto. Precisa verificar se:
- Classes do react-grid-layout estão importadas
- CSS do resize handle não foi sobrescrito
- `isEditMode={true}` está sendo passado corretamente

---

## 🔍 PROBLEMA 3: ADDCARDDIALOG AUSENTE

### **Sintomas Reportados**
- Não existe botão "Adicionar Cards"
- Impossível gerenciar quais cards mostrar
- Não há controle sobre layout além de drag/resize

### **Causa Raiz**

#### 3.1 Estado e handlers não implementados

**Arquivo:** `src/pages/Metrics.tsx`

```tsx
// ❌ FALTA COMPLETAMENTE:
const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
const handleAddCard = (domain: string, cardId: string) => { ... };
const handleRemoveCard = (domain: string, cardId: string) => { ... };
```

#### 3.2 Botão não existe na UI

**Esperado** (baseado em `/dashboard-example` linha 571):

```tsx
<Button
  onClick={() => setIsAddCardDialogOpen(true)}
  variant="default"
  size="sm"
>
  <Plus className="h-4 w-4 mr-2" />
  Adicionar Cards
</Button>
```

**Realidade:** Não existe em `/metrics`

#### 3.3 Dialog não está renderizado

**Esperado** (baseado em `/dashboard-example` linhas 805-815):

```tsx
<AddCardDialog
  open={isAddCardDialogOpen}
  onOpenChange={setIsAddCardDialogOpen}
  onAddCard={handleAddCard}
  onRemoveCard={handleRemoveCard}
  sectionCards={/* cards do domínio atual */}
  existingCardIds={/* IDs dos cards já no layout */}
/>
```

**Realidade:** Não existe em `/metrics`

---

## 🔍 PROBLEMA 4: CARDS/GRÁFICOS TEAM INEXISTENTES

### **Sintomas Reportados**
- Mensagem: "Métricas da equipe serão implementadas em breve."
- Gráficos mostram: "Sem dados de equipe para o período selecionado."
- Cards não funcionam

### **Causa Raiz**

#### 4.1 Nenhum card de Team no registry

**Arquivo:** `src/lib/metricsCardRegistry.tsx` (linhas 82-214)

```tsx
export const METRICS_CARD_REGISTRY: Record<string, MetricsCardDefinition> = {
  // Financial (5 cards) ✅
  'metrics-revenue-total': { ... },
  // ...
  
  // Administrative (3 cards) ✅
  'metrics-active-patients': { ... },
  // ...
  
  // Marketing (4 cards) ✅
  'metrics-website-visitors': { ... },
  // ...
  
  // ❌ TEAM: NENHUM CARD!
};
```

**Verificação física:**
```bash
$ ls src/components/cards/metrics/team/
# Output: No files found in directory 'src/components/cards/metrics/team'
```

#### 4.2 Layout padrão vazio

**Arquivo:** `src/lib/defaultLayoutMetrics.ts` (linhas 188-193)

```tsx
'metrics-team': {
  cardLayouts: [
    // ❌ Ainda sem cards implementados - deixar vazio
  ]
}
```

#### 4.3 Gráficos recebem dados vazios

**Arquivo:** `src/pages/Metrics.tsx` (linhas 778-843)

```tsx
// Team charts
<TeamIndividualPerformanceChart
  sessions={metricsSessions}  // ✅ Tem dados
  patients={metricsPatients}  // ✅ Tem dados
  profiles={{}}               // ❌ VAZIO!
  isLoading={cardsLoading}
  ...
/>
```

**Problema:** Falta buscar dados de **profiles da equipe**:

```tsx
// ❌ FALTA:
const { data: teamProfiles } = useQuery({
  queryKey: ['metrics-team-profiles', subordinateIds],
  queryFn: async () => {
    // Buscar profiles dos subordinados
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('id', subordinateIds);
    return data;
  },
});
```

#### 4.4 Lógica condicional quebrada

**Arquivo:** `src/pages/Metrics.tsx` (linhas 509-527)

```tsx
const renderMetricCards = () => {
  if (currentDomain === 'team') {
    return (
      <Alert className="mb-6">
        <AlertDescription>
          Métricas da equipe serão implementadas em breve. {/* ❌ */}
        </AlertDescription>
      </Alert>
    );
  }
  // ...
};
```

---

## 📊 IMPACTO VISUAL DOS PROBLEMAS

### Aba Financial
| Card | Status | Valor Mostrado | Valor Esperado |
|------|--------|----------------|----------------|
| Receita Total | ❌ | Org inteira | Apenas usuário |
| Previsão Mensal | ⚠️ | Funciona mas dados errados | Apenas usuário |
| Receita Perdida | ❌ | Org inteira | Apenas usuário |
| Média por Sessão | ❌ | Org inteira | Apenas usuário |
| Média por Paciente | ❌ | Org inteira | Apenas usuário |

### Aba Administrative
| Card | Status | Valor Mostrado | Valor Esperado |
|------|--------|----------------|----------------|
| Pacientes Ativos | ⚠️ | Funciona mas dados errados | Apenas usuário |
| Taxa de Ocupação | ❌ | Org inteira | Apenas usuário |
| Taxa de Faltas | ❌ | Org inteira | Apenas usuário |

### Aba Marketing
| Card | Status | Observação |
|------|--------|------------|
| Todos | ✅ | Mock - funcionando conforme esperado |

### Aba Team
| Componente | Status | Observação |
|------------|--------|------------|
| Cards | ❌ | Nenhum implementado |
| Gráficos | ❌ | `profiles={}` vazio |
| Mensagem | ⚠️ | Mostra alerta placeholder |

---

## 🎯 PLANO DE SOLUÇÃO COMPLETO

### **FASE 1.1: Separar Dados OWN vs TEAM** ⏱️ ~2-3 horas

#### Objetivo
Implementar filtragem correta de dados próprios vs equipe em `/metrics`

#### Tarefas

**1.1.1 Adicionar `useOwnData` e `useTeamData` em Metrics.tsx**

```tsx
// ADICIONAR após linha 310:
import { useOwnData } from '@/hooks/useOwnData';
import { useTeamData } from '@/hooks/useTeamData';

// ADICIONAR após queries de rawPatients/rawSessions:
const { teamPatients, teamSessions, subordinateIds, loading: teamLoading } = useTeamData();
const { ownPatients, ownSessions } = useOwnData(rawPatients, rawSessions, subordinateIds);
```

**1.1.2 Separar agregação por domínio**

```tsx
// CRIAR dois aggregatedData diferentes:

// Para financial/administrative (apenas OWN)
const ownAggregatedData = useMemo(() => {
  return {
    summary: getFinancialSummary({
      sessions: ownSessions,  // ✅ Apenas próprios
      patients: ownPatients,
      start: dateRange.start,
      end: dateRange.end,
    }),
    trends: getFinancialTrends({ ... }),
    retention: getRetentionAndChurn({ ... }),
  };
}, [ownPatients, ownSessions, dateRange]);

// Para team (dados de subordinados)
const teamAggregatedData = useMemo(() => {
  return {
    summary: getFinancialSummary({
      sessions: teamSessions,  // ✅ Apenas team
      patients: teamPatients,
      start: dateRange.start,
      end: dateRange.end,
    }),
    // ...
  };
}, [teamPatients, teamSessions, dateRange]);
```

**1.1.3 Atualizar renderização de cards**

```tsx
// MODIFICAR getCardComponent() linha 465+:
const getCardComponent = (cardId: string) => {
  const cardDef = getMetricsCardById(cardId);
  if (!cardDef) return null;
  
  // ✅ Escolher dados corretos baseado no domínio
  const summary = currentDomain === 'team' 
    ? teamAggregatedData?.summary 
    : ownAggregatedData?.summary;
  
  return (
    <CardComponent
      periodFilter={periodFilter}
      summary={summary}  // ✅ Dados corretos
      isLoading={cardsLoading}
    />
  );
};
```

#### Validação
- [ ] Financial mostra apenas dados do usuário logado
- [ ] Administrative mostra apenas dados do usuário logado
- [ ] Team mostra apenas dados de subordinados
- [ ] Valores batem com `/dashboard-example`

---

### **FASE 1.2: Consertar GridCardContainer** ⏱️ ~1-2 horas

#### Objetivo
Restaurar drag & drop e resize funcional

#### Tarefas

**1.2.1 Adicionar `show_in_schedule` nos adaptadores**

```tsx
// MODIFICAR linha 363-373:
const metricsSessions: MetricsSession[] = useMemo(() => {
  return rawSessions.map((s) => ({
    id: s.id,
    patient_id: s.patient_id,
    date: s.date,
    status: ...,
    value: s.value || 0,
    show_in_schedule: s.show_in_schedule,  // ✅ ADICIONAR
    patients: s.patients ? { name: s.patients.name } : undefined,
  }));
}, [rawSessions]);
```

**1.2.2 Corrigir estrutura do drag-handle**

```tsx
// MODIFICAR renderMetricCards() linha 538-545:
return (
  <div className="mb-6">
    <GridCardContainer
      sectionId={currentSectionId}
      layout={currentSectionLayout}
      onLayoutChange={(newLayout) => updateLayout(currentSectionId, newLayout)}
      isEditMode={isEditMode}
    >
      {currentSectionLayout.map((cardLayout) => {
        const cardDef = getMetricsCardById(cardLayout.i);
        if (!cardDef) return null;
        
        const CardComponent = cardDef.component;
        
        return (
          <div key={cardLayout.i} data-grid={cardLayout}>
            {/* ✅ Envolver card em wrapper com drag-handle */}
            <div className="h-full drag-handle cursor-move">
              <CardComponent
                periodFilter={periodFilter}
                summary={getSummaryForDomain(currentDomain)}
                isLoading={cardsLoading}
                className="h-full"
              />
            </div>
          </div>
        );
      })}
    </GridCardContainer>
  </div>
);
```

**1.2.3 Verificar CSS do resize handle**

```tsx
// VERIFICAR em index.css se existe:
.react-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
}

.react-resizable-handle-se {
  bottom: 0;
  right: 0;
  cursor: se-resize;
}
```

#### Validação
- [ ] Drag funciona corretamente
- [ ] Resize handles aparecem no canto inferior direito
- [ ] Reflow automático empurra cards (não sobrepõe)
- [ ] Compactação vertical funciona
- [ ] Salvamento persiste layout

---

### **FASE 1.3: Implementar AddCardDialog** ⏱️ ~1-2 horas

#### Objetivo
Permitir gerenciamento de cards na interface

#### Tarefas

**1.3.1 Adicionar estado e handlers**

```tsx
// ADICIONAR em Metrics.tsx após linha 123:
const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);

// ADICIONAR handlers:
const handleAddCard = (domainKey: string, cardId: string) => {
  const currentLayout = metricsLayout[domainKey]?.cardLayouts || [];
  const cardDef = getMetricsCardById(cardId);
  
  if (!cardDef) return;
  
  // Encontrar posição Y máxima
  const maxY = currentLayout.reduce((max, item) => 
    Math.max(max, item.y + item.h), 0
  );
  
  // Criar novo card
  const newCard: GridCardLayout = {
    i: cardId,
    x: 0,
    y: maxY,
    w: cardDef.defaultLayout.w,
    h: cardDef.defaultLayout.h,
    minW: cardDef.defaultLayout.minW,
    minH: cardDef.defaultLayout.minH,
    maxW: cardDef.defaultLayout.maxW,
    maxH: cardDef.defaultLayout.maxH,
  };
  
  updateLayout(domainKey, [...currentLayout, newCard]);
  toast.success(`Card "${cardDef.title}" adicionado`);
};

const handleRemoveCard = (domainKey: string, cardId: string) => {
  const currentLayout = metricsLayout[domainKey]?.cardLayouts || [];
  const newLayout = currentLayout.filter(c => c.i !== cardId);
  updateLayout(domainKey, newLayout);
  
  const cardDef = getMetricsCardById(cardId);
  toast.success(`Card "${cardDef?.title}" removido`);
};
```

**1.3.2 Adicionar botão na UI**

```tsx
// ADICIONAR após botões de Edit Layout (linha 945+):
{isEditMode && (
  <Button 
    onClick={() => setIsAddCardDialogOpen(true)} 
    variant="outline"
    size="sm"
  >
    <Plus className="h-4 w-4 mr-2" />
    Adicionar Cards
  </Button>
)}
```

**1.3.3 Renderizar dialog**

```tsx
// ADICIONAR antes do fechamento do component (linha 1190+):
<AddCardDialog
  open={isAddCardDialogOpen}
  onOpenChange={setIsAddCardDialogOpen}
  onAddCard={handleAddCard}
  onRemoveCard={handleRemoveCard}
  sectionCards={getMetricsCardsByDomain(currentDomain)}
  existingCardIds={currentSectionLayout.map(c => c.i)}
/>
```

#### Validação
- [ ] Botão "Adicionar Cards" aparece em modo edição
- [ ] Dialog abre com cards disponíveis do domínio atual
- [ ] Cards podem ser adicionados e aparecem no layout
- [ ] Cards podem ser removidos
- [ ] Toast confirma ações

---

### **FASE 1.4: Implementar Cards e Dados Team** ⏱️ ~3-4 horas

#### Objetivo
Criar infraestrutura básica para métricas de equipe

#### Tarefas

**1.4.1 Criar cards básicos de Team**

Criar arquivos (3 cards iniciais):

```tsx
// src/components/cards/metrics/team/MetricsTeamTotalRevenueCard.tsx
export function MetricsTeamTotalRevenueCard({ summary, isLoading }: MetricsCardBaseProps) {
  const value = summary?.totalRevenue || 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita Total da Equipe</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatBrazilianCurrency(value)}
        </div>
      </CardContent>
    </Card>
  );
}

// src/components/cards/metrics/team/MetricsTeamActivePatientsCard.tsx
export function MetricsTeamActivePatientsCard({ summary, isLoading }: MetricsCardBaseProps) {
  const count = summary?.activePatients || 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pacientes Ativos da Equipe</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
      </CardContent>
    </Card>
  );
}

// src/components/cards/metrics/team/MetricsTeamSessionsCard.tsx
export function MetricsTeamSessionsCard({ summary, isLoading }: MetricsCardBaseProps) {
  const count = summary?.totalSessions || 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessões Realizadas da Equipe</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
      </CardContent>
    </Card>
  );
}
```

**1.4.2 Registrar cards no registry**

```tsx
// ADICIONAR em metricsCardRegistry.tsx:
import { MetricsTeamTotalRevenueCard } from '@/components/cards/metrics/team/MetricsTeamTotalRevenueCard';
import { MetricsTeamActivePatientsCard } from '@/components/cards/metrics/team/MetricsTeamActivePatientsCard';
import { MetricsTeamSessionsCard } from '@/components/cards/metrics/team/MetricsTeamSessionsCard';

export const METRICS_CARD_REGISTRY = {
  // ... cards existentes
  
  // TEAM DOMAIN (3 cards iniciais)
  'metrics-team-total-revenue': {
    id: 'metrics-team-total-revenue',
    title: 'Receita Total da Equipe',
    description: 'Receita total gerada pela equipe no período',
    domain: 'team',
    component: MetricsTeamTotalRevenueCard,
    defaultLayout: { x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'team_access',
  },
  
  'metrics-team-active-patients': {
    id: 'metrics-team-active-patients',
    title: 'Pacientes Ativos da Equipe',
    description: 'Total de pacientes ativos sob gestão da equipe',
    domain: 'team',
    component: MetricsTeamActivePatientsCard,
    defaultLayout: { x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'team_access',
  },
  
  'metrics-team-sessions': {
    id: 'metrics-team-sessions',
    title: 'Sessões Realizadas',
    description: 'Total de sessões realizadas pela equipe',
    domain: 'team',
    component: MetricsTeamSessionsCard,
    defaultLayout: { x: 8, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'team_access',
  },
};
```

**1.4.3 Atualizar layout padrão**

```tsx
// MODIFICAR defaultLayoutMetrics.ts:
'metrics-team': {
  cardLayouts: [
    { i: 'metrics-team-total-revenue', x: 0, y: 0, w: 4, h: 2 },
    { i: 'metrics-team-active-patients', x: 4, y: 0, w: 4, h: 2 },
    { i: 'metrics-team-sessions', x: 8, y: 0, w: 4, h: 2 },
  ]
}
```

**1.4.4 Buscar profiles da equipe**

```tsx
// ADICIONAR em Metrics.tsx após linha 345:
const { data: teamProfiles, isLoading: profilesLoading } = useQuery({
  queryKey: ['metrics-team-profiles', subordinateIds],
  queryFn: async () => {
    if (!subordinateIds || subordinateIds.length === 0) return [];
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*, professional_roles(*)')
      .in('id', subordinateIds);
    
    if (error) throw error;
    return data || [];
  },
  enabled: !!subordinateIds && subordinateIds.length > 0,
});

// CONVERTER para formato esperado
const teamProfilesMap = useMemo(() => {
  if (!teamProfiles) return {};
  
  return teamProfiles.reduce((acc, profile) => {
    acc[profile.id] = {
      id: profile.id,
      full_name: profile.full_name,
      professional_role: profile.professional_roles?.label || 'Terapeuta',
    };
    return acc;
  }, {} as Record<string, any>);
}, [teamProfiles]);
```

**1.4.5 Passar profiles aos gráficos**

```tsx
// MODIFICAR renderChartContent() para team charts:
<TeamIndividualPerformanceChart
  sessions={teamSessions}      // ✅ Dados de team
  patients={teamPatients}       // ✅ Dados de team
  profiles={teamProfilesMap}    // ✅ CORRIGIDO!
  isLoading={cardsLoading || teamLoading}
  periodFilter={periodFilter}
  timeScale={chartTimeScale}
/>
```

**1.4.6 Remover mensagem placeholder**

```tsx
// REMOVER do renderMetricCards() linhas 509-517:
// ❌ DELETAR:
if (currentDomain === 'team') {
  return (
    <Alert className="mb-6">
      <AlertDescription>
        Métricas da equipe serão implementadas em breve.
      </AlertDescription>
    </Alert>
  );
}
```

#### Validação
- [ ] Aba Team mostra 3 cards funcionais
- [ ] Cards exibem dados corretos de equipe
- [ ] Gráficos recebem profiles e renderizam
- [ ] Não há mais mensagens de erro/placeholder
- [ ] AddCardDialog lista cards de team

---

## 📝 CHECKLIST FINAL DE ACEITAÇÃO

### Funcionalidade Geral
- [ ] `/metrics` carrega sem erros no console
- [ ] Todas as 4 abas (Financial, Administrative, Marketing, Team) são acessíveis
- [ ] Filtro de período funciona em todas as abas
- [ ] Loading states aparecem durante carregamento

### Separação de Dados
- [ ] **Financial:** Mostra APENAS dados do usuário logado
- [ ] **Administrative:** Mostra APENAS dados do usuário logado
- [ ] **Marketing:** Continua mockado (OK)
- [ ] **Team:** Mostra APENAS dados de subordinados
- [ ] Valores batem com `/dashboard-example` correspondente

### GridCardContainer
- [ ] Drag & drop funciona suavemente
- [ ] Resize handles aparecem e funcionam
- [ ] Reflow automático empurra outros cards
- [ ] Compactação vertical acontece automaticamente
- [ ] Layout persiste após salvar

### AddCardDialog
- [ ] Botão "Adicionar Cards" aparece em modo edição
- [ ] Dialog abre com lista de cards disponíveis
- [ ] Cards podem ser adicionados ao layout
- [ ] Cards podem ser removidos do layout
- [ ] Mudanças persistem após salvar

### Cards Team
- [ ] 3 cards básicos implementados e funcionais
- [ ] Cards aparecem no registry
- [ ] Layout padrão carrega os cards
- [ ] Valores exibidos são corretos (team, não own)

### Gráficos Team
- [ ] Gráficos recebem dados de profiles
- [ ] Gráficos renderizam sem erros
- [ ] Mensagens "Sem dados" aparecem apenas se realmente não há dados
- [ ] Não há mais mensagens de "será implementado em breve"

---

## 🎨 PADRÃO DE CÓDIGO ESPERADO

### Imports necessários em Metrics.tsx

```tsx
import { useOwnData } from '@/hooks/useOwnData';
import { useTeamData } from '@/hooks/useTeamData';
import { AddCardDialog } from '@/components/AddCardDialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getMetricsCardById, getMetricsCardsByDomain } from '@/lib/metricsCardRegistry';
```

### Estrutura de dados esperada

```tsx
// OWN DATA (financial, administrative)
const ownAggregatedData = {
  summary: FinancialSummary,
  trends: FinancialTrendPoint[],
  retention: RetentionSummary
};

// TEAM DATA (team)
const teamAggregatedData = {
  summary: FinancialSummary,
  trends: FinancialTrendPoint[],
  retention: RetentionSummary
};

const teamProfilesMap: Record<string, {
  id: string;
  full_name: string;
  professional_role: string;
}>;
```

---

## ⚠️ RISCOS E CONSIDERAÇÕES

### Risco 1: Performance
**Problema:** Buscar dados separados para OWN e TEAM pode dobrar queries.  
**Mitigação:** React Query cache compartilhado + desduplicação automática.

### Risco 2: Regressão em /dashboard-example
**Problema:** Mudanças em hooks compartilhados podem quebrar `/dashboard-example`.  
**Mitigação:** Não modificar `useOwnData` nem `useTeamData` - apenas **usar** em `/metrics`.

### Risco 3: Layout quebrar ao adicionar cards
**Problema:** Adicionar card pode causar sobreposição se posição Y incorreta.  
**Mitigação:** Calcular `maxY` corretamente + compactação automática do Grid.

### Risco 4: Permissões de Team
**Problema:** Usuários sem subordinados podem ver aba Team vazia.  
**Mitigação:** Mostrar mensagem amigável "Você não tem subordinados" se `subordinateIds.length === 0`.

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

1. ✅ **FASE 1.1** (Separar Dados) - **CRÍTICO** - Resolve problema raiz
2. ✅ **FASE 1.2** (GridCardContainer) - **ALTA** - UX essencial
3. ✅ **FASE 1.3** (AddCardDialog) - **MÉDIA** - Gerenciamento de layout
4. ✅ **FASE 1.4** (Cards Team) - **BAIXA** - Completude do sistema

**Tempo Total Estimado:** 7-11 horas

---

## 📚 REFERÊNCIAS

- `/src/pages/DashboardExample.tsx` - Implementação correta de OWN vs TEAM
- `/src/hooks/useOwnData.ts` - Hook de filtragem de dados próprios
- `/src/hooks/useTeamData.ts` - Hook de dados de subordinados
- `/src/components/AddCardDialog.tsx` - Dialog de gerenciamento de cards
- `/src/components/GridCardContainer.tsx` - Container de grid com drag/resize
- `/src/lib/metricsCardRegistry.tsx` - Registry de cards de métricas

---

**Fim do Documento**
