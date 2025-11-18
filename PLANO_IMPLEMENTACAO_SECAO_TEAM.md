# 🎯 PLANO DE IMPLEMENTAÇÃO - SEÇÃO TEAM (EQUIPE)

## 📊 DIAGNÓSTICO COMPLETO

### Problema Identificado

A seção `dashboard-team` e seus cards foram parcialmente implementados, mas apresentam **múltiplos problemas críticos**:

1. **Cards Team não recebem `start`/`end`**: Filtram dados históricos completos, ignorando período selecionado
2. **Fórmulas incorretas**: Lógica simplificada que não replica a complexidade dos cards principais
3. **Props interface ignorada**: Usam `any` ao invés de `CardProps` tipada
4. **Formatação inconsistente**: Não usam `formatBrazilianCurrency()`
5. **Tooltips genéricos**: Faltam descrições detalhadas presentes nos cards originais
6. **Dados não chegam**: A seção pode não estar recebendo `teamPatients`/`teamSessions` corretamente
7. **Seção não renderiza**: Possível problema de visibilidade ou filtro de permissões

---

## 🎯 OBJETIVO FINAL

Implementar **corretamente** a seção `dashboard-team` que:

1. ✅ Exibe dados **agregados da equipe** (subordinados)
2. ✅ Respeita **filtro de período** (start/end)
3. ✅ Replica **exatamente** as fórmulas dos cards principais
4. ✅ Usa **tipos corretos** (`CardProps`)
5. ✅ Formata valores com **helpers existentes**
6. ✅ Possui **tooltips detalhados** idênticos aos originais
7. ✅ Aparece **visível** para usuários com permissões adequadas

---

## 📁 ARQUIVOS ENVOLVIDOS

### ⚠️ CONTEXTO CRÍTICO
- **`/dashboard` (src/pages/Dashboard.tsx)** = 📖 **REFERÊNCIA SOMENTE** (NÃO TOCAR!)
  - Contém as fórmulas corretas nos cards principais
  - Serve como modelo para copiar a lógica de cálculo
  
- **`/dashboard-example` (src/pages/DashboardExample.tsx)** = 🔧 **ARQUIVO DE TRABALHO**
  - Já implementado com permissões e `useTeamData`
  - Precisa ter as fórmulas dos cards team corrigidas
  - Após validação, substituirá o dashboard atual

### Arquivos a LER (📖 REFERÊNCIA - Não modificar)
1. **`src/pages/Dashboard.tsx`** - Dashboard atual (referência de implementação)
2. **`src/lib/dashboardCardRegistry.tsx`** - Cards principais com fórmulas corretas
3. `src/lib/defaultSectionsDashboard.ts` - Configuração de seções
4. `src/hooks/useTeamData.ts` - Hook de dados da equipe (já funcional)
5. `src/hooks/useOwnData.ts` - Hook de dados próprios
6. `src/types/cardTypes.ts` - Interface CardProps
7. `src/types/sectionTypes.ts` - Interface SectionConfig

### Arquivos a MODIFICAR (🔧 TRABALHO)
1. **`src/lib/dashboardCardRegistryTeam.tsx`** - Corrigir fórmulas dos cards team
2. `src/lib/defaultSectionsDashboard.ts` - Verificar configuração `dashboard-team` (se necessário)
3. **`src/pages/DashboardExample.tsx`** - Verificar que dados team chegam corretamente (já implementado)

---

## 🔄 PLANO EM FASES

### ✅ **FASE 0: PRÉ-VALIDAÇÃO** (5 min) ✅ **CONCLUÍDA**

**Objetivo**: Verificar estado atual e confirmar diagnóstico

**Ações**:
1. ✅ Ler `src/lib/defaultSectionsDashboard.ts` completo
2. ✅ Verificar se `dashboard-team` existe e está configurada corretamente
3. ✅ Verificar `availableCardIds` da seção team
4. ✅ Confirmar que hooks `useTeamData` funcionam
5. ✅ Verificar se `DashboardExample.tsx` renderiza a seção team

**Arquivos verificados**:
- ✅ `src/lib/defaultSectionsDashboard.ts` - Seção team configurada corretamente
- ✅ `src/pages/DashboardExample.tsx` - Implementação completa com useTeamData
- ✅ `src/hooks/useTeamData.ts` - Hook funcional
- ✅ `src/App.tsx` - Rota `/dashboard-example` existe

**Resultado da validação**:
- ✅ Seção `dashboard-team` existe em `DASHBOARD_SECTIONS`
- ✅ `availableCardIds` estão corretos (6 cards team)
- ✅ `permissionConfig` está adequado
- ✅ DashboardExample.tsx já tem useTeamData implementado
- ✅ DashboardExample.tsx já renderiza seção team corretamente
- ⚠️ **PROBLEMA CONFIRMADO**: Fórmulas dos cards team em `dashboardCardRegistryTeam.tsx` estão incorretas

**Status**: ✅ **FASE 0 CONCLUÍDA** - Sistema arquiteturalmente correto, apenas fórmulas precisam ser corrigidas

---

### ✅ **FASE 1: CORRIGIR INTERFACE E TIPOS** (10 min)

**Objetivo**: Fazer cards Team usarem interface `CardProps` correta

**Ações**:
1. Abrir `src/lib/dashboardCardRegistryTeam.tsx`
2. Importar `CardProps` de `src/lib/dashboardCardRegistry.tsx`
3. Substituir `any` por `CardProps` em TODOS os cards
4. Garantir que props essenciais estão desestruturadas:
   ```typescript
   export const DashboardExpectedRevenueTeam = ({ 
     patients = [], 
     sessions = [], 
     start, 
     end,
     isEditMode,
     className 
   }: CardProps) => {
   ```

**Arquivos a modificar**:
- `src/lib/dashboardCardRegistryTeam.tsx`

