# FASE C1.10.3-G — Plano de Refinamento da Persistência com userId

## 📋 Contexto

Após QA da FASE C1.10.3-F, identificamos 3 ressalvas aceitáveis mas aperfeiçoáveis:

1. **Chaves antigas migradas para primeiro usuário** - Comportamento não ideal em cenários multi-usuário
2. **Sem limpeza automática de chaves órfãs** - Acúmulo gradual no localStorage
3. **Flags de migração permanecem indefinidamente** - Poluição leve do localStorage

---

## 🎯 RESSALVA 1: Migração para Primeiro Usuário

### Problema Atual
```typescript
// Cenário atual:
// User A loga primeiro → recebe TODAS as chaves antigas
// User B loga depois → começa do zero (perdeu suas customizações antigas)
```

**Impacto**: Em ambiente multi-usuário compartilhado (ex: computador familiar), o primeiro a logar "rouba" layouts de outros.

### Solução Proposta: Sistema de "Propriedade Incerta"

#### Abordagem A: Migração Conservadora (RECOMENDADA)
**Princípio**: "Na dúvida, não migre"

```typescript
// Estratégia:
// 1. Criar namespace especial para chaves "sem dono"
// 2. Primeira vez que cada usuário loga, oferecer ESCOLHA:
//    - "Quer usar este layout encontrado?"
//    - "Começar do zero?"
```

**Implementação**:
1. Modificar `migrateOldKeys` para mover chaves antigas para namespace temporário:
   ```typescript
   // grid-card-patient-overview-main-X 
   // → grid-card-unclaimed-patient-overview-main-X
   ```

2. Criar hook de "claim" que detecta chaves não reclamadas:
   ```typescript
   const hasUnclaimedLayout = checkUnclaimedKeys();
   if (hasUnclaimedLayout) {
     // Mostrar modal de escolha
   }
   ```

3. Adicionar componente `<LayoutClaimDialog>`:
   - "Encontramos um layout personalizado. Deseja usá-lo?"
   - Botões: "Usar" | "Começar do Zero" | "Lembrar depois"

4. Se usuário aceitar, migrar de `unclaimed` para `user-{userId}`

**Vantagens**:
- ✅ Respeita propriedade original
- ✅ UX transparente
- ✅ Não perde customizações

**Desvantagens**:
- ⚠️ Mais complexo
- ⚠️ Requer UI adicional
- ⚠️ Usuário precisa tomar decisão

#### Abordagem B: Migração com Timestamp (ALTERNATIVA)
**Princípio**: "Último a usar, fica com a chave"

```typescript
// Estratégia:
// 1. Ao migrar, adicionar timestamp
// 2. Cada login verifica se o timestamp é "dele"
```

**Menos recomendada** pois não resolve o problema fundamental.

---

## 🎯 RESSALVA 2: Limpeza Automática de Chaves Órfãs

### Problema Atual
```typescript
// Cenários que criam chaves órfãs:
// 1. Card foi removido do registry mas key persiste
// 2. SectionId mudou mas keys antigas ficam
// 3. userId mudou mas keys do userId antigo permanecem
```

**Impacto**: Acúmulo gradual (não crítico, mas "sujo").

### Solução Proposta: Garbage Collector de Layout

#### Implementação

1. **Criar função `cleanOrphanedKeys(userId: string)`**:
   ```typescript
   /**
    * Remove chaves de localStorage que não têm correspondência
    * no registry atual.
    */
   const cleanOrphanedKeys = (userId: string) => {
     // 1. Listar todas as chaves do user atual
     const userKeys = getAllUserKeys(userId);
     
     // 2. Para cada chave, verificar se:
     //    - SectionId existe no DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT
     //    - CardId existe no registry
     
     // 3. Remover as que não existem mais
   };
   ```

2. **Integrar no hook**:
   ```typescript
   useEffect(() => {
     if (!user?.id) return;
     
     migrateOldKeys(user.id);
     cleanOrphanedKeys(user.id); // ADICIONAR AQUI
     
     const loaded = loadLayoutFromLocalStorage();
     // ...
   }, [user?.id]);
   ```

3. **Adicionar controle de frequência**:
   ```typescript
   // Rodar limpeza apenas 1x por dia por usuário
   const lastCleanupKey = `layout-cleanup-${userId}`;
   const lastCleanup = localStorage.getItem(lastCleanupKey);
   
   if (!lastCleanup || daysSince(lastCleanup) >= 1) {
     cleanOrphanedKeys(userId);
     localStorage.setItem(lastCleanupKey, new Date().toISOString());
   }
   ```

