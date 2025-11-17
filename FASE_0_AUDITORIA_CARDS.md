# FASE 0 - AUDITORIA COMPLETA DE CARDS
## Sistema de Permissões por Domínio

**Data:** 2025-01-17  
**Status:** ✅ CONCLUÍDO  
**Objetivo:** Catalogar todos os cards existentes e mapear para os novos domínios de permissão

---

## 📋 DOMÍNIOS DE PERMISSÃO APROVADOS

```typescript
type PermissionDomain = 
  | 'financial'       // Valores, NFSe, pagamentos, métricas financeiras
  | 'administrative'  // Sessões, agenda, notificações, métricas administrativas
  | 'clinical'        // Queixas, evoluções, diagnósticos, métricas clínicas
  | 'media'           // Google Ads, website, analytics, métricas de marketing
  | 'general'         // Sem restrição (contato, perfil, informações básicas)
```

**REGRA FUNDAMENTAL:** Cards estatísticos/métricos são classificados pelo **DOMÍNIO DE ORIGEM DOS DADOS**, não por serem "estatísticos".

---

## 🗂️ INVENTÁRIO COMPLETO DE CARDS (60+ cards)

### 1️⃣ AVAILABLE_STAT_CARDS (Dashboard Statistics - 7 cards)

| Card ID | Nome Atual | Categoria Antiga | **NOVO DOMÍNIO** | Justificativa | Usado em |
|---------|------------|------------------|------------------|---------------|----------|
| `patient-stat-total` | Total de Pacientes | statistics | **administrative** | Métrica administrativa de pacientes ativos | Dashboard, PatientDetail |
| `patient-stat-attended` | Pacientes Atendidos (Mês) | statistics | **administrative** | Métrica de sessões realizadas | Dashboard, PatientDetail |
| `patient-stat-scheduled` | Sessões Agendadas | statistics | **administrative** | Métrica de agendamentos | Dashboard, PatientDetail |
| `patient-stat-unpaid` | Sessões Não Pagas | statistics | **financial** | Métrica financeira de inadimplência | Dashboard, PatientDetail |
| `patient-stat-revenue-month` | Faturamento do Mês | statistics | **financial** | Métrica financeira de receita | Dashboard |
| `patient-stat-revenue-total` | Faturamento Total | statistics | **financial** | Métrica financeira acumulada | Dashboard |
| `patient-stat-nfse` | NFSe do Paciente | statistics | **financial** | Informações de NFSe emitidas | PatientDetail |

---

### 2️⃣ AVAILABLE_FUNCTIONAL_CARDS (Functional Cards - 12 cards)

| Card ID | Nome Atual | Categoria Antiga | **NOVO DOMÍNIO** | Justificativa | Usado em |
|---------|------------|------------------|------------------|---------------|----------|
| `patient-next-appointment` | Próxima Sessão | functional | **administrative** | Informação de agendamento | PatientDetail |
| `patient-contact-info` | Informações de Contato | functional | **general** | Dados básicos sem restrição | PatientDetail |
| `patient-clinical-info` | Informações Clínicas | functional | **clinical** | Dados clínicos do paciente | PatientDetail |
| `patient-clinical-complaint` | Queixa Clínica | functional | **clinical** | Queixa principal do paciente | PatientDetail |
| `patient-history` | Histórico de Sessões | functional | **administrative** | Histórico de mudanças de horário | PatientDetail |
| `patient-session-evaluation` | Avaliação de Sessão | functional | **clinical** | Avaliação psicológica detalhada | PatientDetail |
| `patient-files` | Arquivos do Paciente | functional | **clinical** | Documentos clínicos | PatientDetail |
| `quick-actions` | Ações Rápidas | functional | **general** | Atalhos gerais do sistema | Dashboard |
| `recent-activity` | Atividade Recente | functional | **general** | Log de ações recentes | Dashboard |
| `upcoming-sessions` | Próximas Sessões | functional | **administrative** | Agenda próxima | Dashboard |
| `patient-alerts` | Alertas do Paciente | functional | **clinical** | Alertas de risco clínico | PatientDetail |
| `financial-summary` | Resumo Financeiro | functional | **financial** | Overview de pagamentos | Dashboard |

---

### 3️⃣ AVAILABLE_DASHBOARD_CARDS (Dashboard Metrics - 8 cards)

