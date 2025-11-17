# 🚀 FASE 2 - HOOK CENTRAL DE PERMISSÕES

**Status:** ⏳ AGUARDANDO APROVAÇÃO  
**Duração Estimada:** 3-4 horas  
**Prioridade:** 🔴 CRÍTICA (Bloqueador para FASE 3)

---

## 🎯 OBJETIVO DA FASE 2

Expandir `useCardPermissions` para se tornar o **hook central de todas as verificações de permissões**, incluindo:
- Validação de cards individuais ✅ (já existe)
- **Validação de seções inteiras** 🆕
- **Filtragem automática de cards por seção** 🆕
- **Cache e memoização para performance** 🆕

---

## 📋 ESCOPO DETALHADO

### 1. Expansão do Hook `useCardPermissions`

**Arquivo:** `src/hooks/useCardPermissions.ts`

#### Novas Funções a Implementar

##### 1.1. `canViewSection(sectionConfig: SectionConfig): boolean`
Verifica se o usuário pode ver uma seção inteira.

```typescript
/**
 * Verifica se usuário pode ver uma seção baseado em:
 * - primaryDomain da seção
 * - blockedFor da seção
 * - requiresOwnDataOnly da seção
 */
const canViewSection = (sectionConfig: SectionConfig): boolean => {
  // Admin e FullTherapist sempre veem tudo
  if (isAdmin || isFullTherapist) return true;

  // Verificar se role está bloqueada
  if (sectionConfig.permissionConfig.blockedFor?.includes(currentRole)) {
    return false;
  }

  // Verificar acesso ao domínio principal
  const hasDomainAccess = hasAccess(
    sectionConfig.permissionConfig.primaryDomain
  );
  
  if (!hasDomainAccess) return false;

  // Se requer dados próprios, validar autonomia
  if (sectionConfig.permissionConfig.requiresOwnDataOnly) {
    return isSubordinate && permissions?.canManageOwnPatients;
  }

  return true;
};
```

**Regras de Validação:**
- Admin/FullTherapist: ✅ Sempre visível
- Accountant: ✅ Apenas seções `financial` e `general`
- Subordinado:
  - ✅ Seções `administrative` e `general`
  - ✅ Seções `clinical` SE `canManageOwnPatients` OU `canFullSeeClinic`
  - ✅ Seções `financial` SE `hasFinancialAccess`
  - ❌ Seções `media` (sempre bloqueado)

---

##### 1.2. `getAvailableCardsForSection(sectionConfig: SectionConfig): CardConfig[]`
Retorna apenas os cards que o usuário pode ver dentro de uma seção.

```typescript
/**
 * Filtra cards de uma seção baseado em:
 * 1. availableCardIds da seção
 * 2. Permissões do usuário (via canViewCard)
 * 3. Compatibilidade de domínios (primary + secondary)
 */
const getAvailableCardsForSection = (
  sectionConfig: SectionConfig
): CardConfig[] => {
  // Buscar cards pelos IDs disponíveis
  const sectionCards = ALL_AVAILABLE_CARDS.filter(card =>
    sectionConfig.availableCardIds.includes(card.id)
  );

  // Filtrar por permissão individual
  const visibleCards = sectionCards.filter(card => canViewCard(card.id));

  // Filtrar por compatibilidade de domínio
  const allowedDomains = [
    sectionConfig.permissionConfig.primaryDomain,
    ...(sectionConfig.permissionConfig.secondaryDomains || []),
  ];

  return visibleCards.filter(card =>
    allowedDomains.includes(card.permissionConfig.domain)
  );
};
```

**Casos de Uso:**
- Dashboard: Retorna apenas cards financeiros se subordinado tem `hasFinancialAccess`
- PatientDetail: Retorna apenas cards clínicos se subordinado tem acesso ao paciente
- Media Section: Retorna array vazio para subordinados (seção bloqueada)

---

##### 1.3. `shouldShowSection(sectionConfig: SectionConfig): boolean`
Decide se a seção deve ser renderizada (tem permissão + tem cards visíveis).

```typescript
/**
 * Seção só é exibida se:
 * 1. Usuário tem permissão para ver a seção
 * 2. Existem cards visíveis na seção
 */
const shouldShowSection = (sectionConfig: SectionConfig): boolean => {
  if (!canViewSection(sectionConfig)) return false;
  
  const availableCards = getAvailableCardsForSection(sectionConfig);
  return availableCards.length > 0;
};
```

---

### 2. Otimização de Performance

#### 2.1. Memoização com `useMemo`
```typescript
// Cache de cards disponíveis por seção
const availableCardsBySection = useMemo(() => {
  const cache = new Map<string, CardConfig[]>();
  return (sectionConfig: SectionConfig) => {
    const key = sectionConfig.id;
    if (!cache.has(key)) {
      cache.set(key, getAvailableCardsForSection(sectionConfig));
    }
    return cache.get(key)!;
  };
}, [permissions, isAdmin, isFullTherapist, isSubordinate, isAccountant]);
```

#### 2.2. Early Return para Admin/Full
```typescript
// Admin e Full têm acesso total, não precisa calcular
if (isAdmin || isFullTherapist) {
  return {
    canViewSection: () => true,
    getAvailableCardsForSection: (section) => 
      ALL_AVAILABLE_CARDS.filter(c => section.availableCardIds.includes(c.id)),
    shouldShowSection: (section) => section.availableCardIds.length > 0,
    // ... outras funções
  };
}
```

---

