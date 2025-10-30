# RUNBOOK DE RESPOSTA A INCIDENTES DE SEGURANÇA (RCIS)

**Espaço Mindware Psicologia Ltda.**  
CNPJ: 41.709.325/0001-25  
Última atualização: Novembro/2025

Elaborado em conformidade com a Resolução CD/ANPD nº 15/2024

---

## 1. OBJETIVO

Definir os procedimentos de identificação, classificação, resposta e comunicação de incidentes de segurança envolvendo dados pessoais e sensíveis tratados pelo Espaço Mindware Psicologia Ltda., em conformidade com a Lei Geral de Proteção de Dados (LGPD) e a Resolução CD/ANPD nº 15/2024.

---

## 2. DEFINIÇÃO DE INCIDENTE DE SEGURANÇA

Considera-se **incidente de segurança da informação** qualquer evento não autorizado, ilícito ou acidental que comprometa:

- **Confidencialidade**: acesso não autorizado a dados pessoais/sensíveis
- **Integridade**: alteração, destruição ou corrupção de dados
- **Disponibilidade**: indisponibilidade de acesso a dados ou sistemas

### 2.1 Exemplos de Incidentes

**Incidentes de Confidencialidade:**
- Acesso não autorizado a prontuários eletrônicos
- Vazamento de dados por invasão (hacking)
- Divulgação acidental de informações clínicas
- Perda ou roubo de dispositivos com dados
- Compartilhamento indevido de credenciais

**Incidentes de Integridade:**
- Alteração não autorizada de prontuários
- Corrupção de dados por malware
- Modificação maliciosa de registros

**Incidentes de Disponibilidade:**
- Ataques de negação de serviço (DDoS)
- Ransomware que torne dados inacessíveis
- Falhas técnicas que impeçam acesso ao sistema
- Perda de dados por falha de backup

---

## 3. CLASSIFICAÇÃO DE SEVERIDADE

A severidade do incidente deve ser avaliada considerando:
- Número de titulares afetados
- Tipo de dado exposto (pessoal vs. sensível)
- Possibilidade de dano aos titulares
- Contexto e circunstâncias do incidente

### 3.1 Níveis de Severidade

#### NÍVEL 1 - BAIXO (SEM RISCO RELEVANTE)

**Características:**
- Incidente contido internamente sem exposição externa
- Dados não sensíveis ou não identificáveis
- Nenhum titular foi ou será prejudicado
- Não há risco de dano moral, material ou discriminação

**Exemplos:**
- Tentativa de acesso bloqueada por controles de segurança
- Erro interno sem exposição de dados
- Falha técnica rapidamente corrigida sem impacto
- Log de auditoria detecta e previne acesso não autorizado

**Comunicação obrigatória à ANPD**: NÃO

#### NÍVEL 2 - MÉDIO (RISCO MODERADO)

**Características:**
- Dados pessoais (não sensíveis) foram acessados indevidamente
- Número limitado de titulares afetados (< 10)
- Risco de dano é possível mas improvável
- Medidas corretivas foram rapidamente implementadas

**Exemplos:**
- Acesso acidental por outro profissional da clínica
- Envio de e-mail para destinatário incorreto (1-2 pacientes)
- Exposição temporária de dados sem evidência de cópia/uso malicioso

**Comunicação obrigatória à ANPD**: AVALIAR CASO A CASO

#### NÍVEL 3 - ALTO (DANO RELEVANTE)

**Características:**
- Dados sensíveis de saúde foram expostos ou acessados
- Número significativo de titulares afetados (≥ 10)
- **Risco relevante** de dano aos titulares (Art. 48 da LGPD)
- Possibilidade de discriminação, constrangimento ou dano moral
- Incidentes que podem violar sigilo profissional

**Exemplos:**
- Vazamento de prontuários eletrônicos para internet
- Ataque ransomware com exfiltração de dados
- Divulgação pública de dados clínicos
- Invasão de sistema com acesso a múltiplos pacientes
- Perda de backup não criptografado
- Compartilhamento indevido com terceiros não autorizados

**Comunicação obrigatória à ANPD**: **SIM** (até 3 dias úteis)  
**Comunicação aos titulares**: **SIM** (prazo razoável)

---

## 4. PROCEDIMENTOS DE RESPOSTA

### 4.1 FASE 1 - IDENTIFICAÇÃO E REGISTRO (0-24h)

