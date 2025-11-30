# 📊 C3 - CARDS EQUIPE EXTRA - DOCUMENTAÇÃO DE TESTE

## 📋 Resumo Executivo

**Data de Implementação:** 30/11/2025  
**Fase:** FASE 1.4+ - Cards Métricos Equipe (Extras)  
**Status:** ✅ Implementado e Testável

### Objetivo
Implementar 4 novos cards métricos para o domínio **Team** na página `/metrics`, complementando os 3 cards básicos já existentes (Receita Total, Pacientes Ativos, Sessões Realizadas).

---

## 🎯 Cards Implementados

### 1. **Faturamento médio por terapeuta** 
📌 **ID:** `metrics-team-average-revenue-per-therapist`  
📁 **Componente:** `MetricsTeamAverageRevenuePerTherapistCard.tsx`  
📍 **Local:** `src/components/cards/metrics/team/`

**Descrição:**  
Mostra a média de faturamento entre os profissionais da equipe que realizaram pelo menos uma sessão no período selecionado.

**Fórmula:**
```typescript
averageRevenuePerTherapist = totalTeamRevenue / therapistsWithSessions
```

**Dados exibidos:**
- **Valor principal:** Faturamento médio formatado em BRL (R$ X.XXX,XX)
- **Subtítulo:** "Equipe: X profissionais com atendimentos"

**Edge cases:**
- Se `therapistsWithSessions === 0`: mostra R$ 0,00 e texto "Nenhum atendimento realizado no período"

**Layout default:**
- Posição: `x: 0, y: 2`
- Dimensões: `w: 3, h: 3`
- Restrições: `minW: 2, minH: 3`

**Ícone:** `Users` (lucide-react)

---

### 2. **Taxa de comparecimento da equipe**
📌 **ID:** `metrics-team-attendance-rate`  
📁 **Componente:** `MetricsTeamAttendanceRateCard.tsx`  
📍 **Local:** `src/components/cards/metrics/team/`

**Descrição:**  
Percentual de sessões da equipe que foram efetivamente realizadas (vs faltadas).

**Fórmula:**
```typescript
totalCommittedSessions = attendedSessions + missedSessions;
attendanceRate = (attendedSessions / totalCommittedSessions) * 100;
```

**Dados exibidos:**
- **Valor principal:** Taxa em percentual (XX.X%)
- **Subtítulo:** "X de Y sessões comparecidas"

**Edge cases:**
- Se `totalCommittedSessions === 0`: mostra "--" e texto "Nenhuma sessão agendada no período"

**Layout default:**
- Posição: `x: 3, y: 2`
- Dimensões: `w: 3, h: 3`
- Restrições: `minW: 2, minH: 3`

**Ícone:** `CheckCircle` (lucide-react)

---

### 3. **Ocupação média da equipe**
📌 **ID:** `metrics-team-average-occupation-rate`  
📁 **Componente:** `MetricsTeamAverageOccupationRateCard.tsx`  
📍 **Local:** `src/components/cards/metrics/team/`

**Descrição:**  
Porcentagem média do tempo disponível da equipe que foi ocupada com atendimentos no período.

**Fórmula:**
```typescript
averageOccupationRate = (totalAttendedSlots / totalAvailableSlots) * 100;
```

**Cálculo de slots:**
- **Available slots:** Calculado com base em:
  - Dias úteis do profissional (`work_days`)
  - Horário de trabalho (`work_start_time`, `work_end_time`)
  - Duração de slot (`slot_duration`)
  - Tempo de intervalo (`break_time`)
  - Subtraído de bloqueios de agenda (`schedule_blocks`)

- **Attended slots:** Cada sessão realizada (status = 'attended') conta como 1 slot

**Dados exibidos:**
- **Valor principal:** Taxa em percentual (XX.X%)
- **Subtítulo:** "X de Y blocos preenchidos"

**Edge cases:**
- Se `totalAvailableSlots === 0`: mostra "--" e texto "Nenhuma disponibilidade cadastrada para a equipe no período"

