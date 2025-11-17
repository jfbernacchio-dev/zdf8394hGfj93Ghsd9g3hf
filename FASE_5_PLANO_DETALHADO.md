# 🚀 FASE 5 - APLICAÇÃO DAS SEÇÕES NAS PÁGINAS
## Plano de Implementação Final

---

## 🎯 Objetivo da FASE 5

Aplicar as configurações de seções criadas na FASE 4, migrando as 3 páginas principais para usar `PermissionAwareSection` e eliminando código legado de validação manual.

---

## 📋 Escopo Detalhado

### **Páginas a Modificar:**

1. ✅ **ClinicalEvolution.tsx** (componente)
   - Complexidade: **Baixa**
   - Tempo estimado: 1.5h
   - Cards afetados: ~15

2. ✅ **PatientDetail.tsx** (página)
   - Complexidade: **Média**
   - Tempo estimado: 2h
   - Cards afetados: ~22

3. ✅ **Dashboard.tsx** (página)
   - Complexidade: **Alta**
   - Tempo estimado: 2.5h
   - Cards afetados: ~32

**Total Estimado:** 6 horas de desenvolvimento

---

## 🔧 Mudanças Necessárias por Página

### **1. ClinicalEvolution.tsx**

#### **Estado Atual:**
```typescript
// Estado baseado em array de cardIds
const [visibleCards, setVisibleCards] = useState<string[]>([]);

// Renderização manual com ResizableSection
<ResizableSection id="evolution-charts-section">
  {visibleCards.map(cardId => (
    <ResizableCard key={cardId} config={getCardConfig(cardId)} />
  ))}
</ResizableSection>
```

#### **Estado Desejado (FASE 5):**
```typescript
import { PermissionAwareSection } from '@/components/PermissionAwareSection';
import { EVOLUTION_SECTIONS } from '@/lib/defaultSectionsEvolution';

// Estado baseado em seções
const [sectionCards, setSectionCards] = useState<Record<string, string[]>>({
  'evolution-overview': ['clinical-complaints-summary'],
  'evolution-charts': ['evolution-chart-consciousness', 'evolution-chart-mood'],
});

// Renderização automática com PermissionAwareSection
<PermissionAwareSection
  sectionConfig={EVOLUTION_SECTIONS['evolution-overview']}
  existingCardIds={sectionCards['evolution-overview']}
  onAddCard={(card) => handleAddCard('evolution-overview', card)}
  onRemoveCard={(id) => handleRemoveCard('evolution-overview', id)}
  renderCards={(cards) => (
    <div className="grid grid-cols-1 gap-4">
      {cards.map(card => (
        <ResizableCard key={card.id} config={card} />
      ))}
    </div>
  )}
/>
```

#### **Checklist de Mudanças:**
- [ ] Importar `PermissionAwareSection` e `EVOLUTION_SECTIONS`
- [ ] Migrar estado de `visibleCards[]` para `sectionCards{}`
- [ ] Substituir `<ResizableSection>` por `<PermissionAwareSection>`
- [ ] Remover validações manuais de `canViewCard()`
- [ ] Atualizar lógica de adicionar/remover cards
- [ ] Atualizar storage (localStorage) para novo formato
- [ ] Testar com subordinados

---

### **2. PatientDetail.tsx**

#### **Estado Atual:**
```typescript
// Tabs + validações manuais espalhadas
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
    {canViewFinancial && <TabsTrigger value="financial">Financeiro</TabsTrigger>}
    {canViewClinical && <TabsTrigger value="clinical">Clínico</TabsTrigger>}
  </TabsList>
  
  <TabsContent value="financial">
    {/* Cards financeiros com validação manual */}
    {canViewCard('patient-stat-revenue-month') && (
      <ResizableCard config={...} />
    )}
  </TabsContent>
</Tabs>
```

