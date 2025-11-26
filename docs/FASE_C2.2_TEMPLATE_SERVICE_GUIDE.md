# FASE C2.2 - Template Service / Hook (Guia de Uso)

## 📋 Visão Geral

A FASE C2.2 criou o **núcleo do sistema de templates clínicos**, que será usado em todas as fases subsequentes da TRACK C2.

**Objetivo:** Centralizar a lógica de resolução de templates clínicos baseada no perfil profissional do usuário, sem ainda modificar as telas existentes.

---

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
src/
├── lib/
│   └── templates/
│       ├── templateTypes.ts          # Interfaces e tipos
│       ├── templateRegistry.ts       # Registro de templates disponíveis
│       ├── templateService.ts        # Lógica de resolução
│       └── tests/
│           └── templateTests.ts      # Testes de sanity-check
└── hooks/
    └── useActiveClinicalTemplates.ts # Hook React
```

---

## 🎯 Conceitos Principais

### 1. Template Clínico (`ClinicalTemplate`)

Um template clínico define:
- **Estrutura de Queixa Clínica** (quais campos, validações)
- **Funções Psíquicas avaliadas** (12 funções no psychology_basic)
- **Visualização de Evolução** (gráficos, resumos)

#### Tipos de Template

- **`role`**: Baseado no papel profissional (ex: `psychology_basic` para psicólogos)
- **`approach`**: Baseado na abordagem clínica (ex: `tcc`, `junguiana`)

### 2. Resolução de Templates

**Lógica de Negócio:**
- Templates são **do profissional**, não do paciente
- Sempre existe um template base (role)
- Pode haver template adicional de abordagem
- **Fallback automático:** Se role não tiver template → `psychology_basic`

**Fluxo:**
```
user.id → profiles.professional_role_id → professional_roles.slug
       └→ profiles.clinical_approach_id → clinical_approaches.slug

role.slug → ROLE_TO_TEMPLATE → template_id → ClinicalTemplate
approach.slug → APPROACH_TO_TEMPLATE → template_id → ClinicalTemplate
```

---

## 📚 Como Usar (Referência para Fases Futuras)

### Hook React: `useActiveClinicalTemplates()`

**NÃO USAR AINDA** nas telas clínicas (ClinicalComplaintForm, SessionEvaluationForm, ClinicalEvolution).

Esta é apenas documentação para uso futuro.

```tsx
import { useActiveClinicalTemplates } from '@/hooks/useActiveClinicalTemplates';

function MeuComponenteClinico() {
  const { 
    activeRoleTemplate,      // Template do role (ex: psychology_basic)
    activeApproachTemplate,  // Template da abordagem (ex: tcc ou null)
    activeTemplates,         // Array com todos os templates ativos
    usedFallback,            // Se usou fallback
    isLoading,
    error
  } = useActiveClinicalTemplates();

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  // Exemplo: Renderizar apenas se usuário tem psychology_basic
  if (activeRoleTemplate?.id === 'psychology_basic') {
    return <div>Renderizar form psicopatológico</div>;
  }

  return <div>Template não suportado</div>;
}
```

### Serviço: `getActiveClinicalTemplatesForUser()`

Para uso fora de componentes React:

```typescript
import { getActiveClinicalTemplatesForUser } from '@/lib/templates/templateService';

async function exemplo() {
  const userId = 'user-uuid';
  const result = await getActiveClinicalTemplatesForUser(userId);
  
  console.log('Template de role:', result.activeRoleTemplate?.label);
  console.log('Template de abordagem:', result.activeApproachTemplate?.label);
  console.log('Total de templates ativos:', result.activeTemplates.length);
}
```

---

## 🗺️ Templates Disponíveis (Estado Atual)

### `psychology_basic` (Psicopatológico Básico)

**Usado por:** Psicólogos, Psiquiatras

**Features:**
- ✅ Queixa Clínica com CID-10, sintomas, medicações
- ✅ Avaliação de Sessão com 12 funções psíquicas
- ✅ Evolução com gráficos temporais e resumo interpretativo

**Status:** Completamente implementado

### `tcc` (TCC - Stub)

**Status:** Não implementado (stub para futuro)

**Quando implementado:**
- Queixa focada em pensamentos automáticos
- Avaliação com registros cognitivos
- Evolução com gráficos de esquemas

---

## 🔍 Mapeamentos

### Role → Template

```typescript
{
  psychologist: 'psychology_basic',
  psychiatrist: 'psychology_basic',
  psychoanalyst: 'psychology_basic',
  // Roles não clínicos não têm template
}
```

### Approach → Template (Futuro)

```typescript
{
  tcc: 'tcc',  // stub
  // Outras abordagens serão adicionadas
}
```

---

## 🧪 Testes

### Executar Testes

```typescript
import { runTemplateServiceTests } from '@/lib/templates/tests/templateTests';

