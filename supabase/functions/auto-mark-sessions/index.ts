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
      console.error('Error fetching scheduled sessions:', fetchError);
      throw fetchError;
    }

    console.log('Found scheduled sessions:', scheduledSessions?.length || 0);

    // Get all unscheduled sessions for today
    const { data: unscheduledSessions, error: unscheduledFetchError } = await supabaseClient
      .from('sessions')
      .select('*, patients!inner(*)')
      .eq('status', 'unscheduled')
      .eq('date', todayStr);

    if (unscheduledFetchError) {
      console.error('Error fetching unscheduled sessions:', unscheduledFetchError);
      throw unscheduledFetchError;
    }

    console.log('Found unscheduled sessions:', unscheduledSessions?.length || 0);

    let updatedCount = 0;

    // Update scheduled sessions to attended
    if (scheduledSessions && scheduledSessions.length > 0) {
      const scheduledIds = scheduledSessions.map(s => s.id);
      const { error: updateError } = await supabaseClient
        .from('sessions')
        .update({ status: 'attended' })
        .in('id', scheduledIds);

      if (updateError) {
        console.error('Error updating scheduled sessions:', updateError);
        throw updateError;
      }

      updatedCount += scheduledIds.length;
      console.log('Updated scheduled sessions to attended:', scheduledIds.length);
    }

    // Update unscheduled sessions to missed
    if (unscheduledSessions && unscheduledSessions.length > 0) {
      const unscheduledIds = unscheduledSessions.map(s => s.id);
      const { error: updateError } = await supabaseClient
        .from('sessions')
        .update({ status: 'missed' })
        .in('id', unscheduledIds);

      if (updateError) {
        console.error('Error updating unscheduled sessions:', updateError);
        throw updateError;
      }

      updatedCount += unscheduledIds.length;
      console.log('Updated unscheduled sessions to missed:', unscheduledIds.length);
    }

    if (updatedCount === 0) {
      return new Response(
        JSON.stringify({ message: 'No sessions to update', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // For each patient, ensure 4 future sessions exist
    const allSessions = [...(scheduledSessions || []), ...(unscheduledSessions || [])];
    const uniquePatients = [...new Map(allSessions.map(s => [s.patient_id, s.patients])).values()];
    
    for (const patient of uniquePatients) {
      console.log('Processing patient:', patient.name);
      
      // Import session utilities
      const { ensureFutureSessions } = await import('../_shared/sessionUtils.ts');
      await ensureFutureSessions(patient.id, patient, supabaseClient, 4);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Sessions updated successfully', 
        count: updatedCount,
        scheduled: scheduledSessions?.length || 0,
        unscheduled: unscheduledSessions?.length || 0,
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