**Responsável**: Qualquer pessoa que detectar o incidente

**Ações obrigatórias:**

1. **Identificar e documentar o incidente** imediatamente:
   - Data e hora da detecção
   - Descrição do ocorrido
   - Sistema/dados potencialmente afetados
   - Como o incidente foi descoberto

2. **Notificar o DPO** em até **24 horas**:
   - E-mail: contato@espacomindware.com.br
   - Telefone: (11) 9.8456-4364
   - WhatsApp: (11) 9.8456-4364

3. **Preservar evidências**:
   - Não apagar logs ou registros
   - Tirar capturas de tela
   - Documentar tudo que for observado

**Ferramentas:**
- Formulário de Registro de Incidente (Anexo A)
- Logs do sistema (Lovable Cloud/Supabase)
- Screenshots de evidências

---

### 4.2 FASE 2 - AVALIAÇÃO E CONTENÇÃO (24-48h)

**Responsável**: DPO + Administrador do Sistema

**Ações obrigatórias:**

1. **Avaliar o impacto**:
   - Quantos titulares foram afetados?
   - Quais dados foram expostos (pessoais/sensíveis)?
   - Há risco relevante de dano aos titulares?
   - Classificar a severidade (Nível 1, 2 ou 3)

2. **Conter o incidente**:
   - Bloquear acessos não autorizados
   - Isolar sistemas comprometidos
   - Revogar credenciais comprometidas
   - Ativar MFA emergencial se necessário
   - Restaurar dados de backup se aplicável

3. **Documentar todas as ações tomadas**

**Ferramentas:**
- Matriz de Avaliação de Risco (Anexo B)
- Logs de auditoria do sistema
- Controles de acesso (RLS, roles)

---

### 4.3 FASE 3 - NOTIFICAÇÃO (48-72h)

**Responsável**: DPO

**Ações por nível de severidade:**

#### Se NÍVEL 3 (Alto):

**NOTIFICAÇÃO À ANPD** - Obrigatória em até **3 dias úteis**

**Canal**: Formulário eletrônico no site da ANPD  
**Conteúdo mínimo (Art. 4º da Resolução ANPD nº 15/2024):**
- Descrição da natureza dos dados afetados
- Informações sobre os titulares afetados (quantidade e categorias)
- Data e hora do incidente
- Data e hora da ciência pelo controlador
- Medidas técnicas e de segurança adotadas
- Riscos relacionados ao incidente
- Medidas que foram ou serão adotadas para mitigar
- Indicação de comunicação aos titulares (sim/não e justificativa)

**NOTIFICAÇÃO AOS TITULARES** - Obrigatória se houver risco relevante

**Meio**: E-mail, telefone ou carta registrada  
**Conteúdo mínimo (Art. 48 da LGPD):**
- Descrição do incidente (linguagem clara e acessível)
- Dados afetados
- Medidas tomadas para mitigar
- Medidas de segurança adotadas pelo controlador
- Riscos para o titular
- Recomendações de proteção (ex: trocar senhas, ativar MFA)
- Contato do DPO para esclarecimentos

**Modelo de Comunicação**: Ver Anexo C

#### Se NÍVEL 1 ou 2 (Baixo/Médio):

- **Registro interno** no Livro de Incidentes (manter por 5 anos)
- **Análise** de necessidade de comunicação à ANPD (avaliar caso a caso)
- **Notificação aos titulares** apenas se identificado risco relevante

---

### 4.4 FASE 4 - INVESTIGAÇÃO E CORREÇÃO (3-30 dias)

**Responsável**: DPO + Administrador do Sistema + Equipe Técnica

**Ações obrigatórias:**

1. **Investigar a causa raiz**:
   - Como o incidente ocorreu?
   - Quais controles falharam?
   - Havia vulnerabilidades conhecidas?
   - Foi erro humano ou ataque externo?

2. **Implementar correções permanentes**:
   - Corrigir vulnerabilidades identificadas
   - Atualizar sistemas e aplicar patches
   - Revisar políticas e procedimentos
   - Reforçar controles de segurança

3. **Atualizar documentação**:
   - ROPA (se necessário)
   - RIPD (se houver nova análise de risco)
   - Norma de Segurança

4. **Treinar colaboradores** (se incidente envolveu erro humano)

---

### 4.5 FASE 5 - ENCERRAMENTO E REGISTRO (30+ dias)

**Responsável**: DPO

