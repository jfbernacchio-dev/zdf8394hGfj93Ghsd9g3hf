# Guia de Uso: Sistema de Drag & Drop para Cards

## Visão Geral

O sistema de drag & drop permite reordenar cards DENTRO de uma seção específica. Cards não podem ser movidos entre seções diferentes.

## Componentes

### 1. SortableCardContainer
Container que fornece contexto de drag & drop para uma seção.

### 2. SortableCard
Wrapper individual para cada card que pode ser reordenado.

## Uso Básico

```typescript
import { SortableCardContainer } from '@/components/SortableCardContainer';
import { SortableCard } from '@/components/SortableCard';
import { ResizableCardSimple } from '@/components/ResizableCardSimple';

function DashboardSection({ sectionId, cards, isEditMode }) {
  const { updateCardOrder } = useDashboardLayout();

  const handleReorder = (newCardIds: string[]) => {
    updateCardOrder(sectionId, newCardIds);
  };

  return (
    <SortableCardContainer
      sectionId={sectionId}
      cardIds={cards.map(c => c.cardId)}
      onReorder={handleReorder}
      isEditMode={isEditMode}
      strategy="horizontal"
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
          >
            {renderCardContent(card.cardId)}
          </ResizableCardSimple>
        </SortableCard>
      ))}
    </SortableCardContainer>
  );
}
```

## Integração com useDashboardLayout

```typescript
const {
  layout,
  updateCardOrder,
  isModified,
  saveLayout,
} = useDashboardLayout();

// Renderizar seção
const section = layout['dashboard-financial'];
const cardIds = section.cardLayouts.map(cl => cl.cardId);

const handleReorder = (newCardIds: string[]) => {
  // Hook atualiza automaticamente:
  // 1. Estado do layout
  // 2. localStorage
  // 3. Dispara auto-save após 2s
  updateCardOrder('dashboard-financial', newCardIds);
};

return (
  <SortableCardContainer
    sectionId="dashboard-financial"
    cardIds={cardIds}
    onReorder={handleReorder}
    isEditMode={true}
  >
    {/* Cards */}
  </SortableCardContainer>
);
```

## Props Detalhadas

### SortableCardContainer

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `sectionId` | `string` | ✅ | ID único da seção |
| `cardIds` | `string[]` | ✅ | Array de IDs dos cards na ordem atual |
| `onReorder` | `(newIds: string[]) => void` | ✅ | Callback quando ordem muda |
| `isEditMode` | `boolean` | ✅ | Habilita drag & drop |
| `children` | `ReactNode` | ✅ | SortableCard components |
| `strategy` | `'vertical' \| 'horizontal'` | ❌ | Layout strategy (padrão: 'horizontal') |
| `className` | `string` | ❌ | Classes CSS do container |

### SortableCard

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `id` | `string` | ✅ | ID único do card |
| `isEditMode` | `boolean` | ✅ | Mostra drag handle |
| `children` | `ReactNode` | ✅ | Conteúdo do card |
| `disabled` | `boolean` | ❌ | Desabilita drag para este card |
| `className` | `string` | ❌ | Classes CSS adicionais |

## Exemplos de Integração

### Exemplo 1: Layout Horizontal (padrão)

```typescript
<SortableCardContainer
  sectionId="dashboard-financial"
  cardIds={['card-1', 'card-2', 'card-3']}
  onReorder={handleReorder}
  isEditMode={true}
  strategy="horizontal"
  className="flex flex-wrap gap-4 p-4"
>
  {/* Cards em linha, wrap automático */}
</SortableCardContainer>
```

### Exemplo 2: Layout Vertical

```typescript
<SortableCardContainer
  sectionId="dashboard-tasks"
  cardIds={taskIds}
  onReorder={handleReorder}
  isEditMode={true}
  strategy="vertical"
  className="flex flex-col gap-2"
>
  {/* Cards empilhados verticalmente */}
</SortableCardContainer>
```

### Exemplo 3: Card com Resize + Drag & Drop

```typescript
<SortableCard id={cardId} isEditMode={isEditMode}>
  <ResizableCardSimple
    id={cardId}
    sectionId={sectionId}
    isEditMode={isEditMode}
    defaultWidth={300}
    onTempWidthChange={(id, width) => updateCardWidth(sectionId, id, width)}
  >
    <CardHeader>
      <CardTitle>Receita Esperada</CardTitle>
    </CardHeader>
    <CardContent>
      R$ 12.500,00
    </CardContent>
  </ResizableCardSimple>
</SortableCard>
```

### Exemplo 4: Desabilitar Drag para Card Específico

```typescript
<SortableCard
  id="pinned-card"
  isEditMode={isEditMode}
  disabled={true} // Card não pode ser reordenado
>
  <Card>
    <CardHeader>
      <CardTitle>Card Fixo</CardTitle>
    </CardHeader>
  </Card>
</SortableCard>
```

### Exemplo 5: Feedback Visual Durante Drag

```typescript
import { toast } from 'sonner';

const handleReorder = (newCardIds: string[]) => {
  updateCardOrder(sectionId, newCardIds);
  
  // Feedback opcional
  toast.success('Ordem dos cards atualizada!', {
    description: 'Salvando automaticamente...',
  });
};
```

## Características do Sistema

### ✅ Funcionalidades

- **Drag handle visível**: Aparece apenas em edit mode
- **Restrição à seção**: Cards não podem sair da seção
- **Preview durante drag**: DragOverlay mostra card sendo movido
- **Keyboard support**: Setas para reordenar (acessibilidade)
- **Ativação suave**: 8px de movimento antes de iniciar drag (evita cliques acidentais)
- **Visual feedback**: Highlight na posição de drop

