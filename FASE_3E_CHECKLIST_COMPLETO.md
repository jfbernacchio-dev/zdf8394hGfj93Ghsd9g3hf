# 📋 CHECKLIST COMPLETO DE TESTES - FASE 3 (3A + 3B + 3C + 3D + 3E)

**Data de Compilação:** 17 de Novembro de 2025  
**Escopo:** Dashboard Customizável Completo com Polimento Visual  
**Objetivo:** Validar todas as funcionalidades implementadas nas sub-fases 3A, 3B, 3C, 3D e 3E

---

## 🎯 RESUMO EXECUTIVO

### Status Geral
- **Total de Testes:** 95 testes
- **Fases Cobertas:** 5 (3A, 3B, 3C, 3D, 3E)
- **Componentes Testados:** 8 principais
- **Prioridade:** Alta (sistema core do dashboard)

### Componentes Principais
1. `ResizableCardSimple` - Resize horizontal de cards
2. `SortableCard` - Drag handle individual
3. `SortableCardContainer` - Container DnD
4. `useDashboardLayout` - Hook de persistência
5. `DashboardExample` - Página principal
6. `dashboardCardRegistry` - Registro de cards
7. `DASHBOARD_SECTIONS` - Configuração de seções
8. Polimento Visual (FASE 3E)

---

## 📦 FASE 3A - RESIZE HORIZONTAL (ResizableCardSimple)

### ✅ Testes Funcionais Básicos (6 testes)

#### Teste 3A.1: Renderização Básica
- **Objetivo:** Verificar renderização do componente
- **Passos:**
  1. Acessar `/dashboard-example`
  2. Verificar que cards são renderizados
  3. Verificar que cards têm largura padrão
- **Resultado Esperado:** Cards visíveis com largura inicial correta
- **Prioridade:** 🔴 Alta

#### Teste 3A.2: Alça de Resize Visível
- **Objetivo:** Verificar visibilidade da alça de resize
- **Passos:**
  1. Ativar modo de edição
  2. Passar mouse sobre card
  3. Verificar alça à direita
- **Resultado Esperado:** Alça aparece com ícone de grip e cursor `ew-resize`
- **Prioridade:** 🔴 Alta

#### Teste 3A.3: Resize Funcional
- **Objetivo:** Testar redimensionamento
- **Passos:**
  1. Ativar modo de edição
  2. Clicar e arrastar alça à direita
  3. Mover mouse horizontalmente
  4. Soltar mouse
- **Resultado Esperado:** Card redimensiona em tempo real, largura atualiza
- **Prioridade:** 🔴 Alta

#### Teste 3A.4: Limites Min/Max
- **Objetivo:** Verificar limites de largura
- **Passos:**
  1. Tentar redimensionar abaixo do mínimo (280px)
  2. Tentar redimensionar acima do máximo (800px)
- **Resultado Esperado:** 
  - Largura não vai abaixo de 280px
  - Largura não vai acima de 800px
- **Prioridade:** 🟡 Média

#### Teste 3A.5: Resize em Modo Normal
- **Objetivo:** Verificar bloqueio fora do edit mode
- **Passos:**
  1. Desativar modo de edição
  2. Tentar arrastar alça
- **Resultado Esperado:** Alça não aparece, resize impossível
- **Prioridade:** 🟡 Média

#### Teste 3A.6: Feedback Visual
- **Objetivo:** Verificar feedback durante resize
- **Passos:**
  1. Iniciar resize
  2. Observar card durante arraste
- **Resultado Esperado:** 
  - Ring primário aparece
  - Cursor muda para `ew-resize`
  - Transição suave
- **Prioridade:** 🟢 Baixa

### ✅ Testes de Persistência (4 testes)

#### Teste 3A.7: Salvar no localStorage
- **Objetivo:** Verificar salvamento imediato
- **Passos:**
  1. Redimensionar card
  2. Verificar localStorage (`card-width-{section}-{id}`)
- **Resultado Esperado:** Largura salva imediatamente
- **Prioridade:** 🔴 Alta

#### Teste 3A.8: Carregar do localStorage
- **Objetivo:** Verificar carregamento na montagem
- **Passos:**
  1. Redimensionar card
  2. Recarregar página
  3. Verificar largura mantida
- **Resultado Esperado:** Largura restaurada do localStorage
- **Prioridade:** 🔴 Alta

#### Teste 3A.9: Reset Manual
- **Objetivo:** Testar limpeza do localStorage
- **Passos:**
  1. Redimensionar cards
  2. Clicar em "Resetar Layout"
  3. Confirmar
- **Resultado Esperado:** 
  - localStorage limpo
  - Cards voltam à largura padrão
- **Prioridade:** 🟡 Média

#### Teste 3A.10: Múltiplos Cards
- **Objetivo:** Verificar persistência independente
- **Passos:**
  1. Redimensionar 3 cards diferentes
  2. Recarregar página
- **Resultado Esperado:** Cada card mantém sua largura individual
- **Prioridade:** 🟡 Média

---

## 📦 FASE 3B - DRAG & DROP (SortableCard + Container)

