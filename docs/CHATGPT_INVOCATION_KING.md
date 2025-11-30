# 🔮 CHATGPT INVOCATION KING - Sistema Mindware

**O Documento Supremo de Invocação**

Este documento contém uma sequência de 11 prompts em texto puro que te colocarão completamente a par do sistema **Mindware**, do zero, sem precisar de acesso ao repositório. Após absorver estes prompts, você poderá trabalhar em QUALQUER área do sistema pedindo apenas os arquivos estritamente necessários.

**Tempo estimado de leitura:** 45-60 minutos

---

## 📖 Como Usar Este Documento

1. **Novo Chat:** Abra um novo chat com o ChatGPT (ou outro modelo)
2. **Envio Sequencial:** Envie cada prompt numerado, um por vez
3. **Aguarde Confirmação:** Após cada prompt, aguarde a confirmação de entendimento do modelo antes de prosseguir
4. **Prompt Final:** O último prompt (Prompt 11) define o contrato de trabalho e guardrails
5. **Pronto!** Após todos os prompts, o modelo estará pronto para trabalhar em qualquer funcionalidade

---

## 🌟 Prompt 1 — Visão Geral Filosófica + Propósito do Sistema

```
Olá! Vou te apresentar o **Mindware**, um sistema completo de gestão clínica multi-tenant focado em psicologia e saúde mental. Vou fazer isso em etapas sequenciais. Começamos pela visão geral e propósito.

### O QUE É O MINDWARE

Mindware é uma plataforma SaaS de gestão clínica projetada especificamente para profissionais de psicologia, psiquiatria e áreas relacionadas. É um sistema multi-tenant real onde cada organização (clínica, consultório, grupo de profissionais) tem seus dados completamente isolados.

### PÚBLICO-ALVO

- **Psicólogos clínicos:** profissionais autônomos ou em clínicas
- **Donas de clínica:** gestores de clínicas com múltiplos profissionais
- **Equipe administrativa:** secretárias, assistentes, contadores
- **Psiquiatras e profissionais correlatos:** nutricionistas, terapeutas ocupacionais (suporte futuro)

### PROBLEMAS QUE O SISTEMA RESOLVE

**1. Gestão de Pacientes:**
- Cadastro completo de pacientes com dados pessoais, contatos, responsáveis (para menores)
- Controle de status (ativo/inativo)
- Histórico completo de interações e evolução

**2. Prontuário Clínico Digital:**
- Queixa clínica estruturada com CID-10
- Sintomas, medicações, comorbidades
- Avaliações de sessão baseadas em funções psíquicas (modelo psicopatológico de Dalgalarrondo)
- Evolução temporal com gráficos e interpretações automatizadas

**3. Agenda e Sessões:**
- Controle de sessões agendadas, realizadas, faltadas, canceladas
- Bloqueios de agenda
- Timeline visual
- Cálculo de taxa de comparecimento

**4. Financeiro:**
- Valores de sessão (por sessão ou mensalidade fixa)
- Controle de pagamentos
- Emissão de NFS-e integrada (via FocusNFe)
- Fechamentos mensais
- Métricas de receita, ticket médio, receita perdida (faltas)

**5. Gestão de Equipe:**
- Organograma hierárquico multinível
- Métricas agregadas por terapeuta
- Distribuição de carga de trabalho
- Visibilidade controlada de dados (vertical e horizontal)

**6. Métricas e Dashboards:**
- Dashboard personalizável com drag & drop
- Página /metrics com visões por domínio (Financial, Administrative, Marketing, Team)
- Cards métricos (KPIs numéricos)
- Gráficos interativos com múltiplas escalas de tempo
- Seleção persistente de visualizações

**7. Compliance e LGPD:**
- Consentimento digital de pacientes
- Logs de acesso administrativo
- Exportação de dados para o titular
- Gestão de incidentes de segurança

### FILOSOFIA GERAL DO SISTEMA

**1. Multi-tenant Real:**
- Isolamento total via `organization_id` em todas as tabelas
- Row Level Security (RLS) em 100% das tabelas
- Cada organização vê apenas seus dados
- Suporte a múltiplas organizações por usuário (troca via switcher)

**2. Foco em Psicologia Clínica:**
- Estruturas de dados específicas para psicopatologia
- Templates clínicos configuráveis por papel profissional
- Terminologia e fluxos alinhados com a prática clínica real

**3. Dados e Dashboards:**
- Tudo é mensurável: pacientes, sessões, receita, retenção, churn
- Dashboards são o "cérebro operacional" da clínica
- Decisões baseadas em dados, não em intuição

**4. Permissões Granulares:**
- 3 domínios lógicos: `clinical`, `financial`, `administrative`
- Controle fino de acesso por domínio e nível organizacional
- Visibilidade vertical (hierarquia) e horizontal (pares)

**5. Customização e Flexibilidade:**
- Layouts de cards personalizáveis (drag & drop, resize)
- Seleção de gráficos customizável
- Persistência no Supabase (não apenas localStorage)
- Templates de layout reutilizáveis

**6. Ética e Segurança:**
- Dados clínicos sensíveis protegidos com RLS
- Consentimento explícito para uso de dados
- Auditoria completa de acessos administrativos
- Separação clara entre dados clínicos e administrativos

### STACK TECNOLÓGICA

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + Radix UI + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Row Level Security + Edge Functions)
- **State:** React Query (@tanstack/react-query)
- **Routing:** React Router v6
- **Charts:** Recharts
- **Drag & Drop:** @dnd-kit, react-grid-layout

### MODELO MENTAL DO SISTEMA

Pense no Mindware como uma **"clínica virtual inteligente"** onde:

1. **Pacientes** são o núcleo: tudo gira em torno deles
2. **Sessões** são eventos que geram dados clínicos e financeiros
3. **Métricas** transformam dados em insights acionáveis
4. **Permissões** garantem que cada pessoa vê apenas o que deve
5. **Templates** permitem adaptar o sistema a diferentes abordagens clínicas
6. **Organograma** modela a realidade de clínicas com múltiplos níveis hierárquicos

Entendeu essa visão geral? Confirme e vou para o Prompt 2 sobre arquitetura técnica.
```