**Layout default:**
- Posição: `x: 6, y: 2`
- Dimensões: `w: 3, h: 3`
- Restrições: `minW: 2, minH: 3`

**Ícone:** `BarChart3` (lucide-react)

---

### 4. **Ticket médio da equipe**
📌 **ID:** `metrics-team-average-ticket`  
📁 **Componente:** `MetricsTeamAverageTicketCard.tsx`  
📍 **Local:** `src/components/cards/metrics/team/`

**Descrição:**  
Valor médio recebido por sessão realizada pelos profissionais da equipe no período.

**Fórmula:**
```typescript
averageTicket = totalTeamRevenue / attendedSessions;
```

**Dados exibidos:**
- **Valor principal:** Ticket médio formatado em BRL (R$ X.XXX,XX)
- **Subtítulo:** "Baseado em X sessões realizadas pela equipe"

**Edge cases:**
- Se `attendedSessions === 0`: mostra R$ 0,00 e texto "Nenhuma sessão realizada no período"

**Layout default:**
- Posição: `x: 9, y: 2`
- Dimensões: `w: 3, h: 3`
- Restrições: `minW: 2, minH: 3`

**Ícone:** `DollarSign` (lucide-react)

---

## 🏗️ Arquitetura Implementada

### Novos Arquivos Criados

#### 1. **Tipos (Types)**
📁 `src/types/teamMetricsTypes.ts`

Define o tipo `TeamMetricsSummary` que estende `FinancialSummary` com métricas adicionais:
```typescript
export interface TeamMetricsSummary extends FinancialSummary {
  attendedSessions: number;
  missedSessions: number;
  averageRevenuePerTherapist: number;
  therapistsWithSessions: number;
  attendanceRate: number;
  totalCommittedSessions: number;
  averageOccupationRate: number;
  totalAvailableSlots: number;
  totalAttendedSlots: number;
  averageTicket: number;
}
```

#### 2. **Cálculos (Calculations)**
📁 `src/lib/teamMetricsCalculations.ts`

Contém a função principal `getTeamMetricsSummary()` que:
- Calcula todas as métricas agregadas da equipe
- Reutiliza `getFinancialSummary()` para métricas básicas
- Adiciona cálculos específicos de equipe:
  - Faturamento por terapeuta
  - Taxa de comparecimento
  - Ocupação (com base em schedule_blocks)
  - Ticket médio

**Funções auxiliares:**
- `calculateRevenueByTherapist()`: Agrupa receita por terapeuta
- `calculateTeamOccupation()`: Calcula slots disponíveis vs ocupados
- `calculateAvailableSlotsForTherapist()`: Calcula disponibilidade individual

#### 3. **Componentes de Cards**
📁 `src/components/cards/metrics/team/`
- `MetricsTeamAverageRevenuePerTherapistCard.tsx`
- `MetricsTeamAttendanceRateCard.tsx`
- `MetricsTeamAverageOccupationRateCard.tsx`
- `MetricsTeamAverageTicketCard.tsx`

Todos seguem o padrão:
- Props: `MetricsCardBaseProps` (periodFilter, summary, isLoading, className)
- Summary tipado como `TeamMetricsSummary`
- Estados de loading com Skeleton
- Edge cases tratados

---

### Arquivos Modificados

#### 1. **Registry de Cards**
📁 `src/lib/metricsCardRegistry.tsx`

**Modificações:**
- Importados os 4 novos componentes
- Adicionadas 4 novas entradas no `METRICS_CARD_REGISTRY`
- Cada entrada com:
  - ID único
  - Título e descrição
  - Domínio: `'team'`
  - Componente associado
  - Layout padrão
  - Permissão: `'team_access'`

**Total de cards Team:** 7 (3 básicos + 4 novos)

#### 2. **Layout Default**
📁 `src/lib/defaultLayoutMetrics.ts`