### ✅ Testes de Drag Handle (5 testes)

#### Teste 3B.1: Drag Handle Visível
- **Objetivo:** Verificar handle à esquerda
- **Passos:**
  1. Ativar modo de edição
  2. Passar mouse sobre card
- **Resultado Esperado:** 
  - Handle aparece à esquerda (-8px)
  - Ícone GripVertical visível
  - Cursor `grab`
- **Prioridade:** 🔴 Alta

#### Teste 3B.2: Drag Funcional
- **Objetivo:** Testar arraste de card
- **Passos:**
  1. Clicar no handle
  2. Arrastar card horizontalmente
  3. Soltar sobre outro card
- **Resultado Esperado:** 
  - Card segue mouse
  - Overlay aparece em posição válida
  - Cursor muda para `grabbing`
- **Prioridade:** 🔴 Alta

#### Teste 3B.3: Drop e Reordenação
- **Objetivo:** Verificar mudança de ordem
- **Passos:**
  1. Arrastar Card A sobre Card B
  2. Soltar
  3. Verificar nova ordem
- **Resultado Esperado:** Cards trocam de posição
- **Prioridade:** 🔴 Alta

#### Teste 3B.4: Drag Cancelado
- **Objetivo:** Testar cancelamento (ESC)
- **Passos:**
  1. Iniciar drag
  2. Pressionar ESC
- **Resultado Esperado:** Card volta à posição original
- **Prioridade:** 🟢 Baixa

#### Teste 3B.5: Handle Oculto Fora Edit Mode
- **Objetivo:** Verificar ocultação do handle
- **Passos:**
  1. Desativar modo de edição
  2. Passar mouse sobre card
- **Resultado Esperado:** Handle não aparece
- **Prioridade:** 🟡 Média

### ✅ Testes de Container DnD (6 testes)

#### Teste 3B.6: Contexto DnD Ativo
- **Objetivo:** Verificar contexto @dnd-kit
- **Passos:**
  1. Ativar modo de edição
  2. Tentar arrastar card
- **Resultado Esperado:** Drag funciona (contexto OK)
- **Prioridade:** 🔴 Alta

#### Teste 3B.7: Reordenação Horizontal
- **Objetivo:** Testar estratégia horizontal
- **Passos:**
  1. Arrastar card para direita/esquerda
  2. Verificar preview de posição
- **Resultado Esperado:** Overlay horizontal aparece corretamente
- **Prioridade:** 🟡 Média

#### Teste 3B.8: Callback onReorder
- **Objetivo:** Verificar evento de reordenação
- **Passos:**
  1. Arrastar e soltar card
  2. Verificar console/localStorage
- **Resultado Esperado:** 
  - `onReorder` chamado com nova ordem
  - Toast "Ordem atualizada!"
- **Prioridade:** 🔴 Alta

#### Teste 3B.9: Múltiplas Seções
- **Objetivo:** Testar isolamento entre seções
- **Passos:**
  1. Tentar arrastar card da Seção A para Seção B
- **Resultado Esperado:** Drag não permite drop entre seções
- **Prioridade:** 🟡 Média

#### Teste 3B.10: Colisão de Sensores
- **Objetivo:** Verificar detecção de overlap
- **Passos:**
  1. Arrastar card sobre múltiplos cards
  2. Observar overlays
- **Resultado Esperado:** Apenas um overlay por vez (closest corner)
- **Prioridade:** 🟢 Baixa

#### Teste 3B.11: Performance com Muitos Cards
- **Objetivo:** Testar com +10 cards
- **Passos:**
  1. Adicionar 15+ cards à seção
  2. Arrastar cards
- **Resultado Esperado:** Sem lag perceptível (<100ms)
- **Prioridade:** 🟢 Baixa

---

## 📦 FASE 3C - PERSISTÊNCIA (useDashboardLayout)

### ✅ Testes de Carregamento (5 testes)

#### Teste 3C.1: Primeira Carga (Sem Dados)
- **Objetivo:** Verificar layout padrão
- **Passos:**
  1. Limpar banco e localStorage
  2. Acessar `/dashboard-example`
- **Resultado Esperado:** 
  - Layout padrão carregado
  - Larguras/ordens default
- **Prioridade:** 🔴 Alta

#### Teste 3C.2: Carga do Supabase
- **Objetivo:** Verificar prioridade Supabase
- **Passos:**
  1. Salvar layout no banco
  2. Limpar localStorage
  3. Recarregar página
- **Resultado Esperado:** Layout do Supabase aplicado
- **Prioridade:** 🔴 Alta

#### Teste 3C.3: Merge localStorage + Supabase
- **Objetivo:** Testar precedência localStorage
- **Passos:**
  1. Ter layout salvo no Supabase
  2. Modificar apenas localStorage
  3. Recarregar
- **Resultado Esperado:** localStorage sobrescreve Supabase
- **Prioridade:** 🟡 Média

#### Teste 3C.4: Loading State
- **Objetivo:** Verificar skeleton durante carga
- **Passos:**
  1. Acessar página
  2. Observar estado inicial