**Parâmetros corretos**:
```typescript
interface CardProps {
  isEditMode?: boolean;
  className?: string;
  patients?: any[];
  sessions?: any[];
  start?: Date;              // ← CRÍTICO
  end?: Date;                // ← CRÍTICO
  automaticScale?: TimeScale;
  getScale?: (chartId: string) => TimeScale;
  setScaleOverride?: (chartId: string, scale: TimeScale | null) => void;
  clearOverride?: (chartId: string) => void;
  hasOverride?: (chartId: string) => boolean;
  aggregatedData?: Array<{...}>;
}
```

**Critérios de sucesso**:
- [ ] Todos os 6 cards Team usam `CardProps`
- [ ] Props `start` e `end` estão desestruturadas
- [ ] TypeScript não gera erros

---

### ✅ **FASE 2: IMPLEMENTAR FILTRAGEM POR PERÍODO** (15 min) ✅ **CONCLUÍDA**

**Objetivo**: Fazer cards filtrarem sessões pelo período (start/end)

**Ações realizadas**:
1. ✅ Adicionado filtro de período em todos os 6 cards
2. ✅ Import `parseISO` de 'date-fns' adicionado
3. ✅ `periodSessions` usado em todos os cálculos
4. ✅ Tratamento de erros com try/catch implementado

**Código implementado** (padrão em todos os cards):
```typescript
// FASE 2: Filtrar sessões por período
const periodSessions = sessions.filter(s => {
  if (!s.date || !start || !end) return false;
  try {
    const sessionDate = parseISO(s.date);
    return sessionDate >= start && sessionDate <= end;
  } catch {
    return false;
  }
});
```

**Referência**: `src/lib/dashboardCardRegistry.tsx` linha 68-76 ✅

**Arquivos modificados**:
- ✅ `src/lib/dashboardCardRegistryTeam.tsx` (6 cards atualizados)

**Imports adicionados**:
```typescript
import { parseISO } from 'date-fns'; ✅
```

**Critérios de sucesso** (todos atendidos):
- ✅ Todos os 6 cards filtram por `start` e `end`
- ✅ `periodSessions` é usado nos cálculos (substituindo `sessions` direto)
- ✅ Trata casos onde `start`/`end` são undefined

**Cards atualizados**:
1. ✅ DashboardExpectedRevenueTeam - linha 61-69
2. ✅ DashboardActualRevenueTeam - linha 119-127
3. ✅ DashboardUnpaidValueTeam - linha 174-182
4. ✅ DashboardPaymentRateTeam - linha 229-237
5. ✅ DashboardTotalPatientsTeam - (não precisa filtrar sessões)
6. ✅ DashboardAttendedSessionsTeam - linha 326-334

**Status**: ✅ **FASE 2 CONCLUÍDA COM SUCESSO**

---

### ✅ **FASE 3: CORRIGIR FÓRMULAS DE CÁLCULO** (30 min) ✅ **CONCLUÍDA**

**Objetivo**: Replicar EXATAMENTE a lógica dos cards principais

#### **FASE 3A: DashboardExpectedRevenueTeam** ✅

**Referência**: `src/lib/dashboardCardRegistry.tsx` linha 78-97

**Lógica implementada**:
```typescript
const monthlyPatientsInPeriod = new Map<string, Set<string>>();
const expectedRevenue = periodSessions.reduce((sum, s) => {
  const patient = patients.find(p => p.id === s.patient_id);
  if (!patient) return sum;
  
  if (patient.monthly_price) {
    const monthKey = format(parseISO(s.date), 'yyyy-MM');
    if (!monthlyPatientsInPeriod.has(monthKey)) {
      monthlyPatientsInPeriod.set(monthKey, new Set());
    }
    const patientsSet = monthlyPatientsInPeriod.get(monthKey)!;
    if (!patientsSet.has(patient.id)) {
      patientsSet.add(patient.id);
      return sum + patient.session_value;
    }
    return sum;
  } else {
    return sum + s.value;
  }
}, 0);
```

**Critérios** (todos atendidos):
- ✅ Considera `monthly_price` corretamente
- ✅ Usa `Map<monthKey, Set<patientId>>` para tracking
- ✅ Soma `patient.session_value` para mensalistas
- ✅ Soma `s.value` para não-mensalistas

#### **FASE 3B: DashboardActualRevenueTeam** ✅

**Referência**: `src/lib/dashboardCardRegistry.tsx` linha 141-160

**Lógica implementada**:
```typescript
// Filtro: attended OU paid
const periodSessions = sessions.filter(s => {
  return sessionDate >= start && sessionDate <= end && (s.status === 'attended' || s.paid);
});

const monthlyPatientsInPeriod = new Map<string, Set<string>>();
const actualRevenue = periodSessions.reduce((sum, s) => {
  const patient = patients.find(p => p.id === s.patient_id);
  if (!patient) return sum;
  
  if (patient.monthly_price) {
    const monthKey = format(parseISO(s.date), 'yyyy-MM');
    if (!monthlyPatientsInPeriod.has(monthKey)) {
      monthlyPatientsInPeriod.set(monthKey, new Set());
    }
    const patientsSet = monthlyPatientsInPeriod.get(monthKey)!;
    if (!patientsSet.has(patient.id)) {
      patientsSet.add(patient.id);
      return sum + patient.session_value;
    }
    return sum;
  } else {
    return sum + s.value;
  }
}, 0);
```

**Critérios** (todos atendidos):
- ✅ Filtra por `status === 'attended' || paid`
- ✅ Considera `monthly_price`
- ✅ Usa tracking similar

#### **FASE 3C: DashboardUnpaidValueTeam** ✅

**Referência**: `src/lib/dashboardCardRegistry.tsx` linha 204-223

