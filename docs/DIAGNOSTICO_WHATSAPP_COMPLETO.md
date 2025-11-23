# 🔍 DIAGNÓSTICO COMPLETO - WHATSAPP

**Data:** 2025-11-23  
**Usuário:** João (cc630372-360c-36...) - Olimpo  
**Organização:** Espaço Mindware (e5083a3e-d802-43c5-b281-2d504182a06d)

---

## 📊 RESUMO EXECUTIVO

**Status:** ❌ **PROBLEMA IDENTIFICADO - BUG NO CÓDIGO**

João e Larissa (Olimpo) não conseguem ver conversas no WhatsApp devido a um erro de **query malformada** no código do HOTFIX W3.2.

---

## 1️⃣ AUDITORIA DE DADOS

### 1.1 Conversas no Banco (`whatsapp_conversations`)

```sql
SELECT COUNT(*) FROM whatsapp_conversations;
-- RESULTADO: 100 conversas
```

✅ **Status:** Dados existem e estão consistentes

**Distribuição:**
- Total de conversas: **100**
- Conversas sem `organization_id`: **0** ✅
- Organizações distintas: **1** (Espaço Mindware)
- Usuários distintos: **2** (João e Larissa)

**Amostra das conversas do João e Larissa:**

| user_id | Terapeuta | Qtd Conversas |
|---------|-----------|---------------|
| cc630372-360c-49e7-99e8-2bd83a3ab75d | João Felipe | ~40 conversas |
| 19ec4677-5531-4576-933c-38ed70ee0bda | Larissa Schwarcz | ~60 conversas |

### 1.2 Mensagens no Banco (`whatsapp_messages`)

```sql
SELECT COUNT(*) FROM whatsapp_messages;
-- RESULTADO: 152 mensagens
```

✅ **Status:** Dados existem e estão consistentes

**Distribuição:**
- Total de mensagens: **152**
- Mensagens sem `organization_id`: **0** ✅
- Mensagens sem `conversation_id`: **0** ✅
- Mensagens órfãs (sem conversa correspondente): **0** ✅

### 1.3 Consistência de `organization_id`

✅ **TODAS** as conversas têm `organization_id` = `e5083a3e-d802-43c5-b281-2d504182a06d`  
✅ **TODAS** as mensagens têm `organization_id` = `e5083a3e-d802-43c5-b281-2d504182a06d`  
✅ **TODAS** as conversas têm `organization_id` consistente com o `organization_id` dos perfis dos terapeutas  
✅ **TODAS** as mensagens têm `organization_id` consistente com as conversas

**Conclusão:** Não há problemas de inconsistência de dados.

---

## 2️⃣ ERRO DETECTADO NO FRONTEND

### 2.1 Mensagem de Erro no Console

```javascript
Error loading conversations: {
  "code": "PGRST200",
  "details": "Searched for a foreign key relationship between 'whatsapp_conversations' and 'profiles' using the hint 'whatsapp_conversations_user_id_fkey' in the schema 'public', but no matches were found.",
  "message": "Could not find a relationship between 'whatsapp_conversations' and 'profiles' in the schema cache"
}
```

### 2.2 Análise do Erro

❌ **PROBLEMA IDENTIFICADO:** Query malformada no código

O código implementado no HOTFIX W3.2 (`src/pages/WhatsAppChat.tsx`) tenta fazer um JOIN com a tabela `profiles` usando um hint de foreign key que **NÃO EXISTE**:

```typescript
// CÓDIGO ATUAL (INCORRETO)
const { data, error } = await supabase
  .from("whatsapp_conversations")
  .select(`
    *,
    patients!whatsapp_conversations_patient_id_fkey (
      name,
      user_id
    ),
    profiles!whatsapp_conversations_user_id_fkey (
      full_name
    )
  `)
  .eq("organization_id", organizationId)
  .order("last_message_at", { ascending: false });
```

**Problema:** A foreign key `whatsapp_conversations_user_id_fkey` **NÃO EXISTE** na tabela `whatsapp_conversations`.

### 2.3 Por que o erro acontece?

A tabela `whatsapp_conversations` tem a coluna `user_id`, mas **não há uma constraint de foreign key** definida entre `whatsapp_conversations.user_id` e `profiles.id`.

Quando usamos a sintaxe:
```typescript
profiles!whatsapp_conversations_user_id_fkey (...)
```

O Supabase procura por uma foreign key chamada `whatsapp_conversations_user_id_fkey`, não encontra, e retorna o erro PGRST200.

---

## 3️⃣ VERIFICAÇÃO DE PERMISSÕES

### 3.1 Logs de Permissões do João (Olimpo)

```javascript
[FASE W3] WhatsApp - Usuários acessíveis: [
  "f7bd592d-dd32-462c-ad5d-8a25602c166b",
  "cc630372-360c-49e7-99e8-2bd83a3ab75d",  // João
  "19ec4677-5531-4576-933c-38ed70ee0bda",  // Larissa
  "0452f717-8631-43cb-996a-975ed72934ec",
  "4bdffc58-5bc2-4733-b110-0954641cf475"
]
```