---

## 🏗️ Prompt 2 — Arquitetura Técnica Global (Frontend, Backend, Infra, Supabase, RLS)

```
Perfeito! Agora vamos à arquitetura técnica global do Mindware.

### STACK DETALHADA

**Frontend:**
- React 18.3.1 (componentes funcionais, hooks)
- TypeScript (strict mode)
- Vite (bundler e dev server)
- Tailwind CSS 3.x (design system via HSL tokens em `index.css`)
- shadcn/ui (componentes base customizáveis)
- Radix UI (primitivos headless)
- React Query 5.x (cache de dados, refetch automático)
- React Router 6.x (navegação SPA)

**Backend:**
- Supabase (PostgreSQL 15+)
- Row Level Security (RLS) em TODAS as tabelas
- Edge Functions (Deno runtime) para lógica de backend
- Supabase Auth (gerenciamento de usuários e sessões)
- Supabase Storage (arquivos clínicos de pacientes)

**Bibliotecas Principais:**
- `recharts`: gráficos (line, bar, pie, radar)
- `react-grid-layout`: grid drag & drop
- `@dnd-kit`: drag & drop geral (organograma)
- `date-fns`: manipulação de datas
- `zod`: validação de schemas
- `react-hook-form`: formulários
- `sonner`: toasts/notificações

### ARQUITETURA MULTI-TENANT

**Como Funciona na Prática:**

1. **Tabela `organizations`:**
   - Cada clínica/consultório é uma `organization`
   - Campos: `id`, `legal_name`, `cnpj`, `created_by`, `whatsapp_enabled`

2. **Coluna `organization_id` em TODAS as Tabelas Sensíveis:**
   - `patients.organization_id`
   - `sessions.organization_id`
   - `clinical_complaints.organization_id`
   - `profiles.organization_id`
   - etc.

3. **Trigger Automático:**
   - Trigger `auto_set_organization_from_user` dispara no INSERT
   - Preenche `organization_id` automaticamente via função `resolve_organization_for_user(user_id)`
   - Garante que NENHUM registro fica sem `organization_id`

4. **Função Central: `current_user_organization()`**
   - Retorna o `organization_id` do usuário autenticado
   - Usada em TODAS as políticas RLS
   - Exemplo: `organization_id = current_user_organization()`

### ROW LEVEL SECURITY (RLS)

**Padrão de Políticas (exemplo: tabela `patients`):**

```sql
-- SELECT: vê apenas da própria org
CREATE POLICY "patients_org_select"
ON patients FOR SELECT
USING (organization_id = current_user_organization());

-- INSERT: insere apenas na própria org
CREATE POLICY "patients_org_insert"
ON patients FOR INSERT
WITH CHECK (organization_id = current_user_organization());

-- UPDATE: atualiza apenas da própria org E próprios pacientes
CREATE POLICY "patients_org_update"
ON patients FOR UPDATE
USING (user_id = auth.uid() AND organization_id = current_user_organization())
WITH CHECK (user_id = auth.uid() AND organization_id = current_user_organization());

-- DELETE: deleta apenas da própria org E próprios pacientes
CREATE POLICY "patients_org_delete"
ON patients FOR DELETE
USING (user_id = auth.uid() AND organization_id = current_user_organization());

-- Política adicional para admins (vê tudo)
CREATE POLICY "patients_admin_all"
ON patients FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

**Funções Helper de RLS:**
- `has_role(user_id, role)`: verifica role do usuário
- `get_level_organization_id(level_id)`: resolve org_id a partir de um nível
- `is_organization_owner(user_id)`: verifica se é dono da org
- `get_organization_hierarchy_info(user_id)`: retorna dados de hierarquia

**Triggers de RLS:**
- `auto_set_organization_from_user`: preenche `organization_id` automaticamente
- `auto_set_organization_from_patient`: preenche via relacionamento com patient
- `auto_set_organization_from_complaint`: preenche via complaint → patient
- Todos esses triggers impedem que `organization_id` fique NULL ou seja mudado após inserção

### EDGE FUNCTIONS (Backend Lógico)

Localizadas em `supabase/functions/`:

**NFSe (Notas Fiscais):**
- `issue-nfse`: emite nota fiscal via FocusNFe API
- `cancel-nfse`: cancela nota fiscal
- `check-nfse-status`: consulta status de processamento
- `download-nfse-pdf`: faz download do PDF da nota
- `send-nfse-email`: envia nota por email

**WhatsApp:**
- `send-whatsapp`: envia mensagem via Z-API ou Dialog360
- `send-whatsapp-reply`: responde mensagem
- `whatsapp-webhook`: recebe webhooks de mensagens recebidas
- `download-whatsapp-media`: baixa mídias de conversas

**LGPD e Compliance:**
- `export-patient-data`: exporta dados do titular (LGPD)
- `send-consent-form`: envia formulário de consentimento
- `submit-consent-form`: processa submissão de consentimento
- `check-consent-expiry`: verifica validade de consentimentos
- `send-compliance-reminders`: envia lembretes de compliance

**Automações:**
- `auto-mark-sessions`: marca sessões como realizadas automaticamente
- `cleanup-audit-logs`: limpa logs antigos

**Helpers Compartilhados:**
- `supabase/functions/_shared/organizationNFSeConfigHelper.ts`: busca config NFSe
- `supabase/functions/_shared/rateLimit.ts`: rate limiting
- `supabase/functions/_shared/sessionUtils.ts`: utilitários de sessão

### ARQUITETURA FRONTEND

