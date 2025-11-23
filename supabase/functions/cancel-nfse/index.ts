import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nfseId, cancelReason } = await req.json();

    if (!cancelReason || !cancelReason.trim()) {
      throw new Error('Motivo do cancelamento é obrigatório');
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    console.log('Cancelling NFSe:', nfseId, 'Reason:', cancelReason);

    // Load NFSe record
    const { data: nfseRecord, error: nfseError } = await supabase
      .from('nfse_issued')
      .select('*')
      .eq('id', nfseId)
      .eq('user_id', user.id)
      .single();

    if (nfseError || !nfseRecord) {
      throw new Error('NFSe não encontrada');
    }

    if (nfseRecord.status !== 'issued') {
      throw new Error('Apenas notas emitidas podem ser canceladas');
    }

    // Load config to get token (FASE N4: usando novo helper organizacional)
    const { getEffectiveNFSeConfigForUser } = await import('../_shared/organizationNFSeConfigHelper.ts');
    const { config, isUsingManagerConfig, configOwnerId, source } = await getEffectiveNFSeConfigForUser(
      user.id,
      supabase
    );
    
    console.log(`[N4] Cancelling NFSe with config from: ${configOwnerId} (source: ${source})${isUsingManagerConfig ? ' [MANAGER]' : ' [OWN]'}`);

    // Get the appropriate token based on NFSe environment
    const tokenField = nfseRecord.environment === 'producao' 
      ? config.focusnfe_token_production 
      : config.focusnfe_token_homologacao;

    if (!tokenField) {
      throw new Error(`Token FocusNFe não configurado para ambiente ${nfseRecord.environment}`);
    }

    // Decrypt the FocusNFe token
    const decryptResponse = await supabase.functions.invoke('decrypt-credentials', {
      body: { 
        encryptedData: tokenField,
        credentialType: 'focusnfe_token',
        credentialId: config.id
      },
      headers: {
        Authorization: authHeader,
      },
    });

    if (decryptResponse.error || !decryptResponse.data?.decrypted) {
      console.error('Failed to decrypt FocusNFe token:', decryptResponse.error);
      throw new Error('Erro ao descriptografar credenciais');
    }

    const decryptedToken = decryptResponse.data.decrypted.trim();
    console.log('Token decrypted successfully');

    // Call FocusNFe API to cancel
    const focusNFeUrl = nfseRecord.environment === 'producao'
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    const authValue = btoa(decryptedToken + ':');
    
    console.log('Cancelling at:', `${focusNFeUrl}/v2/nfse/${nfseRecord.focusnfe_ref}`);

    const cancelPayload = {
      justificativa: cancelReason,
    };

    const cancelResponse = await fetch(`${focusNFeUrl}/v2/nfse/${nfseRecord.focusnfe_ref}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${authValue}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cancelPayload),
    });

    const cancelText = await cancelResponse.text();
    console.log('FocusNFe cancel response status:', cancelResponse.status);
    console.log('FocusNFe cancel response text:', cancelText);

    let cancelResult: any;
    try {
      cancelResult = JSON.parse(cancelText);
    } catch (e) {
      console.error('Failed to parse FocusNFe response as JSON:', e);
      throw new Error(`Erro na comunicação com FocusNFe (Status ${cancelResponse.status})`);
    }

    if (!cancelResponse.ok) {
      throw new Error(cancelResult.erro || cancelResult.mensagem || 'Erro ao cancelar NFSe');
    }

    console.log('FocusNFe cancel result:', cancelResult);

    // After successful cancellation, get the updated status with the new PDF
    console.log('Fetching updated NFSe with cancelled PDF...');
    
    const statusResponse = await fetch(`${focusNFeUrl}/v2/nfse/${nfseRecord.focusnfe_ref}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authValue}`,
      },
    });

    const statusText = await statusResponse.text();
    let statusResult: any;
    
    try {
      statusResult = JSON.parse(statusText);
    } catch (e) {
      console.error('Failed to parse status response:', e);
      // Continue with cancellation even if we can't get the updated PDF
      statusResult = null;
    }

    // Update record with cancellation info
    const updateData: any = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: cancelReason,
    };

    // If we got the updated PDF URL (with CANCELADA watermark), update it
    if (statusResult && statusResult.url_danfse) {
      console.log('Updating with cancelled PDF URL:', statusResult.url_danfse);
      updateData.pdf_url = statusResult.url_danfse;
    }

    await supabase
      .from('nfse_issued')
      .update(updateData)
      .eq('id', nfseId);

    console.log('NFSe cancelled successfully in database');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'NFSe cancelada com sucesso',
        data: cancelResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in cancel-nfse:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro ao cancelar NFSe',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