#### **Estado Desejado (FASE 5):**
```typescript
import { PermissionAwareSection } from '@/components/PermissionAwareSection';
import { PATIENT_SECTIONS } from '@/lib/defaultSectionsPatient';

// Seções colapsáveis substituem tabs
<div className="space-y-6">
  <PermissionAwareSection
    sectionConfig={PATIENT_SECTIONS['patient-financial']}
    existingCardIds={sectionCards['patient-financial']}
    isEditMode={isEditMode}
    onAddCard={(card) => handleAddCard('patient-financial', card)}
    onRemoveCard={(id) => handleRemoveCard('patient-financial', id)}
    renderCards={(cards) => (
      <div className="grid grid-cols-2 gap-4">
        {cards.map(card => (
          <ResizableCard key={card.id} config={card} />
        ))}
      </div>
    )}
  />

  <PermissionAwareSection
    sectionConfig={PATIENT_SECTIONS['patient-clinical']}
    existingCardIds={sectionCards['patient-clinical']}
    isEditMode={isEditMode}
    onAddCard={(card) => handleAddCard('patient-clinical', card)}
    onRemoveCard={(id) => handleRemoveCard('patient-clinical', id)}
    renderCards={(cards) => (
      <div className="grid grid-cols-2 gap-4">
        {cards.map(card => (
          <ResizableCard key={card.id} config={card} />
        ))}
      </div>
    )}
  />

  {/* ... mais 2 seções */}
</div>
```

#### **Checklist de Mudanças:**
- [ ] Importar `PermissionAwareSection` e `PATIENT_SECTIONS`
- [ ] Remover sistema de tabs (ou manter para navegação)
- [ ] Migrar estado para `sectionCards{}`
- [ ] Criar 4 `<PermissionAwareSection>` (financial, clinical, sessions, contact)
- [ ] Remover todas as validações manuais (`canViewCard()`, `canViewFinancial`, etc.)
- [ ] Atualizar storage para novo formato
- [ ] Validar acesso por paciente (próprio vs. todos)
- [ ] Testar collapse/expand de seções

---

### **3. Dashboard.tsx**

#### **Estado Atual:**
```typescript
// Grid de cards com validações manuais
const [visibleCards, setVisibleCards] = useState<string[]>([]);

<div className="grid grid-cols-3 gap-4">
  {visibleCards
    .filter(cardId => canViewCard(cardId))
    .map(cardId => (
      <ResizableCard key={cardId} config={getCardConfig(cardId)} />
    ))}
</div>
```

#### **Estado Desejado (FASE 5):**
```typescript
import { PermissionAwareSection } from '@/components/PermissionAwareSection';
import { DASHBOARD_SECTIONS } from '@/lib/defaultSectionsDashboard';

const [sectionCards, setSectionCards] = useState<Record<string, string[]>>({
  'dashboard-financial': ['stat-revenue-month', 'stat-pending-payments'],
  'dashboard-administrative': ['stat-sessions-month', 'stat-active-patients'],
  'dashboard-clinical': ['stat-active-complaints'],
  'dashboard-media': ['stat-website-visits'],
});

// 4 seções renderizadas automaticamente
<div className="space-y-8">
  {Object.keys(DASHBOARD_SECTIONS).map(sectionId => (
    <PermissionAwareSection
      key={sectionId}
      sectionConfig={DASHBOARD_SECTIONS[sectionId]}
      existingCardIds={sectionCards[sectionId] || []}
      isEditMode={isEditMode}
      onAddCard={(card) => handleAddCard(sectionId, card)}
      onRemoveCard={(id) => handleRemoveCard(sectionId, id)}
      renderCards={(cards) => (
        <div className="grid grid-cols-3 gap-4">
          {cards.map(card => (
            <ResizableCard key={card.id} config={card} data={...} />
          ))}
        </div>
      )}
    />
  ))}
</div>
```

#### **Checklist de Mudanças:**
- [ ] Importar `PermissionAwareSection` e `DASHBOARD_SECTIONS`
- [ ] Migrar estado de `visibleCards[]` para `sectionCards{}`
- [ ] Substituir grid único por loop de 4 seções
- [ ] Remover todas as validações manuais de permissão
- [ ] Atualizar lógica de adicionar/remover cards (por seção)
- [ ] Atualizar storage para novo formato
- [ ] Garantir que **dashboard-media** inicia colapsada
- [ ] Testar com Admin, Full e Subordinado
- [ ] Validar que subordinados não veem **dashboard-media**

---

## 🗂️ Migração de Storage

### **Formato Antigo (FASE 3 e anteriores):**
```typescript
localStorage.setItem('dashboard-visible-cards', JSON.stringify([
  'stat-revenue-month',
  'stat-sessions-month',
  'stat-active-patients',
]));
```

