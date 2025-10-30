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

### 4.1 Matriz de Risco Quantitativa

**Metodologia de Pontuação:**
- **Probabilidade**: 1=Rara | 2=Improvável | 3=Possível | 4=Provável | 5=Quase Certa
- **Impacto**: 1=Insignificante | 2=Menor | 3=Moderado | 4=Maior | 5=Catastrófico
- **Severidade = Probabilidade × Impacto**

**Classificação de Severidade:**
- **1-5**: BAIXO (verde) - Monitorar
- **6-12**: MÉDIO (amarelo) - Mitigar
- **13-25**: ALTO/CRÍTICO (vermelho) - Ação imediata

### 4.2 Riscos Técnicos

| ID | Risco | Probabilidade | Impacto | Severidade | Classificação | Medidas Implementadas |
|----|-------|---------------|---------|------------|---------------|----------------------|
| RT-01 | Acesso não autorizado a prontuários | 3 | 5 | 15 | **ALTO** | MFA, RLS, Logs de auditoria |
| RT-02 | Vazamento de dados por vulnerabilidade | 2 | 5 | 10 | MÉDIO | Criptografia AES-256, TLS 1.3, Rate limiting |
| RT-03 | Perda de dados por falha técnica | 2 | 4 | 8 | MÉDIO | Backup diário, teste mensal, PCN |
| RT-04 | Interceptação de comunicações | 2 | 5 | 10 | MÉDIO | TLS 1.3 obrigatório, sem HTTP |
| RT-05 | Ataque de força bruta em credenciais | 3 | 3 | 9 | MÉDIO | MFA, políticas de senha forte, rate limiting |
| RT-06 | Ransomware | 2 | 5 | 10 | MÉDIO | Backup offline, antivírus, firewall |

### 4.3 Riscos Organizacionais

| ID | Risco | Probabilidade | Impacto | Severidade | Classificação | Medidas Implementadas |
|----|-------|---------------|---------|------------|---------------|----------------------|
| RO-01 | Acesso indevido por colaborador | 2 | 5 | 10 | MÉDIO | RLS, logs de auditoria, revisão trimestral |
| RO-02 | Uso indevido por terceiros (operadores) | 2 | 4 | 8 | MÉDIO | Contratos DPA, certificações (ISO 27001, SOC 2) |
| RO-03 | Falha em processos de descarte | 2 | 3 | 6 | MÉDIO | Política de descarte, trituração obrigatória |
| RO-04 | Não conformidade regulatória | 2 | 5 | 10 | MÉDIO | Auditoria anual, revisão de documentos LGPD |
| RO-05 | Erro humano (compartilhamento indevido) | 3 | 4 | 12 | MÉDIO | Treinamento semestral, termo de confidencialidade |

### 4.4 Riscos aos Titulares

| Tipo de Dano | Probabilidade | Impacto | Exemplos |
|--------------|---------------|---------|----------|
| **Discriminação** | Baixa | Alto | Exposição de diagnósticos de saúde mental, recusa de emprego/seguro |
| **Constrangimento** | Média | Alto | Vazamento de informações íntimas compartilhadas em terapia |
| **Dano moral** | Média | Alto | Violação do sigilo profissional, perda de confiança |
| **Dano material** | Baixa | Moderado | Uso fraudulento de CPF, dados financeiros |
| **Violência/Perseguição** | Rara | Crítico | Exposição de endereço/contato de vítimas de violência |

**Resumo Quantitativo:**
- **Riscos ALTOS (15-25)**: 1 identificado
- **Riscos MÉDIOS (6-12)**: 10 identificados
- **Riscos BAIXOS (1-5)**: 0 identificados

**Risco Geral do Tratamento**: **MÉDIO** (com medidas de mitigação implementadas)

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

## 10. MONITORAMENTO CONTÍNUO

### 10.1 Estrutura de Monitoramento

**Responsável**: Encarregado de Proteção de Dados (DPO)  
**Periodicidade**: Conforme tabela abaixo

