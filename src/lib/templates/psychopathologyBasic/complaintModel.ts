/**
 * ============================================================================
 * FASE C2.3 - Psychopathology Basic - Complaint Model
 * ============================================================================
 * 
 * Definição declarativa da estrutura de Queixa Clínica no template psicopatológico.
 * 
 * Reflete exatamente o que existe na tabela clinical_complaints e no ClinicalComplaintForm.
 */

import type { FieldSection, FieldConfig } from './fieldTypes';

/**
 * ============================================================================
 * SEÇÕES DA QUEIXA CLÍNICA
 * ============================================================================
 */

/**
 * Seção: Diagnóstico (CID-10)
 */
export const DIAGNOSIS_SECTION: FieldSection = {
  id: 'diagnosis',
  label: 'Diagnóstico',
  description: 'Diagnóstico conforme CID-10 ou indicação de ausência de diagnóstico formal',
  order: 1,
  fields: {
    cid_code: {
      type: 'text',
      label: 'Código CID-10',
      required: false,
      description: 'Código do CID-10 (ex: F32.1)',
    },
    cid_title: {
      type: 'text',
      label: 'Título do CID-10',
      required: false,
      description: 'Descrição completa do diagnóstico',
    },
    cid_group: {
      type: 'text',
      label: 'Grupo CID-10',
      required: false,
      description: 'Grupo do CID (ex: F30-F39)',
    },
    has_no_diagnosis: {
      type: 'boolean',
      label: 'Sem diagnóstico formal',
      required: false,
      defaultValue: false,
      description: 'Marcar quando não há diagnóstico CID formal ainda',
    },
  },
};

/**
 * Seção: Caracterização Clínica
 */
export const CHARACTERIZATION_SECTION: FieldSection = {
  id: 'characterization',
  label: 'Caracterização Clínica',
  description: 'Características do quadro clínico atual',
  order: 2,
  fields: {
    onset_type: {
      type: 'enum',
      label: 'Tipo de Início',
      required: false,
      enumOptions: ['agudo', 'insidioso', 'subagudo'],
      description: 'Como o quadro se iniciou',
    },
    onset_duration_weeks: {
      type: 'number',
      label: 'Duração do Início (semanas)',
      required: false,
      min: 0,
      description: 'Há quanto tempo os sintomas começaram',
    },
    course: {
      type: 'enum',
      label: 'Curso',
      required: false,
      enumOptions: [
        'episódico',
        'contínuo',
        'recorrente',
        'progressivo',
        'em remissão',
      ],
      description: 'Padrão temporal do quadro',
    },
    severity: {
      type: 'enum',
      label: 'Gravidade',
      required: false,
      enumOptions: ['leve', 'moderado', 'grave', 'psicótico'],
      description: 'Intensidade geral do quadro',
    },
    functional_impairment: {
      type: 'enum',
      label: 'Prejuízo Funcional',
      required: false,
      enumOptions: [
        'nenhum',
        'mínimo',
        'leve',
        'moderado',
        'grave',
        'incapacitante',
      ],
      description: 'Quanto o quadro prejudica o funcionamento diário',
    },
  },
};

/**
 * Seção: Avaliação de Risco
 */
export const RISK_SECTION: FieldSection = {
  id: 'risk',
  label: 'Avaliação de Risco',
  description: 'Avaliação de riscos imediatos e vulnerabilidades',
  order: 3,
  fields: {
    suicidality: {
      type: 'enum',
      label: 'Suicidalidade',
      required: false,
      defaultValue: 'nenhum',
      enumOptions: ['nenhum', 'ideação', 'plano', 'tentativa'],
      description: 'Nível de risco suicida',
    },
    aggressiveness: {
      type: 'enum',
      label: 'Agressividade',
      required: false,
      defaultValue: 'nenhum',
      enumOptions: ['nenhum', 'verbal', 'física', 'grave'],
      description: 'Nível de agressividade',
    },
    vulnerabilities: {
      type: 'text', // Array de strings no banco
      label: 'Vulnerabilidades',
      required: false,
      description: 'Fatores de vulnerabilidade identificados (array)',
    },
  },
};

