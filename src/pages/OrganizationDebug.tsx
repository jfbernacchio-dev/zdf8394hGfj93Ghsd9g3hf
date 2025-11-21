import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  runOrgIntegrityCheck, 
  fixIssue, 
  fixAllIssues,
  type OrgIntegrityReport,
  type OrgIntegrityIssue 
} from '@/lib/orgIntegrityCheck';
import { AlertCircle, CheckCircle2, Play, Wrench, Shield } from 'lucide-react';

/**
 * ============================================================================
 * FASE 10.9: Organization Debug Page
 * ============================================================================
 * 
 * Interface para executar verificação e correção de integridade organizacional.
 * 
 * ============================================================================
 */

export default function OrganizationDebug() {
  const { organizationId } = useAuth();
  const [report, setReport] = useState<OrgIntegrityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);

  const runCheck = async () => {
    if (!organizationId) {
      toast.error('Organização ativa não encontrada');
      return;
    }

    setLoading(true);
    try {
      const result = await runOrgIntegrityCheck(organizationId);
      setReport(result);
      
      if (result.total_issues === 0) {
        toast.success('✅ Sistema completamente consistente!');
      } else {
        toast.warning(`⚠️ ${result.total_issues} inconsistências encontradas`);
      }
    } catch (error) {
      console.error('[10.9] Erro ao executar check:', error);
      toast.error('Erro ao executar verificação');
    } finally {
      setLoading(false);
    }
  };

  const handleFixIssue = async (issue: OrgIntegrityIssue) => {
    setFixing(true);
    try {
      const result = await fixIssue(issue);
      if (result.success) {
        toast.success('Problema corrigido!');
        // Re-executar verificação
        await runCheck();
      } else {
        toast.error(result.error || 'Erro ao corrigir problema');
      }
    } catch (error) {
      toast.error('Erro ao corrigir problema');
    } finally {
      setFixing(false);
    }
  };

  const handleFixAll = async () => {
    if (!report || report.issues.length === 0) return;

    setFixing(true);
    try {
      const result = await fixAllIssues(report.issues);
      
      if (result.fixed > 0) {
        toast.success(`✅ ${result.fixed} problemas corrigidos!`);
      }
      if (result.failed > 0) {
        toast.error(`❌ ${result.failed} problemas falharam`);
        result.errors.forEach(err => console.error('[10.9] Erro:', err));
      }
      
      // Re-executar verificação
      await runCheck();
    } catch (error) {
      toast.error('Erro ao corrigir problemas');
    } finally {
      setFixing(false);
    }
  };

  const getSeverityBadge = (issue: OrgIntegrityIssue) => {
    if (issue.issue_type === 'wrong_org' || issue.issue_type === 'orphaned') {
      return <Badge variant="destructive">Crítico</Badge>;
    }
    if (issue.issue_type === 'missing_org') {
      return <Badge variant="default" className="bg-yellow-500">Aviso</Badge>;
    }
    return <Badge variant="secondary">Info</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Debug Multi-Empresa
          </h1>
          <p className="text-muted-foreground mt-2">
            Verificação e correção de integridade organizacional (FASE 10.9)
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={runCheck}
            disabled={loading || !organizationId}
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            {loading ? 'Verificando...' : 'Executar Verificação'}
          </Button>
          
          {report && report.total_issues > 0 && (
            <Button
              onClick={handleFixAll}
              disabled={fixing || loading}
              variant="default"
              size="lg"
            >
              <Wrench className="h-4 w-4 mr-2" />
              {fixing ? 'Corrigindo...' : 'Corrigir Tudo'}
            </Button>
          )}
        </div>
      </div>

      {/* Resumo do Relatório */}
      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total de Problemas</div>
              <div className="text-3xl font-bold">{report.total_issues}</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Críticos</div>
              <div className="text-3xl font-bold text-red-600">
                {report.issues_by_severity.critical}
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Avisos</div>
              <div className="text-3xl font-bold text-yellow-600">
                {report.issues_by_severity.warning}
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Info</div>
              <div className="text-3xl font-bold text-blue-600">
                {report.issues_by_severity.info}
              </div>
            </Card>
          </div>

          {/* Tempo de Execução */}
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">
              Tempo de execução: <span className="font-mono">{report.duration_ms}ms</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Timestamp: <span className="font-mono">{new Date(report.timestamp).toLocaleString('pt-BR')}</span>
            </div>
          </Card>

          {/* Tabelas Perfeitas */}
          {report.perfect_tables.length > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Tabelas Consistentes</AlertTitle>
              <AlertDescription>
                {report.perfect_tables.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Problemas por Tabela */}
          {Object.keys(report.issues_by_table).length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Problemas por Tabela</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(report.issues_by_table).map(([table, count]) => (
                  <div key={table} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm font-mono">{table}</span>
                    <Badge variant="destructive">{count}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recomendações */}
          {report.recommendations.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Recomendações</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Tabela de Problemas */}
          {report.issues.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Detalhes dos Problemas</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead>ID do Registro</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Org Atual</TableHead>
                      <TableHead>Org Esperada</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.issues.map((issue, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{getSeverityBadge(issue)}</TableCell>
                        <TableCell className="font-mono text-sm">{issue.table}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {issue.record_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {issue.description}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {issue.current_org_id?.substring(0, 8) || 'null'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {issue.expected_org_id.substring(0, 8)}
                        </TableCell>
                        <TableCell>
                          {issue.auto_fixable ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFixIssue(issue)}
                              disabled={fixing}
                            >
                              <Wrench className="h-3 w-3 mr-1" />
                              Corrigir
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Manual</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </>
      )}

      {!report && !loading && (
        <Card className="p-12 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">
            Nenhuma verificação executada
          </h3>
          <p className="text-muted-foreground mb-4">
            Clique em "Executar Verificação" para começar
          </p>
        </Card>
      )}
    </div>
  );
}
