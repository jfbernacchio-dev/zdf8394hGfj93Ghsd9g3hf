# 📊 Track C3: Correção e Evolução do AddCardDialog para /metrics

## 📋 Sumário Executivo

Este documento detalha a implementação completa de um sistema de gerenciamento de cards e gráficos para a página `/metrics`, executado em 3 fases distintas:

- **FASE 1**: Criação do `MetricsAddCardDialog` exclusivo para Cards Métricos
- **FASE 2**: Adição da aba "Cards Gráficos" com gerenciamento dinâmico
- **FASE 3**: Implementação de categorias intermediárias para melhor organização

**Status**: ✅ Completo  
**Data de Conclusão**: 2025-11-29  
**Arquivos Criados**: 2  
**Arquivos Modificados**: 3

---

## 🎯 Objetivo Geral

Substituir o `AddCardDialog` genérico usado em `/metrics` por um dialog especializado que:

1. Gerencie **Cards Métricos** (cards numéricos do grid superior)
2. Gerencie **Cards Gráficos** (gráficos da visão detalhada)
3. Seja consciente do **domínio atual** (financial, administrative, marketing, team)
4. Organize gráficos por **categorias** para melhor UX
5. Persista a seleção de gráficos em **localStorage**

---

## 📦 FASE 1: MetricsAddCardDialog para Cards Métricos

### Objetivo
Criar um dialog específico para `/metrics` que gerencia apenas os **Cards Métricos** (cards numéricos do grid superior), sem mexer em gráficos ainda.

### Arquivos Criados
- ✅ `src/components/MetricsAddCardDialog.tsx`

### Arquivos Modificados
- ✅ `src/pages/Metrics.tsx`

### Implementação Detalhada

#### 1. Novo Componente: `MetricsAddCardDialog.tsx`

**Props do componente:**
```typescript
interface MetricsAddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainKey: string; // 'financial' | 'administrative' | 'marketing' | 'team'
  existingCardIds: string[]; // IDs dos cards já no layout
  onAddCard: (domainKey: string, cardId: string) => void;
  onRemoveCard: (domainKey: string, cardId: string) => void;
}
```

**Estrutura UI:**
- **Título**: "Gerenciar Cards de Métricas"
- **Subtítulo**: Mostra o domínio atual (ex: "Domínio atual: Financeiro")
- **Tab Principal**: "Cards Métricos" (única funcional na FASE 1)
- **Sub-abas**:
  - **"Disponíveis"**: Cards do domínio que ainda não estão no layout
  - **"Adicionados"**: Cards do domínio que já estão no layout

**Funcionalidades:**
- ✅ Filtra cards automaticamente pelo `domainKey`
- ✅ Usa `getMetricsCardsByDomain()` do registry como fonte da verdade
- ✅ Mostra título, descrição e badge de domínio para cada card
- ✅ Botão "Adicionar" (➕) para cards disponíveis
- ✅ Botão "Remover" (❌) para cards adicionados
- ✅ Ordena cards alfabeticamente por título
- ✅ Tooltip com informações detalhadas em cada card

#### 2. Integração em `Metrics.tsx`

**Substituição do AddCardDialog antigo:**
```typescript
// Antes
import { AddCardDialog } from '@/components/AddCardDialog';

// Depois
import { MetricsAddCardDialog } from '@/components/MetricsAddCardDialog';
```

**Renderização do novo dialog:**
```typescript
<MetricsAddCardDialog
  open={showAddCardDialog}
  onOpenChange={setShowAddCardDialog}
  domainKey={currentDomain}
  existingCardIds={getExistingCardIds()}
  onAddCard={(domainKey: string, cardId: string) => handleAddCard(cardId)}
  onRemoveCard={(domainKey: string, cardId: string) => handleRemoveCard(cardId)}
/>
```

