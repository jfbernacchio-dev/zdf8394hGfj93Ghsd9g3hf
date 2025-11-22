# FASE 12.3 — Permissões Centralizadas (Sem God Mode)

## 📋 Resumo

Centralização completa das permissões do dashboard, removendo o "God Mode" de Admin/Owner e garantindo que todos os usuários passem pela mesma lógica de resolução de permissões baseada em:

- **`level_role_settings`**: Configurações de permissões por nível organizacional + role
- **`level_sharing_config`**: Compartilhamento de dados entre usuários do mesmo nível
- **`peer_sharing`**: Compartilhamento manual peer-to-peer

## 🔧 Mudanças Implementadas

### 1. Remoção do God Mode (`src/hooks/useDashboardPermissions.ts`)

**ANTES (God Mode):**
```typescript
// FASE 12.1.2: Admin e Owner primário têm visibilidade TOTAL
const hasFullAccess = isAdmin || isOrganizationOwner;

const ctx = {
  canAccessClinical: hasFullAccess ? true : canAccessClinical,
  canAccessFinancial: hasFullAccess ? true : (financialAccess !== 'none'),
  // ...
};
```

**DEPOIS (Sem God Mode):**
```typescript
// FASE 12.3: REMOVER GOD MODE - Todos passam pela mesma lógica de permissões
console.log('[DASH_PERM] ✂️ God mode desativado. Resolvendo por nível e role.');

const ctx = {
  canAccessClinical,  // Direto de level_role_settings
  canAccessFinancial: financialAccess !== 'none',
  // ...
};
```

**Impacto:**
- ✅ Admin/Owner agora precisam de configuração em `level_role_settings`
- ✅ Permissões determinadas pelo nível organizacional + role
- ✅ Sem bypass especial para nenhum role

### 2. Logs Detalhados de Debug

```typescript
console.log('[DASH_PERM] 🔎 Visibilidade calculada por level_role_settings', {
  userId,
  levelId,
  roleType,
  visibility: {
    financial: { canViewSection: ctx.canAccessFinancial },
    administrative: { canViewSection: ctx.canAccessAdministrative },
    clinical: { canViewSection: ctx.canAccessClinical },
    // ...
  },
});
```

### 3. Função `canViewDashboardCard` Atualizada

**ANTES:**
```typescript
// FASE 12.1.2: Admin e Owner têm visibilidade TOTAL - bypass todas as checagens
if (ctx.isAdmin || ctx.isOrganizationOwner) {
  return true;
}
```

**DEPOIS:**
```typescript
// FASE 12.3: REMOVER GOD MODE - verificar domínio sempre
if (!canAccessDomain(config.domain, ctx)) {
  console.log('[DASH_PERM] ❌ Card bloqueado por domínio', {
    cardId: card.id,
    domain: config.domain,
  });
  return false;
}
```

### 4. Função `canAccessDomain` Sem Bypass

**ANTES:**
```typescript
function canAccessDomain(domain: PermissionDomain, ctx: DashboardPermissionContext): boolean {
  // FASE 12.1.2: Admin e Owner têm acesso TOTAL a todos os domínios
  if (ctx.isAdmin || ctx.isOrganizationOwner) return true;
  
  switch (domain) { ... }
}
```

**DEPOIS:**
```typescript
/**
 * FASE 12.3: Sem bypass para admin/owner - todos passam pela mesma lógica
 */
function canAccessDomain(domain: PermissionDomain, ctx: DashboardPermissionContext): boolean {
  switch (domain) { ... }
}
```

### 5. Helper de Escopo de Compartilhamento (`src/utils/dashboardSharingScope.ts`)

**Nova função criada:**
```typescript
export async function getDashboardVisibleUserIds(params: {
  supabase: SupabaseClient;
  userId: string;
  organizationId: string;
  levelId: string | null;
  domain: DashboardDomain;
}): Promise<string[]>
```

**Lógica:**
1. ✅ Sempre inclui o próprio usuário
2. ✅ Busca subordinados diretos via `get_all_subordinates()`
3. ✅ Aplica `level_sharing_config` (compartilhamento de nível)
4. ✅ Aplica `peer_sharing` (compartilhamento manual)
5. ✅ Respeita configurações de visibilidade por domínio

**Logs:**
```typescript
console.log('[TEAM_METRICS] 👥 Calculando escopo de equipe para domínio', {
  userId,
  organizationId,
  levelId,
  domain,
});
```

### 6. Integração com `useTeamData` (`src/hooks/useTeamData.ts`)

**ANTES:**
```typescript
// Buscar subordinados via RPC
const { data: subordinatesData } = await supabase
  .rpc('get_all_subordinates', { _user_id: user.id });

const subordinateUserIds = subordinatesData?.map(s => s.subordinate_user_id) || [];
```

**DEPOIS:**
```typescript
// FASE 12.3: Usar escopo de compartilhamento
const { getDashboardVisibleUserIds } = await import('@/utils/dashboardSharingScope');

const visibleUserIds = await getDashboardVisibleUserIds({
  supabase,
  userId: user.id,
  organizationId,
  levelId: null, // TODO: obter do useEffectivePermissions
  domain: 'team',
});
```

**Impacto:**
- ✅ Cards de equipe agora respeitam `level_sharing_config` e `peer_sharing`
- ✅ Métricas agregadas filtradas por escopo de compartilhamento
- ✅ Logs detalhados do escopo calculado

### 7. Log de Inicialização (`src/pages/DashboardExample.tsx`)