| Card ID | Nome Atual | Categoria Antiga | **NOVO DOMÍNIO** | Justificativa | Usado em |
|---------|------------|------------------|------------------|---------------|----------|
| `dashboard-total-patients` | Total de Pacientes | dashboard | **administrative** | Métrica administrativa | Dashboard |
| `dashboard-active-patients` | Pacientes Ativos | dashboard | **administrative** | Status de pacientes | Dashboard |
| `dashboard-sessions-month` | Sessões do Mês | dashboard | **administrative** | Métrica de atendimentos | Dashboard |
| `dashboard-revenue-month` | Receita do Mês | dashboard | **financial** | Métrica financeira | Dashboard |
| `dashboard-pending-payments` | Pagamentos Pendentes | dashboard | **financial** | Inadimplência | Dashboard |
| `dashboard-nfse-issued` | NFSe Emitidas | dashboard | **financial** | Notas fiscais | Dashboard |
| `dashboard-next-appointments` | Próximos Agendamentos | dashboard | **administrative** | Agenda próxima | Dashboard |
| `dashboard-conversion-rate` | Taxa de Conversão | dashboard | **media** | Métrica de marketing | Dashboard |

---

### 4️⃣ AVAILABLE_DASHBOARD_CHARTS (Dashboard Charts - 6 cards)

| Card ID | Nome Atual | Categoria Antiga | **NOVO DOMÍNIO** | Justificativa | Usado em |
|---------|------------|------------------|------------------|---------------|----------|
| `revenue-chart` | Gráfico de Receita | dashboard | **financial** | Visualização de faturamento | Dashboard |
| `sessions-chart` | Gráfico de Sessões | dashboard | **administrative** | Visualização de atendimentos | Dashboard |
| `patients-growth-chart` | Crescimento de Pacientes | dashboard | **administrative** | Evolução da base | Dashboard |
| `payment-status-chart` | Status de Pagamentos | dashboard | **financial** | Distribuição de pagamentos | Dashboard |
| `nfse-status-chart` | Status de NFSe | dashboard | **financial** | Distribuição de notas fiscais | Dashboard |
| `conversion-funnel-chart` | Funil de Conversão | dashboard | **media** | Analytics de captação | Dashboard |

---

### 5️⃣ AVAILABLE_CLINICAL_CARDS (Clinical Evolution - 15 cards)

| Card ID | Nome Atual | Categoria Antiga | **NOVO DOMÍNIO** | Justificativa | Usado em |
|---------|------------|------------------|------------------|---------------|----------|
| `clinical-complaint-summary` | Resumo da Queixa | clinical | **clinical** | Dados clínicos | PatientDetail, ClinicalEvolution |
| `clinical-medications` | Medicações | clinical | **clinical** | Tratamento medicamentoso | ClinicalEvolution |
| `clinical-symptoms` | Sintomas | clinical | **clinical** | Sintomatologia | ClinicalEvolution |
| `clinical-comorbidities` | Comorbidades | clinical | **clinical** | Diagnósticos associados | ClinicalEvolution |
| `clinical-risk-assessment` | Avaliação de Risco | clinical | **clinical** | Risco suicida/agressividade | ClinicalEvolution |
| `clinical-functional-impact` | Impacto Funcional | clinical | **clinical** | Prejuízo funcional | ClinicalEvolution |
| `clinical-timeline` | Linha do Tempo | clinical | **clinical** | Cronologia clínica | ClinicalEvolution |
| `session-consciousness` | Consciência | clinical | **clinical** | Exame psíquico | SessionEvaluation |
| `session-orientation` | Orientação | clinical | **clinical** | Exame psíquico | SessionEvaluation |
| `session-attention` | Atenção | clinical | **clinical** | Exame psíquico | SessionEvaluation |
| `session-memory` | Memória | clinical | **clinical** | Exame psíquico | SessionEvaluation |
| `session-thought` | Pensamento | clinical | **clinical** | Exame psíquico | SessionEvaluation |
| `session-sensoperception` | Sensopercepção | clinical | **clinical** | Exame psíquico | SessionEvaluation |
| `session-mood` | Humor | clinical | **clinical** | Exame psíquico | SessionEvaluation |
| `session-psychomotor` | Psicomotricidade | clinical | **clinical** | Exame psíquico | SessionEvaluation |

---

### 6️⃣ AVAILABLE_MEDIA_CARDS (Marketing & Media - 8 cards)