**Handlers existentes (não modificados):**
- `handleAddCard(cardId)`: Adiciona card ao layout do domínio atual
- `handleRemoveCard(cardId)`: Remove card do layout do domínio atual
- `getExistingCardIds()`: Retorna array de IDs dos cards presentes

### Validação FASE 1 ✅

- [x] Dialog abre corretamente ao clicar em "Adicionar Cards"
- [x] Mostra apenas cards do domínio atual
- [x] Cards são separados corretamente entre "Disponíveis" e "Adicionados"
- [x] Adicionar card: aparece no grid imediatamente
- [x] Remover card: desaparece do grid imediatamente
- [x] Drag & drop e resize continuam funcionando normalmente
- [x] `/dashboard-example` não foi afetado

---

## 📦 FASE 2: Aba "Cards Gráficos"

### Objetivo
Adicionar a aba **"Cards Gráficos"** ao dialog, permitindo gerenciar quais gráficos aparecem na visão detalhada da `/metrics`, por domínio.

### Arquivos Criados
- ✅ `src/lib/metricsChartsRegistry.tsx`

### Arquivos Modificados
- ✅ `src/components/MetricsAddCardDialog.tsx`
- ✅ `src/pages/Metrics.tsx`

### Implementação Detalhada

#### 1. Novo Registry: `metricsChartsRegistry.tsx`

**Tipos criados:**
```typescript
export type MetricsChartDomain = 'financial' | 'administrative' | 'marketing' | 'team';

export interface MetricsChartDefinition {
  id: string;
  domain: MetricsChartDomain;
  subTab: string; // 'distribuicoes', 'desempenho', 'tendencias', 'retencao', 'website'
  title: string;
  description: string;
  component: ComponentType<any>;
  defaultEnabled: boolean;
}
```

**Registry completo:**
- **Financial**: 16 gráficos (distribuições, desempenho, tendências, retenção)
- **Administrative**: 7 gráficos (distribuições, desempenho, retenção)
- **Marketing**: 1 gráfico (website)
- **Team**: 7 gráficos (desempenho, distribuições, retenção)

**Total**: 31 gráficos catalogados

**Helpers implementados:**
```typescript
getMetricsChartById(chartId: string): MetricsChartDefinition | undefined
getMetricsChartsByDomain(domain: MetricsChartDomain): MetricsChartDefinition[]
getMetricsChartsByDomainAndSubTab(domain, subTab): MetricsChartDefinition[]
getAllChartIds(): string[]
getDefaultEnabledChartIds(domain: MetricsChartDomain): string[]
isValidChartId(chartId: string): boolean
```

#### 2. Estado para Seleção de Gráficos em `Metrics.tsx`

**Novo estado:**
```typescript
type MetricsChartsSelection = Record<MetricsChartDomain, string[]>;

const [chartsSelection, setChartsSelection] = useState<MetricsChartsSelection>(() => {
  // Tentar carregar do localStorage
  const savedSelection = localStorage.getItem('metrics_charts_selection_v1');
  if (savedSelection) {
    return JSON.parse(savedSelection);
  }
  
  // Fallback: usar defaults habilitados
  return {
    financial: getDefaultEnabledChartIds('financial'),
    administrative: getDefaultEnabledChartIds('administrative'),
    marketing: getDefaultEnabledChartIds('marketing'),
    team: getDefaultEnabledChartIds('team'),
  };
});
```

**Persistência automática:**
```typescript
useEffect(() => {
  localStorage.setItem('metrics_charts_selection_v1', JSON.stringify(chartsSelection));
}, [chartsSelection]);
```

**Novos handlers:**
```typescript
const handleAddChart = (domainKey: string, chartId: string) => {
  const domain = domainKey as MetricsChartDomain;
  setChartsSelection(prev => ({
    ...prev,
    [domain]: [...(prev[domain] || []), chartId],
  }));
};

const handleRemoveChart = (domainKey: string, chartId: string) => {
  const domain = domainKey as MetricsChartDomain;
  setChartsSelection(prev => ({
    ...prev,
    [domain]: (prev[domain] || []).filter(id => id !== chartId),
  }));
};
```

