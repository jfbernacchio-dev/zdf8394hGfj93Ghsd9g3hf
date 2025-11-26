# ✅ FASE C2.8 - QA CHECKLIST

**Data:** 26/01/2025  
**Fase:** C2.8 - Polimento Final e QA do Sistema de Templates

---

## 📋 INSTRUÇÕES

Este checklist deve ser executado **manualmente** antes de considerar a TRACK C2 como completa.

Testar com:
- **Usuário:** Psicólogo / Terapeuta full access
- **Role:** Therapist/Psychologist
- **Organização:** Com pacientes reais ou de teste
- **Template:** `psychopathology_basic` (padrão)

---

## 🧪 1. CLINICAL COMPLAINT FORM

**Rota:** `/patients/:id/clinical-complaint`

### ✅ Criar queixa nova COM CID

- [ ] Navegar para a tela de queixa clínica
- [ ] Buscar um CID válido (ex: F32.0)
- [ ] Preencher sintomas
- [ ] Adicionar medicação
- [ ] Preencher notas clínicas
- [ ] Salvar
- [ ] **Resultado esperado:**
  - Toast de sucesso "Queixa clínica salva"
  - Queixa aparece no histórico lateral como ATIVA
  - Badge verde "Ativa" no card

### ✅ Criar queixa nova SEM CID mas com notas ≥ 20 chars

- [ ] Criar nova queixa
- [ ] NÃO selecionar CID
- [ ] NÃO marcar "sem diagnóstico"
- [ ] Adicionar notas clínicas com MAIS de 20 caracteres
- [ ] Salvar
- [ ] **Resultado esperado:**
  - Salva com sucesso
  - Toast de sucesso

### ✅ Criar queixa SEM CID, SEM notas, SEM "sem diagnóstico"

- [ ] Tentar salvar uma queixa completamente vazia
- [ ] **Resultado esperado:**
  - Toast de ERRO com mensagem amigável
  - Mensagem: "Informe um CID, marque 'sem diagnóstico' ou adicione notas clínicas significativas (mínimo 20 caracteres)."
  - Nenhuma mensagem técnica (sem "field", "enum", etc.)

### ✅ Ver histórico lateral

- [ ] Criar múltiplas queixas (pelo menos 3)
- [ ] Apenas 1 deve estar ativa
- [ ] **Resultado esperado:**
  - Histórico lateral mostra queixa ATIVA no topo com badge verde
  - Queixas anteriores (inativas) aparecem abaixo com badge cinza
  - Scroll funciona se houver muitas queixas

### ✅ Confirmar badge de template (se aplicável)

- [ ] Verificar se há algum badge/indicador do template ativo
- [ ] **Resultado esperado:**
  - Badge discreto mostrando "Template: Psicopatológico Básico" (ou similar)
  - Não quebra layout

---

## 🧠 2. SESSION EVALUATION FORM

**Rota:** `/sessions/:sessionId/evaluation`

### ✅ Preencher ≥ 3 funções e salvar

- [ ] Abrir formulário de avaliação de sessão
- [ ] Preencher pelo menos 3 funções psíquicas:
  - Consciência (mover sliders)
  - Humor (polaridade)
  - Atenção (amplitude, concentração)
- [ ] Salvar
- [ ] **Resultado esperado:**
  - Toast de sucesso "Avaliação salva"
  - Dados aparecem no Clinical Evolution

### ✅ Tentar salvar avaliação vazia

- [ ] Abrir formulário
- [ ] NÃO preencher nenhuma função
- [ ] Tentar salvar
- [ ] **Resultado esperado:**
  - Toast de ERRO amigável
  - Mensagem: "Registre pelo menos 3 funções psíquicas na avaliação para que ela seja clinicamente útil."
  - Nenhuma mensagem técnica

### ✅ Slider fora de range não é possível via UI

- [ ] Tentar mover slider bipolar além de -100 ou +100
- [ ] Tentar mover slider unipolar além de 0 ou 100
- [ ] **Resultado esperado:**
  - Sliders não permitem valores fora do range
  - Input number (se houver) também bloqueia

### ✅ Template mostrado corretamente

- [ ] Ver se há algum badge de template na tela
- [ ] **Resultado esperado:**
  - Template visível (se implementado)
  - Não quebra formulário

### ✅ Validação Zod não gera mensagens técnicas

- [ ] Forçar erro de validação (ex: preencher < 3 funções)
- [ ] Verificar mensagem no toast
- [ ] **Resultado esperado:**
  - Mensagem humanizada
  - Sem "field", "path", "enum", etc.

---

## 📊 3. CLINICAL EVOLUTION

**Rota:** `/patients/:id` → Tab "Evolução"

### ✅ Ver gráficos de evolução normais com dados existentes

- [ ] Paciente com pelo menos 3 avaliações salvas
- [ ] Navegar para tab de Evolução
- [ ] **Resultado esperado:**
  - Gráficos aparecem com dados
  - Linhas/barras/radar visíveis
  - Sem erros no console
  - Cores consistentes

### ✅ Ver mensagem de "sem dados suficientes" quando não há avaliações

