import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all admin users
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No admins found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date();
    const dayOfMonth = today.getDate();
    const notifications = [];

    for (const admin of admins) {
      // Check if it's the 1st of the month for monthly reviews
      if (dayOfMonth === 1) {
        // Check last log review (any admin)
        const { data: lastLogReview } = await supabase
          .from('log_reviews')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const daysSinceLastReview = lastLogReview
          ? Math.floor((today.getTime() - new Date(lastLogReview.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // Send reminder if last review was more than 25 days ago
        if (daysSinceLastReview >= 25) {
          notifications.push({
            user_id: admin.user_id,
            title: '📋 Revisão Mensal de Logs',
            message: 'É hora da revisão mensal dos logs de acesso! Revise os últimos 30 dias de acessos administrativos.',
            category: 'compliance',
            severity: 'warning',
            action_url: '/admin/log-review'
          });
        }

        // Check last backup test (any admin)
        const { data: lastBackupTest } = await supabase
          .from('backup_tests')
          .select('created_at')
          .eq('test_type', 'manual')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const daysSinceLastBackup = lastBackupTest
          ? Math.floor((today.getTime() - new Date(lastBackupTest.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // Send reminder if last backup test was more than 25 days ago
        if (daysSinceLastBackup >= 25) {
          notifications.push({
            user_id: admin.user_id,
            title: '💾 Teste Mensal de Backup',
            message: 'Execute o teste mensal de backup para verificar a integridade dos dados.',
            category: 'backup',
            severity: 'warning',
            action_url: '/admin/backup-tests'
          });
        }
      }

      // Check for quarterly permission review (any admin)
      const { data: lastPermissionReview } = await supabase
        .from('permission_reviews')
        .select('next_review_date, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastPermissionReview) {
        const nextReviewDate = new Date(lastPermissionReview.next_review_date);
        const daysUntilReview = Math.floor((nextReviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Send reminder 7 days before and on the day
        if (daysUntilReview <= 7 && daysUntilReview >= 0) {
          notifications.push({
            user_id: admin.user_id,
            title: '🔐 Revisão Trimestral de Permissões',
            message: daysUntilReview === 0 
              ? 'Hoje é o dia da revisão trimestral de permissões! Verifique todos os usuários e suas roles.'
              : `Faltam ${daysUntilReview} dias para a revisão trimestral de permissões.`,
            category: 'permission',
            severity: daysUntilReview <= 3 ? 'warning' : 'info',
            action_url: '/admin/permission-review'
          });
        }
      } else {
        // No previous review, suggest creating first one
        notifications.push({
          user_id: admin.user_id,
          title: '🔐 Primeira Revisão de Permissões',
          message: 'Configure sua primeira revisão trimestral de permissões para manter a conformidade com a LGPD.',
          category: 'permission',
          severity: 'info',
          action_url: '/admin/permission-review'
        });
      }

      // Check for open incidents that haven't been updated in 7 days
      const { data: staleIncidents } = await supabase
        .from('security_incidents')
        .select('id, title, status, updated_at')
        .in('status', ['reported', 'investigating', 'contained'])
        .lt('updated_at', new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (staleIncidents && staleIncidents.length > 0) {
        notifications.push({
          user_id: admin.user_id,
          title: '⚠️ Incidentes Pendentes',
          message: `Você tem ${staleIncidents.length} incidente(s) de segurança sem atualização há mais de 7 dias. Atualize o status.`,
          category: 'incident',
          severity: 'warning',
          action_url: '/admin/security-incidents'
        });
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error } = await supabase
        .from('system_notifications')
        .insert(notifications);

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: notifications.length,
        message: `Sent ${notifications.length} compliance reminders` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error sending compliance reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
