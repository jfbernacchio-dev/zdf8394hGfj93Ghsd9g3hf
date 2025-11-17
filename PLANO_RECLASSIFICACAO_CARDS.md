# 📋 PLANO DETALHADO: RECLASSIFICAÇÃO E CORREÇÃO DE CARDS

**Data:** 17 de Novembro de 2025  
**Objetivo:** Reclassificar 50-60 cards do /dashboard segundo nova arquitetura e corrigir fórmulas no /dashboard-example

---

## 🎯 RESUMO EXECUTIVO

### Problema Identificado
1. **Dashboard Example** (`/dashboard-example`) tem **32 cards mockados** com valores FIXOS
2. **Dashboard Original** (`/dashboard`) tem **~60 cards** com fórmulas CORRETAS e funcionando
3. **Desalinhamento:** Cards no example não usam as fórmulas reais do dashboard original
4. **Classificação Incompleta:** Alguns cards não seguem a nova estrutura de domínios

### Solução Proposta
1. **Copiar TODAS as fórmulas** do Dashboard.tsx para dashboardCardRegistry.tsx
2. **Reclassificar cards** segundo nova estrutura (financial, administrative, clinical, media, general)
3. **Criar cards faltantes** que existem no dashboard original mas não no example
4. **Reorganizar seções** para refletir a nova arquitetura

---

## 📊 LEVANTAMENTO COMPLETO DE CARDS

### A. CARDS NO DASHBOARD ORIGINAL (/dashboard) - FUNCIONANDO ✅

#### FINANCIAL DOMAIN (Receitas e Pagamentos)
```typescript
1. dashboard-expected-revenue
   - Fórmula: totalExpected (considera pacientes ativos, frequency, monthly_price)
   - Valor Atual: Calculado dinamicamente
   - Status: ✅ Correto

2. dashboard-actual-revenue
   - Fórmula: totalActual (sessões attended com lógica monthly_price)
   - Valor Atual: Calculado dinamicamente
   - Status: ✅ Correto

3. dashboard-unpaid-value
   - Fórmula: unpaidValue (sessões attended NÃO pagas com lógica monthly)
   - Valor Atual: Calculado dinamicamente
   - Status: ✅ Correto

4. dashboard-payment-rate
   - Fórmula: (totalActual / totalExpected) * 100
   - Valor Atual: Calculado dinamicamente
   - Status: ✅ Correto
```

#### ADMINISTRATIVE DOMAIN (Sessões e Pacientes)
```typescript
5. dashboard-attended-sessions
   - Fórmula: visiblePeriodSessions.filter(s => s.status === 'attended').length
   - Valor Atual: Calculado dinamicamente
   - Status: ✅ Correto

6. dashboard-expected-sessions
   - Fórmula: visiblePeriodSessions.length (com show_in_schedule !== false)
   - Valor Atual: Calculado dinamicamente
   - Status: ✅ Correto

7. dashboard-pending-sessions
   - Fórmula: visiblePeriodSessions.filter(s => sessionDate > now && status !== 'attended/missed')
   - Valor Atual: Calculado dinamicamente
   - Status: ✅ Correto

8. dashboard-missed-sessions
   - Fórmula: visiblePeriodSessions.filter(s => s.status === 'missed')
   - Percentual: (missedSessions.length / expectedSessions) * 100
   - Valor Atual: Calculado dinamicamente
   - Status: ✅ Correto

9. dashboard-total-patients
   - Fórmula: patients.length
   - Valor Atual: Calculado dinamicamente
   - Status: ✅ Correto

10. dashboard-attendance-rate
    - Fórmula: (attendedSessions.length / expectedSessions) * 100
    - Valor Atual: Calculado dinamicamente
    - Status: ✅ Correto
```