- [ ] Paciente SEM avaliações
- [ ] Navegar para tab de Evolução
- [ ] **Resultado esperado:**
  - Mensagem amigável: "Ainda não há dados suficientes para gerar gráficos de evolução."
  - Nenhum crash

### ✅ Resumo global faz sentido, sem textos quebrados

- [ ] Abrir avaliação de sessão específica
- [ ] Ler resumo clínico global
- [ ] **Resultado esperado:**
  - Texto começa com "Paciente apresenta..." ou "Paciente não apresenta alterações..."
  - Texto completo, sem "undefined", sem vírgulas extras
  - Português correto

### ✅ Interpretações individuais visíveis onde esperado

- [ ] Ver cards de funções psíquicas (Consciência, Humor, etc.)
- [ ] Verificar se mostram:
  - Texto de resumo
  - Severidade (normal/moderate/severe)
  - Indicadores (Progress bars)
- [ ] **Resultado esperado:**
  - Todos os 12 cards aparecem (se houver dados)
  - Progress bars funcionam
  - Cores de severidade corretas (verde/amarelo/vermelho)

---

## 📋 4. PATIENT OVERVIEW

**Rota:** `/patients/:id` → Tab "Visão Geral"

### ✅ Todos os 12 cards aparecem como antes

- [ ] Contar quantos cards estão visíveis na Visão Geral
- [ ] **Resultado esperado:**
  - **Todos os 12 cards** do sistema aparecem
  - Nenhum card sumiu misteriosamente

Lista de cards esperados:
1. Queixa Clínica
2. Última Avaliação
3. Evolução Humor
4. Evolução Atenção
5. Evolução Pensamento
6. Próximas Sessões
7. Sessões Recentes
8. Status Financeiro
9. Documentos/Arquivos
10. Histórico de Mudanças
11. Informações do Paciente
12. (qualquer outro card customizado)

### ✅ Nenhum card sumiu

- [ ] Comparar com versão anterior (antes da C2.7/C2.8)
- [ ] **Resultado esperado:**
  - Mesma quantidade de cards
  - Mesma disposição (exceto se o usuário personalizou)

### ✅ Badge de template (se adicionado) aparece no topo

- [ ] Verificar topo da página de Patient Detail
- [ ] **Resultado esperado:**
  - Badge discreto: "Template clínico: Psicopatológico Básico"
  - Ou equivalente
  - Não quebra header

### ✅ Testar com diferentes roles/org se possível

**Se houver múltiplos roles:**

- [ ] Testar como Therapist
- [ ] Testar como Admin/Owner
- [ ] Testar como Secretary (se tiver acesso)
- [ ] **Resultado esperado:**
  - Cards filtrados por permissão (não por template, exceto se `requiredTemplates` estiver configurado)
  - Comportamento consistente

---

## 🧪 5. TESTES AUTOMÁTICOS

### ✅ runAllTemplateTests() executa sem erros

**No browser console:**

```javascript
runAllTemplateTests();
```

- [ ] Executar comando acima
- [ ] **Resultado esperado:**
  - Todos os testes passam
  - Nenhum erro vermelho no console
  - Mensagem final: "✅ ALL TEMPLATE TESTS PASSED"

### ✅ Console limpo de erros e warnings críticos

- [ ] Navegar por todas as telas clínicas
- [ ] Abrir browser console
- [ ] **Resultado esperado:**
  - Sem erros em vermelho
  - Warnings aceitáveis (ex: deprecations de libs externas)
  - Nenhum erro de "Cannot read property of undefined"

---

## 📊 RESUMO FINAL

Preencher após completar todos os testes:

| Seção | Testes Passados | Testes Falhados | Notas |
|-------|-----------------|-----------------|-------|
| Complaint Form | ___ / 5 | ___ / 5 | |
| Evaluation Form | ___ / 5 | ___ / 5 | |
| Clinical Evolution | ___ / 4 | ___ / 4 | |
| Patient Overview | ___ / 4 | ___ / 4 | |
| Automated Tests | ___ / 2 | ___ / 2 | |

**Total:** ___ / 20 testes passados

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

Para considerar a FASE C2.8 e a TRACK C2 completas:

- [ ] **Mínimo 95% dos testes passando** (19/20)
- [ ] Nenhum erro crítico no console
- [ ] Mensagens de erro humanizadas (sem termos técnicos)
- [ ] Nenhum card desapareceu
- [ ] `runAllTemplateTests()` passa 100%

---

## 🐛 BUGS ENCONTRADOS

Se algum teste falhar, documentar aqui:

| # | Descrição do Bug | Severidade | Status |
|---|------------------|------------|--------|
| 1 | | [ ] Low [ ] Medium [ ] High | [ ] Open [ ] Fixed |
| 2 | | [ ] Low [ ] Medium [ ] High | [ ] Open [ ] Fixed |
| 3 | | [ ] Low [ ] Medium [ ] High | [ ] Open [ ] Fixed |

---

**Testado por:** _______________  
**Data:** _______________  
**Resultado:** [ ] APROVADO [ ] REPROVADO  

---

**FASE C2.8 QA Checklist v1.0**