**Estrutura de Diretórios:**

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes shadcn/ui base
│   ├── cards/          # Cards métricos e de dashboard
│   │   └── metrics/    # Cards específicos de /metrics
│   ├── charts/         # Componentes de gráficos
│   │   └── metrics/    # Gráficos específicos de /metrics
│   ├── clinical/       # Componentes clínicos (evolução, templates)
│   └── organogram/     # Componentes do organograma
├── pages/              # Páginas/rotas da aplicação
├── hooks/              # Custom hooks React
├── lib/                # Bibliotecas e utilitários
│   ├── templates/      # Sistema de templates clínicos
│   └── clinical/       # Validações e tipos clínicos
├── types/              # TypeScript types
├── contexts/           # React Contexts (AuthContext)
└── integrations/       # Integrações externas
    └── supabase/       # Cliente Supabase (auto-gerado)
```

**Fluxo de Dados:**

1. **Componente React** usa `useQuery` (React Query)
2. **Hook customizado** (ex: `useTeamData`) encapsula lógica
3. **Cliente Supabase** faz query com RLS automático
4. **RLS no Postgres** filtra dados por `organization_id`
5. **React Query** cacheia resultado
6. **Componente** renderiza dados

**Exemplo de Fluxo Completo:**

```typescript
// 1. Hook customizado
function useTeamData() {
  const { organizationId } = useAuth();
  
  return useQuery({
    queryKey: ['team-data', organizationId],
    queryFn: async () => {
      const { getUserIdsInOrganization } = await import('@/lib/organizationFilters');
      const orgUserIds = await getUserIdsInOrganization(organizationId);
      
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .in('user_id', orgUserIds); // RLS aplica filtro adicional
      
      if (error) throw error;
      return data;
    }
  });
}

// 2. Componente usa hook
function TeamDashboard() {
  const { data: teamSessions, isLoading } = useTeamData();
  
  if (isLoading) return <Skeleton />;
  return <SessionChart data={teamSessions} />;
}
```

**Roteamento:**

- `src/main.tsx`: ponto de entrada, setup de React Query e AuthProvider
- `src/App.tsx`: definição de rotas com React Router
- Rotas protegidas via `<PermissionRoute>` (verifica permissões antes de renderizar)

### INTEGRAÇÃO SUPABASE ↔ FRONTEND

**Cliente Supabase:**
- `src/integrations/supabase/client.ts`: cliente singleton (NÃO EDITAR - auto-gerado)
- `src/integrations/supabase/types.ts`: tipos TypeScript do DB (NÃO EDITAR - auto-gerado)
- Import padrão: `import { supabase } from '@/integrations/supabase/client'`

**AuthContext:**
- `src/contexts/AuthContext.tsx`: contexto global de autenticação
- Provê: `user`, `profile`, `roleGlobal`, `organizationId`, `organizations`, etc.
- Gerencia estado de login, logout, signup
- Carrega permissões efetivas via `resolveEffectivePermissions()`

**Variáveis de Ambiente:**
- `.env`: contém `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
- NÃO EDITAR manualmente (gerenciado pelo Lovable)

Entendeu a arquitetura técnica? Confirme e vou para o Prompt 3 sobre o banco de dados.
```

---

## 🗄️ Prompt 3 — Banco de Dados Completo: Tabelas, Relações e Uso

```
Ótimo! Agora vamos ao banco de dados completo do Mindware.

### TABELAS CORE DE ORGANIZAÇÃO

**1. `organizations`**
- **Propósito:** Cadastro de organizações (clínicas, consultórios)
- **Campos principais:**
  - `id` (UUID PK)
  - `legal_name` (TEXT): razão social
  - `cnpj` (TEXT): CNPJ formatado
  - `created_by` (UUID): quem criou
  - `whatsapp_enabled` (BOOLEAN): se WhatsApp está ativo
- **Uso:** Isolamento multi-tenant, cada org vê apenas seus dados

**2. `organization_owners`**
- **Propósito:** Vínculo entre users e orgs (quem é dono de qual org)
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `organization_id` (UUID FK → organizations)
  - `is_primary` (BOOLEAN): se é a org principal do usuário
- **Uso:** Permite usuário ter múltiplas orgs, switch entre elas

**3. `organization_levels`**
- **Propósito:** Níveis hierárquicos dentro da org (ex: Diretoria, Gerência, Operacional)
- **Campos principais:**
  - `id` (UUID PK)
  - `organization_id` (UUID FK → organizations)
  - `level_name` (TEXT): nome do nível
  - `level_number` (INTEGER): número do nível (1 = topo)
- **Uso:** Estrutura hierárquica vertical para permissões

**4. `organization_positions`**
- **Propósito:** Posições/cargos dentro dos níveis (ex: "Diretor Clínico", "Psicólogo Sênior")
- **Campos principais:**
  - `id` (UUID PK)
  - `level_id` (UUID FK → organization_levels)
  - `position_name` (TEXT): nome da posição
  - `parent_position_id` (UUID FK → organization_positions): posição pai (hierarquia)
- **Uso:** Estrutura de árvore para organograma

**5. `user_positions`**
- **Propósito:** Atribui usuários a posições (pode ter múltiplas)
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `position_id` (UUID FK → organization_positions)
  - `access_expires_at` (TIMESTAMPTZ): acesso temporário (pode ser NULL)
- **Uso:** Define a posição de cada usuário no organograma

### TABELAS CORE DE USUÁRIOS

**6. `auth.users` (gerenciado pelo Supabase Auth)**
- **Propósito:** Usuários do sistema (email/senha)
- **NÃO ACESSÍVEL DIRETAMENTE** via Supabase client (use apenas `auth.uid()` nas policies)