### ⚠️ Limitações

- **Não permite drag entre seções**: Por design, cards ficam na sua seção
- **Requer edit mode**: Drag só funciona quando `isEditMode={true}`
- **Ordem sincronizada**: `cardIds` deve refletir ordem atual no layout

## Comportamento de Persistência

1. **Drag inicia**: SortableCard captura evento
2. **Drag termina**: SortableCardContainer calcula nova ordem
3. **onReorder callback**: Parent recebe novo array de IDs
4. **updateCardOrder()**: Hook atualiza layout + localStorage
5. **Auto-save (2s)**: Mudanças persistem no Supabase automaticamente

```
Drag & Drop → onReorder → updateCardOrder → localStorage → [2s] → Supabase
```

## Styling e Personalização

### Drag Handle

O drag handle é estilizado em `SortableCard.tsx`:

```tsx
<div className={cn(
  'absolute -left-8 top-1/2 -translate-y-1/2',
  'opacity-0 group-hover:opacity-100',
  // ... classes de estilo
)}>
  <GripVertical />
</div>
```

**Personalizar:**
- Posição: Alterar `-left-8` para outra posição
- Visibilidade: Remover `opacity-0 group-hover:opacity-100` para sempre visível
- Ícone: Trocar `GripVertical` por outro ícone

### Estado de Drag

Cards sendo arrastados têm:
- `opacity-50`: Transparência
- `cursor-grabbing`: Cursor de arrastar
- `z-index: 999`: Fica acima de outros elementos

**Personalizar em `SortableCard.tsx`:**
```tsx
isDragging && 'opacity-50 cursor-grabbing'
// Alterar para:
isDragging && 'opacity-30 cursor-move scale-105'
```

### Drop Zone Highlight

Posição de drop tem:
- `ring-2 ring-primary`: Borda destacada
- `bg-primary/5`: Fundo semi-transparente

**Personalizar:**
```tsx
isOver && !isDragging && 'ring-2 ring-accent bg-accent/10'
```

## Troubleshooting

### Cards não se movem

**Problema:** Drag não funciona.

**Verificar:**
1. `isEditMode={true}`?
2. `cardIds` contém os IDs corretos?
3. `onReorder` está implementado?
4. Console mostra erros?

### Ordem não persiste

**Problema:** Cards voltam para ordem original após reload.

**Verificar:**
1. `updateCardOrder()` está sendo chamado?
2. `localStorage` tem os valores corretos? (DevTools → Application → Local Storage)
3. Auto-save está funcionando? (Verificar logs do hook)

### Drag handle não aparece

**Problema:** Ícone de drag não é visível.

**Verificar:**
1. `isEditMode={true}`?
2. CSS `group` está aplicado? (SortableCard envolve children com `group`)
3. `hover:opacity-100` está sendo aplicado?

### Cards pulam para posição errada

**Problema:** Card vai para posição incorreta ao dropar.

**Verificar:**
1. `cardIds` está na ordem correta?
2. Índices estão sendo calculados corretamente no `handleReorder`?
3. Todos os cards têm IDs únicos?

## Padrões Recomendados

### ✅ DO: Usar IDs únicos

```typescript
// ✅ Correto - IDs únicos e estáveis
const cardIds = cards.map(c => c.cardId);

<SortableCard id={card.cardId}>
```

### ❌ DON'T: Usar índices como ID

```typescript
// ❌ Evitar - índices mudam durante reordenação
{cards.map((card, index) => (
  <SortableCard id={index.toString()}>
))}
```

### ✅ DO: Atualizar layout via hook

```typescript
// ✅ Correto - hook gerencia tudo
const handleReorder = (newIds) => {
  updateCardOrder(sectionId, newIds);
};
```

### ❌ DON'T: Manipular localStorage diretamente

```typescript
// ❌ Evitar - bypassa lógica do hook
const handleReorder = (newIds) => {
  newIds.forEach((id, index) => {
    localStorage.setItem(`card-order-${sectionId}-${id}`, index);
  });
};
```

### ✅ DO: Desabilitar drag quando necessário

```typescript
// ✅ Correto - desabilitar drag para cards especiais
<SortableCard disabled={card.isPinned}>
```

## Performance

Para seções com muitos cards (>20):

```typescript
import { memo } from 'react';

const MemoizedSortableCard = memo(SortableCard);

// Usar versão memoizada
<MemoizedSortableCard id={cardId} isEditMode={isEditMode}>
  {/* ... */}
</MemoizedSortableCard>
```

## Acessibilidade

O sistema suporta navegação por teclado:

- **Space/Enter**: Pegar/soltar card
- **Arrow keys**: Mover card na lista
- **Escape**: Cancelar drag

Para melhorar:

```typescript
<SortableCard
  id={cardId}
  isEditMode={isEditMode}
  aria-label={`Card ${cardName}, posição ${index + 1} de ${total}`}
>
```

## Debugging

### Log de eventos de drag:

Console já mostra:
- Drag iniciado (com sectionId e cardId)
- Reordenação (com ordem antiga e nova)
- Drag cancelado

### Verificar estado do layout:

```typescript
import { getSectionCardIds } from '@/lib/dashboardLayoutUtils';

const currentOrder = getSectionCardIds(layout, sectionId);
console.log('Ordem atual:', currentOrder);
```

---

**Ver também:**
- `DASHBOARD_LAYOUT_USAGE.md` - Guia do hook useDashboardLayout
- `DASHBOARD_LAYOUT_SYSTEM.md` - Arquitetura completa do sistema
