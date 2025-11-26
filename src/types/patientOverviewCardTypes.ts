/**
 * TIPOS PARA CARDS DA VISÃO GERAL DO PATIENT DETAIL
 * 
 * FASE C1.1: Estrutura preparatória para os cards da aba "Visão Geral"
 * 
 * Define interfaces e tipos necessários para:
 * - Props dos componentes de card
 * - Metadata de configuração dos cards
 * - Sistema de permissões por domínio
 */

/**
 * Props comuns para todos os cards da Visão Geral do paciente
 */
export interface PatientOverviewCardProps {
  /**
   * Se true, card está em modo de edição (drag & drop, resize)
   */
  isEditMode?: boolean;
  
  /**
   * Dados do paciente
   */
  patient?: any;
  
  /**
   * Sessões do paciente (para cards de sessões)
   */
  sessions?: any[];
  
  /**
   * NFSe emitidas (para cards financeiros)
   */
  nfseIssued?: any[];
  
  /**
   * Queixas clínicas (para cards clínicos)
   */
  complaints?: any[];
  
  /**
   * Data inicial do período (para filtros de cards)
   */
  start?: Date;
  
  /**
   * Data final do período (para filtros de cards)
   */
  end?: Date;
  
  /**
   * Classes CSS adicionais
   */
  className?: string;
  
  /**
   * FASE C1.8: Permissões simplificadas para controle de visibilidade
   */
  permissions?: {
    canAccessClinical?: boolean;
    financialAccess?: string;
    isOrganizationOwner?: boolean; // FASE C1.10.2: Para verificação de ownership
  };
  
  /**
   * FASE C1.10.2: ID do usuário atual (para verificação de ownership)
   */
  currentUserId?: string;
}

/**
 * Metadata de configuração de um card da Visão Geral
 * 
 * Define as características e permissões de cada tipo de card disponível
 */
export interface PatientOverviewCardMetadata {
  /**
   * ID único do card
   */
  id: string;
  
  /**
   * Nome exibido do card
   */
  label: string;
  
  /**
   * Descrição do que o card mostra
   */
  description?: string;
  
  /**
   * Domínio de permissão do card
   * - 'clinical': Dados clínicos (queixas, diagnósticos, evoluções)
   * - 'financial': Dados financeiros (valores, NFSe, pagamentos)
   * - 'administrative': Dados administrativos (sessões, agendamentos, contato, consentimento)
   */
  domain: 'clinical' | 'financial' | 'administrative';
  
  /**
   * FASE C1.10.2: Se true, card só pode ser visto pelo owner da org ou terapeuta responsável
   * Usado para proteger dados sensíveis (contato, CPF, dados pessoais)
   */
  requiresOwnership?: boolean;
  
  /**
   * Tipos de usuário permitidos
   * Ex: ['psychologist', 'psychiatrist']
   * Se undefined, permite todos os tipos
   */
  userType?: string[];
  
  /**
   * Abordagens clínicas específicas
   * Ex: ['psicopatologico', 'tcc', 'psicanalise']
   * Se undefined, permite todas as abordagens
   */
  approach?: string[];
}