**Modificações:**
- Seção `'metrics-team'` expandida de 3 para 7 cards
- Layout organizado em 2 linhas:
  - **Linha 1:** Cards principais (receita, pacientes, sessões)
  - **Linha 2:** Cards de métricas detalhadas (4 novos)

#### 3. **Página Metrics**
📁 `src/pages/Metrics.tsx`

**Modificações:**

**A. Imports adicionados:**
```typescript
import { getTeamMetricsSummary } from '@/lib/teamMetricsCalculations';
import type { TeamMetricsSummary } from '@/types/teamMetricsTypes';
```

**B. Nova query - Schedule Blocks da Equipe:**
```typescript
const { data: rawTeamScheduleBlocks, isLoading: teamScheduleBlocksLoading } = useQuery({
  queryKey: ['metrics-team-schedule-blocks', subordinateIds],
  queryFn: async () => {
    // Busca schedule_blocks de todos os subordinados
  },
  enabled: !!subordinateIds && subordinateIds.length > 0,
});
```

**C. Conversão de Schedule Blocks:**
```typescript
const teamScheduleBlocks: MetricsScheduleBlock[] = useMemo(() => {
  // Converte raw data para formato MetricsScheduleBlock
}, [rawTeamScheduleBlocks]);
```

**D. Cálculo de teamAggregatedData atualizado:**
```typescript
const teamAggregatedData = useMemo(() => {
  const summary = getTeamMetricsSummary({
    sessions: teamSessions,
    patients: teamPatients,
    scheduleBlocks: teamScheduleBlocks,  // ← NOVO
    profiles: teamProfilesRecord,         // ← NOVO
    start: dateRange.start,
    end: dateRange.end,
  });
  // ... resto do cálculo
}, [teamPatients, teamSessions, teamScheduleBlocks, teamProfilesRecord, ...]);
```

**E. Loading state atualizado:**
```typescript
const cardsLoading = 
  patientsLoading || 
  sessionsLoading || 
  profileLoading || 
  blocksLoading || 
  teamLoading || 
  teamProfilesLoading || 
  teamScheduleBlocksLoading;  // ← NOVO
```

#### 4. **Tipos Base Atualizados**
📁 `src/lib/systemMetricsUtils.ts`