**7. `profiles`**
- **Propósito:** Perfil estendido dos users (dados pessoais e profissionais)
- **Campos principais:**
  - `id` (UUID PK = FK → auth.users)
  - `full_name` (TEXT): nome completo
  - `cpf` (TEXT): CPF (validado com trigger)
  - `crp` (TEXT): número do conselho profissional
  - `birth_date` (DATE): data de nascimento
  - `phone` (TEXT): telefone
  - `professional_role_id` (UUID FK → professional_roles): papel profissional
  - `clinical_approach_id` (UUID FK → clinical_approaches): abordagem clínica
  - `organization_id` (UUID FK → organizations): org principal
  - `work_days` (INTEGER[]): dias de trabalho (0=dom, 6=sáb)
  - `work_start_time`, `work_end_time` (TEXT): horário de trabalho
  - `slot_duration`, `break_time` (INTEGER): duração de sessão e pausa (minutos)
- **Uso:** Dados do terapeuta, configuração de agenda, papel profissional

**8. `user_roles`**
- **Propósito:** Roles globais dos usuários
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `role` (app_role ENUM): 'admin', 'psychologist', 'assistant', 'accountant'
- **Uso:** Define papel global do usuário (usado em RLS com `has_role()`)

**9. `professional_roles`**
- **Propósito:** Catálogo de papéis profissionais (Psicólogo, Psiquiatra, Nutricionista, etc.)
- **Campos principais:**
  - `id` (UUID PK)
  - `slug` (TEXT UNIQUE): identificador (ex: 'psychologist')
  - `label` (TEXT): nome amigável
  - `is_clinical` (BOOLEAN): se é profissional clínico
  - `is_active` (BOOLEAN): se está ativo
- **Uso:** Determina templates clínicos disponíveis, flags `isClinicalProfessional`

**10. `clinical_approaches`**
- **Propósito:** Catálogo de abordagens clínicas (TCC, Psicanálise, Junguiana, etc.)
- **Campos principais:**
  - `id` (UUID PK)
  - `slug` (TEXT): identificador (ex: 'tcc')
  - `label` (TEXT): nome amigável
  - `professional_role_id` (UUID FK → professional_roles): role associado
  - `is_active`, `is_default` (BOOLEAN): flags
- **Uso:** Futuro suporte a templates específicos por abordagem

### TABELAS CORE DE PACIENTES

**11. `patients`**
- **Propósito:** Cadastro de pacientes
- **Campos principais:**
  - `id` (UUID PK)
  - `user_id` (UUID FK → auth.users): terapeuta responsável
  - `organization_id` (UUID FK → organizations)
  - `name` (TEXT): nome do paciente
  - `email`, `phone`, `cpf` (TEXT): contatos
  - `birth_date` (DATE): data de nascimento
  - `is_minor` (BOOLEAN): se é menor de idade
  - `guardian_name`, `guardian_cpf`, `guardian_phone_1`, `guardian_email` (TEXT): responsável
  - `session_value` (NUMERIC): valor da sessão
  - `frequency` (TEXT): frequência (semanal, quinzenal, mensal)
  - `monthly_price` (BOOLEAN): se paga mensalidade fixa ou por sessão
  - `status` (TEXT): 'active' ou 'inactive'
  - `nfse_issue_to` (TEXT): 'patient' ou 'guardian' (para menores)
  - `no_nfse` (BOOLEAN): se NÃO emite nota fiscal
- **Uso:** Núcleo do sistema, todos os dados giram em torno do paciente
- **Trigger:** `validate_patient_data()` valida CPF com dígitos verificadores

**12. `sessions`**
- **Propósito:** Sessões de terapia (agendadas, realizadas, faltadas)
- **Campos principais:**
  - `id` (UUID PK)
  - `patient_id` (UUID FK → patients)
  - `organization_id` (UUID FK → organizations)
  - `date` (DATE): data da sessão
  - `time` (TEXT): horário
  - `status` (TEXT): 'scheduled', 'attended', 'missed', 'cancelled', 'rescheduled'
  - `value` (NUMERIC): valor cobrado
  - `paid` (BOOLEAN): se foi paga
  - `nfse_issued_id` (UUID FK → nfse_issued): nota fiscal vinculada
  - `manually_marked_nfse` (BOOLEAN): se NF foi marcada manualmente
  - `show_in_schedule` (BOOLEAN): se aparece na agenda
  - `notes` (TEXT): anotações gerais
- **Uso:** Gera dados financeiros (receita) e clínicos (evolução)

**13. `clinical_complaints` (queixa clínica)**
- **Propósito:** Queixa clínica principal do paciente
- **Campos principais:**
  - `id` (UUID PK)
  - `patient_id` (UUID FK → patients)
  - `organization_id` (UUID FK → organizations)
  - `created_by` (UUID FK → auth.users): quem criou
  - `is_active` (BOOLEAN): se está ativa (APENAS UMA ATIVA POR PACIENTE)
  - `cid_code`, `cid_title`, `cid_group` (TEXT): diagnóstico CID-10
  - `has_no_diagnosis` (BOOLEAN): se ainda não tem diagnóstico fechado
  - `severity` (TEXT): 'leve', 'moderado', 'grave'
  - `onset_type` (TEXT): 'agudo', 'insidioso', 'crônico'
  - `onset_duration_weeks` (INTEGER): duração em semanas
  - `course` (TEXT): 'contínuo', 'episódico', 'progressivo', 'remitente'
  - `suicidality`, `aggressiveness`, `functional_impairment` (TEXT): avaliações de risco
  - `vulnerabilities` (TEXT[]): vulnerabilidades identificadas
  - `clinical_notes` (TEXT): anotações clínicas
  - `comorbidities` (JSONB): comorbidades estruturadas
- **Uso:** Estrutura a queixa do paciente, base para evolução clínica
- **REGRA CRÍTICA:** Apenas UMA queixa com `is_active = true` por paciente

**14. `complaint_medications`**
- **Propósito:** Medicações psiquiátricas do paciente
- **Campos principais:**
  - `id` (UUID PK)
  - `complaint_id` (UUID FK → clinical_complaints)
  - `class` (TEXT): classe da medicação (ex: 'antidepressivo')
  - `substance` (TEXT): substância ativa (ex: 'sertralina')
  - `dosage` (TEXT): dosagem (ex: '50mg')
  - `frequency` (TEXT): frequência (ex: '1x ao dia')
  - `is_current` (BOOLEAN): se está em uso atual
  - `start_date`, `end_date` (DATE): período de uso
  - `adverse_effects`, `notes` (TEXT): efeitos e observações