**Lógica implementada**:
```typescript
// Filtro: attended E não paid
const periodSessions = sessions.filter(s => {
  return sessionDate >= start && sessionDate <= end && s.status === 'attended' && !s.paid;
});

const monthlyPatientsInPeriod = new Map<string, Set<string>>();
const unpaidValue = periodSessions.reduce((sum, s) => {
  const patient = patients.find(p => p.id === s.patient_id);
  if (!patient) return sum;
  
  if (patient.monthly_price) {
    const monthKey = format(parseISO(s.date), 'yyyy-MM');
    if (!monthlyPatientsInPeriod.has(monthKey)) {
      monthlyPatientsInPeriod.set(monthKey, new Set());
    }
    const patientsSet = monthlyPatientsInPeriod.get(monthKey)!;
    if (!patientsSet.has(patient.id)) {
      patientsSet.add(patient.id);
      return sum + patient.session_value;
    }
    return sum;
  } else {
    return sum + s.value;
  }
}, 0);
```

**Critérios** (todos atendidos):
- ✅ Filtra `attended && !paid`
- ✅ Considera `monthly_price`

#### **FASE 3D: DashboardPaymentRateTeam** ✅

**Referência**: `src/lib/dashboardCardRegistry.tsx` linha 257-269

**Lógica implementada**:
```typescript
// Filtro: apenas attended
const periodSessions = sessions.filter(s => {
  return sessionDate >= start && sessionDate <= end && s.status === 'attended';
});

const paidSessions = periodSessions.filter(s => s.paid).length;
const totalSessions = periodSessions.length;
const paymentRate = totalSessions > 0 ? Math.round((paidSessions / totalSessions) * 100) : 0;
```

**Critérios** (todos atendidos):
- ✅ Filtra apenas `attended`
- ✅ Calcula percentual correto
- ✅ Usa variáveis paidSessions e totalSessions

#### **FASE 3E: DashboardTotalPatientsTeam** ✅

**Referência**: `src/lib/dashboardCardRegistry.tsx` linha 303-334

**Lógica implementada**:
```typescript
const activePatients = patients.filter((p: any) => p.status === 'active').length;
```

**Critérios** (todos atendidos):
- ✅ Filtra por `status === 'active'`
- ✅ Não depende de período (correto)

#### **FASE 3F: DashboardAttendedSessionsTeam** ✅

**Referência**: `src/lib/dashboardCardRegistry.tsx` linha 379-423

**Lógica implementada**:
```typescript
const periodSessions = sessions.filter(s => {
  return sessionDate >= start && sessionDate <= end;
});

const attendedSessions = periodSessions.filter(s => s.status === 'attended');
const percentage = periodSessions.length > 0 
  ? Math.round((attendedSessions.length / periodSessions.length) * 100) 
  : 0;
```

**Critérios** (todos atendidos):
- ✅ Filtra sessões do período
- ✅ Calcula attended
- ✅ Calcula percentual em relação ao total

---

**Imports adicionados**:
```typescript
import { parseISO, format } from 'date-fns'; ✅
```

**Status**: ✅ **FASE 3 CONCLUÍDA COM SUCESSO - TODAS AS FÓRMULAS REPLICADAS EXATAMENTE**

**Lógica correta**:
```typescript
const attendedSessions = periodSessions.filter(s => s.status === 'attended');

const monthlyPaidTracked = new Map<string, Set<string>>();
const totalRevenue = attendedSessions.reduce((sum, s) => {
  const patient = patients.find(p => p.id === s.patient_id);
  if (!patient) return sum;
  
  if (patient.monthly_price) {
    const monthKey = format(parseISO(s.date), 'yyyy-MM');
    if (!monthlyPaidTracked.has(s.patient_id)) {
      monthlyPaidTracked.set(s.patient_id, new Set());
    }
    const months = monthlyPaidTracked.get(s.patient_id)!;
    if (!months.has(monthKey)) {
      months.add(monthKey);
      return sum + Number(s.value);
    }
    return sum;
  }
  return sum + Number(s.value);
}, 0);

const paidSessions = attendedSessions.filter(s => s.paid);
const monthlyPaidOnly = new Map<string, Set<string>>();
const paidRevenue = paidSessions.reduce((sum, s) => {
  // mesma lógica...
}, 0);

const paymentRate = totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0;
```

**Critérios**:
- [ ] Calcula taxa de pagamento corretamente
- [ ] Considera `monthly_price` em ambos totais

#### **FASE 3E: DashboardTotalPatientsTeam**

**Lógica**:
```typescript
const uniquePatientIds = new Set(
  periodSessions.map(s => s.patient_id)
);
const activePatients = uniquePatientIds.size;
```

**Critérios**:
- [ ] Conta pacientes únicos no período

#### **FASE 3F: DashboardAttendedSessionsTeam**

**Lógica**:
```typescript
const attendedCount = periodSessions.filter(s => 
  s.status === 'attended'
).length;
```

**Critérios**:
- [ ] Conta sessões atendidas no período

---

### ✅ **FASE 4: CORRIGIR FORMATAÇÃO** (10 min) ✅ **CONCLUÍDA**

**Objetivo**: Usar helpers de formatação existentes

**Ações implementadas**:
1. ✅ Importado `formatBrazilianCurrency` de `@/lib/brazilianFormat`
2. ✅ Substituído TODOS os `.toLocaleString('pt-BR', ...)` por `formatBrazilianCurrency(value)`

**Exemplo antes**:
```typescript
{totalExpected.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
```

**Exemplo depois**:
```typescript
{formatBrazilianCurrency(totalExpected)}
```

**Arquivos modificados**:
- ✅ `src/lib/dashboardCardRegistryTeam.tsx`

**Cards atualizados**:
1. ✅ DashboardExpectedRevenueTeam - linha 114 
2. ✅ DashboardActualRevenueTeam - linha 187
3. ✅ DashboardUnpaidValueTeam - linha 260