#### CHART CARDS (Gráficos)
```typescript
11. dashboard-chart-revenue-trend
    - Tipo: LineChart
    - Dados: Receita ao longo do tempo (com intervalos dinâmicos)
    - Lógica: monthlyPatientsInInterval para evitar duplicação
    - Status: ✅ Correto (complexo)

12. dashboard-chart-payment-status
    - Tipo: PieChart
    - Dados: Pagas vs Não Pagas (com lógica monthly)
    - Status: ✅ Correto

13. dashboard-chart-session-types
    - Tipo: PieChart
    - Dados: Attended, Missed, Pending
    - Status: ✅ Correto

14. dashboard-chart-attendance-weekly
    - Tipo: BarChart
    - Dados: Sessões por intervalo de tempo
    - Lógica: usa getScale() do useChartTimeScale
    - Status: ✅ Correto (complexo)

15. dashboard-chart-revenue-by-therapist
    - Tipo: BarChart
    - Dados: Receita por terapeuta (com lógica monthly)
    - Status: ✅ Correto (complexo)

16. dashboard-chart-therapist-distribution
    - Tipo: PieChart
    - Dados: Pacientes por terapeuta
    - Status: ✅ Correto

17. dashboard-chart-active-patients-trend
    - Tipo: LineChart
    - Dados: Pacientes ativos ao longo do tempo
    - Status: ✅ Correto (complexo)

18. dashboard-chart-hourly-distribution
    - Tipo: BarChart
    - Dados: Sessões por hora do dia
    - Status: ✅ Correto
```

### B. CARDS NO DASHBOARD EXAMPLE (/dashboard-example) - MOCKADOS ❌

#### FINANCIAL DOMAIN (32 cards totais)
```typescript
1. DashboardExpectedRevenue
   ❌ PROBLEMA: Valor fixo "R$ 25.400,00"
   ✅ CORRETO: totalExpected (fórmula do dashboard)

2. DashboardActualRevenue
   ❌ PROBLEMA: Valor fixo "R$ 18.750,00"
   ✅ CORRETO: totalActual (fórmula do dashboard)

3. DashboardUnpaidValue
   ❌ PROBLEMA: Valor fixo "R$ 6.650,00"
   ✅ CORRETO: unpaidValue (fórmula do dashboard)

4. DashboardPaymentRate
   ❌ PROBLEMA: Valor fixo "82%"
   ✅ CORRETO: revenuePercent (fórmula do dashboard)
```

#### ADMINISTRATIVE DOMAIN
```typescript
5. DashboardTotalPatients
   ❌ PROBLEMA: Valor fixo "47"
   ✅ CORRETO: patients.length

6. DashboardAttendedSessions
   ❌ PROBLEMA: Valor fixo "124"
   ✅ CORRETO: attendedSessions.length

7. DashboardExpectedSessions
   ❌ PROBLEMA: Valor fixo "140"
   ✅ CORRETO: expectedSessions

8. DashboardPendingSessions
   ❌ PROBLEMA: Valor fixo "16"
   ✅ CORRETO: pendingSessions.length

9. DashboardMissedSessions
   ❌ PROBLEMA: Valor fixo "12"
   ✅ CORRETO: missedSessions.length

10. DashboardAttendanceRate
    ❌ PROBLEMA: Valor fixo "89%"
    ✅ CORRETO: attendanceRate calculado
```

---

## 🔄 AÇÕES NECESSÁRIAS

### FASE 1: COPIAR FÓRMULAS (Prioridade ALTA 🔴)

#### 1.1 Substituir Cards Financeiros
```typescript
// Arquivo: src/lib/dashboardCardRegistry.tsx

// ❌ ANTES (mockado):
export const DashboardExpectedRevenue = ({ isEditMode }: CardProps) => (
  <Card>
    <CardContent>
      <div className="text-2xl font-bold text-primary">R$ 25.400,00</div>
    </CardContent>
  </Card>
);

// ✅ DEPOIS (com fórmula real):
export const DashboardExpectedRevenue = ({ 
  patients, 
  start, 
  end, 
  isEditMode 
}: CardProps & { patients: any[], start: Date, end: Date }) => {
  const totalExpected = patients
    .filter(p => p.status === 'active')
    .reduce((sum, patient) => {
      const patientStart = new Date(patient.start_date);
      const periodStart = patientStart > start ? patientStart : start;
      
      if (periodStart > end) return sum;
      
      if (patient.monthly_price) {
        const months = eachMonthOfInterval({ start: periodStart, end });
        return sum + (months.length * Number(patient.session_value || 0));
      } else {
        const weeks = Math.floor((end.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const multiplier = patient.frequency === 'weekly' ? 1 : 0.5;
        const sessions = Math.max(1, Math.ceil(weeks * multiplier));
        return sum + (sessions * Number(patient.session_value || 0));
      }
    }, 0);

  return (
    <Card className={cn('h-full')}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Receita Esperada
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">
          {formatBrazilianCurrency(totalExpected)}
        </div>
      </CardContent>
    </Card>
  );
};
```

