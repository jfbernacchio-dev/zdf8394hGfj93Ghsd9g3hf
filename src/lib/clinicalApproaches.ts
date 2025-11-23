/**
 * FASE A1 - Clinical Approaches Helpers
 * 
 * Funções auxiliares para buscar abordagens clínicas do banco.
 * 
 * IMPORTANTE: Estes helpers foram criados na FASE A1 como infraestrutura,
 * mas NÃO são chamados em lugar nenhum ainda. Serão usados na FASE A2
 * quando integrarmos com a UI.
 */

import { supabase } from '@/integrations/supabase/client';
import type { ClinicalApproach } from '@/types/clinicalApproaches';

/**
 * Busca todas as abordagens clínicas ativas para um professional_role específico (por ID)
 */
export async function fetchClinicalApproachesForRoleId(
  professionalRoleId: string
): Promise<ClinicalApproach[]> {
  const { data, error } = await supabase
    .from('clinical_approaches')
    .select('*')
    .eq('professional_role_id', professionalRoleId)
    .eq('is_active', true)
    .order('label', { ascending: true });

  if (error) {
    console.error('[clinicalApproaches] Error fetching for role id', professionalRoleId, error);
    throw error;
  }

  return data as ClinicalApproach[];
}

/**
 * Busca todas as abordagens clínicas ativas para um professional_role específico (por slug)
 * Ex: 'psychologist', 'psychiatrist', etc.
 */
export async function fetchClinicalApproachesForRoleSlug(
  professionalRoleSlug: string
): Promise<ClinicalApproach[]> {
  // Primeiro busca o professional_role pelo slug
  const { data: role, error: roleError } = await supabase
    .from('professional_roles')
    .select('id')
    .eq('slug', professionalRoleSlug)
    .eq('is_active', true)
    .single();

  if (roleError) {
    console.error('[clinicalApproaches] Error fetching professional role for slug', professionalRoleSlug, roleError);
    throw roleError;
  }

  // Depois busca as abordagens desse role
  const { data, error } = await supabase
    .from('clinical_approaches')
    .select('*')
    .eq('professional_role_id', role.id)
    .eq('is_active', true)
    .order('label', { ascending: true });

  if (error) {
    console.error('[clinicalApproaches] Error fetching for role slug', professionalRoleSlug, error);
    throw error;
  }

  return data as ClinicalApproach[];
}

/**
 * Busca uma abordagem clínica específica por ID
 */
export async function fetchClinicalApproachById(
  id: string
): Promise<ClinicalApproach | null> {
  const { data, error } = await supabase
    .from('clinical_approaches')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[clinicalApproaches] Error fetching by id', id, error);
    return null;
  }

  return data as ClinicalApproach;
}

/**
 * Busca uma abordagem clínica específica por slug
 */
export async function fetchClinicalApproachBySlug(
  slug: string
): Promise<ClinicalApproach | null> {
  const { data, error } = await supabase
    .from('clinical_approaches')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('[clinicalApproaches] Error fetching by slug', slug, error);
    return null;
  }

  return data as ClinicalApproach;
}

/**
 * Busca todas as abordagens clínicas ativas (independente de professional_role)
 * Útil para admin gerenciar abordagens
 */
export async function fetchAllClinicalApproaches(): Promise<ClinicalApproach[]> {
  const { data, error } = await supabase
    .from('clinical_approaches')
    .select('*')
    .eq('is_active', true)
    .order('label', { ascending: true });

  if (error) {
    console.error('[clinicalApproaches] Error fetching all', error);
    throw error;
  }

  return data as ClinicalApproach[];
}

/**
 * Busca a abordagem clínica default para um professional_role
 */
export async function fetchDefaultClinicalApproachForRole(
  professionalRoleId: string
): Promise<ClinicalApproach | null> {
  const { data, error } = await supabase
    .from('clinical_approaches')
    .select('*')
    .eq('professional_role_id', professionalRoleId)
    .eq('is_active', true)
    .eq('is_default', true)
    .single();

  if (error) {
    console.error('[clinicalApproaches] Error fetching default for role', professionalRoleId, error);
    return null;
  }

  return data as ClinicalApproach;
}
