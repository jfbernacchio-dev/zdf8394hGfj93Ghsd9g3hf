# 🔵 FASE C1.0 — AUDITORIA PASSIVA: VISÃO GERAL DO PACIENTE (Track C1)

**Data:** 2025-11-24  
**Status:** ✅ AUDITORIA CONCLUÍDA  
**Objetivo:** Levantamento completo e organizado de toda a estrutura atual da aba "Visão Geral" no PatientDetail.tsx para planejamento das próximas fases da Track C1.

---

## 📋 SUMÁRIO EXECUTIVO

A aba "Visão Geral" (`PatientDetail.tsx`) possui um sistema de cards **híbrido e legado**, que mistura:

1. **Cards de estatística (Stat Cards)**: Renderizados inline no código, usando IDs hardcoded
2. **Cards funcionais (Functional Cards)**: Também inline, com função `renderFunctionalCard()`
3. **Sistema de visibilidade**: Baseado em `localStorage` (`visible-cards`)
4. **Sistema de layout**: CSS Grid do Tailwind + `ResizableCard` + `ResizableSection`
5. **Permissões**: Hooks modernos (`useEffectivePermissions`, `useCardPermissions`) parcialmente integrados
6. **Metadata de cards**: Existe em `src/types/cardTypes.ts` mas **NÃO É USADO** no PatientDetail

**⚠️ PROBLEMA PRINCIPAL:**
- O sistema de metadados (`CardConfig`) existe mas está **desconectado** do PatientDetail
- Não há catálogo centralizado de cards para PatientDetail
- Layout é fixo em CSS Grid, sem sistema modular
- Não há suporte para templates por role/abordagem

---

## 🗂️ 1. LISTA COMPLETA DE CARDS EXISTENTES

### 1.1. STAT CARDS (Seção de Estatísticas - 11 cards)

Renderizados em: **Linhas 1484-1488** (PatientDetail.tsx)

| ID do Card | Nome Exibido | Domínio | Dados Necessários |
|-----------|--------------|---------|-------------------|
| `patient-stat-total` | Total no Mês | `administrative` | `totalMonthSessions` |
| `patient-stat-attended` | Comparecidas | `administrative` | `attendedMonthSessions` |
| `patient-stat-scheduled` | Agendadas | `administrative` | `scheduledMonthSessions` |
| `patient-stat-unpaid` | A Pagar | `financial` | `unpaidMonthSessions` |
| `patient-stat-nfse` | A Receber | `financial` | `nfseIssuedSessions` |
| `patient-stat-total-all` | Total Geral | `administrative` | `totalAllSessions` |
| `patient-stat-revenue-month` | Faturado | `financial` | `revenueMonth` |
| `patient-stat-paid-month` | Recebido | `financial` | `paidMonth` |
| `patient-stat-missed-month` | Faltas | `administrative` | `missedMonthSessions` |
| `patient-stat-attendance-rate` | Taxa | `administrative` | `attendanceRate` |
| `patient-stat-unscheduled-month` | Desmarcadas | `administrative` | `unscheduledMonthSessions` |

**Localização no código:**
- Configuração: Linhas 1283-1295 (`statConfigs` objeto)
- Renderização: Função `renderStatCard()` (Linhas 1280-1329)
- Loop de renderização: Linha 1485 (hardcoded array)

**Cálculo de dados:** Linhas 1250-1273 (useEffect derivado de `allSessions`)

---

### 1.2. FUNCTIONAL CARDS (Cards Funcionais - 5 cards ativos + 3 referenciados)

Renderizados em: **Linhas 1541-1700** (dentro de `ResizableSection` id `patient-functional-section`)

#### Cards Atualmente Renderizados:

| ID do Card | Nome Exibido | Domínio | Componente/Conteúdo | Linhas |
|-----------|--------------|---------|---------------------|--------|
| `patient-next-appointment` | Próximo Agendamento | `administrative` | Inline JSX (data + hora) | 1542-1559 |
| `patient-contact-info` | Informações de Contato | `general` | Inline JSX (telefone, email, endereço, CPF) | 1561-1604 |
| `patient-clinical-complaint` | Queixa Clínica | `clinical` | Dialog + texto + CID | 1606-1638 |
| `patient-clinical-info` | Informações Clínicas | `clinical` | Status, data início, observações | 1641-1668 |
| `patient-history` | Histórico | `administrative` | Lista de sessões recentes | 1670-1700 |