**Total de cards a atualizar:** 10 cards financeiros + administrativos

#### 1.2 Copiar Lógica de Charts Complexos
```typescript
// Charts que precisam de lógica completa:
- dashboard-chart-revenue-trend (usa intervalos dinâmicos)
- dashboard-chart-attendance-weekly (usa useChartTimeScale)
- dashboard-chart-revenue-by-therapist (lógica monthly complexa)
- dashboard-chart-active-patients-trend (calcula pacientes ativos por intervalo)
```

**Total de charts a atualizar:** 8 charts

---

### FASE 2: RECLASSIFICAR CARDS (Prioridade ALTA 🔴)

#### 2.1 Cards Já Classificados Corretamente ✅
```typescript
FINANCIAL (7 cards):
- dashboard-expected-revenue ✅
- dashboard-actual-revenue ✅
- dashboard-unpaid-value ✅
- dashboard-payment-rate ✅
- dashboard-chart-revenue-trend ✅
- dashboard-chart-payment-status ✅
- dashboard-chart-revenue-by-therapist ✅

ADMINISTRATIVE (9 cards):
- dashboard-attended-sessions ✅
- dashboard-expected-sessions ✅
- dashboard-pending-sessions ✅
- dashboard-missed-sessions ✅
- dashboard-total-patients ✅
- dashboard-attendance-rate ✅
- dashboard-chart-session-types ✅
- dashboard-chart-therapist-distribution ✅
- dashboard-chart-attendance-weekly ✅
```

#### 2.2 Cards que Precisam Reclassificação ⚠️
```typescript
// Atualmente não classificados ou em domínio errado:

1. dashboard-chart-active-patients-trend
   - Domínio Sugerido: ADMINISTRATIVE
   - Razão: Relacionado a pacientes

2. dashboard-chart-hourly-distribution
   - Domínio Sugerido: ADMINISTRATIVE
   - Razão: Distribuição de sessões

3. dashboard-chart-cancellation-reasons
   - Domínio Sugerido: ADMINISTRATIVE
   - Razão: Análise de sessões canceladas
   - Status: Placeholder (requer campo no banco)
```

#### 2.3 Cards Faltantes (existem no Dashboard.tsx mas não no registry) 📦
```typescript
// Cards que precisam ser CRIADOS no dashboardCardRegistry:

NENHUM - todos os cards principais já existem no registry!
```

---

### FASE 3: ATUALIZAR DEFAULTSECTIONSDASHBOARD (Prioridade MÉDIA 🟡)

#### 3.1 Adicionar Cards Reclassificados às Seções
```typescript
// Arquivo: src/lib/defaultSectionsDashboard.ts

export const DASHBOARD_SECTIONS: Record<string, SectionConfig> = {
  'dashboard-administrative': {
    availableCardIds: [
      'dashboard-attended-sessions',
      'dashboard-expected-sessions',
      'dashboard-pending-sessions',
      'dashboard-missed-sessions',
      'dashboard-total-patients',
      'dashboard-attendance-rate',
      'dashboard-chart-session-types',
      'dashboard-chart-therapist-distribution',
      'dashboard-chart-attendance-weekly',
      'dashboard-chart-active-patients-trend', // ✅ ADICIONAR
      'dashboard-chart-hourly-distribution',    // ✅ ADICIONAR
    ],
  },
  
  // Manter outras seções...
};
```

---