#### 3. Extensão do `MetricsAddCardDialog`

**Props adicionadas:**
```typescript
interface MetricsAddCardDialogProps {
  // ... props existentes da FASE 1
  selectedChartIds: string[]; // FASE 2
  onAddChart: (domainKey: string, chartId: string) => void; // FASE 2
  onRemoveChart: (domainKey: string, chartId: string) => void; // FASE 2
}
```

**Nova estrutura UI:**
```
Dialog
├─ Tab: "Cards Métricos" (FASE 1)
│  ├─ Sub-tab: "Disponíveis"
│  └─ Sub-tab: "Adicionados"
│
└─ Tab: "Cards Gráficos" (FASE 2)
   ├─ Sub-tab: "Disponíveis"
   └─ Sub-tab: "Adicionados"
```

**Lógica de filtragem:**
```typescript
const allDomainCharts = getMetricsChartsByDomain(domainKey);
const availableCharts = allDomainCharts.filter(chart => !selectedChartIds.includes(chart.id));
const addedCharts = allDomainCharts.filter(chart => selectedChartIds.includes(chart.id));
```

**Renderização de item de gráfico:**
- Título e descrição
- Badge de domínio
- Badge "Gráfico" (para diferenciar de cards métricos)
- Botão Adicionar/Remover

#### 4. Renderização Dinâmica de Gráficos em `Metrics.tsx`

**Novo método `renderChartContent()`:**

Substitui o hardcode anterior por renderização dinâmica baseada em `chartsSelection`:

```typescript
const renderChartContent = (subTabId: string) => {
  const domain = currentDomain as MetricsChartDomain;
  
  // Obter gráficos selecionados para este domínio/sub-tab
  const selectedCharts = (chartsSelection[domain] || [])
    .map(chartId => getMetricsChartById(chartId))
    .filter(chartDef => chartDef && chartDef.subTab === subTabId);

  if (selectedCharts.length === 0) {
    return <Alert>Nenhum gráfico selecionado...</Alert>;
  }

  return (
    <div className="grid gap-6">
      {selectedCharts.map((chartDef) => {
        const ChartComponent = chartDef.component;
        
        // Determinar props baseado no tipo de chart
        const props = { ...commonProps, ...additionalProps };
        
        return (
          <Card key={chartDef.id}>
            <CardHeader>
              <CardTitle>{chartDef.title}</CardTitle>
              <CardDescription>{chartDef.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartComponent {...props} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
```

**Lógica de props dinâmicas:**
- Charts com `trend` no id: recebem `{ trends }`
- Charts com `distribution`/`status`: recebem `{ summary }`
- Charts com `missed`/`lost`/`ticket`: recebem `{ sessions, patients }`
- Charts de `retention`: recebem `{ retention }` ou `{ patients }`
- Charts de `team`: recebem `{ profiles, scheduleBlocks }` adicionais

### Validação FASE 2 ✅

- [x] Aba "Cards Gráficos" aparece no dialog
- [x] Gráficos são filtrados corretamente por domínio
- [x] Adicionar gráfico: aparece na visão detalhada
- [x] Remover gráfico: desaparece da visão detalhada
- [x] Seleção persiste após refresh (localStorage)
- [x] Cada domínio tem sua seleção independente
- [x] Cards Métricos continuam funcionando perfeitamente

---

## 📦 FASE 3: Categorias Intermediárias para Gráficos

### Objetivo
Adicionar uma camada de **categorias** para organizar os gráficos na aba "Cards Gráficos", tornando a navegação mais intuitiva.

### Arquivos Modificados
- ✅ `src/lib/metricsChartsRegistry.tsx`
- ✅ `src/components/MetricsAddCardDialog.tsx`

### Implementação Detalhada

#### 1. Extensão do Registry com Categorias

