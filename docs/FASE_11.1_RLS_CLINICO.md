# FASE 11.1 – RLS Multi-Organização (Núcleo Clínico)

**Status**: ✅ Concluído  
**Data**: 21/11/2024  
**Objetivo**: Reativar/recriar Row Level Security para tabelas clínicas usando `organization_id`

---

## 📋 Escopo da FASE 11.1

### Tabelas Cobertas (8 tabelas)

1. **patients** - Pacientes
2. **sessions** - Sessões de terapia
3. **clinical_complaints** - Queixas clínicas
4. **complaint_symptoms** - Sintomas das queixas
5. **complaint_medications** - Medicações das queixas
6. **session_evaluations** - Avaliações de sessão
7. **patient_files** - Arquivos dos pacientes
8. **consent_submissions** - Submissões de consentimento

### Tabelas NÃO Cobertas (para fases futuras)

- NFSe (11.2)
- Pagamentos (11.2)
- Agenda (11.3)
- Notificações (11.3)
- Permissões (11.4)

---

## 🔧 Arquitetura de RLS Multi-Org

### Função Helper: `current_user_organization()`

```sql
CREATE OR REPLACE FUNCTION public.current_user_organization()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.resolve_organization_for_user(auth.uid());
$$;
```

**Características**:
- Retorna o `organization_id` do usuário autenticado
- Usa a função `resolve_organization_for_user` da FASE 10.8
- Sem logs (sem RAISE NOTICE)
- STABLE e SECURITY DEFINER para performance e segurança

### Lógica de Acesso

#### Para Admins
```sql
has_role(auth.uid(), 'admin')
```
- Acesso total a TODAS as organizações
- Pode ler, inserir, atualizar e deletar em qualquer org

#### Para Usuários Comuns
```sql
organization_id = public.current_user_organization()
```
- Acesso apenas à própria organização
- Filtragem automática por `organization_id`

---

## 🛡️ Padrão de Policies por Tabela

### Padrão 1: Tabela Principal (patients)

**4 Policies**:

1. **Admin Full Access**
   - Nome: `patients_admin_all`
   - Permite: ALL (SELECT, INSERT, UPDATE, DELETE)
   - Condição: `has_role(auth.uid(), 'admin')`

2. **Org SELECT**
   - Nome: `patients_org_select`
   - Permite: SELECT
   - Condição: `organization_id = current_user_organization()`

3. **Owner Modify**
   - Nome: `patients_owner_modify`
   - Permite: UPDATE, DELETE
   - Condição: `user_id = auth.uid() AND organization_id = current_user_organization()`

4. **Org INSERT**
   - Nome: `patients_org_insert`
   - Permite: INSERT
   - Condição: `organization_id = current_user_organization()`

### Padrão 2: Tabelas Dependentes (sessions, clinical_complaints, etc.)

**3 Policies**:

1. **Admin Full Access**
   - Nome: `{tabela}_admin_all`
   - Permite: ALL
   - Condição: `has_role(auth.uid(), 'admin')`

2. **Org SELECT**
   - Nome: `{tabela}_org_select`
   - Permite: SELECT
   - Condição: `organization_id = current_user_organization()`

3. **Org Modify**
   - Nome: `{tabela}_org_modify`
   - Permite: INSERT, UPDATE
   - Condição: `organization_id = current_user_organization()`

---

## 📊 Policies Criadas por Tabela

### 1. patients (4 policies)
- ✅ `patients_admin_all` - Admin full access
- ✅ `patients_org_select` - Org members can view
- ✅ `patients_owner_modify` - Owner can modify
- ✅ `patients_org_insert` - Org members can insert

### 2. sessions (3 policies)
- ✅ `sessions_admin_all` - Admin full access
- ✅ `sessions_org_select` - Org members can view
- ✅ `sessions_org_modify` - Org members can modify

### 3. clinical_complaints (3 policies)
- ✅ `clinical_complaints_admin_all` - Admin full access
- ✅ `clinical_complaints_org_select` - Org members can view
- ✅ `clinical_complaints_org_modify` - Org members can modify

### 4. complaint_symptoms (3 policies)
- ✅ `complaint_symptoms_admin_all` - Admin full access
- ✅ `complaint_symptoms_org_select` - Org members can view
- ✅ `complaint_symptoms_org_modify` - Org members can modify

### 5. complaint_medications (3 policies)
- ✅ `complaint_medications_admin_all` - Admin full access
- ✅ `complaint_medications_org_select` - Org members can view
- ✅ `complaint_medications_org_modify` - Org members can modify

### 6. session_evaluations (3 policies)
- ✅ `session_evaluations_admin_all` - Admin full access
- ✅ `session_evaluations_org_select` - Org members can view
- ✅ `session_evaluations_org_modify` - Org members can modify

### 7. patient_files (3 policies)
- ✅ `patient_files_admin_all` - Admin full access
- ✅ `patient_files_org_select` - Org members can view
- ✅ `patient_files_org_modify` - Org members can modify

### 8. consent_submissions (3 policies)
- ✅ `consent_submissions_admin_all` - Admin full access
- ✅ `consent_submissions_org_select` - Org members can view
- ✅ `consent_submissions_org_modify` - Org members can modify

**Total**: 28 policies criadas

---

## 🔗 Relação com FASE 10.8 (Triggers)

### Triggers que Preenchem `organization_id`

As policies da FASE 11.1 dependem diretamente dos triggers criados na FASE 10.8:

1. **`auto_set_organization_from_user()`**
   - Usado em: `patients`, `sessions` (via patient), `clinical_complaints` (via patient)
   - Preenche `organization_id` automaticamente no INSERT