// No console ou useEffect de debug:
runTemplateServiceTests();
```

### Cenários Testados

1. ✅ Psicólogo → `psychology_basic`
2. ✅ Role desconhecido → fallback `psychology_basic`
3. ✅ Role `null` → fallback `psychology_basic`
4. ✅ Psicólogo com abordagem TCC → `[psychology_basic, tcc]`
5. ✅ Psiquiatra → `psychology_basic`
6. ✅ Helpers do registry funcionam corretamente

---

## ⚠️ IMPORTANTE - Estado Atual (C2.2)

### ✅ O QUE FOI FEITO

- ✅ Sistema de tipos e interfaces de templates
- ✅ Registro central de templates disponíveis
- ✅ Serviço de resolução de templates
- ✅ Hook React para acesso aos templates
- ✅ Testes de sanity-check
- ✅ Fallbacks robustos

### ❌ O QUE NÃO FOI FEITO (Propositalmente)

- ❌ **ClinicalComplaintForm** não usa templates ainda
- ❌ **SessionEvaluationForm** não usa templates ainda
- ❌ **ClinicalEvolution** não usa templates ainda
- ❌ **Patient Overview cards** não filtram por template ainda
- ❌ Banco de dados não foi alterado (sem migrations)

**Motivo:** Esta fase é apenas infra. As telas serão adaptadas nas fases C2.3 a C2.7.

---

## 🚀 Próximas Fases

### FASE C2.3 - Template Psicopatológico Básico
- Criar definição declarativa do template `psychology_basic`
- Extrair todas as constantes hardcoded (funções psíquicas, ranges, etc.)
- Preparar terreno para C2.4 e C2.5

### FASE C2.4 - ClinicalComplaintForm Template-aware
- Adaptar form de queixa para usar template
- Implementar histórico de queixas

### FASE C2.5 - SessionEvaluationForm Template-aware
- Refatorar form de avaliação (quebrar em componentes)
- Conectar com template psicopatológico

### FASE C2.6 - ClinicalEvolution Template-aware
- Adaptador de gráficos e resumos por template

### FASE C2.7 - Patient Overview Integration
- Filtrar cards por templates ativos

---

## 📝 Notas Técnicas

### Decisões de Design

1. **Templates são do profissional, não do paciente**
   - Se um psicólogo muda de abordagem, afeta todos os seus pacientes
   - Garante consistência nos dados clínicos

2. **Sempre existe um template base**
   - Nunca retorna `activeTemplates` vazio
   - Fallback para `psychology_basic` se necessário

3. **Preparado para o futuro**
   - Campo `clinical_approach_id` já está previsto
   - Sistema suporta múltiplos templates simultâneos
   - Fácil adicionar novos templates ao registry

### Compatibilidade

- ✅ Projeto compila normalmente
- ✅ Nenhuma tela clínica foi alterada
- ✅ Template Service pode ser importado mas não é obrigatório
- ✅ Pronto para uso nas próximas fases

---

## 🎓 Leitura Adicional

- `src/lib/templates/templateTypes.ts` - Tipos e interfaces
- `src/lib/templates/templateRegistry.ts` - Templates disponíveis
- `src/lib/templates/templateService.ts` - Lógica de resolução
- `src/hooks/useActiveClinicalTemplates.ts` - Hook React
- `src/lib/templates/tests/templateTests.ts` - Testes

---

**FASE C2.2 CONCLUÍDA ✅**
