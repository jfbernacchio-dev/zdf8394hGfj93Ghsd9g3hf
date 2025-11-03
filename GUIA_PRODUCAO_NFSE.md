# Guia de Migração para Produção - NFSe

## 📋 Checklist Pré-Produção

Antes de começar a emitir notas fiscais com valor legal, certifique-se de que:

- ✅ Todos os testes foram realizados em homologação
- ✅ As notas de teste foram emitidas corretamente
- ✅ Os dados fiscais estão corretos e validados
- ✅ O certificado digital A1 está válido (vence em 19/02/2026)
- ✅ Você tem o token de produção da FocusNFe
- ✅ Os dados dos pacientes estão completos (CPF, email, nome)

## 🔧 Passo a Passo para Produção

### 1️⃣ Obter Token de Produção FocusNFe

1. Acesse o site da FocusNFe: https://focusnfe.com.br/
2. Faça login na sua conta (ou crie uma conta se ainda não tiver)
3. Contrate o plano de produção apropriado
4. Vá em **API** > **Tokens**
5. Copie o **Token de Produção**

⚠️ **Importante**: O token de produção é diferente do token de homologação e tem custo por nota emitida.

### 2️⃣ Configurar o Token de Produção no Sistema

1. No menu lateral, clique em **"NFSe"** > **"Configuração"**
2. Na aba **"Dados Fiscais"**, localize o campo **"Ambiente"**
3. Mantenha em **"Homologação (Testes)"** por enquanto
4. No campo **"Token API FocusNFe (Produção)"**, cole o token de produção que você obteve
5. Clique em **"Salvar Configurações"**

### 3️⃣ Validar Dados Fiscais

Antes de mudar para produção, revise todos os dados fiscais:

- **Inscrição Municipal**: Confirme o número correto
- **CNPJ**: 00.000.000/0000-00 (verifique se está correto)
- **Razão Social**: Nome completo correto da empresa
- **Regime Tributário**: "Simples Nacional"
- **Anexo do Simples Nacional**: "Anexo V" (com fator R)
- **Alíquota ISS**: 5%
- **Código de Serviço**: 05118 (Atendimento psicológico)

### 4️⃣ Verificar Certificado Digital

Na aba **"Certificado Digital"**:

- **Tipo**: A1 (arquivo .pfx/.p12)
- **Válido até**: 19/02/2026 ✅
- **Arquivo**: Certificado já carregado ✅
- **Senha**: 1607Mindware ✅

Se o certificado estiver próximo do vencimento, renove antes de ir para produção.

### 5️⃣ Completar Dados dos Pacientes

**CRÍTICO**: Antes de emitir notas em produção, certifique-se de que TODOS os pacientes têm:

1. **CPF válido** (ou CPF do responsável para menores)
2. **Email válido** (a nota será enviada para este email)
3. **Nome completo**

Use o arquivo `DADOS_FALTANTES_PACIENTES_JOAO.txt` para solicitar os dados faltantes aos pacientes.

### 6️⃣ Fazer Último Teste em Homologação

Antes de ir para produção, faça um último teste:

1. Emita uma nota de teste para um paciente real
2. Verifique se os dados estão corretos
3. Confirme que o email foi recebido
4. Revise o PDF da nota

### 7️⃣ MIGRAR PARA PRODUÇÃO 🚀

**ATENÇÃO**: Este é o passo final. Após isso, todas as notas terão valor legal.

1. Vá em **"NFSe"** > **"Configuração"**
2. Na aba **"Dados Fiscais"**
3. Altere o campo **"Ambiente"** de **"Homologação (Testes)"** para **"Produção"**
4. Clique em **"Salvar Configurações"**

✅ **Pronto!** O sistema agora está em produção.

## 📊 Emitindo a Primeira Nota em Produção

1. Acesse **"Pacientes"**
2. Selecione um paciente com dados completos
3. Clique em **"Emitir NFSe"**
4. Revise os valores e quantidade de sessões
5. Clique em **"Emitir NFSe"**
6. Aguarde o processamento (pode levar alguns segundos)
7. Verifique em **"NFSe"** > **"Histórico"** se a nota foi emitida
8. Baixe o PDF e verifique se está correto

## ⚠️ Atenções Importantes em Produção

### Custos
- Cada nota emitida em produção tem um custo (verifique com a FocusNFe)
- Cancelamentos também podem ter custo
- Mantenha controle do número de notas emitidas

### Cancelamento
- Notas podem ser canceladas dentro do prazo legal (geralmente 24h)
- Após o prazo, é necessário emitir uma nota de devolução
- Sempre informe o motivo do cancelamento

### Backup
- Faça backup dos PDFs das notas emitidas
- O sistema armazena automaticamente em **"Arquivos"** de cada paciente
- Considere fazer backup externo também

### Obrigações Fiscais
- As notas emitidas são declaradas automaticamente pela prefeitura
- O ISS é recolhido através do DAS do Simples Nacional
- Guarde os PDFs por no mínimo 5 anos

## 🔄 Voltando para Homologação (se necessário)

Se precisar testar algo ou voltar para homologação:

1. Vá em **"NFSe"** > **"Configuração"**
2. Altere **"Ambiente"** para **"Homologação (Testes)"**
3. Salve as configurações

⚠️ **Lembre-se**: Não esqueça de voltar para "Produção" quando terminar os testes!

## 📞 Suporte e Troubleshooting

### Erro: "Token inválido"
- Verifique se está usando o token de produção correto
- Confirme se o token foi ativado pela FocusNFe
- Entre em contato com o suporte da FocusNFe

### Erro: "Certificado inválido"
- Verifique a data de validade (19/02/2026)
- Confirme se a senha está correta (1607Mindware)
- Se necessário, faça upload do certificado novamente

### Erro: "Dados do tomador inválidos"
- Verifique o CPF do paciente (deve estar válido)
- Confirme se o email está correto
- Revise se há caracteres especiais no nome

### Nota não foi enviada por email
- Verifique se o email do paciente está correto
- Confira a caixa de spam do paciente
- Entre em contato com o paciente para confirmar recebimento

### Dúvidas sobre valores e impostos
- Consulte seu contador
- Revise a documentação da prefeitura local
- Entre em contato com a FocusNFe: https://focusnfe.com.br/contato/

## 📈 Monitoramento Pós-Produção

Nos primeiros dias em produção, monitore:

1. **Taxa de sucesso**: Quantas notas são emitidas sem erros
2. **Emails recebidos**: Confirme com alguns pacientes se receberam
3. **Valores corretos**: Verifique se os cálculos estão corretos
4. **PDFs**: Revise alguns PDFs para garantir qualidade

## ✅ Checklist Final

Antes de considerar a migração completa:

- [ ] Token de produção configurado e testado
- [ ] Todos os dados fiscais revisados e corretos
- [ ] Certificado digital válido e funcional
- [ ] Dados dos pacientes completos
- [ ] Último teste em homologação realizado com sucesso
- [ ] Ambiente alterado para "Produção"
- [ ] Primeira nota em produção emitida e verificada
- [ ] Email recebido pelo paciente
- [ ] PDF baixado e revisado
- [ ] Backup configurado

---

## 🎉 Sucesso!

Se você seguiu todos os passos e a primeira nota foi emitida corretamente, parabéns! O sistema está em produção e pronto para uso.

**Dica Final**: Continue monitorando as primeiras emissões e mantenha contato com os pacientes para confirmar o recebimento das notas.

---

**Última atualização**: Sistema MindWare - 2025  
**Suporte técnico**: Verifique a documentação ou entre em contato com o desenvolvedor
