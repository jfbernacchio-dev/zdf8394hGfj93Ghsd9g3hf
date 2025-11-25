# 🔵 FASE C1.6 — Filtro de Visibilidade por Permissões

## ✅ Status: COMPLETO

## 📋 Objetivo
Implementar filtro de permissões na aba "Visão Geral" do PatientDetail.tsx, usando metadados dos cards + hooks de permissão existentes para determinar quais cards cada usuário pode visualizar.

---

## 🎯 Escopo da Implementação

### ✅ O que FOI feito:
1. **Helper de permissões puro** em `src/config/patientOverviewCards.ts`
2. **Contexto de permissões** montado no `PatientDetail.tsx`
3. **Filtro de permissões** aplicado nas listas de cards (stat e functional)
4. **Documentação** da FASE C1.6

### ❌ O que NÃO foi mexido:
- Layout e hooks de layout (usePatientOverviewLayout, patientOverviewLayout*)
- Drag & drop, grid ou tamanhos de cards
- Outras abas do PatientDetail (Evolução, Queixa, Arquivos, Financeiro)
- NFSe, Agenda, WhatsApp, nada fora da aba "Visão Geral"
- Semântica de `visibleCards` (localStorage)

---

## 📝 Arquivos Modificados

### 1. `src/config/patientOverviewCards.ts`
**Adicionado:**
- Interface `PatientOverviewPermissionContext` (contexto de permissões do usuário)
- Função pura `canUserSeeOverviewCard()` (helper de validação de permissões)

**Função: `canUserSeeOverviewCard(ctx, card)`**
- **Entrada**: Contexto de permissões do usuário + definição do card
- **Saída**: `true` se o usuário pode ver o card, `false` caso contrário
- **Regras implementadas**:
  1. **Bloqueio explícito**: Se `card.blockedFor` contém o `roleGlobal` do usuário → nega
  2. **Domínio clínico**: Requer `canAccessClinical` + `patientAccessLevel !== 'none'`
  3. **Domínio financeiro**: Requer `financialAccess !== 'none'`
  4. **Administrativo/geral**: Permitido por padrão
  5. **Fallback seguro**: Se mal configurado, nega acesso a dados sensíveis

### 2. `src/pages/PatientDetail.tsx`
**Modificado:**
- Import: Adicionado `getPatientOverviewCardDefinition`, `canUserSeeOverviewCard`, `PatientOverviewPermissionContext`
- **Contexto de permissões** (`permissionCtx`): Montado com dados do `useAuth()` e `useEffectivePermissions()`
- **Filtro de permissões**: Aplicado em `permittedOverviewCardIds` antes da renderização
- **Listas finais**: `finalStatCardIds` e `finalFunctionalCardIds` agora passam pelo filtro de permissões

**Fluxo de filtro:**
```
Catálogo completo (PATIENT_OVERVIEW_CARDS)
  ↓
Ordenação por layout (orderedStatCardIds / orderedFunctionalCardIds)
  ↓
Filtro de PERMISSÕES (permittedOverviewCardIds) ← FASE C1.6
  ↓
Filtro de visibilidade do usuário (visibleCards / localStorage)
  ↓
Renderização final
```

---

## 🔐 Regras de Permissão Implementadas

### Cards Clínicos (domain: 'clinical')
**Aparecem quando:**
- `canAccessClinical === true` (usuário tem permissão clínica)
- `patientAccessLevel !== 'none'` (usuário tem acesso ao paciente)
- Se `requiresFullClinicalAccess === true`: requer `patientAccessLevel === 'full'`

**Exemplos:**
- `patient-clinical-complaint` (Queixa Clínica)
- `recent-notes` (Últimas Notas)

### Cards Financeiros (domain: 'financial' ou requiresFinancialAccess: true)
**Aparecem quando:**
- `financialAccess !== 'none'` (usuário tem acesso financeiro: 'view' ou 'manage')

