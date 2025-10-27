import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { ArrowLeft, FileText, Download, X, Search, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';

interface NFSeIssued {
  id: string;
  patient_id: string;
  nfse_number: string | null;
  verification_code: string | null;
  issue_date: string;
  service_value: number;
  iss_value: number;
  net_value: number;
  status: 'processing' | 'issued' | 'error' | 'cancelled';
  error_message: string | null;
  pdf_url: string | null;
  xml_url: string | null;
  patients: {
    name: string;
  };
}

export default function NFSeHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [nfseList, setNfseList] = useState<NFSeIssued[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadNFSe();
  }, []);

  const loadNFSe = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('nfse_issued')
        .select(`
          *,
          patients (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false });

      if (error) throw error;

      setNfseList((data as any) || []);
    } catch (error: any) {
      console.error('Error loading NFSe:', error);
      toast({
        title: 'Erro ao carregar histórico',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (nfseId: string) => {
    try {
      toast({
        title: 'Consultando status',
        description: 'Aguarde enquanto verificamos a situação da nota...',
      });

      const { data, error } = await supabase.functions.invoke('check-nfse-status', {
        body: { nfseId },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Status atualizado',
          description: data.message,
        });
        loadNFSe();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error checking status:', error);
      toast({
        title: 'Erro ao consultar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCancelNFSe = async (nfseId: string) => {
    if (!cancelReason.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Informe o motivo do cancelamento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Aqui chamaríamos a edge function para cancelar via FocusNFe
      const { error } = await supabase
        .from('nfse_issued')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancelReason,
        })
        .eq('id', nfseId);

      if (error) throw error;

      toast({
        title: 'NFSe cancelada',
        description: 'A nota fiscal foi cancelada com sucesso.',
      });

      setCancelReason('');
      loadNFSe();
    } catch (error: any) {
      console.error('Error cancelling NFSe:', error);
      toast({
        title: 'Erro ao cancelar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      processing: { label: 'Processando', variant: 'secondary' as const },
      issued: { label: 'Emitida', variant: 'default' as const },
      error: { label: 'Erro', variant: 'destructive' as const },
      cancelled: { label: 'Cancelada', variant: 'outline' as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.processing;

    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const filteredNFSe = nfseList.filter(nfse =>
    nfse.patients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nfse.nfse_number?.includes(searchTerm)
  );

  const totalIssued = nfseList.filter(n => n.status === 'issued').length;
  const totalValue = nfseList
    .filter(n => n.status === 'issued')
    .reduce((sum, n) => sum + Number(n.service_value), 0);

  return (
    <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Histórico de Notas Fiscais</h1>
              <p className="text-muted-foreground">Consulte e gerencie suas NFSe emitidas</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Emitidas</p>
                <p className="text-2xl font-bold">{totalIssued}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  {formatBrazilianCurrency(totalValue)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Este Mês</p>
                <p className="text-2xl font-bold">
                  {nfseList.filter(n => {
                    const issueDate = new Date(n.issue_date);
                    const now = new Date();
                    return issueDate.getMonth() === now.getMonth() && 
                           issueDate.getFullYear() === now.getFullYear() &&
                           n.status === 'issued';
                  }).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente ou número da nota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>
          ) : filteredNFSe.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhuma nota encontrada' : 'Nenhuma nota fiscal emitida ainda'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Número NFSe</TableHead>
                  <TableHead>Cód. Verificação</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNFSe.map((nfse) => (
                  <TableRow key={nfse.id}>
                    <TableCell className="font-medium">{nfse.patients.name}</TableCell>
                    <TableCell>{nfse.nfse_number || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {nfse.verification_code || '-'}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(nfse.issue_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {formatBrazilianCurrency(Number(nfse.service_value))}
                    </TableCell>
                    <TableCell>{getStatusBadge(nfse.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(nfse.status === 'processing' || nfse.status === 'issued') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCheckStatus(nfse.id)}
                            title="Atualizar dados da nota"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        {nfse.pdf_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(nfse.pdf_url!, '_blank')}
                            title="Baixar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {nfse.status === 'issued' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Cancelar nota">
                                <X className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar Nota Fiscal?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Informe o motivo do cancelamento:
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <Input
                                placeholder="Motivo do cancelamento"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                              />
                              <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelNFSe(nfse.id)}>
                                  Cancelar NFSe
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
  );
}