| Atividade | Frequência | Responsável | Ferramenta/Método |
|-----------|-----------|-------------|-------------------|
| Revisão de logs de auditoria | Semanal | DPO | Dashboard Supabase + admin_access_log |
| Verificação de acessos não autorizados | Semanal | DPO | Logs de autenticação |
| Teste de backup e restauração | Mensal | Admin TI | Procedimento documentado |
| Revisão de permissões de usuários | Trimestral | DPO | Tabela user_roles |
| Auditoria de conformidade LGPD | Semestral | DPO + Auditor | Checklist ROPA/RIPD |
| Revisão de contratos com operadores | Anual | DPO + Jurídico | Verificação de DPAs |
| Teste de resposta a incidentes | Anual | DPO + Equipe | Simulação (tabletop exercise) |
| Pentest / Avaliação de vulnerabilidades | Anual | Consultor externo | Teste de intrusão |

### 10.2 Indicadores de Desempenho (KPIs de Segurança)

| Indicador | Meta | Medição |
|-----------|------|---------|
| Taxa de conformidade com MFA | >90% dos admins | Mensal |
| Tempo médio de resposta a incidentes | <24h | Por incidente |
| Taxa de sucesso de backup | 100% | Mensal |
| Incidentes de segurança reportados | 0 críticos/ano | Anual |
| Completude de treinamentos LGPD | 100% dos colaboradores | Semestral |

### 10.3 Relatórios de Monitoramento

**Relatório Mensal** (DPO → Sócio-Administrador):
- Logs revisados
- Incidentes detectados
- Alterações de acesso
- Status de backups

**Relatório Anual** (DPO → ANPD, se solicitado):
- Resumo executivo de conformidade
- Incidentes ocorridos e tratados
- Medidas de segurança implementadas
- Plano de melhorias

---

## 11. PRAZO DE VALIDADE E REVISÃO

- **Validade**: 12 meses (até Novembro/2026)
- **Revisão obrigatória em caso de**:
  - Alterações significativas no tratamento de dados
  - Novos sistemas ou funcionalidades
  - Incidentes de segurança relevantes
  - Mudanças na legislação

---

---

## 12. RESPONSÁVEL PELA ELABORAÇÃO E APROVAÇÃO

**Encarregado de Proteção de Dados (DPO):**  
João Felipe Monteiro Dias Bernacchio  
CRP: 06/178261  
E-mail: contato@espacomindware.com.br  
Telefone/WhatsApp: (11) 9.8456-4364

**Data de Elaboração**: Novembro/2025  
**Aprovado por**: João Felipe Monteiro Dias Bernacchio (Sócio-Administrador)

---

## 13. ANEXO A - TABELA DE RASTREABILIDADE DE RISCOS

Esta tabela rastreia o ciclo de vida dos riscos identificados neste RIPD e os controles implementados para mitigá-los.

**Atualização Automática**: Esta tabela é atualizada automaticamente quando:
- Um novo controle de segurança é criado no sistema MindWare
- Um risco muda de status (ex.: "em andamento" → "mitigado")
- Há revisões trimestrais ou anuais de segurança

| ID   | Descrição do Risco                | Origem / Processo               | Impacto Potencial | Controle Implementado                                  | Evidência / Local          | Status       | Próxima Revisão |
| ---- | --------------------------------- | ------------------------------- | ----------------- | ------------------------------------------------------ | -------------------------- | ------------ | --------------- |
| R-01 | Vazamento de dados clínicos       | Acesso indevido a prontuário    | Alto              | Criptografia AES-256 + MFA + logs automáticos          | Norma de Segurança §4.2    | Mitigado     | 11/2026         |
| R-02 | Falha de backup ou perda de dados | Erro de replicação ou corrupção | Médio             | Backup diário + teste mensal + monitoramento           | Logs de backup Mindware    | Mitigado     | 02/2026         |
| R-03 | Acesso indevido por colaborador   | Erro humano ou negligência      | Alto              | Segregação de perfis + treinamento + confidencialidade | Termo de Confidencialidade | Mitigado     | 11/2026         |
| R-04 | Transferência internacional       | Hospedagem Lovable.dev (EUA)    | Médio             | DPA + cláusulas contratuais padrão                     | Contrato Lovable DPA       | Em andamento | 12/2025         |
| R-05 | Consentimento de menores          | Falha na validação documental   | Alto              | Dupla checagem + termo separado + logs                 | Prontuário Digital         | Mitigado     | 05/2026         |

**Legenda de Status:**
- **Mitigado**: Controle implementado e funcionando conforme esperado
- **Em andamento**: Controle em implementação ou aguardando documentação
- **Identificado**: Risco mapeado, controle a ser implementado
- **Aceito**: Risco consciente, sem controle adicional planejado

