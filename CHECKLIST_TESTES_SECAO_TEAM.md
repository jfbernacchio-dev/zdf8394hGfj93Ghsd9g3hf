# ✅ CHECKLIST COMPLETO DE TESTES - SEÇÃO TEAM (EQUIPE)

## 📋 VISÃO GERAL

Este documento contém todos os testes necessários para validar a implementação da seção "Equipe" no Dashboard.

**Data de criação**: 2025-01-18  
**Sistema**: Dashboard Example (`/dashboard-example`)  
**Funcionalidade**: Cards de dados agregados da equipe (subordinados)

---

## 🎯 RESUMO EXECUTIVO

Total de testes: **32**
- ✅ Testes Visuais: 8
- ✅ Testes Funcionais: 10
- ✅ Testes de Permissões: 8
- ✅ Testes de Dados: 6

---

## 1️⃣ TESTES VISUAIS (8 testes)

### 1.1 Renderização da Seção
- [ ] **TV-01**: Seção "Equipe" aparece no Dashboard Example
  - **Como testar**: Acessar `/dashboard-example` como Admin ou FullTherapist
  - **Resultado esperado**: Seção "Equipe" visível após outras seções
  - **Critério de sucesso**: Seção renderizada com título "Equipe"

- [ ] **TV-02**: Seção "Equipe" possui descrição correta
  - **Como testar**: Verificar texto abaixo do título
  - **Resultado esperado**: "Dados dos subordinados"
  - **Critério de sucesso**: Texto visível e correto

### 1.2 Renderização dos Cards
- [ ] **TV-03**: Todos os 6 cards Team são renderizados
  - **Como testar**: Contar cards dentro da seção "Equipe"
  - **Resultado esperado**: 6 cards visíveis
  - **Cards esperados**:
    1. Receita Esperada (Equipe)
    2. Receita Realizada (Equipe)
    3. A Receber (Equipe)
    4. Taxa de Pagamento (Equipe)
    5. Total de Pacientes (Equipe)
    6. Sessões Realizadas (Equipe)

- [ ] **TV-04**: Cards Team possuem ícones corretos
  - **Como testar**: Verificar ícone no canto superior direito de cada card
  - **Resultado esperado**: Ícones apropriados (DollarSign, TrendingUp, Users, etc.)

### 1.3 Formatação de Valores
- [ ] **TV-05**: Valores monetários estão formatados em R$ brasileiro
  - **Como testar**: Verificar cards de receita (Esperada, Realizada, A Receber)
  - **Resultado esperado**: Formato "R$ 1.234,56"
  - **Critério de sucesso**: Usa formatBrazilianCurrency()

- [ ] **TV-06**: Percentuais estão formatados corretamente
  - **Como testar**: Verificar card "Taxa de Pagamento (Equipe)"
  - **Resultado esperado**: Formato "75%" ou "75,5%"
  - **Critério de sucesso**: Símbolo % presente, máximo 1 casa decimal

- [ ] **TV-07**: Contadores estão formatados como inteiros
  - **Como testar**: Verificar cards de pacientes e sessões
  - **Resultado esperado**: Números inteiros (ex: "12", "5")
  - **Critério de sucesso**: Sem casas decimais

### 1.4 Tooltips
- [ ] **TV-08**: Tooltips aparecem ao passar mouse sobre ícone de informação
  - **Como testar**: Hover sobre ícone "i" em cada card
  - **Resultado esperado**: Tooltip com descrição detalhada do cálculo
  - **Critério de sucesso**: Texto explicativo claro e completo

---

## 2️⃣ TESTES FUNCIONAIS (10 testes)

### 2.1 Filtro de Período
- [ ] **TF-01**: Alteração de período atualiza valores dos cards Team
  - **Como testar**: 
    1. Anotar valores atuais dos cards
    2. Alterar período (ex: de "Mês Atual" para "Última Semana")
    3. Verificar se valores mudaram
  - **Resultado esperado**: Valores diferentes para períodos diferentes
  - **Critério de sucesso**: Pelo menos 1 card deve ter valor diferente

- [ ] **TF-02**: Período "Mês Atual" filtra apenas sessões do mês civil corrente
  - **Como testar**: 
    1. Selecionar "Mês Atual"
    2. Verificar datas das sessões consideradas
  - **Resultado esperado**: Apenas sessões de 2025-01-01 até 2025-01-31
  - **Critério de sucesso**: Comparar com dados do banco

- [ ] **TF-03**: Período customizado respeita datas exatas
  - **Como testar**: 
    1. Selecionar "Customizado"
    2. Definir: 2025-01-10 a 2025-01-15
    3. Verificar valores
  - **Resultado esperado**: Apenas sessões entre 10/01 e 15/01
  - **Critério de sucesso**: Comparar com query SQL no banco