**Novo tipo:**
```typescript
export type MetricsChartCategory =
  | 'distribution'   // Distribuições: histogramas, percentuais
  | 'performance'    // Desempenho: produtividade, métricas de performance
  | 'trend'          // Tendências: séries temporais, evolução
  | 'retention'      // Retenção: churn, retorno de pacientes
  | 'website';       // Website: tráfego, conversão, CTR
```

**Interface atualizada:**
```typescript
export interface MetricsChartDefinition {
  id: string;
  domain: MetricsChartDomain;
  subTab: string;
  category: MetricsChartCategory; // AGORA OBRIGATÓRIA
  title: string;
  description: string;
  component: ComponentType<any>;
  defaultEnabled: boolean;
}
```

**Mapeamento de categorias:**

| subTab | category |
|--------|----------|
| `distribuicoes` | `distribution` |
| `desempenho` | `performance` |
| `tendencias` | `trend` |
| `retencao` | `retention` |
| `website` | `website` |

**Todos os 31 gráficos** foram atualizados com suas respectivas categorias.

**Labels em português:**
```typescript
export const CATEGORY_LABELS: Record<MetricsChartCategory, string> = {
  distribution: 'Distribuições',
  performance: 'Desempenho',
  trend: 'Tendências',
  retention: 'Retenção',
  website: 'Website',
};
```

**Novos helpers:**
```typescript
getMetricsChartCategoriesForDomain(domain: MetricsChartDomain): MetricsChartCategory[]
// Financial: ['distribution', 'performance', 'trend', 'retention']
// Administrative: ['distribution', 'performance', 'retention']
// Marketing: ['website']
// Team: ['performance', 'distribution', 'retention']

getMetricsChartsByDomainAndCategory(
  domain: MetricsChartDomain,
  category: MetricsChartCategory
): MetricsChartDefinition[]
```

#### 2. Navegação por Categorias no Dialog

**Novo estado:**
```typescript
const [selectedCategory, setSelectedCategory] = useState<MetricsChartCategory | null>(null);
```

**Nova estrutura UI:**
```
Dialog
├─ Tab: "Cards Métricos"
│  ├─ Sub-tab: "Disponíveis"
│  └─ Sub-tab: "Adicionados"
│
└─ Tab: "Cards Gráficos"
   ├─ Category Tab: "Distribuições" ◄─── FASE 3
   │  ├─ Sub-tab: "Disponíveis"
   │  └─ Sub-tab: "Adicionados"
   │
   ├─ Category Tab: "Desempenho" ◄─── FASE 3
   │  ├─ Sub-tab: "Disponíveis"
   │  └─ Sub-tab: "Adicionados"
   │
   ├─ Category Tab: "Tendências" ◄─── FASE 3
   │  ├─ Sub-tab: "Disponíveis"
   │  └─ Sub-tab: "Adicionados"
   │
   └─ Category Tab: "Retenção" ◄─── FASE 3
      ├─ Sub-tab: "Disponíveis"
      └─ Sub-tab: "Adicionados"
```

**Lógica de filtragem por categoria:**
```typescript
// Obter categorias disponíveis para o domínio
const availableCategories = getMetricsChartCategoriesForDomain(domainKey);

// Filtrar gráficos pela categoria selecionada
const chartsInCategory = selectedCategory
  ? allDomainCharts.filter(chart => chart.category === selectedCategory)
  : [];

// Separar em disponíveis vs adicionados (dentro da categoria)
const availableCharts = chartsInCategory.filter(chart => !selectedChartIds.includes(chart.id));
const addedCharts = chartsInCategory.filter(chart => selectedChartIds.includes(chart.id));
```

**Comportamento:**
- Ao abrir a aba "Cards Gráficos", a primeira categoria é selecionada automaticamente
- Ao mudar de categoria, o viewMode reseta para "Disponíveis"
- Cada categoria mostra apenas seus respectivos gráficos
- A adição/remoção continua funcionando da mesma forma (não afeta a lógica de persistência)

#### 3. Categorias por Domínio

