# 📚 ARQUITETURA DO SISTEMA - GUIA DE REFERÊNCIA COMPLETO

> **Objetivo**: Este documento serve como "cola" rápida para implementação de novas funcionalidades, contendo toda a estrutura arquitetural, padrões, convenções e principais componentes do sistema.

---

## 📋 ÍNDICE

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Sistema de Permissões](#2-sistema-de-permissões)
3. [Dashboard e Layout System](#3-dashboard-e-layout-system)
4. [Cards e Components Registry](#4-cards-e-components-registry)
5. [Hooks Principais](#5-hooks-principais)
6. [Data Flow e State Management](#6-data-flow-e-state-management)
7. [Banco de Dados e Tabelas](#7-banco-de-dados-e-tabelas)
8. [Utilities e Helpers](#8-utilities-e-helpers)
9. [Padrões de Código](#9-padrões-de-código)
10. [Quick Reference Checklist](#10-quick-reference-checklist)

---

## 1. VISÃO GERAL DA ARQUITETURA

### 1.1 Estrutura de Diretórios

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── ui/             # Componentes shadcn/ui base
│   └── [features]/     # Componentes específicos de features
├── contexts/           # React Context (Auth, etc.)
├── hooks/              # Custom hooks reutilizáveis
├── lib/                # Bibliotecas e utilitários
│   ├── dashboard*.ts   # Sistema de dashboard/layout
│   ├── *Utils.ts       # Funções utilitárias
│   └── *Registry.tsx   # Registros de componentes
├── pages/              # Páginas da aplicação
├── types/              # TypeScript types e interfaces
└── integrations/       # Integrações externas (Supabase)
```

### 1.2 Stack Tecnológica

- **Frontend**: React 18 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **State**: React Context + Custom Hooks
- **Backend**: Supabase (via Lovable Cloud)
- **Gráficos**: Recharts
- **Formatação**: date-fns, custom Brazilian formatters

---

## 2. SISTEMA DE PERMISSÕES

### 2.1 Roles (user_roles table)

```typescript
type UserRole = 'admin' | 'fulltherapist' | 'subordinate' | 'accountant';
```

**Hierarquia**:
- `admin`: Acesso total
- `fulltherapist`: Terapeuta com gestão de subordinados
- `subordinate`: Terapeuta subordinado (configurável)
- `accountant`: Contador (acesso limitado a dados financeiros)

### 2.2 Domínios de Permissão

```typescript
type PermissionDomain = 
  | 'financial'       // Valores, NFSe, pagamentos
  | 'administrative'  // Sessões, agenda, notificações
  | 'clinical'        // Queixas, evoluções, diagnósticos
  | 'media'           // Google Ads, website, analytics
  | 'general'         // Sem restrição
  | 'charts'          // Gráficos agregados
  | 'team';           // Dados da equipe (subordinados)
```

### 2.3 ExtendedAutonomyPermissions Interface

```typescript
interface ExtendedAutonomyPermissions {
  // Base settings (subordinate_autonomy_settings table)
  managesOwnPatients: boolean;      // true = só vê seus pacientes
  hasFinancialAccess: boolean;      // Pode ver dados financeiros
  nfseEmissionMode: 'own_company' | 'manager_company';
  
  // Derived permissions (calculated)
  canFullSeeClinic: boolean;        // Vê dados clínicos de todos
  includeInFullFinancial: boolean;  // Inclui no fechamento
  canViewFullFinancial: boolean;    // Vê fechamento geral
  canViewOwnFinancial: boolean;     // Vê suas finanças
  canManageAllPatients: boolean;    // Acesso a todos
  canManageOwnPatients: boolean;    // Só seus pacientes
  isFullTherapist: boolean;         // É full therapist
}
```

### 2.4 Hooks de Permissão

**`useSubordinatePermissions()`**
```typescript
// Retorna permissões do usuário atual
const { permissions, loading, isFullTherapist } = useSubordinatePermissions();
```

**`useCardPermissions()`**
```typescript
const { 
  hasAccess,              // (domain) => boolean
  canViewCard,            // (cardId) => boolean
  shouldFilterToOwnData,  // () => boolean - true se deve filtrar
  canViewFullFinancial,   // () => boolean
  canViewOwnFinancial,    // () => boolean
} = useCardPermissions();
```

### 2.5 Arquivos de Permissões

| Arquivo | Propósito |
|---------|-----------|
| `src/types/permissions.ts` | Types e interfaces core |
| `src/hooks/useSubordinatePermissions.ts` | Hook principal de permissões |
| `src/hooks/useCardPermissions.ts` | Validação de acesso a cards |
| `src/lib/checkPermissions.ts` | Validação de rotas |
| `src/lib/routePermissions.ts` | Configuração de rotas |
| `src/lib/checkPatientAccess.ts` | Validação de acesso a pacientes |
| `PERMISSIONS_SYSTEM.md` | Documentação completa |

---

## 3. DASHBOARD E LAYOUT SYSTEM

### 3.1 Arquitetura de Layouts

O sistema possui **DUAS** arquiteturas de dashboard:

#### A) Dashboard "OLD" (Absolute Positioning)
- **Arquivo**: `src/lib/defaultLayoutDashboard.ts`
- **Tipo**: Posicionamento absoluto (x, y, width, height)
- **Usado em**: `src/pages/Dashboard.tsx`

```typescript
interface CardSize {
  width: number;
  height: number;
  x: number;     // posição absoluta X
  y: number;     // posição absoluta Y
}
```

#### B) Dashboard "EXAMPLE" (Section-Based)
- **Arquivo**: `src/lib/defaultLayoutDashboardExample.ts`
- **Tipo**: Seções com cards ordenados sequencialmente
- **Usado em**: `src/pages/DashboardExample.tsx`

```typescript
interface CardLayout {
  cardId: string;
  width: number;
  order: number;  // ordem dentro da seção
}

interface SectionLayout {
  cardLayouts: CardLayout[];
}
```

### 3.2 Configuração de Seções

**Arquivo**: `src/lib/defaultSectionsDashboard.ts`

```typescript
const DASHBOARD_SECTIONS: Record<string, SectionConfig> = {
  'dashboard-financial': {
    id: 'dashboard-financial',
    name: 'Financeira',
    description: 'Receitas, pagamentos pendentes e NFSe',
    permissionConfig: {
      primaryDomain: 'financial',
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'dashboard-expected-revenue',
      'dashboard-actual-revenue',
      // ...
    ],
  },
  // ...outras seções
};
```

**Seções disponíveis**:
- `dashboard-financial`: Financeira
- `dashboard-administrative`: Administrativa
- `dashboard-clinical`: Clínica
- `dashboard-media`: Marketing
- `dashboard-general`: Geral
- `dashboard-charts`: Gráficos
- **`dashboard-team`**: Equipe (NOVA - ESTA É A SEÇÃO EM QUESTÃO)

### 3.3 Layout Persistence

**LocalStorage Keys**:
```typescript
// Dashboard OLD
`card-size-${cardId}`              // { width, height, x, y }
`section-height-${sectionId}`      // number
`dashboard-visible-cards`          // string[]

// Dashboard Example
`dashboard-example-layout`         // DashboardExampleLayout
```

**Supabase**:
- Tabela: `user_layout_preferences`
- Tipo: `'dashboard-example'`

---

## 4. CARDS E COMPONENTS REGISTRY

### 4.1 Card Registry Principal

**Arquivo**: `src/lib/dashboardCardRegistry.tsx`

Mapeia `cardId` → React Component

```typescript
interface CardProps {
  isEditMode?: boolean;
  className?: string;
  patients?: any[];          // SEMPRE PASSAR
  sessions?: any[];          // SEMPRE PASSAR
  start?: Date;              // SEMPRE PASSAR para filtragem por período
  end?: Date;                // SEMPRE PASSAR para filtragem por período
  automaticScale?: TimeScale;
  getScale?: (chartId: string) => TimeScale;
  setScaleOverride?: (chartId: string, scale: TimeScale | null) => void;
  clearOverride?: (chartId: string) => void;
  hasOverride?: (chartId: string) => boolean;
  aggregatedData?: Array<{...}>;  // Para gráficos
}
```

### 4.2 Card Registry Team

**Arquivo**: `src/lib/dashboardCardRegistryTeam.tsx`

Cards específicos para visualizar dados da equipe (subordinados):

```typescript
export const DashboardExpectedRevenueTeam = ({ patients, sessions, start, end }: CardProps) => {
  // Implementação usando dados da equipe
};
```

**Cards Team disponíveis**:
- `DashboardExpectedRevenueTeam`
- `DashboardActualRevenueTeam`
- `DashboardUnpaidValueTeam`
- `DashboardPaymentRateTeam`
- `DashboardTotalPatientsTeam`
- `DashboardAttendedSessionsTeam`

### 4.3 Tipos de Cards

**Arquivo**: `src/types/cardTypes.ts`

```typescript
interface CardConfig {
  id: string;                         // 'dashboard-expected-revenue'
  name: string;                       // 'Receita Esperada'
  description: string;                // Descrição curta
  detailedDescription?: string;       // Descrição longa (tooltip)
  category: CardCategory;             // 'dashboard-cards' | 'dashboard-charts'
  icon?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  permissionConfig?: CardPermissionConfig;
  isChart?: boolean;
}
```

**Exports importantes**:
- `AVAILABLE_DASHBOARD_CARDS`: Cards métricas
- `AVAILABLE_DASHBOARD_CHARTS`: Cards gráficos

---

## 5. HOOKS PRINCIPAIS

### 5.1 useTeamData

**Arquivo**: `src/hooks/useTeamData.ts`

**Propósito**: Carregar dados dos subordinados (equipe)

```typescript
const { 
  teamPatients,      // Pacientes dos subordinados
  teamSessions,      // Sessões dos subordinados
  subordinateIds,    // IDs dos subordinados
  loading 
} = useTeamData();
```

**Fluxo interno**:
1. Busca subordinados via `created_by = user.id`
2. Busca pacientes onde `user_id IN (subordinateIds)`
3. Busca sessões onde `patient_id IN (patientIds)`

### 5.2 useOwnData

**Arquivo**: `src/hooks/useOwnData.ts`

**Propósito**: Filtrar dados PRÓPRIOS (excluindo subordinados)

```typescript
const { 
  ownPatients,       // Pacientes próprios (sem subordinados)
  ownSessions,       // Sessões dos pacientes próprios
  subordinateIds     // IDs dos subordinados (para filtrar)
} = useOwnData(allPatients, allSessions, subordinateIds);
```

**Lógica**:
```typescript
ownPatients = allPatients.filter(p => p.user_id === user.id);
ownSessions = allSessions.filter(s => ownPatientIds.has(s.patient_id));
```

### 5.3 useChartTimeScale

**Arquivo**: `src/hooks/useChartTimeScale.ts`

**Propósito**: Gerenciar escala de tempo dos gráficos (hora, dia, semana, mês)

```typescript
const { 
  automaticScale,    // Escala automática calculada
  getScale,          // (chartId) => TimeScale atual
  setScaleOverride,  // (chartId, scale) => void
  clearOverride,     // (chartId) => void
  hasOverride        // (chartId) => boolean
} = useChartTimeScale({ startDate, endDate });
```

### 5.4 useDashboardLayout

**Arquivo**: `src/hooks/useDashboardLayout.ts`

**Propósito**: Gerenciar layout do Dashboard Example (com persistência Supabase)

```typescript
const {
  layout,              // DashboardExampleLayout
  loading,
  saving,
  isModified,
  updateCardWidth,     // (sectionId, cardId, width)
  updateCardOrder,     // (sectionId, cardIds[])
  addCard,            // (sectionId, cardId)
  removeCard,         // (sectionId, cardId)
  saveLayout,         // ()
  resetLayout,        // ()
} = useDashboardLayout();
```

---

## 6. DATA FLOW E STATE MANAGEMENT

### 6.1 Fluxo de Dados no Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Component (src/pages/Dashboard.tsx)              │
├─────────────────────────────────────────────────────────────┤
│  1. useAuth() → user, isAdmin                               │
│  2. useSubordinatePermissions() → permissions               │
│  3. useCardPermissions() → canViewCard, shouldFilterToOwnData│
│  4. useTeamData() → teamPatients, teamSessions              │
│  5. loadData() → allPatients, allSessions (Supabase)        │
│  6. useOwnData() → ownPatients, ownSessions (filtrado)      │
├─────────────────────────────────────────────────────────────┤
│  7. getDateRange() → start, end (baseado em period)         │
│  8. Filtragem por período: periodSessions                   │
│  9. Cálculos: totalExpected, totalActual, unpaidValue       │
│ 10. aggregatedData (para gráficos)                          │
├─────────────────────────────────────────────────────────────┤
│ 11. Renderização de seções (ResizableSection)              │
│ 12. Renderização de cards (renderCard)                     │
│     → dashboardCardRegistry[cardId]({ props })              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Propagação de Props para Cards

**Props essenciais que SEMPRE devem ser passadas**:

```typescript
<DashboardCard
  patients={ownPatients}        // OU teamPatients
  sessions={ownSessions}        // OU teamSessions
  start={start}                 // CRÍTICO para filtragem
  end={end}                     // CRÍTICO para filtragem
  isEditMode={isEditMode}
  automaticScale={automaticScale}
  getScale={getScale}
  setScaleOverride={setScaleOverride}
  clearOverride={clearOverride}
  hasOverride={hasOverride}
  aggregatedData={aggregatedData}  // Para gráficos
/>
```

---

## 7. BANCO DE DADOS E TABELAS

### 7.1 Principais Tabelas

| Tabela | Propósito | Campos Principais |
|--------|-----------|-------------------|
| `profiles` | Perfis de usuários | id, full_name, created_by |
| `user_roles` | Roles dos usuários | user_id, role |
| `subordinate_autonomy_settings` | Configurações de subordinados | subordinate_id, manager_id, manages_own_patients, has_financial_access |
| `patients` | Pacientes | id, user_id, name, session_value, monthly_price |
| `sessions` | Sessões de terapia | id, patient_id, date, status, value, paid |
| `user_layout_preferences` | Layouts salvos | user_id, layout_type, layout_config |

### 7.2 Query Patterns

**Buscar pacientes próprios**:
```typescript
supabase
  .from('patients')
  .select('*')
  .eq('user_id', user.id);
```

**Buscar subordinados**:
```typescript
supabase
  .from('profiles')
  .select('id')
  .eq('created_by', user.id);
```

**Buscar pacientes da equipe**:
```typescript
supabase
  .from('patients')
  .select('*')
  .in('user_id', subordinateIds);
```

**Buscar sessões de pacientes**:
```typescript
supabase
  .from('sessions')
  .select('*')
  .in('patient_id', patientIds);
```

---

## 8. UTILITIES E HELPERS

### 8.1 Formatação Brasileira

**Arquivo**: `src/lib/brazilianFormat.ts`

```typescript
// Moeda
formatBrazilianCurrency(123.45) // "R$ 123,45"

// Data
formatBrazilianDate('2025-11-18') // "18/11/2025"
```

### 8.2 Date Utilities

```typescript
import { parseISO, format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const date = parseISO('2025-11-18');
format(date, 'dd/MM/yyyy', { locale: ptBR });
```

### 8.3 Time Scale Utilities

**Arquivo**: `src/hooks/useChartTimeScale.ts`

```typescript
generateTimeIntervals(start: Date, end: Date, scale: TimeScale): Date[]
formatTimeLabel(date: Date, scale: TimeScale): string
getIntervalBounds(date: Date, scale: TimeScale): { start: Date, end: Date }
```

---

## 9. PADRÕES DE CÓDIGO

### 9.1 Componentes de Card

**Template padrão**:

```typescript
export const DashboardCardName = ({ 
  patients = [], 
  sessions = [], 
  start, 
  end,
  isEditMode,
  className 
}: CardProps) => {
  // 1. Filtragem por período
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end;
    } catch {
      return false;
    }
  });

  // 2. Cálculos (considerar monthly_price!)
  const monthlyPatientsTracked = new Map<string, Set<string>>();
  const total = periodSessions.reduce((sum, s) => {
    const patient = patients.find(p => p.id === s.patient_id);
    if (!patient) return sum;
    
    if (patient.monthly_price) {
      const monthKey = format(parseISO(s.date), 'yyyy-MM');
      if (!monthlyPatientsTracked.has(patient.id)) {
        monthlyPatientsTracked.set(patient.id, new Set());
      }
      const months = monthlyPatientsTracked.get(patient.id)!;
      if (!months.has(monthKey)) {
        months.add(monthKey);
        return sum + patient.session_value;
      }
      return sum;
    } else {
      return sum + s.value;
    }
  }, 0);

  // 3. Renderização
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            Título do Card
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p><strong>Descrição detalhada</strong></p>
                <p>Explicação completa do cálculo e métricas.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatBrazilianCurrency(total)}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {periodSessions.length} sessões no período
        </p>
      </CardContent>
    </Card>
  );
};
```

### 9.2 Considerações Críticas

**SEMPRE considerar `monthly_price`**:
- Pacientes com `monthly_price = true` pagam valor fixo mensal
- Devemos contar apenas 1x por mês por paciente
- Usar `Map<patientId, Set<monthKey>>` para tracking

**SEMPRE filtrar por período**:
- Receber `start` e `end` como props
- Filtrar sessões: `sessionDate >= start && sessionDate <= end`

**SEMPRE usar formatters existentes**:
- `formatBrazilianCurrency()`
- `format(date, 'dd/MM/yyyy', { locale: ptBR })`

---

## 10. QUICK REFERENCE CHECKLIST

### Para adicionar um novo card:

- [ ] Criar componente em `src/lib/dashboardCardRegistry.tsx` ou `*Team.tsx`
- [ ] Seguir interface `CardProps`
- [ ] Implementar filtragem por período (start/end)
- [ ] Considerar `monthly_price` nos cálculos
- [ ] Adicionar tooltip com descrição detalhada (Info icon)
- [ ] Usar `formatBrazilianCurrency()` para valores monetários
- [ ] Adicionar em `AVAILABLE_DASHBOARD_CARDS` ou `AVAILABLE_DASHBOARD_CHARTS`
- [ ] Registrar em seção apropriada em `defaultSectionsDashboard.ts`
- [ ] Configurar `permissionConfig` adequado
- [ ] Testar com diferentes períodos e tipos de pacientes

### Para adicionar uma nova seção:

- [ ] Adicionar em `DASHBOARD_SECTIONS` (`src/lib/defaultSectionsDashboard.ts`)
- [ ] Definir `permissionConfig` apropriado
- [ ] Listar `availableCardIds`
- [ ] Configurar `defaultHeight`, `collapsible`, etc.
- [ ] Adicionar em `DEFAULT_DASHBOARD_SECTIONS` se necessário
- [ ] Renderizar na página Dashboard
- [ ] Verificar filtros de permissão

### Para modificar lógica de cálculo:

- [ ] Verificar código existente em cards similares
- [ ] Considerar `monthly_price` sempre
- [ ] Filtrar por período (start/end)
- [ ] Testar edge cases (pacientes sem sessões, etc.)
- [ ] Usar helpers existentes (formatters, date utilities)
- [ ] Documentar cálculo no tooltip

---

## 📌 DOCUMENTOS RELACIONADOS

- `PERMISSIONS_SYSTEM.md` - Sistema de permissões detalhado
- `src/lib/DASHBOARD_LAYOUT_SYSTEM.md` - Sistema de layout
- `src/hooks/DASHBOARD_LAYOUT_USAGE.md` - Guia de uso de layouts
- `src/components/SORTABLE_CARDS_USAGE.md` - Uso de cards ordenáveis

---

**Última atualização**: 2025-11-18
**Versão**: 1.0
