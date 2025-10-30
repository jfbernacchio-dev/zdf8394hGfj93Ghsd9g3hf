# NORMA INTERNA DE SEGURANÇA DA INFORMAÇÃO

**Espaço Mindware Psicologia Ltda.**  
CNPJ: 41.709.325/0001-25  
Última atualização: Novembro/2025

---

## 1. OBJETIVO

Estabelecer as diretrizes obrigatórias de segurança da informação aplicáveis ao tratamento de dados pessoais e sensíveis (clínicos e administrativos) no âmbito do Espaço Mindware Psicologia Ltda., em conformidade com:

- Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
- Resolução CFP 001/2009 (guarda de prontuários)
- Código de Ética Profissional do Psicólogo
- Resolução CFP 011/2018 (telepsicologia)
- Boas práticas de segurança da informação (ISO 27001, OWASP)

---

## 2. ABRANGÊNCIA E APLICABILIDADE

Esta norma aplica-se a:

### 2.1 Pessoas

- **Todos os colaboradores** (efetivos, temporários, estagiários)
- **Psicólogos** (sócios e prestadores de serviços)
- **Administradores** do sistema
- **Prestadores de serviços** que tenham acesso a dados (TI, suporte, consultores)
- **Estagiários** e **estudantes** supervisionados

### 2.2 Sistemas e Ativos

- **Sistema MindWare** (plataforma web de gestão clínica)
- **Banco de dados** (Supabase/Lovable Cloud)
- **Prontuários eletrônicos**
- **Arquivos anexados** (documentos clínicos, imagens)
- **Logs de auditoria**
- **Backups**
- **Credenciais de acesso** (senhas, tokens MFA)
- **Dispositivos** (computadores, tablets, smartphones usados para acesso)

### 2.3 Ambientes

- **Escritório/Consultórios** (acesso local)
- **Home office** (acesso remoto)
- **Dispositivos móveis** (acesso em trânsito)

---

## 3. PRINCÍPIOS FUNDAMENTAIS

### 3.1 Confidencialidade

**Definição**: Apenas pessoas autorizadas podem acessar os dados.

**Aplicação**:
- Dados clínicos são acessíveis apenas ao psicólogo responsável pelo paciente
- Administradores têm acesso para gestão, mas não devem acessar prontuários sem justificativa
- Dados não podem ser compartilhados com terceiros sem consentimento ou base legal

### 3.2 Integridade

**Definição**: As informações devem ser completas, precisas e protegidas contra alterações não autorizadas.

**Aplicação**:
- Prontuários devem refletir fielmente o atendimento realizado
- Alterações em registros clínicos devem ser rastreáveis (logs de auditoria)
- Dados não podem ser adulterados ou corrompidos

### 3.3 Disponibilidade

**Definição**: Dados devem estar acessíveis quando necessário para o trabalho clínico ou administrativo.

**Aplicação**:
- Sistema deve estar disponível durante horário de atendimento
- Backups garantem recuperação em caso de falhas
- Medidas de proteção não devem impedir acesso legítimo

### 3.4 Privacidade

**Definição**: Dados pessoais e sensíveis devem ser tratados com respeito aos direitos dos titulares.

**Aplicação**:
- Coleta apenas de dados necessários para a finalidade clínica
- Transparência sobre uso e compartilhamento de dados
- Garantia dos direitos dos titulares (acesso, correção, eliminação)

---

## 4. PRÁTICAS OBRIGATÓRIAS

### 4.1 Autenticação e Controle de Acesso

#### 4.1.1 Credenciais de Acesso

**OBRIGATÓRIO:**
- ✅ Cada usuário deve ter credenciais **individuais e intransferíveis**
- ✅ Senhas devem ter no mínimo **12 caracteres** (maiúsculas, minúsculas, números, símbolos)
- ✅ Senhas devem ser **alteradas a cada 90 dias**
- ✅ **Não reutilizar** as últimas 5 senhas
- ✅ **Não compartilhar** senhas ou credenciais com terceiros

