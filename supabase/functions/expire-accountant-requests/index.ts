import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting accountant requests expiration job...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar requests pendentes com mais de 1 dia
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: expiredRequests, error: fetchError } = await supabase
      .from('accountant_requests')
      .select('id, therapist_id, accountant_id')
      .eq('status', 'pending')
      .lt('requested_at', oneDayAgo.toISOString());

    if (fetchError) {
      console.error('❌ Error fetching expired requests:', fetchError);
      throw fetchError;
    }

    if (!expiredRequests || expiredRequests.length === 0) {
      console.log('✅ No expired requests found');
      return new Response(
        JSON.stringify({ message: 'No expired requests', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`📋 Found ${expiredRequests.length} expired request(s)`);

    let deletedAssignments = 0;
    let deletedRequests = 0;

    // Para cada request expirado, deletar assignment e request
    for (const request of expiredRequests) {
      try {
        console.log(`🗑️ Processing expired request: ${request.id}`);
        
        // 1. DELETAR ASSIGNMENT PRIMEIRO (permanente)
        const { error: assignError } = await supabase
          .from('accountant_therapist_assignments')
          .delete()
          .eq('therapist_id', request.therapist_id)
          .eq('accountant_id', request.accountant_id);

        if (assignError) {
          console.error(`❌ Error deleting assignment:`, assignError);
          // Continuar mesmo se assignment não existir (pode já ter sido deletado)
        } else {
          deletedAssignments++;
          console.log(`✅ Assignment deleted for therapist ${request.therapist_id}`);
        }

        // 2. DELETAR REQUEST
        const { error: requestError } = await supabase
          .from('accountant_requests')
          .delete()
          .eq('id', request.id);

        if (requestError) {
          console.error(`❌ Error deleting request:`, requestError);
          continue;
        }

        deletedRequests++;
        console.log(`✅ Request ${request.id} deleted successfully`);
      } catch (error) {
        console.error(`❌ Error processing request ${request.id}:`, error);
      }
    }

    console.log(`✅ Expiration job completed: ${deletedAssignments} assignments and ${deletedRequests} requests deleted`);

    return new Response(
      JSON.stringify({
        message: 'Expiration job completed successfully',
        deletedAssignments,
        deletedRequests,
        totalExpired: expiredRequests.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in expire-accountant-requests function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
