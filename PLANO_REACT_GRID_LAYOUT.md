# 📋 PLANO REACT GRID LAYOUT - Dashboard Example
## Sistema Completo de Resize & Drag-Drop

**Data:** 2025-11-18  
**Status:** Em Implementação  
**Duração Estimada:** 2-3 horas  
**Risco:** 🟢 BAIXO

---

## 🎯 OBJETIVO

Substituir o sistema atual de cards sequenciais por React Grid Layout, permitindo:
- ✅ Drag & drop livre dentro de seções
- ✅ Resize bidirecional (width + height)
- ✅ Reflow automático com colisão
- ✅ Empilhamento vertical de cards
- ✅ Alinhamento flexível (quantos cards couberem horizontalmente)
- ✅ Persistência completa (localStorage + Supabase)

---

## 📊 MUDANÇA DE ESTRATÉGIA

### ❌ Abordagem Original (Custom Implementation)
- **Duração:** 5-7 horas
- **Risco:** 🔴 MUITO ALTO
- **Complexidade:** Construir sistema de drag/resize do zero
- **Fases:** 6 fases complexas com alto risco de bugs

### ✅ Abordagem Nova (React Grid Layout)
- **Duração:** 2-3 horas  
- **Risco:** 🟢 BAIXO
- **Complexidade:** Integração com biblioteca madura e testada
- **Fases:** 4 fases focadas

---

## 🏗️ ARQUITETURA

### Sistema de Grid por Seção

```typescript
// Cada seção = um grid independente de 12 colunas
interface GridCardLayout {
  i: string;        // cardId único
  x: number;        // coluna inicial (0-11)
  y: number;        // linha inicial (0-∞)
  w: number;        // largura em colunas (1-12)
  h: number;        // altura em rows (1-∞)
  minW?: number;    // largura mínima
  minH?: number;    // altura mínima
  maxW?: number;    // largura máxima
  maxH?: number;    // altura máxima
}

interface SectionGridLayout {
  cardLayouts: GridCardLayout[];
}

type DashboardExampleGridLayout = Record<string, SectionGridLayout>;
```

### Exemplo Visual

```
┌─────────────────────────────────────────┐
│ SEÇÃO: Financial (12 cols grid)         │
├─────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │Card1│ │Card2│ │Card3│ │Card4│        │ ← Linha 0-1
│ │ 3x2 │ │ 3x2 │ │ 3x2 │ │ 3x2 │        │
│ └─────┘ └─────┘ └─────┘ └─────┘        │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │         Chart Card (12x4)           │ │ ← Linha 2-5
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 📅 FASES DE IMPLEMENTAÇÃO

---

### **✅ FASE 1: INSTALAÇÃO E SETUP**
**Duração:** 15-20 minutos  
**Risco:** 🟢 BAIXO  
**Status:** ✅ CONCLUÍDA

#### Tarefas:
1. ✅ Instalar `react-grid-layout`
2. ✅ Criar `GridCardContainer` component
3. ✅ Configurar CSS básico

#### Arquivos Criados:
- `src/components/GridCardContainer.tsx` ✅

#### Código Base:

```typescript
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface GridCardContainerProps {
  sectionId: string;
  layout: GridCardLayout[];
  onLayoutChange: (newLayout: GridCardLayout[]) => void;
  isEditMode: boolean;
  children: React.ReactNode;
}

