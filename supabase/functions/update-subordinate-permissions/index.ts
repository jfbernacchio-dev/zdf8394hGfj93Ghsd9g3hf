import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PermissionUpdateRequest {
  subordinateId: string;
  managesOwnPatients: boolean;
  hasFinancialAccess: boolean;
  nfseEmissionMode: 'own_company' | 'manager_company';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roles) {
      return new Response(
        JSON.stringify({ error: 'Only admins can update permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: PermissionUpdateRequest = await req.json();
    const { subordinateId, managesOwnPatients, hasFinancialAccess, nfseEmissionMode } = body;

    console.log('[update-subordinate-permissions] Request:', {
      subordinateId,
      managesOwnPatients,
      hasFinancialAccess,
      nfseEmissionMode,
      managerId: user.id
    });

    // Validate: hasFinancialAccess requires managesOwnPatients
    if (hasFinancialAccess && !managesOwnPatients) {
      return new Response(
        JSON.stringify({ 
          error: 'hasFinancialAccess requer managesOwnPatients = true',
          code: 'INVALID_PERMISSION_COMBINATION'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the subordinate belongs to this manager
    const { data: assignment } = await supabase
      .from('therapist_assignments')
      .select('id')
      .eq('manager_id', user.id)
      .eq('subordinate_id', subordinateId)
      .maybeSingle();

    if (!assignment) {
      return new Response(
        JSON.stringify({ error: 'Subordinate not found or not under your management' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update or insert autonomy settings
    const { data: existing } = await supabase
      .from('subordinate_autonomy_settings')
      .select('id')
      .eq('subordinate_id', subordinateId)
      .maybeSingle();

    let result;
    if (existing) {
      // Update
      result = await supabase
        .from('subordinate_autonomy_settings')
        .update({
          manages_own_patients: managesOwnPatients,
          has_financial_access: hasFinancialAccess,
          nfse_emission_mode: nfseEmissionMode,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert
      result = await supabase
        .from('subordinate_autonomy_settings')
        .insert({
          subordinate_id: subordinateId,
          manager_id: user.id,
          manages_own_patients: managesOwnPatients,
          has_financial_access: hasFinancialAccess,
          nfse_emission_mode: nfseEmissionMode
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('[update-subordinate-permissions] Error:', result.error);
      throw result.error;
    }

    // Create notification for subordinate
    await supabase
      .from('system_notifications')
      .insert({
        user_id: subordinateId,
        title: 'Permissões Atualizadas',
        message: 'Suas permissões de acesso foram atualizadas pelo administrador.',
        category: 'system',
        severity: 'info',
        action_url: '/dashboard'
      });

    console.log('[update-subordinate-permissions] Success:', result.data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result.data,
        message: 'Permissões atualizadas com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[update-subordinate-permissions] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});