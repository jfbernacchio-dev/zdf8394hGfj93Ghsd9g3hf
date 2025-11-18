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

### **✅ FASE 2: MIGRAÇÃO DE DADOS E TIPOS**
**Duração:** 30-45 minutos  
**Risco:** 🟡 MÉDIO  
**Status:** ✅ CONCLUÍDA

#### Objetivos:
- ✅ Criar novos tipos para grid system
- ✅ Converter layout existente (sequential → grid)
- ✅ Definir layouts padrão para todas seções

#### Arquivos Criados:
- `src/lib/gridLayoutUtils.ts` ✅

#### Arquivos Modificados:
- `src/types/cardTypes.ts` ✅ (tipos GridCardLayout)
- `src/lib/defaultLayoutDashboardExample.ts` ✅ (layouts grid + tipos)

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

### **✅ FASE 3: INTEGRAÇÃO COM DASHBOARD EXAMPLE**
**Duração:** 1-1.5 horas  
**Risco:** 🟡 MÉDIO  
**Status:** ✅ CONCLUÍDA

#### Objetivos:
- ✅ Substituir SortableCardContainer por GridCardContainer
- ✅ Atualizar hook useDashboardLayout para grid system
- ✅ Remover componentes obsoletos
- ✅ Manter compatibilidade com permissões

#### Arquivos Modificados:
- `src/hooks/useDashboardLayout.ts` ✅ (reescrito completamente para grid)
- `src/pages/DashboardExample.tsx` ✅ (integrado GridCardContainer)

#### Arquivos Removidos:
- `src/components/SortableCardContainer.tsx` ✅
- `src/components/SortableCard.tsx` ✅
- `src/components/ResizableCardSimple.tsx` ✅
- `src/components/DashboardSectionExample.tsx` ✅ (exemplo obsoleto)

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

### **✅ FASE 4: PERSISTÊNCIA E POLIMENTO**
**Duração:** 30-45 minutos  
**Risco:** 🟢 BAIXO  
**Status:** ✅ CONCLUÍDA

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

## 🧪 CHECKLIST COMPLETO DE TESTES E VALIDAÇÃO

### ✅ 1. FUNCIONALIDADE CORE (Drag & Drop + Resize)

#### 1.1 Drag & Drop
- [ ] **Teste 1.1.1:** Cards podem ser arrastados clicando no drag handle (ícone com 3 linhas)
- [ ] **Teste 1.1.2:** Cursor muda para "grab" ao passar sobre o drag handle
- [ ] **Teste 1.1.3:** Cursor muda para "grabbing" durante o arrasto
- [ ] **Teste 1.1.4:** Card arrasta suavemente sem travamentos
- [ ] **Teste 1.1.5:** Placeholder aparece na nova posição durante o drag (borda tracejada azul)
- [ ] **Teste 1.1.6:** Outros cards são empurrados automaticamente (reflow)
- [ ] **Teste 1.1.7:** Card retorna à posição original se solto fora do grid
- [ ] **Teste 1.1.8:** Shadow aparece durante o drag (sombra azul primária)
- [ ] **Teste 1.1.9:** Opacity reduz para 0.9 durante o drag
- [ ] **Teste 1.1.10:** Cards não podem ser arrastados entre seções diferentes

#### 1.2 Resize
- [ ] **Teste 1.2.1:** Handle de resize visível no canto inferior direito (bordas azuis)
- [ ] **Teste 1.2.2:** Cursor muda para "se-resize" ao passar sobre o handle
- [ ] **Teste 1.2.3:** Card redimensiona horizontalmente (largura)
- [ ] **Teste 1.2.4:** Card redimensiona verticalmente (altura)
- [ ] **Teste 1.2.5:** Card redimensiona bidirecionalmente (diagonal)
- [ ] **Teste 1.2.6:** Indicador de dimensões aparece (ex: "4 × 3") durante resize
- [ ] **Teste 1.2.7:** Largura mínima respeitada (minW definido no layout)
- [ ] **Teste 1.2.8:** Altura mínima respeitada (minH definido no layout)
- [ ] **Teste 1.2.9:** Largura máxima respeitada (12 colunas no máximo)
- [ ] **Teste 1.2.10:** Opacity reduz para 0.95 durante o resize
- [ ] **Teste 1.2.11:** Outros cards são empurrados ao redimensionar
- [ ] **Teste 1.2.12:** Reflow automático funciona (compactação vertical)

