import { supabase } from '@/integrations/supabase/client';

/**
 * ============================================================================
 * FASE 10.10: User Organization Sanitization
 * ============================================================================
 * 
 * Função para garantir que o usuário tenha organization_id correto após login.
 * Executa validação e correção automática de dados órfãos.
 * 
 * ============================================================================
 */

interface SanitizationResult {
  success: boolean;
  organizationId: string | null;
  errors: string[];
  fixed: string[];
}

/**
 * Sanitiza e valida o organization_id do usuário após login.
 * 
 * 1. Verifica se profiles.organization_id existe
 * 2. Se não existir, chama resolve_organization_for_user()
 * 3. Valida se organization_levels e user_positions batem
 * 4. Retorna resultado com erros/correções aplicadas
 */
export async function sanitizeUserOrganizationId(
  userId: string
): Promise<SanitizationResult> {
  const result: SanitizationResult = {
    success: false,
    organizationId: null,
    errors: [],
    fixed: [],
  };

  try {
    // 1. Buscar profile atual
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, organization_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      result.errors.push('Profile não encontrado');
      return result;
    }

    // 2. Se organization_id é NULL, tentar resolver
    if (!profile.organization_id) {
      result.errors.push('organization_id NULL no profile');

      // Chamar função RPC para resolver
      const { data: resolvedOrgId, error: rpcError } = await supabase
        .rpc('resolve_organization_for_user', { _user_id: userId });

      if (rpcError) {
        result.errors.push(`Erro ao resolver organização: ${rpcError.message}`);
        return result;
      }

      if (resolvedOrgId) {
        // Atualizar profile com organização resolvida
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ organization_id: resolvedOrgId })
          .eq('id', userId);

        if (updateError) {
          result.errors.push(`Erro ao atualizar profile: ${updateError.message}`);
          return result;
        }

        result.fixed.push('organization_id resolvido e atualizado');
        result.organizationId = resolvedOrgId;
      } else {
        result.errors.push('Não foi possível resolver organization_id');
        return result;
      }
    } else {
      result.organizationId = profile.organization_id;
    }

    // 3. Validar user_positions e organization_levels
    const { data: position, error: posError } = await supabase
      .from('user_positions')
      .select(`
        position_id,
        organization_positions (
          level_id,
          organization_levels (
            organization_id
          )
        )
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (posError) {
      result.errors.push(`Erro ao validar posição: ${posError.message}`);
    } else if (position) {
      const posOrgId = (position.organization_positions as any)
        ?.organization_levels?.organization_id;

      if (posOrgId && posOrgId !== result.organizationId) {
        result.errors.push(
          `Inconsistência: profile.org=${result.organizationId}, position.org=${posOrgId}`
        );
      }
    }

    // 4. Validar organization_owners
    const { data: ownership, error: ownError } = await supabase
      .from('organization_owners')
      .select('organization_id, is_primary')
      .eq('user_id', userId);

    if (ownError) {
      result.errors.push(`Erro ao validar ownership: ${ownError.message}`);
    } else if (ownership && ownership.length > 0) {
      const ownedOrgIds = ownership.map(o => o.organization_id);
      if (result.organizationId && !ownedOrgIds.includes(result.organizationId)) {
        result.errors.push(
          `Usuário não é dono de organization_id=${result.organizationId}`
        );
      }
    }

    // Sucesso se tiver organizationId e nenhum erro crítico
    result.success = !!result.organizationId && result.errors.length === 0;

    return result;
  } catch (error) {
    result.errors.push(`Erro inesperado: ${error}`);
    return result;
  }
}
