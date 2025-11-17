# ✅ FASE 4 - CHECKLIST DE TESTES
## Migração de Páginas

---

## 🎯 Status dos Testes

**⚠️ TESTES FUNCIONAIS ADIADOS PARA FASE 5**

**Motivo:** A FASE 4 criou apenas as **configurações de seções** (infraestrutura). As páginas reais ainda não foram modificadas para usar essas configurações. Testes só farão sentido após a migração ser aplicada na FASE 5.

---

## 📋 O Que Será Testado na FASE 5

Quando as páginas forem efetivamente migradas:

### 1️⃣ **Testes de Visibilidade de Seções**

#### **Evolution (2 seções)**
- [ ] **evolution-overview** sempre visível (não colapsável)
- [ ] **evolution-charts** colapsável e funcional
- [ ] Subordinado com acesso clínico vê ambas
- [ ] Subordinado sem acesso clínico não vê nenhuma

#### **PatientDetail (4 seções)**
- [ ] **patient-financial** oculta para subordinados sem acesso financeiro
- [ ] **patient-clinical** visível apenas com acesso clínico
- [ ] **patient-sessions** visível para todos (administrative)
- [ ] **patient-contact** sempre visível (general domain)

#### **Dashboard (4 seções)**
- [ ] **dashboard-financial** oculta para subordinados sem acesso financeiro
- [ ] **dashboard-administrative** visível para todos
- [ ] **dashboard-clinical** visível apenas com acesso clínico
- [ ] **dashboard-media** BLOQUEADA para subordinados (única seção com `blockedFor`)

---

### 2️⃣ **Testes de Filtragem de Cards**

#### **Teste: AddCardDialog com Seção Específica**
1. Abrir modo de edição no Dashboard
2. Clicar "Adicionar Card" na seção **dashboard-financial**
3. ✅ Verificar que apenas cards com `domain: 'financial'` aparecem
4. ✅ Verificar que cards de outros domínios estão ocultos

#### **Teste: Cards Bloqueados por Role**
1. Login como Subordinado
2. Abrir Dashboard
3. ✅ Verificar que **dashboard-media** não aparece
4. ✅ Verificar que cards de mídia não aparecem em AddCardDialog

---

### 3️⃣ **Testes de Filtragem de Dados (Own Data)**

#### **Teste: Subordinado vê apenas próprios dados**
1. Login como Subordinado com `managesOwnPatients: true`
2. Abrir Dashboard
3. ✅ Cards financeiros mostram apenas receita de seus pacientes
4. ✅ Cards administrativos mostram apenas suas sessões
5. ✅ Gráficos filtram por seus dados

#### **Teste: Full Therapist vê todos os dados**
1. Login como FullTherapist
2. Abrir Dashboard
3. ✅ Cards mostram dados de todos os pacientes
4. ✅ Gráficos agregam toda a clínica

---

### 4️⃣ **Testes de Collapse/Expand**

- [ ] **dashboard-media** inicia colapsada (`startCollapsed: true`)
- [ ] Outras seções iniciam expandidas
- [ ] Clicar no botão colapsa/expande corretamente
- [ ] Estado de collapse persiste durante navegação na mesma sessão

---

### 5️⃣ **Testes de Modo de Edição**

#### **Dashboard**
- [ ] Ativar modo de edição
- [ ] Botão "Adicionar Card" aparece em cada seção
- [ ] Handles de resize aparecem
- [ ] Redimensionar seção funciona
- [ ] Salvar persiste mudanças
- [ ] Cancelar descarta mudanças

#### **PatientDetail**
- [ ] Mesmo fluxo do Dashboard
- [ ] Cards específicos do paciente carregam corretamente

#### **Evolution**
- [ ] Mesmo fluxo do Dashboard
- [ ] Gráficos de evolução renderizam corretamente

---

### 6️⃣ **Testes de Integração por Perfil**

#### **Admin**
- [ ] Vê todas as 10 seções em todas as páginas
- [ ] Pode adicionar qualquer card em qualquer seção
- [ ] Nenhuma restrição de permissão

#### **FullTherapist**
- [ ] Vê todas as 10 seções em todas as páginas
- [ ] Mesmas permissões que Admin
- [ ] Dados agregados de toda a clínica

#### **Subordinado (managesOwnPatients: true)**
- [ ] Dashboard: 3 seções visíveis (financial, administrative, clinical)
- [ ] Dashboard: **dashboard-media** OCULTA
- [ ] PatientDetail (próprio paciente): 4 seções visíveis
- [ ] PatientDetail (paciente de outro): acesso negado
- [ ] Evolution (próprio paciente): 2 seções visíveis
- [ ] Todos os dados filtrados para mostrar apenas seus pacientes

