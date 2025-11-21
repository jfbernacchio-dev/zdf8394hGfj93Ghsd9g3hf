/**
 * FASE 10.2: Helper functions para organizações (CRUD completo)
 * 
 * Funções para gerenciar empresas/CNPJ no perfil do usuário.
 */

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

// ===== READ OPERATIONS =====

export async function getOrganizationByUser(userId: string): Promise<Organization | null> {
  const { data: ownership, error: ownershipError } = await supabase
    .from('organization_owners')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .maybeSingle();

  if (ownershipError || !ownership) {
    // Try any ownership
    const { data: anyOwnership } = await supabase
      .from('organization_owners')
      .select('organization_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    
    if (!anyOwnership) return null;
    
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', anyOwnership.organization_id)
      .single();
    
    return org || null;
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', ownership.organization_id)
    .single();

  if (orgError) return null;
  return org;
}

export async function getOrganizationsByCnpj(cnpj: string): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('cnpj', cnpj);

  if (error) {
    console.error('Error fetching organizations by CNPJ:', error);
    return [];
  }

  return data || [];
}

export async function getOwnerRecord(userId: string): Promise<OrganizationOwner | null> {
  const { data, error } = await supabase
    .from('organization_owners')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching owner record:', error);
    return null;
  }

  return data;
}

// ===== WRITE OPERATIONS =====

export async function createOrganization(data: {
  cnpj: string;
  legal_name: string;
  notes?: string;
  created_by: string;
}): Promise<Organization | null> {
  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      cnpj: data.cnpj,
      legal_name: data.legal_name,
      notes: data.notes || null,
      created_by: data.created_by,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating organization:', error);
    return null;
  }

  return org;
}

export async function updateOrganization(
  id: string,
  data: {
    cnpj?: string;
    legal_name?: string;
    notes?: string;
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('organizations')
    .update(data)
    .eq('id', id);

  if (error) {
    console.error('Error updating organization:', error);
    return false;
  }

  return true;
}

export async function addOwner(
  orgId: string,
  userId: string,
  isPrimary: boolean = true
): Promise<boolean> {
  const { error } = await supabase
    .from('organization_owners')
    .insert({
      organization_id: orgId,
      user_id: userId,
      is_primary: isPrimary,
    });

  if (error) {
    console.error('Error adding owner:', error);
    return false;
  }

  return true;
}
