/**
 * FASE 1.1 - Professional Roles Library
 * 
 * Funções helper para trabalhar com professional_roles.
 * ⚠️ NÃO USADO AINDA em AuthContext, signup ou team-management.
 * 
 * Preparação para FASE 1.2+ quando vamos conectar usuários a esses roles.
 */

import { supabase } from '@/integrations/supabase/client';
import type { ProfessionalRole, ProfessionalRoleSlug, ProfessionalRoleKind } from '@/types/professionalRoles';

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

/**
 * FASE 1.3 - Wrapper de fetchUserProfessionalRole com fallback
 * Retorna um objeto com dados "unknown" se o usuário não tem role definido
 * 
 * ⚠️ NÃO USADO AINDA em AuthContext, signup ou team-management
 * Preparação para FASE 2.x+
 */
export async function getProfessionalRoleForUser(userId: string): Promise<ProfessionalRole> {
  const role = await fetchUserProfessionalRole(userId);

  if (!role) {
    return {
      id: 'unknown',
      slug: 'unknown',
      label: 'Indefinido',
      description: null,
      is_clinical: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return role;
}

/**
 * FASE 1.3 - Lista todos os professional roles clínicos ativos
 * (profissionais que atendem pacientes)
 * 
 * ⚠️ NÃO USADO AINDA - Preparação para FASE 2.x+
 */
export async function listClinicalProfessionalRoles(): Promise<ProfessionalRole[]> {
  const { data, error } = await supabase
    .from('professional_roles')
    .select('*')
    .eq('is_active', true)
    .eq('is_clinical', true)
    .order('label', { ascending: true });

  if (error) {
    console.error('Error listing clinical professional roles:', error);
    throw error;
  }

  return data as ProfessionalRole[];
}

/**
 * FASE 1.3 - Lista todos os professional roles administrativos ativos
 * (profissionais que NÃO atendem pacientes: secretária, contador, etc.)
 * 
 * ⚠️ NÃO USADO AINDA - Preparação para FASE 2.x+
 */
export async function listAdministrativeProfessionalRoles(): Promise<ProfessionalRole[]> {
  const { data, error } = await supabase
    .from('professional_roles')
    .select('*')
    .eq('is_active', true)
    .eq('is_clinical', false)
    .order('label', { ascending: true });

  if (error) {
    console.error('Error listing administrative professional roles:', error);
    throw error;
  }

  return data as ProfessionalRole[];
}

/**
 * FASE 2.2 - Determina o "kind" de um professional role
 * Retorna 'clinical', 'administrative' ou 'unknown'
 * 
 * ⚠️ NÃO USADO AINDA - Preparação para uso futuro
 */
export function getProfessionalRoleKind(role?: ProfessionalRole | null): ProfessionalRoleKind {
  if (!role) return 'unknown';
  if (role.is_clinical) return 'clinical';
  return 'administrative';
}

/**
 * FASE 2.2 - Determina o "kind" a partir de um Profile
 * Tipo mínimo esperado para Profile (compatível com AuthContext)
 * 
 * ⚠️ NÃO USADO AINDA - Preparação para uso futuro
 */
type ProfileWithRole = {
  professional_roles?: ProfessionalRole | null;
};

export function getProfessionalRoleKindFromProfile(profile?: ProfileWithRole | null): ProfessionalRoleKind {
  if (!profile || !profile.professional_roles) return 'unknown';
  return getProfessionalRoleKind(profile.professional_roles);
}

/**
 * FASE 2.4 - Retorna label amigável do professional role
 * Prioridade: label da tabela > fallback explícito > 'Profissional'
 * 
 * ⚠️ NÃO USADO AINDA - Preparação para uso futuro na UI
 */
export function getProfessionalRoleLabelFromProfile(
  profile?: ProfileWithRole | null,
  fallback?: string
): string {
  // 1) Se tiver professional_roles, usa o label da tabela nova
  if (profile?.professional_roles?.label) {
    return profile.professional_roles.label;
  }

  // 2) Se tiver fallback explícito, usa ele (pensado para chamadas futuras)
  if (fallback) return fallback;

  // 3) Fallback neutro genérico
  return 'Profissional';
}

/**
 * FASE 2.4 - Helper unificado para UI
 * Retorna label para exibir na interface, com fallback inteligente
 * 
 * Prioridade:
 * 1. professional_roles.label (dinâmico da tabela)
 * 2. Label baseado em systemRole (compatibilidade)
 * 3. 'Profissional' (fallback final)
 * 
 * @param profile - Profile do usuário com professional_roles (aceita partial)
 * @param systemRole - Role do sistema (de user_roles)
 */
export function getUserRoleLabelForUI(
  profile?: { professional_roles?: { label?: string } | null } | null,
  systemRole?: string | null
): string {
  // 1) Tentar usar professional_roles.label
  if (profile?.professional_roles?.label) {
    return profile.professional_roles.label;
  }

  // 2) Fallback para labels baseados em systemRole
  if (systemRole) {
    switch (systemRole) {
      case 'psychologist':
      case 'fulltherapist':
        return 'Psicólogo';
      case 'assistant':
        return 'Secretária';
      case 'accountant':
        return 'Contador';
      case 'admin':
        return 'Administrador';
      default:
        return 'Profissional';
    }
  }

  // 3) Fallback final
  return 'Profissional';
}