4. **Logs de auditoria**:
   ```typescript
   console.log('[usePatientOverviewLayout] Cleanup: removidas', removedKeys.length, 'chaves órfãs');
   ```

**Vantagens**:
- ✅ Mantém localStorage limpo
- ✅ Automático e transparente
- ✅ Performance negligível (roda raramente)

**Desvantagens**:
- ⚠️ Precisa conhecer registry de cards (acoplamento)
- ⚠️ Se card for temporariamente removido do registry, perde customização

#### Mitigação do Risco
- Criar lista de "cards conhecidos" separada do registry ativo
- Nunca remover chaves com menos de 30 dias
- Adicionar flag de "safe mode" que nunca remove nada

---

## 🎯 RESSALVA 3: Flags de Migração Permanentes

### Problema Atual
```typescript
// localStorage:
// patient-overview-migrated-{userId} → "true" (forever)
```

**Impacto**: Mínimo (apenas 1 entrada por usuário), mas tecnicamente "poluição".

### Solução Proposta: Limpeza Progressiva de Flags

#### Abordagem A: Expiração Automática (RECOMENDADA)
```typescript
// Modificar flag para incluir timestamp de expiração
const migrationKey = `patient-overview-migrated-${userId}`;
const migrationData = {
  migrated: true,
  timestamp: Date.now(),
  expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 dias
};

localStorage.setItem(migrationKey, JSON.stringify(migrationData));
```

**Lógica de checagem**:
```typescript
const checkMigrationNeeded = (userId: string): boolean => {
  const migrationKey = `patient-overview-migrated-${userId}`;
  const data = localStorage.getItem(migrationKey);
  
  if (!data) return true; // Nunca migrou
  
  try {
    const parsed = JSON.parse(data);
    
    // Se flag expirou, considerar como "não migrado"
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(migrationKey); // Limpar flag expirada
      return true;
    }
    
    return false; // Já migrou e ainda válido
  } catch {
    return true; // Flag corrompida, re-migrar
  }
};
```

**Justificativa dos 90 dias**:
- Tempo suficiente para usuário usar sistema regularmente
- Após 90 dias, assume-se que chaves antigas já não existem mais
- Se ainda existirem, re-migração é segura (idempotente)

#### Abordagem B: Flag Volátil em Memory (NÃO RECOMENDADA)
- Usar `sessionStorage` ao invés de `localStorage`
- **Problema**: Migração rodaria toda sessão (ineficiente)

#### Abordagem C: Sem Flag (MAIS SIMPLES)
- Remover flag completamente
- Migração verifica diretamente se existem chaves antigas
- **Vantagem**: Zero poluição
- **Desvantagem**: Roda checagem de migração toda vez (mas é rápida)

---

## 📊 Matriz de Decisão

| Ressalva | Abordagem Recomendada | Complexidade | Impacto UX | Impacto Técnico |
|----------|----------------------|--------------|------------|-----------------|
| **1. Migração 1º User** | Claim Dialog (A) | 🔴 Alta | ✅ Positivo | ⚠️ Médio |
| **2. Chaves Órfãs** | Garbage Collector | 🟡 Média | ✅ Neutro | ✅ Baixo |
| **3. Flags Permanentes** | Expiração 90d (A) | 🟢 Baixa | ✅ Neutro | ✅ Baixo |

---

## 🗂️ Plano de Implementação Faseado

### FASE G1: Limpeza de Flags (Mais Simples)
**Arquivos**: `src/hooks/usePatientOverviewLayout.ts`

1. Modificar estrutura da flag de migração para incluir `expiresAt`
2. Atualizar `checkMigrationNeeded` para validar expiração
3. Adicionar cleanup de flags expiradas
4. Testar com diferentes timestamps

**Estimativa**: 30min  
**Risco**: 🟢 Baixo

---

### FASE G2: Garbage Collector de Chaves Órfãs
**Arquivos**: 
- `src/hooks/usePatientOverviewLayout.ts` (função principal)
- `src/lib/patientOverviewCardRegistry.tsx` (referência para validação)

1. Criar `getAllUserKeys(userId)` para listar chaves do user
2. Criar `cleanOrphanedKeys(userId)` com lógica de validação
3. Integrar no hook com controle de frequência (1x/dia)
4. Adicionar logs de auditoria
5. Testar cenários:
   - Remoção de card do registry
   - Mudança de sectionId
   - Múltiplas execuções (idempotência)

