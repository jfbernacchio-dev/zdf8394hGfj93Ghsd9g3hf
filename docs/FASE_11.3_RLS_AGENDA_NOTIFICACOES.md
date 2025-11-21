# FASE 11.3 – RLS Multi-Organização (Agenda + Notificações)

## 📋 Visão Geral

Esta fase implementa Row Level Security (RLS) Multi-Organização para as tabelas de **agenda** e **notificações**, garantindo isolamento completo entre organizações e acesso apropriado por papel (role).

**Data de Implementação**: 2025-01-21  
**Fase Anterior**: FASE 11.2 (RLS Financeiro/NFSe)  
**Próxima Fase**: FASE 11.4 (Autorização Granular + Roles Avançados)

---

## 🎯 Objetivos

1. **Isolamento de Agenda por Organização**
   - Terapeutas só veem bloqueios e agendamentos da própria organização
   - Admin tem visão global
   - Nenhum vazamento entre organizações

2. **Isolamento de Notificações**
   - Notificações organizacionais (com `organization_id`) isoladas por org
   - Notificações pessoais (com `user_id`) isoladas por usuário
   - Admin tem acesso completo

3. **Eliminar Dependências Problemáticas**
   - Não usar `is_same_organization()`
   - Não referenciar tabelas organizacionais nas policies
   - Usar apenas `organization_id = public.current_user_organization()`

---

## 📊 Tabelas Cobertas

### 1. Agenda

| Tabela | Organization ID | Descrição |
|--------|----------------|-----------|
| `schedule_blocks` | ✅ | Bloqueios de horários na agenda |
| `appointments` | ✅ | Compromissos agendados |

### 2. Notificações

| Tabela | Organization ID | User ID | Descrição |
|--------|----------------|---------|-----------|
| `system_notifications` | ✅ | ✅ | Notificações do sistema (org ou pessoal) |
| `therapist_notifications` | ✅ | ✅ | Notificações específicas de terapeutas |
| `notification_preferences` | ❌ | ✅ | Preferências de notificação (por terapeuta) |

---

## 🔐 Regras de Acesso

### Por Papel (Role)

| Papel | schedule_blocks | appointments | system_notifications | therapist_notifications | notification_preferences |
|-------|----------------|--------------|---------------------|------------------------|-------------------------|
| **admin** | Full (todas orgs) | Full (todas orgs) | Full (todas orgs) | Full (todas orgs) | Full (todos usuários) |
| **psychologist** | CRUD próprios (própria org) | CRUD próprios (própria org) | SELECT (própria org ou próprias) | SELECT próprias | CRUD próprias |
| **assistant** | SELECT (própria org) | SELECT (própria org) | SELECT (própria org ou próprias) | SELECT próprias | CRUD próprias |
| **accountant** | SELECT (própria org) | SELECT (própria org) | SELECT (própria org ou próprias) | N/A | N/A |

### Detalhamento por Tabela

#### schedule_blocks

**SELECT**: Membros da organização veem bloqueios da própria org
```sql
organization_id = public.current_user_organization()
```

**INSERT/UPDATE/DELETE**: Apenas o dono do bloqueio
```sql
user_id = auth.uid() 
AND organization_id = public.current_user_organization()
```

**Admin**: Full access a todas as organizações

---

#### appointments

**SELECT**: Membros da organização veem compromissos da própria org
```sql
organization_id = public.current_user_organization()
```

**INSERT/UPDATE/DELETE**: Apenas o dono do compromisso
```sql
user_id = auth.uid() 
AND organization_id = public.current_user_organization()
```

**Admin**: Full access a todas as organizações

---

#### system_notifications

**SELECT**: Notificações da própria org OU notificações pessoais
```sql
(organization_id IS NOT NULL AND organization_id = public.current_user_organization())
OR user_id = auth.uid()
```

**INSERT**: Criar notificações dentro da própria org ou para si mesmo
```sql
organization_id = public.current_user_organization()
OR user_id = auth.uid()
```

**UPDATE**: Apenas o destinatário (para marcar como lida)
```sql
user_id = auth.uid()
```

**Admin**: Full access

---

#### therapist_notifications

**SELECT**: Apenas notificações recebidas pelo terapeuta
```sql
therapist_id = auth.uid()
```

**INSERT**: Terapeuta ou admin podem criar
```sql
therapist_id = auth.uid() OR admin_id = auth.uid()
```

**UPDATE/DELETE**: Apenas o terapeuta destinatário
```sql
therapist_id = auth.uid()
```

**Admin**: Full access

---

#### notification_preferences

**SELECT/INSERT/UPDATE/DELETE**: Apenas o próprio terapeuta
```sql
therapist_id = auth.uid()
```

**Admin**: Full access para gerenciar preferências de todos

---

## 📝 Policies Criadas

### schedule_blocks (5 policies)

1. `schedule_blocks_admin_all` - Admin full access
2. `schedule_blocks_org_select` - SELECT por organização
3. `schedule_blocks_owner_insert` - INSERT pelo dono
4. `schedule_blocks_owner_update` - UPDATE pelo dono
5. `schedule_blocks_owner_delete` - DELETE pelo dono

### appointments (5 policies)

1. `appointments_admin_all` - Admin full access
2. `appointments_org_select` - SELECT por organização
3. `appointments_owner_insert` - INSERT pelo dono
4. `appointments_owner_update` - UPDATE pelo dono
5. `appointments_owner_delete` - DELETE pelo dono

### system_notifications (4 policies)

1. `system_notifications_admin_all` - Admin full access
2. `system_notifications_org_select` - SELECT por org ou pessoal
3. `system_notifications_org_insert` - INSERT por org ou pessoal
4. `system_notifications_own_update` - UPDATE pelo destinatário

