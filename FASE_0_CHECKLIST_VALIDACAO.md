# ✅ FASE 0 - CHECKLIST DE VALIDAÇÃO
## Preparação e Auditoria Concluída

---

## 📊 RESUMO EXECUTIVO

### O Que Foi Feito
1. ✅ **Catalogação Completa:** 60+ cards inventariados
2. ✅ **Mapeamento de Domínios:** Todos os cards classificados nos 5 domínios aprovados
3. ✅ **Análise de Uso:** Identificado onde cada card é utilizado
4. ✅ **Identificação de Conflitos:** 3 áreas críticas mapeadas
5. ✅ **Plano de Migração:** Roadmap detalhado para as próximas fases

### Números da Auditoria
- **Total de Cards:** ~60 cards
- **Arquivos Analisados:** 6 (cardTypes.ts + 5 páginas principais)
- **Domínios Definidos:** 5 (financial, administrative, clinical, media, general)
- **Conflitos Críticos:** 3 (nomenclatura, permissionConfig ausente, validação de layouts)

---

## 🎯 DISTRIBUIÇÃO FINAL DE DOMÍNIOS

```
clinical: 36% (~22 cards)
├─ Queixas, evoluções, diagnósticos
├─ Exame psíquico (8 funções mentais)
└─ Avaliação de risco e impacto funcional

administrative: 25% (~15 cards)
├─ Sessões, agendamentos, notificações
├─ Métricas de pacientes ativos/atendidos
└─ Histórico de mudanças

financial: 25% (~15 cards)
├─ Receita, faturamento, NFSe
├─ Pagamentos pendentes e inadimplência
└─ Gráficos e métricas financeiras

media: 13% (~8 cards)
├─ Google Ads, SEO, tráfego
├─ Conversões e ROI
└─ Engajamento em redes sociais

general: 8% (~5 cards)
├─ Contato, perfil, informações básicas
└─ Ações rápidas e atividades recentes
```

---

## ✅ CHECKLIST DE VALIDAÇÃO - FASE 0

### Não Requer Testes (Fase de Planejamento)
❌ **Nenhum teste necessário nesta fase**

**Justificativa:**
- FASE 0 é apenas auditoria e documentação
- Nenhum código foi modificado
- Nenhuma funcionalidade foi alterada
- Testes serão necessários a partir da FASE 1

---

## 🚀 PRÓXIMOS PASSOS APROVADOS

### FASE 1 - Tipos e Contratos (4-6h)
**Objetivo:** Implementar `permissionConfig` em todos os 60+ cards

**Arquivos a Criar:**
1. `src/types/cardPermissions.ts`
2. `src/types/sectionTypes.ts`

**Arquivos a Modificar:**
1. `src/types/cardTypes.ts` (⚠️ ALTO IMPACTO - 60+ cards)
2. `src/types/permissions.ts` (adicionar novos tipos)

**Estrutura do permissionConfig:**
```typescript
interface CardPermissionConfig {
  domain: PermissionDomain; // financial, clinical, administrative, media, general
  requiresFinancialAccess?: boolean; // Para cards financeiros específicos
  requiresFullClinicalAccess?: boolean; // Para dados clínicos sensíveis
  blockedFor?: UserRole[]; // Bloquear roles específicas
  minimumAccess?: AccessLevel; // Nível mínimo requerido
}

interface CardConfig {
  id: string;
  name: string;
  description: string;
  category: CardCategory; // DEPRECATED - manter para backward compatibility
  permissionConfig: CardPermissionConfig; // ✨ NOVO
}
```

**Processo de Migração:**
1. Criar tipos base
2. Adicionar `permissionConfig` em `CardConfig`
3. Percorrer **TODOS** os arrays:
   - `AVAILABLE_STAT_CARDS` (7 cards)
   - `AVAILABLE_FUNCTIONAL_CARDS` (12 cards)
   - `AVAILABLE_DASHBOARD_CARDS` (8 cards)
   - `AVAILABLE_DASHBOARD_CHARTS` (6 cards)
   - `AVAILABLE_CLINICAL_CARDS` (15 cards)
   - `AVAILABLE_MEDIA_CARDS` (8 cards)
4. Aplicar o mapeamento do arquivo `FASE_0_AUDITORIA_CARDS.md`
5. Validar que nenhum card ficou sem `permissionConfig`

**Regras Especiais a Implementar:**

**1. Cards Financeiros (15 cards):**
```typescript
permissionConfig: {
  domain: 'financial',
  requiresFinancialAccess: true, // Bloqueado se hasFinancialAccess === false
  blockedFor: [], // Subordinados serão filtrados via hook
}
```

**2. Cards Clínicos (22 cards):**
```typescript
permissionConfig: {
  domain: 'clinical',
  requiresFullClinicalAccess: true, // Acesso apenas se canFullSeeClinic === true
}
```

**3. Cards de Mídia (8 cards):**
```typescript
permissionConfig: {
  domain: 'media',
  blockedFor: ['subordinate'], // Subordinados não veem marketing
}
```

**4. Cards Administrativos (15 cards):**
```typescript
permissionConfig: {
  domain: 'administrative',
  // Sem restrições especiais - todos veem suas próprias sessões/pacientes
}
```

**5. Cards Gerais (5 cards):**
```typescript
permissionConfig: {
  domain: 'general',
  // Sem restrições - informações básicas
}
```

---

## 🔍 VALIDAÇÕES CRÍTICAS PARA FASE 1

Após implementar a FASE 1, verificar:

