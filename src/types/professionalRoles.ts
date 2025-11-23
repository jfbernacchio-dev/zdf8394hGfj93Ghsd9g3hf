/**
 * FASE 1.1 - Professional Roles Types
 * 
 * Tipos para a tabela professional_roles.
 * NÃO conectado ainda a AuthContext, signup ou team-management.
 * Preparação para FASE 1.2+
 */

export interface ProfessionalRole {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  is_clinical: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Slugs conhecidos de roles profissionais
 * Pode ser expandido conforme novos roles são adicionados no banco
 */
export type ProfessionalRoleSlug = 
  | 'psychologist'
  | 'psychiatrist'
  | 'nutritionist'
  | 'psychoanalyst'
  | 'occupational_therapist'
  | 'speech_therapist'
  | 'assistant'
  | 'accountant';

/**
 * Helper type para insert/update
 */
export type ProfessionalRoleInsert = Omit<ProfessionalRole, 'id' | 'created_at' | 'updated_at'>;
export type ProfessionalRoleUpdate = Partial<ProfessionalRoleInsert>;

/**
 * FASE 2.2 - Kind de role profissional
 * Categoriza um role como clínico, administrativo ou desconhecido
 */
export type ProfessionalRoleKind = 'clinical' | 'administrative' | 'unknown';
