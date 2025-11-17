# Guia de Uso: useDashboardLayout Hook

## Importação

```typescript
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
```

## Uso Básico

```typescript
function DashboardExample() {
  const {
    layout,
    loading,
    saving,
    isModified,
    updateCardWidth,
    updateCardOrder,
    saveLayout,
    resetLayout,
  } = useDashboardLayout();

  if (loading) {
    return <div>Carregando layout...</div>;
  }

  return (
    <div>
      {/* Renderizar dashboard com layout */}
    </div>
  );
}
```

## Exemplos de Integração

### 1. Modo de Edição com Botões Save/Cancel

```typescript
const [isEditMode, setIsEditMode] = useState(false);
const {
  layout,
  isModified,
  saving,
  saveLayout,
  resetLayout,
} = useDashboardLayout();

const handleSave = async () => {
  await saveLayout();
  setIsEditMode(false);
  toast.success('Layout salvo!');
};

const handleCancel = () => {
  // Recarregar página para descartar mudanças do localStorage
  window.location.reload();
};

return (
  <div>
    {isEditMode ? (
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || !isModified}>
          {saving ? 'Salvando...' : 'Salvar Layout'}
        </Button>
        <Button variant="outline" onClick={handleCancel}>
          Cancelar
        </Button>
      </div>
    ) : (
      <Button onClick={() => setIsEditMode(true)}>
        Editar Layout
      </Button>
    )}
  </div>
);
```

### 2. Renderizar Cards com ResizableCardSimple

```typescript
import { ResizableCardSimple } from '@/components/ResizableCardSimple';

const { layout, updateCardWidth } = useDashboardLayout();

// Para cada seção
Object.entries(layout).map(([sectionId, section]) => (
  <div key={sectionId} className="flex flex-wrap gap-4">
    {section.cardLayouts
      .sort((a, b) => a.order - b.order)
      .map(cardLayout => (
        <ResizableCardSimple
          key={cardLayout.cardId}
          id={cardLayout.cardId}
          sectionId={sectionId}
          isEditMode={isEditMode}
          defaultWidth={cardLayout.width}
          tempWidth={cardLayout.width}
          onTempWidthChange={(cardId, width) => 
            updateCardWidth(sectionId, cardId, width)
          }
        >
          {renderCardContent(cardLayout.cardId)}
        </ResizableCardSimple>
      ))}
  </div>
));
```

### 3. Botão de Reset com Confirmação

```typescript
const { resetLayout } = useDashboardLayout();
const [showResetDialog, setShowResetDialog] = useState(false);

const handleReset = async () => {
  await resetLayout();
  setShowResetDialog(false);
  window.location.reload(); // Recarregar para aplicar layout padrão
};

return (
  <>
    <Button
      variant="destructive"
      onClick={() => setShowResetDialog(true)}
    >
      Resetar Layout
    </Button>

    <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resetar Layout?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso irá restaurar o layout para o padrão e remover todas as
            suas customizações. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset}>
            Confirmar Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
);
```

### 4. Aviso de Mudanças Não Salvas

```typescript
const { hasUnsavedChanges } = useDashboardLayout();

useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'Você tem mudanças não salvas. Deseja sair?';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);
```

### 5. Indicador de Status do Layout

```typescript
const { saving, isModified } = useDashboardLayout();

return (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    {saving && (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Salvando...</span>
      </>
    )}
    {!saving && isModified && (
      <>
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <span>Mudanças não salvas</span>
      </>
    )}
    {!saving && !isModified && (
      <>
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span>Layout salvo</span>
      </>
    )}
  </div>
);
```

### 6. Drag & Drop Integration (Preparação para FASE 3B)

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const { layout, updateCardOrder } = useDashboardLayout();

const handleDragEnd = (event: DragEndEvent, sectionId: string) => {
  const { active, over } = event;
  
  if (over && active.id !== over.id) {
    const section = layout[sectionId];
    const oldIndex = section.cardLayouts.findIndex(
      cl => cl.cardId === active.id
    );
    const newIndex = section.cardLayouts.findIndex(
      cl => cl.cardId === over.id
    );

    // Criar novo array ordenado
    const reordered = arrayMove(
      section.cardLayouts.map(cl => cl.cardId),
      oldIndex,
      newIndex
    );

    updateCardOrder(sectionId, reordered);
  }
};

