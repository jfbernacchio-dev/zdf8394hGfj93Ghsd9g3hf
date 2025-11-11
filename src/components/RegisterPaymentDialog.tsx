import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NFSeWithPatient {
  id: string;
  nfse_number: string;
  issue_date: string;
  net_value: number;
  patient: {
    name: string;
  };
  allocated_amount?: number;
}

interface RegisterPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedNFSeIds?: string[];
  onSuccess?: () => void;
}

export const RegisterPaymentDialog = ({
  open,
  onOpenChange,
  preSelectedNFSeIds = [],
  onSuccess
}: RegisterPaymentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingNFSes, setLoadingNFSes] = useState(false);
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [availableNFSes, setAvailableNFSes] = useState<NFSeWithPatient[]>([]);
  const [selectedNFSes, setSelectedNFSes] = useState<Set<string>>(new Set(preSelectedNFSeIds));
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPendingNFSes();
      setSelectedNFSes(new Set(preSelectedNFSeIds));
    }
  }, [open, preSelectedNFSeIds]);

  const loadPendingNFSes = async () => {
    if (!user) return;
    
    setLoadingNFSes(true);
    try {
      // Get all issued NFSes
      const { data: nfses, error } = await supabase
        .from('nfse_issued')
        .select(`
          id,
          nfse_number,
          issue_date,
          net_value,
          patients!nfse_issued_patient_id_fkey (name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'issued')
        .order('issue_date', { ascending: false });

      if (error) throw error;

      // Get allocations for each NFSe
      const { data: allocations, error: allocError } = await supabase
        .from('payment_allocations')
        .select('nfse_id, allocated_amount');

      if (allocError) throw allocError;

      // Calculate allocated amounts
      const allocationMap = allocations?.reduce((acc, alloc) => {
        acc[alloc.nfse_id] = (acc[alloc.nfse_id] || 0) + parseFloat(String(alloc.allocated_amount));
        return acc;
      }, {} as Record<string, number>) || {};

      // Filter pending NFSes (not fully paid)
      const pendingNFSes = nfses
        ?.filter(nfse => {
          const allocated = allocationMap[nfse.id] || 0;
          return allocated < parseFloat(String(nfse.net_value));
        })
        .map(nfse => ({
          ...nfse,
          patient: nfses.find(n => n.id === nfse.id)?.patients || { name: 'Desconhecido' },
          allocated_amount: allocationMap[nfse.id] || 0
        })) || [];

      setAvailableNFSes(pendingNFSes);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar notas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingNFSes(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const toggleNFSe = (nfseId: string) => {
    const newSelected = new Set(selectedNFSes);
    if (newSelected.has(nfseId)) {
      newSelected.delete(nfseId);
      const newAllocations = { ...allocations };
      delete newAllocations[nfseId];
      setAllocations(newAllocations);
    } else {
      newSelected.add(nfseId);
    }
    setSelectedNFSes(newSelected);
  };

  const handleAllocationChange = (nfseId: string, value: string) => {
    setAllocations({
      ...allocations,
      [nfseId]: value
    });
  };

  const getTotalAllocated = () => {
    return Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val || '0') || 0), 0);
  };

  const handleSubmit = async () => {
    if (!user || !amount || selectedNFSes.size === 0) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o valor e selecione ao menos uma NFSe',
        variant: 'destructive',
      });
      return;
    }

    const paymentAmount = parseFloat(amount);
    const totalAllocated = getTotalAllocated();

    if (totalAllocated > paymentAmount) {
      toast({
        title: 'Valor inválido',
        description: 'A soma das alocações não pode ser maior que o valor do pagamento',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      let proofFilePath = null;

      // Upload proof file if provided
      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `payment_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('patient-files')
          .upload(`payment-proofs/${user.id}/${fileName}`, proofFile);

        if (uploadError) throw uploadError;
        proofFilePath = `payment-proofs/${user.id}/${fileName}`;
      }

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('nfse_payments')
        .insert({
          user_id: user.id,
          payment_date: paymentDate,
          amount: paymentAmount,
          payment_method: paymentMethod,
          proof_file_path: proofFilePath,
          has_proof: !!proofFile,
          notes
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Create allocations
      const allocationRecords = Array.from(selectedNFSes).map(nfseId => ({
        payment_id: payment.id,
        nfse_id: nfseId,
        allocated_amount: parseFloat(allocations[nfseId] || '0') || 0
      })).filter(rec => rec.allocated_amount > 0);

      if (allocationRecords.length > 0) {
        const { error: allocError } = await supabase
          .from('payment_allocations')
          .insert(allocationRecords);

        if (allocError) throw allocError;
      }

      toast({
        title: 'Pagamento registrado',
        description: proofFile 
          ? 'Pagamento registrado com sucesso' 
          : '⚠️ Pagamento registrado sem comprovante',
      });

      // Reset form
      setAmount('');
      setPaymentMethod('pix');
      setNotes('');
      setProofFile(null);
      setSelectedNFSes(new Set());
      setAllocations({});
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar pagamento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento de NFSe</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data do Pagamento</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Valor Recebido *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Método de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Comprovante (Opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
              />
              {!proofFile && (
                <Badge variant="outline" className="text-warning border-warning/50">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Sem comprovante
                </Badge>
              )}
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold">Alocar para NFSes *</Label>
            {loadingNFSes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : availableNFSes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nenhuma NFSe pendente de pagamento
              </p>
            ) : (
              <div className="space-y-2 mt-2">
                {availableNFSes.map((nfse) => {
                  const remaining = parseFloat(String(nfse.net_value)) - (nfse.allocated_amount || 0);
                  return (
                    <div key={nfse.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedNFSes.has(nfse.id)}
                        onCheckedChange={() => toggleNFSe(nfse.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">NFSe {nfse.nfse_number}</p>
                            <p className="text-sm text-muted-foreground">{nfse.patient.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatBrazilianCurrency(parseFloat(String(nfse.net_value)))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Falta: {formatBrazilianCurrency(remaining)}
                            </p>
                          </div>
                        </div>
                        {selectedNFSes.has(nfse.id) && (
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Valor alocado"
                            value={allocations[nfse.id] || ''}
                            onChange={(e) => handleAllocationChange(nfse.id, e.target.value)}
                            className="mt-2"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {amount && getTotalAllocated() > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Valor do pagamento:</span>
                <span className="font-medium">{formatBrazilianCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total alocado:</span>
                <span className="font-medium">{formatBrazilianCurrency(getTotalAllocated())}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t">
                <span>Não alocado:</span>
                <span>{formatBrazilianCurrency(parseFloat(amount) - getTotalAllocated())}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Registrar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
