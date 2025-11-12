-- =====================================================
-- FASE 2: LÓGICA DE NEGÓCIO - VALIDAÇÕES E HIERARQUIA
-- =====================================================

-- 1. Função para validar que subordinado não pode criar outro subordinado
-- Será usada como constraint/trigger ao inserir em therapist_assignments
create or replace function public.validate_subordinate_cannot_create_subordinate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verificar se o manager (quem está criando) é subordinado de alguém
  if exists (
    select 1 
    from therapist_assignments 
    where subordinate_id = NEW.manager_id
  ) then
    raise exception 'Terapeutas subordinados não podem criar outros subordinados';
  end if;
  
  return NEW;
end;
$$;

comment on function public.validate_subordinate_cannot_create_subordinate() is 'Valida que um terapeuta subordinado não pode criar outro subordinado';

-- 2. Trigger para aplicar a validação
create trigger check_subordinate_hierarchy
  before insert on public.therapist_assignments
  for each row
  execute function public.validate_subordinate_cannot_create_subordinate();

-- 3. Função para validar que subordinado não pode ter accountant
-- Será usada ao inserir em accountant_therapist_assignments
create or replace function public.validate_subordinate_cannot_have_accountant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verificar se o therapist é subordinado
  if exists (
    select 1 
    from therapist_assignments 
    where subordinate_id = NEW.therapist_id
  ) then
    raise exception 'Terapeutas subordinados não podem ter contador. Apenas terapeutas Full podem ter accountants.';
  end if;
  
  return NEW;
end;
$$;

comment on function public.validate_subordinate_cannot_have_accountant() is 'Valida que terapeuta subordinado não pode ter accountant';

-- 4. Trigger para aplicar a validação de accountant
create trigger check_subordinate_accountant
  before insert on public.accountant_therapist_assignments
  for each row
  execute function public.validate_subordinate_cannot_have_accountant();

-- 5. INVERTER LÓGICA ACCOUNTANT: Apenas Therapist pode se auto-atribuir a accountant
-- Remover policy antiga que permitia accountant se auto-atribuir
drop policy if exists "Accountants can insert their own assignments" on public.accountant_therapist_assignments;
drop policy if exists "Accountants can delete their own assignments" on public.accountant_therapist_assignments;

-- 6. Atualizar RLS de accountant_therapist_assignments
-- Therapists Full podem se auto-atribuir a accountants
create policy "Therapist Full can assign accountant to themselves"
on public.accountant_therapist_assignments
for insert
with check (
  auth.uid() = therapist_id 
  and not is_subordinate(auth.uid()) -- Apenas Full, não subordinados
);

-- 7. Therapists Full podem remover seu próprio accountant
create policy "Therapist Full can remove their accountant"
on public.accountant_therapist_assignments
for delete
using (
  auth.uid() = therapist_id 
  and not is_subordinate(auth.uid())
);

-- 8. Garantir que accountant pode ver seus assignments (mas não modificar)
-- Policy de SELECT já existe, mantemos

-- 9. Admins continuam podendo gerenciar tudo
-- Policies de admin já existem, mantemos