**Função de renderização:** `renderFunctionalCard()` - **NÃO ENCONTRADA** como função separada  
**Forma de renderização:** Cards renderizados inline com verificação `isCardVisible(cardId)`

#### Cards Mencionados em `cardTypes.ts` mas NÃO Renderizados:

- `patient-payment-info`: Dados de cobrança
- `patient-session-frequency`: Frequência de sessões
- `patient-clinical-notes`: Notas clínicas
- `patient-files-manager`: Gerenciador de arquivos
- `patient-session-history`: Histórico completo
- `patient-quick-actions`: Botões de ação
- `patient-nfse-list`: Lista de NFSe
- `patient-timeline`: Linha do tempo

---

## 🏗️ 2. ESTRUTURA ATUAL DA ABA "VISÃO GERAL"

```
┌─────────────────────────────────────────────────────────────────┐
│ PATIENT HEADER (FIXO - NÃO É CARD)                              │
│ - Avatar, nome, status, email                                   │
│ - Botões: Nova Queixa, Editar, Editar Layout                   │
│ Linhas: 1368-1442                                               │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ CONSENT/COMPLIANCE REMINDERS (FIXO - NÃO É CARD)                │
│ - <ConsentReminder />                                           │
│ Linhas: 1458-1460                                               │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 📊 SEÇÃO 1: STAT CARDS (ResizableSection)                       │
│ ID: "patient-stats-section"                                     │
│ - Grid Tailwind: 2 cols em mobile, 5 cols em desktop            │
│ - 11 cards de estatística (renderStatCard)                     │
│ - Altura padrão: 200px                                          │
│ Linhas: 1477-1490                                               │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ TABS NAVIGATION (FIXO - NÃO É CARD)                             │
│ - Visão Geral, Evolução Clínica, Queixa, etc.                  │
│ Linhas: 1492-1515                                               │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 🔧 SEÇÃO 2: FUNCTIONAL CARDS (ResizableSection)                 │
│ ID: "patient-functional-section"                                │
│ - Grid Tailwind: 1 col em mobile, 3 cols em desktop             │
│ - 5 cards funcionais renderizados                              │
│ - Altura padrão: 510px                                          │
│ Linhas: 1534-1700                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 3. FUNÇÕES INTERNAS RELEVANTES

### 3.1. Funções de Renderização

| Função | Tipo | Linhas | Descrição |
|--------|------|--------|-----------|
| `renderStatCard(cardId)` | Render Helper | 1280-1329 | Renderiza cards de estatística com base no ID |
| **Inline rendering** | N/A | 1542-1700 | Cards funcionais são renderizados inline sem função wrapper |

**⚠️ IMPORTANTE:** Não existe função `renderFunctionalCard()` genérica. Cada functional card é renderizado individualmente com JSX inline.

### 3.2. Funções de Estado e Controle

| Função | Tipo | Linhas | Descrição |
|--------|------|--------|-----------|
| `isCardVisible(cardId)` | Visibility Check | **NÃO ENCONTRADA COMO FUNÇÃO** | Verificação inline: `visibleCards.includes(cardId)` |
| `handleAddCard(cardConfig)` | State Update | **NÃO IMPLEMENTADA** | Dialog existe mas handler não conectado |
| `handleRemoveCard(cardId)` | State Update | **NÃO IMPLEMENTADA** | Funcionalidade não implementada |
| `handleEnterEditMode()` | Layout Toggle | **NÃO ENCONTRADA (aproximada)** | Alterna `isEditMode` |
| `handleExitEditMode()` | Layout Toggle | **NÃO ENCONTRADA (aproximada)** | Confirma saída de edição |
| `handleTempSizeChange()` | Layout Update | **NÃO ENCONTRADA (aproximada)** | Atualiza tamanhos temporários |
| `handleTempSectionHeightChange()` | Layout Update | **NÃO ENCONTRADA (aproximada)** | Atualiza alturas temporárias |

### 3.3. Funções de Persistência

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `resetToDefaultLayout()` | `defaultLayout.ts` | Limpa localStorage e restaura layout padrão |
| **localStorage direto** | PatientDetail.tsx | Lê/escreve `visible-cards` diretamente (Linhas 186-202) |

---

## 🔗 4. DEPENDÊNCIAS EXTERNAS

### 4.1. Hooks Usados

| Hook | Arquivo | Uso no PatientDetail | Linhas |
|------|---------|----------------------|--------|
| `useEffectivePermissions()` | `useEffectivePermissions.ts` | Controle de acesso clínico e financeiro | 89-94 |
| `useCardPermissions()` | `useCardPermissions.ts` | **IMPORTADO MAS NÃO USADO** | 95 |
| `useAuth()` | `AuthContext.tsx` | User, role, org, isClinicalProfessional | 68 |
| `useDashboardLayout()` | `useDashboardLayout.ts` | **IMPORTADO MAS NÃO USADO** | 36 |

### 4.2. Componentes Externos

| Componente | Arquivo | Uso | Linhas |
|-----------|---------|-----|--------|
| `ResizableCard` | `ResizableCard.tsx` | Wrapper para stat cards | 1301-1328 |
| `ResizableSection` | `ResizableSection.tsx` | Wrapper para seções | 1477-1489, 1534-1700 |
| `AddCardDialog` | `AddCardDialog.tsx` | Dialog de adicionar cards | **INSTANCIADO MAS NÃO FUNCIONAL** |
| `ConsentReminder` | `ConsentReminder.tsx` | Alerta de consentimento | 1459 |
| `ComplianceReminder` | `ComplianceReminder.tsx` | **IMPORTADO MAS NÃO USADO** | 40 |
| `ClinicalComplaintSummary` | `ClinicalComplaintSummary.tsx` | Aba de queixas | 2172 |
| `ClinicalEvolution` | `ClinicalEvolution.tsx` | Aba de evolução | 2190 |
| `PatientFiles` | `PatientFiles.tsx` | Aba de arquivos | 2203 |

### 4.3. Utilitários e Helpers

| Arquivo | Funções Usadas | Propósito |
|---------|----------------|-----------|
| `brazilianFormat.ts` | `formatBrazilianDate()`, `formatBrazilianCurrency()` | Formatação de valores |
| `checkPatientAccess.ts` | `checkPatientAccessLevel()` | Validação de acesso ao paciente |
| `auditLog.ts` | `logAdminAccess()` | Log de acesso admin |
| `organizationFilters.ts` | `getUserIdsInOrganization()` | Validação org |
| `roleUtils.ts` | `getEffectiveIsClinicalProfessional()` | Helper de role |

### 4.4. Tipos TypeScript

| Tipo | Arquivo | Uso |
|------|---------|-----|
| `CardConfig` | `cardTypes.ts` | **DEFINIDO MAS NÃO USADO** no PatientDetail |
| `SectionConfig` | `sectionTypes.ts` | **DEFINIDO MAS NÃO USADO** no PatientDetail |

---

## 🚫 5. ELEMENTOS FIXOS (NÃO DEVEM VIRAR CARDS)

### 5.1. Header do Paciente (Linhas 1368-1442)
- Avatar
- Nome, email, status
- Botões de ação (Nova Queixa, Editar, Editar Layout)
- **MOTIVO:** Contexto essencial fixo da página

### 5.2. Banner de Modo Somente Leitura (Linhas 1447-1456)
- Alert quando `isReadOnly === true`
- **MOTIVO:** Informação crítica de segurança

### 5.3. Consent/Compliance Reminders (Linhas 1458-1460)
- `<ConsentReminder />`
- **MOTIVO:** Conformidade legal obrigatória

### 5.4. Tabs Navigation (Linhas 1492-1515)
- TabsList com triggers para cada aba
- Botão "Nova Nota"
- **MOTIVO:** Navegação estrutural da página

### 5.5. Botão "Adicionar Card" (Edit Mode) (Linhas 1519-1530)
- Botão que abre `AddCardDialog`
- **MOTIVO:** Controle de layout

---

## ⚠️ 6. RISCOS E PONTOS SENSÍVEIS

### 6.1. RISCOS DE DADOS

| Risco | Descrição | Mitigação |
|-------|-----------|-----------|
| **Dados financeiros sensíveis** | Cards financeiros mostram valores | Usar `financialAccess !== 'none'` |
| **Dados clínicos sensíveis** | Queixa e info clínica | Usar `canAccessClinical` ou `accessLevel === 'full'` |
| **Sessões de outros terapeutas** | `allSessions` pode incluir dados de subordinados | Filtrar por `patient.user_id === user.id` |

### 6.2. RISCOS DE RENDERIZAÇÃO

| Risco | Descrição | Mitigação |
|-------|-----------|-----------|
| **Fetch async descontrolado** | `loadData()` é chamado várias vezes | Garantir que novos cards não disparem re-renders infinitos |
| **Cálculos pesados** | `filterSessions()`, `getSessionPaymentStatus()` | Memoizar cálculos derivados com `useMemo` |
| **localStorage desatualizado** | Cards salvos podem não existir mais | Validar `visibleCards` contra lista de cards disponíveis |

### 6.3. RISCOS DE PERMISSÕES

| Risco | Descrição | Mitigação |
|-------|-----------|-----------|
| **Bypass de permissões** | Cards renderizados sem verificação de domínio | Implementar verificação centralizada via `canViewCard()` |
| **Admin vs Owner vs Subordinate** | Lógica de permissões dispersa | Consolidar em hook único |
| **Modo somente leitura** | `isReadOnly` não está integrado com cards | Desabilitar botões de ação em cards quando `isReadOnly === true` |

### 6.4. RISCOS DE LAYOUT

| Risco | Descrição | Mitigação |
|-------|-----------|-----------|
| **Tamanhos salvos inválidos** | `localStorage` pode ter tamanhos corrompidos | Validar ranges (min/max) antes de aplicar |
| **Conflitos de posição** | Cards sobrepostos no sistema atual | Sistema de grid modular resolve isso |
| **Performance com muitos cards** | Re-renders em cascata | Usar `React.memo()` e otimizar dependências |

---

## 📂 7. ARQUIVOS QUE SERÃO AFETADOS NAS PRÓXIMAS FASES

### 7.1. MODIFICAÇÕES PESADAS (Reescrita Parcial)

| Arquivo | Seções Afetadas | Motivo |
|---------|----------------|--------|
| **`src/pages/PatientDetail.tsx`** | Linhas 1250-1700 (aba Overview) | Substituir renderização inline por sistema modular |
| **`src/lib/defaultLayout.ts`** | Todo o arquivo | Deprecar e criar novo sistema de layout modular |
| **`src/types/cardTypes.ts`** | Adicionar cards de paciente | Expandir com metadados específicos de PatientDetail |

### 7.2. CRIAÇÃO DE NOVOS ARQUIVOS

| Arquivo Novo | Propósito |
|--------------|-----------|
| `src/lib/patientCardRegistry.tsx` | Catálogo de cards do PatientDetail (análogo a `dashboardCardRegistry.tsx`) |
| `src/lib/defaultSectionsPatient.ts` | **JÁ EXISTE** mas precisa ser atualizado com cards corretos |
| `src/lib/defaultLayoutPatient.ts` | Layout modular para PatientDetail (análogo a `defaultLayoutDashboardExample.ts`) |
| `src/lib/patientLayoutPersistence.ts` | Funções de save/load (análogo a `dashboardLayoutPersistence.ts`) |
| `src/hooks/usePatientLayout.ts` | Hook de gerenciamento (análogo a `useDashboardLayout.ts`) |

### 7.3. MODIFICAÇÕES LEVES (Ajustes)

| Arquivo | O Que Ajustar |
|---------|---------------|
| `src/components/AddCardDialog.tsx` | Adicionar suporte para modo `patient` (já tem `mode` prop) |
| `src/components/ResizableCard.tsx` | Nenhuma alteração necessária |
| `src/components/ResizableSection.tsx` | Nenhuma alteração necessária |
| `src/hooks/useCardPermissions.ts` | Adicionar suporte para cards de paciente |

---

## 🔒 8. ÁREAS INTOCÁVEIS (FORA DO ESCOPO DA TRACK C1)

### 8.1. Outras Abas do PatientDetail

| Aba | Linhas (aprox.) | Motivo |
|-----|-----------------|--------|
| **Evolução Clínica** | 2184-2199 | Sistema separado (`ClinicalEvolution.tsx`) |
| **Queixa Clínica** | 2166-2181 | Sistema separado (`ClinicalComplaintSummary.tsx`) |
| **Agendamentos** | Não mapeada | Fora do escopo |
| **Faturamento** | 2051-2163 | Fora do escopo |
| **Arquivos** | 2202-2204 | Sistema separado (`PatientFiles.tsx`) |

### 8.2. Dialogs e Modais

- `Dialog` de edição de sessão (Linhas 2209-2378)
- `Dialog` de invoice (Linhas 2381-2500+)
- `Dialog` de queixa clínica
- `Dialog` de nota

**MOTIVO:** Não são cards, são ações isoladas.

### 8.3. Sistema de Permissões (Backend)

- RLS policies
- `resolveEffectivePermissions()`
- `checkPatientAccess.ts`

**MOTIVO:** Track C1 é frontend-only. Usa permissões existentes.

### 8.4. Componentes de Outras Páginas

- `Dashboard.tsx`
- `DashboardExample.tsx`
- Outros patient detail components

**MOTIVO:** Track C1 é exclusiva para a aba "Visão Geral" do PatientDetail.

---

## 🎯 9. PONTOS DE EXTENSÃO FUTURA (Templates)

### 9.1. Estrutura Necessária (Futuro, não C1)

Para suportar templates por role/abordagem, será necessário:

```typescript
interface PatientLayoutTemplate {
  id: string;
  name: string;
  professionalRoleId?: string;        // Se específico de role
  clinicalApproachId?: string;        // Se específico de abordagem
  isDefault: boolean;
  sections: {
    [sectionId: string]: {
      cardLayouts: CardLayout[];
    }
  };
}
```

### 9.2. Onde Plugar Templates (Planejamento)

1. **Hook:** `usePatientLayout()` deve detectar role/abordagem do usuário
2. **Seletor:** Buscar template correspondente em `user_layout_templates` (table)
3. **Fallback:** Se não houver template específico, usar default universal

**⚠️ TRACK C1 NÃO IMPLEMENTA TEMPLATES.** Apenas prepara a arquitetura.

---

## 🗺️ 10. MAPEAMENTO DE DEPENDÊNCIAS (GRAFO)

```
PatientDetail.tsx (Visão Geral)
│
├─ Estados Internos
│  ├─ visibleCards: string[] (localStorage)
│  ├─ tempSizes: Record<cardId, size>
│  ├─ tempSectionHeights: Record<sectionId, height>
│  └─ isEditMode: boolean
│
├─ Dados Carregados (loadData)
│  ├─ patient (Supabase: patients)
│  ├─ allSessions (Supabase: sessions)
│  ├─ complaint (Supabase: patient_complaints)
│  ├─ sessionHistory (Supabase: session_history)
│  └─ nfseIssued (Supabase: nfse_issued)
│
├─ Permissões (Hooks)
│  ├─ useAuth() → user, isAdmin, roleGlobal, organizationId
│  ├─ useEffectivePermissions() → canAccessClinical, financialAccess
│  └─ checkPatientAccessLevel() → accessLevel ('none' | 'view' | 'full')
│
├─ Componentes de Card
│  ├─ ResizableCard (wrapper)
│  │  └─ Stat Cards (inline JSX)
│  │
│  └─ Functional Cards (inline JSX)
│     ├─ patient-next-appointment
│     ├─ patient-contact-info
│     ├─ patient-clinical-complaint
│     ├─ patient-clinical-info
│     └─ patient-history
│
├─ Componentes Estruturais
│  ├─ ResizableSection (2 seções)
│  │  ├─ patient-stats-section
│  │  └─ patient-functional-section
│  │
│  └─ AddCardDialog (não funcional)
│
└─ Persistência (localStorage direto)
   ├─ visible-cards: string[]
   ├─ card-size-{cardId}: {width, height, x, y}
   └─ section-height-{sectionId}: number