```typescript
useEffect(() => {
  console.log('[DASHBOARD] ✅ FASE 12.3 aplicada. Dashboard agora respeita level_role_settings + sharing.', {
    userId: user?.id,
    organizationId,
  });
}, [user, organizationId]);
```

## 🎯 Comportamento Esperado

### ✅ Admin/Owner com Permissões Restritas

**Cenário:**
1. Usuário é Admin ou Primary Owner
2. Seu nível organizacional tem `level_role_settings` com:
   - `can_access_clinical = false`
   - `financial_access = 'none'`

**Resultado:**
- ❌ **NÃO** vê seção "Clínica"
- ❌ **NÃO** vê cards financeiros
- ✅ Vê apenas seções/cards permitidos pelas configurações

**Logs esperados:**
```
[DASH_PERM] ✂️ God mode desativado. Resolvendo por nível e role.
[DASH_PERM] 🔎 Visibilidade calculada por level_role_settings
[DASH_PERM] ❌ Card bloqueado por domínio { cardId: 'dashboard-expected-revenue', domain: 'financial' }
```

### ✅ Escopo de Equipe Baseado em Sharing

**Cenário:**
1. Usuário A e B estão no mesmo nível
2. `level_sharing_config` compartilha domínio `financial` entre eles
3. Usuário A acessa cards de equipe

**Resultado:**
- ✅ Métricas de equipe incluem dados do Usuário B
- ✅ Cards Team mostram agregados corretos

**Logs esperados:**
```
[TEAM_METRICS] 👥 Calculando escopo de equipe para domínio { domain: 'financial' }
[TEAM_METRICS] 📊 Subordinados diretos encontrados: 0
[TEAM_METRICS] 🔗 Usuários compartilhados via level_sharing: 1
[TEAM_METRICS] ✅ Escopo final de equipe { totalVisibleUsers: 2 }
```

## 📊 Estrutura de Dados Usada

### `level_role_settings` (Já Existente)

Colunas usadas:
- `level_id` (uuid)
- `role_type` (admin | psychologist | assistant | accountant)
- `can_access_clinical` (boolean)
- `financial_access` (text: 'none' | 'summary' | 'full')
- `can_access_marketing` (boolean)
- `can_access_whatsapp` (boolean)
- `can_view_team_financial_summary` (boolean)

### `level_sharing_config` (Já Existente)

Colunas usadas:
- `level_id` (uuid)
- `shared_domains` (text[])

Exemplo:
```sql
INSERT INTO level_sharing_config (level_id, shared_domains)
VALUES ('level-uuid', ARRAY['financial', 'team']);
```

### `peer_sharing` (Já Existente)

Colunas usadas:
- `sharer_user_id` (uuid)
- `receiver_user_id` (uuid)
- `shared_domains` (text[])
- `is_bidirectional` (boolean)

## 🐛 Debugging

### Verificar Permissões Calculadas

```javascript
// No console do navegador
// Após login e carregamento do dashboard
```

Procurar por:
```
[DASH_PERM] ✂️ God mode desativado
[DASH_PERM] 🔎 Visibilidade calculada por level_role_settings
```

### Verificar Escopo de Equipe

```
[TEAM_METRICS] 👥 Calculando escopo de equipe
[TEAM_METRICS] 📊 Subordinados diretos encontrados: X
[TEAM_METRICS] 🔗 Usuários compartilhados via level_sharing: Y
[TEAM_METRICS] 🤝 Usuários compartilhados via peer_sharing: Z
[TEAM_METRICS] ✅ Escopo final de equipe
```

### Verificar Bloqueios de Cards

```
[DASH_PERM] ❌ Card bloqueado por domínio { cardId: '...', domain: '...' }
```

## ✅ Checklist de Validação

- [ ] Admin/Owner **NÃO** vê seções quando `level_role_settings` bloqueia
- [ ] Usuários sem `can_access_clinical` **NÃO** veem cards clínicos
- [ ] Usuários com `financial_access = 'none'` **NÃO** veem cards financeiros
- [ ] Cards de equipe respeitam `level_sharing_config`
- [ ] Cards de equipe respeitam `peer_sharing`
- [ ] Logs detalhados aparecem no console
- [ ] Dashboard carrega sem erros

## 📝 Observações Importantes

1. **Sem God Mode:**
   - ✅ Nenhum role tem bypass automático
   - ✅ Todos passam por `level_role_settings`
   - ✅ Configuração obrigatória para acesso

2. **Fallback Seguro:**
   - Se não houver `level_role_settings`: acesso **restrito** por padrão
   - Implementado em `resolveEffectivePermissions.ts`

3. **Escopo de Equipe:**
   - ✅ Respeita hierarquia organizacional
   - ✅ Respeita `level_sharing_config`
   - ✅ Respeita `peer_sharing`
   - ✅ Filtrado por domínio

## 🚀 Próximos Passos

1. **TODO:** Obter `levelId` do `useEffectivePermissions` no `useTeamData`
2. Testar com múltiplos níveis organizacionais
3. Validar todas as combinações de `level_sharing_config`
4. Testar `peer_sharing` bidirecional e unidirecional

## 📚 Arquivos Modificados

- `src/hooks/useDashboardPermissions.ts` (God Mode removido)
- `src/utils/dashboardSharingScope.ts` (NOVO - helper de escopo)
- `src/hooks/useTeamData.ts` (integração com sharing)
- `src/pages/DashboardExample.tsx` (log de inicialização)
- `docs/FASE_12.3_PERMISSOES_CENTRALIZADAS.md` (esta doc)