### 2.2 Cálculos de Receita
- [ ] **TF-04**: Receita Esperada soma todas as sessões do período
  - **Como testar**: 
    1. Contar manualmente sessões da equipe no período
    2. Somar valores de cada sessão
    3. Comparar com card "Receita Esperada (Equipe)"
  - **Resultado esperado**: Valores idênticos
  - **Critério de sucesso**: Diferença máxima de R$ 0,01

- [ ] **TF-05**: Receita Realizada conta apenas sessões comparecidas
  - **Como testar**: 
    1. Filtrar sessões com status='attended' no período
    2. Somar valores
    3. Comparar com card "Receita Realizada (Equipe)"
  - **Resultado esperado**: Valores idênticos
  - **Critério de sucesso**: Apenas sessões "attended" contabilizadas

- [ ] **TF-06**: A Receber conta sessões comparecidas não pagas
  - **Como testar**: 
    1. Filtrar sessões com status='attended' AND paid=false
    2. Somar valores
    3. Comparar com card "A Receber (Equipe)"
  - **Resultado esperado**: Valores idênticos
  - **Critério de sucesso**: Apenas sessões "attended" e não pagas

### 2.3 Cálculos de Taxas e Contadores
- [ ] **TF-07**: Taxa de Pagamento calcula percentual correto
  - **Como testar**: 
    1. Calcular manualmente: (receita paga / receita total) * 100
    2. Comparar com card "Taxa de Pagamento (Equipe)"
  - **Resultado esperado**: Valores idênticos (tolerância 0,1%)
  - **Critério de sucesso**: Fórmula: paidRevenue / totalRevenue * 100

- [ ] **TF-08**: Total de Pacientes conta apenas pacientes ativos
  - **Como testar**: 
    1. Contar pacientes com status='active' da equipe
    2. Comparar com card "Total de Pacientes (Equipe)"
  - **Resultado esperado**: Contagem idêntica
  - **Critério de sucesso**: Apenas pacientes status='active'

- [ ] **TF-09**: Sessões Realizadas conta sessões comparecidas
  - **Como testar**: 
    1. Contar sessões status='attended' da equipe no período
    2. Comparar com card "Sessões Realizadas (Equipe)"
  - **Resultado esperado**: Contagem idêntica
  - **Critério de sucesso**: Número e percentual corretos

### 2.4 Tratamento de Mensalistas
- [ ] **TF-10**: Pacientes mensalistas são contados 1x por mês
  - **Como testar**: 
    1. Criar paciente com monthly_price=true
    2. Criar 4 sessões no mesmo mês
    3. Verificar se receita esperada conta apenas 1x o valor
  - **Resultado esperado**: Valor = session_value (não 4x)
  - **Critério de sucesso**: Map<monthKey, Set<patientId>> funciona

---

## 3️⃣ TESTES DE PERMISSÕES (8 testes)

### 3.1 Admin
- [ ] **TP-01**: Admin vê seção "Equipe"
  - **Como testar**: Login como usuário com role 'admin'
  - **Resultado esperado**: Seção "Equipe" visível
  - **Critério de sucesso**: hasAccess('team') retorna true

- [ ] **TP-02**: Admin vê todos os 6 cards Team
  - **Como testar**: Verificar cards dentro da seção
  - **Resultado esperado**: 6 cards renderizados
  - **Critério de sucesso**: Nenhum card filtrado

### 3.2 FullTherapist
- [ ] **TP-03**: FullTherapist (com subordinados) vê seção "Equipe"
  - **Como testar**: Login como fulltherapist que possui subordinados
  - **Resultado esperado**: Seção "Equipe" visível
  - **Critério de sucesso**: useTeamData retorna dados

- [ ] **TP-04**: FullTherapist (sem subordinados) vê seção vazia
  - **Como testar**: Login como fulltherapist sem subordinados
  - **Resultado esperado**: Seção "Equipe" vazia ou oculta
  - **Critério de sucesso**: teamPatients.length === 0

### 3.3 Subordinate
- [ ] **TP-05**: Subordinate NÃO vê seção "Equipe"
  - **Como testar**: Login como usuário com role 'subordinate'
  - **Resultado esperado**: Seção "Equipe" NÃO aparece
  - **Critério de sucesso**: hasAccess('team') retorna false
  - **Verificação**: blockedFor: ['subordinate'] aplicado

- [ ] **TP-06**: Subordinate não pode acessar dados da equipe via URL
  - **Como testar**: Tentar acessar cards team diretamente
  - **Resultado esperado**: Acesso negado ou dados vazios
  - **Critério de sucesso**: Filtro de permissões funciona

### 3.4 Accountant
- [ ] **TP-07**: Accountant NÃO vê seção "Equipe"
  - **Como testar**: Login como usuário com role 'accountant'
  - **Resultado esperado**: Seção "Equipe" NÃO aparece
  - **Critério de sucesso**: 'team' não está em accountantDomains