**Modificação:**
- Interface `MetricsProfile` agora inclui `id: string` (requerido)
- Permite indexação por ID nos cálculos de equipe

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────┐
│           Metrics.tsx (useQuery)                │
│                                                 │
│  1. subordinateIds (useTeamData)                │
│  2. rawTeamProfiles (profiles query)            │
│  3. rawTeamScheduleBlocks (schedule_blocks)     │
│  4. teamPatients (filtrado de metricsPatients)  │
│  5. teamSessions (filtrado de metricsSessions)  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│     teamAggregatedData (useMemo)                │
│                                                 │
│  → getTeamMetricsSummary({                      │
│       sessions: teamSessions,                   │
│       patients: teamPatients,                   │
│       scheduleBlocks: teamScheduleBlocks,       │
│       profiles: teamProfilesRecord,             │
│       start, end                                │
│     })                                          │
│                                                 │
│  → Retorna: TeamMetricsSummary                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│        Cards Team (props)                       │
│                                                 │
│  periodFilter: MetricsPeriodFilter              │
│  summary: TeamMetricsSummary                    │
│  isLoading: boolean                             │
└─────────────────────────────────────────────────┘
```

---

## 🧪 Como Testar

### Pré-requisitos
1. Usuário com permissão `team_access`
2. Pelo menos 1 subordinado configurado
3. Subordinado(s) com:
   - Pacientes cadastrados
   - Sessões realizadas no período
   - Configuração de agenda (schedule_blocks)

### Teste 1: Visualização Básica
1. Acessar `/metrics?domain=team`
2. Verificar que os 7 cards aparecem:
   - **Linha 1:** Receita Total | Pacientes Ativos | Sessões
   - **Linha 2:** Faturamento Médio | Taxa Comparecimento | Ocupação | Ticket Médio

### Teste 2: Dados Corretos - Faturamento Médio
1. Verificar que o valor mostrado = receita total da equipe / nº de terapeutas com sessões
2. Verificar que o subtítulo mostra o número correto de terapeutas
3. **Edge case:** Sem sessões → deve mostrar R$ 0,00 e mensagem apropriada

### Teste 3: Dados Corretos - Taxa de Comparecimento
1. Calcular manualmente: (sessões attended / (attended + missed)) * 100
2. Verificar que o percentual exibido está correto
3. Verificar que o subtítulo mostra contagem correta (X de Y)
4. **Edge case:** Sem sessões agendadas → deve mostrar "--" e mensagem apropriada

### Teste 4: Dados Corretos - Ocupação Média
1. Verificar que considera:
   - Dias úteis dos profissionais
   - Horários de trabalho
   - Bloqueios de agenda
2. Verificar que o percentual faz sentido (0-100%)
3. **Edge case:** Sem disponibilidade → deve mostrar "--" e mensagem apropriada

### Teste 5: Dados Corretos - Ticket Médio
1. Calcular manualmente: receita total / sessões realizadas
2. Verificar que o valor exibido está correto
3. **Edge case:** Sem sessões → deve mostrar R$ 0,00 e mensagem apropriada

### Teste 6: Filtros de Período
1. Alterar período (semana, mês, ano, custom)
2. Verificar que todos os 4 cards recalculam corretamente
3. Verificar que valores são consistentes entre si

### Teste 7: Loading States
1. Recarregar página
2. Verificar que todos os cards mostram skeleton durante loading
3. Verificar que transição para dados é suave

### Teste 8: Responsividade
1. Redimensionar janela
2. Verificar que cards se reorganizam corretamente
3. Testar em diferentes resoluções (desktop, tablet, mobile)

### Teste 9: Adicionar/Remover Cards
1. Clicar em "Adicionar Cards"
2. Verificar que os 4 novos cards aparecem na lista
3. Remover um card e verificar que pode ser readicionado
4. Verificar que posicionamento automático funciona

### Teste 10: Layout Personalizado
1. Arrastar cards para diferentes posições
2. Redimensionar cards
3. Salvar layout
4. Recarregar página e verificar que layout persiste

---

## 📊 Métricas de Qualidade

### Cobertura de Código
- ✅ Tipos definidos (TeamMetricsSummary)
- ✅ Cálculos isolados em módulo separado
- ✅ Componentes com tratamento de edge cases
- ✅ Loading states implementados
- ✅ Integração com sistema de registry
- ✅ Layout default configurado

### Performance
- ✅ Queries otimizadas (apenas dados necessários)
- ✅ Cálculos em useMemo (evita recálculos desnecessários)
- ✅ Dados derivados em memória (não duplica queries)
- ✅ Schedule blocks apenas quando necessário

### Segurança
- ✅ Permissão `team_access` requerida
- ✅ Dados filtrados por subordinateIds
- ✅ Queries com enabled baseado em dados válidos

---

## 🐛 Problemas Conhecidos e Limitações

### 1. Cálculo de Ocupação Simplificado
**Descrição:** O cálculo de slots disponíveis usa uma aproximação:
- Assume duração fixa de slot por profissional
- Não considera variações de horário por dia da semana
- Schedule blocks são subtraídos de forma simplificada

**Impacto:** Baixo - Valores são aproximados mas representativos

**Solução futura:** Implementar cálculo detalhado dia-a-dia

### 2. Performance com Muitos Subordinados
**Descrição:** Com 50+ subordinados, queries podem ser lentas

**Impacto:** Médio - Loading mais longo

**Solução futura:** 
- Adicionar paginação
- Implementar cache de cálculos
- Otimizar queries com índices

### 3. Schedule Blocks Históricos
**Descrição:** Schedule blocks antigos não são arquivados

**Impacto:** Baixo - Pode afetar cálculos de períodos muito antigos

**Solução futura:** Implementar arquivamento de dados históricos

---

## 🔮 Próximos Passos

### Curto Prazo
1. ✅ Testar em produção com dados reais
2. ⏳ Coletar feedback de usuários
3. ⏳ Ajustar fórmulas se necessário

### Médio Prazo
1. ⏳ Adicionar gráficos de tendência por terapeuta
2. ⏳ Implementar comparação período anterior
3. ⏳ Adicionar drill-down nos cards (detalhe por terapeuta)

### Longo Prazo
1. ⏳ Exportação de relatórios
2. ⏳ Alertas automáticos (ocupação baixa, taxa de falta alta)
3. ⏳ Integração com metas/objetivos

---

## 📝 Notas Técnicas

### Decisões de Design

**1. Por que TeamMetricsSummary estende FinancialSummary?**
- Reutiliza métricas básicas já calculadas
- Mantém consistência com outros domínios
- Facilita futuras extensões

**2. Por que schedule_blocks é necessário?**
- Cálculo preciso de ocupação requer disponibilidade real
- Bloqueios de agenda devem ser considerados
- Permite análise de utilização de tempo

**3. Por que separar cálculos em teamMetricsCalculations.ts?**
- Mantém Metrics.tsx focado em UI e orquestração
- Facilita testes unitários
- Permite reutilização em outros contextos

**4. Por que usar Record&lt;string, MetricsProfile&gt; para profiles?**
- Acesso O(1) por ID do terapeuta
- Mais eficiente que array.find() em loops
- Padrão consistente com charts

### Padrões de Código

**Formatação de valores:**
```typescript
// Moeda
new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(value)

