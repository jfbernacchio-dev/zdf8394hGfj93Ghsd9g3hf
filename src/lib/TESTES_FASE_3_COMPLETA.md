# TESTES FASE 3 - Layout Customizável (Completa)

## Visão Geral

Este documento compila TODOS os testes necessários para validar as FASES 3A, 3B, 3C e 3D do sistema de layout customizável.

**Status:** Para execução ao final de todas as fases

---

## FASE 3A - Resize Horizontal

### T3A-001: Resize básico funciona
- [ ] Clicar em "Editar Layout"
- [ ] Hover no card → resize handle aparece à direita
- [ ] Arrastar resize handle → card aumenta/diminui largura
- [ ] Indicador de pixels aparece durante resize
- [ ] ✅ Card redimensiona suavemente

### T3A-002: Limites min/max respeitados
- [ ] Tentar redimensionar card muito pequeno
- [ ] ✅ Width não fica menor que `minWidth` (280px para métricas)
- [ ] Tentar redimensionar card muito grande
- [ ] ✅ Width não fica maior que `maxWidth` (800px para métricas)

### T3A-003: Persistência no localStorage
- [ ] Redimensionar um card para 450px
- [ ] Clicar "Salvar"
- [ ] Recarregar página (F5)
- [ ] ✅ Card mantém 450px de largura

### T3A-004: Diferentes seções têm diferentes limites
- [ ] Redimensionar card em 'dashboard-financial' (max 800px)
- [ ] Redimensionar card em 'dashboard-charts' (max 1000px)
- [ ] ✅ Limites são respeitados por seção

### T3A-005: Resize não afeta ordem
- [ ] Redimensionar card 1 para 600px
- [ ] ✅ Ordem dos cards permanece inalterada

---

## FASE 3B - Drag & Drop

### T3B-001: Drag básico funciona
- [ ] Clicar em "Editar Layout"
- [ ] Hover no card → drag handle aparece à esquerda
- [ ] Arrastar card para nova posição
- [ ] ✅ Card se move para nova posição
- [ ] Toast: "Ordem atualizada! Salvando automaticamente..."

### T3B-002: Drag restrito à seção
- [ ] Tentar arrastar card de 'dashboard-financial'
- [ ] Tentar soltar em 'dashboard-administrative'
- [ ] ✅ Drop não é permitido
- [ ] ✅ Card volta para seção original

### T3B-003: Preview durante drag
- [ ] Iniciar drag de um card
- [ ] ✅ Card original fica semitransparente (opacity-50)
- [ ] ✅ DragOverlay mostra preview do card
- [ ] ✅ Drop zone mostra highlight (ring-2 ring-primary)

### T3B-004: Keyboard navigation
- [ ] Dar focus em um card (Tab)
- [ ] Pressionar Space para "pegar"
- [ ] Usar Arrow Down para mover
- [ ] Pressionar Space para "soltar"
- [ ] ✅ Card se move usando apenas teclado

### T3B-005: Cancelar drag com ESC
- [ ] Iniciar drag de um card
- [ ] Pressionar ESC
- [ ] ✅ Drag cancela
- [ ] ✅ Card volta para posição original

### T3B-006: Persistência da ordem
- [ ] Reordenar cards: [card-1, card-2, card-3] → [card-2, card-1, card-3]
- [ ] Clicar "Salvar"
- [ ] Recarregar página (F5)
- [ ] ✅ Ordem permanece: [card-2, card-1, card-3]

### T3B-007: Drag handle só aparece em edit mode
- [ ] Ver dashboard em modo normal
- [ ] ✅ Drag handle NÃO está visível
- [ ] Clicar "Editar Layout"
- [ ] Hover no card
- [ ] ✅ Drag handle aparece

---

## FASE 3C - Persistência

### T3C-001: Load do Supabase ao montar
- [ ] Limpar localStorage e cookies
- [ ] Fazer login
- [ ] Acessar /dashboard-example
- [ ] ✅ Layout carrega do Supabase (se existir record)
- [ ] ✅ Se não existir, usa DEFAULT_DASHBOARD_EXAMPLE_LAYOUT