**Import adicionado**:
```typescript
import { formatBrazilianCurrency } from '@/lib/brazilianFormat'; ✅
```

**Critérios de sucesso** (todos atendidos):
- ✅ Nenhum card usa `.toLocaleString()` diretamente
- ✅ Todos valores monetários usam `formatBrazilianCurrency()`
- ✅ Formatação consistente com cards principais

**Status**: ✅ **FASE 4 CONCLUÍDA COM SUCESSO - FORMATAÇÃO BRASILEIRA APLICADA**

---

### ✅ **FASE 5: ADICIONAR TOOLTIPS DETALHADOS** (20 min) ✅ **CONCLUÍDA**

**Objetivo**: Copiar descrições detalhadas dos cards originais

**Referência**: `src/lib/dashboardCardRegistry.tsx`

**Tooltips implementados**:

1. ✅ **DashboardExpectedRevenueTeam** (linha 95-109)
   - "Valor total esperado da equipe com base nas sessões agendadas no período. Para pacientes com mensalidade fixa, considera o valor mensal uma vez por mês."

2. ✅ **DashboardActualRevenueTeam** (linha 168-182)
   - "Valor total de sessões realizadas e pagas pela equipe no período. Inclui apenas sessões com status 'realizada' ou marcadas como pagas."

3. ✅ **DashboardUnpaidValueTeam** (linha 241-255)
   - "Valor total de sessões realizadas pela equipe mas ainda não pagas. Representa o montante a receber dos pacientes atendidos."

4. ✅ **DashboardPaymentRateTeam** (linha 297-311)
   - "Percentual de sessões realizadas pela equipe que já foram pagas. Indica a eficiência na cobrança e recebimento de pagamentos."

5. ✅ **DashboardTotalPatientsTeam** (linha 341-355)
   - "Número total de pacientes com status 'ativo' atendidos pela equipe em tratamento contínuo."

6. ✅ **DashboardAttendedSessionsTeam** (linha 396-410)
   - "Sessões efetivamente realizadas pela equipe no período. Mostra o percentual em relação ao total esperado."

**Estrutura padrão mantida**:
```typescript
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p>[Descrição detalhada adaptada para Equipe]</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Arquivos modificados**:
- ✅ `src/lib/dashboardCardRegistryTeam.tsx` (6 tooltips atualizados)

**Critérios de sucesso** (todos atendidos):
- ✅ Todos os cards têm tooltip com Info icon
- ✅ Tooltips explicam o cálculo detalhadamente
- ✅ Consistente com cards principais (apenas adaptado para "Equipe")
- ✅ Usa `max-w-xs` para largura máxima
- ✅ Mantém formatação e estrutura idênticas

**Status**: ✅ **FASE 5 CONCLUÍDA COM SUCESSO - TOOLTIPS DETALHADOS IMPLEMENTADOS**

---

### ✅ **FASE 6: CONFIGURAR SEÇÃO NO DASHBOARD** (15 min) ✅ **CONCLUÍDA**

**Objetivo**: Garantir que seção Team está corretamente configurada

#### **FASE 6A: Verificar defaultSectionsDashboard.ts** ✅

**Arquivo verificado**: `src/lib/defaultSectionsDashboard.ts` (linhas 168-198)

**Configuração encontrada**:
```typescript
'dashboard-team': {
  id: 'dashboard-team',
  name: 'Equipe',
  description: 'Dados dos subordinados',
  permissionConfig: {
    primaryDomain: 'team',
    secondaryDomains: ['financial', 'administrative', 'clinical'],
    blockedFor: ['subordinate'],  // ✅ Subordinados não veem dados de outros
    requiresOwnDataOnly: false,    // ✅ Admin/Full veem dados agregados
  },
  availableCardIds: [
    'dashboard-expected-revenue-team',      // ✅ Implementado
    'dashboard-actual-revenue-team',        // ✅ Implementado
    'dashboard-unpaid-value-team',          // ✅ Implementado
    'dashboard-payment-rate-team',          // ✅ Implementado
    'dashboard-total-patients-team',        // ✅ Implementado
    'dashboard-attended-sessions-team',     // ✅ Implementado
    'dashboard-expected-sessions-team',     // ⏭️ Futuro
    'dashboard-pending-sessions-team',      // ⏭️ Futuro
    'dashboard-missed-sessions-team',       // ⏭️ Futuro
    'dashboard-attendance-rate-team',       // ⏭️ Futuro
    'dashboard-active-complaints-team',     // ⏭️ Futuro
    'dashboard-no-diagnosis-team',          // ⏭️ Futuro
  ],
  defaultHeight: 400,
  collapsible: true,
  startCollapsed: false,
  minCardWidth: 280,
  maxCardWidth: 800,
  defaultCardWidth: 300,
},
```

**Critérios verificados** (todos atendidos):
- ✅ Seção existe
- ✅ `availableCardIds` incluem os 6 cards implementados
- ✅ `permissionConfig` adequado:
  - ✅ `primaryDomain: 'team'` correto
  - ✅ `secondaryDomains` apropriados
  - ✅ `blockedFor: ['subordinate']` correto (subordinados não veem equipe)
  - ✅ `requiresOwnDataOnly: false` correto (dados agregados)

#### **FASE 6B: Verificar layout padrão** ✅

**Arquivo verificado**: `src/lib/defaultSectionsDashboard.ts` (linhas 221-228)

**Configuração encontrada**:
```typescript
export const DEFAULT_DASHBOARD_SECTIONS = {
  'dashboard-financial': [...],
  'dashboard-administrative': [...],
  'dashboard-clinical': [...],
  'dashboard-team': [
    'dashboard-expected-revenue-team',      // ✅
    'dashboard-actual-revenue-team',        // ✅
    'dashboard-unpaid-value-team',          // ✅
    'dashboard-payment-rate-team',          // ✅
    'dashboard-total-patients-team',        // ✅
    'dashboard-attended-sessions-team',     // ✅
  ],
  'dashboard-media': [...],
  'dashboard-general': [...],
  'dashboard-charts': [...],
};
```

**Critérios verificados** (todos atendidos):
- ✅ Seção team tem cards padrão definidos
- ✅ Todos os 6 cards implementados estão no layout padrão
- ✅ Ordem lógica: financeiros (3) → taxa (1) → administrativos (2)

---

**Status**: ✅ **FASE 6 CONCLUÍDA COM SUCESSO - SEÇÃO JÁ ESTAVA CORRETAMENTE CONFIGURADA**

**Resultado da validação**:
- ✅ Configuração da seção está 100% correta
- ✅ Todos os 6 cards implementados estão registrados
- ✅ Permissões adequadas para team data
- ✅ Layout padrão inclui os cards principais
- ✅ Nenhuma alteração necessária

---

### ✅ **FASE 7: VERIFICAR INTEGRAÇÃO NO DASHBOARDEXAMPLE.TSX** (10 min) ✅ **CONCLUÍDA**

**Objetivo**: Confirmar que DashboardExample.tsx já está correto

**Arquivo verificado**: `src/pages/DashboardExample.tsx` (📖 JÁ IMPLEMENTADO)

#### **FASE 7A: Verificar hooks de dados** ✅

**Código encontrado** em `DashboardExample.tsx` (linha 70):
```typescript
// Buscar dados da equipe
const { teamPatients, teamSessions, subordinateIds, loading: teamLoading } = useTeamData();
```

**Critérios verificados** (todos atendidos):
- ✅ `useTeamData` está importado (linha 55)
- ✅ Hook está sendo chamado corretamente (linha 70)
- ✅ Dados team (teamPatients, teamSessions) estão disponíveis
- ✅ subordinateIds estão sendo extraídos

#### **FASE 7B: Verificar agregação de dados team** ✅

**Código encontrado** em `DashboardExample.tsx` (linhas 228-269):
```typescript
/**
 * AGREGAÇÃO DE DADOS DA EQUIPE
 */
