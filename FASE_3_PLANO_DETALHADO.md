# 🚀 FASE 3 - COMPONENTES INTELIGENTES

**Status:** ⏳ AGUARDANDO APROVAÇÃO  
**Duração Estimada:** 3-4 horas  
**Prioridade:** 🔴 CRÍTICA (Bloqueador para FASE 4)

---

## 🎯 OBJETIVO DA FASE 3

Criar componentes React que **automaticamente** adaptam sua renderização baseado nas permissões do usuário, eliminando a necessidade de verificações manuais de permissões em cada página.

### Componentes a Implementar

1. **`PermissionAwareSection`** 🆕 - Seção que se auto-filtra e renderiza apenas cards visíveis
2. **`AddCardDialog` (Modificado)** - Filtrar cards disponíveis por seção e permissões

---

## 📋 ESCOPO DETALHADO

### 1. Componente: `PermissionAwareSection`

**Arquivo:** `src/components/PermissionAwareSection.tsx` (NOVO)

#### Responsabilidades

1. **Auto-Validação**: Verifica `shouldShowSection()` automaticamente
2. **Filtragem de Cards**: Usa `getAvailableCardsForSection()` para obter cards visíveis
3. **Renderização Condicional**: Não renderiza se não há cards ou permissão
4. **Layout Customizável**: Suporta diferentes layouts (grid, flex, custom)
5. **Drag & Drop Ready**: Compatível com `@dnd-kit` para reorganização

#### Props Interface

```typescript
interface PermissionAwareSectionProps {
  /**
   * Configuração da seção com permissões
   */
  config: SectionConfig;
  
  /**
   * IDs dos cards atualmente visíveis (do layout salvo)
   * Se não fornecido, usa todos os availableCardIds da config
   */
  visibleCardIds?: string[];
  
  /**
   * Função para renderizar cada card
   * Recebe CardConfig e deve retornar o componente do card
   */
  renderCard: (card: CardConfig, index: number) => React.ReactNode;
  
  /**
   * Callback quando cards visíveis mudam (drag & drop)
   */
  onCardsChange?: (cardIds: string[]) => void;
  
  /**
   * Layout da seção (grid, flex, custom)
   */
  layout?: 'grid' | 'flex' | 'custom';
  
  /**
   * Classes CSS personalizadas
   */
  className?: string;
  
  /**
   * Se true, permite adicionar/remover cards
   */
  editable?: boolean;
  
  /**
   * Se true, mostra indicador de loading
   */
  loading?: boolean;
  
  /**
   * Altura da seção (para ResizablePanel)
   */
  height?: number;
  
  /**
   * Callback quando altura muda
   */
  onHeightChange?: (height: number) => void;
}
```

#### Implementação Completa

```typescript
import { useMemo } from 'react';
import { useCardPermissions } from '@/hooks/useCardPermissions';
import type { SectionConfig } from '@/types/sectionTypes';
import type { CardConfig } from '@/types/cardTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoIcon } from 'lucide-react';

export function PermissionAwareSection({
  config,
  visibleCardIds,
  renderCard,
  onCardsChange,
  layout = 'grid',
  className = '',
  editable = false,
  loading = false,
  height,
  onHeightChange,
}: PermissionAwareSectionProps) {
  const { shouldShowSection, getAvailableCardsForSection } = useCardPermissions();

  // Verificar se seção deve ser exibida
  const canShow = shouldShowSection(config);

  // Obter cards disponíveis para o usuário
  const availableCards = useMemo(() => {
    return getAvailableCardsForSection(config);
  }, [config, getAvailableCardsForSection]);

  // Filtrar apenas cards visíveis (do layout salvo) que usuário pode ver
  const visibleCards = useMemo(() => {
    if (!visibleCardIds) return availableCards;
    
    return visibleCardIds
      .map(id => availableCards.find(c => c.id === id))
      .filter((card): card is CardConfig => !!card);
  }, [visibleCardIds, availableCards]);

  // Não renderizar se não tem permissão ou não há cards
  if (!canShow || visibleCards.length === 0) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  // Layout classes
  const layoutClasses = {
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    flex: 'flex flex-wrap gap-4',
    custom: '',
  };

  return (
    <section className={`space-y-4 ${className}`}>
      {/* Header da Seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {config.name}
          </h2>
          {config.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {config.description}
            </p>
          )}
        </div>
        
        {/* Badge de quantidade de cards */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <InfoIcon className="h-4 w-4" />
          <span>{visibleCards.length} cards disponíveis</span>
        </div>
      </div>

      {/* Aviso se há cards disponíveis mas não visíveis */}
      {availableCards.length > visibleCards.length && editable && (
        <Alert>
          <AlertDescription>
            Há {availableCards.length - visibleCards.length} cards adicionais disponíveis.
            Clique em "Adicionar Card" para visualizar.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards */}
      <div className={layoutClasses[layout]}>
        {visibleCards.map((card, index) => (
          <div key={card.id}>
            {renderCard(card, index)}
          </div>
        ))}
      </div>
    </section>
  );
}
```

