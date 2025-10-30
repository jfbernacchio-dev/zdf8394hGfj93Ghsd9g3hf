import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ComplianceTask {
  name: string;
  description: string;
  frequency: string;
  lastDone: Date | null;
  nextDue: Date | null;
  status: 'overdue' | 'due-soon' | 'ok';
  url: string;
}

export const ComplianceReminder = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && isAdmin) {
      loadComplianceTasks();
    }
  }, [user, isAdmin]);

  const loadComplianceTasks = async () => {
    if (!user) return;

    const today = new Date();
    const tasksData: ComplianceTask[] = [];

    // Check Log Review (monthly)
    const { data: lastLogReview } = await supabase
      .from('log_reviews')
      .select('created_at')
      .eq('reviewed_by', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const daysSinceLogReview = lastLogReview
      ? differenceInDays(today, new Date(lastLogReview.created_at))
      : 999;

    tasksData.push({
      name: 'Revisão de Logs',
      description: 'Análise mensal dos logs de acesso',
      frequency: 'Mensal',
      lastDone: lastLogReview ? new Date(lastLogReview.created_at) : null,
      nextDue: lastLogReview 
        ? new Date(new Date(lastLogReview.created_at).setDate(new Date(lastLogReview.created_at).getDate() + 30))
        : today,
      status: daysSinceLogReview >= 30 ? 'overdue' : daysSinceLogReview >= 25 ? 'due-soon' : 'ok',
      url: '/admin/log-review'
    });

    // Check Backup Test (monthly)
    const { data: lastBackupTest } = await supabase
      .from('backup_tests')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const daysSinceBackup = lastBackupTest
      ? differenceInDays(today, new Date(lastBackupTest.created_at))
      : 999;

    tasksData.push({
      name: 'Teste de Backup',
      description: 'Verificação mensal da integridade dos backups',
      frequency: 'Mensal',
      lastDone: lastBackupTest ? new Date(lastBackupTest.created_at) : null,
      nextDue: lastBackupTest
        ? new Date(new Date(lastBackupTest.created_at).setDate(new Date(lastBackupTest.created_at).getDate() + 30))
        : today,
      status: daysSinceBackup >= 30 ? 'overdue' : daysSinceBackup >= 25 ? 'due-soon' : 'ok',
      url: '/admin/backup-tests'
    });

    // Check Permission Review (quarterly)
    const { data: lastPermissionReview } = await supabase
      .from('permission_reviews')
      .select('created_at, next_review_date')
      .eq('reviewed_by', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastPermissionReview) {
      const nextReviewDate = new Date(lastPermissionReview.next_review_date);
      const daysUntilReview = differenceInDays(nextReviewDate, today);

      tasksData.push({
        name: 'Revisão de Permissões',
        description: 'Análise trimestral de roles e permissões',
        frequency: 'Trimestral',
        lastDone: new Date(lastPermissionReview.created_at),
        nextDue: nextReviewDate,
        status: daysUntilReview < 0 ? 'overdue' : daysUntilReview <= 7 ? 'due-soon' : 'ok',
        url: '/admin/permission-review'
      });
    } else {
      tasksData.push({
        name: 'Revisão de Permissões',
        description: 'Análise trimestral de roles e permissões',
        frequency: 'Trimestral',
        lastDone: null,
        nextDue: today,
        status: 'overdue',
        url: '/admin/permission-review'
      });
    }

    // Check for open incidents
    const { data: openIncidents, count } = await supabase
      .from('security_incidents')
      .select('*', { count: 'exact' })
      .in('status', ['reported', 'investigating', 'contained']);

    if (count && count > 0) {
      tasksData.push({
        name: 'Incidentes Abertos',
        description: `${count} incidente(s) de segurança pendente(s)`,
        frequency: 'Conforme necessário',
        lastDone: null,
        nextDue: today,
        status: 'due-soon',
        url: '/admin/security-incidents'
      });
    }

    setTasks(tasksData);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive" className="ml-2"><AlertCircle className="w-3 h-3 mr-1" />Atrasada</Badge>;
      case 'due-soon':
        return <Badge className="ml-2 bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Em breve</Badge>;
      case 'ok':
        return <Badge variant="secondary" className="ml-2"><CheckCircle className="w-3 h-3 mr-1" />Em dia</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'due-soon':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      default:
        return 'border-border';
    }
  };

  if (!isAdmin || loading) return null;

  const overdueCount = tasks.filter(t => t.status === 'overdue').length;
  const dueSoonCount = tasks.filter(t => t.status === 'due-soon').length;

  if (overdueCount === 0 && dueSoonCount === 0) return null;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Lembretes de Compliance
            </CardTitle>
            <CardDescription>
              {overdueCount > 0 && `${overdueCount} tarefa(s) atrasada(s)`}
              {overdueCount > 0 && dueSoonCount > 0 && ' • '}
              {dueSoonCount > 0 && `${dueSoonCount} vencendo em breve`}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/COMPLIANCE_GUIDE.md', '_blank')}
          >
            Ver Guia Completo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks
          .filter(t => t.status !== 'ok')
          .map((task, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 transition-colors ${getStatusColor(task.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-semibold">{task.name}</h4>
                    {getStatusBadge(task.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Frequência: {task.frequency}</span>
                    {task.lastDone && (
                      <span>Última: {format(task.lastDone, 'dd/MM/yyyy', { locale: ptBR })}</span>
                    )}
                    {task.nextDue && (
                      <span>
                        Próxima: {format(task.nextDue, 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={task.status === 'overdue' ? 'default' : 'outline'}
                  onClick={() => navigate(task.url)}
                >
                  {task.status === 'overdue' ? 'Fazer Agora' : 'Acessar'}
                </Button>
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
};