**Ações obrigatórias:**

1. **Elaborar relatório final do incidente**:
   - Resumo executivo
   - Cronologia detalhada
   - Causa raiz identificada
   - Medidas corretivas implementadas
   - Lições aprendidas
   - Recomendações para prevenção futura

2. **Arquivar no Livro de Incidentes**:
   - Manter registrado por **5 anos**
   - Incluir todas as evidências e comunicações
   - Disponibilizar para auditoria se solicitado

3. **Comunicar encerramento à ANPD** (se foi notificada):
   - Informar resolução do incidente
   - Relatar medidas corretivas implementadas

4. **Revisar e atualizar este Runbook** se necessário

---

## 5. RESPONSABILIDADES

### 5.1 Encarregado de Proteção de Dados (DPO)

**Nome**: João Felipe Monteiro Dias Bernacchio  
**E-mail**: contato@espacomindware.com.br  
**Telefone**: (11) 9.8456-4364

**Atribuições:**
- Coordenar a resposta ao incidente
- Avaliar severidade e classificar risco
- Decidir sobre comunicação à ANPD e titulares
- Elaborar notificações e relatórios
- Representar a empresa perante a ANPD
- Manter registro de todos os incidentes

### 5.2 Administrador do Sistema / TI

**Nome**: [Nome do responsável técnico]  
**E-mail**: [E-mail]  
**Telefone**: [Telefone]

**Atribuições:**
- Implementar medidas técnicas de contenção
- Investigar causa raiz técnica
- Restaurar sistemas e dados
- Aplicar correções e patches
- Gerar logs e evidências técnicas
- Apoiar o DPO com informações técnicas

### 5.3 Psicólogos e Colaboradores

**Atribuições:**
- Reportar imediatamente qualquer suspeita de incidente
- Preservar evidências
- Colaborar com a investigação
- Seguir orientações do DPO
- Participar de treinamentos de resposta a incidentes

### 5.4 Sócio-Administrador

**Nome**: João Felipe Monteiro Dias Bernacchio  
**Atribuições:**
- Aprovar comunicações públicas
- Autorizar investimentos em correções
- Representar a empresa em processos legais
- Decidir sobre medidas administrativas (desligamentos, etc.)
- **OBRIGAÇÃO CRÍTICA**: Reportar incidentes de **risco relevante** à ANPD em até **3 dias úteis** sob pena de sanção administrativa (Art. 48 e 52 da LGPD)

---

## 6. REGISTRO E ARQUIVAMENTO

### 6.1 Livro de Registro de Incidentes

**Localização**: [Sistema de gestão documental / pasta segura]  
**Responsável**: DPO  
**Prazo de guarda**: 5 anos

**Informações obrigatórias para cada incidente:**
- Número sequencial do incidente
- Data e hora da detecção
- Descrição do incidente
- Classificação de severidade
- Titulares afetados (quantidade e categorias)
- Dados expostos/comprometidos
- Causa raiz identificada
- Medidas corretivas implementadas
- Comunicações realizadas (ANPD, titulares)
- Responsável pelo tratamento
- Status: Aberto / Em investigação / Resolvido / Encerrado

### 6.2 Documentos Anexos

Manter arquivados junto ao registro:
- Formulário de Registro de Incidente (Anexo A)
- Matriz de Avaliação de Risco (Anexo B)
- Cópias de comunicações à ANPD
- Cópias de comunicações aos titulares
- Prints de evidências
- Logs de auditoria relevantes
- Relatório final do incidente

---

## 7. COMUNICAÇÃO INTERNA E EXTERNA

### 7.1 Comunicação Interna

**Princípios:**
- Transparência: informar todos os colaboradores afetados
- Confidencialidade: limitar informações sensíveis a quem precisa saber
- Tempestividade: comunicar rapidamente para evitar agravamento

**Canais:**
- E-mail institucional
- Reunião de equipe (casos graves)
- Comunicado interno formal

### 7.2 Comunicação à ANPD

**Canal oficial**: Sistema eletrônico no site da ANPD  
**URL**: https://www.gov.br/anpd  
**Prazo**: Até 3 dias úteis para incidentes de **risco relevante**

**Atenção**: A ANPD pode solicitar informações complementares em até 30 dias.

### 7.3 Comunicação aos Titulares

**Obrigatória quando:**
- Houver risco relevante aos direitos e liberdades do titular
- Dados sensíveis forem expostos
- Houver possibilidade de dano (discriminação, constrangimento, prejuízo material)