#### Variantes do Componente

##### Variante 1: Seção Simples (Não-editável)
```typescript
<PermissionAwareSection
  config={dashboardFinancialSection}
  renderCard={(card) => <MetricCard config={card} />}
  layout="grid"
/>
```

##### Variante 2: Seção Editável com Drag & Drop
```typescript
<PermissionAwareSection
  config={patientDetailClinicalSection}
  visibleCardIds={savedCardIds}
  onCardsChange={handleSaveCards}
  renderCard={(card, index) => (
    <DraggableCard id={card.id} index={index}>
      <ClinicalCard config={card} />
    </DraggableCard>
  )}
  editable={true}
/>
```

##### Variante 3: Seção Redimensionável
```typescript
<ResizablePanel defaultSize={height} onResize={onHeightChange}>
  <PermissionAwareSection
    config={evolutionChartsSection}
    renderCard={(card) => <ChartCard config={card} />}
    height={height}
  />
</ResizablePanel>
```

---

### 2. Modificação: `AddCardDialog`

**Arquivo:** `src/components/AddCardDialog.tsx` (MODIFICAR)

#### Alterações Necessárias

##### Antes (FASE 0)
```typescript
// Mostrava TODOS os cards sem filtro de permissões
const allCards = ALL_AVAILABLE_CARDS;
```

##### Depois (FASE 3)
```typescript
const { getAvailableCardsForSection } = useCardPermissions();

// Filtrar cards pela seção atual
const availableCards = useMemo(() => {
  if (!currentSection) return [];
  return getAvailableCardsForSection(currentSection);
}, [currentSection, getAvailableCardsForSection]);
```

#### Props a Adicionar

```typescript
interface AddCardDialogProps {
  // ... props existentes
  
  /**
   * NOVO: Configuração da seção atual
   * Usado para filtrar cards compatíveis
   */
  sectionConfig?: SectionConfig;
  
  /**
   * NOVO: Callback quando cards da seção mudam
   */
  onSectionCardsChange?: (cardIds: string[]) => void;
}
```

#### Implementação da Filtragem

```typescript
// Dentro do componente AddCardDialog

const { getAvailableCardsForSection } = useCardPermissions();

// Filtrar cards disponíveis para a seção
const availableCards = useMemo(() => {
  if (!sectionConfig) {
    // Fallback: mostrar todos os cards que usuário pode ver
    return ALL_AVAILABLE_CARDS.filter(card => canViewCard(card.id));
  }
  
  // Filtrar por seção específica
  return getAvailableCardsForSection(sectionConfig);
}, [sectionConfig, getAvailableCardsForSection]);

// Excluir cards já visíveis
const availableToAdd = useMemo(() => {
  return availableCards.filter(card => !visibleCards.includes(card.id));
}, [availableCards, visibleCards]);
```

#### UI Atualizada

```typescript
<DialogContent className="max-w-4xl max-h-[80vh]">
  <DialogHeader>
    <DialogTitle>
      Adicionar Card
      {sectionConfig && (
        <span className="text-sm font-normal text-muted-foreground ml-2">
          para "{sectionConfig.name}"
        </span>
      )}
    </DialogTitle>
    <DialogDescription>
      {availableToAdd.length > 0 
        ? `${availableToAdd.length} cards disponíveis para adicionar`
        : 'Todos os cards compatíveis já estão visíveis'
      }
    </DialogDescription>
  </DialogHeader>

  {/* Filtros por Domínio */}
  {sectionConfig && (
    <div className="flex gap-2 mb-4">
      <Badge variant="outline">
        Domínio: {sectionConfig.permissionConfig.primaryDomain}
      </Badge>
      {sectionConfig.permissionConfig.secondaryDomains?.map(domain => (
        <Badge key={domain} variant="secondary">
          + {domain}
        </Badge>
      ))}
    </div>
  )}

  {/* Lista de Cards */}
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {availableToAdd.map(card => (
      <CardPreview
        key={card.id}
        card={card}
        onAdd={() => handleAddCard(card.id)}
      />
    ))}
  </div>
</DialogContent>
```

---

## 🎯 CASOS DE USO PRÁTICOS

### Caso 1: Dashboard com Seções Financeiras e Clínicas

