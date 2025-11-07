#!/bin/bash

# =============================================================================
# SCRIPT DE VERIFICAÇÃO DE SEGURANÇA - ESPAÇO MINDWARE
# =============================================================================
# Este script verifica se há credenciais expostas no código antes de commits
# Uso: ./security-check.sh
# =============================================================================

echo "======================================"
echo "🔒 AUDITORIA DE SEGURANÇA - Espaço Mindware"
echo "======================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# =============================================================================
# 1. VERIFICAR CREDENCIAIS HARDCODED
# =============================================================================
echo "📋 1. Verificando credenciais hardcoded..."
echo ""

# Buscar por padrões suspeitos (excluindo este próprio script e node_modules)
PATTERNS=(
  "password.*=.*['\"][^'\"]{8,}"
  "senha.*=.*['\"][^'\"]{8,}"
  "token.*=.*['\"][A-Za-z0-9_-]{20,}"
  "api_key.*=.*['\"][A-Za-z0-9_-]{20,}"
  "apikey.*=.*['\"][A-Za-z0-9_-]{20,}"
  "secret.*=.*['\"][A-Za-z0-9_-]{20,}"
  "Bearer [A-Za-z0-9_-]{20,}"
  "pk_live_[A-Za-z0-9]{20,}"
  "sk_live_[A-Za-z0-9]{20,}"
)

for pattern in "${PATTERNS[@]}"; do
  result=$(grep -rn -E "$pattern" src/ supabase/functions/ 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "security-check.sh")
  if [ ! -z "$result" ]; then
    echo -e "${RED}❌ ERRO: Possível credencial encontrada:${NC}"
    echo "$result"
    echo ""
    ((ERRORS++))
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Nenhuma credencial hardcoded encontrada${NC}"
fi
echo ""

# =============================================================================
# 2. VERIFICAR USO CORRETO DE VARIÁVEIS DE AMBIENTE
# =============================================================================
echo "📋 2. Verificando uso de variáveis de ambiente..."
echo ""

# Verificar se edge functions usam Deno.env.get
ENV_USAGE=$(grep -rn "Deno\.env\.get" supabase/functions/ 2>/dev/null | wc -l)
if [ $ENV_USAGE -gt 0 ]; then
  echo -e "${GREEN}✅ Edge functions usam Deno.env.get corretamente ($ENV_USAGE ocorrências)${NC}"
else
  echo -e "${YELLOW}⚠️  AVISO: Nenhuma variável de ambiente detectada em edge functions${NC}"
  ((WARNINGS++))
fi
echo ""

# =============================================================================
# 3. VERIFICAR SECRETS CONFIGURADOS
# =============================================================================
echo "📋 3. Verificando secrets necessários..."
echo ""

REQUIRED_SECRETS=(
  "WHATSAPP_VERIFY_TOKEN"
  "WHATSAPP_APP_SECRET"
  "WHATSAPP_API_TOKEN"
  "WHATSAPP_PHONE_NUMBER_ID"
  "ENCRYPTION_MASTER_KEY"
  "RESEND_API_KEY"
  "SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
  # Verificar se o secret é usado no código
  usage=$(grep -r "$secret" supabase/functions/ 2>/dev/null | grep -v ".git" | wc -l)
  if [ $usage -gt 0 ]; then
    echo -e "${GREEN}✅ $secret - usado em $usage arquivo(s)${NC}"
  fi
done
echo ""
echo -e "${YELLOW}ℹ️  IMPORTANTE: Verifique se todos os secrets estão configurados no Lovable Cloud${NC}"
echo ""

# =============================================================================
# 4. VERIFICAR ARQUIVOS SENSÍVEIS
# =============================================================================
echo "📋 4. Verificando arquivos sensíveis..."
echo ""

SENSITIVE_FILES=(
  ".env"
  ".env.local"
  ".env.production"
  "*.pem"
  "*.key"
  "*.pfx"
  "*credentials*.json"
)

FOUND_SENSITIVE=0
for file_pattern in "${SENSITIVE_FILES[@]}"; do
  found_files=$(find . -name "$file_pattern" -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null)
  if [ ! -z "$found_files" ]; then
    echo -e "${RED}❌ ERRO: Arquivo sensível encontrado: $file_pattern${NC}"
    echo "$found_files"
    echo ""
    ((ERRORS++))
    FOUND_SENSITIVE=1
  fi
done

if [ $FOUND_SENSITIVE -eq 0 ]; then
  echo -e "${GREEN}✅ Nenhum arquivo sensível encontrado${NC}"
fi
echo ""

# =============================================================================
# 5. VERIFICAR .gitignore
# =============================================================================
echo "📋 5. Verificando .gitignore..."
echo ""

GITIGNORE_ITEMS=(
  ".env"
  "*.local"
  "*.pem"
  "*.key"
  "*.pfx"
  "node_modules"
)

for item in "${GITIGNORE_ITEMS[@]}"; do
  if grep -q "^$item$" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ $item está no .gitignore${NC}"
  else
    echo -e "${YELLOW}⚠️  AVISO: $item NÃO está no .gitignore${NC}"
    ((WARNINGS++))
  fi
done
echo ""

# =============================================================================
# 6. VERIFICAR CPF/DADOS SENSÍVEIS EM COMENTÁRIOS
# =============================================================================
echo "📋 6. Verificando dados sensíveis em comentários..."
echo ""

# Buscar por CPFs (formato: XXX.XXX.XXX-XX ou XXXXXXXXXXX)
CPF_PATTERN="[0-9]{3}\.?[0-9]{3}\.?[0-9]{3}-?[0-9]{2}"
cpf_results=$(grep -rn -E "$CPF_PATTERN" src/ supabase/functions/ 2>/dev/null | grep -v "node_modules" | grep -v ".git")
if [ ! -z "$cpf_results" ]; then
  echo -e "${YELLOW}⚠️  AVISO: Possível CPF encontrado no código:${NC}"
  echo "$cpf_results"
  echo ""
  ((WARNINGS++))
else
  echo -e "${GREEN}✅ Nenhum CPF encontrado no código${NC}"
fi
echo ""

# =============================================================================
# RESUMO
# =============================================================================
echo "======================================"
echo "📊 RESUMO DA AUDITORIA"
echo "======================================"
echo -e "Erros críticos: ${RED}$ERRORS${NC}"
echo -e "Avisos: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ CÓDIGO SEGURO PARA COMMIT/PUSH${NC}"
  echo ""
  echo "✅ Nenhuma credencial hardcoded"
  echo "✅ Variáveis de ambiente usadas corretamente"
  echo "✅ Nenhum arquivo sensível no repositório"
  echo ""
  exit 0
else
  echo -e "${RED}❌ CÓDIGO NÃO SEGURO - CORRIJA OS ERROS ANTES DE COMMIT/PUSH${NC}"
  echo ""
  exit 1
fi