**PROIBIDO:**
- ❌ Usar senhas fracas (ex: "123456", "senha123", data de nascimento)
- ❌ Anotar senhas em papel ou arquivos não criptografados
- ❌ Usar a mesma senha em outros serviços/sites
- ❌ Compartilhar login com colegas ou estagiários

#### 4.1.2 Autenticação Multifator (MFA)

**OBRIGATÓRIO** para:
- Administradores do sistema
- Acesso a funcionalidades sensíveis (emissão NFSe, configurações)

**RECOMENDADO** para:
- Todos os psicólogos usuários do sistema

**Método**: Aplicativo autenticador (Google Authenticator, Authy) ou SMS

#### 4.1.3 Controle de Sessão

**OBRIGATÓRIO:**
- ✅ **Logout** ao final do expediente ou ao se ausentar
- ✅ **Timeout automático** de 30 minutos de inatividade
- ✅ **Bloqueio de tela** ao se ausentar do computador (Win+L ou Cmd+Ctrl+Q)

**PROIBIDO:**
- ❌ Deixar sessão aberta em computadores compartilhados
- ❌ Acessar o sistema em computadores públicos (lan houses, bibliotecas)

#### 4.1.4 Princípio do Menor Privilégio

**REGRA**: Usuários devem ter apenas as permissões estritamente necessárias para seu trabalho.

**Perfis de Acesso**:
- **Administrador**: Acesso total (gestão de usuários, configurações, todos os pacientes)
- **Psicólogo**: Acesso aos seus próprios pacientes (prontuários, agendamentos, financeiro)

**Revisão**: Permissões devem ser revisadas **trimestralmente** pelo DPO.

---

### 4.2 Proteção de Dados Sensíveis

#### 4.2.1 Criptografia

**APLICADO AUTOMATICAMENTE** pelo sistema:
- Dados sensíveis criptografados em repouso (AES-256)
- Comunicações via HTTPS/TLS 1.3
- Credenciais NFSe criptografadas com chave mestra

**RESPONSABILIDADE DO USUÁRIO**:
- Não armazenar dados clínicos em arquivos locais não criptografados
- Não enviar prontuários por e-mail sem criptografia
- Não fazer capturas de tela de dados sensíveis e armazená-las sem proteção

#### 4.2.2 Armazenamento de Dados

**OBRIGATÓRIO:**
- ✅ Dados clínicos devem ser armazenados **APENAS** no sistema MindWare
- ✅ Arquivos anexados (PDFs, imagens) devem ser enviados via sistema (bucket seguro)

**PROIBIDO:**
- ❌ Armazenar prontuários em:
  - Google Drive pessoal
  - Dropbox pessoal
  - WhatsApp
  - E-mail pessoal
  - Pen drives não criptografados
  - Computadores pessoais sem proteção

**EXCEÇÃO PERMITIDA** (com autorização do DPO):
- Backup local criptografado em disco externo para emergências

#### 4.2.3 Transmissão de Dados

**OBRIGATÓRIO:**
- ✅ Compartilhar dados clínicos apenas via sistema MindWare
- ✅ Se necessário enviar por e-mail, usar criptografia (zip protegido por senha)

**PROIBIDO:**
- ❌ Enviar prontuários por WhatsApp
- ❌ Enviar dados sensíveis por SMS
- ❌ Compartilhar dados em redes sociais ou grupos públicos

---

### 4.3 Dispositivos e Segurança Física

#### 4.3.1 Dispositivos Permitidos

**OBRIGATÓRIO:**
- ✅ Usar apenas dispositivos pessoais com sistema operacional **atualizado**
- ✅ Antivírus instalado e atualizado
- ✅ Firewall ativo

**PROIBIDO:**
- ❌ Acessar sistema em dispositivos compartilhados ou públicos
- ❌ Instalar softwares piratas ou de origem duvidosa
- ❌ Deixar dispositivos sem bloqueio de tela (senha, biometria)