const teamAggregatedData = useMemo(() => {
  return generateTimeIntervals(start, end, automaticScale).map(intervalDate => {
    const bounds = getIntervalBounds(intervalDate, automaticScale);
    
    const intervalSessions = teamSessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= bounds.start && sessionDate <= bounds.end;
    });

    // ... cálculos de attended, missed, pending, paid, unpaid ...
    // ... cálculos de totalRevenue, paidRevenue, unpaidRevenue ...

    return {
      label: formatTimeLabel(intervalDate, automaticScale),
      interval: intervalDate,
      attended: attendedCount,
      missed: missedCount,
      pending: pendingCount,
      paid: paidCount,
      unpaid: unpaidCount,
      totalRevenue,
      paidRevenue,
      unpaidRevenue,
      total: intervalSessions.length,
    };
  });
}, [start, end, automaticScale, teamSessions]);
```

**Critérios verificados** (todos atendidos):
- ✅ `teamAggregatedData` está sendo calculado
- ✅ Usa `teamSessions` como fonte
- ✅ Respeita intervalo de tempo (start/end)
- ✅ Estrutura idêntica ao `aggregatedData` (dados próprios)

#### **FASE 7C: Verificar renderização da seção team** ✅

**Código encontrado** em `DashboardExample.tsx` (linhas 525-640):

1. **Loop de seções** (linha 525):
```typescript
{Object.entries(DASHBOARD_SECTIONS).map(([sectionId, sectionConfig]) => {
  const section = layout[sectionId];
  if (!section || !section.cardLayouts.length) {
    // Seção vazia ou sem permissão
    return null;
  }
  // ... renderiza seção
})}
```

2. **Passagem condicional de dados team** (linhas 621-633):
```typescript
{renderDashboardCard(cardLayout.cardId, {
  isEditMode,
  patients: sectionId === 'dashboard-team' ? teamPatients : ownPatients,
  sessions: sectionId === 'dashboard-team' ? teamSessions : ownSessions,
  start,
  end,
  automaticScale,
  getScale,
  setScaleOverride,
  clearOverride,
  hasOverride,
  aggregatedData: sectionId === 'dashboard-team' ? teamAggregatedData : aggregatedData,
})}
```

**Critérios verificados** (todos atendidos):
- ✅ Seção team é renderizada no loop de seções
- ✅ Dados team são passados condicionalmente: 
  - ✅ `teamPatients` quando `sectionId === 'dashboard-team'` (linha 623)
  - ✅ `teamSessions` quando `sectionId === 'dashboard-team'` (linha 624)
  - ✅ `teamAggregatedData` quando `sectionId === 'dashboard-team'` (linha 632)
- ✅ Filtro de permissão funciona via layout (linha 527)
- ✅ Props completas: start, end, automaticScale, getScale, etc.

#### **FASE 7D: Verificar filtro de dados próprios** ✅

**Código encontrado** em `DashboardExample.tsx` (linhas 72-73):
```typescript
// Filtrar dados próprios (excluindo subordinados)
const { ownPatients, ownSessions } = useOwnData(allPatients, allSessions, subordinateIds);
```

**Critérios verificados** (todos atendidos):
- ✅ `useOwnData` filtra dados próprios excluindo subordinados
- ✅ `subordinateIds` do `useTeamData` é usado para filtrar
- ✅ Evita duplicação de dados entre próprio e equipe

---

**Status**: ✅ **FASE 7 CONCLUÍDA COM SUCESSO - INTEGRAÇÃO 100% CORRETA**

**Resultado da validação**:
- ✅ useTeamData funcionando corretamente
- ✅ teamAggregatedData calculado adequadamente
- ✅ Dados team passados condicionalmente aos cards
- ✅ Separação correta entre dados próprios e da equipe
- ✅ Todas as props necessárias sendo passadas (start, end, etc.)
- ✅ Sistema de permissões funcionando via layout
- ✅ **NENHUMA alteração necessária**

---
    description={DASHBOARD_SECTIONS['dashboard-team'].description}
    collapsible={true}
    startCollapsed={false}
    height={getSavedSectionHeight('dashboard-team')}
    isEditMode={isEditMode}
    onHeightChange={(h) => handleTempSectionHeightChange('dashboard-team', h)}
  >
    {visibleCards
      .filter(id => DASHBOARD_SECTIONS['dashboard-team'].availableCardIds.includes(id))
      .map(cardId => (
        <ResizableCard
          key={cardId}
          id={cardId}
          defaultSize={getSavedCardSize(cardId)}
          isEditMode={isEditMode}
          onSizeChange={(size) => handleTempCardSizeChange(cardId, size)}
          onRemove={() => handleRemoveCard(cardId)}
        >
          {renderTeamCard(cardId)}
        </ResizableCard>
      ))
    }
  </ResizableSection>
)}
```