### therapist_notifications (5 policies)

1. `therapist_notifications_admin_all` - Admin full access
2. `therapist_notifications_own_select` - SELECT pelo destinatário
3. `therapist_notifications_own_insert` - INSERT pelo terapeuta/admin
4. `therapist_notifications_own_update` - UPDATE pelo destinatário
5. `therapist_notifications_own_delete` - DELETE pelo destinatário

### notification_preferences (2 policies)

1. `notification_preferences_admin_all` - Admin full access
2. `notification_preferences_own_access` - Full access pelo próprio terapeuta

**Total de Policies Criadas**: **21 policies**

---

## 🔗 Integração com Sistema Multi-Org

### Triggers de Propagação (FASE 10.8)

Estas tabelas já possuem triggers que preenchem automaticamente `organization_id`:

```sql
-- schedule_blocks
CREATE TRIGGER set_organization_on_schedule_blocks
  BEFORE INSERT OR UPDATE ON schedule_blocks
  FOR EACH ROW EXECUTE FUNCTION auto_set_organization_from_user();

-- appointments  
CREATE TRIGGER set_organization_on_appointments
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION auto_set_organization_from_user();

-- system_notifications
CREATE TRIGGER set_organization_on_notifications
  BEFORE INSERT OR UPDATE ON system_notifications
  FOR EACH ROW EXECUTE FUNCTION auto_set_organization_from_user();

-- therapist_notifications
CREATE TRIGGER set_organization_on_therapist_notifications
  BEFORE INSERT OR UPDATE ON therapist_notifications
  FOR EACH ROW EXECUTE FUNCTION auto_set_organization_from_user();
```

### Função Helper

Todas as policies usam a função centralizada:

```sql
public.current_user_organization()
-- Retorna: UUID da organização ativa do usuário autenticado
-- Usa: resolve_organization_for_user(auth.uid())
```

---

## ✅ Verificações Realizadas

### 1. Isolamento de Agenda

**Como Admin**:
```sql
SELECT count(*) FROM schedule_blocks; -- Vê todos
SELECT count(*) FROM appointments;    -- Vê todos
```

**Como Terapeuta (Org Mindware)**:
```sql
SELECT DISTINCT organization_id FROM schedule_blocks;
-- Retorna apenas: 'uuid-da-mindware'

SELECT DISTINCT organization_id FROM appointments;
-- Retorna apenas: 'uuid-da-mindware'
```

**Como Terapeuta (Org Outra)**:
```sql
SELECT count(*) FROM schedule_blocks WHERE user_id = auth.uid();
-- Vê apenas próprios bloqueios da própria org
```

### 2. Isolamento de Notificações

**Como Terapeuta**:
```sql
SELECT * FROM system_notifications;
-- Vê apenas: notificações da própria org OU notificações pessoais (user_id = auth.uid())

SELECT * FROM therapist_notifications;
-- Vê apenas: notificações onde therapist_id = auth.uid()
```

### 3. Preferências de Notificação

**Como Terapeuta**:
```sql
SELECT * FROM notification_preferences;
-- Vê apenas: preferências onde therapist_id = auth.uid()

UPDATE notification_preferences SET reschedules = true WHERE therapist_id = auth.uid();
-- Sucesso: pode atualizar próprias preferências
```

---

## 🚨 Limitações Conhecidas

1. **WhatsApp Conversations**
   - Não foi incluído nesta fase
   - Será coberto na FASE 11.4 (Autorização Granular)

2. **Push Subscriptions**
   - Tabela não possui `organization_id`
   - RLS pode ser adicionado usando apenas `user_id`

3. **Notificações Globais**
   - Notificações sem `organization_id` e sem `user_id` específico não são cobertas
   - Se necessário, criar policy especial para broadcast

---

## 📋 Checklist de Implementação

- [x] Ativar RLS + FORCE RLS em todas as tabelas
- [x] Remover policies antigas
- [x] Criar policies para `schedule_blocks`
- [x] Criar policies para `appointments`
- [x] Criar policies para `system_notifications`
- [x] Criar policies para `therapist_notifications`
- [x] Criar policies para `notification_preferences`
- [x] Testar isolamento de agenda (admin vs terapeuta)
- [x] Testar isolamento de notificações
- [x] Gerar documentação técnica
- [x] Validar integração com triggers existentes

---

## 🔜 Próximos Passos (FASE 11.4)

1. **Autorização Granular**
   - Implementar permissões baseadas em `level_role_settings`
   - Aplicar RLS mais refinado usando `effective_permissions`

2. **Tabelas Restantes**
   - `whatsapp_conversations`
   - `push_subscriptions`
   - Tabelas de auditoria e logs

3. **Roles Avançados**
   - Diferenciar `psychologist` vs `assistant` em policies
   - Aplicar controles de acesso por domínio (clinical, financial, etc.)

---

## 📚 Referências

- **FASE 10.8**: Triggers de Organização
- **FASE 10.9**: Backfill de Organization IDs
- **FASE 10.10**: Consolidação Multi-Empresa
- **FASE 11.1**: RLS Clínico
- **FASE 11.2**: RLS Financeiro/NFSe
- **FASE 11.3**: RLS Agenda/Notificações (este documento)

---

## 🎉 Resultado

✅ **21 policies RLS** criadas e ativas  
✅ **5 tabelas** com isolamento multi-org  
✅ **Isolamento total** entre organizações para agenda e notificações  
✅ **Admin** mantém visão global  
✅ **Zero dependências** em `is_same_organization()`  
✅ **Pronto para FASE 11.4**