export const GridCardContainer = ({
  sectionId,
  layout,
  onLayoutChange,
  isEditMode,
  children
}: GridCardContainerProps) => {
  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={12}
      rowHeight={60}
      width={1200}
      isDraggable={isEditMode}
      isResizable={isEditMode}
      onLayoutChange={onLayoutChange}
      draggableHandle=".drag-handle"
      compactType="vertical"
      preventCollision={false}
    >
      {children}
    </GridLayout>
  );
};
```

#### ✅ Critérios de Sucesso:
- [ ] React Grid Layout instalado
- [ ] `GridCardContainer` criado e funcional
- [ ] CSS do grid carregando corretamente
- [ ] Sem erros de build

---

### **FASE 2: MIGRAÇÃO DE DADOS E TIPOS**
**Duração:** 30-45 minutos  
**Risco:** 🟡 MÉDIO  
**Status:** ⏳ PENDENTE

#### Objetivos:
- Criar novos tipos para grid system
- Converter layout existente (sequential → grid)
- Definir layouts padrão para todas seções

#### Arquivos a Criar:
- `src/lib/gridLayoutUtils.ts` (NOVO)

#### Arquivos a Modificar:
- `src/lib/defaultLayoutDashboardExample.ts`
- `src/types/cardTypes.ts`

#### Função de Conversão:

```typescript
export const convertSequentialToGrid = (
  sequentialLayout: CardLayout[]
): GridCardLayout[] => {
  let currentX = 0;
  let currentY = 0;
  
  return sequentialLayout.map((card) => {
    // Converter width (pixels) para colunas (1-12)
    const gridWidth = Math.max(2, Math.min(12, Math.round((card.width / 1200) * 12)));
    
    // Se não cabe na linha atual, pular para próxima
    if (currentX + gridWidth > 12) {
      currentX = 0;
      currentY += 2; // altura padrão = 2 rows
    }
    
    const gridCard: GridCardLayout = {
      i: card.cardId,
      x: currentX,
      y: currentY,
      w: gridWidth,
      h: 2, // altura padrão
      minW: 2,
      minH: 1,
    };
    
    currentX += gridWidth;
    return gridCard;
  });
};
```

#### Layout Padrão Seção Financial:

```typescript
'dashboard-financial': {
  cardLayouts: [
    { i: 'total-patients', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
    { i: 'revenue-expected', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
    { i: 'revenue-confirmed', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
    { i: 'sessions-attended', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
    { i: 'revenue-chart', x: 0, y: 2, w: 12, h: 4, minW: 6, minH: 3 },
  ]
}
```

#### ✅ Critérios de Sucesso:
- [ ] `GridCardLayout` interface criada
- [ ] Função de conversão implementada e testada
- [ ] Layout grid padrão definido para todas 3 seções
- [ ] Tipos atualizados em `cardTypes.ts`

---

### **FASE 3: INTEGRAÇÃO COM DASHBOARD EXAMPLE**
**Duração:** 1-1.5 horas  
**Risco:** 🟡 MÉDIO  
**Status:** ⏳ PENDENTE

#### Objetivos:
- Substituir `SortableCardContainer` por `GridCardContainer`
- Atualizar hook `useDashboardLayout` para grid system
- Remover componentes obsoletos
- Manter compatibilidade com permissões

#### Arquivos a Modificar:
- `src/pages/DashboardExample.tsx`
- `src/hooks/useDashboardLayout.ts`

#### Arquivos a Remover:
- `src/components/SortableCardContainer.tsx` (obsoleto)
- `src/components/SortableCard.tsx` (obsoleto)
- `src/components/ResizableCardSimple.tsx` (obsoleto)

#### Estrutura Nova no DashboardExample:

```typescript
<GridCardContainer
  sectionId={sectionId}
  layout={layout[sectionId]?.cardLayouts || []}
  onLayoutChange={(newLayout) => updateLayout(sectionId, newLayout)}
  isEditMode={isEditMode}
>
  {layout[sectionId]?.cardLayouts.map((cardLayout) => (
    <div key={cardLayout.i} data-grid={cardLayout}>
      <Card className="h-full">
        {isEditMode && (
          <div className="drag-handle cursor-move bg-primary/10 p-2 rounded-t border-b">
            <GripVertical className="h-4 w-4 mx-auto text-primary" />
          </div>
        )}
        <CardContent className="p-4">
          {renderDashboardCard(cardLayout.i)}
        </CardContent>
      </Card>
    </div>
  ))}
</GridCardContainer>
```

#### Hook `useDashboardLayout` Atualizado:

```typescript
export interface UseDashboardLayoutReturn {
  layout: DashboardExampleGridLayout;  // Grid layout
  loading: boolean;
  saving: boolean;
  isModified: boolean;
  
  updateLayout: (sectionId: string, newLayout: GridCardLayout[]) => void;
  addCard: (sectionId: string, cardId: string) => void;
  removeCard: (sectionId: string, cardId: string) => void;
  saveLayout: () => Promise<void>;
  resetLayout: () => Promise<void>;
}
```

#### ✅ Critérios de Sucesso:
- [ ] `GridCardContainer` integrado no DashboardExample
- [ ] Cards renderizando corretamente no grid
- [ ] Drag & drop funcionando em edit mode
- [ ] Resize funcionando em edit mode
- [ ] Componentes antigos removidos sem erros
- [ ] Sistema de permissões funcionando

---

### **FASE 4: PERSISTÊNCIA E POLIMENTO**
**Duração:** 45-60 minutos  
**Risco:** 🟢 BAIXO  
**Status:** ⏳ PENDENTE

#### Objetivos:
- Implementar persistência em localStorage
- Implementar persistência em Supabase
- Adicionar feedback visual (grid, badges, dimensões)
- Customizar estilos do React Grid Layout

#### Arquivos a Criar:
- `src/lib/gridLayoutPersistence.ts` (NOVO)

#### Arquivos a Modificar:
- `src/index.css` (estilos customizados)
- `src/pages/DashboardExample.tsx` (feedback visual)

#### Persistência LocalStorage:

```typescript
const STORAGE_KEY = 'dashboard-grid-layout';

export const saveGridLayoutToLocalStorage = (
  layout: DashboardExampleGridLayout
): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
};

export const loadGridLayoutFromLocalStorage = (): DashboardExampleGridLayout | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};
```

#### Persistência Supabase:

```typescript
// Usar tabela existente: user_layout_preferences
const saveLayoutToDatabase = async (layout: DashboardExampleGridLayout) => {
  const { data, error } = await supabase
    .from('user_layout_preferences')
    .upsert({
      user_id: userId,
      layout_type: 'dashboard-example',
      layout_config: layout,  // Grid layout JSON
      version: 2,  // incrementar versão
    });
};
```

#### Feedback Visual:

1. **Grid de Fundo (edit mode)**
```typescript
{isEditMode && (
  <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
    <div className="h-full w-full" style={{
      backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
      backgroundSize: '100px 60px',
    }} />
  </div>
)}
```

2. **Badge de Personalização**
```typescript
{isCustomized && (
  <Badge variant="secondary" className="absolute top-2 right-2 z-10">
    Personalizado
  </Badge>
)}
```

3. **Indicador de Dimensões**
```typescript
{isEditMode && (
  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
    {cardLayout.w} × {cardLayout.h}
  </div>
)}
```

#### Estilos Customizados (index.css):

```css
/* React Grid Layout overrides */
.react-grid-item {
  transition: all 200ms ease;
  transition-property: left, top, width, height;
}

.react-grid-item.cssTransforms {
  transition-property: transform, width, height;
}

.react-grid-item.resizing {
  z-index: 100;
  will-change: width, height;
}

.react-grid-item.react-draggable-dragging {
  transition: none;
  z-index: 100;
  will-change: transform;
}

.react-grid-item .react-resizable-handle {
  background-image: none;
}

.react-grid-item .react-resizable-handle::after {
  content: "";
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 8px;
  height: 8px;
  border-right: 2px solid hsl(var(--primary));
  border-bottom: 2px solid hsl(var(--primary));
}
```

#### ✅ Critérios de Sucesso:
- [ ] Layouts salvam automaticamente no localStorage
- [ ] Layouts salvam no Supabase ao clicar "Salvar"
- [ ] Grid de fundo visível em edit mode
- [ ] Badges e indicadores funcionando
- [ ] Estilos customizados aplicados
- [ ] Sem regressões visuais

---

## 🧪 CHECKLIST FINAL DE TESTES

### Funcionalidade Core
- [ ] Cards podem ser arrastados dentro da seção (drag)
- [ ] Cards podem ser redimensionados (resize width + height)
- [ ] Cards não colidem (empurram outros cards automaticamente)
- [ ] Reflow automático funciona ao redimensionar
- [ ] Largura mínima/máxima respeitada (minW/maxW)
- [ ] Altura mínima/máxima respeitada (minH/maxH)
- [ ] Cards não podem ser movidos entre seções diferentes

### Persistência
- [ ] Layout salva no localStorage ao arrastar card
- [ ] Layout salva no localStorage ao redimensionar card
- [ ] Layout salva no Supabase ao clicar "Salvar"
- [ ] Layout restaura corretamente ao recarregar página
- [ ] "Reset" volta ao layout padrão definido
- [ ] Versão de layout é incrementada corretamente

### Sistema de Seções
- [ ] Cards permanecem apenas dentro de suas seções
- [ ] Cada seção mantém seu grid independente (12 colunas)
- [ ] Seções colapsam/expandem corretamente
- [ ] Altura da seção se ajusta ao conteúdo

### Permissões
- [ ] Cards invisíveis não aparecem no grid
- [ ] Adicionar card funciona (AddCardDialog)
- [ ] Remover card funciona
- [ ] Layout respeita permissões do usuário (admin/subordinate)
- [ ] Cards filtrados por autonomia aparecem/somem corretamente

### UX e Feedback Visual
- [ ] Drag handle visível apenas em edit mode
- [ ] Cursor muda durante interações (grab/grabbing/resize)
- [ ] Grid de fundo aparece apenas em edit mode
- [ ] Indicador de dimensões aparece durante resize
- [ ] Badge "Personalizado" aparece quando layout é modificado
- [ ] Animações são suaves (200ms transition)
- [ ] Status "Salvando..." aparece corretamente

### Performance
- [ ] Sem lag durante drag
- [ ] Sem lag durante resize
- [ ] Página carrega rapidamente
- [ ] Sem memory leaks ao entrar/sair do edit mode

### Responsividade
- [ ] Grid se adapta ao tamanho da janela
- [ ] Cards mantêm proporções em diferentes resoluções
- [ ] Mobile: touch drag funciona (se aplicável)

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

| Aspecto | Sistema Anterior | React Grid Layout |
|---------|------------------|-------------------|
| **Drag & Drop** | Apenas reordenação | Posicionamento livre 2D |
| **Resize** | Só horizontal | Bidirecional (w+h) |
| **Layout** | Sequencial (flex) | Grid 12 colunas |
| **Colisão** | Manual | Automática |
| **Reflow** | Não suportado | Automático |
| **Empilhamento** | Não flexível | Totalmente livre |
| **Mobile** | Não otimizado | Touch support incluído |
| **Manutenção** | Custom code | Biblioteca testada |
| **Documentação** | Nenhuma | Extensa |
| **Tempo de Dev** | 5-7 horas | 2-3 horas |
| **Risco** | 🔴 Alto | 🟢 Baixo |

---

## 🚨 PONTOS DE ATENÇÃO

### Durante Implementação:
1. **Não misturar sistemas:** Remover completamente `SortableCard` e `ResizableCardSimple`
2. **Grid isolado por seção:** Cada seção = grid independente
3. **Data-grid attribute:** React Grid Layout precisa do `data-grid={cardLayout}` em cada item
4. **Drag handle:** Usar classe `.drag-handle` para controlar onde arrastar
5. **Z-index:** Cuidado com overlays durante drag/resize

### Possíveis Problemas:
- **CSS não carregando:** Verificar imports do react-grid-layout
- **Cards não arrastam:** Checar `isDraggable={isEditMode}`
- **Cards não redimensionam:** Checar `isResizable={isEditMode}`
- **Layout não persiste:** Verificar `onLayoutChange` callback
- **Performance ruim:** Considerar `shouldComponentUpdate` ou React.memo

---

## 📚 RECURSOS ÚTEIS

### Documentação React Grid Layout:
- GitHub: https://github.com/react-grid-layout/react-grid-layout
- Examples: https://react-grid-layout.github.io/react-grid-layout/examples/0-showcase.html
- API Docs: https://github.com/react-grid-layout/react-grid-layout#grid-layout-props

### Propriedades Importantes:
```typescript
interface ReactGridLayoutProps {
  cols: number;              // 12 (padrão nosso)
  rowHeight: number;         // 60px (padrão nosso)
  width: number;             // 1200px (padrão nosso)
  isDraggable: boolean;      // true em edit mode
  isResizable: boolean;      // true em edit mode
  draggableHandle: string;   // ".drag-handle"
  compactType: 'vertical' | 'horizontal' | null;  // 'vertical'
  preventCollision: boolean; // false (permite reflow)
  onLayoutChange: (layout: Layout[]) => void;
}
```

---

## 🎯 PRÓXIMOS PASSOS

### Imediato (Fase 1):
1. ✅ Instalar react-grid-layout
2. ✅ Criar GridCardContainer
3. ✅ Verificar CSS carregando

### Curto Prazo (Fase 2-3):
4. Criar tipos e conversão
5. Definir layouts padrão
6. Integrar no DashboardExample
7. Remover componentes antigos

### Médio Prazo (Fase 4):
8. Implementar persistência
9. Adicionar feedback visual
10. Customizar estilos

### Final:
11. Testes completos
12. Ajustes finais
13. Documentação de uso

---

## 📝 LOG DE PROGRESSO

### 2025-11-18
- ✅ Plano criado e aprovado
- ✅ Fase 1 concluída: Instalação e setup
  - react-grid-layout instalado
  - GridCardContainer criado
  - CSS básico configurado

---

## ✅ CRITÉRIOS DE CONCLUSÃO DO PROJETO

O projeto estará completo quando:

1. ✅ Todas as 4 fases implementadas
2. ✅ Todos os testes do checklist passando
3. ✅ Sem erros de console
4. ✅ Performance adequada (< 100ms para interações)
5. ✅ Persistência funcionando (localStorage + Supabase)
6. ✅ Documentação atualizada
7. ✅ Código limpo e componentizado
8. ✅ Componentes obsoletos removidos

---

**Última Atualização:** 2025-11-18  
**Responsável:** Lovable AI  
**Status Geral:** 🔄 Em Progresso (Fase 2/4) - Fase 1 ✅ Concluída