#### **Subordinado (managesOwnPatients: false)**
- [ ] Dashboard: 1 seção visível (administrative)
- [ ] Dashboard: seções financial e clinical OCULTAS
- [ ] PatientDetail: acesso a todos os pacientes da clínica
- [ ] Vê dados de todos, mas sem acesso clínico/financeiro

#### **Accountant**
- [ ] Dashboard: 1 seção visível (financial)
- [ ] Todas as outras seções OCULTAS
- [ ] Acesso apenas a dados financeiros

---

### 7️⃣ **Testes de Performance**

- [ ] Páginas carregam em <2 segundos
- [ ] Memoização de `getAvailableCardsForSection` evita recálculos
- [ ] Sem re-renders desnecessários ao alternar seções
- [ ] Smooth animations ao colapsar/expandir

---

### 8️⃣ **Testes de Regressão**

- [ ] Todas as funcionalidades antigas continuam funcionando
- [ ] Nenhum dado desapareceu
- [ ] Filtros de período funcionam
- [ ] Gráficos renderizam corretamente
- [ ] Exportações/downloads funcionam
- [ ] Links para outras páginas funcionam

---

## 🧪 Testes Manuais Recomendados (FASE 5)

### **Roteiro de Teste Completo:**

#### **1. Setup Inicial**
1. Criar 4 usuários de teste (Admin, Full, Subordinado Own, Subordinado All)
2. Popular banco com dados de teste
3. Fazer login com cada perfil

#### **2. Dashboard - Admin**
1. Login como Admin
2. ✅ Contar seções visíveis (deve ser 4)
3. ✅ Tentar adicionar card em cada seção
4. ✅ Verificar que **dashboard-media** aparece
5. ✅ Redimensionar e salvar layout

#### **3. Dashboard - Subordinado**
1. Login como Subordinado
2. ✅ Contar seções visíveis (deve ser 3)
3. ✅ Verificar que **dashboard-media** NÃO aparece
4. ✅ Verificar filtro de dados (apenas seus pacientes)

#### **4. PatientDetail - Subordinado**
1. Login como Subordinado
2. Acessar paciente **próprio**
3. ✅ Contar seções visíveis (deve ser 4)
4. Acessar paciente de **outro terapeuta**
5. ✅ Deve mostrar erro de acesso negado

#### **5. Evolution - Subordinado**
1. Login como Subordinado
2. Acessar evolução de paciente **próprio**
3. ✅ Verificar que 2 seções aparecem
4. ✅ Verificar que gráficos carregam corretamente

#### **6. Teste de Collapse/Expand**
1. Login como qualquer perfil
2. Dashboard: verificar que **dashboard-media** inicia colapsada
3. ✅ Expandir e verificar que conteúdo aparece
4. ✅ Colapsar outras seções e verificar persistência

#### **7. Teste de Modo de Edição**
1. Login como Admin
2. Ativar modo de edição em cada página
3. ✅ Adicionar cards
4. ✅ Remover cards
5. ✅ Redimensionar seções
6. ✅ Salvar e verificar persistência
7. ✅ Cancelar e verificar rollback

---

## 📊 Matriz de Cobertura de Testes

| Funcionalidade | Admin | Full | Sub(Own) | Sub(All) | Accountant |
|----------------|-------|------|----------|----------|------------|
| Ver seção financial | ✅ | ✅ | ✅* | ❌ | ✅ |
| Ver seção administrative | ✅ | ✅ | ✅* | ✅ | ❌ |
| Ver seção clinical | ✅ | ✅ | ✅* | ❌ | ❌ |
| Ver seção media | ✅ | ✅ | ❌ | ❌ | ❌ |
| Adicionar cards | ✅ | ✅ | ✅ | ✅ | ❌ |
| Modo de edição | ✅ | ✅ | ✅ | ✅ | ❌ |
| Filtro de dados | ❌ | ❌ | ✅ | ❌ | ❌ |

*Legenda:*
- ✅ = Acesso total
- ✅* = Acesso filtrado (apenas próprios dados)
- ❌ = Sem acesso

---

## ✅ Conclusão

**TESTES DA FASE 4 SERÃO EXECUTADOS NA FASE 5** quando as páginas forem efetivamente migradas.

**Próximo Passo:**
1. Iniciar FASE 5 - Aplicação das Seções
2. Executar todos os testes listados acima
3. Validar comportamento end-to-end com todos os perfis

---

**Data:** 2025-01-17  
**Decisão:** ⏸️ Testes adiados para aplicação completa (FASE 5)  
**Cobertura Planejada:** 100% dos perfis de usuário e 100% das seções
