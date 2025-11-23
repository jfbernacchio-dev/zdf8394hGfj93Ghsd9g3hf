# 🔧 RELATÓRIO HOTFIX W3.3 – WhatsApp Conversas (Correção Definitiva)

**Data**: 2025-11-23  
**Objetivo**: Corrigir query inválida que impedia João e Larissa (Olimpo) de visualizarem conversas do WhatsApp.

---

## 🎯 Problema Identificado

A query em `loadConversations()` estava tentando fazer JOIN com `profiles` usando um relacionamento inexistente:
```typescript
profiles!whatsapp_conversations_user_id_fkey (full_name)
```

**Erro retornado pelo Supabase**:
```
"Could not find a relationship between 'whatsapp_conversations' and 'profiles' in the schema cache"
```

Esse erro derrubava toda a query e impedia o carregamento das conversas.

---

## ✅ Solução Implementada

### Arquivo editado:
- `src/pages/WhatsAppChat.tsx`

### Mudanças:

#### 1. Query para Olimpo (linhas 186-213)

**ANTES**:
```typescript
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
// ... mapeamento incluía:
therapist_name: conv.profiles?.full_name || 'Terapeuta',
```

**DEPOIS**:
```typescript
.select(`
  *,
  patients!whatsapp_conversations_patient_id_fkey (
    name,
    user_id
  )
`)
// ... mapeamento removeu referência a profiles
```

#### 2. Query para usuários não-Olimpo (linhas 235-257)

**ANTES**:
```typescript
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
// ... mapeamento incluía:
therapist_name: conv.profiles?.full_name || 'Terapeuta',
```

**DEPOIS**:
```typescript
.select(`
  *,
  patients!whatsapp_conversations_patient_id_fkey (
    name,
    user_id
  )
`)
// ... mapeamento removeu referência a profiles
```

---

## 🧪 Validação Manual

### ✅ João e Larissa (Olimpo)
- [ ] Lista de conversas carrega na lateral esquerda
- [ ] Conversas exibem o nome do paciente corretamente
- [ ] Ao clicar em uma conversa, as mensagens aparecem
- [ ] Envio de mensagens funciona normalmente
- [ ] Nenhum erro no console do browser

### ✅ Usuários não-Olimpo
- [ ] Continuam vendo tela "WhatsApp em construção" (gate W1)
- [ ] Nenhum comportamento foi alterado para não-Olimpo

### ✅ Banco de dados
- [ ] Nenhuma alteração em schema/RLS
- [ ] Dados permanecem intactos

---

## 📊 Impacto

**Escopo**: Apenas frontend (`WhatsAppChat.tsx`)

**Mantido intacto**:
- Gates W1 (Olimpo vs não-Olimpo)
- Hardening W2 (organizations.whatsapp_enabled)
- Permissões W3 (hierarquia, subordinados, secretaria, peer-sharing)
- Edge functions (send-whatsapp, send-whatsapp-reply, whatsapp-webhook)
- RLS policies
- Database schema
- Módulo NFSe

**Resultado esperado**:
- João e Larissa agora conseguem ver todas as conversas de sua organização (Espaço Mindware)
- Query não retorna mais erro de relacionamento inválido
- UI funcional e sem "nenhuma conversa disponível"

---

## 🔍 Próximos Passos (se necessário)

Se ainda houver problemas:
1. Verificar logs do browser (console.log com tag `[HOTFIX W3.3]`)
2. Confirmar que `organizationId` está definido corretamente
3. Validar que existem conversas no banco com `organization_id = 'e5083a3e-d802-43c5-b281-2d504182a06d'`
4. Verificar RLS em `whatsapp_conversations` (se aplicável)

---

**Status**: ✅ Implementado  
**Pendente validação manual**: João/Larissa testando em produção
