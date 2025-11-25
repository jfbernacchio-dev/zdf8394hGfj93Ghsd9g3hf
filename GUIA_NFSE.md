# Guia de Configuração e Emissão de NFSe - MindWare

## 📋 Pré-requisitos

Para emitir notas fiscais eletrônicas pelo sistema, você precisa ter:

1. **Certificado Digital A1** (.pfx ou .p12)
2. **Token da API FocusNFe** (gratuito para ambiente de homologação)
3. **Dados Fiscais** da empresa (CNPJ, Inscrição Municipal, etc.)

## 🔧 Configuração Inicial

### Passo 1: Acessar Configurações NFSe

1. No menu lateral, clique em **"NFSe"** > **"Configuração"**
2. Você verá duas abas: **"Dados Fiscais"** e **"Certificado Digital"**

### Passo 2: Configurar Dados Fiscais

Na aba **"Dados Fiscais"**, preencha:

- **Inscrição Municipal**: Número da inscrição da empresa na prefeitura
- **CNPJ**: 00.000.000/0000-00
- **Razão Social**: Nome completo da empresa
- **Regime Tributário**: Selecione "Simples Nacional"
- **Anexo do Simples Nacional**: Selecione "Anexo V" (com fator R, na prática fica no Anexo III)
- **Alíquota ISS**: 5% (já configurado como padrão)
- **Código de Serviço**: 05118 (Atendimento psicológico)
- **Descrição do Serviço**: "Atendimento psicológico individual"
- **Token API FocusNFe**: Cole o token fornecido pela FocusNFe
- **Ambiente**: 
  - Selecione "Homologação (Testes)" para testar
  - Selecione "Produção" quando estiver pronto para emitir notas reais

Clique em **"Salvar Configurações"**.

### Passo 3: Configurar Certificado Digital

Na aba **"Certificado Digital"**:

1. **Tipo de Certificado**: Selecione "A1 (arquivo .pfx/.p12)"
2. **Válido até**: 19/02/2026
3. **Arquivo do Certificado**: Clique em "Escolher arquivo" e selecione o arquivo `.pfx` fornecido
4. **Senha do Certificado**: [SENHA_DO_CERTIFICADO_A1]
   ⚠️ **Nunca commit a senha real aqui.**

Clique em **"Salvar Certificado"**.

⚠️ **Segurança**: Todos os dados (token, certificado e senha) são automaticamente criptografados com AES-GCM 256-bit antes de serem armazenados.

## 💼 Emitindo uma NFSe

### Opção 1: Pela Página do Paciente

1. Acesse **"Pacientes"** no menu
2. Clique no paciente desejado
3. No cabeçalho, clique no botão **"Emitir NFSe"**
4. Preencha:
   - **Valor do Serviço**: Valor total a ser cobrado
   - **Número de Sessões**: Quantidade de sessões (aparecerá na discriminação)
5. Clique em **"Emitir NFSe"**

### Opção 2: Pela Lista de Pacientes

1. Acesse **"Pacientes"** no menu
2. Na lista, clique no botão **"Emitir NFSe"** do paciente desejado
3. Siga os mesmos passos acima

## 📊 Consultando Histórico

1. No menu, clique em **"NFSe"** > **"Histórico"**
2. Você verá:
   - **Total Emitidas**: Quantidade de notas emitidas
   - **Valor Total**: Soma dos valores de todas as notas
   - **Este Mês**: Quantidade de notas emitidas no mês atual
3. Na tabela, você pode:
   - **Buscar** por paciente ou número da nota
   - **Baixar PDF** da nota (ícone de download)
   - **Cancelar** nota emitida (ícone X)

## 🔄 Status das Notas

- **🔵 Processando**: A nota está sendo emitida pela prefeitura
- **✅ Emitida**: Nota emitida com sucesso
- **❌ Erro**: Houve um erro na emissão (verifique a mensagem)
- **⭕ Cancelada**: Nota foi cancelada

## ⚠️ Informações Importantes

### Cálculo do ISS

Com a alíquota de **5%**:
- Valor do serviço: R$ 100,00
- ISS (5%): R$ 5,00
- Valor líquido: R$ 95,00

⚠️ **Importante**: Como a MindWare está no Simples Nacional, o ISS é recolhido dentro da DAS. A nota fiscal mostrará o valor do ISS para fins informativos, mas o imposto já está incluído no pagamento do Simples.

### Ambiente de Homologação vs. Produção

- **Homologação**: Use para testes. As notas emitidas não têm valor legal.
- **Produção**: Use apenas quando tudo estiver configurado e testado. As notas têm valor legal.

### Dados do Paciente

Para emitir uma NFSe, o sistema precisa:
- **CPF do paciente**: Obrigatório
- **Email do paciente**: A nota será enviada para este email
- **Nome do paciente**: Aparecerá como tomador do serviço

Certifique-se de que os dados do paciente estão completos antes de emitir a nota.

## 🆘 Problemas Comuns

### "Configuração fiscal não encontrada"
- Configure os dados fiscais em NFSe > Configuração

### "Token FocusNFe não configurado"
- Adicione o token da FocusNFe nas configurações

### "Certificado inválido"
- Verifique se o arquivo .pfx está correto
- Confirme se a senha está correta (solicite ao administrador)
- Verifique a data de validade do certificado

### "Erro ao emitir NFSe"
- Verifique se todos os dados do paciente estão preenchidos (especialmente CPF e email)
- Confirme se o ambiente está correto (homologação/produção)
- Consulte os logs da aplicação para mais detalhes

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Consulte este guia primeiro
2. Entre em contato com o contador
3. Verifique a documentação da FocusNFe: https://focusnfe.com.br/doc/

## 🔐 Segurança e LGPD

- Todas as credenciais são criptografadas
- Certificados digitais são armazenados com segurança
- Acesso aos dados é registrado em logs de auditoria
- Pacientes podem solicitar exportação de seus dados