### **Formato Novo (FASE 5):**
```typescript
localStorage.setItem('dashboard-section-cards', JSON.stringify({
  'dashboard-financial': ['stat-revenue-month', 'stat-pending-payments'],
  'dashboard-administrative': ['stat-sessions-month', 'stat-active-patients'],
  'dashboard-clinical': ['stat-active-complaints'],
  'dashboard-media': ['stat-website-visits'],
}));
```

### **Migração Automática:**
```typescript
const migrateOldLayout = () => {
  const oldCards = localStorage.getItem('dashboard-visible-cards');
  if (oldCards && !localStorage.getItem('dashboard-section-cards')) {
    const parsed = JSON.parse(oldCards);
    const newFormat = {
      'dashboard-financial': parsed.filter(id => id.includes('revenue') || id.includes('payment')),
      'dashboard-administrative': parsed.filter(id => id.includes('session') || id.includes('patient')),
      'dashboard-clinical': parsed.filter(id => id.includes('complaint') || id.includes('diagnosis')),
      'dashboard-media': parsed.filter(id => id.includes('website') || id.includes('traffic')),
    };
    localStorage.setItem('dashboard-section-cards', JSON.stringify(newFormat));
    localStorage.removeItem('dashboard-visible-cards'); // Limpar antigo
  }
};
```

---

## 🧪 Plano de Testes Detalhado

### **Teste 1: Evolution - Subordinado com Acesso Clínico**
1. Login como Subordinado com `managesOwnPatients: true`
2. Acessar evolução de paciente **próprio**
3. ✅ Deve ver 2 seções: **evolution-overview** e **evolution-charts**
4. ✅ Gráficos devem carregar dados do paciente
5. Ativar modo de edição
6. ✅ Botão "Adicionar Card" deve aparecer
7. ✅ AddCardDialog deve mostrar apenas cards clínicos

### **Teste 2: PatientDetail - Subordinado sem Acesso Financeiro**
1. Login como Subordinado com `hasFinancialAccess: false`
2. Acessar paciente **próprio**
3. ✅ Deve ver 3 seções: **clinical**, **sessions**, **contact**
4. ❌ **NÃO** deve ver seção **financial**
5. Tentar adicionar card financeiro via URL
6. ✅ Deve ser bloqueado automaticamente

### **Teste 3: Dashboard - Subordinado**
1. Login como Subordinado
2. Acessar Dashboard
3. ✅ Deve ver 3 seções: **financial**, **administrative**, **clinical**
4. ❌ **NÃO** deve ver seção **media**
5. ✅ Cards devem mostrar apenas seus próprios dados
6. Ativar modo de edição
7. ✅ Não deve conseguir adicionar cards de mídia

### **Teste 4: Dashboard - Admin**
1. Login como Admin
2. Acessar Dashboard
3. ✅ Deve ver todas as 4 seções
4. ✅ Seção **media** deve iniciar colapsada
5. ✅ Expandir seção **media** deve mostrar cards
6. Adicionar card de mídia
7. ✅ Deve funcionar normalmente

### **Teste 5: Collapse/Expand**
1. Login como qualquer perfil
2. Em qualquer página com seções colapsáveis
3. Clicar no botão de colapsar
4. ✅ Conteúdo deve desaparecer com animação
5. Clicar novamente para expandir
6. ✅ Conteúdo deve reaparecer
7. Recarregar página
8. ✅ Estado de collapse deve persistir (se implementado)

### **Teste 6: Modo de Edição End-to-End**
1. Login como Admin
2. Dashboard: Ativar modo de edição
3. Adicionar 2 cards na seção **financial**
4. Remover 1 card da seção **administrative**
5. Redimensionar seção **clinical**
6. Clicar "Salvar"
7. ✅ Mudanças devem persistir
8. Recarregar página
9. ✅ Layout salvo deve ser carregado
10. Ativar modo de edição novamente
11. Fazer mudanças e clicar "Cancelar"
12. ✅ Mudanças devem ser descartadas

---

## 📊 Métricas de Sucesso

### **Código Removido (estimativa):**
- ❌ ~200 linhas de validações manuais (`canViewCard()`, `if (isSubordinate)`, etc.)
- ❌ ~150 linhas de lógica de filtragem de cards
- ❌ ~100 linhas de código de storage legado