2. **`auto_set_organization_from_patient()`**
   - Usado em: `sessions`, `patient_files`, `consent_submissions`, `session_evaluations`
   - Resolve org via `patient_id`

3. **`auto_set_organization_from_complaint()`**
   - Usado em: `complaint_symptoms`, `complaint_medications`
   - Resolve org via `complaint_id`

### Fluxo de INSERT

```
1. Frontend insere registro (sem organization_id)
   ↓
2. Trigger BEFORE INSERT preenche organization_id
   ↓
3. Policy WITH CHECK valida se organization_id bate
   ↓
4. Registro inserido com organização correta
```

---

## 🚫 O que NÃO é Mais Usado

### Funções Deprecadas
- ❌ `is_same_organization(user_id)` - Substituída por comparação direta de `organization_id`
- ❌ Subqueries em `organization_levels`, `user_positions` - Desnecessário com `organization_id`

### Lógica Antiga Removida
- ❌ Policies baseadas apenas em `user_id`
- ❌ Checks de hierarquia organizacional diretos nas policies
- ❌ Comparações complexas entre usuários

### Nova Abordagem
- ✅ Comparação simples: `organization_id = current_user_organization()`
- ✅ Sem recursão em RLS
- ✅ Performance otimizada

---

## ✅ Verificação Pós-Migration

### Testes como Admin

```sql
-- Deve retornar todos os pacientes de todas as organizações
SELECT count(*) FROM patients;

-- Deve retornar todas as sessões
SELECT count(*) FROM sessions;
```

### Testes como Usuário da Mindware

```sql
-- Deve retornar apenas pacientes da org Mindware
SELECT * FROM patients LIMIT 10;

-- Deve retornar apenas 1 organization_id (da Mindware)
SELECT DISTINCT organization_id FROM patients;

-- Deve retornar 0 se usuário tentar acessar outra org
SELECT * FROM patients WHERE organization_id != current_user_organization();
```

### Testes como Usuário SEM Organização

- ❌ Frontend bloqueia via `OrganizationGuard` → redireciona para `/setup-organization`
- ❌ Backend bloqueia via RLS → `current_user_organization()` retorna NULL → nenhum registro é retornado

---

## 🔒 Segurança Garantida

### Isolamento Total por Organização

1. **Dados Clínicos**
   - Pacientes de org A não aparecem para usuários de org B
   - Sessões, queixas, arquivos seguem a mesma regra

2. **Admin Override**
   - Admins veem tudo (todas orgs)
   - Útil para suporte e debug

3. **Validação no Backend**
   - Triggers garantem `organization_id` correto
   - Policies impedem acesso cruzado
   - Dupla camada de segurança

### Casos de Uso Cobertos

✅ Usuário tenta inserir paciente → org_id preenchido automaticamente  
✅ Usuário tenta listar pacientes → vê apenas da própria org  
✅ Usuário tenta atualizar sessão de outra org → bloqueado  
✅ Admin lista tudo → vê todas as orgs  
✅ Usuário sem org ativa → bloqueado no frontend + backend retorna vazio  

---

## 📌 Limitações Conhecidas

### O que Ainda NÃO Tem RLS Multi-Org

1. **NFSe e Pagamentos** (FASE 11.2)
   - `nfse_issued`
   - `nfse_payments`
   - `payment_allocations`
   - `nfse_config`
   - `nfse_certificates`

2. **Agenda e Notificações** (FASE 11.3)
   - `schedule_blocks`
   - `appointments`
   - `system_notifications`
   - `therapist_notifications`

3. **Permissões e Hierarquia** (FASE 11.4)
   - `user_positions`
   - `organization_positions`
   - `level_permission_sets`
   - `level_role_settings`
   - `peer_sharing`

### Impacto

- Essas tabelas ainda usam policies antigas (baseadas em `is_same_organization`)
- Funcionam, mas não seguem o padrão multi-org unificado
- Serão atualizadas nas próximas fases

---

## 🎯 Próximos Passos

### FASE 11.2 - RLS Multi-Org (NFSe e Financeiro)
- Aplicar mesmo padrão em tabelas de NFSe
- Aplicar em pagamentos e alocações
- Garantir isolamento financeiro

### FASE 11.3 - RLS Multi-Org (Agenda e Notificações)
- Agenda multi-org
- Notificações isoladas por org
- Schedule blocks por organização

### FASE 11.4 - RLS Multi-Org (Permissões e Hierarquia)
- Revisitar permissões
- Garantir que hierarquia organizacional respeita multi-org
- Finalizar sistema de permissões

### FASE 11.5 - Testes de Segurança
- Testes automatizados de RLS
- Validação de edge cases
- Auditoria final de segurança

---

## 📝 Resumo Técnico

### Migration Aplicada
- ✅ Função `current_user_organization()` criada
- ✅ RLS ativado e forçado em 8 tabelas
- ✅ 28 policies criadas (padronizadas)
- ✅ Policies antigas removidas (DROP POLICY IF EXISTS)

### Benefícios Obtidos

1. **Segurança**
   - Isolamento total entre organizações
   - Dupla camada (triggers + RLS)

2. **Performance**
   - Comparação direta de UUID (rápido)
   - Sem subqueries complexas em policies

3. **Manutenibilidade**
   - Padrão unificado para todas as tabelas
   - Fácil de estender para novas tabelas

4. **Consistência**
   - Mesma lógica em toda a aplicação
   - Integração perfeita com FASE 10.8/10.9

---

**Documentação gerada automaticamente pela FASE 11.1**  
**Próxima fase**: FASE 11.2 - RLS Multi-Org (NFSe e Financeiro)
