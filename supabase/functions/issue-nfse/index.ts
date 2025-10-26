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
    const requestBody = await req.json();
    const { patientId, serviceValue, sessions } = requestBody;

    // Input validation
    if (!patientId || typeof patientId !== 'string') {
      throw new Error('ID do paciente inválido');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(patientId)) {
      throw new Error('Formato de ID do paciente inválido');
    }

    // Validate serviceValue
    const numericValue = Number(serviceValue);
    if (isNaN(numericValue) || numericValue <= 0 || numericValue > 100000) {
      throw new Error('Valor do serviço inválido. Deve ser entre R$ 0,01 e R$ 100.000,00');
    }

    // Validate sessions
    const numericSessions = Number(sessions);
    if (isNaN(numericSessions) || numericSessions <= 0 || numericSessions > 100 || !Number.isInteger(numericSessions)) {
      throw new Error('Número de sessões inválido. Deve ser entre 1 e 100');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    console.log('Issuing NFSe for user:', user.id, 'patient:', patientId);

    // Load config
    const { data: config, error: configError } = await supabase
      .from('nfse_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !config) {
      throw new Error('Configuração fiscal não encontrada. Configure em NFSe > Configuração');
    }

    if (!config.focusnfe_token) {
      throw new Error('Token FocusNFe não configurado');
    }

    // Load patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      throw new Error('Paciente não encontrado');
    }

    // Calculate values
    const issRate = Number(config.iss_rate) / 100;
    const issValue = serviceValue * issRate;
    const netValue = serviceValue - issValue;

    // Create NFSe record first
    const { data: nfseRecord, error: insertError } = await supabase
      .from('nfse_issued')
      .insert({
        user_id: user.id,
        patient_id: patientId,
        service_value: serviceValue,
        iss_value: issValue,
        net_value: netValue,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating NFSe record:', insertError);
      throw insertError;
    }

    console.log('NFSe record created:', nfseRecord.id);

    // Prepare FocusNFe payload
    const focusNFePayload = {
      data_emissao: new Date().toISOString().split('T')[0],
      natureza_operacao: '1', // Tributação no município
      prestador: {
        cnpj: config.cnpj,
        inscricao_municipal: config.inscricao_municipal,
        codigo_municipio: '3550308', // São Paulo
      },
      tomador: {
        cpf: patient.cpf.replace(/\D/g, ''),
        razao_social: patient.name,
        email: patient.email,
        codigo_municipio: '3550308', // Assumindo São Paulo
      },
      servico: {
        aliquota: config.iss_rate,
        discriminacao: `${config.service_description}\n\nPeríodo: ${sessions} sessão(ões)`,
        iss_retido: false,
        item_lista_servico: config.service_code,
        codigo_tributario_municipio: config.service_code,
        valor_servicos: serviceValue,
      },
    };

    console.log('Calling FocusNFe API...');

    // Call FocusNFe API
    const focusNFeUrl = config.focusnfe_environment === 'producao'
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    const focusNFeResponse = await fetch(`${focusNFeUrl}/v2/nfse?ref=${nfseRecord.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(config.focusnfe_token + ':')}`,
      },
      body: JSON.stringify(focusNFePayload),
    });

    const focusNFeResult = await focusNFeResponse.json();
    console.log('FocusNFe response:', focusNFeResult);

    if (!focusNFeResponse.ok) {
      // Update record with error
      await supabase
        .from('nfse_issued')
        .update({
          status: 'error',
          error_message: focusNFeResult.erro || focusNFeResult.mensagem || 'Erro desconhecido na emissão',
        })
        .eq('id', nfseRecord.id);

      throw new Error(focusNFeResult.erro || focusNFeResult.mensagem || 'Erro ao emitir NFSe via FocusNFe');
    }

    // Update record with success
    const updateData: any = {
      status: focusNFeResult.status === 'autorizado' ? 'issued' : 'processing',
      focusnfe_ref: nfseRecord.id,
    };

    if (focusNFeResult.numero) {
      updateData.nfse_number = focusNFeResult.numero;
    }
    if (focusNFeResult.codigo_verificacao) {
      updateData.verification_code = focusNFeResult.codigo_verificacao;
    }
    if (focusNFeResult.url) {
      updateData.pdf_url = focusNFeResult.url;
    }
    if (focusNFeResult.caminho_xml_nota_fiscal) {
      updateData.xml_url = focusNFeResult.caminho_xml_nota_fiscal;
    }

    await supabase
      .from('nfse_issued')
      .update(updateData)
      .eq('id', nfseRecord.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        nfseId: nfseRecord.id,
        status: focusNFeResult.status,
        message: focusNFeResult.mensagem_sefaz || 'NFSe emitida com sucesso',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in issue-nfse:', error);
    
    // Return generic error message to user, log details server-side
    const userMessage = error.message?.includes('inválido') || error.message?.includes('não encontrado')
      ? error.message
      : 'Erro ao processar solicitação de NFSe';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: userMessage,
      }),
      { 
        status: error.message?.includes('não autorizado') || error.message?.includes('não autenticado') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});