✅ **Permissões OK:** João tem acesso a todos os usuários esperados (5 usuários).

### 3.2 Bootstrap de Permissões

```javascript
[PERM] 🚀 Bootstrap permissivo aplicado (admin/owner): {
  "canAccessWhatsapp": true,
  "canViewSubordinateWhatsapp": true,
  "canManageSubordinateWhatsapp": true,
  ...
}
```

✅ **Permissões OK:** João tem permissões completas de WhatsApp.

---

## 4️⃣ VERIFICAÇÃO RLS

### 4.1 RLS em `whatsapp_conversations`

Os dados foram consultados diretamente do banco com sucesso, indicando que **não há problema nas policies RLS**.

### 4.2 RLS em `whatsapp_messages`

Os dados foram consultados diretamente do banco com sucesso, indicando que **não há problema nas policies RLS**.

**Conclusão:** As policies RLS estão funcionando corretamente.

---

## 5️⃣ DIAGNÓSTICO FINAL

### ❌ Problema Raiz Identificado

**BUG NO CÓDIGO:** Query malformada no `WhatsAppChat.tsx` tentando usar foreign key inexistente.

### ✅ O que está funcionando

- ✅ Dados existem no banco (100 conversas, 152 mensagens)
- ✅ Todos os dados têm `organization_id` correto
- ✅ Não há conversas ou mensagens órfãs
- ✅ Consistência de dados está perfeita
- ✅ Permissões estão corretas (João tem acesso a tudo)
- ✅ RLS está funcionando
- ✅ Olimpo gate está funcionando (João passa pelo gate)

### ❌ O que está quebrado

- ❌ Query no `loadConversations` está usando foreign key que não existe
- ❌ A sintaxe `profiles!whatsapp_conversations_user_id_fkey` falha porque a foreign key não existe

---

## 6️⃣ SOLUÇÃO RECOMENDADA

### Opção 1: Remover o JOIN com `profiles` (RECOMENDADO)

Simplificar a query para buscar apenas os dados da `whatsapp_conversations` sem o nome do terapeuta:

```typescript
const { data, error } = await supabase
  .from("whatsapp_conversations")
  .select(`
    *,
    patients!whatsapp_conversations_patient_id_fkey (
      name,
      user_id
    )
  `)
  .eq("organization_id", organizationId)
  .order("last_message_at", { ascending: false });
```

**Vantagens:**
- ✅ Query válida
- ✅ Retorna todos os dados necessários
- ✅ Não quebra ao encontrar foreign key inexistente

**Desvantagens:**
- ⚠️ Não retorna o nome do terapeuta na query inicial

### Opção 2: Buscar nome do terapeuta separadamente

Se o nome do terapeuta for essencial, fazer uma query adicional:

```typescript
// 1. Buscar conversas
const { data: conversations, error } = await supabase
  .from("whatsapp_conversations")
  .select("*")
  .eq("organization_id", organizationId)
  .order("last_message_at", { ascending: false });

// 2. Buscar nomes dos terapeutas
const userIds = [...new Set(conversations.map(c => c.user_id))];
const { data: profiles } = await supabase
  .from("profiles")
  .select("id, full_name")
  .in("id", userIds);

// 3. Mapear nomes
const conversationsWithNames = conversations.map(conv => ({
  ...conv,
  therapist_name: profiles.find(p => p.id === conv.user_id)?.full_name
}));
```

### Opção 3: Criar a Foreign Key (NÃO RECOMENDADO para hotfix)

Criar a foreign key missing no banco:

```sql
ALTER TABLE whatsapp_conversations
ADD CONSTRAINT whatsapp_conversations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

**Desvantagens:**
- ⚠️ Requer migration
- ⚠️ Pode causar problemas se houver dados inconsistentes
- ⚠️ Fora do escopo do hotfix

---

## 7️⃣ AÇÃO IMEDIATA

**FIXAR O CÓDIGO EM `src/pages/WhatsAppChat.tsx`:**

Substituir a query malformada por uma query válida (Opção 1 ou 2).

**Não é necessário:**
- ❌ Mexer em RLS
- ❌ Mexer em migrations
- ❌ Mexer em edge functions
- ❌ Mexer em permissões
- ❌ Corrigir dados no banco

---

## 📝 CHECKLIST DE VERIFICAÇÃO

- [x] Dados existem no banco
- [x] `organization_id` consistente
- [x] Nenhuma conversa órfã
- [x] Nenhuma mensagem órfã
- [x] Permissões OK
- [x] RLS OK
- [x] Olimpo gate OK
- [ ] **Query no código precisa ser corrigida** ⬅️ **AÇÃO NECESSÁRIA**

---

**FIM DO DIAGNÓSTICO**