| Card ID | Nome Atual | Categoria Antiga | **NOVO DOMÍNIO** | Justificativa | Usado em |
|---------|------------|------------------|------------------|---------------|----------|
| `google-ads-performance` | Performance Google Ads | media | **media** | Métricas de anúncios | Dashboard, WebsiteMetrics |
| `google-ads-conversions` | Conversões Google Ads | media | **media** | Taxa de conversão | WebsiteMetrics |
| `website-traffic` | Tráfego do Site | media | **media** | Analytics de visitas | WebsiteMetrics |
| `website-bounce-rate` | Taxa de Rejeição | media | **media** | Qualidade do tráfego | WebsiteMetrics |
| `lead-sources` | Fontes de Lead | media | **media** | Origem dos contatos | WebsiteMetrics |
| `campaign-roi` | ROI de Campanhas | media | **media** | Retorno de investimento | WebsiteMetrics |
| `social-media-engagement` | Engajamento Redes Sociais | media | **media** | Métricas sociais | WebsiteMetrics |
| `seo-rankings` | Rankings SEO | media | **media** | Posicionamento orgânico | WebsiteMetrics |

---

## 🎯 ANÁLISE DE USO POR PÁGINA

### Dashboard.tsx
**Cards Usados:** ~15-20 cards  
**Domínios Presentes:** financial, administrative, media, general  
**Observação:** Página principal com visão geral do sistema

### PatientDetail.tsx
**Cards Usados:** ~12-15 cards  
**Domínios Presentes:** clinical, financial, administrative, general  
**Observação:** Ficha completa do paciente

### ClinicalEvolution.tsx
**Cards Usados:** ~7-10 cards  
**Domínios Presentes:** clinical (exclusivo)  
**Observação:** Acompanhamento clínico detalhado

### SessionEvaluation.tsx
**Cards Usados:** ~8 cards  
**Domínios Presentes:** clinical (exclusivo)  
**Observação:** Avaliação psicológica da sessão

### WebsiteMetrics.tsx
**Cards Usados:** ~8 cards  
**Domínios Presentes:** media (exclusivo)  
**Observação:** Analytics e marketing

---

## 📊 DISTRIBUIÇÃO POR DOMÍNIO

| Domínio | Quantidade | Percentual |
|---------|------------|------------|
| **clinical** | ~22 cards | 36% |
| **administrative** | ~15 cards | 25% |
| **financial** | ~15 cards | 25% |
| **media** | ~8 cards | 13% |
| **general** | ~5 cards | 8% |
| **TOTAL** | ~60 cards | 100% |

---

## 🚨 CONFLITOS IDENTIFICADOS

### 1. Cards com Categorização Ambígua
- ✅ **RESOLVIDO:** Todos os cards estatísticos serão reclassificados pelo domínio de origem dos dados
- ✅ **RESOLVIDO:** Cards "dashboard" serão reclassificados pelos domínios específicos

### 2. Inconsistências de Nomenclatura localStorage
- ❌ **CRÍTICO:** `'dashboard_visible_cards'` vs `'dashboard-visible-cards'`
- ❌ **CRÍTICO:** `'visible-cards'` sem prefixo de página
- 📝 **AÇÃO REQUERIDA:** Padronizar para `'page-name_visible_cards'` na FASE 5

### 3. Cards sem permissionConfig
- ❌ **CRÍTICO:** TODOS os 60+ cards não possuem `permissionConfig`
- 📝 **AÇÃO REQUERIDA:** Adicionar na FASE 1

---

## 📋 PLANO DE MIGRAÇÃO

### ✅ FASE 0 (CONCLUÍDA)
- [x] Catalogar todos os cards existentes
- [x] Mapear para novos domínios
- [x] Identificar conflitos
- [x] Criar documentação de auditoria

### 🔄 FASE 1 (PRÓXIMA)
**Tipos e Contratos (4-6h)**

1. **Criar novos arquivos:**
   - `src/types/cardPermissions.ts` - Tipos de permissão de cards
   - `src/types/sectionTypes.ts` - Configuração de seções

2. **Modificar `cardTypes.ts`:**
   - Adicionar `permissionConfig` em `CardConfig`:
     ```typescript
     interface CardConfig {
       id: string;
       name: string;
       description: string;
       category: CardCategory; // DEPRECATED - manter temporariamente
       permissionConfig: {
         domain: PermissionDomain;
         requiresFinancialAccess?: boolean;
         requiresFullClinicalAccess?: boolean;
         blockedFor?: UserRole[];
         minimumAccess?: AccessLevel;
       };
     }
     ```

