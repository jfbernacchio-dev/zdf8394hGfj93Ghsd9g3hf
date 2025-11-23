/**
 * FASE N3: Helper para resolução de configuração NFSe organizacional
 * 
 * Este helper implementa a lógica de fallback:
 * 1. Tenta buscar organization_nfse_config (preferido)
 * 2. Se não existir, busca nfse_config legacy do usuário
 * 3. Considera subordinate_autonomy_settings para subordinados
 */

interface OrganizationNFSeConfig {
  id: string;
  organization_id: string;
  cnpj: string | null;
  inscricao_municipal: string | null;
  razao_social: string | null;
  regime_tributario: string | null;
  anexo_simples: string | null;
  iss_rate: number | null;
  service_code: string | null;
  service_description: string | null;
  codigo_municipio: string | null;
  focusnfe_token_homologacao: string | null;
  focusnfe_token_production: string | null;
  focusnfe_environment: string | null;
  certificate_data: string | null;
  certificate_password: string | null;
  certificate_type: string | null;
  valid_until: string | null;
}

interface LegacyNFSeConfig {
  id: string;
  user_id: string;
  organization_id: string | null;
  cnpj: string | null;
  inscricao_municipal: string | null;
  razao_social: string | null;
  regime_tributario: string | null;
  anexo_simples: string | null;
  iss_rate: number | null;
  service_code: string | null;
  service_description: string | null;
  codigo_municipio: string | null;
  focusnfe_token_homologacao: string | null;
  focusnfe_token_production: string | null;
  focusnfe_environment: string | null;
  is_legacy: boolean | null;
}

interface EffectiveNFSeConfigResult {
  config: OrganizationNFSeConfig | LegacyNFSeConfig;
  isUsingManagerConfig: boolean;
  configOwnerId: string;
  source: 'organization' | 'legacy_user' | 'manager_organization';
}

/**
 * Busca a configuração NFSe efetiva para um usuário
 * 
 * Ordem de resolução:
 * 1. Se subordinado + nfse_emission_mode = 'manager_company':
 *    → Usar organization_nfse_config do gestor
 * 2. Se não é subordinado ou emission_mode = 'own_company':
 *    → Usar organization_nfse_config da própria organização
 * 3. Fallback (legacy):
 *    → Usar nfse_config do próprio usuário (para compatibilidade)
 * 
 * @param userId - ID do usuário que está emitindo NFSe
 * @param supabaseClient - Cliente Supabase com service_role_key
 * @returns Configuração efetiva e metadados de resolução
 */
