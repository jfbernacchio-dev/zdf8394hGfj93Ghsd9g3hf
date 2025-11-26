# FASE C1.10.3-H1: Banco de Dados Patient Overview Layouts

**Data**: 2025-01-26  
**Status**: ✅ **TABELA JÁ EXISTENTE - VERIFICAÇÃO COMPLETA**

---

## 📋 RESUMO DA EXECUÇÃO

A tentativa de criação da tabela `patient_overview_layouts` falhou com o erro:
```
ERROR: 42P07: relation "patient_overview_layouts" already exists
```

**Conclusão**: A tabela já foi criada anteriormente no banco de dados. Isso indica que parte da infraestrutura já estava implementada.

---

## 🔍 VERIFICAÇÃO DA ESTRUTURA ATUAL

### Tabela Existente: `patient_overview_layouts`

#### Schema Atual:
```sql
CREATE TABLE patient_overview_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  patient_id UUID,
  organization_id UUID,
  layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Status**: ✅ **SCHEMA CORRETO**
- Todas as colunas necessárias estão presentes
- Tipos de dados corretos (UUID, JSONB, INTEGER, TIMESTAMP)
- Defaults apropriados

#### Constraints Verificadas:
- ✅ Primary Key em `id`
- ✅ `user_id` é NOT NULL
- ✅ `patient_id` é nullable (permite layout geral)
- ✅ `organization_id` é nullable
- ⚠️ **FALTA VERIFICAR**: UNIQUE constraint em `(user_id, patient_id)`

---

## 🛡️ RLS POLICIES VERIFICADAS

### Status: ✅ **RLS HABILITADO**

A tabela `patient_overview_layouts` tem RLS ativo.

### Policies Existentes:

Verificadas no schema:

1. ✅ **`patient_overview_layouts_admin_all`**
   - Tipo: ALL
   - Permite: Admins gerenciam tudo
   - Condição: `has_role(auth.uid(), 'admin'::app_role)`

2. ✅ **`patient_overview_layouts_own_select`**
   - Tipo: SELECT
   - Permite: Usuário lê seus próprios layouts
   - Condição: `user_id = auth.uid()`

3. ✅ **`patient_overview_layouts_own_insert`**
   - Tipo: INSERT
   - Permite: Usuário cria seus próprios layouts
   - Condição: `user_id = auth.uid()`

4. ✅ **`patient_overview_layouts_own_update`**
   - Tipo: UPDATE
   - Permite: Usuário atualiza seus próprios layouts
   - Condição: `user_id = auth.uid()`

5. ✅ **`patient_overview_layouts_own_delete`**
   - Tipo: DELETE
   - Permite: Usuário deleta seus próprios layouts
   - Condição: `user_id = auth.uid()`

6. ⚠️ **FALTA VERIFICAR**: Policy de organização (`patient_overview_layouts_org_select`)

**Status das Policies**: ✅ **CORRETAS E COMPLETAS** (exceto possível policy de org)

---

## 📊 ÍNDICES

### Status: ⚠️ **NÃO VERIFICADO DIRETAMENTE**

Os índices planejados eram:
```sql
CREATE INDEX idx_patient_overview_layouts_user ON patient_overview_layouts(user_id);
CREATE INDEX idx_patient_overview_layouts_patient ON patient_overview_layouts(patient_id);
CREATE INDEX idx_patient_overview_layouts_org ON patient_overview_layouts(organization_id);
```

**Recomendação**: Verificar no Supabase se os índices estão criados. Se não, podem ser adicionados sem problemas.

---

## ⚙️ TRIGGERS

### Status: ⚠️ **NÃO VERIFICADO DIRETAMENTE**

Os triggers planejados eram:

1. **`update_patient_overview_layouts_updated_at`**
   - Função: `update_updated_at_column()`
   - Propósito: Atualizar `updated_at` automaticamente

2. **`auto_set_organization_patient_overview_layouts`**
   - Função: `auto_set_organization_from_user_for_layouts()`
   - Propósito: Setar `organization_id` automaticamente

**Recomendação**: Verificar no Supabase se os triggers estão vinculados. A função `auto_set_organization_from_user_for_layouts()` já existe no sistema.

---

## 🎯 COMPARAÇÃO COM O PLANO ORIGINAL

| Item | Planejado | Atual | Status |
|------|-----------|-------|--------|
| Tabela criada | ✅ | ✅ | **OK** |
| Schema correto | ✅ | ✅ | **OK** |
| RLS habilitado | ✅ | ✅ | **OK** |
| Policies admin | ✅ | ✅ | **OK** |
| Policies own (CRUD) | ✅ | ✅ | **OK** |
| Policy org | ✅ | ⚠️ | **VERIFICAR** |
| UNIQUE constraint | ✅ | ⚠️ | **VERIFICAR** |
| Índices | ✅ | ⚠️ | **VERIFICAR** |
| Triggers | ✅ | ⚠️ | **VERIFICAR** |

---

## 📝 AJUSTES NECESSÁRIOS (SE HOUVER)

### Itens a Verificar/Adicionar:

1. **UNIQUE Constraint**:
   ```sql
   ALTER TABLE patient_overview_layouts 
   ADD CONSTRAINT patient_overview_layouts_user_patient_unique 
   UNIQUE (user_id, patient_id);
   ```

2. **Policy de Organização** (se não existir):
   ```sql
   CREATE POLICY "patient_overview_layouts_org_select"
     ON patient_overview_layouts
     FOR SELECT
     TO authenticated
     USING (
       organization_id IS NOT NULL 
       AND organization_id = current_user_organization()
     );
   ```

3. **Índices** (se não existirem):
   ```sql
   CREATE INDEX IF NOT EXISTS idx_patient_overview_layouts_user 
   ON patient_overview_layouts(user_id);
   
   CREATE INDEX IF NOT EXISTS idx_patient_overview_layouts_patient 
   ON patient_overview_layouts(patient_id);
   
   CREATE INDEX IF NOT EXISTS idx_patient_overview_layouts_org 
   ON patient_overview_layouts(organization_id);
   ```

4. **Triggers** (se não existirem):
   ```sql
   CREATE TRIGGER update_patient_overview_layouts_updated_at
     BEFORE UPDATE ON patient_overview_layouts
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();

   CREATE TRIGGER auto_set_organization_patient_overview_layouts
     BEFORE INSERT OR UPDATE ON patient_overview_layouts
     FOR EACH ROW
     EXECUTE FUNCTION auto_set_organization_from_user_for_layouts();
   ```

---

## 🚀 PRÓXIMOS PASSOS

### Decisão Necessária:

**Opção A**: Aceitar a estrutura atual como está e prosseguir para a FASE H2 (Hook + integração), assumindo que:
- A tabela está funcional
- As policies core estão corretas
- Eventuais índices/triggers faltantes não são bloqueantes

**Opção B**: Criar uma migration complementar para adicionar apenas os itens faltantes (UNIQUE constraint, policy org, índices, triggers)

**Recomendação**: **Opção B** - Criar uma migration complementar para garantir que **tudo** está alinhado com o plano, especialmente:
- UNIQUE constraint (crítico para evitar duplicatas)
- Índices (performance)
- Triggers (automação)

---

## 🎯 CONCLUSÃO DA FASE H1

**Status Geral**: ✅ **TABELA EXISTE E ESTÁ MAJORITARIAMENTE CORRETA**

A infraestrutura básica está em vigor:
- ✅ Tabela criada com schema correto
- ✅ RLS habilitado
- ✅ Policies principais configuradas

**Pendências para garantir 100% de alinhamento com o plano**:
- ⚠️ UNIQUE constraint (crítico)
- ⚠️ Policy de organização (importante)
- ⚠️ Índices (performance)
- ⚠️ Triggers (automação)

**Ação Recomendada**: Criar migration complementar para adicionar os itens pendentes antes de prosseguir para a FASE H2.

---

**Aguardando decisão do usuário sobre como proceder.**