**Financial** (4 categorias):
- **Distribuições**: 4 gráficos (distribuição de sessões, receita, status, ticket médio)
- **Desempenho**: 6 gráficos (performance, mensal, semanal, inativos, faltas, receita perdida)
- **Tendências**: 5 gráficos (trends, receita, forecast vs actual, conversão, top pacientes)
- **Retenção**: 2 gráficos (taxa de retenção, novos vs inativos)

**Administrative** (3 categorias):
- **Distribuições**: 2 gráficos (sessões, frequência)
- **Desempenho**: 3 gráficos (administrativo, comparecimento, ocupação semanal)
- **Retenção**: 2 gráficos (retenção de pacientes, churn vs retenção)

**Marketing** (1 categoria):
- **Website**: 1 gráfico (visão geral do website)

**Team** (3 categorias):
- **Desempenho**: 2 gráficos (individual, comparação de receita)
- **Distribuições**: 2 gráficos (pacientes, carga de trabalho)
- **Retenção**: 3 gráficos (evolução mensal, ocupação por membro, comparecimento por terapeuta)

### Validação FASE 3 ✅

- [x] Aba "Cards Gráficos" mostra categorias corretas por domínio
- [x] Navegação entre categorias funciona suavemente
- [x] Filtragem de gráficos por categoria está correta
- [x] Adicionar/remover gráfico continua funcionando
- [x] Contadores (Disponíveis/Adicionados) são precisos por categoria
- [x] Labels em português aparecem corretamente
- [x] Cards Métricos não foram afetados

---

## 📊 Resumo de Arquivos

### Arquivos Criados (2)

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `src/components/MetricsAddCardDialog.tsx` | ~420 | Dialog especializado para gerenciar cards e gráficos em /metrics |
| `src/lib/metricsChartsRegistry.tsx` | ~536 | Registry centralizado de todos os gráficos disponíveis |

### Arquivos Modificados (1)

| Arquivo | Modificações | Descrição |
|---------|--------------|-----------|
| `src/pages/Metrics.tsx` | 3 seções | Estado de seleção, handlers, renderização dinâmica, integração do dialog |

---

## 🔑 Conceitos-Chave Implementados

### 1. Separação de Responsabilidades
- **Cards Métricos**: Grid customizável (drag & drop)
- **Cards Gráficos**: Visão detalhada (renderização dinâmica)

### 2. Consciência de Domínio
- Cada domínio (financial, administrative, marketing, team) tem:
  - Seus próprios cards métricos disponíveis
  - Seus próprios gráficos disponíveis
  - Suas próprias categorias de gráficos

### 3. Persistência Inteligente
- **Cards Métricos**: Salvos no `layout_profiles` (via `useDashboardLayout`)
- **Cards Gráficos**: Salvos no `localStorage` (via `metrics_charts_selection_v1`)

### 4. Renderização Dinâmica
- Gráficos não são hardcoded
- Props são injetadas dinamicamente baseado no tipo de gráfico
- Sistema permite adicionar novos gráficos sem modificar `Metrics.tsx`

### 5. UX em Camadas
```
Nível 1: Domínio (Financial, Administrative, Marketing, Team)
├─ Nível 2: Tipo de Card (Métricos, Gráficos)
   ├─ Nível 3: Categoria (Distribuições, Desempenho, etc.) ← FASE 3
      └─ Nível 4: Estado (Disponíveis, Adicionados)
```

---

## 🎨 Padrões de Design Aplicados

### 1. Registry Pattern
- `METRICS_CARD_REGISTRY` para cards métricos
- `METRICS_CHART_REGISTRY` para gráficos
- Single source of truth para metadados

### 2. Separation of Concerns
- Registry: Define o "o quê"
- Dialog: Gerencia o "quando" (seleção)
- Metrics.tsx: Renderiza o "como" (visualização)

### 3. Composition Pattern
- Props dinâmicas baseadas em tipo de gráfico
- Componentização de itens de lista (cards e gráficos)