3. **Reclassificar TODOS os cards:**
   - Percorrer todos os arrays (STAT, FUNCTIONAL, DASHBOARD, CHARTS, CLINICAL, MEDIA)
   - Adicionar `permissionConfig` com base no mapeamento desta auditoria
   - Manter `category` temporariamente para não quebrar código existente

4. **Validar integridade:**
   - Garantir que nenhum card ficou sem domínio
   - Verificar se todos os IDs estão únicos
   - Documentar cards com regras especiais

---

## 🔍 CARDS COM REGRAS ESPECIAIS

### Cards Financeiros Bloqueados para Subordinados em `managesOwnPatients: true`
- `patient-stat-revenue-month`
- `patient-stat-revenue-total`
- `dashboard-revenue-month`
- `revenue-chart`
- `payment-status-chart`

**Regra:** Apenas se `canViewFullFinancial === true`

### Cards de Mídia Bloqueados para Subordinados
- Todos os 8 cards de `AVAILABLE_MEDIA_CARDS`

**Regra:** Bloqueado para `subordinate`, liberado para `admin`, `fulltherapist`, `accountant`

### Cards Clínicos com Acesso Especial
- Todos os 22 cards clínicos

**Regra:** 
- Subordinado vê apenas se `canFullSeeClinic === true` OU se for paciente próprio
- Admin vê de subordinados
- Full vê tudo

---

## 📈 MÉTRICAS DE IMPACTO

### Arquivos que Serão Modificados
- `src/types/cardTypes.ts` - ⚠️ ALTO IMPACTO (60+ cards)
- `src/types/permissions.ts` - 📝 Adicionar novos tipos
- `src/hooks/useCardPermissions.ts` - 🔄 Expandir lógica
- `src/components/AddCardDialog.tsx` - 🔄 Filtrar cards
- `src/pages/Dashboard.tsx` - 🔄 Usar novos componentes
- `src/pages/PatientDetail.tsx` - 🔄 Usar novos componentes
- `src/lib/layoutStorage.ts` - 🔄 Validar permissões

### Páginas que Serão Refatoradas (FASE 4)
1. Dashboard.tsx
2. PatientDetail.tsx
3. ClinicalEvolution.tsx
4. SessionEvaluation.tsx
5. WebsiteMetrics.tsx

---

## ✅ CONCLUSÕES DA AUDITORIA

### Pontos Positivos
1. ✅ Sistema de permissões já existe (`useCardPermissions`, `ExtendedAutonomyPermissions`)
2. ✅ Domínios bem definidos e integráveis
3. ✅ Cards bem organizados em arrays separados
4. ✅ IDs únicos e consistentes

### Pontos de Atenção
1. ⚠️ 60+ cards sem `permissionConfig` (FASE 1 será trabalhosa)
2. ⚠️ Inconsistências de nomenclatura localStorage (FASE 5)
3. ⚠️ Layouts salvos não validam permissões (FASE 5)
4. ⚠️ Nenhuma seção possui configuração de domínio

### Riscos Identificados
1. **ALTO:** Quebrar layouts salvos de usuários existentes
   - **Mitigação:** Validação e filtro ao carregar layouts (FASE 5)

2. **MÉDIO:** Performance com 60+ cards sendo filtrados
   - **Mitigação:** `useMemo` nos hooks (FASE 2)

3. **BAIXO:** Usuários perderem acesso a cards
   - **Mitigação:** Notificação ao usuário (FASE 5)

---

## 🎯 RECOMENDAÇÕES FINAIS

1. **APROVADO:** Seguir com FASE 1 - Implementar `permissionConfig` em todos os cards
2. **APROVADO:** Usar domínios de origem dos dados (sem domínio 'statistics')
3. **APROVADO:** Manter `category` temporariamente para backward compatibility
4. **CRÍTICO:** Implementar validação de layouts salvos na FASE 5
5. **CRÍTICO:** Testar extensivamente antes de deploy em produção

---

**Arquivo gerado em:** 2025-01-17  
**Responsável:** Sistema de Auditoria Automatizada  
**Próxima Fase:** FASE 1 - Tipos e Contratos