#### 4.3.2 Uso de Dispositivos Móveis

**PERMITIDO** com ressalvas:
- ✅ Acessar sistema via smartphone/tablet para consultas rápidas
- ✅ Usar aplicativos autenticadores para MFA

**PROIBIDO:**
- ❌ Armazenar dados clínicos offline em dispositivos móveis
- ❌ Fazer capturas de tela de prontuários em smartphones
- ❌ Usar Wi-Fi público sem VPN para acessar dados sensíveis

#### 4.3.3 Perda ou Roubo de Dispositivos

**EM CASO DE PERDA/ROUBO**:
1. **Notificar imediatamente o DPO** (privacidade@espacomindware.com.br)
2. Trocar senha do sistema
3. Revogar sessões ativas
4. Registrar Boletim de Ocorrência

---

### 4.4 Backup e Recuperação de Dados

#### 4.4.1 Política de Backup

**APLICADO AUTOMATICAMENTE** pelo sistema:
- Backups diários automáticos (Lovable Cloud/Supabase)
- Retenção de 30 dias de histórico

**TESTE DE RESTAURAÇÃO**:
- Administrador deve testar restauração de backup **mensalmente**
- Documentar resultado dos testes

#### 4.4.2 Plano de Continuidade de Negócios (PCN)

**EM CASO DE INDISPONIBILIDADE DO SISTEMA**:
1. Notificar pacientes sobre reagendamento
2. Registrar atendimentos em papel temporariamente (mínimo necessário)
3. Digitalizar e inserir no sistema assim que possível
4. Destruir registros em papel após digitalização

---

### 4.5 Logs de Auditoria

#### 4.5.1 Registro Automático

**O SISTEMA REGISTRA AUTOMATICAMENTE**:
- Logins e logouts
- Criação, edição e visualização de prontuários
- Emissão de NFS-e
- Alterações de configurações
- Tentativas de acesso não autorizado

#### 4.5.2 Revisão de Logs

**OBRIGATÓRIO**:
- DPO deve revisar logs **semanalmente** para detectar anomalias
- Logs devem ser mantidos por **6 meses**
- Em caso de incidente, logs devem ser preservados por **5 anos**

---

### 4.6 Comunicação Segura

#### 4.6.1 E-mail

**PERMITIDO**:
- Enviar lembretes de consultas (sem detalhes clínicos)
- Enviar NFS-e

**PROIBIDO**:
- ❌ Discutir casos clínicos detalhados por e-mail
- ❌ Enviar diagnósticos ou prontuários completos sem criptografia

#### 4.6.2 WhatsApp e Mensagens

**PERMITIDO** (com cautela):
- Confirmação de consultas
- Avisos de reagendamento

**PROIBIDO**:
- ❌ Discussão de questões clínicas detalhadas
- ❌ Envio de fotos de documentos clínicos
- ❌ Compartilhamento de dados sensíveis

#### 4.6.3 Videochamadas (Telepsicologia)

**OBRIGATÓRIO** (Resolução CFP 011/2018):
- ✅ Usar plataformas com criptografia ponta a ponta (Zoom, Google Meet, Microsoft Teams)
- ✅ Sala de espera virtual ativa
- ✅ Ambiente privado e silencioso

**PROIBIDO**:
- ❌ Gravar sessões sem consentimento explícito
- ❌ Realizar atendimento em ambientes públicos

---

### 4.7 Gestão de Incidentes Menores

#### 4.7.1 Definição de Incidente Menor

**Incidente menor**: Evento de segurança que **NÃO envolve** dados pessoais ou sensíveis, mas pode impactar operações ou segurança.

**Exemplos:**
- Falha temporária de sistema sem exposição de dados
- Tentativa de acesso bloqueada por controles de segurança
- Erro de configuração sem impacto em dados
- Indisponibilidade de serviço não crítico