- **Resultado Esperado:** 
  - Skeleton animado
  - Texto "Carregando dashboard..."
- **Prioridade:** 🟢 Baixa

#### Teste 3C.5: Erro de Carregamento
- **Objetivo:** Testar fallback para erro
- **Passos:**
  1. Simular erro no Supabase (desconectar)
  2. Tentar carregar
- **Resultado Esperado:** 
  - Layout padrão carregado
  - Toast de erro (opcional)
- **Prioridade:** 🟡 Média

### ✅ Testes de Auto-Save (5 testes)

#### Teste 3C.6: Debounce de 2 Segundos
- **Objetivo:** Verificar delay de auto-save
- **Passos:**
  1. Redimensionar card
  2. Aguardar <2s
  3. Verificar banco
- **Resultado Esperado:** Ainda não salvou (debounce ativo)
- **Prioridade:** 🟡 Média

#### Teste 3C.7: Auto-Save Após Debounce
- **Objetivo:** Verificar salvamento automático
- **Passos:**
  1. Redimensionar card
  2. Aguardar >2s
  3. Verificar banco
- **Resultado Esperado:** 
  - Layout salvo no Supabase
  - `isModified = false`
- **Prioridade:** 🔴 Alta

#### Teste 3C.8: Múltiplas Mudanças Rápidas
- **Objetivo:** Testar debounce com mudanças contínuas
- **Passos:**
  1. Redimensionar 3 cards em <2s
  2. Aguardar >2s
- **Resultado Esperado:** Apenas 1 salvamento (último estado)
- **Prioridade:** 🟡 Média

#### Teste 3C.9: Indicador "Salvando..."
- **Objetivo:** Verificar feedback visual
- **Passos:**
  1. Fazer mudança
  2. Aguardar auto-save
  3. Observar header
- **Resultado Esperado:** 
  - "Mudanças não salvas" (amarelo) → "Salvando..." (loader) → "Layout salvo" (verde)
- **Prioridade:** 🟢 Baixa

#### Teste 3C.10: Cancelar Auto-Save
- **Objetivo:** Testar saída antes do save
- **Passos:**
  1. Redimensionar card
  2. Clicar "Cancelar" antes de 2s
- **Resultado Esperado:** 
  - Mudanças descartadas
  - Banco não atualizado
- **Prioridade:** 🟡 Média

### ✅ Testes de Salvamento Manual (4 testes)

#### Teste 3C.11: Botão "Salvar" Ativo
- **Objetivo:** Verificar estado do botão
- **Passos:**
  1. Fazer mudança
  2. Verificar botão "Salvar"
- **Resultado Esperado:** 
  - Botão habilitado
  - `isModified = true`
- **Prioridade:** 🟡 Média

#### Teste 3C.12: Salvamento Imediato
- **Objetivo:** Testar save manual
- **Passos:**
  1. Redimensionar card
  2. Clicar "Salvar" (<2s)
- **Resultado Esperado:** 
  - Layout salvo imediatamente
  - Edit mode desativado
  - Toast "Layout salvo com sucesso!"
- **Prioridade:** 🔴 Alta

#### Teste 3C.13: Versionamento
- **Objetivo:** Verificar incremento de versão
- **Passos:**
  1. Salvar layout (versão 1)
  2. Modificar e salvar novamente (versão 2)
- **Resultado Esperado:** Coluna `version` incrementa
- **Prioridade:** 🟢 Baixa

#### Teste 3C.14: Botão Desabilitado Sem Mudanças
- **Objetivo:** Verificar estado sem modificações
- **Passos:**
  1. Abrir edit mode sem mudanças
  2. Verificar botão "Salvar"
- **Resultado Esperado:** Botão desabilitado
- **Prioridade:** 🟢 Baixa

### ✅ Testes de Reset (3 testes)

#### Teste 3C.15: Dialog de Confirmação
- **Objetivo:** Verificar aviso de reset
- **Passos:**
  1. Clicar "Resetar"
  2. Verificar modal
- **Resultado Esperado:** 
  - AlertDialog aparece
  - Mensagem clara sobre perda de customizações
- **Prioridade:** 🟡 Média

#### Teste 3C.16: Reset Completo
- **Objetivo:** Testar restauração ao padrão
- **Passos:**
  1. Customizar layout
  2. Confirmar reset
- **Resultado Esperado:** 
  - localStorage limpo
  - Registro Supabase deletado
  - Layout padrão restaurado
  - Página recarrega
- **Prioridade:** 🔴 Alta

#### Teste 3C.17: Cancelar Reset
- **Objetivo:** Verificar cancelamento
- **Passos:**
  1. Clicar "Resetar"
  2. Clicar "Cancelar" no dialog
- **Resultado Esperado:** 
  - Dialog fecha
  - Nenhuma mudança aplicada
- **Prioridade:** 🟢 Baixa

---

## 📦 FASE 3D - INTEGRAÇÃO COMPLETA (DashboardExample)

### ✅ Testes de UI (6 testes)

#### Teste 3D.1: Header Completo
- **Objetivo:** Verificar elementos do header
- **Passos:**
  1. Acessar `/dashboard-example`
  2. Verificar header