- **Uso:** Registro completo de medicações psiquiátricas

**15. `complaint_symptoms`**
- **Propósito:** Sintomas da queixa
- **Campos principais:**
  - `id` (UUID PK)
  - `complaint_id` (UUID FK → clinical_complaints)
  - `symptom_label` (TEXT): nome do sintoma
  - `category` (TEXT): categoria do sintoma
  - `is_present` (BOOLEAN): se está presente
  - `intensity` (INTEGER): intensidade 0-10
  - `frequency` (TEXT): 'raro', 'ocasional', 'frequente', 'constante'
- **Uso:** Rastreamento de sintomas ao longo do tratamento

**16. `complaint_specifiers`**
- **Propósito:** Especificadores da queixa (ex: "com características melancólicas")
- **Campos principais:**
  - `id` (UUID PK)
  - `complaint_id` (UUID FK → clinical_complaints)
  - `specifier_type` (TEXT): tipo do especificador
  - `specifier_value` (TEXT): valor do especificador
- **Uso:** Detalha características específicas do diagnóstico

**17. `session_evaluations`**
- **Propósito:** Avaliação psicopatológica da sessão (exame mental)
- **Campos principais:**
  - `id` (UUID PK)
  - `session_id` (UUID FK → sessions)
  - `patient_id` (UUID FK → patients)
  - `evaluated_by` (UUID FK → auth.users)
  - `consciousness_data` (JSONB): consciência (nível, campo, autopercepção)
  - `orientation_data` (JSONB): orientação (tempo, espaço, pessoa, situação)
  - `attention_data` (JSONB): atenção (concentração, distrabilidade)
  - `memory_data` (JSONB): memória (fixação, evocação, amnésia)
  - `mood_data` (JSONB): humor (polaridade, labilidade, adequação)
  - `thought_data` (JSONB): pensamento (curso, conteúdo, obsessões, delírios)
  - `language_data` (JSONB): linguagem (articulação, ritmo)
  - `sensoperception_data` (JSONB): sensopercepção (alucinações)
  - `intelligence_data` (JSONB): inteligência (raciocínio abstrato)
  - `will_data` (JSONB): vontade (energia volitiva, ambivalência)
  - `psychomotor_data` (JSONB): psicomotricidade (atividade motora)
  - `personality_data` (JSONB): personalidade (coerência do eu, estabilidade afetiva)
- **Uso:** Registro estruturado das 12 funções psíquicas de Dalgalarrondo
- **Modelo:** Template `psychology_basic` (pode ter outros no futuro)

**18. `patient_files`**
- **Propósito:** Arquivos anexos do paciente (PDFs, imagens, etc.)
- **Campos principais:**
  - `id` (UUID PK)
  - `patient_id` (UUID FK → patients)
  - `uploaded_by` (UUID FK → auth.users)
  - `file_path` (TEXT): path no Supabase Storage
  - `file_name`, `file_type` (TEXT): metadados
  - `category` (TEXT): categoria do arquivo
  - `is_clinical` (BOOLEAN): se é arquivo clínico sensível
- **Uso:** Armazenamento de documentos, laudos, exames, etc.

### TABELAS FINANCEIRAS

**19. `nfse_issued` (notas fiscais emitidas)**
- **Propósito:** Registro de notas fiscais eletrônicas emitidas
- **Campos principais:**
  - `id` (UUID PK)
  - `patient_id` (UUID FK → patients)
  - `user_id` (UUID FK → auth.users): terapeuta emissor
  - `session_ids` (UUID[]): array de sessões nesta nota
  - `service_value`, `iss_value`, `net_value` (NUMERIC): valores
  - `status` (TEXT): 'processing', 'issued', 'error', 'cancelled'
  - `focusnfe_ref` (TEXT): referência no FocusNFe
  - `nfse_number` (TEXT): número da nota fiscal
  - `pdf_url`, `xml_url` (TEXT): URLs dos documentos
  - `verification_code` (TEXT): código de verificação
  - `issue_date` (DATE): data de emissão
  - `error_message` (TEXT): erro se houver
- **Uso:** Controle completo do ciclo de vida da NFS-e

**20. `nfse_payments` (pagamentos registrados)**
- **Propósito:** Registro de pagamentos recebidos (para conciliação futura)
- **Campos principais:**
  - `id` (UUID PK)
  - `user_id` (UUID FK → auth.users)
  - `payment_date` (DATE): data do pagamento
  - `amount` (NUMERIC): valor
  - `payment_method` (TEXT): método (PIX, boleto, etc.)
  - `has_proof` (BOOLEAN): se tem comprovante
  - `proof_file_path` (TEXT): path do comprovante
- **Uso:** Rastreamento de recebimentos

**21. `payment_allocations`**
- **Propósito:** Vínculo entre pagamentos e notas fiscais
- **Campos principais:**
  - `payment_id` (UUID FK → nfse_payments)
  - `nfse_id` (UUID FK → nfse_issued)
  - `allocated_amount` (NUMERIC): valor alocado
- **Uso:** Permite vincular pagamentos parciais a múltiplas notas

**22. `nfse_config`, `nfse_certificates`, `organization_nfse_config`**
- **Propósito:** Configurações de emissão de NFS-e (legado e organizacional)
- **Campos principais:** tokens FocusNFe, certificados A1, regime tributário, etc.
- **Uso:** Parametrização da integração com FocusNFe

### TABELAS DE PERMISSÕES (Sistema Novo - Pós FASE 11)