**Critérios**:
- [ ] Seção está sendo renderizada
- [ ] Filtro de visibilidade baseado em permissões

#### **FASE 7C: Criar/Verificar função renderTeamCard**

**Adicionar função** (se não existir):
```typescript
const renderTeamCard = (id: string) => {
  const commonProps = {
    patients: teamPatients,          // ← DADOS DA EQUIPE
    sessions: teamSessions,          // ← DADOS DA EQUIPE
    start,
    end,
    isEditMode,
    automaticScale,
    getScale,
    setScaleOverride,
    clearOverride,
    hasOverride,
  };

  switch (id) {
    case 'dashboard-expected-revenue-team':
      return <DashboardExpectedRevenueTeam {...commonProps} />;
    case 'dashboard-actual-revenue-team':
      return <DashboardActualRevenueTeam {...commonProps} />;
    case 'dashboard-unpaid-value-team':
      return <DashboardUnpaidValueTeam {...commonProps} />;
    case 'dashboard-payment-rate-team':
      return <DashboardPaymentRateTeam {...commonProps} />;
    case 'dashboard-total-patients-team':
      return <DashboardTotalPatientsTeam {...commonProps} />;
    case 'dashboard-attended-sessions-team':
      return <DashboardAttendedSessionsTeam {...commonProps} />;
    default:
      return null;
  }
};
```

**Imports necessários**:
```typescript
import {
  DashboardExpectedRevenueTeam,
  DashboardActualRevenueTeam,
  DashboardUnpaidValueTeam,
  DashboardPaymentRateTeam,
  DashboardTotalPatientsTeam,
  DashboardAttendedSessionsTeam,
} from '@/lib/dashboardCardRegistryTeam';
```

**Critérios**:
- [ ] Função existe e renderiza todos os cards Team
- [ ] Props `teamPatients` e `teamSessions` são passadas
- [ ] Props `start` e `end` são passadas
- [ ] Todos os cards Team estão importados

---

### ✅ **FASE 8: REGISTRAR CARDS NO REGISTRY PRINCIPAL** (10 min) ✅ **CONCLUÍDA**

**Objetivo**: Adicionar cards Team em `AVAILABLE_DASHBOARD_CARDS` e registrar no sistema

**Arquivos modificados**:
1. ✅ `src/types/cardTypes.ts` - Adicionada seção `AVAILABLE_TEAM_CARDS`
2. ✅ `src/lib/dashboardCardRegistry.tsx` - Cards já importados e registrados

**Validação realizada**:

#### 1. ✅ Registry Map (`dashboardCardRegistry.tsx`)
**Linhas 1009-1054**: DASHBOARD_CARD_COMPONENTS já continha todos os 6 cards team:
```typescript
// Team (Equipe)
'dashboard-expected-revenue-team': DashboardExpectedRevenueTeam,
'dashboard-actual-revenue-team': DashboardActualRevenueTeam,
'dashboard-unpaid-value-team': DashboardUnpaidValueTeam,
'dashboard-payment-rate-team': DashboardPaymentRateTeam,
'dashboard-total-patients-team': DashboardTotalPatientsTeam,
'dashboard-attended-sessions-team': DashboardAttendedSessionsTeam,
```

**Linhas 27-34**: Imports corretos do arquivo `dashboardCardRegistryTeam`:
```typescript
import {
  DashboardExpectedRevenueTeam,
  DashboardActualRevenueTeam,
  DashboardUnpaidValueTeam,
  DashboardPaymentRateTeam,
  DashboardTotalPatientsTeam,
  DashboardAttendedSessionsTeam,
} from './dashboardCardRegistryTeam';
```

#### 2. ✅ Card Metadata (`cardTypes.ts`)
**Adicionada nova seção**: `AVAILABLE_TEAM_CARDS` (após linha 633)

Todos os 6 cards team foram registrados com:
- ✅ IDs corretos (`dashboard-*-team`)
- ✅ Nomes descritivos com "(Equipe)"
- ✅ Descrições e detailedDescriptions apropriadas
- ✅ `category: 'dashboard-cards'`
- ✅ Dimensões padrão (280x160)
- ✅ `permissionConfig` adequado:
  - `domain: 'team'`
  - `blockedFor: ['subordinate']`

**AVAILABLE_TEAM_CARDS incluído em ALL_AVAILABLE_CARDS**

**Verificação de integridade**:
- ✅ 6 cards exportados em `dashboardCardRegistryTeam.tsx`
- ✅ 6 cards importados em `dashboardCardRegistry.tsx`
- ✅ 6 cards registrados no mapa `DASHBOARD_CARD_COMPONENTS`
- ✅ 6 cards configurados em `AVAILABLE_TEAM_CARDS`
- ✅ Cards disponíveis via `renderDashboardCard()`
- ✅ Cards listados em `ALL_AVAILABLE_CARDS`

