# 🐛 BUG REPORT: Metrics Grid Layout Não Funciona

**Data:** 2024-11-29  
**Status:** 🔴 CRÍTICO - Drag, Drop e Resize completamente quebrados  
**Página Afetada:** `/metrics`  
**Página de Referência (funcionando):** `/dashboard-example`

---

## 📋 SUMÁRIO EXECUTIVO

O sistema de Grid Layout na página `/metrics` está **completamente quebrado**:
- ❌ Drag & drop não funciona
- ❌ Resize não funciona
- ❌ Cards se sobrepõem incorretamente
- ❌ Reflow não acontece (cards não empurram outros)
- ❌ Container não se ajusta à altura necessária

A página `/dashboard-example` **funciona perfeitamente** com o mesmo componente `GridCardContainer`.

---

## 🔍 ANÁLISE COMPARATIVA: `/dashboard-example` vs `/metrics`

### ✅ `/dashboard-example` (FUNCIONA)

#### Estrutura do HTML:
```html
<div class="p-4 rounded-lg min-h-[200px] transition-all duration-300 relative bg-muted/20 border-2 border-dashed border-primary/30 shadow-inner">
  <!-- Grid de fundo visual (edit mode) -->
  <div class="absolute inset-0 pointer-events-none opacity-10 z-0 rounded-lg" style="background-image: linear-gradient(...)"></div>
  
  <!-- GridCardContainer -->
  <div class="relative w-full">
    <div class="react-grid-layout layout" style="height: XXXpx;">
      <!-- Card 1 -->
      <div class="react-grid-item" data-grid="{...}" style="transform: translate(0px, 0px); width: XXXpx; height: XXXpx;">
        <div data-grid="{...}">
          <div class="h-full flex flex-col shadow-md hover:shadow-lg transition-shadow">
            <!-- Drag Handle -->
            <div class="drag-handle cursor-move bg-primary/10 hover:bg-primary/20 p-2 border-b flex items-center justify-center group transition-colors">
              <svg>...</svg> <!-- GripVertical icon -->
            </div>
            <!-- Card Content -->
            <div class="p-4 flex-1 overflow-auto">...</div>
          </div>
        </div>
        <!-- Resize Handle -->
        <span class="react-resizable-handle react-resizable-handle-se"></span>
      </div>
      
      <!-- Card 2, Card 3... -->
    </div>
  </div>
</div>
```

#### Características FUNCIONANDO:
1. **Container com altura mínima**: `min-h-[200px]` no wrapper do GridCardContainer
2. **Padding adequado**: `p-4` no wrapper
3. **Visual de fundo em grid**: Para orientar o usuário em edit mode
4. **Drag Handle explícito**: `<div class="drag-handle">` com ícone GripVertical
5. **Card estruturado**: UICard → drag-handle → CardContent
6. **Z-index correto**: React Grid Layout aplica `z-index: 100` ao arrastar
7. **Resize handles**: `react-resizable-handle` presente em cada card
8. **Auto-height**: GridLayout calcula e aplica `style="height: XXXpx"` no container

---

### ❌ `/metrics` (QUEBRADO)

#### Estrutura do HTML Atual:
```html
<div class="mb-6">
  <div class="relative w-full">
    <div class="react-grid-layout layout" style="height: XXXpx;">
      <!-- Card 1 -->
      <div class="react-grid-item" data-grid="{...}" style="transform: translate(0px, 0px); width: XXXpx; height: XXXpx;">
        <div data-grid="{...}">
          <!-- ⚠️ PROBLEMA 1: Wrapper com drag-handle mas SEM altura definida -->
          <div class="h-full drag-handle cursor-move">
            <!-- ⚠️ PROBLEMA 2: Componente de card diretamente, sem estrutura UICard -->
            <div class="rounded-lg border bg-card text-card-foreground shadow-sm h-full">
              <!-- Conteúdo do card métrico -->
            </div>
          </div>
        </div>
        <!-- ⚠️ PROBLEMA 3: Resize handle EXISTE mas não funciona -->
        <span class="react-resizable-handle react-resizable-handle-se"></span>
      </div>
    </div>
  </div>
</div>
```

#### Problemas Identificados:

##### 🔴 **PROBLEMA 1: Falta de Container Wrapper com altura mínima**
```tsx
// ❌ ATUAL em Metrics.tsx (linha 606)
<div className="mb-6">
  <GridCardContainer
    sectionId={currentSectionId}
    layout={currentSectionLayout}
    onLayoutChange={(newLayout) => updateLayout(currentSectionId, newLayout)}
    isEditMode={isEditMode}
  >
```

