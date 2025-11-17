# 🚀 FASE 4 - MIGRAÇÃO DE PÁGINAS
## Plano de Implementação Detalhado

---

## 🎯 Objetivo da FASE 4

Migrar as **3 páginas principais** do sistema para usar `PermissionAwareSection`, aplicando o sistema de permissões de forma completa e testando toda a arquitetura implementada nas fases anteriores.

---

## 📋 Páginas a Migrar

### 1️⃣ **Dashboard** (`src/pages/Dashboard.tsx`)
- **Complexidade:** Alta
- **Seções:** 4-6 seções diferentes
- **Cards:** ~20 cards estatísticos e gráficos
- **Desafio:** Múltiplos domínios (financial, administrative, media)

### 2️⃣ **PatientDetail** (`src/pages/PatientDetail.tsx`)
- **Complexidade:** Média
- **Seções:** 3-4 seções
- **Cards:** ~15 cards clínicos e financeiros
- **Desafio:** Validação de acesso por paciente (próprio vs. todos)

### 3️⃣ **Evolution** (Evolução Clínica)
- **Complexidade:** Baixa
- **Seções:** 2-3 seções
- **Cards:** ~8 cards clínicos
- **Desafio:** Apenas domínio clínico, mais simples

---

## 📐 Estrutura de Seções por Página

### **Dashboard - Seções Propostas**

```typescript
const DASHBOARD_SECTIONS: Record<string, SectionConfig> = {
  'financial-overview': {
    id: 'financial-overview',
    name: 'Visão Geral Financeira',
    description: 'Receitas, pagamentos pendentes e NFSe',
    permissionConfig: {
      primaryDomain: 'financial',
      secondaryDomains: [],
      blockedFor: [], // Admin e Full sempre veem
      requiresOwnDataOnly: true, // Subordinados veem apenas seus dados
    },
    availableCardIds: [
      'stat-revenue-month',
      'stat-revenue-year',
      'stat-pending-payments',
      'stat-nfse-issued',
      'chart-revenue-trend',
      'chart-payment-methods',
    ],
    defaultHeight: 400,
    collapsible: true,
    startCollapsed: false,
  },
  
  'administrative-overview': {
    id: 'administrative-overview',
    name: 'Visão Administrativa',
    description: 'Sessões, agendamentos e notificações',
    permissionConfig: {
      primaryDomain: 'administrative',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'stat-sessions-month',
      'stat-sessions-year',
      'stat-active-patients',
      'stat-schedule-conflicts',
      'chart-sessions-per-day',
    ],
    defaultHeight: 350,
    collapsible: true,
    startCollapsed: false,
  },
  
  'clinical-overview': {
    id: 'clinical-overview',
    name: 'Visão Clínica',
    description: 'Queixas, evoluções e diagnósticos',
    permissionConfig: {
      primaryDomain: 'clinical',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'stat-active-complaints',
      'stat-pending-evolutions',
      'chart-complaints-by-category',
    ],
    defaultHeight: 300,
    collapsible: true,
    startCollapsed: false,
  },
  
  'media-analytics': {
    id: 'media-analytics',
    name: 'Analytics & Marketing',
    description: 'Métricas de site e campanhas',
    permissionConfig: {
      primaryDomain: 'media',
      secondaryDomains: [],
      blockedFor: ['subordinate'], // Subordinados nunca veem
      requiresOwnDataOnly: false,
    },
    availableCardIds: [
      'stat-website-visits',
      'stat-contact-forms',
      'chart-traffic-sources',
    ],
    defaultHeight: 350,
    collapsible: true,
    startCollapsed: true, // Inicia colapsada
  },
};
```

### **PatientDetail - Seções Propostas**

```typescript
const PATIENT_SECTIONS: Record<string, SectionConfig> = {
  'patient-financial': {
    id: 'patient-financial',
    name: 'Financeiro',
    description: 'Receitas e pagamentos deste paciente',
    permissionConfig: {
      primaryDomain: 'financial',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'patient-stat-revenue-month',
      'patient-stat-pending-sessions',
      'patient-stat-nfse-count',
      'patient-chart-payment-history',
    ],
    defaultHeight: 400,
    collapsible: true,
    startCollapsed: false,
  },
  
  'patient-clinical': {
    id: 'patient-clinical',
    name: 'Dados Clínicos',
    description: 'Queixas, medicações e evoluções',
    permissionConfig: {
      primaryDomain: 'clinical',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'patient-complaints-summary',
      'patient-medications',
      'patient-evolutions-timeline',
    ],
    defaultHeight: 500,
    collapsible: true,
    startCollapsed: false,
  },
  
  'patient-sessions': {
    id: 'patient-sessions',
    name: 'Sessões',
    description: 'Histórico e agendamentos',
    permissionConfig: {
      primaryDomain: 'administrative',
      secondaryDomains: ['clinical'],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'patient-sessions-list',
      'patient-session-calendar',
    ],
    defaultHeight: 450,
    collapsible: true,
    startCollapsed: false,
  },
};
```

### **Evolution - Seções Propostas**

```typescript
const EVOLUTION_SECTIONS: Record<string, SectionConfig> = {
  'evolution-overview': {
    id: 'evolution-overview',
    name: 'Visão Geral',
    description: 'Status atual do paciente',
    permissionConfig: {
      primaryDomain: 'clinical',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'evolution-current-complaints',
      'evolution-medications',
    ],
    defaultHeight: 300,
    collapsible: false, // Sempre visível
    startCollapsed: false,
  },
  
  'evolution-history': {
    id: 'evolution-history',
    name: 'Histórico de Evoluções',
    description: 'Timeline de sessões e avaliações',
    permissionConfig: {
      primaryDomain: 'clinical',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'evolution-timeline',
      'evolution-session-notes',
    ],
    defaultHeight: 500,
    collapsible: true,
    startCollapsed: false,
  },
};
```