#### 1.3 Colisão e Reflow
- [ ] **Teste 1.3.1:** Cards não se sobrepõem
- [ ] **Teste 1.3.2:** Cards empurram outros cards para baixo quando necessário
- [ ] **Teste 1.3.3:** Grid compacta verticalmente automaticamente (compactType="vertical")
- [ ] **Teste 1.3.4:** Não há espaços vazios desnecessários entre cards

---

### ✅ 2. PERSISTÊNCIA (LocalStorage + Supabase)

#### 2.1 LocalStorage
- [ ] **Teste 2.1.1:** Layout salva automaticamente ao arrastar um card
- [ ] **Teste 2.1.2:** Layout salva automaticamente ao redimensionar um card
- [ ] **Teste 2.1.3:** Layout restaura corretamente ao recarregar a página (F5)
- [ ] **Teste 2.1.4:** Layout restaura corretamente ao voltar para a página
- [ ] **Teste 2.1.5:** Keys corretos no localStorage: `grid-card-${sectionId}-${cardId}`
- [ ] **Teste 2.1.6:** Dados salvos estão em formato JSON válido
- [ ] **Teste 2.1.7:** Layout persiste entre diferentes seções

#### 2.2 Supabase (Database)
- [ ] **Teste 2.2.1:** Botão "Salvar Layout" aparece quando há modificações
- [ ] **Teste 2.2.2:** Status "Salvando..." aparece ao clicar em "Salvar"
- [ ] **Teste 2.2.3:** Layout salva no Supabase (tabela user_layout_preferences)
- [ ] **Teste 2.2.4:** Versão do layout é incrementada corretamente
- [ ] **Teste 2.2.5:** Toast de sucesso aparece: "Layout salvo com sucesso!"
- [ ] **Teste 2.2.6:** Layout restaura do Supabase ao fazer login em outro dispositivo
- [ ] **Teste 2.2.7:** Botão "Resetar" volta ao layout padrão (DEFAULT_DASHBOARD_GRID_LAYOUT)
- [ ] **Teste 2.2.8:** Confirmação de reset aparece antes de executar

---

### ✅ 3. SISTEMA DE SEÇÕES

#### 3.1 Isolamento de Seções
- [ ] **Teste 3.1.1:** Cada seção tem seu próprio grid independente (12 colunas)
- [ ] **Teste 3.1.2:** Cards de uma seção não afetam outras seções
- [ ] **Teste 3.1.3:** Arrastar card não move para outras seções
- [ ] **Teste 3.1.4:** Redimensionar card não invade outras seções
- [ ] **Teste 3.1.5:** Seção "Financial" possui cards financeiros apenas
- [ ] **Teste 3.1.6:** Seção "Administrative" possui cards administrativos apenas
- [ ] **Teste 3.1.7:** Seção "Clinical" possui cards clínicos apenas
- [ ] **Teste 3.1.8:** Seção "Media" possui cards de mídia apenas
- [ ] **Teste 3.1.9:** Seção "General" possui cards gerais apenas
- [ ] **Teste 3.1.10:** Seção "Charts" possui gráficos apenas
- [ ] **Teste 3.1.11:** Seção "Team" possui dados da equipe apenas

#### 3.2 Colapso e Expansão
- [ ] **Teste 3.2.1:** Clicar no título da seção colapsa/expande
- [ ] **Teste 3.2.2:** Ícone de chevron muda ao colapsar/expandir
- [ ] **Teste 3.2.3:** Grid desaparece ao colapsar
- [ ] **Teste 3.2.4:** Grid reaparece ao expandir
- [ ] **Teste 3.2.5:** Estado de colapso persiste ao recarregar página
- [ ] **Teste 3.2.6:** Altura da seção se ajusta ao conteúdo automaticamente

