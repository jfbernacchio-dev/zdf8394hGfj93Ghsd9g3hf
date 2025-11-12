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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Client com service role para deletar usuários
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Client normal para verificar permissões
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar se o usuário logado é admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem deletar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pegar o ID do usuário a ser deletado
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ID do usuário é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o usuário a ser deletado é admin
    const { data: targetUserRoles, error: targetRolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (targetRolesError) {
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar permissões do usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Não permitir deletar admins
    if (targetUserRoles && targetUserRoles.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Não é permitido deletar usuários administradores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FASE 2: Verificar se usuário é um Therapist Full com subordinados
    const { data: subordinates, error: subordinatesError } = await supabaseClient
      .from('therapist_assignments')
      .select('subordinate_id')
      .eq('manager_id', userId);

    if (subordinatesError) {
      console.error('Erro ao verificar subordinados:', subordinatesError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar subordinados do terapeuta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se tem subordinados, deletar todos antes (cascade será automático via FK, mas vamos garantir)
    if (subordinates && subordinates.length > 0) {
      console.log(`Terapeuta Full com ${subordinates.length} subordinados será deletado. Cascade delete aplicado.`);
      
      // Os subordinados serão deletados automaticamente via cascade DELETE na FK
      // Mas podemos deletar explicitamente para ter mais controle e logs
      for (const sub of subordinates) {
        const { error: deleteSubError } = await supabaseAdmin.auth.admin.deleteUser(sub.subordinate_id);
        
        if (deleteSubError) {
          console.error(`Erro ao deletar subordinado ${sub.subordinate_id}:`, deleteSubError);
          // Continuar mesmo com erro, o cascade FK vai deletar
        } else {
          console.log(`Subordinado ${sub.subordinate_id} deletado com sucesso.`);
        }
      }
    }

    // Deletar o usuário usando admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Erro ao deletar usuário:', deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Usuário deletado com sucesso' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