**Estimativa**: 1-2h  
**Risco**: 🟡 Médio (precisa garantir não remover chaves válidas)

---

### FASE G3: Sistema de Claim de Layout (Mais Complexo)
**Arquivos NOVOS**:
- `src/components/LayoutClaimDialog.tsx` (modal de escolha)
- `src/hooks/useLayoutClaim.ts` (lógica de detecção)

**Arquivos MODIFICADOS**:
- `src/hooks/usePatientOverviewLayout.ts` (integração)

#### Etapas:

**G3.1 - Modificar Migração para Namespace "Unclaimed"**
```typescript
// Ao invés de migrar direto para userId, mover para namespace temporário
const migrateToUnclaimed = () => {
  // grid-card-X → grid-card-unclaimed-X
};
```

**G3.2 - Criar Hook de Detecção**
```typescript
// useLayoutClaim.ts
export const useLayoutClaim = (userId: string) => {
  const [hasUnclaimedLayout, setHasUnclaimedLayout] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'pending' | 'claimed' | 'dismissed'>('pending');
  
  // Detectar chaves unclaimed
  // Gerenciar estado de claim
  // Executar migração se aceito
};
```

**G3.3 - Criar Componente de UI**
```tsx
// LayoutClaimDialog.tsx
export const LayoutClaimDialog = ({ 
  open, 
  onClaim, 
  onDismiss, 
  onRemindLater 
}) => {
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Layout Personalizado Encontrado</DialogTitle>
          <DialogDescription>
            Detectamos um layout customizado anterior. Deseja utilizá-lo?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-2">
          <Button onClick={onClaim}>
            <Check className="mr-2 h-4 w-4" />
            Usar Este Layout
          </Button>
          <Button variant="outline" onClick={onDismiss}>
            Começar do Zero
          </Button>
          <Button variant="ghost" onClick={onRemindLater}>
            Lembrar Depois
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

**G3.4 - Integrar no PatientDetail**
```tsx
// src/pages/PatientDetail.tsx
const { hasUnclaimedLayout, claimLayout, dismissLayout } = useLayoutClaim(user.id);

return (
  <>
    <LayoutClaimDialog 
      open={hasUnclaimedLayout} 
      onClaim={claimLayout}
      onDismiss={dismissLayout}
    />
    {/* resto do componente */}
  </>
);
```

**Estimativa**: 3-4h  
**Risco**: 🔴 Alto (UX complexa, múltiplos edge cases)

---

## 🔍 Considerações Finais

### Trade-offs por Ressalva

#### Ressalva 1 (Migração 1º User)
**Implementar?** 
- ✅ SIM se sistema é multi-usuário em mesmo device
- ⚠️ TALVEZ se é raro ter múltiplos users no mesmo browser
- ❌ NÃO se cada user tem seu próprio device/browser

**Complexidade vs Valor**:
- Alta complexidade para problema de baixa frequência
- Alternativa: Documentar comportamento + botão "Resetar" acessível

#### Ressalva 2 (Chaves Órfãs)
**Implementar?** 
- ✅ SIM - Boa prática de housekeeping
- Baixa complexidade, alto valor de "limpeza"

#### Ressalva 3 (Flags Permanentes)
**Implementar?** 
- ✅ SIM - Simples e elegante
- Melhora higiene do localStorage sem custo significativo

---

## 🎯 Recomendação Final

### Cenário 1: Implementação Completa (Ideal)
```
FASE G1 (Flags) → FASE G2 (Garbage Collector) → FASE G3 (Claim Dialog)
Tempo total: ~5-7h
```

### Cenário 2: Implementação Pragmática (Recomendado)
```
FASE G1 (Flags) + FASE G2 (Garbage Collector)
Tempo total: ~2-3h
Documentar Ressalva 1 como "comportamento conhecido"
```

### Cenário 3: Mínimo Viável
```
Apenas FASE G1 (Flags)
Tempo total: ~30min
Documentar Ressalvas 1 e 2 como "aceitáveis"
```

---

## 📝 Próximos Passos

1. **Decisão do Stakeholder**: Qual cenário implementar?
2. **Priorização**: Ordem de implementação (sugestão: G1 → G2 → G3)
3. **Testes**: Cada fase deve ter QA antes de prosseguir
4. **Documentação**: Atualizar docs após cada fase

---

**Aguardando aprovação para iniciar implementação.**