### T3C-002: Merge com localStorage
- [ ] Ter layout salvo no Supabase: card-1 width=300
- [ ] Ter no localStorage: card-1 width=400
- [ ] Carregar dashboard
- [ ] ✅ Card usa width=400 (localStorage vence)

### T3C-003: Auto-save após 2s
- [ ] Redimensionar um card
- [ ] Aguardar 3 segundos SEM clicar em salvar
- [ ] Verificar console: "Auto-salvando após inatividade..."
- [ ] Verificar Supabase: record foi atualizado
- [ ] ✅ Auto-save funcionou

### T3C-004: Save manual
- [ ] Fazer mudanças (resize/reorder)
- [ ] Clicar "Salvar" imediatamente (antes de 2s)
- [ ] Toast: "Layout salvo com sucesso!"
- [ ] Verificar Supabase: record foi atualizado
- [ ] ✅ Save manual funcionou

### T3C-005: Reset completo
- [ ] Fazer várias mudanças (resize + reorder)
- [ ] Clicar "Resetar"
- [ ] Confirmar no dialog
- [ ] ✅ Supabase: record deletado
- [ ] ✅ localStorage: chaves `card-width-*` e `card-order-*` deletadas
- [ ] ✅ Layout volta para DEFAULT_DASHBOARD_EXAMPLE_LAYOUT
- [ ] Página recarrega automaticamente

### T3C-006: Versionamento
- [ ] Salvar layout → version = 1
- [ ] Fazer mudanças e salvar novamente
- [ ] Verificar Supabase: version = 2
- [ ] ✅ Version incrementa a cada save

### T3C-007: Detecção de mudanças
- [ ] Layout limpo (sem mudanças)
- [ ] ✅ `isModified` = false
- [ ] ✅ Status: "Layout salvo" (verde)
- [ ] Fazer uma mudança
- [ ] ✅ `isModified` = true
- [ ] ✅ Status: "Mudanças não salvas" (amarelo)
- [ ] Clicar "Salvar"
- [ ] ✅ `isModified` = false novamente

---

## FASE 3D - Integração

### T3D-001: Renderização de cards
- [ ] Carregar /dashboard-example
- [ ] Verificar seção 'dashboard-financial'
- [ ] ✅ Cards renderizam com dados mockados
- [ ] ✅ Ícones aparecem corretamente
- [ ] ✅ Valores numéricos formatados

### T3D-002: Seções colapsam
- [ ] Clicar no header da seção 'dashboard-financial'
- [ ] ✅ Seção colapsa (cards desaparecem)
- [ ] ✅ Ícone muda de ChevronUp → ChevronDown
- [ ] Clicar novamente
- [ ] ✅ Seção expande (cards reaparecem)

### T3D-003: Modo de edição
- [ ] Clicar "Editar Layout"
- [ ] ✅ Instruções aparecem no topo
- [ ] ✅ Seções ganham background `muted/20` + border dashed
- [ ] ✅ Botões mudam: Save, Cancel, Resetar
- [ ] ✅ Drag e resize handles ficam visíveis

### T3D-004: Cancelar edição
- [ ] Fazer mudanças (resize/reorder)
- [ ] Clicar "Cancelar"
- [ ] Confirmar no alert do browser
- [ ] ✅ Página recarrega
- [ ] ✅ Mudanças são descartadas

### T3D-005: Indicador de status
- [ ] Layout salvo → ✅ "Layout salvo" (verde, CheckCircle2)
- [ ] Fazer mudança → ✅ "Mudanças não salvas" (amarelo, AlertCircle)
- [ ] Auto-save inicia → ✅ "Salvando..." (Loader2 spinning)
- [ ] Save completa → ✅ Volta para "Layout salvo"

### T3D-006: Floating warning
- [ ] Fazer mudanças sem salvar
- [ ] ✅ Card amarelo aparece no canto inferior direito
- [ ] ✅ Texto: "Você tem mudanças não salvas"
- [ ] Salvar layout
- [ ] ✅ Warning desaparece

