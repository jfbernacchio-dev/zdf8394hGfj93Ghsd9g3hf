import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get current date in São Paulo timezone (UTC-3)
    const now = new Date();
    const saoPauloOffset = -3 * 60; // UTC-3 in minutes
    const saoPauloTime = new Date(now.getTime() + (saoPauloOffset + now.getTimezoneOffset()) * 60000);
    
    // Format as YYYY-MM-DD for São Paulo date
    const todayStr = saoPauloTime.toISOString().split('T')[0];
    
    console.log('Current UTC time:', now.toISOString());
    console.log('São Paulo time:', saoPauloTime.toISOString());
    console.log('Processing sessions for date:', todayStr);

    console.log('Auto-marking sessions for date:', todayStr);

    // Get all scheduled sessions for today
    const { data: scheduledSessions, error: fetchError } = await supabaseClient
      .from('sessions')
      .select('*, patients!inner(*)')
      .eq('status', 'scheduled')
      .eq('date', todayStr);

    if (fetchError) {
      console.error('Error fetching sessions:', fetchError);
      throw fetchError;
    }

    console.log('Found scheduled sessions:', scheduledSessions?.length || 0);

    if (!scheduledSessions || scheduledSessions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No sessions to update', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Update all sessions to attended
    const sessionIds = scheduledSessions.map(s => s.id);
    const { error: updateError } = await supabaseClient
      .from('sessions')
      .update({ status: 'attended' })
      .in('id', sessionIds);

    if (updateError) {
      console.error('Error updating sessions:', updateError);
      throw updateError;
    }

    console.log('Updated sessions:', sessionIds.length);

    // For each patient, ensure 4 future sessions exist
    const uniquePatients = [...new Map(scheduledSessions.map(s => [s.patient_id, s.patients])).values()];
    
    for (const patient of uniquePatients) {
      console.log('Processing patient:', patient.name);
      
      // Import session utilities
      const { ensureFutureSessions } = await import('../_shared/sessionUtils.ts');
      await ensureFutureSessions(patient.id, patient, supabaseClient, 4);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Sessions updated successfully', 
        count: sessionIds.length,
        patients: uniquePatients.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in auto-mark-sessions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
