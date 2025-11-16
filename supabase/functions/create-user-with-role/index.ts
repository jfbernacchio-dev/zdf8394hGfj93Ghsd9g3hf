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
    
    // Client com service role para criar usuários
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Client normal para verificar permissões do usuário logado
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
        JSON.stringify({ error: 'Apenas administradores podem criar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pegar dados do novo usuário
    const requestBody = await req.json();
    const { email, password, full_name, cpf, crp, birth_date, role } = requestBody;

    // 🔍 LOG DIAGNÓSTICO 4: Request recebido na Edge Function
    console.log('=== EDGE FUNCTION - REQUEST RECEBIDO ===');
    console.log('Body completo:', JSON.stringify(requestBody, null, 2));
    console.log('Role extraído:', role);
    console.log('Tipo do role:', typeof role);
    console.log('========================================');

    if (!email || !password || !role) {
      console.log('❌ Erro: Campos obrigatórios faltando');
      return new Response(
        JSON.stringify({ error: 'Email, senha e role são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar role
    const validRoles = ['admin', 'accountant', 'fulltherapist'];
    console.log('Roles válidos:', validRoles);
    console.log('Role está em validRoles?', validRoles.includes(role));
    
    if (!validRoles.includes(role)) {
      console.log('❌ Erro: Role inválido recebido:', role);
      return new Response(
        JSON.stringify({ error: 'Role inválido. Use: admin, accountant ou fulltherapist' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Role válido! Prosseguindo...');

    // Criar usuário usando admin client
    const metadata: Record<string, string> = {
      full_name: full_name || '',
      cpf: cpf || '',
      birth_date: birth_date || '2000-01-01',
    };

    // Apenas terapeutas e admins precisam de CRP
    if (role === 'fulltherapist' || role === 'admin') {
      metadata.crp = crp || '';
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: metadata,
    });

    if (createError) {
      console.error('Erro ao criar usuário:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não foi criado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Usuário criado com sucesso: ${newUser.user.id}`);

    // Aguardar trigger criar profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Inserir role usando admin client (bypassa RLS)
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role,
      });

    if (roleInsertError) {
      console.error('Erro ao inserir role:', roleInsertError);
      // Tentar deletar o usuário criado
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      
      return new Response(
        JSON.stringify({ error: `Erro ao atribuir role: ${roleInsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Role ${role} atribuído ao usuário ${newUser.user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário criado com sucesso',
        userId: newUser.user.id,
        email: newUser.user.email,
        role: role
      }),
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