### T3D-007: Dialog de reset
- [ ] Clicar "Resetar"
- [ ] ✅ Dialog aparece com warning
- [ ] Clicar "Cancelar"
- [ ] ✅ Dialog fecha, nada acontece
- [ ] Clicar "Resetar" novamente
- [ ] Clicar "Confirmar Reset"
- [ ] ✅ Toast: "Layout restaurado para o padrão!"
- [ ] ✅ Página recarrega após 500ms

### T3D-008: Loading state
- [ ] Limpar cookies e localStorage
- [ ] Fazer login
- [ ] Acessar /dashboard-example
- [ ] ✅ Loading spinner aparece
- [ ] ✅ Texto: "Carregando dashboard..."
- [ ] Após load
- [ ] ✅ Dashboard aparece

### T3D-009: Seções vazias não renderizam
- [ ] Verificar 'dashboard-clinical' (sem cards por padrão)
- [ ] ✅ Seção NÃO renderiza
- [ ] ✅ Não há header vazio

### T3D-010: Contador de cards
- [ ] Ver header da seção 'dashboard-financial'
- [ ] ✅ Mostra "3 cards" (ou número correto)
- [ ] Quantidade muda dinamicamente com o layout

---

## TESTES DE INTEGRAÇÃO

### TI-001: Resize + Drag combinados
- [ ] Redimensionar card para 500px
- [ ] Sem salvar, arrastar card para nova posição
- [ ] ✅ Ambas as mudanças são preservadas
- [ ] Salvar
- [ ] Recarregar
- [ ] ✅ Width = 500px E ordem está correta

### TI-002: Múltiplas mudanças + auto-save
- [ ] Redimensionar card-1 → 450px
- [ ] Reordenar: [card-1, card-2] → [card-2, card-1]
- [ ] Redimensionar card-2 → 380px
- [ ] Aguardar 3 segundos
- [ ] ✅ Auto-save salva TODAS as mudanças
- [ ] Recarregar
- [ ] ✅ Todas as mudanças persistem

### TI-003: Edit → Cancel → Edit novamente
- [ ] Fazer mudanças
- [ ] Cancelar (reload)
- [ ] Entrar em edit mode novamente
- [ ] ✅ Mudanças anteriores foram descartadas
- [ ] ✅ Layout está no estado salvo

### TI-004: Reset → Edit → Mudanças
- [ ] Resetar layout
- [ ] Após reload, entrar em edit mode
- [ ] Fazer mudanças
- [ ] ✅ Mudanças são aplicadas sobre o DEFAULT

### TI-005: Collapse durante edit mode
- [ ] Entrar em edit mode
- [ ] Colapsar seção 'dashboard-financial'
- [ ] ✅ Seção colapsa normalmente
- [ ] Expandir novamente
- [ ] ✅ Cards ainda têm drag/resize handles visíveis

---

## TESTES DE PERMISSÕES

### TP-001: Cards filtrados por permissão
- [ ] Fazer login como 'subordinate' (sem financial access)
- [ ] Acessar /dashboard-example
- [ ] ✅ Seção 'dashboard-financial' NÃO aparece
- [ ] ✅ Outras seções permitidas aparecem

### TP-002: Layout filtrado carrega corretamente
- [ ] Ter layout salvo com cards financeiros
- [ ] Fazer login como subordinate
- [ ] ✅ Cards financeiros não aparecem no layout carregado
- [ ] ✅ Outros cards aparecem normalmente

---

## TESTES DE EDGE CASES

### TE-001: Card não registrado
- [ ] Adicionar cardId inválido no `DEFAULT_DASHBOARD_EXAMPLE_LAYOUT`
- [ ] ✅ Card renderiza placeholder "Card não encontrado"
- [ ] ✅ Console mostra warning

### TE-002: Layout corrompido no Supabase
- [ ] Manualmente corromper record no Supabase (JSON inválido)
- [ ] Carregar dashboard
- [ ] ✅ Fallback para DEFAULT_DASHBOARD_EXAMPLE_LAYOUT
- [ ] ✅ Console mostra erro

### TE-003: localStorage corrompido
- [ ] Manualmente corromper localStorage (JSON inválido)
- [ ] Carregar dashboard
- [ ] ✅ Fallback para Supabase ou DEFAULT
- [ ] ✅ Console mostra warning