export async function getEffectiveNFSeConfigForUser(
  userId: string,
  supabaseClient: any
): Promise<EffectiveNFSeConfigResult> {
  console.log(`[N3] Resolvendo config NFSe para usuário: ${userId}`);

  // Passo 1: Buscar organization_id do usuário
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('[N3] Erro ao buscar profile:', profileError);
    throw new Error('Perfil do usuário não encontrado');
  }

  const userOrganizationId = profile.organization_id;
  console.log(`[N3] Organization ID do usuário: ${userOrganizationId}`);

  // Passo 2: Verificar se é subordinado e qual modo de emissão usa
  const { data: autonomySettings, error: autonomyError } = await supabaseClient
    .from('subordinate_autonomy_settings')
    .select('manager_id, nfse_emission_mode')
    .eq('subordinate_id', userId)
    .maybeSingle();

  if (autonomyError) {
    console.error('[N3] Erro ao buscar autonomy settings:', autonomyError);
  }

  const isSubordinate = !!autonomySettings;
  const nfseEmissionMode = autonomySettings?.nfse_emission_mode || 'own_company';
  const managerId = autonomySettings?.manager_id;

  console.log(`[N3] É subordinado: ${isSubordinate}, Modo emissão: ${nfseEmissionMode}`);

  // Passo 3: Determinar qual organization_id buscar
  let targetOrganizationId = userOrganizationId;
  let isUsingManagerConfig = false;

  if (isSubordinate && nfseEmissionMode === 'manager_company' && managerId) {
    // Buscar organization_id do gestor
    const { data: managerProfile, error: managerError } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .eq('id', managerId)
      .single();

    if (managerError || !managerProfile) {
      console.error('[N3] Erro ao buscar profile do gestor:', managerError);
      console.warn('[N3] Fallback para organização do usuário');
    } else {
      targetOrganizationId = managerProfile.organization_id;
      isUsingManagerConfig = true;
      console.log(`[N3] Usando config da organização do gestor: ${targetOrganizationId}`);
    }
  }

  // Passo 4: Tentar buscar organization_nfse_config (preferido)
  if (targetOrganizationId) {
    const { data: orgConfig, error: orgConfigError } = await supabaseClient
      .from('organization_nfse_config')
      .select('*')
      .eq('organization_id', targetOrganizationId)
      .maybeSingle();

    if (orgConfig && !orgConfigError) {
      console.log(`[N3] ✅ Usando organization_nfse_config (org: ${targetOrganizationId})`);
      return {
        config: orgConfig,
        isUsingManagerConfig,
        configOwnerId: targetOrganizationId,
        source: isUsingManagerConfig ? 'manager_organization' : 'organization'
      };
    } else {
      console.log(`[N3] ⚠️ organization_nfse_config não encontrada para org ${targetOrganizationId}`);
    }
  }

  // Passo 5: Fallback para legacy nfse_config do usuário
  console.log('[N3] Tentando fallback para legacy nfse_config...');
  
  // Se é subordinado usando manager_company, buscar config do gestor
  const targetUserId = (isSubordinate && nfseEmissionMode === 'manager_company' && managerId)
    ? managerId
    : userId;

  const { data: legacyConfig, error: legacyError } = await supabaseClient
    .from('nfse_config')
    .select('*')
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (legacyConfig && !legacyError) {
    console.log(`[N3] ✅ Usando legacy nfse_config (user: ${targetUserId})`);
    return {
      config: legacyConfig,
      isUsingManagerConfig: targetUserId !== userId,
      configOwnerId: targetUserId,
      source: 'legacy_user'
    };
  }

  // Passo 6: Nenhuma config encontrada
  console.error('[N3] ❌ Nenhuma configuração NFSe encontrada');
  throw new Error(
    'Configuração fiscal não encontrada. Configure os dados fiscais antes de emitir NFSe.'
  );
}

/**
 * Busca certificado digital para a configuração efetiva
 * 
 * Se a config veio de organization_nfse_config, usa o certificado dela.
 * Se veio de legacy nfse_config, busca em nfse_certificates.
 */
export async function getEffectiveCertificate(
  configResult: EffectiveNFSeConfigResult,
  supabaseClient: any
): Promise<{
  certificate_data: string | null;
  certificate_password: string | null;
  certificate_type: string | null;
  valid_until: string | null;
} | null> {
  
  if (configResult.source === 'organization' || configResult.source === 'manager_organization') {
    // Certificado já vem na organization_nfse_config
    const config = configResult.config as OrganizationNFSeConfig;
    if (config.certificate_data) {
      return {
        certificate_data: config.certificate_data,
        certificate_password: config.certificate_password,
        certificate_type: config.certificate_type,
        valid_until: config.valid_until
      };
    }
    return null;
  }

  // Legacy: buscar em nfse_certificates
  const config = configResult.config as LegacyNFSeConfig;
  const { data: cert, error } = await supabaseClient
    .from('nfse_certificates')
    .select('certificate_data, certificate_password, certificate_type, valid_until')
    .eq('user_id', config.user_id)
    .maybeSingle();

  if (error) {
    console.error('[N3] Erro ao buscar certificado legacy:', error);
    return null;
  }

  return cert || null;
}