**Dispensada quando:**
- Medidas técnicas de proteção tornaram dados ininteligíveis (ex: criptografia robusta)
- Controlador adotou medidas imediatas que reduzem risco
- Comunicação demandaria esforço desproporcional (nesse caso, fazer comunicação pública)

**Modelo**: Ver Anexo C

### 7.4 Comunicação Pública

Em casos de incidentes de alto impacto (múltiplos titulares, grande repercussão):
- Publicar comunicado no site institucional
- Disponibilizar FAQ para titulares
- Reforçar canal de atendimento do DPO

---

## 8. PREVENÇÃO E TREINAMENTO

### 8.1 Medidas Preventivas

**Técnicas:**
- Manter sistemas atualizados e com patches de segurança
- Revisar logs de auditoria semanalmente
- Realizar testes de intrusão anuais
- Implementar detecção de anomalias
- Backup diário com teste de restauração mensal

**Organizacionais:**
- Treinar colaboradores em segurança da informação (semestral)
- Simular incidentes para testar este Runbook (anual)
- Revisar e atualizar políticas de segurança (anual)
- Auditar acessos e permissões (trimestral)

### 8.2 Treinamento de Resposta

**Frequência**: Anual (ou após cada incidente relevante)  
**Público**: Todos os colaboradores + DPO + TI  
**Conteúdo**:
- Como identificar um incidente
- Como reportar ao DPO
- Simulação de cenários
- Revisão deste Runbook

---

## 9. FLUXOGRAMA DE RESPOSTA

```
INCIDENTE DETECTADO
         ↓
REGISTRO EM ATÉ 24H + NOTIFICAÇÃO AO DPO
         ↓
AVALIAÇÃO DE SEVERIDADE (DPO + TI)
         ↓
    ┌────┴────┐
NÍVEL 1/2     NÍVEL 3
(Baixo/Médio) (Alto)
    ↓             ↓
CONTENÇÃO     CONTENÇÃO +
              NOTIFICAÇÃO ANPD (3 dias)
              NOTIFICAÇÃO TITULARES
    ↓             ↓
    └────┬────┘
         ↓
INVESTIGAÇÃO E CORREÇÃO
         ↓
RELATÓRIO FINAL + REGISTRO NO LIVRO
         ↓
ENCERRAMENTO
```

---

## 10. CONTATOS DE EMERGÊNCIA

### 10.1 Internos

| Função | Nome | Telefone | E-mail | Canal Alternativo |
|--------|------|----------|--------|-------------------|
| DPO (Principal) | João Felipe M. D. Bernacchio | (11) 9.8456-4364 | contato@espacomindware.com.br | WhatsApp: (11) 9.8456-4364 |
| Administrador TI | João Felipe M. D. Bernacchio | (11) 9.8456-4364 | contato@espacomindware.com.br | SMS |
| Sócio-Administrador | João Felipe M. D. Bernacchio | (11) 9.8456-4364 | contato@espacomindware.com.br | SMS |

**Canal Alternativo (caso e-mail DPO indisponível)**:
1. WhatsApp do DPO: (11) 9.8456-4364
2. Telefone do Sócio-Administrador: (11) 9.8456-4364
3. SMS para: (11) 9.8456-4364
4. Se nenhum canal funcionar: Registrar incidente em papel e enviar carta registrada ao endereço da clínica

### 10.2 Externos

| Entidade | Contato | Observações |
|----------|---------|-------------|
| ANPD | https://www.gov.br/anpd/pt-br<br>comunicacao.incidentes@anpd.gov.br | Notificação obrigatória de incidentes de risco relevante |
| Lovable Cloud Suporte | support@lovable.app | Incidentes de infraestrutura |
| FocusNFe Suporte | contato@acrasstudio.com.br<br>Telefone: +55 (45) 3026-5231 | Incidentes relacionados a NFSe |
| Conselho Federal de Psicologia | (61) 2109-0100<br>cfp@cfp.org.br | Denúncias de violação ética |
| Polícia Federal - Crimes Cibernéticos | 197 ou delegacia mais próxima | Em caso de invasão/crime cibernético |

---

## 11. MODELOS E ANEXOS

### ANEXO A - Formulário de Registro de Incidente

**FORMULÁRIO DE REGISTRO DE INCIDENTE DE SEGURANÇA**