return (
  <DndContext
    collisionDetection={closestCenter}
    onDragEnd={(event) => handleDragEnd(event, sectionId)}
  >
    <SortableContext
      items={section.cardLayouts.map(cl => cl.cardId)}
      strategy={verticalListSortingStrategy}
    >
      {/* Cards sortable */}
    </SortableContext>
  </DndContext>
);
```

## Padrões Recomendados

### ✅ DO: Auto-save está ativo

O hook já implementa auto-save com debounce de 2s. Não é necessário salvar manualmente após cada edição.

```typescript
// ✅ Correto
const handleResize = (cardId: string, width: number) => {
  updateCardWidth(sectionId, cardId, width);
  // Auto-save acontecerá automaticamente após 2s
};
```

### ❌ DON'T: Salvar manualmente após cada mudança

```typescript
// ❌ Evitar - spam no Supabase
const handleResize = async (cardId: string, width: number) => {
  updateCardWidth(sectionId, cardId, width);
  await saveLayout(); // Não necessário!
};
```

### ✅ DO: Usar tempWidth durante edição

```typescript
// ✅ Correto - ResizableCardSimple usa tempWidth para preview
<ResizableCardSimple
  tempWidth={cardLayout.width}
  onTempWidthChange={updateCardWidth}
/>
```

### ✅ DO: Verificar loading antes de renderizar

```typescript
// ✅ Correto
if (loading) return <Skeleton />;

return <Dashboard layout={layout} />;
```

### ✅ DO: Usar isModified para UI feedback

```typescript
// ✅ Correto - desabilitar botão se não há mudanças
<Button disabled={!isModified}>
  Salvar Layout
</Button>
```

## Tipos TypeScript

```typescript
interface UseDashboardLayoutReturn {
  // Estado do layout
  layout: DashboardExampleLayout;
  loading: boolean;
  saving: boolean;
  isModified: boolean;
  hasUnsavedChanges: boolean;

  // Ações
  updateCardWidth: (sectionId: string, cardId: string, width: number) => void;
  updateCardOrder: (sectionId: string, cardIds: string[]) => void;
  saveLayout: () => Promise<void>;
  resetLayout: () => Promise<void>;
}

interface DashboardExampleLayout {
  [sectionId: string]: SectionLayout;
}

interface SectionLayout {
  cardLayouts: CardLayout[];
}

interface CardLayout {
  cardId: string;
  width: number;
  order: number;
}
```

## Debugging

```typescript
const { layout } = useDashboardLayout();

// Ver layout no console
console.log('Current layout:', layout);

// Ver cards de uma seção
console.log('Financial cards:', layout['dashboard-financial'].cardLayouts);

// Ver total de cards
const total = Object.values(layout).reduce(
  (sum, section) => sum + section.cardLayouts.length,
  0
);
console.log('Total cards:', total);
```

## Troubleshooting

### Layout não carrega do Supabase

**Problema:** Hook sempre retorna layout padrão.

**Solução:**
1. Verificar se usuário está autenticado (`user?.id`)
2. Checar permissões RLS na tabela `user_layout_preferences`
3. Ver console para erros de rede

### Mudanças não salvam

**Problema:** `saveLayout()` não persiste no Supabase.

**Solução:**
1. Verificar se `isModified` é `true`
2. Checar se há erros no console
3. Confirmar que tabela `user_layout_preferences` existe

### Auto-save não funciona

**Problema:** Layout não salva automaticamente.

**Solução:**
1. Auto-save tem debounce de 2s - aguardar
2. Verificar se `isModified` muda após edições
3. Checar se há erros no console

### Reset não funciona

**Problema:** `resetLayout()` não restaura padrão.

**Solução:**
1. Verificar se localStorage foi limpo
2. Recarregar página após reset
3. Confirmar que `DEFAULT_DASHBOARD_EXAMPLE_LAYOUT` está correto

---

**Para mais informações, ver:** `DASHBOARD_LAYOUT_SYSTEM.md`
