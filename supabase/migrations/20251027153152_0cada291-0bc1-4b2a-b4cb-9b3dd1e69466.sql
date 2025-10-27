-- Add environment field to nfse_issued to track if it was issued in production or homologation
ALTER TABLE nfse_issued ADD COLUMN environment text NOT NULL DEFAULT 'homologacao';

-- Add production token field to nfse_config
ALTER TABLE nfse_config ADD COLUMN focusnfe_token_production text;

-- Rename the existing token field to be more explicit
ALTER TABLE nfse_config RENAME COLUMN focusnfe_token TO focusnfe_token_homologacao;