- **Resultado Esperado:** 
  - Título "Dashboard Customizável"
  - Descrição
  - Indicador de status
  - Botão "Editar Layout"
- **Prioridade:** 🟡 Média

#### Teste 3D.2: Instruções Edit Mode
- **Objetivo:** Verificar card de instruções
- **Passos:**
  1. Ativar modo de edição
- **Resultado Esperado:** 
  - Card com fundo primário aparece
  - Ícone Sparkles pulsando
  - 3 instruções claras (arraste, redimensione, auto-save)
- **Prioridade:** 🟢 Baixa

#### Teste 3D.3: Controles Edit Mode
- **Objetivo:** Verificar botões em edit mode
- **Passos:**
  1. Ativar edit mode
  2. Verificar header
- **Resultado Esperado:** 
  - Botão "Salvar" visível
  - Botão "Cancelar" visível
  - Botão "Resetar" visível
  - Botão "Editar Layout" oculto
- **Prioridade:** 🟡 Média

#### Teste 3D.4: Collapse de Seções
- **Objetivo:** Testar recolhimento de seções
- **Passos:**
  1. Clicar no título da seção
  2. Verificar animação
- **Resultado Esperado:** 
  - Seção colapsa com animação suave
  - Ícone chevron muda (up/down)
  - Cards ocultos
- **Prioridade:** 🟡 Média

#### Teste 3D.5: Badge de Contagem
- **Objetivo:** Verificar contador de cards
- **Passos:**
  1. Verificar header de cada seção
- **Resultado Esperado:** 
  - Badge mostra número correto
  - Texto "X cards" ou "X card" (singular)
- **Prioridade:** 🟢 Baixa

#### Teste 3D.6: Toast de Feedback
- **Objetivo:** Verificar notificações
- **Passos:**
  1. Reordenar card
  2. Salvar layout
  3. Resetar layout
- **Resultado Esperado:** 
  - Toast "Ordem atualizada!" (reorder)
  - Toast "Layout salvo com sucesso!" (save)
  - Toast "Layout restaurado para o padrão!" (reset)
- **Prioridade:** 🟢 Baixa

### ✅ Testes de Renderização de Cards (5 testes)

#### Teste 3D.7: Cards do Registry
- **Objetivo:** Verificar renderização de 30+ cards
- **Passos:**
  1. Verificar todas as seções
  2. Contar cards renderizados
- **Resultado Esperado:** 
  - Todos os 30+ cards aparecem
  - Títulos corretos
  - Conteúdo mock visível
- **Prioridade:** 🔴 Alta

#### Teste 3D.8: Cards por Seção
- **Objetivo:** Verificar distribuição correta
- **Passos:**
  1. Verificar cards de cada seção
- **Resultado Esperado:** Cards aparecem nas seções corretas conforme `defaultSectionsDashboard`
- **Prioridade:** 🟡 Média

#### Teste 3D.9: Card Inexistente
- **Objetivo:** Testar fallback de card
- **Passos:**
  1. Adicionar cardId inválido no layout
  2. Verificar renderização
- **Resultado Esperado:** Card de erro ou nada renderizado (sem crash)
- **Prioridade:** 🟢 Baixa

#### Teste 3D.10: Estado Vazio (Seção)
- **Objetivo:** Verificar seção sem cards
- **Passos:**
  1. Remover todos os cards de uma seção
- **Resultado Esperado:** 
  - Mensagem "Nenhum card disponível"
  - Ícone AlertCircle
  - Estado vazio estilizado
- **Prioridade:** 🟡 Média

#### Teste 3D.11: Responsividade
- **Objetivo:** Testar layout responsivo
- **Passos:**
  1. Redimensionar viewport (mobile, tablet, desktop)
- **Resultado Esperado:** 
  - Cards se ajustam (flex-wrap)
  - Layout continua funcional
- **Prioridade:** 🟡 Média

### ✅ Testes de Integração (5 testes)

#### Teste 3D.12: Resize + Reorder
- **Objetivo:** Testar combinação de operações
- **Passos:**
  1. Redimensionar Card A
  2. Reordenar Card B
  3. Salvar
- **Resultado Esperado:** 
  - Ambas customizações salvas
  - Persistidas corretamente
- **Prioridade:** 🔴 Alta

#### Teste 3D.13: Edit → Cancel
- **Objetivo:** Verificar descarte de mudanças
- **Passos:**
  1. Fazer mudanças
  2. Clicar "Cancelar"
  3. Confirmar no alert
- **Resultado Esperado:** 
  - Página recarrega
  - Mudanças descartadas
- **Prioridade:** 🟡 Média

#### Teste 3D.14: Edit → Save → Reload
- **Objetivo:** Testar fluxo completo
- **Passos:**
  1. Customizar layout
  2. Salvar
  3. Recarregar página
- **Resultado Esperado:** 
  - Customizações mantidas
  - Layout restaurado corretamente
- **Prioridade:** 🔴 Alta

#### Teste 3D.15: Mudanças Sem Salvar + Sair
- **Objetivo:** Verificar aviso de saída
- **Passos:**
  1. Fazer mudanças
  2. Tentar sair do edit mode