```tsx
// ✅ DEVERIA SER (como em DashboardExample.tsx linha 694)
<div className={cn(
  'p-4 rounded-lg min-h-[200px] transition-all duration-300 relative',
  isEditMode && 'bg-muted/20 border-2 border-dashed border-primary/30 shadow-inner'
)}>
  {isEditMode && (
    <div 
      className="absolute inset-0 pointer-events-none opacity-10 z-0 rounded-lg"
      style={{
        backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
        backgroundSize: '100px 60px',
      }}
    />
  )}
  
  <GridCardContainer
    sectionId={currentSectionId}
    layout={currentSectionLayout}
    onLayoutChange={(newLayout) => updateLayout(currentSectionId, newLayout)}
    isEditMode={isEditMode}
    width={1200}
  >
```

**IMPACTO:**
- Container não tem altura mínima → Cards podem colapsar
- Sem padding → Cards colam nas bordas
- Sem visual de grid → Usuário não tem feedback visual do sistema de grid
- Sem borda em edit mode → Não fica claro que está em modo de edição

---

##### 🔴 **PROBLEMA 2: Estrutura do Card Inadequada**

```tsx
// ❌ ATUAL em Metrics.tsx (linhas 616-622)
<div key={cardLayout.i} data-grid={cardLayout}>
  <div className="h-full drag-handle cursor-move">
    {CardComponent}  {/* Componente de card métrico diretamente */}
  </div>
</div>
```

```tsx
// ✅ DEVERIA SER (como em DashboardExample.tsx linhas 739-760)
<div key={cardLayout.i} data-grid={cardLayout}>
  <UICard className="h-full flex flex-col shadow-md hover:shadow-lg transition-shadow">
    {isEditMode && (
      <div className="drag-handle cursor-move bg-primary/10 hover:bg-primary/20 active:bg-primary/30 p-2 border-b flex items-center justify-center group transition-colors">
        <GripVertical className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
      </div>
    )}
    <CardContent className="p-4 flex-1 overflow-auto">
      {CardComponent}
    </CardContent>
  </UICard>
</div>
```

**IMPACTO:**
- ❌ Drag handle cobre o card inteiro → Não consegue interagir com conteúdo do card
- ❌ Sem visual explícito de onde arrastar → UX ruim
- ❌ Sem estrutura UICard → Flexbox pode não funcionar corretamente
- ❌ Sem `flex flex-col` → Altura pode não ser respeitada
- ❌ Componente de card pode ter seu próprio cursor → Conflito com drag-handle

---

##### 🔴 **PROBLEMA 3: Falta de prop `width` no GridCardContainer**

```tsx
// ❌ ATUAL em Metrics.tsx (linha 607)
<GridCardContainer
  sectionId={currentSectionId}
  layout={currentSectionLayout}
  onLayoutChange={(newLayout) => updateLayout(currentSectionId, newLayout)}
  isEditMode={isEditMode}
>
```

```tsx
// ✅ DEVERIA SER (como em DashboardExample.tsx linha 709)
<GridCardContainer
  sectionId={currentSectionId}
  layout={currentSectionLayout}
  onLayoutChange={(newLayout) => updateLayout(currentSectionId, newLayout)}
  isEditMode={isEditMode}
  width={1200}  // ⚠️ CRÍTICO: Define largura base para cálculos do grid
>
```

**IMPACTO:**
- GridCardContainer usa `propWidth || 1200` como fallback
- Sem prop explícita, pode haver inconsistências no cálculo de largura
- Cálculo de colunas pode ficar impreciso

---

##### 🔴 **PROBLEMA 4: Componente de Card Não Está Preparado para o Drag Handle Wrapper**

Os componentes de card em `/metrics` (ex: `MetricsRevenueTotalCard`) foram feitos para serem **standalone**, sem expectativa de um wrapper `drag-handle`.

```tsx
// Exemplo: MetricsRevenueTotalCard.tsx
export const MetricsRevenueTotalCard = ({ ... }) => {
  return (
    <Card className="h-full">  {/* ⚠️ Este Card espera ser o root */}
      <CardHeader>...</CardHeader>
      <CardContent>...</CardContent>
    </Card>
  );
};
```

Quando envolvido por `<div className="h-full drag-handle cursor-move">`, o comportamento muda:
- O card perde controle sobre seu próprio cursor
- Cliques em qualquer lugar tentam iniciar drag
- Interações internas (botões, selects) ficam comprometidas

---

## 🔧 COMPARAÇÃO TÉCNICA: React Grid Layout

### Configuração do GridCardContainer (IDÊNTICA em ambos)