---

### ✅ 4. SISTEMA DE PERMISSÕES

#### 4.1 Visibilidade de Cards
- [ ] **Teste 4.1.1:** Admin vê todos os cards
- [ ] **Teste 4.1.2:** Subordinate sem autonomia vê apenas cards permitidos
- [ ] **Teste 4.1.3:** Subordinate com autonomia vê cards adicionais
- [ ] **Teste 4.1.4:** Cards invisíveis não aparecem no grid
- [ ] **Teste 4.1.5:** Cards invisíveis não ocupam espaço no grid
- [ ] **Teste 4.1.6:** Função `canSeeCard()` funciona corretamente

#### 4.2 Adicionar e Remover Cards
- [ ] **Teste 4.2.1:** Botão "Adicionar Card" aparece em edit mode
- [ ] **Teste 4.2.2:** Dialog "Add Card" abre ao clicar
- [ ] **Teste 4.2.3:** Lista mostra apenas cards disponíveis (não adicionados)
- [ ] **Teste 4.2.4:** Adicionar card funciona e aparece no grid
- [ ] **Teste 4.2.5:** Novo card aparece na próxima posição disponível
- [ ] **Teste 4.2.6:** Remover card funciona (botão X ou Delete)
- [ ] **Teste 4.2.7:** Grid reflow após remover card
- [ ] **Teste 4.2.8:** Layout atualiza após adicionar/remover

---

### ✅ 5. UX E FEEDBACK VISUAL

#### 5.1 Edit Mode
- [ ] **Teste 5.1.1:** Botão "Editar Layout" ativa edit mode
- [ ] **Teste 5.1.2:** Botão muda para "Concluir Edição" em edit mode
- [ ] **Teste 5.1.3:** Drag handle aparece apenas em edit mode
- [ ] **Teste 5.1.4:** Handle de resize aparece apenas em edit mode
- [ ] **Teste 5.1.5:** Grid de fundo aparece apenas em edit mode (linhas cinzas sutis)
- [ ] **Teste 5.1.6:** Indicador de dimensões aparece apenas em edit mode
- [ ] **Teste 5.1.7:** Cards não podem ser arrastados fora de edit mode
- [ ] **Teste 5.1.8:** Cards não podem ser redimensionados fora de edit mode

#### 5.2 Badge "Personalizado"
- [ ] **Teste 5.2.1:** Badge "Personalizado" aparece quando layout é modificado
- [ ] **Teste 5.2.2:** Badge desaparece após resetar layout
- [ ] **Teste 5.2.3:** Badge compara com DEFAULT_DASHBOARD_GRID_LAYOUT corretamente
- [ ] **Teste 5.2.4:** Badge detecta mudança de posição (x, y)
- [ ] **Teste 5.2.5:** Badge detecta mudança de tamanho (w, h)
- [ ] **Teste 5.2.6:** Badge tem estilo "secondary" correto

#### 5.3 Animações e Transições
- [ ] **Teste 5.3.1:** Transições são suaves (200ms ease)
- [ ] **Teste 5.3.2:** Drag não trava nem congela
- [ ] **Teste 5.3.3:** Resize não trava nem congela
- [ ] **Teste 5.3.4:** Placeholder aparece instantaneamente
- [ ] **Teste 5.3.5:** Shadow durante drag é visível e bonito
- [ ] **Teste 5.3.6:** Handle de resize tem hover effect (opacity 0.5 → 1)

#### 5.4 Cursores
- [ ] **Teste 5.4.1:** Cursor "default" em modo normal
- [ ] **Teste 5.4.2:** Cursor "grab" ao passar sobre drag handle
- [ ] **Teste 5.4.3:** Cursor "grabbing" durante drag
- [ ] **Teste 5.4.4:** Cursor "se-resize" ao passar sobre resize handle
- [ ] **Teste 5.4.5:** Cursor "se-resize" durante resize