```typescript
// Dashboard.tsx (FASE 4 - Preview)

const DASHBOARD_SECTIONS: SectionConfig[] = [
  {
    id: 'dashboard-financial',
    name: 'Métricas Financeiras',
    permissionConfig: {
      primaryDomain: 'financial',
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'dashboard-revenue-month',
      'dashboard-revenue-total',
      'dashboard-chart-revenue-trend',
    ],
  },
  {
    id: 'dashboard-clinical',
    name: 'Visão Clínica',
    permissionConfig: {
      primaryDomain: 'clinical',
      secondaryDomains: ['administrative'],
    },
    availableCardIds: [
      'dashboard-total-patients',
      'dashboard-sessions-month',
      'dashboard-chart-session-types',
    ],
  },
  {
    id: 'dashboard-media',
    name: 'Marketing e Mídia',
    permissionConfig: {
      primaryDomain: 'media',
      blockedFor: ['subordinate'], // Subordinados não veem
    },
    availableCardIds: [
      'dashboard-google-ads',
      'dashboard-website-traffic',
    ],
  },
];

function Dashboard() {
  const [visibleCards, setVisibleCards] = useState(loadSavedCards());

  return (
    <div className="space-y-8">
      {DASHBOARD_SECTIONS.map(section => (
        <PermissionAwareSection
          key={section.id}
          config={section}
          visibleCardIds={visibleCards[section.id]}
          renderCard={(card) => <DashboardCard config={card} />}
          onCardsChange={(cards) => handleSaveCards(section.id, cards)}
          editable={true}
        />
      ))}
    </div>
  );
}
```

**Comportamento Esperado:**
- **Admin/Full**: Vê todas as 3 seções
- **Subordinado COM `hasFinancialAccess`**: Vê seções financeira e clínica
- **Subordinado SEM `hasFinancialAccess`**: Vê apenas seção clínica
- **Seção de mídia**: Nunca renderizada para subordinados

---

### Caso 2: PatientDetail com Seções Clínicas

```typescript
// PatientDetail.tsx (FASE 4 - Preview)

const PATIENT_SECTIONS: SectionConfig[] = [
  {
    id: 'patient-overview',
    name: 'Visão Geral',
    permissionConfig: {
      primaryDomain: 'general',
    },
    availableCardIds: [
      'patient-contact-info',
      'patient-next-appointment',
    ],
  },
  {
    id: 'patient-clinical',
    name: 'Dados Clínicos',
    permissionConfig: {
      primaryDomain: 'clinical',
      requiresFullClinicalAccess: true,
    },
    availableCardIds: [
      'patient-clinical-complaint',
      'patient-session-evaluation',
      'patient-clinical-notes',
    ],
  },
  {
    id: 'patient-financial',
    name: 'Informações Financeiras',
    permissionConfig: {
      primaryDomain: 'financial',
    },
    availableCardIds: [
      'patient-payment-info',
      'patient-nfse-list',
      'patient-stat-unpaid',
    ],
  },
];

function PatientDetail({ patientId }: Props) {
  return (
    <div className="space-y-6">
      {PATIENT_SECTIONS.map(section => (
        <PermissionAwareSection
          key={section.id}
          config={section}
          renderCard={(card) => <PatientCard config={card} patientId={patientId} />}
        />
      ))}
    </div>
  );
}
```

**Comportamento Esperado:**
- **Seção Overview**: Visível para todos
- **Seção Clinical**: Apenas para quem tem acesso clínico ao paciente
- **Seção Financial**: Apenas para quem tem `hasFinancialAccess`

---

## 📁 ARQUIVOS A CRIAR/MODIFICAR

### Novos Arquivos (1)
1. **`src/components/PermissionAwareSection.tsx`** (NOVO)
   - ~200 linhas
   - Componente principal da FASE 3
   - Inclui loading states, layouts, drag & drop

### Arquivos Modificados (1)
2. **`src/components/AddCardDialog.tsx`** (MODIFICAR)
   - Adicionar prop `sectionConfig`
   - Filtrar cards por `getAvailableCardsForSection()`
   - Atualizar UI com badges de domínio

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Componente complexo demais | Média | Médio | Criar variantes simples primeiro |
| Performance com muitos cards | Baixa | Alto | `useMemo` para filtragem |
| Layouts salvos incompatíveis | Baixa | Médio | Validação ao carregar layouts |

---

## ✅ CRITÉRIOS DE ACEITAÇÃO (FASE 3)

- [ ] `PermissionAwareSection` criado e funcional
- [ ] Suporta layouts: grid, flex, custom
- [ ] Loading states implementados
- [ ] Drag & drop ready (props para `onCardsChange`)
- [ ] `AddCardDialog` modificado para filtrar por seção
- [ ] Badges de domínio exibidos no dialog
- [ ] Build TypeScript sem erros
- [ ] Documentação inline completa

---

## 🚀 APÓS FASE 3

Com os componentes inteligentes prontos, estaremos preparados para:
- **FASE 4:** Migrar páginas para usar `PermissionAwareSection`
- **FASE 5:** Validar layouts salvos e cleanup final

---

## 📝 NOTAS IMPORTANTES

1. **`PermissionAwareSection` é React Agnostic**: Pode ser usado em qualquer página
2. **Zero Lógica de Permissões nas Páginas**: Tudo é tratado pelo componente
3. **Backward Compatibility**: Componente aceita `visibleCardIds` de layouts antigos
4. **Testável**: Pode ser testado isoladamente com mocks de `useCardPermissions`

**FASE 3: ⏳ AGUARDANDO SUA APROVAÇÃO PARA INICIAR**