```

---

## 📊 11. RESUMO FINAL E PRÓXIMOS PASSOS

### 11.1. O Que Está Pronto

✅ **Estrutura básica de seções**
- Duas seções resizable funcionais
- Sistema de altura ajustável

✅ **Metadados de cards (parcial)**
- `cardTypes.ts` tem definições de alguns cards
- Falta conectar ao PatientDetail

✅ **Hooks de permissão**
- `useEffectivePermissions()` funcional
- `useCardPermissions()` importado mas não usado

✅ **Componentes reutilizáveis**
- `ResizableCard` e `ResizableSection` prontos
- `AddCardDialog` existe mas precisa integração

### 11.2. O Que Está Faltando (Track C1 Completa)

❌ **Catálogo de cards centralizado**
- Criar `patientCardRegistry.tsx` com todos os cards
- Conectar renderização inline ao registry

❌ **Sistema de layout modular**
- Criar `defaultLayoutPatient.ts` com estrutura de grid
- Implementar `usePatientLayout()` hook

❌ **Persistência adequada**
- Criar `patientLayoutPersistence.ts`
- Integrar com Supabase (`user_layout_preferences`)

❌ **Integração de permissões**
- Conectar `useCardPermissions()` ao fluxo de renderização
- Filtrar cards por domínio automaticamente

❌ **AddCardDialog funcional**
- Implementar handlers `handleAddCard()` e `handleRemoveCard()`
- Conectar ao estado de `visibleCards`

### 11.3. Estimativa de Complexidade

| Fase | Tarefa | Complexidade | Risco |
|------|--------|--------------|-------|
| **C1.1** | Criar `patientCardRegistry.tsx` | 🟡 Média | Baixo |
| **C1.2** | Refatorar renderização inline para usar registry | 🔴 Alta | Médio |
| **C1.3** | Criar `usePatientLayout()` hook | 🟡 Média | Baixo |
| **C1.4** | Implementar persistência em Supabase | 🟢 Baixa | Baixo |
| **C1.5** | Conectar `AddCardDialog` | 🟢 Baixa | Baixo |
| **C1.6** | Testes e validação | 🟡 Média | Médio |

### 11.4. Arquivos a Criar (FASE C1.1)

1. **`src/lib/patientCardRegistry.tsx`** (~500 linhas)
   - Todos os cards com JSX Component
   - Metadados completos (CardConfig)
   - Funções de render

2. **`src/lib/defaultLayoutPatient.ts`** (~200 linhas)
   - Layout grid modular padrão
   - Função de reset

3. **`src/lib/patientLayoutPersistence.ts`** (~150 linhas)
   - Save/load para Supabase + localStorage
   - Validações

4. **`src/hooks/usePatientLayout.ts`** (~300 linhas)
   - Hook de gerenciamento de estado
   - Auto-save com debounce

### 11.5. Arquivos a Modificar (FASE C1.2-C1.5)

1. **`src/pages/PatientDetail.tsx`**
   - Substituir linhas 1250-1700 (aba Overview)
   - Adicionar import do registry
   - Usar `usePatientLayout()` hook

2. **`src/lib/defaultSectionsPatient.ts`**
   - Atualizar com cards corretos
   - Adicionar metadados faltantes

3. **`src/components/AddCardDialog.tsx`**
   - Adicionar suporte para modo `patient`
   - Conectar handlers

4. **`src/types/cardTypes.ts`**
   - Adicionar cards faltantes de paciente

---

## ✅ CONCLUSÃO DA AUDITORIA

**Status:** Auditoria completa realizada com sucesso.

**Próximo Passo:** Aguardar aprovação do usuário para prosseguir com **FASE C1.1** (Criação do Card Registry).

**Observações Críticas:**
1. O sistema atual é **funcional mas legado**
2. Existe muita duplicação e código inline
3. Hooks e componentes modernos estão **importados mas não usados**
4. A Track C1 vai **modernizar sem quebrar funcionalidade**

**Risco Geral:** 🟡 **MÉDIO** - Sistema legado mas estável, refatoração planejada.

---

**Relatório gerado por:** Lovable AI  
**Data:** 2025-11-24  
**Track:** C1 (Visão Geral do Paciente)  
**Fase:** C1.0 (Auditoria Passiva)