1. ✅ **Todos os cards possuem `permissionConfig`**
   ```typescript
   const allCards = [
     ...AVAILABLE_STAT_CARDS,
     ...AVAILABLE_FUNCTIONAL_CARDS,
     ...AVAILABLE_DASHBOARD_CARDS,
     ...AVAILABLE_DASHBOARD_CHARTS,
     ...AVAILABLE_CLINICAL_CARDS,
     ...AVAILABLE_MEDIA_CARDS,
   ];
   
   const cardsWithoutPermission = allCards.filter(c => !c.permissionConfig);
   console.assert(cardsWithoutPermission.length === 0, 'Cards sem permissionConfig!');
   ```

2. ✅ **IDs únicos mantidos**
   ```typescript
   const ids = allCards.map(c => c.id);
   const uniqueIds = new Set(ids);
   console.assert(ids.length === uniqueIds.size, 'IDs duplicados!');
   ```

3. ✅ **Domínios válidos**
   ```typescript
   const validDomains: PermissionDomain[] = ['financial', 'clinical', 'administrative', 'media', 'general'];
   const invalidCards = allCards.filter(c => !validDomains.includes(c.permissionConfig.domain));
   console.assert(invalidCards.length === 0, 'Domínios inválidos!');
   ```

4. ✅ **Backward compatibility**
   ```typescript
   // category deve existir temporariamente
   const cardsWithoutCategory = allCards.filter(c => !c.category);
   console.assert(cardsWithoutCategory.length === 0, 'Cards sem category para backward compatibility!');
   ```

---

## 🎯 EXEMPLO DE CARD MIGRADO

### ANTES (Estado atual):
```typescript
{
  id: 'patient-stat-revenue-month',
  name: 'Faturamento do Mês',
  description: 'Total faturado no mês atual',
  category: 'statistics', // ❌ Categorização antiga e ambígua
}
```

### DEPOIS (Após FASE 1):
```typescript
{
  id: 'patient-stat-revenue-month',
  name: 'Faturamento do Mês',
  description: 'Total faturado no mês atual',
  category: 'statistics', // DEPRECATED - manter para backward compatibility
  permissionConfig: {
    domain: 'financial', // ✅ Classificado pela ORIGEM dos dados
    requiresFinancialAccess: true, // ✅ Requer hasFinancialAccess === true
    minimumAccess: 'read', // ✅ Nível mínimo de permissão
  }
}
```

---

## 📋 IMPACTO ESPERADO DA FASE 1

### Arquivos Modificados
- ✅ `src/types/cardPermissions.ts` (NOVO)
- ✅ `src/types/sectionTypes.ts` (NOVO)
- ⚠️ `src/types/cardTypes.ts` (MODIFICAÇÃO GRANDE - 60+ cards)
- ✅ `src/types/permissions.ts` (adicionar tipos)

### Funcionalidade Impactada
- ❌ **Nenhuma funcionalidade quebrada** (apenas adição de propriedades)
- ✅ **Backward compatibility mantida** (`category` preservada)
- ✅ **Preparação para FASE 2** (hook consumirá `permissionConfig`)

### Riscos
- 🟢 **BAIXO:** Apenas adicionar propriedades, não remover
- 🟢 **BAIXO:** Código existente não usa `permissionConfig` ainda
- 🟡 **MÉDIO:** Trabalho manual em 60+ cards (risco de erro humano)

### Mitigações
- ✅ Script de validação automática
- ✅ TypeScript detectará cards sem `permissionConfig`
- ✅ Testes unitários na FASE 2 validarão a integridade

---

## 🚨 DECISÕES CRÍTICAS TOMADAS

### 1. ✅ SEM Domínio 'statistics'
**Decisão:** Todos os cards estatísticos classificados pela **ORIGEM dos dados**  
**Aprovação:** ✅ Usuário confirmou explicitamente

### 2. ✅ Manter `category` temporariamente
**Decisão:** Não remover `category` ainda para evitar quebras  
**Remoção:** FASE 5 (após migração completa)

### 3. ✅ Usar `permissionConfig` como objeto
**Decisão:** Mais flexível que apenas `domain: string`  
**Vantagem:** Permite regras granulares (`requiresFinancialAccess`, `blockedFor`, etc.)

### 4. ✅ Validação no hook, não no card
**Decisão:** Cards são dados, lógica no `useCardPermissions`  
**Arquitetura:** Separação de responsabilidades

---

## ✅ STATUS FINAL DA FASE 0

| Item | Status | Observações |
|------|--------|-------------|
| Catalogação de Cards | ✅ CONCLUÍDO | 60+ cards mapeados |
| Classificação de Domínios | ✅ CONCLUÍDO | 5 domínios definidos |
| Análise de Uso | ✅ CONCLUÍDO | Páginas identificadas |
| Identificação de Conflitos | ✅ CONCLUÍDO | 3 áreas críticas |
| Plano de Migração | ✅ CONCLUÍDO | 5 fases detalhadas |
| Documentação | ✅ CONCLUÍDO | 2 arquivos gerados |
| Testes Necessários | ❌ NÃO APLICÁVEL | Fase de planejamento |

---

## 🎯 APROVAÇÃO PARA FASE 1

**FASE 0 está 100% concluída e validada.**  
**Pronto para iniciar FASE 1 - Tipos e Contratos.**

**Tempo estimado FASE 1:** 4-6 horas  
**Risco:** 🟢 BAIXO (apenas adição de propriedades)

---

**Aguardando comando do usuário para:**
- ✅ "Iniciar FASE 1"
- ✅ "Revisar auditoria da FASE 0"
- ✅ "Adicionar contexto atualizado"