---

### ✅ 6. PERFORMANCE

#### 6.1 Velocidade
- [ ] **Teste 6.1.1:** Página carrega em menos de 2 segundos
- [ ] **Teste 6.1.2:** Drag tem latência < 50ms
- [ ] **Teste 6.1.3:** Resize tem latência < 50ms
- [ ] **Teste 6.1.4:** Reflow automático é instantâneo
- [ ] **Teste 6.1.5:** Salvar no localStorage é instantâneo
- [ ] **Teste 6.1.6:** Salvar no Supabase leva menos de 1 segundo

#### 6.2 Memória
- [ ] **Teste 6.2.1:** Sem memory leaks ao entrar/sair de edit mode
- [ ] **Teste 6.2.2:** Sem memory leaks ao colapsar/expandir seções
- [ ] **Teste 6.2.3:** Sem memory leaks ao arrastar cards repetidamente
- [ ] **Teste 6.2.4:** Uso de memória estável (< 100MB para a página)

#### 6.3 Otimizações
- [ ] **Teste 6.3.1:** Will-change aplicado corretamente (transform, width, height)
- [ ] **Teste 6.3.2:** Z-index otimizado durante interações (z-100)
- [ ] **Teste 6.3.3:** Transições usam transform (não left/top) para melhor performance
- [ ] **Teste 6.3.4:** Sem re-renders desnecessários

---

### ✅ 7. RESPONSIVIDADE

#### 7.1 Desktop (> 1024px)
- [ ] **Teste 7.1.1:** Grid exibe 12 colunas completas
- [ ] **Teste 7.1.2:** Cards mantêm proporções corretas
- [ ] **Teste 7.1.3:** Drag & drop funciona perfeitamente
- [ ] **Teste 7.1.4:** Resize funciona perfeitamente

#### 7.2 Tablet (768px - 1024px)
- [ ] **Teste 7.2.1:** Grid se adapta ao tamanho menor
- [ ] **Teste 7.2.2:** Cards redimensionam proporcionalmente
- [ ] **Teste 7.2.3:** Touch drag funciona (se disponível)
- [ ] **Teste 7.2.4:** Touch resize funciona (se disponível)

#### 7.3 Mobile (< 768px)
- [ ] **Teste 7.3.1:** Grid empilha cards verticalmente (se necessário)
- [ ] **Teste 7.3.2:** Cards mantêm legibilidade
- [ ] **Teste 7.3.3:** Touch interactions funcionam
- [ ] **Teste 7.3.4:** Edit mode ainda funcional (com limitações)

---

### ✅ 8. CASOS EXTREMOS (Edge Cases)

#### 8.1 Layouts Vazios
- [ ] **Teste 8.1.1:** Seção sem cards não quebra
- [ ] **Teste 8.1.2:** Adicionar primeiro card funciona
- [ ] **Teste 8.1.3:** Remover último card funciona

#### 8.2 Layouts Cheios
- [ ] **Teste 8.2.1:** Grid com muitos cards não quebra (>20 cards)
- [ ] **Teste 8.2.2:** Performance mantém-se aceitável
- [ ] **Teste 8.2.3:** Scroll funciona corretamente

#### 8.3 Erros e Recuperação
- [ ] **Teste 8.3.1:** LocalStorage cheio não quebra app
- [ ] **Teste 8.3.2:** Erro no Supabase não quebra app
- [ ] **Teste 8.3.3:** JSON corrompido no localStorage é ignorado
- [ ] **Teste 8.3.4:** Layout inválido volta ao padrão automaticamente

---

### ✅ 9. COMPATIBILIDADE

#### 9.1 Navegadores
- [ ] **Teste 9.1.1:** Chrome (última versão) funciona perfeitamente
- [ ] **Teste 9.1.2:** Firefox (última versão) funciona perfeitamente
- [ ] **Teste 9.1.3:** Safari (última versão) funciona perfeitamente
- [ ] **Teste 9.1.4:** Edge (última versão) funciona perfeitamente

