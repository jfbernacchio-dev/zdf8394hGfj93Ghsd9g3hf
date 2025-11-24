# 📐 FASE C1.3 - Infraestrutura de Layout da Visão Geral

**Status**: ✅ CONCLUÍDO  
**Data**: 2025-11-24  
**Fase da Track C1**: Preparação de Layout (sem integração)

---

## 🎯 Objetivo da FASE C1.3

Criar a camada de gerenciamento de layout da aba "Visão Geral" sem integrar com o PatientDetail ainda.

Infraestrutura primeiro, integração depois.

---

## 📦 Arquivos Criados

### 1. `src/lib/patientOverviewLayout.ts` (330 linhas)

**Propósito**: Tipos, layout padrão e funções puras de manipulação de layout

**Conteúdo principal**:
- ✅ Interface `PatientOverviewCardLayout` (compatível com React Grid Layout)
- ✅ Constante `DEFAULT_PATIENT_OVERVIEW_LAYOUT` com 20 cards posicionados
- ✅ Funções auxiliares puras:
  - `getDefaultPatientOverviewLayout()` - Retorna cópia do layout padrão
  - `isValidLayout()` - Valida estrutura de layout
  - `normalizePatientOverviewLayout()` - Remove duplicatas e corrige valores
  - `mergeLayouts()` - Mescla layout salvo com novos cards
  - `filterLayoutByVisibility()` - Filtra por cards visíveis
  - `addCardToLayout()` - Adiciona card em posição livre
  - `removeCardFromLayout()` - Remove card do layout
  - `getLayoutCardIds()` - Lista IDs dos cards no layout
  - `getLayoutCardCount()` - Conta cards no layout

**Características**:
- 🚫 Sem JSX
- 🚫 Sem React
- 🚫 Sem IO (localStorage/Supabase)
- ✅ Apenas tipos e funções puras

**Layout Padrão**:
- Grade de 12 colunas
- 11 cards estatísticos (stats) nas linhas superiores
- 9 cards funcionais na área principal
- Dimensões baseadas nos metadados de `patientOverviewCards.ts`

---

### 2. `src/lib/patientOverviewLayoutPersistence.ts` (150 linhas)

**Propósito**: Funções de persistência de layout (localStorage apenas nesta fase)

**Conteúdo principal**:
- ✅ `loadPatientOverviewLayout()` - Carrega do localStorage
- ✅ `savePatientOverviewLayout()` - Salva no localStorage
- ✅ `resetPatientOverviewLayout()` - Reseta para padrão
- ✅ `hasStoredLayout()` - Verifica se existe layout salvo
- ✅ `clearAllPatientOverviewLayouts()` - Limpa todos os layouts

**Características**:
- ✅ Implementação localStorage completa
- ✅ Validação e normalização automática
- ✅ Merge com layout padrão (adiciona novos cards)
- ✅ Tratamento de erros robusto
- 📝 Preparado para migração Supabase futura

**Chave de storage**:
```
patient-overview-layout-{organizationId}-{userId}
```

---

### 3. `src/hooks/usePatientOverviewLayout.ts` (200 linhas)

**Propósito**: Hook React para gerenciar estado do layout

**Conteúdo principal**:
- ✅ Estado de `layout` (array de cards com posições)
- ✅ Estado de `isLoading` (carregamento inicial)
- ✅ Estado de `isDirty` (layout modificado não salvo)
- ✅ Estado de `hasStoredLayout` (se existe layout customizado)
- ✅ Função `updateLayout()` (atualiza com debounce)
- ✅ Função `saveNow()` (salva imediatamente)
- ✅ Função `resetLayout()` (volta ao padrão)

**Características**:
- ✅ Carregamento automático na montagem
- ✅ Salvamento com debounce (1s padrão)
- ✅ Modo read-only (para preview)
- ✅ Normalização automática
- ✅ Cleanup de timers
- 🚫 Sem dependência do PatientDetail
- 🚫 Sem JSX ou renderização

**Opções do Hook**:
```typescript
interface UsePatientOverviewLayoutOptions {
  userId: string;
  organizationId: string;
  saveDebounceMs?: number;  // default: 1000ms
  readOnly?: boolean;        // default: false
}
```

**Retorno do Hook**:
```typescript
interface UsePatientOverviewLayoutReturn {
  layout: PatientOverviewCardLayout[];
  isLoading: boolean;
  isDirty: boolean;
  updateLayout: (newLayout) => void;
  saveNow: () => void;
  resetLayout: () => void;
  hasStoredLayout: boolean;
}
```

