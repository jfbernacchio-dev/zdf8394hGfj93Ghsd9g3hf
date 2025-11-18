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

### ✅ **FASE 4: CORRIGIR FORMATAÇÃO** (10 min)

**Objetivo**: Usar helpers de formatação existentes

**Ações**:
1. Importar `formatBrazilianCurrency` de `@/lib/brazilianFormat`
2. Substituir TODOS os `.toLocaleString('pt-BR', ...)` por:
   ```typescript
   {formatBrazilianCurrency(value)}
   ```

**Exemplo antes**:
```typescript
{totalExpected.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
```

**Exemplo depois**:
```typescript
{formatBrazilianCurrency(totalExpected)}
```

**Arquivos a modificar**:
- `src/lib/dashboardCardRegistryTeam.tsx` (todos os cards com valores monetários)

**Critérios de sucesso**:
- [ ] Nenhum card usa `.toLocaleString()` diretamente
- [ ] Todos valores monetários usam `formatBrazilianCurrency()`

---

### ✅ **FASE 5: ADICIONAR TOOLTIPS DETALHADOS** (20 min)

**Objetivo**: Copiar descrições detalhadas dos cards originais

**Referência**: `src/lib/dashboardCardRegistry.tsx`

**Template**:
```typescript
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p><strong>Receita Esperada - Equipe</strong></p>
      <p className="mt-1">Valor total esperado baseado nas sessões agendadas...</p>
      <div className="mt-2 space-y-1 text-xs">
        <p><strong>Cálculo:</strong></p>
        <p>• Pacientes mensalistas: 1x por mês</p>
        <p>• Demais: valor por sessão</p>
      </div>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Para cada card**:
1. Localizar tooltip correspondente no card principal
2. Copiar estrutura completa
3. Adaptar texto para "Equipe"
4. Manter explicação de cálculo

**Critérios de sucesso**:
- [ ] Todos os cards têm tooltip com Info icon
- [ ] Tooltips explicam o cálculo detalhadamente
- [ ] Consistente com cards principais

---

### ✅ **FASE 6: CONFIGURAR SEÇÃO NO DASHBOARD** (15 min)

**Objetivo**: Garantir que seção Team está corretamente configurada

#### **FASE 6A: Verificar defaultSectionsDashboard.ts**

**Arquivo**: `src/lib/defaultSectionsDashboard.ts`

**Verificar/Adicionar**:
```typescript
'dashboard-team': {
  id: 'dashboard-team',
  name: 'Equipe',
  description: 'Dados agregados dos subordinados',
  permissionConfig: {
    primaryDomain: 'team',
    secondaryDomains: [],
    blockedFor: ['subordinate'],  // Subordinados não veem dados de outros
    requiresOwnDataOnly: false,    // Admin/Full veem dados agregados
  },
  availableCardIds: [
    'dashboard-expected-revenue-team',
    'dashboard-actual-revenue-team',
    'dashboard-unpaid-value-team',
    'dashboard-payment-rate-team',
    'dashboard-total-patients-team',
    'dashboard-attended-sessions-team',
  ],
  defaultHeight: 350,
  collapsible: true,
  startCollapsed: false,
  minCardWidth: 280,
  maxCardWidth: 800,
  defaultCardWidth: 300,
},
```

**Critérios**:
- [ ] Seção existe
- [ ] `availableCardIds` correspondem aos IDs dos cards Team
- [ ] `permissionConfig` adequado

#### **FASE 6B: Adicionar no layout padrão**

**Arquivo**: `src/lib/defaultSectionsDashboard.ts`

**Verificar/Adicionar em `DEFAULT_DASHBOARD_SECTIONS`**:
```typescript
export const DEFAULT_DASHBOARD_SECTIONS: Record<string, string[]> = {
  'dashboard-financial': [...],
  'dashboard-administrative': [...],
  'dashboard-clinical': [...],
  'dashboard-media': [...],
  'dashboard-general': [...],
  'dashboard-charts': [...],
  'dashboard-team': [
    'dashboard-expected-revenue-team',
    'dashboard-actual-revenue-team',
    'dashboard-unpaid-value-team',
    'dashboard-payment-rate-team',
    'dashboard-total-patients-team',
    'dashboard-attended-sessions-team',
  ],
};
```

**Critérios**:
- [ ] Seção team tem cards padrão definidos

---

### ✅ **FASE 7: VERIFICAR INTEGRAÇÃO NO DASHBOARDEXAMPLE.TSX** (10 min)

**Objetivo**: Confirmar que DashboardExample.tsx já está correto

**Arquivo**: `src/pages/DashboardExample.tsx` (📖 APENAS VERIFICAÇÃO - JÁ IMPLEMENTADO)

#### **FASE 7A: Verificar hooks de dados (JÁ IMPLEMENTADO)**

**Verificar que já existe** em `DashboardExample.tsx`:
```typescript
const { 
  teamPatients, 
  teamSessions, 
  subordinateIds, 
  loading: teamLoading 
} = useTeamData();
```

**Critérios**:
- ✅ `useTeamData` está importado
- ✅ Hook está sendo chamado
- ✅ Dados team estão disponíveis

#### **FASE 7B: Verificar renderização da seção (JÁ IMPLEMENTADO)**

**Confirmar que já existe** em DashboardExample.tsx a renderização da seção team com os dados corretos:
```typescript
{canViewCard('dashboard-team') && (
  <ResizableSection
    id="dashboard-team"
    title={DASHBOARD_SECTIONS['dashboard-team'].name}
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

### ✅ **FASE 8: REGISTRAR CARDS NO REGISTRY PRINCIPAL** (10 min)

**Objetivo**: Adicionar cards Team em `AVAILABLE_DASHBOARD_CARDS`

**Arquivo**: `src/types/cardTypes.ts`

**Adicionar ao array `AVAILABLE_DASHBOARD_CARDS`**:
```typescript
{
  id: 'dashboard-expected-revenue-team',
  name: 'Receita Esperada - Equipe',
  description: 'Valor esperado baseado nas sessões agendadas da equipe',
  detailedDescription: 'Valor total esperado de todas as sessões agendadas dos subordinados no período, considerando o valor por sessão de cada paciente.',
  category: 'dashboard-cards',
  defaultWidth: 300,
  defaultHeight: 160,
  permissionConfig: {
    domain: 'team',
    blockedFor: ['subordinate'],
  },
},
{
  id: 'dashboard-actual-revenue-team',
  name: 'Receita Realizada - Equipe',
  description: 'Valor das sessões realizadas pela equipe',
  detailedDescription: 'Soma do valor de todas as sessões com status "comparecida" realizadas pelos subordinados no período.',
  category: 'dashboard-cards',
  defaultWidth: 300,
  defaultHeight: 160,
  permissionConfig: {
    domain: 'team',
    blockedFor: ['subordinate'],
  },
},
// ... repetir para os outros 4 cards
```

**Critérios**:
- [ ] Todos os 6 cards Team estão registrados
- [ ] IDs correspondem aos usados no código
- [ ] `permissionConfig` correto (domain: 'team', blockedFor: ['subordinate'])

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

### 🔜 PRÓXIMAS FASES (Aguardando aval)
**FASE 3**: Corrigir fórmulas dos 6 cards (60 min)
**FASE 4**: Corrigir formatação (10 min)
**FASE 5**: Adicionar tooltips detalhados (30 min)
**FASE 6**: Verificar configuração da seção (15 min)
**FASE 7**: Verificar integração DashboardExample (10 min)
**FASE 8**: Registrar cards principais (5 min)
**FASE 9**: Validação e testes (30 min)
**FASE 10**: Documentação (15 min)

**Tempo total estimado**: ~3h

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
