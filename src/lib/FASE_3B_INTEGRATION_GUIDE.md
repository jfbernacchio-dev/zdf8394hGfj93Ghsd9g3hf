# Guia de Integração - FASE 3B: Drag & Drop

## Componentes Implementados

### 1. SortableCard.tsx
Wrapper para cards individuais que permite reordenamento via drag & drop.

**Features:**
- Drag handle visível apenas em edit mode
- Feedback visual durante drag (opacity, cursor)
- Indicador de drop zone
- Suporte a keyboard navigation

### 2. SortableCardContainer.tsx
Container que fornece contexto DnD para uma seção inteira.

**Features:**
- Isolamento por seção (cards não saem da seção)
- Suporte a estratégias vertical/horizontal
- DragOverlay para preview
- Detecção de colisão otimizada

### 3. DashboardSectionExample.tsx
Exemplo completo de integração (referência para FASE 3D).

**Features:**
- Integra SortableCard + ResizableCardSimple
- Controles de edit/save/cancel/reset
- Indicador de status (saving, modified)
- Feedback via toasts

## Fluxo de Integração

### Passo 1: Wrap seção com SortableCardContainer

```typescript
import { SortableCardContainer } from '@/components/SortableCardContainer';

<SortableCardContainer
  sectionId="dashboard-financial"
  cardIds={section.cardLayouts.map(c => c.cardId)}
  onReorder={(newIds) => updateCardOrder('dashboard-financial', newIds)}
  isEditMode={isEditMode}
  strategy="horizontal"
  className="flex flex-wrap gap-4"
>
  {/* Cards aqui */}
</SortableCardContainer>
```

### Passo 2: Wrap cada card com SortableCard

```typescript
import { SortableCard } from '@/components/SortableCard';

{section.cardLayouts.map(cardLayout => (
  <SortableCard
    key={cardLayout.cardId}
    id={cardLayout.cardId}
    isEditMode={isEditMode}
  >
    <ResizableCardSimple {...props}>
      {/* Conteúdo do card */}
    </ResizableCardSimple>
  </SortableCard>
))}
```

### Passo 3: Conectar com useDashboardLayout

```typescript
const { updateCardOrder } = useDashboardLayout();

const handleReorder = (newCardIds: string[]) => {
  updateCardOrder(sectionId, newCardIds);
  toast.success('Ordem atualizada!');
};
```

## Estrutura Completa (Exemplo)

```typescript
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { SortableCardContainer } from '@/components/SortableCardContainer';
import { SortableCard } from '@/components/SortableCard';
import { ResizableCardSimple } from '@/components/ResizableCardSimple';

function DashboardSection({ sectionId }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const {
    layout,
    updateCardWidth,
    updateCardOrder,
    saveLayout,
  } = useDashboardLayout();

  const section = layout[sectionId];
  const cards = section.cardLayouts.sort((a, b) => a.order - b.order);

  return (
    <div>
      {/* Controles de edição */}
      <div className="flex justify-end gap-2 mb-4">
        {isEditMode ? (
          <>
            <Button onClick={saveLayout}>Salvar</Button>
            <Button variant="outline" onClick={() => setIsEditMode(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditMode(true)}>
            Editar Layout
          </Button>
        )}
      </div>

      {/* Cards com drag & drop + resize */}
      <SortableCardContainer
        sectionId={sectionId}
        cardIds={cards.map(c => c.cardId)}
        onReorder={(ids) => updateCardOrder(sectionId, ids)}
        isEditMode={isEditMode}
        className="flex flex-wrap gap-4"
      >
        {cards.map(card => (
          <SortableCard
            key={card.cardId}
            id={card.cardId}
            isEditMode={isEditMode}
          >
            <ResizableCardSimple
              id={card.cardId}
              sectionId={sectionId}
              isEditMode={isEditMode}
              defaultWidth={card.width}
              tempWidth={card.width}
              onTempWidthChange={(id, width) => 
                updateCardWidth(sectionId, id, width)
              }
            >
              {renderCard(card.cardId)}
            </ResizableCardSimple>
          </SortableCard>
        ))}
      </SortableCardContainer>
    </div>
  );
}
```

## Combinando Resize + Drag & Drop

Os dois sistemas funcionam de forma independente mas complementar:

### ResizableCardSimple
- Controla a **largura** do card
- Persiste em localStorage: `card-width-{sectionId}-{cardId}`
- Atualiza via `updateCardWidth()`