#### 9.2 Sistemas Operacionais
- [ ] **Teste 9.2.1:** Windows funciona
- [ ] **Teste 9.2.2:** macOS funciona
- [ ] **Teste 9.2.3:** Linux funciona
- [ ] **Teste 9.2.4:** iOS funciona (se aplicável)
- [ ] **Teste 9.2.5:** Android funciona (se aplicável)

---

### ✅ 10. INTEGRAÇÃO COM SISTEMA EXISTENTE

#### 10.1 Dashboard Cards
- [ ] **Teste 10.1.1:** Todos os cards renderizam corretamente
- [ ] **Teste 10.1.2:** Dados dos cards carregam corretamente
- [ ] **Teste 10.1.3:** Interações dentro dos cards funcionam
- [ ] **Teste 10.1.4:** Gráficos renderizam dentro do grid

#### 10.2 Dialogs e Modais
- [ ] **Teste 10.2.1:** AddCardDialog funciona
- [ ] **Teste 10.2.2:** Outros dialogs não quebram com o grid
- [ ] **Teste 10.2.3:** Z-index dos modais está correto (> z-100)

#### 10.3 Rotas e Navegação
- [ ] **Teste 10.3.1:** Voltar/Avançar no navegador funciona
- [ ] **Teste 10.3.2:** Layout persiste ao navegar entre páginas
- [ ] **Teste 10.3.3:** Logout não quebra o sistema

---

### ✅ 11. ACESSIBILIDADE

#### 11.1 Teclado
- [ ] **Teste 11.1.1:** Tab navega entre cards
- [ ] **Teste 11.1.2:** Enter/Space ativa botões
- [ ] **Teste 11.1.3:** Esc fecha dialogs

#### 11.2 Screen Readers
- [ ] **Teste 11.2.1:** Aria labels presentes
- [ ] **Teste 11.2.2:** Semantic HTML correto
- [ ] **Teste 11.2.3:** Focus indicators visíveis

---

### ✅ 12. DOCUMENTAÇÃO

- [ ] **Teste 12.1:** README atualizado com instruções de uso
- [ ] **Teste 12.2:** PLANO_REACT_GRID_LAYOUT.md completo
- [ ] **Teste 12.3:** Comentários no código explicam lógica complexa
- [ ] **Teste 12.4:** Tipos TypeScript bem definidos

---

## 📊 RESUMO DE TESTES

**Total de Testes:** 174 casos de teste  
**Categorias:** 12 categorias principais  
**Prioridade Alta:** Funcionalidade Core, Persistência, Sistema de Seções, Permissões  
**Prioridade Média:** UX/Feedback Visual, Performance, Responsividade  
**Prioridade Baixa:** Casos Extremos, Acessibilidade, Documentação

---

## ✅ CRITÉRIOS DE ACEITAÇÃO FINAL

O projeto React Grid Layout estará **100% completo** quando:

1. ✅ **Todas as 4 fases implementadas** (Fase 1, 2, 3, 4)
2. ✅ **Pelo menos 90% dos testes passando** (157/174)
3. ✅ **Sem erros críticos no console**
4. ✅ **Performance adequada** (< 100ms para interações)
5. ✅ **Persistência funcionando** (localStorage + Supabase)
6. ✅ **Documentação completa** (PLANO_REACT_GRID_LAYOUT.md atualizado)
7. ✅ **Código limpo e componentizado**
8. ✅ **Componentes obsoletos removidos** (SortableCard, etc.)
9. ✅ **Sem regressões** (funcionalidades antigas continuam funcionando)

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
- ✅ **Fase 1 concluída: Instalação e Setup**
  - react-grid-layout v1.5.2 instalado
  - GridCardContainer criado em `src/components/GridCardContainer.tsx`
  - CSS básico configurado (react-grid-layout/css/styles.css)
  - Props definidos: sectionId, layout, onLayoutChange, isEditMode, children
  - Grid configurado: 12 colunas, 60px rowHeight, draggableHandle=".drag-handle"

