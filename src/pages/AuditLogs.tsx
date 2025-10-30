import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Shield, Download, AlertTriangle } from 'lucide-react';

interface AuditLog {
  id: string;
  admin_id: string;
  access_type: string;
  accessed_user_id?: string;
  accessed_patient_id?: string;
  access_reason?: string;
  created_at: string;
  retention_until: string;
  ip_address?: string;
  user_agent?: string;
}

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, nearExpiry: 0 });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminRole() {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      const adminStatus = !!data;
      setIsAdmin(adminStatus);
      
      if (!adminStatus) {
        toast.error('Acesso negado. Apenas administradores podem visualizar logs de auditoria.');
        return;
      }
      
      loadLogs();
      loadStats();
    }
    
    checkAdminRole();
  }, [user]);

  async function loadLogs() {
    try {
      const { data, error } = await supabase
        .from('admin_access_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      // Total logs
      const { count: total } = await supabase
        .from('admin_access_log')
        .select('*', { count: 'exact', head: true });

      // Logs this month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const { count: thisMonth } = await supabase
        .from('admin_access_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString());

      // Logs near expiry (30 days before 12 months)
      const expiryThreshold = new Date();
      expiryThreshold.setMonth(expiryThreshold.getMonth() - 11);
      
      const { count: nearExpiry } = await supabase
        .from('admin_access_log')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', expiryThreshold.toISOString());

      setStats({
        total: total || 0,
        thisMonth: thisMonth || 0,
        nearExpiry: nearExpiry || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function exportLogs() {
    try {
      const { data, error } = await supabase
        .from('admin_access_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const csv = [
        ['Data', 'Admin ID', 'Tipo de Acesso', 'Usuário Acessado', 'Paciente Acessado', 'Motivo', 'IP', 'Retenção até'].join(','),
        ...(data || []).map(log => [
          format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
          log.admin_id,
          log.access_type,
          log.accessed_user_id || '',
          log.accessed_patient_id || '',
          log.access_reason || '',
          log.ip_address || '',
          format(new Date(log.retention_until), 'dd/MM/yyyy', { locale: ptBR }),
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Logs exportados com sucesso');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Erro ao exportar logs');
    }
  }

  const getAccessTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      view_patient: 'default',
      edit_patient: 'secondary',
      view_sessions: 'default',
      delete_patient: 'destructive',
      export_patient_data: 'outline',
      create_therapist: 'secondary',
    };
    return variants[type] || 'default';
  };

  if (!isAdmin && !loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Acesso Negado
            </CardTitle>
            <CardDescription>
              Apenas administradores podem visualizar logs de auditoria.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Logs de Auditoria</h1>
          <p className="text-muted-foreground">
            Registros de acesso administrativo (LGPD Art. 37 | Retenção: 12 meses)
          </p>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Desde o início</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Logs deste Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximos à Expiração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nearExpiry}</div>
            <p className="text-xs text-muted-foreground mt-1">Serão removidos automaticamente</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Histórico de Acessos (Últimos 100)
          </CardTitle>
          <CardDescription>
            Conforme ANPD - Retenção mínima de 12 meses | Revisão trimestral obrigatória
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : logs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum log registrado</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo de Acesso</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Admin ID</TableHead>
                    <TableHead>Retenção até</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAccessTypeBadge(log.access_type)}>
                          {log.access_type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {log.access_reason}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.admin_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(log.retention_until), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Política de Retenção</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>✅ Logs são automaticamente retidos por <strong>12 meses</strong> conforme boas práticas ANPD</p>
          <p>✅ Revisão <strong>trimestral</strong> obrigatória pelo DPO (conforme ROPA)</p>
          <p>✅ Limpeza automática mensal via edge function</p>
          <p>✅ Logs de incidentes são preservados por <strong>5 anos</strong> (conforme Runbook RCIS)</p>
        </CardContent>
      </Card>
    </div>
  );
}