**Número do Incidente**: [Sequencial AAAA-NNN]  
**Data/Hora da Detecção**: ___/___/_____ às _____:_____  
**Detectado por**: ______________________________  

**1. Descrição do Incidente:**
[Descrever o que aconteceu, como foi descoberto]

**2. Sistemas/Dados Afetados:**
[ ] Prontuários eletrônicos  
[ ] Dados cadastrais  
[ ] Dados financeiros  
[ ] Logs de auditoria  
[ ] Outro: _________________

**3. Titulares Afetados:**
Quantidade aproximada: _______  
Categorias: [ ] Adultos [ ] Menores [ ] Responsáveis

**4. Tipo de Incidente:**
[ ] Acesso não autorizado  
[ ] Vazamento de dados  
[ ] Perda/roubo de dispositivo  
[ ] Ataque cibernético  
[ ] Erro humano  
[ ] Falha técnica  
[ ] Outro: _________________

**5. Evidências Coletadas:**
[ ] Logs de sistema  
[ ] Screenshots  
[ ] E-mails  
[ ] Relato de testemunha  
[ ] Outro: _________________

**6. Ações Imediatas Tomadas:**
[Descrever]

**Data/Hora do Registro**: ___/___/_____ às _____:_____  
**Responsável pelo Registro**: ______________________________

---

### ANEXO B - Matriz de Avaliação de Risco

**AVALIAÇÃO DE RISCO DO INCIDENTE**

**Incidente nº**: [AAAA-NNN]  
**Avaliado por**: [DPO]  
**Data**: ___/___/_____

| Critério | Pontuação (1-5) | Justificativa |
|----------|-----------------|---------------|
| Quantidade de titulares afetados | [ ] | 1=<5, 2=5-10, 3=10-50, 4=50-100, 5=>100 |
| Sensibilidade dos dados | [ ] | 1=não sensível, 3=pessoal, 5=saúde |
| Possibilidade de dano ao titular | [ ] | 1=nenhum, 3=moderado, 5=alto |
| Contexto do incidente | [ ] | 1=interno contido, 3=exposição limitada, 5=público |
| Medidas de proteção existentes | [ ] | 1=nenhuma, 3=parcial, 5=criptografado |

**Pontuação Total**: _______  
**Classificação de Risco**:
- 5-10 pontos = NÍVEL 1 (Baixo)
- 11-18 pontos = NÍVEL 2 (Médio)
- 19-25 pontos = NÍVEL 3 (Alto)

**Decisão:**
[ ] Registro interno apenas  
[ ] Avaliar comunicação à ANPD  
[ ] Comunicação obrigatória à ANPD e titulares

---

### ANEXO C - Modelo de Comunicação aos Titulares

**ASSUNTO: Comunicação Importante sobre Segurança de Dados - Espaço Mindware**

Prezado(a) [Nome do Paciente],

Entramos em contato para informá-lo(a) sobre um incidente de segurança ocorrido em [data], que pode ter afetado seus dados pessoais em nosso sistema.

**O que aconteceu?**  
[Descrição clara e objetiva do incidente, ex: "Nosso sistema foi alvo de um acesso não autorizado que comprometeu dados de alguns pacientes"]

**Quais dados foram afetados?**  
[Especificar: ex: "Nome, CPF, e-mail e histórico de consultas"]

**O que fizemos imediatamente?**  
- [Medida 1: ex: "Bloqueamos o acesso não autorizado"]
- [Medida 2: ex: "Reforçamos nossos controles de segurança"]
- [Medida 3: ex: "Notificamos a Autoridade Nacional de Proteção de Dados (ANPD)"]

**Quais são os riscos para você?**  
[Explicar riscos potenciais, ex: "Há risco de que terceiros possam ter acessado suas informações clínicas"]

**O que recomendamos?**  
- [Recomendação 1: ex: "Fique atento a e-mails ou contatos suspeitos"]
- [Recomendação 2: ex: "Se você utiliza a mesma senha em outros serviços, troque-a imediatamente"]
- [Recomendação 3: ex: "Entre em contato conosco se notar algo suspeito"]

**Como exercer seus direitos?**  
Você pode solicitar mais informações, correção ou exclusão de seus dados entrando em contato com nosso Encarregado de Proteção de Dados:

**DPO**: João Felipe Monteiro Dias Bernacchio  
**E-mail**: privacidade@espacomindware.com.br  
**Telefone**: [Telefone]

