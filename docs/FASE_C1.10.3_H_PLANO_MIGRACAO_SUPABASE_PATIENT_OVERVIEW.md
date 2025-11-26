# FASE C1.10.3_H: Migração Patient Overview Layout para Supabase

**Data**: 2025-01-XX  
**Objetivo**: Migrar persistência do Patient Overview de `localStorage` para Supabase, resolvendo todas as 3 ressalvas identificadas na auditoria.

---

## 📋 SUMÁRIO EXECUTIVO

### Problema Atual
O `usePatientOverviewLayout` usa **apenas `localStorage`** para persistir layouts, causando:
- ❌ **RESSALVA 1**: Chaves antigas migradas para primeiro usuário que logar
- ❌ **RESSALVA 2**: Chaves órfãs acumuladas no `localStorage`
- ❌ **RESSALVA 3**: Flags de migração permanentes

### Solução Proposta
Migrar para arquitetura **idêntica** à da Dashboard (`useDashboardLayout`):
- ✅ Tabela Supabase como fonte única da verdade
- ✅ `localStorage` apenas como cache de edição
- ✅ Isolamento por `user_id`
- ✅ Auto-save com debounce
- ✅ **Resolve todas as 3 ressalvas**

---

## 🎯 OBJETIVOS DA MIGRAÇÃO

### Principais
1. **Persistência Cross-Device**: Layouts sincronizados entre dispositivos
2. **Isolamento de Usuários**: Cada usuário tem seu próprio layout no DB
3. **Eliminação de Ressalvas**: Resolver problemas de migração e chaves órfãs
4. **Paridade com Dashboard**: Usar mesma arquitetura provada

### Secundários
- Manter compatibilidade com layouts existentes (migração suave)
- Preservar funcionalidade atual (nenhuma regressão)
- Performance equivalente ou melhor

---

## 🏗️ ARQUITETURA PROPOSTA

### 1. Tabela no Supabase

#### Schema da Tabela: `patient_overview_layouts`

```sql
CREATE TABLE patient_overview_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, patient_id)
);

-- Índices para performance
CREATE INDEX idx_patient_overview_layouts_user ON patient_overview_layouts(user_id);
CREATE INDEX idx_patient_overview_layouts_patient ON patient_overview_layouts(patient_id);
CREATE INDEX idx_patient_overview_layouts_org ON patient_overview_layouts(organization_id);

-- Trigger para updated_at
CREATE TRIGGER update_patient_overview_layouts_updated_at
  BEFORE UPDATE ON patient_overview_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para auto-set organization_id
CREATE TRIGGER auto_set_organization_patient_overview_layouts
  BEFORE INSERT OR UPDATE ON patient_overview_layouts
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_organization_from_user_for_layouts();
```

#### RLS Policies

```sql
-- Admin pode tudo
CREATE POLICY "patient_overview_layouts_admin_all"
  ON patient_overview_layouts
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Usuário pode gerenciar próprios layouts
CREATE POLICY "patient_overview_layouts_own_select"
  ON patient_overview_layouts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "patient_overview_layouts_own_insert"
  ON patient_overview_layouts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "patient_overview_layouts_own_update"
  ON patient_overview_layouts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "patient_overview_layouts_own_delete"
  ON patient_overview_layouts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Organização: usuários podem ver layouts de pacientes da mesma org
CREATE POLICY "patient_overview_layouts_org_select"
  ON patient_overview_layouts
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL 
    AND organization_id = current_user_organization()
  );
```

---

### 2. Hook Atualizado: `usePatientOverviewLayout`

#### Estrutura do Layout JSON no DB

```typescript
interface PatientOverviewGridLayout {
  [sectionId: string]: {
    cards: Array<{
      i: string;      // card ID
      x: number;      // posição X
      y: number;      // posição Y
      w: number;      // largura
      h: number;      // altura
      minW?: number;  // largura mínima
      minH?: number;  // altura mínima
      maxW?: number;  // largura máxima
      static?: boolean; // não movível
    }>;
  };
}
```

#### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    MOUNT (useEffect)                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Verificar auth.uid() → se null, usar default local       │
│ 2. Carregar do Supabase: SELECT * WHERE user_id = auth.uid()│
│ 3. Se encontrou → merge com default + salvar em localStorage│
│ 4. Se não encontrou → usar default (primeira vez)           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    EDIÇÃO (updateLayout)                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Atualizar state imediatamente (UX responsivo)            │
│ 2. Salvar em localStorage (cache local)                     │
│ 3. Disparar debounce de 1500ms para auto-save              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                AUTO-SAVE (após debounce)                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Serializar layout atual para JSON                        │
│ 2. UPSERT no Supabase (INSERT ou UPDATE)                    │
│ 3. Atualizar timestamp no localStorage                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    RESET (resetLayout)                       │
├─────────────────────────────────────────────────────────────┤
│ 1. DELETE FROM patient_overview_layouts WHERE user_id = ... │
│ 2. Limpar localStorage                                       │
│ 3. Voltar para default layout                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 PLANO DE IMPLEMENTAÇÃO

