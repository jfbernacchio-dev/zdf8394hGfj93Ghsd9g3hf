# Configuração do Webhook do WhatsApp Business

Siga este guia passo a passo para configurar o webhook do WhatsApp Business e integrar o chat bidirecional ao sistema.

## Pré-requisitos

✅ Conta no Meta Business Manager  
✅ App do WhatsApp Business configurado  
✅ Token de verificação do webhook gerado (já adicionado ao sistema)  
✅ Número do WhatsApp Business vinculado ao app

---

## 📋 Passo 1: Acessar o Meta Business Manager

1. Acesse: https://business.facebook.com/
2. Navegue até **Aplicativos** no menu lateral
3. Selecione seu aplicativo do WhatsApp Business
4. No menu lateral, clique em **WhatsApp** → **Configuração**

---

## 🔗 Passo 2: Configurar o Webhook

### 2.1 URL do Webhook

Na seção "Webhooks", você precisará configurar:

**URL do Webhook:**
```
https://klxyilxprlzhxnwjzcvv.supabase.co/functions/v1/whatsapp-webhook
```

### 2.2 Token de Verificação

Use o token que você acabou de criar no sistema. Este token é uma string aleatória que você definiu para autenticar o webhook.

⚠️ **IMPORTANTE:**
O token abaixo é apenas um exemplo. Nunca utilize tokens reais em documentação pública.

**Exemplo de token:** `mindware_webhook_2024_secure_token_xyz123`

⚠️ **IMPORTANTE:** Use exatamente o mesmo token que você adicionou como secret `WHATSAPP_VERIFY_TOKEN` no sistema.

### 2.3 Campos de Assinatura (Subscription Fields)

Marque os seguintes campos para receber notificações:

- ✅ **messages** - Para receber mensagens dos pacientes
- ✅ **message_status** - Para receber atualizações de status das mensagens enviadas

---

## ⚡ Passo 3: Verificar o Webhook

1. Após inserir a URL e o token de verificação, clique em **Verificar e salvar**
2. O Meta enviará uma requisição GET para validar o webhook
3. Se a configuração estiver correta, você verá uma mensagem de sucesso ✅

**Possíveis problemas:**

- ❌ **"Verificação falhou"** - Confirme que o token está idêntico ao configurado no sistema
- ❌ **"URL inacessível"** - Verifique se a URL está correta
- ❌ **"Timeout"** - A edge function pode não estar deployed. Aguarde alguns minutos e tente novamente

---

## 🔔 Passo 4: Configurar Notificações de Webhook

Ainda na seção de Webhooks:

1. Localize **"Campos de webhook"** (Webhook Fields)
2. Clique em **Gerenciar** ao lado de "messages"
3. Selecione a opção **"Assinar"** (Subscribe)

Isso garante que você receberá todas as mensagens enviadas pelos pacientes.

---

## 🧪 Passo 5: Testar a Integração

### Teste Manual

1. Envie uma mensagem do seu celular para o número do WhatsApp Business
2. Acesse o sistema e navegue até **WhatsApp** no menu
3. Você deve ver:
   - A conversa aparecer na lista da esquerda
   - A mensagem recebida no histórico
   - Contador de mensagens não lidas

### Enviar Resposta

1. Clique na conversa
2. Digite uma mensagem no campo de texto
3. Clique em **Enviar** ou pressione Enter
4. A mensagem deve aparecer no chat do paciente

---

## ⏰ Entendendo a Janela de 24 Horas

O WhatsApp Business API tem uma regra importante:

### ✅ **Dentro da janela de 24h**
Você pode enviar **mensagens livres** para o paciente se:
- O paciente enviou uma mensagem nos últimos 24 horas
- O timer é resetado cada vez que o paciente responde

### ❌ **Fora da janela de 24h**
Você só pode enviar **templates pré-aprovados**:
- Templates de utilidade (NFSe, confirmações)
- Templates de marketing (se aprovados)
- Templates de autenticação

**Dica:** O sistema mostra um badge com o status da janela em cada conversa.

---

## 🔐 Segurança e Boas Práticas

1. **Nunca compartilhe** seu token de verificação
2. **Monitore** os logs da edge function `whatsapp-webhook` para debug
3. **Respeite** as políticas do WhatsApp Business
4. **Não envie spam** - isso pode resultar em banimento
5. **Use templates aprovados** para comunicação fora da janela de 24h

---

## 📊 Logs e Debugging

Para visualizar logs da integração:

1. Acesse o painel do Lovable Cloud
2. Navegue até **Edge Functions**
3. Selecione **whatsapp-webhook**
4. Visualize os logs em tempo real

**Logs úteis:**
- `Webhook verification attempt` - Tentativas de verificação
- `Processing message from` - Mensagens sendo processadas
- `Message saved successfully` - Confirmação de salvamento

---

## ❓ Problemas Comuns

### Webhook não verificando
- ✅ Confirme que o token está correto
- ✅ Verifique se a edge function está deployed
- ✅ Teste a URL diretamente no navegador

### Mensagens não chegando no sistema
- ✅ Confirme que subscreveu o campo "messages"
- ✅ Verifique os logs da edge function
- ✅ Confirme que o número está vinculado ao app

### Erro ao enviar mensagens
- ✅ Verifique se está dentro da janela de 24h
- ✅ Confirme que o `WHATSAPP_API_TOKEN` está configurado
- ✅ Verifique se o `WHATSAPP_PHONE_NUMBER_ID` está correto

---

## 📞 Suporte

Para problemas técnicos com:
- **WhatsApp Business API:** Consulte a documentação oficial da Meta
- **Sistema Mindware:** Entre em contato com o suporte técnico
- **Edge Functions:** Verifique os logs no painel do Lovable Cloud

---

## 🎉 Pronto!

Sua integração WhatsApp está configurada e pronta para uso. Agora você pode:

- ✅ Receber mensagens dos pacientes em tempo real
- ✅ Responder diretamente pelo sistema
- ✅ Manter todo o histórico de conversas
- ✅ Gerenciar múltiplas conversas simultaneamente

**Próximos passos sugeridos:**
- Configure templates adicionais no Meta Business Manager
- Treine sua equipe no uso da interface de chat
- Estabeleça protocolos de resposta e tempo de atendimento