- ✅ **Fase 2 concluída: Migração de Dados e Tipos**
  - **Arquivo criado:** `src/lib/gridLayoutUtils.ts`
    - `convertSequentialToGrid()`: Converte layout legado para grid
    - `calculatePixelWidth()` e `calculatePixelHeight()`: Conversão cols/rows → pixels
    - `validateGridLayout()`: Validação de integridade do layout
    - `findNextAvailablePosition()`: Encontra posição para novos cards
  - **Tipos atualizados:** `src/types/cardTypes.ts`
    - Interface `GridCardLayout` criada (extends Layout do react-grid-layout)
    - Propriedades: i, x, y, w, h, minW, minH, maxW, maxH
  - **Layout padrão definido:** `src/lib/defaultLayoutDashboardExample.ts`
    - `DEFAULT_DASHBOARD_GRID_LAYOUT` criado para 7 seções
    - Tipos: `GridSectionLayout`, `DashboardGridLayout`
    - Layouts configurados: Financial, Administrative, Clinical, Media, General, Charts, Team
    - Layout legado mantido para compatibilidade

- ✅ **Fase 3 concluída: Integração com Dashboard Example**
  - **Hook reescrito:** `src/hooks/useDashboardLayout.ts`
    - Gerencia `DashboardGridLayout` diretamente
    - `updateLayout(sectionId, newLayout)`: Atualiza grid de uma seção
    - `addCard(sectionId, cardId)`: Adiciona card com posição automática
    - `removeCard(sectionId, cardId)`: Remove card do grid
    - Persistência em localStorage: `grid-card-${sectionId}-${cardId}`
    - Loading e saving states implementados
  - **Página atualizada:** `src/pages/DashboardExample.tsx`
    - `SortableCardContainer` → `GridCardContainer`
    - Cards renderizam com `data-grid={cardLayout}`
    - Drag handle (`.drag-handle`) adicionado em edit mode
    - Sistema de permissões mantido (canSeeCard)
  - **Componentes removidos:**
    - ❌ `src/components/SortableCardContainer.tsx`
    - ❌ `src/components/SortableCard.tsx`
    - ❌ `src/components/ResizableCardSimple.tsx`
    - ❌ `src/components/DashboardSectionExample.tsx`

- ✅ **Fase 4 concluída: Persistência e Polimento**
  - **Estilos customizados:** `src/index.css`
    - Transições suaves (200ms ease) para drag/resize
    - Z-index otimizado durante interações (z-100)
    - Opacity durante drag (0.9) e resize (0.95)
    - Shadow durante drag com cor primária (hsl(var(--primary) / 0.3))
    - Handle de resize customizado (8x8px, primary color)
    - Placeholder com borda tracejada e background primário
    - Will-change para performance (transform, width, height)
  - **Feedback visual:** `src/pages/DashboardExample.tsx`
    - Grid de fundo em edit mode (linhas cinzas, opacity 10%)
    - Badge "Personalizado" quando layout difere do padrão
    - Indicador de dimensões (w × h) no canto inferior direito durante edit mode
    - Handle visual melhorado (hover effect, transition)
  - **Detecção de customização:**
    - Comparação automática com DEFAULT_DASHBOARD_GRID_LAYOUT
    - Verifica posição (x, y) e tamanho (w, h) de cada card
    - Badge aparece apenas quando há diferenças

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
**Status Geral:** ✅ COMPLETO - Todas as 4 Fases Concluídas com Sucesso

---

## 🎉 PROJETO CONCLUÍDO

Migração para React Grid Layout **100% implementada**. Sistema agora suporta:
- ✅ Drag & drop livre em 2D dentro de seções
- ✅ Resize bidirecional (largura + altura)
- ✅ Reflow automático com detecção de colisão
- ✅ Persistência completa (localStorage + Supabase)
- ✅ Feedback visual rico (grid, badges, dimensões)
- ✅ Estilos customizados e animações suaves
- ✅ Sistema de permissões mantido
- ✅ 174 casos de teste definidos para validação completa
