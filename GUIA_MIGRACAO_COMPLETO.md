# 📘 GUIA COMPLETO DE MIGRAÇÃO
## Sistema de Permissões por Seções - FASES 1-5

---

## 🎯 O Que Este Guia Contém

Este documento é um guia completo para entender e aplicar o sistema de permissões por seções implementado nas FASES 1-5. Você aprenderá:

1. **Arquitetura geral** do sistema
2. **Como usar** os componentes criados
3. **Como migrar** páginas existentes
4. **Padrões** e best practices
5. **Troubleshooting** de problemas comuns

---

## 📚 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Componentes Principais](#componentes-principais)
3. [Guia Passo-a-Passo de Migração](#guia-passo-a-passo-de-migração)
4. [Exemplos Práticos](#exemplos-práticos)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## 🏗️ Visão Geral da Arquitetura

### **Hierarquia do Sistema**

```
┌─────────────────────────────────────────────────────────────┐
│                    FASE 1: Tipos Base                       │
│  • PermissionDomain (5 domínios)                            │
│  • AccessLevel (none, read, write, full)                    │
│  • UserRole (admin, fulltherapist, subordinate, accountant) │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│            FASE 1: Configuração de Cards                    │
│  • CardPermissionConfig (domain, blockedFor, etc.)          │
│  • ALL_AVAILABLE_CARDS (~69 cards mapeados)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           FASE 1: Configuração de Seções                    │
│  • SectionPermissionConfig (primaryDomain, blockedFor)      │
│  • SectionConfig (10 seções mapeadas)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              FASE 2: Hook Central                           │
│  • useCardPermissions()                                     │
│    - canViewCard()                                          │
│    - canViewSection()                                       │
│    - getAvailableCardsForSection()                          │
│    - shouldShowSection()                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         FASE 3: Componentes Inteligentes                    │
│  • PermissionAwareSection                                   │
│    - Auto-validação de permissões                           │
│    - Filtragem automática de cards                          │
│    - Integração com AddCardDialog                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│   FASE 4-5: Configurações e Aplicação                      │
│  • defaultSectionsDashboard.ts                              │
│  • defaultSectionsPatient.ts                                │
│  • defaultSectionsEvolution.ts                              │
│  • Exemplo de referência (DashboardExample.tsx)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Componentes Principais

### **1. PermissionAwareSection** (FASE 3)

O componente central que gerencia permissões e renderização de seções.

**Props:**
```typescript
interface PermissionAwareSectionProps {
  sectionConfig: SectionConfig;          // Configuração da seção
  isEditMode?: boolean;                  // Modo de edição ativo?
  onAddCard?: (card: CardConfig) => void;   // Callback ao adicionar
  onRemoveCard?: (cardId: string) => void;  // Callback ao remover
  existingCardIds?: string[];            // Cards já adicionados
  tempHeight?: number | null;            // Altura temporária (edit mode)
  onTempHeightChange?: (id: string, height: number) => void;
  renderCards?: (cards: CardConfig[]) => React.ReactNode;  // Renderização customizada
  children?: React.ReactNode;            // Ou usar children direto
}
```

**Comportamento Automático:**
- ✅ Valida permissões do usuário
- ✅ Oculta-se se usuário não tiver acesso
- ✅ Filtra cards por permissão e domínio
- ✅ Gerencia collapse/expand
- ✅ Integra com AddCardDialog
- ✅ Suporta modo de edição com resize

---

### **2. useCardPermissions Hook** (FASE 2)

Hook central para todas as validações de permissão.

**Funções Principais:**
```typescript
const {
  // FASE 1: Card-level
  canViewCard,              // (cardId: string) => boolean
  hasAccess,                // (domain, level) => boolean
  shouldFilterToOwnData,    // () => boolean
  canViewFullFinancial,     // () => boolean
  
  // FASE 2: Section-level
  canViewSection,           // (sectionConfig) => boolean
  getAvailableCardsForSection,  // (sectionConfig) => CardConfig[]
  shouldShowSection,        // (sectionConfig) => boolean
  
  // FASE 2: Helpers
  getCardsByDomain,         // (domain) => CardConfig[]
  getVisibleCards,          // (cardIds[]) => CardConfig[]
  
  // Estado
  loading,
  permissions,
} = useCardPermissions();
```

---

### **3. SectionConfig** (FASE 1)

Estrutura de configuração de uma seção.

```typescript
interface SectionConfig {
  id: string;                    // Identificador único
  name: string;                  // Nome exibido
  description: string;           // Descrição da seção
  
  permissionConfig: {
    primaryDomain: PermissionDomain;     // Domínio principal
    secondaryDomains?: PermissionDomain[]; // Domínios alternativos
    blockedFor?: UserRole[];             // Roles bloqueadas
    requiresOwnDataOnly?: boolean;       // Filtrar por dados próprios
  };
  
  availableCardIds: string[];    // IDs dos cards disponíveis
  defaultHeight?: number;        // Altura padrão em pixels
  collapsible?: boolean;         // Pode ser colapsada?
  startCollapsed?: boolean;      // Inicia colapsada?
}
```

---

## 📖 Guia Passo-a-Passo de Migração

### **Passo 1: Entender a Página Atual**

Antes de migrar, identifique:

1. **Quantas "áreas" lógicas** a página tem?
   - Ex: Dashboard tem 4 áreas (financial, administrative, clinical, media)
   
2. **Quais cards** estão em cada área?
   - Liste os IDs dos cards por área
   
3. **Quem pode ver** cada área?
   - Admin? FullTherapist? Subordinados?

---

### **Passo 2: Criar Arquivo de Configuração**

Crie um arquivo `src/lib/defaultSections[NomeDaPagina].ts`:

```typescript
import type { SectionConfig } from '@/types/sectionTypes';

export const MINHA_PAGINA_SECTIONS: Record<string, SectionConfig> = {
  'minha-secao-1': {
    id: 'minha-secao-1',
    name: 'Nome da Seção 1',
    description: 'Descrição clara',
    permissionConfig: {
      primaryDomain: 'financial',  // financial, administrative, clinical, media, general
      secondaryDomains: [],
      blockedFor: [],  // ['subordinate'] se quiser bloquear subordinados
      requiresOwnDataOnly: true,  // true se subordinados devem ver apenas seus dados
    },
    availableCardIds: [
      'card-id-1',
      'card-id-2',
      // ... todos os cards desta seção
    ],
    defaultHeight: 400,
    collapsible: true,
    startCollapsed: false,
  },
  
  'minha-secao-2': {
    // ... próxima seção
  },
};

export const DEFAULT_MINHA_PAGINA_SECTIONS = {
  'minha-secao-1': ['card-id-1', 'card-id-2'],
  'minha-secao-2': ['card-id-3'],
};
```

---

### **Passo 3: Migrar Estado da Página**

**ANTES (código antigo):**
```typescript
const [visibleCards, setVisibleCards] = useState<string[]>([]);

useEffect(() => {
  const saved = localStorage.getItem('minha-pagina-cards');
  if (saved) {
    setVisibleCards(JSON.parse(saved));
  }
}, []);
```

**DEPOIS (FASE 5):**
```typescript
import { MINHA_PAGINA_SECTIONS, DEFAULT_MINHA_PAGINA_SECTIONS } from '@/lib/defaultSectionsMinhaPagina';

const [sectionCards, setSectionCards] = useState<Record<string, string[]>>({});

useEffect(() => {
  const saved = localStorage.getItem('minha-pagina-section-cards');
  if (saved) {
    setSectionCards(JSON.parse(saved));
  } else {
    // Migração automática (opcional)
    const oldCards = localStorage.getItem('minha-pagina-cards');
    if (oldCards) {
      const migrated = migrateOldLayout(JSON.parse(oldCards));
      setSectionCards(migrated);
    } else {
      setSectionCards(DEFAULT_MINHA_PAGINA_SECTIONS);
    }
  }
}, []);
```

---

### **Passo 4: Migrar Handlers**

**Adicionar Card:**
```typescript
const handleAddCard = (sectionId: string, card: CardConfig) => {
  setSectionCards(prev => ({
    ...prev,
    [sectionId]: [...(prev[sectionId] || []), card.id],
  }));
  
  // Opcional: salvar imediatamente
  localStorage.setItem('minha-pagina-section-cards', JSON.stringify({
    ...sectionCards,
    [sectionId]: [...(sectionCards[sectionId] || []), card.id],
  }));
};
```

**Remover Card:**
```typescript
const handleRemoveCard = (sectionId: string, cardId: string) => {
  setSectionCards(prev => ({
    ...prev,
    [sectionId]: (prev[sectionId] || []).filter(id => id !== cardId),
  }));
};
```

---

### **Passo 5: Substituir Renderização**

**ANTES (código antigo):**
```typescript
<div className="grid grid-cols-3 gap-4">
  {visibleCards
    .filter(cardId => canViewCard(cardId))  // ❌ Validação manual
    .map(cardId => (
      <MyCard key={cardId} id={cardId} />
    ))}
</div>
```

**DEPOIS (FASE 5):**
```typescript
import { PermissionAwareSection } from '@/components/PermissionAwareSection';

{Object.keys(MINHA_PAGINA_SECTIONS).map(sectionId => (
  <PermissionAwareSection
    key={sectionId}
    sectionConfig={MINHA_PAGINA_SECTIONS[sectionId]}
    isEditMode={isEditMode}
    existingCardIds={sectionCards[sectionId] || []}
    onAddCard={(card) => handleAddCard(sectionId, card)}
    onRemoveCard={(cardId) => handleRemoveCard(sectionId, cardId)}
    renderCards={(cards) => (
      <div className="grid grid-cols-3 gap-4">
        {cards.map(card => (
          <MyCard key={card.id} config={card} />
        ))}
      </div>
    )}
  />
))}
```

✅ **Validação automática! Sem `canViewCard()` manual!**

---

### **Passo 6: Testar com Diferentes Perfis**

1. **Login como Admin**
   - ✅ Deve ver todas as seções
   - ✅ Pode adicionar qualquer card

2. **Login como Subordinado**
   - ✅ Seções bloqueadas devem estar ocultas
   - ✅ Cards devem estar filtrados

3. **Testar Collapse/Expand**
   - ✅ Clicar no botão deve colapsar/expandir

4. **Testar Modo de Edição**
   - ✅ Adicionar e remover cards deve funcionar
   - ✅ Salvar deve persistir mudanças

---

## 💡 Exemplos Práticos

### **Exemplo 1: Seção Simples (Sempre Visível)**

```typescript
const generalSection: SectionConfig = {
  id: 'contact-section',
  name: 'Contato',
  description: 'Informações de contato',
  permissionConfig: {
    primaryDomain: 'general',  // Domínio geral = sempre visível
    blockedFor: [],
    requiresOwnDataOnly: false,
  },
  availableCardIds: ['contact-info', 'contact-form'],
  defaultHeight: 300,
  collapsible: false,  // Não pode ser colapsada
  startCollapsed: false,
};

<PermissionAwareSection
  sectionConfig={generalSection}
  existingCardIds={['contact-info']}
  renderCards={(cards) => (
    <div className="space-y-4">
      {cards.map(card => <ContactCard key={card.id} config={card} />)}
    </div>
  )}
/>
```

---

### **Exemplo 2: Seção Bloqueada para Subordinados**

```typescript
const mediaSection: SectionConfig = {
  id: 'media-analytics',
  name: 'Analytics',
  description: 'Métricas de marketing',
  permissionConfig: {
    primaryDomain: 'media',
    blockedFor: ['subordinate'],  // 🔒 Subordinados não veem
    requiresOwnDataOnly: false,
  },
  availableCardIds: ['website-visits', 'conversion-rate'],
  defaultHeight: 400,
  collapsible: true,
  startCollapsed: true,  // Inicia colapsada
};

// Se usuário for subordinado, esta seção não renderiza!
<PermissionAwareSection
  sectionConfig={mediaSection}
  existingCardIds={['website-visits']}
  renderCards={(cards) => <MediaCards cards={cards} />}
/>
```

---

### **Exemplo 3: Seção com Dados Filtrados**

```typescript
const financialSection: SectionConfig = {
  id: 'financial-overview',
  name: 'Financeiro',
  description: 'Receitas e pagamentos',
  permissionConfig: {
    primaryDomain: 'financial',
    blockedFor: [],
    requiresOwnDataOnly: true,  // 🔍 Subordinados veem apenas seus dados
  },
  availableCardIds: ['revenue-month', 'pending-payments'],
  defaultHeight: 400,
  collapsible: true,
  startCollapsed: false,
};

// Cards dentro renderizarão dados filtrados automaticamente
// graças ao hook useCardPermissions + shouldFilterToOwnData()
<PermissionAwareSection
  sectionConfig={financialSection}
  existingCardIds={['revenue-month']}
  renderCards={(cards) => (
    <FinancialCards
      cards={cards}
      filterToOwn={shouldFilterToOwnData()}  // Hook detecta automaticamente
    />
  )}
/>
```

---

## 🔧 Troubleshooting

### **Problema 1: Seção não aparece**

**Sintoma:** `PermissionAwareSection` não renderiza nada

**Possíveis Causas:**
1. ❌ Usuário não tem permissão ao `primaryDomain`
2. ❌ Role do usuário está em `blockedFor`
3. ❌ Nenhum card visível na seção

**Solução:**
```typescript
const { canViewSection, getAvailableCardsForSection } = useCardPermissions();

// Debug:
console.log('Can view section?', canViewSection(sectionConfig));
console.log('Available cards:', getAvailableCardsForSection(sectionConfig));
```

---

### **Problema 2: Cards não aparecem no AddCardDialog**

**Sintoma:** Dialog abre vazio ou com poucos cards

**Possíveis Causas:**
1. ❌ `availableCardIds` da seção está vazio
2. ❌ Cards têm `domain` diferente do `primaryDomain` da seção
3. ❌ Cards estão bloqueados para o role atual

**Solução:**
```typescript
// Verificar compatibilidade de domínios
const sectionDomains = [
  sectionConfig.permissionConfig.primaryDomain,
  ...(sectionConfig.permissionConfig.secondaryDomains || []),
];

const cardDomain = card.permissionConfig.domain;
const isCompatible = sectionDomains.includes(cardDomain);
```

---

### **Problema 3: Layout não persiste após reload**

**Sintoma:** Mudanças são perdidas ao recarregar página

**Causa:** Storage não está sendo salvo corretamente

**Solução:**
```typescript
const handleSaveLayout = () => {
  // ✅ Salvar no formato correto
  localStorage.setItem('minha-pagina-section-cards', JSON.stringify(sectionCards));
  
  toast({
    title: "Layout salvo",
    description: "Mudanças foram salvas.",
  });
};
```

---

### **Problema 4: Migração de layout antigo falha**

**Sintoma:** Usuários perdem seus layouts customizados após migração

**Solução:** Implementar migração automática robusta
```typescript
const migrateOldLayout = (oldCards: string[]): Record<string, string[]> => {
  const migrated: Record<string, string[]> = {};
  
  // Inicializar todas as seções
  Object.keys(MY_SECTIONS).forEach(sectionId => {
    migrated[sectionId] = [];
  });
  
  // Classificar cada card na seção correta
  oldCards.forEach(cardId => {
    const card = ALL_AVAILABLE_CARDS.find(c => c.id === cardId);
    if (card) {
      const domain = card.permissionConfig.domain;
      
      // Encontrar seção compatível
      const targetSection = Object.values(MY_SECTIONS).find(section => {
        const allowedDomains = [
          section.permissionConfig.primaryDomain,
          ...(section.permissionConfig.secondaryDomains || []),
        ];
        return allowedDomains.includes(domain);
      });
      
      if (targetSection) {
        migrated[targetSection.id].push(cardId);
      }
    }
  });
  
  return migrated;
};
```

---

## ❓ FAQ

### **Q: Posso ter uma seção sem cards?**
**A:** Sim! Se `renderCards` não for fornecido, use `children` para conteúdo customizado:

```typescript
<PermissionAwareSection sectionConfig={mySection}>
  <div>Conteúdo customizado aqui</div>
</PermissionAwareSection>
```

---

### **Q: Como adicionar um novo domínio?**
**A:** Você **não pode** adicionar novos domínios. Os 5 domínios são fixos:
- `financial`
- `administrative`
- `clinical`
- `media`
- `general`

Se precisar de algo novo, classifique no domínio mais próximo ou use `general`.

---

### **Q: Posso bloquear uma seção para múltiplos roles?**
**A:** Sim!

```typescript
permissionConfig: {
  primaryDomain: 'financial',
  blockedFor: ['subordinate', 'accountant'],  // Bloquear 2 roles
}
```

---

### **Q: Como fazer uma seção que inicia colapsada apenas para alguns usuários?**
**A:** Use lógica condicional:

```typescript
const { isSubordinate } = useAuth();

<PermissionAwareSection
  sectionConfig={{
    ...mySection,
    startCollapsed: isSubordinate,  // Colapsada apenas para subordinados
  }}
  // ... demais props
/>
```

---

### **Q: Preciso usar `PermissionAwareSection` para TODAS as seções?**
**A:** Não! Use apenas onde precisar de:
- Validação automática de permissões
- Filtragem de cards por domínio
- Modo de edição com AddCardDialog

Para conteúdo estático simples, use `<div>` normal.

---

## 🎓 Conclusão

Com este guia, você tem:

✅ **Arquitetura completa** do sistema  
✅ **Guia passo-a-passo** de migração  
✅ **Exemplos práticos** para cada caso  
✅ **Troubleshooting** de problemas comuns  
✅ **FAQ** com respostas rápidas  

**Próximos Passos:**
1. Revisar o `DashboardExample.tsx` (implementação de referência)
2. Escolher uma página para migrar
3. Seguir o guia passo-a-passo
4. Testar com todos os perfis

**Boa sorte com a migração!** 🚀