- **Resultado Esperado:** 
  - Confirm dialog aparece
  - Mensagem "Você tem mudanças não salvas"
- **Prioridade:** 🟡 Média

#### Teste 3D.16: Indicador de Mudanças Não Salvas
- **Objetivo:** Verificar toast flutuante
- **Passos:**
  1. Fazer mudanças
  2. Aguardar >2s sem salvar manualmente
- **Resultado Esperado:** 
  - Card amarelo no canto inferior direito
  - Mensagem "Você tem mudanças não salvas"
  - Ícone AlertCircle pulsando
- **Prioridade:** 🟢 Baixa

---

## 📦 FASE 3E - POLIMENTO VISUAL (Animações e Feedback)

### ✅ Testes de Animações (10 testes)

#### Teste 3E.1: Fade-in da Página
- **Objetivo:** Verificar entrada suave
- **Passos:**
  1. Acessar `/dashboard-example`
  2. Observar animação inicial
- **Resultado Esperado:** Página aparece com `animate-fade-in` (0.3s)
- **Prioridade:** 🟢 Baixa

#### Teste 3E.2: Skeleton Loading Animado
- **Objetivo:** Verificar animação de carregamento
- **Passos:**
  1. Acessar página com carga lenta
  2. Observar skeletons
- **Resultado Esperado:** 
  - Skeletons pulsam suavemente
  - Fade-in ao aparecer
- **Prioridade:** 🟢 Baixa

#### Teste 3E.3: Accordion de Seções
- **Objetivo:** Testar animação collapse/expand
- **Passos:**
  1. Clicar para colapsar seção
  2. Clicar para expandir
- **Resultado Esperado:** 
  - `animate-accordion-up` (collapse)
  - `animate-accordion-down` (expand)
  - Duração: 0.2s ease-out
- **Prioridade:** 🟡 Média

#### Teste 3E.4: Hover em Títulos de Seção
- **Objetivo:** Verificar micro-interações
- **Passos:**
  1. Passar mouse sobre título da seção
- **Resultado Esperado:** 
  - Título muda para cor primária
  - Chevron escala 110%
  - Transição suave (200ms)
- **Prioridade:** 🟢 Baixa

#### Teste 3E.5: Scale do Drag Handle
- **Objetivo:** Verificar hover no handle
- **Passos:**
  1. Ativar edit mode
  2. Passar mouse sobre handle de drag
- **Resultado Esperado:** 
  - Handle escala 110%
  - Bg muda para `primary/20`
  - Ícone escala também
- **Prioridade:** 🟢 Baixa

#### Teste 3E.6: Animação de Drag (Card)
- **Objetivo:** Verificar efeitos durante arraste
- **Passos:**
  1. Arrastar card
  2. Observar transformações
- **Resultado Esperado:** 
  - Opacidade 40%
  - Escala 105%
  - Rotação 2°
  - Sombra blur-xl
- **Prioridade:** 🟡 Média

#### Teste 3E.7: Animação de Resize
- **Objetivo:** Verificar feedback de resize
- **Passos:**
  1. Iniciar resize de card
  2. Observar transformações
- **Resultado Esperado:** 
  - Escala 102%
  - Ring primário
  - Shadow-xl
  - Handle anima (pulse)
- **Prioridade:** 🟡 Média

#### Teste 3E.8: Badge "Personalizado"
- **Objetivo:** Verificar badge de customização
- **Passos:**
  1. Redimensionar card
  2. Sair do edit mode
- **Resultado Esperado:** 
  - Badge aparece com `animate-fade-in`
  - Ícone Sparkles
  - Texto "Personalizado"
  - Canto superior direito
- **Prioridade:** 🟡 Média

#### Teste 3E.9: Slide-in do Toast de Mudanças
- **Objetivo:** Verificar animação do alerta
- **Passos:**
  1. Fazer mudanças sem salvar
  2. Observar toast flutuante
- **Resultado Esperado:** 
  - `animate-slide-in-right`
  - Ícone AlertCircle pulsa
  - Backdrop blur
- **Prioridade:** 🟢 Baixa

#### Teste 3E.10: Scale-in das Instruções
- **Objetivo:** Verificar animação do card de instruções
- **Passos:**
  1. Ativar edit mode
- **Resultado Esperado:** 
  - Card aparece com `animate-scale-in`
  - Ícone Sparkles pulsa
- **Prioridade:** 🟢 Baixa

### ✅ Testes de Feedback Visual (8 testes)

#### Teste 3E.11: Indicador de Status (Header)
- **Objetivo:** Verificar indicador dinâmico
- **Passos:**
  1. Estado inicial
  2. Fazer mudança
  3. Aguardar auto-save
- **Resultado Esperado:** 
  - "Layout salvo" (verde) → "Mudanças não salvas" (amarelo) → "Salvando..." (loader) → "Layout salvo" (verde)
- **Prioridade:** 🟡 Média

#### Teste 3E.12: Ring de Edit Mode (Card)
- **Objetivo:** Verificar borda em edit mode
- **Passos:**
  1. Ativar edit mode
  2. Passar mouse sobre card