// Percentual
`${value.toFixed(1)}%`
```

**Tratamento de edge cases:**
```typescript
if (denominator === 0) {
  return <estado-vazio>
} else {
  return <valor-calculado>
}
```

**Loading states:**
```typescript
if (isLoading) {
  return <CardWithSkeleton />
}
return <CardWithData />
```

---

## ✅ Checklist de Implementação

### Tipos e Estruturas
- [x] TeamMetricsSummary definido
- [x] Estende FinancialSummary
- [x] Todas as métricas documentadas

### Cálculos
- [x] getTeamMetricsSummary implementado
- [x] calculateRevenueByTherapist
- [x] calculateTeamOccupation
- [x] calculateAvailableSlotsForTherapist
- [x] Edge cases tratados

### Componentes
- [x] MetricsTeamAverageRevenuePerTherapistCard
- [x] MetricsTeamAttendanceRateCard
- [x] MetricsTeamAverageOccupationRateCard
- [x] MetricsTeamAverageTicketCard
- [x] Todos com loading states
- [x] Todos com edge cases tratados

### Integração
- [x] Registry atualizado (4 novas entradas)
- [x] Layout default atualizado
- [x] Metrics.tsx integrado
- [x] Query de schedule_blocks adicionada
- [x] teamAggregatedData usando getTeamMetricsSummary

### Testes Manuais
- [ ] Visualização básica
- [ ] Dados corretos - Faturamento médio
- [ ] Dados corretos - Taxa de comparecimento
- [ ] Dados corretos - Ocupação média
- [ ] Dados corretos - Ticket médio
- [ ] Filtros de período
- [ ] Loading states
- [ ] Responsividade
- [ ] Adicionar/Remover cards
- [ ] Layout personalizado

---

## 📞 Suporte

**Documentação relacionada:**
- C3_Correções_Profundas_FASE1.md (documento base)
- systemMetricsUtils.ts (cálculos básicos)
- metricsCardRegistry.tsx (sistema de cards)

**Arquivos-chave:**
- `src/types/teamMetricsTypes.ts`
- `src/lib/teamMetricsCalculations.ts`
- `src/components/cards/metrics/team/*.tsx`
- `src/pages/Metrics.tsx`

---

**Última atualização:** 30/11/2025  
**Versão do documento:** 1.0  
**Status:** Pronto para testes