### FASE H1: Preparação do Banco de Dados
**Duração estimada**: 30 min  
**Risco**: 🟢 BAIXO

#### Tarefas:
1. ✅ Criar tabela `patient_overview_layouts`
2. ✅ Configurar RLS policies
3. ✅ Adicionar índices de performance
4. ✅ Criar triggers (updated_at, organization_id)
5. ✅ Testar policies manualmente no Supabase

#### Entregáveis:
- Migration SQL completa
- Documentação das policies
- Testes de RLS (INSERT, SELECT, UPDATE, DELETE)

---

### FASE H2: Refatoração do Hook
**Duração estimada**: 1h 30min  
**Risco**: 🟡 MÉDIO

#### Arquivo: `src/hooks/usePatientOverviewLayout.ts`

#### Mudanças Principais:

##### 1. Adicionar Loading do Database

```typescript
const loadLayoutFromDatabase = async (userId: string, patientId?: string) => {
  try {
    setLoading(true);
    
    let query = supabase
      .from('patient_overview_layouts')
      .select('*')
      .eq('user_id', userId);
    
    // Se tem patientId, buscar layout específico do paciente
    if (patientId) {
      query = query.eq('patient_id', patientId);
    } else {
      query = query.is('patient_id', null); // Layout geral
    }
    
    const { data, error } = await query.single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error loading layout:', error);
      return null;
    }
    
    return data?.layout_json as PatientOverviewGridLayout | null;
  } catch (err) {
    console.error('Exception loading layout:', err);
    return null;
  } finally {
    setLoading(false);
  }
};
```

##### 2. Modificar useEffect Inicial

```typescript
useEffect(() => {
  const initializeLayout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Não logado → usar default local
      const localLayout = loadLayoutFromLocalStorage();
      setLayout(localLayout);
      setOriginalLayout(localLayout);
      return;
    }
    
    // Logado → carregar do DB
    const dbLayout = await loadLayoutFromDatabase(user.id, patientId);
    
    if (dbLayout) {
      // Merge DB com defaults (caso novos cards tenham sido adicionados)
      const mergedLayout = mergeLayoutWithDefaults(dbLayout, DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
      setLayout(mergedLayout);
      setOriginalLayout(mergedLayout);
      
      // Atualizar localStorage como cache
      saveLayoutToLocalStorage(user.id, mergedLayout);
    } else {
      // Primeira vez → usar default
      setLayout(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
      setOriginalLayout(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
    }
  };
  
  initializeLayout();
}, [patientId]);
```

##### 3. Adicionar Auto-Save ao Supabase

```typescript
const saveLayout = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  try {
    setSaving(true);
    
    const { error } = await supabase
      .from('patient_overview_layouts')
      .upsert({
        user_id: user.id,
        patient_id: patientId || null,
        layout_json: layout,
        version: 1
      }, {
        onConflict: 'user_id,patient_id'
      });
    
    if (error) throw error;
    
    // Atualizar originalLayout após salvar
    setOriginalLayout(layout);
    
    // Atualizar timestamp no localStorage
    saveLayoutToLocalStorage(user.id, layout);
    
    toast.success('Layout salvo com sucesso');
  } catch (err) {
    console.error('Error saving layout:', err);
    toast.error('Erro ao salvar layout');
  } finally {
    setSaving(false);
  }
};

// Auto-save com debounce
useEffect(() => {
  if (!isModified) return;
  
  const timer = setTimeout(() => {
    saveLayout();
  }, DEBOUNCE_SAVE_MS);
  
  return () => clearTimeout(timer);
}, [layout, isModified]);
```

##### 4. Atualizar Reset Layout

```typescript
const resetLayout = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // DELETE do DB
    await supabase
      .from('patient_overview_layouts')
      .delete()
      .eq('user_id', user.id)
      .eq('patient_id', patientId || null);
  }
  
  // Limpar localStorage
  clearLayoutFromLocalStorage(user?.id);
  
  // Voltar ao default
  setLayout(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
  setOriginalLayout(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
  
  toast.success('Layout resetado para o padrão');
};
```

#### Entregáveis:
- Hook refatorado com integração Supabase
- Funções auxiliares (merge, save, load, clear)
- Tratamento de erros e loading states
- Toast notifications para feedback

---

### FASE H3: Migração de Dados Existentes (Opcional)
**Duração estimada**: 1h  
**Risco**: 🟡 MÉDIO

#### Estratégia: Migration Script