#### 4.7.2 Gestão de Incidentes Menores

**OBRIGATÓRIO:**
- ✅ Registrar em livro interno (não requer notificação à ANPD)
- ✅ Investigar causa raiz
- ✅ Implementar correção
- ✅ Documentar lição aprendida

**Responsável**: Administrador TI + DPO (apenas para ciência)

**Prazo de registro**: 7 dias após ocorrência

---

### 4.8 Gestão de Terceiros e Operadores

#### 4.8.1 Política de Gestão de Fornecedores

**OBRIGATÓRIO** para todos os operadores e fornecedores com acesso a dados:

**ANTES DA CONTRATAÇÃO:**
- ✅ Avaliar certificações de segurança (ISO 27001, SOC 2)
- ✅ Verificar conformidade com LGPD
- ✅ Solicitar política de privacidade e segurança

**DURANTE A CONTRATAÇÃO:**
- ✅ Incluir cláusulas contratuais obrigatórias:
  - Responsabilidade sobre proteção de dados
  - Dever de confidencialidade
  - Notificação de incidentes em até 24h
  - Direito de auditoria pelo controlador
  - Prazo e forma de descarte de dados
  - Transferência internacional (se aplicável) com salvaguardas
  - Responsabilidade solidária em caso de dano
  - Subcontratação apenas com autorização prévia

**DURANTE A VIGÊNCIA:**
- ✅ Revisar contratos anualmente
- ✅ Monitorar conformidade (relatórios, certificações atualizadas)
- ✅ Avaliar incidentes reportados pelo operador

**NO ENCERRAMENTO:**
- ✅ Solicitar certificado de descarte/devolução de dados
- ✅ Revogar todos os acessos

#### 4.8.2 Contratos com Operadores Atuais

| Operador | Função | Status Contratual | Data de Revisão |
|----------|--------|-------------------|-----------------|
| Lovable Cloud/Supabase | Hospedagem e BD | Termos de Serviço aceitos | Revisar Anual |
| FocusNFe | Emissão NFSe | Contrato ativo | Revisar Anual |
| Resend | E-mail transacional | Termos de Serviço aceitos | Revisar Anual |

**Ação Requerida**: Solicitar Data Processing Agreement (DPA) assinado de cada operador (vide Seção 11.1)

#### 4.8.3 Fornecedores de TI/Suporte

**OBRIGATÓRIO**:
- ✅ Assinar Termo de Confidencialidade antes de acessar sistemas
- ✅ Acesso temporário e supervisionado
- ✅ Revogação de acesso imediatamente após serviço
- ✅ Proibição de copiar ou extrair dados

---

---

### 4.9 Descarte Seguro de Dados

#### 4.9.1 Dados Eletrônicos

**OBRIGATÓRIO** (após prazo de retenção de 5 anos):
- Eliminação irrecuperável do banco de dados (wipe total)
- Documentar data e responsável pela eliminação

#### 4.9.2 Documentos em Papel

**OBRIGATÓRIO**:
- ✅ Triturar documentos com dados sensíveis antes de descartar
- ✅ Não jogar prontuários ou documentos clínicos em lixo comum

#### 4.9.3 Dispositivos

**OBRIGATÓRIO** (ao descartar computador, HD, pen drive):
- Formatação completa com ferramentas de wipe (múltiplas passagens)
- Destruição física se dispositivo for descartado

---

## 5. RESPONSABILIDADES

### 5.1 Encarregado de Proteção de Dados (DPO)

**Nome**: João Felipe Monteiro Dias Bernacchio  
**E-mail**: privacidade@espacomindware.com.br

**Atribuições**:
- ✅ Supervisionar conformidade com esta norma
- ✅ Revisar logs de auditoria semanalmente
- ✅ Coordenar resposta a incidentes de segurança
- ✅ Treinar colaboradores em segurança da informação
- ✅ Atualizar esta norma anualmente
- ✅ Atender solicitações de titulares (direitos LGPD)
- ✅ Representar a empresa perante a ANPD

