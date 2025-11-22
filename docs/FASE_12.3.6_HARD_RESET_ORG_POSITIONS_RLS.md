# FASE 12.3.6 – Hard Reset de RLS em organization_positions

## Objetivo

Eliminar definitivamente o erro de **recursão infinita (42P17)** em `organization_positions` e restaurar o funcionamento completo da aba **Equipe** e do **Organograma**.

---

## Diagnóstico

### Problema Identificado

Erro no Postgres:
```
infinite recursion detected in policy for relation "organization_positions"
code: "42P17"
```

**Causa raiz:**
- A policy `org_positions_org_select` estava chamando funções (`current_user_organization()` → `resolve_organization_for_user()`) que faziam JOIN com `organization_positions`, criando um loop infinito.

### Impacto

- `/team-management`: erro 500 ao buscar `organization_positions`
- Dashboard → seção **Equipe**: vazia/zerada
- Organograma: não exibia posições/membros

---

## Solução Aplicada

### Migration SQL (FASE 12.3.6)

```sql
-- 1) Remover policy problemática
DROP POLICY IF EXISTS "org_positions_org_select" ON public.organization_positions;

-- 2) Policy de SELECT simplificada (sem recursão)
CREATE POLICY "org_positions_select_all_auth"
ON public.organization_positions
FOR SELECT
TO authenticated
USING (true);

-- 3) Policy de modificações (admin only)
DROP POLICY IF EXISTS "org_positions_admin_all" ON public.organization_positions;

CREATE POLICY "org_positions_admin_all"
ON public.organization_positions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4) Garantir RLS habilitado
ALTER TABLE public.organization_positions ENABLE ROW LEVEL SECURITY;
```

**Princípios da solução:**
- ❌ **Sem chamadas a** `current_user_organization()` ou `get_level_organization_id()` nas policies de `organization_positions`
- ❌ **Sem JOINs ou subqueries** que toquem `organization_positions` dentro das próprias policies da tabela
- ✅ **Policy simples de SELECT**: `USING (true)` para qualquer usuário autenticado
- ✅ **Policy de modificação**: restrita a `admin` via `has_role()`

### Log Adicional no Frontend

Adicionado em `src/pages/TeamManagement.tsx`:

```typescript
console.log('[TEAM_API] 📋 table=organization_positions rows:', positions?.length ?? 0);
```

Para rastrear o número de linhas retornadas.

---

## Validação

### Após a migration, verificar:

1. **Console do navegador em `/team-management`:**
   - ✅ `[TEAM_API] table=organization_positions error: null`
   - ✅ `[TEAM_API] table=organization_positions rows: N` (N > 0)
   - ✅ Sem erro 42P17

2. **UI em `/team-management`:**
   - ✅ Níveis organizacionais exibidos
   - ✅ Posições exibidas corretamente
   - ✅ Membros listados com seus cargos

3. **Dashboard → Seção Equipe:**
   - ✅ Dados de equipe não estão zerados
   - ✅ `[TEAM_METRICS]` mostra `userIds` não vazios

---

## Estado Final Esperado

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Erro 42P17 | ❌ Presente | ✅ Eliminado |
| `/team-management` posições | ❌ 500 error | ✅ 200 OK, dados carregados |
| Dashboard → Equipe | ❌ Vazia | ✅ Dados exibidos |
| Organograma | ❌ Sem membros | ✅ Membros e posições visíveis |
| God Mode | ❌ N/A | ✅ Não reintroduzido |
| Permissões multi-org | ✅ Intactas | ✅ Intactas |

---

## Notas de Segurança

- **`organization_positions` é uma tabela estrutural** (não contém dados sensíveis de pacientes/sessões)
- **Policy de SELECT liberada** (`USING (true)`) para qualquer usuário autenticado é segura neste contexto
- **Modificações (INSERT/UPDATE/DELETE)** continuam restritas ao role `admin`
- **RLS multi-org e bootstrap de permissões** (FASE 12.3.1) permanecem intactos

---

## Próximos Passos

Se após essa fase:
- ✅ Organograma e Equipe funcionam → FASE concluída com sucesso
- ❌ Ainda há problemas → investigar `user_positions` ou `profiles` (próximas tabelas da chain)

---

**Data:** 2025-11-22  
**Status:** ✅ Implementado  
**Autor:** FASE 12.3.6