**Exemplos:**
- `patient-stat-unpaid` (A Pagar)
- `patient-stat-revenue-month` (Faturamento do Mês)
- `patient-stat-paid-month` (Recebido no Mês)
- `patient-stat-nfse` (NFSe Emitida)
- `payment-summary` (Resumo de Pagamentos)

### Cards Administrativos (domain: 'administrative')
**Aparecem:**
- Por padrão, para todos os usuários (a menos que bloqueados explicitamente)

**Exemplos:**
- `patient-stat-total` (Total no Mês)
- `patient-stat-attended` (Comparecidas)
- `patient-stat-scheduled` (Agendadas)
- `patient-next-appointment` (Próximo Agendamento)
- `patient-clinical-info` (Informações Clínicas)
- `patient-history` (Histórico)

### Cards Gerais (domain: 'general')
**Aparecem:**
- Por padrão, para todos os usuários

**Exemplos:**
- `patient-contact-info` (Contato)

---

## 🧪 Cenários de Teste

### ✅ Cenário 1: Usuário SEM acesso financeiro
**Dado:**
- `financialAccess === 'none'`

**Esperado:**
- ❌ NÃO vê: `patient-stat-unpaid`, `patient-stat-revenue-month`, `patient-stat-paid-month`, `patient-stat-nfse`, `payment-summary`
- ✅ VÊ: Todos os cards administrativos e gerais

### ✅ Cenário 2: Usuário SEM acesso clínico
**Dado:**
- `canAccessClinical === false` ou `patientAccessLevel === 'none'`

**Esperado:**
- ❌ NÃO vê: `patient-clinical-complaint`, `recent-notes`
- ✅ VÊ: Todos os cards administrativos, gerais e financeiros (se tiver acesso financeiro)

### ✅ Cenário 3: Usuário COM acesso clínico view-only
**Dado:**
- `canAccessClinical === true`
- `patientAccessLevel === 'view'`

**Esperado:**
- ✅ VÊ: `patient-clinical-complaint`, `recent-notes` (exceto cards que requerem `full`)
- ✅ VÊ: Todos os cards administrativos e gerais

### ✅ Cenário 4: Admin/Owner
**Dado:**
- `isAdmin === true` ou `isOrgOwner === true`
- `canAccessClinical === true`
- `financialAccess !== 'none'`

**Esperado:**
- ✅ VÊ: TODOS os cards (clínicos, financeiros, administrativos, gerais)

---

## 🔄 Integração com visibleCards (localStorage)

**IMPORTANTE:** O filtro de permissões NÃO altera a semântica de `visibleCards`.

**Fluxo combinado:**
1. **Permissão**: Define o **universo de cards possíveis** para o usuário
2. **visibleCards**: Dentro desse universo, define o que o usuário **escolheu exibir/ocultar**

**Exemplo:**
- Usuário sem acesso financeiro: não pode ver `patient-stat-unpaid`, mesmo que esteja em `visibleCards`
- Usuário com acesso financeiro + card em `visibleCards`: vê o card normalmente
- Usuário com acesso financeiro + card NÃO em `visibleCards`: não vê (escondeu por preferência)

---

## 🎨 Descrição Técnica das Regras

```typescript
// Helper puro: src/config/patientOverviewCards.ts
export function canUserSeeOverviewCard(
  ctx: PatientOverviewPermissionContext,
  card: PatientOverviewCardDefinition
): boolean {
  // 1. Bloqueio explícito por role
  if (card.blockedFor?.includes(ctx.roleGlobal)) return false;
  
  // 2. Domínio clínico
  if (card.domain === 'clinical') {
    if (!ctx.canAccessClinical) return false;
    if (!ctx.patientAccessLevel || ctx.patientAccessLevel === 'none') return false;
    if (card.requiresFullClinicalAccess && ctx.patientAccessLevel !== 'full') return false;
    return true;
  }
  
  // 3. Domínio financeiro
  if (card.domain === 'financial' || card.requiresFinancialAccess) {
    if (!ctx.financialAccess || ctx.financialAccess === 'none') return false;
    return true;
  }
  
  // 4. Domínio administrativo/geral
  if (card.domain === 'administrative' || card.domain === 'general') {
    return true;
  }
  
  // 5. Fallback seguro
  if (card.requiresFinancialAccess || card.requiresFullClinicalAccess) return false;
  return true;
}
```

