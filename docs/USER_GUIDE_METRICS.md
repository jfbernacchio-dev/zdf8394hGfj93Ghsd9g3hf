# 📊 GUIA DO USUÁRIO - PÁGINA DE MÉTRICAS

## 🎯 O QUE É A PÁGINA DE MÉTRICAS?

A página de Métricas é o painel central onde você visualiza todos os indicadores importantes do seu consultório ou clínica. Ela substitui as antigas páginas separadas e agora concentra tudo em um único lugar.

### O que você pode fazer:

- ✅ Visualizar receita, pacientes ativos, taxa de ocupação
- ✅ Comparar períodos (semana, mês, ano)
- ✅ Analisar gráficos detalhados
- ✅ Personalizar o layout dos cards
- ✅ Acessar métricas de equipe, marketing e administrativas

---

## 🚀 COMO ACESSAR

### Pelo Menu Principal

1. Clique no menu de navegação (topo da página)
2. Clique em **"Métricas"**
3. Você será direcionado para `/metrics`

### Pela URL Direta

- **Métricas Gerais**: `https://seu-site.com/metrics`
- **Financeiro**: `https://seu-site.com/metrics?domain=financial`
- **Administrativo**: `https://seu-site.com/metrics?domain=administrative`
- **Marketing**: `https://seu-site.com/metrics?domain=marketing`
- **Equipe**: `https://seu-site.com/metrics?domain=team`

---

## 🧭 NAVEGAÇÃO NA PÁGINA

### Estrutura da Página

