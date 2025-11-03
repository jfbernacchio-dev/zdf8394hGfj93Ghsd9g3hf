import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    console.log('Retrying PDF upload for NFSe:', nfseId);

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

    if (!nfseRecord.pdf_url) {
      throw new Error('NFSe não possui URL de PDF');
    }

    console.log('Downloading PDF from:', nfseRecord.pdf_url);
    
    // Download PDF from FocusNFe
    const pdfResponse = await fetch(nfseRecord.pdf_url);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF, status: ${pdfResponse.status}`);
    }

    const pdfBlob = await pdfResponse.blob();
    const pdfBuffer = await pdfBlob.arrayBuffer();
    
    // Generate filename: "Patient_Name_mon-yy"
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
    
    // Sanitize patient name for file path
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
    
    if (uploadError) {
      console.error('Error uploading PDF to storage:', uploadError);
      throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message}`);
    }

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
    
    if (insertError) {
      console.error('Error inserting patient_files record:', insertError);
      throw new Error(`Erro ao criar registro de arquivo: ${insertError.message}`);
    }

    console.log('PDF uploaded successfully to patient files');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'PDF uploaded successfully',
        fileName,
        filePath
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in retry-nfse-pdf-upload:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro ao fazer upload do PDF',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});