### 5.2 Administrador do Sistema / TI

**Nome**: [Nome do responsável técnico ou DPO se acumulado]

**Atribuições**:
- ✅ Manter infraestrutura segura e atualizada
- ✅ Aplicar patches de segurança prontamente
- ✅ Gerenciar backups e testar restauração mensalmente
- ✅ Monitorar tentativas de acesso não autorizado
- ✅ Implementar melhorias de segurança
- ✅ Apoiar DPO em investigações de incidentes
- ✅ Gerenciar permissões de acesso

### 5.3 Psicólogos e Colaboradores

**Atribuições**:
- ✅ Cumprir todas as práticas obrigatórias desta norma
- ✅ Proteger credenciais de acesso
- ✅ Reportar imediatamente qualquer incidente ou suspeita
- ✅ Participar de treinamentos de segurança
- ✅ Manter sigilo profissional (Código de Ética CFP)
- ✅ Não compartilhar dados clínicos sem autorização
- ✅ Fazer logout ao final do expediente

### 5.4 Sócio-Administrador

**Nome**: João Felipe Monteiro Dias Bernacchio

**Atribuições**:
- ✅ Aprovar investimentos em segurança da informação
- ✅ Garantir recursos para conformidade com LGPD
- ✅ Aplicar medidas disciplinares em caso de violação desta norma
- ✅ Representar a empresa em processos legais
- ✅ Assinar contratos com operadores

---

## 6. TREINAMENTO E CONSCIENTIZAÇÃO

### 6.1 Plano Anual de Conscientização em Proteção de Dados

| Atividade | Público-Alvo | Periodicidade | Duração | Formato | Responsável |
|-----------|--------------|---------------|---------|---------|-------------|
| **Treinamento Inicial LGPD** | Novos colaboradores | Na admissão | 2 horas | Presencial ou online | DPO |
| **Treinamento Continuado** | Todos os colaboradores | Semestral (Jan e Jul) | 1 hora | Workshop presencial | DPO |
| **Simulação de Incidentes** | DPO + Admin TI | Anual | 2 horas | Tabletop exercise | DPO |
| **Atualização Legislação** | Todos os colaboradores | Conforme necessário | 30 min | E-mail + reunião | DPO |
| **Conscientização Contínua** | Todos | Mensal | 5 min | E-mail com dica de segurança | DPO |

### 6.2 Treinamento Inicial (Admissão)

**OBRIGATÓRIO** para todos os novos colaboradores:

**CONTEÚDO (2 horas)**:
1. **Módulo 1 - Fundamentos da LGPD (30 min)**
   - Princípios da LGPD
   - Direitos dos titulares
   - Bases legais para tratamento
   - Papel do DPO

2. **Módulo 2 - Norma de Segurança do Espaço Mindware (45 min)**
   - Práticas obrigatórias desta norma
   - Senhas seguras e MFA
   - Gestão de dispositivos
   - Comunicação segura

3. **Módulo 3 - Ética e Sigilo Profissional (30 min)**
   - Código de Ética do CFP
   - Sigilo profissional em ambiente digital
   - Casos práticos

4. **Módulo 4 - Resposta a Incidentes (15 min)**
   - Como identificar um incidente
   - Como reportar ao DPO
   - Contatos de emergência

**AVALIAÇÃO**: Questionário de 10 perguntas (mínimo 70% de acertos)  
**CERTIFICADO**: Emitido ao final e arquivado no prontuário do colaborador

### 6.3 Treinamento Continuado (Semestral)

**FREQUÊNCIA**: Janeiro e Julho de cada ano

**PÚBLICO**: Todos os colaboradores (presença obrigatória)