```
┌─────────────────────────────────────────────┐
│  HEADER: Filtros de Período                 │
│  [Semana] [Mês] [Ano] [Customizado]        │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  ABAS: Domínios                             │
│  [Financeiro] [Administrativo] [Marketing]  │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  CARDS NUMÉRICOS                            │
│  ┌───────┐ ┌───────┐ ┌───────┐            │
│  │ R$ XX │ │ X pac │ │ XX%   │            │
│  └───────┘ └───────┘ └───────┘            │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  GRÁFICOS                                   │
│  Sub-abas: [Distribuições] [Desempenho]    │
│  ┌─────────────────────────────────────┐   │
│  │  📊 Gráfico de Tendências           │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 🔍 USANDO OS FILTROS DE PERÍODO

### Filtros Rápidos

#### 📅 Semana
- Mostra dados dos **últimos 7 dias**
- Útil para acompanhamento diário

**Exemplo**: Segunda a domingo atual

#### 📅 Mês
- Mostra dados do **mês corrente**
- Útil para análise mensal

**Exemplo**: 1º de janeiro a 31 de janeiro

#### 📅 Ano
- Mostra dados do **ano corrente**
- Útil para visão estratégica anual

**Exemplo**: 1º de janeiro a 31 de dezembro

### Período Customizado

Para analisar um período específico:

1. Clique em **"Customizado"**
2. Selecione a **Data de Início**
3. Selecione a **Data de Fim**
4. Clique em **"Aplicar"**

**Exemplo**: Comparar receita de Janeiro 2024 vs Janeiro 2025

---

## 📋 DOMÍNIOS DISPONÍVEIS

### 💰 Financeiro

**O que você vê**:
- Receita total realizada
- Receita prevista (forecast)
- Receita perdida (faltas)
- Ticket médio por sessão
- Ticket médio por paciente ativo

**Gráficos disponíveis**:
- **Distribuições**: Status de sessões, distribuição de receita
- **Desempenho**: Comparação semanal, desempenho mensal
- **Tendências**: Evolução da receita, forecast vs realizado
- **Retenção**: Taxa de retenção, pacientes novos vs inativos

**Quem pode acessar**: Usuários com permissão `financial_access`

---

### 📊 Administrativo

**O que você vê**:
- Número de pacientes ativos
- Taxa de ocupação da agenda
- Taxa de faltas (missed rate)

**Gráficos disponíveis**:
- **Distribuições**: Distribuição de frequência, taxa de presença
- **Desempenho**: Ocupação semanal
- **Retenção**: Churn vs Retenção

**Quem pode acessar**: Todos os usuários autenticados

---

### 🎯 Marketing

**O que você vê**:
- Visualizações do website
- Visitantes únicos
- Taxa de conversão
- Click-through rate (CTR)

**Gráficos disponíveis**:
- **Website**: Visão geral de tráfego e conversão

**Quem pode acessar**: Usuários com permissão `marketing_access`

⚠️ **Nota**: As métricas de marketing são **mockadas** (dados de exemplo). Para dados reais, é necessário integrar com Google Analytics ou similar.

---

### 👥 Equipe

**O que você vê**:
- Distribuição de pacientes por terapeuta
- Receita por membro da equipe
- Carga de trabalho individual

**Gráficos disponíveis**:
- **Desempenho**: Performance individual, comparação de receita
- **Distribuições**: Distribuição de pacientes, carga de trabalho
- **Retenção**: Taxa de presença por terapeuta

**Quem pode acessar**: Usuários com permissão `team_access`

---

## 🎨 PERSONALIZANDO O LAYOUT

### Como Ativar o Modo de Edição

1. Clique no botão **"Editar Layout"** (ícone de lápis) no topo da página
2. Os cards ficarão **arrastáveis**
3. Você pode reorganizar conforme sua preferência

### Como Mover um Card

1. Clique e **segure** sobre um card
2. **Arraste** para a posição desejada
3. **Solte** para fixar na nova posição

### Como Salvar o Layout

1. Após organizar os cards, clique em **"Salvar Layout"**
2. Uma confirmação aparecerá
3. O layout será salvo e permanecerá assim nas próximas visitas

### Como Resetar o Layout

Se quiser voltar ao layout padrão:

1. Clique em **"Resetar"** (ícone de reset)
2. Confirme a ação
3. Os cards voltarão às posições originais

⚠️ **Atenção**: Resetar apaga sua personalização permanentemente.

---

## 📈 INTERPRETANDO OS CARDS

### 💵 Receita Total
**O que mostra**: Soma de todas as sessões **realizadas** (status "attended") no período

**Como interpretar**:
- Valor alto = muitas sessões realizadas
- Compare com o mês anterior para ver crescimento
- Use filtro customizado para comparar períodos específicos

**Exemplo**:
```
Receita Total: R$ 12.450,00
+15% vs mês anterior
```
✅ Crescimento de 15% é positivo!

---

### 📊 Ticket Médio por Sessão
**O que mostra**: Receita total ÷ número de sessões realizadas

**Como interpretar**:
- Mostra o valor médio que você recebe por atendimento
- Se está baixo, considere reajustar os valores
- Compare com sua tabela de preços

**Exemplo**:
```
Ticket Médio: R$ 180,00
```
Se sua tabela prevê R$ 200, você está perdendo R$ 20 por sessão.

---

### 🎯 Receita Prevista (Forecast)
**O que mostra**: Estimativa de receita baseada em pacientes ativos e suas frequências

**Cálculo**:
```
Forecast = Σ (valor_sessão × frequência_semanal × semanas_no_período)
```

**Como interpretar**:
- Se for muito maior que receita realizada → alta taxa de faltas
- Se for próximo da receita realizada → boa aderência

**Exemplo**:
```
Receita Prevista: R$ 18.000,00
Receita Realizada: R$ 12.000,00
Diferença: -R$ 6.000,00 (-33%)
```
❌ Você está perdendo R$ 6.000 por faltas!

---

### 🚫 Receita Perdida
**O que mostra**: Soma do valor de todas as sessões **faltadas** (status "missed")

**Como interpretar**:
- Valor alto indica problema de aderência
- Considere políticas de confirmação ou taxa de no-show
- Analise gráfico "Faltas por Paciente" para identificar quem falta mais

**Exemplo**:
```
Receita Perdida: R$ 2.400,00
4 pacientes com alta taxa de faltas
```
💡 Entre em contato com esses 4 pacientes para entender o motivo.

---

### 👥 Pacientes Ativos
**O que mostra**: Pacientes com status "ativo" no sistema

**Como interpretar**:
- Aumento = crescimento da base
- Queda = atenção ao churn
- Compare com "Pacientes Novos" para ver se está captando

**Exemplo**:
```
Pacientes Ativos: 42
+3 vs mês anterior
```
✅ Base crescendo!

---

### 📅 Taxa de Ocupação
**O que mostra**: % de slots preenchidos na agenda vs total disponível

**Cálculo**:
```
Ocupação = (Sessões agendadas / Slots disponíveis) × 100
```

**Como interpretar**:
- 80-90% = ideal (deixa margem para imprevistos)
- < 70% = baixa ocupação, pode aceitar mais pacientes
- > 95% = super lotado, considere expandir horários

**Exemplo**:
```
Taxa de Ocupação: 85%
17 sessões agendadas / 20 slots
```
✅ Ocupação saudável!

---

### ❌ Taxa de Faltas (Missed Rate)
**O que mostra**: % de sessões faltadas vs total de sessões agendadas

**Cálculo**:
```
Missed Rate = (Sessões missed / Total agendadas) × 100
```

**Como interpretar**:
- < 10% = excelente
- 10-20% = aceitável
- > 20% = problema sério de aderência

**Exemplo**:
```
Taxa de Faltas: 23%
7 faltas em 30 sessões agendadas
```
❌ Taxa alta! Implementar lembretes ou política de no-show.

---

## 📊 INTERPRETANDO OS GRÁFICOS

### Gráficos de Distribuição

#### Distribuição de Sessões por Status
**O que mostra**: Quantas sessões foram realizadas, faltadas, canceladas, etc.

**Como usar**:
- Identifique qual status domina
- Se "missed" é alto, investigue causas
- Se "cancelled" é alto, pacientes podem estar desistindo

---

#### Distribuição de Receita
**O que mostra**: De onde vem sua receita (por paciente, por valor de sessão, etc.)

**Como usar**:
- Identifique pacientes que mais contribuem
- Veja se há dependência excessiva de poucos pacientes
- Planeje estratégias de retenção para os top

---

### Gráficos de Desempenho

#### Comparação Semanal
**O que mostra**: Receita semana por semana no mês

**Como usar**:
- Identifique semanas ruins
- Correlacione com eventos (feriados, férias)
- Planeje ações para semanas historicamente fracas

---

#### Desempenho Mensal
**O que mostra**: Evolução mês a mês

**Como usar**:
- Identifique tendências de longo prazo
- Planeje metas baseadas em histórico
- Detecte sazonalidade (ex: dezembro sempre cai)

---

### Gráficos de Tendências

#### Evolução da Receita
**O que mostra**: Linha do tempo da receita

**Como usar**:
- Veja se está crescendo, estável ou caindo
- Compare com ações que tomou (ex: aumento de preço)
- Projete futuro baseado na tendência

---

#### Forecast vs Realizado
**O que mostra**: Linha de receita prevista vs receita real

**Como usar**:
- Linhas próximas = boa aderência
- Linhas distantes = problema de faltas ou cancelamentos
- Ajuste forecast se estiver sistematicamente errado

---

### Gráficos de Retenção

#### Taxa de Retenção
**O que mostra**: % de pacientes que continuam ativos

**Como usar**:
- Alta retenção = pacientes satisfeitos
- Baixa retenção = investigar motivos (preço, qualidade, resultado)
- Compare com média do mercado (60-70% é comum)

---

#### Novos vs Inativos
**O que mostra**: Quantos pacientes entraram vs quantos saíram

**Como usar**:
- Se novos > inativos = crescimento
- Se novos < inativos = churn alto, urgente rever estratégia
- Se equilibrado = manter esforço de captação

---

## 💡 CASOS DE USO PRÁTICOS

### Caso 1: Analisar Crescimento Mensal

**Objetivo**: Saber se o consultório está crescendo

**Passos**:
1. Selecione filtro **"Mês"**
2. Vá para aba **"Financeiro"**
3. Veja card **"Receita Total"**
4. Leia o **% vs mês anterior**
5. Vá para sub-aba **"Tendências"**
6. Analise o gráfico **"Evolução da Receita"**

**Interpretação**:
- Se % positivo e linha ascendente → Crescendo ✅
- Se % negativo e linha descendente → Decrescendo ❌
- Se estável → Atenção, pode estagnar

---

### Caso 2: Identificar Problema de Faltas

**Objetivo**: Entender por que muitos pacientes faltam

**Passos**:
1. Selecione filtro **"Mês"**
2. Vá para aba **"Financeiro"**
3. Veja card **"Receita Perdida"**
4. Anote o valor
5. Vá para sub-aba **"Distribuições"**
6. Analise o gráfico **"Faltas por Paciente"**

**Ações**:
- Entre em contato com os top 5 pacientes que mais faltam
- Pergunte o motivo (horário ruim, esquecimento, falta de resultado)
- Implemente lembretes automáticos
- Considere política de taxa de no-show

---

### Caso 3: Planejar Captação de Novos Pacientes

**Objetivo**: Saber se precisa captar mais pacientes

**Passos**:
1. Selecione filtro **"Mês"**
2. Vá para aba **"Administrativo"**
3. Veja card **"Taxa de Ocupação"**
4. Se < 70%, há espaço para mais pacientes
5. Vá para sub-aba **"Retenção"**
6. Analise o gráfico **"Novos vs Inativos"**

**Decisões**:
- Ocupação < 70% + Novos < Inativos → **Urgente captar**
- Ocupação > 85% → **Não precisa captar agora**
- Ocupação média + Novos > Inativos → **Manter ritmo**

---

### Caso 4: Comparar Desempenho de Equipe

**Objetivo**: Ver quem está performando melhor na equipe

**Passos**:
1. Selecione filtro **"Mês"**
2. Vá para aba **"Equipe"**
3. Vá para sub-aba **"Desempenho"**
4. Analise o gráfico **"Comparação de Receita"**
5. Analise o gráfico **"Distribuição de Pacientes"**

**Ações**:
- Membros com baixa receita → Investigar causas (faltas, poucos pacientes, valores baixos)
- Membros com muitos pacientes mas baixa receita → Verificar valores de sessão
- Membros com alta taxa de presença → Entender o que fazem diferente

---

### Caso 5: Análise de Sazonalidade

**Objetivo**: Entender padrões ao longo do ano

**Passos**:
1. Selecione filtro **"Ano"**
2. Vá para aba **"Financeiro"**
3. Vá para sub-aba **"Desempenho"**
4. Analise o gráfico **"Desempenho Mensal"**

**Insights**:
- Dezembro/Janeiro geralmente caem (férias)
- Fevereiro/Março sobem (volta às aulas)
- Julho pode cair (férias de inverno)

**Ações**:
- Planeje férias nos meses ruins
- Intensifique captação nos meses bons
- Ajuste metas mensais baseado em histórico

---

## ❓ PERGUNTAS FREQUENTES (FAQ)

### Por que alguns domínios não aparecem para mim?

**R**: Depende das suas permissões. Contate o administrador do sistema para solicitar acesso.

---

### Por que as métricas de Marketing são todas iguais?

**R**: As métricas de Marketing são **mockadas** (dados de exemplo) por padrão. Para dados reais, é necessário integrar com Google Analytics. Entre em contato com o suporte técnico.

---

### Como exportar os dados para Excel?

**R**: Atualmente não há função de exportação nativa. Use a funcionalidade de "Imprimir" do navegador e salve como PDF, ou tire screenshots dos gráficos.

---

### Posso criar meus próprios cards customizados?

**R**: Não diretamente pela interface. Entre em contato com o desenvolvedor do sistema para solicitar novos cards específicos.

---

### O layout salvo é compartilhado com outros usuários?

**R**: Não. Cada usuário tem seu próprio layout personalizado. Se você reorganizar, apenas você verá dessa forma.

---

### Com que frequência os dados são atualizados?

**R**: Os dados são buscados em **tempo real** sempre que você:
- Muda o filtro de período
- Troca de domínio
- Recarrega a página

---

### Por que o gráfico mostra "Sem dados"?

**R**: Pode ser porque:
- Não há dados no período selecionado
- Você selecionou um período futuro
- Houve erro ao carregar (verifique internet)
- Você não tem permissão para ver aqueles dados

---

### Posso comparar dois períodos diferentes ao mesmo tempo?

**R**: Atualmente não. Você pode:
1. Ver período 1, anotar valores
2. Mudar filtro para período 2
3. Comparar manualmente

---

### Como interpretar se minha clínica está indo bem?

**R**: Indicadores de saúde:
- ✅ Receita realizada > 80% da prevista
- ✅ Taxa de faltas < 15%
- ✅ Taxa de ocupação entre 75-90%
- ✅ Novos pacientes ≥ Pacientes inativos
- ✅ Taxa de retenção > 70%

---

## 📞 SUPORTE

Se tiver dúvidas não respondidas neste guia:

- **Email**: suporte@seu-sistema.com
- **Chat**: Clique no ícone de ajuda no canto inferior direito
- **Documentação Técnica**: [TRACK_C3_METRICS_FINAL_GUIDE.md](./TRACK_C3_METRICS_FINAL_GUIDE.md)

---

**Última Atualização**: 2025-01-11  
**Versão**: 1.0.0  
**Autor**: TRACK C3 Team