### 3. Funções Auxiliares (Helpers)

#### 3.1. `getCardsByDomain(domain: PermissionDomain): CardConfig[]`
```typescript
const getCardsByDomain = (domain: PermissionDomain): CardConfig[] => {
  return ALL_AVAILABLE_CARDS.filter(
    card => card.permissionConfig.domain === domain
  );
};
```

#### 3.2. `getVisibleCards(cardIds: string[]): CardConfig[]`
```typescript
const getVisibleCards = (cardIds: string[]): CardConfig[] => {
  return cardIds
    .map(id => ALL_AVAILABLE_CARDS.find(c => c.id === id))
    .filter((card): card is CardConfig => !!card && canViewCard(card.id));
};
```

---

## 📊 ESTRUTURA FINAL DO HOOK

```typescript
export function useCardPermissions() {
  const { isAdmin, isFullTherapist, isAccountant, isSubordinate } = useAuth();
  const { permissions, loading } = useSubordinatePermissions();

  // ===== FUNÇÕES EXISTENTES (FASE 1) =====
  const hasAccess = (domain: PermissionDomain, minimumLevel?: AccessLevel) => { ... };
  const canViewCard = (cardId: string) => { ... };
  const shouldFilterToOwnData = () => { ... };
  const canViewFullFinancial = () => { ... };

  // ===== NOVAS FUNÇÕES (FASE 2) =====
  const canViewSection = (sectionConfig: SectionConfig) => { ... };
  const getAvailableCardsForSection = (sectionConfig: SectionConfig) => { ... };
  const shouldShowSection = (sectionConfig: SectionConfig) => { ... };
  const getCardsByDomain = (domain: PermissionDomain) => { ... };
  const getVisibleCards = (cardIds: string[]) => { ... };

  return {
    // Estado
    loading,
    permissions,
    
    // Card-level
    hasAccess,
    canViewCard,
    shouldFilterToOwnData,
    canViewFullFinancial,
    
    // Section-level (NOVO)
    canViewSection,
    getAvailableCardsForSection,
    shouldShowSection,
    
    // Helpers (NOVO)
    getCardsByDomain,
    getVisibleCards,
  };
}
```

---

## 🧪 TESTES NECESSÁRIOS (FASE 2)

### Testes Unitários

#### 1. `canViewSection()`
```typescript
// Admin/Full veem todas as seções
expect(canViewSection(financialSection)).toBe(true); // Admin
expect(canViewSection(mediaSection)).toBe(true);     // Full

// Subordinado SEM hasFinancialAccess
expect(canViewSection(financialSection)).toBe(false);

// Subordinado COM hasFinancialAccess
expect(canViewSection(financialSection)).toBe(true);

// Subordinado sempre bloqueado de mídia
expect(canViewSection(mediaSection)).toBe(false);
```

#### 2. `getAvailableCardsForSection()`
```typescript
// Admin vê todos os cards da seção
const cards = getAvailableCardsForSection(dashboardFinancialSection);
expect(cards.length).toBe(10); // Todos os 10 cards financeiros

// Subordinado vê apenas cards permitidos
const subordinateCards = getAvailableCardsForSection(dashboardFinancialSection);
expect(subordinateCards.length).toBe(5); // Apenas cards sem requiresFinancialAccess
```

#### 3. `shouldShowSection()`
```typescript
// Seção com cards visíveis
expect(shouldShowSection(dashboardAdminSection)).toBe(true);

// Seção sem cards visíveis
expect(shouldShowSection(emptySection)).toBe(false);

// Seção bloqueada
expect(shouldShowSection(mediaSection)).toBe(false); // Subordinado
```

---

## 📁 ARQUIVOS A MODIFICAR

1. **`src/hooks/useCardPermissions.ts`** (PRINCIPAL)
   - Adicionar 5 novas funções
   - Implementar memoização
   - Expandir retorno do hook

2. **`src/types/sectionTypes.ts`** (JÁ CRIADO NA FASE 1)
   - Nenhuma alteração necessária

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Performance degradada com muitos cards | Média | Alto | `useMemo` e cache de resultados |
| Lógica inconsistente entre seções e cards | Baixa | Alto | Testes unitários abrangentes |
| Quebra de layouts salvos | Baixa | Médio | Backward compatibility via `category` |

---

## ✅ CRITÉRIOS DE ACEITAÇÃO (FASE 2)

- [ ] `canViewSection()` implementado e testado
- [ ] `getAvailableCardsForSection()` implementado e testado
- [ ] `shouldShowSection()` implementado e testado
- [ ] Helpers (`getCardsByDomain`, `getVisibleCards`) implementados
- [ ] Memoização implementada para performance
- [ ] Testes unitários passando (cobertura > 80%)
- [ ] Build TypeScript sem erros
- [ ] Documentação do hook atualizada

---

## 🚀 APÓS FASE 2

Com o hook central completo, estaremos prontos para:
- **FASE 3:** Criar `PermissionAwareSection` component
- **FASE 4:** Migrar páginas (`Dashboard.tsx`, `PatientDetail.tsx`)
- **FASE 5:** Validar layouts salvos e cleanup

---

## 📝 NOTAS IMPORTANTES

1. **Nenhuma UI será modificada** nesta fase
2. **Apenas lógica de hook** será expandida
3. **100% testável** via testes unitários
4. **Zero impacto** em código existente (apenas adições)

**FASE 2: ⏳ AGUARDANDO SUA APROVAÇÃO PARA INICIAR**