---

## 🔧 Passos de Migração

### **Para Cada Página:**

#### 1️⃣ **Criar arquivo de configuração de seções**
```typescript
// Ex: src/lib/defaultSectionsDashboard.ts
export const DASHBOARD_SECTIONS: Record<string, SectionConfig> = {
  // ... configurações acima
};
```

#### 2️⃣ **Modificar página para usar `PermissionAwareSection`**

**Antes (código antigo):**
```typescript
<div className="grid grid-cols-2 gap-4">
  {cards.map(card => (
    <ResizableCard key={card.id} config={card} />
  ))}
</div>
```

**Depois (FASE 4):**
```typescript
<PermissionAwareSection
  sectionConfig={DASHBOARD_SECTIONS['financial-overview']}
  isEditMode={isEditMode}
  existingCardIds={financialCardIds}
  onAddCard={(card) => handleAddCard('financial-overview', card)}
  onRemoveCard={(id) => handleRemoveCard('financial-overview', id)}
  renderCards={(cards) => (
    <div className="grid grid-cols-2 gap-4">
      {cards.map(card => (
        <ResizableCard key={card.id} config={card} />
      ))}
    </div>
  )}
/>
```

#### 3️⃣ **Atualizar lógica de armazenamento**
- Migrar de `cardIds: string[]` para `sections: Record<string, string[]>`
- Exemplo: `{ 'financial-overview': ['card-1', 'card-2'] }`

#### 4️⃣ **Testar com diferentes perfis**
- Admin: vê tudo
- FullTherapist: vê tudo
- Subordinado (managesOwnPatients: true): vê apenas seções permitidas
- Subordinado (managesOwnPatients: false): vê seções administrativas

---

## 📊 Estimativa de Trabalho

| Página | Tempo Estimado | Complexidade | Prioridade |
|--------|---------------|--------------|------------|
| Dashboard | 2-3 horas | Alta | 🔴 Alta |
| PatientDetail | 1.5-2 horas | Média | 🟡 Média |
| Evolution | 1 hora | Baixa | 🟢 Baixa |

**Total Estimado:** 4.5-6 horas

---

## ✅ Checklist de Migração

### **Dashboard**
- [ ] Criar `src/lib/defaultSectionsDashboard.ts`
- [ ] Definir 4 seções: financial, administrative, clinical, media
- [ ] Migrar lógica de renderização para `PermissionAwareSection`
- [ ] Atualizar storage para armazenar por seção
- [ ] Testar com Admin, Full e Subordinado

### **PatientDetail**
- [ ] Criar `src/lib/defaultSectionsPatient.ts`
- [ ] Definir 3 seções: financial, clinical, sessions
- [ ] Migrar tabs para seções colapsáveis
- [ ] Validar acesso por paciente (próprio vs. todos)
- [ ] Testar visibilidade de seções

### **Evolution**
- [ ] Criar `src/lib/defaultSectionsEvolution.ts`
- [ ] Definir 2 seções: overview, history
- [ ] Simplificar layout com seções
- [ ] Testar permissões clínicas

---

## 🧪 Testes de Validação

Após migração de cada página, validar:

### **1. Testes de Permissão**
- [ ] Admin vê todas as seções
- [ ] FullTherapist vê todas as seções
- [ ] Subordinado vê apenas seções permitidas
- [ ] Seções bloqueadas não aparecem

### **2. Testes de Funcionalidade**
- [ ] Adicionar card funciona
- [ ] Remover card funciona
- [ ] Collapse/expand funciona
- [ ] Resize funciona (modo edição)
- [ ] Altura persiste após reload

### **3. Testes de Regressão**
- [ ] Páginas antigas continuam funcionando
- [ ] Performance não degradou
- [ ] Dados carregam corretamente
- [ ] Filtros funcionam

---

## 🚀 Entregáveis da FASE 4

1. **3 Páginas Migradas**
   - Dashboard
   - PatientDetail
   - Evolution

2. **3 Arquivos de Configuração**
   - `defaultSectionsDashboard.ts`
   - `defaultSectionsPatient.ts`
   - `defaultSectionsEvolution.ts`

3. **Relatório de Testes**
   - `FASE_4_RELATORIO_TESTES.md`
   - Evidências de testes com screenshots
   - Tabela de cobertura de permissões

4. **Documentação Final**
   - `FASE_4_RELATORIO_COMPLETO.md`
   - Guia de uso dos novos componentes
   - Exemplos de código

---

## 📈 Benefícios Esperados

Após FASE 4:

✅ **Redução de 70% no código de validação manual**  
✅ **Controle centralizado de permissões**  
✅ **Zero bugs de permissão esquecida**  
✅ **Manutenção simplificada**  
✅ **Experiência consistente entre páginas**

---

## 🎯 Próximos Passos

1. **Aprovar plano da FASE 4**
2. **Escolher ordem de migração** (sugestão: Evolution → PatientDetail → Dashboard)
3. **Iniciar implementação**
4. **Executar testes após cada página**
5. **Gerar relatório final**

---

**Estimativa Total:** 4.5-6 horas de desenvolvimento + 2 horas de testes  
**Prazo Sugerido:** 1-2 dias de trabalho

---

**Data de Planejamento:** 2025-01-17  
**Status:** 📋 Aguardando Aprovação