/**
 * Seção: Sintomas
 */
export const SYMPTOMS_SECTION: FieldSection = {
  id: 'symptoms',
  label: 'Sintomas',
  description: 'Sintomas associados ao diagnóstico',
  order: 4,
  fields: {
    // Na prática, os sintomas vêm de complaint_symptoms (tabela separada)
    // Aqui apenas documentamos a estrutura esperada
    symptom_label: {
      type: 'text',
      label: 'Rótulo do Sintoma',
      required: true,
      description: 'Nome/descrição do sintoma',
    },
    is_present: {
      type: 'boolean',
      label: 'Está Presente',
      required: false,
      defaultValue: true,
    },
    frequency: {
      type: 'enum',
      label: 'Frequência',
      required: false,
      enumOptions: ['raro', 'ocasional', 'frequente', 'constante'],
    },
    intensity: {
      type: 'number',
      label: 'Intensidade',
      required: false,
      min: 1,
      max: 5,
      defaultValue: 3,
      description: 'Escala 1-5',
    },
  },
};

/**
 * Seção: Medicações
 */
export const MEDICATIONS_SECTION: FieldSection = {
  id: 'medications',
  label: 'Medicações',
  description: 'Medicações em uso ou já utilizadas',
  order: 5,
  fields: {
    // Na prática, as medicações vêm de complaint_medications (tabela separada)
    // Aqui apenas documentamos a estrutura esperada
    class: {
      type: 'enum',
      label: 'Classe',
      required: true,
      enumOptions: [
        'Antidepressivo',
        'Ansiolítico',
        'Antipsicótico',
        'Estabilizador de Humor',
        'Estimulante',
        'Outro',
      ],
    },
    substance: {
      type: 'text',
      label: 'Substância',
      required: false,
      description: 'Nome do princípio ativo',
    },
    dosage: {
      type: 'text',
      label: 'Dosagem',
      required: false,
      description: 'Ex: 20mg',
    },
    frequency: {
      type: 'text',
      label: 'Frequência',
      required: false,
      description: 'Ex: 1x/dia',
    },
    start_date: {
      type: 'text',
      label: 'Data de Início',
      required: false,
      description: 'Formato ISO: YYYY-MM-DD',
    },
    is_current: {
      type: 'boolean',
      label: 'Em Uso Atual',
      required: false,
      defaultValue: true,
    },
    adverse_effects: {
      type: 'text',
      label: 'Efeitos Adversos',
      required: false,
    },
  },
};

/**
 * Seção: Notas Clínicas
 */
export const NOTES_SECTION: FieldSection = {
  id: 'notes',
  label: 'Notas Clínicas',
  description: 'Observações adicionais sobre a queixa',
  order: 6,
  fields: {
    clinical_notes: {
      type: 'text',
      label: 'Notas Clínicas',
      required: false,
      description: 'Campo livre para observações',
    },
  },
};

/**
 * ============================================================================
 * MODELO COMPLETO DA QUEIXA CLÍNICA
 * ============================================================================
 */

export interface ComplaintModelConfig {
  sections: FieldSection[];
  validationRules: {
    requiresCidOrNoDiagnosis: boolean;
  };
}

/**
 * Configuração completa do modelo de Queixa Clínica
 */
export const COMPLAINT_MODEL_CONFIG: ComplaintModelConfig = {
  sections: [
    DIAGNOSIS_SECTION,
    CHARACTERIZATION_SECTION,
    RISK_SECTION,
    SYMPTOMS_SECTION,
    MEDICATIONS_SECTION,
    NOTES_SECTION,
  ],
  validationRules: {
    requiresCidOrNoDiagnosis: true,
  },
};
