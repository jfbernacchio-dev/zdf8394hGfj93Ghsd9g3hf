import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Download, CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';


interface BulkDownloadNFSeDialogProps {
  nfseList: Array<{
    id: string;
    issue_date: string;
    pdf_url: string | null;
    nfse_number: string | null;
    status: string;
    patient_id: string;
    patients: {
      name: string;
    };
  }>;
  environment: string;
}

export default function BulkDownloadNFSeDialog({ nfseList, environment }: BulkDownloadNFSeDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Datas obrigatórias',
        description: 'Selecione a data inicial e final do período.',
        variant: 'destructive',
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: 'Período inválido',
        description: 'A data inicial deve ser anterior à data final.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Filter NFSes by date range and status
      const filteredNFSes = nfseList.filter(nfse => {
        if (nfse.status !== 'issued' || !nfse.pdf_url) return false;
        
        const issueDate = new Date(nfse.issue_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Set times to compare only dates
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        issueDate.setHours(12, 0, 0, 0);
        
        return issueDate >= start && issueDate <= end;
      });

      if (filteredNFSes.length === 0) {
        toast({
          title: 'Nenhuma nota encontrada',
          description: 'Não há notas fiscais emitidas no período selecionado.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Baixando notas fiscais',
        description: `Processando ${filteredNFSes.length} nota(s)...`,
      });

      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const folder = zip.folder('NFSes');

      // Download all PDFs and add to ZIP using edge function as proxy
      const { supabase } = await import('@/integrations/supabase/client');
      
      const downloadPromises = filteredNFSes.map(async (nfse, index) => {
        try {
          console.log(`[${index + 1}/${filteredNFSes.length}] Processando NFSe ${nfse.nfse_number} - ${nfse.patients.name}`);
          
          // Use edge function as proxy to avoid CORS issues
          const { data: pdfData, error } = await supabase.functions.invoke('download-nfse-pdf', {
            body: { pdfUrl: nfse.pdf_url },
          });
          
          if (error) {
            console.error(`❌ Erro ao baixar PDF da NFSe ${nfse.nfse_number} (${nfse.patients.name}):`, error);
            return { success: false, nfse: nfse.nfse_number, patient: nfse.patients.name };
          }
          
          if (!pdfData) {
            console.error(`❌ PDF vazio para NFSe ${nfse.nfse_number} (${nfse.patients.name})`);
            return { success: false, nfse: nfse.nfse_number, patient: nfse.patients.name };
          }
          
          // Get the file name from patient_files table by matching the expected filename pattern
          // First, determine the month that should be in the filename based on last session
          let referenceMonth = '';
          const sessionIds = (nfse as any).session_ids || [];
          
          if (sessionIds.length > 0) {
            const { data: sessions } = await supabase
              .from('sessions')
              .select('date')
              .in('id', sessionIds)
              .order('date', { ascending: false })
              .limit(1);
            
            if (sessions && sessions.length > 0) {
              const lastSessionDate = new Date(sessions[0].date);
              const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
              const month = months[lastSessionDate.getMonth()];
              const year = lastSessionDate.getFullYear().toString().slice(-2);
              referenceMonth = `${month}-${year}`;
            }
          }
          
          // Search for the file with matching month pattern
          const { data: patientFiles } = await supabase
            .from('patient_files')
            .select('file_name')
            .eq('patient_id', nfse.patient_id)
            .eq('category', 'NFSe')
            .order('uploaded_at', { ascending: false });
          
          // Find file that matches the expected pattern
          const matchingFile = patientFiles?.find(f => 
            referenceMonth && f.file_name.includes(referenceMonth)
          );
          
          // Always use stored file name if available, but ensure uniqueness
          let fileName: string;
          if (matchingFile?.file_name) {
            // If file exists, use it but ensure it has NFSe number for uniqueness
            const hasNfseNumber = matchingFile.file_name.includes(nfse.nfse_number || '');
            if (hasNfseNumber) {
              fileName = matchingFile.file_name;
            } else {
              // Add NFSe number to ensure uniqueness
              const nameParts = matchingFile.file_name.split('.');
              const extension = nameParts.pop();
              fileName = `${nameParts.join('.')}_${nfse.nfse_number}.${extension}`;
            }
          } else {
            // Fallback: generate unique name with NFSe number
            const cleanName = nfse.patients.name.replace(/\s+/g, '_');
            fileName = `${cleanName}_NFSe_${nfse.nfse_number}.pdf`;
          }
          
          console.log(`✅ Adicionando ao ZIP: ${fileName}`);
          
          // Add PDF to ZIP
          folder?.file(fileName, pdfData);
          
          return { success: true, nfse: nfse.nfse_number, patient: nfse.patients.name };
        } catch (error) {
          console.error(`❌ Erro inesperado ao processar NFSe ${nfse.nfse_number} (${nfse.patients.name}):`, error);
          return { success: false, nfse: nfse.nfse_number, patient: nfse.patients.name };
        }
      });

      const results = await Promise.all(downloadPromises);
      const successCount = results.filter(r => r.success).length;
      const failedNotes = results.filter(r => !r.success);

      console.log(`📊 Resultado final: ${successCount}/${filteredNFSes.length} notas processadas`);
      
      if (failedNotes.length > 0) {
        console.error('❌ Notas que falharam:', failedNotes);
      }

      if (successCount === 0) {
        throw new Error('Não foi possível baixar nenhuma nota fiscal');
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Create download link
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      
      const startDateStr = format(startDate, 'dd-MM-yyyy');
      const endDateStr = format(endDate, 'dd-MM-yyyy');
      link.download = `NFSes_${environment}_${startDateStr}_a_${endDateStr}.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      const message = failedNotes.length > 0 
        ? `${successCount} de ${filteredNFSes.length} nota(s) baixada(s). ${failedNotes.length} falharam.`
        : `${successCount} nota(s) fiscal(is) baixada(s) com sucesso.`;

      toast({
        title: 'Download concluído',
        description: message,
        variant: failedNotes.length > 0 ? 'default' : 'default',
      });

      setOpen(false);
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error: any) {
      console.error('Error downloading NFSes:', error);
      toast({
        title: 'Erro ao baixar notas',
        description: error.message || 'Não foi possível processar o download.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Download em Lote de NFSes</DialogTitle>
          <DialogDescription>
            Selecione o período das notas fiscais que deseja baixar. 
            Todas as notas emitidas no período serão incluídas no arquivo ZIP.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Inicial</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  locale={ptBR}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Data Final</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  locale={ptBR}
                  initialFocus
                  disabled={(date) => startDate ? date < startDate : false}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {startDate && endDate && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-sm">
                <strong>Período selecionado:</strong><br />
                De {format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}<br />
                Até {format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setOpen(false);
              setStartDate(undefined);
              setEndDate(undefined);
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDownload} 
            disabled={loading || !startDate || !endDate}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar ZIP
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
