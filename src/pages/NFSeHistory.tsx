import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BulkDownloadNFSeDialog from '@/components/BulkDownloadNFSeDialog';

import { ArrowLeft, FileText, Download, X, Search, Calendar, DollarSign, RefreshCw, Trash2, RefreshCcw, Mail, Upload } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  environment: string;
  patients: {
    name: string;
    cpf: string | null;
  };
}

export default function NFSeHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [nfseList, setNfseList] = useState<NFSeIssued[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [activeTab, setActiveTab] = useState('homologacao');

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
            name,
            cpf
          )
        `)
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

  const handleRefreshAll = async () => {
    const notIssuedNotes = nfseList.filter(
      n => n.environment === activeTab && (n.status === 'processing' || n.status === 'error')
    );

    if (notIssuedNotes.length === 0) {
      toast({
        title: 'Nenhuma nota para atualizar',
        description: 'Todas as notas já estão emitidas ou canceladas.',
      });
      return;
    }

    toast({
      title: 'Atualizando notas',
      description: `Verificando ${notIssuedNotes.length} nota(s)...`,
    });

    let updated = 0;
    for (const note of notIssuedNotes) {
      try {
        const { data } = await supabase.functions.invoke('check-nfse-status', {
          body: { nfseId: note.id },
        });
        if (data?.success) updated++;
      } catch (error) {
        console.error(`Error checking ${note.id}:`, error);
      }
    }

    toast({
      title: 'Atualização concluída',
      description: `${updated} nota(s) atualizada(s) com sucesso.`,
    });
    
    loadNFSe();
  };

  const handleDeleteNFSe = async (nfseId: string) => {
    try {
      const { error } = await supabase
        .from('nfse_issued')
        .delete()
        .eq('id', nfseId);

      if (error) throw error;

      toast({
        title: 'NFSe excluída',
        description: 'A entrada foi removida do histórico.',
      });

      loadNFSe();
    } catch (error: any) {
      console.error('Error deleting NFSe:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendEmail = async (nfseId: string) => {
    try {
      toast({
        title: 'Enviando email',
        description: 'Aguarde enquanto enviamos o email com a NFSe...',
      });

      const { data, error } = await supabase.functions.invoke('send-nfse-email', {
        body: { nfseId },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Email enviado',
          description: 'O email com a NFSe foi enviado com sucesso para o paciente.',
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Erro ao enviar email',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRetryPdfUpload = async (nfseId: string) => {
    try {
      toast({
        title: 'Reenviando PDF',
        description: 'Aguarde enquanto reprocessamos o upload do arquivo...',
      });

      const { data, error } = await supabase.functions.invoke('retry-nfse-pdf-upload', {
        body: { nfseId },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'PDF enviado com sucesso',
          description: `Arquivo ${data.fileName} foi adicionado aos arquivos do paciente.`,
        });
        loadNFSe();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error retrying PDF upload:', error);
      toast({
        title: 'Erro ao enviar PDF',
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
      toast({
        title: 'Cancelando NFSe',
        description: 'Aguarde enquanto cancelamos a nota fiscal...',
      });

      const { data, error } = await supabase.functions.invoke('cancel-nfse', {
        body: { 
          nfseId,
          cancelReason: cancelReason.trim(),
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'NFSe cancelada',
          description: 'A nota fiscal foi cancelada com sucesso. O PDF agora contém a marca de cancelamento.',
        });
        setCancelReason('');
        loadNFSe();
      } else {
        throw new Error(data.error);
      }
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

  const filteredNFSe = nfseList
    .filter(nfse => nfse.environment === activeTab)
    .filter(nfse =>
      nfse.patients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfse.nfse_number?.includes(searchTerm)
    );

  const totalIssued = nfseList.filter(n => n.status === 'issued' && n.environment === activeTab).length;
  const totalValue = nfseList
    .filter(n => n.status === 'issued' && n.environment === activeTab)
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="homologacao">Homologação</TabsTrigger>
              <TabsTrigger value="producao">Produção</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por paciente ou número da nota..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <BulkDownloadNFSeDialog 
                  nfseList={filteredNFSe} 
                  environment={activeTab}
                />
                <Button onClick={handleRefreshAll} variant="outline">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Atualizar {filteredNFSe.filter(n => n.status === 'processing' || n.status === 'error').length > 0 
                    ? `(${filteredNFSe.filter(n => n.status === 'processing' || n.status === 'error').length})` 
                    : 'Todas'}
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>
              ) : filteredNFSe.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nenhuma nota encontrada' : `Nenhuma nota fiscal emitida em ${activeTab === 'producao' ? 'produção' : 'homologação'}`}
                </div>
              ) : (
                <>
                  {filteredNFSe.some(n => n.status === 'processing') && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>ℹ️ Notas em processamento:</strong> A prefeitura está processando as notas. 
                        Isso pode levar alguns minutos. Clique em "Atualizar Todas" para verificar o status atualizado.
                      </p>
                    </div>
                  )}
                
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>CPF</TableHead>
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
                    <TableCell className="font-mono text-sm">{nfse.patients.cpf || '-'}</TableCell>
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
                        {(nfse.status === 'processing' || nfse.status === 'error') && (
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
                            title={nfse.status === 'cancelled' ? 'Baixar PDF (Cancelada)' : 'Baixar PDF'}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {nfse.status === 'issued' && nfse.pdf_url && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendEmail(nfse.id)}
                              title="Enviar email com NFSe"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetryPdfUpload(nfse.id)}
                              title="Reenviar PDF para arquivos do paciente"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </>
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
                        {(nfse.status === 'error' || nfse.status === 'cancelled' || nfse.status === 'processing') && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Excluir entrada">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir do histórico?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação removerá permanentemente esta entrada do histórico.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteNFSe(nfse.id)}>
                                  Excluir
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
                </>
          )}
            </TabsContent>
          </Tabs>
        </Card>
    </div>
  );
}