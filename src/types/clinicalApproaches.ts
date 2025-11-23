/**
 * FASE A1 - Clinical Approaches Types
 * 
 * Tipos para a tabela clinical_approaches.
 * Define abordagens clínicas específicas por professional_role.
 */

export interface ClinicalApproach {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  professional_role_id: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Slugs conhecidos de abordagens clínicas
 * Pode ser expandido conforme novas abordagens são adicionadas
 */
export type ClinicalApproachSlug = 
  | 'tcc'
  | 'psicologia_analitica'
  | 'psicanalise'
  | 'fenomenologia'
  | 'behaviorismo'
  | (string & {}); // Permite expansão futura

/**
 * Helper type para opções de abordagens (usado em dropdowns, selects, etc.)
 */
export interface ClinicalApproachOption {
  id: string;
  slug: string;
  label: string;
}

/**
 * Helper types para insert/update
 */
export type ClinicalApproachInsert = Omit<ClinicalApproach, 'id' | 'created_at' | 'updated_at'>;
export type ClinicalApproachUpdate = Partial<ClinicalApproachInsert>;
