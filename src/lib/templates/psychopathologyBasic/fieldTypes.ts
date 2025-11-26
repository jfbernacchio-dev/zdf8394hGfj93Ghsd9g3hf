/**
 * ============================================================================
 * FASE C2.3 - Psychopathology Basic Template - Field Types
 * ============================================================================
 * 
 * Tipos para configuração de campos do template psicopatológico.
 */

/**
 * Tipos de campos possíveis em um template
 */
export type FieldType = 
  | 'bipolar'      // -100 a +100 (ex: nível de consciência)
  | 'unipolar'     // 0 a 100 (ex: concentração)
  | 'boolean'      // true/false (ex: tem alucinação?)
  | 'enum'         // lista de opções (ex: severidade)
  | 'text'         // texto livre
  | 'number';      // número livre

/**
 * Configuração de um campo
 */
export interface FieldConfig {
  /** Tipo do campo */
  type: FieldType;
  
  /** Label para UI */
  label: string;
  
  /** Se o campo é obrigatório */
  required?: boolean;
  
  /** Valor mínimo (para numéricos) */
  min?: number;
  
  /** Valor máximo (para numéricos) */
  max?: number;
  
  /** Valor padrão */
  defaultValue?: any;
  
  /** Opções (para enum) */
  enumOptions?: string[];
  
  /** Descrição/ajuda */
  description?: string;
}

/**
 * Grupo de campos (ex: "Diagnóstico", "Risco")
 */
export interface FieldSection {
  /** ID da seção */
  id: string;
  
  /** Label da seção */
  label: string;
  
  /** Descrição da seção */
  description?: string;
  
  /** Campos da seção */
  fields: Record<string, FieldConfig>;
  
  /** Ordem de exibição */
  order?: number;
}