- **Resultado Esperado:** 
  - Ring primário 2px (20% opacity)
  - Hover: 40% opacity + shadow-lg
- **Prioridade:** 🟢 Baixa

#### Teste 3E.13: Overlay de Drop
- **Objetivo:** Verificar indicador de posição
- **Passos:**
  1. Arrastar card sobre outro
- **Resultado Esperado:** 
  - Overlay com border dashed primário
  - Bg primário/10
  - Animate pulse
- **Prioridade:** 🟡 Média

#### Teste 3E.14: Grip Icon Animado (Resize)
- **Objetivo:** Verificar ícone durante resize
- **Passos:**
  1. Iniciar resize
- **Resultado Esperado:** 
  - GripVertical aparece
  - Escala 125% durante resize
  - Handle altura 100% + pulse
- **Prioridade:** 🟢 Baixa

#### Teste 3E.15: Cursor Changes
- **Objetivo:** Verificar mudanças de cursor
- **Passos:**
  1. Hover em handle de drag
  2. Hover em alça de resize
  3. Durante drag
  4. Durante resize
- **Resultado Esperado:** 
  - Drag: `grab` → `grabbing`
  - Resize: `ew-resize`
- **Prioridade:** 🟢 Baixa

#### Teste 3E.16: Estado Vazio (Feedback)
- **Objetivo:** Verificar mensagem de seção vazia
- **Passos:**
  1. Acessar seção sem cards
- **Resultado Esperado:** 
  - Ícone AlertCircle em bg muted
  - Mensagem "Nenhum card disponível"
  - Centralizado com padding
- **Prioridade:** 🟢 Baixa

#### Teste 3E.17: Dark Mode - Cards
- **Objetivo:** Verificar estilos dark mode
- **Passos:**
  1. Ativar dark mode
  2. Verificar cards
- **Resultado Esperado:** 
  - Bg card: `hsl(80 12% 15%)`
  - Texto: `hsl(40 10% 92%)`
  - Borders visíveis
- **Prioridade:** 🟡 Média

#### Teste 3E.18: Dark Mode - Toasts
- **Objetivo:** Verificar toasts em dark mode
- **Passos:**
  1. Ativar dark mode
  2. Fazer mudanças sem salvar
- **Resultado Esperado:** 
  - Toast amarelo: `yellow-900/20` bg
  - Texto: `yellow-200`
  - Border: `yellow-800`
- **Prioridade:** 🟢 Baixa

### ✅ Testes de Performance (5 testes)

#### Teste 3E.19: FPS Durante Animações
- **Objetivo:** Verificar suavidade
- **Passos:**
  1. Abrir DevTools (Performance)
  2. Colapsar/expandir seções
  3. Verificar FPS
- **Resultado Esperado:** Manter 60 FPS
- **Prioridade:** 🟢 Baixa

#### Teste 3E.20: Tempo de Animação
- **Objetivo:** Verificar duração das animações
- **Passos:**
  1. Medir tempo de fade-in
  2. Medir tempo de accordion
  3. Medir tempo de scale
- **Resultado Esperado:** 
  - Fade: 300ms
  - Accordion: 200ms
  - Scale: 200ms
  - Transitions: 200-300ms
- **Prioridade:** 🟢 Baixa

#### Teste 3E.21: Reflow/Repaint
- **Objetivo:** Minimizar reflows
- **Passos:**
  1. Monitorar Layout Shifts (DevTools)
  2. Redimensionar e reordenar cards
- **Resultado Esperado:** CLS < 0.1 (Cumulative Layout Shift)
- **Prioridade:** 🟢 Baixa

#### Teste 3E.22: Memory Leaks (Animações)
- **Objetivo:** Verificar limpeza
- **Passos:**
  1. Abrir/fechar edit mode 10x
  2. Monitorar memória (DevTools)
- **Resultado Esperado:** Memória estável (sem crescimento)
- **Prioridade:** 🟢 Baixa

#### Teste 3E.23: Bundle Size (Animações)
- **Objetivo:** Verificar impacto no bundle
- **Passos:**
  1. Analisar bundle com Vite
  2. Verificar tamanho de `index.css`
- **Resultado Esperado:** 
  - Aumento < 5KB
  - CSS animations no chunk principal
- **Prioridade:** 🟢 Baixa

---

## 🧪 TESTES DE INTEGRAÇÃO CROSS-FASE (15 testes)

### ✅ Fluxo Completo (5 testes)

#### Teste INT.1: Fluxo Ideal Completo
- **Objetivo:** Testar jornada completa do usuário
- **Passos:**
  1. Acessar `/dashboard-example` (primeira vez)
  2. Ativar edit mode
  3. Redimensionar 2 cards
  4. Reordenar 2 cards
  5. Aguardar auto-save
  6. Recarregar página
  7. Verificar persistência
- **Resultado Esperado:** Todas as customizações mantidas
- **Prioridade:** 🔴 Alta