**Status**: ✅ **FASE 8 CONCLUÍDA COM SUCESSO**

**Pronto para Fase 9**: Validação final e testes

---

### ✅ **FASE 9: VALIDAÇÃO E TESTES** (20 min)

**Objetivo**: Verificar se tudo funciona

#### **Checklist de Validação**:

**Visual**:
- [ ] Seção "Equipe" aparece no Dashboard
- [ ] Cards Team são renderizados
- [ ] Valores são exibidos corretamente formatados
- [ ] Tooltips aparecem e explicam os cálculos

**Funcional**:
- [ ] Mudar período filtra dados corretamente
- [ ] Cards mostram valores diferentes para períodos diferentes
- [ ] Valores são coerentes (não negativos, não NaN)
- [ ] Pacientes mensalistas são contados 1x por mês

**Permissões**:
- [ ] Admin vê seção Team
- [ ] FullTherapist vê seção Team (se tem subordinados)
- [ ] Subordinate NÃO vê seção Team
- [ ] Accountant vê/não vê conforme configuração

**Dados**:
- [ ] `teamPatients` contém pacientes dos subordinados
- [ ] `teamSessions` contém sessões dos pacientes da equipe
- [ ] Dados filtrados por período estão corretos

**TypeScript**:
- [ ] Sem erros de tipo
- [ ] Props tipadas corretamente

#### **Testes Manuais**:

1. **Teste 1: Período Mensal**
   - Selecionar "Mês Atual"
   - Verificar valores
   - Comparar com sessões reais no banco

2. **Teste 2: Período Customizado**
   - Selecionar período específico (ex: 01/11 a 15/11)
   - Verificar que apenas sessões nesse range são contadas

3. **Teste 3: Pacientes Mensalistas**
   - Verificar paciente com `monthly_price = true`
   - Confirmar que é contado 1x por mês, não por sessão

4. **Teste 4: Dados Vazios**
   - Testar com usuário sem subordinados
   - Seção deve aparecer vazia ou não aparecer

---

### ✅ **FASE 10: DOCUMENTAÇÃO** (10 min)

**Objetivo**: Documentar o que foi implementado

**Ações**:
1. Atualizar `ARQUITETURA_SISTEMA_REFERENCE.md` se necessário
2. Adicionar comentários nos cards Team explicando lógica
3. Documentar IDs dos cards e seção para referência futura

**Critérios**:
- [ ] Código está comentado onde necessário
- [ ] README atualizado se relevante

---

## 📊 RESUMO DE IMPLEMENTAÇÃO

### Arquivos Modificados

| Arquivo | Modificações |
|---------|--------------|
| `src/lib/dashboardCardRegistryTeam.tsx` | Corrigir interface, filtragem, fórmulas, formatação, tooltips |
| `src/lib/defaultSectionsDashboard.ts` | Adicionar/verificar configuração `dashboard-team` |
| `src/pages/Dashboard.tsx` | Adicionar hook useTeamData, renderização da seção, função renderTeamCard |
| `src/types/cardTypes.ts` | Registrar cards Team em AVAILABLE_DASHBOARD_CARDS |

### Dependências entre Fases

```
FASE 0 (pré-validação)
  ↓
FASE 1 (tipos) → FASE 2 (filtragem) → FASE 3 (fórmulas) → FASE 4 (formatação) → FASE 5 (tooltips)
  ↓
FASE 6 (configuração seção)
  ↓
FASE 7 (integração Dashboard.tsx)
  ↓
FASE 8 (registry)
  ↓
FASE 9 (validação)
  ↓
FASE 10 (documentação)
```

### Tempo Estimado Total

**~3h** distribuídas em:
- Fases 0-5: ~1.5h (correção de código)
- Fases 6-7: ~0.5h (integração)
- Fase 8: ~0.2h (registry)
- Fases 9-10: ~0.5h (validação e documentação)

---

## ⚠️ PONTOS CRÍTICOS DE ATENÇÃO

1. **NUNCA ignorar `start`/`end`**: Todos os cards DEVEM filtrar por período
2. **SEMPRE considerar `monthly_price`**: Usar tracking Map<monthKey, Set<patientId>>
3. **Usar helpers existentes**: `formatBrazilianCurrency()`, não `.toLocaleString()`
4. **Copiar fórmulas EXATAMENTE**: Não simplificar, não inventar lógica nova
5. **Props corretas**: `teamPatients` e `teamSessions` para dados da equipe
6. **Permissões**: `domain: 'team'`, `blockedFor: ['subordinate']`

---

## 🎯 CRITÉRIOS DE CONCLUSÃO

A implementação está COMPLETA quando:

✅ Todos os 6 cards Team renderizam corretamente
✅ Valores mudam ao trocar período
✅ Fórmulas replicam exatamente os cards principais
✅ Formatação usa helpers existentes
✅ Tooltips são detalhados e informativos
✅ Seção aparece para Admin/Full, oculta para Subordinate
✅ TypeScript sem erros
✅ Código testado manualmente
✅ Documentação atualizada

---

## 📋 RESUMO DAS ALTERAÇÕES NO PLANO

### O que foi corrigido:

1. **Contexto arquitetural esclarecido**:
   - ✅ `Dashboard.tsx` = 📖 REFERÊNCIA (não modificar)
   - ✅ `DashboardExample.tsx` = 🔧 TRABALHO (onde implementamos)

2. **Fase 0 concluída com sucesso**:
   - ✅ Sistema arquiteturalmente correto
   - ✅ DashboardExample.tsx já tem useTeamData
   - ✅ Seção team já renderiza
   - ⚠️ Problema confirmado: fórmulas incorretas em `dashboardCardRegistryTeam.tsx`

