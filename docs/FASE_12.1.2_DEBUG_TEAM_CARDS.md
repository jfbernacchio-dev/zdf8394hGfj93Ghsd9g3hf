# FASE 12.1.2 – Debug dos Cards de Equipe

## 🐛 Problema Identificado

Os cards da seção **Team (Equipe)** não mostravam dados porque:

1. **Profiles subordinados não tinham `organization_id` populado**
   - Quando um admin/owner criava subordinados, o campo `created_by` era preenchido
   - Mas o campo `organization_id` ficava `NULL`

2. **Filtro de organização excluía subordinados**
   - A função `getUserIdsInOrganization()` filtra por `organization_id`
   - Subordinados com `organization_id: NULL` eram excluídos
   - Resultado: `useTeamData` retornava arrays vazios

3. **Cards de equipe mostravam zeros**
   - Sem subordinados na lista
   - Sem pacientes da equipe
   - Sem sessões da equipe

---

## ✅ Solução Implementada

### 1. **Migration: Backfill + Trigger**

Criada migration `FASE_12.1.2_FIX_TEAM_DATA.sql`:

```sql
-- Backfill: Popular organization_id dos subordinados com base no criador
UPDATE profiles
SET organization_id = creator.organization_id
FROM profiles AS creator
WHERE profiles.created_by = creator.id
  AND profiles.organization_id IS NULL
  AND creator.organization_id IS NOT NULL;

-- Trigger: Auto-popular organization_id em novos profiles
CREATE OR REPLACE FUNCTION public.set_profile_organization_from_creator()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.created_by IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM profiles
    WHERE id = NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_set_profile_organization_from_creator
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_organization_from_creator();
```

### 2. **Logs de Debug em `useTeamData`**

Adicionados logs detalhados para debug:

```typescript
console.log('[TEAM_METRICS] Starting load', { userId, organizationId });
console.log('[TEAM_METRICS] Organization user IDs', { count, ids });
console.log('[TEAM_METRICS] Subordinates query', { count, subordinates, error });
console.log('[TEAM_METRICS] Filtered subordinate IDs', { total, filtered, ids });
console.log('[TEAM_METRICS] Team patients query', { count, error });
console.log('[TEAM_METRICS] Team sessions query', { count, error });
console.log('[TEAM_METRICS] Final result', { subordinates, patients, sessions });
```

---

## 🔍 Como os Logs Ajudam

### **Cenário 1: Sem subordinados**
```
[TEAM_METRICS] Starting load { userId: "xxx", organizationId: "yyy" }
[TEAM_METRICS] Organization user IDs { count: 2, ids: ["xxx", "zzz"] }
[TEAM_METRICS] Subordinates query { count: 2, subordinates: [...], error: null }
[TEAM_METRICS] Filtered subordinate IDs { total: 2, filtered: 0, ids: [] }
[TEAM_METRICS] No subordinates found - zero team data
```
→ **Problema**: Subordinados têm `organization_id: NULL`, filtro remove todos

### **Cenário 2: Com subordinados (após fix)**
```
[TEAM_METRICS] Starting load { userId: "xxx", organizationId: "yyy" }
[TEAM_METRICS] Organization user IDs { count: 3, ids: ["xxx", "sub1", "sub2"] }
[TEAM_METRICS] Subordinates query { count: 2, subordinates: [...], error: null }
[TEAM_METRICS] Filtered subordinate IDs { total: 2, filtered: 2, ids: ["sub1", "sub2"] }
[TEAM_METRICS] Team patients query { count: 15, error: null }
[TEAM_METRICS] Team sessions query { count: 87, error: null }
[TEAM_METRICS] Final result { subordinates: 2, patients: 15, sessions: 87 }
```
→ **Sucesso**: Cards mostram dados da equipe

---

## 🎯 Impacto da Correção

### **Antes:**
- ❌ Cards de equipe vazios (zeros em tudo)
- ❌ `getUserIdsInOrganization` não incluía subordinados
- ❌ Impossível ver métricas de equipe

### **Depois:**
- ✅ Backfill populou `organization_id` dos subordinados existentes
- ✅ Trigger garante que novos profiles herdem `organization_id` automaticamente
- ✅ Cards de equipe mostram:
  - Terapeutas Ativos - Equipe
  - Receita Esperada - Equipe
  - Receita Realizada - Equipe
  - Pacientes Ativos - Equipe
  - Sessões Realizadas - Equipe
  - Taxa de Pagamento - Equipe
  - Valores Pendentes - Equipe

---

## 📋 Checklist de Verificação

Para confirmar que os cards de equipe funcionam:

1. **Abra o console do navegador em `/dashboard-example`**
2. **Procure por logs `[TEAM_METRICS]`**
3. **Verifique:**
   - `Subordinates query` retorna `count > 0`?
   - `Filtered subordinate IDs` tem `filtered > 0`?
   - `Team patients query` e `Team sessions query` retornam dados?
   - `Final result` mostra contadores corretos?

4. **Na UI, confirme:**
   - Seção "Equipe" está visível
   - Cards mostram números (não zeros)
   - Pode adicionar/remover cards de equipe normalmente

---

## 🔧 Arquivos Modificados

- **`src/hooks/useTeamData.ts`**
  - Adicionados logs detalhados em todas as queries
  - Melhor rastreamento de erros e contadores

- **Migration:**
  - `supabase/migrations/[timestamp]_fase_12_1_2_fix_team_data.sql`
  - Backfill de `organization_id`
  - Trigger automático para novos profiles

---

## 🚀 Próximos Passos

1. ✅ Backfill executado
2. ✅ Trigger criado
3. ✅ Logs implementados
4. ⏳ **Aguardando testes**: Verificar logs e cards de equipe no `/dashboard-example`

---

## 📝 Notas Técnicas

### **Por que `created_by` não é suficiente?**
- `created_by` identifica quem criou o profile (hierarquia)
- Mas `organization_id` é necessário para isolamento multi-org
- Sem `organization_id`, o profile não aparece em `getUserIdsInOrganization`

### **Por que usar trigger em vez de default?**
- Default SQL não pode acessar outra row da mesma tabela
- Trigger BEFORE INSERT pode ler o `organization_id` do criador
- Trigger roda antes do INSERT, garantindo consistência

### **Segurança:**
- Trigger usa `SECURITY DEFINER` para ler `profiles`
- Trigger é `SET search_path = public` para evitar namespace hijacking
- RLS multi-org continua funcionando normalmente
