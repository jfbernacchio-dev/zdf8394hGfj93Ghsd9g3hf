# RELATÓRIO DE IMPACTO À PROTEÇÃO DE DADOS (RIPD)

**Espaço Mindware Psicologia Ltda.**  
CNPJ: 41.709.325/0001-25  
Última atualização: Novembro/2025

---

## 1. OBJETIVO

Avaliar os riscos à privacidade e propor medidas mitigatórias para o tratamento de dados pessoais e sensíveis no contexto clínico do Espaço Mindware Psicologia Ltda., em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

---

## 2. ESCOPO

Este RIPD abrange:

- **Titulares**: Pacientes adultos e menores de idade atendidos presencialmente e por telepsicologia
- **Dados tratados**: Dados cadastrais, dados sensíveis de saúde (prontuários psicológicos), dados financeiros
- **Processos**: Coleta, registro, armazenamento, processamento, comunicação e descarte de dados
- **Sistemas**: Plataforma web MindWare (sistema de gestão clínica)
- **Infraestrutura**: Lovable Cloud (backend), Supabase (banco de dados), FocusNFe (emissão fiscal)

---

## 3. DESCRIÇÃO DO TRATAMENTO

### 3.1 Finalidades

- Prestação de serviços de psicologia clínica
- Gestão de agendamentos e prontuários eletrônicos
- Emissão de documentos fiscais (NFS-e)
- Comunicação com pacientes (notificações de consultas)
- Armazenamento de documentos clínicos (arquivos PDF, imagens)
- Controle financeiro e faturamento
- Cumprimento de obrigações legais e regulatórias (CFP, ANPD)

### 3.2 Bases Legais (Art. 7º e 11 da LGPD)

- **Execução de contrato** (Art. 7º, V) - gestão administrativa
- **Tutela da saúde** (Art. 11, II, f) - tratamento de dados sensíveis de saúde
- **Cumprimento de obrigação legal** (Art. 7º, II) - CFP Resolução 001/2009
- **Consentimento explícito** (Art. 7º, I e Art. 11, I) - telepsicologia e compartilhamentos

### 3.3 Categorias de Dados Coletados

**Dados Pessoais:**
- Nome completo, CPF, RG
- Data de nascimento
- Endereço, telefone, e-mail
- Dados de responsável legal (para menores)

**Dados Sensíveis (Art. 5º, II da LGPD):**
- Histórico psicológico e prontuários clínicos
- Diagnósticos, sintomas, evolução clínica
- Observações terapêuticas
- Documentos anexados (laudos, relatórios)

**Dados Financeiros:**
- Valores de sessões
- Status de pagamento
- Dados para emissão de NFS-e

**Dados de Acesso:**
- Logs de autenticação
- Registros de auditoria
- Endereços IP (para segurança)

---

## 4. PRINCIPAIS RISCOS IDENTIFICADOS

### 4.1 Riscos Técnicos

| Risco | Probabilidade | Impacto | Severidade |
|-------|---------------|---------|------------|
| Acesso não autorizado a prontuários | Média | Alto | **CRÍTICO** |
| Vazamento de dados por vulnerabilidade | Baixa | Alto | **ALTO** |
| Perda de dados por falha técnica | Baixa | Médio | MÉDIO |
| Interceptação de comunicações | Baixa | Alto | **ALTO** |
| Ataque de força bruta em credenciais | Média | Médio | MÉDIO |

### 4.2 Riscos Organizacionais

| Risco | Probabilidade | Impacto | Severidade |
|-------|---------------|---------|------------|
| Acesso indevido por colaborador | Baixa | Alto | **ALTO** |
| Uso indevido por terceiros (operadores) | Baixa | Alto | **ALTO** |
| Falha em processos de descarte | Baixa | Médio | MÉDIO |
| Não conformidade regulatória | Baixa | Alto | **ALTO** |

### 4.3 Riscos aos Titulares

- **Discriminação**: exposição de dados sensíveis de saúde mental
- **Constrangimento**: vazamento de informações íntimas
- **Dano moral**: violação do sigilo profissional
- **Dano material**: uso fraudulento de dados pessoais/financeiros

---

## 5. MEDIDAS DE MITIGAÇÃO IMPLEMENTADAS

### 5.1 Medidas Técnicas

**Criptografia:**
- Dados sensíveis criptografados em repouso (AES-256)
- Comunicações via HTTPS/TLS 1.3
- Senhas armazenadas com hash bcrypt
- Credenciais NFSe criptografadas com chave mestra

**Controle de Acesso:**
- Autenticação multifator (MFA) obrigatória para administradores
- Sistema de roles (admin/psicólogo)
- Row-Level Security (RLS) no banco de dados
- Isolamento de dados por terapeuta

**Segurança de Infraestrutura:**
- Hospedagem em Lovable Cloud (padrão SOC 2, ISO 27001)
- Banco de dados Supabase (certificado ISO 27001)
- Backups automáticos diários
- Logs de auditoria completos

**Proteção de Aplicação:**
- Rate limiting em APIs críticas
- Validação de entrada (CPF, dados sensíveis)
- Proteção contra SQL injection
- Sessões com timeout automático

