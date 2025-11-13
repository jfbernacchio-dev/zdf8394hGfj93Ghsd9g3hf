/**
 * Helper para buscar configuração NFSe considerando autonomia de subordinados
 * Retorna a config correta baseada no modo de emissão (própria empresa ou empresa do manager)
 */

export interface NFSeConfigResult {
  config: any;
  isUsingManagerConfig: boolean;
  originalUserId: string;
  configOwnerId: string;
}

/**
 * Retorna a configuração NFSe correta considerando autonomia do subordinado
 * @param userId - ID do usuário que está emitindo a nota
 * @param supabaseClient - Cliente Supabase com auth
 * @returns Objeto com config e metadados sobre qual config foi usada
 */
export async function getNFSeConfigForUser(
  userId: string, 
  supabaseClient: any
): Promise<NFSeConfigResult> {
  console.log(`[getNFSeConfigForUser] Verificando config para user: ${userId}`);
  
  // 1. Verificar se é subordinado e qual modo de emissão
  const { data: autonomy, error: autonomyError } = await supabaseClient
    .from('subordinate_autonomy_settings')
    .select('nfse_emission_mode, manager_id')
    .eq('subordinate_id', userId)
    .maybeSingle();

  if (autonomyError) {
    console.error('[getNFSeConfigForUser] Erro ao buscar autonomia:', autonomyError);
  }

  // 2. Determinar qual user_id usar para buscar config
  const isUsingManagerConfig = autonomy?.nfse_emission_mode === 'manager_company';
  const configUserId = isUsingManagerConfig ? autonomy.manager_id : userId;

  console.log(`[getNFSeConfigForUser] Modo: ${autonomy?.nfse_emission_mode || 'own_company (padrão)'}`);
  console.log(`[getNFSeConfigForUser] Buscando config de: ${configUserId} ${isUsingManagerConfig ? '(MANAGER)' : '(PRÓPRIO)'}`);

  // 3. Buscar configuração NFSe
  const { data: config, error: configError } = await supabaseClient
    .from('nfse_config')
    .select('*')
    .eq('user_id', configUserId)
    .maybeSingle();

  if (configError) {
    console.error('[getNFSeConfigForUser] Erro ao buscar config:', configError);
    throw new Error(`Erro ao buscar configuração NFSe: ${configError.message}`);
  }

  if (!config) {
    const userType = isUsingManagerConfig ? 'do gestor' : 'própria';
    throw new Error(
      `Configuração NFSe ${userType} não encontrada. ` +
      `Configure em NFSe > Configuração${isUsingManagerConfig ? ' (gestor deve configurar)' : ''}`
    );
  }

  console.log(`[getNFSeConfigForUser] Config encontrada! CNPJ: ${config.cnpj || 'N/A'}`);

  return {
    config,
    isUsingManagerConfig,
    originalUserId: userId,
    configOwnerId: configUserId
  };
}