### FASE 4: REFATORAR DASHBOARD EXAMPLE PAGE (Prioridade ALTA 🔴)

#### 4.1 Problema Atual
```typescript
// Arquivo: src/pages/DashboardExample.tsx

// ❌ PROBLEMA: Cards renderizados sem dados
{renderDashboardCard(cardLayout.cardId, {
  isEditMode,
})}

// Cards não recebem dados reais (patients, sessions, etc.)
```

#### 4.2 Solução: Passar Props com Dados
```typescript
// ✅ SOLUÇÃO: Adicionar carregamento de dados

const DashboardExample = () => {
  // ... estados existentes ...
  
  // ADICIONAR: Estados de dados
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [period, setPeriod] = useState('month');
  
  // ADICIONAR: Função de carregamento
  const loadData = async () => {
    const { data: patientsData } = await supabase
      .from('patients')
      .select('*');
    
    const patientIds = (patientsData || []).map(p => p.id);
    
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .in('patient_id', patientIds);
    
    setPatients(patientsData || []);
    setSessions(sessionsData || []);
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  // MODIFICAR: Renderização de cards
  {renderDashboardCard(cardLayout.cardId, {
    isEditMode,
    patients,      // ✅ ADICIONAR
    sessions,      // ✅ ADICIONAR
    start,         // ✅ ADICIONAR
    end,           // ✅ ADICIONAR
  })}
};
```

---

## 📁 ARQUIVOS A MODIFICAR

### 1. `src/lib/dashboardCardRegistry.tsx` 🔴 CRÍTICO
**Mudanças:** ~500 linhas
- Copiar fórmulas de 10 cards financeiros/administrativos
- Atualizar 8 charts com lógica complexa
- Adicionar interface CardProps com dados reais
- Remover valores mockados

### 2. `src/pages/DashboardExample.tsx` 🔴 CRÍTICO
**Mudanças:** ~50 linhas
- Adicionar estados `patients`, `sessions`, `period`
- Adicionar função `loadData()`
- Adicionar função `getDateRange()`
- Passar props para `renderDashboardCard()`

### 3. `src/lib/defaultSectionsDashboard.ts` 🟡 MÉDIA
**Mudanças:** ~10 linhas
- Adicionar 2 cards reclassificados na seção administrativa
- Ajustar descrições se necessário

### 4. `src/types/cardTypes.ts` 🟢 BAIXA
**Mudanças:** ~20 linhas
- Atualizar interface `CardProps` para incluir dados
- Adicionar tipos para `patients`, `sessions`, etc.

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### ❌ ANTES
```typescript
// Card com valor mockado
<div className="text-2xl font-bold">R$ 25.400,00</div>
<p>+12% vs mês anterior</p>
```

### ✅ DEPOIS
```typescript
// Card com fórmula real
const totalExpected = patients
  .filter(p => p.status === 'active')
  .reduce((sum, patient) => {
    // Lógica complexa de cálculo...
    return sum + calculatedValue;
  }, 0);

<div className="text-2xl font-bold">
  {formatBrazilianCurrency(totalExpected)}
</div>
<p className="text-xs text-muted-foreground">
  {patients.length} pacientes ativos
</p>
```

---

## 🧪 TESTES NECESSÁRIOS APÓS IMPLEMENTAÇÃO

### Teste 1: Valores Corretos
- [ ] Receita Esperada bate com Dashboard.tsx
- [ ] Receita Realizada bate com Dashboard.tsx
- [ ] Valores Pendentes batem com Dashboard.tsx
- [ ] Taxa de Pagamento bate com Dashboard.tsx

### Teste 2: Charts Funcionando
- [ ] Chart de Tendência de Receita renderiza corretamente
- [ ] Chart de Status de Pagamento mostra dados reais
- [ ] Chart de Tipos de Sessões reflete dados corretos
- [ ] Chart Semanal de Comparecimento usa escala dinâmica

### Teste 3: Período Dinâmico
- [ ] Trocar período afeta todos os cards
- [ ] Custom date range funciona
- [ ] Cards respondem a mudanças de período