- [ ] **TP-08**: Accountant mantém acesso a seções financeiras próprias
  - **Como testar**: Verificar outras seções no dashboard
  - **Resultado esperado**: Seções financeiras normais visíveis
  - **Critério de sucesso**: Apenas 'team' bloqueado, resto funciona

---

## 4️⃣ TESTES DE DADOS (6 testes)

### 4.1 Hook useTeamData
- [ ] **TD-01**: useTeamData retorna pacientes dos subordinados
  - **Como testar**: 
    1. Verificar subordinateIds retornado
    2. Verificar teamPatients contém pacientes com user_id nos subordinateIds
  - **Resultado esperado**: teamPatients.length > 0 (se tem subordinados)
  - **Critério de sucesso**: Query correta na tabela patients

- [ ] **TD-02**: useTeamData retorna sessões dos pacientes da equipe
  - **Como testar**: 
    1. Verificar teamSessions
    2. Confirmar que patient_id corresponde a pacientes da equipe
  - **Resultado esperado**: teamSessions.length > 0
  - **Critério de sucesso**: JOIN correto patients → sessions

### 4.2 Hook useOwnData
- [ ] **TD-03**: useOwnData filtra pacientes excluindo subordinados
  - **Como testar**: 
    1. Verificar ownPatients
    2. Confirmar que user_id NÃO está em subordinateIds
  - **Resultado esperado**: Nenhum paciente de subordinado em ownPatients
  - **Critério de sucesso**: Filtro allPatients.filter(...) funciona

- [ ] **TD-04**: useOwnData filtra sessões excluindo subordinados
  - **Como testar**: 
    1. Verificar ownSessions
    2. Confirmar que patient_id corresponde apenas a ownPatients
  - **Resultado esperado**: Nenhuma sessão de subordinado em ownSessions
  - **Critério de sucesso**: Filtro allSessions.filter(...) funciona

### 4.3 Fluxo de Dados no DashboardExample
- [ ] **TD-05**: Cards da seção "Equipe" recebem teamPatients e teamSessions
  - **Como testar**: 
    1. Verificar props passadas na linha 623-624 de DashboardExample.tsx
    2. Confirmar que sectionId === 'dashboard-team'
  - **Resultado esperado**: patients={teamPatients}, sessions={teamSessions}
  - **Critério de sucesso**: Condicional funciona corretamente

- [ ] **TD-06**: Cards de outras seções recebem ownPatients e ownSessions
  - **Como testar**: 
    1. Verificar props passadas para outras seções
    2. Confirmar que sectionId !== 'dashboard-team'
  - **Resultado esperado**: patients={ownPatients}, sessions={ownSessions}
  - **Critério de sucesso**: Separação de dados funciona

---

## 5️⃣ TESTES DE INTEGRAÇÃO (4 testes)

### 5.1 TypeScript
- [ ] **TI-01**: Sem erros de tipo no código
  - **Como testar**: Verificar console do navegador
  - **Resultado esperado**: Nenhum erro TypeScript
  - **Critério de sucesso**: Compilação limpa

- [ ] **TI-02**: Interface CardProps consistente em todos os arquivos
  - **Como testar**: Verificar definições em dashboardCardRegistry.tsx e dashboardCardRegistryTeam.tsx
  - **Resultado esperado**: Interfaces idênticas
  - **Critério de sucesso**: Props tipadas corretamente

### 5.2 Registries
- [ ] **TI-03**: Todos os 6 cards Team estão em DASHBOARD_CARD_COMPONENTS
  - **Como testar**: Verificar mapa em dashboardCardRegistry.tsx linhas 1048-1053
  - **Resultado esperado**: 6 entradas com IDs corretos
  - **Critério de sucesso**: renderDashboardCard() encontra todos os cards

- [ ] **TI-04**: Todos os 6 cards Team estão em AVAILABLE_TEAM_CARDS
  - **Como testar**: Verificar array em cardTypes.ts
  - **Resultado esperado**: 6 configurações completas
  - **Critério de sucesso**: Metadata presente para todos

---

## 6️⃣ TESTES DE EDGE CASES (6 testes)

### 6.1 Dados Vazios
- [ ] **TE-01**: Seção Team com 0 subordinados
  - **Como testar**: Login como fulltherapist sem subordinados
  - **Resultado esperado**: Cards mostram R$ 0,00 ou mensagem apropriada
  - **Critério de sucesso**: Sem erros, interface limpa

- [ ] **TE-02**: Período sem sessões
  - **Como testar**: Selecionar período futuro
  - **Resultado esperado**: Todos os valores zerados
  - **Critério de sucesso**: Não exibe NaN ou undefined

