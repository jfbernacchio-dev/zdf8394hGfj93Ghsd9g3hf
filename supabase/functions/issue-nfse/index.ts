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
    const { patientId, sessionIds } = requestBody;

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

    // Input validation
    if (!patientId || typeof patientId !== 'string') {
      throw new Error('ID do paciente inválido');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(patientId)) {
      throw new Error('Formato de ID do paciente inválido');
    }

    // Validate sessionIds
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      throw new Error('Nenhuma sessão selecionada');
    }

    if (sessionIds.length > 100) {
      throw new Error('Número máximo de sessões excedido (máx: 100)');
    }

    // Validate all session IDs are valid UUIDs
    for (const sessionId of sessionIds) {
      if (!uuidRegex.test(sessionId)) {
        throw new Error('Formato de ID de sessão inválido');
      }
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

    // Get the appropriate token based on environment
    const tokenField = config.focusnfe_environment === 'producao' 
      ? config.focusnfe_token_production 
      : config.focusnfe_token_homologacao;

    if (!tokenField) {
      throw new Error(`Token FocusNFe não configurado para ambiente ${config.focusnfe_environment}`);
    }

    // Decrypt the FocusNFe token
    const decryptResponse = await supabase.functions.invoke('decrypt-credentials', {
      body: { encryptedData: tokenField },
      headers: {
        Authorization: authHeader,
      },
    });

    if (decryptResponse.error || !decryptResponse.data?.decrypted) {
      console.error('Failed to decrypt FocusNFe token:', decryptResponse.error);
      throw new Error('Erro ao descriptografar credenciais');
    }

    const decryptedToken = decryptResponse.data.decrypted.trim();
    console.log('Token decrypted successfully, length:', decryptedToken.length);

    // Load patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      throw new Error('Paciente não encontrado');
    }

    // Validate patient has required data for NFSe
    if (!patient.cpf) {
      throw new Error('Paciente precisa ter CPF cadastrado para emitir NFSe');
    }

    // Load sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .in('id', sessionIds)
      .eq('patient_id', patientId);

    if (sessionsError || !sessions || sessions.length === 0) {
      throw new Error('Sessões não encontradas');
    }

    // Verify all sessions belong to the user
    if (sessions.length !== sessionIds.length) {
      throw new Error('Algumas sessões não foram encontradas');
    }

    // Load user profile for invoice description
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil do usuário não encontrado');
    }

    // Calculate values
    const serviceValue = sessions.reduce((sum, s) => sum + Number(s.value), 0);
    const issRate = Number(config.iss_rate) / 100;
    const issValue = serviceValue * issRate;
    const netValue = serviceValue - issValue;

    // Generate service description
    const sessionDates = sessions.map(s => {
      const date = new Date(s.date);
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    }).join(', ');

    const serviceDescription = `${config.service_description}

Profissional: ${profile.full_name}
CPF: ${profile.cpf}
CRP: ${profile.crp}

Paciente: ${patient.name}
CPF: ${patient.cpf || 'Não informado'}

Sessões realizadas nas datas: ${sessionDates}
Quantidade de sessões: ${sessions.length}

Valor unitário por sessão: R$ ${Number(patient.session_value).toFixed(2).replace('.', ',')}
Valor total: R$ ${serviceValue.toFixed(2).replace('.', ',')}

Data de emissão: ${new Date().toLocaleDateString('pt-BR')}`;

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
        environment: config.focusnfe_environment,
        session_ids: sessionIds,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating NFSe record:', insertError);
      throw insertError;
    }

    console.log('NFSe record created:', nfseRecord.id);

    // Prepare FocusNFe payload
    // Get current date in Brazil timezone (UTC-3)
    const now = new Date();
    const brazilDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const dataEmissao = brazilDate.toISOString().split('T')[0];
    
    console.log('Emitting NFSe with date:', dataEmissao);
    
    const focusNFePayload = {
      data_emissao: dataEmissao,
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
        discriminacao: serviceDescription,
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

    console.log('FocusNFe URL:', `${focusNFeUrl}/v2/nfse?ref=${nfseRecord.id}`);
    console.log('Token length for auth:', decryptedToken.length);
    console.log('Auth header will be: Basic [token]:');

    const authValue = btoa(decryptedToken + ':');
    console.log('Base64 auth length:', authValue.length);

    const focusNFeResponse = await fetch(`${focusNFeUrl}/v2/nfse?ref=${nfseRecord.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authValue}`,
      },
      body: JSON.stringify(focusNFePayload),
    });

    // Get response as text first to handle non-JSON responses
    const responseText = await focusNFeResponse.text();
    console.log('FocusNFe response status:', focusNFeResponse.status);
    console.log('FocusNFe response text:', responseText);

    let focusNFeResult: any;
    try {
      focusNFeResult = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse FocusNFe response as JSON:', e);
      
      // Update record with error
      await supabase
        .from('nfse_issued')
        .update({
          status: 'error',
          error_message: `Erro na comunicação com FocusNFe (Status ${focusNFeResponse.status}). Verifique suas credenciais.`,
        })
        .eq('id', nfseRecord.id);

      throw new Error(`Erro na comunicação com FocusNFe (Status ${focusNFeResponse.status}). Resposta não é JSON válido. Verifique suas credenciais e configuração.`);
    }

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
    if (focusNFeResult.url_danfse) {
      updateData.pdf_url = focusNFeResult.url_danfse;
    }
    if (focusNFeResult.caminho_xml_nota_fiscal) {
      updateData.xml_url = focusNFeResult.caminho_xml_nota_fiscal;
    }

    const { error: updateError } = await supabase
      .from('nfse_issued')
      .update(updateData)
      .eq('id', nfseRecord.id);

    if (updateError) {
      console.error('Error updating NFSe record:', updateError);
    }

    // If NFSe was authorized and we have a PDF URL, send email automatically
    if (focusNFeResult.status === 'autorizado' && focusNFeResult.url_danfse && patient.email) {
      console.log('NFSe authorized, triggering email send...');
      
      // Trigger email send in background (don't wait for it)
      supabase.functions.invoke('send-nfse-email', {
        body: { nfseId: nfseRecord.id },
        headers: {
          Authorization: authHeader,
        },
      }).then(emailResult => {
        if (emailResult.error) {
          console.error('Error sending NFSe email:', emailResult.error);
        } else {
          console.log('NFSe email sent successfully');
        }
      }).catch(err => {
        console.error('Failed to invoke send-nfse-email:', err);
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        nfseId: nfseRecord.id,
        status: focusNFeResult.status,
        message: focusNFeResult.mensagem_sefaz || 'NFSe emitida com sucesso',
        emailSent: focusNFeResult.status === 'autorizado' && focusNFeResult.url_danfse && patient.email,
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