---

## 🔒 Restrições Respeitadas

### ✅ NENHUM arquivo existente foi modificado
- ❌ PatientDetail.tsx NÃO foi tocado
- ❌ patientOverviewCards.ts NÃO foi tocado
- ❌ ResizableCard NÃO foi tocado
- ❌ AddCardDialog NÃO foi tocado

### ✅ NENHUM JSX foi criado
- Todos os arquivos são puramente lógica/tipos

### ✅ NENHUMA integração foi feita
- Sistema isolado e pronto para plugar

---

## 📊 Estrutura de Layout

### Grid System
- **Colunas**: 12
- **Unidade de altura**: ~80px
- **Breakpoints**: Responsivo via React Grid Layout

### Organização Padrão

**SEÇÃO STATS (y: 0-3)**
```
Linha 0-1: Cards principais (5 cards visíveis por padrão)
  [Total][Comparecidas][Agendadas][A Pagar][NFSe]

Linha 2-3: Cards secundários (inicialmente ocultos)
  [Total Geral][Faturamento][Recebido][Faltas][Taxa][Desmarcadas]
```

**SEÇÃO FUNCTIONAL (y: 4+)**
```
Linha 4-6: 
  [Próximo Agendamento (4 cols)] [Contato (4 cols)]

Linha 7-9:
  [Queixa Clínica (5 cols)]      [Info Clínica (7 cols)]

Linha 10-12:
  [Histórico (4 cols)]           [Ações Rápidas (3 cols)]

Linha 13+ (cards opcionais):
  [Notas Recentes] [Resumo Pagamentos] [Frequência]
```

---

## 🧪 Validações Implementadas

### `isValidLayout()`
- ✅ Verifica se é array
- ✅ Valida campos obrigatórios (id, x, y, w, h)
- ✅ Valida tipos
- ✅ Valida valores numéricos (≥ 0)

### `normalizePatientOverviewLayout()`
- ✅ Remove cards inexistentes no catálogo
- ✅ Remove cards duplicados
- ✅ Arredonda valores para inteiros
- ✅ Corrige valores negativos

### `mergeLayouts()`
- ✅ Preserva posições customizadas
- ✅ Adiciona novos cards automaticamente
- ✅ Posiciona novos cards no final do layout

---

## 🚀 Próximos Passos (FASE C1.4)

A FASE C1.4 irá:
1. Integrar `usePatientOverviewLayout` no PatientDetail
2. Implementar grid drag & drop (React Grid Layout)
3. Conectar AddCardDialog ao sistema de layout
4. Substituir ResizableCard/ResizableSection pelo grid
5. Manter compatibilidade com visibleCards

---

## 📝 Notas Técnicas

### Por que localStorage primeiro?
- Implementação simples e rápida
- Sem dependência de backend
- Fácil migração para Supabase depois
- Permite testar o sistema localmente

### Por que React Grid Layout?
- Biblioteca madura e bem mantida
- Drag & drop nativo
- Responsivo por padrão
- Serialização fácil (layout = array de objetos)
- Compatível com constraints (minW, maxW, etc.)

### Por que separar persistência?
- Facilita migração futura para Supabase
- Facilita testes unitários
- Permite trocar backend sem afetar UI
- Padrão de Repository Pattern

---

## ⚠️ Pontos de Atenção

### Futuro: Templates por Role/Abordagem
O sistema está preparado para:
- Templates base por professional_role
- Templates específicos por clinical_approach
- Fallback para layout padrão se template não existir
- Merge de templates (org + user customization)

### Futuro: Migração Supabase
Quando migrar para Supabase:
- Criar tabela `patient_overview_layouts`
- Adicionar funções em `patientOverviewLayoutPersistence.ts`
- Manter localStorage como fallback
- Implementar sync bidirecional (opcional)

### Performance
- Debounce de 1s evita salvamentos excessivos
- Normalização é O(n) linear
- Merge é O(n + m) linear
- Sem queries pesadas (tudo em memória)

---

## ✅ Checklist Final

- [x] `patientOverviewLayout.ts` criado
- [x] `patientOverviewLayoutPersistence.ts` criado
- [x] `usePatientOverviewLayout.ts` criado
- [x] Nenhum arquivo existente modificado
- [x] Nenhum JSX criado
- [x] Sistema compila isoladamente
- [x] Funções puras testáveis
- [x] Documentação completa

---

**Status Final**: ✅ FASE C1.3 CONCLUÍDA COM SUCESSO

**Pronto para**: FASE C1.4 (Integração com PatientDetail + Grid)
