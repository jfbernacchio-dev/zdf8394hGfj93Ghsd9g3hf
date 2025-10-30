# 📋 Guia de Práticas de Compliance - Espaço Mindware

## 🎯 O QUE É AUTOMÁTICO vs MANUAL

### ✅ TOTALMENTE AUTOMÁTICO (Sistema faz sozinho)

1. **Registro de Acessos Administrativos**
   - ❌ Você NÃO precisa fazer: O sistema registra automaticamente todos os acessos a dados sensíveis
   - ✅ Sistema alerta: Não há alertas automáticos, mas você pode revisar quando necessário

2. **Notificações de Atividades**
   - ❌ Você NÃO precisa fazer: Sistema notifica automaticamente sobre:
     - Agendamentos e reagendamentos de pacientes
     - Atividades de terapeutas subordinados
     - Testes de backup concluídos
   - ✅ Sistema alerta: Você recebe notificação em tempo real no sino 🔔

3. **Armazenamento de Dados**
   - ❌ Você NÃO precisa fazer: Backups são automáticos pelo Lovable Cloud
   - ✅ Sistema alerta: Não há alertas, mas você pode testar quando quiser

### ⚠️ SEMI-AUTOMÁTICO (Sistema ajuda, mas você precisa executar)

1. **Testes de Backup**
   - ✅ Você PRECISA fazer: Ir em "Testes de Backup" e clicar em "Executar Teste"
   - 📅 Frequência: **MENSAL**
   - ✅ Sistema alerta: Você receberá notificação quando o teste for concluído
   - 🔗 Onde fazer: Dashboard → Testes de Backup

### 📝 TOTALMENTE MANUAL (Você precisa fazer periodicamente)

1. **Revisão de Logs de Acesso**
   - ✅ Você PRECISA fazer:
     1. Acessar "Revisão de Logs"
     2. Analisar os últimos 30 dias de acessos
     3. Preencher "Achados/Observações" (ex: "Nenhuma irregularidade detectada")
     4. Preencher "Ações Tomadas" (ex: "Nenhuma ação necessária")
     5. Clicar em "Registrar Revisão"
   - 📅 Frequência: **MENSAL**
   - ❌ Sistema NÃO alerta: Você precisa lembrar
   - 🔗 Onde fazer: Dashboard → Revisão de Logs

2. **Revisão de Permissões**
   - ✅ Você PRECISA fazer:
     1. Acessar "Revisão de Permissões"
     2. Verificar todos os usuários e suas roles
     3. Indicar quantos roles foram modificados (se houver)
     4. Preencher "Achados/Observações"
     5. Preencher "Ações Tomadas"
     6. Clicar em "Registrar Revisão"
   - 📅 Frequência: **TRIMESTRAL** (a cada 3 meses)
   - ✅ Sistema alerta: Mostra data da próxima revisão
   - 🔗 Onde fazer: Dashboard → Revisão de Permissões

3. **Gestão de Incidentes**
   - ✅ Você PRECISA fazer: Quando ocorrer um incidente:
     1. Acessar "Incidentes de Segurança"
     2. Clicar em "Registrar Incidente"
     3. Preencher todos os dados
     4. Acompanhar o status (reportado → investigando → contido → resolvido)
     5. Se for crítico, notificar ANPD e baixar relatório
   - 📅 Frequência: **CONFORME NECESSÁRIO**
   - ❌ Sistema NÃO alerta: Você detecta e registra manualmente
   - 🔗 Onde fazer: Dashboard → Incidentes de Segurança

---

## 📆 CALENDÁRIO DE COMPLIANCE

### TODO MÊS (30 dias)
- [ ] Executar Teste de Backup
- [ ] Fazer Revisão de Logs de Acesso

### TODO TRIMESTRE (3 meses)
- [ ] Fazer Revisão de Permissões

### CONFORME NECESSÁRIO
- [ ] Registrar Incidentes de Segurança quando ocorrerem
- [ ] Atualizar status de incidentes abertos

---

## 🔔 QUANDO VOCÊ RECEBERÁ NOTIFICAÇÕES

### Notificações em Tempo Real (🔔 Sino)

1. **Aba "Agendamentos"**
   - Quando um paciente tem seu horário alterado

2. **Aba "Equipe"**
   - Quando um terapeuta subordinado agenda/reagenda sessões

3. **Aba "Sistema"**
   - Quando um teste de backup é concluído

4. **Aba "Mensagens"** (futuro)
   - Quando receber mensagens de terapeutas
   - Quando receber mensagens do formulário do site

### Notificações Ausentes (Você precisa lembrar)

❌ O sistema NÃO notifica automaticamente para:
- Fazer revisão mensal de logs
- Fazer revisão trimestral de permissões
- Registrar incidentes (você detecta manualmente)

**💡 Dica:** Configure lembretes no seu calendário pessoal!

---

## 📋 CHECKLIST PASSO A PASSO

### 1️⃣ ROTINA MENSAL (Todo dia 1º do mês)

#### A. Teste de Backup
1. Acessar Dashboard
2. Clicar em "Testes de Backup"
3. Clicar em "Executar Teste de Backup"
4. Aguardar conclusão (3 segundos)
5. ✅ Você receberá notificação no sino quando concluir

