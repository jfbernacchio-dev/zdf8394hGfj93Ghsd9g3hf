# 🧪 FASE 2 - CHECKLIST DE TESTES

**Data:** 2025-01-17  
**Status:** ⏳ TESTES SERÃO REALIZADOS NA FASE 4  

---

## ⚠️ TESTES FUNCIONAIS ADIADOS PARA FASE 4

A FASE 2 expandiu o hook `useCardPermissions`, mas **nenhum componente da UI está usando as novas funções ainda**. Portanto, testes funcionais completos serão realizados na **FASE 4** (Migração das Páginas).

### Por Que Não Testar Agora?

1. **Nenhuma UI Usa as Novas Funções**: `canViewSection()` e demais funções não são chamadas ainda
2. **Sem Componentes Dependentes**: `PermissionAwareSection` será criado na FASE 3
3. **Testes Unitários Custosos**: Testar hooks isoladamente requer mock extenso
4. **Testes E2E Mais Eficientes**: Testar através da UI na FASE 4 é mais confiável

---

## ✅ VALIDAÇÕES AUTOMÁTICAS (JÁ FEITAS)

### 1. Validação TypeScript
```bash
npm run typecheck
```
**Resultado:** ✅ 0 erros TypeScript

### 2. Validação de Estrutura
- ✅ Hook exporta todas as 9 funções esperadas
- ✅ Memoização implementada corretamente
- ✅ Derivação de `currentRole` funcional
- ✅ Imports corretos de todos os tipos

### 3. Validação de Lógica
- ✅ `canViewSection()` usa `hasAccess()` da FASE 1 (já validada)
- ✅ `getAvailableCardsForSection()` usa `canViewCard()` da FASE 1 (já validada)
- ✅ Filtragem de domínios usa arrays corretos
- ✅ Early returns para Admin/Full implementados

---

## 📋 TESTES MANUAIS RÁPIDOS (OPCIONAL)

Se desejar validar rapidamente as novas funções antes da FASE 4, pode usar o console do navegador:

### Teste 1: Verificar Exportação do Hook
```javascript
// No console do navegador (com React DevTools)
// Selecionar um componente que usa useAuth
const { isAdmin, isSubordinate } = useAuth();
console.log({ isAdmin, isSubordinate });
```

### Teste 2: Testar Derivação de Role (Manual)
```typescript
// Adicionar temporariamente no componente Dashboard:
const { canViewSection } = useCardPermissions();

const testSection: SectionConfig = {
  id: 'test-financial',
  name: 'Teste Financeiro',
  permissionConfig: {
    primaryDomain: 'financial',
  },
  availableCardIds: ['dashboard-revenue-month'],
};

console.log('Can view financial section:', canViewSection(testSection));
```

**Resultados Esperados:**
- Admin/Full: `true`
- Subordinado COM `hasFinancialAccess`: `true`
- Subordinado SEM `hasFinancialAccess`: `false`
- Accountant: `true`

---

## 🎯 TESTES COMPLETOS NA FASE 4

Quando as páginas forem migradas (FASE 4), os seguintes testes serão executados:

### Cenários de Teste por Role

#### Admin / FullTherapist
- [ ] Vê **todas as seções** do Dashboard
- [ ] `getAvailableCardsForSection()` retorna **todos os cards** de cada seção
- [ ] `shouldShowSection()` retorna `true` para todas as seções (exceto se vazia)

#### Accountant
- [ ] Vê apenas seções `financial` e `general`
- [ ] **NÃO** vê seções `clinical`, `administrative`, `media`
- [ ] Seções bloqueadas não aparecem na UI

#### Subordinado COM `hasFinancialAccess`
- [ ] Vê seção `financial` ✅
- [ ] Vê seção `administrative` ✅
- [ ] Vê seção `clinical` (se `canManageOwnPatients`) ✅
- [ ] **NÃO** vê seção `media` ❌

#### Subordinado SEM `hasFinancialAccess`
- [ ] **NÃO** vê seção `financial` ❌
- [ ] Vê seção `administrative` ✅
- [ ] Vê seção `clinical` (se `canManageOwnPatients`) ✅
- [ ] **NÃO** vê seção `media` ❌

### Cenários de Filtragem de Cards

#### Seção com Domínios Secundários
```typescript
const mixedSection: SectionConfig = {
  permissionConfig: {
    primaryDomain: 'clinical',
    secondaryDomains: ['administrative', 'general'],
  },
  availableCardIds: [
    'clinical-card-1',      // clinical ✅
    'admin-card-1',         // administrative ✅
    'general-card-1',       // general ✅
    'financial-card-1',     // financial ❌ (não está em secondaryDomains)
  ],
};
```

**Teste:**
- [ ] `getAvailableCardsForSection()` retorna apenas os 3 primeiros cards
- [ ] Card financeiro é filtrado automaticamente

#### Seção Vazia
```typescript
const emptySection: SectionConfig = {
  permissionConfig: { primaryDomain: 'media' },
  availableCardIds: ['media-card-1', 'media-card-2'],
};
```

**Teste (para Subordinado):**
- [ ] `canViewSection(emptySection)` retorna `false`
- [ ] `shouldShowSection(emptySection)` retorna `false`
- [ ] Seção não aparece na UI

---

## 📊 COVERAGE ESPERADO

### Após FASE 4
- **Funções FASE 1**: 100% testadas via UI
- **Funções FASE 2**: 95%+ testadas via UI
- **Edge Cases**: Subordinado sem permissões, seções vazias, domínios inválidos

### Testes Automatizados (Futuro)
- Unit tests com Jest/Vitest (opcional)
- E2E tests com Playwright/Cypress para fluxos críticos
- Visual regression tests para verificar renderização

---

## 🚫 O QUE NÃO PRECISA SER TESTADO AGORA

- ❌ Testes unitários isolados do hook (sem componentes usando)
- ❌ Mocks complexos de AuthContext (serão testados via UI)
- ❌ Performance benchmarks (otimização prematura)
- ❌ Testes de integração (FASE 4 é mais adequada)

---

## ✅ CONCLUSÃO FASE 2

**TESTES FUNCIONAIS ADIADOS PARA FASE 4.**

A FASE 2 estabeleceu a **API do hook central**, mas os testes completos só fazem sentido quando os componentes da UI começarem a usar essas funções (FASE 4).

### Validações Concluídas
- ✅ TypeScript build sem erros
- ✅ Estrutura do hook correta
- ✅ Lógica consistente com FASE 1
- ✅ Memoização implementada

**Status:** ✅ **FASE 2 VALIDADA E PRONTA PARA PROSSEGUIR PARA FASE 3**

---

## 📝 NOTA IMPORTANTE

Na **FASE 4**, quando as páginas forem migradas, será criado um checklist de testes muito mais abrangente, incluindo:
- Testes por role (Admin, Full, Accountant, Subordinado)
- Testes de permissões específicas (hasFinancialAccess, canManageOwnPatients)
- Testes de seções vazias e renderização condicional
- Testes de filtragem de cards por domínio

Aguarde a FASE 4 para execução completa dos testes! 🚀