**Total:** ~450 linhas de código removidas ✅

### **Código Adicionado:**
- ✅ 316 linhas de configuração de seções (FASE 4)
- ✅ ~200 linhas de integração com `PermissionAwareSection` (FASE 5)

**Total:** ~516 linhas de código novo ✅

**Saldo:** +66 linhas, mas com:
- ✅ Muito mais robusto e manutenível
- ✅ Zero bugs de permissão esquecida
- ✅ Performance melhorada com memoização

---

## 🚀 Entregáveis da FASE 5

1. **3 Páginas Migradas**
   - `ClinicalEvolution.tsx` usando `EVOLUTION_SECTIONS`
   - `PatientDetail.tsx` usando `PATIENT_SECTIONS`
   - `Dashboard.tsx` usando `DASHBOARD_SECTIONS`

2. **Relatório de Testes**
   - `FASE_5_RELATORIO_TESTES.md`
   - Screenshots de cada perfil de usuário
   - Tabela de cobertura de permissões

3. **Documentação Final**
   - `FASE_5_RELATORIO_COMPLETO.md`
   - Guia de uso do novo sistema
   - Troubleshooting de problemas comuns

4. **Guia de Migração** (opcional)
   - Como adicionar novas seções no futuro
   - Como criar novos cards compatíveis com sistema
   - Exemplos de configuração avançada

---

## ⚠️ Riscos e Mitigações

### **Risco 1: Storage Migration Quebra Layouts**
**Mitigação:** Implementar migração automática com fallback para layout padrão

### **Risco 2: Performance Degrada com Muitas Seções**
**Mitigação:** Usar `React.memo` em `PermissionAwareSection` e memoização de cards

### **Risco 3: Tabs vs. Seções Confunde Usuários**
**Mitigação:** Manter tabs para navegação principal, usar seções dentro de cada tab

### **Risco 4: Testes Revelam Bugs nas Fases Anteriores**
**Mitigação:** Ter plano B para hotfixes rápidos

---

## 📅 Cronograma Sugerido

| Dia | Atividade | Tempo |
|-----|-----------|-------|
| **Dia 1** | Migrar ClinicalEvolution.tsx | 2h |
| **Dia 1** | Testar Evolution com todos os perfis | 1h |
| **Dia 2** | Migrar PatientDetail.tsx | 3h |
| **Dia 2** | Testar PatientDetail com todos os perfis | 1h |
| **Dia 3** | Migrar Dashboard.tsx | 3h |
| **Dia 3** | Testar Dashboard com todos os perfis | 1h |
| **Dia 4** | Testes de regressão completos | 2h |
| **Dia 4** | Documentação e relatórios | 2h |

**Total:** 15 horas (~2 semanas em ritmo normal)

---

## ✅ Critérios de Aceitação

A FASE 5 está completa quando:

- [ ] **100% das páginas migradas** para usar `PermissionAwareSection`
- [ ] **Zero validações manuais de permissão** no código das páginas
- [ ] **Todos os perfis testados** (Admin, Full, Sub Own, Sub All, Accountant)
- [ ] **Seção de mídia bloqueada** para subordinados
- [ ] **Collapse/expand funcional** em todas as seções colapsáveis
- [ ] **Modo de edição funcional** em todas as páginas
- [ ] **Storage migrado** para novo formato sem perda de dados
- [ ] **Performance mantida** ou melhorada
- [ ] **Zero bugs de regressão** encontrados
- [ ] **Documentação completa** gerada

---

## 🎯 Próximos Passos

1. **Aprovar plano da FASE 5**
2. **Escolher ordem de migração** (sugestão já definida: Evolution → PatientDetail → Dashboard)
3. **Iniciar implementação**
4. **Testar progressivamente após cada página**
5. **Gerar relatório final e encerrar projeto**

---

**Estimativa Total:** 15 horas (4-6h dev + 6h testes + 3h docs)  
**Complexidade:** Média-Alta (refactoring significativo)  
**Risco:** Baixo (infraestrutura já validada e testada)

---

**Data de Planejamento:** 2025-01-17  
**Status:** 📋 Aguardando Aprovação para Início