### Teste 4: Permissões
- [ ] Subordinados veem apenas seus dados
- [ ] Admins veem dados de subordinados
- [ ] Cards bloqueados não aparecem

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Performance
**Problema:** Carregar dados reais pode deixar dashboard lento  
**Mitigação:** 
- Usar React.memo em cards
- Debounce em mudanças de período
- Loading skeletons durante carregamento

### Risco 2: Complexidade de Fórmulas
**Problema:** Lógica de monthly_price é complexa  
**Mitigação:**
- Copiar exatamente do Dashboard.tsx
- Adicionar comentários explicativos
- Criar helpers para lógica reutilizável

### Risco 3: Quebra de Layout
**Problema:** Mudanças podem quebrar persistência  
**Mitigação:**
- Manter IDs de cards iguais
- Testar reset de layout
- Documentar mudanças de schema

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Preparação
- [ ] Backup do dashboardCardRegistry.tsx atual
- [ ] Backup do DashboardExample.tsx atual
- [ ] Criar branch `feature/dashboard-formulas`

### FASE 1: Copiar Fórmulas
- [ ] Card: dashboard-expected-revenue
- [ ] Card: dashboard-actual-revenue
- [ ] Card: dashboard-unpaid-value
- [ ] Card: dashboard-payment-rate
- [ ] Card: dashboard-attended-sessions
- [ ] Card: dashboard-expected-sessions
- [ ] Card: dashboard-pending-sessions
- [ ] Card: dashboard-missed-sessions
- [ ] Card: dashboard-total-patients
- [ ] Card: dashboard-attendance-rate
- [ ] Chart: dashboard-chart-revenue-trend
- [ ] Chart: dashboard-chart-payment-status
- [ ] Chart: dashboard-chart-session-types
- [ ] Chart: dashboard-chart-attendance-weekly
- [ ] Chart: dashboard-chart-revenue-by-therapist
- [ ] Chart: dashboard-chart-therapist-distribution
- [ ] Chart: dashboard-chart-active-patients-trend
- [ ] Chart: dashboard-chart-hourly-distribution

### FASE 2: Reclassificar Cards
- [ ] Adicionar dashboard-chart-active-patients-trend ao administrative
- [ ] Adicionar dashboard-chart-hourly-distribution ao administrative
- [ ] Atualizar defaultSectionsDashboard.ts

### FASE 3: Refatorar DashboardExample
- [ ] Adicionar estados (patients, sessions, period)
- [ ] Adicionar loadData()
- [ ] Adicionar getDateRange()
- [ ] Passar props para renderDashboardCard()
- [ ] Adicionar loading states
- [ ] Adicionar error handling

### FASE 4: Testes
- [ ] Teste de valores financeiros
- [ ] Teste de valores administrativos
- [ ] Teste de charts
- [ ] Teste de período dinâmico
- [ ] Teste de permissões
- [ ] Teste de performance
- [ ] Teste de reset de layout

---

## 📈 ESTIMATIVA DE TEMPO

### FASE 1: Copiar Fórmulas
- **Tempo Estimado:** 3-4 horas
- **Complexidade:** Alta (lógica de monthly_price, intervalos dinâmicos)

### FASE 2: Reclassificar Cards
- **Tempo Estimado:** 30 minutos
- **Complexidade:** Baixa (apenas reorganização)

### FASE 3: Refatorar DashboardExample
- **Tempo Estimado:** 1-2 horas
- **Complexidade:** Média (integração com dados reais)

### FASE 4: Testes
- **Tempo Estimado:** 2 horas
- **Complexidade:** Média (validação de fórmulas)

**TOTAL:** 6-8 horas

---

## ✅ PRÓXIMOS PASSOS

1. **Aguardar aprovação do plano** ⏸️
2. **Executar FASE 1** (Copiar fórmulas)
3. **Executar FASE 2** (Reclassificar)
4. **Executar FASE 3** (Refatorar)
5. **Executar FASE 4** (Testar)
6. **Merge e Deploy** 🚀

---

**FIM DO PLANO DE RECLASSIFICAÇÃO E CORREÇÃO** 📋