Lamentamos profundamente este ocorrido e reforçamos nosso compromisso com a proteção de seus dados e sua privacidade.

Atenciosamente,  
**Espaço Mindware Psicologia Ltda.**

---

## 12. CONTROLE DE VERSÕES

| Versão | Data | Responsável | Alterações |
|--------|------|-------------|------------|
| 1.0 | Nov/2025 | João Felipe Bernacchio | Criação do documento |

---

**Aprovado por:**  
João Felipe Monteiro Dias Bernacchio (DPO)  
Data: Novembro/2025

---

## 13. CHECKLIST DE AUDITORIA PÓS-INCIDENTE

**Utilizar após encerramento de cada incidente para garantir completude da resposta e conformidade.**

| Item | Verificação | Status | Evidência |
|------|-------------|--------|-----------|
| **1. DETECÇÃO E REGISTRO** |
| 1.1 | Incidente foi detectado em até 24h? | ☐ Sim ☐ Não | Data/hora de detecção |
| 1.2 | DPO foi notificado imediatamente? | ☐ Sim ☐ Não | E-mail/registro |
| 1.3 | Formulário de Registro preenchido? | ☐ Sim ☐ Não | Anexo A completo |
| **2. AVALIAÇÃO E CONTENÇÃO** |
| 2.1 | Severidade foi classificada (Nível 1/2/3)? | ☐ Sim ☐ Não | Matriz de risco (Anexo B) |
| 2.2 | Medidas de contenção foram implementadas em até 48h? | ☐ Sim ☐ Não | Log de ações |
| 2.3 | Acessos não autorizados foram bloqueados? | ☐ Sim ☐ Não | Logs de acesso |
| 2.4 | Credenciais comprometidas foram revogadas? | ☐ Sim ☐ Não | Log de revogações |
| **3. NOTIFICAÇÃO** |
| 3.1 | Se Nível 3: ANPD foi notificada em até 3 dias úteis? | ☐ Sim ☐ Não ☐ N/A | Protocolo ANPD |
| 3.2 | Se risco relevante: titulares foram notificados? | ☐ Sim ☐ Não ☐ N/A | E-mails enviados (Anexo C) |
| 3.3 | Comunicação foi clara e acessível? | ☐ Sim ☐ Não ☐ N/A | Revisão de linguagem |
| **4. INVESTIGAÇÃO** |
| 4.1 | Causa raiz foi identificada? | ☐ Sim ☐ Não | Relatório de investigação |
| 4.2 | Vulnerabilidades foram corrigidas? | ☐ Sim ☐ Não | Log de correções |
| 4.3 | Patches/atualizações foram aplicados? | ☐ Sim ☐ Não | Log de deploy |
| 4.4 | Políticas/procedimentos foram atualizados? | ☐ Sim ☐ Não | Versão atualizada de docs |
| **5. ENCERRAMENTO** |
| 5.1 | Relatório final foi elaborado? | ☐ Sim ☐ Não | Relatório completo |
| 5.2 | Incidente foi registrado no Livro? | ☐ Sim ☐ Não | Entrada no livro |
| 5.3 | Evidências foram arquivadas (5 anos)? | ☐ Sim ☐ Não | Pasta de arquivamento |
| 5.4 | ANPD foi informada sobre resolução (se aplicável)? | ☐ Sim ☐ Não ☐ N/A | E-mail/protocolo |
| **6. LIÇÕES APRENDIDAS** |
| 6.1 | Equipe foi treinada sobre lições aprendidas? | ☐ Sim ☐ Não | Registro de treinamento |
| 6.2 | Este Runbook foi atualizado (se necessário)? | ☐ Sim ☐ Não | Nova versão |
| 6.3 | Medidas preventivas adicionais foram implementadas? | ☐ Sim ☐ Não | Plano de ação |

**Data da Auditoria**: ___/___/_____  
**Auditado por**: _______________________________ (DPO)  
**Assinatura**: _______________________________________

**Ações Corretivas Pendentes**:
- [ ] _______________________________________________________
- [ ] _______________________________________________________
- [ ] _______________________________________________________

**Observações**:
___________________________________________________________________________
___________________________________________________________________________

---

**Documento controlado - Propriedade do Espaço Mindware Psicologia Ltda.**  
**Acesso restrito - Confidencial**  
**Revisar anualmente ou após cada incidente relevante**
