/**
 * FASE 10.1: Helper functions para organizações (somente leitura)
 * 
 * ⚠️ ARQUIVO TEMPORARIAMENTE COMENTADO ⚠️
 * 
 * Este arquivo será descomentado após:
 * 1. Os tipos TypeScript serem regenerados pelo Supabase (types.ts)
 * 2. As tabelas organizations e organization_owners estarem disponíveis
 * 
 * Estas funções são preparatórias e não são usadas na UI ainda.
 * Serão utilizadas nas próximas fases quando implementarmos:
 * - Organograma por empresa
 * - NFSe por empresa
 * - Múltiplos donos do mesmo CNPJ
 * 
 * FASE 10.1 CONCLUÍDA:
 * ✅ Tabelas organizations e organization_owners criadas
 * ✅ Seed da organização "Espaço Mindware Psicologia Ltda." inserido
 * ✅ Admins adicionados como donos da organização
 * ⚠️ organization_levels NÃO foram modificados (será feito manualmente depois)
 */

// TODO: Descomentar após regeneração dos tipos Supabase

/*
import { supabase } from "@/integrations/supabase/client";

export interface Organization {
  id: string;
  cnpj: string;
  legal_name: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  notes: string | null;
}

export interface OrganizationOwner {
  id: string;
  organization_id: string;
  user_id: string;
  is_primary: boolean;
  created_at: string;
}

export interface OrganizationWithOwners extends Organization {
  owners: OrganizationOwner[];
}

export async function getUserOrganizations(userId: string): Promise<OrganizationWithOwners[]> {
  const { data: ownerships, error: ownershipError } = await supabase
    .from('organization_owners')
    .select('*')
    .eq('user_id', userId);

  if (ownershipError) {
    console.error('Error fetching user organizations:', ownershipError);
    return [];
  }

  if (!ownerships || ownerships.length === 0) {
    return [];
  }

  const orgIds = ownerships.map(o => o.organization_id);

  const { data: organizations, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .in('id', orgIds);

  if (orgError) {
    console.error('Error fetching organizations:', orgError);
    return [];
  }

  const orgsWithOwners: OrganizationWithOwners[] = (organizations || []).map(org => {
    const owners = ownerships.filter(o => o.organization_id === org.id);
    return {
      ...org,
      owners
    };
  });

  return orgsWithOwners;
}

export async function getPrimaryOrganizationForUser(userId: string): Promise<Organization | null> {
  const { data: primaryOwnership, error: primaryError } = await supabase
    .from('organization_owners')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .single();

  if (!primaryError && primaryOwnership) {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', primaryOwnership.organization_id)
      .single();

    if (!orgError && org) {
      return org;
    }
  }

  const { data: anyOwnership, error: anyError } = await supabase
    .from('organization_owners')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (anyError || !anyOwnership) {
    return null;
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', anyOwnership.organization_id)
    .single();

  if (orgError) {
    return null;
  }

  return org;
}

export async function getOrganizationById(organizationId: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }

  return data;
}

export async function getOrganizationOwners(organizationId: string): Promise<OrganizationOwner[]> {
  const { data, error } = await supabase
    .from('organization_owners')
    .select('*')
    .eq('organization_id', organizationId)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('Error fetching organization owners:', error);
    return [];
  }

  return data || [];
}

export async function isUserOrganizationOwner(
  userId: string, 
  organizationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('organization_owners')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  return !error && !!data;
}

export async function isUserPrimaryOwner(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('organization_owners')
    .select('is_primary')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('is_primary', true)
    .single();

  return !error && !!data;
}
*/

// Exportar placeholder vazio para evitar erros de importação
export const ORGANIZATIONS_MODULE_PENDING = true;
