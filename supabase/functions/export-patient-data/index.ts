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
    const { patientId } = await req.json();

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

    console.log('Exporting patient data for user:', user.id, 'patient:', patientId);

    // Load patient data
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('user_id', user.id)
      .single();

    if (patientError || !patient) {
      throw new Error('Paciente não encontrado ou sem permissão de acesso');
    }

    // Load sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });

    if (sessionsError) {
      console.error('Error loading sessions:', sessionsError);
    }

    // Load session history
    const { data: history, error: historyError } = await supabase
      .from('session_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('changed_at', { ascending: false });

    if (historyError) {
      console.error('Error loading history:', historyError);
    }

    // Load files
    const { data: files, error: filesError } = await supabase
      .from('patient_files')
      .select('*')
      .eq('patient_id', patientId)
      .order('uploaded_at', { ascending: false });

    if (filesError) {
      console.error('Error loading files:', filesError);
    }

    // Load NFSe issued
    const { data: nfse, error: nfseError } = await supabase
      .from('nfse_issued')
      .select('*')
      .eq('patient_id', patientId)
      .order('issue_date', { ascending: false });

    if (nfseError) {
      console.error('Error loading nfse:', nfseError);
    }

    // Compile all data
    const exportData = {
      export_date: new Date().toISOString(),
      patient: {
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        cpf: patient.cpf,
        birth_date: patient.birth_date,
        start_date: patient.start_date,
        session_day: patient.session_day,
        session_time: patient.session_time,
        session_value: patient.session_value,
        frequency: patient.frequency,
        status: patient.status,
        lgpd_consent_date: patient.lgpd_consent_date,
        created_at: patient.created_at,
        updated_at: patient.updated_at,
      },
      sessions: sessions || [],
      session_history: history || [],
      files: (files || []).map(f => ({
        file_name: f.file_name,
        file_type: f.file_type,
        category: f.category,
        uploaded_at: f.uploaded_at,
      })),
      nfse_issued: (nfse || []).map(n => ({
        nfse_number: n.nfse_number,
        issue_date: n.issue_date,
        service_value: n.service_value,
        iss_value: n.iss_value,
        net_value: n.net_value,
        status: n.status,
      })),
    };

    // Return as JSON (client will handle PDF generation)
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: exportData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in export-patient-data:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro ao exportar dados',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});