#### Teste INT.2: Edit → Save Manual → Reload
- **Objetivo:** Testar salvamento manual
- **Passos:**
  1. Customizar layout
  2. Salvar manualmente (<2s)
  3. Recarregar
- **Resultado Esperado:** Layout restaurado corretamente
- **Prioridade:** 🔴 Alta

#### Teste INT.3: Edit → Cancel → Verify
- **Objetivo:** Testar descarte de mudanças
- **Passos:**
  1. Customizar layout
  2. Cancelar
  3. Verificar banco/localStorage
- **Resultado Esperado:** 
  - Nenhuma mudança salva
  - Layout original mantido
- **Prioridade:** 🟡 Média

#### Teste INT.4: Reset → Customize → Save
- **Objetivo:** Testar re-customização após reset
- **Passos:**
  1. Resetar layout
  2. Customizar novamente
  3. Salvar
- **Resultado Esperado:** Novo layout salvo corretamente
- **Prioridade:** 🟡 Média

#### Teste INT.5: Fluxo com Erros (Supabase Offline)
- **Objetivo:** Testar resiliência
- **Passos:**
  1. Desconectar Supabase
  2. Customizar layout
  3. Tentar salvar
  4. Reconectar
  5. Tentar novamente
- **Resultado Esperado:** 
  - Fallback para localStorage
  - Sincroniza ao reconectar
- **Prioridade:** 🟡 Média

### ✅ Multi-usuário (3 testes)

#### Teste INT.6: Usuário A e B (Isolamento)
- **Objetivo:** Verificar isolamento de layouts
- **Passos:**
  1. Usuário A customiza layout
  2. Usuário B acessa mesma página
- **Resultado Esperado:** Cada usuário vê seu próprio layout
- **Prioridade:** 🟡 Média

#### Teste INT.7: Sessão Dupla (Mesmo Usuário)
- **Objetivo:** Testar conflitos de sincronização
- **Passos:**
  1. Abrir 2 abas como mesmo usuário
  2. Customizar na Aba 1
  3. Recarregar Aba 2
- **Resultado Esperado:** Aba 2 carrega customizações da Aba 1
- **Prioridade:** 🟢 Baixa

#### Teste INT.8: Concurrent Edits
- **Objetivo:** Testar edição simultânea
- **Passos:**
  1. Aba 1: Salvar layout X
  2. Aba 2: Salvar layout Y (logo em seguida)
- **Resultado Esperado:** Última gravação vence (layout Y)
- **Prioridade:** 🟢 Baixa

### ✅ Edge Cases (7 testes)

#### Teste INT.9: Layout Corrompido (localStorage)
- **Objetivo:** Testar recuperação de erro
- **Passos:**
  1. Injetar JSON inválido no localStorage
  2. Recarregar página
- **Resultado Esperado:** 
  - Fallback para layout padrão
  - localStorage limpo
- **Prioridade:** 🟡 Média

#### Teste INT.10: Layout Corrompido (Supabase)
- **Objetivo:** Testar validação de dados
- **Passos:**
  1. Injetar layout_config inválido no banco
  2. Tentar carregar
- **Resultado Esperado:** 
  - Fallback para layout padrão
  - Erro logado (console)
- **Prioridade:** 🟡 Média

#### Teste INT.11: Card Inexistente no Registry
- **Objetivo:** Testar fallback de card
- **Passos:**
  1. Adicionar cardId "nao-existe" no layout
  2. Recarregar
- **Resultado Esperado:** Card não renderiza (sem crash)
- **Prioridade:** 🟢 Baixa

#### Teste INT.12: Seção Inexistente
- **Objetivo:** Testar seção inválida
- **Passos:**
  1. Adicionar sectionId "nao-existe" no layout
  2. Recarregar
- **Resultado Esperado:** Seção não renderiza (sem crash)
- **Prioridade:** 🟢 Baixa

#### Teste INT.13: Layout Vazio
- **Objetivo:** Testar sem nenhum card
- **Passos:**
  1. Remover todos os cards do layout
  2. Verificar UI
- **Resultado Esperado:** 
  - Mensagens de estado vazio
  - Sem erro
- **Prioridade:** 🟢 Baixa

#### Teste INT.14: Largura Extrema (10000px)
- **Objetivo:** Testar validação de limites
- **Passos:**
  1. Injetar width=10000 no localStorage
  2. Recarregar
- **Resultado Esperado:** Largura limitada ao maxWidth (800px)
- **Prioridade:** 🟢 Baixa

#### Teste INT.15: Ordem Inválida (Índices Duplicados)
- **Objetivo:** Testar normalização de ordem
- **Passos:**
  1. Injetar ordem com índices duplicados
  2. Recarregar
- **Resultado Esperado:** Ordem normalizada automaticamente
- **Prioridade:** 🟢 Baixa

---

## 🎨 TESTES DE ACESSIBILIDADE (5 testes)

### ✅ Navegação por Teclado (2 testes)

#### Teste A11Y.1: Tab Navigation
- **Objetivo:** Verificar ordem de foco
- **Passos:**
  1. Usar TAB para navegar
  2. Verificar ordem lógica