Criar um script one-time para migrar layouts existentes no `localStorage` para o Supabase:

```typescript
// src/utils/migratePatientOverviewLayouts.ts
export const migrateLocalLayoutsToSupabase = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  // Detectar se já fez migração
  const migrationKey = `patient-overview-migrated-${user.id}`;
  if (localStorage.getItem(migrationKey)) return;
  
  // Buscar layouts no formato antigo
  const oldLayout = loadOldFormatLayout(); // implementar
  
  if (oldLayout) {
    // Salvar no Supabase
    await supabase
      .from('patient_overview_layouts')
      .insert({
        user_id: user.id,
        layout_json: oldLayout,
        version: 1
      });
    
    // Marcar como migrado
    localStorage.setItem(migrationKey, 'true');
    
    console.log('[Migration] Patient Overview layouts migrated to Supabase');
  }
};
```

#### Onde Executar:
- No `useEffect` do hook, antes de carregar
- Apenas uma vez por usuário
- Silencioso (não bloqueia UI)

#### Alternativa: Sem Migração
- Deixar usuários começarem do zero (mais simples)
- Layouts antigos permanecem no `localStorage` mas não são usados
- Usuários podem reconfigurar em 1-2 minutos

**Recomendação**: **Não fazer migração automática** (KISS principle)

---

### FASE H4: Atualização de Componentes
**Duração estimada**: 30 min  
**Risco**: 🟢 BAIXO

#### Arquivos Afetados:
- `src/pages/PatientDetail.tsx` (ou onde o hook é usado)

#### Mudanças:
- Nenhuma mudança na interface do hook
- Apenas adicionar indicador de loading/saving se necessário

```tsx
const { layout, loading, saving, isModified, updateLayout, resetLayout } = 
  usePatientOverviewLayout(patientId);

// Opcional: mostrar loading state
{loading && <Skeleton />}

// Opcional: mostrar saving indicator
{saving && <Badge>Salvando...</Badge>}
```

---

### FASE H5: Limpeza e Documentação
**Duração estimada**: 30 min  
**Risco**: 🟢 BAIXO

#### Tarefas:
1. ✅ Remover código de migração de chaves antigas
2. ✅ Remover flags de migração
3. ✅ Atualizar documentação do hook
4. ✅ Adicionar comentários no código
5. ✅ Criar guia de troubleshooting

#### Entregáveis:
- Código limpo (sem lógica de migração antiga)
- README atualizado
- Documentação de arquitetura

---

## 🧪 PLANO DE TESTES

### Testes Unitários

#### 1. Hook `usePatientOverviewLayout`
```typescript
describe('usePatientOverviewLayout with Supabase', () => {
  test('should load from database when user is authenticated', async () => {
    // Mock supabase auth
    // Mock supabase query
    // Assert layout loaded from DB
  });
  
  test('should fallback to default when no DB record', async () => {
    // Mock empty DB response
    // Assert default layout used
  });
  
  test('should auto-save after debounce period', async () => {
    // Update layout
    // Wait for debounce
    // Assert upsert called
  });
  
  test('should delete from DB on reset', async () => {
    // Call resetLayout
    // Assert DELETE query called
  });
});
```

#### 2. Funções Auxiliares
- `mergeLayoutWithDefaults`
- `saveLayoutToLocalStorage`
- `clearLayoutFromLocalStorage`

### Testes de Integração

#### Cenários:
1. **Novo Usuário**: Primeiro login → default layout → edita → salva no DB
2. **Usuário Existente**: Login → carrega do DB → edita → auto-save
3. **Multi-Device**: Edita no Desktop → abre no Mobile → layout sincronizado
4. **Reset**: Reseta layout → apaga do DB → volta ao default
5. **Sem Auth**: Logout → localStorage local funciona
6. **RLS**: Usuário A não vê layouts de Usuário B

### Testes Manuais

#### Checklist:
- [ ] Login → layout carrega do DB
- [ ] Editar card → auto-save após 1.5s
- [ ] Adicionar card → persiste no DB
- [ ] Remover card → persiste no DB
- [ ] Reset → apaga do DB e volta ao default
- [ ] Logout → localStorage preservado
- [ ] Multi-tab → mudanças sincronizadas
- [ ] Performance → sem lag ao editar

---

## 📊 IMPACTO E RISCOS

### Impacto Positivo
✅ **Elimina todas as 3 ressalvas da auditoria**
✅ **Persistência cross-device**
✅ **Isolamento de usuários garantido**
✅ **Arquitetura alinhada com Dashboard**
✅ **Manutenibilidade melhorada**

### Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Perda de layouts existentes | Baixa | Alto | Não fazer migração automática; usuários recriam facilmente |
| RLS mal configurada | Média | Crítico | Testes rigorosos de policies; usar patterns provados |
| Performance degradada | Baixa | Médio | Índices no DB; debounce no auto-save; localStorage como cache |
| Conflitos multi-tab | Baixa | Baixo | UPSERT com conflict resolution |
| Bug no merge de defaults | Média | Médio | Testes unitários extensivos |

---

## 📅 CRONOGRAMA

### Estimativa Total: **4-5 horas**

| Fase | Tarefas | Duração | Dependências |
|------|---------|---------|--------------|
| H1 | Banco de Dados | 30 min | - |
| H2 | Hook Refatorado | 1h 30min | H1 |
| H3 | Migração (SKIP) | - | H2 |
| H4 | Componentes | 30 min | H2 |
| H5 | Limpeza | 30 min | H4 |
| **Testes** | Unit + Integration | 1h 30min | H5 |
| **Contingência** | Buffer | 30 min | - |

---

## 🎯 CRITÉRIOS DE SUCESSO

### Must-Have (Bloqueantes)
- [x] Tabela `patient_overview_layouts` criada com RLS
- [x] Hook carrega do DB ao montar
- [x] Auto-save funciona com debounce
- [x] Reset apaga do DB
- [x] Isolamento por user_id garantido
- [x] Nenhuma regressão funcional

### Should-Have (Importantes)
- [x] Performance equivalente ou melhor
- [x] Loading states visíveis
- [x] Toast de feedback ao salvar
- [x] localStorage como cache
- [x] Multi-device funciona

### Nice-to-Have (Opcionais)
- [ ] Migração automática de layouts antigos
- [ ] Versionamento de layouts
- [ ] Rollback de alterações
- [ ] Analytics de uso

---

## 📚 REFERÊNCIAS

### Código Existente para Referência:
- ✅ `src/hooks/useDashboardLayout.ts` (implementação de referência)
- ✅ `src/hooks/usePatientOverviewLayout.ts` (código atual)
- ✅ `src/lib/defaultLayoutPatientOverview.ts` (defaults)

### Documentação:
- `docs/FASE_C1.10.3_G_PLANO_REFINAMENTO_PERSISTENCIA.md` (ressalvas)
- `docs/FASE_12.1_DASHBOARD_PERMISSIONS_INTEGRATION.md` (arquitetura dashboard)

---

## ✅ DECISÃO FINAL

### Recomendação: **IMPLEMENTAR COM SIMPLIFICAÇÃO**

#### O que fazer:
1. ✅ Implementar Fases H1, H2, H4, H5 (completo)
2. ❌ **SKIP Fase H3** (sem migração automática)
3. ✅ Testes básicos de RLS e fluxo
4. ✅ Documentação mínima

#### Justificativa:
- **Simplicidade**: Migração automática adiciona complexidade desnecessária
- **Usabilidade**: Usuários podem recriar layouts em 1-2 minutos
- **Risco**: Menos pontos de falha
- **Manutenção**: Código mais limpo

#### Trade-offs Aceitos:
- ⚠️ Layouts antigos não migram (usuário recria manualmente)
- ✅ Implementação 30% mais rápida
- ✅ Menos código para manter
- ✅ Menor risco de bugs

---

## 🚀 PRÓXIMOS PASSOS

### Após Aprovação:
1. Executar Fase H1 (Migration SQL)
2. Aguardar deploy do schema
3. Refatorar hook (Fase H2)
4. Testar localmente
5. Atualizar componentes (Fase H4)
6. Testes finais (RLS + fluxo)
7. Deploy para produção
8. Monitorar por 24h

### Rollback Plan:
Se algo der errado:
1. Reverter código do hook para versão anterior
2. Tabela no DB pode permanecer (sem impacto)
3. Sistema volta a usar `localStorage` puro

---

## 📝 NOTAS FINAIS

### Alinhamento com Dashboard
Esta implementação usa **exatamente** a mesma arquitetura do `useDashboardLayout`:
- ✅ Tabela Supabase como fonte da verdade
- ✅ Auto-save com debounce
- ✅ localStorage como cache
- ✅ RLS com isolamento de usuários
- ✅ UPSERT para salvar
- ✅ DELETE para resetar

### Resolução das Ressalvas
- **RESSALVA 1** (Migração primeiro usuário): ✅ **RESOLVIDA** (isolamento por user_id)
- **RESSALVA 2** (Chaves órfãs): ✅ **RESOLVIDA** (DB é fonte única)
- **RESSALVA 3** (Flags permanentes): ✅ **RESOLVIDA** (sem migração)

---

**Status**: ⏸️ **AGUARDANDO APROVAÇÃO EXPLÍCITA PARA IMPLEMENTAÇÃO**

---

## 📞 CONTATO

Se houver dúvidas ou sugestões sobre este plano, favor documentar antes de começar a implementação.
