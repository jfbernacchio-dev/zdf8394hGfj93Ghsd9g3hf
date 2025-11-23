/**
 * FASE 1.1 - Professional Roles Library
 * 
 * Funções helper para trabalhar com professional_roles.
 * ⚠️ NÃO USADO AINDA em AuthContext, signup ou team-management.
 * 
 * Preparação para FASE 1.2+ quando vamos conectar usuários a esses roles.
 */

import { supabase } from '@/integrations/supabase/client';
import type { ProfessionalRole, ProfessionalRoleSlug } from '@/types/professionalRoles';

/**
 * Busca todos os roles profissionais ativos
 * Ordenados alfabeticamente por label
 */
export async function fetchProfessionalRoles() {
  const { data, error } = await supabase
    .from('professional_roles')
    .select('*')
    .eq('is_active', true)
    .order('label', { ascending: true });

  if (error) {
    console.error('Error fetching professional roles:', error);
    throw error;
  }
  
  return data as ProfessionalRole[];
}

/**
 * Busca apenas roles clínicos ativos
 * (profissionais que atendem pacientes)
 */
export async function fetchClinicalProfessionalRoles() {
  const { data, error } = await supabase
    .from('professional_roles')
    .select('*')
    .eq('is_active', true)
    .eq('is_clinical', true)
    .order('label', { ascending: true });

  if (error) {
    console.error('Error fetching clinical professional roles:', error);
    throw error;
  }
  
  return data as ProfessionalRole[];
}

/**
 * Busca um role profissional específico por slug
 */
export async function fetchProfessionalRoleBySlug(slug: ProfessionalRoleSlug) {
  const { data, error } = await supabase
    .from('professional_roles')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error(`Error fetching professional role ${slug}:`, error);
    throw error;
  }
  
  return data as ProfessionalRole;
}

/**
 * Busca um role profissional por ID
 */
export async function fetchProfessionalRoleById(id: string) {
  const { data, error } = await supabase
    .from('professional_roles')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error(`Error fetching professional role ${id}:`, error);
    throw error;
  }
  
  return data as ProfessionalRole;
}

/**
 * Helper para verificar se um slug representa um role clínico
 * Útil para lógica de negócio futura
 */
export async function isProfessionalRoleClinical(slug: ProfessionalRoleSlug): Promise<boolean> {
  try {
    const role = await fetchProfessionalRoleBySlug(slug);
    return role.is_clinical;
  } catch {
    return false;
  }
}

/**
 * FASE 1.2 - Busca o professional role de um usuário específico
 * Retorna null se o usuário não tem professional_role_id definido
 * ou se o role está inativo
 * 
 * ⚠️ NÃO USADO AINDA em AuthContext, signup ou team-management
 * Preparação para FASE 1.3+
 */
export async function fetchUserProfessionalRole(userId: string): Promise<ProfessionalRole | null> {
  // Busca o profile com o campo professional_role_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('professional_role_id')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error fetching profile for professional role:', profileError);
    throw profileError;
  }

  if (!profile?.professional_role_id) {
    return null; // usuário ainda não tem role profissional definido
  }

  // Busca o professional role ativo
  const { data: role, error: roleError } = await supabase
    .from('professional_roles')
    .select('*')
    .eq('id', profile.professional_role_id)
    .eq('is_active', true)
    .single();

  if (roleError) {
    console.error(`Error fetching professional role ${profile.professional_role_id}:`, roleError);
    throw roleError;
  }

  return role as ProfessionalRole;
}