#### B. Revisão de Logs
1. Acessar Dashboard
2. Clicar em "Revisão de Logs"
3. Revisar os últimos 20 logs mostrados
4. Preencher campo "Achados/Observações":
   - Se não houver problemas: "Nenhuma irregularidade detectada. Todos os acessos estão justificados e dentro da política."
   - Se houver problemas: Descrever em detalhes
5. Preencher campo "Ações Tomadas":
   - Se não houver problemas: "Nenhuma ação necessária."
   - Se houver problemas: Descrever ações (ex: "Removido acesso do usuário X")
6. Clicar em "Registrar Revisão"
7. ✅ Pronto!

**Tempo estimado:** 5-10 minutos

---

### 2️⃣ ROTINA TRIMESTRAL (A cada 3 meses)

#### Revisão de Permissões
1. Acessar Dashboard
2. Clicar em "Revisão de Permissões"
3. Ver data da próxima revisão no topo
4. Revisar tabela "Permissões Atuais"
5. Verificar se todos os usuários listados ainda devem ter acesso
6. Se modificou algum role: indicar quantos no campo "Número de Roles Modificados"
7. Preencher campo "Achados/Observações":
   - Exemplo: "Todos os usuários verificados. Permissões adequadas aos cargos."
8. Preencher campo "Ações Tomadas":
   - Exemplo: "Nenhuma modificação necessária." ou "Removido acesso de 2 ex-funcionários"
9. Clicar em "Registrar Revisão"
10. ✅ Sistema calculará automaticamente a próxima revisão (daqui a 3 meses)

**Tempo estimado:** 10-15 minutos

---

### 3️⃣ QUANDO OCORRER UM INCIDENTE

#### Gestão de Incidente
1. Detectar o problema (ex: vazamento de dados, acesso não autorizado)
2. Acessar Dashboard → "Incidentes de Segurança"
3. Clicar em "Registrar Incidente"
4. Preencher formulário:
   - **Título:** Resumo curto (ex: "Tentativa de acesso não autorizado")
   - **Descrição:** Detalhes completos do que aconteceu
   - **Tipo de Incidente:** Escolher da lista
   - **Gravidade:** 
     - **Crítico:** Vazamento grande, requer notificação ANPD
     - **Alto:** Problema sério mas contido
     - **Médio:** Problema moderado
     - **Baixo:** Problema menor
   - **Usuários Afetados:** Quantos usuários foram impactados
   - **Sensibilidade dos Dados:** Público / Interno / Confidencial / Restrito
5. Clicar em "Registrar Incidente"
6. **Se gravidade = Crítico:**
   - ⚠️ Sistema indica que ANPD deve ser notificada
   - Clicar em "Ver Detalhes" no incidente
   - Clicar em "Gerar Relatório ANPD"
   - Enviar relatório para ANPD
   - Clicar em "Marcar ANPD Notificada"
7. Atualizar status conforme evolui:
   - Reportado → Investigando → Contido → Resolvido → Fechado

**Tempo estimado:** Variável (15 min a horas, dependendo da gravidade)

---

## 🎓 BOAS PRÁTICAS

### ✅ FAÇA
- Configure lembretes no calendário para revisões mensais e trimestrais
- Documente TUDO, mesmo que seja "nenhum problema encontrado"
- Revise as notificações do sino 🔔 diariamente
- Mantenha registros por 12 meses (sistema faz isso automaticamente)
- Se houver dúvida sobre um incidente, registre! É melhor ter o registro

### ❌ NÃO FAÇA
- Não ignore revisões periódicas - isso é obrigatório por lei (LGPD)
- Não delete logs ou registros antigos
- Não compartilhe detalhes de incidentes fora da plataforma
- Não deixe incidentes sem atualização de status

---

## 📞 CONTATOS IMPORTANTES

### Em caso de incidente grave:
1. Contenha o problema imediatamente
2. Registre no sistema
3. Se dados sensíveis vazaram: notifique ANPD em até 72h
4. Considere consultar advogado especializado em LGPD

### ANPD (Autoridade Nacional de Proteção de Dados)
- Site: https://www.gov.br/anpd/pt-br
- Canal de comunicação com o cidadão: https://falabr.cgu.gov.br/web/home

---

## 📊 RESUMO VISUAL

```
┌─────────────────────────────────────────────────┐
│  TODO MÊS (dia 1º)                             │
├─────────────────────────────────────────────────┤
│  ✓ Executar Teste de Backup (2 min)           │
│  ✓ Revisão de Logs (10 min)                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  TODO TRIMESTRE (a cada 3 meses)               │
├─────────────────────────────────────────────────┤
│  ✓ Revisão de Permissões (15 min)             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  CONFORME NECESSÁRIO                           │
├─────────────────────────────────────────────────┤
│  ✓ Registrar e gerenciar incidentes           │
└─────────────────────────────────────────────────┘
```

**Tempo total mensal:** ~15 minutos  
**Tempo total trimestral:** ~30 minutos

---

## ⚖️ BASE LEGAL

Estas práticas atendem aos seguintes requisitos:
- **LGPD** (Lei 13.709/2018): Arts. 46, 47, 48 (Boas Práticas e Governança)
- **Resolução ANPD nº 2/2022**: Agentes de tratamento de pequeno porte
- **ISO 27001**: Gestão de Segurança da Informação
- **Código de Ética do Psicólogo**: Sigilo profissional

---

*Última atualização: Outubro 2025*