- **Resultado Esperado:** 
  - Botões do header acessíveis
  - Cards focáveis
  - Ordem lógica (top→bottom, left→right)
- **Prioridade:** 🟡 Média

#### Teste A11Y.2: Keyboard Drag (ESC)
- **Objetivo:** Verificar cancelamento por teclado
- **Passos:**
  1. Iniciar drag com teclado
  2. Pressionar ESC
- **Resultado Esperado:** Drag cancelado
- **Prioridade:** 🟢 Baixa

### ✅ Screen Readers (2 testes)

#### Teste A11Y.3: ARIA Labels
- **Objetivo:** Verificar labels acessíveis
- **Passos:**
  1. Verificar atributos `title` nos handles
  2. Verificar `aria-label` nos botões
- **Resultado Esperado:** 
  - Drag handle: "Arrastar para reordenar"
  - Resize handle: "Arrastar para redimensionar"
  - Botões: labels descritivos
- **Prioridade:** 🟢 Baixa

#### Teste A11Y.4: Screen Reader Announcements
- **Objetivo:** Verificar feedbacks audíveis
- **Passos:**
  1. Usar NVDA/JAWS
  2. Reordenar card
  3. Salvar layout
- **Resultado Esperado:** 
  - Toast lido corretamente
  - Mudanças anunciadas
- **Prioridade:** 🟢 Baixa

### ✅ Contraste (1 teste)

#### Teste A11Y.5: Color Contrast (WCAG AA)
- **Objetivo:** Verificar contraste mínimo
- **Passos:**
  1. Usar ferramenta de contraste
  2. Verificar texto sobre backgrounds
- **Resultado Esperado:** 
  - Contraste ≥ 4.5:1 (texto normal)
  - Contraste ≥ 3:1 (texto grande)
- **Prioridade:** 🟡 Média

---

## 📊 MÉTRICAS DE SUCESSO

### Critérios de Aprovação
- **Testes Críticos (🔴):** 100% passar (0 falhas)
- **Testes Médios (🟡):** ≥90% passar (máx 3 falhas)
- **Testes Baixos (🟢):** ≥80% passar (máx 6 falhas)

### Performance Targets
- **First Load:** <2s
- **Auto-save:** <500ms
- **Animações:** 60 FPS constante
- **Memory:** <50MB adicional

### Cobertura de Código (Opcional)
- **Hooks:** 90%+
- **Componentes:** 85%+
- **Utils:** 95%+

---

## 🗂️ ORGANIZAÇÃO DOS TESTES

### Por Prioridade
- **🔴 Alta (Críticos):** 18 testes - EXECUTAR PRIMEIRO
- **🟡 Média:** 39 testes - EXECUTAR DEPOIS
- **🟢 Baixa:** 38 testes - EXECUTAR SE TEMPO PERMITIR

### Por Fase
- **FASE 3A (Resize):** 10 testes
- **FASE 3B (Drag & Drop):** 11 testes
- **FASE 3C (Persistência):** 17 testes
- **FASE 3D (Integração):** 16 testes
- **FASE 3E (Polimento):** 23 testes
- **Integração Cross-Fase:** 15 testes
- **Acessibilidade:** 5 testes

### Por Tipo
- **Funcionais:** 52 testes
- **Integração:** 20 testes
- **Performance:** 8 testes
- **UI/UX:** 10 testes
- **Acessibilidade:** 5 testes

---

## ✅ EXECUÇÃO RECOMENDADA

### Fase 1: Testes Críticos (Dia 1)
1. Todos os testes 🔴 (18 testes)
2. Corrigir bugs críticos imediatamente

### Fase 2: Testes Médios (Dia 2)
1. Testes 🟡 de funcionalidade (25 testes)
2. Testes 🟡 de integração (14 testes)

### Fase 3: Testes Baixos (Dia 3)
1. Testes 🟢 de animações/UI (20 testes)
2. Testes 🟢 de edge cases (18 testes)

### Fase 4: Acessibilidade (Dia 4)
1. Todos os testes A11Y (5 testes)
2. Ajustes finais

---

## 📝 TEMPLATE DE RELATÓRIO DE TESTE

```markdown
### Teste [ID]: [Nome]
**Executado em:** [Data]
**Executado por:** [Nome]
**Status:** ✅ PASSOU | ❌ FALHOU | ⚠️ PARCIAL

**Resultado Observado:**
[Descrever o que aconteceu]

**Evidências:**
- Screenshot: [link]
- Console log: [texto]
- Vídeo: [link]

**Bugs Encontrados:**
- [Descrição do bug]
- [Prioridade]
- [ID do ticket]

**Observações:**
[Notas adicionais]
```

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **FASE 3E Completa** - Polimento visual implementado
2. 📋 **Este Checklist Criado** - 95 testes documentados
3. 🧪 **Aguardando Execução** - Testes a serem realizados pelo usuário
4. 🐛 **Ciclo de Correções** - Bugs serão corrigidos conforme encontrados
5. 🚀 **Aprovação Final** - Sistema pronto para produção

---

**FIM DO CHECKLIST DE TESTES - FASE 3 COMPLETA (3A→3E)**
