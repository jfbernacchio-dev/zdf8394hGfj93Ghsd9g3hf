/**
 * FASE 10.2: Helper functions para organizações (CRUD completo)
 * FASE 10.3: Adicionado resolveUserOrganization para resolução automática
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

// ===== FASE 10.3: RESOLUÇÃO AUTOMÁTICA DE ORGANIZAÇÃO =====

/**
 * FASE 10.3: Resolve a organização de um usuário automaticamente
 * 
 * Regras de resolução (em ordem de prioridade):
 * 
 * 1. Se o usuário é dono direto (organization_owners):
 *    - Retorna a org com is_primary = true
 *    - Se não houver primary, retorna a primeira por ordem de criação
 * 
 * 2. Se o usuário NÃO é dono:
 *    - Tenta resolver pelo superior direto na hierarquia
 *    - Se não houver superior, tenta pela config de NFSe (CNPJ)
 *    - Se nada funcionar, retorna NULL
 * 
 * Esta função também atualiza profiles.organization_id automaticamente.
 */
export async function resolveUserOrganization(userId: string): Promise<string | null> {
  try {
    // 1. Verificar se já está no profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (profile?.organization_id) {
      return profile.organization_id;
    }

    // 2. REGRA A: Verificar se é dono direto
    const { data: ownership } = await supabase
      .from('organization_owners')
      .select('organization_id, is_primary')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (ownership && ownership.length > 0) {
      const orgId = ownership[0].organization_id;
      
      // Atualizar profile
      await supabase
        .from('profiles')
        .update({ organization_id: orgId })
        .eq('id', userId);
      
      return orgId;
    }

    // 3. REGRA B: Não é dono - tentar resolver pelo superior direto
    const { data: userPosition } = await supabase
      .from('user_positions')
      .select('position_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (userPosition) {
      // Buscar a posição e o nível
      const { data: position } = await supabase
        .from('organization_positions')
        .select('level_id, parent_position_id')
        .eq('id', userPosition.position_id)
        .maybeSingle();

      if (position) {
        // Buscar o nível para obter organization_id
        const { data: level } = await supabase
          .from('organization_levels')
          .select('organization_id')
          .eq('id', position.level_id)
          .maybeSingle();

        if (level?.organization_id) {
          // Atualizar profile
          await supabase
            .from('profiles')
            .update({ organization_id: level.organization_id })
            .eq('id', userId);
          
          return level.organization_id;
        }

        // Se não achou pela posição, tentar pelo superior direto
        if (position.parent_position_id) {
          const { data: parentUsers } = await supabase
            .from('user_positions')
            .select('user_id')
            .eq('position_id', position.parent_position_id)
            .limit(1);

          if (parentUsers && parentUsers.length > 0) {
            const superiorOrgId = await resolveUserOrganization(parentUsers[0].user_id);
            if (superiorOrgId) {
              // Atualizar profile
              await supabase
                .from('profiles')
                .update({ organization_id: superiorOrgId })
                .eq('id', userId);
              
              return superiorOrgId;
            }
          }
        }
      }
    }

    // 4. REGRA C: Tentar pela config de NFSe (CNPJ)
    const { data: nfseConfig } = await supabase
      .from('nfse_config')
      .select('cnpj')
      .eq('user_id', userId)
      .maybeSingle();

    if (nfseConfig?.cnpj) {
      const orgs = await getOrganizationsByCnpj(nfseConfig.cnpj);
      if (orgs.length > 0) {
        const orgId = orgs[0].id;
        
        // Atualizar profile
        await supabase
          .from('profiles')
          .update({ organization_id: orgId })
          .eq('id', userId);
        
        return orgId;
      }
    }

    // 5. Nada funcionou - retornar NULL
    return null;
  } catch (error) {
    console.error('Error resolving user organization:', error);
    return null;
  }
}