### TE-004: Sem user autenticado
- [ ] Fazer logout
- [ ] Tentar acessar /dashboard-example
- [ ] ✅ Redirect para /login (ou erro adequado)

### TE-005: Network error durante save
- [ ] Fazer mudanças
- [ ] Desconectar internet
- [ ] Aguardar auto-save
- [ ] ✅ Toast: "Erro ao salvar layout"
- [ ] ✅ Mudanças permanecem no localStorage
- [ ] Reconectar e salvar manualmente
- [ ] ✅ Sucesso

---

## TESTES DE RESPONSIVIDADE

### TR-001: Mobile - controles visíveis
- [ ] Acessar em mobile (< 768px)
- [ ] ✅ Botões de controle visíveis e clicáveis
- [ ] ✅ Status indicator visível

### TR-002: Mobile - drag funciona
- [ ] Em mobile, entrar em edit mode
- [ ] ✅ Drag handle visível e utilizável
- [ ] ✅ Touch drag funciona

### TR-003: Mobile - resize funciona
- [ ] Em mobile, redimensionar card
- [ ] ✅ Resize handle funciona com touch
- [ ] ✅ Indicador de pixels aparece

### TR-004: Tablet - layout quebra corretamente
- [ ] Acessar em tablet (768px - 1024px)
- [ ] ✅ Cards quebram linha corretamente (flex-wrap)
- [ ] ✅ Seções ficam legíveis

---

## TESTES DE PERFORMANCE

### TP-001: Muitos cards
- [ ] Adicionar 50+ cards em uma seção
- [ ] ✅ Drag & drop permanece fluido
- [ ] ✅ Resize não trava
- [ ] ✅ Auto-save funciona

### TP-002: Muitas mudanças rápidas
- [ ] Fazer 20 resizes em sequência rápida
- [ ] ✅ Auto-save debounce funciona (apenas 1 save após 2s)
- [ ] ✅ UI não trava

---

## TESTES DE ACESSIBILIDADE

### TA-001: Navegação por teclado
- [ ] Navegar todo o dashboard usando apenas Tab
- [ ] ✅ Focus visível em todos os elementos
- [ ] ✅ Ordem lógica de foco

### TA-002: Screen reader
- [ ] Usar NVDA/JAWS
- [ ] ✅ Cards são anunciados corretamente
- [ ] ✅ Botões têm labels descritivos
- [ ] ✅ Status é anunciado

### TA-003: Contraste
- [ ] Verificar contraste de cores
- [ ] ✅ Todos os textos têm contraste >= 4.5:1
- [ ] ✅ Ícones de status são distinguíveis

---

## CHECKLIST FINAL

### Antes de marcar FASE 3 como completa:

#### Funcionalidades Core
- [ ] Resize horizontal funciona e persiste
- [ ] Drag & drop funciona e persiste
- [ ] Auto-save após 2s funciona
- [ ] Save manual funciona
- [ ] Reset funciona completamente
- [ ] Load do Supabase funciona
- [ ] Merge com localStorage funciona

#### UI/UX
- [ ] Indicadores de status corretos
- [ ] Instruções claras em edit mode
- [ ] Dialogs de confirmação funcionam
- [ ] Toast messages aparecem
- [ ] Loading states visíveis
- [ ] Seções colapsam corretamente

#### Integração
- [ ] Todos os cards renderizam
- [ ] Registry de cards funciona
- [ ] Permissões são respeitadas
- [ ] Múltiplas seções funcionam

#### Edge Cases
- [ ] Erros são tratados gracefully
- [ ] Layout corrompido não quebra app
- [ ] Sem user não quebra
- [ ] Network errors são tratados

#### Performance
- [ ] App é fluido com muitos cards
- [ ] Debounce evita spam
- [ ] Sem memory leaks

#### Acessibilidade
- [ ] Keyboard navigation funciona
- [ ] Focus visível
- [ ] Contraste adequado

---

**Total de Testes:** 73

**Tempo estimado de execução:** 3-4 horas

**Status:** ⏳ Aguardando execução ao final da FASE 3E

**Próximo:** FASE 3E - Polimento Visual
