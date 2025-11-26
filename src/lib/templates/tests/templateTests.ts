/**
 * ============================================================================
 * FASE C2.2 - Template Service Tests
 * ============================================================================
 * 
 * Testes de sanity-check para o Template Service.
 * 
 * COMO EXECUTAR (temporário, para debug):
 * - Importe essa função em algum componente de teste
 * - Chame runTemplateServiceTests() no console ou useEffect
 * - Verifique os logs no console
 * 
 * Não é Jest/Vitest, são testes simples de runtime para validar lógica.
 */

import { resolveTemplatesFromSlugs } from '../templateService';
import { 
  getTemplateById, 
  getTemplateIdForRole,
  getFallbackTemplate,
  isTemplateFullyImplemented
} from '../templateRegistry';

/**
 * ============================================================================
 * FUNÇÕES DE TESTE
 * ============================================================================
 */

/**
 * Teste 1: Usuário psicólogo deve receber psychology_basic
 */
function test_psychologist_gets_psychology_basic() {
  console.log('\n[TEST 1] Psicólogo recebe psychology_basic');
  
  const result = resolveTemplatesFromSlugs('psychologist', null);
  
  console.assert(
    result.activeRoleTemplate?.id === 'psychology_basic',
    '❌ Role template deveria ser psychology_basic'
  );
  
  console.assert(
    result.activeApproachTemplate === null,
    '❌ Approach template deveria ser null (sem abordagem)'
  );
  
  console.assert(
    result.activeTemplates.length === 1,
    '❌ Deveria ter exatamente 1 template ativo'
  );
  
  console.assert(
    result.usedFallback === false,
    '❌ Não deveria ter usado fallback'
  );
  
  console.log('✅ Teste 1 passou:', result);
}

/**
 * Teste 2: Role desconhecido deve usar fallback
 */
function test_unknown_role_uses_fallback() {
  console.log('\n[TEST 2] Role desconhecido usa fallback');
  
  const result = resolveTemplatesFromSlugs('some_unknown_role', null);
  
  console.assert(
    result.activeRoleTemplate?.id === 'psychology_basic',
    '❌ Deveria usar psychology_basic como fallback'
  );
  
  console.assert(
    result.usedFallback === true,
    '❌ Flag usedFallback deveria ser true'
  );
  
  console.log('✅ Teste 2 passou:', result);
}

/**
 * Teste 3: Role null deve usar fallback
 */
function test_null_role_uses_fallback() {
  console.log('\n[TEST 3] Role null usa fallback');
  
  const result = resolveTemplatesFromSlugs(null, null);
  
  console.assert(
    result.activeRoleTemplate?.id === 'psychology_basic',
    '❌ Deveria usar psychology_basic como fallback'
  );
  
  console.assert(
    result.usedFallback === true,
    '❌ Flag usedFallback deveria ser true'
  );
  
  console.log('✅ Teste 3 passou:', result);
}

/**
 * Teste 4: Psicólogo com abordagem TCC (stub)
 */
function test_psychologist_with_tcc_approach() {
  console.log('\n[TEST 4] Psicólogo com abordagem TCC');
  
  const result = resolveTemplatesFromSlugs('psychologist', 'tcc');
  
  console.assert(
    result.activeRoleTemplate?.id === 'psychology_basic',
    '❌ Role template deveria ser psychology_basic'
  );
  
  console.assert(
    result.activeApproachTemplate?.id === 'tcc',
    '❌ Approach template deveria ser tcc'
  );
  
  console.assert(
    result.activeTemplates.length === 2,
    '❌ Deveria ter 2 templates ativos (role + approach)'
  );
  
  console.assert(
    result.usedFallback === false,
    '❌ Não deveria ter usado fallback'
  );
  
  console.log('✅ Teste 4 passou:', result);
}

/**
 * Teste 5: Psiquiatra deve receber psychology_basic
 */
function test_psychiatrist_gets_psychology_basic() {
  console.log('\n[TEST 5] Psiquiatra recebe psychology_basic');
  
  const result = resolveTemplatesFromSlugs('psychiatrist', null);
  
  console.assert(
    result.activeRoleTemplate?.id === 'psychology_basic',
    '❌ Role template deveria ser psychology_basic'
  );
  
  console.assert(
    result.usedFallback === false,
    '❌ Não deveria ter usado fallback'
  );
  
  console.log('✅ Teste 5 passou:', result);
}

/**
 * Teste 6: Verificar funções auxiliares do registry
 */
function test_registry_helpers() {
  console.log('\n[TEST 6] Helpers do registry');
  
  const psychologyTemplate = getTemplateById('psychology_basic');
  console.assert(
    psychologyTemplate !== null,
    '❌ getTemplateById deveria retornar template'
  );
  
  const roleTemplateId = getTemplateIdForRole('psychologist');
  console.assert(
    roleTemplateId === 'psychology_basic',
    '❌ getTemplateIdForRole deveria retornar psychology_basic'
  );
  
  const fallback = getFallbackTemplate();
  console.assert(
    fallback.id === 'psychology_basic',
    '❌ getFallbackTemplate deveria retornar psychology_basic'
  );
  
  const isImplemented = isTemplateFullyImplemented(psychologyTemplate!);
  console.assert(
    isImplemented === true,
    '❌ psychology_basic deveria estar completamente implementado'
  );
  
  console.log('✅ Teste 6 passou');
}

/**
 * ============================================================================
 * RUNNER PRINCIPAL
 * ============================================================================
 */

/**
 * Executa todos os testes do Template Service
 * 
 * PARA TESTAR:
 * - Abra o console do navegador
 * - Importe e execute: runTemplateServiceTests()
 */
export function runTemplateServiceTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  FASE C2.2 - Template Service Tests                   ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  try {
    test_psychologist_gets_psychology_basic();
    test_unknown_role_uses_fallback();
    test_null_role_uses_fallback();
    test_psychologist_with_tcc_approach();
    test_psychiatrist_gets_psychology_basic();
    test_registry_helpers();
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TODOS OS TESTES PASSARAM                           ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    return true;
  } catch (error) {
    console.error('\n❌ ERRO AO EXECUTAR TESTES:', error);
    return false;
  }
}

/**
 * Exporta também para uso em componentes de debug
 */
export const templateTests = {
  test_psychologist_gets_psychology_basic,
  test_unknown_role_uses_fallback,
  test_null_role_uses_fallback,
  test_psychologist_with_tcc_approach,
  test_psychiatrist_gets_psychology_basic,
  test_registry_helpers,
};