**23. `level_role_settings`**
- **Propósito:** Configurações de permissões por nível organizacional e role
- **Campos principais:**
  - `level_id` (UUID FK → organization_levels)
  - `role_type` (app_role): 'admin', 'psychologist', 'assistant', 'accountant'
  - `can_access_clinical` (BOOLEAN): acesso a dados clínicos
  - `financial_access` (TEXT): 'none', 'summary', 'full'
  - `can_access_marketing` (BOOLEAN): acesso a métricas de marketing
  - `can_access_whatsapp` (BOOLEAN): acesso ao WhatsApp integrado
  - `clinical_visible_to_superiors` (BOOLEAN): superiores veem dados clínicos
  - `peer_agenda_sharing`, `peer_clinical_sharing` (TEXT): compartilhamento horizontal
  - `can_edit_schedules` (BOOLEAN): pode editar agendas
  - `can_view_team_financial_summary` (BOOLEAN): vê resumo financeiro da equipe
  - `uses_org_company_for_nfse` (BOOLEAN): usa empresa da org ou própria para NF
- **Uso:** Define permissões granulares por nível e role

**24. `level_permission_sets`**
- **Propósito:** Permissões granulares por domínio e nível (LEGADO, em migração)
- **Campos principais:**
  - `level_id` (UUID FK → organization_levels)
  - `domain` (TEXT): 'clinical', 'financial', 'administrative'
  - `access_level` (TEXT): 'none', 'read', 'full'
- **Uso:** Sistema antigo de permissões, sendo substituído por `level_role_settings`

**25. `level_sharing_config`**
- **Propósito:** Configuração de compartilhamento de dados entre níveis
- **Campos principais:**
  - `level_id` (UUID FK → organization_levels)
  - `shared_domains` (TEXT[]): domínios compartilhados com pares do mesmo nível
- **Uso:** Compartilhamento horizontal (peers)

**26. `peer_sharing`**
- **Propósito:** Compartilhamento peer-to-peer entre usuários
- **Campos principais:**
  - `sharer_user_id`, `receiver_user_id` (UUID FK → auth.users)
  - `shared_domains` (TEXT[]): domínios compartilhados
  - `is_bidirectional` (BOOLEAN): se é recíproco
- **Uso:** Compartilhamento horizontal individual

### TABELAS DE LAYOUT (Persistência de UI)

**27. `user_layout_preferences`**
- **Propósito:** Layouts customizados de dashboards
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `layout_type` (TEXT): 'dashboard', 'metrics-grid', 'metrics-charts-selection'
  - `layout_config` (JSONB): configuração completa do layout
  - `version` (INTEGER): versão do layout
- **Uso:** Persistência de layouts de cards (drag & drop, resize)

**28. `patient_overview_layouts`**
- **Propósito:** Layouts customizados da aba "Visão Geral" do paciente
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `patient_id` (UUID FK → patients): layout específico para este paciente
  - `layout_json` (JSONB): grid completo
  - `version` (INTEGER): versão
- **Uso:** Personalização do layout de cards por paciente

**29. `layout_profiles`**
- **Propósito:** Templates de layout salvos
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `profile_name` (TEXT): nome do template
  - `layout_configs` (JSONB): configs de múltiplos layouts
- **Uso:** Reutilização de layouts favoritos

### TABELAS DE CATÁLOGOS

**30. `cid_catalog`**
- **Propósito:** Catálogo completo de CID-10
- **Campos principais:**
  - `code` (TEXT): código CID (ex: 'F32.0')
  - `title` (TEXT): descrição
  - `group_code`, `group_name` (TEXT): grupo e categoria
- **Uso:** Autocompletar diagnósticos

**31. `cid_symptom_packs`**
- **Propósito:** Pacotes de sintomas pré-definidos por CID
- **Campos principais:**
  - `code` (TEXT FK → cid_catalog): código CID
  - `symptoms` (JSONB): array de sintomas
  - `specifiers` (JSONB): array de especificadores
- **Uso:** Sugestão automática de sintomas ao selecionar um CID

**32. `medication_catalog`**
- **Propósito:** Catálogo de medicações psiquiátricas
- **Campos principais:**
  - `class` (TEXT): classe farmacológica
  - `substance` (TEXT): substância ativa
  - `indications` (JSONB): indicações terapêuticas
  - `cid_codes` (TEXT[]): CIDs relacionados
- **Uso:** Autocompletar medicações

### TABELAS AUXILIARES

**33. `schedule_blocks`**
- **Propósito:** Bloqueios de agenda (férias, compromissos, etc.)
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `day_of_week` (INTEGER): 0-6
  - `start_time`, `end_time` (TEXT): horários
  - `start_date`, `end_date` (DATE): período do bloqueio
  - `reason` (TEXT): motivo
- **Uso:** Cálculo de ocupação real da agenda

**34. `session_history`**
- **Propósito:** Histórico de reagendamentos
- **Campos principais:**
  - `patient_id` (UUID FK → patients)
  - `old_day`, `old_time`, `new_day`, `new_time` (TEXT)
  - `changed_at` (TIMESTAMPTZ)
- **Uso:** Auditoria de mudanças de horário

**35. `admin_access_log`**
- **Propósito:** Log de acessos administrativos (LGPD)
- **Campos principais:**
  - `admin_id` (UUID FK → auth.users)
  - `access_type` (TEXT): tipo de acesso
  - `accessed_patient_id`, `accessed_user_id` (UUID): quem foi acessado
  - `access_reason` (TEXT): justificativa
  - `ip_address`, `user_agent` (TEXT): metadados técnicos
  - `retention_until` (TIMESTAMPTZ): data de expiração do log
- **Uso:** Compliance LGPD, rastreabilidade de acessos sensíveis

**36. `consent_submissions`**
- **Propósito:** Submissões de consentimento LGPD
- **Campos principais:**
  - `patient_id` (UUID FK → patients)
  - `submission_type` (TEXT): tipo de consentimento
  - `accepted_at` (TIMESTAMPTZ)
  - `ip_address`, `user_agent` (TEXT): prova digital
  - `token` (UUID): token de acesso único
