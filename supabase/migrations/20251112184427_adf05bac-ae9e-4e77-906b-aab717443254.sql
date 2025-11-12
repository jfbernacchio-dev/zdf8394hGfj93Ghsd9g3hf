-- =====================================================
-- FASE 1: FUNDAÇÃO - ESTRUTURA DE DADOS
-- Criação de tabela therapist_assignments e funções helper
-- =====================================================

-- 1. Criar tabela therapist_assignments
create table public.therapist_assignments (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles(id) on delete cascade,
  subordinate_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(subordinate_id) -- Um subordinado só pode ter 1 manager
);

-- Comentários para documentação
comment on table public.therapist_assignments is 'Relacionamento entre terapeutas Full (manager) e Subordinados';
comment on column public.therapist_assignments.manager_id is 'ID do terapeuta Full que gerencia';
comment on column public.therapist_assignments.subordinate_id is 'ID do terapeuta Subordinado';

-- Índices para performance
create index idx_therapist_assignments_manager on public.therapist_assignments(manager_id);
create index idx_therapist_assignments_subordinate on public.therapist_assignments(subordinate_id);

-- 2. Habilitar RLS na tabela
alter table public.therapist_assignments enable row level security;

-- 3. Criar função helper: is_subordinate
create or replace function public.is_subordinate(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.therapist_assignments
    where subordinate_id = _user_id
  )
$$;

comment on function public.is_subordinate(uuid) is 'Verifica se um usuário é um terapeuta subordinado';

-- 4. Criar função helper: get_manager_id
create or replace function public.get_manager_id(_subordinate_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select manager_id
  from public.therapist_assignments
  where subordinate_id = _subordinate_id
  limit 1
$$;

comment on function public.get_manager_id(uuid) is 'Retorna o ID do manager de um terapeuta subordinado';

-- 5. Criar função helper: get_subordinate_ids
create or replace function public.get_subordinate_ids(_manager_id uuid)
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select array_agg(subordinate_id)
  from public.therapist_assignments
  where manager_id = _manager_id
$$;

comment on function public.get_subordinate_ids(uuid) is 'Retorna array com IDs de todos os subordinados de um terapeuta Full';

-- 6. Políticas RLS básicas para therapist_assignments

-- 6.1 - Admins podem ver todas as atribuições
create policy "Admins can view all therapist assignments"
on public.therapist_assignments
for select
using (has_role(auth.uid(), 'admin'::app_role));

-- 6.2 - Managers podem ver seus subordinados
create policy "Managers can view their subordinates"
on public.therapist_assignments
for select
using (auth.uid() = manager_id);

-- 6.3 - Subordinados podem ver quem é seu manager
create policy "Subordinates can view their manager"
on public.therapist_assignments
for select
using (auth.uid() = subordinate_id);

-- 6.4 - Admins podem inserir atribuições (ao criar subordinado via UI)
create policy "Admins can insert therapist assignments"
on public.therapist_assignments
for insert
with check (has_role(auth.uid(), 'admin'::app_role));

-- 6.5 - Managers (Therapist Full) podem inserir seus subordinados
create policy "Managers can insert their subordinates"
on public.therapist_assignments
for insert
with check (
  auth.uid() = manager_id 
  and not is_subordinate(auth.uid()) -- Manager não pode ser subordinado
);

-- 6.6 - Admins podem deletar atribuições
create policy "Admins can delete therapist assignments"
on public.therapist_assignments
for delete
using (has_role(auth.uid(), 'admin'::app_role));

-- 6.7 - Managers podem deletar seus subordinados
create policy "Managers can delete their subordinates"
on public.therapist_assignments
for delete
using (auth.uid() = manager_id);

-- 6.8 - Ninguém pode atualizar (delete + insert se necessário mudar manager)
-- Não criamos policy de UPDATE propositalmente