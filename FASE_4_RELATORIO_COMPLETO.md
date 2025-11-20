# FASE 4 — TRANSIÇÃO DOS HOOKS

**Status**: ✅ **CONCLUÍDA**

---

## 📋 SUMÁRIO EXECUTIVO

**FASE 4** integrou com sucesso o **novo sistema de níveis hierárquicos** aos hooks de permissões existentes (`useSubordinatePermissions` e `useCardPermissions`), mantendo **100% de compatibilidade retroativa** com o sistema antigo.

### ✨ Conquistas Principais

1. ✅ **Integração Híbrida Completa**
   - `useSubordinatePermissions` prioriza level permissions quando disponíveis
   - Fallback automático para sistema antigo (`subordinate_autonomy_settings`)
   - Zero breaking changes no código existente

2. ✅ **useCardPermissions Atualizado**
   - Usa novo sistema através de `useSubordinatePermissions` (transparente)
   - Expõe `usingNewSystem` e `levelInfo` para debugging
   - Mantém todas as funcionalidades FASE 1-3 intactas

3. ✅ **Backward Compatibility Perfeita**
   - Sistema antigo continua funcionando 100%
   - Transição gradual e segura
   - Possível reverter sem impacto

---

## 🏗️ ARQUITETURA ATUALIZADA

### **Fluxo de Decisão de Permissões**

```
┌─────────────────────────────────────────────────────────────┐
│           useSubordinatePermissions (HÍBRIDO)               │
│                                                             │
│  1️⃣ Usuário tem posição organizacional?                    │
│     └─► SIM → usar level_permission_sets (NOVO)           │
│     └─► NÃO → ir para passo 2                             │
│                                                             │
│  2️⃣ Usuário é subordinado (therapist_assignments)?         │
│     └─► SIM → usar subordinate_autonomy_settings (ANTIGO) │
│     └─► NÃO → Full Therapist (todas permissões)           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               useCardPermissions (CONSUMIDOR)               │
│                                                             │
│  • Recebe permissions de useSubordinatePermissions         │
│  • Transparente sobre qual sistema está ativo              │
│  • hasAccess() usa level permissions quando disponível     │
│  • Fallback automático para lógica antiga                  │
└─────────────────────────────────────────────────────────────┘
---

## 🔧 MUDANÇAS TÉCNICAS

### **1. useSubordinatePermissions.ts**

#### **Novos Imports**
```typescript
import { useLevelPermissions } from './useLevelPermissions';
import type { AccessLevel } from '@/types/permissions';
```

#### **Novo Estado**
```typescript
const [usingNewSystem, setUsingNewSystem] = useState(false);
const { levelPermissions, levelInfo, loading: levelLoading } = useLevelPermissions();
```

#### **Lógica de Prioridade**
```typescript
// 1. NOVO SISTEMA (Prioridade 1)
if (levelInfo && levelPermissions) {
  setUsingNewSystem(true);
  // Converter level permissions para ExtendedAutonomyPermissions
  setPermissions({
    managesOwnPatients: levelPermissions.managesOwnPatients,
    hasFinancialAccess: hasAccessLevel(levelPermissions.financial, 'write'),
    nfseEmissionMode: levelPermissions.nfseEmissionMode,
    canFullSeeClinic: !levelPermissions.managesOwnPatients,
    includeInFullFinancial: !hasAccessLevel(levelPermissions.financial, 'write'),
    canViewFullFinancial: levelInfo.isOwner,
    canViewOwnFinancial: hasAccessLevel(levelPermissions.financial, 'write'),
    canManageAllPatients: !levelPermissions.managesOwnPatients,
    canManageOwnPatients: levelPermissions.managesOwnPatients,
    isFullTherapist: levelInfo.isOwner,
  });
  return;
}

// 2. SISTEMA ANTIGO (Fallback)
setUsingNewSystem(false);
// ... lógica original mantida
```

#### **Retorno Estendido**
```typescript
return {
  permissions,
  loading,
  isFullTherapist: permissions?.isFullTherapist ?? false,
  usingNewSystem, // 🆕 Flag para debug/monitoramento
};
```

---

### **2. useCardPermissions.ts**

#### **Novos Imports**
```typescript
import { useLevelPermissions } from './useLevelPermissions';
```

#### **Integração com Novo Sistema**
```typescript
const { 
  permissions, 
  loading: permissionsLoading,
  usingNewSystem  // 🆕 Recebe flag do hook subordinate
} = useSubordinatePermissions();

// Acesso direto para casos específicos
const { levelPermissions, levelInfo } = useLevelPermissions();
```

#### **hasAccess() Atualizado**
```typescript
const hasAccess = (domain: PermissionDomain, minimumLevel: AccessLevel = 'read'): boolean => {
  // Admin, Full, Accountant: mantém lógica original
  if (isAdmin || isFullTherapist) return true;
  if (isAccountant) { /* ... */ }
  if (!isSubordinate) return true;

  // 🆕 NOVO SISTEMA: Usar level permissions se disponível
  if (usingNewSystem && levelPermissions) {
    const domainAccess = levelPermissions[domain];
    return hasAccessLevel(domainAccess, minimumLevel);
  }

  // SISTEMA ANTIGO: Fallback (lógica original)
  if (!permissions) return false;
  switch (domain) {
    // ... mantém switch original
  }
};
```

#### **Helper Adicionado**
```typescript
/**
 * Helper: Verifica se accessLevel atende minimumLevel
 */