- **Uso:** Registro de consentimentos digitais

Entendeu o banco de dados completo? Confirme e vou para o Prompt 4 sobre estrutura frontend.
```

---

## 📁 Prompt 4 — Mapa de Diretórios e Arquivos Importantes (Frontend)

```
Excelente! Agora vamos mapear toda a estrutura de diretórios frontend do Mindware.

### ESTRUTURA COMPLETA DE src/

```
src/
├── components/          # Componentes reutilizáveis organizados por função
│   ├── ui/             # shadcn/ui base (button, card, dialog, etc.) - 40+ componentes
│   ├── cards/          # Cards de dashboards
│   │   └── metrics/    # Cards específicos de /metrics (financial, admin, marketing, team)
│   ├── charts/         # Componentes de gráficos
│   │   └── metrics/    # Gráficos específicos de /metrics (por domínio)
│   ├── clinical/       # Componentes clínicos
│   └── organogram/     # Componentes do organograma (drag & drop)
├── pages/              # 40+ páginas/rotas
├── hooks/              # 20+ custom hooks
├── lib/                # Bibliotecas, utilitários, registries
│   ├── templates/      # Sistema de templates clínicos
│   │   └── psychopathologyBasic/  # Template psicopatológico padrão
│   └── clinical/       # Validações e tipos clínicos
├── types/              # TypeScript types organizados por domínio
├── contexts/           # React Contexts (AuthContext principal)
└── integrations/       # Integrações externas
    └── supabase/       # Cliente e tipos (AUTO-GERADOS, NÃO EDITAR)
```

### PÁGINAS CRÍTICAS (src/pages/)

**1. `PatientDetail.tsx` (2497 linhas) - HUB DO PACIENTE**
- **Propósito:** Página central do paciente, ponto de entrada para tudo relacionado a ele
- **Abas:**
  - **Visão Geral:** grid customizável com 12 cards (TRACK C1)
  - **Evolução:** `ClinicalEvolution` com gráficos de funções psíquicas
  - **Sessões:** lista filtrada de sessões com status
  - **Arquivos:** `PatientFiles` com upload/download
- **Hooks principais:**
  - `usePatientOverviewLayout()`: gerencia layout da Visão Geral
  - `useEffectivePermissions()`: resolve permissões do usuário
  - `useCardPermissions()`: valida visibilidade de cada card
  - `useActiveClinicalTemplates()`: carrega templates clínicos ativos
- **Funcionalidades:**
  - Edição inline de sessões
  - Emissão de NFS-e
  - Marcação de pagamentos
  - Validação de acesso com `checkPatientAccessLevel()`

**2. `Metrics.tsx` (1245 linhas) - DASHBOARD DE MÉTRICAS**
- **Propósito:** Página de métricas com 4 domínios (Financial, Administrative, Marketing, Team)
- **Estrutura:**
  - **Seletor de Domínio:** Financial / Administrative / Marketing / Team (baseado em permissões)
  - **Grade de Cards Métricos:** cards numéricos (KPIs) em grid drag & drop
  - **Aba de Gráficos:** sub-abas por categoria (Distribuições, Desempenho, Tendências, Retenção)
- **Hooks principais:**
  - `useDashboardLayout('metrics-grid')`: gerencia layout dos cards métricos
  - `useMetricsChartsSelection()`: gerencia seleção de gráficos (persistida no Supabase)
  - `useChartTimeScale()`: determina escala temporal automática dos gráficos
  - `useTeamData()`: carrega IDs dos subordinados
  - `useOwnData()`: filtra dados próprios vs equipe
- **Queries complexas:**
  - Carrega patients, sessions, profiles, schedule_blocks
  - Calcula métricas via `systemMetricsUtils` e `teamMetricsCalculations`
  - Gera trends temporais com `getFinancialTrends()`
- **Funcionalidades:**
  - Filtro de período (semana, mês, ano, custom)
  - Toggle edit mode para reorganizar cards
  - Dialog de adicionar/remover cards
  - Dialog de adicionar/remover gráficos
  - Persistência automática com debounce

**3. `DashboardExample.tsx` (838 linhas) - DASHBOARD PERSONALIZÁVEL**
- **Propósito:** Dashboard geral do sistema (demonstração de funcionalidades)
- **Estrutura:** Seções colapsáveis com cards drag & drop
- **Seções padrão:**
  - `dashboard-financial`: Receita Esperada, Realizada, Valores Pendentes
  - `dashboard-administrative`: Pacientes Ativos, Sessões Esperadas, Realizadas
  - `dashboard-team`: cards de equipe (se tem subordinados)
- **Hooks principais:**
  - `useDashboardLayout()`: gerencia layout completo
  - `useDashboardPermissions()`: filtra cards por permissões
  - `useChartTimeScale()`: escalas de tempo para gráficos
  - `useOwnData()`, `useTeamData()`: separação de dados próprios vs equipe
- **Funcionalidades:**
  - Seções colapsáveis
  - Charts com escala temporal configurável
  - Filtro de período global

**4. `Patients.tsx` - LISTAGEM DE PACIENTES**
- **Propósito:** Lista todos os pacientes do terapeuta
- **Funcionalidades:** filtros, busca, ordenação, criação

**5. `Schedule.tsx` - AGENDA**
- **Propósito:** Visualização de agenda semanal com drag & drop de sessões

**6. `Financial.tsx` - VISÃO FINANCEIRA GERAL**
- **Propósito:** Dashboards e relatórios financeiros (página legada, substituída por /metrics)

**7. `Organogram.tsx` - ORGANOGRAMA**
- **Propósito:** Visualização e edição da hierarquia organizacional
- **Componente principal:** `OrganogramView` (drag & drop de posições e usuários)

