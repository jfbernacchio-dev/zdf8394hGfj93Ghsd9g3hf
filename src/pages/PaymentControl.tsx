import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegisterPaymentDialog } from '@/components/RegisterPaymentDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign, FileText, AlertCircle, Download, Eye } from 'lucide-react';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NFSeWithStatus {
  id: string;
  nfse_number: string;
  issue_date: string;
  net_value: number;
  status: string;
  patient: {
    name: string;
  };
  allocated_amount: number;
  remaining_amount: number;
}

interface Payment {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  has_proof: boolean;
  proof_file_path: string | null;
  notes: string | null;
  allocations: {
    nfse_id: string;
    allocated_amount: number;
    nfse: {
      nfse_number: string;
      patient: {
        name: string;
      };
    };
  }[];
}

const PaymentControl = () => {
  const [loading, setLoading] = useState(true);
  const [pendingNFSes, setPendingNFSes] = useState<NFSeWithStatus[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedNFSeIds, setSelectedNFSeIds] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadPendingNFSes(), loadPayments()]);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingNFSes = async () => {
    if (!user) return;

    const { data: nfses, error: nfseError } = await supabase
      .from('nfse_issued')
      .select(`
        id,
        nfse_number,
        issue_date,
        net_value,
        status,
        patients!nfse_issued_patient_id_fkey (name)
      `)
      .eq('user_id', user.id)
      .eq('status', 'authorized')
      .order('issue_date', { ascending: false });

    if (nfseError) throw nfseError;

    const { data: allocations, error: allocError } = await supabase
      .from('payment_allocations')
      .select('nfse_id, allocated_amount');

    if (allocError) throw allocError;

    const allocationMap = allocations?.reduce((acc, alloc) => {
      acc[alloc.nfse_id] = (acc[alloc.nfse_id] || 0) + parseFloat(String(alloc.allocated_amount));
      return acc;
    }, {} as Record<string, number>) || {};

    const pending = nfses
      ?.filter(nfse => {
        const allocated = allocationMap[nfse.id] || 0;
        return allocated < parseFloat(String(nfse.net_value));
      })
      .map(nfse => {
        const allocated = allocationMap[nfse.id] || 0;
        return {
          ...nfse,
          patient: nfses.find(n => n.id === nfse.id)?.patients || { name: 'Desconhecido' },
          allocated_amount: allocated,
          remaining_amount: parseFloat(String(nfse.net_value)) - allocated
        };
      }) || [];

    setPendingNFSes(pending);
  };

  const loadPayments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('nfse_payments')
      .select(`
        id,
        payment_date,
        amount,
        payment_method,
        has_proof,
        proof_file_path,
        notes,
        payment_allocations (
          nfse_id,
          allocated_amount,
          nfse_issued (
            nfse_number,
            patients!nfse_issued_patient_id_fkey (name)
          )
        )
      `)
      .eq('user_id', user.id)
      .order('payment_date', { ascending: false });

    if (error) throw error;

    // Transform data to match Payment interface
    const transformedData = data?.map(payment => ({
      ...payment,
      allocations: payment.payment_allocations.map((alloc: any) => ({
        nfse_id: alloc.nfse_id,
        allocated_amount: alloc.allocated_amount,
        nfse: {
          nfse_number: alloc.nfse_issued.nfse_number,
          patient: alloc.nfse_issued.patients
        }
      }))
    })) || [];

    setPayments(transformedData);
  };

  const getTotalPending = () => {
    return pendingNFSes.reduce((sum, nfse) => sum + nfse.remaining_amount, 0);
  };

  const getTotalReceived = () => {
    return payments.reduce((sum, payment) => sum + parseFloat(String(payment.amount)), 0);
  };

  const openPaymentDialog = (nfseId?: string) => {
    if (nfseId) {
      setSelectedNFSeIds([nfseId]);
    } else {
      setSelectedNFSeIds([]);
    }
    setShowPaymentDialog(true);
  };

  const downloadProof = async (proofPath: string) => {
    const { data, error } = await supabase.storage
      .from('patient-files')
      .download(proofPath);

    if (error) {
      toast({
        title: 'Erro ao baixar comprovante',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = proofPath.split('/').pop() || 'comprovante';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Controle de Pagamentos</h1>
        <p className="text-muted-foreground">
          Gerencie pagamentos e baixas de notas fiscais
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-warning/10">
              <FileText className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{pendingNFSes.length} NFSes</p>
              <p className="text-sm text-warning font-medium">
                {formatBrazilianCurrency(getTotalPending())}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success/10">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recebido</p>
              <p className="text-2xl font-bold">{payments.length} pagamentos</p>
              <p className="text-sm text-success font-medium">
                {formatBrazilianCurrency(getTotalReceived())}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-muted">
              <AlertCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sem Comprovante</p>
              <p className="text-2xl font-bold">
                {payments.filter(p => !p.has_proof).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">NFSes Pendentes</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos Registrados</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Notas Pendentes de Pagamento</h2>
                <Button onClick={() => openPaymentDialog()}>
                  Registrar Pagamento
                </Button>
              </div>

              {pendingNFSes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma NFSe pendente de pagamento
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NFSe</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Emissão</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Recebido</TableHead>
                      <TableHead>Falta</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingNFSes.map((nfse) => (
                      <TableRow key={nfse.id}>
                        <TableCell className="font-medium">{nfse.nfse_number}</TableCell>
                        <TableCell>{nfse.patient.name}</TableCell>
                        <TableCell>
                          {format(new Date(nfse.issue_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{formatBrazilianCurrency(parseFloat(String(nfse.net_value)))}</TableCell>
                        <TableCell>
                          {nfse.allocated_amount > 0 ? (
                            <span className="text-success">
                              {formatBrazilianCurrency(nfse.allocated_amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">R$ 0,00</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-warning font-medium">
                            {formatBrazilianCurrency(nfse.remaining_amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPaymentDialog(nfse.id)}
                          >
                            Dar Baixa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Pagamentos Registrados</h2>

              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum pagamento registrado ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <Card key={payment.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">
                              {format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            <Badge variant="outline">{payment.payment_method}</Badge>
                            {!payment.has_proof && (
                              <Badge variant="outline" className="text-warning border-warning/50">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Sem comprovante
                              </Badge>
                            )}
                          </div>
                          <p className="text-2xl font-bold text-success mb-2">
                            {formatBrazilianCurrency(parseFloat(String(payment.amount)))}
                          </p>
                          {payment.notes && (
                            <p className="text-sm text-muted-foreground mb-2">{payment.notes}</p>
                          )}
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-1">Alocado para:</p>
                            {payment.allocations.map((alloc, idx) => (
                              <p key={idx}>
                                • NFSe {alloc.nfse.nfse_number} ({alloc.nfse.patient.name}): {formatBrazilianCurrency(parseFloat(String(alloc.allocated_amount)))}
                              </p>
                            ))}
                          </div>
                        </div>
                        {payment.has_proof && payment.proof_file_path && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadProof(payment.proof_file_path!)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Comprovante
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <RegisterPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        preSelectedNFSeIds={selectedNFSeIds}
        onSuccess={loadData}
      />
    </div>
  );
};

export default PaymentControl;