```tsx
// src/components/GridCardContainer.tsx (linhas 157-173)
<GridLayout
  className="layout"
  layout={layout}
  cols={12}              // ✅ IGUAL
  rowHeight={30}         // ✅ IGUAL
  width={containerWidth} // ✅ IGUAL (calculado dinamicamente)
  isDraggable={isEditMode}  // ✅ IGUAL
  isResizable={isEditMode}  // ✅ IGUAL
  onLayoutChange={handleLayoutChange}  // ✅ IGUAL
  draggableHandle=".drag-handle"  // ✅ IGUAL - Procura por classe .drag-handle
  compactType="vertical"           // ✅ IGUAL
  preventCollision={false}         // ✅ IGUAL
  margin={[16, 16]}               // ✅ IGUAL
  containerPadding={[0, 0]}       // ✅ IGUAL
  useCSSTransforms={true}         // ✅ IGUAL
  autoSize={true}                 // ✅ IGUAL
>
```

**CONCLUSÃO:** O problema NÃO está no GridCardContainer. Ele é o mesmo em ambas as páginas.

---

## 🎯 DIFERENÇAS CRUCIAIS

| Aspecto | `/dashboard-example` ✅ | `/metrics` ❌ |
|---------|------------------------|--------------|
| **Container wrapper** | `<div className="p-4 rounded-lg min-h-[200px]">` | `<div className="mb-6">` |
| **Grid de fundo visual** | ✅ Sim (em edit mode) | ❌ Não |
| **Prop `width`** | ✅ `width={1200}` | ❌ Omitido |
| **Estrutura do card** | UICard → drag-handle → CardContent → Componente | drag-handle → Componente direto |
| **Drag handle explícito** | ✅ Barra visível com ícone GripVertical | ❌ Div invisível que cobre tudo |
| **Altura do card** | `h-full flex flex-col` no UICard | `h-full` apenas no wrapper drag-handle |
| **Overflow** | `overflow-auto` no CardContent | Não controlado |

---

## 📊 ANÁLISE DE CSS (index.css)

O CSS para React Grid Layout está **CORRETO** e **IDÊNTICO** para ambas as páginas:

```css
/* src/index.css (linhas 109-165) */

/* Base grid item - ✅ CORRETO */
.react-grid-item {
  transition: all 200ms ease;
  transition-property: left, top, width, height;
  box-sizing: border-box;
}

/* Item durante drag - ✅ CORRETO */
.react-grid-item.react-draggable-dragging {
  transition: none;
  z-index: 100;  /* ⚠️ Z-index elevado durante drag */
  will-change: transform;
  opacity: 0.9;
  box-shadow: 0 10px 30px -10px hsl(var(--primary) / 0.3);
}

/* Resize handle - ✅ CORRETO */
.react-grid-item > .react-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 0;
  right: 0;
  background: transparent;
  cursor: se-resize;
  z-index: 10;
}

/* Visual do resize handle - ✅ CORRETO */
.react-grid-item > .react-resizable-handle::after {
  content: "";
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 8px;
  height: 8px;
  border-right: 2px solid hsl(var(--primary));
  border-bottom: 2px solid hsl(var(--primary));
  opacity: 0.5;
}

.react-grid-item:hover > .react-resizable-handle::after {
  opacity: 1;  /* ⚠️ Fica mais visível no hover */
}

/* Placeholder durante drag - ✅ CORRETO */
.react-grid-placeholder {
  background: hsl(var(--primary) / 0.15);
  border: 2px dashed hsl(var(--primary) / 0.4);
  border-radius: 0.5rem;
  transition: all 200ms ease;
}
```

**CONCLUSÃO:** O CSS está perfeito. O problema é **estrutural no HTML/React**.

---

## 🐞 POR QUE NÃO FUNCIONA EM `/metrics`?

### **Drag & Drop NÃO FUNCIONA porque:**

1. **Drag handle cobre o card inteiro** → Todo clique tenta iniciar drag
2. **Componente de card pode ter `pointer-events`** → Bloqueia o drag
3. **Sem estrutura flexbox adequada** → Altura colapsa e não há área para clicar
4. **Falta de feedback visual** → Usuário não sabe onde arrastar

### **Resize NÃO FUNCIONA porque:**

1. **Container wrapper não tem padding** → Resize handle pode estar escondido na borda
2. **Card pode estar colapsando em altura** → Resize handle fica inacessível
3. **Z-index pode estar sendo sobrescrito** → Handle fica "atrás" do conteúdo
4. **Falta de estrutura UICard flexbox** → Altura não é respeitada corretamente

### **Reflow NÃO FUNCIONA porque:**