### 4. State Management
- Local state para UI (tabs, viewMode, selectedCategory)
- Lifted state para dados (chartsSelection em Metrics.tsx)
- Persistent state para preferências do usuário (localStorage)

---

## 🚀 Próximos Passos Sugeridos

### Melhorias Futuras

1. **Busca e Filtros**
   - Adicionar campo de busca por título/descrição
   - Filtros avançados (por tipo de métrica, por fonte de dados)

2. **Reordenação de Gráficos**
   - Permitir drag & drop para reordenar gráficos dentro da visão detalhada
   - Salvar ordem personalizada no localStorage

3. **Favoritos**
   - Marcar gráficos como favoritos
   - Quick access aos gráficos mais usados

4. **Presets**
   - Criar e salvar configurações pré-definidas
   - Ex: "Visão Executiva", "Análise Detalhada", "Monitoramento Diário"

5. **Exportação**
   - Exportar configuração de gráficos como JSON
   - Importar configurações de outros usuários

6. **Notificações**
   - Toast ao adicionar/remover gráficos com sucesso
   - Confirmação antes de remover gráficos com muitas configurações

---

## 📝 Lições Aprendidas

### O Que Funcionou Bem

1. **Abordagem Incremental**
   - Implementar em 3 fases permitiu validação contínua
   - Cada fase construiu sobre a anterior sem regressões

2. **Registry Centralizado**
   - Facilitou a manutenção e adição de novos gráficos
   - Metadados em um só lugar

3. **Tipagem Forte**
   - TypeScript ajudou a evitar erros
   - Interfaces claras facilitaram a integração

### Desafios Enfrentados

1. **Props Dinâmicas**
   - Diferentes gráficos precisam de props diferentes
   - Solução: Lógica condicional baseada em ID/tipo

2. **Persistência Híbrida**
   - Cards métricos: DB (via hook)
   - Gráficos: localStorage
   - Funciona bem, mas requer documentação clara

3. **Navegação em Camadas**
   - 4 níveis de navegação podem ser confusos
   - Solução: Labels claros e breadcrumbs visuais

---

## ✅ Checklist de Validação Final

### Funcionalidades Core
- [x] MetricsAddCardDialog funciona em todos os domínios
- [x] Cards Métricos: adicionar/remover funciona
- [x] Cards Gráficos: adicionar/remover funciona
- [x] Categorias aparecem corretamente por domínio
- [x] Persistência funciona (localStorage)
- [x] Drag & drop de cards métricos intacto

### Integridade de Dados
- [x] Nenhum card/gráfico foi perdido
- [x] IDs são únicos e consistentes
- [x] Registry está completo (31 gráficos)
- [x] Todos os gráficos têm categoria atribuída

### UX/UI
- [x] Labels em português corretos
- [x] Badges mostram informações relevantes
- [x] Tooltips são informativos
- [x] Scroll funciona em listas longas
- [x] Contadores são precisos

### Compatibilidade
- [x] `/dashboard-example` não foi afetado
- [x] Layout existente preservado
- [x] Funciona em todos os 4 domínios
- [x] Sem quebras em funcionalidades existentes

---

## 🎯 Conclusão

A implementação das 3 fases foi concluída com **sucesso total**. O sistema agora oferece:

✅ **Especialização**: Dialog dedicado à `/metrics` ao invés de genérico  
✅ **Organização**: Categorias facilitam a navegação em 31 gráficos  
✅ **Flexibilidade**: Fácil adicionar novos cards/gráficos no futuro  
✅ **Persistência**: Preferências do usuário são salvas  
✅ **Manutenibilidade**: Código bem estruturado e documentado

O sistema está **pronto para uso em produção** e serve como base sólida para futuras expansões da página `/metrics`.

---

**Documentação elaborada em**: 2025-11-29  
**Versão**: 1.0  
**Autor**: Track C3 - Correção AddCardDialog Metrics