### 5.2 Medidas Organizacionais

**Políticas Internas:**
- Norma de Segurança da Informação (documento anexo)
- Termo de Confidencialidade para colaboradores
- Política de Retenção e Descarte (5 anos + eliminação segura)

**Gestão de Incidentes:**
- Runbook de Resposta a Incidentes (RCIS)
- Canal de comunicação com DPO: privacidade@espacomindware.com.br
- Notificação à ANPD em até 3 dias úteis (Resolução CD/ANPD nº 15/2024)

**Treinamento:**
- Capacitação em LGPD para todos os profissionais
- Conscientização sobre segurança da informação

**Contratos com Operadores:**
- Cláusulas de proteção de dados com FocusNFe
- Termos de serviço compatíveis com LGPD (Lovable/Supabase)

### 5.3 Medidas de Transparência

- Política de Privacidade acessível no sistema
- Termo de Consentimento assinado por todos os pacientes
- Canal para exercício de direitos dos titulares
- ROPA (Registro de Operações de Tratamento) atualizado

---

## 6. AVALIAÇÃO DE RISCO RESIDUAL

Após implementação das medidas de segurança técnicas, organizacionais e de transparência:

**RISCO RESIDUAL: BAIXO A MÉDIO**

### Justificativa:

- **Controles técnicos robustos**: criptografia, MFA, RLS, logs de auditoria
- **Infraestrutura certificada**: Lovable Cloud e Supabase com padrões internacionais
- **Conformidade regulatória**: CFP 001/2009, LGPD, Resolução ANPD nº 15/2024
- **Processos documentados**: RIPD, ROPA, Runbook RCIS, Norma de Segurança
- **Monitoramento contínuo**: logs de auditoria, revisões anuais

### Riscos Remanescentes Aceitáveis:

- Ataques sofisticados de APT (Advanced Persistent Threat) - mitigado por monitoramento
- Falhas de terceiros (operadores) - mitigado por contratos e auditoria
- Erro humano de colaboradores - mitigado por treinamento e controles de acesso

---

## 7. CONFORMIDADE REGULATÓRIA

### 7.1 LGPD (Lei 13.709/2018)

- ✅ Bases legais identificadas (Art. 7º e 11)
- ✅ Direitos dos titulares implementados
- ✅ Segurança e boas práticas (Art. 46)
- ✅ Registro de operações (Art. 37)
- ✅ Encarregado de Dados designado

### 7.2 Conselho Federal de Psicologia

- ✅ Resolução CFP 001/2009 (guarda de prontuários - 5 anos)
- ✅ Código de Ética Profissional (sigilo)
- ✅ Resolução CFP 011/2018 (telepsicologia)

### 7.3 ANPD

- ✅ Resolução CD/ANPD nº 15/2024 (comunicação de incidentes)

---

## 8. NECESSIDADE DE APROVAÇÃO DA ANPD

**NÃO APLICÁVEL** - O tratamento não se enquadra nas hipóteses do Art. 38 da LGPD (uso de novas tecnologias, tratamento em larga escala com risco aos titulares). O volume de dados é limitado ao contexto clínico de uma clínica de psicologia de pequeno/médio porte.

---

## 9. TRANSFERÊNCIA INTERNACIONAL DE DADOS

**POSSÍVEL** via Lovable Cloud/Supabase, que utilizam infraestrutura com servidores internacionais.

**Salvaguardas:**
- Cláusulas contratuais padrão compatíveis com LGPD
- Certificações ISO 27001 e SOC 2
- Conformidade com padrões de segurança internacionais

---

## 10. PRAZO DE VALIDADE E REVISÃO

- **Validade**: 12 meses (até Novembro/2026)
- **Revisão obrigatória em caso de**:
  - Alterações significativas no tratamento de dados
  - Novos sistemas ou funcionalidades
  - Incidentes de segurança relevantes
  - Mudanças na legislação

---

## 11. RESPONSÁVEL PELA ELABORAÇÃO E APROVAÇÃO

**Encarregado de Proteção de Dados (DPO):**  
João Felipe Monteiro Dias Bernacchio  
CRP: 06/178261  
E-mail: privacidade@espacomindware.com.br  

**Data de Elaboração**: Novembro/2025  
**Aprovado por**: João Felipe Monteiro Dias Bernacchio (Sócio-Administrador)

---

## 12. CONCLUSÃO

O tratamento de dados pessoais e sensíveis realizado pelo Espaço Mindware Psicologia Ltda. apresenta riscos inerentes à natureza dos serviços de saúde mental. No entanto, com a implementação de controles técnicos robustos, processos organizacionais bem definidos e conformidade com as regulamentações aplicáveis (LGPD, CFP, ANPD), o **risco residual é considerado BAIXO A MÉDIO e ACEITÁVEL**.

As medidas de segurança implementadas são proporcionais aos riscos identificados e garantem a proteção dos direitos e liberdades fundamentais dos titulares.

---

**Documento controlado - Propriedade do Espaço Mindware Psicologia Ltda.**  
**Acesso restrito - Confidencial**
