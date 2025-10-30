// Edge function to clean up audit logs older than 12 months
// Should be scheduled to run monthly via Supabase cron job
// Schedule: 0 2 1 * * (every 1st day of month at 2 AM UTC)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  success: boolean;
  deletedCount: number;
  message: string;
  executedAt: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify service role key (only allow scheduled calls)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting audit log cleanup...');

    // Call the cleanup function
    const { data, error } = await supabase.rpc('cleanup_old_audit_logs');

    if (error) {
      console.error('Error cleaning up logs:', error);
      throw error;
    }

    const deletedCount = data as number;
    const result: CleanupResult = {
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} audit log(s) older than 12 months`,
      executedAt: new Date().toISOString(),
    };

    console.log('Cleanup result:', result);

    // Log cleanup execution for audit trail
    await supabase.from('admin_access_log').insert({
      admin_id: '00000000-0000-0000-0000-000000000000', // System user
      access_type: 'view_sessions', // Reusing enum, represents system action
      access_reason: `Automated cleanup: deleted ${deletedCount} logs older than 12 months`,
    });

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Fatal error in cleanup function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        executedAt: new Date().toISOString(),
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