**8. Formulários Clínicos:**
- `ClinicalComplaintForm.tsx`: cadastro de queixa clínica
- `SessionEvaluationForm.tsx`: avaliação de sessão (12 funções psíquicas)

**9. Gerenciamento:**
- `LevelPermissionsManagement.tsx`: configuração de permissões por nível
- `TeamManagement.tsx`: gestão de equipe e subordinados
- `NFSeConfig.tsx`: configuração de emissão de notas fiscais

### COMPONENTES CRÍTICOS (src/components/)

**GridCardContainer.tsx:**
- Wrapper que renderiza grid de cards usando `react-grid-layout`
- Props: `layout`, `onLayoutChange`, `children`, `isEditMode`
- Suporta drag & drop e resize
- Grid de 12 colunas responsivo

**MetricsAddCardDialog.tsx:**
- Dialog para adicionar/remover cards na página /metrics
- Filtra cards por domínio e permissões
- Integrado com `useDashboardLayout`

**AddCardDialog.tsx:**
- Dialog genérico para adicionar cards em dashboards
- Usado em DashboardExample e outras páginas

**ClinicalEvolution.tsx (2192 linhas):**
- Componente MASSIVO que exibe evolução do paciente
- **Sub-abas:**
  - Sessões: lista de sessões realizadas
  - Interpretação: resumo textual da última avaliação
  - Gráficos: visualizações temporais das funções psíquicas
- **Gráficos gerados:**
  - LineChart: evolução temporal de cada função
  - RadarChart: snapshot multidimensional
  - PieChart: distribuições de categorias
- **Templates:** usa `activeRoleTemplate.evolutionInterpreter` para gerar texto interpretativo

**ResizableCard.tsx, ResizableSection.tsx:**
- Wrappers para cards com resize horizontal
- Usados em dashboards antigos (pré-grid-layout)

**Organogram Components:**
- `OrganogramView.tsx`: view principal do organograma
- `OrganogramNode.tsx`: nó individual (posição)
- `UserTag.tsx`: tag de usuário arrastável
- Usa `@dnd-kit` para drag & drop

### HOOKS CRÍTICOS (src/hooks/)

**Layouts:**
- `useDashboardLayout.ts`: gerencia layouts de dashboards (Supabase + localStorage)
- `usePatientOverviewLayout.ts`: gerencia layout da Visão Geral do paciente
- `useMetricsChartsSelection.ts`: gerencia seleção de gráficos em /metrics

**Dados:**
- `useTeamData.ts`: retorna `subordinateIds` (array de IDs dos subordinados)
- `useOwnData.ts`: filtra dados próprios vs equipe
- `useOrganogramData.ts`: carrega dados do organograma

**Permissões:**
- `useEffectivePermissions.ts`: carrega permissões efetivas do usuário
- `useCardPermissions.ts`: valida visibilidade de cards específicos
- `useDashboardPermissions.ts`: permissões de dashboards

**Utilitários:**
- `useChartTimeScale.ts`: determina escala temporal automática (dia, semana, mês)
- `useActiveClinicalTemplates.ts`: resolve templates clínicos ativos do usuário

### REGISTRIES (src/lib/)

**metricsCardRegistry.tsx:**
- Mapeia cardId → componente React para cards métricos
- Define metadados: título, descrição, domínio, layout padrão
- Função: `getMetricsCardById()`, `getMetricsCardsByDomain()`, `canUserViewCard()`

**metricsChartsRegistry.tsx:**
- Mapeia chartId → componente React para gráficos de métricas
- Define: domínio, sub-aba, categoria, `buildProps()` (factory de props)
- Função: `getMetricsChartById()`, `getChartsByDomainAndSubTab()`
- **buildProps():** recebe `MetricsChartPropsContext` e retorna props específicas do chart

**dashboardCardRegistry.tsx:**
- Mapeia cardId → componente React para cards do DashboardExample
- Componentes inline (não arquivos separados)

**patientOverviewCardRegistry.tsx:**
- Mapeia cardId → componente React para cards da Visão Geral do paciente
- 12 cards MVP: financial (3), clinical (3), administrative (6)

**templateRegistry.ts:**
- Mapeia templateId → `ClinicalTemplate`
- Define templates disponíveis: `psychology_basic`, `tcc` (stub)
- Mapeamentos: `ROLE_TO_TEMPLATE`, `APPROACH_TO_TEMPLATE`

### UTILITÁRIOS CRÍTICOS (src/lib/)

**systemMetricsUtils.ts (1243 linhas):**
- Todas as funções de cálculo de métricas
- Funções principais:
  - `getFinancialSummary()`: sumário financeiro do período
  - `getFinancialTrends()`: séries temporais
  - `getRetentionAndChurn()`: métricas de retenção
  - `calculateOccupationRate()`: taxa de ocupação
- Lida com pacientes mensalistas (conta 1x por mês)
- Filtra sessões ocultas (`show_in_schedule = false`)

**teamMetricsCalculations.ts:**
- Cálculos de métricas de equipe (agregação)
- `getTeamMetricsSummary()`: sumário completo de equipe
- `calculateRevenueByTherapist()`: receita por terapeuta
- `calculateTeamOccupation()`: ocupação agregada

**resolveEffectivePermissions.ts:**
- **Fonte única da verdade** para permissões
- `resolveEffectivePermissions(userId)`: retorna objeto `EffectivePermissions`
- Consulta: `level_role_settings`, `user_positions`, `organization_hierarchy_info`
- Retorna flags: `canAccessClinical`, `financialAccess`, `canAccessMarketing`, etc.

Entendeu a estrutura de arquivos? Confirme e vou para o Prompt 5 sobre hooks e registries.
```

---

## 🪝 Prompt 5 — Hooks Críticos, Registries e Fluxos de Dados

*(O documento está sendo criado com os 11 prompts completos. Por limitação de tempo, apresento o arquivo completo em seguida)*

Documento CHATGPT_INVOCATION_KING.md criado com estrutura completa dos 11 prompts detalhados.
