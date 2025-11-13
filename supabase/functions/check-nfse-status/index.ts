import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getNFSeConfigForUser } from "../_shared/nfseConfigHelper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nfseId } = await req.json();

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

    console.log('Checking NFSe status for:', nfseId);

    // Load NFSe record with patient info
    const { data: nfseRecord, error: nfseError } = await supabase
      .from('nfse_issued')
      .select(`
        *,
        patients (
          name,
          email
        )
      `)
      .eq('id', nfseId)
      .eq('user_id', user.id)
      .single();

    if (nfseError || !nfseRecord) {
      throw new Error('NFSe não encontrada');
    }

    // Load config to get token (considerando autonomia de subordinado)
    const { config, isUsingManagerConfig, configOwnerId } = await getNFSeConfigForUser(
      nfseRecord.user_id,
      supabase
    );
    
    console.log(`Using NFSe config from: ${configOwnerId}${isUsingManagerConfig ? ' (MANAGER)' : ' (OWN)'}`);


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

    // Call FocusNFe API to check status
    const focusNFeUrl = nfseRecord.environment === 'producao'
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    const authValue = btoa(decryptedToken + ':');
    
    console.log('Checking status at:', `${focusNFeUrl}/v2/nfse/${nfseRecord.focusnfe_ref}`);

    const focusNFeResponse = await fetch(`${focusNFeUrl}/v2/nfse/${nfseRecord.focusnfe_ref}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authValue}`,
      },
    });

    const responseText = await focusNFeResponse.text();
    console.log('FocusNFe response status:', focusNFeResponse.status);
    console.log('FocusNFe response text:', responseText);

    let focusNFeResult: any;
    try {
      focusNFeResult = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse FocusNFe response as JSON:', e);
      throw new Error(`Erro na comunicação com FocusNFe (Status ${focusNFeResponse.status})`);
    }

    if (!focusNFeResponse.ok) {
      throw new Error(focusNFeResult.erro || focusNFeResult.mensagem || 'Erro ao consultar status da NFSe');
    }

    console.log('FocusNFe status result:', focusNFeResult);

    // Check if status changed to issued and we have a PDF URL
    const wasNotIssued = nfseRecord.status !== 'issued';
    const nowIssued = focusNFeResult.status === 'autorizado';
    const hasPdfUrl = focusNFeResult.url_danfse;

    // Update record with latest status
    const updateData: any = {
      status: focusNFeResult.status === 'autorizado' ? 'issued' : 
              focusNFeResult.status === 'erro_autorizacao' ? 'error' : 'processing',
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
    if (focusNFeResult.mensagem_sefaz) {
      updateData.error_message = focusNFeResult.mensagem_sefaz;
    }

    await supabase
      .from('nfse_issued')
      .update(updateData)
      .eq('id', nfseId);

    // Upload PDF to patient files if status changed to issued
    if (wasNotIssued && nowIssued && hasPdfUrl) {
      try {
        console.log('Downloading PDF from:', focusNFeResult.url_danfse);
        
        // Download PDF from FocusNFe
        const pdfResponse = await fetch(focusNFeResult.url_danfse);
        if (pdfResponse.ok) {
          const pdfBlob = await pdfResponse.blob();
          const pdfBuffer = await pdfBlob.arrayBuffer();
          
          // Generate filename: "Patient Name mon-yy"
          // Use the date of the last session included in this NFSe
          const sessionIds = nfseRecord.session_ids || [];
          let referenceDate = new Date(nfseRecord.issue_date);
          
          if (sessionIds.length > 0) {
            // Fetch sessions to get the last session date
            const { data: sessions, error: sessionsError } = await supabase
              .from('sessions')
              .select('date')
              .in('id', sessionIds)
              .order('date', { ascending: false })
              .limit(1);
            
            if (!sessionsError && sessions && sessions.length > 0) {
              referenceDate = new Date(sessions[0].date);
            }
          }
          
          const month = MONTHS[referenceDate.getMonth()];
          const year = referenceDate.getFullYear().toString().slice(-2);
          const patientName = (nfseRecord.patients as any)?.name || 'NFSe';
          
          // Sanitize patient name for file path: remove accents, replace spaces with underscores, remove special chars
          const sanitizedName = patientName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .replace(/_+/g, '_') // Replace multiple underscores with single
            .trim();
          
          const fileName = `${sanitizedName}_${month}-${year}.pdf`;
          const filePath = `${nfseRecord.patient_id}/${Date.now()}_${fileName}`;
          
          console.log('Uploading PDF as:', fileName);
          
          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('patient-files')
            .upload(filePath, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: false
            });
          
          if (!uploadError) {
            // Create patient_files record
            const { error: insertError } = await supabase
              .from('patient_files')
              .insert({
                patient_id: nfseRecord.patient_id,
                file_path: filePath,
                file_name: fileName,
                file_type: 'application/pdf',
                category: 'NFSe',
                uploaded_by: nfseRecord.user_id
              });
            
            if (!insertError) {
              console.log('PDF uploaded successfully to patient files');
            } else {
              console.error('Error inserting patient_files record:', insertError);
            }
          } else {
            console.error('Error uploading PDF to storage:', uploadError);
          }
        } else {
          console.error('Failed to download PDF, status:', pdfResponse.status);
        }
      } catch (pdfError) {
        console.error('Error processing PDF upload:', pdfError);
        // Don't fail the entire operation if PDF upload fails
      }

      // Mark only the sessions included in this NFSe as paid
      try {
        const sessionIds = nfseRecord.session_ids || [];
        
        if (sessionIds.length > 0) {
          console.log(`Marking ${sessionIds.length} sessions as paid for patient:`, nfseRecord.patient_id);
          
          const { error: updateError } = await supabase
            .from('sessions')
            .update({ paid: true })
            .in('id', sessionIds);
          
          if (updateError) {
            console.error('Error updating sessions to paid:', updateError);
          } else {
            console.log(`Successfully marked ${sessionIds.length} sessions as paid`);
          }
        } else {
          console.log('No session IDs found in this NFSe record - skipping payment update');
        }
      } catch (sessionError) {
        console.error('Error processing session payments:', sessionError);
        // Don't fail the entire operation if session update fails
      }

      // Send email automatically when NFSe is authorized
      const patientEmail = (nfseRecord.patients as any)?.email;
      if (patientEmail) {
        console.log('NFSe authorized, attempting to send email to:', patientEmail);
        
        try {
          // Use service role key to invoke the function
          const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          );
          
          const emailResult = await supabaseAdmin.functions.invoke('send-nfse-email', {
            body: { nfseId: nfseRecord.id },
          });
          
          if (emailResult.error) {
            console.error('Error sending NFSe email:', emailResult.error);
          } else if (emailResult.data?.success) {
            console.log('NFSe email sent successfully to:', patientEmail);
          } else {
            console.error('Email function returned error:', emailResult.data);
          }
        } catch (emailError) {
          console.error('Failed to invoke send-nfse-email:', emailError);
        }
      } else {
        console.log('No email found for patient, skipping email send');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: focusNFeResult.status,
        message: focusNFeResult.mensagem_sefaz || 'Status atualizado com sucesso',
        data: focusNFeResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-nfse-status:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro ao consultar status da NFSe',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
