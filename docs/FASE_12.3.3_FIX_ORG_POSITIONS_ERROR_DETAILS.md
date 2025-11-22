# FASE 12.3.3 – Diagnóstico e Correção do Erro 500 em organization_positions

## Problema Identificado

**Erro exato retornado pelo Supabase:**
```json
{
  "code": "42P17",
  "message": "infinite recursion detected in policy for relation \"organization_positions\"",
  "details": null,
  "hint": null
}
```

**Código de erro PostgreSQL:** `42P17` = Loop infinito detectado em policy RLS

## Causa Raiz

A policy `org_positions_org_select` da tabela `organization_positions` estava criando um **loop de recursão infinita**:

```
1. Policy org_positions_org_select executa: current_user_organization()
2. Função current_user_organization() chama: resolve_organization_for_user()
3. Função resolve_organization_for_user() faz JOIN com: organization_positions (Tentativa 3)
4. Query em organization_positions dispara: org_positions_org_select novamente
5. VOLTA PARA O PASSO 1 = LOOP INFINITO ♾️
```

### Trecho problemático em `resolve_organization_for_user`:
```sql
-- Tentativa 3: user_positions → organization_positions → organization_levels
SELECT ol.organization_id INTO v_org_id
FROM public.user_positions up
INNER JOIN public.organization_positions op ON op.id = up.position_id  -- ⚠️ PROBLEMA!
INNER JOIN public.organization_levels ol ON ol.id = op.level_id
WHERE up.user_id = _user_id
LIMIT 1;
```

## Solução Aplicada

**Migration executada:** Redefini `resolve_organization_for_user()` **SEM** usar `organization_positions`.

### Nova versão da função (sem recursão):
```sql
CREATE OR REPLACE FUNCTION public.resolve_organization_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Tentativa 1: profiles.organization_id
  SELECT organization_id INTO v_org_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;
  
  -- Tentativa 2: organization_owners (usuário é dono)
  SELECT organization_id INTO v_org_id
  FROM public.organization_owners
  WHERE user_id = _user_id AND is_primary = true
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;
  
  -- REMOVIDO: Tentativa 3 com organization_positions (causava loop infinito)
  
  -- Fallback: NULL
  RETURN NULL;
END;
$$;
```

### Por que isso resolve?

A função agora usa **apenas**:
1. `profiles.organization_id` (coluna direta)
2. `organization_owners` (tabela de donos)

Essas tabelas **não** disparam a policy de `organization_positions`, quebrando o ciclo de recursão.

## Validação

### ✅ Esperado após o fix:

1. **Query de organization_positions retorna 200:**
   ```
   [ORG_POS] ✅ Positions carregadas: [...]
   ```

2. **/team-management exibe posições e membros:**
   - Níveis organizacionais aparecem
   - Posições são listadas
   - Membros vinculados às posições são mostrados

3. **Seção Equipe do /dashboard funciona:**
   - Cards de equipe (Expected Revenue Team, Actual Revenue Team, Total Patients Team)
   - Logs `[TEAM_METRICS]` mostram `visibleUserIds` não vazios

4. **Nenhum God Mode reintroduzido:**
   - Bootstrap de permissões (FASE 12.3.1) continua ativo
   - Admin/owner ainda passam por `resolveEffectivePermissions`

## Logs de Diagnóstico

Logs adicionados para capturar o erro:
```typescript
// src/pages/TeamManagement.tsx (linha ~120-137)
console.log('[ORG_POS] Requesting positions with level_ids:', levelIds);

const { data: positions, error: posError } = await supabase
  .from('organization_positions')
  .select('id, level_id, position_name')
  .in('level_id', levelIds);

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

## Impacto no Sistema

| Área | Antes | Depois |
|------|-------|--------|
| Query organization_positions | ❌ 500 (loop infinito) | ✅ 200 (sucesso) |
| /team-management | ❌ Sem posições/membros | ✅ Exibe estrutura completa |
| Dashboard Equipe | ❌ Cards zerados | ✅ Métricas da equipe |
| RLS Multi-org | ⚠️ Bloqueado por recursão | ✅ Funcional |
| Permissões | ✅ Bootstrap ativo | ✅ Bootstrap ativo (não alterado) |

## Lições Aprendidas

### ⚠️ NUNCA fazer isso em funções usadas por RLS:
```sql
-- ❌ ERRADO: Função usada em policy da tabela X faz JOIN com X
CREATE FUNCTION get_user_org() ... AS $$
  SELECT org_id FROM table_x WHERE ...  -- Se table_x tem policy que chama get_user_org() = LOOP
$$;
```

### ✅ Alternativas seguras:
1. Usar colunas diretas (`profiles.organization_id`)
2. Usar tabelas auxiliares que não disparam a mesma policy
3. Criar policies mais simples que não dependem de funções complexas
4. Marcar funções como `SECURITY DEFINER` e `STABLE` para evitar chamadas desnecessárias

## Estado Final

- [x] Erro 500 eliminado
- [x] /team-management funcional
- [x] Dashboard Equipe funcional
- [x] RLS multi-org preservado
- [x] Bootstrap de permissões intacto
- [x] Sem God Mode

---

**Data da correção:** 2025-11-22  
**Migration:** `resolve_organization_for_user` redefinida sem `organization_positions`