**Aplicação no PatientDetail.tsx:**
```typescript
// 1. Montar contexto de permissões
const permissionCtx: PatientOverviewPermissionContext = {
  roleGlobal,
  isClinicalProfessional: effectiveIsClinicalProfessional,
  isAdminOrOwner: isAdmin || isOrgOwner,
  financialAccess,
  canAccessClinical,
  patientAccessLevel: accessLevel,
};

// 2. Filtrar todos os cards por permissão
const permittedOverviewCardIds = allOverviewCardIds.filter((cardId) => {
  const def = getPatientOverviewCardDefinition(cardId);
  if (!def) return false;
  return canUserSeeOverviewCard(permissionCtx, def);
});

// 3. Aplicar filtro nas listas finais
const finalStatCardIds = baseStatCardIds.filter((id) =>
  permittedOverviewCardIds.includes(id)
);
const finalFunctionalCardIds = baseFunctionalCardIds.filter((id) =>
  permittedOverviewCardIds.includes(id)
);
```

---

## ✅ Confirmações

### ❌ O que NÃO foi alterado:
- ✅ Layout e drag & drop não foram tocados
- ✅ Hooks de layout (usePatientOverviewLayout, patientOverviewLayout*) não foram modificados
- ✅ Outras abas (Evolução, Queixa, Arquivos, Financeiro) não foram alteradas
- ✅ NFSe, Agenda, WhatsApp não foram afetados
- ✅ Semântica de `visibleCards` permanece intacta

### ✅ O que FOI alterado:
- ✅ Adicionado helper puro de permissões em `patientOverviewCards.ts`
- ✅ Contexto de permissões montado no `PatientDetail.tsx`
- ✅ Filtro de permissões aplicado nas listas de cards
- ✅ Documentação criada

---

## 📚 Próximos Passos

**FASE C1.7 (futura):**
- Implementar UI de customização de layout (adicionar/remover cards)
- Implementar drag & drop para reordenação manual
- Criar sistema de templates de layout

**FASE C1.8 (futura):**
- Integrar com React Grid Layout para grid responsivo
- Implementar redimensionamento de cards
- Criar persistência de tamanhos personalizados

---

## 📊 Resumo Quantitativo

- **Arquivos modificados:** 2
- **Arquivos criados:** 1 (esta documentação)
- **Linhas de código adicionadas:** ~120
- **Hooks criados:** 0
- **Componentes criados:** 0
- **Helpers criados:** 2 (interface + função pura)
- **Testes visuais necessários:** 4 cenários principais

---

## 🏁 Conclusão

A FASE C1.6 implementa com sucesso o filtro de permissões na aba "Visão Geral" do PatientDetail, usando os metadados existentes dos cards e os hooks de permissão já em uso no sistema. 

O filtro é:
- **Puro e testável** (função sem side effects)
- **Centralizado** (um único ponto de decisão)
- **Extensível** (fácil adicionar novas regras)
- **Não invasivo** (não altera outras funcionalidades)

**Compatibilidade total** com:
- Sistema de layout (C1.3, C1.4)
- Catálogo de cards (C1.1, C1.2)
- Preferências do usuário (visibleCards)
- Sistema de permissões existente

---

**Data de conclusão:** 2025-01-XX  
**Fase anterior:** C1.5 (QA Final)  
**Próxima fase:** C1.7 (UI de Customização)