### SortableCard
- Controla a **ordem** do card
- Persiste em localStorage: `card-order-{sectionId}-{cardId}`
- Atualiza via `updateCardOrder()`

### Interação
```
┌────────────────────────────────────────┐
│ SortableCard (drag & drop)             │
│  ┌──────────────────────────────────┐  │
│  │ ResizableCardSimple (resize)     │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │ Card Content               │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

Durante edição:
1. **Drag handle** (SortableCard) aparece à esquerda
2. **Resize handle** (ResizableCardSimple) aparece à direita
3. Ambos funcionam independentemente

## Styling do Drag Handle

O drag handle é posicionado **fora** do card:

```
┌─┐  ┌──────────────────┐
│⋮│  │                  │
│⋮│  │  Card Content    │
└─┘  └──────────────────┘
 ↑
Drag handle (-left-8)
```

**Visibilidade:**
- Padrão: `opacity-0`
- Hover no card: `group-hover:opacity-100`
- Sempre visível durante drag

**Customizar posição:**
```tsx
// Em SortableCard.tsx
className="absolute -left-8 top-1/2 -translate-y-1/2"
// Alterar -left-8 para ajustar distância
```

## Estratégias de Layout

### Horizontal (padrão)
Melhor para cards que usam flex wrap:

```tsx
<SortableCardContainer
  strategy="horizontal"
  className="flex flex-wrap gap-4"
>
```

Cards se organizam em linha e quebram automaticamente.

### Vertical
Melhor para listas empilhadas:

```tsx
<SortableCardContainer
  strategy="vertical"
  className="flex flex-col gap-2"
>
```

Cards se organizam em coluna única.

## Estado de Edição

Recomenda-se controlar edit mode no nível do componente parent:

```typescript
const [isEditMode, setIsEditMode] = useState(false);

// Passar para todos os componentes
<SortableCardContainer isEditMode={isEditMode}>
  <SortableCard isEditMode={isEditMode}>
    <ResizableCardSimple isEditMode={isEditMode}>
```

**Comportamento quando NOT isEditMode:**
- Drag handle: oculto
- Resize handle: oculto
- Drag & drop: desabilitado
- Cards: estáticos

## Feedback Visual

### Durante Drag
- Card sendo arrastado: `opacity-50`, `cursor-grabbing`
- Drop zone: `ring-2 ring-primary`
- DragOverlay: preview flutuante

### Durante Resize
- Indicador de largura: tooltip com pixels
- Handle: muda cor no hover

### Após Mudanças
- Auto-save inicia após 2s
- Toast opcional: "Ordem atualizada!"
- Indicador de status: "● Não salvo"

## Performance

Para seções com muitos cards (>30):

```typescript
import { memo, useMemo } from 'react';

// Memoizar componentes
const MemoizedSortableCard = memo(SortableCard);
const MemoizedResizableCard = memo(ResizableCardSimple);

// Memoizar array de IDs
const cardIds = useMemo(
  () => cards.map(c => c.cardId),
  [cards]
);
```

## Acessibilidade

Sistema já suporta:
- **Keyboard navigation**: Arrows para mover, Space/Enter para pegar/soltar
- **Screen readers**: Anúncios de posição durante drag
- **Focus management**: Card mantém foco após reordenação

Melhorar com:
```tsx
<SortableCard
  aria-label={`${cardName}, posição ${order + 1} de ${total}`}
>
```

## Troubleshooting

### Cards não se movem
1. Verificar `isEditMode={true}`
2. Confirmar `cardIds` está correto
3. Ver console para erros

### Drag handle não aparece
1. Verificar `isEditMode={true}`
2. Confirmar CSS `group` está aplicado
3. Testar hover manual no card

### Ordem não persiste
1. Verificar `updateCardOrder()` é chamado
2. Checar localStorage tem valores corretos
3. Confirmar auto-save está funcionando

## Próxima Fase

**FASE 3D: Integração com DashboardExample.tsx**

Tarefas:
1. Integrar SortableCardContainer em cada seção
2. Adicionar controles de edit/save/reset
3. Implementar indicadores de status
4. Testar com cards reais do dashboard
5. Ajustar styling para design system

---

**Arquivos de referência:**
- `DashboardSectionExample.tsx` - Exemplo completo
- `SORTABLE_CARDS_USAGE.md` - Guia de uso detalhado
- `DASHBOARD_LAYOUT_USAGE.md` - Guia do hook