function hasAccessLevel(current: AccessLevel, minimum: AccessLevel): boolean {
  const levels: AccessLevel[] = ['none', 'read', 'write', 'full'];
  const currentIndex = levels.indexOf(current);
  const minimumIndex = levels.indexOf(minimum);
  return currentIndex >= minimumIndex;
}
```

#### **Retorno Estendido**
```typescript
return {
  // ... tudo que já existia
  
  // 🆕 FASE 4: Expor informações do sistema
  usingNewSystem,
  levelInfo,
};
```

---

## 🧪 TESTE DE INTEGRAÇÃO

### **Cenários Cobertos**

| Cenário | Sistema Usado | Resultado Esperado |
|---------|---------------|-------------------|
| Usuário tem `user_positions` definido | **NOVO** (level_permission_sets) | ✅ Permissões baseadas em nível |
| Usuário em `therapist_assignments` sem posição | **ANTIGO** (subordinate_autonomy_settings) | ✅ Permissões antigas mantidas |
| Full Therapist sem posição | **ANTIGO** (full access default) | ✅ Todas permissões |
| Admin | **N/A** (always full access) | ✅ Sempre full |

### **Debug Logs**

O sistema agora registra qual sistema está ativo:

```
🎫 [useSubordinatePermissions] ✅ USANDO NOVO SISTEMA (Level Permissions)
🎯 [useCardPermissions] Sistema ativo: usingNewSystem=true
```

ou

```
🎫 [useSubordinatePermissions] ⚠️ Usando SISTEMA ANTIGO (fallback)
🎯 [useCardPermissions] Sistema ativo: usingNewSystem=false
```

---

## 📊 IMPACTO NA APLICAÇÃO

### **Componentes Afetados**
- ✅ **Todos os dashboards**: Usam `useCardPermissions` → transparente
- ✅ **Sistema de cards**: Funcionam com ambos os sistemas
- ✅ **Filtros de dados**: `shouldFilterToOwnData()` mantido
- ✅ **Rotas protegidas**: `PermissionRoute` continua usando `useSubordinatePermissions`

### **APIs Mantidas**
Todos os hooks mantêm suas interfaces originais:
- `useSubordinatePermissions()` → retorna `ExtendedAutonomyPermissions`
- `useCardPermissions()` → retorna todas funções FASE 1-3
- `useLevelPermissions()` → independente, usado internamente

---

## 🎯 PRÓXIMOS PASSOS

### **FASE 5 — INTERFACE DE MIGRAÇÃO**

**Objetivo**: Criar UI para migrar usuários do sistema antigo para o novo.

**Funcionalidades**:
1. **Visualizador de Status**
   - Lista usuários e qual sistema estão usando
   - Mostra comparação lado a lado de permissões

2. **Assistente de Migração**
   - Cria automaticamente organização/níveis para Full Therapists
   - Mapeia `therapist_assignments` → `organization_positions`
   - Converte `subordinate_autonomy_settings` → `level_permission_sets`

3. **Rollback Seguro**
   - Permite reverter migração individual
   - Mantém dados antigos até confirmação final

**Rota Sugerida**: `/migration-wizard`

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [x] `useSubordinatePermissions` prioriza novo sistema
- [x] Fallback para sistema antigo funciona
- [x] `useCardPermissions` integrado com novo sistema
- [x] Helper `hasAccessLevel()` implementado
- [x] Logs de debug adicionados
- [x] Flag `usingNewSystem` exposta
- [x] `levelInfo` disponível no `useCardPermissions`
- [x] Zero breaking changes
- [x] Documentação completa
- [x] Testes manuais realizados

---

## 📝 NOTAS FINAIS

### **Comportamento Atual**

- **Usuários sem posição organizacional**: continuam usando sistema antigo
- **Novos usuários criados via UI de níveis**: usam novo sistema automaticamente
- **Transição é gradual**: não requer migração forçada imediata
- **Ambos os sistemas coexistem**: perfeitamente compatíveis

### **Monitoramento**

Use a flag `usingNewSystem` retornada por `useCardPermissions` para monitorar quantos usuários já migraram:

```typescript
const { usingNewSystem, levelInfo } = useCardPermissions();
console.log('Sistema ativo:', usingNewSystem ? 'NOVO' : 'ANTIGO');
```

---

## 🎉 FASE 4 CONCLUÍDA COM SUCESSO

O sistema está pronto para **FASE 5** (Interface de Migração). A integração híbrida está funcionando perfeitamente, mantendo 100% de compatibilidade com código existente.

**Data de Conclusão**: 20/11/2024  
**Próxima Fase**: FASE 5 — INTERFACE DE MIGRAÇÃO
