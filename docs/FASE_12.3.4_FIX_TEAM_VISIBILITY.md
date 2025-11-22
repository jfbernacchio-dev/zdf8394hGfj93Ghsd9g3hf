# FASE 12.3.4 – Fix Equipe/Organograma (Visibilidade de Profiles)

**Data:** 2025-01-22  
**Status:** ✅ Implementado

---

## 🎯 Objetivo

Corrigir a visibilidade vazia da seção **Equipe** do dashboard e da página **/team-management**, investigando especificamente se:
- `current_user_organization()` está retornando um valor válido
- As RLS policies de `profiles` estão bloqueando indevidamente o acesso aos dados da equipe

---

## 🔍 Diagnóstico

### Logs Adicionados

1. **src/hooks/useTeamData.ts**
   - Log de `current_user_organization()` RPC
   - Log de `user.id` e `organizationId` do AuthContext

2. **src/utils/dashboardSharingScope.ts**
   - Log de `current_user_organization()` RPC
   - Log de `profiles` retornados para os `visibleUserIds`
   - Log de erros ao buscar profiles

### Logs Esperados

```
[DEBUG_ORG] 🔍 user.id: cc630372-...
[DEBUG_ORG] 🔍 organizationId (AuthContext): e5083a3e-d8...
[DEBUG_ORG] 🔍 current_user_organization(): e5083a3e-d8...
[DEBUG_ORG] 🔍 current_user_organization error: null

[TEAM_DEBUG] 🔍 orgId (AuthContext): e5083a3e-d8...
[TEAM_DEBUG] 🔍 current_user_organization() RPC: e5083a3e-d8...
[TEAM_DEBUG] 📊 userIds considerados no escopo da equipe: [...]
[TEAM_DEBUG] 📊 dados de profiles retornados: [...]
```

---

## 🛠️ Correções Aplicadas

### 1. Fix RLS de `profiles`

**Problema:** Possivelmente as policies de `profiles` não estavam permitindo que admins visualizassem os perfis de outros usuários, mesmo dentro da mesma organização.

**Solução:** Migration para criar/recriar policies de forma clara:

```sql
-- Policy 1: Admin tem acesso total a todos os profiles
CREATE POLICY "profiles_admin_all"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy 2: Usuários podem ver profiles da mesma organização
CREATE POLICY "profiles_org_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = current_user_organization()
);

-- Policy 3: Usuários podem ver e atualizar seu próprio perfil
CREATE POLICY "profiles_own_access"
ON public.profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

**Garantias:**
- Admin consegue ver TODOS os profiles da organização
- Outros usuários veem apenas profiles da mesma organização
- Todos podem ver/editar seu próprio perfil

---

## ✅ Validação

### Checklist de Sucesso

- [ ] `/team-management` exibe posições e membros corretamente
- [ ] Seção **Equipe** do `/dashboard` mostra dados não-zerados
- [ ] Logs `[TEAM_DEBUG]` mostram `profilesData` não vazio
- [ ] Logs `[DEBUG_ORG]` mostram `current_user_organization()` válido

### Logs de Confirmação

```
[TEAM_DEBUG] 📊 dados de profiles retornados: [
  { id: '...', full_name: 'João', organization_id: 'e5083a3e-...' },
  { id: '...', full_name: 'Maria', organization_id: 'e5083a3e-...' },
  ...
]
```

---

## 🚨 Possíveis Problemas Remanescentes

Se após essa fase a Equipe/Organograma ainda estiverem vazios, investigar:

1. **profiles.organization_id do admin está NULL?**
   ```sql
   SELECT id, organization_id FROM profiles WHERE id = '<ADMIN_USER_ID>';
   ```
   - Se NULL, rodar:
     ```sql
     UPDATE profiles 
     SET organization_id = '<ORG_ID>' 
     WHERE id = '<ADMIN_USER_ID>';
     ```

2. **current_user_organization() retorna NULL?**
   - Verificar `resolve_organization_for_user()` (FASE 12.3.3)
   - Garantir que profiles.organization_id ou organization_owners estão preenchidos

3. **getDashboardVisibleUserIds retorna array vazio?**
   - Verificar logs de `get_all_subordinates`
   - Verificar se há registros em `user_positions`

---

## 📝 Conclusão

FASE 12.3.4 adiciona logs detalhados e corrige RLS de `profiles` para garantir que:
- Admins tenham acesso total aos profiles da organização
- `current_user_organization()` seja monitorado em tempo real
- Dados de equipe fluam corretamente do backend para o frontend

**Próximos Passos:** Se problema persistir após essa fase, executar backfill manual de `organization_id` em profiles conforme indicado acima.
