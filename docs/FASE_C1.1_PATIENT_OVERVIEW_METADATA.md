# FASE C1.1 - Patient Overview Cards Metadata

## 📋 Resumo

Criação da camada de metadados para os cards da aba "Visão Geral" do PatientDetail, preparando o terreno para futuras fases de personalização e controle granular de visibilidade.

**IMPORTANTE**: Nesta fase, NÃO houve alterações no layout, JSX ou comportamento da tela. Apenas criamos a infraestrutura de metadados.

---

## 🎯 Objetivos Alcançados

✅ Definir tipos TypeScript para metadados de cards  
✅ Criar registro central de definições de todos os cards da Visão Geral  
✅ Implementar helpers puros para consulta e verificação de permissões  
✅ Preparar importação no PatientDetail.tsx (sem integração ainda)  

---

## 📂 Arquivos Criados/Modificados

### **Criado**: `src/config/patientOverviewCards.ts` (novo arquivo)

- **Tipos definidos**:
  - `PatientOverviewCardCategory`: 'functional' | 'statistical'
  - `PatientOverviewDomain`: 'clinical' | 'financial' | 'administrative' | 'communication' | 'general'
  - `PatientOverviewUserScope`: roles que podem ver o card
  - `PatientOverviewApproachScope`: abordagens clínicas (por enquanto só null e 'psychopathological_basic')
  - `PatientOverviewCardDefinition`: interface principal de metadados

- **Registro de cards**: 9 cards mapeados com metadados completos
- **Helpers implementados**:
  - `getPatientOverviewCardDefinition(cardId)`: recupera definição por ID
  - `canSeeOverviewCard(card, context)`: verifica se usuário pode ver o card

### **Modificado**: `src/pages/PatientDetail.tsx`

- Adicionada importação preparada (linhas 62-66):
  ```typescript
  import { 
    getPatientOverviewCardDefinition, 
    canSeeOverviewCard,
    type PatientOverviewContext 
  } from '@/config/patientOverviewCards';
  ```
- **Nenhuma alteração funcional**: importação não está sendo usada ainda

---

## 🗂️ Cards Mapeados

### Cards Funcionais (7 cards)

| ID | Título | Domínio | User Scope | Pinned | Core |
|----|--------|---------|------------|--------|------|
| `patient-next-appointment` | Próximo Agendamento | clinical | all | ✅ | ✅ |
| `patient-contact-info` | Informações de Contato | general | all | ✅ | ✅ |
| `patient-clinical-complaint` | Queixa Clínica | clinical | all | ✅ | ✅ |
| `patient-clinical-info` | Informações Clínicas | administrative | all | ✅ | ✅ |
| `patient-history` | Histórico | administrative | all | ✅ | ❌ |
| `recent-notes` | Últimas Notas | clinical | all | ✅ | ❌ |
| `quick-actions` | Ações Rápidas | general | all | ✅ | ✅ |

### Cards Estatísticos (2 cards)

| ID | Título | Domínio | User Scope | Pinned | Core |
|----|--------|---------|------------|--------|------|
| `payment-summary` | Resumo de Pagamentos | financial | all | ✅ | ❌ |
| `session-frequency` | Frequência de Sessões | administrative | all | ✅ | ❌ |

---

## 🔒 Lógica de Permissões em `canSeeOverviewCard`

### Verificações Implementadas

1. **User Scope**:
   - Se `userScope` contém `'all'` → libera para todos
   - Caso contrário, verifica match entre `userProfessionalRole` e `userScope`

2. **Domain (acesso por domínio)**:
   - `domain === 'financial'` → requer `hasFinancialAccess === true`
   - `domain === 'clinical'` → requer `hasClinicalAccess === true`
   - `domain === 'general' | 'administrative' | 'communication'` → permissivo (por enquanto)

3. **Approach Scope**:
   - `approachScope === null` → libera para qualquer abordagem
   - `approachScope === 'psychopathological_basic'` → verifica se `activeApproach` é null ou 'psychopathological_basic'

### Características Importantes

- **Função pura**: NÃO chama hooks
- **Contexto externo**: recebe `PatientOverviewContext` já montado
- **Conservadora**: por enquanto, a maioria dos cards tem `userScope: ['all']`

---

## 📐 Estrutura de Metadados por Card

### Exemplo: Card "Próximo Agendamento"

```typescript
{
  id: 'patient-next-appointment',
  title: 'Próximo Agendamento',
  description: 'Exibe data e horário da próxima sessão agendada',
  cardCategory: 'functional',
  domain: 'clinical',
  userScope: ['all'],
  approachScope: null,
  pinnedByDefault: true,
  core: true
}
```

### Exemplo: Card "Resumo de Pagamentos"

```typescript
{
  id: 'payment-summary',
  title: 'Resumo de Pagamentos',
  description: 'Total faturado, recebido e pendente',
  cardCategory: 'statistical',
  domain: 'financial',
  userScope: ['all'], // Será bloqueado por hasFinancialAccess
  approachScope: null,
  pinnedByDefault: true,
  core: false
}
```

---

## 🚫 O Que NÃO Foi Feito (Conforme Especificado)

❌ NÃO alterou o JSX da aba "Visão Geral"  
❌ NÃO integrou `canSeeOverviewCard` ao render atual  
❌ NÃO mudou o comportamento do header do paciente  
❌ NÃO mexeu em lembretes de consentimento  
❌ NÃO alterou layout engine, drag & drop ou default layout  
❌ NÃO criou novos domains, abordagens ou RLS  
❌ NÃO renomeou ou moveu PatientDetail.tsx  

---

## 🔮 Próximas Fases (Não Implementadas)

- **C1.2**: Integrar `canSeeOverviewCard` no render atual
- **C1.3**: Implementar drag & drop e personalização de layout
- **C1.4**: Implementar filtros por abordagem clínica
- **C1.5**: Dashboard de analytics por tipo de card

---

## ✅ Validação

### Compilação
- ✅ Todos os tipos TypeScript estão corretos
- ✅ Nenhum erro de compilação introduzido
- ✅ Importações preparadas mas não usadas (sem side effects)

### Comportamento
- ✅ Nenhuma mudança no comportamento atual do PatientDetail
- ✅ Aba "Visão Geral" funciona exatamente como antes
- ✅ Todos os cards continuam visíveis como estavam

### Metadados
- ✅ 9 cards mapeados com IDs corretos (correspondem ao JSX atual)
- ✅ Categorias coerentes (functional vs statistical)
- ✅ Domains conservadores e alinhados com permission engine
- ✅ User scopes predominantemente 'all' (conservador)
- ✅ Approach scopes quase todos null (exceto futuro uso de psychopathological_basic)

---

## 📊 Estatísticas

- **Total de cards mapeados**: 9
  - Funcionais: 7 (77.8%)
  - Estatísticos: 2 (22.2%)

- **Distribuição por domínio**:
  - clinical: 3 cards (33.3%)
  - general: 2 cards (22.2%)
  - administrative: 3 cards (33.3%)
  - financial: 1 card (11.1%)
  - communication: 0 cards (0%)

- **Cards "core" (essenciais)**: 5 de 9 (55.6%)
- **Cards pinned by default**: 9 de 9 (100%)

---

## 🎉 Status Final

**FASE C1.1: COMPLETA ✅**

- Infraestrutura de metadados criada
- Helpers puros implementados
- Nenhuma quebra introduzida
- Pronto para próximas fases de integração

---

*Documentação gerada automaticamente em 2025-11-24*