**CONTEÚDO (1 hora)**:
- Revisão das práticas obrigatórias
- Novos riscos e ameaças (phishing, ransomware, engenharia social)
- Casos reais de incidentes (anonimizados)
- Atualizações da legislação ou desta norma
- Sessão de perguntas e respostas

**FORMATO**: Workshop presencial com dinâmicas práticas

### 6.4 Conscientização Contínua

**MÉTODOS**:

| Método | Frequência | Conteúdo | Responsável |
|--------|-----------|----------|-------------|
| **E-mail Mensal** | Mensal | Dica de segurança do mês (phishing, senhas, dispositivos) | DPO |
| **Cartaz nos Consultórios** | Permanente | "Lembre-se: Faça logout ao final do expediente" | DPO |
| **Alerta no Sistema** | Trimestral | Pop-up com lembrete sobre boas práticas | Admin TI |
| **Newsletter Interna** | Trimestral | Resumo de atualizações em segurança/LGPD | DPO |

### 6.5 Registro de Treinamentos

**OBRIGATÓRIO**: Manter registro de todos os treinamentos realizados, incluindo:
- Data, horário e local
- Lista de presença assinada
- Conteúdo abordado
- Avaliações aplicadas (se houver)
- Certificados emitidos

**Prazo de guarda**: 5 anos

**Responsável**: DPO

---

## 7. SANÇÕES E MEDIDAS DISCIPLINARES

O descumprimento desta norma pode resultar em:

### 7.1 Advertência Verbal
- Primeira violação não intencional e sem dano

### 7.2 Advertência Formal por Escrito
- Violação reincidente ou com risco potencial

### 7.3 Suspensão Temporária
- Violação grave com dano moderado aos titulares
- Compartilhamento indevido de credenciais
- Armazenamento de dados em locais não autorizados

### 7.4 Rescisão de Contrato / Desligamento
- Violação grave intencional
- Vazamento deliberado de dados
- Acesso não autorizado reiterado
- Compartilhamento de dados sensíveis com terceiros não autorizados

### 7.5 Medidas Legais
- Processos cíveis por danos materiais e morais
- Denúncia ao Conselho Federal de Psicologia (violação ética)
- Comunicação à ANPD (se aplicável)

---

## 8. MONITORAMENTO E REVISÃO

### 8.1 Monitoramento Contínuo

**FERRAMENTAS**:
- Logs de auditoria do sistema
- Relatórios de tentativas de acesso não autorizado
- Alertas de anomalias de segurança

**FREQUÊNCIA**:
- Revisão semanal de logs pelo DPO
- Auditoria trimestral de permissões de acesso
- Teste mensal de backup

### 8.2 Revisão da Norma

**PERIODICIDADE**: Anual (ou sempre que necessário)

**GATILHOS PARA REVISÃO EXTRAORDINÁRIA**:
- Incidentes de segurança relevantes
- Mudanças na legislação (LGPD, CFP)
- Implementação de novos sistemas
- Recomendações de auditoria ou ANPD

**ÚLTIMA REVISÃO**: Novembro/2025  
**PRÓXIMA REVISÃO**: Novembro/2026

### 8.3 Auditoria Interna

**FREQUÊNCIA**: Anual

**ESCOPO**:
- Conformidade com esta norma
- Efetividade dos controles de segurança
- Testes de intrusão (pentest)
- Revisão de contratos com operadores
- Avaliação de riscos (RIPD)

**RESPONSÁVEL**: DPO + Auditor externo (se aplicável)

---

## 9. REFERÊNCIAS NORMATIVAS

Esta norma foi elaborada com base em:

- **Lei Geral de Proteção de Dados** (Lei nº 13.709/2018)
- **Resolução CFP 001/2009** (guarda de prontuários)
- **Resolução CFP 011/2018** (telepsicologia)
- **Código de Ética Profissional do Psicólogo**
- **Resolução CD/ANPD nº 15/2024** (comunicação de incidentes)
- **ISO/IEC 27001:2022** (Gestão de Segurança da Informação)
- **ISO/IEC 27701:2019** (Gestão de Privacidade)
- **OWASP Top 10** (Segurança de Aplicações Web)
- **NIST Cybersecurity Framework**

