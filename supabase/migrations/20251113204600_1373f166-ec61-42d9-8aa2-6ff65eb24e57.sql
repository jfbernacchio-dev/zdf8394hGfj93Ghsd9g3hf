-- Adicionar campo nfse_emission_mode à tabela subordinate_autonomy_settings
ALTER TABLE public.subordinate_autonomy_settings 
ADD COLUMN nfse_emission_mode TEXT DEFAULT 'own_company' CHECK (nfse_emission_mode IN ('own_company', 'manager_company'));

-- Adicionar constraint: manager_company requer has_financial_access = true
ALTER TABLE public.subordinate_autonomy_settings 
ADD CONSTRAINT check_manager_company_requires_financial 
CHECK (
  nfse_emission_mode != 'manager_company' OR has_financial_access = true
);

-- Comentários para documentação
COMMENT ON COLUMN public.subordinate_autonomy_settings.nfse_emission_mode IS 
'Modo de emissão de NFSe: own_company (usa próprio CNPJ) ou manager_company (usa CNPJ do Full)';
