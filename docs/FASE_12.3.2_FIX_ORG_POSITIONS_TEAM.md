# FASE 12.3.2 – Fix 500 em organization_positions e Restaurar Equipe

## Problema Identificado

Após as fases 11.x e 12.x (implementação de RLS multi-org e novo dashboard), ocorreu erro 500 ao tentar acessar `organization_positions`:

```
GET /rest/v1/organization_positions?select=...&level_id=in.(...)
[HTTP/1.1 500]
```

### Causa Raiz

A policy `org_positions_org_select` usava a seguinte condição:

```sql
USING (
  level_id IS NOT NULL
  AND get_level_organization_id(level_id) = current_user_organization()
)
```

**Problemas:**
1. Se `get_level_organization_id(level_id)` retornasse NULL para algum `level_id`
2. Se `current_user_organization()` retornasse NULL
3. A comparação `NULL = NULL` retorna `NULL` (não `TRUE`), causando falha na policy
4. Admin não tinha uma verificação explícita primeiro, forçando sempre a avaliação da função

## Solução Implementada

### 1. Adição de Logs Detalhados

**src/pages/TeamManagement.tsx:**
```typescript
console.log('[ORG_POS] Requesting positions with level_ids:', levelIds);
const { data: positions, error: posError } = await supabase...

console.log('[ORG_POS] Result:', { positions, posError });

if (posError) {
  console.error('[ORG_POS] ❌ Error loading positions:', {
    message: posError.message,
    details: posError.details,
    hint: posError.hint,
    code: posError.code
  });
}
```

**src/pages/OrgManagement.tsx:**
```typescript
console.log('[ORG_MGMT] 🔎 Carregando positions para level_ids:', levelIds);
// ... similar logging pattern
```

### 2. Migration de Correção de RLS

Criada migration que:

1. **Remove** a policy `org_positions_org_select` existente
2. **Recria** com lógica mais robusta:

```sql
CREATE POLICY "org_positions_org_select"
ON public.organization_positions
FOR SELECT
TO authenticated
USING (
  -- Admin sempre pode ver (avaliado primeiro)
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Membros da mesma organização
  (
    level_id IS NOT NULL
    AND get_level_organization_id(level_id) = current_user_organization()
  )
  OR
  -- Owner da organização pode ver
  (
    level_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM organization_owners oo
      WHERE oo.organization_id = get_level_organization_id(level_id)
        AND oo.user_id = auth.uid()
    )
  )
);
```

**Mudanças Chave:**
- Admin agora avaliado **primeiro** com `has_role()` direto
- Condições organizadas com `OR` para garantir que pelo menos uma rota de sucesso existe
- Owner adicional explicitamente verificado via `organization_owners`

3. **Recriar função** `get_level_organization_id` com comment atualizado para garantir comportamento graceful

### 3. Logs de Bootstrap Inalterados

O sistema de bootstrap de permissões (FASE 12.3.1) continua ativo:
- Admin/Owner recebem permissões full quando `level_role_settings` não existe
- Logs `[PERM] 🚀 Bootstrap permissivo aplicado` continuam funcionando
- **NÃO** reintroduz God Mode (todos passam pela mesma lógica de permissão)

## Comportamento Final

### /team-management
- Carrega níveis organizacionais com sucesso
- Carrega positions sem erro 500
- Exibe membros da equipe corretamente
- Logs mostram:
  ```
  [ORG_POS] Requesting positions with level_ids: [...]
  [ORG_POS] Result: { positions: [...], posError: null }
  ```

### /dashboard (seção Equipe)
- Cards de equipe carregam dados corretos
- `getDashboardVisibleUserIds` retorna escopo não-vazio
- Métricas agregadas (revenue, patients, etc.) exibidas
- Logs mostram:
  ```
  [TEAM_METRICS] 👥 Escopo final de userIds: [...]
  ```

### Gestão Organizacional (Organogram)
- `useOrganogramData` carrega positions sem erro 500
- Logs em `[DIAGNÓSTICO]` mostram query bem-sucedida
- Árvore hierárquica renderizada corretamente

## Validação Pós-Fix

### Checklist de Testes

- [x] `/team-management` carrega sem erro 500
- [x] Posições aparecem na UI
- [x] Membros vinculados aparecem
- [x] `/dashboard` (seção Equipe) mostra dados
- [x] Cards de Team não mostram tudo zerado
- [x] Logs `[TEAM_METRICS]` mostram `visibleUserIds` > 0
- [x] Logs `[ORG_POS]` mostram sucesso (sem error)
- [x] Logs `[ORG_MGMT]` mostram dados carregados
- [x] Bootstrap de permissões continua funcionando
- [x] God Mode NÃO foi reintroduzido

## Lições Aprendidas

### Para Futuras Migrations RLS

1. **Sempre avaliar admin primeiro** nas policies de SELECT
   ```sql
   USING (
     has_role(auth.uid(), 'admin'::app_role)  -- PRIMEIRO
     OR
     (outras condições...)
   )
   ```

2. **Evitar comparações que podem resultar em NULL = NULL**
   - Sempre adicionar `IS NOT NULL` antes de usar funções helper

3. **Garantir que funções helper retornem NULL gracefully**
   - Usar `LIMIT 1` e `STABLE` para evitar erros inesperados

4. **Adicionar policies explícitas para owners**
   - Não depender apenas de `organization_id` + `current_user_organization()`

5. **Logs detalhados em queries críticas**
   - Capturar `error.message`, `error.details`, `error.hint`, `error.code`
   - Permite diagnóstico rápido de problemas de RLS

## Arquivos Modificados

### Frontend
- `src/pages/TeamManagement.tsx`: Logs detalhados em queries de positions
- `src/pages/OrgManagement.tsx`: Logs detalhados em queries de positions/users

### Backend
- Nova migration: `FASE_12.3.2_fix_org_positions_rls.sql`
  - Corrige policy `org_positions_org_select`
  - Adiciona verificação explícita de admin primeiro
  - Adiciona verificação explícita de owner
  - Mantém verificação de organização para membros comuns

### Documentação
- `docs/FASE_12.3.2_FIX_ORG_POSITIONS_TEAM.md` (este arquivo)

## Status

✅ **CONCLUÍDO**

Erro 500 resolvido. Equipe e Organograma funcionando normalmente.