---

## 10. GESTÃO DE FORNECEDORES - DPAs (Data Processing Agreements)

### 10.1 Necessidade de Data Processing Agreements (DPAs)

Conforme LGPD Art. 39, operadores devem **celebrar contrato com o controlador** que estabeleça:
- Objeto e duração do tratamento
- Natureza e finalidade do tratamento
- Tipo de dados e categorias de titulares
- Obrigações e direitos do controlador

**Status Atual**: Termos de Serviço aceitos, mas **falta DPA assinado** bilateral.

### 10.2 Ações Requeridas (Vulnerabilidade Identificada)

| Operador | Ação | Prazo | Responsável |
|----------|------|-------|-------------|
| Lovable Cloud/Supabase | Solicitar DPA assinado ou confirmar adequação dos Termos de Serviço | 90 dias | DPO |
| FocusNFe | Revisar contrato e incluir cláusulas LGPD explícitas | 90 dias | DPO |
| Resend | Solicitar DPA ou confirmar conformidade com LGPD | 90 dias | DPO |

**Alternativa**: Se DPA assinado não for possível, documentar análise de risco e justificar adequação dos Termos de Serviço existentes com base em certificações internacionais (ISO 27001, SOC 2).

---

## 11. TERMO DE CIÊNCIA E COMPROMISSO

### DECLARAÇÃO DE CIÊNCIA

Eu, ________________________________________________, [Cargo/Função], declaro que:

1. Recebi, li e compreendi integralmente a **Norma Interna de Segurança da Informação** do Espaço Mindware Psicologia Ltda.

2. Comprometo-me a cumprir todas as práticas obrigatórias descritas neste documento.

3. Estou ciente de que o descumprimento pode resultar em medidas disciplinares, incluindo rescisão de contrato e medidas legais.

4. Comprometo-me a manter sigilo profissional e confidencialidade sobre todos os dados pessoais e sensíveis a que tiver acesso.

5. Comprometo-me a reportar imediatamente ao DPO qualquer incidente ou suspeita de violação de segurança.

6. Reconheço a importância da proteção de dados para a privacidade dos pacientes e a reputação da organização.

**Local**: _________________________  
**Data**: ___/___/_____

**Assinatura**: _______________________________________

---

## 11. CONTROLE DE VERSÕES

| Versão | Data | Responsável | Alterações |
|--------|------|-------------|------------|
| 1.0 | Nov/2025 | João Felipe Bernacchio | Criação do documento |

---

## 12. APROVAÇÃO

**Elaborado por:**  
João Felipe Monteiro Dias Bernacchio  
Encarregado de Proteção de Dados (DPO)  
Data: Novembro/2025

**Aprovado por:**  
João Felipe Monteiro Dias Bernacchio  
Sócio-Administrador  
Data: Novembro/2025

---

**Documento controlado - Propriedade do Espaço Mindware Psicologia Ltda.**  
**Distribuição obrigatória a todos os colaboradores**  
**Revisão anual obrigatória**

---

## ANEXO - CHECKLIST DE SEGURANÇA DIÁRIO

**Use este checklist para garantir conformidade diária:**

☐ Fiz login com minhas credenciais individuais  
☐ Minha senha é forte (12+ caracteres)  
☐ MFA está ativo (se sou admin)  
☐ Fiz logout ao me ausentar do computador  
☐ Não compartilhei minha senha com ninguém  
☐ Não armazenei dados clínicos fora do sistema MindWare  
☐ Não enviei dados sensíveis por WhatsApp ou e-mail sem criptografia  
☐ Revisei logs de auditoria (se sou DPO)  
☐ Fiz logout ao final do expediente  

**Em caso de dúvida ou incidente, contactar:**  
DPO: privacidade@espacomindware.com.br