3. **Fase 7 atualizada**:
   - Mudou de "Integrar no Dashboard.tsx" para "Verificar DashboardExample.tsx"
   - Reconhece que já está implementado, apenas precisa verificação

---

## 🎯 STATUS ATUAL DA IMPLEMENTAÇÃO

### ✅ FASE 0: CONCLUÍDA
- Sistema validado
- Arquitetura correta
- Problema diagnosticado com precisão

### ✅ FASE 1: CONCLUÍDA
- Interface CardProps corrigida em todos os 6 cards
- Props tipadas corretamente
- `cn('h-full', className)` aplicado

### ✅ FASE 2: CONCLUÍDA
- Filtro de período implementado em todos os 6 cards
- Import `parseISO` adicionado
- `periodSessions` usado nos cálculos
- Tratamento de erros implementado

### ✅ FASE 3: CONCLUÍDA
- **Todas as 6 fórmulas de cálculo replicadas exatamente**
- Import `format` de 'date-fns' adicionado
- Tracking de mensalistas implementado (Map<monthKey, Set<patientId>>)
- Lógicas corretas:
  - ✅ ExpectedRevenueTeam: considera monthly_price
  - ✅ ActualRevenueTeam: filtra attended||paid + monthly_price
  - ✅ UnpaidValueTeam: filtra attended&&!paid + monthly_price
  - ✅ PaymentRateTeam: % correto de paid/attended
  - ✅ TotalPatientsTeam: filtra status==='active'
  - ✅ AttendedSessionsTeam: calcula % de realização

### ✅ FASE 4: CONCLUÍDA
- Formatação monetária usando formatBrazilianCurrency()
- 3 cards monetários formatados corretamente

### ✅ FASE 5: CONCLUÍDA
- Tooltips detalhados em todos os 6 cards
- Descrições completas das fórmulas

### ✅ FASE 6: CONCLUÍDA
- Seção 'dashboard-team' configurada corretamente
- availableCardIds verificados

### ✅ FASE 7: CONCLUÍDA
- DashboardExample.tsx integração verificada
- useTeamData funcionando corretamente

### ✅ FASE 8: CONCLUÍDA
- Cards registrados em AVAILABLE_TEAM_CARDS
- Cards importados e mapeados no registry principal
- ALL_AVAILABLE_CARDS atualizado

### 🔜 PRÓXIMAS FASES (Aguardando aval)
**FASE 9**: Validação final e testes (30 min)
**FASE 10**: Documentação (15 min)

---

## 📊 FASES CONCLUÍDAS - RESUMO

### ✅ FASE 0: PRÉ-VALIDAÇÃO - CONCLUÍDA
Sistema validado, arquitetura correta, problema diagnosticado

### ✅ FASE 1: CORRIGIR INTERFACE CARDPROPS - CONCLUÍDA
6 cards com props tipadas corretamente + className

### ✅ FASE 2: ADICIONAR FILTRO DE PERÍODO - CONCLUÍDA  
6 cards filtram por start/end usando parseISO

### ✅ FASE 3: CORRIGIR FÓRMULAS DE CÁLCULO - CONCLUÍDA
6 cards com fórmulas replicadas exatamente (tracking mensalistas)

### ✅ FASE 4: CORRIGIR FORMATAÇÃO - CONCLUÍDA
3 cards monetários usando formatBrazilianCurrency()

### ✅ FASE 5: ADICIONAR TOOLTIPS DETALHADOS - CONCLUÍDA
6 cards com tooltips completos e informativos

### ✅ FASE 6: CONFIGURAR SEÇÃO NO DASHBOARD - CONCLUÍDA
Seção 'dashboard-team' verificada e confirmada como correta

### ✅ FASE 7: VERIFICAR INTEGRAÇÃO NO DASHBOARDEXAMPLE.TSX - CONCLUÍDA
useTeamData funcionando, dados team passados corretamente aos cards

### ✅ FASE 8: REGISTRAR CARDS NO REGISTRY PRINCIPAL - CONCLUÍDA
Cards team adicionados ao AVAILABLE_TEAM_CARDS e ALL_AVAILABLE_CARDS

---

## 🎯 PRÓXIMO PASSO: FASE 9

**A Fase 8 foi concluída com sucesso!** 

Todos os 6 cards team foram registrados:
- ✅ Nova seção `AVAILABLE_TEAM_CARDS` criada em `cardTypes.ts`
- ✅ 6 cards com metadata completa (id, name, description, permissionConfig)
- ✅ `domain: 'team'` e `blockedFor: ['subordinate']` configurados
- ✅ Cards já importados em `dashboardCardRegistry.tsx` (linhas 27-34)
- ✅ Cards já mapeados em `DASHBOARD_CARD_COMPONENTS` (linhas 1047-1053)
- ✅ `AVAILABLE_TEAM_CARDS` incluído em `ALL_AVAILABLE_CARDS`
- ✅ Sistema pronto para renderização via `renderDashboardCard()`

**Pronto para prosseguir com a Fase 9**: Validação final e testes
**FASE 9**: Validação e testes (30 min)
**FASE 10**: Documentação (15 min)

**Tempo total estimado restante**: ~45 min

---

## 🚀 PRONTO PARA CONTINUAR

**Arquivos que serão modificados**:
- ✅ `src/lib/dashboardCardRegistryTeam.tsx` (principal)
- ✅ `src/lib/defaultSectionsDashboard.ts` (verificação)
- ✅ `src/pages/DashboardExample.tsx` (verificação apenas)

**Arquivos de referência** (não serão modificados):
- 📖 `src/pages/Dashboard.tsx`
- 📖 `src/lib/dashboardCardRegistry.tsx`

---

**Última atualização**: 2025-11-18
**Versão**: 1.0
**Autor**: Análise diagnóstica completa