1. **Container não tem `min-h-[200px]`** → Colapsa e não há espaço para reflow
2. **Cálculo de altura pode estar errado** → GridLayout não consegue calcular posições
3. **Padding ausente** → Cards se comprimem demais

---

## ✅ SOLUÇÃO PROPOSTA

### **CORREÇÃO 1: Adicionar Container Wrapper Adequado**

**Local:** `src/pages/Metrics.tsx`, função `renderMetricCards()`, linha ~606

**Substituir:**
```tsx
<div className="mb-6">
  <GridCardContainer
    sectionId={currentSectionId}
    layout={currentSectionLayout}
    onLayoutChange={(newLayout) => updateLayout(currentSectionId, newLayout)}
    isEditMode={isEditMode}
  >
```

**Por:**
```tsx
<div className={cn(
  'p-4 rounded-lg min-h-[200px] transition-all duration-300 relative',
  isEditMode && 'bg-muted/20 border-2 border-dashed border-primary/30 shadow-inner'
)}>
  {/* Grid de fundo em edit mode */}
  {isEditMode && (
    <div 
      className="absolute inset-0 pointer-events-none opacity-10 z-0 rounded-lg"
      style={{
        backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
        backgroundSize: '100px 60px',
      }}
    />
  )}
  
  <GridCardContainer
    sectionId={currentSectionId}
    layout={currentSectionLayout}
    onLayoutChange={(newLayout) => updateLayout(currentSectionId, newLayout)}
    isEditMode={isEditMode}
    width={1200}
  >
```

---

### **CORREÇÃO 2: Reestruturar Renderização dos Cards**

**Local:** `src/pages/Metrics.tsx`, dentro do `GridCardContainer.map`, linhas ~613-622

**Substituir:**
```tsx
{currentSectionLayout.map((cardLayout) => {
  const CardComponent = getCardComponent(cardLayout.i);
  return (
    <div key={cardLayout.i} data-grid={cardLayout}>
      <div className="h-full drag-handle cursor-move">
        {CardComponent}
      </div>
    </div>
  );
})}
```

**Por:**
```tsx
{currentSectionLayout.map((cardLayout) => {
  const CardComponent = getCardComponent(cardLayout.i);
  return (
    <div key={cardLayout.i} data-grid={cardLayout}>
      <Card className="h-full flex flex-col shadow-md hover:shadow-lg transition-shadow">
        {isEditMode && (
          <div className="drag-handle cursor-move bg-primary/10 hover:bg-primary/20 active:bg-primary/30 p-2 border-b flex items-center justify-center group transition-colors">
            <GripVertical className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </div>
        )}
        <CardContent className="p-4 flex-1 overflow-auto">
          {CardComponent}
        </CardContent>
      </Card>
    </div>
  );
})}
```

**Imports necessários:**
```tsx
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';
```

---

### **CORREÇÃO 3: Ajustar Componentes de Card Métricas**

**Problema:** Os componentes de card em `/metrics` renderizam um `<Card>` completo, que agora será **duplicado** com a estrutura acima.

**Solução:** Modificar os componentes de card para renderarem apenas o **conteúdo interno**.

**Exemplo:** `src/components/cards/metrics/financial/MetricsRevenueTotalCard.tsx`

**Substituir:**
```tsx
export const MetricsRevenueTotalCard = ({ ... }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Receita Total</CardTitle>
        <CardDescription>...</CardDescription>
      </CardHeader>
      <CardContent>
        ...
      </CardContent>
    </Card>
  );
};
```

**Por:**
```tsx
export const MetricsRevenueTotalCard = ({ ... }) => {
  return (
    <>
      <CardHeader>
        <CardTitle>Receita Total</CardTitle>
        <CardDescription>...</CardDescription>
      </CardHeader>
      <CardContent>
        ...
      </CardContent>
    </>
  );
};
```

**OU**, se preferir manter o Card:
```tsx
export const MetricsRevenueTotalCard = ({ ... }) => {
  return (
    <div className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Receita Total</CardTitle>
        <CardDescription>...</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        ...
      </CardContent>
    </div>
  );
};
```

**IMPORTANTE:** Esta mudança deve ser aplicada a **TODOS** os componentes de card em:
- `src/components/cards/metrics/financial/*`
- `src/components/cards/metrics/administrative/*`
- `src/components/cards/metrics/marketing/*`

---

## 📝 LISTA DE ARQUIVOS A MODIFICAR

### 1. `src/pages/Metrics.tsx`
- [ ] Adicionar container wrapper com padding, altura mínima e visual de grid
- [ ] Adicionar prop `width={1200}` no GridCardContainer
- [ ] Reestruturar renderização dos cards com UICard + drag-handle explícito
- [ ] Adicionar imports: `Card`, `CardContent`, `GripVertical`, `cn`