**Responsável pela Manutenção**: DPO (João Felipe M. D. Bernacchio)  
**Última Atualização**: Novembro/2025

---

## 14. ANEXO METODOLÓGICO - PROCESSO DE AVALIAÇÃO DE RISCO

### 13.1 Metodologia Aplicada

Este RIPD foi elaborado seguindo a metodologia baseada em:
- **ISO 31000:2018** (Gestão de Riscos)
- **NIST Privacy Framework** (Identificação e Gerenciamento de Riscos de Privacidade)
- **Guia Orientativo para Definições de Agentes de Tratamento (ANPD)**

### 13.2 Etapas da Avaliação

**FASE 1 - MAPEAMENTO DE DADOS (Out/2025)**
- **Método**: Entrevista estruturada com DPO e revisão de documentação do sistema
- **Ferramentas**: Análise do código-fonte, esquema do banco de dados, documentação técnica
- **Resultado**: Identificação de 4 categorias de dados (pessoais, sensíveis, financeiros, logs)

**FASE 2 - IDENTIFICAÇÃO DE AMEAÇAS (Out-Nov/2025)**
- **Método**: Brainstorming com equipe técnica + análise STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
- **Ferramentas**: Threat modeling, análise de logs históricos
- **Resultado**: 12 riscos identificados (6 técnicos, 6 organizacionais)

**FASE 3 - AVALIAÇÃO DE PROBABILIDADE E IMPACTO (Nov/2025)**
- **Método**: Matriz de risco 5x5 (Probabilidade × Impacto)
- **Critérios**:
  - Probabilidade: Histórico de incidentes + análise de controles existentes
  - Impacto: Quantidade de titulares + sensibilidade dos dados + potencial de dano
- **Resultado**: 1 risco ALTO, 10 riscos MÉDIOS, 0 riscos BAIXOS

**FASE 4 - ANÁLISE DE CONTROLES EXISTENTES (Nov/2025)**
- **Método**: Auditoria técnica + revisão de políticas internas
- **Verificações**: Criptografia, MFA, RLS, logs, backups, treinamentos
- **Resultado**: Controles adequados implementados, risco residual aceitável

**FASE 5 - DOCUMENTAÇÃO E APROVAÇÃO (Nov/2025)**
- **Método**: Redação do RIPD + revisão pelo DPO + aprovação pela administração
- **Resultado**: Este documento

### 13.3 Participantes da Avaliação

| Nome | Função | Participação |
|------|--------|--------------|
| João Felipe M. D. Bernacchio | DPO / Sócio-Admin | Coordenação geral, aprovação final |
| João Felipe M. D. Bernacchio | Admin Técnico | Mapeamento de dados, avaliação técnica |

### 13.4 Documentação de Apoio Consultada

- Código-fonte do sistema MindWare (React + Supabase)
- Esquema do banco de dados (RLS policies, tabelas, colunas)
- Documentação de operadores (Lovable Cloud, Supabase, FocusNFe, Resend)
- LGPD (Lei 13.709/2018)
- Resolução CFP 001/2009 e 011/2018
- Resolução CD/ANPD nº 15/2024
- ISO 27001 e ISO 27701

### 13.5 Limitações da Avaliação

- Não foi realizado pentest externo (recomendado para próxima revisão)
- Avaliação baseada em cenários prováveis, não exaustivos
- Riscos emergentes (novas ameaças cibernéticas) requerem monitoramento contínuo

---

## 15. CONCLUSÃO

O tratamento de dados pessoais e sensíveis realizado pelo Espaço Mindware Psicologia Ltda. apresenta riscos inerentes à natureza dos serviços de saúde mental. No entanto, com a implementação de controles técnicos robustos, processos organizacionais bem definidos e conformidade com as regulamentações aplicáveis (LGPD, CFP, ANPD), o **risco residual é considerado BAIXO A MÉDIO e ACEITÁVEL**.

As medidas de segurança implementadas são proporcionais aos riscos identificados e garantem a proteção dos direitos e liberdades fundamentais dos titulares.

**Pontuação Média de Risco**: 9,5/25 (MÉDIO)  
**Recomendação**: Manter medidas atuais + implementar monitoramento contínuo conforme Seção 10.

---

**Documento controlado - Propriedade do Espaço Mindware Psicologia Ltda.**  
**Acesso restrito - Confidencial**