### 6.2 Valores Extremos
- [ ] **TE-03**: Receita muito alta (> R$ 100.000)
  - **Como testar**: Criar muitas sessões com valores altos
  - **Resultado esperado**: Formatação correta (ex: R$ 123.456,78)
  - **Critério de sucesso**: Sem quebra de layout

- [ ] **TE-04**: Taxa de pagamento 0% e 100%
  - **Como testar**: 
    - 0%: Todas sessões não pagas
    - 100%: Todas sessões pagas
  - **Resultado esperado**: "0%" e "100%" exibidos corretamente
  - **Critério de sucesso**: Sem divisão por zero

### 6.3 Datas Inválidas
- [ ] **TE-05**: Sessões com datas inválidas
  - **Como testar**: Sessão com date=null ou date inválido
  - **Resultado esperado**: Sessão ignorada silenciosamente
  - **Critério de sucesso**: try/catch em parseISO funciona

- [ ] **TE-06**: Período invertido (end < start)
  - **Como testar**: Definir período customizado com fim antes do início
  - **Resultado esperado**: Nenhuma sessão retornada ou erro tratado
  - **Critério de sucesso**: Validação de período funciona

---

## 7️⃣ TESTES DE PERFORMANCE (2 testes)

- [ ] **TP-01**: Renderização com 100+ pacientes na equipe
  - **Como testar**: Criar muitos subordinados com muitos pacientes
  - **Resultado esperado**: Cards renderizam em < 1 segundo
  - **Critério de sucesso**: Sem lag perceptível

- [ ] **TP-02**: Alteração de período é rápida
  - **Como testar**: Trocar período várias vezes rapidamente
  - **Resultado esperado**: Atualização instantânea
  - **Critério de sucesso**: useMemo otimiza recálculos

---

## 📊 SUMÁRIO DE TESTES

| Categoria | Total | Críticos | Opcionais |
|-----------|-------|----------|-----------|
| Visuais | 8 | 6 | 2 |
| Funcionais | 10 | 8 | 2 |
| Permissões | 8 | 8 | 0 |
| Dados | 6 | 6 | 0 |
| Integração | 4 | 4 | 0 |
| Edge Cases | 6 | 3 | 3 |
| Performance | 2 | 0 | 2 |
| **TOTAL** | **44** | **35** | **9** |

---

## 🎯 TESTES CRÍTICOS (OBRIGATÓRIOS)

Para considerar a implementação completa, os seguintes testes DEVEM passar:

1. **TV-01, TV-03, TV-05** - Renderização e formatação básicas
2. **TF-01, TF-04, TF-05, TF-06, TF-07, TF-10** - Cálculos e filtros funcionam
3. **TP-01, TP-03, TP-05, TP-07** - Permissões corretas por role
4. **TD-01, TD-02, TD-03, TD-05, TD-06** - Fluxo de dados correto
5. **TI-01, TI-03, TI-04** - Integração e tipos corretos

**Total de testes críticos**: 24

---

## 📝 COMO EXECUTAR ESTE CHECKLIST

### 1. Preparação
```bash
# Acessar projeto
cd seu-projeto

# Garantir que está na branch correta
git status

# Verificar se não há erros de compilação
npm run build
```

### 2. Executar Testes Manuais
- Login com diferentes roles (admin, fulltherapist, subordinate, accountant)
- Acessar `/dashboard-example`
- Executar cada teste marcando [ ] → [x]

### 3. Verificar Dados no Banco
```sql
-- Verificar subordinados
SELECT * FROM therapist_assignments WHERE manager_id = 'seu-user-id';

-- Verificar pacientes da equipe
SELECT p.* FROM patients p
INNER JOIN therapist_assignments ta ON p.user_id = ta.subordinate_id
WHERE ta.manager_id = 'seu-user-id';

-- Verificar sessões
SELECT s.* FROM sessions s
INNER JOIN patients p ON s.patient_id = p.id
INNER JOIN therapist_assignments ta ON p.user_id = ta.subordinate_id
WHERE ta.manager_id = 'seu-user-id'
AND s.date >= '2025-01-01'
AND s.date <= '2025-01-31';
```

### 4. Reportar Bugs
Se algum teste falhar, documente:
- ID do teste (ex: TF-04)
- Resultado obtido
- Resultado esperado
- Passos para reproduzir
- Screenshots se relevante

---

## ✅ ASSINATURA DE CONCLUSÃO

Ao completar este checklist, preencha:

**Testado por**: ___________________  
**Data**: ___________________  
**Ambiente**: [ ] Desenvolvimento [ ] Staging [ ] Produção  
**Testes críticos passaram**: [ ] Sim [ ] Não  
**Bugs encontrados**: ___________________  
**Status final**: [ ] Aprovado [ ] Aprovado com ressalvas [ ] Reprovado

---

**Última atualização**: 2025-01-18  
**Versão do documento**: 1.0  
**Autor**: Sistema Lovable