### 2. Componentes de Card Financeiro
- [ ] `src/components/cards/metrics/financial/MetricsRevenueTotalCard.tsx`
- [ ] `src/components/cards/metrics/financial/MetricsAvgPerSessionCard.tsx`
- [ ] `src/components/cards/metrics/financial/MetricsForecastRevenueCard.tsx`
- [ ] `src/components/cards/metrics/financial/MetricsAvgPerActivePatientCard.tsx`
- [ ] `src/components/cards/metrics/financial/MetricsLostRevenueCard.tsx`

### 3. Componentes de Card Administrativo
- [ ] `src/components/cards/metrics/administrative/MetricsMissedRateCard.tsx`
- [ ] `src/components/cards/metrics/administrative/MetricsActivePatientsCard.tsx`
- [ ] `src/components/cards/metrics/administrative/MetricsOccupationRateCard.tsx`

### 4. Componentes de Card Marketing
- [ ] `src/components/cards/metrics/marketing/MetricsWebsiteViewsCard.tsx`
- [ ] `src/components/cards/metrics/marketing/MetricsWebsiteVisitorsCard.tsx`
- [ ] `src/components/cards/metrics/marketing/MetricsWebsiteConversionCard.tsx`
- [ ] `src/components/cards/metrics/marketing/MetricsWebsiteCTRCard.tsx`

---

## 🔬 TESTES PÓS-CORREÇÃO

Após implementar as correções, testar:

### Drag & Drop
- [ ] Arrastar card pelo handle (ícone GripVertical)
- [ ] Card mostra placeholder durante drag
- [ ] Card faz reflow (empurra outros cards)
- [ ] Card pode ser solto em qualquer posição
- [ ] Múltiplos cards podem ser reorganizados

### Resize
- [ ] Handle de resize visível no canto inferior direito
- [ ] Hover no handle mostra cursor `se-resize`
- [ ] Resize horizontal funciona
- [ ] Resize vertical funciona
- [ ] Resize diagonal funciona
- [ ] Outros cards fazem reflow durante resize
- [ ] Tamanho mínimo (minW, minH) é respeitado
- [ ] Tamanho máximo (maxW, maxH) é respeitado

### Layout e Visual
- [ ] Container tem altura mínima visível
- [ ] Padding adequado entre cards e bordas
- [ ] Grid de fundo visível em edit mode
- [ ] Borda tracejada em edit mode
- [ ] Cards têm sombra e hover effect
- [ ] Auto-save funciona após 2 segundos de inatividade
- [ ] Indicador de "mudanças não salvas" aparece
- [ ] Botão "Salvar" fica habilitado quando há mudanças

### Interação com Conteúdo
- [ ] Conteúdo interno do card é clicável normalmente
- [ ] Selects, botões e inputs funcionam
- [ ] Scroll funciona dentro do card se necessário
- [ ] Drag só acontece pelo handle, não pelo conteúdo

---

## 📚 REFERÊNCIAS

- **Código de referência funcionando:** `src/pages/DashboardExample.tsx` (linhas 694-760)
- **Componente base:** `src/components/GridCardContainer.tsx`
- **Estilos:** `src/index.css` (linhas 109-165)
- **React Grid Layout docs:** https://github.com/react-grid-layout/react-grid-layout
- **Documento de planejamento original:** `PLANO_REACT_GRID_LAYOUT.md`
- **Track de implementação:** `docs/track_c3_phase_c3_r1_layout_restoration.md`

---

## 🎬 CONCLUSÃO

O bug em `/metrics` **NÃO É** um problema do GridCardContainer ou do React Grid Layout.

O problema é **ESTRUTURAL**:
1. Falta de container wrapper adequado
2. Estrutura incorreta dos cards (drag-handle cobrindo tudo)
3. Componentes de card não preparados para serem wrapeados
4. Falta de prop `width` no GridCardContainer
5. Ausência de feedback visual (grid de fundo, borda, etc.)

A solução é **COPIAR EXATAMENTE** o padrão usado em `/dashboard-example`, que funciona perfeitamente.

**Prioridade:** 🔴 **ALTA** - Sistema de layout completamente quebrado afeta toda a UX da página de métricas.

**Esforço estimado:** ~2-3 horas
- 30min: Correção do Metrics.tsx
- 1-2h: Ajuste de todos os componentes de card (12 arquivos)
- 30min: Testes completos

---

**Autor:** Lovable AI  
**Revisado por:** [Aguardando revisão do usuário]
