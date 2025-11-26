/**
 * ============================================================================
 * FASE C2.2 - Template Service
 * ============================================================================
 * 
 * Serviço central para resolução de templates clínicos ativos de um usuário.
 * 
 * Lógica de negócio:
 * - Templates são do profissional, não do paciente
 * - Sempre existe um template base (baseado no role)
 * - Pode haver template adicional de abordagem
 * - Se role não tiver template → fallback para psychology_basic
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { ActiveTemplatesResult, ClinicalTemplate } from './templateTypes';
import {
  getTemplateById,
  getTemplateIdForRole,
  getTemplateIdForApproach,
  getFallbackTemplate,
  DEFAULT_FALLBACK_TEMPLATE_ID
} from './templateRegistry';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfessionalRole = Database['public']['Tables']['professional_roles']['Row'];
type ClinicalApproach = Database['public']['Tables']['clinical_approaches']['Row'];

/**
 * ============================================================================
 * RESOLUÇÃO DE TEMPLATES PARA UM USUÁRIO
 * ============================================================================
 */

/**
 * Obtém os templates clínicos ativos para um usuário
 * 
 * @param userId - ID do usuário
 * @returns Templates ativos do usuário
 */
export async function getActiveClinicalTemplatesForUser(
  userId: string
): Promise<ActiveTemplatesResult> {
  try {
    // 1. Buscar profile do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, professional_role_id, clinical_approach_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.warn('[TemplateService] Profile não encontrado, usando fallback:', profileError);
      return createFallbackResult();
    }

    // 2. Buscar professional_role (se existir)
    let roleSlug: string | null = null;
    if (profile.professional_role_id) {
      const { data: role } = await supabase
        .from('professional_roles')
        .select('slug')
        .eq('id', profile.professional_role_id)
        .single();
      
      roleSlug = role?.slug || null;
    }

    // 3. Buscar clinical_approach (se existir)
    let approachSlug: string | null = null;
    if (profile.clinical_approach_id) {
      const { data: approach } = await supabase
        .from('clinical_approaches')
        .select('slug')
        .eq('id', profile.clinical_approach_id)
        .single();
      
      approachSlug = approach?.slug || null;
    }

    // 4. Resolver templates
    return resolveTemplatesFromSlugs(roleSlug, approachSlug);
  } catch (error) {
    console.error('[TemplateService] Erro ao buscar templates:', error);
    return createFallbackResult();
  }
}

/**
 * Resolve templates baseado nos slugs de role e approach
 * 
 * @param roleSlug - Slug do professional_role
 * @param approachSlug - Slug da clinical_approach
 * @returns Templates resolvidos
 */
export function resolveTemplatesFromSlugs(
  roleSlug: string | null,
  approachSlug: string | null
): ActiveTemplatesResult {
  let usedFallback = false;

  // 1. Resolver template de role
  let roleTemplate: ClinicalTemplate | null = null;
  
  if (roleSlug) {
    const roleTemplateId = getTemplateIdForRole(roleSlug);
    if (roleTemplateId) {
      roleTemplate = getTemplateById(roleTemplateId);
    }
  }

  // Se não achou template de role, usar fallback
  if (!roleTemplate) {
    roleTemplate = getFallbackTemplate();
    usedFallback = true;
    console.warn(
      `[TemplateService] Role '${roleSlug}' sem template, usando fallback: ${DEFAULT_FALLBACK_TEMPLATE_ID}`
    );
  }

  // 2. Resolver template de abordagem (opcional)
  let approachTemplate: ClinicalTemplate | null = null;
  
  if (approachSlug) {
    const approachTemplateId = getTemplateIdForApproach(approachSlug);
    if (approachTemplateId) {
      approachTemplate = getTemplateById(approachTemplateId);
    }
  }

  // 3. Montar resultado
  const activeTemplates: ClinicalTemplate[] = [roleTemplate];
  if (approachTemplate) {
    activeTemplates.push(approachTemplate);
  }

  return {
    activeRoleTemplate: roleTemplate,
    activeApproachTemplate: approachTemplate,
    activeTemplates,
    usedFallback
  };
}

/**
 * Cria resultado de fallback (usado em caso de erro ou usuário sem profile)
 */
function createFallbackResult(): ActiveTemplatesResult {
  const fallbackTemplate = getFallbackTemplate();
  
  return {
    activeRoleTemplate: fallbackTemplate,
    activeApproachTemplate: null,
    activeTemplates: [fallbackTemplate],
    usedFallback: true
  };
}

/**
 * ============================================================================
 * HELPERS DE VERIFICAÇÃO
 * ============================================================================
 */

/**
 * Verifica se um usuário tem um template específico ativo
 */
export function hasActiveTemplate(
  result: ActiveTemplatesResult,
  templateId: string
): boolean {
  return result.activeTemplates.some(t => t.id === templateId);
}

/**
 * Verifica se um usuário tem suporte para feature clínica
 */
export function supportsFeature(
  result: ActiveTemplatesResult,
  feature: 'complaint' | 'sessionEvaluation' | 'evolution'
): boolean {
  const featureMap = {
    complaint: 'supportsComplaint',
    sessionEvaluation: 'supportsSessionEvaluation',
    evolution: 'supportsEvolution'
  } as const;

  const prop = featureMap[feature];
  
  return result.activeTemplates.some(t => t[prop]);
}
